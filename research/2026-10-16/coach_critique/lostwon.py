import re, math, sys, collections
def winp(cp): return 50 + 50*(2/(1+math.exp(-0.00368208*cp))-1)
def wp(s):
    if s.startswith('#'): return 100.0 if int(s[1:])>0 else 0.0
    return winp(max(-1000,min(1000,float(s)*100)))
def speed(tc):
    try: b,i=tc.split('+'); est=int(b)+40*int(i)
    except: return 'other'
    return 'bullet' if est<179 else 'blitz' if est<479 else 'slow'
C=collections.defaultdict(collections.Counter)
for g in open(sys.argv[1]).read().split('\n\n[Event'):
    h=dict(re.findall(r'^\[(\w+) "([^"]*)"\]',g,re.M))
    band=h.get('Band'); sp=speed(h.get('TimeControl','-')); res=h.get('Result')
    if band not in ('low','high') or sp not in ('blitz','slow') or res not in ('1-0','0-1'): continue
    evs=re.findall(r'\[%eval ([^\]]+)\]',g)
    if len(evs)<10: continue
    W=[wp(e) for e in evs]
    P=W if res=='0-1' else [100-x for x in W]   # loser's POV
    sus=any(P[i]>=90 and P[i+1]>=90 and P[i+2]>=90 for i in range(len(P)-2))
    k=(band,sp); C[k]['n']+=1; C[k]['loser_was_winning']+=sus
for k,c in sorted(C.items()): print(k, c['n'], f"loser had sustained >=90%: {c['loser_was_winning']}/{c['n']} = {c['loser_was_winning']/c['n']:.1%}")
