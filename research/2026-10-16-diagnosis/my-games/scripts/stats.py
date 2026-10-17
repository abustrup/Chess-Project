# Turns moves.jsonl + games.json into the hypothesis tests in summary.md, and writes mistakes.json.
# Usage: .venv/bin/python -I scripts/stats.py OUTDIR POPULATION.json MISTAKES_OUT.json
import sys, os, json, random, statistics, collections, math
outdir, pop_path, mistakes_out = sys.argv[1:4]
M = [json.loads(l) for l in open(os.path.join(outdir, 'moves.jsonl'))]
G = json.load(open(os.path.join(outdir, 'games.json')))
POP = json.load(open(pop_path))
RESEARCH = {  # research/2026-10-16/coaching_lens/results2.json, 950-1250 vs 950-1250, Lichess evals, 2026-09-01 00-06 UTC slice
    'blitz': dict(safety3=0.389, safety4=0.472, big_first12=0.233, decider_first12=1054 / 3400, lost_by12=882 / 3279, per100=8.38,
                  median_spent_all=3.0, median_spent_bl=6.0, median_loser_clock_frac_end=0.472, bl_lowclock_share=0.059),
    'rapid': dict(safety3=0.415, safety4=0.502, big_first12=0.267, decider_first12=1065 / 2993, lost_by12=998 / 2881, per100=8.74,
                  median_spent_all=6.0, median_spent_bl=10.0, median_loser_clock_frac_end=0.648, bl_lowclock_share=0.019)}

def wilson(k, n, z=1.96):
    if n == 0: return [None, None]
    p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return [round((c - h) / d, 3), round((c + h) / d, 3)]

rnd = random.Random(20261016)
def boot_ratio(per_game, B=10000):
    """per_game: list of (k, n) per game; cluster bootstrap of sum(k)/sum(n) by resampling games."""
    if not per_game or sum(n for _, n in per_game) == 0: return [None, None]
    vals = []
    L = len(per_game)
    for _ in range(B):
        s = [per_game[rnd.randrange(L)] for _ in range(L)]
        n = sum(x[1] for x in s)
        if n: vals.append(sum(x[0] for x in s) / n)
    vals.sort()
    return [round(vals[int(0.025 * len(vals))], 3), round(vals[int(0.975 * len(vals)) - 1], 3)]

def prop(pred, pool, games_key='game_id'):
    by = collections.defaultdict(lambda: [0, 0])
    for m in pool:
        by[m[games_key]][1] += 1; by[m[games_key]][0] += 1 if pred(m) else 0
    k = sum(v[0] for v in by.values()); n = sum(v[1] for v in by.values())
    return dict(k=k, n=n, share=(round(k / n, 3) if n else None), wilson95=wilson(k, n), game_bootstrap95=boot_ratio(list(by.values())))

S = {}
games = {g['id']: g for g in G}
S['games'] = dict(n=len(G), by_speed=collections.Counter(g['speed'] for g in G), by_tc=collections.Counter(g['tc'] for g in G),
                  results=collections.Counter(g['result'] for g in G), by_status=collections.Counter(f"{g['result']}:{g['status']}" for g in G),
                  colors=collections.Counter(g['color'] for g in G), lichess_analysed=sum(g['lichess_analysed'] for g in G),
                  his_moves=len(M), his_moves_in_lichess_analysed=sum(1 for m in M if games[m['game_id']]['lichess_analysed']))

# --- main measure baseline: Lichess-rule blunders per 100 of his moves -------------------------------------------
per_game = collections.defaultdict(lambda: [0, 0])
for m in M:
    per_game[m['game_id']][1] += 1; per_game[m['game_id']][0] += m['judgment'] == 'Blunder'
