# "What there was to see": machine-made facts for a card, and the helpers check_cards.py uses to re-verify them.
# No prose is stored, only data that the app's fixed templates turn into sentences (trainer-spec 2.4):
#   threat  : his last move threatens `reply` (a move he could play if you passed), winning `wins` or mating in `mateIn`
#   allowed : after your game move `move`, he can play `reply` and win `wins` / material, or mate in `mateIn`
#   free    : his last move left his `piece` on `square` with no defender, and the best line takes it for 2+ points
#   quiet   : nothing was threatened (null-move threat below 5 points)
# Every claim of material is backed by the stored line: `gain` is recomputed from it by check_cards.py, and a fact
# only says "win" when the line wins 2+ points; a mate claim is backed by a line that ends in checkmate.
# A line that claims material is "settled": the engine carries it on until no exchange is left open (claim_gain), and
# the claim must hold both by the median rule and by the plain count at its end. Without this, a 6-ply line that
# stops between a capture and the recapture said "win material" of an even trade (verifier, 2026-10-16: 9 of 169
# material claims netted 1 point or less once settled, 5 of them naming a piece).
import chess
from classify import material, pv_material_path, see, VAL

PIECE = {chess.PAWN: 'p', chess.KNIGHT: 'n', chess.BISHOP: 'b', chess.ROOK: 'r', chess.QUEEN: 'q', chess.KING: 'k'}
PIECE_TYPE = {v: k for k, v in PIECE.items()}
THREAT_PLIES, ALLOWED_PLIES, FREE_PLIES = 6, 8, 6   # the line lengths the claims start from
SETTLE_PLIES = 6                                      # at most this many plies more to close an open exchange
SAFE_PLIES = 6   # a move's own line (the move, his answer and 4 more plies) before settling, for the safety rule


