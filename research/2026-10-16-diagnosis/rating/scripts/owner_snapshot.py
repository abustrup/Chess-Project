"""Snapshot of the owner's public Lichess rating (abustrup): current ratings, and performance rating over all
and recent rated games (score vs opponents' ratings, the same Elo formula Lichess-style tools use).
Usage: python owner_snapshot.py <out.json>"""
import sys, json, math, urllib.request, datetime
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
def get(url, nd=False):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/x-ndjson' if nd else 'application/json'})
    t = urllib.request.urlopen(req, timeout=60).read().decode()
    return [json.loads(l) for l in t.splitlines() if l.strip()] if nd else json.loads(t)
u = get('https://lichess.org/api/user/abustrup')
games = get('https://lichess.org/api/games/user/abustrup?rated=true&moves=false', nd=True)[::-1]
def perf_rating(rows):
    """Rating at which the expected score equals the real score (one imaginary draw at the average added)."""
    opp = [r[1] for r in rows]; sc = [r[0] for r in rows]
    avg = sum(opp) / len(opp); opp.append(avg); sc.append(0.5)
    lo, hi = avg - 800, avg + 800
    for _ in range(60):
        mid = (lo + hi) / 2
        if sum(s - 1 / (1 + 10 ** ((o - mid) / 400)) for s, o in zip(sc, opp)) > 0: lo = mid
        else: hi = mid
    info = sum((lambda p: p * (1 - p))(1 / (1 + 10 ** ((o - mid) / 400))) for o in opp)
    return round(mid), round(173.7 / math.sqrt(info)), round(avg), len(rows)
rows = []
for g in games:
    side = 'white' if g['players']['white'].get('user', {}).get('id') == 'abustrup' else 'black'
    opp = g['players']['black' if side == 'white' else 'white']
    score = 0.5 if 'winner' not in g else (1.0 if g['winner'] == side else 0.0)
    rows.append((score, opp['rating'], g['speed'], g['createdAt'], g['players'][side]['rating']))
snap = {'fetched': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='minutes'),
        'perfs': {k: v for k, v in u['perfs'].items() if v.get('games')}, 'rated_games': len(rows),
        'speeds': {s: sum(1 for r in rows if r[2] == s) for s in set(r[2] for r in rows)},
        'score': sum(r[0] for r in rows), 'first_game': datetime.datetime.utcfromtimestamp(rows[0][3] / 1000).date().isoformat() if rows else None}
for label, sub in (('all games', rows), ('last 15 games', rows[-15:]), ('first 16 games', rows[:-15])):
    if sub:
        pr, se, avg, n = perf_rating(sub)
        snap[f'performance {label}'] = {'performance_rating': pr, 'se': se, 'opponents_average': avg, 'games': n, 'score': sum(r[0] for r in sub)}
json.dump(snap, open(sys.argv[1], 'w'), indent=1)
print(json.dumps(snap, indent=1))
