# Shared parts of the daily measuring job (build-plan task M1, research/2026-10-16-diagnosis/build-plan.md).
# Standard library only, so the hash check runs before anything from the pre-registration is imported.
import csv, hashlib, io, json, os, re, subprocess, sys, time
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))


def load_config(root=REPO):
    with open(os.path.join(root, 'scripts', 'measure', 'config.json'), encoding='utf-8') as f:
        return json.load(f)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 16), b''):
            h.update(block)
    return h.hexdigest()


def utc_iso(ms=None):
    """ISO time in UTC to the second, e.g. 2026-10-17T04:21:07Z (the form studyGate.ts and study-freeze.ts parse)."""
    t = time.time() if ms is None else ms / 1000
    return datetime.fromtimestamp(int(t), tz=timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def iso_to_ms(s):
    return int(datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp() * 1000)


# ---------------------------------------------------------------- the pre-registered files


def prereg_table(doc_path):
    """{file name: sha256} from the table in preregistration.md section 3.9."""
    out, inside = {}, False
    with open(doc_path, encoding='utf-8') as f:
        for line in f:
            if line.startswith('### '):
                inside = line.startswith('### 3.9')
                continue
            m = re.match(r'^\|\s*([A-Za-z0-9_.-]+)\s*\|\s*([0-9a-f]{64})\s*\|\s*$', line) if inside else None
            if m:
                out[m.group(1)] = m.group(2)
    return out


# The pre-registered files the job runs: they must stay in the 3.9 table, so dropping a row (in both places) cannot
# take one of them out of the hash check.
RUN_BY_THE_JOB = ('check_instrument.py', 'lichess_rule.py', 'measure.py', 'verdict.py')


def verify_prereg(root, cfg):
    """Problems (each naming its file) when a pre-registered file differs from its hash; [] when all match.
    The hashes must agree in preregistration.md 3.9 and config.json, so loosening one alone is not enough."""
    pre = cfg['prereg']
    problems = []
    doc = os.path.join(root, pre['doc'])
    if not os.path.exists(doc):
        return [f'{pre["doc"]} is missing']
    table = prereg_table(doc)
    pinned = pre['hashes']
    if set(table) != set(pinned):
        problems.append(f'{pre["doc"]} section 3.9 lists {sorted(table)} but scripts/measure/config.json lists {sorted(pinned)}')
    for name in RUN_BY_THE_JOB:
        if name not in table:
            problems.append(f'{name} is not in {pre["doc"]} section 3.9, but the job runs it')
    for name in sorted(set(table) | set(pinned)):
        want = pinned.get(name)
        if table.get(name) != want:
            problems.append(f'{name}: the hash in {pre["doc"]} section 3.9 and in scripts/measure/config.json differ')
            continue
        path = os.path.join(root, pre['dir'], name)
        if not os.path.exists(path):
            problems.append(f'{pre["dir"]}/{name} is missing')
        elif sha256_file(path) != want:
            problems.append(f'{pre["dir"]}/{name} differs from its pre-registered SHA-256 ({want[:12]}...)')
    for rel, want in sorted(cfg.get('instrumentInputs', {}).get('hashes', {}).items()):
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            problems.append(f'{rel} is missing (an input of check_instrument.py)')
        elif sha256_file(path) != want:
            problems.append(f'{rel} differs from its pinned SHA-256 ({want[:12]}...), an input of check_instrument.py')
    # The matched-newcomer file is pre-registered by its path and SHA-256 (preregistration.md answer 5 and 3.6). The job
    # reads both from config.json, so both must be the ones the document names: editing config.json alone cannot make
    # another version count as the pre-registered one, or drop the pin.
    with open(doc, encoding='utf-8') as f:
        doc_text = f.read()
    nc_pin = (cfg.get('newcomers') or {}).get('sha256') or ''
    nc_path = (cfg.get('paths') or {}).get('newcomers') or ''
    if not re.fullmatch(r'[0-9a-f]{64}', nc_pin) or nc_pin not in doc_text:
        problems.append(f'scripts/measure/config.json newcomers.sha256 is not the SHA-256 {pre["doc"]} gives for the '
                        'matched-newcomer file')
    if not nc_path or nc_path not in doc_text:
        problems.append(f'scripts/measure/config.json paths.newcomers ({nc_path or "missing"}) is not the file {pre["doc"]} names')
    return problems


def import_prereg(root, cfg):
    """measure.py and verdict.py exactly as hashed. Call only after verify_prereg() returned []."""
    d = os.path.join(root, cfg['prereg']['dir'])
    if d not in sys.path:
        sys.path.insert(0, d)
    import measure, verdict   # noqa: E402  (measure imports lichess_rule from the same folder)
    for mod in (measure, verdict):
        if os.path.realpath(os.path.dirname(mod.__file__)) != os.path.realpath(d):
            raise SystemExit(f'{mod.__name__} was imported from {mod.__file__}, not from {d}')
    return measure, verdict


# ---------------------------------------------------------------- opponent names

PLACEHOLDER = re.compile(r'^opponent \d+$', re.I)
PGN_PLAYER = re.compile(r'^\[(White|Black) "([^"\n]*)"\]$', re.M)


def users(g):
    return [g['players'][c]['user'] for c in ('white', 'black') if isinstance(g.get('players', {}).get(c), dict)
            and isinstance(g['players'][c].get('user'), dict)]


def scrub(games, me):
    """Opponents become "Opponent 01", "Opponent 02", ... in the order of his games (the same form as
    research/2026-10-16-diagnosis/my-games/scripts/scrub_usernames.py; a space never appears in a Lichess username, so a
    placeholder cannot point at a real account). Ratings, titles (BOT stays BOT), game ids, moves, clocks and evals stay.
    Returns (scrubbed copies, set of the real names in lower case, kept in memory only)."""
    order, names = {}, set()
    for g in sorted(games, key=lambda g: g.get('createdAt', 0)):
        for u in users(g):
            for k in ('name', 'id'):
                n = str(u.get(k, '')).lower()
                if n and n != me and not PLACEHOLDER.match(n):   # a saved file may be scrubbed already
                    names.add(n)
            key = str(u.get('id') or u.get('name', '')).lower()
            if key and key != me and key not in order:
                order[key] = f'Opponent {len(order) + 1:02d}'
    out = []
    for g in games:
        h = json.loads(json.dumps(g))
        for u in users(h):
            key = str(u.get('id') or u.get('name', '')).lower()
            if key and key != me:
                u['name'] = order[key]
                u['id'] = order[key].lower()
        if isinstance(h.get('pgn'), str):   # only in exports made with pgnInJson (measure.py's fetch does not ask for it)
            h['pgn'] = PGN_PLAYER.sub(lambda m: f'[{m.group(1)} "{order.get(m.group(2).lower(), m.group(2))}"]', h['pgn'])
        out.append(h)
    return out, names


def name_hits(files, names, allow=()):
    """Exact (case-insensitive) matches of a real opponent name in any JSON string value, or any CSV cell, of the
    given {label: text} files, plus whole-word matches inside JSON strings of several lines (a PGN's player tags).
    Exact matching finds a name left in a field without false alarms on words that merely
    contain it (an account called "Caro" would otherwise match every Caro-Kann). Returns [(label, line, name hash)];
    the name itself is never returned, so a hit can be printed in a public log. A false alarm (an account named like a
    Lichess value, say "draw") is cleared by adding the printed hash to config.json nameScanAllow."""
    tag = lambda n: hashlib.sha256(n.encode()).hexdigest()[:12]
    names = {n for n in names if tag(n) not in set(allow)}
    hits = []
    word = lambda n: r'(?<![a-z0-9_-])' + re.escape(n) + r'(?![a-z0-9_-])'

    def found(s):
        """The names a JSON string holds: the whole value, or a whole word inside a text of several lines (a PGN)."""
        low = s.lower()
        if low in names:
            return [low]
        return [n for n in names if re.search(word(n), low)] if '\n' in low else []

    def walk(o):
        if isinstance(o, dict):
            for v in o.values():
                yield from walk(v)
        elif isinstance(o, list):
            for v in o:
                yield from walk(v)
        elif isinstance(o, str):
            yield o

    for label, text in files.items():
        if label.endswith('.csv'):
            for i, row in enumerate(csv.reader(io.StringIO(text)), 1):
                hits += [(label, i, tag(c.lower())) for c in row if c.lower() in names]
        elif label.endswith('.json'):
            hits += [(label, 0, tag(n)) for s in walk(json.loads(text)) for n in found(s)]
        elif label.endswith(('.ndjson', '.jsonl')):
            for i, line in enumerate(text.splitlines(), 1):
                if line.strip():
                    hits += [(label, i, tag(n)) for s in walk(json.loads(line)) for n in found(s)]
        else:
            low = text.lower()
            hits += [(label, 0, tag(n)) for n in names if re.search(word(n), low)]
    return hits


# ---------------------------------------------------------------- phases (the same words as src/lib/studyGate.ts)

PHASE_LABELS = {
    'warm-up': 'Warm-up (not counted)',
    'baseline': 'Before the trainer',
    'waiting': 'Waiting for the trainer (not counted)',
    'wash-in': 'Trainer started (not measured yet)',
    'measured': 'Trainer, measured',
    'finished': 'Study finished',
}


def phase_of(n, W):
    """Phase of his latest counted game, from verdict.windows(U) (studyGate.ts phaseOf, rule for rule)."""
    if n < W['baseline'][0]:
        return 'warm-up'
    if n <= W['baseline'][1]:
        return 'baseline'
    if n < W['wash_in'][0]:
        return 'waiting'
    if n <= W['wash_in'][1]:
        return 'wash-in'
    if n <= W['looks'][-1]['window'][1]:
        return 'measured'
    return 'finished'


def next_milestone(n, unlock_after, W):
    """studyGate.ts nextMilestoneOf: the first step after game n, or None after the final check."""
    steps = [(W['baseline'][0] - 1, 'the warm-up ends and your "before" games start'),
             (unlock_after, 'the Safety-check trainer opens'),
             (W['wash_in'][1], 'training games start to count'),
             (W['looks'][0]['window'][1], 'the first check'),
             (W['looks'][-1]['window'][1], 'the final check')]
    for game, label in steps:
        if game > n:
            return {'game': game, 'label': label}
    return None


# ---------------------------------------------------------------- git history (who was on main, and when)


def git(root, *args):
    r = subprocess.run(['git', '-C', root] + list(args), capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(f'git {" ".join(args)}: {r.stderr.strip()}')
    return r.stdout


def first_parent_commits(root, path, added_only=False):
    """[(sha, committer time ms)] of the commits on HEAD's first-parent line that changed `path`, oldest first.
    First parent = the branch itself (on main: each push or merge), so a merge counts at the time it was merged."""
    args = ['log', '--first-parent', '--reverse', '--format=%H %ct']
    if added_only:
        args.append('--diff-filter=A')
    out = git(root, *args, 'HEAD', '--', path)
    return [(l.split()[0], int(l.split()[1]) * 1000) for l in out.splitlines() if l.strip()]


def file_at(root, sha, path):
    r = subprocess.run(['git', '-C', root, 'show', f'{sha}:{path}'], capture_output=True)
    return r.stdout.decode('utf-8') if r.returncode == 0 else None


def is_shallow(root):
    return git(root, 'rev-parse', '--is-shallow-repository').strip() == 'true'


# ---------------------------------------------------------------- files


def read_text(path):
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def write_text(path, text):
    """Write via a temporary file and a rename, so a crash never leaves half a file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + '.part'
    with open(tmp, 'w', encoding='utf-8', newline='') as f:
        f.write(text)
    os.replace(tmp, path)


def dump_line(o):
    return json.dumps(o, separators=(',', ':'), ensure_ascii=False)
