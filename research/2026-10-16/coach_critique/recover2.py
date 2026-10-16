import re, math, sys, collections
def winp(cp): return 50 + 50*(2/(1+math.exp(-0.00368208*cp))-1)
def wp(s):
    if s.startswith('#'):
        m=int(s[1:]); return 100.0 if m>0 else 0.0
    cp=float(s)*100; cp=max(-1000,min(1000,cp)); return winp(cp)
def speed(tc):
    try: b,i=tc.split('+'); est=int(b)+40*int(i)
    except: return 'other'
    if est<179: return 'bullet'
    if est<479: return 'blitz'
    return 'slow'
txt=open(sys.argv[1]).read()
games=txt.split('\n\n[Event')
R=collections.defaultdict(collections.Counter)
pred=collections.defaultdict(list)
for g in games:
    h=dict(re.findall(r'^\[(\w+) "([^"]*)"\]',g,re.M))
    band=h.get('Band'); sp=speed(h.get('TimeControl','-'))
    if band not in ('low','high') or sp not in ('blitz','slow'): continue
    evs=re.findall(r'\[%eval ([^\]]+)\]',g)
    if len(evs)<30: continue
    res=h.get('Result')
    W=[wp(e) for e in evs]
    for side in ('w','b'):
        P=W if side=='w' else [100-x for x in W]
        out={'1-0':'win' if side=='w' else 'loss','0-1':'loss' if side=='w' else 'win'}.get(res,'draw')
        k=(band,sp)
        if P[23]<25:
            R[k+('below25@12',)][out]+=1; pred[k].append(P[23])
        # sustained winning: >=90% on 3 consecutive plies (own move kept it)
        sus=any(P[i]>=90 and P[i+1]>=90 and P[i+2]>=90 for i in range(len(P)-2))
        if sus: R[k+('sustained90',)][out]+=1
for k in sorted(R):
    c=R[k]; t=sum(c.values())
    extra=''
    if k[2]=='below25@12': extra=f" mean model win% {sum(pred[k[:2]])/len(pred[k[:2]]):.1f}"
    print(k,t,{o:f"{c[o]/t:.1%}" for o in ('win','draw','loss')},extra)
