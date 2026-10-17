# Matched newcomers (preregistration.md 3.6, secondary S6, binding when frozen in time): how much do Lichess newcomers
# like Alexander change their blunder rate by themselves between their rated 10+0 games 11-40 and 61-160?
# Built only from other players' public games by the fixed rule below, so it can be frozen before his game 41
# without looking at his training data. Written 2026-10-16.
#
# The rule (preregistration.md 3.6) as implemented here:
#  1. Candidates: every non-BOT player rated 900-1300 (own pre-game rating) in a rated 10+0 game of a sample of the
#     September 2026 Lichess database: the population study's 96 byte ranges of 10 MB, offsets (i + 0.5) x size / 96.
#     Older months are added (same sampling) only if fewer than 30 players qualify after every candidate was tried.
#  2. Keep players whose account was created at most 60 days before their first rated 10+0 game and who have at
#     least 160 rated 10+0 games.
#  3. Their rated 10+0 games are numbered as for him, with prereg measure.py's eligible() imported unchanged.
#     Blunders = Lichess's own count (players.<colour>.analysis.blunder) on the games Lichess analysed. Keep players
#     with 5+ analysed games in games 11-40 and 10+ in games 61-160 (an analysed game counts when the player made at
#     least one move, as in verdict.py's ratio()). Candidates are tried in a fixed pseudo-random order (SHA-256 of
#     SALT and the user id); the run stops when 100 players qualify (target 60).
#  4. c = mean over players of (rate in games 61-160 minus rate in games 11-40); rates pooled per 100 own moves over
#     analysed games with verdict.py's ratio(), imported unchanged. s = player-bootstrap standard error of c (10,000
#     resamples, fixed seed). d = drift SD by the block method: sqrt(max(0, variance of the change across players
#     minus the mean sampling variance of the change)), sampling variance from ratio().
#  5. Writes newcomers.json (players, mean_change, mean_change_se, drift_sd, the counts at every step) and players.csv
#     (one anonymous row per player). No usernames and no game ids are written to either file.
# Order of the checks: the API is asked in the cheapest order (account, 60-day rule, 5+ analysed in 11-40, 160 games,
# 10+ analysed in 61-160); the order changes only the step counts, never who is kept.
# Version 2 (2026-10-16, before any result was committed): games are numbered by start time like measure.py (Lichess's
# oldest-first export is ordered by end time; 4 of 270 saved histories had a pair out of start-time order), and a
# history is read 6 hours past the deciding game before the stream is closed.
#
# Usage, from the repo root (Python 3.9+; python-chess for measure.py's import; zstandard for the database sample):
#   .venv/bin/python -I research/2026-10-16-diagnosis/newcomers/newcomers.py run [--work DIR] [--budget-minutes N]
#        sample + fetch + build. Resumable: every API answer is saved in DIR (default ~/.cache/chess-project-newcomers,
#        outside the repo because it holds usernames and game ids) and never asked again.
#   ... newcomers.py sample   --work DIR [--month 2026-09] [--only-points 0,48]   database sample -> candidate list
#   ... newcomers.py fetch    --work DIR [--budget-minutes N] [--max-exports N]   Lichess API, one request at a time
#   ... newcomers.py build    --work DIR --out DIR [--pilot | --finalize]         saved answers -> newcomers.json
#   ... newcomers.py scan     --work DIR FILE...    0 usernames and 0 game ids in the files that will be committed
#   ... newcomers.py selftest                       the rule on constructed players, a mock API (429 back-off, one
#                                                   request at a time) and a byte-identical rebuild
# Exit codes: 0 done, 3 not finished yet (budget or limit reached; run again to continue), other = error.
import sys, os, re, json, csv, math, gzip, time, random, hashlib, argparse, http.client, urllib.request, urllib.error, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
PREREG = os.path.join(HERE, '..', 'prereg')
sys.path.insert(0, PREREG)
sys.dont_write_bytecode = True        # no __pycache__ folders next to the hashed prereg files
from measure import eligible          # noqa: E402  prereg file, hashed in preregistration.md 3.9; imported unchanged
from verdict import ratio, windows    # noqa: E402  same

PIPELINE = 'newcomers-2'
UA = 'ChessCoach-newcomers/1.0 (research script, one request at a time; +https://github.com/abustrup/Chess-Project)'
API = os.environ.get('NEWCOMERS_API', 'https://lichess.org')
DB = os.environ.get('NEWCOMERS_DB', 'https://database.lichess.org')
SALT = 'chess-project-newcomers-2026-10-16'
MONTHS = ['2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04']   # September first; older only if needed
POINTS, RANGE_MB = 96, 10          # the population study's sample of each monthly file
BAND = (900, 1300)
TC = '600+0'
MAX_DAYS = 60                      # account created at most 60 days before the first rated 10+0 game
MIN_GAMES = 160
BASE_MIN, TRAIN_MIN = 5, 10        # analysed games needed in games 11-40 and in games 61-160
STOP_AT, TARGET, MIN_PLAYERS = 100, 60, 30
BOOT, SEED = 10000, 20261016
USERS_PER_REQUEST = 300
PAUSE = 1.0                        # seconds between two API requests
WAIT_429 = 61                      # Lichess: after a 429, wait a full minute
DAY_MS = 86400 * 1000
MARGIN_MS = 6 * 3600 * 1000        # read this far past the deciding game before stopping: the export is ordered by when
                                   # games ended, the numbering by when they started; a rated 10+0 game took at most 27
                                   # minutes from creation to last move in 29,634 saved games (2026-10-16)
