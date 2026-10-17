"""Split Maia scores of the held-out run into rated games and games against the Lichess computer, and build the
'truth' for the computer games: the player's average rating over their 10 held-out rated games, in that time control.
Also writes a 'recent' computer-game file: games played within 365 days before the player's latest rated game.
Usage: python split_heldout.py <rated10.ndjson> <ai10.ndjson> <maia_ll files,...> <outdir>"""
import sys, json, statistics as st
rated_ids, ai_meta = set(), {}
truth = {}
for l in open(sys.argv[1]):
    g = json.loads(l); rated_ids.add(g['id'])
    side = 'white' if (g['players']['white'].get('user') or {}).get('name', '').lower() == g['_target'].lower() else 'black'
    t = truth.setdefault(g['_target'].lower(), {'ratings': [], 'perf': g['_perf'], 'latest': 0})
    t['ratings'].append(g['players'][side]['rating']); t['latest'] = max(t['latest'], g['createdAt'])
for l in open(sys.argv[2]):
    g = json.loads(l)
    lvl = [g['players'][c].get('aiLevel') for c in ('white', 'black') if 'aiLevel' in g['players'][c]][0]
    ai_meta[g['id']] = {'aiLevel': lvl, 'speed': g.get('speed'), 'createdAt': g['createdAt']}
out = {k: open(f'{sys.argv[4]}/{k}.ndjson', 'w') for k in ('rated_ll', 'ai_ll', 'ai_recent_ll')}
for f in sys.argv[3].split(','):
    for l in open(f):
        if not l.strip(): continue
        r = json.loads(l)
        if r['id'] in rated_ids: out['rated_ll'].write(l)
        elif r['id'] in ai_meta:
            r.update(ai_meta[r['id']]); out['ai_ll'].write(json.dumps(r) + '\n')
            t = truth.get(r['target'].lower())
            if t and t['latest'] - r['createdAt'] <= 365 * 86400 * 1000: out['ai_recent_ll'].write(json.dumps(r) + '\n')
json.dump({u: {'rating': st.mean(t['ratings']), 'perf': t['perf']} for u, t in truth.items()}, open(f'{sys.argv[4]}/ai_truth.json', 'w'))
print('players', len(truth))
