# Pre-registered verdict: did adding the Safety-check trainer lower Alexander's blunders at rated 10+0?
# Protocol: research/2026-10-16-diagnosis/preregistration.md (written 2026-10-16). Every number that decides the
# verdict is in DESIGN below and must not change after the pre-registration is time-stamped.
# Version 2 (2026-10-16, before the time-stamp, after two independent critiques): 30-game baseline (games 11-40,
# unlock after game 40); 'did not work' renamed 'no big effect'; matched newcomers (if frozen in time) are a
# binding second condition for 'worked'; a pre-set mechanism test (key secondary, does not change the verdict);
# a descriptive 'winning with no threat' rate.
#
# Input: the CSV written by measure.py (one row per rated 10+0 game, numbered 1, 2, 3 ... in the order played).
# Usage (from the repo root; needs no Claude, no login and no clicks):
#   .venv/bin/python -I research/2026-10-16-diagnosis/prereg/verdict.py games.csv [--unlock-after U]
#                    [--json out.json] [--newcomers newcomers.json]
# --newcomers: pass it only if newcomers.json was committed before his game U+1 (preregistration.md 3.6); it then
#              becomes a binding second condition for 'worked'.
#   .venv/bin/python -I research/2026-10-16-diagnosis/prereg/verdict.py --selftest
# --unlock-after U: the number of rated 10+0 games he had played when the trainer became available (default 40).
# Pure Python 3.9+, standard library only. Deterministic: the verdict uses no random numbers.
import csv, json, math, sys

DESIGN = {
    'version': 'prereg-2026-10-16-v2',
    'game_filter': 'rated, standard chess, 10+0 (600 s, no increment), Lichess account abustrup',
    'run_in': [1, 10],            # not analysed: rating still settling from Lichess's provisional 1500
    'baseline': [11, 40],         # phase A: the study version of the app without the trainer
    'unlock_after_game': 40,      # the trainer becomes available after game 40 (later only if it is not ready)
    'min_baseline_games': 30,     # an earlier unlock makes the study invalid
    'wash_in_games': 20,          # training has started but is not measured yet
    'looks': [                    # measured training games, counted after the wash-in
        {'name': 'look 1', 'measured_games': 50, 'worked_z': 2.33, 'not_worked_z': 2.33},
        {'name': 'look 2 (final)', 'measured_games': 100, 'worked_z': 1.70, 'not_worked_z': 1.70},
    ],
    'tau': 1.6,                   # natural ups and downs: SD of an untrained player's change in true blunders per 100
                                  # moves between two phases (verify-population block method: 1.66, 1.60, 1.57)
    'tau_sensitivity': [0.0, 2.6],
    'natural_change': 0.0,        # untrained comparison players change by +0.0 to +0.34 per 100 over 50-150 games
    'sesoi_fraction': 1 / 3,      # 'no big effect' = confident the true drop is smaller than a third of the baseline rate
    'newcomers_min_players': 30,  # the matched-newcomer condition binds only with at least this many players
    'mechanism_z': 1.645,         # key secondary (one-sided 5%): threat blunders fall more, relatively, than others
    'min_games_lichess_own': 20,  # secondary S3 needs this many Lichess-analysed games in each phase
    # Lichess 10+0 rating change of untrained 950-1250 players after N games (verify-population
    # r_group_combined_rapid10.json: n = 126 / 100 / 78 players); interpolated linearly between the points.
    'rating_comparison_points': {50: (6.2, 50.4, 74.0), 100: (17.5, 57.4, 104.1), 150: (25.8, 65.4, 115.4)},
}

INT_FIELDS = ('seq', 'my_moves', 'my_blunders', 'my_mistakes', 'my_inaccuracies', 'threat_moves', 'threat_blunders',
              'nothreat_moves', 'nothreat_blunders', 'win_nothreat_moves', 'win_nothreat_blunders', 'opp_moves', 'opp_blunders',
              'my_rating', 'my_rating_diff', 'opp_rating', 'lichess_my_blunders')

LABEL_WORKED = 'worked'
LABEL_NO_BIG = 'no big effect (a drop of a third or more is ruled out)'
LABEL_CANNOT = 'cannot tell'


