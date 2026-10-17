"""Bulk-fetch public Lichess profiles (POST /api/users, 300 ids per call) for players seen in a database range.
Keeps every non-closed account with a blitz or rapid rating, with its public profile fields that can identify
the same person on chess.com: a chess.com link in links/bio, country flag, location, real name.
Usage: python fetch_lichess_profiles.py <players.json> <out.ndjson> [lo hi]   (lo/hi: database blitz-or-rapid rating band first)"""
import sys, json, time, re, random, urllib.request, urllib.error
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
P = json.load(open(sys.argv[1]))['players']
outp = sys.argv[2]
lo, hi = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (0, 9999)
done = set()
try:
    for l in open(outp): done.add(json.loads(l)['lichess'])
except FileNotFoundError: pass
def inband(d):
    return any(sp in d and lo <= d[sp][0] <= hi for sp in ('blitz', 'rapid'))
names = sorted(u for u, d in P.items() if inband(d) and u.lower() not in done)
random.seed(7); random.shuffle(names)
out = open(outp, 'a')
CC = re.compile(r'chess\.com/(?:member|players)/([A-Za-z0-9_-]{3,25})', re.I)
seen = kept = linked = 0
for i in range(0, len(names), 300):
    batch = names[i:i + 300]
    users = None
    for attempt in range(8):
        try:
            req = urllib.request.Request('https://lichess.org/api/users', data=','.join(batch).encode(), headers={'User-Agent': UA, 'Content-Type': 'text/plain'})
            users = json.load(urllib.request.urlopen(req, timeout=60)); break
        except urllib.error.HTTPError as e:
            print('http', e.code, 'sleep', file=sys.stderr); time.sleep(65 if e.code == 429 else 10)
        except Exception as e:
            print('err', e, file=sys.stderr); time.sleep(10)
    if users is None: continue
    seen += len(users)
    for u in users:
        if u.get('disabled') or u.get('tosViolation'): continue
        pr = u.get('profile') or {}
        perfs = {k: {kk: v.get(kk) for kk in ('rating', 'rd', 'games', 'prov')} for k, v in (u.get('perfs') or {}).items() if k in ('blitz', 'rapid', 'bullet', 'classical')}
        m = CC.findall((pr.get('links') or '') + '\n' + (pr.get('bio') or ''))
        rec = {'lichess': u['id'], 'username': u.get('username'), 'cc_handles': sorted(set(x.lower() for x in m)), 'from_links': bool(CC.search(pr.get('links') or '')),
               'perfs': perfs, 'seenAt': u.get('seenAt'), 'createdAt': u.get('createdAt'), 'flag': pr.get('flag'), 'location': pr.get('location'),
               'realName': pr.get('realName'), 'fide': pr.get('fideRating'), 'title': u.get('title')}
        out.write(json.dumps(rec) + '\n'); kept += 1; linked += bool(m)
    out.flush()
    print(i + len(batch), 'of', len(names), 'looked up', seen, 'kept', kept, 'linked', linked, file=sys.stderr)
    time.sleep(1.0)
print('done seen', seen, 'kept', kept, 'linked', linked, file=sys.stderr)
