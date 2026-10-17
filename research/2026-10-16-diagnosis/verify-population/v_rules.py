# Lichess blunder rules, written from scratch for the check (from lila's Advice.scala / WinPercent.scala as I know
# them, not from the population scripts).
# Evals are White's point of view: ('cp', int) or ('mate', int). A move is judged from the eval before and after it.
import math

INITIAL = ('cp', 15)  # lila Eval.initial, used as the eval "before" White's first move

def win_chances(cp):
    cp = max(-1000, min(1000, cp))
    return 2.0 / (1.0 + math.exp(-0.00368208 * cp)) - 1.0

def game_page_judgement(before, after, white_moved):
    """lila Advice: CpAdvice (winning-chance drop) when both evals are centipawns, else MateAdvice."""
    s = 1 if white_moved else -1
    if before[0] == 'cp' and after[0] == 'cp':
        drop = s * (win_chances(before[1]) - win_chances(after[1]))
        return 'B' if drop >= 0.3 else 'M' if drop >= 0.2 else 'I' if drop >= 0.1 else None
    bm = s * before[1] if before[0] == 'mate' else None
    am = s * after[1] if after[0] == 'mate' else None
    bcp = s * before[1] if before[0] == 'cp' else 0
    acp = s * after[1] if after[0] == 'cp' else 0
    if bm is None and am is not None and am < 0:          # walked into a forced mate
        return 'I' if bcp < -999 else 'M' if bcp < -700 else 'B'
    if bm is not None and bm > 0 and (am is None or am < 0):  # let a forced mate slip
        return 'I' if acp > 999 else 'M' if acp > 700 else 'B'
    return None

def parse_db_eval(s):
    if s is None: return None
    if s.startswith('#'):
        v = int(s[1:])
        return ('mate', v) if v != 0 else None
    return ('cp', int(round(float(s) * 100)))

def judge_sequence(evals, start=INITIAL):
    """evals: list per ply (None where missing). Returns list of judgement per ply (None if not judged)."""
    out = []
    prev = start
    for e in evals:
        if e is None or prev is None:
            out.append(None)
        else:
            out.append(game_page_judgement(prev, e, len(out) % 2 == 0))
        prev = e
    return out
