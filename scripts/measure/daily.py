# The daily measuring job (build-plan task M1): turns Alexander's new rated 10+0 Lichess games into rows of the
# pre-registered instrument, without anyone clicking anything. Protocol: research/2026-10-16-diagnosis/preregistration.md.
#
# In order, and nothing is written to the repo unless every step passes:
#   1. the pre-registered files must equal their SHA-256 (section 3.9), and the instrument check (run_instrument.py,
#      check_instrument.py --engine) must have passed today on the very Stockfish binary used below;
#   2. his rated games since 2026-10-16 come from measure.py's own fetch (honest User-Agent; one request at a time,
#      a 429 waits 60 s and retries once); opponents' usernames are replaced by "Opponent NN" before anything is saved;
#   3. measure.py (unchanged) counts every eligible game from the saved eval cache; only new games are searched, the
#      first one by measure.py itself and the rest by parallel copies of measure.py that only fill the cache (each
#      search starts from an empty hash, so a position gives the same result in any process);
#   4. the rows already in data/measure/games.csv must come out the same (a changed eval or a reordered game list
#      stops the job); new rows are appended exactly as measure.py wrote them, so the old file stays a byte-exact prefix;
#   5. verdict.py (unchanged) must accept the file; at the first and the final check (games 110 and 160 when U = 40)
#      every eligible game is recounted from an EMPTY cache and verdict.json / verdict.txt are computed from those fresh
#      rows, with every difference from games.csv listed; before game 110 neither file exists. A check that does not
#      decide (look 1 without a verdict) puts only that state on the website; its numbers go to
#      data/measure/interim-look-N.json / .txt (committed, never deployed) with their SHA-256 in status.json, so
#      nobody, Alexander included, sees a running blunder rate before the verdict (HANDOFF rule 4);
#   6. no real opponent name may be left in any file about to be written; then the files are written and a heartbeat
#      row is added to data/measure/runs.csv, and public/data/study/status.json is rewritten. status.json also carries
#      the SHA-256 of the judge's own wrapper (this file, its helpers, config.json and measure.yml), so a change to
#      the judge during the study shows up there.
#
# Usage, from the repo root (needs .venv with python-chess 1.11.x and Stockfish 19):
#   .venv/bin/python -I scripts/measure/run_instrument.py --stockfish "$SF" --out <tmp>/instrument.json
#   .venv/bin/python -I scripts/measure/daily.py --instrument <tmp>/instrument.json --stockfish "$SF" [--workers 3]
# Options for tests: --input FILE.ndjson (a saved export instead of Lichess), --as-of ISO, --root DIR (another checkout),
# --data DIR, --public DIR, --work DIR. Exit code 0 = written; 1 = refused (nothing written; the reason is printed).
import argparse, csv, hashlib, io, json, os, shutil, signal, subprocess, sys, tempfile, time, urllib.error
sys.dont_write_bytecode = True   # no __pycache__ next to the pre-registered files
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (PHASE_LABELS, REPO, dump_line, file_at, first_parent_commits, import_prereg, is_shallow,   # noqa: E402
                    iso_to_ms, load_config, name_hits, next_milestone, phase_of, read_text, scrub, sha256_file,
                    users, utc_iso, verify_prereg, write_text)

# Columns measure.py computes from the moves and the evals: they can never change for a saved game.
# The others are what Lichess reported on the day (ratings, result, its own analysis) and may change later
# (for instance he requests an analysis), so a difference there is listed, not fatal; games.csv keeps the first value.
LICHESS_COLS = ('my_rating', 'my_rating_diff', 'my_provisional', 'opp_rating', 'score', 'status',
                'lichess_analysed', 'lichess_my_blunders')
IGNORED_COLS = ('engine',)   # measure.py writes 'cached' when it read a game from the cache, else the engine name
UNFINISHED = ('created', 'started')
# The pre-registered game filter's time control (preregistration.md answer 4; measure.py's own default). Fixed here, not
# read from config.json, because it decides which games count: a settings file must not be able to change the measure.
TC = '600+0'
# U counts from the first commit containing the trainer page (build-plan M1), so the page's path decides every window:
# fixed here for the same reason as TC.
TRAINER_PAGE = 'src/pages/Safety.tsx'
INSTRUMENT_MAX_AGE_H = 24   # the fixture check must have passed in this run (the workflow) or at most a day ago
# The judge's own wrapper (build plan M1, fixer 2026-10-17): its SHA-256 goes into status.json on every run. The study
# freeze (scripts/lib/claims/study-freeze.ts, INSTRUMENT) asks for the label "instrument-deviation" to change them.
JUDGE_FILES = ('scripts/measure/daily.py', 'scripts/measure/common.py', 'scripts/measure/run_instrument.py',
               'scripts/measure/verify_prereg.py', 'scripts/measure/config.json', '.github/workflows/measure.yml')
RUNS_HEADER = ['run_at', 'as_of', 'event', 'run_id', 'eligible_games', 'new_games', 'new_export_games', 'U', 'phase',
               'instrument', 'engine', 'verdict', 'notes']


class Refused(Exception):
    pass


