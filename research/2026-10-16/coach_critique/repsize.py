import json, collections, sys
LO,HI=int(sys.argv[2]),int(sys.argv[3]); MAXP=24; MINN=int(sys.argv[4]) if len(sys.argv)>4 else 30
cnt=collections.Counter(); N=0
for l in open(sys.argv[1]):
    g=json.loads(l)
    if g['sp']=='bullet' or not(LO<=g['w']<=HI and LO<=g['b']<=HI): continue
    N+=1; mv=g['mv'][:MAXP]; p=''
    cnt['']+=1
    for m in mv:
        p=p+' '+m if p else m; cnt[p]+=1
children=collections.defaultdict(list)
for k,v in cnt.items():
    if not k: continue
    par=k.rsplit(' ',1)[0] if ' ' in k else ''
    children[par].append((k,v))
def mychoice(prefix, ply, color):
    forced={'black':{('e4',):'c6',('d4',):'d5',('d4','d5','c4'):'c6'},'white':{():'d4'}}
    t=tuple(prefix.split()) if prefix else ()
    if t in forced[color]: return forced[color][t]
    if color=='white' and len(t)==1:
        return 'dxe5' if t[0]=='e5' else 'Bf4'
    ch=children.get(prefix)
    if not ch: return None
    return max(ch,key=lambda x:x[1])[0].split()[-1]
def walk(color, thresholds):
    res={t:0 for t in thresholds}; rare=0.0; mass_in=0.0
    stack=[('',1.0)]
    while stack:
        p,pr=stack.pop()
        ply=len(p.split()) if p else 0
        if ply>=MAXP: continue
        mine=(ply%2==0)==(color=='white')
        if mine:
            for t in thresholds:
                if pr>=t: res[t]+=1
            m=mychoice(p,ply,color)
            if m is None: continue
            q=p+' '+m if p else m
            if cnt.get(q,0)<MINN: rare+=pr; continue
            stack.append((q,pr))
        else:
            tot=cnt.get(p,0)
            if tot<MINN: rare+=pr; continue
            for k,v in children.get(p,[]):
                stack.append((k,pr*v/tot))
    return res,rare
print('games',N)
for color in ('white','black'):
    res,rare=walk(color,[0.05,0.02,0.01,0.005])
    print(color,{f'reach>=1/{round(1/t)}':v for t,v in res.items()},'prob mass lost to too-rare',round(rare,3))