def windows(unlock_after=None):
    """Game-number windows for the baseline, the wash-in and each look."""
    U = DESIGN['unlock_after_game'] if unlock_after is None else unlock_after
    lo, hi = DESIGN['baseline']
    hi = min(hi, U)
    w = {'baseline': [lo, hi], 'wash_in': [U + 1, U + DESIGN['wash_in_games']], 'looks': []}
    start = U + DESIGN['wash_in_games'] + 1
    for look in DESIGN['looks']:
        w['looks'].append({**look, 'window': [start, start + look['measured_games'] - 1]})
    return w


def load(path):
    rows = []
    with open(path, newline='') as f:
        for r in csv.DictReader(f):
            for k in INT_FIELDS:
                if k in r:
                    r[k] = int(float(r[k])) if r[k] not in ('', None) else None
            r['score'] = float(r['score']) if r.get('score') not in ('', None) else None
            rows.append(r)
    rows.sort(key=lambda r: r['seq'])
    for i, r in enumerate(rows, 1):
        if r['seq'] != i:
            raise SystemExit(f'games must be numbered 1..n without gaps; found {r["seq"]} at position {i}')
    return rows


def window(rows, lo, hi):
    return [r for r in rows if lo <= r['seq'] <= hi]


def ratio(rows, num='my_blunders', den='my_moves'):
    """Pooled rate per 100 (100 * sum num / sum den) and its variance by the ratio (delta) method, games as units."""
    rows = [r for r in rows if r.get(den) and r.get(num) is not None]
    n = len(rows)
    N = sum(r[num] for r in rows); D = sum(r[den] for r in rows)
    if n < 2 or D == 0:
        return {'rate': None, 'var': None, 'games': n, 'events': N, 'moves': D}
    p = N / D
    ss = sum((r[num] - p * r[den]) ** 2 for r in rows)
    var = (100.0 / D) ** 2 * ss * n / (n - 1)
    return {'rate': 100 * p, 'var': var, 'se': math.sqrt(var), 'games': n, 'events': N, 'moves': D}


