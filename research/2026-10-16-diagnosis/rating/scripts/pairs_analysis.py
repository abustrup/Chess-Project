"""Lichess -> chess.com rating mapping from matched accounts (same username, graded by identity evidence).
Usage: python pairs_analysis.py <enriched.ndjson> <out.json> [as_of_unix]
Prints the mapping at the owner's rating and writes a lookup table (median and 10-90% range of the chess.com
rating among matched players with a similar Lichess rating)."""
import sys, json, math, random, statistics as st, time
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
AS_OF = int(sys.argv[3]) if len(sys.argv) > 3 else 1792108800  # 2026-10-16 00:00 UTC
YEAR = 365 * 86400

def cc_country_norm(c):
    c = (c or '').upper()
    return 'GB' if c in ('XE', 'XS', 'XW', 'XN', 'GB') else c
def li_flag_norm(f):
    f = (f or '').upper()
    if f.startswith('GB'): return 'GB'
    if f.startswith('_') or not f: return ''
    return f[:2]

def tier(r):
    li = r['lichess']; cc = r['chesscom']; u = r['u'].lower()
    txt = ((li.get('links') or '') + ' ' + (li.get('bio') or '')).lower()
    if f'chess.com/member/{u}' in txt or f'chess.com/players/{u}' in txt: return 'link'
    if li.get('realName') and cc.get('name') and li['realName'].strip().lower() == cc['name'].strip().lower(): return 'name'
    lf, cf = li_flag_norm(li.get('flag')), cc_country_norm(cc.get('country'))
    if lf and cf and cf != 'XX':
        return 'country' if lf == cf else 'mismatch'
    return 'unknown'

def li_ok(p):
    return p and not p.get('prov') and (p.get('rd') or 999) < 110 and (p.get('games') or 0) >= 20
def cc_ok(p):
    return p and (p.get('rd') or 999) < 150 and p.get('games', 0) >= 20 and p.get('date') and AS_OF - p['date'] < YEAR

def pairs(lperf, cperf, tiers):
    out = []
    for r in rows:
        if 'lichess' not in r: continue
        if r['lichess'].get('title') or r['chesscom'].get('title'): continue
        t = tier(r)
        if t not in tiers: continue
        lp = r['lichess']['perfs'].get(lperf); cp = r.get(cperf)
        if li_ok(lp) and cc_ok(cp): out.append((lp['rating'], cp['rating'], t, r['u']))
    return out

