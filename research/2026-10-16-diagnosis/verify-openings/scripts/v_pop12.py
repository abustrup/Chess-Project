"""Verifier: how often is a 1000-1300 side below 30% winning chance after move 12 (ply 24)? 2026-10-16.

Usage: .venv/bin/python -I v_pop12.py SAMPLE.jsonl OUT.json N_ENGINE DEPTH
Two independent paths:
 (a) Lichess's own [%eval] in the games Lichess analysed (a selected subset: someone asked for analysis),
     from byte ranges disjoint from the investigation's. Reported three ways: only games that lasted 24 plies
     (the investigation's rule), and counting games that ended before ply 24 by their result.
 (b) Stockfish 19 (Threads 2, fixed DEPTH) on a random sample of N_ENGINE games that Lichess did NOT analyse,
     to see whether the analysed subset is biased.
Winning chance: Lichess formula, cp clipped to +-1000; mate = 0/100.
"""
import sys, json, math, random
import chess, chess.engine

sample, out, N_ENG, DEPTH = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
G = [json.loads(l) for l in open(sample)]
def wp(cp): return 50 + 50 * (2 / (1 + math.exp(-0.00368208 * max(-1000, min(1000, cp)))) - 1)
def ev_wp(e):
    if e.startswith('#'): return 0.0 if e.startswith('#-') else 100.0
    return wp(float(e) * 100)
def wilson(k, n, z=1.96):
    p = k / n; d = 1 + z * z / n; c = (p + z * z / (2 * n)) / d; e = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return [round(c - e, 3), round(c + e, 3)]

R = {}
an = [g for g in G if g['ev'] is not None]
R['analysed_games_in_sample'] = len(an)
long_ = [g for g in an if g['n'] >= 24 and len(g['ev']) >= 24 and g['ev'][23] is not None]
bl = sum(1 for g in long_ if ev_wp(g['ev'][23]) > 70); wl = sum(1 for g in long_ if ev_wp(g['ev'][23]) < 30)
R['lichess_eval_games_lasting_24_plies'] = {'games': len(long_), 'black_below_30': round(bl / len(long_), 4), 'black_ci95': wilson(bl, len(long_)),
                                             'white_below_30': round(wl / len(long_), 4), 'white_ci95': wilson(wl, len(long_))}
early = [g for g in an if g['n'] < 24]
eb = sum(1 for g in early if g['r'] == '1-0'); ew = sum(1 for g in early if g['r'] == '0-1')
nn = len(long_) + len(early)
R['lichess_eval_counting_early_finishes_by_result'] = {'games': nn, 'ended_before_ply24': len(early),
    'black_below_30_or_lost_early': round((bl + eb) / nn, 4), 'black_ci95': wilson(bl + eb, nn),
    'white_below_30_or_lost_early': round((wl + ew) / nn, 4), 'white_ci95': wilson(wl + ew, nn)}
for sp in ('blitz', 'rapid'):
    L = [g for g in long_ if g['sp'] == sp]
    k = sum(1 for g in L if ev_wp(g['ev'][23]) > 70)
    R[f'lichess_eval_{sp}_lasting_24'] = {'games': len(L), 'black_below_30': round(k / len(L), 4), 'ci95': wilson(k, len(L))}
print(json.dumps(R, indent=1), flush=True)

# (b) engine on non-analysed games
random.seed(20261016)
pool = [g for g in G if g['ev'] is None]
pick = random.sample(pool, N_ENG)
eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish'); eng.configure({'Threads': 2, 'Hash': 64})
rows = []
for g in pick:
    if g['n'] < 24:
        rows.append({'early': True, 'r': g['r'], 'n': g['n']}); continue
    b = chess.Board(); ok = True
    for san in g['mv'][:24]:
        try: b.push_san(san)
        except ValueError: ok = False; break
    if not ok: continue
    if b.is_game_over():
        w = 0.0 if b.is_checkmate() and b.turn == chess.WHITE else 100.0 if b.is_checkmate() else 50.0
    else:
        sc = eng.analyse(b, chess.engine.Limit(depth=DEPTH))['score'].white()
        w = (100.0 if sc.mate() > 0 else 0.0) if sc.is_mate() else wp(sc.score())
    rows.append({'early': False, 'r': g['r'], 'wp_white': round(w, 1), 'sp': g['sp']})
eng.quit()
L = [r for r in rows if not r['early']]; E = [r for r in rows if r['early']]
bl = sum(1 for r in L if r['wp_white'] > 70); wl = sum(1 for r in L if r['wp_white'] < 30)
eb = sum(1 for r in E if r['r'] == '1-0'); ew = sum(1 for r in E if r['r'] == '0-1')
R['stockfish_on_unanalysed_random_games'] = {'depth': DEPTH, 'sampled': len(rows), 'lasting_24': len(L), 'ended_before_24': len(E),
    'black_below_30_lasting_24': round(bl / len(L), 4), 'black_ci95': wilson(bl, len(L)),
    'white_below_30_lasting_24': round(wl / len(L), 4), 'white_ci95': wilson(wl, len(L)),
    'black_below_30_or_lost_early': round((bl + eb) / len(rows), 4), 'black_or_early_ci95': wilson(bl + eb, len(rows)),
    'white_below_30_or_lost_early': round((wl + ew) / len(rows), 4)}
print(json.dumps(R['stockfish_on_unanalysed_random_games'], indent=1))
# binomial tail for 'his 9 of 16 when the true rate is p'
def tail(k, n, p): return sum(math.comb(n, j) * p ** j * (1 - p) ** (n - j) for j in range(k, n + 1))
R['binomial_P_at_least_9_of_16'] = {str(p): round(tail(9, 16, p), 4) for p in (0.25, 0.28, 0.31, 0.34, 0.37, 0.40)}
json.dump(R, open(out, 'w'), indent=1)
