# Lead check, 2026-10-16: does opponent strength change the blunder rate at 10+0 for 950-1250 players?
# Input: rows.jsonl written by population/sample_db.py (96 slices of the 2026-09 database; kept in the scratchpad,
# it holds usernames). Usage: .venv/bin/python -I opponent_effect.py ROWS.jsonl
# Result 2026-10-16: binned rates 9.33-9.51 from 300 below to 300 above; Poisson rate ratio per +100 opponent points
# 1.006 (200 cluster-bootstrap draws over slices: 0.994-1.018), n = 17,278 player-games within 300 points.
import json, math, random, sys
rows=[]
with open(sys.argv[1]) as f:
    for l in f:
        r=json.loads(l)
        if r['tc']!='600+0' or not r['an'] or not (950<=r['elo']<=1250) or r['moves']<5: continue
        if 'api_bl' not in r: continue
        rows.append((r['elo'], r['oelo'], r['api_bl'], r['moves'], r['pt']))
print('player-games', len(rows))
# bins of opp - own
bins={}
for e,o,b,m,pt in rows:
    d=o-e; k=max(-300,min(300,int(math.floor(d/100.0))*100))
    a=bins.setdefault(k,[0,0,0]); a[0]+=b; a[1]+=m; a[2]+=1
for k in sorted(bins): a=bins[k]; print('opp-own %+d..%+d'%(k,k+99), 'n',a[2], 'rate %.2f'%(100*a[0]/a[1]))
# Poisson regression: log rate = b0 + b1*(elo-1100)/100 + b2*(oelo-elo)/100, IRLS, cluster bootstrap over slices
def solve(M,v):
    a,b,c=M[0];d,e,f=M[1];g,h,i=M[2]
    det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g)
    Mi=[[(e*i-f*h)/det,(c*h-b*i)/det,(b*f-c*e)/det],[(f*g-d*i)/det,(a*i-c*g)/det,(c*d-a*f)/det],[(d*h-e*g)/det,(b*g-a*h)/det,(a*e-b*d)/det]]
    return [sum(Mi[r][k]*v[k] for k in range(3)) for r in range(3)]
def fit(data):
    beta=[math.log(sum(d[2] for d in data)/sum(d[3] for d in data)),0.0,0.0]
    for _ in range(30):
        XtWX=[[0.0]*3 for _ in range(3)]; XtWz=[0.0]*3
        for e,o,y,m,pt in data:
            x=(1.0,(e-1100)/100,(o-e)/100); eta=sum(b*xi for b,xi in zip(beta,x)); mu=m*math.exp(eta)
            z=eta+(y-mu)/mu
            for i in range(3):
                XtWz[i]+=x[i]*mu*z
                for j in range(3): XtWX[i][j]+=x[i]*mu*x[j]
        beta=solve(XtWX,XtWz)
    return beta
rows=[r for r in rows if abs(r[1]-r[0])<300]; print('within 300:',len(rows))
b=fit(rows); print('beta', [round(x,4) for x in b], 'rate ratio per +100 opp', round(math.exp(b[2]),3), 'per +100 own', round(math.exp(b[1]),3))
pts=sorted(set(r[4] for r in rows)); byp={}
for r in rows: byp.setdefault(r[4],[]).append(r)
rng=random.Random(1); bs=[]
for _ in range(200):
    s=[]; 
    for p in [rng.choice(pts) for _ in pts]: s+=byp[p]
    bs.append(math.exp(fit(s)[2]))
bs.sort(); print('95% cluster bootstrap', round(bs[5],3), round(bs[194],3))
