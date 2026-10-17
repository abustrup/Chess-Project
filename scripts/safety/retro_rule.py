# Lichess's "Learn from your mistakes" rule (the trainer's 4-point test), in Python for the card builder and its checks.
# Source: lila ui/lib/src/ceval/winningChances.ts and ui/analyse/src/retrospect (retroCtrl.ts, nodeFinder.ts),
# as summarised in research/2026-10-16-diagnosis/design/trainer-spec.md, E1-E3 and 2.3.
#   winning chances = 2 / (1 + exp(-0.00368208 * cp)) - 1, cp clamped to +-1000;
#   mate N counts as (21 - min(10, |N|)) * 100 cp, signed, without the clamp.
#   povDiff halves a difference of winning chances, so 0.04 = 4 points on the 0-100 win% scale.
#   A move is accepted when povDiff(side, evalAfterMove, evalBeforeFault) > -0.04.
#   A move is a retro candidate when the win% swing is above 10 points, or a mate in 3 or fewer disappears.
# The game-page judgement used by the measurement (no clamp, lila mate rules) lives in prereg/lichess_rule.py and is
# a different rule; both are kept apart on purpose.
# Evals here are White point of view dicts: {'cp': int} or {'mate': int}, as in the engine caches.
import math

MULT = -0.00368208


def _raw(cp):
    return 2 / (1 + math.exp(MULT * cp)) - 1


def winning_chances(ev):
    """White's winning chances in -1..1 (lila evalWinningChances)."""
    if 'mate' in ev:
        m = ev['mate']
        sign = 1 if m > 0 else (-1 if m < 0 else 0)
        return _raw((21 - min(10, abs(m))) * 100 * sign)
    return _raw(max(-1000, min(1000, ev['cp'])))


def pov_chances(side_white, ev):
    w = winning_chances(ev)
    return w if side_white else -w


def pov_diff(side_white, a, b):
    return (pov_chances(side_white, a) - pov_chances(side_white, b)) / 2


def win_pct(side_white, ev):
    """The side's win% 0..100 on the retro scale (clamped), as stored in a card's `top[].win`."""
    return 50 + 50 * pov_chances(side_white, ev)


def retro_accept(side_white, after_move, before_fault):
    """True when the move keeps the side within 4 win% points of the best move (strictly, as lila: > -0.04)."""
    return pov_diff(side_white, after_move, before_fault) > -0.04


def is_retro_candidate(prev, cur):
    """nodeFinder.evalSwings: a swing above 10 points, or a mate in 3 or fewer that disappears."""
    if abs(pov_diff(True, prev, cur)) > 0.1:
        return True
    return 'mate' in prev and 'mate' not in cur and abs(prev['mate']) <= 3


def self_test():
    """trainer-spec 7A vectors A1-A5 (White unless named)."""
    W, B = True, False
    cases = [
        (retro_accept(W, {'cp': 20}, {'cp': 50}), True), (retro_accept(W, {'cp': -40}, {'cp': 50}), False),
        (retro_accept(W, {'cp': 7}, {'cp': 50}), True), (retro_accept(W, {'cp': 6}, {'cp': 50}), False),
        (retro_accept(W, {'cp': -43}, {'cp': 0}), True), (retro_accept(W, {'cp': -44}, {'cp': 0}), False),
        (retro_accept(B, {'cp': 80}, {'cp': 50}), True), (retro_accept(B, {'cp': 120}, {'cp': 50}), False),
        (retro_accept(W, {'cp': 900}, {'cp': 1500}), True), (retro_accept(W, {'cp': 600}, {'cp': 1500}), False),
        (retro_accept(W, {'mate': 3}, {'mate': 1}), True), (retro_accept(W, {'cp': 800}, {'mate': 2}), False),
        (retro_accept(W, {'cp': 500}, {'mate': 2}), False),
    ]
    bad = [i for i, (got, want) in enumerate(cases) if got != want]
    return len(cases) - len(bad), len(cases), bad
