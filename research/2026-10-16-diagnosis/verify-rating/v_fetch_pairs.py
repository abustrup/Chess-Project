"""Independent re-sample of same-username Lichess/chess.com pairs (verify-rating pass, 2026-10-16).
Step 1 (chess.com, one request at a time): for each sampled Lichess username, chess.com stats; if the account has an
established blitz or rapid rating (RD < 150 and >= 20 games), also its public profile (country, name).
Step 2 (Lichess): current public profiles in bulk (POST /api/users, up to 300 ids per request).
Raw output stays in the scratchpad (it holds other players' usernames); only aggregates go in the repo.
Usage: python v_fetch_pairs.py <players.json> <exclude.ndjson> <out.ndjson> <n_names> <lo> <hi>"""
import sys, json, time, random, urllib.request, urllib.error

UA_CC = 'personal-research-check/1.0 (non-commercial, serial requests)'
UA_LI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
P = json.load(open(sys.argv[1]))['players']
excl = set()
for l in open(sys.argv[2]):
    if l.strip(): excl.add(json.loads(l)['u'].lower())
outp, N, LO, HI = sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])

def get(url, ua, data=None, ctype=None):
    for attempt in range(5):
        try:
            h = {'User-Agent': ua}
            if ctype: h['Content-Type'] = ctype
            req = urllib.request.Request(url, data=data, headers=h)
            return json.load(urllib.request.urlopen(req, timeout=60))
        except urllib.error.HTTPError as e:
            if e.code in (404, 410): return None
            print('http', e.code, url, file=sys.stderr); time.sleep(65 if e.code == 429 else 5)
        except Exception as e:
            print('err', e, file=sys.stderr); time.sleep(5)
    return 'fail'

names = sorted(u for u, d in P.items() if len(u) >= 6 and u.lower() not in excl and 'blitz' in d and LO <= d['blitz'][0] <= HI)
random.Random(1610).shuffle(names)
names = names[:N]
recs = []
for i, u in enumerate(names):
    st = get(f'https://api.chess.com/pub/player/{u.lower()}/stats', UA_CC)
    time.sleep(0.12)
    if st == 'fail' or st is None:
        continue
    rec = {'u': u, 'db': P[u]}
    for k in ('chess_blitz', 'chess_rapid'):
        if k in st:
            r = st[k]; rc = r.get('record', {})
            rec[k] = {'rating': r['last']['rating'], 'rd': r['last'].get('rd'), 'date': r['last'].get('date'),
                      'games': rc.get('win', 0) + rc.get('loss', 0) + rc.get('draw', 0)}
    est = any(k in rec and (rec[k]['rd'] or 999) < 150 and rec[k]['games'] >= 20 for k in ('chess_blitz', 'chess_rapid'))
    if est:
        cp = get(f'https://api.chess.com/pub/player/{u.lower()}', UA_CC)
        time.sleep(0.12)
        if isinstance(cp, dict):
            rec['cc_profile'] = {'country': (cp.get('country') or '').rsplit('/', 1)[-1], 'name': cp.get('name'), 'title': cp.get('title'), 'status': cp.get('status')}
        recs.append(rec)
    if i % 200 == 0:
        print(i, 'looked up; established so far', len(recs), file=sys.stderr)
# Lichess bulk profiles
ids = [r['u'] for r in recs]
li = {}
for s in range(0, len(ids), 300):
    res = get('https://lichess.org/api/users', UA_LI, data=','.join(ids[s:s + 300]).encode(), ctype='text/plain')
    time.sleep(2)
    if isinstance(res, list):
        for p in res: li[p['id']] = p
with open(outp, 'w') as f:
    for r in recs:
        p = li.get(r['u'].lower())
        if not p or p.get('disabled') or p.get('tosViolation'): continue
        pr = p.get('profile') or {}
        r['li'] = {'perfs': {k: {kk: v.get(kk) for kk in ('rating', 'rd', 'games', 'prov')} for k, v in (p.get('perfs') or {}).items() if k in ('blitz', 'rapid')},
                   'flag': pr.get('flag') or pr.get('country'), 'realName': pr.get('realName') or ' '.join(x for x in (pr.get('firstName'), pr.get('lastName')) if x) or None,
                   'links': pr.get('links'), 'bio': (pr.get('bio') or '')[:400], 'title': p.get('title')}
        f.write(json.dumps(r) + '\n')
print('names', len(names), 'established', len(recs), 'with lichess profile', sum(1 for r in recs if r['u'].lower() in li), file=sys.stderr)
