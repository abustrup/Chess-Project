"""Independent engine pass for verification (written from scratch, not derived from my-games/scripts).
Setting deliberately different from the investigation (they: 250k fixed nodes, hash cleared before every search):
here Stockfish 19, fixed DEPTH 16, 1 thread, 64 MB hash, hash kept within a game (ucinewgame per game).
For every position of every game: eval + best move + PV. For every position not in check: a null-move search
(same position, other side to move) for the threat test.
Usage: veng.py WORKER NWORKERS OUT.jsonl"""
import sys, json, chess, chess.engine, time
W, NW, OUT = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
DEPTH = 16
games = [json.loads(l) for l in open('../my-games/lichess_abustrup.ndjson')]
games.sort(key=lambda g: -len(g['moves'].split()))
mine = [g for i, g in enumerate(games) if i % NW == W]
eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
eng.configure({'Threads': 1, 'Hash': 64})

def sc(score):
    s = score.white()
    if s.is_mate(): return {'mate': s.mate()}
    return {'cp': s.score()}

out = open(OUT, 'a')
for g in mine:
    t0 = time.time()
    b = chess.Board(); rows = []
    sans = g['moves'].split()
    for k in range(len(sans) + 1):
        row = {'ply': k, 'fen': b.fen(), 'white_to_move': b.turn == chess.WHITE, 'in_check': b.is_check()}
        if b.is_checkmate():
            row['terminal'] = 'checkmate'
        elif b.is_stalemate() or b.is_insufficient_material():
            row['terminal'] = 'draw'
        else:
            r = eng.analyse(b, chess.engine.Limit(depth=DEPTH), game=g['id'])
            row.update(sc(r['score'])); row['pv'] = [m.uci() for m in r.get('pv', [])][:12]
            row['best'] = row['pv'][0] if row['pv'] else None
            row['nodes'] = r.get('nodes')
            if not b.is_check():
                nb = b.copy(); nb.push(chess.Move.null())
                rn = eng.analyse(nb, chess.engine.Limit(depth=DEPTH), game=g['id'])
                row['null'] = sc(rn['score']); row['null_pv'] = [m.uci() for m in rn.get('pv', [])][:12]
        if k < len(sans):
            mv = b.parse_san(sans[k]); row['played'] = mv.uci(); row['played_san'] = sans[k]
            b.push(mv)
        rows.append(row)
    out.write(json.dumps({'id': g['id'], 'rows': rows}) + '\n'); out.flush()
    print(g['id'], len(sans), round(time.time() - t0), 's', flush=True)
eng.quit()
