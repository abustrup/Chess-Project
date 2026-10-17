"""Fetch each held-out player's most recent rated games in one time control (and, separately, their unrated
games against the Lichess computer), one request at a time, with a browser-like User-Agent.
Stops filling a band once it has enough players with >= NEED usable games.
Usage: python fetch_games.py <picks.json> <rated_out.ndjson> <ai_out.ndjson> [need]"""
import sys, json, time, urllib.request, urllib.error, collections
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
picks = json.load(open(sys.argv[1])); outR = open(sys.argv[2], 'a'); outA = open(sys.argv[3], 'a')
NEED = int(sys.argv[4]) if len(sys.argv) > 4 else 10
def get(url):
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/x-ndjson'})
            return [json.loads(l) for l in urllib.request.urlopen(req, timeout=120).read().decode().splitlines() if l.strip()]
        except urllib.error.HTTPError as e:
            if e.code == 404: return []
            print('http', e.code, url, file=sys.stderr); time.sleep(65 if e.code == 429 else 10)
        except Exception as e:
            print('err', e, file=sys.stderr); time.sleep(10)
    return []
filled = collections.Counter()
for sp, u, dbr, lo, n in picks:
    key = (sp, lo)
    if filled[key] >= n: continue
    games = get(f'https://lichess.org/api/games/user/{u}?max=14&rated=true&perfType={sp}&moves=true&pgnInJson=false&evals=false&opening=false')
    usable = [g for g in games if g.get('variant') == 'standard' and not g.get('initialFen') and len((g.get('moves') or '').split()) >= 20]
    if len(usable) < NEED:
        print('skip', u, len(usable), file=sys.stderr); time.sleep(1); continue
    filled[key] += 1
    for g in usable[:NEED + 2]:
        g['_target'] = u; g['_perf'] = sp; g['_band'] = lo
        outR.write(json.dumps(g) + '\n')
    time.sleep(1)
    ai = get(f'https://lichess.org/api/games/user/{u}?max=60&rated=false&moves=true&opening=false')
    ai = [g for g in ai if any('aiLevel' in g['players'][c] for c in ('white', 'black')) and g.get('variant') == 'standard' and not g.get('initialFen')]
    for g in ai:
        g['_target'] = u; g['_perf'] = sp; g['_band'] = lo
        outA.write(json.dumps(g) + '\n')
    outR.flush(); outA.flush()
    print('ok', sp, lo, u, len(usable), 'ai', len(ai), file=sys.stderr)
    time.sleep(1)
print('filled', dict(filled), file=sys.stderr)
