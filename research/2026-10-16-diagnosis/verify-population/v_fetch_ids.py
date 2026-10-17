# Fetch Lichess's own analysis for a random sample of analysed in-band games from the independent database sample.
# This gives the game-page / API blunder count DIRECTLY (players.<colour>.analysis.blunder), with no replicated rule.
# usage: .venv/bin/python -I v_fetch_ids.py DB.jsonl OUT.ndjson N_RAPID10 N_BLITZ
import sys, json, random, time, urllib.request, urllib.error

src, OUT, NR, NB = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
rnd = random.Random(99)
rap, bli = [], []
for line in open(src):
    g = json.loads(line)
    if not g['an']: continue
    if not (950 <= g['we'] <= 1250 or 950 <= g['be'] <= 1250): continue
    if g['tc'] == '600+0': rap.append(g['id'])
    elif g['sp'] == 'blitz': bli.append(g['id'])
ids = rnd.sample(rap, min(NR, len(rap))) + rnd.sample(bli, min(NB, len(bli)))
print(len(rap), len(bli), len(ids), flush=True)
url = 'https://lichess.org/api/games/export/_ids?evals=true&moves=true&clocks=false&opening=false&literate=false'
with open(OUT, 'w') as fh:
    for k in range(0, len(ids), 300):
        body = ','.join(ids[k:k + 300]).encode()
        for attempt in range(6):
            try:
                req = urllib.request.Request(url, data=body, method='POST',
                                             headers={'User-Agent': UA, 'Accept': 'application/x-ndjson', 'Content-Type': 'text/plain'})
                data = urllib.request.urlopen(req, timeout=300).read()
                fh.write(data.decode()); fh.flush()
                print(k, data.count(b'\n'), flush=True)
                break
            except urllib.error.HTTPError as e:
                print('HTTP', e.code, flush=True); time.sleep(65 if e.code == 429 else 5)
            except Exception as e:
                print('ERR', e, flush=True); time.sleep(5)
        time.sleep(2)
