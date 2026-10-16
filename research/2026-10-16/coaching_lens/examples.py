import sys
sys.path.insert(0, sys.argv[2])
from analyse_lib import *
f = open(sys.argv[1]); shown = {'hung':0,'other':0}
while sum(shown.values()) < 8:
    g = chess.pgn.read_game(f)
    if g is None: break
    if g.headers.get('Band') != 'low' or speed(g.headers.get('TimeControl','-')) != 'rapid': continue
    board = g.board(); node = g; prev = winp(20)
    while node.variations:
        nxt = node.variations[0]; mv = nxt.move; mover = board.turn
        before = board.copy(stack=False); thr = hang_map(before, mover)
        san = before.san(mv); cap = before.piece_at(mv.to_square); capv = VAL[cap.piece_type] if cap else 0
        board.push(mv); w = wp_white(nxt, board)
        if w is None: break
        drop = (prev - w) if mover == chess.WHITE else (w - prev)
        if drop >= 30 and before.fullmove_number <= 15:
            ha = hang_map(board, mover); nh = {chess.square_name(s):v for s,v in ha.items() if s not in thr}
            kind = 'hung' if nh and max(nh.values())-capv >= 2 else 'other'
            if shown[kind] < 4:
                shown[kind] += 1
                nxt_san = board.san(nxt.variations[0].move) if nxt.variations else '-'
                print(kind, f"move {before.fullmove_number}{'.' if mover else '...'}{san}", 'drop', round(drop), 'newly hanging', nh, 'reply', nxt_san, board.fen())
            break
        prev = w; node = nxt