k = sum(v[0] for v in per_game.values()); n = sum(v[1] for v in per_game.values())
pg_rates = sorted(100 * v[0] / v[1] for v in per_game.values() if v[1] >= 10)
pop_vals = POP['blitz']['per100_values']
pct = lambda x: round(100 * sum(1 for v in pop_vals if v < x) / len(pop_vals), 1)
S['blunders_per_100'] = dict(blunders=k, moves=n, per100=round(100 * k / n, 2), game_bootstrap95=[None if x is None else round(100 * x, 2) for x in boot_ratio(list(per_game.values()))],
                             per_game_median=round(statistics.median(pg_rates), 2), games_with_10plus_moves=len(pg_rates),
                             population_blitz_pooled=POP['blitz']['blunders_per_100_pooled'], population_blitz_per_game_median=POP['blitz']['per_player_game_blunders_per_100']['median'],
                             his_median_game_percentile_in_population=pct(statistics.median(pg_rates)),
                             research_blitz_pooled=RESEARCH['blitz']['per100'], research_rapid_pooled=RESEARCH['rapid']['per100'],
                             mistakes=sum(1 for m in M if m['judgment'] == 'Mistake'), inaccuracies=sum(1 for m in M if m['judgment'] == 'Inaccuracy'))
# his opponents in the same games, same engine and rule (a same-games comparison group, mean rating shown)
og = [(g['opp_blunders'], g['opp_moves']) for g in G if g['opp_moves']]
S['blunders_per_100']['opponents_same_games'] = dict(blunders=sum(x[0] for x in og), moves=sum(x[1] for x in og),
    per100=round(100 * sum(x[0] for x in og) / sum(x[1] for x in og), 2),
    game_bootstrap95=[round(100 * x, 2) for x in boot_ratio(og)], mean_opponent_rating=round(statistics.mean(g['opp_rating'] for g in G)))
diffs = []
for _ in range(10000):
    s_ = [G[rnd.randrange(len(G))] for _ in range(len(G))]
    a = sum(g['my_blunders'] for g in s_) / max(1, sum(g['my_moves'] for g in s_)); b = sum(g['opp_blunders'] for g in s_) / max(1, sum(g['opp_moves'] for g in s_))
    diffs.append(100 * (a - b))
diffs.sort()
S['blunders_per_100']['his_minus_opponents_per100_game_bootstrap95'] = [round(diffs[250], 2), round(diffs[9749], 2)]

# how many games a before/after comparison needs (per-game blunders per 100 moves, two-sided 5%, power 80%)
def n_needed(sd, mean, frac):
    z = 1.959964 + 0.841621
    return math.ceil(2 * (z * sd / (mean * frac)) ** 2)
pg_all = [100 * v[0] / v[1] for v in per_game.values() if v[1] >= 10]
his_sd = statistics.stdev(pg_all); his_mean = statistics.mean(pg_all)
pop_r = POP['rapid']['per100_values']; pop_sd = statistics.stdev(pop_r); pop_mean = statistics.mean(pop_r)
S['games_needed'] = dict(note='games per period (before and after each) to detect a drop in per-game blunders per 100 moves; normal approximation, unpaired',
                         his_blitz=dict(mean=round(his_mean, 2), sd=round(his_sd, 2), n_games=len(pg_all), **{f'drop_{int(f*100)}pct': n_needed(his_sd, his_mean, f) for f in (0.25, 0.33, 0.5)}),
                         population_rapid_950_1250_between_and_within_players=dict(mean=round(pop_mean, 2), sd=round(pop_sd, 2), n_player_games=len(pop_r), **{f'drop_{int(f*100)}pct': n_needed(pop_sd, pop_mean, f) for f in (0.25, 0.33, 0.5)}))

