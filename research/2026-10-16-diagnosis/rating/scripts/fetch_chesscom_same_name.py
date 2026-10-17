"""For Lichess players seen in a September 2026 database range, look up the chess.com account with the same
username through chess.com's free public API (one request at a time, as chess.com asks), and keep its blitz and
rapid ratings with RD, last-played date and number of games.
Usage: python fetch_chesscom_same_name.py <players.json> <out.ndjson> <max_lookups> [lo hi]"""
import sys, json, time, random, urllib.request, urllib.error
UA = 'ChessCoachRatingResearch/1.0 (personal non-commercial research; serial requests)'
P = json.load(open(sys.argv[1]))['players']
outp = sys.argv[2]; maxn = int(sys.argv[3])
lo, hi = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (600, 1800)
done = set()
try:
    for l in open(outp): done.add(json.loads(l)['u'].lower())
except FileNotFoundError: pass
names = sorted(u for u, d in P.items() if len(u) >= 6 and any(sp in d and lo <= d[sp][0] <= hi for sp in ('blitz', 'rapid')) and u.lower() not in done)
random.seed(11); random.shuffle(names); names = names[:maxn]
out = open(outp, 'a')
def get(url):
    for attempt in range(5):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30))
        except urllib.error.HTTPError as e:
            if e.code in (404, 410): return None
            print('http', e.code, file=sys.stderr); time.sleep(30 if e.code == 429 else 5)
        except Exception as e:
            print('err', e, file=sys.stderr); time.sleep(5)
    return 'fail'
found = 0
for i, u in enumerate(names):
    st = get(f'https://api.chess.com/pub/player/{u.lower()}/stats')
    if st == 'fail': continue
    rec = {'u': u, 'lichess_db': P[u], 'exists': st is not None}
    if st:
        found += 1
        for k in ('chess_blitz', 'chess_rapid', 'chess_bullet'):
            if k in st:
                r = st[k]; recd = r.get('record', {})
                rec[k] = {'rating': r['last']['rating'], 'rd': r['last'].get('rd'), 'date': r['last'].get('date'),
                          'games': recd.get('win', 0) + recd.get('loss', 0) + recd.get('draw', 0)}
    out.write(json.dumps(rec) + '\n')
    if i % 100 == 0: out.flush(); print(i, 'looked up', 'found', found, file=sys.stderr)
    time.sleep(0.15)
out.flush(); print('done', len(names), 'found', found, file=sys.stderr)
