# For sampled big blunders: does Stockfish's best reply capture on the square the classifier flagged as hanging?
import sys, json, random, collections
import chess, chess.engine
recs = [json.loads(l) for l in open(sys.argv[1])]
wi, nw, nodes = int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
rnd = random.Random(3)
by = collections.defaultdict(list)
for r in recs: by[r['cat']].append(r)
sample = []
for cat, n in (('hung_material_new', 80), ('ignored_attacked_piece', 60), ('missed_free_material', 50), ('allowed_forced_mate', 20), ('other_tactic_or_positional', 80)):
    L = by[cat][:]; rnd.shuffle(L); sample += L[:n]
eng = chess.engine.SimpleEngine.popen_uci(['node','/Users/alexanderbustrup/Chess-Project/node_modules/stockfish/bin/stockfish-19-lite-single.js'])
out = open(sys.argv[2], 'w')
for k, r in enumerate(sample):
    if k % nw != wi: continue
    b = chess.Board(r['fen'])
    res = dict(cat=r['cat'], site=r['site'], fm=r['fm'])
    if b.is_game_over():
        res['game_over'] = True
    else:
        info = eng.analyse(b, chess.engine.Limit(nodes=nodes))
        pv = info.get('pv', [])
        best = pv[0] if pv else None
        res['best'] = best.uci() if best else None
        res['best_is_capture'] = bool(best and b.is_capture(best))
        res['best_captures_flagged'] = bool(best and chess.square_name(best.to_square) in r['hang_sqs'] and b.is_capture(best))
        # does opponent win the flagged piece within the PV's first 3 plies (direct or after an in-between move)?
        bb = b.copy(); won = False
        for i, m in enumerate(pv[:3]):
            if i % 2 == 0 and bb.is_capture(m) and chess.square_name(m.to_square) in r['hang_sqs']: won = True
            bb.push(m)
        res['pv_wins_flagged_within3'] = won
        res['score_opp'] = str(info['score'].pov(b.turn))
    if r['cat'] == 'missed_free_material':
        bb = chess.Board(r['fen_before'])
        info = eng.analyse(bb, chess.engine.Limit(nodes=nodes)); best = info.get('pv', [None])[0]
        res['best_before_takes_free'] = bool(best and bb.is_capture(best) and chess.square_name(best.to_square) in r['opp_free_sqs'])
    out.write(json.dumps(res)+'\n'); out.flush()
eng.quit()
