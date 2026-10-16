import json,collections
c=collections.Counter(); n=0
c2=collections.Counter()
for l in open('../data/games.jsonl'):
    g=json.loads(l)
    if g['sp'] in ('blitz','rapid','classical') and 1000<=g['w']<=1599 and 1000<=g['b']<=1599:
        mv=g['mv']
        if mv[:6]==['e4','c6','Bc4','d5','exd5','cxd5'] and len(mv)>6: c[mv[6]]+=1; n+=1
        if mv[:2]==['d4','e5'] and len(mv)>2: c2[mv[2]]+=1
print(n,[(m,k,round(100*k/n,1)) for m,k in c.most_common(6)])
t=sum(c2.values()); print('after 1.d4 e5',t,[(m,round(100*k/t,1)) for m,k in c2.most_common(5)])
