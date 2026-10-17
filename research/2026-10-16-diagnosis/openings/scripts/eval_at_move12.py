"""Population check: how often is a 1000-1300 player already below 30% (or above 70%) winning chance after move 12?

Usage: .venv/bin/python -I eval_at_move12.py OUT.json SLICE_INDEXES (comma list, of 64 equal slices of the Sept 2026 file)
Uses only games that Lichess analysed (they carry [%eval] comments), both players 1000-1300, blitz or rapid.
Winning chance uses Lichess's formula. Note: analysed games are a selected subset (someone asked for analysis).
"""
import sys, re, json, math, subprocess, zstandard
URL = 'https://database.lichess.org/standard/lichess_db_standard_rated_2026-09.pgn.zst'
SIZE = 29224520887; K = 64; MIB = 20
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
MAGIC = b'\x28\xb5\x2f\xfd'
def winp(cp): return 50 + 50 * (2 / (1 + math.exp(-0.00368208 * cp)) - 1)
out_path = sys.argv[1]; todo = [int(x) for x in sys.argv[2].split(',')]
rows = []
for i in todo:
    off = i * (SIZE // K); end = off + MIB * 1024 * 1024 - 1
    data = subprocess.run(['curl', '-s', '--max-time', '300', '-A', UA, '-r', f'{off}-{end}', URL], capture_output=True).stdout
    p = data.find(MAGIC); text = None
    while p != -1 and text is None:
        try:
            parts, rest, frames = [], data[p:], 0
            while rest:
                d = zstandard.ZstdDecompressor().decompressobj()
                try: parts.append(d.decompress(rest))
                except zstandard.ZstdError:
                    if frames == 0: raise
                    break
                frames += 1; rest = d.unused_data
            text = b''.join(parts).decode('utf-8', 'replace')
        except zstandard.ZstdError:
            p = data.find(MAGIC, p + 1)
    if text is None: print('slice', i, 'failed', file=sys.stderr); continue
    for g in text.split('\n[Event ')[1:-1]:
        if '%eval' not in g: continue
        ev = g.split('\n', 1)[0]
        if 'Rated Blitz' not in ev and 'Rated Rapid' not in ev: continue
        w = re.search(r'\[WhiteElo "(\d+)"', g); b = re.search(r'\[BlackElo "(\d+)"', g)
        if not (w and b) or not (1000 <= int(w.group(1)) <= 1300 and 1000 <= int(b.group(1)) <= 1300): continue
        mt = g.split('\n\n', 1)[1] if '\n\n' in g else ''
        evs = re.findall(r'\[%eval ([^\]]+)\]', mt)
        if len(evs) < 24: continue
        e = evs[23]
        if e.startswith('#'): wp = 100.0 if not e.startswith('#-') else 0.0
        else: wp = winp(max(-1000, min(1000, float(e) * 100)))
        res = re.search(r'\[Result "([^"]+)"', g).group(1)
        rows.append({'wp_white_after_move12': round(wp, 1), 'res': res, 'speed': 'blitz' if 'Blitz' in ev else 'rapid'})
    print('slice', i, 'rows so far', len(rows), file=sys.stderr, flush=True)
n = len(rows)
def share(f): return round(sum(1 for r in rows if f(r)) / n, 4) if n else None
side_rows = [r['wp_white_after_move12'] for r in rows] + [100 - r['wp_white_after_move12'] for r in rows]
summary = {'games': n, 'player_sides': 2 * n,
           'share_of_player_sides_below_30_after_move12': round(sum(1 for x in side_rows if x < 30) / len(side_rows), 4) if n else None,
           'share_of_player_sides_above_70_after_move12': round(sum(1 for x in side_rows if x > 70) / len(side_rows), 4) if n else None,
           'black_below_30': share(lambda r: r['wp_white_after_move12'] > 70), 'white_below_30': share(lambda r: r['wp_white_after_move12'] < 30),
           'score_of_side_below_30': None}
lost = [(1 if r['res'] == '0-1' else 0) for r in rows if r['wp_white_after_move12'] < 30] + [(1 if r['res'] == '1-0' else 0) for r in rows if r['wp_white_after_move12'] > 70]
summary['share_of_below_30_sides_that_lost'] = round(sum(lost) / len(lost), 3) if lost else None
json.dump({'summary': summary, 'note': __doc__}, open(out_path, 'w'), indent=1)
print(summary)
