"""How much does one move tell Maia-3 about rating? Uses the per-move log-probs saved by run.mjs."""
import json, glob, sys, statistics as st, math
d = sys.argv[1]
rows = []
seen = set()
for f in glob.glob(d + '/ll_*.ndjson'):
    for l in open(f):
        try:
            g = json.loads(l)
        except Exception:
            continue
        if g['id'] in seen:
            continue
        seen.add(g['id'])
        rows.append(g)
grid = rows[0]['grid']
i1000, i1400 = grid.index(1000), grid.index(1400)
for band, (a, b) in {'players rated 800-1150': (800, 1150), 'players rated 1450-1750': (1450, 1750)}.items():
    diffs = [m[i1400] - m[i1000] for g in rows if a <= g['rating'] < b for m in g['perMove'] if m[0] is not None]
    if not diffs: continue
    mu = st.mean(diffs); sd = st.pstdev(diffs)
    print(band, 'moves:', len(diffs), '| per-move log-lik(1400) - log-lik(1000): mean %.4f sd %.4f' % (mu, sd),
          '| moves needed for a 2-sigma call between 1000 and 1400: ~%d' % round((2 * sd / abs(mu)) ** 2))
# share of moves where all grid levels give the played move > 50% (uninformative 'obvious' moves)
obvious = 0; tot = 0
for g in rows:
    for m in g['perMove']:
        if m[0] is None: continue
        tot += 1
        if min(m) > math.log(0.5): obvious += 1
print('share of moves that Maia rates >50%% likely at every rating 600-2600: %.2f' % (obvious / tot))
