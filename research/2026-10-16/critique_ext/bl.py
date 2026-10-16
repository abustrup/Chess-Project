import re,sys,math,statistics as st
def wp(cp): cp=max(-1000,min(1000,cp)); return 50+50*(2/(1+math.exp(-0.00368208*cp))-1)
def ev(s):
    if s.startswith('#'): return 1000 if not s.startswith('#-') else -1000
    return float(s)*100
txt=open(sys.argv[1]).read().split('\n\n[Event')
out={}
for g in txt:
    h=dict(re.findall(r'\[(\w+) "([^"]*)"\]',g))
    band=h.get('Band'); tc=h.get('TimeControl','-')
    if '+' not in tc: continue
    b,i=map(int,tc.split('+')); est=b+40*i
    spd='blitz' if 180<=est<480 else 'rapid' if 480<=est<1500 else None
    if not spd or not band: continue
    mv=g.split('\n\n',1)[1] if '\n\n' in g else ''
    toks=re.findall(r'(\d+\.(?:\.\.)?)\s*\S+?(\?\?|\?!|\?)?\s*\{([^}]*)\}',mv)
    evs=[];nags=[]
    for num,nag,com in toks:
        m=re.search(r'%eval ([#\-\d\.]+)',com)
        if not m: break
        evs.append(ev(m.group(1))); nags.append(nag)
    if len(evs)<10: continue
    cnt={'w':[0,0,0],'b':[0,0,0]}
    prev=wp(20)  # approx start
    for k,e in enumerate(evs):
        side='w' if k%2==0 else 'b'
        w=wp(e); drop=(prev-w) if side=='w' else (w-prev)
        if drop>=30: cnt[side][0]+=1
        if drop>=15: cnt[side][1]+=1
        if nags[k]=='??': cnt[side][2]+=1
        prev=w
    key=(band,spd)
    out.setdefault(key,[]).extend([cnt['w']+[len(evs)//2],cnt['b']+[len(evs)//2]])
z=2*(1.645+0.8416)**2
for key,rows in sorted(out.items()):
    for j,name in enumerate(['big>=30','lichess15','NAG ??']):
        a=[r[j] for r in rows]; m=st.mean(a); sd=st.pstdev(a)
        n=z*(sd/(m/3))**2
        per100=[100*r[j]/max(1,r[3]) for r in rows]
        print(key,name,'pg',len(a),'mean %.2f sd %.2f  n_per_side(1/3 drop) %.0f  | per100moves mean %.2f sd %.2f n %.0f'%(m,sd,n,st.mean(per100),st.pstdev(per100),z*(st.pstdev(per100)/(st.mean(per100)/3))**2))
