"""Calibrate a Maia-3 move-likelihood rating estimate on one set of players and test it on players never used
for calibration. Pure Python (no numpy).
Input files: ndjson rows from run.mjs (one row per game: target player, true rating in that game, summed
log-likelihood of that player's moves at each Elo on GRID).
Usage: python maia_eval.py --cal a.ndjson,b.ndjson --test c.ndjson [--ai ai_ll.ndjson --ai-truth truth.json] --out results.json
"""
import sys, json, math, random, argparse, statistics as st

ap = argparse.ArgumentParser()
ap.add_argument('--cal', required=True); ap.add_argument('--test', required=True)
ap.add_argument('--ai'); ap.add_argument('--ai-truth'); ap.add_argument('--out', required=True)
ap.add_argument('--grid', default='600,1000,1400,1800,2200,2600', help='evaluate every file on this common Elo grid (a subset of each file\'s own grid)')
A = ap.parse_args()

def load(files):
    rows, seen = [], set()
    for f in files.split(','):
        for l in open(f):
            if not l.strip(): continue
            try: g = json.loads(l)
            except Exception: continue
            if g['id'] in seen: continue
            want = [int(x) for x in A.grid.split(',')]
            if g['grid'] != want:
                g['ll'] = [g['ll'][g['grid'].index(x)] for x in want]; g['grid'] = want
            seen.add(g['id']); rows.append(g)
    return rows

cal, test = load(A.cal), load(A.test)
GRID = cal[0]['grid']
FINE = list(range(GRID[0], GRID[-1] + 1, 10))

