import json,os,sys,statistics as st,datetime as dt
d=sys.argv[1]
wk=[];w4=[];w8=[];gpw=[];players=0;minweeks=int(sys.argv[2]) if len(sys.argv)>2 else 8
stepabs=[]
for f in sorted(os.listdir(d)):
    rows=[]
    for l in open(os.path.join(d,f)):
        l=l.strip()
        if not l: continue
        try: g=json.loads(l)
        except: continue
        uid=f[:-7].lower()
        for side in ('white','black'):
            p=g['players'][side]
            if p.get('user',{}).get('id')==uid and 'ratingDiff' in p:
                rows.append((g['createdAt'],p['rating'],p['rating']+p['ratingDiff']))
                stepabs.append(abs(p['ratingDiff']))
    if len(rows)<40: continue
    rows.sort()
    weeks={};cnt={}
    for t,rb,ra in rows:
        day=dt.datetime.utcfromtimestamp(t/1000).date()
        k=day-dt.timedelta(days=day.weekday())
        weeks[k]=ra; cnt[k]=cnt.get(k,0)+1
    ks=sorted(weeks)
    if len(ks)<minweeks: continue
    players+=1
    gpw.append(st.median(cnt.values()))
    for i in range(1,len(ks)):
        if (ks[i]-ks[i-1]).days==7: wk.append(weeks[ks[i]]-weeks[ks[i-1]])
    for lag,arr in ((4,w4),(8,w8)):
        for k in ks:
            t=k+dt.timedelta(weeks=lag)
            if t in weeks: arr.append(weeks[t]-weeks[k])
def summ(name,a):
    a=sorted(a)
    if not a: print(name,'none');return
    n=len(a); q=lambda p:a[int(p*(n-1))]
    print(f"{name}: n={n} mean={st.mean(a):+.1f} SD={st.pstdev(a):.1f} median|chg|={st.median([abs(x) for x in a]):.0f} p5={q(.05)} p95={q(.95)} share|chg|>=50={sum(abs(x)>=50 for x in a)/n:.2f} >=100={sum(abs(x)>=100 for x in a)/n:.2f}")
print("players used:",players,"median games/active week per player:",sorted(gpw))
print("per-game |ratingDiff| median",st.median(stepabs) if stepabs else None)
summ("week-to-week",wk); summ("4-week",w4); summ("8-week",w8)
