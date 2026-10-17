# Longer engine lines for each of his judged moves (Blunder or Mistake by our labels or by Lichess's), so the
# classifier can follow material for 8 plies even when Stockfish's printed PV is cut short.
# Each line is built by sequential searches: from the position, play the engine's best move, search again, and so on.
# Usage: .venv/bin/python -I scripts/lines.py GAMES.ndjson SF_EVALS.jsonl OUT.jsonl NODES WORKER NWORKERS [DONE.jsonl ...]
# Only moves where Stockfish's printed PV (before or after the move) is shorter than 6 plies need this; others use the PV.
# DONE files: earlier outputs whose targets are skipped.
import sys, os, json
import chess, chess.engine
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from lichess_rule import lichess_judgment, START

games_path, sf_path, outp, nodes, wi, nw = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
ME = 'abustrup'; PLIES = 8
GAMES = [json.loads(l) for l in open(games_path)]
SF = {}
for l in open(sf_path):
    r = json.loads(l); SF[r['id']] = r['positions']
DONE = set()
for f in sys.argv[7:]:
    for l in open(f):
        r = json.loads(l); DONE.add((r['id'], r['ply']))
targets = []
for g in GAMES:
    if g['id'] not in SF: continue
    pos = SF[g['id']]; me_white = g['players']['white'].get('user', {}).get('id') == ME
    b = chess.Board(); sans = g['moves'].split(); lich = g.get('analysis') or []
    for i, san in enumerate(sans):
        mv = b.parse_san(san); mover_white = b.turn == chess.WHITE
        if mover_white == me_white:
            prev = START if i == 0 else pos[i]['score']
            j, _ = lichess_judgment(prev, pos[i + 1]['score'], mover_white, played_is_best=(pos[i].get('best') == mv.uci()))
            lj = lich[i].get('judgment', {}).get('name') if i < len(lich) else None
            short = len(pos[i].get('pv', [])) < 6 or len(pos[i + 1].get('pv', [])) < 6
            if (j in ('Blunder', 'Mistake') or lj in ('Blunder', 'Mistake')) and short and (g['id'], i + 1) not in DONE:
                targets.append((g['id'], i + 1, b.fen(), mv.uci()))
        b.push(mv)
eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
eng.configure({'Threads': 1, 'Hash': 64})
def line_from(board, first=None):
    b = board.copy(stack=False); out = []
    marker = object()
    if first:
        b.push(chess.Move.from_uci(first)); out.append(first)
    while len(out) < PLIES and not b.is_game_over():
        info = eng.analyse(b, chess.engine.Limit(nodes=nodes), game=marker)
        pv = info.get('pv', [])
        if not pv: break
        b.push(pv[0]); out.append(pv[0].uci())
    return out
out = open(outp, 'w')
for k, (gid, ply, fen, uci) in enumerate(targets):
    if k % nw != wi: continue
    b = chess.Board(fen)
    out.write(json.dumps({'id': gid, 'ply': ply, 'played_line': line_from(b, uci), 'best_line': line_from(b)}) + '\n'); out.flush()
print('lines done', len(targets) // nw, file=sys.stderr)
eng.quit()
