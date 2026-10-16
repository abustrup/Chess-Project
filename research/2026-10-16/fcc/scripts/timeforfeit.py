import sys, re, collections, json, math, statistics as st
def band(w, b):
    for lo, hi, name in [(950,1250,'low'),(1750,2050,'high')]:
        if lo <= w <= hi and lo <= b <= hi: return name
def speed(tc):
    try:
        b, inc = tc.split('+'); est = int(b) + 40*int(inc)
    except Exception: return 'other', 0
    sp = 'ultrabullet' if est<29 else 'bullet' if est<179 else 'blitz' if est<479 else 'rapid'
    return sp, int(b)
def winp(cp): return 50 + 50*(2/(1+math.exp(-0.00368208*cp))-1)
R = collections.defaultdict(lambda: collections.defaultdict(list))
C = collections.defaultdict(collections.Counter)
cur=[]
for line in sys.stdin:
    if line.startswith('['): cur.append(line); continue
    if not line.strip(): continue
    h=''.join(cur); cur=[]
    g=lambda k: (re.search(r'\[%s "([^"]*)"\]'%k, h) or [None,None])[1]
    try: bd = band(int(g('WhiteElo')), int(g('BlackElo')))
    except: continue
    if not bd: continue
    sp, base = speed(g('TimeControl') or '-')
    if sp not in ('rapid','blitz') or base == 0: continue
    res = g('Result'); term = g('Termination')
    if res not in ('1-0','0-1'): continue
    key = f'{bd}|{sp}'
    loser_white = (res == '0-1')
    clks = re.findall(r'\[%clk (\d+):(\d+):(\d+)\]', line)
    secs = [int(a)*3600+int(b)*60+int(c) for a,b,c in clks]
    evs = re.findall(r'\[%eval ([^\]]+)\]', line)
    # plies: white clocks at even idx, black at odd
    lclk = secs[0::2] if loser_white else secs[1::2]
    if not lclk: continue
    C[key]['decisive'] += 1; C[key]['term_'+str(term)] += 1
    frac_last = lclk[-1]/base
    if term == 'Time forfeit':
        # did the loser flag (loser is side to move at end): plies count parity
        nply = len(secs)
        loser_to_move = (nply % 2 == 0) if loser_white else (nply % 2 == 1)
        if not loser_to_move: C[key]['tf_odd'] += 1; continue
        R[key]['tf_last_frac'].append(frac_last)
        if frac_last < 0.10: C[key]['tf_genuine_lt10'] += 1
        elif frac_last >= 0.25: C[key]['tf_bigthink_ge25'] += 1
        else: C[key]['tf_mid'] += 1
        if evs and len(evs) == nply:
            e = evs[-1]
            if e.startswith('#'): w = 100.0 if int(e[1:]) > 0 else 0.0
            else: w = winp(max(-1000,min(1000,float(e)*100)))
            lw = 100-w if loser_white is False else w
            lw = w if loser_white else 100-w
            C[key]['tf_with_eval'] += 1
            if lw < 25: C[key]['tf_loser_lost_anyway'] += 1
            elif lw > 75: C[key]['tf_loser_was_winning'] += 1
        R[key]['all_loser_frac'].append(0.0)
    else:
        R[key]['all_loser_frac'].append(frac_last)
out={}
for k in sorted(C):
    c=C[k]; d=dict(c)
    d['tf_share_of_decisive']=round(c['term_Time forfeit']/c['decisive'],3)
    for t,L in R[k].items():
        L=sorted(L); d['median_'+t]=round(st.median(L),3); d['p25_'+t]=round(L[len(L)//4],3); d['p75_'+t]=round(L[3*len(L)//4],3); d['n_'+t]=len(L)
    out[k]=d
print(json.dumps(out, indent=1))
