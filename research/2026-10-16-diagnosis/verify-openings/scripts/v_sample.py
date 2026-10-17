"""Independent re-sample of the Lichess September 2026 database for the openings check (verifier, 2026-10-16).

Written from scratch; does not import or copy the openings investigation's code.
Takes byte ranges that sit HALF-WAY between the investigation's 64 slices, so no game overlaps their sample.

Usage: .venv/bin/python -I v_sample.py OUT.jsonl FIRST LAST [MIB]
  slices i = FIRST..LAST-1 of 64; range starts at i*(SIZE//64) + SIZE//128.
Keeps rated games where BOTH players are 1000-1300 and the speed (from TimeControl, Lichess rule
base + 40*increment: 180-479 s blitz, 480-1499 s rapid) is blitz or rapid.
Writes one JSON line per game: speed, tc, ratings, result, termination, UTC time, up to 60 SAN plies,
and the Lichess [%eval] strings when the game was analysed. No usernames, no game links.
"""
import sys, re, json, subprocess, zstandard, io

URL = 'https://database.lichess.org/standard/lichess_db_standard_rated_2026-09.pgn.zst'
SIZE = 29224520887
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
ZMAGIC = b'\x28\xb5\x2f\xfd'

out, first, last = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
MIB = int(sys.argv[4]) if len(sys.argv) > 4 else 20

def speed_of(tc):
    if not tc or tc == '-' or '+' not in tc: return None
    base, inc = tc.split('+')
    est = int(base) + 40 * int(inc)
    if 180 <= est < 480: return 'blitz'
    if 480 <= est < 1500: return 'rapid'
    return None

HDR = re.compile(r'\[(\w+) "([^"]*)"\]')
COMMENT = re.compile(r'\{([^}]*)\}')
EVAL = re.compile(r'\[%eval ([^\]]+)\]')

def movetext_to_plies(mt):
    """Return list of (san, eval_or_None). Comments follow the move they annotate."""
    plies = []
    pos = 0
    tokens = re.findall(r'\{[^}]*\}|[^\s{}]+', mt)
    for t in tokens:
        if t.startswith('{'):
            if plies:
                m = EVAL.search(t)
                if m and plies[-1][1] is None: plies[-1][1] = m.group(1)
            continue
        if re.fullmatch(r'\d+\.(\.\.)?', t) or t in ('1-0', '0-1', '1/2-1/2', '*'): continue
        if t.startswith('$'): continue
        t = re.sub(r'^\d+\.(\.\.)?', '', t)
        t = t.rstrip('?!')
        if t: plies.append([t, None])
    return plies

def decompress_from(data):
    p = data.find(ZMAGIC)
    while p != -1:
        try:
            r = zstandard.ZstdDecompressor().stream_reader(io.BytesIO(data[p:]), read_across_frames=True)
            chunks = []
            while True:
                try:
                    c = r.read(1 << 20)
                except zstandard.ZstdError:
                    break  # truncated final frame
                if not c: break
                chunks.append(c)
            if chunks:
                return b''.join(chunks).decode('utf-8', 'replace')
        except zstandard.ZstdError:
            pass
        p = data.find(ZMAGIC, p + 1)
    return None

with open(out, 'a') as fh:
    for i in range(first, last):
        off = i * (SIZE // 64) + SIZE // 128
        end = off + MIB * 1024 * 1024 - 1
        data = b''
        for attempt in range(3):
            data = subprocess.run(['curl', '-s', '--max-time', '400', '-A', UA, '-r', f'{off}-{end}', URL], capture_output=True).stdout
            if len(data) == end - off + 1: break
        text = decompress_from(data)
        if text is None:
            print(f'slice {i}: could not decompress ({len(data)} bytes)', file=sys.stderr, flush=True); continue
        blocks = text.split('\n\n[Event ')
        seen = kept = 0
        for blk in blocks[1:-1]:  # first and last may be cut
            seen += 1
            head, _, rest = blk.partition('\n\n')
            h = dict(HDR.findall('[Event ' + head))
            if 'Rated' not in h.get('Event', ''): continue
            sp = speed_of(h.get('TimeControl'))
            if sp is None: continue
            try:
                we, be = int(h['WhiteElo']), int(h['BlackElo'])
            except (KeyError, ValueError):
                continue
            if not (1000 <= we <= 1300 and 1000 <= be <= 1300): continue
            plies = movetext_to_plies(rest.strip())
            has_eval = any(e is not None for _, e in plies)
            rec = {'sp': sp, 'tc': h.get('TimeControl'), 'we': we, 'be': be, 'r': h.get('Result'), 'term': h.get('Termination'),
                   't': h.get('UTCDate', '') + ' ' + h.get('UTCTime', ''), 'n': len(plies), 'mv': [s for s, _ in plies[:60]],
                   'ev': [e for _, e in plies[:60]] if has_eval else None}
            fh.write(json.dumps(rec, separators=(',', ':')) + '\n'); kept += 1
        m = re.search(r'\[UTCDate "([^"]+)"\]\s*\[UTCTime "([^"]+)"\]', text)
        print(f'slice {i} off {off}: {len(data)} B, games seen {seen}, kept {kept}, first {m.group(1)+" "+m.group(2) if m else "?"}', file=sys.stderr, flush=True)
