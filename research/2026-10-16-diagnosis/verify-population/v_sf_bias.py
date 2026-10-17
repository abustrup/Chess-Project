# Selection-bias check by a different path: are 10+0 games that nobody asked Lichess to analyse different in
# blunder rate from analysed ones? Both groups re-analysed locally with the same engine setting and the game-page
# rule (v_rules.py). Differences from the population run's sf_bias.py: other games (the independent database sample,
# 96 slices instead of 4), fixed depth instead of fixed nodes, the game-page rule instead of the glyph rule,
# a calibration against Lichess's own API count, and a game-level bootstrap.
# usage: .venv/bin/python -I v_sf_bias.py DB.jsonl WORK_DIR OUT.json N_PER_GROUP DEPTH
import sys, os, json, random, time, urllib.request, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v_rules import game_page_judgement, INITIAL

src, W, OUT, NPG, DEPTH = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
os.makedirs(W, exist_ok=True)

def pick():
    rnd = random.Random(2026)
    an, no = [], []
    for line in open(src):
        g = json.loads(line)
        if g['tc'] != '600+0' or g['n'] < 2: continue
        if not (950 <= g['we'] <= 1250 or 950 <= g['be'] <= 1250): continue
        (an if g['an'] else no).append(g['id'])
    return rnd.sample(an, NPG), rnd.sample(no, NPG)

def fetch(ids, path):
    if os.path.exists(path): return
    url = 'https://lichess.org/api/games/export/_ids?evals=true&moves=true&clocks=false&opening=false'
    out = b''
    for k in range(0, len(ids), 300):
        req = urllib.request.Request(url, data=','.join(ids[k:k + 300]).encode(), method='POST',
                                     headers={'User-Agent': UA, 'Accept': 'application/x-ndjson', 'Content-Type': 'text/plain'})
        out += urllib.request.urlopen(req, timeout=300).read(); time.sleep(2)
    open(path, 'wb').write(out)

def analyse(args):
    games, part = args
    import chess, chess.engine
    eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
    eng.configure({'Threads': 1, 'Hash': 64})
    res = []
    for g in games:
        b = chess.Board(); prev = INITIAL; cnt = [0, 0]; mv = [0, 0]
        for k, san in enumerate(g['moves'].split()):
            side = k % 2
            b.push_san(san); mv[side] += 1
            if b.is_checkmate(): break
            if b.is_game_over(claim_draw=False):
                cur = ('cp', 0)
            else:
                s = eng.analyse(b, chess.engine.Limit(depth=DEPTH), game=g['id'])['score'].white()
                cur = ('mate', s.mate()) if s.is_mate() else ('cp', s.score())
            if game_page_judgement(prev, cur, side == 0) == 'B': cnt[side] += 1
            prev = cur
        res.append(dict(id=g['id'], sf=cnt, moves=mv))
    eng.quit()
    return res

if __name__ == '__main__':
    an_ids, no_ids = pick()
    fetch(an_ids + no_ids, os.path.join(W, 'games.ndjson'))
    games = {}
    for line in open(os.path.join(W, 'games.ndjson')):
        if line.strip():
            g = json.loads(line); games[g['id']] = g
    meta = {}
    for line in open(src):
        g = json.loads(line)
        if g['id'] in games: meta[g['id']] = g
    todo = [games[i] for i in an_ids + no_ids if i in games]
    t0 = time.time()
    chunks = [(todo[i::2], i) for i in range(2)]
    out = []
    with cf.ProcessPoolExecutor(2) as ex:
        for r in ex.map(analyse, chunks): out += r
    print('engine minutes', round((time.time() - t0) / 60, 1), flush=True)
    rows = []
    for r in out:
        g = games[r['id']]; m = meta[r['id']]
        for side, col, elo in ((0, 'white', m['we']), (1, 'black', m['be'])):
            if not 950 <= elo <= 1250: continue
            s = g['players'][col].get('analysis')
            rows.append(dict(id=r['id'], grp='an' if m['an'] else 'no', sf=r['sf'][side], moves=r['moves'][side],
                             lichess=s['blunder'] if s else None))
    json.dump(rows, open(os.path.join(W, 'rows.json'), 'w'))
    rnd = random.Random(7)
    def per100(rs, k='sf'): return 100 * sum(x[k] for x in rs) / sum(x['moves'] for x in rs)
    A = [x for x in rows if x['grp'] == 'an']; Nn = [x for x in rows if x['grp'] == 'no']
    def by_game(rs):
        d = {}
        for x in rs: d.setdefault(x['id'], []).append(x)
        return list(d.values())
    ga, gn = by_game(A), by_game(Nn)
    rat = []
    for _ in range(4000):
        a = [x for g in rnd.choices(ga, k=len(ga)) for x in g]; n = [x for g in rnd.choices(gn, k=len(gn)) for x in g]
        rat.append(per100(n) / per100(a))
    rat.sort()
    lic = [x for x in A if x['lichess'] is not None]
    res = dict(time_control='600+0', band='950-1250 own rating', engine=f'Stockfish 19, Threads 1, Hash 64, depth {DEPTH}, game-page rule',
               games_analysed=len(ga), games_not_analysed=len(gn), player_games_analysed=len(A), player_games_not_analysed=len(Nn),
               sf_per100_analysed=round(per100(A), 3), sf_per100_not_analysed=round(per100(Nn), 3),
               ratio_not_over_analysed=round(per100(Nn) / per100(A), 3), ratio_ci95_game_bootstrap=[round(rat[100], 3), round(rat[3899], 3)],
               calibration_on_analysed=dict(player_games=len(lic), lichess_api_per100=round(per100(lic, 'lichess'), 3),
                                            sf_per100=round(per100(lic), 3),
                                            exact_match=round(sum(x['sf'] == x['lichess'] for x in lic) / len(lic), 3),
                                            within_one=round(sum(abs(x['sf'] - x['lichess']) <= 1 for x in lic) / len(lic), 3)))
    json.dump(res, open(OUT, 'w'), indent=1)
    print(json.dumps(res, indent=1))
