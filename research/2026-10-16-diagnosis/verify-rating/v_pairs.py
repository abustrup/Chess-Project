"""Independent re-analysis of the Lichess -> chess.com mapping (verify-rating pass, 2026-10-16), written from scratch.
Works on either the investigation's enriched file (format 'inv') or this pass's own August-2026 re-sample (format 'aug').
For the owner's Lichess blitz 1017 it reports several estimators, not only the straight line the investigation used:
  OLS line (Lichess 700-1700), Theil-Sen line, local mean / local median of pairs with Lichess within +-100 / +-75
  (no slope correction), local-linear (tricube) fit, with player-bootstrap 95% intervals,
and the 10th-90th percentile of chess.com ratings around 1017 (empirical, and line + residual quantiles).
It also estimates how often a same-username pair passes the country check by chance.
Usage: python v_pairs.py <file.ndjson> <inv|aug> <out.json> [as_of_unix]"""
import sys, json, math, random, statistics as st, collections

F, FMT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
AS_OF = int(sys.argv[4]) if len(sys.argv) > 4 else 1792108800  # 2026-10-16 00:00 UTC
X0 = 1017
rows = [json.loads(l) for l in open(F) if l.strip()]

def norm_li_flag(f):
    f = (f or '').strip().upper()
    if not f or f.startswith('_'): return ''
    if f.startswith('GB'): return 'GB'      # GB-ENG, GB-SCT, GB-WLS, GB-NIR
    return f.split('-')[0][:2]
def norm_cc_country(c):
    c = (c or '').strip().upper()
    if c in ('XE', 'XS', 'XW', 'XN'): return 'GB'   # chess.com's England/Scotland/Wales/N. Ireland codes
    if c in ('XX', ''): return ''                    # 'International' or unknown
    return c

def unify(r):
    """Return a common record: username, lichess perfs, lichess flag/name/links/bio/title, chess.com perfs and profile."""
    if FMT == 'inv':
        if 'lichess' not in r: return None
        li, cc = r['lichess'], r['chesscom']
        return {'u': r['u'], 'li_perfs': li['perfs'], 'flag': li.get('flag'), 'li_name': li.get('realName'), 'links': li.get('links'), 'bio': li.get('bio'),
                'li_title': li.get('title'), 'cc_country': cc.get('country'), 'cc_name': cc.get('name'), 'cc_title': cc.get('title'),
                'chess_blitz': r.get('chess_blitz'), 'chess_rapid': r.get('chess_rapid')}
    if 'li' not in r or 'cc_profile' not in r: return None
    li, cc = r['li'], r['cc_profile']
    return {'u': r['u'], 'li_perfs': li['perfs'], 'flag': li.get('flag'), 'li_name': li.get('realName'), 'links': li.get('links'), 'bio': li.get('bio'),
            'li_title': li.get('title'), 'cc_country': cc.get('country'), 'cc_name': cc.get('name'), 'cc_title': cc.get('title'),
            'chess_blitz': r.get('chess_blitz'), 'chess_rapid': r.get('chess_rapid')}

def evidence(x):
    u = x['u'].lower()
    blob = ' '.join(filter(None, [x.get('links') or '', x.get('bio') or ''])).lower()
    if ('chess.com/member/' + u) in blob or ('chess.com/players/' + u) in blob: return 'link'
    a, b = (x.get('li_name') or '').strip().lower(), (x.get('cc_name') or '').strip().lower()
    if a and b and a == b: return 'name'
    lf, cf = norm_li_flag(x.get('flag')), norm_cc_country(x.get('cc_country'))
    if lf and cf: return 'country' if lf == cf else 'mismatch'
    return 'unknown'

U = [y for y in (unify(r) for r in rows) if y]
for y in U: y['ev'] = evidence(y)

def li_ok(p): return bool(p) and not p.get('prov') and (p.get('rd') or 999) < 110 and (p.get('games') or 0) >= 20
def cc_ok(p): return bool(p) and (p.get('rd') or 999) < 150 and (p.get('games') or 0) >= 20 and p.get('date') and AS_OF - p['date'] < 365 * 86400

def pairs(lp, cp, evs):
    out = []
    for y in U:
        if y['li_title'] or y['cc_title'] or y['ev'] not in evs: continue
        a, b = y['li_perfs'].get(lp), y.get(cp)
        if li_ok(a) and cc_ok(b): out.append((a['rating'], b['rating']))
    return out