def interp(v, x):
    """Piecewise-linear interpolation of a curve given on GRID."""
    if x <= GRID[0]: return v[0]
    if x >= GRID[-1]: return v[-1]
    k = int((x - GRID[0]) // (GRID[1] - GRID[0]))
    t = (x - GRID[k]) / (GRID[1] - GRID[0])
    return v[k] * (1 - t) + v[k + 1] * t

def argmax_interp(v):
    i = max(range(len(v)), key=lambda k: v[k])
    if i == 0 or i == len(v) - 1: return GRID[i]
    a, b, c = v[i - 1], v[i], v[i + 1]
    d = a - 2 * b + c
    off = 0.5 * (a - c) / d if d < 0 else 0
    return GRID[i] + off * (GRID[1] - GRID[0])

def blocks(rows, N):
    byp = {}
    for g in rows: byp.setdefault(g['target'].lower(), []).append(g)
    out = []
    for p, gs in byp.items():
        gs.sort(key=lambda g: g['createdAt'])
        for s in range(0, len(gs) - N + 1, N):
            b = gs[s:s + N]
            ll = [sum(g['ll'][k] for g in b) for k in range(len(GRID))]
            out.append({'player': p, 'truth': st.mean(g['rating'] for g in b), 'll': ll, 'perf': b[0].get('perf') or b[0].get('_perf'),
                        'opp': st.mean(g['oppRating'] for g in b if g.get('oppRating')) if any(g.get('oppRating') for g in b) else None,
                        'moves': sum(g['nMoves'] for g in b), 'n': N})
    return out

def posterior(ll, k, mu, sd, shift):
    """Tempered likelihood x normal prior on a 10-Elo grid. Returns (mean, quantile function)."""
    lp = [k * interp(ll, x) - 0.5 * ((x + shift - mu) / sd) ** 2 for x in FINE]
    m = max(lp); w = [math.exp(v - m) for v in lp]; s = sum(w)
    w = [x / s for x in w]
    mean = sum(x * wi for x, wi in zip(FINE, w)) + shift
    cdf, acc = [], 0
    for wi in w: acc += wi; cdf.append(acc)
    def q(p):
        for x, c in zip(FINE, cdf):
            if c >= p: return x + shift
        return FINE[-1] + shift
    return mean, q

def fit_bayes(cb):
    """Choose temperature k and per-time-control shift on the calibration blocks by maximising the
    log predictive density of the true rating (all N pooled, so one k must work for 1, 5 and 10 games).
    Blitz and rapid shifts are separable, so they are fitted independently."""
    truths = [b['truth'] for bs in cb.values() for b in bs if b['n'] == 1]
    mu, sd = st.mean(truths), st.pstdev(truths)
    X = FINE[::2]
    allb = [b for bs in cb.values() for b in bs]
    pre = [[interp(b['ll'], x) for x in X] for b in allb]
    best = {}
    for k in [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6, 0.8, 1.0]:
        for perf in ('blitz', 'rapid'):
            for sh in range(-250, 251, 25):
                tot = 0
                for b, L in zip(allb, pre):
                    if (b['perf'] == 'rapid') != (perf == 'rapid'): continue
                    lp = [k * l - 0.5 * ((x + sh - mu) / sd) ** 2 for x, l in zip(X, L)]
                    m = max(lp); z = m + math.log(sum(math.exp(v - m) for v in lp))
                    j = min(range(len(X)), key=lambda i: abs(X[i] + sh - b['truth']))
                    tot += lp[j] - z
                best.setdefault(k, {})
                if perf not in best[k] or tot > best[k][perf][0]: best[k][perf] = (tot, sh)
    kbest = max(best, key=lambda k: best[k]['blitz'][0] + best[k]['rapid'][0])
    return {'k': kbest, 'shift_blitz': best[kbest]['blitz'][1], 'shift_rapid': best[kbest]['rapid'][1], 'mu': mu, 'sd': sd,
            'logscore_by_k': {k: round(v['blitz'][0] + v['rapid'][0], 1) for k, v in best.items()}}

def ols(x, y):
    mx, my = st.mean(x), st.mean(y)
    b = sum((a - mx) * (c - my) for a, c in zip(x, y)) / sum((a - mx) ** 2 for a in x)
    return my - b * mx, b

def quant(v, p):
    s = sorted(v); i = p * (len(s) - 1); lo = int(math.floor(i)); hi = min(lo + 1, len(s) - 1)
    return s[lo] * (1 - (i - lo)) + s[hi] * (i - lo)

def fit_measurement(cal_rows):
    """PRIMARY estimator (declared 2026-10-16 13:40 CEST, before any held-out result was seen).
    Measurement model: Maia's raw estimate from N games = c0 + c_rapid*[rapid] + c1*truth + error,
    with error variance s_inf^2 + s1^2/N (s_inf = the player's own style, which more games cannot remove).
    The rating is then the normal posterior given a population prior N(mu, sd0^2) from the calibration players."""
    b1 = blocks(cal_rows, 1)
    X = [(1.0, 1.0 if b['perf'] == 'rapid' else 0.0, b['truth']) for b in b1]
    Y = [argmax_interp(b['ll']) for b in b1]
    # 3-parameter OLS via normal equations
    import itertools
    M = [[sum(x[i] * x[j] for x in X) for j in range(3)] for i in range(3)]
    v = [sum(x[i] * y for x, y in zip(X, Y)) for i in range(3)]
    def solve(M, v):
        n = len(v); A = [row[:] + [v[i]] for i, row in enumerate(M)]
        for c in range(n):
            p = max(range(c, n), key=lambda r: abs(A[r][c])); A[c], A[p] = A[p], A[c]
            for r in range(n):
                if r != c:
                    f = A[r][c] / A[c][c]
                    A[r] = [a - f * b for a, b in zip(A[r], A[c])]
        return [A[i][n] / A[i][i] for i in range(n)]
    c0, cr, c1 = solve(M, v)
    var_by_n = {}
    for N in (1, 2, 3, 5, 10):
        bs = blocks(cal_rows, N)
        res = [argmax_interp(b['ll']) - (c0 + cr * (b['perf'] == 'rapid') + c1 * b['truth']) for b in bs]
        var_by_n[N] = (st.mean(r * r for r in res), len(res))
    # weighted least squares for var_N = s_inf2 + s1_2 / N
    W = [(n, 1.0 / N, v_, n_) for N, (v_, n_) in var_by_n.items() for n in [N]]
    sw = sum(w for *_, w in W); sx = sum(w * x for _, x, _, w in W); sy = sum(w * y for _, _, y, w in W)
    sxx = sum(w * x * x for _, x, _, w in W); sxy = sum(w * x * y for _, x, y, w in W)
    s1_2 = (sw * sxy - sx * sy) / (sw * sxx - sx * sx); sinf2 = (sy - s1_2 * sx) / sw
    truths = [b['truth'] for b in b1]
    return {'c0': c0, 'c_rapid': cr, 'c1': c1, 's_inf': math.sqrt(max(sinf2, 0)), 's1': math.sqrt(max(s1_2, 0)),
            'mu': st.mean(truths), 'sd0': st.pstdev(truths), 'resid_var_by_n': {N: [round(v_), n_] for N, (v_, n_) in var_by_n.items()}}

def measurement_predict(mm, raw, N, perf):
    vN = mm['s_inf'] ** 2 + mm['s1'] ** 2 / N
    t_obs = (raw - mm['c0'] - mm['c_rapid'] * (perf == 'rapid')) / mm['c1']
    prec = 1 / mm['sd0'] ** 2 + mm['c1'] ** 2 / vN
    mean = (mm['mu'] / mm['sd0'] ** 2 + t_obs * mm['c1'] ** 2 / vN) / prec
    sd = math.sqrt(1 / prec)
    return mean, sd

Ns = [1, 5, 10]
cb = {N: blocks(cal, N) for N in Ns}
tb = {N: blocks(test, N) for N in Ns}
model = {'measurement': fit_measurement(cal), 'bayes': fit_bayes(cb), 'linear': {}}
for N in Ns:
    x = [argmax_interp(b['ll']) for b in cb[N]]; y = [b['truth'] for b in cb[N]]
    a, bb = ols(x, y)
    res = [yy - (a + bb * xx) for xx, yy in zip(x, y)]
    model['linear'][N] = {'a': a, 'b': bb, 'q': {p: quant(res, p) for p in (0.025, 0.1, 0.9, 0.975)}, 'n_cal': len(res)}
cal_mean = model['bayes']['mu']

def evaluate(blks, N, label):
    lin = model['linear'][N]; bm = model['bayes']
    rows = []
    for b in blks:
        raw = argmax_interp(b['ll'])
        li = lin['a'] + lin['b'] * raw
        sh = bm['shift_rapid'] if b['perf'] == 'rapid' else bm['shift_blitz']
        pm, q = posterior(b['ll'], bm['k'], bm['mu'], bm['sd'], sh)
        mm_mean, mm_sd = measurement_predict(model['measurement'], raw, N, b['perf'])
        rows.append({'mm': mm_mean, 'mm80': (mm_mean - 1.2816 * mm_sd, mm_mean + 1.2816 * mm_sd), 'mm95': (mm_mean - 1.96 * mm_sd, mm_mean + 1.96 * mm_sd),'player': b['player'], 'truth': b['truth'], 'const': cal_mean, 'opp': b['opp'], 'raw': raw,
                     'lin': li, 'lin80': (li + lin['q'][0.1], li + lin['q'][0.9]), 'lin95': (li + lin['q'][0.025], li + lin['q'][0.975]),
                     'bay': pm, 'bay80': (q(0.1), q(0.9)), 'bay95': (q(0.025), q(0.975)), 'perf': b['perf']})
    return rows

def summarize(rows, key, rng=None):
    r = [x for x in rows if x[key] is not None]
    if not r: return None
    err = [x[key] - x['truth'] for x in r]
    out = {'n_estimates': len(r), 'n_players': len({x['player'] for x in r}), 'mae': round(st.mean(abs(e) for e in err)), 'bias': round(st.mean(err))}
    players = sorted({x['player'] for x in r}); rnd = random.Random(5); boots = []
    for _ in range(1000):
        pick = [rnd.choice(players) for _ in players]
        e = [abs(x[key] - x['truth']) for p in pick for x in r if x['player'] == p]
        boots.append(st.mean(e))
    out['mae_95ci'] = [round(quant(boots, 0.025)), round(quant(boots, 0.975))]
    if rng:
        for lvl in ('80', '95'):
            k = rng + lvl
            out[f'coverage_{lvl}'] = round(st.mean(1 if x[k][0] <= x['truth'] <= x[k][1] else 0 for x in r), 3)
            out[f'median_halfwidth_{lvl}'] = round(st.median((x[k][1] - x[k][0]) / 2 for x in r))
    return out

report = {'grid': GRID, 'model': model, 'calibration': {'games': len(cal), 'players': len({g['target'].lower() for g in cal})},
          'test': {'games': len(test), 'players': len({g['target'].lower() for g in test})}, 'results': {}}
for N in Ns:
    rows = evaluate(tb[N], N, 'test')
    res = {'constant (calibration mean)': summarize(rows, 'const'), 'opponents average (pairing artifact)': summarize(rows, 'opp'),
           'maia raw': summarize(rows, 'raw'), 'PRIMARY maia measurement model': summarize(rows, 'mm', 'mm'), 'maia linear recal': summarize(rows, 'lin', 'lin'), 'maia tempered bayes': summarize(rows, 'bay', 'bay')}
    sub = {}
    for name, f in (('band 800-1400', lambda x: 800 <= x['truth'] < 1400), ('rapid', lambda x: x['perf'] == 'rapid'), ('blitz', lambda x: x['perf'] == 'blitz')):
        rr = [x for x in rows if f(x)]
        if rr:
            sub[name] = {'constant': summarize(rr, 'const'), 'opponents average': summarize(rr, 'opp'), 'PRIMARY maia measurement model': summarize(rr, 'mm', 'mm'), 'maia linear recal': summarize(rr, 'lin', 'lin'), 'maia tempered bayes': summarize(rr, 'bay', 'bay')}
    report['results'][N] = {'all': res, 'subsets': sub}
    # the same model on its own calibration data, to show how much optimism held-out testing removes
    crow = evaluate(cb[N], N, 'cal')
    report['results'][N]['in_sample_calibration'] = {'PRIMARY maia measurement model': summarize(crow, 'mm', 'mm'), 'maia linear recal': summarize(crow, 'lin', 'lin'), 'maia tempered bayes': summarize(crow, 'bay', 'bay')}

if A.ai:
    truth = json.load(open(A.ai_truth))
    ai = [g for g in load(A.ai) if g['target'].lower() in truth]
    for g in ai: g['rating'] = truth[g['target'].lower()]['rating']; g['perf'] = truth[g['target'].lower()]['perf']
    report['ai_games'] = {}
    for N in Ns:
        blk = blocks(ai, N)
        rows = evaluate(blk, N, 'ai') if blk else []
        report['ai_games'][N] = {'constant': summarize(rows, 'const'), 'PRIMARY maia measurement model': summarize(rows, 'mm', 'mm'), 'maia linear recal': summarize(rows, 'lin', 'lin'), 'maia tempered bayes': summarize(rows, 'bay', 'bay')} if rows else None
json.dump(report, open(A.out, 'w'), indent=1, default=str)
print(json.dumps(report['results'], indent=1, default=str)[:6000])
print('model', json.dumps(model, default=str)[:800])