def norm_cdf(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def classify(D, se_total, sesoi, worked_z, not_worked_z, newcomer_ok=True):
    worked = D / se_total >= worked_z and newcomer_ok
    not_worked = D + not_worked_z * se_total < sesoi
    if worked and not_worked:
        return LABEL_WORKED + ' (the drop may be smaller than a third)'
    if worked:
        return LABEL_WORKED
    if not_worked:
        return LABEL_NO_BIG
    return None


def newcomer_valid(nc):
    return bool(nc) and nc.get('players', 0) >= DESIGN['newcomers_min_players'] and \
        all(k in nc for k in ('mean_change', 'mean_change_se', 'drift_sd'))


def newcomer_z(D, se_s, nc):
    """Training-specific drop after subtracting what matched newcomers change by themselves.
    nc['mean_change'] = their rate in the training window minus the baseline window (negative = they improve alone)."""
    Dn = D - DESIGN['natural_change'] + nc['mean_change']
    se = math.sqrt(se_s ** 2 + nc['drift_sd'] ** 2 + nc['mean_change_se'] ** 2)
    return Dn, se, Dn / se


def primary(rows, tau=None, natural_change=None, unlock_after=None, nc=None):
    """The main measure and the decision rule. Returns per-look numbers and the verdict reached so far.
    nc: matched-newcomer summary; binding only if newcomer_valid(nc) (and, by the protocol, only if it was frozen
    before the unlock; the caller checks that)."""
    nc = nc if newcomer_valid(nc) else None
    tau = DESIGN['tau'] if tau is None else tau
    nat = DESIGN['natural_change'] if natural_change is None else natural_change
    W = windows(unlock_after)
    n = len(rows)
    A = ratio(window(rows, *W['baseline']))
    out = {'games_played': n, 'windows': W, 'baseline': A, 'looks': [], 'verdict': None, 'decided_at_game': None,
           'newcomer_condition': 'binding' if nc else 'not available (main rule only)'}
    if W['baseline'][1] - W['baseline'][0] + 1 < DESIGN['min_baseline_games']:
        out['verdict'] = f"invalid: baseline shorter than {DESIGN['min_baseline_games']} games"
        return out
    if n < W['baseline'][1] or A['rate'] is None:
        out['verdict'] = 'not yet: baseline incomplete'
        return out
    sesoi = DESIGN['sesoi_fraction'] * A['rate']
    out['sesoi'] = sesoi
    for k, look in enumerate(W['looks']):
        lo, hi = look['window']
        if n < hi:
            out['verdict'] = f'not yet: next look after game {hi}'
            break
        B = ratio(window(rows, lo, hi))
        # D > 0 means fewer blunders in training than in the baseline, beyond untrained players' natural change
        D = A['rate'] - B['rate'] + nat
        se_s = math.sqrt(A['var'] + B['var'])
        se_t = math.sqrt(se_s ** 2 + tau ** 2)
        z = D / se_t
        entry = {'look': look['name'], 'window': look['window'], 'training': B, 'drop_per100': D,
                 'drop_relative': D / A['rate'], 'se_sampling': se_s, 'se_total': se_t, 'z': z,
                 'range90': [D - 1.645 * se_t, D + 1.645 * se_t]}
        nc_ok = True
        if nc:
            Dn, se_n, z_n = newcomer_z(D, se_s, nc)
            nc_ok = z_n >= look['worked_z']
            entry['newcomer_adjusted'] = {'drop_per100': Dn, 'se': se_n, 'z': z_n, 'passes': nc_ok,
                                          'range90': [Dn - 1.645 * se_n, Dn + 1.645 * se_n]}
        v = classify(D, se_t, sesoi, look['worked_z'], look['not_worked_z'], nc_ok)
        entry['verdict'] = v
        if nc and not nc_ok and z >= look['worked_z']:
            entry['note'] = 'the main test passed, but not after subtracting what matched newcomers improve by themselves'
        out['looks'].append(entry)
        if v is not None:
            out['verdict'] = v; out['decided_at_game'] = hi
            break
        if k == len(W['looks']) - 1:
            out['verdict'] = LABEL_CANNOT; out['decided_at_game'] = hi
    return out


def diff_of_ratios(a_rows, b_rows, num, den):
    A = ratio(a_rows, num, den); B = ratio(b_rows, num, den)
    if A['rate'] is None or B['rate'] is None:
        return {'baseline': A, 'training': B, 'drop': None}
    D = A['rate'] - B['rate']; se = math.sqrt(A['var'] + B['var'])
    return {'baseline': A, 'training': B, 'drop': D, 'drop_relative': (D / A['rate'] if A['rate'] else None),
            'range90_sampling_only': [D - 1.645 * se, D + 1.645 * se]}


def _sums(rows, num, den):
    return sum(r[num] for r in rows), sum(r[den] for r in rows)


def log_rate_cov(rows, n1, d1, n2, d2):
    """Covariance of log(sum n1/sum d1) and log(sum n2/sum d2), games as units (delta method)."""
    rows = [r for r in rows if r.get(d1) is not None and r.get(d2) is not None]
    n = len(rows)
    N1, D1 = _sums(rows, n1, d1); N2, D2 = _sums(rows, n2, d2)
    if n < 2 or not N1 or not N2 or not D1 or not D2:
        return None
    p1, p2 = N1 / D1, N2 / D2
    c = sum((r[n1] - p1 * r[d1]) * (r[n2] - p2 * r[d2]) for r in rows) * n / (n - 1)
    return c / (N1 * N2)   # = cov(rate1, rate2) / (rate1 * rate2)


def mechanism(a_rows, b_rows):
    """Key secondary (pre-set; it does not change the main verdict). Do blunders on moves made while facing a
    concrete threat (S1) fall more, in relative terms, than blunders on his other tested moves (S2)?
    M = log(S2_B / S2_A) - log(S1_B / S1_A); M > 0 means threat blunders fell more. Common drift, opponent pool and
    a general change in his play cancel; game-clustered delta-method SE."""
    t, nt = ('threat_blunders', 'threat_moves'), ('nothreat_blunders', 'nothreat_moves')
    va = [log_rate_cov(a_rows, *t, *t), log_rate_cov(a_rows, *nt, *nt), log_rate_cov(a_rows, *t, *nt)]
    vb = [log_rate_cov(b_rows, *t, *t), log_rate_cov(b_rows, *nt, *nt), log_rate_cov(b_rows, *t, *nt)]
    s1 = diff_of_ratios(a_rows, b_rows, *t); s2 = diff_of_ratios(a_rows, b_rows, *nt)
    if None in va or None in vb or not s1['training']['events'] or not s2['training']['events']:
        return {'S1': s1, 'S2': s2, 'reading': 'not estimable (a zero count)'}
    M = (math.log(s2['training']['rate'] / s2['baseline']['rate'])
         - math.log(s1['training']['rate'] / s1['baseline']['rate']))
    var = va[0] + va[1] - 2 * va[2] + vb[0] + vb[1] - 2 * vb[2]
    se = math.sqrt(max(var, 1e-12)); z = M / se
    ok = z >= DESIGN['mechanism_z'] and s1['drop'] > 0
    return {'S1': s1, 'S2': s2, 'M_log_ratio_of_ratios': M, 'se': se, 'z': z,
            'S1_relative_change': s1['training']['rate'] / s1['baseline']['rate'] - 1,
            'S2_relative_change': s2['training']['rate'] / s2['baseline']['rate'] - 1,
            'reading': 'mechanism supported' if ok else 'mechanism not supported'}


def rating_comparison(n_games):
    pts = sorted(DESIGN['rating_comparison_points'].items())
    if n_games <= pts[0][0]:
        return dict(zip(('mean', 'sd', 'p95'), pts[0][1]))
    for (a, va), (b, vb) in zip(pts, pts[1:]):
        if n_games <= b:
            f = (n_games - a) / (b - a)
            return {k: round(x + f * (y - x), 1) for k, x, y in zip(('mean', 'sd', 'p95'), va, vb)}
    return dict(zip(('mean', 'sd', 'p95'), pts[-1][1]))  # beyond 150 games: the 150-game values (no data further out)


def rating_after(rows, k):
    r = rows[k - 1]
    if r['my_rating'] is None or r['my_rating_diff'] is None:
        return None
    return r['my_rating'] + r['my_rating_diff']


def poisson_adjusted(a_rows, b_rows):
    """Sensitivity: blunders ~ Poisson(moves * exp(b0 + b1*training + b2*(opponent rating - 1100)/100)),
    fitted by IRLS, robust (sandwich) standard errors. Returns the opponent-adjusted training rate ratio."""
    data = [(r['my_blunders'], r['my_moves'], 0.0, (r['opp_rating'] - 1100) / 100) for r in a_rows if r['my_moves'] and r['opp_rating']]
    data += [(r['my_blunders'], r['my_moves'], 1.0, (r['opp_rating'] - 1100) / 100) for r in b_rows if r['my_moves'] and r['opp_rating']]
    if len(data) < 10:
        return None
    beta = [math.log(max(sum(d[0] for d in data), 1) / sum(d[1] for d in data)), 0.0, 0.0]
    for _ in range(50):
        XtWX = [[0.0] * 3 for _ in range(3)]; XtWz = [0.0] * 3
        for y, m, t, o in data:
            x = (1.0, t, o); eta = sum(b * xi for b, xi in zip(beta, x)) + math.log(m); mu = math.exp(eta)
            z = eta - math.log(m) + (y - mu) / mu
            for i in range(3):
                XtWz[i] += x[i] * mu * z
                for j in range(3):
                    XtWX[i][j] += x[i] * mu * x[j]
        new = solve3(XtWX, XtWz)
        if max(abs(a - b) for a, b in zip(new, beta)) < 1e-10:
            beta = new; break
        beta = new
    bread = inv3(XtWX); meat = [[0.0] * 3 for _ in range(3)]
    for y, m, t, o in data:
        x = (1.0, t, o); mu = m * math.exp(sum(b * xi for b, xi in zip(beta, x)))
        for i in range(3):
            for j in range(3):
                meat[i][j] += x[i] * x[j] * (y - mu) ** 2
    V = mat(mat(bread, meat), bread)
    se = math.sqrt(V[1][1])
    return {'rate_ratio_training_vs_baseline': math.exp(beta[1]), 'range90': [math.exp(beta[1] - 1.645 * se), math.exp(beta[1] + 1.645 * se)],
            'per_100_rating_points_of_opponent': math.exp(beta[2]), 'note': 'sampling only; natural ups and downs not included'}


def mat(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]


def inv3(M):
    a, b, c = M[0]; d, e, f = M[1]; g, h, i = M[2]
    det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
    return [[(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
            [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
            [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]]


def solve3(M, v):
    Mi = inv3(M)
    return [sum(Mi[i][j] * v[j] for j in range(3)) for i in range(3)]


def secondary(rows, prim, unlock_after=None):
    W = prim['windows']
    end = prim.get('decided_at_game')
    if end is None:
        return {'note': 'secondary analyses are reported with the verdict'}
    A = window(rows, *W['baseline'])
    B = window(rows, W['looks'][0]['window'][0], end)
    out = {}
    # Key secondary K (pre-set test): the mechanism. S1/S2 = blunders per 100 moves facing a concrete threat / per 100
    # other tested moves.
    out['K_mechanism'] = mechanism(A, B)
    out['S1_threat_blunders_per100_threatened_moves'] = out['K_mechanism']['S1']
    out['S2_blunders_per100_tested_moves_without_threat'] = out['K_mechanism']['S2']
    # S7 (descriptive): winning (above 75%) with nothing threatened
    if all(r.get('win_nothreat_moves') is not None for r in A + B):
        out['S7_winning_no_threat'] = diff_of_ratios(A, B, 'win_nothreat_blunders', 'win_nothreat_moves')
    # S3: Lichess's own count on the games Lichess analysed
    la = [r for r in A if r.get('lichess_my_blunders') is not None]
    lb = [r for r in B if r.get('lichess_my_blunders') is not None]
    if len(la) >= DESIGN['min_games_lichess_own'] and len(lb) >= DESIGN['min_games_lichess_own']:
        out['S3_lichess_own_count'] = diff_of_ratios(la, lb, 'lichess_my_blunders', 'my_moves')
    else:
        out['S3_lichess_own_count'] = {'note': f'too few Lichess-analysed games ({len(la)} baseline, {len(lb)} training; '
                                               f'needs {DESIGN["min_games_lichess_own"]} in each)'}
    both = [r for r in rows if r.get('lichess_my_blunders') is not None]
    out['instrument_check'] = {'games_lichess_analysed': len(both), 'lichess_blunders': sum(r['lichess_my_blunders'] for r in both),
                               'replication_blunders': sum(r['my_blunders'] for r in both),
                               'games_with_equal_count': sum(1 for r in both if r['lichess_my_blunders'] == r['my_blunders'])}
    # S4: negative control: his opponents' blunders per 100 of their moves (expected: no change)
    out['S4_opponents_negative_control'] = diff_of_ratios(A, B, 'opp_blunders', 'opp_moves')
    # S5: rating, the slow check
    b_end = W['baseline'][1]
    r0 = rating_after(rows, b_end)
    rat = {'rating_after_baseline': r0, 'provisional_at_end_of_baseline': rows[b_end - 1].get('my_provisional')}
    for look in prim['looks']:
        hi = look['window'][1]
        rh = rating_after(rows, hi)
        if r0 is None or rh is None:
            continue
        n_since = hi - b_end; comp = rating_comparison(n_since); ch = rh - r0
        rat[look['look']] = {'rating_after': rh, 'change': ch, 'games_since_baseline': n_since, 'comparison': comp,
                             'percentile_vs_comparison': round(100 * norm_cdf((ch - comp['mean']) / comp['sd']), 1),
                             'reading': 'rating supports' if ch >= comp['p95'] else 'rating does not stand out'}
    def s_minus_e(rs):
        v = [r['score'] - 1 / (1 + 10 ** ((r['opp_rating'] - r['my_rating']) / 400)) for r in rs
             if r['score'] is not None and r['opp_rating'] and r['my_rating']]
        return {'mean': (sum(v) / len(v) if v else None), 'games': len(v)}
    rat['score_minus_expected_baseline'] = s_minus_e(A)
    rat['score_minus_expected_training'] = s_minus_e(B)
    out['S5_rating'] = rat
    # trend inside the baseline (is he still improving by himself?)
    xs = [r['seq'] for r in A if r['my_moves']]; ys = [100 * r['my_blunders'] / r['my_moves'] for r in A if r['my_moves']]
    if len(xs) > 2:
        mx = sum(xs) / len(xs); my = sum(ys) / len(ys)
        sxx = sum((x - mx) ** 2 for x in xs)
        b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx
        res = sum((y - my - b * (x - mx)) ** 2 for x, y in zip(xs, ys))
        se = math.sqrt(res / (len(xs) - 2) / sxx)
        out['baseline_trend_per_50_games'] = {'slope': 50 * b, 'range90': [50 * (b - 1.645 * se), 50 * (b + 1.645 * se)],
                                              'flag_still_improving': 50 * (b + 1.645 * se) < 0}
    # sensitivity analyses (reported, they do not change the verdict)
    out['sensitivity_tau'] = {str(t): primary(rows[:end], tau=t, unlock_after=unlock_after)['verdict'] for t in DESIGN['tau_sensitivity']}
    out['sensitivity_main_rule_without_newcomers'] = primary(rows[:end], unlock_after=unlock_after)['verdict']
    def med(rs):
        v = sorted(100 * r['my_blunders'] / r['my_moves'] for r in rs if r['my_moves'])
        return v[len(v) // 2] if len(v) % 2 else (v[len(v) // 2 - 1] + v[len(v) // 2]) / 2
    out['sensitivity_per_game_median_rate'] = {'baseline': med(A), 'training': med(B)}
    out['sensitivity_opponent_adjusted'] = poisson_adjusted(A, B)
    return out


def report(rows, unlock_after=None, nc=None):
    prim = primary(rows, unlock_after=unlock_after, nc=nc)
    out = {'design': {k: (v if k != 'rating_comparison_points' else {str(a): b for a, b in v.items()}) for k, v in DESIGN.items()},
           'primary': prim}
    if nc is not None and not newcomer_valid(nc):
        out['newcomer_note'] = f"newcomers.json has fewer than {DESIGN['newcomers_min_players']} players or misses fields: not used"
    if prim['decided_at_game']:
        out['secondary'] = secondary(rows, prim, unlock_after)
    return out


def plain(out):
    p = out['primary']
    lines = [f"Rated 10+0 games counted: {p['games_played']}.", f"Verdict: {p['verdict']}"]
    A = p['baseline']
    if A.get('rate') is not None:
        lo, hi = p['windows']['baseline']
        so_far = ' so far' if p['games_played'] < hi else ''
        lines.append(f"Baseline (games {lo}-{hi}){so_far}: {A['rate']:.2f} blunders per 100 of his moves ({A['events']} in {A['moves']}, "
                     f"{A['games']} games).")
    for l in p['looks']:
        B = l['training']
        lines.append(f"{l['look']} (games {l['window'][0]}-{l['window'][1]}): {B['rate']:.2f} per 100 ({B['events']} in {B['moves']}); "
                     f"drop {l['drop_per100']:+.2f} per 100 ({100 * l['drop_relative']:+.0f}%), 90% range {l['range90'][0]:+.2f} to "
                     f"{l['range90'][1]:+.2f}, z = {l['z']:.2f}")
        if 'newcomer_adjusted' in l:
            na = l['newcomer_adjusted']
            lines.append(f"  after subtracting matched newcomers' own change: drop {na['drop_per100']:+.2f}, z = {na['z']:.2f} "
                         f"({'passes' if na['passes'] else 'does not pass'})")
    s = out.get('secondary', {})
    k = s.get('K_mechanism')
    if k:
        if 'z' in k:
            lines.append(f"Mechanism (key secondary): {k['reading']}. Blunders facing a threat changed by "
                         f"{100 * k['S1_relative_change']:+.0f}%, other blunders by {100 * k['S2_relative_change']:+.0f}% (z = {k['z']:.2f}).")
        else:
            lines.append(f"Mechanism (key secondary): {k['reading']}.")
    if s.get('S5_rating'):
        for k, v in s['S5_rating'].items():
            if isinstance(v, dict) and 'reading' in v:
                lines.append(f"Rating, {k}: {v['change']:+d} since the baseline ({v['reading']}; untrained players: "
                             f"{v['comparison']['mean']:+.0f} on average, 95th percentile {v['comparison']['p95']:+.0f}).")
    return '\n'.join(lines)


def selftest():
    # 1. ratio variance against a hand calculation
    rows = [{'my_blunders': 2, 'my_moves': 20}, {'my_blunders': 0, 'my_moves': 30}, {'my_blunders': 5, 'my_moves': 50}]
    r = ratio(rows)
    p = 7 / 100; ss = (2 - p * 20) ** 2 + (0 - p * 30) ** 2 + (5 - p * 50) ** 2
    assert abs(r['rate'] - 7.0) < 1e-9 and abs(r['var'] - (100 / 100) ** 2 * ss * 3 / 2) < 1e-9
    # 2. decision rule on constructed series (alternating noise keeps the variance above zero)
    def series(rate_a, rate_b, n=160, moves=30, unlock=40, threat_b=None):
        out = []
        for i in range(1, n + 1):
            rate = rate_a if i <= unlock + 20 else rate_b
            b = round(rate * moves / 100 + (0.9 if i % 2 else -0.9))
            tb = (i % 3) if (threat_b is None or i <= unlock + 20) else threat_b(i)
            out.append({'seq': i, 'my_moves': moves, 'my_blunders': max(b, 0), 'opp_rating': 1100 + (i % 7) * 10,
                        'my_rating': 1100, 'my_rating_diff': 1, 'score': 1.0 * (i % 2), 'threat_moves': 5, 'threat_blunders': tb,
                        'nothreat_moves': 20, 'nothreat_blunders': i % 2, 'win_nothreat_moves': 4, 'win_nothreat_blunders': i % 4 == 0,
                        'opp_moves': 30, 'opp_blunders': 3, 'my_provisional': 'False'})
        return out
    W = windows()
    assert W['baseline'] == [11, 40] and W['wash_in'] == [41, 60] and [l['window'] for l in W['looks']] == [[61, 110], [61, 160]], W
    big = primary(series(12, 5))
    assert big['verdict'] == LABEL_WORKED and big['decided_at_game'] == 110, big['verdict']
    assert primary(series(10, 10.5))['verdict'] == LABEL_NO_BIG
    assert primary(series(10, 8))['verdict'] == LABEL_CANNOT
    assert primary(series(10, 8)[:100])['verdict'] == 'not yet: next look after game 110'
    assert primary(series(10, 8)[:130])['verdict'] == 'not yet: next look after game 160'
    late = primary(series(12, 5, n=200, unlock=55), unlock_after=55)
    assert late['windows']['looks'][0]['window'] == [76, 125] and late['decided_at_game'] == 125, late['windows']
    assert primary(series(12, 5), unlock_after=35)['verdict'].startswith('invalid')
    # matched newcomers: binding only when valid; a large natural improvement blocks 'worked'
    nc_flat = {'players': 40, 'mean_change': 0.0, 'mean_change_se': 0.3, 'drift_sd': 1.6}
    nc_learn = {'players': 40, 'mean_change': -6.0, 'mean_change_se': 0.3, 'drift_sd': 1.6}
    assert primary(series(12, 5), nc=nc_flat)['verdict'] == LABEL_WORKED
    blocked = primary(series(12, 5), nc=nc_learn)
    assert blocked['verdict'] == LABEL_CANNOT and blocked['looks'][0]['newcomer_adjusted']['passes'] is False, blocked['verdict']
    assert primary(series(12, 5), nc={**nc_learn, 'players': 12})['verdict'] == LABEL_WORKED   # too few players: not binding
    # mechanism: threat blunders fall (2 of 5 -> 0 or 1 of 5) while other blunders stay -> supported; unchanged -> not
    m_yes = report(series(10, 10, threat_b=lambda i: 1 if i % 4 == 0 else 0))['secondary']['K_mechanism']
    assert m_yes['reading'] == 'mechanism supported' and m_yes['z'] > 1.645, m_yes
    m_no = report(series(10, 10))['secondary']['K_mechanism']
    assert m_no['reading'] == 'mechanism not supported', m_no
    rep = report(series(12, 5))
    assert 'S7_winning_no_threat' in rep['secondary']
    adj = rep['secondary']['sensitivity_opponent_adjusted']['rate_ratio_training_vs_baseline']
    raw = rep['primary']['looks'][0]['training']['rate'] / rep['primary']['baseline']['rate']
    assert abs(adj - raw) < 0.02, (adj, raw)   # opponent ratings unrelated to phase here, so adjusted ~ raw
    assert rating_comparison(70) == {'mean': 10.7, 'sd': 53.2, 'p95': 86.0}
    assert rating_comparison(120) == {'mean': 20.8, 'sd': 60.6, 'p95': 108.6}
    print('selftest passed: ratio variance; windows 11-40 / 41-60 / 61-110 / 61-160; worked at look 1; no big effect; '
          'cannot tell; not yet (2 cases); late unlock shifts windows; early unlock invalid; newcomer condition (3 cases); '
          'mechanism test (2 cases); winning-no-threat rate; opponent-adjusted model; rating interpolation')


if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == '--selftest':
        selftest(); sys.exit(0)
    if not args:
        raise SystemExit('usage: verdict.py games.csv [--unlock-after U] [--json out.json] [--newcomers nc.json] | --selftest')
    def opt(name):
        return args[args.index(name) + 1] if name in args else None
    rows = load(args[0])
    U = int(opt('--unlock-after')) if opt('--unlock-after') else None
    nc = json.load(open(opt('--newcomers'))) if opt('--newcomers') else None
    out = report(rows, U, nc)
    print(plain(out))
    if opt('--json'):
        json.dump(out, open(opt('--json'), 'w'), indent=1, default=str)