def judge_hashes(root):
    """SHA-256 of each file in JUDGE_FILES: the running copy for this script's own folder, the checkout for the rest."""
    here = os.path.dirname(os.path.abspath(__file__))
    out = {}
    for rel in JUDGE_FILES:
        path = os.path.join(here, os.path.basename(rel)) if rel.startswith('scripts/measure/') and rel != 'scripts/measure/config.json' \
            else os.path.join(root, rel)
        out[rel] = sha256_file(path) if os.path.exists(path) else None
    return out


def interim_public(v, look, n_looks, as_of, n, U, numbers):
    """The website's verdict.json for a check that did not decide: the decision state only, in verdict.py's shape (so
    the app's parseVerdict reads it as "no verdict yet"), without a single blunder number."""
    p = v['primary']
    return {
        'about': (f'Check {look} of {n_looks} is done and did not decide, so the study goes on. Its numbers stay off the '
                  'website until the verdict (preregistration.md; docs/HANDOFF.md rule 4): they are in the file below, '
                  'whose SHA-256 is given here and in status.json.'),
        'primary': {'games_played': p.get('games_played'), 'verdict': p.get('verdict'), 'decided_at_game': None,
                    'windows': p.get('windows')},
        'job': {'look': look, 'asOf': as_of, 'eligibleGames': n, 'U': U, 'decided': False, 'numbers': numbers},
    }


def log(msg):
    print(msg, flush=True)


# ---------------------------------------------------------------- Lichess


def fetch_all(measure, perf_types, wait_s):
    """measure.py's own fetch for the study games (rated rapid since 2026-10-16), then the same for the extra
    perf types (cards only). One request at a time; a 429 waits and retries once, anything else stops the job."""
    def get(perf):
        for attempt in (1, 2):
            try:
                return measure.fetch(perf)
            except urllib.error.HTTPError as e:
                if e.code == 429 and attempt == 1:
                    log(f'Lichess answered 429 (too many requests); waiting {wait_s} s, then one retry')
                    time.sleep(wait_s)
                    continue
                raise Refused(f'Lichess answered HTTP {e.code} for perfType={perf}')
            except (OSError, ValueError) as e:   # network, timeout, a cut-off line
                raise Refused(f'the Lichess export for perfType={perf} failed: {e}')
    games = get('rapid')
    as_of = utc_iso()
    if perf_types:
        games += get(perf_types)
    seen, out = set(), []
    for g in games:
        if g.get('id') not in seen:
            seen.add(g.get('id')); out.append(g)
    return out, as_of


# ---------------------------------------------------------------- measure.py runs


def plies(g):
    return len(g.get('moves', '').split())


def split(games, k):
    """Deterministic split into at most k groups with about the same number of positions (longest game first)."""
    k = max(1, min(k, len(games)))
    bins, load = [[] for _ in range(k)], [0] * k
    for g in sorted(games, key=lambda g: (-plies(g), g['createdAt'], g['id'])):
        i = min(range(k), key=lambda j: (load[j], j))
        bins[i].append(g); load[i] += plies(g)
    return [sorted(b, key=lambda g: g['createdAt']) for b in bins if b]


def budget(games):
    """Seconds a measure.py process may take: 5 minutes plus 4 s per position (about 3 times what a runner needs)."""
    return 300 + 4 * sum(plies(g) + 1 for g in games)


def spawn(cmd, log_path, seconds):
    """Starts measure.py in its own process group, so a hung engine can be stopped together with it (measure.py does
    not close its engine when it fails, which would otherwise leave the process waiting for ever)."""
    errf = open(log_path, 'w')
    p = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=errf, start_new_session=True)
    p.errf, p.deadline = errf, time.time() + seconds
    return p


def finish(p):
    """Waits for a spawn()ed process; stops it when it runs over its time or has crashed but cannot exit."""
    crashed_at = None
    while p.poll() is None:
        time.sleep(1)
        if crashed_at is None and 'Traceback (most recent call last)' in (read_text(p.errf.name) or ''):
            crashed_at = time.time()
        if time.time() > p.deadline or (crashed_at and time.time() - crashed_at > 10):
            os.killpg(p.pid, signal.SIGKILL)
            p.wait()
            p.errf.write('\nstopped: ' + ('crashed with its engine still open' if crashed_at else 'over its time limit') + '\n')
    p.errf.close()
    return p


def log_tail(path):
    lines = [l for l in (read_text(path) or '').splitlines() if l.strip()]
    return ' / '.join(lines[-2:])[:400] or 'no message'


def measure_cmd(ctx, inp, cache, out):
    return [sys.executable, '-I', '-B', ctx['measure_py'], '--input', inp, '--tc', ctx['tc'], '--cache', cache, '--out', out,
            '--stockfish', ctx['stockfish']]


