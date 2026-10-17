# Self-test of the daily measuring job on a fake engine (testing/stub_engine.py), in throwaway git repositories, so
# the plumbing is checked in about 3 minutes without Lichess and without Stockfish. The real engine and the real
# fixture check are tested by the job itself (run_instrument.py) and by the acceptance runs listed in README.md.
# Usage, from the repo root:  .venv/bin/python -I scripts/measure/selftest.py [--work DIR] [--only NAME,...]
# Exit code 0 = every check passed. Prints counts and game ids only.
import argparse, csv, hashlib, json, os, shutil, subprocess, sys, tempfile, time, types, urllib.error
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import common   # noqa: E402
import daily   # noqa: E402
from make_fixture import build as fixture_games, relabel   # noqa: E402

REPO = common.REPO
PY = sys.executable
CFG = common.load_config(REPO)
T0 = 1792195200000   # 2026-10-17 00:00 UTC: synthetic games start here, one per hour
HOUR = 3600 * 1000
results = []


def check(name, ok, detail=''):
    results.append((name, bool(ok)))
    print(f'{"ok  " if ok else "FAIL"} {name}' + (f'  ({detail})' if detail and not ok else ''), flush=True)


def iso(ms):
    return common.utc_iso(ms)


# ---------------------------------------------------------------- helpers


def make_repo(d, events=()):
    """A git repo with the files daily.py needs (config, prereg, preregistration.md, instrument inputs), first commit
    2026-10-16 12:00 UTC, then one commit per (time ms, {path: text or None}) event."""
    os.makedirs(d)
    paths = ['scripts/measure/config.json', CFG['prereg']['doc']] + \
        [f'{CFG["prereg"]["dir"]}/{f}' for f in CFG['prereg']['hashes']] + list(CFG['instrumentInputs']['hashes'])
    for p in paths:
        os.makedirs(os.path.dirname(os.path.join(d, p)), exist_ok=True)
        shutil.copyfile(os.path.join(REPO, p), os.path.join(d, p))
    git = lambda *a, env=None: subprocess.run(['git', '-C', d] + list(a), check=True, capture_output=True, env=env)
    git('init', '-q', '-b', 'main')

    def commit(ms, msg):
        env = {**os.environ, 'GIT_AUTHOR_DATE': f'@{ms // 1000} +0000', 'GIT_COMMITTER_DATE': f'@{ms // 1000} +0000',
               'GIT_AUTHOR_NAME': 'test', 'GIT_AUTHOR_EMAIL': 'test@example.invalid',
               'GIT_COMMITTER_NAME': 'test', 'GIT_COMMITTER_EMAIL': 'test@example.invalid'}
        git('add', '-A', env=env)
        git('commit', '-q', '--allow-empty', '-m', msg, env=env)
    commit(common.iso_to_ms('2026-10-16T12:00:00Z'), 'base')
    for ms, files in events:
        for p, text in files.items():
            full = os.path.join(d, p)
            if text is None:
                os.remove(full)
            else:
                os.makedirs(os.path.dirname(full), exist_ok=True)
                open(full, 'w', encoding='utf-8').write(text)
        commit(ms, 'event')
    return d


def synthetic(n, start=T0):
    """n rated 10+0 games built from his 31 blitz games in turn (new ids, one per hour from `start`)."""
    base = fixture_games(31)
    out = []
    for i in range(n):
        g = json.loads(json.dumps(base[i % 31]))
        g['id'] = f'{g["id"][:4]}{i:04d}'
        g['createdAt'] = start + i * HOUR
        g['lastMoveAt'] = g['createdAt'] + 600000
        out.append(g)
    return out


def write_games(path, games):
    with open(path, 'w') as f:
        f.writelines(json.dumps(g, separators=(',', ':')) + '\n' for g in games)
    return path