def q(v, p):
    s = sorted(v); i = p * (len(s) - 1); lo = int(i); hi = min(lo + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (i - lo)
def ols(d):
    mx, my = st.mean(x for x, _ in d), st.mean(y for _, y in d)
    b = sum((x - mx) * (y - my) for x, y in d) / sum((x - mx) ** 2 for x, _ in d)
    return my - b * mx, b
def theil_sen(d):
    sl = [(d[j][1] - d[i][1]) / (d[j][0] - d[i][0]) for i in range(len(d)) for j in range(i + 1, len(d)) if d[j][0] != d[i][0]]
    b = st.median(sl); a = st.median(y - b * x for x, y in d)
    return a, b
def loclin(d, x0, h=200):
    w = [(max(0.0, 1 - (abs(x - x0) / h) ** 3) ** 3) for x, _ in d]
    sw = sum(w)
    if sw == 0: return None
    mx = sum(wi * x for wi, (x, _) in zip(w, d)) / sw; my = sum(wi * y for wi, (_, y) in zip(w, d)) / sw
    sxx = sum(wi * (x - mx) ** 2 for wi, (x, _) in zip(w, d))
    b = sum(wi * (x - mx) * (y - my) for wi, (x, y) in zip(w, d)) / sxx if sxx else 0
    return my + b * (x0 - mx)

def estimators(d):
    d7 = [p for p in d if 700 <= p[0] <= 1700]
    res = {'n_700_1700': len(d7)}
    if len(d7) < 10: return res
    a, b = ols(d7)
    resid = [y - (a + b * x) for x, y in d7]
    res['ols'] = {'a': round(a, 1), 'b': round(b, 3), 'at_x0': round(a + b * X0), 'p10': round(a + b * X0 + q(resid, .1)), 'p90': round(a + b * X0 + q(resid, .9))}
    ta, tb = theil_sen(d7); res['theil_sen_at_x0'] = round(ta + tb * X0)
    res['loclin_h200_at_x0'] = round(loclin(d7, X0))
    for bw in (75, 100):
        near = [y for x, y in d7 if abs(x - X0) <= bw]
        if len(near) >= 5:
            res[f'local_pm{bw}'] = {'n': len(near), 'mean_lichess': round(st.mean(x for x, _ in d7 if abs(x - X0) <= bw)), 'mean': round(st.mean(near)), 'median': round(st.median(near)),
                                     'p10': round(q(near, .1)), 'p90': round(q(near, .9))}
    # bootstrap over pairs
    rnd = random.Random(2026); B = {'ols': [], 'loclin': [], 'median100': [], 'theil_sen': []}
    for _ in range(1000):
        s = [rnd.choice(d7) for _ in d7]
        try:
            aa, bb = ols(s); B['ols'].append(aa + bb * X0)
        except ZeroDivisionError: pass
        v = loclin(s, X0)
        if v is not None: B['loclin'].append(v)
        nr = [y for x, y in s if abs(x - X0) <= 100]
        if nr: B['median100'].append(st.median(nr))
    for k, v in B.items():
        if len(v) > 100: res[f'{k}_95ci'] = [round(q(v, .025)), round(q(v, .975))]
    return res

report = {'file_format': FMT, 'records': len(U), 'evidence_counts': dict(collections.Counter(y['ev'] for y in U)), 'maps': {}}
STRONG = {'link', 'name', 'country'}
for lp, cp in (('blitz', 'chess_blitz'), ('blitz', 'chess_rapid'), ('rapid', 'chess_rapid')):
    m = {}
    for lab, evs in (('identity-supported', STRONG), ('link-or-name-only', {'link', 'name'}), ('all-same-name', STRONG | {'unknown', 'mismatch'}), ('mismatch-only', {'mismatch'}), ('unknown-only', {'unknown'})):
        d = pairs(lp, cp, evs)
        m[lab] = {'n_pairs': len(d), **estimators(d)}
    report['maps'][f'lichess_{lp}->{cp}'] = m

# How often would two DIFFERENT people pass the country check by chance? Use the countries of the known-country pairs:
# chance agreement = sum over countries of P(lichess flag = c) * P(chess.com country = c) (independent draw).
known = [(norm_li_flag(y['flag']), norm_cc_country(y['cc_country'])) for y in U if y['ev'] in ('country', 'mismatch')]
if known:
    lc = collections.Counter(a for a, _ in known); cc = collections.Counter(b for _, b in known); n = len(known)
    chance = sum(lc[c] / n * cc[c] / n for c in lc)
    mism = sum(1 for a, b in known if a != b) / n
    # if a share f of known-country pairs are different people, mismatches = f*(1-chance)
    f = min(1.0, mism / (1 - chance))
    contamination = f * chance / (1 - mism)
    report['country_check'] = {'known_country_pairs': n, 'mismatch_share': round(mism, 3), 'chance_agreement_if_different_people': round(chance, 3),
                               'implied_share_different_people_among_known': round(f, 3), 'implied_false_matches_among_country_matches': round(contamination, 3),
                               'top_countries_lichess': lc.most_common(6)}
json.dump(report, open(OUT, 'w'), indent=1)
print(json.dumps({k: v for k, v in report.items() if k != 'maps'}, indent=1))
for k, m in report['maps'].items():
    for lab, v in m.items():
        print(k, lab, json.dumps(v))
