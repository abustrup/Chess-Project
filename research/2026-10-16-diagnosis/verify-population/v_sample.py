# Independent re-sample of the Lichess September 2026 monthly database (written from scratch for the check;
# it does not import or copy the population scripts).
# Different sample range: 96 byte ranges of 6 MB starting at k * SIZE / 96 (k = 0..95). The population run used
# 10 MB ranges starting at (k + 0.5) * SIZE / 96, so the two samples never overlap (152 MB apart, about 3.5 hours
# of play) but cover the same 30 days.
# Writes one JSON line per game where at least one player was rated 850-1350 before the game and the time control
# is blitz or rapid. Usernames stay in the scratch output only.
# usage: .venv/bin/python -I v_sample.py OUT.jsonl [N_SLICES] [MB] [PHASE]
import sys, io, re, json, urllib.request, concurrent.futures as cf
import zstandard

URL = 'https://database.lichess.org/standard/lichess_db_standard_rated_2026-09.pgn.zst'
SIZE = 29224520887
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
OUT = sys.argv[1]
N = int(sys.argv[2]) if len(sys.argv) > 2 else 96
MB = float(sys.argv[3]) if len(sys.argv) > 3 else 6
PHASE = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
FRAME = b'\x28\xb5\x2f\xfd'

def get_range(a, b):
    req = urllib.request.Request(URL, headers={'User-Agent': UA, 'Range': f'bytes={a}-{b}'})
    for _ in range(4):
        try:
            return urllib.request.urlopen(req, timeout=300).read()
        except Exception as e:
            print('retry', a, e, flush=True)
    return b''

def decompress(buf):
    pos = 0
    while True:
        k = buf.find(FRAME, pos)
        if k < 0: return ''
        out = []
        try:
            rd = zstandard.ZstdDecompressor().stream_reader(io.BytesIO(buf[k:]), read_across_frames=True)
            while True:
                c = rd.read(1 << 20)
                if not c: break
                out.append(c)
        except zstandard.ZstdError:
            pass
        if sum(len(c) for c in out) > 100000:
            return b''.join(out).decode('utf-8', 'replace')
        pos = k + 4  # false frame marker, try the next one

def speed(tc):
    m = re.fullmatch(r'(\d+)\+(\d+)', tc or '')
    if not m: return None
    t = int(m.group(1)) + 40 * int(m.group(2))
    return 'blitz' if 180 <= t < 480 else 'rapid' if 480 <= t < 1500 else None

HEAD = re.compile(r'^\[(\w+) "(.*)"\]$')
TOKEN = re.compile(r'\{[^}]*\}|\S+')
SAN = re.compile(r'^([KQRBNOa-h][A-Za-z0-9=+#\-]*?)(\?\?|\?!|!\?|\?|!!|!)?$')
EV = re.compile(r'\[%eval ([^\]\s]+)\]')

def moves_of(text):
    """list of [glyph, eval-string or None] per ply, in ply order (white = even index)"""
    plies = []
    for t in TOKEN.findall(text):
        if t[0] == '{':
            if plies:
                m = EV.search(t)
                if m: plies[-1][1] = m.group(1)
            continue
        if t in ('1-0', '0-1', '1/2-1/2', '*') or t[0].isdigit():
            continue
        m = SAN.match(t)
        if not m:
            continue
        plies.append([m.group(2) or '', None])
    return plies

def games_of(text):
    lines = text.split('\n')
    i = 0; n = len(lines)
    # skip to the first complete header block
    while i < n and not lines[i].startswith('[Event '): i += 1
    while i < n:
        h = {}
        while i < n and lines[i].startswith('['):
            m = HEAD.match(lines[i])
            if m: h[m.group(1)] = m.group(2)
            i += 1
        while i < n and not lines[i].strip(): i += 1
        mv = []
        while i < n and lines[i].strip() and not lines[i].startswith('[Event '):
            mv.append(lines[i]); i += 1
        while i < n and not lines[i].startswith('[Event '): i += 1
        complete = i < n  # a following game exists, so this one is not cut off
        if complete: yield h, ' '.join(mv)

def work(k):
    a = int((k + PHASE) * SIZE / N)
    b = min(SIZE - 1, a + int(MB * 1024 * 1024) - 1)
    text = decompress(get_range(a, b))
    recs = []; ngames = 0; t0 = t1 = None
    first = True
    for h, mv in games_of(text):
        if first:  # the first header block may be cut at the start; drop it
            first = False; continue
        ngames += 1
        t = h.get('UTCDate', '') + ' ' + h.get('UTCTime', '')
        t0 = t0 or t; t1 = t
        sp = speed(h.get('TimeControl'))
        if not sp: continue
        try: we, be = int(h['WhiteElo']), int(h['BlackElo'])
        except Exception: continue
        if not (850 <= we <= 1350 or 850 <= be <= 1350): continue
        pl = moves_of(mv)
        an = any(p[1] is not None for p in pl)
        recs.append(dict(sl=k, id=h.get('Site', '').rsplit('/', 1)[-1], t=t, tc=h['TimeControl'], sp=sp,
                         w=h.get('White'), b=h.get('Black'), we=we, be=be, res=h.get('Result'), term=h.get('Termination'),
                         n=len(pl), an=an, g=''.join({'??': 'B', '?': 'M', '?!': 'I'}.get(p[0], '.') for p in pl),
                         ev=[p[1] for p in pl] if an else None))
    return k, a, ngames, t0, t1, recs

if __name__ == '__main__':
    meta = []
    with open(OUT, 'w') as fh, cf.ThreadPoolExecutor(4) as ex:
        for k, a, ng, t0, t1, recs in ex.map(work, range(N)):
            for r in recs: fh.write(json.dumps(r) + '\n')
            meta.append(dict(slice=k, offset=a, games=ng, first=t0, last=t1, kept=len(recs)))
            print(k, a, ng, t0, t1, len(recs), flush=True)
    json.dump(meta, open(OUT + '.meta.json', 'w'), indent=1)