# Lichess's own numbers on the analysed games vs ours on the same games
la = [m for m in M if games[m['game_id']]['lichess_analysed']]
S['lichess_vs_ours_on_analysed'] = dict(his_moves=len(la), lichess_blunders=sum(m['lichess_judgment'] == 'Blunder' for m in la),
                                        our_blunders=sum(m['judgment'] == 'Blunder' for m in la),
                                        both=sum(m['judgment'] == 'Blunder' and m['lichess_judgment'] == 'Blunder' for m in la),
                                        lichess_summary_counts=sum((games[g]['lichess_my_counts'] or {}).get('blunder', 0) for g in {m['game_id'] for m in la}),
                                        per_game=[dict(id=g, lichess=sum(1 for m in la if m['game_id'] == g and m['lichess_judgment'] == 'Blunder'),
                                                       ours=sum(1 for m in la if m['game_id'] == g and m['judgment'] == 'Blunder'),
                                                       moves=sum(1 for m in la if m['game_id'] == g)) for g in sorted({m['game_id'] for m in la})])
lab_conf = collections.Counter((m['lichess_judgment'] or '-', m['judgment'] or '-') for m in la)
S['lichess_vs_ours_on_analysed']['confusion_his_moves'] = {f'lichess={a} ours={b}': v for (a, b), v in sorted(lab_conf.items())}

# --- H1: one-move safety share of big blunders ------------------------------------------------------------------
big = [m for m in M if m['win_pct_drop'] >= 30 and m['judgment'] in ('Blunder', 'Mistake', 'Inaccuracy')]
bl = [m for m in M if m['judgment'] == 'Blunder']
R3 = ('hung_material_new', 'ignored_attacked_piece', 'allowed_forced_mate')
E3 = ('hung_piece', 'allowed_short_mate', 'ignored_threat')
E5 = E3 + ('missed_free_material', 'missed_short_mate')
S['H1_safety'] = dict(
    big_blunders=len(big), blunders=len(bl),
    research_def_3cats_big=prop(lambda m: m['research_category'] in R3, big),
    research_def_plus_missed_free_big=prop(lambda m: m['research_category'] in R3 + ('missed_free_material',), big),
    engine_checked_3cats_big=prop(lambda m: m['category'] in E3, big),
    engine_checked_plus_missed_free_big=prop(lambda m: m['category'] in E5, big),
    research_def_3cats_all_blunders=prop(lambda m: m['research_category'] in R3, bl),
    engine_checked_3cats_all_blunders=prop(lambda m: m['category'] in E3, bl),
    engine_checked_plus_missed_free_all_blunders=prop(lambda m: m['category'] in E5, bl),
    population_research=dict(blitz=dict(three=RESEARCH['blitz']['safety3'], plus_missed=RESEARCH['blitz']['safety4']),
                             rapid=dict(three=RESEARCH['rapid']['safety3'], plus_missed=RESEARCH['rapid']['safety4'])),
    research_category_counts_big=collections.Counter(m['research_category'] for m in big),
    category_counts_big=collections.Counter(m['category'] for m in big),
    category_counts_blunders=collections.Counter(m['category'] for m in bl),
    category_group_counts_blunders=collections.Counter(m['category_group'] for m in bl))

# --- H2: first 12 moves ---------------------------------------------------------------------------------------
lost = [g for g in G if g['result'] == 'loss']
dec12 = [g for g in lost if g['decider'] and g['decider']['fm'] <= 12]
reach12 = [g for g in lost if g['my_wp_at_move12'] is not None]
S['H2_first12'] = dict(
    big_in_first12=prop(lambda m: m['first_12_moves'], big),
    blunders_in_first12=prop(lambda m: m['first_12_moves'], bl),
    first12_big_by_category=collections.Counter(m['category'] for m in big if m['first_12_moves']),
    first12_blunders_by_category=collections.Counter(m['category'] for m in bl if m['first_12_moves']),
    lost_games=len(lost), lost_decider_in_first12=dict(k=len(dec12), n=len(lost), share=round(len(dec12) / len(lost), 3), wilson95=wilson(len(dec12), len(lost))),
    lost_and_below25_at_move12=dict(k=sum(1 for g in reach12 if g['my_wp_at_move12'] < 25), n=len(reach12),
                                    wilson95=wilson(sum(1 for g in reach12 if g['my_wp_at_move12'] < 25), len(reach12))),
    all_games_wp_at_move12=[g['my_wp_at_move12'] for g in G if g['my_wp_at_move12'] is not None],
    population=dict(research_blitz_big_first12=RESEARCH['blitz']['big_first12'], research_rapid_big_first12=RESEARCH['rapid']['big_first12'],
                    slice_blitz_big_first12=POP['blitz']['share_big_first12'], slice_rapid_big_first12=POP['rapid']['share_big_first12'],
                    research_blitz_decider_first12=round(RESEARCH['blitz']['decider_first12'], 3), research_rapid_decider_first12=round(RESEARCH['rapid']['decider_first12'], 3),
                    research_blitz_lost_by12=round(RESEARCH['blitz']['lost_by12'], 3), research_rapid_lost_by12=round(RESEARCH['rapid']['lost_by12'], 3)))

