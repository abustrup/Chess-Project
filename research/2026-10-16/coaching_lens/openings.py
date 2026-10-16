import sys, re, collections
C = collections.defaultdict(collections.Counter)
band=None
for line in open(sys.argv[1]):
    if line.startswith('[Band'): band = line.split('"')[1]
    elif line.strip() and not line.startswith('['):
        if band != sys.argv[2]: continue
        t = re.sub(r'\{[^}]*\}', '', line); t = re.sub(r'\d+\.(\.\.)?', '', t).split()
        m = [x for x in t if x not in ('1-0','0-1','1/2-1/2','*')][:8]
        if len(m) < 4: continue
        C['W1'][m[0]] += 1
        if m[0]=='e4': C['vs e4'][m[1]] += 1
        if m[0]=='d4': C['vs d4'][m[1]] += 1
        if m[:2]==['e4','c6']: C['1.e4 c6 2.?'][m[2]] += 1
        if m[:3]==['e4','c6','d4']: C['1.e4 c6 2.d4 ?'][m[3]] += 1
        if m[:2]==['d4','d5']: C['1.d4 d5 2.?'][m[2]] += 1
        if m[:3]==['d4','d5','Bf4']: C['1.d4 d5 2.Bf4 ?'][m[3]] += 1
        if m[:2]==['d4','Nf6']: C['1.d4 Nf6 2.?'][m[2]] += 1
for k, c in C.items():
    tot = sum(c.values())
    print(k, tot, ', '.join(f"{mv} {100*v/tot:.0f}%" for mv, v in c.most_common(6)))
