import json,os,statistics as st,math
per=[];allb=[];allacc=[];allm=[];within_sd=[];within_acc_sd=[];ratings=[]
for f in sorted(os.listdir('analysed')):
    uid=f[:-7].lower(); b=[];acc=[];m=[];r=[]
    for l in open('analysed/'+f):
        l=l.strip()
        if not l: continue
        g=json.loads(l)
        for side in ('white','black'):
            p=g['players'][side]
            if p.get('user',{}).get('id')==uid and 'analysis' in p:
                a=p['analysis']; b.append(a['blunder']); m.append(a['mistake']); r.append(p['rating'])
                if 'accuracy' in a: acc.append(a['accuracy'])
    if len(b)>=20:
        per.append((uid,len(b),st.mean(b),st.pstdev(b),st.mean(acc) if acc else None, st.mean(r)))
        within_sd.append(st.pstdev(b)); allb+=b; allm+=m
        if len(acc)>=20: within_acc_sd.append(st.pstdev(acc)); allacc+=acc
        ratings.append(st.mean(r))
print("players with >=20 analysed blitz games:",len(per),"games:",len(allb), "mean rating", round(st.mean(ratings)))
print("blunders/game: mean %.2f, median of per-player means %.2f, typical within-player SD %.2f"%(st.mean(allb), st.median([p[2] for p in per]), st.median(within_sd)))
print("mistakes/game mean %.2f"%st.mean(allm))
print("accuracy %%: mean %.1f, typical within-player SD %.1f"%(st.mean(allacc), st.median(within_acc_sd)))
mu=st.median([p[2] for p in per]); sd=st.median(within_sd)
z=1.645+0.8416
for red in (0.2,0.25,0.33,0.5):
    d=mu*red; n=2*(z*sd/d)**2
    print(f"games per phase to detect a {int(red*100)}% drop in blunders/game ({mu:.2f}->{mu*(1-red):.2f}) at 80% power, 5% one-sided: {math.ceil(n)}")
accsd=st.median(within_acc_sd)
for gain in (2,3,5):
    n=2*(z*accsd/gain)**2
    print(f"games per phase to detect +{gain} accuracy points: {math.ceil(n)}")
# rating-based comparison
for g in (50,100):
    n=2*(z*341/g)**2
    print(f"games per phase to detect +{g} Elo from results vs opponents (performance rating): {math.ceil(n)}")
