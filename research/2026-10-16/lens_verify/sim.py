# Monte Carlo of Lichess-style Glicko-2 (per-game update, skipDeviationIncrease=true, RD floor 45,
# time-based RD growth 0.21436 rating periods/day, tau irrelevant at floor). True strength constant or stepped.
import math,random,statistics as st
S=173.7178
def g(phi): return 1/math.sqrt(1+3*phi*phi/math.pi**2)
def E(mu,muj,phij): return 1/(1+math.exp(-g(phij)*(mu-muj)))
def p_win_true(d): # true expected score from true Elo difference (logistic 400)
    return 1/(1+10**(-d/400))
def run(weeks, gpw, step=0, step_week=None, draw=0.04, sigma=0.06, opp_sd=30, seed=None, burn=400):
    rnd=random.Random(seed)
    T=1100.0; r=1100.0; rd=45.0
    hist=[]  # rating at end of each week
    games_per_day=gpw/7
    def play(T):
        nonlocal r,rd
        # opponent paired near displayed rating
        opp_disp = r + rnd.uniform(-60,60)
        opp_true = opp_disp + rnd.gauss(0,opp_sd)
        p = p_win_true(T-opp_true)
        # draws: take draw mass symmetrically
        u=rnd.random()
        pd=draw
        pw=max(0,p-pd/2); 
        s = 1 if u<pw else (0.5 if u<pw+pd else 0)
        mu=(r-1500)/S; phi=rd/S; muj=(opp_disp-1500)/S; phij=50/S
        e=E(mu,muj,phij); v=1/(g(phij)**2*e*(1-e))
        newphi=1/math.sqrt(1/phi**2+1/v)
        mu=mu+newphi**2*g(phij)*(s-e)
        r=mu*S+1500; rd=max(45.0,newphi*S)
    for _ in range(burn): play(T)
    for w in range(weeks):
        if step_week is not None and w==step_week: T+=step
        for d in range(7):
            # daily RD growth
            phi=rd/S; phi=math.sqrt(phi*phi+sigma*sigma*0.21436); rd=min(500,phi*S)
            n=int(games_per_day)+(1 if rnd.random()<games_per_day-int(games_per_day) else 0)
            for _ in range(n): play(T)
        hist.append(r)
    return hist,T
def q(a,p): a=sorted(a); return a[int(p*(len(a)-1))]
random.seed(1)
for gpw in (10,25,50):
    # null: no change
    stat=[];wk=[];w8=[]
    for i in range(1500):
        h,T=run(20,gpw,seed=i)
        stat+= [x-1100 for x in h]
        wk += [h[k+1]-h[k] for k in range(len(h)-1)]
        w8.append(h[10]-h[2])
    print(f"gpw={gpw}: SD(rating-true)={st.pstdev(stat):.1f}; weekly change SD={st.pstdev(wk):.1f}, 90% of weekly changes within +-{q([abs(x) for x in wk],.9):.0f}; 8-week change with NO real change: SD={st.pstdev(w8):.1f}, 95th pct={q(w8,.95):.0f}")
    thr=q(w8,.95)
    # thr from null for 'snapshot after 8 weeks'; also averaged-weeks rule: mean of weeks 7-8 minus mean of baseline weeks 1-2
    nullavg=[]
    for i in range(1500):
        h,T=run(12,gpw,seed=10000+i)
        nullavg.append((h[10]+h[11])/2-(h[0]+h[1])/2)
    thr2=q(nullavg,.95)
    for step in (50,100):
        hit=0;hit2=0;absorbed=[]
        for i in range(1000):
            h,T=run(12,gpw,step=step,step_week=2,seed=20000+i)
            # baseline = end of week 2 snapshot (h[1]); post = 8 weeks later (h[9]) ; matches w8 definition (h[10]-h[2]) offset
            if h[9]-h[1]>thr: hit+=1
            if (h[10]+h[11])/2-(h[0]+h[1])/2>thr2: hit2+=1
        print(f"   true +{step} at week 2: P(detect, single snapshot 8 wks later vs baseline, 5% false alarm)={hit/1000:.2f}; P(detect, avg last 2 wks vs avg first 2 wks)={hit2/1000:.2f}")
# games to absorb a step (deterministic expectation): K at floor
phi=45/S; v=1/(g(50/S)**2*0.25); newphi=1/math.sqrt(1/phi**2+1/v); K=newphi**2*g(50/S)*S
c=math.log(10)/400*0.25
print(f"effective K at RD floor={K:.2f} pts per full point; win vs equal = +{K/2:.1f}")
for frac in (0.5,0.9,0.95):
    print(f"games until rating reflects {int(frac*100)}% of a real change: {math.log(1-frac)/math.log(1-K*c):.0f}")