# --- H3: thrown-away wins ---------------------------------------------------------------------------------------
sus = [g for g in G if g['had_sustained_90']]
ev75 = [g for g in G if g['ever_75']]
S['H3_thrown'] = dict(
    games_with_sustained_90=len(sus), of_which_not_won=sum(1 for g in sus if g['result'] != 'win'),
    share_not_won=wilson(sum(1 for g in sus if g['result'] != 'win'), len(sus)),
    losses=len(lost), losses_after_sustained_90=sum(1 for g in lost if g['had_sustained_90']),
    share_losses_after_sustained_90=wilson(sum(1 for g in lost if g['had_sustained_90']), len(lost)),
    games_ever_75=len(ev75), ever75_not_won=sum(1 for g in ev75 if g['result'] != 'win'),
    thrown_games=[dict(id=g['id'], result=g['result'], status=g['status']) for g in sus if g['result'] != 'win'],
    ever75_not_won_wilson95=wilson(sum(1 for g in ev75 if g['result'] != 'win'), len(ev75)),
    opponents_same_games=dict(ever75=sum(1 for g in G if g['opp_ever_75']), ever75_not_won=sum(1 for g in G if g['opp_ever_75'] and g['result'] != 'loss'),
                              sustained90=sum(1 for g in G if g['opp_sustained_90']), sustained90_not_won=sum(1 for g in G if g['opp_sustained_90'] and g['result'] != 'loss')),
    blunders_flagged_threw_away_win=sum(1 for m in bl if m['flags']['threw_away_win']),
    population_slice=dict(blitz=dict(sus90_not_won=POP['blitz']['share_sustained90_not_won'], losses_after_sus90=POP['blitz']['share_losses_after_sustained_90'], ever75_not_won=POP['blitz']['share_ever75_not_won']),
                          rapid=dict(sus90_not_won=POP['rapid']['share_sustained90_not_won'], losses_after_sus90=POP['rapid']['share_losses_after_sustained_90'], ever75_not_won=POP['rapid']['share_ever75_not_won'])))

# --- H4: openings ---------------------------------------------------------------------------------------------
S['H4_openings'] = dict(
    white_first_moves=collections.Counter(g['first_moves'].split()[0] for g in G if g['color'] == 'white'),
    white_games=[dict(id=g['id'], first=g['first_moves'], opening=g['opening'], left=g['left_course'], wp12=g['my_wp_at_move12'], ev12=g['eval_at_move12_my_pov'], result=g['result']) for g in G if g['color'] == 'white'],
    black_vs=collections.Counter(g['first_moves'].split()[0] for g in G if g['color'] == 'black'),
    black_games=[dict(id=g['id'], first=g['first_moves'], opening=g['opening'], course=g['course'], left=g['left_course'], wp12=g['my_wp_at_move12'], ev12=g['eval_at_move12_my_pov'], result=g['result']) for g in G if g['color'] == 'black'])

by_course = collections.defaultdict(list)
for g in G:
    by_course[f"{g['color']}:{g['course']}"].append(g)