W = windows()                      # the windows verdict.py uses for him
BASE = tuple(W['baseline'])        # (11, 40)
LOOK1 = tuple(W['looks'][0]['window'])    # (61, 110), descriptive
TRAIN = tuple(W['looks'][-1]['window'])   # (61, 160), binding
assert BASE == (11, 40) and TRAIN == (61, 160) and LOOK1 == (61, 110), W
MAGIC = bytes([0x28, 0xB5, 0x2F, 0xFD])
PILOT_OK = [False]                 # set by --pilot: a partial database sample is allowed

STEPS = [   # outcome codes in the order they are checked, with the plain words used in newcomers.json
    ('no_account', 'account closed or not found (creation date not public)'),
    ('few_rapid', 'fewer than 160 rated rapid games on the account (cannot have 160 rated 10+0 games)'),
    ('late_start', 'first rated 10+0 game more than 60 days after the account was created'),
    ('base_few_analysed', 'fewer than 5 Lichess-analysed games in their games 11-40'),
    ('few_games', 'fewer than 160 rated 10+0 games'),
    ('train_few_analysed', 'fewer than 10 Lichess-analysed games in their games 61-160'),
    ('kept', 'kept'),
]


def log(*a):
    print(*a, file=sys.stderr, flush=True)


# ------------------------------------------------------------------ the rule on one player's games (pure function)
def is_eligible(g):
    """prereg measure.py's eligible(), computed once per game."""
    if '_elig' not in g:
        g['_elig'] = bool(eligible(g, TC))
    return g['_elig']


def evaluate(created_ms, games):
    """games: one player's rated rapid games as read from the export, for a user created at created_ms. Lichess's
    oldest-first export is ordered by when a game ended; the eligible games are numbered by when they started
    (createdAt, stable sort), exactly as measure.py numbers his. Returns (outcome, rows, settled): rows = eligible
    games numbered 1, 2, 3 ... with own moves, analysed flag and Lichess's blunder count; settled = no game not yet
    read can change the outcome, because the answer has been read MARGIN past the moment that decided it. Used by
    fetch (to stop reading early) and by build (on the saved answer), so both reach the same decision."""
    late = created_ms + MAX_DAYS * DAY_MS
    read_to = max((g.get('lastMoveAt', g['createdAt']) for g in games), default=0)
    rows = []; outcome, t_dec = 'few_games', None
    for g in sorted(games, key=lambda g: g['createdAt']):
        if not is_eligible(g):
            if not rows and g['createdAt'] > late:
                outcome, t_dec = 'late_start', late; break      # any 10+0 game not read yet started later still
            continue
        uid = g['_me']
        col = 'white' if (g['players']['white'].get('user') or {}).get('id') == uid else 'black'
        n = len(g['moves'].split())
        a = g['players'][col].get('analysis')
        rows.append({'seq': len(rows) + 1, 't': g['createdAt'], 'my_moves': (n + 1) // 2 if col == 'white' else n // 2,
                     'analysed': a is not None, 'my_blunders': a.get('blunder') if a else None})
        k = len(rows)
        if k == 1 and g['createdAt'] > late:
            outcome, t_dec = 'late_start', late; break
        if k == BASE[1] and analysed_count(rows, BASE) < BASE_MIN:
            outcome, t_dec = 'base_few_analysed', g['createdAt']; break
        if k == MIN_GAMES:
            outcome = 'kept' if analysed_count(rows, TRAIN) >= TRAIN_MIN else 'train_few_analysed'
            t_dec = g['createdAt']; break
    return outcome, rows, t_dec is not None and read_to > t_dec + MARGIN_MS


def analysed_rows(rows, w):
    return [r for r in rows if w[0] <= r['seq'] <= w[1] and r['analysed'] and r['my_moves'] > 0]


def analysed_count(rows, w):
    return len(analysed_rows(rows, w))


def prefilter(user):
    if not user or user.get('disabled') or 'createdAt' not in user:
        return 'no_account'
    if ((user.get('perfs') or {}).get('rapid') or {}).get('games', 0) < MIN_GAMES:
        return 'few_rapid'
    return None


