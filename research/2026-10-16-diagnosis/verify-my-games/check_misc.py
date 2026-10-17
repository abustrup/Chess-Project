"""Ratings, time losses, thrown-win test against the population, performance rating."""
import json, math
gs=[json.loads(l) for l in open('../my-games/lichess_abustrup.ndjson')]
me=[]; opp=[]; lost_time=0; losses=0
for g in gs:
    w=g['players']['white']['user']['id']=='abustrup'
    a,b=('white','black') if w else ('black','white')
    me.append(g['players'][a]['rating']); opp.append(g['players'][b]['rating'])
    if g.get('winner')!=a:
        losses+=1; lost_time+= g['status'] in ('outoftime','timeout')
print('mean his pre-game', sum(me)/len(me), 'mean opp', sum(opp)/len(opp), 'losses', losses, 'lost on time', lost_time)
p=0.358; n=16
pr=[math.comb(n,k)*p**k*(1-p)**(n-k) for k in range(n+1)]
print('him 9 of 16 not won vs population 0.358: one-sided', round(sum(pr[9:]),4), 'two-sided', round(sum(x for x in pr if x<=pr[9]*(1+1e-9)),4))
def E(r,o): return 1/(1+10**((o-r)/400))
lo,hi=0,3000
for _ in range(60):
    mid=(lo+hi)/2
    if sum(E(mid,o) for o in opp)<9: lo=mid
    else: hi=mid
print('performance rating (logistic, expected score = 9 of 31)', round(lo))
