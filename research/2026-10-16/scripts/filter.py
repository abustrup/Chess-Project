import sys, re
out = open(sys.argv[1], 'w')
def band(w, b):
    for lo, hi, name in [(950,1250,'low'),(1350,1650,'mid'),(1750,2050,'high')]:
        if lo <= w <= hi and lo <= b <= hi: return name
    return None
hdr = []; total = 0; withev = 0; kept = {'low':0,'mid':0,'high':0}
cur_headers = []
for line in sys.stdin:
    if line.startswith('['):
        cur_headers.append(line); continue
    if line.strip() == '':
        continue
    # movetext line
    total += 1
    if '[%eval' in line:
        withev += 1
        h = ''.join(cur_headers)
        mw = re.search(r'\[WhiteElo "(\d+)"\]', h); mb = re.search(r'\[BlackElo "(\d+)"\]', h)
        if mw and mb:
            bd = band(int(mw.group(1)), int(mb.group(1)))
            if bd:
                kept[bd] += 1
                out.write(h + '[Band "%s"]\n\n' % bd + line + '\n')
    cur_headers = []
print('games', total, 'with_eval', withev, 'kept', kept, file=sys.stderr)
