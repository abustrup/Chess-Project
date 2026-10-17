# Comparison group: how much do similar players' blunder rates and ratings change by themselves?
# Input: anchored API exports written by fetch_api.py (pNNN_before.ndjson / pNNN_after.ndjson).
# usage: .venv/bin/python -I drift.py API_DIR PERF OUT.json
#   PERF = rapid10 (only 10+0 games) or blitz (all blitz time controls)
# Blunders = Lichess's own count (players.<side>.analysis.blunder), present only in games Lichess analysed.
# Design, mirroring the owner: a player is picked at an anchor game in September 2026 where he was rated
# 950-1250. "Before" = his last 50 games up to and including the anchor. "After" = the games that followed,
# with no known training. No usernames are written to the output.
import sys, os, json, math, random, statistics as st, collections

D, PERF, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
rnd = random.Random(1610)
BLOCK = 50
LAGS = (50, 100, 150)
BAND = (950, 1250)
Z = 1.645 + 0.8416  # one-sided 5% test, 80% power

def parse(fn, me=None):
    gs = []
    if not os.path.exists(fn): return gs
    for line in open(fn):
        line = line.strip()
        if line:
            try: gs.append(json.loads(line))
            except Exception: pass
    return gs

def rows_for(gs, me):
    rows = []
    for g in gs:
        if g.get('variant') != 'standard' or not g.get('rated'): continue
        c = g.get('clock') or {}
        if PERF == 'rapid10' and not (c.get('initial') == 600 and c.get('increment') == 0): continue
        if PERF == 'blitz' and g.get('speed') != 'blitz': continue
        side = 'white' if g['players']['white'].get('user', {}).get('id') == me else 'black'
        opp = 'black' if side == 'white' else 'white'
        p, o = g['players'][side], g['players'][opp]
        if 'rating' not in p or 'rating' not in o: continue
        plies = len(g.get('moves', '').split())
        own = (plies + 1) // 2 if side == 'white' else plies // 2
        w = g.get('winner')
        if w is None:
            score = 0.5 if g.get('status') in ('draw', 'stalemate') else None
        else:
            score = 1.0 if w == side else 0.0
        a = p.get('analysis')
        jb = None
        if a is not None and 'analysis' in g:
            k0 = 0 if side == 'white' else 1
            jb = sum(1 for k, x in enumerate(g['analysis']) if k % 2 == k0 and x.get('judgment', {}).get('name') == 'Blunder')
        rows.append(dict(id=g['id'], t=g['createdAt'], r=p['rating'], rd=p.get('ratingDiff') or 0, orat=o['rating'],
                         score=score, own=own, bl=a.get('blunder') if a else None, jb=jb, prov=bool(p.get('provisional'))))
    rows.sort(key=lambda r: r['t'])
    return rows

def per100(rs):
    rs = [r for r in rs if r['bl'] is not None and r['own'] > 0]
    m = sum(r['own'] for r in rs)
    return (100 * sum(r['bl'] for r in rs) / m if m else None), len(rs)

def svar(rs):
    v = [100 * r['bl'] / r['own'] for r in rs if r['bl'] is not None and r['own'] > 0]
    return st.pvariance(v) / len(v) if len(v) > 1 else 0.0

def expected(r, o): return 1 / (1 + 10 ** ((o - r) / 400))

def q(a, p):
    a = sorted(a)
    if not a: return None
    k = (len(a) - 1) * p; f = math.floor(k); c = math.ceil(k)
    return round(a[f] + (a[c] - a[f]) * (k - f), 2)

players = []
check = [0, 0]
keys = sorted({f.split('_')[0] for f in os.listdir(D) if f.endswith('.ndjson')})
for key in keys:
    gb = parse(os.path.join(D, key + '_before.ndjson')); ga = parse(os.path.join(D, key + '_after.ndjson'))
    if not gb: continue
    ids = collections.Counter(g['players'][s].get('user', {}).get('id') for g in gb + ga for s in ('white', 'black'))
    me = ids.most_common(1)[0][0]
    before, after = rows_for(gb, me), rows_for(ga, me)
    seen = {r['id'] for r in before}
    after = [r for r in after if r['id'] not in seen]
    for r in before + after:
        if r['jb'] is not None: check[0] += 1; check[1] += (r['jb'] == r['bl'])
    if not before: continue
    players.append(dict(before=before[-BLOCK:], after=after, all=before + after))

res = dict(perf=PERF, design='anchor = a September 2026 game rated 950-1250; before = last 50 games up to the anchor; after = following games',
           players_with_data=len(players),
           api_summary_equals_per_move_judgments=f'{check[1]} of {check[0]} analysed player-games')