def fisher_two_sided(a, b, c, d):
    from math import comb
    n = a + b + c + d; r1 = a + b; c1 = a + c
    pr = lambda x: comb(r1, x) * comb(n - r1, c1 - x) / comb(n, c1)
    obs = pr(a)
    return sum(pr(x) for x in range(max(0, c1 - (n - r1)), min(r1, c1) + 1) if pr(x) <= obs * (1 + 1e-9))
S['H4_openings']['by_course'] = {}
for k, gs in by_course.items():
    w12 = [g['my_wp_at_move12'] for g in gs if g['my_wp_at_move12'] is not None]
    S['H4_openings']['by_course'][k] = dict(games=len(gs), score=sum(1 for g in gs if g['result'] == 'win'), reached_move12=len(w12),
        median_win_pct_at_move12=(round(statistics.median(w12), 1) if w12 else None), below25_at_move12=sum(1 for x in w12 if x < 25),
        left_course_by=collections.Counter((g['left_course'] or {}).get('who') for g in gs),
        left_course_median_move=(statistics.median([(g['left_course']['ply'] + 1) // 2 for g in gs if g['left_course']]) if any(g['left_course'] for g in gs) else None))
ck = S['H4_openings']['by_course'].get('black:caro-kann'); lo = S['H4_openings']['by_course'].get('white:london')
if ck and lo:
    a, b = ck['below25_at_move12'], ck['reached_move12'] - ck['below25_at_move12']; c, d = lo['below25_at_move12'], lo['reached_move12'] - lo['below25_at_move12']
    S['H4_openings']['caro_vs_london_below25_fisher_p'] = round(fisher_two_sided(a, b, c, d), 4)

# --- H5: clock ------------------------------------------------------------------------------------------------
sp = [m['time_spent_s'] for m in M if m['time_spent_s'] is not None and m['ply'] > 2]
sp_bl = [m['time_spent_s'] for m in bl if m['time_spent_s'] is not None and m['ply'] > 2]
sp_ok = [m['time_spent_s'] for m in M if m['time_spent_s'] is not None and m['ply'] > 2 and m['judgment'] is None]
by_tc = collections.defaultdict(list)
for m in M:
    if m['time_spent_s'] is not None and m['ply'] > 2: by_tc[m['time_control']].append(m['time_spent_s'])
lost_end = []
for g in lost:
    if g['my_clock_end'] is not None and g['status'] != 'outoftime':
        base = int(g['tc'].split('+')[0]); lost_end.append(g['my_clock_end'] / base)
q = lambda L, p: round(sorted(L)[int(p * (len(L) - 1))], 1) if L else None
S['H5_clock'] = dict(
    median_spent_all=q(sp, .5), p25_spent_all=q(sp, .25), p75_spent_all=q(sp, .75), n_moves=len(sp),
    median_spent_by_tc={k: dict(n=len(v), median=q(v, .5)) for k, v in by_tc.items()},
    median_spent_on_blunders=q(sp_bl, .5), n_blunders=len(sp_bl), median_spent_on_unjudged_moves=q(sp_ok, .5),
    blunders_moved_fast_le2s=prop(lambda m: m['flags']['moved_fast'], [m for m in bl if m['ply'] > 2]),
    all_moves_fast_le2s=prop(lambda m: m['flags']['moved_fast'], [m for m in M if m['ply'] > 2 and m['time_spent_s'] is not None]),
    blunders_in_time_trouble=prop(lambda m: m['flags']['time_trouble'], bl),
    moves_in_time_trouble=prop(lambda m: m['flags']['time_trouble'], M),
    losses_on_time=sum(1 for g in lost if g['status'] == 'outoftime'), losses=len(lost),
    wins_on_time=sum(1 for g in G if g['result'] == 'win' and g['status'] == 'outoftime'),
    lost_games_clock_fraction_left_at_end_median=(round(statistics.median(lost_end), 3) if lost_end else None), n_lost_not_timeout=len(lost_end),
    population_research=dict(blitz=dict(median_spent_all=RESEARCH['blitz']['median_spent_all'], median_spent_bl=RESEARCH['blitz']['median_spent_bl'], loser_clock_frac_end=RESEARCH['blitz']['median_loser_clock_frac_end'], bl_lowclock_share=RESEARCH['blitz']['bl_lowclock_share'])))

# --- threat check habit ---------------------------------------------------------------------------------------
probed = [m for m in M if m['threat_before'] is not None and m['ply'] > 1]
thr = [m for m in probed if m['threat_was_real']]
S['threat_habit'] = dict(
    his_moves_probed=len(probed), moves_where_opponent_had_a_real_threat=len(thr),
    of_those_he_blundered=prop(lambda m: m['judgment'] == 'Blunder', thr),
    moves_without_real_threat_he_blundered=prop(lambda m: m['judgment'] == 'Blunder', [m for m in probed if not m['threat_was_real']]),
    blunders_with_a_real_threat_before=prop(lambda m: m['threat_was_real'], [m for m in bl if m['threat_before'] is not None]),
    blunders_where_best_move_is_not_a_capture=prop(lambda m: m['flags']['best_move_is_capture'] is False, bl))

# same test on his opponents' moves in the same games (needs the NULL_SIDE=both engine pass)
OPP = [json.loads(l) for l in open(os.path.join(outdir, 'opp_moves.jsonl'))] if os.path.exists(os.path.join(outdir, 'opp_moves.jsonl')) else []
if OPP:
    othr = [m for m in OPP if m['threat_real']]
    S['threat_habit']['opponents'] = dict(
        moves_probed=len(OPP), moves_with_real_threat=len(othr),
        of_those_they_blundered=prop(lambda m: m['judgment'] == 'Blunder', othr),
        without_threat_they_blundered=prop(lambda m: m['judgment'] == 'Blunder', [m for m in OPP if not m['threat_real']]),
        blunders_with_a_real_threat_before=prop(lambda m: m['threat_real'], [m for m in OPP if m['judgment'] == 'Blunder']),
        blunders_per_100=round(100 * sum(m['judgment'] == 'Blunder' for m in OPP) / len(OPP), 2),
        note='opponent moves in check are not probed, so this is not the same denominator as blunders per 100 moves')
    # game bootstrap of (his blunder share when threatened) minus (opponents' share when threatened), and the same without threat
    mine_g = collections.defaultdict(lambda: [0, 0, 0, 0]); opp_g = collections.defaultdict(lambda: [0, 0, 0, 0])
    for m in probed:
        r = mine_g[m['game_id']]; i = 0 if m['threat_was_real'] else 2; r[i] += m['judgment'] == 'Blunder'; r[i + 1] += 1
    for m in OPP:
        r = opp_g[m['game_id']]; i = 0 if m['threat_real'] else 2; r[i] += m['judgment'] == 'Blunder'; r[i + 1] += 1
    ids = sorted(set(mine_g) | set(opp_g)); dt = []; dn = []
    for _ in range(10000):
        smp = [ids[rnd.randrange(len(ids))] for _ in ids]
        a = [sum(mine_g[i][j] for i in smp) for j in range(4)]; b = [sum(opp_g[i][j] for i in smp) for j in range(4)]
        if a[1] and b[1]: dt.append(a[0] / a[1] - b[0] / b[1])
        if a[3] and b[3]: dn.append(a[2] / a[3] - b[2] / b[3])
    dt.sort(); dn.sort()
    S['threat_habit']['him_minus_opponents_when_threatened_game_bootstrap95'] = [round(dt[int(.025 * len(dt))], 3), round(dt[int(.975 * len(dt)) - 1], 3)]
    S['threat_habit']['him_minus_opponents_without_threat_game_bootstrap95'] = [round(dn[int(.025 * len(dn))], 3), round(dn[int(.975 * len(dn)) - 1], 3)]

# --- rating -----------------------------------------------------------------------------------------------------
rated = [g for g in G if g['rated']]
exp = sum(1 / (1 + 10 ** ((g['opp_rating'] - g['my_rating']) / 400)) for g in rated)
score = sum(1 if g['result'] == 'win' else 0.5 if g['result'] == 'draw' else 0 for g in rated)
opp_mean = statistics.mean(g['opp_rating'] for g in rated)
p = score / len(rated)
perf = opp_mean + 400 * math.log10(p / (1 - p)) if 0 < p < 1 else None
S['rating'] = dict(rated_games=len(rated), score=score, expected_by_pre_game_ratings=round(exp, 1), mean_opponent=round(opp_mean), performance_rating_logistic=(round(perf) if perf else None),
                   first_game_rating=rated[0]['my_rating'] if rated else None,
                   last_game_rating_plus_diff=(rated[-1]['my_rating'] + (rated[-1]['my_rating_diff'] or 0)) if rated else None,
                   score_wilson95=wilson(int(score), len(rated)))

json.dump(S, open(os.path.join(outdir, 'stats.json'), 'w'), indent=1, default=lambda o: dict(o))

# --- mistakes.json for the trainer -----------------------------------------------------------------------------
keep = [m for m in M if m['judgment'] in ('Blunder', 'Mistake') or m['lichess_judgment'] in ('Blunder', 'Mistake')]
for m in keep:
    analysed = games[m['game_id']]['lichess_analysed']
    ours = m['judgment'] in ('Blunder', 'Mistake'); theirs = m['lichess_judgment'] in ('Blunder', 'Mistake')
    m['source'] = 'both' if (ours and theirs) else ('lichess_only' if theirs else
                  ('ours_lichess_disagrees' if analysed else 'ours_game_not_analysed_by_lichess'))
doc = dict(
    about='Every Blunder and Mistake the owner (Lichess abustrup) made in his Lichess games up to 2026-10-16, one record each, for a trainer. '
          'Judgement = Lichess rule (win% drop >=15 Blunder, >=10 Mistake; mate rules as lila) applied to native Stockfish 19 evals; '
          'lichess_judgment = Lichess\'s own label where Lichess analysed the game. Evals are White point of view; win_pct_* are his point of view.',
    generated='2026-10-16', engine=dict(name='Stockfish 19 native', nodes=json.load(open(os.path.join(outdir, 'engine_setting.json')))['nodes'], threads=1, hash_mb=64, fresh_hash_each_position=True),
    categories={'allowed_short_mate': 'after his move the opponent has a forced mate in 3 or fewer (engine)',
                'hung_piece': "the opponent's very next move (engine's best reply) is a capture and he stays 2+ points of material down after the exchange settles",
                'ignored_threat': "the opponent already threatened something worth 15+ win% before his move (null-move probe), and the engine's best reply carries out that threat",
                'missed_short_mate': 'he had a forced mate in 3 or fewer and did not play it',
                'missed_free_material': "the engine's best move is a capture that nets 2+ points more material than his move did",
                'allowed_longer_tactic': 'the reply line wins 2+ points of material within about 6 plies, or forces a mate longer than 3',
                'missed_own_tactic': 'his best line won 2+ points of material within about 6 plies (or a longer forced mate) and he missed it',
                'opening_positional': 'moves 1-12, none of the above: no material swing within the engine lines',
                'positional_or_endgame': 'after move 12, none of the above'},
    one_move_safety_categories=['allowed_short_mate', 'hung_piece', 'ignored_threat'],
    last_move_allowed_categories=['missed_free_material', 'missed_short_mate'],
    research_category='research/2026-10-16 classifier (static exchange test only, no engine), kept for comparison with the population numbers',
    count=len(keep), mistakes=sorted(keep, key=lambda m: (m['game_id'], m['ply'])))
json.dump(doc, open(mistakes_out, 'w'), indent=1)
print(json.dumps({k: S[k] for k in ('games', 'blunders_per_100', 'lichess_vs_ours_on_analysed')}, indent=1, default=dict))