# ------------------------------------------------------------------ network: one request at a time, honest UA
class Net:
    def __init__(self, sleep=time.sleep):
        self.sleep = sleep; self.requests = 0; self.waits = []; self.last = 0.0

    def open(self, url, data=None, accept='application/json', headers=None, method=None, timeout=90):
        """One request at a time (the caller reads the answer before asking again). 429: wait a full minute."""
        tries = 0
        while True:
            gap = PAUSE - (time.time() - self.last)
            if gap > 0:
                self.sleep(gap)
            self.last = time.time(); self.requests += 1
            h = {'User-Agent': UA, 'Accept': accept, **({'Content-Type': 'text/plain'} if data else {}), **(headers or {})}
            req = urllib.request.Request(url, data=data, headers=h, method=method)
            try:
                return urllib.request.urlopen(req, timeout=timeout)
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    log(f'  429 Too Many Requests: waiting {WAIT_429} s'); self.waits.append(WAIT_429)
                    self.sleep(WAIT_429); tries += 1
                    if tries > 20:
                        raise SystemExit('Lichess kept answering 429 for 20 minutes; stopped (run again later)')
                    continue
                if e.code == 404:
                    return None
                tries += 1
                if tries > 5:
                    raise
                log(f'  HTTP {e.code}; retry in {10 * tries} s'); self.sleep(10 * tries)
            except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
                tries += 1
                if tries > 5:
                    raise
                log(f'  network error {e}; retry in {10 * tries} s'); self.sleep(10 * tries)


# ------------------------------------------------------------------ step 1: the database sample -> candidates
def db_url(month):
    return f'{DB}/standard/lichess_db_standard_rated_{month}.pgn.zst'


HDR = re.compile(rb'\[(\w+) "([^"]*)"\]')


def decompress(buf):
    """Every complete zstd block from the first frame start on; a cut-off last frame simply ends early (no error),
    so the result depends only on the bytes."""
    import zstandard
    k = buf.find(MAGIC)
    if k < 0:
        return b''
    out = []; buf = buf[k:]; dctx = zstandard.ZstdDecompressor()
    while buf:
        o = dctx.decompressobj()
        try:
            out.append(o.decompress(buf))
        except zstandard.ZstdError:
            break
        if not o.eof:
            break
        buf = o.unused_data
    return b''.join(out)


def parse_sample(text):
    """One decompressed range -> ({user id: in-band rated 10+0 player-games}, counts). The cut first and last games
    are dropped."""
    games = text.split(b'\n\n[Event ')[1:-1]
    found = {}; c = {'games': len(games), 'games_10_0': 0, 'player_games_in_band': 0, 'first_utc': None, 'last_utc': None}
    for g in games:
        head = g.split(b'\n\n', 1)[0]
        h = {k.decode(): v.decode('utf-8', 'replace') for k, v in HDR.findall(head)}
        t = f"{h.get('UTCDate', '')} {h.get('UTCTime', '')}"
        c['first_utc'] = c['first_utc'] or t; c['last_utc'] = t
        if h.get('TimeControl') != TC or not g.startswith(b'"Rated'):
            continue
        c['games_10_0'] += 1
        for side in ('White', 'Black'):
            try:
                elo = int(h.get(side + 'Elo', ''))
            except ValueError:
                continue
            if BAND[0] <= elo <= BAND[1] and h.get(side + 'Title') != 'BOT' and h.get(side):
                uid = h[side].lower(); found[uid] = found.get(uid, 0) + 1; c['player_games_in_band'] += 1
    return found, c


def sample(work, month, net, only=None):
    d = os.path.join(work, f'sample-{month}'); os.makedirs(d, exist_ok=True)
    resp = net.open(db_url(month), accept='*/*', method='HEAD')
    if resp is None:
        raise SystemExit(f'database file for {month} not found')
    size = int(resp.headers['Content-Length']); etag = resp.headers.get('ETag'); resp.close()
    meta = {'month': month, 'url': db_url(month), 'size': size, 'etag': etag, 'points': POINTS, 'range_mb': RANGE_MB,
            'only_points': only, 'per_point': []}
    found = {}
    for i in range(POINTS):
        if only is not None and i not in only:
            continue
        off = int((i + 0.5) * size / POINTS); end = min(size - 1, off + int(RANGE_MB * 1024 * 1024) - 1)
        for tries in range(5):
            try:
                resp = net.open(db_url(month), accept='*/*', headers={'Range': f'bytes={off}-{end}'}, timeout=300)
                if resp is None or resp.status != 206 or resp.headers.get('ETag') != etag:
                    raise SystemExit(f'database range {i}: unexpected answer (file changed or no range support)')
                buf = resp.read(); resp.close(); break
            except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
                log(f'  range {i}: {e}; retry'); net.sleep(10 * (tries + 1))
        else:
            raise SystemExit(f'database range {i} failed 5 times')
        f, c = parse_sample(decompress(buf))
        for k, v in f.items():
            found[k] = found.get(k, 0) + v
        meta['per_point'].append({'point': i, 'offset': off, 'bytes': len(buf), **c})
        log(f'  {month} point {i}: {c["games"]} games, {c["games_10_0"]} rated 10+0, {len(f)} candidates')
    meta['candidates'] = len(found)
    json.dump(meta, open(os.path.join(d, 'meta.json'), 'w'), indent=1)
    with open(os.path.join(d, 'candidates.txt'), 'w') as fh:
        for uid in sorted(found):
            fh.write(f'{uid}\t{found[uid]}\n')
    return meta


