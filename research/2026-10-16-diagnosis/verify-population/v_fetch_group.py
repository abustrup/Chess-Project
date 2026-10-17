# Independent comparison group: players picked from the independent database sample (v_sample.py), none of them in
# the population run's candidate lists. Anchor = the player's latest analysed in-band game of that time control in
# the sample. Exports their rated games of that speed before (up to 120) and after (up to 300) the anchor.
# Output files are numbered; usernames stay in the scratch folder (names.tsv) and never go to the repo.
# usage: .venv/bin/python -I v_fetch_group.py DB.jsonl EXCLUDE_LIST[,LIST2] OUT_DIR PERF N
#   PERF = rapid10 (anchor at a 10+0 game, export perfType=rapid) or blitz
import sys, os, json, random, time, datetime as dt, urllib.request, urllib.error, collections

src, excl, out, perf, N = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5])
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
os.makedirs(out, exist_ok=True)
skip = set()
for f in excl.split(','):
    if os.path.exists(f): skip |= {u.strip().lower() for u in open(f) if u.strip()}
cnt = collections.Counter(); last = {}
for line in open(src):
    g = json.loads(line)
    if not g['an']: continue
    if perf == 'rapid10' and g['tc'] != '600+0': continue
    if perf == 'blitz' and g['sp'] != 'blitz': continue
    for u, e in ((g['w'], g['we']), (g['b'], g['be'])):
        if 950 <= e <= 1250 and u and u.lower() not in skip:
            cnt[u] += 1
            if u not in last or g['t'] > last[u]: last[u] = g['t']
pool = sorted(u for u, c in cnt.items() if c >= 2)
rnd = random.Random(31337)
pick = rnd.sample(pool, min(N, len(pool)))
print(len(cnt), len(pool), len(pick), flush=True)
with open(os.path.join(out, 'names.tsv'), 'w') as fh:
    for k, u in enumerate(pick): fh.write(f'q{k:03d}\t{u}\t{last[u]}\n')

def get(url):
    for _ in range(6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/x-ndjson'})
            return urllib.request.urlopen(req, timeout=300).read()
        except urllib.error.HTTPError as e:
            print('HTTP', e.code, flush=True)
            if e.code == 404: return None
            time.sleep(65 if e.code == 429 else 5)
        except Exception as e:
            print('ERR', e, flush=True); time.sleep(5)
    return None

pt = 'rapid' if perf == 'rapid10' else 'blitz'
base = f'https://lichess.org/api/games/user/{{u}}?perfType={pt}&rated=true&evals=true&opening=false&clocks=false'
for k, u in enumerate(pick):
    t = int(dt.datetime.strptime(last[u], '%Y.%m.%d %H:%M:%S').replace(tzinfo=dt.timezone.utc).timestamp() * 1000)
    fb, fa = os.path.join(out, f'q{k:03d}_before.ndjson'), os.path.join(out, f'q{k:03d}_after.ndjson')
    if not os.path.exists(fb):
        d = get(base.format(u=u) + f'&until={t + 1000}&max=120')
        if d is not None: open(fb, 'wb').write(d)
        time.sleep(1)
    if not os.path.exists(fa):
        d = get(base.format(u=u) + f'&since={t + 1000}&max=300&sort=dateAsc')
        if d is not None: open(fa, 'wb').write(d)
        time.sleep(1)
    print(k, flush=True)
