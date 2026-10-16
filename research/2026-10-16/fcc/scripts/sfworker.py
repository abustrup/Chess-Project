# usage: sfworker.py in.pgn out.jsonl worker_idx n_workers max_games nodes
import sys, json, math, random
import chess, chess.pgn, chess.engine
inp, outp, wi, nw, maxg, nodes = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
def winp(cp): return 50 + 50*(2/(1+math.exp(-0.00368208*cp))-1)
def wp_from_score(sc):  # PovScore white
    w = sc.white()
    if w.is_mate(): return 100.0 if w.mate() > 0 else 0.0
    return winp(max(-1000, min(1000, w.score())))
games = []
with open(inp) as f:
    while True:
        g = chess.pgn.read_game(f)
        if g is None: break
        games.append(g)
rnd = random.Random(42); idx = list(range(len(games))); rnd.shuffle(idx); idx = idx[:maxg]
eng = chess.engine.SimpleEngine.popen_uci(['node','/Users/alexanderbustrup/Chess-Project/node_modules/stockfish/bin/stockfish-19-lite-single.js'])
out = open(outp, 'w')
for k, gi in enumerate(idx):
    if k % nw != wi: continue
    g = games[gi]; b = g.board(); node = g
    mine = []; lich = []
    while node.variations:
        nxt = node.variations[0]; b.push(nxt.move)
        if b.is_checkmate(): mine.append(0.0 if b.turn == chess.WHITE else 100.0)
        elif b.is_game_over(): mine.append(50.0)
        else:
            info = eng.analyse(b, chess.engine.Limit(nodes=nodes))
            mine.append(wp_from_score(info['score']))
        ev = nxt.eval()
        if ev is None: lich.append(None)
        else:
            w = ev.white()
            lich.append(100.0 if (w.is_mate() and w.mate() > 0) else 0.0 if w.is_mate() else winp(max(-1000, min(1000, w.score()))))
        node = nxt
    out.write(json.dumps({'gi': gi, 'site': g.headers.get('Site'), 'res': g.headers.get('Result'), 'term': g.headers.get('Termination'),
                          'tc': g.headers.get('TimeControl'), 'mine': mine, 'lich': lich}) + '\n'); out.flush()
eng.quit()