def prefill(ctx, games, tag):
    """Searches `games` with parallel copies of measure.py that only fill a cache; returns {game id: cache line}.
    A failed copy is run once more; a second failure stops the job (preregistration.md answer 6: re-run, then report)."""
    out = {}
    if not games:
        return out
    groups = split(games, ctx['workers'])
    log(f'searching {len(games)} games in {len(groups)} parallel measure.py processes ({tag})')
    for attempt in (1, 2):
        procs = []
        for i, grp in enumerate(groups):
            base = os.path.join(ctx['work'], f'{tag}-part{i}')
            write_text(base + '.ndjson', ''.join(dump_line(g) + '\n' for g in grp))
            if os.path.exists(base + '.jsonl'):
                os.remove(base + '.jsonl')
            procs.append((grp, base, spawn(measure_cmd(ctx, base + '.ndjson', base + '.jsonl', base + '.csv'),
                                           base + '.log', budget(grp))))
        failed = []
        for grp, base, p in procs:
            finish(p)
            got = {}
            if p.returncode == 0 and os.path.exists(base + '.jsonl'):
                for line in open(base + '.jsonl', encoding='utf-8'):
                    got[json.loads(line)['id']] = line
            if p.returncode != 0 or any(g['id'] not in got for g in grp):
                failed.append((grp, base, p.returncode))
            else:
                out.update(got)
        if not failed:
            return out
        groups = [f[0] for f in failed]
        if attempt == 2:
            raise Refused(f'the engine failed twice on games {", ".join(g["id"] for g in failed[0][0])} '
                          f'(exit {failed[0][2]}): {log_tail(failed[0][1] + ".log")}')
        log(f'{len(failed)} measure.py process(es) failed; running them once more')


def counted(ctx, export_path, cache_text, todo, tag):
    """measure.py on every eligible game: `todo` (games missing from the cache) are searched, the first by this very
    run of measure.py (so its rows name the engine, as a direct run would) and the rest by prefill(). Returns
    (measure.py's CSV text, {game id: new cache line})."""
    lines = prefill(ctx, todo[1:], tag)
    cache = os.path.join(ctx['work'], f'{tag}-cache.jsonl')
    write_text(cache, cache_text + ''.join(lines[g['id']] for g in todo[1:]))
    out = os.path.join(ctx['work'], f'{tag}.csv')
    errf = os.path.join(ctx['work'], f'{tag}.log')
    r = finish(spawn(measure_cmd(ctx, export_path, cache, out), errf, budget(todo[:1]) + 2 * len(todo)))
    if r.returncode != 0:
        raise Refused(f'measure.py failed (exit {r.returncode}): {log_tail(errf)}')
    if todo:
        for line in open(cache, encoding='utf-8'):
            gid = json.loads(line)['id']
            if gid == todo[0]['id']:
                lines[gid] = line
    missing = [g['id'] for g in todo if g['id'] not in lines]
    if missing:
        raise Refused(f'no evals were saved for {", ".join(missing)}')
    return read_text(out), lines


def csv_rows(text):
    return list(csv.DictReader(io.StringIO(text))) if text else []


def compare(old, fresh):
    """[(kind, seq, game id, column, saved value, fresh value)] for every differing cell; kind is 'measured' or
    'lichess' (see LICHESS_COLS)."""
    out = []
    for a, b in zip(old, fresh):
        for col in a:
            if col in IGNORED_COLS or a.get(col) == b.get(col):
                continue
            out.append(('lichess' if col in LICHESS_COLS else 'measured', a.get('seq'), a.get('game_id'), col,
                        a.get(col), b.get(col)))
    return out


# ---------------------------------------------------------------- study state from the repo history


def trainer_u(root, cfg, eligible, unlock_after):
    """U: 40, or the eligible games started before the first commit on this branch that contains the trainer page,
    if that is later. Before the page exists U is at least the games played so far (the trainer is not there yet)."""
    added = first_parent_commits(root, cfg['paths']['trainerPage'], added_only=True)
    if not added:
        return max(unlock_after, len(eligible)), None
    t = added[0][1]
    return max(unlock_after, sum(1 for g in eligible if g['createdAt'] < t)), t


