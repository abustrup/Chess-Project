import sys,re,collections
path=sys.argv[1]; lo,hi=int(sys.argv[2]),int(sys.argv[3])
games=[];cur={};mv=[]
def flush():
    if cur: cur['_moves']=' '.join(mv); games.append(dict(cur))
for line in open(path,encoding='utf-8',errors='replace'):
    if line.startswith('[Event '): flush(); cur.clear(); mv.clear()
    if line.startswith('['):
        m=re.match(r'\[(\w+) "(.*)"\]',line)
        if m: cur[m.group(1)]=m.group(2)
    elif line.strip(): mv.append(line.strip())
flush(); games=games[:-1]
def speed(tc):
    if tc=='-': return 'corr'
    b,i=map(int,tc.split('+')); t=b+40*i
    return 'bullet' if t<180 else 'blitz' if t<480 else 'rapid' if t<1500 else 'classical'
def ev(s):
    if s.startswith('#'): return 1000 if not s.startswith('#-') else -1000
    return max(-1000,min(1000,int(round(float(s)*100))))
sel=[g for g in games if '%eval' in g['_moves'] and g.get('WhiteElo','x').isdigit() and g.get('BlackElo','x').isdigit()
     and lo<=int(g['WhiteElo'])<hi and lo<=int(g['BlackElo'])<hi and speed(g.get('TimeControl','-')) in ('blitz','rapid')]
print('games in band with eval:',len(sel))
first_big=collections.Counter(); n_dec=0; total_big=collections.Counter(); per_game_big=[]
for g in sel:
    evals=[ev(x) for x in re.findall(r'\[%eval ([^\]]+)\]',g['_moves'])]
    prev=20; bigs=[]
    for ply,e in enumerate(evals,1):
        mover_white = (ply%2==1)
        loss = (prev-e) if mover_white else (e-prev)
        if loss>=300 and abs(prev)<600: bigs.append(ply)
        prev=e
    per_game_big.append(len(bigs))
    for p in bigs:
        total_big['opening(ply<=20)' if p<=20 else 'middle(21-60)' if p<=60 else 'late(>60)']+=1
    if g['Result'] in ('1-0','0-1') and bigs:
        n_dec+=1; p=bigs[0]
        first_big['opening(ply<=20)' if p<=20 else 'middle(21-60)' if p<=60 else 'late(>60)']+=1
print('all >=300cp drops (from a not-yet-decided position, |eval|<6) by phase:',dict(total_big), 'sum',sum(total_big.values()))
print('decisive games with such a drop:',n_dec,' first such drop by phase:',dict(first_big))
import statistics
print('mean >=300cp drops per game:',round(statistics.mean(per_game_big),2),' games with zero:',sum(1 for x in per_game_big if x==0))
