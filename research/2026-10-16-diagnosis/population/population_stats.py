# Population baselines from the database sample written by sample_db.py.
# usage: .venv/bin/python -I population_stats.py ROWS.jsonl OUT.json
# Band = the player's own pre-game rating 950-1250. Blunders per 100 of the player's own moves, counted two ways:
#   game_page_rule  = what lichess.org shows on the game page and returns from its API (replicated from %eval;
#                     verified against the API on 11,016 player-games, see verify_rules.py) -> the owner's measure
#   database_glyphs = the ?? marks printed in the monthly database files (a different rule, ~23% fewer blunders)
import sys, json, random, statistics as st, math, collections

rows = [json.loads(l) for l in open(sys.argv[1])]
for r in rows: r.pop('evs', None)
OUT = sys.argv[2]
rnd = random.Random(20261016)

def band(r): return 950 <= r['elo'] <= 1250

GROUPS = {
    'blitz_all': lambda r: r['sp'] == 'blitz',
    'blitz_3+0': lambda r: r['tc'] == '180+0',
    'blitz_3+2': lambda r: r['tc'] == '180+2',
    'blitz_5+0': lambda r: r['tc'] == '300+0',
    'blitz_5+3': lambda r: r['tc'] == '300+3',
    'rapid_all': lambda r: r['sp'] == 'rapid',
    'rapid_10+0': lambda r: r['tc'] == '600+0',
    'rapid_10+5': lambda r: r['tc'] == '600+5',
    'rapid_15+10': lambda r: r['tc'] == '900+10',
}

def q(a, p):
    a = sorted(a)
    if not a: return None
    k = (len(a) - 1) * p; f = math.floor(k); c = math.ceil(k)
    return a[f] + (a[c] - a[f]) * (k - f)

def pooled(rs, key='api_bl'):
    m = sum(r['moves'] for r in rs)
    return 100 * sum(r[key] for r in rs) / m if m else float('nan')

def boot_ci(rs, fn, B=1000):
    """cluster bootstrap over sample points (time slices), 95% percentile interval"""
    by = collections.defaultdict(list)
    for r in rs: by[r['pt']].append(r)
    keys = list(by)
    vals = []
    for _ in range(B):
        s = []
        for k in rnd.choices(keys, k=len(keys)): s += by[k]
        vals.append(fn(s))
    return [round(q(vals, .025), 3), round(q(vals, .975), 3)]

def variance_components(rs, key='api_bl'):
    """one-way random-effects ANOVA on per-game rate (blunders per 100 own moves), players with >=2 games"""
    by = collections.defaultdict(list)
    for r in rs:
        if r['moves'] > 0: by[r['user']].append(100 * r[key] / r['moves'])
    multi = {u: v for u, v in by.items() if len(v) >= 2}
    if len(multi) < 5: return None
    allv = [x for v in by.values() for x in v]
    ssw = sum(sum((x - st.mean(v)) ** 2 for x in v) for v in multi.values())
    dfw = sum(len(v) - 1 for v in multi.values())
    var_w = ssw / dfw
    var_tot = st.pvariance(allv)
    # between-player variance of true rates = total - within (method of moments, all games)
    var_b = max(0.0, var_tot - var_w)
    return dict(players_with_2plus=len(multi), games_in_those=sum(len(v) for v in multi.values()),
                within_sd_per_game=round(math.sqrt(var_w), 2), total_sd_per_game=round(math.sqrt(var_tot), 2),
                between_sd_true_rate=round(math.sqrt(var_b), 2), icc=round(var_b / var_tot, 3) if var_tot else None)

MEASURES = {
    # what lichess.org shows on the game page / returns from the API (replicated from %eval, README)
    'game_page_rule': ('api_bl', 'api_mi', 'api_in', 'api_bl_early', 'api_clk_low_bl'),
    # the ?? / ? / ?! glyphs printed in the monthly database files
    'database_glyphs': ('nag_bl', 'nag_mi', 'nag_in', 'bl_early', 'clk_low_bl'),
}

res = {'source': 'lichess_db_standard_rated_2026-09.pgn.zst, 96 byte-range samples spread evenly over the file',
       'band': 'player pre-game rating 950-1250', 'groups': {}}