class Env:
    def __init__(self, work):
        self.work = work
        self.stub = os.path.join(work, 'stub', 'stockfish')
        os.makedirs(os.path.dirname(self.stub))
        open(self.stub, 'w').write(f'#!/bin/sh\nexec {PY} -I -B {os.path.join(HERE, "testing", "stub_engine.py")}\n')
        os.chmod(self.stub, 0o755)
        self.broken = os.path.join(work, 'stub', 'broken')   # declares no options: measure.py fails while its engine is open
        open(self.broken, 'w').write(f'#!/bin/sh\nexec {PY} -I -B -c "import sys\nfor l in sys.stdin:\n'
                                     f'    c = l.split()\n    print(\'id name Broken\\nuciok\' if c[:1] == [\'uci\'] else '
                                     f'\'readyok\' if c[:1] == [\'isready\'] else \'\', flush=True)"\n')
        os.chmod(self.broken, 0o755)
        self.inst = self.instrument(self.stub, 'instrument.json')
        self.inst_broken = self.instrument(self.broken, 'instrument-broken.json')

    def instrument(self, binary, name, **extra):
        p = os.path.join(self.work, 'stub', name)
        json.dump({'passed': True, 'engineCheckRun': True, 'binarySha256': common.sha256_file(binary),
                   'stockfish': 'Stockfish 19 (test stub)', 'at': common.utc_iso(), 'platform': 'test',
                   'python': 'test', 'pythonChess': 'test', 'fixture': 'test', 'engineCheck': 'test', 'seconds': 0,
                   **extra}, open(p, 'w'))
        return p

    def daily(self, root, inp, data, as_of='2026-10-20T06:00:00Z', engine=None, inst=None, workers=3):
        cmd = [PY, '-I', '-B', os.path.join(HERE, 'daily.py'), '--root', root, '--input', inp, '--as-of', as_of,
               '--instrument', inst or self.inst, '--stockfish', engine or self.stub, '--workers', str(workers),
               '--data', os.path.join(data, 'data'), '--public', os.path.join(data, 'public'), '--work', self.work]
        r = subprocess.run(cmd, capture_output=True, text=True)
        return r

    def direct(self, inp, out, cache=None):
        cmd = [PY, '-I', '-B', os.path.join(REPO, CFG['prereg']['dir'], 'measure.py'), '--input', inp, '--out', out,
               '--stockfish', self.stub]
        if cache:
            cmd += ['--cache', cache]
        subprocess.run(cmd, check=True, capture_output=True)
        return open(out, 'rb').read()


def status(data):
    return json.load(open(os.path.join(data, 'public', 'status.json')))


def rd(path):
    return open(path, 'rb').read() if os.path.exists(path) else None


# ---------------------------------------------------------------- tests


def t_hashes(E):
    root = make_repo(os.path.join(E.work, 'r-hash'))
    vp = lambda: subprocess.run([PY, '-I', '-B', os.path.join(HERE, 'verify_prereg.py'), '--root', root],
                                capture_output=True, text=True)
    r = vp()
    check('hashes: an untouched copy passes', r.returncode == 0, r.stderr)
    m = os.path.join(root, CFG['prereg']['dir'], 'measure.py')
    orig = open(m, 'rb').read()
    open(m, 'wb').write(orig.replace(b'NODES = 250000', b'NODES = 250001'))
    r = vp()
    check('hashes: a tampered measure.py is refused with exit 1, the file named',
          r.returncode == 1 and 'prereg/measure.py differs' in r.stderr, r.stderr)
    inp = write_games(os.path.join(E.work, 'g3.ndjson'), synthetic(3))
    r = E.daily(root, inp, os.path.join(E.work, 'd-hash'))
    check('hashes: daily.py refuses too and writes nothing',
          r.returncode == 1 and 'measure.py differs' in r.stderr and not os.path.exists(os.path.join(E.work, 'd-hash')),
          r.stderr[-300:])
    open(m, 'wb').write(orig)
    doc = os.path.join(root, CFG['prereg']['doc'])
    text = open(doc).read()
    open(doc, 'w').write(text.replace(CFG['prereg']['hashes']['verdict.py'], '0' * 64))
    r = vp()
    check('hashes: preregistration.md and config.json must agree', r.returncode == 1 and 'verdict.py: the hash in' in r.stderr,
          r.stderr)
    open(doc, 'w').write(text)
    inst_in = os.path.join(root, list(CFG['instrumentInputs']['hashes'])[0])
    open(inst_in, 'a').write('\n')
    r = vp()
    check('hashes: an edited input of check_instrument.py is refused', r.returncode == 1 and 'lichess_abustrup.ndjson differs' in r.stderr)
    # dropping a file the job runs from both lists is refused too (here measure.py)
    want = CFG['prereg']['hashes']['measure.py']
    open(doc, 'w').write(''.join(l for l in text.splitlines(keepends=True) if want not in l))
    cfg = json.loads(json.dumps(CFG)); del cfg['prereg']['hashes']['measure.py']
    got = common.verify_prereg(root, cfg)
    check('hashes: a file the job runs cannot be dropped from both lists', any('measure.py is not in' in p for p in got), got)
    open(doc, 'w').write(text)
    # the newcomer pin and path in config.json must be the ones preregistration.md names (or be refused)
    cfg = json.loads(json.dumps(CFG)); cfg['newcomers']['sha256'] = '1' * 64
    got = common.verify_prereg(root, cfg)
    cfg2 = json.loads(json.dumps(CFG)); cfg2['paths']['newcomers'] = 'research/other/newcomers.json'
    got2 = common.verify_prereg(root, cfg2)
    check('hashes: a newcomer pin or path in config.json that preregistration.md does not name is refused',
          not any('newcomers' in p for p in common.verify_prereg(root, CFG)) and any('newcomers.sha256' in p for p in got)
          and any('paths.newcomers' in p for p in got2), (got, got2))


