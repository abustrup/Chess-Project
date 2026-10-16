import json,math,statistics
def cp(e):
    if e is None: return None
    if e.startswith('#'): return -1000 if e.startswith('#-') else 1000
    return max(-1000,min(1000,round(float(e)*100)))
def W(c): return 50+50*(2/(1+math.exp(-0.00368208*c))-1)
n=0; ph={'o':0,'m':0,'l':0}; first=[]; dec={20:0,30:0}; dec_strict={20:0,30:0}; reach={20:0,30:0}
errs10=0  # lichess 'mistake' threshold (0.2 winning chances = 10 win% points)
ph10={'o':0,'m':0,'l':0}
for l in open('../data/evalgames.jsonl'):
    g=json.loads(l); e=[cp(x) for x in g['ev']]
    if len(e)<10: continue
    n+=1; f=None
    for i in range(len(e)):
        b = W(20) if i==0 else (None if e[i-1] is None else W(e[i-1]))
        if b is None or e[i] is None: continue
        a=W(e[i]); d = b-a if i%2==0 else a-b
        k='o' if i<20 else ('m' if i<60 else 'l')
        if d>=20:
            ph[k]+=1
            if f is None: f=i
        if d>=10: ph10[k]+=1
    if f is not None: first.append(f)
    for P in (20,30):
        v=e[min(P,len(e))-1]
        if v is not None and abs(W(v)-50)>=30: dec[P]+=1
        if len(e)>=P:
            reach[P]+=1
            v=e[P-1]
            if v is not None and abs(W(v)-50)>=30: dec_strict[P]+=1
tot=sum(ph.values())
print('games',n,'errors>=20',tot,{k:round(100*v/tot,1) for k,v in ph.items()})
t10=sum(ph10.values()); print('errors>=10 (Lichess mistake+ threshold)',t10,{k:round(100*v/t10,1) for k,v in ph10.items()})
first.sort(); med=first[len(first)//2]
print('games with error',round(100*len(first)/n,1),'median first ply',med,'move',math.ceil((med+1)/2))
early=sum(1 for x in first if x<20)
print('first error in moves 1-10: share of games-with-error',round(100*early/len(first),1),'share of all games',round(100*early/n,1))
for P in (20,30): print('decided by ply',P,'as coded',round(100*dec[P]/n,1),'| only games reaching that ply',reach[P],round(100*dec_strict[P]/reach[P],1))
