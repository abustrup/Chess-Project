"""Independent re-implementation of Lichess's move judgement (lila Advice: CpAdvice + MateAdvice),
written from scratch for verification. Evals are from White's point of view: dict with 'cp' or 'mate'."""
import math

def wc(cp):
    # lila WinPercent.winningChances: in [-1, 1]
    return 2 / (1 + math.exp(-0.00368208 * cp)) - 1

def winpct(cp):
    return 50 + 50 * wc(cp)

def ceil_cp(cp, clamp):
    if clamp is None: return cp
    return max(-clamp, min(clamp, cp))

def judge(prev, nxt, mover_white, clamp=None):
    """prev = eval before the move, nxt = eval after the move. Returns 'Blunder'/'Mistake'/'Inaccuracy'/None.
    Caller must already skip moves that equal the engine's best move."""
    sign = 1 if mover_white else -1
    # CpAdvice: both evals are cp
    if 'cp' in prev and 'cp' in nxt:
        a = wc(ceil_cp(prev['cp'], clamp)); b = wc(ceil_cp(nxt['cp'], clamp))
        drop = (a - b) * sign   # loss of winning chances for the mover, in [-2, 2]
        if drop >= 0.3: return 'Blunder'
        if drop >= 0.2: return 'Mistake'
        if drop >= 0.1: return 'Inaccuracy'
        return None
    # MateAdvice, from the mover's point of view
    pm = prev.get('mate'); nm = nxt.get('mate')
    pm = pm * sign if pm is not None else None
    nm = nm * sign if nm is not None else None
    pcp = prev['cp'] * sign if 'cp' in prev else 0
    ncp = nxt['cp'] * sign if 'cp' in nxt else 0
    seq = None
    if pm is None and nm is not None and nm < 0: seq = 'created'
    elif pm is not None and pm > 0 and nm is None: seq = 'lost'
    elif pm is not None and nm is not None and pm > 0 and nm < 0: seq = 'lost'
    if seq == 'created':
        return 'Inaccuracy' if pcp < -999 else 'Mistake' if pcp < -700 else 'Blunder'
    if seq == 'lost':
        return 'Inaccuracy' if ncp > 999 else 'Mistake' if ncp > 700 else 'Blunder'
    return None

def to_white_winpct(ev):
    """Win% for White from an eval dict (mate -> 100/0)."""
    if 'mate' in ev:
        m = ev['mate']
        return 100.0 if m > 0 else 0.0
    return winpct(ev['cp'])