def t_fixture(E):
    root = make_repo(os.path.join(E.work, 'r-fix'))
    data = os.path.join(E.work, 'd-fix')
    f12 = os.path.join(HERE, 'fixtures', 'blitz12_as_600.ndjson')
    f14 = write_games(os.path.join(E.work, 'f14.ndjson'), fixture_games(14))
    r = E.daily(root, f12, data)
    games = os.path.join(data, 'data', 'games.csv')
    direct = E.direct(f12, os.path.join(E.work, 'direct12.csv'))
    check('fixture: 12 relabelled games give 12 rows', r.returncode == 0 and len(list(csv.DictReader(open(games)))) == 12,
          r.stderr[-300:])
    check('fixture: games.csv is byte-identical to running measure.py directly', rd(games) == direct)
    first = {k: rd(os.path.join(data, 'data', k)) for k in ('games.csv', 'evals.jsonl', 'export.ndjson')}
    r = E.daily(root, f12, data, as_of='2026-10-21T06:00:00Z')
    same = all(rd(os.path.join(data, 'data', k)) == v for k, v in first.items())
    runs = list(csv.DictReader(open(os.path.join(data, 'data', 'runs.csv'))))
    check('fixture: a second run adds 0 rows and changes no saved file', r.returncode == 0 and same and
          status(data)['newGames'] == 0, r.stderr[-300:])
    check('fixture: each run adds one heartbeat row', len(runs) == 2 and runs[-1]['new_games'] == '0')
    r = E.daily(root, f14, data, as_of='2026-10-22T06:00:00Z')
    new = {k: rd(os.path.join(data, 'data', k)) for k in first}
    check('fixture: 2 more games are appended; the old files are byte-exact prefixes',
          r.returncode == 0 and all(new[k].startswith(first[k]) and len(new[k]) > len(first[k]) for k in first)
          and len(list(csv.DictReader(open(games)))) == 14, r.stderr[-300:])
    check('fixture: 14 rows still byte-identical to a direct run', rd(games) == E.direct(f14, os.path.join(E.work, 'direct14.csv')))
    rederive = E.direct(os.path.join(data, 'data', 'export.ndjson'), os.path.join(E.work, 'rederive.csv'),
                        cache=shutil.copy(os.path.join(data, 'data', 'evals.jsonl'), os.path.join(E.work, 'rederive.jsonl')))
    strip = lambda b: [{k: v for k, v in row.items() if k != 'engine'} for row in csv.DictReader(b.decode().splitlines())]
    check('fixture: measure.py on the committed export and cache re-derives games.csv', strip(rederive) == strip(rd(games)))
    st = status(data)
    check('fixture: status.json has every field the build plan names',
          all(k in st for k in ('asOf', 'eligibleGames', 'phase', 'unlockAfterGame', 'unlocked', 'U', 'nextMilestone',
                                'newcomersBinding', 'lastRunOk', 'instrumentCheck')) and st['eligibleGames'] == 14
          and st['phase'] == 'baseline' and st['unlockAfterGame'] == 40 and st['asOf'] == '2026-10-22T06:00:00Z', st)
    return root, data, f14


