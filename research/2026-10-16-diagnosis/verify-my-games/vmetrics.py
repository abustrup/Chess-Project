"""Compute the claimed numbers from engine rows with the from-scratch rule and definitions.
Usage: vmetrics.py theirs|mine"""
import sys, json, math, random, statistics, chess
sys.path.insert(0, '.')
from vanalyse import *

src = sys.argv[1]
if src == 'theirs': data = norm_theirs('../my-games/engine/sf_250k_bothnull.jsonl')
else: data = norm_mine(['eng_w0.jsonl', 'eng_w1.jsonl'])
games = load_games()
assert len(data) == 31, len(data)
out = {'source': src}

def fisher_two_sided(a, b, c, d):
    """2x2 [[a,b],[c,d]] exact two-sided p (sum of tables with prob <= observed)."""
    n1, n2, k = a + b, c + d, a + c; N = n1 + n2
    def p(x): return math.comb(n1, x) * math.comb(n2, k - x) / math.comb(N, k)
    po = p(a); lo, hi = max(0, k - n2), min(k, n1)
    return sum(p(x) for x in range(lo, hi + 1) if p(x) <= po * (1 + 1e-9))

moves = {}  # gid -> list
for gid, rows in data.items():
    moves[gid] = list(per_move(rows, games[gid]))

# 1. blunder baseline
hb = sum(1 for L in moves.values() for d in L if d['mine'] and d['label'] == 'Blunder')
hm = sum(1 for L in moves.values() for d in L if d['mine'])
ob = sum(1 for L in moves.values() for d in L if not d['mine'] and d['label'] == 'Blunder')
om = sum(1 for L in moves.values() for d in L if not d['mine'])
hmist = sum(1 for L in moves.values() for d in L if d['mine'] and d['label'] == 'Mistake')
hinac = sum(1 for L in moves.values() for d in L if d['mine'] and d['label'] == 'Inaccuracy')
random.seed(777)
gids = sorted(moves)
def boot(fn, B=10000):
    vals = []
    for _ in range(B):
        s = [random.choice(gids) for _ in gids]
        v = fn(s)
        if v is not None: vals.append(v)
    vals.sort(); return (vals[int(0.025 * len(vals))], vals[int(0.975 * len(vals)) - 1])
def rate(s, mine):
    b = sum(1 for g in s for d in moves[g] if d['mine'] == mine and d['label'] == 'Blunder')
    m = sum(1 for g in s for d in moves[g] if d['mine'] == mine)
    return 100 * b / m if m else None
out['baseline'] = {'him_blunders': hb, 'him_moves': hm, 'him_per100': round(100 * hb / hm, 2),
                   'him_per100_game_bootstrap95': [round(x, 1) for x in boot(lambda s: rate(s, True))],
                   'him_mistakes': hmist, 'him_inaccuracies': hinac,
                   'opp_blunders': ob, 'opp_moves': om, 'opp_per100': round(100 * ob / om, 2)}
# per-game median (games with 10+ of his moves)
pg = [100 * sum(1 for d in L if d['mine'] and d['label'] == 'Blunder') / sum(1 for d in L if d['mine'])
      for L in moves.values() if sum(1 for d in L if d['mine']) >= 10]
out['baseline']['per_game_median'] = round(statistics.median(pg), 1); out['baseline']['n_games_10plus'] = len(pg)

# 6. big blunders and moves 1-12
big = [(g, d) for g, L in moves.items() for d in L if d['mine'] and d['label'] == 'Blunder' and d['drop'] >= 30]
big12 = [x for x in big if x[1]['movenum'] <= 12]
out['big'] = {'big': len(big), 'in_moves_1_12': len(big12), 'share': round(len(big12) / len(big), 3),
              'wilson95': [round(x, 3) for x in wilson(len(big12), len(big))]}
bl12 = sum(1 for L in moves.values() for d in L if d['mine'] and d['label'] == 'Blunder' and d['movenum'] <= 12)
out['big']['all_blunders_in_moves_1_12'] = bl12

# 3. threat test
def threat_tab(mine, s=None):
    s = s or gids
    t = tb = n = nb = 0
    for g in s:
        for d in moves[g]:
            if d['mine'] != mine or d['threat'] is None or d['in_check']: continue
            drop, gain, mates = d['threat']
            real = drop >= 15 and (gain >= 2 or mates)
            isb = d['label'] == 'Blunder'
            if real: t += 1; tb += isb
            else: n += 1; nb += isb
    return t, tb, n, nb
ht = threat_tab(True); ot = threat_tab(False)
def diff_fn(s):
    a = threat_tab(True, s); b = threat_tab(False, s)
    if a[0] == 0 or b[0] == 0: return None
    return 100 * (a[1] / a[0] - b[1] / b[0])
def diff_fn_nt(s):
    a = threat_tab(True, s); b = threat_tab(False, s)
    return 100 * (a[3] / a[2] - b[3] / b[2])
random.seed(778)
out['threat'] = {'him_tested': ht[0] + ht[2], 'him_threat_moves': ht[0], 'him_blunders_facing_threat': ht[1],
                 'him_rate': round(ht[1] / ht[0], 3), 'him_wilson': [round(x, 3) for x in wilson(ht[1], ht[0])],
                 'him_nothreat': [ht[3], ht[2], round(ht[3] / ht[2], 3)],
                 'opp_tested': ot[0] + ot[2], 'opp_threat_moves': ot[0], 'opp_blunders_facing_threat': ot[1],
                 'opp_rate': round(ot[1] / ot[0], 3), 'opp_wilson': [round(x, 3) for x in wilson(ot[1], ot[0])],
                 'opp_nothreat': [ot[3], ot[2], round(ot[3] / ot[2], 3)],
                 'diff_threat_boot95_points': [round(x, 1) for x in boot(diff_fn, 3000)],
                 'diff_nothreat_boot95_points': [round(x, 1) for x in boot(diff_fn_nt, 3000)]}
