import json, os, sys, statistics as st, datetime as dt
d = sys.argv[1]
minw = 8
def wkstart(ms):
    day = dt.datetime.fromtimestamp(ms/1000, dt.timezone.utc).date()
    return day - dt.timedelta(days=day.weekday())
res = {'all': {'w1': [], 'w8': []}, 'active': {'w1': [], 'w8': []}}
n_all = n_act = 0
spans = []
for f in sorted(os.listdir(d)):
    uid = f.rsplit('.', 1)[0].lower()
    rows = []
    for line in open(os.path.join(d, f)):
        line = line.strip()
        if not line: continue
        try: g = json.loads(line)
        except Exception: continue
        if g.get('perf') != 'blitz' or not g.get('rated'): continue
        for side in ('white', 'black'):
            p = g['players'][side]
            if p.get('user', {}).get('id') == uid and 'ratingDiff' in p:
                rows.append((g['createdAt'], p['rating'] + p['ratingDiff']))
    if not rows: continue
    rows.sort()
    first = dt.datetime.fromtimestamp(rows[0][0]/1000, dt.timezone.utc).date()
    last = dt.datetime.fromtimestamp(rows[-1][0]/1000, dt.timezone.utc).date()
    end = {}; cnt = {}
    for t, ra in rows:
        k = wkstart(t); end[k] = ra; cnt[k] = cnt.get(k, 0) + 1
    ks = sorted(end)
    medg = st.median(cnt.values())
    spans.append((f[:-7], len(rows), (last-first).days, len(ks), medg))
    if len(rows) < 40 or len(ks) < minw: continue
    groups = ['all'] + (['active'] if medg >= 10 else [])
    n_all += 1; n_act += (medg >= 10)
    for gname in groups:
        for i in range(1, len(ks)):
            if (ks[i]-ks[i-1]).days == 7: res[gname]['w1'].append(end[ks[i]] - end[ks[i-1]])
        for k in ks:
            t = k + dt.timedelta(weeks=8)
            if t in end: res[gname]['w8'].append(end[t] - end[k])
pass
print('players used', n_all, 'active(>=10 games/active week)', n_act)
for gname in res:
    for lag in ('w1', 'w8'):
        a = res[gname][lag]
        if not a: continue
        ab = [abs(x) for x in a]
        print(gname, lag, 'n', len(a), 'SD %.1f' % st.pstdev(a), 'median|chg| %.0f' % st.median(ab),
              'share>=50 %.2f' % (sum(x >= 50 for x in ab)/len(a)), 'share>=100 %.2f' % (sum(x >= 100 for x in ab)/len(a)))
import math
for gname in res:
    a = sorted(res[gname]['w8'])
    if not a: continue
    q=lambda p: a[min(len(a)-1,int(p*len(a)))]
    print(gname,'w8 n',len(a),'mean %.1f'%st.mean(a),'p05 %d p50 %d p90 %d p95 %d'%(q(.05),q(.5),q(.9),q(.95)), 'share>=+100 %.2f'%(sum(x>=100 for x in a)/len(a)))
