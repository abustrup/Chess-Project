# Selection-bias check: are games that Lichess analysed (someone clicked "Request computer analysis")
# different in blunder rate from games nobody analysed? Lichess's own marks exist only for the first group,
# so both groups are re-analysed here with the same native Stockfish setting and the same fitted Lichess rule.
# The analysed group also calibrates this Stockfish setting against the database "??" glyphs (the 'db' rule in
# sample_db.judge). The bias ratio does not depend on which of the two Lichess rules is used.
# usage: .venv/bin/python -I sf_bias.py OUT.json N_PER_GROUP NODES [TC]
import sys, os, json, random, re, math, time
import chess, chess.pgn, chess.engine, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.argv_saved = list(sys.argv)
OUT, NPG, NODES = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
TC = sys.argv[4] if len(sys.argv) > 4 else '600+0'
sys.argv = ['x', os.path.dirname(os.path.abspath(OUT)), '96', '10']
import sample_db as S  # reuses fetch() and the fitted judge()

POINTS = [5, 29, 53, 77]  # four time slices: 2026-09-02, 09-09, 09-17, 09-24 (approx.)
rnd = random.Random(16102026)
pool = {'an': [], 'no': []}
for pt in POINTS:
    i, off, text = S.fetch(pt)
    for g in text.split('\n\n[Event ')[1:-1]:
        pg = S.parse_game('[Event ' + g)
        if not pg: continue
        h, mpart = pg
        if h.get('TimeControl') != TC: continue
        try: we, be = int(h['WhiteElo']), int(h['BlackElo'])
        except Exception: continue
        sides = [s for s, e in (('w', we), ('b', be)) if 950 <= e <= 1250]
        if not sides: continue
        key = 'an' if '%eval' in mpart else 'no'
        pool[key].append((pt, sides, '[Event ' + g))
print({k: len(v) for k, v in pool.items()}, flush=True)

eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
eng.configure({'Threads': 2, 'Hash': 64})

def sf_counts(pgn_text):
    game = chess.pgn.read_game(io.StringIO(pgn_text))
    b = game.board(); prev = ('cp', 15)
    cnt = {'w': [0, 0], 'b': [0, 0]}  # blunders, moves
    for mv in game.mainline_moves():
        side = 'w' if b.turn == chess.WHITE else 'b'
        b.push(mv)
        cnt[side][1] += 1
        if b.is_checkmate():
            break  # the mating move is never a blunder
        if b.is_game_over():
            cur = ('cp', 0)
        else:
            sc = eng.analyse(b, chess.engine.Limit(nodes=NODES))['score'].white()
            cur = ('mate', sc.mate()) if sc.is_mate() else ('cp', sc.score())
        if S.judge(prev, cur, side == 'w') == 'blunder': cnt[side][0] += 1
        prev = cur
    return cnt

res = {'an': [], 'no': []}
t0 = time.time()
for key in ('an', 'no'):
    sample = rnd.sample(pool[key], min(NPG, len(pool[key])))
    for k, (pt, sides, txt) in enumerate(sample):
        mpart = txt.partition('\n\n')[2]
        nag = S.side_stats(mpart, 600)
        c = sf_counts(txt)
        for s in sides:
            res[key].append(dict(pt=pt, sf_bl=c[s][0], moves=c[s][1], nag_bl=nag[s]['nag_bl'] if key == 'an' else None))
        print(key, k, round(time.time() - t0), flush=True)
eng.quit()

def per100(rs, f='sf_bl'): return 100 * sum(r[f] for r in rs) / sum(r['moves'] for r in rs)
def boot(fn, B=2000):
    vals = []
    for _ in range(B):
        a = [rnd.choice(res['an']) for _ in res['an']]; n = [rnd.choice(res['no']) for _ in res['no']]
        vals.append(fn(a, n))
    vals.sort(); return [round(vals[int(.025 * B)], 3), round(vals[int(.975 * B)], 3)]
an, no = res['an'], res['no']
out = dict(time_control=TC, band='950-1250 own rating', engine=f'Stockfish 19 native, Threads 2, {NODES} nodes per position',
           player_games_analysed=len(an), player_games_not_analysed=len(no),
           sf_blunders_per_100_analysed=round(per100(an), 3), sf_blunders_per_100_not_analysed=round(per100(no), 3),
           ratio_not_over_analysed=round(per100(no) / per100(an), 3),
           ratio_ci95=boot(lambda a, n: per100(n) / per100(a)),
           calibration=dict(lichess_nag_per_100=round(per100(an, 'nag_bl'), 3), sf_per_100_same_games=round(per100(an), 3),
                            per_game_exact_match=round(sum(r['sf_bl'] == r['nag_bl'] for r in an) / len(an), 3),
                            per_game_within_1=round(sum(abs(r['sf_bl'] - r['nag_bl']) <= 1 for r in an) / len(an), 3)))
json.dump(out, open(OUT, 'w'), indent=1)
print(json.dumps(out, indent=1))
