import sys, collections
sys.path.insert(0, sys.argv[2])
from analyse_lib import *
def mat(board, color):
    return sum(VAL[p.piece_type] for p in board.piece_map().values() if p.color == color and p.piece_type != chess.KING)
C = collections.defaultdict(collections.Counter)
f = open(sys.argv[1])
while True:
    g = chess.pgn.read_game(f)
    if g is None: break
    h = g.headers; band = h.get('Band')
    if band == 'mid' or speed(h.get('TimeControl','-')) not in ('rapid','classical'): continue
    board = g.board(); node = g; prev = winp(20); recs = []; ok = True; boards = [board.copy(stack=False)]
    while node.variations:
        nxt = node.variations[0]; mv = nxt.move; mover = board.turn
        before = board.copy(stack=False)
        thr = hang_map(before, mover); opp_h = hang_map(before, not mover)
        cap = before.piece_at(mv.to_square); capv = VAL[cap.piece_type] if cap else (1 if before.is_en_passant(mv) else 0)
        board.push(mv); w = wp_white(nxt, board)
        if w is None: ok = False; break
        bm = prev if mover == chess.WHITE else 100-prev; am = w if mover == chess.WHITE else 100-w
        ha = hang_map(board, mover)
        nh = {s:v for s,v in ha.items() if s not in thr}; kh = {s:v for s,v in ha.items() if s in thr}
        e = nxt.eval(); mate_after = e is not None and e.pov(mover).is_mate() and e.pov(mover).mate() < 0
        recs.append((mover, bm-am, (max(nh.values())-capv if nh else 0), (max(kh.values()) if kh else 0), mate_after, (max(opp_h.values()) if opp_h else 0), capv, phase(before)))
        boards.append(board.copy(stack=False)); prev = w; node = nxt
    if not ok: continue
    for i, (mover, drop, nh, kh, mate_after, oppfree, capv, ph) in enumerate(recs):
        if drop < 30: continue
        if nh >= 2: cat = 'hung_material_new'
        elif kh >= 2 and capv < 2: cat = 'ignored_attacked_piece'
        elif mate_after: cat = 'allowed_forced_mate'
        elif oppfree >= 2 and capv < 2: cat = 'missed_free_material'
        else: cat = 'other'
        b0 = boards[i]; j = min(i+5, len(boards)-1); b4 = boards[j]
        d0 = mat(b0, mover) - mat(b0, not mover); d4 = mat(b4, mover) - mat(b4, not mover)
        delta = d4 - d0
        k = band
        C[k][cat] += 1
        C[k]['all'] += 1
        if i > 0 and recs[i-1][1] >= 30:
            C[k][cat+'|after_opp_big_blunder'] += 1; C[k]['all|after_opp_big_blunder'] += 1
        if i+1 < len(recs) and recs[i+1][1] >= 30:
            C[k][cat+'|opp_then_blundered_back'] += 1; C[k]['all|opp_then_blundered_back'] += 1
        C[k][cat + ('|lost>=2_in_5plies' if delta <= -2 else '|no_material_loss_5plies')] += 1
        if b4.is_checkmate(): C[k][cat+'|mated_within_5plies'] += 1
for k, c in C.items():
    print(k)
    for cat in ('hung_material_new','ignored_attacked_piece','allowed_forced_mate','missed_free_material','other'):
        n = c[cat]
        if n: print(f"  {cat}: n={n}, lost>=2 within 5 plies {100*c[cat+'|lost>=2_in_5plies']/n:.0f}%, mated within 5 {100*c[cat+'|mated_within_5plies']/n:.0f}%, came right after opponent's big blunder (failed to punish) {100*c[cat+'|after_opp_big_blunder']/n:.0f}%, opponent immediately blundered back {100*c[cat+'|opp_then_blundered_back']/n:.0f}%")
    n=c['all']; print(f"  ALL big blunders n={n}: right after opponent's big blunder {100*c['all|after_opp_big_blunder']/n:.0f}%, opponent immediately blundered back {100*c['all|opp_then_blundered_back']/n:.0f}%")
