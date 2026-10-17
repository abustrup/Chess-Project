# Parity check: the app's study gate (src/lib/studyGate.ts) must count exactly the games the pre-registered
# instrument counts (research/2026-10-16-diagnosis/prereg/measure.py, function eligible()), in the same order.
#
# Usage, from the repo root (needs python-chess, because measure.py imports it, and node_modules for tsx; a plain
# python3 without python-chess reruns itself with .venv/bin/python):
#   python3 -I scripts/check-gate-parity.py [FILE.ndjson[:TC] ...] [--dist DIR]
# Without arguments it checks src/lib/fixtures/study-gate-cases.ndjson at 600+0 and with every clock ('any'), plus
# his saved blitz export at 'any', 180+2 and 300+3 when that file exists (real Lichess shapes).
# measure.py is imported unchanged: the script first checks its SHA-256 against preregistration.md section 3.9.
# It also checks that the gate cannot be unlocked by hand: studyGate.ts reads no URL, build mode or global flag, and
# with --dist DIR (a built site, e.g. dist/) no unlock override or test hook appears in the bundle.
# Exit code 0 = every list identical. Prints game ids and counts only (no usernames).
import hashlib, importlib.util, json, os, re, shutil, subprocess, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIAG = os.path.join(ROOT, 'research', '2026-10-16-diagnosis')
MEASURE = os.path.join(DIAG, 'prereg', 'measure.py')
PREREG = os.path.join(DIAG, 'preregistration.md')
FIXTURE = os.path.join(ROOT, 'src', 'lib', 'fixtures', 'study-gate-cases.ndjson')
BLITZ = os.path.join(DIAG, 'my-games', 'lichess_abustrup.ndjson')
GATE_CHECK = os.path.join(ROOT, 'src', 'lib', 'studyGate.check.ts')
GATE_TS = os.path.join(ROOT, 'src', 'lib', 'studyGate.ts')
# things a hand unlock would need: reading the address, the build mode or a global flag
SOURCE_FORBIDDEN = ('location', 'URLSearchParams', 'searchParams', 'sessionStorage', 'globalThis', 'window.__',
                    'import.meta.env.DEV', 'import.meta.env.MODE', 'import.meta.env.VITE')
BUNDLE_FORBIDDEN = ('override', 'Override', 'forceUnlock', 'unlock=', 'cc.study.force', '__gate', 'gateTest')

failures = []


def report(name, ok, detail=''):
    print(f"{'ok  ' if ok else 'FAIL'} {name}{f' ({detail})' if detail else ''}")
    if not ok:
        failures.append(name)


def preregistered_hash(name):
    text = open(PREREG, encoding='utf-8').read()
    m = re.search(r'^\|\s*' + re.escape(name) + r'\s*\|\s*([0-9a-f]{64})\s*\|', text, re.M)
    if not m:
        sys.exit(f'FAIL no SHA-256 for {name} in {os.path.relpath(PREREG, ROOT)} section 3.9')
    return m.group(1)


def ensure_chess():
    """measure.py imports python-chess; without it, rerun with the repo's .venv if there is one."""
    try:
        import chess  # noqa: F401
    except ImportError:
        venv = os.path.join(ROOT, '.venv', 'bin', 'python')
        if os.path.exists(venv) and os.path.abspath(sys.executable) != os.path.abspath(venv):
            os.execv(venv, [venv, '-I', *sys.argv])
        sys.exit('FAIL python-chess is missing (pip install chess); prereg measure.py imports it')


def load_measure():
    ensure_chess()
    digest = hashlib.sha256(open(MEASURE, 'rb').read()).hexdigest()
    want = preregistered_hash('measure.py')
    if digest != want:
        sys.exit(f'FAIL {os.path.relpath(MEASURE, ROOT)} differs from its pre-registered hash ({digest} != {want})')
    print(f'ok   measure.py unchanged (SHA-256 {digest[:12]}... equals preregistration.md 3.9)')
    spec = importlib.util.spec_from_file_location('prereg_measure', MEASURE)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def tsx_cmd():
    local = os.path.join(ROOT, 'node_modules', '.bin', 'tsx')
    if os.path.exists(local):
        return [local]
    return [shutil.which('npx') or 'npx', '--yes', 'tsx']


def ts(*args):
    out = subprocess.run(tsx_cmd() + [GATE_CHECK, *args], cwd=ROOT, capture_output=True, text=True, timeout=120)
    if out.returncode != 0:
        sys.exit(f'FAIL tsx {" ".join(args)}: {out.stderr.strip()[-500:]}')
    return json.loads(out.stdout.strip().splitlines()[-1])


def python_ids(measure, path, tc):
    games = [json.loads(l) for l in open(path)]   # as measure.py main() reads --input
    return [g['id'] for g in sorted((g for g in games if measure.eligible(g, tc)), key=lambda g: g['createdAt'])]


