import sys, re, math, collections
def winp(cp): return 50 + 50*(2/(1+math.exp(-0.00368208*cp))-1)
def ev2wp(e):
    if e.startswith('#'): return 100.0 if int(e[1:])>0 else 0.0
    return winp(max(-1000,min(1000,float(e)*100)))
bins = collections.defaultdict(lambda: [0,0,0])
cur=[]
for line in open(sys.argv[1]):
    if line.startswith('['): cur.append(line); continue
    if not line.strip(): continue
    h=''.join(cur); cur=[]
    tc = re.search(r'\[TimeControl "(\d+)\+(\d+)"\]', h)
    if not tc or tc.group(1)!='600' or tc.group(2)!='0': continue   # 10+0 only, to keep clocks comparable
    toks = re.findall(r'\{([^}]*)\}', line)
    clk=[]; ev=[]
    for t in toks:
        c=re.search(r'%clk (\d+):(\d+):(\d+)',t); e=re.search(r'%eval ([^\]]+)\]',t)
        clk.append(int(c.group(1))*3600+int(c.group(2))*60+int(c.group(3)) if c else None); ev.append(e.group(1) if e else None)
    if len(clk) < 40 or any(x is None for x in clk[:40]) or any(x is None for x in ev[:40]): continue
    wps=[ev2wp(e) for e in ev[:40]]
    for side in (0,1):
        prev_clock=600; spent=[]; bl=0; prev=winp(20)
        for i in range(40):
            mover = i%2
            w=wps[i]
            if mover==side:
                spent.append(prev_clock-clk[i]); prev_clock=clk[i]
                bm = prev if side==0 else 100-prev; am = w if side==0 else 100-w
                if bm-am>=15: bl+=1
            prev=w
        used = sum(spent[1:])  # first move not timed fairly
        b = 'A <3 min used in moves 2-20' if used<180 else 'B 3-5 min' if used<300 else 'C >=5 min'
        bins[b][0]+=1; bins[b][1]+=bl; bins[b][2]+=20
for b in sorted(bins):
    n,bl,m=bins[b]; print(f"{b}: player-games={n}, blunders per 100 own moves (moves 1-20)={100*bl/m:.2f}")