def newcomers_state(root, cfg, eligible, U, verdict):
    """Matched newcomers (preregistration.md answer 5 and 3.6 step 6). The version pre-registered by its SHA-256
    (config.json newcomers.sha256, the value in preregistration.md) binds when it was committed on this branch before
    the start of his game U+1 and holds 30+ players (verdict.newcomer_valid): that version and no other. Only when it
    did not get there in time does the build plan's rule decide: the version on the branch at that time. Until game
    U+1 is played, the newest committed version stands in for that one.
    A change after the pre-registered version is a deviation (3.6, 3.8): the version on the branch at the deadline is
    then reported as `atDeadline`, and at a check the verdict is computed with it too.
    Returns (state for status.json, the binding newcomers or None, (label, newcomers or None) of the other version or None)."""
    path = cfg['paths']['newcomers']
    want = (cfg.get('newcomers') or {}).get('sha256')
    deadline = eligible[U]['createdAt'] if len(eligible) > U else None
    before = [c for c in first_parent_commits(root, path) if deadline is None or c[1] < deadline]
    text = {sha: file_at(root, sha, path) for sha, _ in before}
    digest = lambda t: hashlib.sha256(t.encode('utf-8')).hexdigest() if t is not None else None

    def parse(t):
        try:
            nc = json.loads(t) if t is not None else None
        except json.JSONDecodeError:
            return None
        return nc if isinstance(nc, dict) else None

    def describe(c):
        nc = parse(text[c[0]])
        return {'commit': c[0], 'committedAt': utc_iso(c[1]), 'players': nc.get('players') if nc else None,
                'sha256': digest(text[c[0]]), 'valid': bool(nc) and verdict.newcomer_valid(nc)}

    last = before[-1] if before else None                                   # the build plan's rule
    pre = next((c for c in before if want and digest(text[c[0]]) == want), None)   # "that version, and no other"
    used = pre or last
    nc = parse(text[used[0]]) if used else None
    binding = bool(nc) and verdict.newcomer_valid(nc)
    head = file_at(root, 'HEAD', path)
    other = last if (pre and last and digest(text[last[0]]) != want) else None
    state = {'binding': binding, 'file': path, 'commit': used[0] if used else None,
             'committedAt': utc_iso(used[1]) if used else None, 'players': nc.get('players') if nc else None,
             'sha256': digest(text[used[0]]) if used else None, 'preregisteredSha256': want,
             'matchesPreregistered': bool(used) and want is not None and digest(text[used[0]]) == want,
             'deadlineGame': U + 1, 'deadline': utc_iso(deadline) if deadline else None,
             'changedAfterDeadline': deadline is not None and head != (text[last[0]] if last else None),
             'atDeadline': describe(other) if other else None}
    doc = read_text(os.path.join(root, cfg['prereg']['doc'])) or ''
    warn = []
    if want and want not in doc:
        warn.append(f'the pinned SHA-256 in scripts/measure/config.json is not the one in {cfg["prereg"]["doc"]}')
    if other:
        warn.append('the file changed after the pre-registered version' + (f' and before game {U + 1} started' if deadline else '')
                    + ': a deviation to report (preregistration.md 3.6, 3.8). The pre-registered version decides; at a '
                    'check the verdict is also computed with ' + ('the version on the branch at the start of game %d' % (U + 1)
                                                                    if deadline else 'the newest version'))
    if state['changedAfterDeadline']:
        warn.append(f'the file changed after game {U + 1} started: a deviation to report (preregistration.md 3.6, 3.8); '
                    'the version used here stays')
    if binding and not state['matchesPreregistered'] and want:
        warn.append(f'this is not the pre-registered version (SHA-256 {want[:12]}...), which was not on the branch in '
                    'time; the build plan\'s rule (the version on the branch at that time) is used: a deviation to report')
    if binding:
        state['note'] = (f'matched newcomers bind ({state["players"]} players, '
                         + ('the pre-registered version' if state['matchesPreregistered'] else 'not the pre-registered version')
                         + '): "worked" also needs the newcomer-adjusted test')
    elif deadline is None:
        state['note'] = f'not binding yet: no committed newcomers.json with 30+ players (deadline: the start of game {U + 1})'
    else:
        state['note'] = 'matched newcomers were not ready in time; the main rule alone decides and S6 is reported with that caveat'
    if warn:
        state['note'] += '. ' + '. '.join(w[0].upper() + w[1:] for w in warn)
    label = (f'the version on the branch at the start of game {U + 1}' if deadline else 'the newest committed version') \
        + f' (commit {other[0][:12]})' if other else None
    return state, (nc if binding else None), ((label, parse(text[other[0]])) if other else None)


# ---------------------------------------------------------------- the run


