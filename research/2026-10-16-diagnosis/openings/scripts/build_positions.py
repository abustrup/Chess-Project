"""Position statistics for the first 12 moves of band games (transpositions merged).

Usage: .venv/bin/python -I build_positions.py OUT.pkl IN1.jsonl [IN2.jsonl ...]
For every position reached in the first 24 plies (12 moves) of each game, counts each next move,
split by speed (blitz / rapid), with White's points (win=2, draw=1, loss=0, so divide by 2).
Positions are keyed by python-chess's Zobrist hash (pieces, side to move, castling rights, legal en passant).
Keeps positions seen in at least MIN games. Duplicate games (same time, ratings and moves) are dropped.
"""
import sys, json, pickle, collections
from multiprocessing import Pool
import chess, chess.polyglot

MAXPLY = 24
MIN = 5
PTS = {'1-0': 2, '0-1': 0, '1/2-1/2': 1}

def replay(line):
    g = json.loads(line)
    if g['sp'] not in ('blitz', 'rapid') or g['res'] not in PTS: return None
    b = chess.Board(); hs = []; sans = []
    for san in g['mv'][:MAXPLY]:
        hs.append(chess.polyglot.zobrist_hash(b))
        try:
            mv = b.parse_san(san)
        except ValueError:
            break
        sans.append(b.san(mv)); b.push(mv)
    hs.append(chess.polyglot.zobrist_hash(b))
    return (g['t'], g['w'], g['b'], tuple(g['mv'][:12])), g['sp'] == 'rapid', PTS[g['res']], hs, sans

if __name__ == '__main__':
    out, ins = sys.argv[1], sys.argv[2:]
    lines = []
    for p in ins:
        with open(p) as fh: lines.extend(fh)
    seen = set(); games = []
    with Pool(2) as pool:
        for r in pool.imap(replay, lines, chunksize=2000):
            if r is None: continue
            if r[0] in seen: continue
            seen.add(r[0]); games.append(r[1:])
    del lines, seen
    nb = sum(1 for g in games if not g[0]); nr = len(games) - nb
    print('games kept', len(games), 'blitz', nb, 'rapid', nr, file=sys.stderr)
    cnt = collections.Counter()
    for _, _, hs, _ in games: cnt.update(set(hs))
    keep = {h for h, c in cnt.items() if c >= MIN}
    print('distinct positions', len(cnt), 'kept (>=%d games)' % MIN, len(keep), file=sys.stderr)
    del cnt
    # stats[h] = {'n': [blitz, rapid], 'mv': {san: [n_blitz, wpts_blitz, n_rapid, wpts_rapid]}}
    stats = {}
    for rapid, pts, hs, sans in games:
        for i, h in enumerate(hs):
            if h not in keep: continue
            s = stats.get(h)
            if s is None: s = stats[h] = {'n': [0, 0], 'res': [0, 0], 'mv': {}}
            s['n'][rapid] += 1; s['res'][rapid] += pts
            if i < len(sans):
                m = s['mv'].get(sans[i])
                if m is None: m = s['mv'][sans[i]] = [0, 0, 0, 0]
                m[2 * rapid] += 1; m[2 * rapid + 1] += pts
    pickle.dump({'games': len(games), 'blitz': nb, 'rapid': nr, 'stats': stats,
                 'first_move': collections.Counter(g[3][0] for g in games if g[3])}, open(out, 'wb'))
    print('saved', len(stats), file=sys.stderr)
