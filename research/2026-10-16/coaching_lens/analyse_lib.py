import sys, math, json, statistics, collections
import chess, chess.pgn

VAL = {chess.PAWN:1, chess.KNIGHT:3, chess.BISHOP:3, chess.ROOK:5, chess.QUEEN:9, chess.KING:100}
def winp(cp): return 50 + 50*(2/(1+math.exp(-0.00368208*cp))-1)
def wp_white(node, board):
    ev = node.eval()
    if ev is None:
        if board.is_checkmate():
            return 0.0 if board.turn == chess.WHITE else 100.0
        return None
    w = ev.white()
    if w.is_mate():
        return 100.0 if w.mate() > 0 else 0.0
    return winp(max(-1000, min(1000, w.score())))

def see(board, sq, side):
    """Static exchange gain for `side` capturing on sq (no x-rays). >0 means side wins material."""
    target = board.piece_at(sq)
    if target is None or target.color == side: return 0
    def atk(color):
        vs = []
        for s in board.attackers(color, sq):
            if board.is_pinned(color, s): continue
            vs.append(VAL[board.piece_type_at(s)])
        return sorted(vs)
    a = atk(side); d = atk(not side)
    if not a: return 0
    gain = [VAL[target.piece_type]]
    on_sq = a.pop(0); turn_lists = [d, a]; i = 0
    while True:
        lst = turn_lists[i % 2]
        if not lst: break
        gain.append(on_sq - gain[-1])
        on_sq = lst.pop(0); i += 1
    for k in range(len(gain)-1, 0, -1):
        gain[k-1] = -max(-gain[k-1], gain[k])
    return max(0, gain[0])

def hang_map(board, owner):
    """squares of owner's non-king pieces that the opponent wins >=2 by capturing"""
    res = {}
    for sq, pc in board.piece_map().items():
        if pc.color != owner or pc.piece_type == chess.KING: continue
        g = see(board, sq, not owner)
        if g >= 2: res[sq] = g
    return res

def speed(tc):
    try:
        b, inc = tc.split('+'); est = int(b) + 40*int(inc)
    except Exception: return 'other'
    if est < 29: return 'ultrabullet'
    if est < 179: return 'bullet'
    if est < 479: return 'blitz'
    if est < 1499: return 'rapid'
    return 'classical'

def phase(board):
    npm = sum(1 for p in board.piece_map().values() if p.piece_type not in (chess.PAWN, chess.KING))
    if npm <= 6: return 'endgame'
    if board.fullmove_number <= 12: return 'opening'
    return 'middlegame'