def t_refusals(E, root, data, f14):
    games14 = [json.loads(l) for l in open(f14)]
    keep = {k: rd(os.path.join(data, 'data', k)) for k in ('games.csv', 'evals.jsonl', 'export.ndjson', 'runs.csv')}
    unchanged = lambda: all(rd(os.path.join(data, 'data', k)) == v for k, v in keep.items())
    # a game slipped in before saved games: the numbering would change
    early = relabel(games14[0]); early['id'] = 'early001'; early['createdAt'] = games14[5]['createdAt'] - 1000
    r = E.daily(root, write_games(os.path.join(E.work, 'early.ndjson'), games14 + [early]), data)
    check('refuses: a game list that no longer starts with the saved games', r.returncode == 1 and 'no longer starts' in r.stderr
          and unchanged(), r.stderr[-300:])
    # a saved row that no longer matches (measured column)
    gpath = os.path.join(data, 'data', 'games.csv')
    rows = list(csv.reader(open(gpath, newline='')))
    col = rows[0].index('my_blunders'); rows[3][col] = str(int(rows[3][col]) + 1)
    with open(gpath, 'w', newline='') as f:
        csv.writer(f).writerows(rows)
    edited = rd(gpath)
    r = E.daily(root, f14, data)
    check('refuses: a saved row that changed in a measured column', r.returncode == 1 and 'measured columns' in r.stderr
          and rd(gpath) == edited, r.stderr[-300:])
    open(gpath, 'wb').write(keep['games.csv'])
    # the instrument check: failed, or run on another binary
    r = E.daily(root, f14, data, inst=E.instrument(E.stub, 'failed.json', passed=False, problem='test failure'))
    check('refuses: the instrument check did not pass', r.returncode == 1 and 'did not pass' in r.stderr and unchanged())
    r = E.daily(root, f14, data, inst=E.instrument(E.broken, 'other.json'))
    check('refuses: the instrument check was run on another binary', r.returncode == 1 and 'another Stockfish binary' in r.stderr
          and unchanged())
    r = E.daily(root, f14, data, inst=E.instrument(E.stub, 'old.json', at=iso(time.time() * 1000 - 30 * HOUR)))
    check('refuses: an instrument check older than a day', r.returncode == 1 and 'last 24 hours' in r.stderr and unchanged(),
          r.stderr[-300:])
    # the time control is the pre-registered 600+0 whatever config.json says
    cpath = os.path.join(root, 'scripts', 'measure', 'config.json')
    ctext = open(cpath).read()
    open(cpath, 'w').write(ctext.replace('"tc": "600+0"', '"tc": "any"'))
    r = E.daily(root, f14, data)
    check('refuses: a config.json that changes the time control', r.returncode == 1 and 'pre-registered filter' in r.stderr
          and unchanged(), r.stderr[-300:])
    open(cpath, 'w').write(ctext.replace('"trainerPage": "src/pages/Safety.tsx"', '"trainerPage": "src/pages/Other.tsx"'))
    r = E.daily(root, f14, data)
    check('refuses: a config.json that moves the trainer page (it decides U)', r.returncode == 1
          and 'U is counted from src/pages/Safety.tsx' in r.stderr and unchanged(), r.stderr[-300:])
    open(cpath, 'w').write(ctext)
    # a real name left in a field nobody expected
    # a new 15th game whose opponent name also sits in an unknown field (test names contain a dot, which no Lichess
    # username can, so they never name a real account)
    extra = json.loads(json.dumps(games14[0]))
    extra['id'] = 'leak0001'; extra['createdAt'] = games14[-1]['createdAt'] + HOUR
    side = 'black' if extra['players']['white']['user']['id'] == 'abustrup' else 'white'
    extra['players'][side]['user'].update(name='Real.Person', id='real.person', displayName='Real.Person')
    r = E.daily(root, write_games(os.path.join(E.work, 'leak.ndjson'), games14 + [extra]), data)
    tag = hashlib.sha256(b'real.person').hexdigest()[:12]
    check('refuses: a real opponent name left in the export; the log shows only its hash',
          r.returncode == 1 and tag in r.stderr and 'real.person' not in (r.stderr + r.stdout).lower()
          and unchanged(), r.stderr[-300:])
    # a game that is not his
    other = json.loads(json.dumps(games14))
    other[0]['players']['white']['user'] = {'name': 'Some.One', 'id': 'some.one'}
    other[0]['players']['black']['user'] = {'name': 'Some.Else', 'id': 'some.else'}
    r = E.daily(root, write_games(os.path.join(E.work, 'other.ndjson'), other), data)
    check('refuses: a game that is not one of his', r.returncode == 1 and 'not one of abustrup' in r.stderr and unchanged())
    # the names are replaced, the BOT title kept
    exp = [json.loads(l) for l in open(os.path.join(data, 'data', 'export.ndjson'))]
    names = {u['name'] for g in exp for u in common.users(g)}
    check('export: only abustrup and "Opponent NN" names', names <= {'abustrup'} | {f'Opponent {i:02d}' for i in range(1, 100)}, names)
    bot = json.loads(json.dumps(games14[0])); bot['id'] = 'botgame1'; bot['createdAt'] = games14[-1]['createdAt'] + HOUR
    opp = 'black' if bot['players']['white']['user']['id'] == 'abustrup' else 'white'
    bot['players'][opp]['user'] = {'name': 'Some.Bot', 'id': 'some.bot', 'title': 'BOT'}
    scrubbed, found = common.scrub([bot], 'abustrup')
    check('scrub: a BOT keeps its title (so BOT games stay excluded) and loses its name',
          scrubbed[0]['players'][opp]['user'] == {'name': 'Opponent 01', 'id': 'opponent 01', 'title': 'BOT'} and found == {'some.bot'})
    # an engine that fails while open: stopped, run once more, then refused (not a hang)
    d2 = os.path.join(E.work, 'd-broken')
    t = time.time()
    r = E.daily(root, write_games(os.path.join(E.work, 'g4.ndjson'), synthetic(4)), d2, engine=E.broken, inst=E.inst_broken)
    check('refuses: an engine that fails twice, within a minute, and writes nothing',
          r.returncode == 1 and 'failed twice' in r.stderr and time.time() - t < 90 and not os.path.exists(d2), r.stderr[-300:])


