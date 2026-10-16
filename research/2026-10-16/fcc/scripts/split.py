import sys, re, collections, json, random
random.seed(1)
outdir = sys.argv[1]
def band(w, b):
    for lo, hi, name in [(950,1250,'low'),(1350,1650,'mid'),(1750,2050,'high')]:
        if lo <= w <= hi and lo <= b <= hi: return name
    return None
def speed(tc):
    try:
        b, inc = tc.split('+'); est = int(b) + 40*int(inc)
    except Exception: return 'other'
    if est < 29: return 'ultrabullet'
    if est < 179: return 'bullet'
    if est < 479: return 'blitz'
    if est < 1499: return 'rapid'
    return 'classical'
outs = {k: open(f'{outdir}/{k}.pgn','w') for k in ('ev_low','ev_high','noev_low_rapid_sample','noev_high_rapid_sample')}
total = 0; withev = 0
st = collections.defaultdict(collections.Counter)
cur = []
for line in sys.stdin:
    if line.startswith('['):
        cur.append(line); continue
    if not line.strip(): continue
    total += 1
    h = ''.join(cur); cur = []
    mw = re.search(r'\[WhiteElo "(\d+)"\]', h); mb = re.search(r'\[BlackElo "(\d+)"\]', h)
    tc = re.search(r'\[TimeControl "([^"]+)"\]', h); term = re.search(r'\[Termination "([^"]+)"\]', h); res = re.search(r'\[Result "([^"]+)"\]', h)
    ev = '[%eval' in line
    if ev: withev += 1
    if not (mw and mb and tc): continue
    bd = band(int(mw.group(1)), int(mb.group(1)))
    if not bd: continue
    sp = speed(tc.group(1))
    if sp == 'classical': sp = 'rapid'
    key = f'{bd}|{sp}|{"ev" if ev else "noev"}'
    S = st[key]; S['games'] += 1; S['term_'+(term.group(1) if term else '?')] += 1; S['res_'+(res.group(1) if res else '?')] += 1
    nply = len(re.findall(r'\d+\.\.?\.? ', re.sub(r'\{[^}]*\}', '', line)))
    S['movenums'] += nply
    if ev and bd in ('low','high'):
        outs['ev_'+bd].write(h + f'[Band "{bd}"]\n\n' + line + '\n')
    if not ev and sp == 'rapid' and bd in ('low','high') and random.random() < 0.03 and '%clk' in line:
        outs[f'noev_{bd}_rapid_sample'].write(h + f'[Band "{bd}"]\n\n' + line + '\n')
for o in outs.values(): o.close()
json.dump({'total': total, 'withev': withev, 'stats': st}, open(f'{outdir}/split_stats.json','w'), indent=1)
print('games', total, 'with_eval', withev, file=sys.stderr)
