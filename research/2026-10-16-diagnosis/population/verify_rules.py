# Which rule is "Lichess's own blunder"? Two Lichess outputs label the same games differently.
# 1. Games API (= the game page summary): replicate players.*.analysis and per-move judgments from the API's evals.
# 2. Games present in both the API export and the database sample: compare evals, database glyphs and API counts.
# usage: .venv/bin/python -I verify_rules.py DB_ROWS.jsonl OUT.json API_DIR [API_DIR ...]
import sys, os, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
rows_path, OUT, dirs = sys.argv[1], sys.argv[2], sys.argv[3:]
sys.argv = ['x', os.path.dirname(os.path.abspath(OUT)), '96', '10']
import sample_db as S

NAME = {'blunder': 'Blunder', 'mistake': 'Mistake', 'inaccuracy': 'Inaccuracy', None: '-'}
conf = {'api': collections.Counter(), 'db': collections.Counter()}
pg = {'api': [0, 0], 'db': [0, 0]}
api_games = {}
for d in dirs:
    for f in sorted(os.listdir(d)):
        if not f.endswith('.ndjson'): continue
        for line in open(os.path.join(d, f)):
            line = line.strip()
            if not line: continue
            g = json.loads(line)
            if 'analysis' not in g or g['id'] in api_games: continue
            evs = []
            for x in g['analysis']:
                evs.append(('mate', x['mate']) if 'mate' in x else ('cp', x['eval']) if 'eval' in x else None)
            api_games[g['id']] = (g, evs)
            cnt = {r: {'w': 0, 'b': 0} for r in ('api', 'db')}
            prev = ('cp', 15)
            for k, x in enumerate(g['analysis']):
                cur = evs[k]
                if cur is None: break
                side = 'w' if k % 2 == 0 else 'b'
                truth = x.get('judgment', {}).get('name', '-')
                for r in ('api', 'db'):
                    j = S.judge(prev, cur, side == 'w', r)
                    conf[r][(NAME[j], truth)] += 1
                    if j == 'blunder': cnt[r][side] += 1
                prev = cur
            for side, s in (('w', 'white'), ('b', 'black')):
                a = g['players'][s].get('analysis')
                if a is None: continue
                for r in ('api', 'db'):
                    pg[r][0] += 1; pg[r][1] += (cnt[r][side] == a['blunder'])

res = {'api_games_with_analysis': len(api_games), 'replicating_the_api': {}}
for r in ('api', 'db'):
    tot = sum(conf[r].values()); agree = sum(v for (a, b), v in conf[r].items() if a == b)
    bl_rule = sum(v for (a, b), v in conf[r].items() if a == 'Blunder'); bl_true = sum(v for (a, b), v in conf[r].items() if b == 'Blunder')
    res['replicating_the_api'][f'{r}_rule'] = dict(moves=tot, move_label_agreement=round(agree / tot, 4),
                                                    blunders_rule=bl_rule, blunders_api=bl_true,
                                                    player_games_blunder_count_equal=f'{pg[r][1]} of {pg[r][0]}')

# games in both sources
db = {}
for line in open(rows_path):
    r = json.loads(line)
    if r['an']: db[(r['site'], r['side'])] = r
same_evals = [0, 0]; m = []
for (gid, side), r in db.items():
    if gid not in api_games: continue
    g, evs = api_games[gid]
    a = g['players']['white' if side == 'w' else 'black'].get('analysis')
    if a is None: continue
    dbe = [S.parse_eval(e) if e else None for e in (r.get('evs') or [])]
    if side == 'w':
        same_evals[0] += 1; same_evals[1] += (dbe[:len(evs)] == evs[:len(dbe)] and len(dbe) > 0)
    m.append((a['blunder'], r['nag_bl'], r['api_bl'], r['rule_bl']))
res['games_in_both_sources'] = dict(
    player_games=len(m), games_with_identical_eval_sequence=f'{same_evals[1]} of {same_evals[0]}',
    api_count_equals_database_glyph_count=sum(x[0] == x[1] for x in m),
    api_count_equals_game_page_rule_on_database_evals=sum(x[0] == x[2] for x in m),
    glyph_count_equals_glyph_rule_on_database_evals=sum(x[1] == x[3] for x in m),
    blunders_api=sum(x[0] for x in m), blunders_database_glyphs=sum(x[1] for x in m))
json.dump(res, open(OUT, 'w'), indent=1)
print(json.dumps(res, indent=1))