def t_fetch(E):
    calls, slept = [], []

    def fake(perf):
        calls.append(perf)
        if len(calls) == 1:
            raise urllib.error.HTTPError('u', 429, 'Too Many Requests', {}, None)
        return [{'id': f'{perf}-1'}, {'id': 'dup'}] if perf == 'rapid' else [{'id': 'dup'}, {'id': 'b-1'}]
    orig = daily.time.sleep
    daily.time.sleep = lambda s: slept.append(s)
    try:
        games, as_of = daily.fetch_all(types.SimpleNamespace(fetch=fake), 'blitz,classical', 60)
        check('fetch: a 429 waits 60 s and retries once; one request at a time; duplicates once',
              calls == ['rapid', 'rapid', 'blitz,classical'] and slept == [60] and [g['id'] for g in games] == ['rapid-1', 'dup', 'b-1'],
              f'{calls} {slept}')
        calls.clear()

        def always429(perf):
            calls.append(perf)
            raise urllib.error.HTTPError('u', 429, 'Too Many Requests', {}, None)
        try:
            daily.fetch_all(types.SimpleNamespace(fetch=always429), None, 60)
            check('fetch: a second 429 stops the run', False)
        except daily.Refused as e:
            check('fetch: a second 429 stops the run', 'HTTP 429' in str(e) and len(calls) == 2)
    finally:
        daily.time.sleep = orig


def t_names():
    """A PGN (only in exports made with pgnInJson) loses the real names in its player tags, and the scan finds a real
    name left inside a PGN; placeholders and his own name never count as hits."""
    g = fixture_games(1)[0]
    side = 'black' if g['players']['white']['user']['id'] == 'abustrup' else 'white'
    g['players'][side]['user'].update(name='Real.Person', id='real.person')
    g['pgn'] = (f'[Event "Rated rapid game"]\n[White "{"abustrup" if side == "black" else "Real.Person"}"]\n'
                f'[Black "{"Real.Person" if side == "black" else "abustrup"}"]\n\n1. e4 e5 *\n')
    out, names = common.scrub([g], 'abustrup')
    pgn = out[0]['pgn']
    check('names: a PGN\'s player tags are replaced too', 'real.person' not in pgn.lower() and '"Opponent 01"]' in pgn
          and '"abustrup"]' in pgn, pgn)
    line = json.dumps(dict(out[0], pgn=g['pgn']))
    hits = common.name_hits({'x/export.ndjson': line + '\n'}, names)
    check('names: a real name left inside a PGN is found', len(hits) == 1 and hits[0][2] == hashlib.sha256(b'real.person').hexdigest()[:12],
          hits)
    check('names: the scrubbed game itself has no hit', common.name_hits({'x/export.ndjson': json.dumps(out[0]) + '\n'}, names) == [])


def t_phases():
    import importlib
    measure_dir = os.path.join(REPO, CFG['prereg']['dir'])
    sys.path.insert(0, measure_dir)
    verdict = importlib.import_module('verdict')
    W = verdict.windows()
    got = ' '.join(f'{n}:{common.phase_of(n, W)}' for n in (0, 10, 11, 40, 41, 60, 61, 110, 160, 161))
    check('phases equal studyGate.ts', got == '0:warm-up 10:warm-up 11:baseline 40:baseline 41:wash-in 60:wash-in 61:measured '
          '110:measured 160:measured 161:finished', got)
    W45 = verdict.windows(45)
    got = ' '.join(f'{n}:{common.phase_of(n, W45)}' for n in (40, 41, 45, 46, 65, 66, 165, 166))
    check('phases with a late trainer (U = 45) equal studyGate.ts', got == '40:baseline 41:waiting 45:waiting 46:wash-in '
          '65:wash-in 66:measured 165:measured 166:finished', got)
    got = ' '.join(f'{n}>{(common.next_milestone(n, 40, W) or {}).get("game", "-")}' for n in (0, 10, 39, 40, 60, 109, 110, 159, 160))
    check('next milestone equals studyGate.ts', got == '0>10 10>40 39>40 40>60 60>110 109>110 110>160 159>160 160>-', got)