def line_loss(board, line, loser, plies):
    """Material the `loser` side gives up along `line` (UCI), by the threat-test rule of the pre-registration:
    start material minus the median of the last three positions of the path (start included); shorter paths use
    the worst position. Positive = the other side wins material."""
    path = [material(board, loser)] + pv_material_path(board, line, loser, plies)
    m0 = path[0]
    if len(path) >= 3:
        last = sorted(path[-3:])
        return m0 - last[len(last) // 2]
    return m0 - min(path)


def legal_prefix(board, line):
    b = board.copy(stack=False); out = []
    for u in line:
        mv = chess.Move.from_uci(u)
        if mv not in b.legal_moves:
            break
        b.push(mv); out.append(u)
    return out


def sans(board, line):
    b = board.copy(stack=False); out = []
    for u in line:
        mv = chess.Move.from_uci(u)
        out.append(b.san(mv)); b.push(mv)
    return out


def quiet_end(board, line):
    """True when `line` (legal from `board`) ends with nothing in the middle of an exchange: the game is over, or its
    last move is neither a capture nor a promotion and the side to move is not in check. Only then is the material
    count at its end final."""
    b = board.copy(stack=False); open_ = False
    for u in line:
        mv = chess.Move.from_uci(u)
        open_ = b.is_capture(mv) or mv.promotion is not None
        b.push(mv)
    return b.is_game_over() or (not open_ and not b.is_check())


def claim_gain(board, line, loser):
    """Points the `loser` side gives up along a settled line: the smaller of the median rule (line_loss) and the plain
    count at the line's end (at a quiet end the last move changes no material, so the two agree). None when the line
    still ends in an open exchange, so no material may be claimed."""
    if not line or not quiet_end(board, line):
        return None
    path = [material(board, loser)] + pv_material_path(board, line, loser, len(line))
    return min(line_loss(board, line, loser, len(line)), path[0] - path[-1])


def self_test():
    """Hand-made positions for claim_gain (verifier, 2026-10-16): an even bishop trade claims nothing, a line that stops
    mid-exchange claims nothing, a free bishop is 3, a new queen is 8 once the check is answered."""
    W, B = chess.WHITE, chess.BLACK
    trade = chess.Board('5k2/p5b1/8/8/8/8/PB6/4K3 w - - 0 1')
    late = chess.Board('4k1r1/p5b1/8/8/8/8/PB6/4K3 w - - 0 1')   # Bxg7, two quiet moves, then Rxg7 (as held:B4575r7G:30)
    free = chess.Board('4k3/p5b1/8/8/8/8/PB6/4K3 w - - 0 1')
    promo = chess.Board('4k3/p5P1/8/8/8/8/P7/4K3 w - - 0 1')
    cases = [
        (claim_gain(trade, ['b2g7', 'f8g7'], B), None), (claim_gain(trade, ['b2g7', 'f8g7', 'e1e2'], B), 0),
        (line_loss(late, ['b2g7', 'a7a6', 'a2a3', 'g8g7'], B, 4), 3),   # the median rule alone claims 3 for an even trade
        (claim_gain(late, ['b2g7', 'a7a6', 'a2a3', 'g8g7'], B), None), (claim_gain(late, ['b2g7', 'a7a6', 'a2a3', 'g8g7', 'a3a4'], B), 0),
        (claim_gain(free, ['b2g7'], B), None), (claim_gain(free, ['b2g7', 'e8e7'], B), 3),
        (claim_gain(promo, ['g7g8q'], B), None), (claim_gain(promo, ['g7g8q', 'e8d7'], B), 8),
        (quiet_end(trade, []), True), (claim_gain(trade, [], W), None),
    ]
    bad = [i for i, (got, want) in enumerate(cases) if got != want]
    return len(cases) - len(bad), len(cases), bad


def settled_from(board, prefix, settled):
    """The settled line when it really continues `prefix` (as the builder's search made it), else just the prefix."""
    s = legal_prefix(board, settled or [])
    return s if s[:len(prefix)] == prefix else list(prefix)


def mates_in(board, line, n):
    """True when playing `line` from `board` gives checkmate exactly at ply 2n-1 (mate in n for the side to move)."""
    need = 2 * n - 1
    if len(line) < need:
        return False
    b = board.copy(stack=False)
    for k, u in enumerate(line[:need]):
        mv = chess.Move.from_uci(u)
        if mv not in b.legal_moves or b.is_game_over():
            return False
        b.push(mv)
        if k < need - 1 and b.is_checkmate():
            return False
    return b.is_checkmate()


def capture_target(board, uci):
    """(piece type, square) the move captures, or None. En passant counts as a pawn."""
    mv = chess.Move.from_uci(uci)
    if not board.is_capture(mv):
        return None
    if board.is_en_passant(mv):
        return chess.PAWN, mv.to_square
    return board.piece_type_at(mv.to_square), mv.to_square


def wins_for(board_at_reply, reply_uci, gain):
    """The piece a winning reply takes, named only when the line nets at least that piece's value minus 2
    (so 'winning your rook' is never said of an exchange)."""
    tgt = capture_target(board_at_reply, reply_uci)
    if not tgt:
        return None
    pt, sq = tgt
    v = VAL[pt]
    if v >= 3 and gain >= max(2, v - 2):
        return {'piece': PIECE[pt], 'square': chess.square_name(sq)}
    return None


def threat_fact(card_board, null_line, mate_n, settled=None):
    """card_board: the trainee to move. null_line: the opponent's best line if the trainee passed. settled: its first
    THREAT_PLIES moves carried on to a quiet end (Engines.settle)."""
    nb = card_board.copy(stack=False); nb.push(chess.Move.null())
    line = legal_prefix(nb, null_line)
    if not line:
        return None
    f = {'t': 'threat', 'reply': nb.san(chess.Move.from_uci(line[0]))}
    if mate_n is not None and mates_in(nb, line, mate_n):
        line = line[:2 * mate_n - 1]
        f.update(line=line, lineSan=sans(nb, line), mateIn=mate_n)
        return f
    line = settled_from(nb, line[:THREAT_PLIES], settled)
    gain = claim_gain(nb, line, card_board.turn)
    if gain is None or gain < 2:
        return None
    f.update(line=line, lineSan=sans(nb, line), gain=gain)
    w = wins_for(nb, line[0], gain)
    if w:
        f['wins'] = w
    return f


def allowed_fact(card_board, played_line, mate_n, settled=None):
    """played_line starts with the trainee's game move, then the opponent's best reply line. settled: its first
    ALLOWED_PLIES moves carried on to a quiet end."""
    line = legal_prefix(card_board, played_line)
    if len(line) < 2:
        return None
    b1 = card_board.copy(stack=False); b1.push(chess.Move.from_uci(line[0]))
    f = {'t': 'allowed', 'move': card_board.san(chess.Move.from_uci(line[0])), 'reply': b1.san(chess.Move.from_uci(line[1]))}
    if mate_n is not None and mates_in(b1, line[1:], mate_n):
        line = line[:2 * mate_n]
        f.update(line=line, lineSan=sans(card_board, line), mateIn=mate_n)
        return f
    line = settled_from(card_board, line[:ALLOWED_PLIES], settled)
    gain = claim_gain(card_board, line, card_board.turn)
    if gain is None or gain < 2:
        return None
    f.update(line=line, lineSan=sans(card_board, line), gain=gain)
    w = wins_for(b1, line[1], gain)
    if w:
        f['wins'] = w
    return f


def free_gain(before_last_board, last_move_uci, line):
    """Points the opponent is down, net, from the position BEFORE his last move to the end of the trainee's settled best
    line (claim_gain). Counting from before his move keeps a plain trade (he takes, you take back) at 0."""
    return claim_gain(before_last_board, [last_move_uci] + list(line), before_last_board.turn)


def free_fact(before_last_board, last_move_uci, card_board, best_line, settled=None):
    """His last move left a piece (knight or more) with no defender, and the trainee wins it by taking: the best move
    captures it, the static exchange on its square gains 2+, the settled best line leaves him 2+ points down net of his
    own move, and before his move the piece was not already capturable for 2+ (or it just arrived there). No defender,
    because the app says "unprotected" (trainer-spec 2.4); a defended piece won by a cheaper capture shows through the
    best move and its line instead."""
    line = legal_prefix(card_board, best_line)
    if not line:
        return None
    tgt = capture_target(card_board, line[0])
    if not tgt or VAL[tgt[0]] < 3:
        return None
    pt, sq = tgt
    me = card_board.turn
    if see(card_board, sq, me) < 2 or card_board.attackers(not me, sq):
        return None
    last = chess.Move.from_uci(last_move_uci)
    if last.to_square != sq:
        pc = before_last_board.piece_at(sq)
        if pc is None or pc.color == me or pc.piece_type != pt or see(before_last_board, sq, me) >= 2:
            return None
    line = settled_from(card_board, line[:FREE_PLIES], settled)
    gain = free_gain(before_last_board, last_move_uci, line)
    if gain is None or gain < 2:
        return None
    return {'t': 'free', 'piece': PIECE[pt], 'square': chess.square_name(sq), 'line': line, 'lineSan': sans(card_board, line),
            'gain': gain}
