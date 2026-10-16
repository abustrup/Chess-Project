# Independent re-implementation of Lichess per-game Glicko-2 (scalachess RatingCalculator, skipDeviationIncrease=true,
# full volatility iteration, cap RD to [45,500], vol<=0.1, blitz RatingRegulator x1.005 on gains, colour advantage ignored),
# daily inactivity RD growth via previewDeviation (0.21436 periods/day, player's own volatility).
import math, random, statistics as st, sys
S = 173.7178
TAU = 0.75
def g(phi): return 1/math.sqrt(1+3*phi*phi/math.pi**2)
def E(mu, muj, phij): return 1/(1+math.exp(-g(phij)*(mu-muj)))
def update(r, rd, vol, ro, rdo, s):
    mu=(r-1500)/S; phi=rd/S; muj=(ro-1500)/S; phij=rdo/S
    e=E(mu,muj,phij); gg=g(phij)
    v=1/(gg*gg*e*(1-e)); delta=v*gg*(s-e)
    a=math.log(vol*vol)
    def f(x):
        ex=math.exp(x)
        return ex*(delta*delta-phi*phi-v-ex)/(2*(phi*phi+v+ex)**2)-(x-a)/TAU**2
    A=a
    if delta*delta>phi*phi+v: B=math.log(delta*delta-phi*phi-v)
    else:
        k=1
        while f(a-k*TAU)<0: k+=1
        B=a-k*TAU
    fA=f(A); fB=f(B); it=0
    while abs(B-A)>1e-6 and it<1000:
        it+=1
        C=A+(A-B)*fA/(fB-fA); fC=f(C)
        if fC*fB<=0: A=B; fA=fB
        else: fA=fA/2
        B=C; fB=fC
    nvol=math.exp(A/2)
    phistar=phi  # skipDeviationIncrease
    nphi=1/math.sqrt(1/phistar**2+1/v)
    nmu=mu+nphi*nphi*gg*(s-e)
    nr=nmu*S+1500; nrd=nphi*S
    if nr>r: nr=r+(nr-r)*1.005
    nrd=min(500,max(45,nrd)); nvol=min(0.1,nvol)
    return nr,nrd,nvol
def pwin(d): return 1/(1+10**(-d/400))
def run(weeks,gpw,step=0,step_week=None,seed=0,burn=300,draw=0.04,opp_err=30,pair=60):
    rnd=random.Random(seed)
    T=1100.0; r=1100.0; rd=45.0; vol=0.06
    def play():
        nonlocal r,rd,vol
        od=r+rnd.uniform(-pair,pair); ot=od+rnd.gauss(0,opp_err); ordv=rnd.choice((45,45,45,48,52,60))
        p=pwin(T-ot); u=rnd.random(); pw=max(0.0,p-draw/2)
        s=1.0 if u<pw else (0.5 if u<pw+draw else 0.0)
        r,rd,vol=update(r,rd,vol,od,ordv,s)
    for _ in range(burn): play()
    hist=[]
    for w in range(weeks):
        if step_week is not None and w==step_week: T+=step
        for d in range(7):
            phi=rd/S; rd=min(500,math.sqrt(phi*phi+0.21436*vol*vol)*S)
            lam=gpw/7; n=int(lam)+(1 if rnd.random()<lam-int(lam) else 0)
            for _ in range(n): play()
        hist.append(r)
    return hist,T
def q(a,p): a=sorted(a); return a[int(p*(len(a)-1))]
if __name__=='__main__':
    mode=sys.argv[1]
    if mode=='null':
        for gpw in (10,25):
            dev=[];r8=0;rng=[];N=600
            for i in range(N):
                h,T=run(20,gpw,seed=900000+i)
                dev+=[x-1100 for x in h]
                if h[9]-h[1]>=50: r8+=1
                rng.append(max(h)-min(h))
            print(f"gpw={gpw}: SD(rating-true)={st.pstdev(dev):.1f}; P(8wk rise>=50 | no change)={r8/N:.3f}; 20wk range median={st.median(rng):.0f}",flush=True)
    if mode=='power':
        for gpw in (10,25):
            for weeks in (6,8,12):
                null=[]
                for i in range(600):
                    h,T=run(weeks+2,gpw,seed=100000+i)
                    null.append(sum(h[-2:])/2-sum(h[:2])/2)
                thr=q(null,.95)
                out=[]
                for step in (50,100):
                    hit=0;N=400
                    for i in range(N):
                        h,T=run(weeks+2,gpw,step=step,step_week=2,seed=300000+i)
                        if sum(h[-2:])/2-sum(h[:2])/2>thr: hit+=1
                    out.append(f"+{step}:{hit/N:.2f}")
                print(f"gpw={gpw} weeks={weeks} thr={thr:.0f} power {' '.join(out)}",flush=True)
