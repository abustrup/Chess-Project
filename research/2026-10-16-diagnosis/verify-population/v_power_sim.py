# Detectable drop for ONE player, by simulation instead of the normal formula.
# Games are resampled from real analysed 10+0 player-games of 950-1250 players (independent database sample),
# so game length and the lumpy blunder counts are real. "After" games get a true drop of d: each blunder is
# kept with probability 1 - d. Test: one-sided 5%, blunders per 100 moves after vs before (pooled counts),
# judged against a 5% critical value taken from simulated no-change players (with the same drift). Optional natural drift: the player's
# true rate after is multiplied by a random factor with SD tau / mean (blunders added or removed accordingly).
# usage: .venv/bin/python -I v_power_sim.py DB.jsonl OUT.json
import sys, os, json, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v_rules import parse_db_eval, judge_sequence

src, OUT = sys.argv[1], sys.argv[2]
games = []
for line in open(src):
    g = json.loads(line)
    if not g['an'] or g['tc'] != '600+0': continue
    seq = judge_sequence([parse_db_eval(e) for e in g['ev']])
    for side, e in ((0, g['we']), (1, g['be'])):
        if 950 <= e <= 1250:
            own = (g['n'] + 1) // 2 if side == 0 else g['n'] // 2
            if own >= 1: games.append((sum(1 for i in range(side, g['n'], 2) if seq[i] == 'B'), own))
mu = 100 * sum(b for b, _ in games) / sum(m for _, m in games)
rnd = random.Random(11)

def binom(n, p):
    return sum(1 for _ in range(n) if rnd.random() < p)

def stat(sample):
    B = sum(b for b, _ in sample); M = sum(m for _, m in sample); r = B / M
    n = len(sample); mbar = M / n
    v = sum((b - r * m) ** 2 for b, m in sample) / (n - 1) / (n * mbar * mbar)  # ratio-estimator variance
    return r, v

def diff(n, d, tau):
    before = rnd.choices(games, k=n)
    f = (1 - d) * max(0.0, 1 + rnd.gauss(0, tau / mu)) if tau else (1 - d)
    after = []
    for b, m in rnd.choices(games, k=n):
        if f <= 1: after.append((binom(b, f), m))
        else: after.append((b + sum(1 for _ in range(m) if rnd.random() < (f - 1) * mu / 100), m))
    return 100 * (stat(before)[0] - stat(after)[0])

def threshold(n, tau, R=3000):
    # one-sided 5% critical value from the null (no true drop), including natural drift when tau > 0,
    # so the false-alarm rate is really 5%
    v = sorted(diff(n, 0.0, tau) for _ in range(R))
    return v[int(0.95 * R)]

def power(n, d, tau, thr, R=1000):
    return sum(diff(n, d, tau) > thr for _ in range(R)) / R

res = dict(games_resampled=len(games), mean_rate=round(mu, 2), results={})
for n in (50, 100, 150):
    for tau in (0.0, 2.45):
        thr = threshold(n, tau)
        row = {'critical_drop_per100': round(thr, 2)}
        for d in ((0.15, 0.2, 0.25, 0.3, 0.35, 0.4) if tau == 0 else (0.4, 0.5, 0.6, 0.7, 0.8)):
            row[f'{int(100 * d)}%'] = round(power(n, d, tau, thr), 3)
        res['results'][f'{n}+{n} games, drift SD {tau}'] = row
        print(n, tau, row, flush=True)
json.dump(res, open(OUT, 'w'), indent=1)
