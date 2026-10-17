"""For same-username Lichess/chess.com pairs where the chess.com side is established (RD < 150, >= 20 games in
blitz or rapid), fetch the current public Lichess profile (ratings with RD, country flag, real name, links) and
the public chess.com profile (country, name), one request at a time, to grade how sure we are that both
accounts belong to the same person.
Usage: python enrich_pairs.py <cc_same.ndjson> <out.ndjson>"""
import sys, json, time, urllib.request, urllib.error
UA_L = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
UA_C = 'ChessCoachRatingResearch/1.0 (personal non-commercial research; serial requests)'
done = set()
try:
    for l in open(sys.argv[2]): done.add(json.loads(l)['u'].lower())
except FileNotFoundError: pass
out = open(sys.argv[2], 'a')
def get(url, ua):
    for attempt in range(5):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': ua}), timeout=30))
        except urllib.error.HTTPError as e:
            if e.code in (404, 410): return None
            print('http', e.code, url, file=sys.stderr); time.sleep(65 if e.code == 429 else 5)
        except Exception as e:
            print('err', e, file=sys.stderr); time.sleep(5)
    return None
n = 0
for l in open(sys.argv[1]):
    r = json.loads(l)
    if r['u'].lower() in done or not r.get('exists'): continue
    ok = any(k in r and r[k].get('rd') and r[k]['rd'] < 150 and r[k]['games'] >= 20 for k in ('chess_blitz', 'chess_rapid'))
    if not ok: continue
    li = get(f'https://lichess.org/api/user/{r["u"]}', UA_L)
    time.sleep(1.0)
    cp = get(f'https://api.chess.com/pub/player/{r["u"].lower()}', UA_C)
    if not li or li.get('disabled') or li.get('tosViolation'): continue
    pr = li.get('profile') or {}
    r['lichess'] = {'perfs': {k: {kk: v.get(kk) for kk in ('rating', 'rd', 'games', 'prov')} for k, v in li.get('perfs', {}).items() if k in ('blitz', 'rapid', 'bullet', 'classical')},
                    'flag': pr.get('flag'), 'realName': pr.get('realName'), 'links': pr.get('links'), 'bio': (pr.get('bio') or '')[:300],
                    'seenAt': li.get('seenAt'), 'createdAt': li.get('createdAt'), 'title': li.get('title')}
    r['chesscom'] = {'country': (cp or {}).get('country', '').rsplit('/', 1)[-1], 'name': (cp or {}).get('name'), 'last_online': (cp or {}).get('last_online'),
                     'joined': (cp or {}).get('joined'), 'status': (cp or {}).get('status'), 'title': (cp or {}).get('title')}
    out.write(json.dumps(r) + '\n'); out.flush(); n += 1
    if n % 25 == 0: print('enriched', n, file=sys.stderr)
print('done', n, file=sys.stderr)
