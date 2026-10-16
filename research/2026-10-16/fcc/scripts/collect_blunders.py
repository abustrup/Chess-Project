# Collect big blunders (>=30 win% drop) in low-rapid eval games with the researcher's categories; dump FEN after blunder.
import sys, json, random, collections, importlib.util
spec = importlib.util.spec_from_file_location('alib', sys.argv[3]); alib = importlib.util.module_from_spec(spec); spec.loader.exec_module(alib)
import chess, chess.pgn
f = open(sys.argv[1]); out = open(sys.argv[2], 'w')
mates = collections.Counter(); ncat = collections.Counter()
while True:
    g = chess.pgn.read_game(f)
    if g is None: break
    board = g.board(); prev = alib.winp(20); node = g; ok = True; recs = []
    while node.variations:
        nxt = node.variations[0]; mv = nxt.move; mover = board.turn
        before = board.copy(stack=False)
        thr = alib.hang_map(before, mover); opp = alib.hang_map(before, not mover)
        cap = before.piece_at(mv.to_square); cap_val = alib.VAL[cap.piece_type] if cap else (1 if before.is_en_passant(mv) else 0)
        board.push(mv)
        w = alib.wp_white(nxt, board)
        if w is None: ok = False; break
        bm = prev if mover == chess.WHITE else 100-prev; am = w if mover == chess.WHITE else 100-w
        drop = bm - am
        if drop >= 30:
            ha = alib.hang_map(board, mover)
            new = {s:v for s,v in ha.items() if s not in thr}; kept = {s:v for s,v in ha.items() if s in thr}
            nh = (max(new.values())-cap_val) if new else 0; kh = max(kept.values()) if kept else 0
            ev = nxt.eval(); mate_after = ev is not None and ev.pov(mover).is_mate() and ev.pov(mover).mate() < 0
            if nh >= 2: cat = 'hung_material_new'
            elif kh >= 2 and cap_val < 2: cat = 'ignored_attacked_piece'
            elif mate_after: cat = 'allowed_forced_mate'
            elif (max(opp.values()) if opp else 0) >= 2 and cap_val < 2: cat = 'missed_free_material'
            else: cat = 'other_tactic_or_positional'
            if cat == 'allowed_forced_mate': mates[-ev.pov(mover).mate()] += 1
            recs.append(dict(fen=board.fen(), cat=cat, hang_sqs=[chess.square_name(s) for s in (new if cat=='hung_material_new' else kept if cat=='ignored_attacked_piece' else {})],
                             opp_free_sqs=[chess.square_name(s) for s in opp] if cat=='missed_free_material' else [], fen_before=before.fen(), move=mv.uci(), drop=round(drop,1),
                             site=g.headers.get('Site'), fm=before.fullmove_number))
        prev = w; node = nxt
    if not ok or len(list(g.mainline_moves())) < 10: continue
    for r in recs: out.write(json.dumps(r)+'\n'); ncat[r['cat']] += 1
print('cats', dict(ncat), file=sys.stderr)
print('mate-in distribution for allowed_forced_mate:', sorted(mates.items())[:15], 'total', sum(mates.values()), file=sys.stderr)
