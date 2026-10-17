# Lichess's own move-judgement rule, re-implemented from lila (modules/analyse Advice.scala, WinPercent.scala)
# as research/2026-10-16 replicated it:
#   win% = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
#   research/2026-10-16 clamped cp to +-1000. On the owner's 6 Lichess-analysed games (428 judged moves, 2026-10-16) that
#   clamp reproduces 427/428 of Lichess's labels and NO clamp reproduces 428/428 (the miss: -7.08 -> -10.93 is an
#   Inaccuracy on Lichess), so the clamp is off by default here (CLAMP = None).
#   Blunder if the mover's win% drops by >= 15 points (winning-chances drop >= 0.3), Mistake >= 10, Inaccuracy >= 5.
#   If either side of the comparison is a forced mate, Lichess's MateAdvice applies instead:
#     mate against the mover appears: Blunder unless the mover was already below -7.00 (Mistake) / -9.99 (Inaccuracy)
#     a forced mate for the mover disappears: Blunder unless he is still above +7.00 (Mistake) / +9.99 (Inaccuracy)
#   No judgement when the move played is the engine's best move (Lichess only judges moves with a better variation).
#   The position before the first move counts as +0.15 (lila's Cp.initial).
import math

CLAMP = None

def winp(cp):
    if CLAMP is not None:
        cp = max(-CLAMP, min(CLAMP, cp))
    return 50 + 50 * (2 / (1 + math.exp(-0.00368208 * cp)) - 1)

def wp_mover(score, mover_white):
    """Win% for the mover from a White-POV score dict {'cp': x} or {'mate': n} (mate 0 = side to move is mated)."""
    if 'mate' in score:
        m = score['mate']
        if m == 0:  # checkmate on the board
            if 'mated' in score:  # engine_eval.py records who is mated
                return 0.0 if (score['mated'] == 'white') == mover_white else 100.0
            return 100.0  # no record: the side to move is mated, so the player who just moved delivered it
        good_for_white = m > 0
        return 100.0 if good_for_white == mover_white else 0.0
    cp = score['cp'] if mover_white else -score['cp']
    return winp(cp)

def lichess_judgment(prev, cur, mover_white, played_is_best=False):
    """prev/cur: White-POV score dicts before and after the move. Returns (judgment or None, win% drop for mover)."""
    drop = wp_mover(prev, mover_white) - wp_mover(cur, mover_white)
    if played_is_best:
        return None, drop
    if 'mate' in cur and cur['mate'] == 0:  # the mover delivered checkmate: Lichess keeps no info here
        return None, drop
    sgn = 1 if mover_white else -1
    if 'cp' in prev and 'cp' in cur:
        if drop >= 15: return 'Blunder', drop
        if drop >= 10: return 'Mistake', drop
        if drop >= 5: return 'Inaccuracy', drop
        return None, drop
    prev_mate = prev['mate'] * sgn if 'mate' in prev else None
    next_mate = cur['mate'] * sgn if 'mate' in cur else None
    prev_cp = prev['cp'] * sgn if 'cp' in prev else 0
    next_cp = cur['cp'] * sgn if 'cp' in cur else 0
    if prev_mate is None and next_mate is not None and next_mate < 0:      # mate created against the mover
        j = 'Inaccuracy' if prev_cp < -999 else 'Mistake' if prev_cp < -700 else 'Blunder'
        return j, drop
    if prev_mate is not None and prev_mate > 0 and (next_mate is None or next_mate < 0):  # mate lost
        j = 'Inaccuracy' if next_cp > 999 else 'Mistake' if next_cp > 700 else 'Blunder'
        return j, drop
    return None, drop

def lichess_api_score(a):
    """Score dict from one entry of the Lichess JSON 'analysis' array (White POV)."""
    if 'mate' in a: return {'mate': a['mate']}
    if 'eval' in a: return {'cp': a['eval']}
    return None

START = {'cp': 15}