def t_history(E):
    games = synthetic(46)
    inp = write_games(os.path.join(E.work, 'g46.ndjson'), games)
    at = lambda i: games[i - 1]['createdAt']          # start time of game i (1-based)
    nc = lambda players, change=-1.0: json.dumps({'players': players, 'mean_change': change, 'mean_change_se': 0.4,
                                                  'drift_sd': 1.5})
    page = CFG['paths']['trainerPage']; ncp = CFG['paths']['newcomers']
    seed = None

    def run(name, events):
        nonlocal seed
        root = make_repo(os.path.join(E.work, f'r-{name}'), events)
        data = os.path.join(E.work, f'd-{name}')
        if seed:
            shutil.copytree(seed, os.path.join(data, 'data'))   # same games: reuse the searches
        r = E.daily(root, inp, data)
        if not seed and r.returncode == 0:
            seed = os.path.join(data, 'data')
            shutil.copytree(seed, os.path.join(E.work, 'd-seed'))
            seed = os.path.join(E.work, 'd-seed')
            for f in ('runs.csv',):
                os.remove(os.path.join(seed, f))
        return r, (status(data) if r.returncode == 0 else None)

    r, s = run('early', [(at(1) - HOUR, {page: 'x'}), (at(41) - 60000, {ncp: nc(35)})])
    check('U: trainer page committed before game 1 -> U = 40', s and s['U'] == 40 and s['phase'] == 'wash-in', r.stderr[-300:])
    check('newcomers: 35 players committed before game 41 bind', s and s['newcomersBinding'] is True
          and s['newcomers']['deadline'] == iso(at(41)))
    r, s = run('late', [(at(44) - 60000, {page: 'x'}), (at(44) + 60000, {ncp: nc(35)})])
    check('U: trainer page committed during game 43 -> U = 43, windows move by 3',
          s and s['U'] == 43 and s['trainerOnMainSince'] == iso(at(44) - 60000) and s['phase'] == 'wash-in'
          and s['windows']['washIn'] == [44, 63], s)
    check('newcomers: committed after game U+1 started do not bind', s and s['newcomersBinding'] is False
          and 'not ready in time' in s['newcomers']['note'])
    r, s = run('none', [(at(1) - HOUR, {ncp: nc(35)})])
    check('U: no trainer page yet -> U = games so far (46), phase "waiting"', s and s['U'] == 46 and s['phase'] == 'waiting'
          and s['trainerOnMainSince'] is None)
    check('newcomers: before game U+1 is played the newest version counts', s and s['newcomersBinding'] is True
          and s['newcomers']['deadline'] is None)
    r, s = run('few', [(at(1) - HOUR, {page: 'x', ncp: nc(12)})])
    check('newcomers: 12 players do not bind', s and s['newcomersBinding'] is False and s['newcomers']['players'] == 12)
    r, s = run('changed', [(at(1) - HOUR, {page: 'x', ncp: nc(35)}), (at(45), {ncp: nc(80, -3.0)})])
    check('newcomers: a change after the deadline is noted; the version from before it binds',
          s and s['newcomersBinding'] is True and s['newcomers']['players'] == 35 and s['newcomers']['changedAfterDeadline'] is True)
    r, s = run('readded', [(at(1) - HOUR, {page: 'x'}), (at(2), {page: None}), (at(45), {page: 'y'})])
    check('U: the first commit that added the page counts', s and s['U'] == 40)
    # the pre-registered version (preregistration.md answer 5 and 3.6: "that version, and no other")
    real = open(os.path.join(REPO, ncp), encoding='utf-8').read()
    want = CFG['newcomers']['sha256']
    check('newcomers: the pinned SHA-256 is the committed file\'s and the one in preregistration.md',
          hashlib.sha256(real.encode('utf-8')).hexdigest() == want
          and want in open(os.path.join(REPO, CFG['prereg']['doc']), encoding='utf-8').read())
    r, s = run('pinned-only', [(at(1) - HOUR, {page: 'x', ncp: real})])
    n = (s or {}).get('newcomers') or {}
    check('newcomers: the pre-registered version alone binds, no deviation', s and s['newcomersBinding'] is True
          and n['matchesPreregistered'] is True and n['sha256'] == want and n['players'] == 100 and n['atDeadline'] is None
          and n['changedAfterDeadline'] is False and 'deviation' not in n['note'], n)
    r, s = run('pinned', [(at(1) - HOUR, {page: 'x', ncp: real}), (at(30), {ncp: nc(80, -3.0)})])
    n = (s or {}).get('newcomers') or {}
    check('newcomers: a version committed after the pre-registered one (before game 41) does not replace it; '
          'reported as a deviation', s and s['newcomersBinding'] is True and n['matchesPreregistered'] is True
          and n['players'] == 100 and (n['atDeadline'] or {}).get('players') == 80 and 'deviation' in n['note'], n)
    r, s = run('pinned-late', [(at(1) - HOUR, {page: 'x', ncp: nc(35)}), (at(45), {ncp: real})])
    n = (s or {}).get('newcomers') or {}
    check('newcomers: the pre-registered version arriving after game 41 started -> the version at that time binds, '
          'reported as a deviation', s and s['newcomersBinding'] is True and n['players'] == 35
          and n['matchesPreregistered'] is False and 'not the pre-registered version' in n['note']
          and n['changedAfterDeadline'] is True, n)