def order_key(uid):
    return hashlib.sha256(f'{SALT}|{uid}'.encode()).hexdigest()


def candidates(work):
    """All sampled months, September first; inside a month in the fixed pseudo-random order; a player seen in an
    earlier month is not tried again."""
    out = []; seen = set(); months = []
    for m in MONTHS:
        p = os.path.join(work, f'sample-{m}', 'candidates.txt')
        if not os.path.exists(p):
            break
        if json.load(open(os.path.join(work, f'sample-{m}', 'meta.json'))).get('only_points') is not None and not PILOT_OK[0]:
            raise SystemExit(f'{p} is a pilot sample (some points only); use a fresh --work folder for the full run')
        ids = [l.split('\t')[0] for l in open(p) if l.strip()]
        months.append(m); j = 0
        for uid in sorted(ids, key=order_key):
            if uid not in seen:
                seen.add(uid); out.append((m, uid, j)); j += 1   # j: position inside this month's list
    return out, months


# ------------------------------------------------------------------ steps 2 and 3: saved API answers
def users_path(work, b):
    return os.path.join(work, 'users', f'{b[0]}-batch-{b[1]:05d}.json')


def games_path(work, uid):
    return os.path.join(work, 'games', f'{uid}.ndjson.gz')


def load_users(work, b):
    p = users_path(work, b)
    if not os.path.exists(p):
        return None
    return {u['id']: u for u in json.load(open(p))}


def fetch_users(work, b, ids, net):
    os.makedirs(os.path.dirname(users_path(work, b)), exist_ok=True)
    resp = net.open(f'{API}/api/users', data=','.join(ids).encode())
    if resp is None:   # saving '[]' would record up to 300 open accounts as closed, for good
        raise SystemExit('Lichess answered 404 to the account lookup; nothing was saved. Run again later; if it '
                         'persists, check the User-Agent and the API.')
    body = resp.read()
    tmp = users_path(work, b) + '.part'
    open(tmp, 'wb').write(body); os.replace(tmp, users_path(work, b))


def read_saved_games(work, uid):
    p = games_path(work, uid)
    if not os.path.exists(p):
        return None
    with gzip.open(p, 'rb') as fh:
        return [json.loads(l) for l in fh.read().decode().splitlines() if l.strip()]


def iter_lines(resp):
    """Lines of a streamed answer. Unlike iterating the response, this raises when a chunked stream is cut off
    (Python's readline silently treats a cut stream as a normal end, which would save half a history as whole)."""
    buf = b''
    while True:
        chunk = resp.read1(65536)
        if not chunk:
            if resp.length:            # a Content-Length answer that ended early
                raise http.client.IncompleteRead(buf)
            break
        buf += chunk
        *lines, buf = buf.split(b'\n')
        yield from lines
    if buf.strip():
        yield buf


def fetch_games(work, uid, created_ms, net):
    """Streams the player's rated rapid games oldest first and stops reading as soon as the rule has decided.
    Saves exactly the lines that were read (gzip, fixed header) so a rebuild reaches the same decision offline."""
    q = urllib.parse.urlencode({'rated': 'true', 'perfType': 'rapid', 'sort': 'dateAsc', 'moves': 'true',
                                'evals': 'false', 'accuracy': 'true', 'clocks': 'false', 'opening': 'false'})
    for attempt in range(4):
        resp = net.open(f'{API}/api/games/user/{urllib.parse.quote(uid)}?{q}', accept='application/x-ndjson')
        lines = []; games = []
        if resp is None:   # the account lookup said open: a 404 is not "no games", so save nothing (no name: logs are public)
            raise SystemExit('Lichess answered 404 for the game history of an account it lists as open; nothing was '
                             'saved for it. Run again later; if it persists, check the User-Agent and the API (or, if '
                             'the account was closed since, delete the work folder\'s users/ files so accounts are '
                             'looked up again).')
        try:
            for raw in iter_lines(resp):
                if not raw.strip():
                    continue
                g = json.loads(raw); g['_me'] = uid
                lines.append(raw); games.append(g)
                if evaluate(created_ms, games)[2]:
                    break      # settled: stop reading (the rest of the stream cannot change the outcome)
            break
        except (OSError, ValueError, http.client.HTTPException) as e:   # cut stream: ask again from the start
            if attempt == 3:
                raise
            log(f'  stream broke ({e!r}); asking again in {15 * (attempt + 1)} s'); net.sleep(15 * (attempt + 1))
        finally:
            resp.close()
    os.makedirs(os.path.dirname(games_path(work, uid)), exist_ok=True)
    tmp = games_path(work, uid) + '.part'
    with open(tmp, 'wb') as f:
        with gzip.GzipFile(filename='', mode='wb', fileobj=f, mtime=0) as z:
            z.write(b''.join(l + b'\n' for l in lines))
    os.replace(tmp, games_path(work, uid))


