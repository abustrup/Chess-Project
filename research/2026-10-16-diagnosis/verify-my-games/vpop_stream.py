"""Independent population re-derivation (written from scratch). Reads a byte range of the monthly Lichess database
(zstd) on stdin, keeps rated games where both players are 950-1250, speed blitz or rapid, with Lichess %eval
annotations, and writes ONE JSON line per game with only derived numbers (no usernames, no moves).
Usage: curl -s -A "<browser UA>" -r START-END URL | python -I vpop_stream.py OUT.jsonl"""
import sys, re, io, json, math
import zstandard
MAGIC = b'\x28\xb5\x2f\xfd'
data = sys.stdin.buffer.read()
out = open(sys.argv[1], 'w')

def wp(cp):  # Lichess win% for White from centipawns
    return 50 + 50 * (2 / (1 + math.exp(-0.00368208 * cp)) - 1)

def speed(tc):
    try: base, inc = tc.split('+'); est = int(base) + 40 * int(inc)
    except Exception: return None
    if est < 29: return 'ultrabullet'
    if est < 179: return 'bullet'
    if est < 479: return 'blitz'
    if est < 1499: return 'rapid'
    return 'classical'

EV = re.compile(r'\[%eval ([^\]\s]+)')

def decode(text):
    seen = kept = 0
    hdr = {}
    for line in text:
        if line.startswith('['):
            m = re.match(r'\[(\w+) "(.*)"\]', line)
            if m: hdr[m.group(1)] = m.group(2)
            continue
        if not line.strip() or not hdr: continue
        seen += 1
        h = hdr; hdr = {}
        try: we, be = int(h.get('WhiteElo', 0)), int(h.get('BlackElo', 0))
        except ValueError: continue
        sp = speed(h.get('TimeControl', ''))
        if not (950 <= we <= 1250 and 950 <= be <= 1250 and sp in ('blitz', 'rapid')): continue
        if 'rated' not in h.get('Event', '').lower(): continue
        res = h.get('Result')
        if res not in ('1-0', '0-1', '1/2-1/2'): continue
        if '%eval' not in line: continue
        evs = EV.findall(line)
        # count plies: tokens like "12." mark move numbers; count SAN moves by stripping comments
        mt = re.sub(r'\{[^}]*\}', ' ', line)
        mt = re.sub(r'\d+\.(\.\.)?', ' ', mt)
        toks = [t for t in mt.split() if t not in ('1-0', '0-1', '1/2-1/2', '*')]
        n = len(toks)
        mated = toks[-1].endswith('#') if toks else False
        vals = []
        for e in evs:
            if e.startswith('#'):
                m = int(e[1:]); vals.append(('m', m))
            else:
                vals.append(('c', round(float(e) * 100)))
        if len(vals) < n - 1: continue  # partial analysis
        out.write(json.dumps({'speed': sp, 'res': res, 'n': n, 'mated_last': mated, 'ev': vals[:n]}) + '\n')
        kept += 1
    return seen, kept

i = data.find(MAGIC)
while i >= 0:
    try:
        reader = zstandard.ZstdDecompressor().stream_reader(io.BytesIO(data[i:]), read_across_frames=True)
        text = io.TextIOWrapper(reader, encoding='utf-8', errors='replace')
        # skip to first complete game
        first = True
        def lines():
            started = False
            for line in text:
                if not started:
                    if line.startswith('[Event '): started = True
                    else: continue
                yield line
        try:
            s, k = decode(lines())
        except zstandard.ZstdError as e:
            print('stream ended:', e, file=sys.stderr); s = k = None
        print('frame start at', i, 'seen', s, 'kept', k, file=sys.stderr)
        break
    except zstandard.ZstdError as e:
        print('bad frame start at', i, e, file=sys.stderr)
        i = data.find(MAGIC, i + 1)
