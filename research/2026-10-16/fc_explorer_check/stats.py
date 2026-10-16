import json,sys,collections
f=sys.argv[1]
def band(lo,hi):
    out=[]
    with open(f) as fh:
        for line in fh:
            g=json.loads(line)
            if g['sp'] in ('blitz','rapid','classical') and lo<=g['w']<=hi and lo<=g['b']<=hi:
                out.append(g)
    return out
def dist(games,prefix):
    c=collections.Counter(); n=0
    for g in games:
        mv=g['mv']
        if len(mv)>len(prefix) and mv[:len(prefix)]==prefix:
            c[mv[len(prefix)]]+=1; n+=1
    return n,[(m,round(100*k/n,1)) for m,k in c.most_common(8)]
total=0
with open(f) as fh:
    for _ in fh: total+=1
print('total lines',total)
for lo,hi in [(1000,1599),(1000,1299),(1800,2199)]:
    G=band(lo,hi); print('\nBAND',lo,hi,'n=',len(G), 'with ev', sum(1 for g in G if 'ev' in g))
    for p in [[],['d4','d5'],['e4','c6'],['e4','c6','d4','d5'],['d4','d5','c4']]:
        print(p, dist(G,p))
