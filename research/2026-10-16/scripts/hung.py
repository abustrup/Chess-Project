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
    if s.startswith('#'): return -1000 if s.startswith('#-') else 1000
    return max(-1000,min(1000,int(round(float(s)*100))))
tok=re.compile(r'(\d+\.(?:\.\.)?)?\s*([^\s{}]+)\s*\{([^}]*)\}')
res=collections.Counter()
for g in games:
    if '%eval' not in g['_moves'] or not (g.get('WhiteElo','x').isdigit() and g.get('BlackElo','x').isdigit()): continue
    if not (lo<=int(g['WhiteElo'])<hi and lo<=int(g['BlackElo'])<hi and speed(g.get('TimeControl','-')) in ('blitz','rapid')): continue
    if g['Result'] not in ('1-0','0-1'): continue
    seq=[]
    for m in tok.finditer(g['_moves']):
        e=re.search(r'\[%eval ([^\]]+)\]',m.group(3))
        if not e: break
        seq.append((m.group(2),ev(e.group(1))))
    prev=20
    for i,(san,e) in enumerate(seq):
        ply=i+1; loss=(prev-e) if ply%2==1 else (e-prev)
        if loss>=300 and abs(prev)<600:
            nxt=seq[i+1][0] if i+1<len(seq) else ''
            phase='early(ply<=20)' if ply<=20 else 'later'
            res[(phase,'opponent captures next' if 'x' in nxt else 'no immediate capture')]+=1
            break
        prev=e
for k,v in sorted(res.items()): print(k,v)
