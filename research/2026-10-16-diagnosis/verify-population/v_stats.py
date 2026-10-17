# Population baselines from the independent database sample (v_sample.py), computed from scratch.
# usage: .venv/bin/python -I v_stats.py DB.jsonl OUT.json
# Band: the player's own pre-game rating 950-1250. Measure: blunders per 100 of the player's own moves, where
# "blunder" = the game-page / API rule (v_rules.py) applied to the database %eval values, and, separately,
# the ?? glyphs printed in the database file.
import sys, os, json, math, random, collections, statistics as st
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v_rules import parse_db_eval, judge_sequence

rnd = random.Random(777)
src, OUT = sys.argv[1], sys.argv[2]

pg = []  # one row per in-band player-game
for line in open(src):
    g = json.loads(line)
    seq = None
    if g['an']:
        seq = judge_sequence([parse_db_eval(e) for e in g['ev']])
    for side, me, opp, user in ((0, g['we'], g['be'], g['w']), (1, g['be'], g['we'], g['b'])):
        if not 950 <= me <= 1250: continue
        own = (g['n'] + 1) // 2 if side == 0 else g['n'] // 2
        row = dict(sl=g['sl'], tc=g['tc'], sp=g['sp'], elo=me, user=user, own=own, an=g['an'], id=g['id'], side=side,
                   res=g['res'], term=g['term'])
        if g['an']:
            mine = range(side, g['n'], 2)
            row['api_bl'] = sum(1 for i in mine if seq[i] == 'B')
            row['glyph_bl'] = sum(1 for i in mine if g['g'][i] == 'B')
            row['early_bl'] = sum(1 for i in mine if seq[i] == 'B' and i < 24)
            row['judged'] = sum(1 for i in mine if g['ev'][i] is not None)
        pg.append(row)

def per100(rs, k):
    m = sum(r['own'] for r in rs)
    return 100.0 * sum(r[k] for r in rs) / m if m else float('nan')

def cluster_ci(rs, fn, B=2000):
    by = collections.defaultdict(list)
    for r in rs: by[r['sl']].append(r)
    ks = list(by)
    vals = sorted(fn([r for k in rnd.choices(ks, k=len(ks)) for r in by[k]]) for _ in range(B))
    return [round(vals[int(0.025 * B)], 3), round(vals[int(0.975 * B) - 1], 3)]

def anova(rs, k):
    """one-way random effects, unbalanced (method of moments with n0), on per-game rates of players with 2+ games"""
    by = collections.defaultdict(list)
    for r in rs:
        if r['own'] >= 1: by[r['user']].append(100.0 * r[k] / r['own'])
    grp = [v for v in by.values() if len(v) >= 2]
    N = sum(len(v) for v in grp); a = len(grp)
    if a < 10: return None
    gm = sum(sum(v) for v in grp) / N
    ssb = sum(len(v) * (st.mean(v) - gm) ** 2 for v in grp)
    ssw = sum(sum((x - st.mean(v)) ** 2 for x in v) for v in grp)
    msb, msw = ssb / (a - 1), ssw / (N - a)
    n0 = (N - sum(len(v) ** 2 for v in grp) / N) / (a - 1)
    vb = max(0.0, (msb - msw) / n0)
    return dict(players=a, games=N, within_sd=round(math.sqrt(msw), 2), between_sd=round(math.sqrt(vb), 2),
                icc=round(vb / (vb + msw), 3))

GROUPS = {'rapid_10+0': lambda r: r['tc'] == '600+0', 'blitz_all': lambda r: r['sp'] == 'blitz'}
res = dict(source=src.rsplit('/', 1)[-1], slices=len({r['sl'] for r in pg}), groups={})
for name, f in GROUPS.items():
    rs = [r for r in pg if f(r)]
    an = [r for r in rs if r['an']]
    d = dict(player_games=len(rs), analysed=len(an), analysed_share=round(len(an) / len(rs), 4),
             own_moves_per_game=round(st.mean(r['own'] for r in an), 1))
    d['game_page_rule_per100'] = round(per100(an, 'api_bl'), 3)
    d['game_page_rule_ci95_slice_bootstrap'] = cluster_ci(an, lambda x: per100(x, 'api_bl'))
    d['glyph_per100'] = round(per100(an, 'glyph_bl'), 3)
    d['glyph_ci95_slice_bootstrap'] = cluster_ci(an, lambda x: per100(x, 'glyph_bl'))
    d['glyph_over_game_page'] = round(sum(r['glyph_bl'] for r in an) / sum(r['api_bl'] for r in an), 4)
    d['player_games_equal_counts'] = round(sum(r['glyph_bl'] == r['api_bl'] for r in an) / len(an), 4)
    d['share_of_moves_with_eval'] = round(sum(r['judged'] for r in an) / sum(r['own'] for r in an), 4)
    rates = [100 * r['api_bl'] / r['own'] for r in an if r['own'] > 0]
    d['per_game_rate_sd_all_players'] = round(st.pstdev(rates), 2)
    d['share_blunders_moves_1_12'] = round(sum(r['early_bl'] for r in an) / sum(r['api_bl'] for r in an), 3)
    d['anova_game_page_rule_players_2plus_games_any_slice'] = anova(an, 'api_bl')
    # same-slice only (closer to the population run's design)
    by = collections.defaultdict(list)
    for r in an: by[(r['sl'], r['user'])].append(r)
    same = [dict(r, user=f"{r['sl']}|{r['user']}") for v in by.values() if len(v) >= 2 for r in v]
    d['anova_game_page_rule_same_slice_players'] = anova(same, 'api_bl')
    d['sub_bands'] = {}
    for lo, hi in ((950, 1049), (1050, 1149), (1150, 1250)):
        sb = [r for r in an if lo <= r['elo'] <= hi]
        d['sub_bands'][f'{lo}-{hi}'] = dict(n=len(sb), per100=round(per100(sb, 'api_bl'), 3),
                                             ci95=cluster_ci(sb, lambda x: per100(x, 'api_bl'), 1000))
    # analysed vs not on what is visible in every game
    def score(r):
        if r['res'] == '1/2-1/2': return 0.5
        if r['res'] not in ('1-0', '0-1'): return None
        return 1.0 if (r['res'] == '1-0') == (r['side'] == 0) else 0.0
    for lab, sub in (('analysed', an), ('not_analysed', [r for r in rs if not r['an']])):
        sc = [score(r) for r in sub if score(r) is not None]
        d[f'visible_{lab}'] = dict(n=len(sub), mean_rating=round(st.mean(r['elo'] for r in sub), 1), score=round(st.mean(sc), 4),
                                   own_moves=round(st.mean(r['own'] for r in sub), 1),
                                   time_forfeit=round(sum(r['term'] == 'Time forfeit' for r in sub) / len(sub), 4))
    res['groups'][name] = d
res['slices_with_games'] = len({r['sl'] for r in pg})
json.dump(res, open(OUT, 'w'), indent=1)
print(json.dumps(res, indent=1))
