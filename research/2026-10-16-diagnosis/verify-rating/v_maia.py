"""Independent re-implementation of the pre-declared Maia-3 rating test (verify-rating pass, 2026-10-16).
Written from PREDECLARED.md's description, not from the investigation's code. Inputs are the per-game Maia-3
log-likelihood rows (one row per game: target, rating, perf, createdAt, ll on an Elo grid).

What it computes
1. PRE-DECLARED test: fit on the 44 calibration players, test on the 84 held-out players, at 1, 5 and 10 games.
   Two ways to read Maia's "most likely rating" from the 6-point grid (600..2600 every 400):
     'parabola'  = vertex of the parabola through the best grid point and its two neighbours
     'spline'    = maximum of a natural cubic spline through all 6 points (searched on a 1-Elo grid)
   Two ways to fit the error model's two parts (style part s_inf that more games cannot remove, and s1/sqrt(N)):
     'blocks'    = mean squared error of N-game estimates for N = 1,2,3,5,10, then weighted line in 1/N (as declared)
     'ml'        = maximum likelihood over the same N-game blocks (normal errors), grid search
2. Baselines on the same held-out estimates, including the 800-1400 subset and its own mean as a constant.
3. Games against the Lichess computer (truth = the player's mean rated rating), as in the investigation.
4. POST-HOC: leave-one-player-out and 20 random 4-fold splits on all 128 players.
Usage: python v_maia.py <cal files,comma> <test.ndjson> <ai.ndjson> <ai_truth.json> <out.json>"""
import sys, json, math, random, statistics as st

GRID = [600, 1000, 1400, 1800, 2200, 2600]
Z80, Z95 = 1.2815516, 1.9599640

def load(files):
    seen, out = set(), []
    for f in files.split(','):
        for line in open(f):
            if not line.strip(): continue
            g = json.loads(line)
            if g['id'] in seen or g.get('rating') is None: continue
            seen.add(g['id'])
            ll = [g['ll'][g['grid'].index(x)] for x in GRID]
            out.append({'id': g['id'], 'p': g['target'].lower(), 'r': g['rating'], 'perf': g.get('perf'), 't': g['createdAt'], 'll': ll})
    return out

# ---------- reading the most likely rating from the grid ----------
def peak_parabola(v):
    i = v.index(max(v))
    if i in (0, len(v) - 1): return float(GRID[i])
    a, b, c = v[i - 1], v[i], v[i + 1]
    den = a - 2 * b + c
    return GRID[i] + (0.5 * (a - c) / den * 400 if den < 0 else 0.0)