# ---------------- variance components (in-band analysed games only) ----------------
per = []
for p in players:
    rates = [100 * r['bl'] / r['own'] for r in p['all'] if r['bl'] is not None and r['own'] >= 1 and BAND[0] <= r['r'] <= BAND[1]]
    if len(rates) >= 10: per.append(rates)
if len(per) >= 5:
    ssw = sum(sum((x - st.mean(v)) ** 2 for x in v) for v in per); dfw = sum(len(v) - 1 for v in per)
    var_w = ssw / dfw
    means = [st.mean(v) for v in per]
    var_b = max(0.0, st.pvariance(means) - st.mean([var_w / len(v) for v in per]))
    num = den = 0.0
    for v in per:
        m = st.mean(v)
        num += sum((v[i] - m) * (v[i + 1] - m) for i in range(len(v) - 1)); den += sum((x - m) ** 2 for x in v)
    allr = [x for v in per for x in v]
    res['variance_components'] = dict(players=len(per), analysed_games=len(allr), mean_rate_per100=round(st.mean(allr), 3),
                                      within_player_sd_per_game=round(math.sqrt(var_w), 2),
                                      between_player_sd_of_true_rate=round(math.sqrt(var_b), 2),
                                      icc=round(var_b / (var_b + var_w), 3), lag1_autocorrelation=round(num / den, 3))
shares = [sum(r['bl'] is not None for r in p['all']) / len(p['all']) for p in players if len(p['all']) >= 20]
if shares:
    res['analysed_share_per_player'] = dict(n=len(shares), median=q(shares, .5), p25=q(shares, .25), p75=q(shares, .75))
res['games_after_anchor'] = dict(median=q([len(p['after']) for p in players], .5),
                                 share_with_50=round(sum(len(p['after']) >= 50 for p in players) / len(players), 3),
                                 share_with_100=round(sum(len(p['after']) >= 100 for p in players) / len(players), 3),
                                 share_with_150=round(sum(len(p['after']) >= 150 for p in players) / len(players), 3))

# ---------------- natural drift ----------------
def summarize(vals):
    return dict(n=len(vals), mean=round(st.mean(vals), 2), sd=round(st.pstdev(vals), 2), p05=q(vals, .05), p10=q(vals, .1),
                p50=q(vals, .5), p90=q(vals, .9), p95=q(vals, .95))

def boot_mean(vals, B=2000):
    bs = sorted(st.mean(rnd.choices(vals, k=len(vals))) for _ in range(B))
    return [round(bs[int(.025 * B)], 3), round(bs[int(.975 * B)], 3)]

drift = {}
for L in LAGS:
    for mode in ('block', 'cumulative'):
        d_r = []; d_bl = []; noise = []; base_rates = []; nan = []; d_perf = []
        for p in players:
            b, a = p['before'], p['after']
            if len(b) < 20 or len(a) < L: continue
            if not BAND[0] <= b[-1]['r'] <= BAND[1]: continue
            fol = a[L - BLOCK:L] if mode == 'block' else a[:L]
            if mode == 'block' and L == BLOCK: pass
            # rating: from after the anchor game to after game L
            d_r.append((a[L - 1]['r'] + a[L - 1]['rd']) - (b[-1]['r'] + b[-1]['rd']))
            pb = [r['score'] - expected(r['r'], r['orat']) for r in b if r['score'] is not None]
            pf = [r['score'] - expected(r['r'], r['orat']) for r in fol if r['score'] is not None]
            if pb and pf: d_perf.append(st.mean(pf) - st.mean(pb))
            rb, nb = per100(b); rf, nf = per100(fol)
            if nb >= 5 and nf >= 5:
                d_bl.append(rf - rb); noise.append(svar(b) + svar(fol)); base_rates.append(rb); nan.append((nb, nf))
        if mode == 'cumulative' and L == BLOCK: continue  # identical to block for L=50
        item = dict(players=len(d_r))
        if len(d_r) >= 5:
            item['rating_change'] = summarize(d_r)
            item['rating_change']['mean_ci95'] = boot_mean(d_r)
            item['rating_change']['share_up_50_plus'] = round(sum(x >= 50 for x in d_r) / len(d_r), 3)
            item['rating_change']['share_up_100_plus'] = round(sum(x >= 100 for x in d_r) / len(d_r), 3)
        if len(d_perf) >= 5:
            item['score_minus_expected_change'] = dict(n=len(d_perf), mean=round(st.mean(d_perf), 4), sd=round(st.pstdev(d_perf), 4))
        if len(d_bl) >= 5:
            vo = st.pvariance(d_bl); vn = st.mean(noise)
            rel = [x / y for x, y in zip(d_bl, base_rates) if y > 0]
            tb = []
            for _ in range(2000):
                ix = [rnd.randrange(len(d_bl)) for _ in d_bl]
                tb.append(math.sqrt(max(0.0, st.pvariance([d_bl[i] for i in ix]) - st.mean([noise[i] for i in ix]))))
            tb.sort()
            item['blunder_change_per100'] = summarize(d_bl)
            item['blunder_change_per100'].update(
                mean_ci95=boot_mean(d_bl), baseline_rate_mean=round(st.mean(base_rates), 2),
                analysed_games_median_before_after=[st.median(x[0] for x in nan), st.median(x[1] for x in nan)],
                sd_from_sampling_noise=round(math.sqrt(vn), 2),
                sd_true_drift_estimate=round(math.sqrt(max(0.0, vo - vn)), 2),
                sd_true_drift_upper95=round(tb[int(.95 * len(tb))], 2),
                relative_change_median=q(rel, .5), relative_change_p05=q(rel, .05), relative_change_p95=q(rel, .95))
        name = f'before_50_vs_after_games_{L - BLOCK + 1}_{L}' if mode == 'block' else f'before_50_vs_after_games_1_{L}'
        drift[name] = item
