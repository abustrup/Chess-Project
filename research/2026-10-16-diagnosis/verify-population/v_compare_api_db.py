# Same games, two Lichess outputs: the API / game-page summary (players.<colour>.analysis.blunder) versus the ??
# glyphs in the monthly database file. Also gives a baseline computed directly from Lichess's API counts
# (no replicated rule) on a random sample of analysed in-band games.
# usage: .venv/bin/python -I v_compare_api_db.py DB.jsonl API.ndjson OUT.json
import sys, os, json, random, collections, statistics as st
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v_rules import parse_db_eval, judge_sequence, game_page_judgement, INITIAL

src, api_path, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
rnd = random.Random(5)
api = {}
for line in open(api_path):
    line = line.strip()
    if line:
        g = json.loads(line); api[g['id']] = g
db = {}
for line in open(src):
    g = json.loads(line)
    if g['id'] in api: db[g['id']] = g

rows = []; same_eval = [0, 0]; examples = []
for gid, d in db.items():
    a = api[gid]
    if 'analysis' not in a: continue
    dbe = [parse_db_eval(e) for e in d['ev']]
    ape = [('mate', x['mate']) if 'mate' in x else ('cp', x['eval']) if 'eval' in x else None for x in a['analysis']]
    same_eval[0] += 1; same_eval[1] += (dbe[:len(ape)] == ape[:len(dbe)])
    jd = judge_sequence(dbe)
    for side, col, elo in ((0, 'white', d['we']), (1, 'black', d['be'])):
        if not 950 <= elo <= 1250: continue
        s = a['players'][col].get('analysis')
        if s is None: continue
        own = (d['n'] + 1) // 2 if side == 0 else d['n'] // 2
        idx = range(side, d['n'], 2)
        glyph = sum(1 for i in idx if d['g'][i] == 'B')
        rule = sum(1 for i in idx if jd[i] == 'B')
        rows.append(dict(id=gid, grp='rapid_10+0' if d['tc'] == '600+0' else 'blitz', own=own, api=s['blunder'], glyph=glyph, rule_db=rule))
        # moves Lichess calls Blunder on the game page but the database does not mark ??
        if len(examples) < 400:
            prev = INITIAL
            for i, e in enumerate(dbe):
                if i % 2 == side and prev and e:
                    lab = (a['analysis'][i].get('judgment') or {}).get('name') if i < len(a['analysis']) else None
                    if lab == 'Blunder' and d['g'][i] != 'B':
                        examples.append(dict(id=gid, ply=i + 1, before=prev, after=e, db_glyph=d['g'][i]))
                prev = e

res = dict(games_in_both=same_eval[0], games_identical_eval_sequence=same_eval[1], groups={})
def per100(rs, k): return 100 * sum(r[k] for r in rs) / sum(r['own'] for r in rs)
def boot(rs, k, B=2000):
    by = collections.defaultdict(list)
    for r in rs: by[r['id']].append(r)
    keys = list(by)
    v = sorted(per100([r for x in rnd.choices(keys, k=len(keys)) for r in by[x]], k) for _ in range(B))
    return [round(v[int(.025 * B)], 3), round(v[int(.975 * B) - 1], 3)]
for grp in ('rapid_10+0', 'blitz', 'all'):
    rs = [r for r in rows if grp == 'all' or r['grp'] == grp]
    res['groups'][grp] = dict(
        player_games=len(rs),
        api_count_equals_glyph_count=sum(r['api'] == r['glyph'] for r in rs),
        api_count_equals_rule_on_db_evals=sum(r['api'] == r['rule_db'] for r in rs),
        blunders_api=sum(r['api'] for r in rs), blunders_glyph=sum(r['glyph'] for r in rs),
        glyph_fewer_than_api_pct=round(100 * (1 - sum(r['glyph'] for r in rs) / sum(r['api'] for r in rs)), 1),
        api_per100_direct=round(per100(rs, 'api'), 3), api_per100_ci95_game_bootstrap=boot(rs, 'api'),
        glyph_per100=round(per100(rs, 'glyph'), 3))
# what kind of moves make the difference: centipawn swing of game-page blunders that carry no ?? glyph
def cp_mover(e, side):
    return None if e[0] != 'cp' else (e[1] if side == 0 else -e[1])
sw = []
for x in examples:
    side = (x['ply'] - 1) % 2
    b, a_ = cp_mover(x['before'], side), cp_mover(x['after'], side)
    if b is not None and a_ is not None: sw.append((b, a_, b - a_))
res['game_page_blunders_without_glyph'] = dict(
    examined=len(examples), both_centipawn=len(sw),
    share_cp_loss_under_300=round(sum(1 for s in sw if s[2] < 300) / max(1, len(sw)), 3),
    glyph_given_instead=dict(collections.Counter(x['db_glyph'] for x in examples)),
    sample_before_after_cp_mover_pov=[s[:2] for s in rnd.sample(sw, min(12, len(sw)))])
json.dump(res, open(OUT, 'w'), indent=1)
print(json.dumps(res, indent=1))