def natural_spline(xs, ys):
    n = len(xs) - 1; h = [xs[i + 1] - xs[i] for i in range(n)]
    al = [0.0] + [3 / h[i] * (ys[i + 1] - ys[i]) - 3 / h[i - 1] * (ys[i] - ys[i - 1]) for i in range(1, n)]
    l, mu, z = [1.0] + [0.0] * n, [0.0] * (n + 1), [0.0] * (n + 1)
    for i in range(1, n):
        l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (al[i] - h[i - 1] * z[i - 1]) / l[i]
    c, b, d = [0.0] * (n + 1), [0.0] * n, [0.0] * n
    for j in range(n - 1, -1, -1):
        c[j] = z[j] - mu[j] * c[j + 1]
        b[j] = (ys[j + 1] - ys[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3; d[j] = (c[j + 1] - c[j]) / (3 * h[j])
    def f(x):
        j = min(max(0, int((x - xs[0]) // h[0])), n - 1); dx = x - xs[j]
        return ys[j] + b[j] * dx + c[j] * dx * dx + d[j] * dx ** 3
    return f

def peak_spline(v):
    f = natural_spline(GRID, v)
    best = max(range(GRID[0], GRID[-1] + 1, 5), key=f)
    return float(best)

PEAK = {'parabola': peak_parabola, 'spline': peak_spline}

def make_blocks(rows, N, peak):
    by = {}
    for g in rows: by.setdefault(g['p'], []).append(g)
    out = []
    for p, gs in by.items():
        gs = sorted(gs, key=lambda g: g['t'])
        for s in range(0, len(gs) - N + 1, N):
            b = gs[s:s + N]
            ll = [sum(g['ll'][k] for g in b) for k in range(len(GRID))]
            out.append({'p': p, 'truth': sum(g['r'] for g in b) / N, 'raw': peak(ll), 'rapid': 1.0 if b[0]['perf'] == 'rapid' else 0.0, 'N': N})
    return out

# ---------- the measurement model ----------
def lstsq(X, y):
    k = len(X[0])
    A = [[sum(r[i] * r[j] for r in X) for j in range(k)] + [sum(r[i] * yy for r, yy in zip(X, y))] for i in range(k)]
    for c in range(k):
        piv = max(range(c, k), key=lambda r: abs(A[r][c])); A[c], A[piv] = A[piv], A[c]
        for r in range(k):
            if r != c:
                f = A[r][c] / A[c][c]; A[r] = [a - f * bb for a, bb in zip(A[r], A[c])]
    return [A[i][k] / A[i][i] for i in range(k)]

def fit(rows, peak, var_method='blocks', rapid_offset=True):
    b1 = make_blocks(rows, 1, peak)
    X = [[1.0, b['rapid'], b['truth']] if rapid_offset else [1.0, b['truth']] for b in b1]
    coef = lstsq(X, [b['raw'] for b in b1])
    c0, cr, c1 = coef if rapid_offset else (coef[0], 0.0, coef[1])
    pts = []
    allres = []
    for N in (1, 2, 3, 5, 10):
        bl = make_blocks(rows, N, peak)
        res = [b['raw'] - (c0 + cr * b['rapid'] + c1 * b['truth']) for b in bl]
        if len(res) >= 10:
            pts.append((1.0 / N, sum(r * r for r in res) / len(res), len(res)))
            allres += [(N, r) for r in res]
    if var_method == 'blocks':
        W = sum(w for *_, w in pts); mx = sum(w * x for x, _, w in pts) / W; my = sum(w * y for _, y, w in pts) / W
        slope = sum(w * (x - mx) * (y - my) for x, y, w in pts) / sum(w * (x - mx) ** 2 for x, _, w in pts)
        s1sq, sinfsq = slope, my - slope * mx
    else:  # maximum likelihood over all blocks, treating them as independent normal errors
        best = None
        for si in range(0, 401, 4):
            for s1 in range(0, 601, 4):
                L = 0.0
                for N, r in allres:
                    v = si * si + s1 * s1 / N
                    if v <= 0: L = -1e18; break
                    L += -0.5 * math.log(v) - 0.5 * r * r / v
                if best is None or L > best[0]: best = (L, si * si, s1 * s1)
        _, sinfsq, s1sq = best
    tr = [b['truth'] for b in b1]
    mu = sum(tr) / len(tr); sd0 = math.sqrt(sum((t - mu) ** 2 for t in tr) / len(tr))
    return {'c0': c0, 'c_rapid': cr, 'c1': c1, 's_inf': math.sqrt(max(sinfsq, 0)), 's1': math.sqrt(max(s1sq, 0)), 'mu': mu, 'sd0': sd0}

def predict(m, b):
    vN = m['s_inf'] ** 2 + m['s1'] ** 2 / b['N']
    obs = (b['raw'] - m['c0'] - m['c_rapid'] * b['rapid']) / m['c1']
    w_data = m['c1'] ** 2 / vN; w_prior = 1 / m['sd0'] ** 2
    mean = (obs * w_data + m['mu'] * w_prior) / (w_data + w_prior)
    return mean, math.sqrt(1 / (w_data + w_prior))

def score(preds, truth_key='truth', est='est', sd='sd', boot=True):
    if not preds: return None
    e = [abs(x[est] - x[truth_key]) for x in preds]
    out = {'estimates': len(preds), 'players': len({x['p'] for x in preds}), 'mae': round(sum(e) / len(e), 1),
           'bias': round(sum(x[est] - x[truth_key] for x in preds) / len(preds), 1)}
    if sd:
        out['cover80'] = round(sum(abs(x[est] - x[truth_key]) <= Z80 * x[sd] for x in preds) / len(preds), 3)
        out['cover95'] = round(sum(abs(x[est] - x[truth_key]) <= Z95 * x[sd] for x in preds) / len(preds), 3)
        out['halfwidth80_median'] = round(st.median(Z80 * x[sd] for x in preds))
    if boot:
        players = sorted({x['p'] for x in preds}); by = {}
        for x in preds: by.setdefault(x['p'], []).append(x)
        rnd = random.Random(99); maes, covs = [], []
        for _ in range(2000):
            pick = [rnd.choice(players) for _ in players]
            xs = [x for p in pick for x in by[p]]
            maes.append(sum(abs(x[est] - x[truth_key]) for x in xs) / len(xs))
            if sd: covs.append(sum(abs(x[est] - x[truth_key]) <= Z80 * x[sd] for x in xs) / len(xs))
        maes.sort(); out['mae_95ci_player_bootstrap'] = [round(maes[50]), round(maes[1949])]
        if sd: covs.sort(); out['cover80_95ci_player_bootstrap'] = [round(covs[50], 3), round(covs[1949], 3)]
    return out

cal = load(sys.argv[1]); test = load(sys.argv[2])
ai_truth = json.load(open(sys.argv[4]))
ai = []
for g in load(sys.argv[3]):
    t = ai_truth.get(g['p'])
    if t: g['r'] = t['rating']; g['perf'] = t['perf']; ai.append(g)
report = {'data': {'cal_games': len(cal), 'cal_players': len({g['p'] for g in cal}), 'test_games': len(test), 'test_players': len({g['p'] for g in test}),
                   'ai_games': len(ai), 'ai_players': len({g['p'] for g in ai}), 'player_overlap_cal_test': len({g['p'] for g in cal} & {g['p'] for g in test})},
          'predeclared': {}, 'baselines': {}, 'ai': {}, 'posthoc': {}}

for pk in ('parabola', 'spline'):
    for vm in ('blocks', 'ml'):
        m = fit(cal, PEAK[pk], vm)
        key = f'{pk}+{vm}'
        report['predeclared'][key] = {'model': {k: round(v, 3) for k, v in m.items()}}
        for N in (1, 5, 10):
            preds = []
            for b in make_blocks(test, N, PEAK[pk]):
                mean, sd = predict(m, b); preds.append({**b, 'est': mean, 'sd': sd})
            sub = [x for x in preds if 800 <= x['truth'] < 1400]
            report['predeclared'][key][N] = {'all': score(preds), 'truth 800-1400': score(sub)}
            if key == 'parabola+blocks':
                # baselines
                cal_mean = m['mu']; tmean = sum(x['truth'] for x in preds) / len(preds); smean = sum(x['truth'] for x in sub) / len(sub)
                for x in preds: x['c_cal'] = cal_mean; x['c_test'] = tmean; x['c_sub'] = smean; x['raw_est'] = x['raw']
                report['baselines'][N] = {'constant calibration mean': {'value': round(cal_mean), **score(preds, est='c_cal', sd=None, boot=False)},
                                          'constant held-out mean (not knowable)': {'value': round(tmean), **score(preds, est='c_test', sd=None, boot=False)},
                                          'subset 800-1400 constant at its own mean': {'value': round(smean), **score(sub, est='c_sub', sd=None, boot=False)},
                                          'subset 800-1400 constant 1100 (fixed, not fitted)': score([{**x, 'c': 1100} for x in sub], est='c', sd=None, boot=False),
                                          'Maia raw peak, no correction': score(preds, est='raw_est', sd=None, boot=False)}
                aip = []
                for b in make_blocks(ai, N, PEAK[pk]):
                    mean, sd = predict(m, b); aip.append({**b, 'est': mean, 'sd': sd})
                report['ai'][N] = score(aip)

# post-hoc cross-validation on everyone
allrows = cal + test
players = sorted({g['p'] for g in allrows})
def cv(assign, peak=PEAK['parabola'], rapid_offset=True):
    preds = {1: [], 5: [], 10: []}
    for f in sorted(set(assign.values())):
        train = [g for g in allrows if assign[g['p']] != f]; tst = [g for g in allrows if assign[g['p']] == f]
        m = fit(train, peak, 'blocks', rapid_offset)
        for N in preds:
            for b in make_blocks(tst, N, peak):
                mean, sd = predict(m, b); preds[N].append({**b, 'est': mean, 'sd': sd})
    return preds
res = {}
for seed in range(20):
    pl = players[:]; random.Random(1000 + seed).shuffle(pl)
    pr = cv({p: i % 4 for i, p in enumerate(pl)})
    for N, v in pr.items():
        s = score(v, boot=False); res.setdefault(N, []).append((s['mae'], s['cover80'], s['cover95']))
report['posthoc']['4fold_20_seeds'] = {N: {'mae_mean': round(st.mean(a for a, _, _ in v), 1), 'mae_range': [min(a for a, _, _ in v), max(a for a, _, _ in v)],
                                             'cover80_mean': round(st.mean(b for _, b, _ in v), 3), 'cover80_range': [min(b for _, b, _ in v), max(b for _, b, _ in v)],
                                             'cover95_mean': round(st.mean(c for _, _, c in v), 3)} for N, v in res.items()}
loo = cv({p: i for i, p in enumerate(players)})
report['posthoc']['leave_one_player_out'] = {N: score(v) for N, v in loo.items()}
for N, v in loo.items():
    sub = [x for x in v if 800 <= x['truth'] < 1400]
    report['posthoc']['leave_one_player_out'][f'{N} truth 800-1400'] = score(sub, boot=False)
full = fit(allrows, PEAK['parabola'], 'blocks'); full_ml = fit(allrows, PEAK['parabola'], 'ml')
report['posthoc']['model_all_128'] = {'blocks': {k: round(v, 2) for k, v in full.items()}, 'ml': {k: round(v, 2) for k, v in full_ml.items()}}
for N in (10,):
    report['posthoc'][f'sd_of_one_{N}_game_estimate_all128'] = round(math.sqrt(full['s_inf'] ** 2 + full['s1'] ** 2 / N) / full['c1'])
json.dump(report, open(sys.argv[5], 'w'), indent=1)
print(json.dumps(report, indent=1)[:12000])
