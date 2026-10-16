import sys, re, collections
def speed(tc):
    try:
        b, inc = tc.split('+'); est = int(b) + 40*int(inc)
    except Exception: return 'other'
    return 'ultrabullet' if est<29 else 'bullet' if est<179 else 'blitz' if est<479 else 'rapid' if est<1499 else 'classical'
C = collections.defaultdict(collections.Counter)
first = collections.defaultdict(collections.Counter)
h = {}
for line in open(sys.argv[1]):
    if line.startswith('['):
        m = re.match(r'\[(\w+) "(.*)"\]', line)
        if m: h[m.group(1)] = m.group(2)
    elif line.strip():
        sp = speed(h.get('TimeControl','-')); sp = 'rapid' if sp=='classical' else sp
        k = (h.get('Band'), sp)
        C[k]['games'] += 1; C[k][h.get('Termination','?')] += 1
        # mate endings
        if re.search(r'[a-h1-8NBRQKO]#\s*(\{[^}]*\}\s*)?(1-0|0-1)\s*$', line): C[k]['checkmate'] += 1
        if h.get('Result') == '1/2-1/2': C[k]['draw'] += 1
        h = {}
for k in sorted(C, key=str):
    c = C[k]; g = c['games']
    print(k, g, {t: f"{100*v/g:.1f}%" for t, v in c.items() if t != 'games'})
