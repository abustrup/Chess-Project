# Sample the Lichess September 2026 standard rated database by byte ranges spread over the whole month.
# For every sample point: fetch RANGE_MB of the .zst file, start at the first zstd frame inside it,
# decompress what is there, drop the partial first and last game, and write one row per player-game
# for blitz and rapid games where that player was rated 900-1300 before the game.
# Rows keep usernames ONLY in the scratch output (needed to pick a comparison group); nothing here
# goes into the repo except aggregates.
#
# usage: .venv/bin/python -I sample_db.py OUT_DIR [N_POINTS] [RANGE_MB]
import sys, os, re, io, json, subprocess, concurrent.futures as cf, math
import zstandard

URL = 'https://database.lichess.org/standard/lichess_db_standard_rated_2026-09.pgn.zst'
SIZE = 29224520887
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
MAGIC = bytes([0x28, 0xB5, 0x2F, 0xFD])
out_dir = sys.argv[1]
N = int(sys.argv[2]) if len(sys.argv) > 2 else 96
RANGE = int(float(sys.argv[3]) * 1024 * 1024) if len(sys.argv) > 3 else 10 * 1024 * 1024
os.makedirs(out_dir, exist_ok=True)

HDR = re.compile(r'\[(\w+) "([^"]*)"\]')
# a move token, optional glyph, optional comment
TOK = re.compile(r'(\d+)(\.|\.\.\.)\s+([^\s{}]+?)(\?\?|\?!|!\?|\?|!!|!)?\s+(?:\{([^}]*)\})?')
EVAL = re.compile(r'%eval ([#\-\d\.]+)')
CLK = re.compile(r'%clk (\d+):(\d+):(\d+)')

def speed(tc):
    if '+' not in tc: return None
    b, i = tc.split('+')
    est = int(b) + 40 * int(i)
    if 180 <= est < 480: return 'blitz'
    if 480 <= est < 1500: return 'rapid'
    return None

# ---- Lichess's own rule (lila modules/analyse Advice.scala), replicated from %eval for a cross-check ----
def wc(cp):  # winning chances in [-1, 1], cp capped at +-1000 like lila's Cp.ceiled
    cp = max(-1000, min(1000, cp))
    return 2 / (1 + math.exp(-0.00368208 * cp)) - 1

def parse_eval(s):
    if s.startswith('#'):
        return ('mate', int(s[1:]))
    return ('cp', round(float(s) * 100))

def judge(prev, cur, white_moved, rule='db'):
    """prev/cur: ('cp', x) or ('mate', n), white POV. returns 'blunder'/'mistake'/'inaccuracy'/None for the mover.
    Two Lichess rules exist and they disagree (README, verified 2026-10-16):
      rule='api': what lichess.org shows on the game page and returns from the games API (players.*.analysis,
                  per-move "judgment"): lila Advice.scala, the mover's winning chances drop (cp capped at
                  +-1000) >= 0.3 blunder, >= 0.2 mistake, >= 0.1 inaccuracy.
      rule='db':  the ?? / ? / ?! glyphs written into the monthly database files: the move is marked only when
                  winning chances (uncapped cp) drop >= 0.1, and graded by centipawn loss with cp capped at
                  +-1000: >= 300 blunder, >= 100 mistake, >= 50 inaccuracy (fitted on 587,140 moves).
    Mate transitions follow lila MateAdvice in both."""
    sgn = 1 if white_moved else -1
    pm = prev[1] * sgn if prev[0] == 'mate' else None
    nm = cur[1] * sgn if cur[0] == 'mate' else None
    pcp = prev[1] * sgn if prev[0] == 'cp' else 0
    ncp = cur[1] * sgn if cur[0] == 'cp' else 0
    seq = None
    if pm is None and nm is not None and nm < 0: seq = 'created'
    elif pm is not None and pm > 0 and nm is None: seq = 'lost'
    elif pm is not None and nm is not None and pm > 0 and nm < 0: seq = 'lost'
    if seq == 'created':
        return 'inaccuracy' if pcp < -999 else 'mistake' if pcp < -700 else 'blunder'
    if seq == 'lost':
        return 'inaccuracy' if ncp > 999 else 'mistake' if ncp > 700 else 'blunder'
    if prev[0] == 'cp' and cur[0] == 'cp':
        p, c = prev[1] * sgn, cur[1] * sgn
        if rule == 'api':
            d = wc(p) - wc(c)
            if d >= 0.3: return 'blunder'
            if d >= 0.2: return 'mistake'
            if d >= 0.1: return 'inaccuracy'
            return None
        if wc_raw(p) - wc_raw(c) < 0.1: return None
        loss = max(-1000, min(1000, p)) - max(-1000, min(1000, c))
        if loss >= 300: return 'blunder'
        if loss >= 100: return 'mistake'
        if loss >= 50: return 'inaccuracy'
    return None

def wc_raw(cp):
    return 2 / (1 + math.exp(-0.00368208 * cp)) - 1

def parse_game(text):
    """text = one game starting at '[Event'. returns header dict and per-side stats or None"""
    hpart, _, mpart = text.partition('\n\n')
    h = dict(HDR.findall(hpart))
    if 'Event' not in h or not mpart.strip(): return None
    return h, mpart