for gname, f in GROUPS.items():
    allg = [r for r in rows if band(r) and f(r)]
    if not allg: continue
    an = [r for r in allg if r['an']]
    d = dict(player_games=len(allg), analysed=len(an), analysed_share=round(len(an) / len(allg), 4),
             distinct_players=len({r['user'] for r in allg}), distinct_players_analysed=len({r['user'] for r in an}))
    if len(an) >= 30:
        for mname, (kb, km, ki, ke, kc) in MEASURES.items():
            rates = [100 * r[kb] / r['moves'] for r in an if r['moves'] > 0]
            d[mname] = dict(
                blunders_per_100_moves_pooled=round(pooled(an, kb), 3),
                ci95_cluster_bootstrap=boot_ci(an, lambda rs: pooled(rs, kb)),
                blunders_per_100_moves_pooled_10plus_moves=round(pooled([r for r in an if r['moves'] >= 10], kb), 3),
                per_game_rate_mean=round(st.mean(rates), 3), per_game_rate_median=round(st.median(rates), 3),
                per_game_rate_sd=round(st.pstdev(rates), 3),
                per_game_rate_p10_p25_p75_p90=[round(q(rates, p), 2) for p in (.1, .25, .75, .9)],
                share_games_zero_blunders=round(sum(r[kb] == 0 for r in an) / len(an), 3),
                blunders_per_game_mean=round(st.mean(r[kb] for r in an), 3),
                blunders_per_game_sd=round(st.pstdev([r[kb] for r in an]), 3),
                mistakes_per_100=round(pooled(an, km), 3), inaccuracies_per_100=round(pooled(an, ki), 3),
                share_of_blunders_in_moves_1_12=round(sum(r[ke] for r in an) / max(1, sum(r[kb] for r in an)), 3),
                share_of_blunders_with_under_10pct_clock=round(sum(r[kc] for r in an) / max(1, sum(r[kb] for r in an)), 3),
                variance_components_within_sample=variance_components(an, kb))
        d.update(
            own_moves_per_game_mean=round(st.mean(r['moves'] for r in an), 1),
            database_glyph_rule_replication=dict(
                glyph_blunders=sum(r['nag_bl'] for r in an), replicated_rule_blunders=sum(r['rule_bl'] for r in an),
                player_games_exact_match=round(sum(r['nag_bl'] == r['rule_bl'] for r in an) / len(an), 4),
                glyph_mistakes=sum(r['nag_mi'] for r in an), replicated_rule_mistakes=sum(r['rule_mi'] for r in an)),
            game_page_vs_glyph_blunders_same_games=dict(
                game_page_rule=sum(r['api_bl'] for r in an), database_glyphs=sum(r['nag_bl'] for r in an),
                ratio=round(sum(r['api_bl'] for r in an) / max(1, sum(r['nag_bl'] for r in an)), 3),
                player_games_equal=round(sum(r['api_bl'] == r['nag_bl'] for r in an) / len(an), 4)),
            games_with_missing_evals_share=round(sum(r['evals'] < r['moves'] - 1 for r in an) / len(an), 4),
        )
        # selection: analysed vs not analysed, on things visible in every game
        no = [r for r in allg if not r['an']]
        def desc(rs):
            sc = [r['score'] for r in rs if r['score'] is not None]
            return dict(n=len(rs), mean_rating=round(st.mean(r['elo'] for r in rs), 1),
                        mean_opp_rating=round(st.mean(r['oelo'] for r in rs), 1),
                        score=round(st.mean(sc), 4), loss_share=round(sum(s == 0 for s in sc) / len(sc), 4),
                        mean_plies=round(st.mean(r['plies'] for r in rs), 1),
                        time_forfeit_share=round(sum(r['term'] == 'Time forfeit' for r in rs) / len(rs), 4))
        d['selection'] = dict(analysed=desc(an), not_analysed=desc(no))
        sc_an = [r for r in allg if r['score'] is not None]
        d['analysed_share_by_result'] = {k: round(sum(r['an'] for r in sc_an if r['score'] == v) / max(1, sum(r['score'] == v for r in sc_an)), 4)
                                         for k, v in (('win', 1.0), ('draw', 0.5), ('loss', 0.0))}
    res['groups'][gname] = d

# rating sub-bands for the two main groups
res['sub_bands'] = {}
for gname in ('blitz_all', 'rapid_10+0'):
    f = GROUPS[gname]
    for lo in (950, 1050, 1150):
        an = [r for r in rows if lo <= r['elo'] < lo + 100 + (1 if lo == 1150 else 0) and f(r) and r['an']]
        if len(an) >= 30:
            res['sub_bands'][f'{gname}_{lo}-{lo + 100}'] = {m: dict(n=len(an), per100=round(pooled(an, k[0]), 3), ci95=boot_ci(an, lambda rs, kk=k[0]: pooled(rs, kk), 500))
                                                           for m, k in MEASURES.items()}

json.dump(res, open(OUT, 'w'), indent=1)
print(json.dumps(res, indent=1))