def run(a):
    root = os.path.abspath(a.root)
    cfg = load_config(root)
    me = cfg['user']
    data = os.path.abspath(a.data or os.path.join(root, cfg['paths']['data']))
    public = os.path.abspath(a.public or os.path.join(root, cfg['paths']['public']))
    P = {k: os.path.join(data, f) for k, f in (('export', 'export.ndjson'), ('games', 'games.csv'),
                                                ('evals', 'evals.jsonl'), ('runs', 'runs.csv'))}
    P.update({k: os.path.join(public, f) for k, f in (('status', 'status.json'), ('vjson', 'verdict.json'),
                                                       ('vtxt', 'verdict.txt'))})
    interim = lambda look, ext: os.path.join(data, f'interim-look-{look}.{ext}')
    sha = lambda text: hashlib.sha256(text.encode('utf-8')).hexdigest()

    # 1. the instrument: hashes, then today's fixture check on this binary
    problems = verify_prereg(root, cfg)
    if problems:
        raise Refused('the pre-registered instrument does not match its hashes:\n  ' + '\n  '.join(problems))
    try:
        inst = json.load(open(a.instrument, encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as e:
        raise Refused(f'no readable instrument-check result at {a.instrument} ({e})')
    sf = os.path.abspath(a.stockfish)
    if not (inst.get('passed') is True and inst.get('engineCheckRun') is True):
        raise Refused(f'the instrument check did not pass: {inst.get("problem") or "engine re-search not run"}')
    if not os.path.exists(sf) or inst.get('binarySha256') != sha256_file(sf):
        raise Refused(f'the instrument check was run on another Stockfish binary than {sf}')
    try:
        age_h = (time.time() * 1000 - iso_to_ms(str(inst.get('at')))) / 3600000
    except ValueError:
        age_h = None
    if age_h is None or not -1 <= age_h <= INSTRUMENT_MAX_AGE_H:
        raise Refused(f'the instrument check is not from the last {INSTRUMENT_MAX_AGE_H} hours (it ran at {inst.get("at")}); '
                      'run run_instrument.py first')
    if cfg.get('tc', TC) != TC:
        raise Refused(f'scripts/measure/config.json sets tc {cfg.get("tc")}, but the pre-registered filter is {TC} games')
    if cfg['paths'].get('trainerPage') != TRAINER_PAGE:
        raise Refused(f'scripts/measure/config.json sets the trainer page to {cfg["paths"].get("trainerPage")}, but U is '
                      f'counted from {TRAINER_PAGE} (build plan M1)')
    if is_shallow(root):
        raise Refused('the checkout has no full history (fetch-depth 0 is needed to date the trainer and the newcomers)')

    # 2. his games, with opponents' names replaced
    measure, verdict = import_prereg(root, cfg)
    tc = TC
    if a.input:
        raw = [json.loads(l) for l in open(a.input, encoding='utf-8') if l.strip()]
        as_of = a.as_of or utc_iso()
    else:
        raw, as_of = fetch_all(measure, cfg['lichess'].get('extraPerfTypes'), a.retry_wait)
    for g in raw:
        if not any(str(u.get('id', '')).lower() == me for u in users(g)):
            raise Refused(f'game {g.get("id")} in the export is not one of {me}\'s games')
    games, names = scrub(raw, me)
    eligible = sorted((g for g in games if measure.eligible(g, tc)), key=lambda g: g['createdAt'])
    n = len(eligible)
    log(f'{len(games)} rated games since the study start in the export; {n} count for the study (rated 10+0)')

    # 3. what is saved already
    old_csv = read_text(P['games']) or ''
    old_rows = csv_rows(old_csv)
    old_ids = [r['game_id'] for r in old_rows]
    if [r['seq'] for r in old_rows] != [str(i) for i in range(1, len(old_rows) + 1)]:
        raise Refused(f'{P["games"]} is not numbered 1..{len(old_rows)}')
    elig_ids = [g['id'] for g in eligible]
    if elig_ids[:len(old_ids)] != old_ids:
        first = next((i for i, (x, y) in enumerate(zip(elig_ids, old_ids)) if x != y), min(len(elig_ids), len(old_ids)))
        raise Refused(f'the game list no longer starts with the saved games (first difference at game {first + 1}); '
                      'games.csv would have to be renumbered, which the job never does by itself')
    old_cache = read_text(P['evals']) or ''
    cached = set()
    for line in old_cache.splitlines():
        r = json.loads(line)
        if r.get('nodes') == measure.NODES:
            cached.add(r['id'])
    new_games = eligible[len(old_ids):]
    todo = [g for g in eligible if g['id'] not in cached]

    # 4. count every game; search only what is new
    work = a.work_dir
    export_path = os.path.join(work, 'export.ndjson')
    write_text(export_path, ''.join(dump_line(g) + '\n' for g in games))
    ctx = {'work': work, 'tc': tc, 'stockfish': sf, 'workers': a.workers,
           'measure_py': os.path.join(root, cfg['prereg']['dir'], 'measure.py')}
    t0 = time.time()
    fresh_csv, new_lines = counted(ctx, export_path, old_cache, todo, 'daily') if n else ('', {})
    log(f'measure.py: {len(todo)} games searched, {n - len(todo)} read from the cache, {time.time() - t0:.0f} s')
    fresh_rows = csv_rows(fresh_csv)
    if len(fresh_rows) != n or [r['game_id'] for r in fresh_rows] != elig_ids:
        raise Refused(f'measure.py returned {len(fresh_rows)} rows for {n} eligible games')
    diffs = compare(old_rows, fresh_rows)
    bad = [d for d in diffs if d[0] == 'measured']
    if bad:
        raise Refused('saved rows changed in measured columns (the instrument or the cache moved): '
                      + '; '.join(f'game {d[1]} ({d[2]}) {d[3]}: {d[4]} -> {d[5]}' for d in bad[:10]))
    notes = []
    soft_games = sorted({d[1] for d in diffs}, key=int)
    if soft_games:
        notes.append(f'Lichess data changed since the day it was saved for {len(soft_games)} earlier games '
                     f'(games.csv keeps the first value): {", ".join(soft_games[:20])}')

    # 5. the new files, built in memory first
    fresh_lines = fresh_csv.splitlines(keepends=True) if n else []
    if old_rows and fresh_lines[0] != old_csv.splitlines(keepends=True)[0]:
        raise Refused('measure.py now writes a different header than the saved games.csv')
    new_csv = (old_csv or (fresh_lines[0] if fresh_lines else '')) + ''.join(fresh_lines[1 + len(old_rows):])
    new_cache = old_cache + ''.join(new_lines[g['id']] for g in eligible if g['id'] in new_lines and g['id'] not in cached)
    old_export = read_text(P['export']) or ''
    saved = {json.loads(l)['id'] for l in old_export.splitlines() if l.strip()}
    add = sorted((g for g in games if g['id'] not in saved and g.get('status') not in UNFINISHED),
                 key=lambda g: g['createdAt'])
    new_export = old_export + ''.join(dump_line(g) + '\n' for g in add)
    if any(gid not in saved | {g['id'] for g in add} for gid in elig_ids):
        raise Refused('an eligible game would be missing from export.ndjson')
    if new_csv:
        staged = os.path.join(work, 'games.csv')
        write_text(staged, new_csv)
        r = subprocess.run([sys.executable, '-I', '-B', os.path.join(root, cfg['prereg']['dir'], 'verdict.py'), staged,
                            '--json', os.path.join(work, 'verdict-daily.json')], capture_output=True, text=True)
        if r.returncode != 0:   # its printed text holds blunder rates, so it stays out of the (public) log
            raise Refused(f'verdict.py does not accept the new games.csv: {(r.stderr.strip().splitlines() or ["?"])[-1][:300]}')

    # 6. the study state
    unlock_after = verdict.windows()['wash_in'][0] - 1
    U, trainer_at = trainer_u(root, cfg, eligible, unlock_after)
    W = verdict.windows(U)
    nc_state, nc, nc_other = newcomers_state(root, cfg, eligible, U, verdict)
    phase = phase_of(n, W)
    ends = [l['window'][1] for l in W['looks']]

    # 7. the checks at games 110 and 160 (U + 70 and U + 120): a full recount from an empty cache
    out_files = {}
    remove = []
    verdict_state = None
    old_v = None
    if os.path.exists(P['vjson']):
        try:
            old_v = json.load(open(P['vjson'], encoding='utf-8'))
        except json.JSONDecodeError:
            old_v = None
    if n < ends[0]:
        stray = [P['vjson'], P['vtxt']] + [interim(k, e) for k in range(1, len(ends) + 1) for e in ('json', 'txt')]
        for path in stray:
            if os.path.exists(path):
                remove.append(path)
                notes.append(f'{os.path.basename(path)} existed before the first check and was removed')
    else:
        look = max(i for i, e in enumerate(ends) if e <= n) + 1
        done = (old_v or {}).get('job', {}).get('look', 0) if isinstance(old_v, dict) else 0
        decided = isinstance(old_v, dict) and (old_v.get('primary') or {}).get('decided_at_game') is not None
        if done >= look or decided:
            verdict_state = {'look': done, 'decidedAtGame': (old_v.get('primary') or {}).get('decided_at_game'),
                             'computedAt': old_v.get('job', {}).get('asOf')}
        else:
            log(f'check {look} reached ({n} games): recounting all {n} games from an empty cache')
            t1 = time.time()
            rc_csv, _ = counted(ctx, export_path, '', eligible, 'recount')
            rc_rows = csv_rows(rc_csv)
            if [r['game_id'] for r in rc_rows] != elig_ids:
                raise Refused('the recount returned a different game list')
            daily_rows = csv_rows(new_csv)
            rc_diffs = compare(daily_rows, rc_rows)
            rc_path = os.path.join(work, 'recount.csv')
            write_text(rc_path, rc_csv)

            def run_verdict(tag, newcomers):
                cmd = [sys.executable, '-I', '-B', os.path.join(root, cfg['prereg']['dir'], 'verdict.py'), rc_path,
                       '--unlock-after', str(U), '--json', os.path.join(work, f'{tag}.json')]
                if newcomers is not None:
                    write_text(os.path.join(work, f'{tag}-newcomers.json'), json.dumps(newcomers))
                    cmd += ['--newcomers', os.path.join(work, f'{tag}-newcomers.json')]
                r = subprocess.run(cmd, capture_output=True, text=True)
                if r.returncode != 0:
                    raise Refused(f'verdict.py failed on the recount: {(r.stderr.strip().splitlines() or ["?"])[-1][:300]}')
                return r.stdout, json.load(open(os.path.join(work, f'{tag}.json'), encoding='utf-8'))

            out_text, v = run_verdict('verdict', nc)
            other_v = None
            if nc_other:   # the newcomer file changed after the version used: the verdict with the other version too
                _, o = run_verdict('verdict-other-newcomers', nc_other[1])
                other_v = {'newcomers': nc_other[0], 'binding': nc_other[1] is not None and verdict.newcomer_valid(nc_other[1]),
                           'verdict': o['primary'].get('verdict'), 'decided_at_game': o['primary'].get('decided_at_game'),
                           'note': 'reported because the newcomer file changed after the version used above, which is the '
                                   'one that decides (preregistration.md 3.6); a deviation (3.8)'}
            v['job'] = {
                'look': look, 'asOf': as_of, 'eligibleGames': n, 'U': U,
                'rows': 'a fresh recount of every eligible game from an empty cache (measure.py, unchanged)',
                'recountSeconds': round(time.time() - t1),
                'newcomers': nc_state,
                'otherNewcomerVersion': other_v,
                'differencesFromDailyRows': [{'kind': d[0], 'seq': int(d[1]), 'game': d[2], 'column': d[3],
                                              'daily': d[4], 'fresh': d[5]} for d in rc_diffs],
                'instrumentCheck': {k: inst.get(k) for k in ('passed', 'at', 'stockfish', 'binarySha256', 'platform')},
            }
            measured = [d for d in rc_diffs if d[0] == 'measured']
            lines = [f'Computed {as_of} by the daily job from a fresh recount of all {n} counted games (empty cache), '
                     f'check {look} of {len(ends)}; trainer available after game {U}.', '',
                     out_text.strip(), '',
                     f'Differences between the fresh rows and the daily rows in games.csv: {len(rc_diffs)} '
                     f'({len(measured)} in measured columns, {len(rc_diffs) - len(measured)} in data Lichess reports). '
                     'The verdict uses the fresh rows only.']
            lines += [f'  game {d[1]} ({d[2]}) {d[3]}: daily {d[4]}, fresh {d[5]}' for d in rc_diffs[:50]]
            lines += ['', f'Newcomer condition: {nc_state["note"]}.']
            if other_v:
                lines += [f'With {other_v["newcomers"]} instead (a deviation, reported, not deciding): {other_v["verdict"]}'
                          + (f', decided at game {other_v["decided_at_game"]}' if other_v['decided_at_game'] else '') + '.']
            full_json = json.dumps(v, indent=1, default=str) + '\n'
            full_txt = '\n'.join(lines) + '\n'
            if v['primary'].get('decided_at_game') is not None:   # the verdict: every number goes on the website
                out_files[P['vjson']] = full_json
                out_files[P['vtxt']] = full_txt
                notes.append(f'check {look}: verdict.json computed from a fresh recount ({len(rc_diffs)} differences listed)')
            else:   # no verdict yet: the numbers stay in data/measure (not deployed); the website gets the state only
                numbers = {'file': f'data/measure/interim-look-{look}.json', 'sha256': sha(full_json),
                           'txt': f'data/measure/interim-look-{look}.txt', 'txtSha256': sha(full_txt)}
                out_files[interim(look, 'json')] = full_json
                out_files[interim(look, 'txt')] = full_txt
                nxt = next((e for e in ends if e > n), ends[-1])
                out_files[P['vjson']] = json.dumps(interim_public(v, look, len(ends), as_of, n, U, numbers), indent=1) + '\n'
                out_files[P['vtxt']] = (f'Check {look} of {len(ends)} was worked out on {as_of} from a fresh recount of all {n} '
                                        f'counted games: no verdict yet, so the study goes on to game {nxt}. The numbers '
                                        'stay off the website until the verdict.\n')
                notes.append(f'check {look}: no verdict yet; its numbers are in data/measure/interim-look-{look}.json '
                             f'(SHA-256 {numbers["sha256"][:12]}...), not on the website')
            verdict_state = {'look': look, 'decidedAtGame': v['primary'].get('decided_at_game'), 'computedAt': as_of}

    # 8. status.json and the heartbeat row
    status = {
        'about': 'Written by the daily measuring job (.github/workflows/measure.yml). Counts and dates only: no blunder '
                 'numbers appear here or on the website before a verdict exists (verdict.json, from game 110); a check '
                 'that does not decide keeps its numbers in data/measure/interim-look-N.json (SHA-256 under interimChecks).',
        'asOf': as_of,
        'eligibleGames': n,
        'phase': phase,
        'phaseLabel': PHASE_LABELS[phase],
        'unlockAfterGame': unlock_after,
        'unlocked': n >= unlock_after,
        'U': U,
        'trainerOnMainSince': utc_iso(trainer_at) if trainer_at else None,
        'nextMilestone': next_milestone(n, unlock_after, W),
        'windows': {'baseline': W['baseline'], 'washIn': W['wash_in'], 'looks': [l['window'] for l in W['looks']]},
        'newcomersBinding': nc_state['binding'],
        'newcomers': nc_state,
        'lastRunOk': True,
        'problems': [],
        'instrumentCheck': {k: inst.get(k) for k in ('passed', 'at', 'stockfish', 'binarySha256', 'platform', 'python',
                                                      'pythonChess', 'fixture', 'engineCheck', 'seconds')},
        'newGames': len(new_games),
        'lastGameAt': utc_iso(eligible[-1]['createdAt']) if eligible else None,
        'verdict': verdict_state,
        'interimChecks': None,   # [{look, file, sha256, txtSha256}] for each undecided check; filled in below
        'judgeSha256': judge_hashes(root),
        'notes': notes,
    }
    for look in range(1, len(ends) + 1):   # undecided checks: saved earlier, or written in this very run
        j, t = interim(look, 'json'), interim(look, 'txt')
        jt = out_files[j] if j in out_files else (None if j in remove else read_text(j))
        tt = out_files[t] if t in out_files else (None if t in remove else read_text(t))
        if jt is not None:
            status['interimChecks'] = (status['interimChecks'] or []) + [
                {'look': look, 'file': f'data/measure/interim-look-{look}.json', 'sha256': sha(jt),
                 'txtSha256': sha(tt) if tt is not None else None}]
    out_files[P['status']] = json.dumps(status, indent=1, ensure_ascii=False) + '\n'
    if new_csv:
        out_files[P['games']] = new_csv
    if new_cache:
        out_files[P['evals']] = new_cache
    if new_export:
        out_files[P['export']] = new_export
    runs = read_text(P['runs']) or (','.join(RUNS_HEADER) + '\n')
    buf = io.StringIO()
    csv.writer(buf, lineterminator='\n').writerow([
        utc_iso(), as_of, a.event, a.run_id, n, len(new_games), len(add), U, phase,
        'passed' if inst.get('passed') else 'failed', inst.get('stockfish'),
        f'check {verdict_state["look"]}' if verdict_state else '', ' | '.join(notes)])
    out_files[P['runs']] = runs + buf.getvalue()

    # 9. no real name in anything about to be written, then write
    hits = name_hits({p: t for p, t in out_files.items()}, names, cfg.get('nameScanAllow', []))
    if hits:
        raise Refused('a real opponent name would be saved: ' + '; '.join(
            f'{os.path.relpath(h[0], root)} line {h[1]} (name hash {h[2]})' for h in hits[:10]))
    for p in remove:
        os.remove(p)
    for p, t in out_files.items():
        write_text(p, t)
    return status, len(add), out_files


def summary_md(status, new_export):
    s = status
    ic = s['instrumentCheck']
    ms = s['nextMilestone']
    rows = [('Counted rated 10+0 games', f'{s["eligibleGames"]} (as of {s["asOf"]})'),
            ('New this run', f'{s["newGames"]} counted; {new_export} new games saved to export.ndjson'),
            ('Phase', f'{s["phaseLabel"]}'),
            ('Next', f'game {ms["game"]}: {ms["label"]}' if ms else 'study finished'),
            ('Trainer opens after game', f'{s["unlockAfterGame"]} (U = {s["U"]}; trainer page on this branch: '
                                         f'{s["trainerOnMainSince"] or "not yet"})'),
            ('Matched newcomers binding', f'{"yes" if s["newcomersBinding"] else "no"}: {s["newcomers"]["note"]}'),
            ('Instrument check', f'{"passed" if ic["passed"] else "FAILED"} on {ic["stockfish"]}, {ic["platform"]}, '
                                 f'python-chess {ic["pythonChess"]}, {ic["seconds"]} s'),
            ('Fixture check', ic['fixture'] or '-'), ('Engine re-search', ic['engineCheck'] or '-'),
            ('Engine binary SHA-256', f'`{ic["binarySha256"]}`'),
            ('Verdict', f'check {s["verdict"]["look"]} computed {s["verdict"]["computedAt"]}' if s['verdict'] else
             'none yet (first check after game %d)' % s['windows']['looks'][0][1])]
    out = ['### Daily measurement', '', '| | |', '|---|---|'] + [f'| {k} | {v} |' for k, v in rows]
    if s['notes']:
        out += ['', 'Notes:'] + [f'- {x}' for x in s['notes']]
    return '\n'.join(out) + '\n'


def main():
    ap = argparse.ArgumentParser(description='Daily measuring job (build-plan M1).')
    ap.add_argument('--instrument', required=True, help='JSON written by run_instrument.py today')
    ap.add_argument('--stockfish', default=os.environ.get('STOCKFISH', '/opt/homebrew/bin/stockfish'))
    ap.add_argument('--workers', type=int, default=3, help='parallel measure.py processes for new games (Threads 1 each)')
    ap.add_argument('--root', default=REPO)
    ap.add_argument('--data'); ap.add_argument('--public')
    ap.add_argument('--input', help='a saved Lichess export (NDJSON) instead of downloading (tests)')
    ap.add_argument('--as-of', help='the asOf time with --input (default: now)')
    ap.add_argument('--work', help='folder for temporary files (default: the system temp folder)')
    ap.add_argument('--keep-work', action='store_true')
    ap.add_argument('--retry-wait', type=int)
    ap.add_argument('--event', default=os.environ.get('GITHUB_EVENT_NAME', 'local'))
    ap.add_argument('--run-id', default=os.environ.get('GITHUB_RUN_ID', ''))
    ap.add_argument('--summary', help='append a Markdown summary here (GitHub: $GITHUB_STEP_SUMMARY)')
    a = ap.parse_args()
    if a.retry_wait is None:
        a.retry_wait = load_config(os.path.abspath(a.root))['lichess']['retryWaitSeconds']
    if a.work:
        os.makedirs(a.work, exist_ok=True)
    a.work_dir = tempfile.mkdtemp(prefix='measure-', dir=a.work)
    try:
        status, new_export, _ = run(a)
    except Refused as e:
        print(f'REFUSED, nothing was written: {e}', file=sys.stderr)
        if a.summary:
            with open(a.summary, 'a') as f:
                f.write(f'### Daily measurement: refused, nothing was written\n\n{e}\n')
        sys.exit(1)
    finally:
        if not a.keep_work:
            shutil.rmtree(a.work_dir, ignore_errors=True)
    md = summary_md(status, new_export)
    print(md)
    if a.summary:
        with open(a.summary, 'a') as f:
            f.write(md)
    gh = os.environ.get('GITHUB_OUTPUT')
    if gh:
        with open(gh, 'a') as f:
            f.write(f'eligible={status["eligibleGames"]}\nnew_games={status["newGames"]}\nnew_export_games={new_export}\n'
                    f'message=Daily measurement {status["asOf"][:10]}: {status["newGames"]} new rated 10+0 games '
                    f'({status["eligibleGames"]} counted)\n')


if __name__ == '__main__':
    main()
