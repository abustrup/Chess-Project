# Export comparison-group players' rated games around an anchor game, one request at a time.
# The anchor is a September 2026 game (found in the database sample) where the player was rated 950-1250,
# the way the owner is selected "now". Two requests per player:
#   before: the most recent games up to and including the anchor (baseline, the "past games as before")
#   after:  the games after the anchor in date order (the natural "next 50-150 games")
# usage: .venv/bin/python -I fetch_api.py CANDIDATES.txt ANCHORS.tsv OUT_DIR PERF MAX_PLAYERS
# CANDIDATES.txt: usernames (scratch only). ANCHORS.tsv: pNNN <tab> anchor game ids <tab> anchor UTC time.
# Output files are numbered (pNNN_before.ndjson, pNNN_after.ndjson); usernames stay in scratch.
import sys, os, time, datetime as dt, urllib.request, urllib.error

cands, anchors, out, perf, maxp = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5])
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
NL = bytes([10])
os.makedirs(out, exist_ok=True)
users = [u.strip() for u in open(cands) if u.strip()]
anc = {}
for line in open(anchors):
    p = line.rstrip('\n').split('\t')
    if len(p) == 3 and p[2]:
        anc[p[0]] = int(dt.datetime.strptime(p[2], '%Y.%m.%d %H:%M:%S').replace(tzinfo=dt.timezone.utc).timestamp() * 1000)

def get(url):
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/x-ndjson'})
            return urllib.request.urlopen(req, timeout=180).read()
        except urllib.error.HTTPError as e:
            print('HTTP', e.code, flush=True)
            if e.code == 429: time.sleep(70)
            elif e.code == 404: return None
            else: time.sleep(5)
        except Exception as e:
            print('ERR', e, flush=True); time.sleep(5)
    return None

base = 'https://lichess.org/api/games/user/{u}?perfType={perf}&rated=true&evals=true&opening=false&clocks=false'
nb, na = (120, 300) if perf == 'rapid' else (80, 260)
for k, u in enumerate(users[:maxp]):
    key = f'p{k:03d}'
    if key not in anc: continue
    t = anc[key]
    fb, fa = os.path.join(out, key + '_before.ndjson'), os.path.join(out, key + '_after.ndjson')
    if not os.path.exists(fb):
        d = get(base.format(u=u, perf=perf) + f'&until={t + 1000}&max={nb}')
        if d is not None: open(fb, 'wb').write(d)
        time.sleep(1)
    if not os.path.exists(fa):
        d = get(base.format(u=u, perf=perf) + f'&since={t + 1000}&max={na}&sort=dateAsc')
        if d is not None: open(fa, 'wb').write(d)
        time.sleep(1)
    print(k, os.path.exists(fb) and open(fb, 'rb').read().count(NL), os.path.exists(fa) and open(fa, 'rb').read().count(NL), flush=True)
