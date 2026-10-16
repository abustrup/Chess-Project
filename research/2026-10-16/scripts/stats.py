import sys,re,collections
path=sys.argv[1]
games=[];cur={};mv=[]
def flush():
    if cur: cur['_moves']=' '.join(mv); games.append(dict(cur))
for line in open(path,encoding='utf-8',errors='replace'):
    if line.startswith('[Event '):
        flush(); cur.clear(); mv.clear()
    if line.startswith('['):
        m=re.match(r'\[(\w+) "(.*)"\]',line)
        if m: cur[m.group(1)]=m.group(2)
    elif line.strip(): mv.append(line.strip())
flush()
games=games[:-1]  # last may be truncated
n=len(games)
ev=sum('%eval' in g['_moves'] for g in games)
clk=sum('%clk' in g['_moves'] for g in games)
print('games',n,'with %eval',ev,f'{ev/n:.1%}','with %clk',clk,f'{clk/n:.1%}')
def speed(g):
    tc=g.get('TimeControl','-')
    if tc=='-': return 'corr'
    b,i=map(int,tc.split('+')); t=b+40*i
    return 'ultrabullet' if t<30 else 'bullet' if t<180 else 'blitz' if t<480 else 'rapid' if t<1500 else 'classical'
sp=collections.Counter(speed(g) for g in games); print('speeds',dict(sp))
band=[g for g in games if g.get('WhiteElo','?').isdigit() and g.get('BlackElo','?').isdigit() and 1000<=int(g['WhiteElo'])<1200 and 1000<=int(g['BlackElo'])<1200]
print('both players 1000-1199:',len(band),f'{len(band)/n:.1%}')
bandbr=[g for g in band if speed(g) in ('blitz','rapid')]
print('  of which blitz/rapid',len(bandbr), ' with %eval', sum('%eval' in g['_moves'] for g in bandbr))
strip=lambda s: re.sub(r'\{[^}]*\}','',s)
def sanlist(g):
    t=strip(g['_moves']); t=re.sub(r'\d+\.(\.\.)?','',t); return t.split()
cnt_e4c6=sum(1 for g in bandbr if sanlist(g)[:2]==['e4','c6'])
cnt_e4=sum(1 for g in bandbr if sanlist(g)[:1]==['e4'])
cnt_d4=sum(1 for g in bandbr if sanlist(g)[:1]==['d4'])
cnt_d4d5=sum(1 for g in bandbr if sanlist(g)[:2]==['d4','d5'])
cnt_lon=sum(1 for g in bandbr if 'Bf4' in sanlist(g)[:6:2] and sanlist(g)[:1]==['d4'])
print('  1.e4',cnt_e4,' 1.e4 c6',cnt_e4c6,' 1.d4',cnt_d4,' 1.d4 d5',cnt_d4d5,' d4 + Bf4 within 3 white moves',cnt_lon)
# after 1.e4 c6 what does white play next, in band
nxt=collections.Counter(' '.join(sanlist(g)[2:5]) for g in bandbr if sanlist(g)[:2]==['e4','c6'])
print('  top continuations after 1.e4 c6 (moves 2.W 2...B 3.W):',nxt.most_common(8))
op=collections.Counter(g.get('Opening','?').split(':')[0] for g in bandbr); print('  top opening families in band:',op.most_common(10))
# termination & hung pieces proxy: decisive by eval swing? use games w/ eval in band
term=collections.Counter(g.get('Termination') for g in bandbr); print('  termination',dict(term))
