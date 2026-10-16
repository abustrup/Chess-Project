import json,os,sys,statistics as st,math,collections
d=sys.argv[1]
perfs=collections.Counter(); per={}
for f in sorted(os.listdir(d)):
    uid=f.rsplit('.',1)[0].lower(); rows=[]
    for line in open(os.path.join(d,f)):
        line=line.strip()
        if not line: continue
        try: g=json.loads(line)
        except Exception: continue
        perfs[g.get('perf')]+=1
        if g.get('perf')!='blitz': continue
        for side in ('white','black'):
            p=g['players'][side]
            if p.get('user',{}).get('id')==uid and 'analysis' in p:
                a=p['analysis']; rows.append((a.get('blunder',0),a.get('mistake',0),a.get('accuracy'),p.get('rating')))
    if len(rows)>=20: per[uid]=rows
print('perf counts',dict(perfs))
allb=[r[0] for v in per.values() for r in v]; allacc=[r[2] for v in per.values() for r in v if r[2] is not None]
print('players',len(per),'games',len(allb),'mean rating %.0f'%st.mean([r[3] for v in per.values() for r in v]))
print('blunders mean %.2f'%st.mean(allb),'mistakes mean %.2f'%st.mean([r[1] for v in per.values() for r in v]))
# pooled within-player variance
num=sum(sum((r[0]-st.mean([x[0] for x in v]))**2 for r in v) for v in per.values()); den=sum(len(v)-1 for v in per.values())
sdw=math.sqrt(num/den)
numa=0;dena=0
for v in per.values():
    a=[r[2] for r in v if r[2] is not None]
    if len(a)>=2: m=st.mean(a); numa+=sum((x-m)**2 for x in a); dena+=len(a)-1
sda=math.sqrt(numa/dena)
print('pooled within-player SD blunders %.2f accuracy %.1f; accuracy mean %.1f'%(sdw,sda,st.mean(allacc)))
mu=st.mean(allb); z=1.645+0.8416
for red in (0.5,0.33,0.25,0.2):
    print('drop %d%%: n per phase %d (pooled SD, mean %.2f)'%(red*100, math.ceil(2*(z*sdw/(mu*red))**2), mu))
for gain in (3,5): print('acc +%d: n %d'%(gain, math.ceil(2*(z*sda/gain)**2)))
# lag-1 autocorrelation of blunders within player, in game order as stored