def side_stats(mpart, base_secs, evs=None):
    toks = TOK.findall(mpart)
    st = {'w': dict(moves=0, evals=0, nag_bl=0, nag_mi=0, nag_in=0, rule_bl=0, rule_mi=0, rule_in=0, api_bl=0, api_mi=0, api_in=0, api_bl_early=0, api_clk_low_bl=0,
                    bl_early=0, clk_low_moves=0, clk_low_bl=0),
          'b': None}
    st['b'] = dict(st['w'])
    prev = ('cp', 15)  # lila Info.start uses Cp.initial = 15
    have_prev = True
    for num, dots, san, glyph, com in toks:
        side = 'w' if dots == '.' else 'b'
        s = st[side]
        s['moves'] += 1
        com = com or ''
        m = EVAL.search(com)
        if glyph == '??': s['nag_bl'] += 1
        elif glyph == '?': s['nag_mi'] += 1
        elif glyph == '?!': s['nag_in'] += 1
        if glyph == '??' and int(num) <= 12: s['bl_early'] += 1
        c = CLK.search(com)
        low = False
        if c and base_secs:
            secs = int(c.group(1)) * 3600 + int(c.group(2)) * 60 + int(c.group(3))
            low = secs < 0.1 * base_secs
        if low:
            s['clk_low_moves'] += 1
            if glyph == '??': s['clk_low_bl'] += 1
        if evs is not None: evs.append(m.group(1) if m else None)
        if m:
            s['evals'] += 1
            cur = parse_eval(m.group(1))
            if have_prev:
                j = judge(prev, cur, side == 'w')
                if j == 'blunder': s['rule_bl'] += 1
                elif j == 'mistake': s['rule_mi'] += 1
                elif j == 'inaccuracy': s['rule_in'] += 1
                ja = judge(prev, cur, side == 'w', 'api')
                if ja == 'blunder':
                    s['api_bl'] += 1
                    if int(num) <= 12: s['api_bl_early'] += 1
                    if low: s['api_clk_low_bl'] += 1
                elif ja == 'mistake': s['api_mi'] += 1
                elif ja == 'inaccuracy': s['api_in'] += 1
            prev = cur; have_prev = True
        else:
            have_prev = False
    return st

def fetch(i):
    off = int((i + 0.5) * SIZE / N)
    end = min(SIZE - 1, off + RANGE - 1)
    p = subprocess.run(['curl', '-s', '--retry', '3', '-A', UA, '-r', f'{off}-{end}', URL], capture_output=True)
    data = p.stdout
    k = data.find(MAGIC)
    if k < 0: return i, off, ''
    r = zstandard.ZstdDecompressor().stream_reader(io.BytesIO(data[k:]), read_across_frames=True)
    chunks = []
    try:
        while True:
            c = r.read(1 << 20)
            if not c: break
            chunks.append(c)
    except zstandard.ZstdError:
        pass
    return i, off, b''.join(chunks).decode('utf-8', 'replace')

def process(i, off, text):
    games = text.split('\n\n[Event ')
    games = games[1:-1]  # drop partial first and last
    rows = []; counts = dict(games=0, first=None, last=None)
    for g in games:
        pg = parse_game('[Event ' + g)
        if not pg: continue
        h, mpart = pg
        counts['games'] += 1
        t = h.get('UTCDate', '') + ' ' + h.get('UTCTime', '')
        if counts['first'] is None: counts['first'] = t
        counts['last'] = t
        tc = h.get('TimeControl', '-')
        sp = speed(tc)
        if sp is None: continue
        try:
            we, be = int(h.get('WhiteElo', 'x')), int(h.get('BlackElo', 'x'))
        except ValueError:
            continue
        if not (900 <= we <= 1300 or 900 <= be <= 1300): continue
        base = int(tc.split('+')[0])
        analysed = '%eval' in mpart
        evs = [] if analysed else None
        st = side_stats(mpart, base, evs)
        res = h.get('Result')
        for side, elo, oelo, name, rd in (('w', we, be, h.get('White'), h.get('WhiteRatingDiff')),
                                          ('b', be, we, h.get('Black'), h.get('BlackRatingDiff'))):
            if not 900 <= elo <= 1300: continue
            score = {'1-0': 1.0, '0-1': 0.0, '1/2-1/2': 0.5}.get(res)
            if score is not None and side == 'b': score = 1 - score
            s = st[side]
            rows.append(dict(pt=i, t=t, sp=sp, tc=tc, side=side, elo=elo, oelo=oelo, user=name, score=score,
                             rd=int(rd) if rd and rd.lstrip('+-').isdigit() else None,
                             term=h.get('Termination'), an=analysed, site=h.get('Site', '')[-8:],
                             plies=st['w']['moves'] + st['b']['moves'], evs=evs, **s))
    return rows, counts

if __name__ == '__main__':
    allrows = []; meta = []
    with cf.ThreadPoolExecutor(4) as ex:
        futs = [ex.submit(fetch, i) for i in range(N)]
        for f in cf.as_completed(futs):
            i, off, text = f.result()
            rows, counts = process(i, off, text)
            allrows += rows
            meta.append(dict(pt=i, offset=off, **counts))
            print(i, off, counts, len(rows), flush=True)
    with open(os.path.join(out_dir, 'rows.jsonl'), 'w') as fh:
        for r in allrows: fh.write(json.dumps(r) + '\n')
    json.dump(sorted(meta, key=lambda m: m['pt']), open(os.path.join(out_dir, 'meta.json'), 'w'), indent=1)
