# Does the from-scratch game-page rule (v_rules.py) reproduce Lichess's own API blunder labels?
# Input: Lichess API game exports (ndjson, evals=true), as files or folders. Each game counted once.
# usage: .venv/bin/python -I v_api_check.py OUT.json PATH [PATH ...]
import sys, os, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v_rules import judge_sequence

OUT, paths = sys.argv[1], sys.argv[2:]
files = []
for p in paths:
    if os.path.isdir(p): files += [os.path.join(p, f) for f in sorted(os.listdir(p)) if f.endswith('.ndjson')]
    else: files.append(p)
seen = set(); conf = collections.Counter(); pg_eq = pg_n = 0; summ_eq = summ_n = 0
tot_rule = tot_api = tot_summary = 0; mism = []
LBL = {'Blunder': 'B', 'Mistake': 'M', 'Inaccuracy': 'I'}
for f in files:
    for line in open(f):
        line = line.strip()
        if not line: continue
        try: g = json.loads(line)
        except Exception: continue
        if g['id'] in seen or 'analysis' not in g or g.get('variant', 'standard') != 'standard': continue
        seen.add(g['id'])
        ev = []
        for x in g['analysis']:
            ev.append(('mate', x['mate']) if 'mate' in x else ('cp', x['eval']) if 'eval' in x else None)
        mine = judge_sequence(ev)
        truth = [LBL.get(x.get('judgment', {}).get('name')) for x in g['analysis']]
        for a, b in zip(mine, truth): conf[(a or '-', b or '-')] += 1
        for side, col in ((0, 'white'), (1, 'black')):
            s = g['players'][col].get('analysis')
            if s is None: continue
            r = sum(1 for i in range(side, len(mine), 2) if mine[i] == 'B')
            t = sum(1 for i in range(side, len(truth), 2) if truth[i] == 'B')
            pg_n += 1; pg_eq += (r == s['blunder']); summ_n += 1; summ_eq += (t == s['blunder'])
            tot_rule += r; tot_api += t; tot_summary += s['blunder']
            if r != s["blunder"] and len(mism) < 5: mism.append((col, r, s["blunder"]))
moves = sum(conf.values())
res = dict(games=len(seen), moves=moves,
           move_label_agreement=round(sum(v for (a, b), v in conf.items() if a == b) / moves, 4),
           blunder_confusion={f'rule {a} / lichess {b}': v for (a, b), v in sorted(conf.items()) if 'B' in (a, b)},
           player_games=pg_n, player_games_rule_blunders_equal_summary=pg_eq,
           player_games_per_move_labels_equal_summary=summ_eq,
           blunders_rule=tot_rule, blunders_per_move_labels=tot_api, blunders_summary=tot_summary,
           example_mismatches=mism)
json.dump(res, open(OUT, 'w'), indent=1)
print(json.dumps(res, indent=1))