NUMBER_KEYS = ('rate', 'var', 'se', 'events', 'moves', 'drop_per100', 'drop_relative', 'range90', 'z', 'sesoi', 'training',
               'baseline', 'looks', 'secondary', 'design')


def public_has_no_numbers(doc, txt):
    """True when the website's verdict file of an undecided check holds no blunder number (keys or digits after 'per 100')."""
    found = []

    def walk(o, path):
        if isinstance(o, dict):
            for k, x in o.items():
                if k in NUMBER_KEYS and path != '$.primary.windows':
                    found.append(f'{path}.{k}')
                walk(x, f'{path}.{k}')
        elif isinstance(o, list):
            for x in o:
                walk(x, path)
    walk(doc, '$')
    return not found and 'per 100' not in txt and 'blunders' not in txt.lower()


def t_interim():
    """interim_public on the app's undecided fixture (verdict.py's report at game 110, look 1 not deciding)."""
    fx = os.path.join(REPO, 'src', 'features', 'home', 'fixtures', 'verdict-pending-110.json')
    v = json.load(open(fx, encoding='utf-8'))
    pub = daily.interim_public(v, 1, 2, '2026-12-01T04:30:00Z', 110, 40, {'file': 'data/measure/interim-look-1.json',
                                                                           'sha256': 'x' * 64})
    full = json.dumps(v)
    check('interim: the fixture itself holds the numbers (baseline rate, look-1 drop and range)',
          '"rate"' in full and '"range90"' in full and v['primary']['decided_at_game'] is None)
    check('interim: the website file of an undecided check holds none of them', public_has_no_numbers(pub, ''),
          json.dumps(pub)[:300])
    check('interim: it keeps verdict.py\'s shape for the app (primary.verdict "not yet ...", decided_at_game null)',
          pub['primary']['verdict'] == 'not yet: next look after game 160' and pub['primary']['decided_at_game'] is None
          and pub['job']['look'] == 1)


