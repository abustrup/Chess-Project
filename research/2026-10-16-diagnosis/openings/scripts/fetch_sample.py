"""Stream byte-range samples of the monthly Lichess database and keep games where both players are rated in a band.

Usage: .venv/bin/python -I fetch_sample.py OUT.jsonl START_INDEX STOP_INDEX [K] [MIB]
Splits the file into K equal slices and downloads MIB MiB from the start of slices START..STOP-1.
Each range is decompressed from the first zstd frame boundary; partial first/last games are dropped.
Writes one JSON line per kept game: {sp, tc, w, b, res, t (UTC date+time), mv: first 30 SAN moves}.
No usernames are kept.
"""
import sys, re, json, subprocess, zstandard

URL = 'https://database.lichess.org/standard/lichess_db_standard_rated_2026-09.pgn.zst'
SIZE = 29224520887
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
LO, HI = 1000, 1300
MAGIC = b'\x28\xb5\x2f\xfd'

out_path, a, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
K = int(sys.argv[4]) if len(sys.argv) > 4 else 40
MIB = int(sys.argv[5]) if len(sys.argv) > 5 else 20

hdr_re = re.compile(r'^\[(\w+) "(.*)"\]$')
tok_re = re.compile(r'\{[^}]*\}|\d+\.(?:\.\.)?|1-0|0-1|1/2-1/2|\*|\$\d+')

def speed(ev):
    if 'Rated Blitz' in ev: return 'blitz'
    if 'Rated Rapid' in ev: return 'rapid'
    return None

def parse(text, fh, stats):
    games = text.split('\n[Event ')
    # first and last chunks may be partial
    for g in games[1:-1]:
        stats['seen'] += 1
        lines = g.split('\n')
        h = {'Event': lines[0]}
        mt = None
        for ln in lines[1:]:
            if ln.startswith('['):
                m = hdr_re.match(ln)
                if m: h[m.group(1)] = m.group(2)
            elif ln.strip():
                mt = ln
                break
        sp = speed(h['Event'])
        if not sp or mt is None: continue
        try:
            w, bb = int(h.get('WhiteElo', 'x')), int(h.get('BlackElo', 'x'))
        except ValueError:
            continue
        if not (LO <= w <= HI and LO <= bb <= HI): continue
        mv = [x.rstrip('?!') for x in tok_re.sub(' ', mt).split()][:30]
        rec = {'sp': sp, 'tc': h.get('TimeControl'), 'w': w, 'b': bb, 'res': h.get('Result'),
               't': h.get('UTCDate', '') + ' ' + h.get('UTCTime', ''), 'mv': mv,
               'term': h.get('Termination')}
        fh.write(json.dumps(rec, separators=(',', ':')) + '\n')
        stats['kept'] += 1

with open(out_path, 'a') as fh:
    todo = [int(x) for x in sys.argv[6].split(',')] if len(sys.argv) > 6 else range(a, b)
    for i in todo:
        off = i * (SIZE // K)
        end = min(SIZE - 1, off + MIB * 1024 * 1024 - 1)
        data = b''
        for attempt in range(4):
            data = subprocess.run(['curl', '-s', '--max-time', '300', '-A', UA, '-r', f'{off}-{end}', URL], capture_output=True).stdout
            if len(data) == end - off + 1: break
            print(f'slice {i}: got {len(data)} bytes, retrying', file=sys.stderr, flush=True)
        p = data.find(MAGIC)
        stats = {'seen': 0, 'kept': 0}
        while p != -1:
            try:
                parts, rest, frames = [], data[p:], 0
                while rest:
                    dobj = zstandard.ZstdDecompressor().decompressobj()
                    try:
                        parts.append(dobj.decompress(rest))
                    except zstandard.ZstdError:
                        if frames == 0: raise
                        break
                    frames += 1
                    rest = dobj.unused_data
                text = b''.join(parts).decode('utf-8', 'replace')
                break
            except zstandard.ZstdError:
                p = data.find(MAGIC, p + 1)
        else:
            print(f'slice {i}: no frame found in {len(data)} bytes', file=sys.stderr); continue
        parse(text, fh, stats)
        first = re.search(r'UTCDate "([^"]+)"\]\n\[UTCTime "([^"]+)"', text)
        print(f'slice {i} offset {off}: bytes {len(data)} frame@{p} seen {stats["seen"]} kept {stats["kept"]} first {first.group(1) + " " + first.group(2) if first else "?"}', file=sys.stderr, flush=True)