def walk(work, net=None, budget_s=None, max_exports=None):
    """Tries the candidates in their fixed order until 100 players are kept. With net=None nothing is fetched (build):
    the walk stops at the first answer that is not saved yet. Returns (kept players, step counts, state)."""
    cands, months = candidates(work)
    counts = {k: 0 for k, _ in STEPS}; kept = []; tos = 0
    start = time.time(); exports = 0; state = 'complete'; tried = 0
    users = {}
    for month, uid, j in cands:
        if len(kept) >= STOP_AT:
            break
        b = (month, j // USERS_PER_REQUEST)
        if b not in users:
            users[b] = load_users(work, b)
            if users[b] is None:
                if net is None:
                    state = 'incomplete'; break
                if budget_s is not None and time.time() - start > budget_s:
                    state = 'budget'; break
                fetch_users(work, b, [u for m, u, k in cands if m == month and k // USERS_PER_REQUEST == b[1]], net)
                users[b] = load_users(work, b)
        u = users[b].get(uid)
        outcome = prefilter(u)
        rows = []
        if outcome is None:
            games = read_saved_games(work, uid)
            if games is None:
                if net is None:
                    state = 'incomplete'; break
                if (budget_s is not None and time.time() - start > budget_s) or (max_exports is not None and exports >= max_exports):
                    state = 'budget'; break
                fetch_games(work, uid, u['createdAt'], net); exports += 1
                games = read_saved_games(work, uid)
            for g in games:
                g['_me'] = uid
            outcome, rows, _ = evaluate(u['createdAt'], games)
        counts[outcome] += 1; tried += 1
        if outcome == 'kept':
            tos += bool(u.get('tosViolation'))
            kept.append({'month': month, 'created_ms': u['createdAt'], 'rows': rows})
        if net is not None and tried % 25 == 0:
            log(f'  tried {tried} candidates, kept {len(kept)}, {net.requests} requests, {time.time() - start:.0f} s')
    if state == 'complete' and len(kept) < STOP_AT and len(cands) and tried == len(cands) and len(kept) < MIN_PLAYERS:
        state = 'needs_older_month'
    return kept, counts, {'state': state, 'tried': tried, 'candidates': len(cands), 'months': months,
                          'exports_this_run': exports, 'tos_flagged_kept': tos}


# ------------------------------------------------------------------ step 4: the numbers
def player_stats(rows):
    out = {}
    for name, w in (('base', BASE), ('look1', LOOK1), ('train', TRAIN)):
        r = ratio(analysed_rows(rows, w))
        out[name] = r
    out['change'] = out['train']['rate'] - out['base']['rate']
    out['change_var'] = out['base']['var'] + out['train']['var']
    out['change_look1'] = out['look1']['rate'] - out['base']['rate'] if out['look1']['rate'] is not None else None
    out['change_look1_var'] = (out['base']['var'] + out['look1']['var']) if out['look1']['var'] is not None else None
    return out


def mean(v):
    return sum(v) / len(v)


def svar(v):
    m = mean(v); return sum((x - m) ** 2 for x in v) / (len(v) - 1)


def summary(changes, sampling_vars, seed=SEED):
    """c, its player-bootstrap SE s, and the block-method drift SD d (floored at 0), plus descriptive bounds."""
    n = len(changes)
    c = mean(changes)
    rng = random.Random(seed)
    boots = []; dboots = []
    for _ in range(BOOT):
        ix = [int(rng.random() * n) for _ in range(n)]
        ch = [changes[i] for i in ix]
        boots.append(mean(ch))
        dboots.append(max(0.0, svar(ch) - mean([sampling_vars[i] for i in ix])))
    mb = mean(boots)
    s = math.sqrt(sum((x - mb) ** 2 for x in boots) / len(boots))
    d2 = svar(changes) - mean(sampling_vars)
    dboots.sort(); boots.sort()
    return {'mean_change': c, 'mean_change_se': s, 'drift_sd': math.sqrt(max(0.0, d2)), 'drift_variance_raw': d2,
            'sd_of_change': math.sqrt(svar(changes)), 'sampling_sd_of_change': math.sqrt(mean(sampling_vars)),
            'mean_change_range90': [boots[int(.05 * BOOT)], boots[int(.95 * BOOT) - 1]],
            'drift_sd_upper95': math.sqrt(dboots[int(.95 * BOOT) - 1])}


def r4(x):
    return None if x is None else round(x, 4)


def build(work, out_dir, mode):
    kept, counts, st = walk(work)
    if st['state'] != 'complete' and mode == 'final':
        raise SystemExit(f"not finished: {st['state']} after {st['tried']} of {st['candidates']} candidates "
                         f"({len(kept)} kept). Run fetch again, or build --finalize if game 41 is close (a deviation).")
    os.makedirs(out_dir, exist_ok=True)
    stats = [player_stats(p['rows']) for p in kept]
    res = {'what': 'Matched Lichess newcomers: their own change in Lichess blunders per 100 moves between rated 10+0 '
                   'games 11-40 and 61-160 (preregistration.md 3.6, S6). Read by prereg/verdict.py --newcomers.',
           'pipeline': PIPELINE, 'players': len(kept)}
    if len(kept) >= 2:
        s = summary([x['change'] for x in stats], [x['change_var'] for x in stats])
        res.update({'mean_change': r4(s['mean_change']), 'mean_change_se': r4(s['mean_change_se']), 'drift_sd': r4(s['drift_sd'])})
    else:
        s = None
    res['binding_if'] = (f'committed before the start of his game U+1 (41 when U = 40) with {MIN_PLAYERS}+ players '
                         f'(verdict.py needs players >= {MIN_PLAYERS}); this file: {len(kept)} players')
    res['status'] = {'complete': st['state'] == 'complete', 'state': st['state'],
                     'finalized_early': mode == 'finalize' and st['state'] != 'complete', 'pilot': mode == 'pilot',
                     'target_players': TARGET, 'stop_at_players': STOP_AT}
    res['rule'] = {'candidates': f'non-BOT players rated {BAND[0]}-{BAND[1]} (own pre-game rating) in a rated {TC} game '
                                 f'of the database sample, months tried in this order: {", ".join(st["months"])}',
                   'newcomer': f'account created at most {MAX_DAYS} days before the first rated 10+0 game; at least '
                               f'{MIN_GAMES} rated 10+0 games, numbered with prereg measure.py eligible()',
                   'blunders': "Lichess's own count (players.<colour>.analysis.blunder) on games Lichess analysed; "
                               'rates per 100 own moves pooled per window with prereg verdict.py ratio()',
                   'windows': {'baseline': list(BASE), 'training': list(TRAIN), 'look_1_descriptive': list(LOOK1)},
                   'keep': f'{BASE_MIN}+ analysed games in {BASE[0]}-{BASE[1]} and {TRAIN_MIN}+ in {TRAIN[0]}-{TRAIN[1]}',
                   'order': f'sha256("{SALT}|" + user id), ascending; stop at {STOP_AT} players',
                   'mean_change': 'mean over players of (rate in 61-160 minus rate in 11-40); negative = they improve',
                   'mean_change_se': f'player bootstrap, {BOOT} resamples, seed {SEED}',
                   'drift_sd': 'sqrt(max(0, sample variance of the change minus mean ratio-method sampling variance))'}
    res['steps'] = {'candidates_in_sample': st['candidates'], 'candidates_tried': st['tried'],
                    **{f'dropped: {label}': counts[k] for k, label in STEPS if k != 'kept'}, 'kept': counts['kept']}
    samples = []
    for m in st['months']:
        meta = json.load(open(os.path.join(work, f'sample-{m}', 'meta.json')))
        pp = meta['per_point']
        samples.append({'month': m, 'file_bytes': meta['size'], 'etag': meta['etag'], 'points_used': len(pp),
                        'points_of': meta['points'], 'range_mb': meta['range_mb'],
                        'games': sum(p['games'] for p in pp), 'rated_10_0_games': sum(p['games_10_0'] for p in pp),
                        'in_band_player_games': sum(p['player_games_in_band'] for p in pp), 'candidates': meta['candidates'],
                        'utc_span': [min(p['first_utc'] for p in pp if p['first_utc']), max(p['last_utc'] for p in pp if p['last_utc'])]})
    res['database_sample'] = samples
    if s:
        ys = {}
        for p in kept:
            y = time.strftime('%Y', time.gmtime(p['rows'][0]['t'] / 1000)); ys[y] = ys.get(y, 0) + 1
        base_rates = sorted(x['base']['rate'] for x in stats); train_rates = sorted(x['train']['rate'] for x in stats)
        l1 = [(x['change_look1'], x['change_look1_var']) for x in stats if x['change_look1'] is not None and x['look1']['games'] >= 2]
        s1 = summary([a for a, _ in l1], [b for _, b in l1]) if len(l1) >= 2 else None
        ages = sorted((p['rows'][0]['t'] - p['created_ms']) / DAY_MS for p in kept)
        res['descriptive'] = {
            'baseline_rate_mean': r4(mean(base_rates)), 'training_rate_mean': r4(mean(train_rates)),
            'mean_change_range90_bootstrap': [r4(x) for x in s['mean_change_range90']],
            'sd_of_change_across_players': r4(s['sd_of_change']), 'sampling_sd_of_change': r4(s['sampling_sd_of_change']),
            'drift_variance_before_floor': r4(s['drift_variance_raw']), 'drift_sd_upper95_bootstrap': r4(s['drift_sd_upper95']),
            'analysed_games_per_player_median': {'11-40': median([x['base']['games'] for x in stats]),
                                                 '61-160': median([x['train']['games'] for x in stats])},
            'days_from_account_to_first_10_0_game_median': r4(median(ages)),
            'year_of_first_rated_10_0_game': dict(sorted(ys.items())),
            'kept_accounts_marked_for_terms_violation': st['tos_flagged_kept'],
            'look_1_window_61_110': ({'players': len(l1), 'mean_change': r4(s1['mean_change']), 'mean_change_se': r4(s1['mean_change_se']),
                                      'drift_sd': r4(s1['drift_sd'])} if s1 else None),
        }
    res['answers_saved'] = fetch_span(work)
    name = 'pilot-newcomers.json' if mode == 'pilot' else 'newcomers.json'
    with open(os.path.join(out_dir, name), 'w') as f:
        f.write(json.dumps(res, indent=1, ensure_ascii=True) + '\n')
    cols = ['player', 'days_account_to_first_10_0_game']
    for w in ('11_40', '61_160', '61_110'):
        cols += [f'analysed_games_{w}', f'moves_{w}', f'blunders_{w}', f'rate_{w}', f'sampling_var_{w}']
    cols += ['change_61_160', 'change_61_110']
    with open(os.path.join(out_dir, 'pilot-players.csv' if mode == 'pilot' else 'players.csv'), 'w', newline='') as f:
        wr = csv.writer(f, lineterminator='\n'); wr.writerow(cols)
        for k, (p, x) in enumerate(zip(kept, stats), 1):
            row = [f'N{k:03d}', int((p['rows'][0]['t'] - p['created_ms']) // DAY_MS)]
            for key in ('base', 'train', 'look1'):
                r = x[key]; row += [r['games'], r['moves'], r['events'], fmt(r['rate']), fmt(r['var'])]
            row += [fmt(x['change']), fmt(x['change_look1'])]
            wr.writerow(row)
    return res, st


def median(v):
    v = sorted(v); n = len(v)
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2


def fmt(x):
    return '' if x is None else f'{x:.6f}'


def fetch_span(work):
    """When the saved answers were fetched (from the fetch log), so the output never depends on when it is built."""
    p = os.path.join(work, 'fetch-log.jsonl')
    if not os.path.exists(p):
        return None
    days = [json.loads(l)['utc'][:10] for l in open(p) if l.strip()]
    return {'first_utc_day': min(days), 'last_utc_day': max(days), 'fetch_runs': len(days)} if days else None


# ------------------------------------------------------------------ privacy scan
def scan(work, files):
    """Every username in the candidate lists and every game id in the saved answers, searched as whole tokens
    (case-insensitive) in the files that will be committed. Returns the hits."""
    names = set()
    for d in os.listdir(work):
        p = os.path.join(work, d, 'candidates.txt')
        if d.startswith('sample-') and os.path.exists(p):
            names |= {l.split('\t')[0] for l in open(p) if l.strip()}
    ids = set()
    gd = os.path.join(work, 'games')
    for fn in (os.listdir(gd) if os.path.isdir(gd) else []):
        with gzip.open(os.path.join(gd, fn), 'rb') as fh:
            for l in fh.read().decode().splitlines():
                if l.strip():
                    g = json.loads(l); ids.add(g['id'].lower())
                    for c in ('white', 'black'):
                        uid = (g['players'][c].get('user') or {}).get('id')
                        if uid:
                            names.add(uid)
    hits = []
    for f in expand(files):
        text = open(f, encoding='utf-8', errors='replace').read().lower()
        toks = set(re.findall(r'[a-z0-9_-]+', text))
        hits += [(f, 'username', t) for t in sorted(toks & names)]
        hits += [(f, 'game id', t) for t in sorted(toks & ids)]
    return hits, len(names), len(ids)


def expand(paths):
    """The files to scan: a folder stands for every file under it (so `scan newcomers/*` also covers power/)."""
    out = []
    for p in paths:
        out += sorted(os.path.join(r, f) for r, _, fs in os.walk(p) for f in fs) if os.path.isdir(p) else [p]
    return out


# ------------------------------------------------------------------ prereg hashes
def check_prereg_hashes():
    """measure.py and verdict.py must still match the SHA-256 table in preregistration.md 3.9."""
    md = open(os.path.join(HERE, '..', 'preregistration.md')).read()
    for name in ('measure.py', 'verdict.py'):
        m = re.search(r'\| ' + re.escape(name) + r' \| ([0-9a-f]{64}) \|', md)
        got = hashlib.sha256(open(os.path.join(PREREG, name), 'rb').read()).hexdigest()
        if not m or m.group(1) != got:
            raise SystemExit(f'prereg/{name} does not match its SHA-256 in preregistration.md 3.9; refusing to run')


def default_work():
    return os.path.join(os.path.expanduser('~'), '.cache', 'chess-project-newcomers')


def check_work(work):
    """The work folder holds usernames and game ids: never inside the repository."""
    repo = os.path.realpath(os.path.join(HERE, '..', '..', '..'))
    w = os.path.realpath(work)
    if os.path.exists(os.path.join(repo, '.git')) and (w == repo or w.startswith(repo + os.sep)):
        raise SystemExit(f'--work {work} is inside the repository; use a folder outside it (it holds usernames)')
    os.makedirs(work, exist_ok=True)


def note_fetch_run(work, net, st):
    if not net.requests:
        return   # nothing was asked: the log (and newcomers.json's 'answers_saved') stays as it is
    with open(os.path.join(work, 'fetch-log.jsonl'), 'a') as f:
        f.write(json.dumps({'utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'requests': net.requests,
                            'waits_429': len(net.waits), 'state': st['state'], 'tried': st['tried']}) + '\n')


def fetch(work, net, budget_s=None, max_exports=None, allow_older=True):
    """Tries candidates until 100 are kept; samples an older month only if fewer than 30 qualify after all."""
    while True:
        kept, counts, st = walk(work, net, budget_s, max_exports)
        if st['state'] == 'needs_older_month' and allow_older:
            nxt = MONTHS[len(st['months'])] if len(st['months']) < len(MONTHS) else None
            if nxt is None:
                break
            log(f'fewer than {MIN_PLAYERS} qualify after every candidate: adding the {nxt} database sample')
            sample(work, nxt, net)
            continue
        break
    note_fetch_run(work, net, st)
    log(f"fetch: {st['state']}; tried {st['tried']} of {st['candidates']} candidates, kept {len(kept)}; "
        f"{net.requests} requests this run, {len(net.waits)} waits after 429")
    return kept, counts, st


def main():
    ap = argparse.ArgumentParser(description='Matched newcomers (preregistration.md 3.6)')
    ap.add_argument('cmd', choices=['run', 'sample', 'fetch', 'build', 'scan', 'selftest'])
    ap.add_argument('files', nargs='*')
    ap.add_argument('--work', default=default_work())
    ap.add_argument('--out', default=HERE)
    ap.add_argument('--month', default=MONTHS[0])
    ap.add_argument('--only-points', help='comma-separated sample points (pilot only)')
    ap.add_argument('--budget-minutes', type=float)
    ap.add_argument('--max-exports', type=int, help='at most this many game exports this run (pilot only)')
    ap.add_argument('--pilot', action='store_true', help='write pilot-newcomers.json and pilot-players.csv')
    ap.add_argument('--finalize', action='store_true', help='write newcomers.json from the players kept so far (deadline)')
    a = ap.parse_intermixed_args()   # options before, between or after the file names
    if a.cmd == 'selftest':
        import importlib.util
        spec = importlib.util.spec_from_file_location('newcomers_selftest', os.path.join(HERE, 'selftest.py'))
        mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
        mod.run(sys.modules[__name__]); return 0
    check_prereg_hashes()
    if a.cmd == 'scan':
        hits, nn, ni = scan(a.work, a.files)
        for f, kind, t in hits:   # GitHub Actions logs are public on a public repository: shorten the token there
            shown = t if os.environ.get('GITHUB_ACTIONS') != 'true' else f'{t[:2]}... ({len(t)} characters)'
            print(f'HIT {kind}: {shown!r} in {f}')
        print(f'privacy scan: {len(hits)} hits in {len(expand(a.files))} files ({nn} usernames and {ni} game ids checked)')
        return 1 if hits else 0
    check_work(a.work)
    PILOT_OK[0] = a.pilot
    net = Net()
    only = [int(x) for x in a.only_points.split(',')] if a.only_points else None
    if a.cmd in ('sample', 'run') and not os.path.exists(os.path.join(a.work, f'sample-{a.month}', 'candidates.txt')):
        sample(a.work, a.month, net, only)
    if a.cmd == 'sample':
        return 0
    budget = a.budget_minutes * 60 if a.budget_minutes else None
    if a.cmd in ('fetch', 'run'):
        _, _, st = fetch(a.work, net, budget, a.max_exports, allow_older=not a.pilot and only is None)
        if a.cmd == 'fetch':
            return 0 if st['state'] == 'complete' else 3
        if st['state'] != 'complete' and not (a.pilot or a.finalize):
            return 3
    mode = 'pilot' if a.pilot else 'finalize' if a.finalize else 'final'
    res, st = build(a.work, a.out, mode)
    log(json.dumps({k: res.get(k) for k in ('players', 'mean_change', 'mean_change_se', 'drift_sd')}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
