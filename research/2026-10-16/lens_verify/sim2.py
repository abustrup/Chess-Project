import sys; sys.path.insert(0,'.')
exec(open('sim.py').read().split("def q(a,p)")[0])
import statistics as st
def q(a,p): a=sorted(a); return a[int(p*(len(a)-1))]
for gpw in (10,25):
    # null false-alarm: P(8-week gain >= +50) with no real change; range over 20 weeks
    g50=0;rng=[];N=1500
    for i in range(N):
        h,T=run(20,gpw,seed=50000+i)
        if h[9]-h[1]>=50: g50+=1
        rng.append(max(h)-min(h))
    print(f"gpw={gpw}: no real change -> P(8-week rise >= +50)={g50/N:.2f}; 20-week max-min range median={st.median(rng):.0f}, 90th pct={q(rng,.9):.0f}")
    for weeks in (6,8,12):
        null=[]
        for i in range(1000):
            h,T=run(weeks+2,gpw,seed=60000+i)
            null.append(sum(h[-2:])/2-sum(h[:2])/2)
        thr=q(null,.95)
        for step in (50,100):
            hit=0
            for i in range(600):
                h,T=run(weeks+2,gpw,step=step,step_week=2,seed=70000+i)
                if sum(h[-2:])/2-sum(h[:2])/2>thr: hit+=1
            print(f"   {weeks} weeks after start, true +{step}: power={hit/600:.2f} (avg of last 2 weekly ratings vs avg of 2 baseline weeks; 5% false alarm; threshold {thr:.0f})")
