# Comparison-group statistics, written from scratch for the check (does not import drift.py).
# Input: a folder of per-player Lichess API exports, pNNN_before.ndjson (games up to and including an anchor game)
# and pNNN_after.ndjson (games after it). Works on the population run's folder and on the independent group
# fetched by v_fetch_group.py.
# usage: .venv/bin/python -I v_group.py DIR PERF OUT.json      PERF = rapid10 | blitz
import sys, os, json, math, random, collections, statistics as st

def fmean(v):
    v = list(v); return sum(v) / len(v)
def fvar(v):
    v = list(v); m = sum(v) / len(v); return sum((x - m) ** 2 for x in v) / (len(v) - 1)

D, PERF, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
rnd = random.Random(4242)
LO, HI = 950, 1250

def load(fn):
    out = []
    if os.path.exists(fn):
        for line in open(fn):
            line = line.strip()
            if line:
                try: out.append(json.loads(line))
                except Exception: pass
    return out

def keep(g):
    if g.get('variant') != 'standard' or not g.get('rated'): return False
    c = g.get('clock') or {}
    if PERF == 'rapid10': return c.get('initial') == 600 and c.get('increment') == 0
    return g.get('speed') == 'blitz'

players = []
for key in sorted({f.split('_')[0] for f in os.listdir(D) if f.endswith('.ndjson')}):
    b, a = load(os.path.join(D, key + '_before.ndjson')), load(os.path.join(D, key + '_after.ndjson'))
    if not b: continue
    # the player is the one user present in every game
    common = None
    for g in b + a:
        u = {g['players'][c].get('user', {}).get('id') for c in ('white', 'black')}
        common = u if common is None else common & u
    if not common or len(common) != 1: continue
    me = common.pop()
    seq = {}
    for part, gs in (('b', b), ('a', a)):
        for g in gs:
            if not keep(g) or g['id'] in seq: continue
            col = 'white' if g['players']['white'].get('user', {}).get('id') == me else 'black'
            p = g['players'][col]; o = g['players']['black' if col == 'white' else 'white']
            if 'rating' not in p or 'rating' not in o: continue
            n = len(g.get('moves', '').split())
            own = (n + 1) // 2 if col == 'white' else n // 2
            an = p.get('analysis')
            seq[g['id']] = dict(part=part, t=g['createdAt'], r=p['rating'], rd=p.get('ratingDiff', 0) or 0, o=o['rating'],
                                own=own, bl=an['blunder'] if an else None,
                                score=1.0 if g.get('winner') == col else 0.0 if g.get('winner') else 0.5 if g.get('status') in ('draw', 'stalemate') else None)
    games = sorted(seq.values(), key=lambda x: x['t'])
    if not any(x['part'] == 'b' for x in games): continue
    k_anchor = max(i for i, x in enumerate(games) if x['part'] == 'b')
    players.append(dict(games=games, anchor=k_anchor))

res = dict(dir=os.path.basename(D.rstrip('/')), perf=PERF, players=len(players))

# ---- 1. variance components: per-game blunder rate of analysed in-band games, players with 10+ such games ----
def rates(p, lo=LO, hi=HI):
    return [(i, 100.0 * x['bl'] / x['own']) for i, x in enumerate(p['games'])
            if x['bl'] is not None and x['own'] >= 1 and lo <= x['r'] <= hi]
grp = [[v for _, v in rates(p)] for p in players]
grp = [v for v in grp if len(v) >= 10]
N = sum(map(len, grp)); A = len(grp)
gm = sum(map(sum, grp)) / N
msb = sum(len(v) * (fmean(v) - gm) ** 2 for v in grp) / (A - 1)
msw = sum(sum((x - fmean(v)) ** 2 for x in v) for v in grp) / (N - A)
n0 = (N - sum(len(v) ** 2 for v in grp) / N) / (A - 1)
vb = max(0.0, (msb - msw) / n0)
def boot_vc(B=500):
    o = []
    for _ in range(B):
        s = rnd.choices(grp, k=len(grp)); n_ = sum(map(len, s)); g_ = sum(map(sum, s)) / n_
        mb = sum(len(v) * (fmean(v) - g_) ** 2 for v in s) / (len(s) - 1)
        mw = sum(sum((x - fmean(v)) ** 2 for x in v) for v in s) / (n_ - len(s))
        nn = (n_ - sum(len(v) ** 2 for v in s) / n_) / (len(s) - 1)
        o.append((math.sqrt(mw), math.sqrt(max(0.0, (mb - mw) / nn))))
    w = sorted(x[0] for x in o); bb = sorted(x[1] for x in o)
    return [round(w[int(.025 * B)], 2), round(w[int(.975 * B) - 1], 2)], [round(bb[int(.025 * B)], 2), round(bb[int(.975 * B) - 1], 2)]
