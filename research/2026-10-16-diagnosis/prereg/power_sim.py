# How often the pre-registered rule (verdict.py, unchanged) says "worked", "no big effect" or "cannot tell",
# for simulated players with a known true effect, and how often the key secondary (mechanism) test says
# "supported". Pure Python, seeded. Usage:
#   .venv/bin/python -I research/2026-10-16-diagnosis/prereg/power_sim.py OUT.json [SIMS] [--with-randomized-start]
# Version 2 (2026-10-16): windows read from verdict.windows() (baseline 11-40, unlock after 40, wash-in 41-60,
# looks 61-110 and 61-160); scenarios with the binding matched-newcomer condition; mechanism-test scenarios.
#
# Simulated games (planning values from the 2026-10-16 evidence, all [assumed] for him at 10+0):
#  - own moves per game: gamma, mean 30.5, SD 13, at least 4 (population 10+0 mean 30.5 own moves per game)
#  - blunders per game: Poisson(moves x rate/100 x G), G ~ gamma with mean 1; the spread of G is calibrated so the
#    per-game rate has SD 7.46 at a rate of 9.5 (within-player SD, verify-population, 174 players, 10,745 games)
#  - true untrained rate mu: 9.8 (population 950-1050 at 10+0) or 12.5 (his own blitz rate)
#  - natural ups and downs, two shapes:
#      'phase': one random shift between the baseline and the training phase, SD tau_true of the change
#      'ar1'  : a slowly wandering rate (AR(1) per game, rho 0.97), scaled so the change between the two windows
#               has SD tau_true
#  - training effect: the rate falls by a fraction r, phased in linearly over the 20 wash-in games
#  - mechanism scenarios: his blitz shares (2026-10-16): 84% of moves tested, 16.8% of tested moves face a concrete
#    threat, blunder chance 31% on those, 10.1% on other tested moves, 6.3% on untested moves (overall 12.46 per 100),
#    scaled down proportionally for mu = 9.8; one gamma factor per game multiplies all three
import sys, os, json, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verdict as V

OUT = sys.argv[1]
SIMS = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 2000
W = V.windows()
N = W['looks'][-1]['window'][1]
U = V.DESIGN['unlock_after_game']; WASH = V.DESIGN['wash_in_games']
LOOK1_END = W['looks'][0]['window'][1]
rng = random.Random(20261016)


def poisson(lam):
    if lam <= 0:
        return 0
    if lam > 30:
        return max(0, int(round(rng.gauss(lam, math.sqrt(lam)))))
    L = math.exp(-lam); k = 0; p = 1.0
    while True:
        p *= rng.random()
        if p <= L:
            return k
        k += 1


def moves():
    return max(4, int(round(rng.gammavariate(5.5, 30.5 / 5.5))))


