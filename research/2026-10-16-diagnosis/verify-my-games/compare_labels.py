"""Per-move agreement of Blunder labels for HIS moves: their 250k-node evals vs my depth-16 evals (same rule, my code),
and both vs Lichess's own labels on the 6 analysed games."""
import json, sys, collections
sys.path.insert(0, '.')
from vanalyse import *
games = load_games()
A = norm_theirs('../my-games/engine/sf_250k_bothnull.jsonl'); B = norm_mine(['eng_w0.jsonl', 'eng_w1.jsonl'])
c = collections.Counter(); lic = collections.Counter()
for gid in A:
    la = {d['ply']: d for d in per_move(A[gid], games[gid])}
    lb = {d['ply']: d for d in per_move(B[gid], games[gid])}
    an = games[gid].get('analysis')
    for p, d in la.items():
        if not d['mine']: continue
        x = d['label'] == 'Blunder'; y = lb[p]['label'] == 'Blunder'
        c[(x, y)] += 1
        if an and p - 1 < len(an):
            z = an[p - 1].get('judgment', {}).get('name') == 'Blunder'
            lic[('250k', x, 'lichess', z)] += 1; lic[('d16', y, 'lichess', z)] += 1
print('his moves, (250k blunder, depth16 blunder):', dict(c))
print('both', c[(True, True)], '250k only', c[(True, False)], 'd16 only', c[(False, True)])
for k in sorted(lic): print(k, lic[k])
# pEKoVG79 ply 34 (Bb7): is it the engine's best move at depth 16?
r = B['pEKoVG79'][33]; print('pEKoVG79 ply 34 played', r.get('played'), 'depth-16 best', r.get('best'))
r = A['pEKoVG79'][33]; print('pEKoVG79 ply 34 played', r.get('played'), '250k best', r.get('best'))
