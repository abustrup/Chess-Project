# Hand-check of Lichess's own labels on a random sample of moves by 950-1250 players (fresh API sample).
# 15 moves Lichess calls Blunder and 15 random moves it does not label at all. Each position before and after the
# move is re-evaluated with a deeper local search (Stockfish 19, depth 20, 1 thread), and the winning-chance drop is
# recomputed. Prints FEN, move and Lichess's suggested best move so a person can look at the board.
# usage: .venv/bin/python -I v_handcheck.py API.ndjson DB.jsonl OUT.json
import sys, os, json, random
import chess, chess.engine
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v_rules import win_chances

api_path, src, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
elo = {}
for line in open(src):
    g = json.loads(line); elo[g['id']] = (g['we'], g['be'])
rnd = random.Random(16)
bl, ok = [], []
for line in open(api_path):
    if not line.strip(): continue
    g = json.loads(line)
    if 'analysis' not in g or g['id'] not in elo: continue
    sans = g['moves'].split()
    for i, x in enumerate(g['analysis'][:len(sans)]):
        if not 950 <= elo[g['id']][i % 2] <= 1250 or i == 0: continue
        lab = (x.get('judgment') or {}).get('name')
        if lab == 'Blunder': bl.append((g, i))
        elif lab is None: ok.append((g, i))
sample = [('Blunder', *t) for t in rnd.sample(bl, 15)] + [('none', *t) for t in rnd.sample(ok, 15)]
eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
eng.configure({'Threads': 1, 'Hash': 128})
def ev(b):
    if b.is_checkmate(): return 'mated'
    s = eng.analyse(b, chess.engine.Limit(depth=20))['score'].white()
    return ('mate', s.mate()) if s.is_mate() else ('cp', s.score())
def wc_mover(e, white):
    if e == 'mated': return -1.0 if not white else 1.0  # side to move is mated (unused for movers)
    if e[0] == 'mate': v = 1.0 if e[1] > 0 else -1.0
    else: v = win_chances(e[1])
    return v if white else -v
out = []
for lab, g, i in sample:
    b = chess.Board()
    for s in g['moves'].split()[:i]: b.push_san(s)
    fen = b.fen(); white = b.turn == chess.WHITE
    e0 = ev(b)
    san = g['moves'].split()[i]
    b.push_san(san)
    e1 = ev(b) if not b.is_checkmate() else ('mate', 1 if white else -1)
    if e1 == 'mated': e1 = ('mate', 1 if white else -1)
    drop = wc_mover(e0, white) - wc_mover(e1, white)
    x = g['analysis'][i]
    out.append(dict(ply=i + 1, lichess_label=lab, fen_before=fen, move=san, lichess_best=x.get('best'),
                    lichess_eval_before=g['analysis'][i - 1], lichess_eval_after={k: v for k, v in x.items() if k in ('eval', 'mate')},
                    depth20_before=e0, depth20_after=e1, depth20_winning_chance_drop=round(drop, 3),
                    depth20_says_blunder=drop >= 0.3))
eng.quit()
summ = {}
for lab in ('Blunder', 'none'):
    s = [o for o in out if o['lichess_label'] == lab]
    summ[lab] = dict(n=len(s), depth20_blunder=sum(o['depth20_says_blunder'] for o in s),
                     depth20_drop_at_least_0_2=sum(o['depth20_winning_chance_drop'] >= 0.2 for o in s))
json.dump(dict(summary=summ, moves=out), open(OUT, 'w'), indent=1)
print(json.dumps(summ, indent=1))
for o in out:
    print(o['lichess_label'], o['ply'], o['move'], o['lichess_eval_before'].get('eval', o['lichess_eval_before'].get('mate')),
          o['lichess_eval_after'], o['depth20_before'], o['depth20_after'], o['depth20_winning_chance_drop'])