def calibrate_shape(target_sd=7.46, rate=9.5, n=60000):
    lo, hi = 0.5, 50.0
    for _ in range(18):
        a = math.sqrt(lo * hi)
        rs = []
        for _ in range(n // 6):
            m = moves(); g = rng.gammavariate(a, 1 / a)
            rs.append(100 * poisson(m * rate / 100 * g) / m)
        mu = sum(rs) / len(rs); sd = math.sqrt(sum((x - mu) ** 2 for x in rs) / (len(rs) - 1))
        if sd > target_sd:
            lo = a
        else:
            hi = a
    return math.sqrt(lo * hi), sd


SHAPE, SD_ACHIEVED = calibrate_shape()


def sd_at(rate, n=40000):
    rs = []
    for _ in range(n):
        m = moves(); rs.append(100 * poisson(m * rate / 100 * rng.gammavariate(SHAPE, 1 / SHAPE)) / m)
    mu = sum(rs) / len(rs)
    return round(math.sqrt(sum((x - mu) ** 2 for x in rs) / (len(rs) - 1)), 2)


SD_AT_12_5 = sd_at(12.5)
A_LO, A_HI = W['baseline']; B_LO = W['looks'][-1]['window'][0]
RHO = 0.97


def ar_scale():
    # variance of (mean of an AR(1) over the baseline window) - (mean over the final training window), unit variance
    A = range(A_LO, A_HI + 1); B = range(B_LO, N + 1)
    def s(X, Y):
        return sum(RHO ** abs(i - j) for i in X for j in Y)
    v = s(A, A) / len(A) ** 2 + s(B, B) / len(B) ** 2 - 2 * s(A, B) / (len(A) * len(B))
    return 1 / math.sqrt(v)


AR_K = ar_scale()


def series(mu, r, tau, shape, learn=0.0):
    """learn: natural drop (per 100 moves) between the centres of the baseline and the final window, from a
    steady untrained improvement (a newcomer still learning); 0 for established players."""
    rows = []
    centre_gap = (B_LO + N) / 2 - (A_LO + A_HI) / 2
    if shape == 'phase':
        uA = rng.gauss(0, tau / math.sqrt(2)); uB = rng.gauss(0, tau / math.sqrt(2))
    w = rng.gauss(0, 1)
    for t in range(1, N + 1):
        if shape == 'ar1':
            if t > 1:
                w = RHO * w + math.sqrt(1 - RHO ** 2) * rng.gauss(0, 1)
            drift = tau * AR_K * w
        else:
            drift = uA if t <= U else uB
        ramp = 0.0 if t <= U else min(1.0, (t - U) / WASH)
        trend = -learn * (t - (A_LO + A_HI) / 2) / centre_gap
        rate = max(0.3, (mu + drift + trend) * (1 - r * ramp))
        m = moves()
        b = poisson(m * rate / 100 * rng.gammavariate(SHAPE, 1 / SHAPE))
        rows.append({'seq': t, 'my_moves': m, 'my_blunders': b})
    return rows


def run(mu, r, tau, shape, sims, learn=0.0, nc=None):
    c = {'worked_at_look1': 0, 'worked_at_look2': 0, 'no_big_effect_at_look1': 0, 'no_big_effect_at_look2': 0, 'cannot_tell': 0}
    for _ in range(sims):
        p = V.primary(series(mu, r, tau, shape, learn), nc=nc)
        v, g = p['verdict'], p['decided_at_game']
        if v.startswith(V.LABEL_WORKED):
            c['worked_at_look1' if g == LOOK1_END else 'worked_at_look2'] += 1
        elif v == V.LABEL_NO_BIG:
            c['no_big_effect_at_look1' if g == LOOK1_END else 'no_big_effect_at_look2'] += 1
        else:
            c['cannot_tell'] += 1
    out = {k: round(v / sims, 3) for k, v in c.items()}
    out['worked_total'] = round(out['worked_at_look1'] + out['worked_at_look2'], 3)
    out['no_big_effect_total'] = round(out['no_big_effect_at_look1'] + out['no_big_effect_at_look2'], 3)
    return out


# mechanism scenarios ------------------------------------------------------------------------------------------
P_TEST, P_THREAT = 748 / 891, 126 / 748
P_T, P_N, P_U = 39 / 126, 63 / 622, 9 / 143


def mech_series(mu, r_threat, r_other, tau):
    k = mu / 12.46
    uA = rng.gauss(0, tau / math.sqrt(2)); uB = rng.gauss(0, tau / math.sqrt(2))
    rows = []
    for t in range(1, N + 1):
        drift = (uA if t <= U else uB) / mu
        ramp = 0.0 if t <= U else min(1.0, (t - U) / WASH)
        f = max(0.03, 1 + drift)
        m = moves(); tested = sum(1 for _ in range(m) if rng.random() < P_TEST)
        th = sum(1 for _ in range(tested) if rng.random() < P_THREAT)
        g = rng.gammavariate(SHAPE, 1 / SHAPE)
        tb = poisson(th * P_T * k * f * g * (1 - r_threat * ramp))
        nb = poisson((tested - th) * P_N * k * f * g * (1 - r_other * ramp))
        ub = poisson((m - tested) * P_U * k * f * g * (1 - r_other * ramp))
        rows.append({'seq': t, 'my_moves': m, 'my_blunders': tb + nb + ub, 'threat_moves': th, 'threat_blunders': min(tb, th),
                     'nothreat_moves': tested - th, 'nothreat_blunders': min(nb, tested - th)})
    return rows


def mech_run(mu, r_threat, r_other, tau, sims):
    sup = worked = 0
    A_lo, A_hi = W['baseline']; B_lo, B_hi = W['looks'][-1]['window']
    for _ in range(sims):
        rows = mech_series(mu, r_threat, r_other, tau)
        k = V.mechanism([r for r in rows if A_lo <= r['seq'] <= A_hi], [r for r in rows if B_lo <= r['seq'] <= B_hi])
        sup += k['reading'] == 'mechanism supported'
        worked += V.primary(rows)['verdict'].startswith(V.LABEL_WORKED)
    return {'mechanism_supported': round(sup / sims, 3), 'main_worked': round(worked / sims, 3)}


def randomized_start(mu, r, tau, sims, lo=41, hi=80, wash=20):
    """Rejected alternative: the trainer unlocks after a game S drawn at random from lo..hi (fixed in advance);
    single-case randomization test of R(11..S) - R(S+wash+1..N) against every other possible S. Natural ups and
    downs: the AR(1) shape (a phase shift would be indistinguishable from an effect here)."""
    hits = 0
    for _ in range(sims):
        S = rng.randint(lo, hi)
        w = rng.gauss(0, 1); B = []; M = []
        for t in range(1, N + 1):
            if t > 1:
                w = RHO * w + math.sqrt(1 - RHO ** 2) * rng.gauss(0, 1)
            ramp = 0.0 if t <= S else min(1.0, (t - S) / wash)
            rate = max(0.3, (mu + tau * AR_K * w) * (1 - r * ramp))
            m = moves(); B.append(poisson(m * rate / 100 * rng.gammavariate(SHAPE, 1 / SHAPE))); M.append(m)
        def T(s):
            a_b = sum(B[10:s]); a_m = sum(M[10:s]); b_b = sum(B[s + wash:]); b_m = sum(M[s + wash:])
            return 100 * (a_b / a_m - b_b / b_m)
        t0 = T(S); allT = [T(s) for s in range(lo, hi + 1)]
        p = sum(1 for x in allT if x >= t0) / len(allT)
        hits += p <= 0.05
    return round(hits / sims, 3)


res = {'version': 2, 'sims_per_scenario': SIMS, 'seed': 20261016, 'gamma_shape': round(SHAPE, 2), 'per_game_sd_achieved': round(SD_ACHIEVED, 2), 'per_game_sd_at_rate_12_5': SD_AT_12_5,
       'rule': {**{k: V.DESIGN[k] for k in ('baseline', 'unlock_after_game', 'wash_in_games', 'looks', 'tau', 'sesoi_fraction', 'mechanism_z')}, 'windows': W},
       'scenarios': [], 'newcomer_scenarios': [], 'mechanism_scenarios': []}
plan = []
for mu in (9.8, 12.5):
    for tau in (0.0, 1.6, 2.6):
        for r in (0.0, 0.15, 0.25, 1 / 3, 0.5):
            plan.append((mu, r, tau, 'phase'))
for tau in (1.6, 2.6):
    for r in (0.0, 1 / 3, 0.5):
        plan.append((9.8, r, tau, 'ar1'))
plan = [p + (0.0,) for p in plan]
for learn in (1.0, 2.0):
    for tau in (0.0, 1.6):
        plan.append((9.8, 0.0, tau, 'phase', learn))
for mu, r, tau, shape, learn in plan:
    o = run(mu, r, tau, shape, SIMS, learn)
    row = {'mu': mu, 'true_drop': round(r, 3), 'tau_true': tau, 'drift_shape': shape, 'natural_learning_drop': learn, **o}
    res['scenarios'].append(row)
    print(json.dumps(row), flush=True)
# binding matched-newcomer condition: nc as the newcomer group would report it (60 players, SE of their mean change 0.5)
for mu in (9.8, 12.5):
    for learn, nc_mean, nc_drift, r in ((0.0, 0.0, 1.6, 0.0), (0.0, 0.0, 1.6, 1 / 3), (0.0, 0.0, 1.6, 0.5),
                                         (0.0, 0.0, 2.6, 1 / 3), (2.0, -2.0, 1.6, 0.0), (2.0, -2.0, 1.6, 1 / 3)):
        nc = {'players': 60, 'mean_change': nc_mean, 'mean_change_se': 0.5, 'drift_sd': nc_drift}
        o = run(mu, r, 1.6, 'phase', SIMS, learn, nc)
        row = {'mu': mu, 'true_drop': round(r, 3), 'tau_true': 1.6, 'natural_learning_drop': learn, 'newcomers': nc, **o}
        res['newcomer_scenarios'].append(row)
        print(json.dumps(row), flush=True)
for mu in (9.8, 12.5):
    for r_threat, r_other, label in ((0.0, 0.0, 'no effect'), (0.2, 0.2, 'same relative drop everywhere (20%)'),
                                     (0.3, 0.0, 'threat blunders -30%, others unchanged'),
                                     (0.5, 0.0, 'threat blunders halved (closes his blitz gap), others unchanged'),
                                     (0.5, 0.15, 'threat blunders halved, others -15%')):
        o = mech_run(mu, r_threat, r_other, 1.6, max(500, SIMS // 2))
        row = {'mu': mu, 'scenario': label, 'r_threat': r_threat, 'r_other': r_other, 'tau_true': 1.6, **o}
        res['mechanism_scenarios'].append(row)
        print(json.dumps(row), flush=True)
if '--with-randomized-start' in sys.argv:
    res['randomized_start_alternative'] = []
    for tau in (0.0, 1.6):
        for r in (0.0, 1 / 3, 0.5):
            row = {'mu': 9.8, 'true_drop': round(r, 3), 'tau_true': tau, 'drift_shape': 'ar1',
                   'p_le_0.05': randomized_start(9.8, r, tau, SIMS // 2)}
            res['randomized_start_alternative'].append(row)
            print(json.dumps(row), flush=True)
json.dump(res, open(OUT, 'w'), indent=1)
