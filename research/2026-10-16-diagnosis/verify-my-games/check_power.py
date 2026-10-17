"""Games per period needed to detect a one-third drop / a halving in blunders per 100 (normal approximation, per-game SD)."""
import sys, statistics, math
sys.path.insert(0,'.')
from vanalyse import *
games=load_games(); A=norm_theirs('../my-games/engine/sf_250k_bothnull.jsonl')
pg=[]
for gid in A:
    L=[d for d in per_move(A[gid],games[gid]) if d['mine']]
    if len(L)>=10: pg.append(100*sum(d['label']=='Blunder' for d in L)/len(L))
sd=statistics.stdev(pg); mean=12.46
print('games', len(pg), 'per-game SD', round(sd,2))
for frac,name in ((1/3,'one-third drop'),(1/2,'halving')):
    d=mean*frac; n=2*(1.959964+0.841621)**2*sd**2/d**2
    print(name, 'n per period (80% power, 5% two-sided)', math.ceil(n))