ciw, cib = boot_vc()
res['variance_components'] = dict(players=A, analysed_games=N, mean_rate=round(gm, 2), within_sd=round(math.sqrt(msw), 2),
                                  within_sd_ci95=ciw, between_sd=round(math.sqrt(vb), 2), between_sd_ci95=cib)

# ---- 2. rating change after L games of this time control, counted from the anchor game ----
def boot_mean(v, B=2000):
    m = sorted(fmean(rnd.choices(v, k=len(v))) for _ in range(B))
    return [round(m[int(.025 * B)], 1), round(m[int(.975 * B) - 1], 1)]
def pct(v, p):
    v = sorted(v); k = (len(v) - 1) * p; f = int(k); c = min(f + 1, len(v) - 1)
    return v[f] + (v[c] - v[f]) * (k - f)
res['rating_change'] = {}
for L in (50, 100, 150):
    d = []
    for p in players:
        g, k = p['games'], p['anchor']
        if not LO <= g[k]['r'] <= HI or len(g) <= k + L: continue
        d.append((g[k + L]['r'] + g[k + L]['rd']) - (g[k]['r'] + g[k]['rd']))
    if len(d) >= 5:
        res['rating_change'][f'after_{L}_games'] = dict(n=len(d), mean=round(fmean(d), 1), mean_ci95=boot_mean(d),
                                                        sd=round(st.pstdev(d), 1), p95=round(pct(d, .95), 1),
                                                        share_100_plus=round(sum(x >= 100 for x in d) / len(d), 3))

# ---- 3. does a player's true blunder rate wander? three estimators ----
BINS = [(1, 10), (11, 30), (31, 60), (61, 100), (101, 160), (161, 250)]
def pair_sums(p):
    s = rates(p, LO - 100, HI + 100)
    out = {b: [0.0, 0] for b in BINS}
    for x in range(len(s)):
        for y in range(x + 1, len(s)):
            k = s[y][0] - s[x][0]
            for b in BINS:
                if b[0] <= k <= b[1]:
                    out[b][0] += 0.5 * (s[x][1] - s[y][1]) ** 2; out[b][1] += 1
                    break
    return out
ps = [pair_sums(p) for p in players]
# (a) pooled variogram (every pair counts once; players with many analysed games dominate)
def pooled(sample):
    return {b: (sum(x[b][0] for x in sample) / max(1, sum(x[b][1] for x in sample))) for b in BINS}
# (b) balanced variogram: only players with pairs in both the first bin and the target bin; each player weighs
#     the same, and the rise is computed inside each player before averaging (removes "who contributes where")
def balanced(sample, b):
    d = [x[b][0] / x[b][1] - x[BINS[0]][0] / x[BINS[0]][1] for x in sample if x[b][1] >= 20 and x[BINS[0]][1] >= 20]
    return (fmean(d), len(d)) if d else (None, 0)
vg = {}
pt = pooled(ps)
for b in BINS[1:]:
    boots_p = sorted(pooled(s)[b] - pooled(s)[BINS[0]] for s in (rnd.choices(ps, k=len(ps)) for _ in range(300)))
    bal, nb = balanced(ps, b)
    bb = sorted(v for v in (balanced(rnd.choices(ps, k=len(ps)), b)[0] for _ in range(300)) if v is not None)
    vg[f'{b[0]}-{b[1]}'] = dict(pairs=sum(x[b][1] for x in ps),
                               pooled_rise=round(pt[b] - pt[BINS[0]], 2), pooled_rise_ci95=[round(boots_p[7], 2), round(boots_p[292], 2)],
                               balanced_rise=round(bal, 2) if bal is not None else None, balanced_players=nb,
                               balanced_rise_ci95=[round(bb[int(.025 * len(bb))], 2), round(bb[int(.975 * len(bb)) - 1], 2)] if bb else None)
