"""Verifier: spot-check of the claim '149 of 150 frequently used course moves are within half a pawn of Stockfish's
first choice' with a different engine method (2026-10-16).

Usage: .venv/bin/python -I v_engine_spot.py ENGINE_CHECK.json OUT.json N_RANDOM DEPTH
Takes the positions listed in the investigation's engine_check.json (only the FEN and the course move are used;
their evaluations are not), picks N_RANDOM at random (fixed seed) plus every position they flagged as worse than
0.25 pawn, and for each one:
  - finds Stockfish's best move with a single-PV search at DEPTH (theirs: MultiPV 3 at depth 20);
  - evaluates the position AFTER the course move and AFTER the best move, each searched at DEPTH, from the owner's side.
Loss = eval after best - eval after course move (centipawns, owner's side; mate scores mapped to +-10000).
"""
import sys, json, random
import chess, chess.engine

src, out, NR, DEPTH = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
d = json.load(open(src))
items = [(cid, x) for cid, L in d['decisions'].items() for x in L]
random.seed(16102026)
flag = [it for it in items if it[1]['cp_loss'] > 25]
rest = [it for it in items if it[1]['cp_loss'] <= 25]
pick = flag + random.sample(rest, NR)
eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish'); eng.configure({'Threads': 2, 'Hash': 128})
def cp(sc, pov): return sc.pov(pov).score(mate_score=10000)
rows = []
for cid, x in pick:
    b = chess.Board(x['fen']); me = b.turn
    best = eng.analyse(b, chess.engine.Limit(depth=DEPTH))['pv'][0]
    def after(m):
        b.push(m); s = eng.analyse(b, chess.engine.Limit(depth=DEPTH))['score']; b.pop(); return cp(s, me)
    cm = b.parse_san(x['course_move'])
    e_best = after(best); e_course = e_best if cm == best else after(cm)
    rows.append({'course': cid, 'line': x['line'], 'course_move': x['course_move'], 'my_best': b.san(best),
                 'my_loss_cp': e_best - e_course, 'their_best': x['engine_top3'][0][0], 'their_loss_cp': x['cp_loss'], 'flagged_by_them': x['cp_loss'] > 25})
    print(rows[-1], flush=True)
eng.quit()
n = len(rows)
summary = {'checked': n, 'flagged_included': len(flag), 'random': NR,
           'my_loss_over_50': [r for r in rows if r['my_loss_cp'] > 50],
           'random_only_within_50': sum(1 for r in rows if not r['flagged_by_them'] and r['my_loss_cp'] <= 50),
           'agree_on_side_of_50cp': sum(1 for r in rows if (r['my_loss_cp'] > 50) == (r['their_loss_cp'] > 50))}
json.dump({'summary': summary, 'rows': rows}, open(out, 'w'), indent=1)
print(json.dumps(summary, indent=1))
