# Engine pass over the owner's games: evaluates EVERY position of every game with native Stockfish 19
# at a fixed node count, plus a "null move" probe (what would the opponent do if it were his move again?)
# at every position where the owner is to move and not in check.
#
# Usage: .venv/bin/python scripts/engine_eval.py GAMES.ndjson OUT.jsonl NODES NULL_NODES WORKER NWORKERS [ONLY_ANALYSED] [CACHE.jsonl ...]
#  - CACHE files: earlier outputs; a position already analysed at the same node count is reused (exact, because every
#    search starts from an empty hash with one thread).
#  - Threads 1 per engine so results are reproducible (same position + same nodes + empty hash = same output);
#    run 2 workers in parallel for speed.
#  - Every position is analysed from an empty hash (ucinewgame before each search), so results are order-independent.
import sys, json
import chess, chess.engine

inp, outp, nodes, null_nodes, wi, nw = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
only_analysed = len(sys.argv) > 7 and sys.argv[7] == '1'
CACHE = {}
for cf in sys.argv[8:]:
    for l in open(cf):
        r = json.loads(l)
        for row in r['positions']:
            if r['nodes'] == nodes and 'best' in row:
                CACHE[(r['id'], row['ply'], row['fen'], 'main')] = row
            if r.get('null_nodes') == null_nodes and 'null' in row:
                CACHE[(r['id'], row['ply'], row['fen'], 'null')] = row['null']
ME = 'abustrup'
import os
NULL_SIDE = os.environ.get('NULL_SIDE', 'me')   # 'me' (default), 'opp' or 'both': whose positions get the null-move probe
SF = '/opt/homebrew/bin/stockfish'

def score_json(pov_score):
    w = pov_score.white()
    if w.is_mate():
        return {'mate': w.mate()}
    return {'cp': w.score()}

games = [json.loads(l) for l in open(inp)]
if only_analysed:
    games = [g for g in games if 'analysis' in g]
eng = chess.engine.SimpleEngine.popen_uci(SF)
eng.configure({'Threads': 1, 'Hash': 64})
out = open(outp, 'w')
for gi, g in enumerate(games):
    if gi % nw != wi:
        continue
    me_white = g['players']['white'].get('user', {}).get('id') == ME
    my_color = chess.WHITE if me_white else chess.BLACK
    b = chess.Board()
    sans = g['moves'].split()
    # every analyse() call gets a new game object, so python-chess sends ucinewgame: each position is analysed
    # from an empty hash, which makes the result depend only on the position, its history and the node count
    rows = []
    for ply in range(len(sans) + 1):
        if ply > 0:
            b.push_san(sans[ply - 1])
        row = {'ply': ply, 'fen': b.fen()}
        if b.is_checkmate():
            row['score'] = {'mate': 0, 'mated': 'white' if b.turn == chess.WHITE else 'black'}
        elif b.is_stalemate() or b.is_insufficient_material():
            row['score'] = {'cp': 0}; row['terminal'] = True
        else:
            c = CACHE.get((g['id'], ply, b.fen(), 'main'))
            if c:
                for k in ('score', 'best', 'pv', 'depth'): row[k] = c.get(k)
            else:
                info = eng.analyse(b, chess.engine.Limit(nodes=nodes), game=object())
                pv = info.get('pv', [])
                row['score'] = score_json(info['score'])
                row['best'] = pv[0].uci() if pv else None
                row['pv'] = [m.uci() for m in pv[:12]]
                row['depth'] = info.get('depth')
            probe_side = (b.turn == my_color) if NULL_SIDE == 'me' else (b.turn != my_color) if NULL_SIDE == 'opp' else True
            if null_nodes > 0 and probe_side and not b.is_check():
                nb = b.copy(stack=False)
                nb.push(chess.Move.null())
                c = CACHE.get((g['id'], ply, b.fen(), 'null'))
                if c:
                    row['null'] = c
                elif nb.is_valid():
                    ninfo = eng.analyse(chess.Board(nb.fen()), chess.engine.Limit(nodes=null_nodes), game=object())
                    npv = ninfo.get('pv', [])
                    row['null'] = {'score': score_json(ninfo['score']), 'best': npv[0].uci() if npv else None,
                                   'pv': [m.uci() for m in npv[:8]]}
        rows.append(row)
    out.write(json.dumps({'id': g['id'], 'nodes': nodes, 'null_nodes': null_nodes, 'positions': rows}) + '\n')
    out.flush()
    print('done', g['id'], len(rows), file=sys.stderr, flush=True)
eng.quit()