res['variogram_rise_over_1_10'] = vg
# (a') pooled variogram, but only players whose analysed games span 250+ games, so the same players feed every bin
span = []
for p in players:
    s = rates(p, LO - 100, HI + 100)
    span.append((s[-1][0] - s[0][0]) if len(s) >= 10 else 0)
full = [x for x, sp in zip(ps, span) if sp >= 250]
if len(full) >= 10:
    ptf = pooled(full)
    vgf = {}
    for b in BINS[1:]:
        bs = sorted(pooled(s)[b] - pooled(s)[BINS[0]] for s in (rnd.choices(full, k=len(full)) for _ in range(300)))
        vgf[f'{b[0]}-{b[1]}'] = dict(rise=round(ptf[b] - ptf[BINS[0]], 2), ci95=[round(bs[7], 2), round(bs[292], 2)])
    res['variogram_same_players_every_bin'] = dict(players=len(full), rise_over_1_10=vgf)
res['variogram_note'] = 'drift SD between two moments = sqrt(2 x rise); rise 2.99 -> 2.45'

# (c) block method: mean rate of analysed games in game-index blocks of 50; compare blocks GAP blocks apart;
#     true drift variance = variance of the difference minus its sampling variance (per-game variance / n).
def blocks(p):
    s = rates(p, LO - 100, HI + 100)
    by = collections.defaultdict(list)
    for i, v in s: by[i // 50].append(v)
    return by
blk = [blocks(p) for p in players]
res['block_method'] = {}
for gap in (1, 2, 3):
    diffs = []
    for by in blk:
        for k in sorted(by):
            if k + gap in by and len(by[k]) >= 5 and len(by[k + gap]) >= 5:
                a_, b_ = by[k], by[k + gap]
                diffs.append((fmean(b_) - fmean(a_), fvar(a_) / len(a_) + fvar(b_) / len(b_), id(by)))
                break  # one pair per player, to keep players independent
    if len(diffs) < 10: continue
    def est(ds):
        return fmean(d * d for d, _, _ in ds) - fmean(v for _, v, _ in ds)
    e = est(diffs)
    bs = sorted(est(rnd.choices(diffs, k=len(diffs))) for _ in range(2000))
    res['block_method'][f'blocks_{50 * gap}_games_apart'] = dict(
        players=len(diffs), mean_difference=round(fmean(d for d, _, _ in diffs), 2),
        drift_variance=round(e, 2), drift_sd=round(math.sqrt(max(0, e)), 2),
        drift_variance_ci95=[round(bs[50], 2), round(bs[1949], 2)],
        drift_sd_upper95=round(math.sqrt(max(0, bs[1899])), 2))
# ---- 4. anchored before/after: last 50 games up to the anchor vs games 1-L after it (Lichess API count) ----
res['before_after_blunders'] = {}
for L in (50, 100, 150):
    ch = []
    for p in players:
        g, k = p['games'], p['anchor']
        if not LO <= g[k]['r'] <= HI or len(g) <= k + L: continue
        bef = [x for x in g[max(0, k - 49):k + 1] if x['bl'] is not None and x['own'] > 0]
        aft = [x for x in g[k + 1:k + 1 + L] if x['bl'] is not None and x['own'] > 0]
        if len(bef) >= 5 and len(aft) >= 5:
            ch.append(100 * sum(x['bl'] for x in aft) / sum(x['own'] for x in aft) - 100 * sum(x['bl'] for x in bef) / sum(x['own'] for x in bef))
    if len(ch) >= 5:
        m = sorted(fmean(rnd.choices(ch, k=len(ch))) for _ in range(2000))
        res['before_after_blunders'][f'after_games_1_{L}'] = dict(n=len(ch), mean_change_per100=round(fmean(ch), 2),
                                                                 ci95=[round(m[50], 2), round(m[1949], 2)])
json.dump(res, open(OUT, 'w'), indent=1)
print(json.dumps(res, indent=1))