def t_looks(E):
    ncp = CFG['paths']['newcomers']
    real = open(os.path.join(REPO, ncp), encoding='utf-8').read()
    changed = json.dumps({'players': 50, 'mean_change': -3.0, 'mean_change_se': 0.4, 'drift_sd': 1.5})
    # the pre-registered newcomers, then a changed version before game 41: both verdicts are computed
    root = make_repo(os.path.join(E.work, 'r-looks'), [(T0 - HOUR, {CFG['paths']['trainerPage']: 'x', ncp: real}),
                                                       (T0 + 5 * HOUR, {ncp: changed})])
    data = os.path.join(E.work, 'd-looks')
    pub = os.path.join(data, 'public')
    games = synthetic(160)
    os.makedirs(pub)
    open(os.path.join(pub, 'verdict.json'), 'w').write('{"primary": {"verdict": "stray"}}')
    r = E.daily(root, write_games(os.path.join(E.work, 'g109.ndjson'), games[:109]), data, workers=3)
    s = status(data) if r.returncode == 0 else {}
    check('looks: at 109 games no verdict file exists (a stray one is removed)', r.returncode == 0
          and not os.path.exists(os.path.join(pub, 'verdict.json')) and not os.path.exists(os.path.join(pub, 'verdict.txt'))
          and s.get('verdict') is None, r.stderr[-300:])
    # Lichess reports something different for an old game (a rating): listed, not fatal
    g110 = json.loads(json.dumps(games[:110]))
    me = 'white' if g110[2]['players']['white']['user']['id'] == 'abustrup' else 'black'
    g110[2]['players'][me]['rating'] += 7
    t = time.time()
    r = E.daily(root, write_games(os.path.join(E.work, 'g110.ndjson'), g110), data, workers=3)
    pv = json.load(open(os.path.join(pub, 'verdict.json'))) if os.path.exists(os.path.join(pub, 'verdict.json')) else {}
    ptxt = open(os.path.join(pub, 'verdict.txt')).read() if os.path.exists(os.path.join(pub, 'verdict.txt')) else ''
    decided = (pv.get('primary') or {}).get('decided_at_game') is not None
    # an undecided check keeps its numbers in data/measure (interim-look-1.*), the website gets the state only
    full = os.path.join(data, 'data', 'interim-look-1.json')
    v = pv if decided else (json.load(open(full)) if os.path.exists(full) else {})
    txt = ptxt if decided else (open(full[:-4] + 'txt').read() if os.path.exists(full[:-4] + 'txt') else '')
    print(f'     (looks: the fake engine\'s check 1 {"decided" if decided else "did not decide"})')
    job = v.get('job', {})
    check('looks: at 110 games the check is computed from a fresh recount',
          r.returncode == 0 and job.get('look') == 1 and job.get('eligibleGames') == 110 and 'fresh recount' in txt
          and v.get('primary', {}).get('games_played') == 110, r.stderr[-300:])
    st = status(data) if r.returncode == 0 else {}
    if decided:
        check('looks: a deciding check puts everything on the website; no interim file', not os.path.exists(full)
              and not st.get('interimChecks'))
    else:
        check('looks: an undecided check puts only the state on the website (no rate, drop or range)',
              public_has_no_numbers(pv, ptxt) and pv['job']['look'] == 1 and pv['primary']['verdict'].startswith('not yet')
              and pv['job']['numbers']['sha256'] == hashlib.sha256(rd(full)).hexdigest(), pv)
        check('looks: status.json carries the interim file\'s SHA-256', [c['sha256'] for c in st.get('interimChecks') or []]
              == [hashlib.sha256(rd(full)).hexdigest()], st.get('interimChecks'))
    check('looks: status.json carries the SHA-256 of the judge\'s wrapper (daily.py, measure.yml ...)',
          (st.get('judgeSha256') or {}).get('scripts/measure/daily.py') == common.sha256_file(os.path.join(HERE, 'daily.py'))
          and set(st.get('judgeSha256') or {}) == set(daily.JUDGE_FILES), st.get('judgeSha256'))
    diffs = job.get('differencesFromDailyRows', [])
    check('looks: differences from games.csv are listed', [(d['seq'], d['column']) for d in diffs] == [(3, 'my_rating')]
          and 'my_rating' in txt, diffs)
    check('looks: the daily run notes the changed Lichess value and keeps the saved one',
          any('changed since the day' in n for n in status(data)['notes']))
    check('looks: the full report keeps verdict.py\'s shape (primary, secondary) for the app', 'primary' in v and 'design' in v)
    other = job.get('otherNewcomerVersion') or {}
    check('looks: the pre-registered newcomers decide; the verdict with the changed version is reported too',
          job.get('newcomers', {}).get('matchesPreregistered') is True and job['newcomers']['players'] == 100
          and other.get('binding') is True and other.get('verdict') and 'game 41' in other.get('newcomers', '')
          and 'a deviation, reported, not deciding' in txt, other)
    before = rd(os.path.join(pub, 'verdict.json'))
    r = E.daily(root, write_games(os.path.join(E.work, 'g111.ndjson'), g110 + games[110:111]), data)
    check('looks: game 111 does not recount; verdict.json unchanged', r.returncode == 0 and rd(os.path.join(pub, 'verdict.json')) == before)
    # make the first check undecided (whatever the fake engine produced), then reach game 160
    v['primary']['decided_at_game'] = None
    v['primary']['verdict'] = 'not yet: next look after game 160'
    open(os.path.join(pub, 'verdict.json'), 'w').write(json.dumps(daily.interim_public(v, 1, 2, job['asOf'], 110, 40, {})))
    g160 = g110 + games[110:160]
    r = E.daily(root, write_games(os.path.join(E.work, 'g160.ndjson'), g160), data)
    v2 = json.load(open(os.path.join(pub, 'verdict.json')))
    check('looks: at 160 games the final check recounts again', r.returncode == 0 and v2['job']['look'] == 2
          and v2['job']['eligibleGames'] == 160 and v2['primary']['verdict'] not in (None, '') and
          not v2['primary']['verdict'].startswith('not yet'), r.stderr[-300:])
    check('looks: status.json points at the verdict', status(data)['verdict']['look'] == 2 and status(data)['phase'] == 'measured')
    check('looks: the final check puts every number on the website', 'design' in v2 and v2['primary'].get('looks'))
    print(f'     (looks: {time.time() - t:.0f} s for 110 + 111 + 160 games on the fake engine)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--work')
    ap.add_argument('--only')
    a = ap.parse_args()
    if a.work:
        os.makedirs(a.work, exist_ok=True)
    work = tempfile.mkdtemp(prefix='measure-selftest-', dir=a.work)
    only = set(a.only.split(',')) if a.only else None
    want = lambda n: only is None or n in only
    t = time.time()
    try:
        E = Env(work)
        if want('phases'):
            t_phases()
        if want('interim'):
            t_interim()
        if want('names'):
            t_names()
        if want('fetch'):
            t_fetch(E)
        if want('hashes'):
            t_hashes(E)
        if want('fixture') or want('refusals'):
            root, data, f14 = t_fixture(E)
            if want('refusals'):
                t_refusals(E, root, data, f14)
        if want('history'):
            t_history(E)
        if want('looks'):
            t_looks(E)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    bad = [n for n, ok in results if not ok]
    print(f'\n{len(results) - len(bad)} of {len(results)} checks passed in {time.time() - t:.0f} s')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
