import json, math, sys, collections
def winp(cp): return 50 + 50*(2/(1+math.exp(-0.00368208*cp))-1)
def wp(s):
    if s.startswith('#'):
        m=int(s[1:]); return 100.0 if m>0 else 0.0
    cp=float(s)*100; cp=max(-1000,min(1000,cp)); return winp(cp)
lo,hi=int(sys.argv[2]),int(sys.argv[3])
C=collections.Counter(); conv=collections.Counter(); nn=collections.Counter()
for line in open(sys.argv[1]):
    g=json.loads(line)
    if g['sp'] not in ('blitz','rapid','classical'): continue
    if not (lo<=g['w']<=hi and lo<=g['b']<=hi): continue
    ev=g['ev']; res=g['res']
    if len(ev)<25: continue
    w12=wp(ev[23])  # white win% after ply 24 (move 12 by black)
    for side in ('w','b'):
        p = w12 if side=='w' else 100-w12
        outcome = {'1-0':'win' if side=='w' else 'loss','0-1':'loss' if side=='w' else 'win'}.get(res,'draw')
        if p<25:
            C[(g['sp'],outcome)]+=1
        # conversion: ever reached >=90 win% at or after ply 1
        evs=[wp(x) if side=='w' else 100-wp(x) for x in ev]
        if max(evs)>=90:
            conv[(g['sp'],outcome)]+=1
    nn[g['sp']]+=1
print('games',dict(nn))
for sp in ('blitz','rapid'):
    tot=sum(v for k,v in C.items() if k[0]==sp)
    print(sp,'below25 after move12 player-games',tot, {o:f"{C[(sp,o)]}/{tot}={C[(sp,o)]/tot:.1%}" for o in ('win','draw','loss')})
    tot=sum(v for k,v in conv.items() if k[0]==sp)
    print(sp,'ever>=90% player-games',tot, {o:f"{conv[(sp,o)]}/{tot}={conv[(sp,o)]/tot:.1%}" for o in ('win','draw','loss')})
