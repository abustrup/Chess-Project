import re,sys,json,collections
raw=sys.argv[1]; js=sys.argv[2]
games=[];h={}
for line in open(raw,encoding='utf-8'):
    if line.startswith('['):
        m=re.match(r'\[(\w+) "(.*)"\]',line)
        if m: h[m.group(1)]=m.group(2)
    elif line.strip() and 'Event' in h:
        t=re.sub(r'\{[^}]*\}','',line); t=re.sub(r'\d+\.(\.\.)?','',t)
        mv=[x.rstrip('?!') for x in t.split() if x not in ('1-0','0-1','1/2-1/2','*')]
        games.append((h.get('Event'),h.get('WhiteElo'),h.get('BlackElo'),mv[:6],'%eval' in line,h.get('UTCTime')))
        h={}
print('raw games',len(games),'first time',games[0][5],'last time',games[-1][5])
# compare with first lines of jsonl (jsonl skips games without speed/elo)
J=[]
with open(js) as fh:
    for i,l in enumerate(fh):
        if i>=len(games): break
        J.append(json.loads(l))
kept=[g for g in games if re.search(r'Rated (Blitz|Rapid|Classical|Bullet)',g[0]) and g[1].isdigit() and g[2].isdigit()]
mism=sum(1 for a,b in zip(kept,J) if a[3]!=b['mv'][:6] or int(a[1])!=b['w'])
print('kept',len(kept),'compared',min(len(kept),len(J)),'mismatches',mism)
