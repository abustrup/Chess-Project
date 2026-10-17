"""Deep re-check: a random sample of 10 of the 111 claimed blunders (seed 16) plus every move where the 250k and
depth-16 passes disagree, re-searched at 1.5M nodes (Stockfish 19, 2 threads, fresh hash per search).
Rule as in vrule.py, with 'played move == engine best' -> no judgement."""
import json, sys, random, chess, chess.engine
sys.path.insert(0, '.')
from vrule import judge, winpct
from vanalyse import *
games = load_games()
A = norm_theirs('../my-games/engine/sf_250k_bothnull.jsonl'); B = norm_mine(['eng_w0.jsonl', 'eng_w1.jsonl'])
m = json.load(open('../my-games/mistakes.json'))['mistakes']
bl = [r for r in m if r['judgment'] == 'Blunder']
random.seed(16); sample = random.sample(bl, 10)
cases = [(r['game_id'], r['ply'], 'random sample of claimed blunders') for r in sample]
for gid in A:
    la = {d['ply']: d for d in per_move(A[gid], games[gid])}; lb = {d['ply']: d for d in per_move(B[gid], games[gid])}
    for p, d in la.items():
        if not d['mine']: continue
        x = d['label'] == 'Blunder'; y = lb[p]['label'] == 'Blunder'
        if x != y: cases.append((gid, p, '250k only' if x else 'depth16 only'))
eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
eng.configure({'Threads': 2, 'Hash': 128})
def ev(board):
    if board.is_checkmate(): return {'mate': 0 if False else (-1 if board.turn == chess.WHITE else 1)}, None
    eng.configure({'Clear Hash': None})
    r = eng.analyse(board, chess.engine.Limit(nodes=1_500_000))
    s = r['score'].white()
    return ({'mate': s.mate()} if s.is_mate() else {'cp': s.score()}), r['pv'][0].uci()
res = []
for gid, ply, why in cases:
    g = games[gid]; sans = g['moves'].split(); b = chess.Board()
    for s in sans[:ply - 1]: b.push_san(s)
    mover_white = b.turn == chess.WHITE
    e0, best = ev(b); mv = b.parse_san(sans[ply - 1]); b.push(mv)
    e1, _ = ev(b)
    lab = None if mv.uci() == best else judge(e0, e1, mover_white)
    w0 = winpct(e0['cp']) if 'cp' in e0 else (100.0 if e0['mate'] > 0 else 0.0)
    w1 = winpct(e1['cp']) if 'cp' in e1 else (100.0 if e1['mate'] > 0 else 0.0)
    drop = (w0 - w1) if mover_white else (w1 - w0)
    res.append({'game': gid, 'ply': ply, 'move': sans[ply - 1], 'why': why, 'label_1.5M': lab, 'drop_1.5M': round(drop, 1), 'eval_before': e0, 'eval_after': e1})
    print(res[-1], flush=True)
eng.quit()
json.dump(res, open('deep_check.json', 'w'), indent=1)
s = [r for r in res if r['why'].startswith('random')]
print('random sample: still Blunder at 1.5M:', sum(r['label_1.5M'] == 'Blunder' for r in s), 'of', len(s))
for w in ('250k only', 'depth16 only'):
    t = [r for r in res if r['why'] == w]
    print(w, ': Blunder at 1.5M', sum(r['label_1.5M'] == 'Blunder' for r in t), 'of', len(t))