def q(v, p):
    s = sorted(v); i = p * (len(s) - 1); lo = int(i); hi = min(lo + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (i - lo)

def local(prs, x0, bw=100):
    """chess.com ratings of matched players whose Lichess rating is within +-bw of x0, shifted along the local
    slope (fitted on +-2bw) so that everyone is moved to x0 before taking quantiles."""
    wide = [(x, y) for x, y, *_ in prs if abs(x - x0) <= 2 * bw]
    if len(wide) < 8: return None
    mx, my = st.mean(x for x, _ in wide), st.mean(y for _, y in wide)
    sxx = sum((x - mx) ** 2 for x, _ in wide)
    b = sum((x - mx) * (y - my) for x, y in wide) / sxx if sxx else 0
    near = [y + b * (x0 - x) for x, y in wide if abs(x - x0) <= bw]
    if len(near) < 8: return None
    rnd = random.Random(1); boots = [st.median([rnd.choice(near) for _ in near]) for _ in range(1000)]
    return {'n': len(near), 'median': round(st.median(near)), 'median_95ci': [round(q(boots, .025)), round(q(boots, .975))],
            'p10': round(q(near, .1)), 'p25': round(q(near, .25)), 'p75': round(q(near, .75)), 'p90': round(q(near, .9)), 'local_slope': round(b, 2)}

def ols(prs, lo=700, hi=1700):
    d = [(x, y) for x, y, *_ in prs if lo <= x <= hi]
    if len(d) < 10: return None
    mx, my = st.mean(x for x, _ in d), st.mean(y for _, y in d)
    b = sum((x - mx) * (y - my) for x, y in d) / sum((x - mx) ** 2 for x, _ in d)
    a = my - b * mx
    res = [y - (a + b * x) for x, y in d]
    r = sum((x - mx) * (y - my) for x, y in d) / math.sqrt(sum((x - mx) ** 2 for x, _ in d) * sum((y - my) ** 2 for _, y in d))
    return {'n': len(d), 'a': round(a, 1), 'b': round(b, 3), 'resid_sd': round(st.pstdev(res)), 'r': round(r, 3), 'range': [lo, hi]}

def global_table(prs, lo=700, hi=1700):
    """Straight-line fit of chess.com on Lichess over lo..hi; the range is the fit plus the 10th..90th percentile of
    the residuals (same width everywhere). Bootstrap over pairs for the centre at 1017."""
    d = [(x, y) for x, y, *_ in prs if lo <= x <= hi]
    if len(d) < 15: return None
    def fit(dd):
        mx, my = st.mean(x for x, _ in dd), st.mean(y for _, y in dd)
        b = sum((x - mx) * (y - my) for x, y in dd) / sum((x - mx) ** 2 for x, _ in dd)
        return my - b * mx, b
    a, b = fit(d)
    res = [y - (a + b * x) for x, y in d]
    rnd = random.Random(3); bs = []
    for _ in range(1000):
        dd = [rnd.choice(d) for _ in d]
        try: aa, bb = fit(dd); bs.append(aa + bb * 1017)
        except ZeroDivisionError: pass
    rows = {x0: {'center': round(a + b * x0), 'p10': round(a + b * x0 + q(res, .1)), 'p90': round(a + b * x0 + q(res, .9)),
                 'p25': round(a + b * x0 + q(res, .25)), 'p75': round(a + b * x0 + q(res, .75))} for x0 in range(800, 1601, 50)}
    near = sum(1 for x, _ in d if abs(x - 1017) <= 150)
    return {'n': len(d), 'n_within_150_of_1017': near, 'a': round(a, 1), 'b': round(b, 3), 'resid_p10': round(q(res, .1)), 'resid_p90': round(q(res, .9)),
            'at_1017': {'center': round(a + b * 1017), 'center_95ci': [round(q(bs, .025)), round(q(bs, .975))], 'p10': round(a + b * 1017 + q(res, .1)), 'p90': round(a + b * 1017 + q(res, .9))},
            'table': rows}

STRONG = {'link', 'name', 'country'}
report = {'as_of': AS_OF, 'tiers_count': {}, 'maps': {}}
for r in rows:
    if 'lichess' in r: t = tier(r); report['tiers_count'][t] = report['tiers_count'].get(t, 0) + 1
for lperf, cperf in (('blitz', 'chess_blitz'), ('blitz', 'chess_rapid'), ('rapid', 'chess_rapid'), ('rapid', 'chess_blitz')):
    key = f'lichess_{lperf}->{cperf}'
    m = {}
    for label, tiers in (('identity-supported', STRONG), ('same-name-all', STRONG | {'unknown', 'mismatch'}), ('mismatch-only', {'mismatch'})):
        prs = pairs(lperf, cperf, tiers)
        m[label] = {'n_pairs': len(prs), 'ols_700_1700': ols(prs), 'global_fit': global_table(prs), 'at_1017': local(prs, 1017),
                    'table': {x0: local(prs, x0) for x0 in range(800, 1651, 50)}}
    report['maps'][key] = m
json.dump(report, open(sys.argv[2], 'w'), indent=1)
for key, m in report['maps'].items():
    for label in ('identity-supported', 'same-name-all', 'mismatch-only'):
        g = m[label]['global_fit']
        print(key, label, 'pairs', m[label]['n_pairs'], 'fit', g and {k: g[k] for k in ('n', 'n_within_150_of_1017', 'a', 'b', 'at_1017')}, 'local', m[label]['at_1017'])
print('tiers', report['tiers_count'])
