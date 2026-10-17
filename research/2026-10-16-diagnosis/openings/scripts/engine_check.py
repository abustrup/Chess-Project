"""Engine check of the course moves the owner would actually use, and of candidate answers to the biggest gaps.

Usage: .venv/bin/python -I engine_check.py coverage_all.json OUT.json [DEPTH] [MIN_MASS]
 A. every own decision the course walk reaches in at least MIN_MASS of games (default 1 in 200):
    Stockfish 19 (Threads 2, Hash 256) best move and evaluation, and the evaluation of the course move;
    'cp_loss' = best minus course move, in centipawns from the owner's side.
 B. every gap (opponent move with no prepared answer) reached in at least 1 in 100 games:
    Stockfish's top 3 answers and what 1000-1300 players answer there, with their score.
"""
import sys, json, math
import chess, chess.engine

cov_path, out_path = sys.argv[1], sys.argv[2]
DEPTH = int(sys.argv[3]) if len(sys.argv) > 3 else 20
MIN_MASS = float(sys.argv[4]) if len(sys.argv) > 4 else 0.005
cov = json.load(open(cov_path))
eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
eng.configure({'Threads': 2, 'Hash': 256})

def cp(score, pov):
    s = score.pov(pov)
    if s.is_mate(): return 10000 if s.mate() > 0 else -10000
    return s.score()

out = {'depth': DEPTH, 'engine': 'Stockfish 19, Threads 2', 'decisions': {}, 'gaps': {}}
for cid, r in cov['courses'].items():
    own = chess.WHITE if r['you_play'] == 'White' else chess.BLACK
    rows = []
    for d in r['own_decisions_used_1_in_500_games']:
        if d['mass'] < MIN_MASS: continue
        b = chess.Board(d['fen'])
        info = eng.analyse(b, chess.engine.Limit(depth=DEPTH), multipv=3)
        top = [(b.san(i['pv'][0]), cp(i['score'], own)) for i in info]
        course = d['course_move']
        ce = next((v for s, v in top if s == course), None)
        if ce is None:
            ci = eng.analyse(b, chess.engine.Limit(depth=DEPTH), root_moves=[b.parse_san(course)])
            ce = cp(ci['score'], own)
        row = {'line': d['line'], 'course_move': course, 'mass': d['mass'], 'chapters': d['chapters'], 'engine_top3': top,
               'course_move_eval_cp': ce, 'cp_loss': top[0][1] - ce, 'what_1000_1300_players_play_here': d['what_1000_1300_players_play_here'], 'fen': d['fen']}
        rows.append(row)
        print(cid, f"{d['mass']:.3f}", d['line'], '->', course, 'loss', row['cp_loss'], 'top', top[:2], flush=True)
    out['decisions'][cid] = rows
    grows = []
    for g in r['gaps_at_least_1_in_100']:
        b = chess.Board()
        for s in g['line'].split(): b.push_san(s)
        info = eng.analyse(b, chess.engine.Limit(depth=DEPTH), multipv=3)
        top = [(b.san(i['pv'][0]), cp(i['score'], own), ' '.join(chess.Board(b.fen()).variation_san(i['pv'][:6]).split()[:8])) for i in info]
        grows.append({'line': g['line'], 'mass': g['mass'], 'fen': b.fen(), 'engine_top3': top})
        print(cid, 'GAP', g['line'], top, flush=True)
    out['gaps'][cid] = grows
eng.quit()
json.dump(out, open(out_path, 'w'), indent=1)
