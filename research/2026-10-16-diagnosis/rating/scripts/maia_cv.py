"""POST-HOC (not part of the pre-declared test): player-level cross-validation of the Maia-3 measurement model on
all scored players (calibration + held-out), and the final model fitted on everyone, for the app.
Every test player is unseen by the model that scores them. Variants: with and without a rapid-vs-blitz offset.
Usage: python maia_cv.py --files a.ndjson,b.ndjson,... --out cv.json [--folds 4]"""
import json, math, random, argparse, statistics as st
ap = argparse.ArgumentParser(); ap.add_argument('--files', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--folds', type=int, default=4); ap.add_argument('--grid', default='600,1000,1400,1800,2200,2600')
A = ap.parse_args()
GRID = [int(x) for x in A.grid.split(',')]

def load(files):
    rows, seen = [], set()
    for f in files.split(','):
        for l in open(f):
            if not l.strip(): continue
            g = json.loads(l)
            if g['id'] in seen or g.get('rating') is None: continue
            if g['grid'] != GRID: g['ll'] = [g['ll'][g['grid'].index(x)] for x in GRID]; g['grid'] = GRID
            seen.add(g['id']); rows.append(g)
    return rows

def argmax_interp(v):
    i = max(range(len(v)), key=lambda k: v[k])
    if i == 0 or i == len(v) - 1: return GRID[i]
    a, b, c = v[i - 1], v[i], v[i + 1]; d = a - 2 * b + c
    return GRID[i] + (0.5 * (a - c) / d if d < 0 else 0) * (GRID[1] - GRID[0])

def blocks(rows, N):
    byp = {}
    for g in rows: byp.setdefault(g['target'].lower(), []).append(g)
    out = []
    for p, gs in byp.items():
        gs.sort(key=lambda g: g['createdAt'])
        for s in range(0, len(gs) - N + 1, N):
            b = gs[s:s + N]
            out.append({'player': p, 'truth': st.mean(g['rating'] for g in b), 'raw': argmax_interp([sum(g['ll'][k] for g in b) for k in range(len(GRID))]),
                        'perf': b[0].get('perf'), 'n': N})
    return out

def solve(M, v):
    n = len(v); Aa = [row[:] + [v[i]] for i, row in enumerate(M)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(Aa[r][c])); Aa[c], Aa[p] = Aa[p], Aa[c]
        for r in range(n):
            if r != c:
                f = Aa[r][c] / Aa[c][c]; Aa[r] = [a - f * b for a, b in zip(Aa[r], Aa[c])]
    return [Aa[i][n] / Aa[i][i] for i in range(n)]

def fit(rows, use_rapid):
    b1 = blocks(rows, 1)
    X = [(1.0, (1.0 if b['perf'] == 'rapid' else 0.0), b['truth']) if use_rapid else (1.0, b['truth']) for b in b1]
    Y = [b['raw'] for b in b1]; k = len(X[0])
    coef = solve([[sum(x[i] * x[j] for x in X) for j in range(k)] for i in range(k)], [sum(x[i] * y for x, y in zip(X, Y)) for i in range(k)])
    c0, cr, c1 = (coef if use_rapid else (coef[0], 0.0, coef[1]))
    pts = []
    for N in (1, 2, 3, 5, 10):
        res = [b['raw'] - (c0 + cr * (b['perf'] == 'rapid') + c1 * b['truth']) for b in blocks(rows, N)]
        if len(res) >= 10: pts.append((1.0 / N, st.mean(r * r for r in res), len(res)))
    sw = sum(w for *_, w in pts); sx = sum(w * x for x, _, w in pts); sy = sum(w * y for _, y, w in pts)
    sxx = sum(w * x * x for x, _, w in pts); sxy = sum(w * x * y for x, y, w in pts)
    s1_2 = (sw * sxy - sx * sy) / (sw * sxx - sx * sx); sinf2 = (sy - s1_2 * sx) / sw
    tr = [b['truth'] for b in b1]
    return {'c0': c0, 'c_rapid': cr, 'c1': c1, 's_inf': math.sqrt(max(sinf2, 0)), 's1': math.sqrt(max(s1_2, 0)), 'mu': st.mean(tr), 'sd0': st.pstdev(tr)}

def predict(m, raw, N, perf):
    vN = m['s_inf'] ** 2 + m['s1'] ** 2 / N
    t_obs = (raw - m['c0'] - m['c_rapid'] * (perf == 'rapid')) / m['c1']
    prec = 1 / m['sd0'] ** 2 + m['c1'] ** 2 / vN
    return (m['mu'] / m['sd0'] ** 2 + t_obs * m['c1'] ** 2 / vN) / prec, math.sqrt(1 / prec)

rows = load(A.files)
players = sorted({g['target'].lower() for g in rows}); rnd = random.Random(42); rnd.shuffle(players)
fold = {p: i % A.folds for i, p in enumerate(players)}
report = {'players': len(players), 'games': len(rows), 'folds': A.folds, 'cv': {}, 'final_model': {}}
for use_rapid in (True, False):
    name = 'with rapid offset' if use_rapid else 'no rapid offset'
    preds = {N: [] for N in (1, 5, 10)}
    for f in range(A.folds):
        train = [g for g in rows if fold[g['target'].lower()] != f]; test = [g for g in rows if fold[g['target'].lower()] == f]
        m = fit(train, use_rapid); const = m['mu']
        for N in preds:
            for b in blocks(test, N):
                mean, sd = predict(m, b['raw'], N, b['perf'])
                preds[N].append({**b, 'est': mean, 'sd': sd, 'const': const})
    out = {}
    for N, ps in preds.items():
        def summ(sub):
            if not sub: return None
            e = [p['est'] - p['truth'] for p in sub]
            return {'n_estimates': len(sub), 'n_players': len({p['player'] for p in sub}), 'mae': round(st.mean(abs(x) for x in e)), 'bias': round(st.mean(e)),
                    'const_mae': round(st.mean(abs(p['const'] - p['truth']) for p in sub)),
                    'coverage_80': round(st.mean(abs(p['est'] - p['truth']) <= 1.2816 * p['sd'] for p in sub), 3),
                    'coverage_95': round(st.mean(abs(p['est'] - p['truth']) <= 1.96 * p['sd'] for p in sub), 3),
                    'median_halfwidth_80': round(st.median(1.2816 * p['sd'] for p in sub))}
        out[N] = {'all': summ(ps), 'band 800-1400': summ([p for p in ps if 800 <= p['truth'] < 1400]),
                  'rapid': summ([p for p in ps if p['perf'] == 'rapid']), 'blitz': summ([p for p in ps if p['perf'] == 'blitz'])}
    report['cv'][name] = out
    report['final_model'][name] = fit(rows, use_rapid)
json.dump(report, open(A.out, 'w'), indent=1)
for name, out in report['cv'].items():
    for N, d in out.items():
        for k, v in d.items():
            if v: print(name, N, k, v)
print(json.dumps(report['final_model'], indent=1))