# sensitivity: different thresholds for "real"
sens = {}
for thr, mg in ((10, 2), (15, 2), (20, 2), (15, 3), (15, 1)):
    t = tb = 0; t2 = tb2 = 0
    for g in gids:
        for d in moves[g]:
            if d['threat'] is None or d['in_check']: continue
            drop, gain, mates = d['threat']; real = drop >= thr and (gain >= mg or mates)
            if not real: continue
            if d['mine']: t += 1; tb += d['label'] == 'Blunder'
            else: t2 += 1; tb2 += d['label'] == 'Blunder'
    sens[f'drop>={thr},gain>={mg}'] = f'him {tb}/{t} = {tb/max(t,1):.2f}; opp {tb2}/{t2} = {tb2/max(t2,1):.2f}'
out['threat']['sensitivity'] = sens

# 4. openings at move 12
grp = {}
for gid, g in games.items():
    me_white = g['players']['white']['user']['id'] == ME
    sans = g['moves'].split()
    if me_white: key = 'white'
    elif sans[0] == 'e4' and len(sans) > 1 and sans[1] == 'c6': key = 'caro'
    elif sans[0] == 'e4': key = 'black_e4_other'
    else: key = 'black_other'
    rows = data[gid]
    w12 = wp_for(rows[24], me_white) if len(rows) > 24 else None
    grp.setdefault(key, []).append((gid, w12))
op = {}
for key, L in grp.items():
    r = [w for _, w in L if w is not None]
    op[key] = {'games': len(L), 'reached_move12': len(r), 'below25': sum(1 for w in r if w < 25),
               'median_w12': round(statistics.median(r), 1) if r else None,
               'per_game': {gid: (round(w, 1) if w is not None else None) for gid, w in L}}
a = op['caro']['below25']; b = op['caro']['reached_move12'] - a
c = op['white']['below25']; d_ = op['white']['reached_move12'] - c
op['fisher_two_sided_caro_vs_white'] = round(fisher_two_sided(a, b, c, d_), 4)
out['openings'] = op

# 5. thrown chances
def thrown(white_side_is_me):
    reached = notwon = 0; lst = []
    for gid, g in games.items():
        me_white = g['players']['white']['user']['id'] == ME
        side_white = me_white if white_side_is_me else not me_white
        rows = data[gid]
        ws = [wp_for(r, side_white) for r in rows[1:]]
        if max(ws) >= 75:
            reached += 1
            if result_for(g, side_white) != 'win': notwon += 1; lst.append(gid)
    return reached, notwon, lst
hr = thrown(True); orr = thrown(False)
out['thrown'] = {'him_reached75': hr[0], 'him_not_won': hr[1], 'him_share': round(hr[1] / hr[0], 3),
                 'him_wilson': [round(x, 3) for x in wilson(hr[1], hr[0])], 'him_games': hr[2],
                 'opp_reached75': orr[0], 'opp_not_won': orr[1], 'opp_share': round(orr[1] / orr[0], 3),
                 'fisher_him_vs_opp': round(fisher_two_sided(hr[1], hr[0] - hr[1], orr[1], orr[0] - orr[1]), 4)}
# 90% sustained 3 plies
def sustained(me_side=True):
    reached = notwon = 0
    for gid, g in games.items():
        me_white = g['players']['white']['user']['id'] == ME
        side_white = me_white if me_side else not me_white
        ws = [wp_for(r, side_white) for r in data[gid][1:]]
        if any(all(w >= 90 for w in ws[i:i + 3]) for i in range(len(ws) - 2)):
            reached += 1; notwon += result_for(g, side_white) != 'win'
    return reached, notwon
out['thrown']['him_sustained90'] = sustained(True)

# clock: seconds spent on blunders vs unjudged moves
spent_bl = []; spent_un = []; spent_all = []
for gid, g in games.items():
    clocks = g['clocks']; inc = g['clock']['increment']
    for d in moves[gid]:
        if not d['mine']: continue
        k = d['ply'] - 1  # index of this move
        if k < 2: continue
        s = (clocks[k - 2] - clocks[k]) / 100 + inc
        spent_all.append(s)
        if d['label'] == 'Blunder': spent_bl.append(s)
        elif d['label'] is None: spent_un.append(s)
out['clock'] = {'median_blunder_s': statistics.median(spent_bl), 'median_unjudged_s': statistics.median(spent_un),
                'share_blunders_le2s': round(sum(1 for s in spent_bl if s <= 2) / len(spent_bl), 3),
                'share_all_le2s': round(sum(1 for s in spent_all if s <= 2) / len(spent_all), 3),
                'median_all_s': statistics.median(spent_all)}
json.dump(out, open(f'vmetrics_{src}.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in out.items() if k != 'openings'}, indent=1))
print(json.dumps({k: ({kk: vv for kk, vv in v.items() if kk != 'per_game'} if isinstance(v, dict) else v) for k, v in out['openings'].items()}, indent=1))
