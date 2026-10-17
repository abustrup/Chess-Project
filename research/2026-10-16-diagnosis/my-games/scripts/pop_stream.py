# Streams a byte range of the monthly Lichess database (zstd, multi-frame) from stdin and keeps rated games where
# BOTH players are 950-1250, speed is blitz or rapid (research/2026-10-16 speed rule, classical pooled with rapid),
# and Lichess's own %eval annotations are present. Output: PGN (kept in a scratch folder, never in the repo).
# Usage: curl -s -A "<browser UA>" -r START-END https://database.lichess.org/standard/lichess_db_standard_rated_2026-09.pgn.zst \
#          | .venv/bin/python -I scripts/pop_stream.py OUT.pgn
import sys, re, io
import zstandard
raw = sys.stdin.buffer
buf = raw.read(1 << 20)
i = buf.find(b'\x28\xb5\x2f\xfd')
class Chain(io.RawIOBase):
    def __init__(self, first, rest): self.first = first; self.rest = rest
    def readable(self): return True
    def readinto(self, b):
        if self.first:
            n = min(len(b), len(self.first)); b[:n] = self.first[:n]; self.first = self.first[n:]; return n
        d = self.rest.read(len(b))
        if not d: return 0
        b[:len(d)] = d; return len(d)
reader = zstandard.ZstdDecompressor().stream_reader(Chain(buf[i:], raw), read_across_frames=True)
text = io.TextIOWrapper(reader, encoding='utf-8', errors='replace')
out = open(sys.argv[1], 'w')
def speed(tc):
    try: b, inc = tc.split('+'); est = int(b) + 40 * int(inc)
    except Exception: return 'other'
    return 'bullet' if est < 179 else 'blitz' if est < 479 else 'rapid'
hdr = []; seen = kept = 0; started = False
try:
    for line in text:
        if line.startswith('[Event '):
            started = True; hdr = [line]; continue
        if not started: continue
        if line.startswith('['): hdr.append(line); continue
        if not line.strip(): continue
        seen += 1
        h = ''.join(hdr)
        w = re.search(r'\[WhiteElo "(\d+)"\]', h); bl = re.search(r'\[BlackElo "(\d+)"\]', h); tc = re.search(r'\[TimeControl "([^"]+)"\]', h)
        if w and bl and tc and 950 <= int(w.group(1)) <= 1250 and 950 <= int(bl.group(1)) <= 1250 \
           and speed(tc.group(1)) in ('blitz', 'rapid') and '%eval' in line and line.rstrip().endswith(('1-0', '0-1', '1/2-1/2')):
            out.write(h + '\n' + line + '\n'); kept += 1
        hdr = []
except zstandard.ZstdError as e:
    print('stream ended:', e, file=sys.stderr)
print('games seen', seen, 'kept', kept, file=sys.stderr)