res['drift'] = drift

# ---------------- variogram: does a player's true rate wander as games pass? ----------------
# For every pair of analysed in-band games of the same player, half the squared difference of their per-game
# rates, grouped by how many games apart they were. No drift = flat line. A rise of x over the flat level
# means the true rate differs between games that far apart with variance 2x, so drift SD = sqrt(2x).
BINS = [(1, 10), (11, 30), (31, 60), (61, 100), (101, 160), (161, 250)]
def variogram(plist):
    out = {}
    for lo, hi in BINS: out[(lo, hi)] = []
    per_player = []
    for p in plist:
        seq = [(i, 100 * r['bl'] / r['own']) for i, r in enumerate(p['all']) if r['bl'] is not None and r['own'] >= 1 and BAND[0] - 100 <= r['r'] <= BAND[1] + 100]
        d = {}
        for x in range(len(seq)):
            for y in range(x + 1, len(seq)):
                k = seq[y][0] - seq[x][0]
                for lo, hi in BINS:
                    if lo <= k <= hi: d.setdefault((lo, hi), []).append(0.5 * (seq[x][1] - seq[y][1]) ** 2)
        per_player.append(d)
    return per_player
pp = variogram(players)
def vg_point(sample):
    res_ = {}
    for b in BINS:
        num = sum(sum(d.get(b, [])) for d in sample); den = sum(len(d.get(b, [])) for d in sample)
        res_[b] = num / den if den else None
    return res_
pt = vg_point(pp)
boots = [vg_point(rnd.choices(pp, k=len(pp))) for _ in range(400)]
vg = {}
for b in BINS:
    diffs = sorted(x[b] - x[BINS[0]] for x in boots if x[b] is not None and x[BINS[0]] is not None)
    vg[f'{b[0]}-{b[1]}_games_apart'] = dict(pairs=sum(len(d.get(b, [])) for d in pp), semivariance=round(pt[b], 2) if pt[b] else None,
                                            rise_over_first_bin=round(pt[b] - pt[BINS[0]], 2) if pt[b] else None,
                                            rise_ci95=[round(diffs[int(.025 * len(diffs))], 2), round(diffs[int(.975 * len(diffs))], 2)] if diffs else None)
res['variogram_per_game_rate'] = vg

# ---------------- what this means for detecting a real change in one player ----------------
vc = res.get('variance_components')
if vc:
    sw = vc['within_player_sd_per_game']; mu = vc['mean_rate_per100']
    pts = [v['blunder_change_per100']['sd_true_drift_estimate'] for v in drift.values() if 'blunder_change_per100' in v]
    ups = [v['blunder_change_per100']['sd_true_drift_upper95'] for v in drift.values() if 'blunder_change_per100' in v]
    v = vg.get('101-160_games_apart', {})
    vg_pt = math.sqrt(max(0.0, 2 * (v.get('rise_over_first_bin') or 0.0)))
    vg_up = math.sqrt(max(0.0, 2 * (v.get('rise_ci95') or [0, 0])[1]))
    scen = {'no_drift': 0.0, 'variogram_point': round(vg_pt, 2), 'variogram_upper95': round(vg_up, 2),
            'window_method_upper95': round(st.median(ups), 2) if ups else 0.0}
    out = {}
    for n in (20, 30, 50, 100, 150):
        row = {}
        for name, tau in scen.items():
            mde = Z * math.sqrt(2 * sw ** 2 / n + tau ** 2)
            row[name] = dict(per100=round(mde, 2), pct_of_mean=round(100 * mde / mu))
        out[f'{n}_analysed_games_before_and_after'] = row
    res['detectable_drop_one_player'] = dict(assumes=f'within-player SD {sw} per game, mean {mu}, one-sided 5%, 80% power; drift SD scenarios {scen} (medians over the windows above)', table=out)
json.dump(res, open(OUT, 'w'), indent=1)
print(json.dumps(res, indent=1))