def fetch_url(measure):
    """The URL measure.py's fetch() asks for, captured without touching the network."""
    seen = {}

    class Empty:
        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def read(self):
            return b''

    def fake_urlopen(req, timeout=None):
        seen['url'] = req.full_url
        return Empty()

    real = measure.urllib.request.urlopen
    measure.urllib.request.urlopen = fake_urlopen
    try:
        measure.fetch('rapid')   # measure.py's default --perf
    finally:
        measure.urllib.request.urlopen = real
    return seen['url']


def no_override(dist):
    src = open(GATE_TS, encoding='utf-8').read()
    hits = [p for p in SOURCE_FORBIDDEN if p in src]
    report('studyGate.ts reads no address, build mode or global flag (no hand unlock)', not hits, ', '.join(hits))
    if not dist:
        return
    texts = {}
    for d, _, files in os.walk(dist):
        for f in files:
            if f.endswith(('.js', '.mjs', '.html')):
                texts[os.path.join(d, f)] = open(os.path.join(d, f), encoding='utf-8', errors='replace').read()
    if not texts:   # a missing or unbuilt folder must not pass as "nothing found"
        report(f'{dist} holds a built site', False, 'no .js or .html files; run npm run build first')
        return
    with_gate = [f for f, t in texts.items() if 'study.gate' in t]
    if with_gate:
        print(f'ok   the build contains the gate ({", ".join(os.path.basename(f) for f in with_gate)})')
    else:
        print('note the build does not contain the gate yet (no page imports it)')
    found = {p: sum(t.count(p) for t in texts.values()) for p in BUNDLE_FORBIDDEN}
    shown = os.path.relpath(dist, ROOT) if dist.startswith(ROOT + os.sep) else dist
    report(f'no unlock override or test hook in {shown} ({len(texts)} files)',
           not any(found.values()), ', '.join(f'{p} x{n}' for p, n in found.items() if n))


def main():
    measure = load_measure()
    runs = []
    argv = sys.argv[1:]
    dist = None
    if '--dist' in argv:
        i = argv.index('--dist')
        dist = os.path.abspath(argv[i + 1])
        del argv[i:i + 2]
    if argv:
        for arg in argv:
            path, _, tc = arg.partition(':')
            runs.append((path, tc or '600+0'))
    else:
        runs += [(FIXTURE, '600+0'), (FIXTURE, 'any')]
        if os.path.exists(BLITZ):
            runs += [(BLITZ, 'any'), (BLITZ, '180+2'), (BLITZ, '300+3')]
        else:
            print(f'note {os.path.relpath(BLITZ, ROOT)} not found; real-export runs skipped')

    # the fixture's own labels agree with the instrument
    fixture = [json.loads(l) for l in open(FIXTURE)]
    off = [f"{g['id']} {g['_case']}" for g in fixture if bool(measure.eligible(g, '600+0')) != g['_expect']]
    report(f'measure.py agrees with the {len(fixture)} fixture labels', not off, '; '.join(off))

    for path, tc in runs:
        py = python_ids(measure, path, tc)
        tsl = ts('--ids', path, '--tc', tc)
        name = f'{os.path.relpath(path, ROOT)} at {tc}: same {len(py)} ids in the same order'
        if py == tsl:
            report(name, True, ','.join(py) if len(py) <= 12 else f'{py[0]} ... {py[-1]}')
        else:
            first = next((i for i, (a, b) in enumerate(zip(py, tsl)) if a != b), min(len(py), len(tsl)))
            report(name, False, f'measure.py {len(py)} ids, gate {len(tsl)}; first difference at position {first + 1}')

    # the gate asks Lichess for the same games measure.py asks for
    c = ts('--constants')
    report('same account, start date and time control as measure.py',
           c['user'] == measure.USER and c['sinceMs'] == measure.SINCE_MS and c['tc'] == '600+0',
           f"{c['user']}, since {c['sinceMs']}, {c['tc']}")
    py_url = urllib.parse.urlsplit(fetch_url(measure))
    ts_url = urllib.parse.urlsplit(c['url'])
    pq, tq = urllib.parse.parse_qs(py_url.query), urllib.parse.parse_qs(ts_url.query)
    filters = ('rated', 'perfType', 'since', 'sort')   # clocks, evals and opening only add fields
    same = (py_url.netloc, py_url.path) == (ts_url.netloc, ts_url.path) and all(pq.get(k) == tq.get(k) for k in filters)
    report('same Lichess export query (path, rated, perfType, since, sort)', same,
           f"{ts_url.path}?{'&'.join(f'{k}={tq.get(k, [None])[0]}' for k in filters)}")
    extra = sorted(set(tq) - set(pq))   # e.g. max, until, vs or color would filter out games measure.py counts
    report('the gate adds no query parameter measure.py does not send', not extra, ', '.join(extra))

    no_override(dist)

    print(f'\n{len(failures)} check(s) FAILED' if failures else '\ncheck-gate-parity: all ok')
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
