"""Independent check of the owner's Lichess numbers (written from scratch for the verify-rating pass, 2026-10-16).
Reads a fresh export of his games and his profile (fetched with curl, browser-like User-Agent) and computes
performance ratings three different ways:
  a) exact maximum-likelihood Elo performance (no imaginary draw), with a standard error from the Fisher information
  b) the same with one imaginary draw against the average opponent (the investigated script's method)
  c) a non-parametric bootstrap over games of method b
It also replays the per-game ratings (rating before the game + ratingDiff) to check the final rating.
Usage: python v_owner.py <li_user.json> <li_games.ndjson> <out.json>"""
import sys, json, math, random

user = json.load(open(sys.argv[1]))
games = [json.loads(l) for l in open(sys.argv[2]) if l.strip()]
games.sort(key=lambda g: g['createdAt'])  # oldest first
ME = 'abustrup'

def expected(r, o):
    return 1.0 / (1.0 + 10 ** ((o - r) / 400.0))

def mle(scores, opps, dummy):
    s, o = list(scores), list(opps)
    if dummy:
        s.append(0.5); o.append(sum(opps) / len(opps))
    # Newton iterations on the score equation sum(s - E) = 0
    r = sum(o) / len(o)
    for _ in range(200):
        e = [expected(r, x) for x in o]
        f = sum(si - ei for si, ei in zip(s, e))
        info = sum(ei * (1 - ei) for ei in e) * math.log(10) / 400.0
        step = f / info
        r += step
        if abs(step) < 1e-6:
            break
    e = [expected(r, x) for x in o]
    info = sum(ei * (1 - ei) for ei in e) * (math.log(10) / 400.0) ** 2
    return r, 1.0 / math.sqrt(info)

rows = []
for g in games:
    if not g.get('rated'):
        continue
    w = (g['players']['white'].get('user') or {}).get('id')
    side = 'white' if w == ME else 'black'
    other = 'black' if side == 'white' else 'white'
    score = 0.5 if g.get('winner') is None else (1.0 if g['winner'] == side else 0.0)
    rows.append({'id': g['id'], 'speed': g['speed'], 'score': score, 'opp': g['players'][other]['rating'],
                 'me_before': g['players'][side]['rating'], 'diff': g['players'][side].get('ratingDiff'), 'createdAt': g['createdAt'],
                 'perf': g.get('perf'), 'clock': g.get('clock')})

out = {'n_rated': len(rows), 'speeds': {}, 'score': sum(r['score'] for r in rows)}
for r in rows:
    out['speeds'][r['speed']] = out['speeds'].get(r['speed'], 0) + 1
last = rows[-1]
out['rating_after_last_game_from_export'] = last['me_before'] + (last['diff'] or 0)
out['profile'] = {k: v for k, v in user['perfs'].items() if v.get('games')}
bl = user['perfs']['blitz']
out['lichess_interval_2rd'] = [bl['rating'] - 2 * bl['rd'], bl['rating'] + 2 * bl['rd']]
# prog check: change over the last 12 games in the export
if len(rows) >= 12:
    out['change_over_last_12_from_export'] = out['rating_after_last_game_from_export'] - rows[-12]['me_before']

def summarize(sub, label):
    sc = [r['score'] for r in sub]; op = [r['opp'] for r in sub]
    a, ase = mle(sc, op, dummy=False) if 0 < sum(sc) < len(sc) else (None, None)
    b, bse = mle(sc, op, dummy=True)
    rnd = random.Random(7); boots = []
    for _ in range(4000):
        pick = [rnd.randrange(len(sub)) for _ in sub]
        s2 = [sc[i] for i in pick]; o2 = [op[i] for i in pick]
        boots.append(mle(s2, o2, dummy=True)[0])
    boots.sort()
    sd = (sum((x - sum(boots) / len(boots)) ** 2 for x in boots) / (len(boots) - 1)) ** 0.5
    return {'games': len(sub), 'score': sum(sc), 'opp_avg': round(sum(op) / len(op), 1),
            'mle_no_dummy': round(a) if a else None, 'mle_no_dummy_se': round(ase) if ase else None,
            'mle_dummy_draw': round(b), 'mle_dummy_draw_se': round(bse),
            'bootstrap_sd_dummy': round(sd), 'bootstrap_95': [round(boots[int(0.025 * len(boots))]), round(boots[int(0.975 * len(boots))])],
            'linear_dp_approx': round(sum(op) / len(op) + 800 * (sum(sc) / len(sc) - 0.5))}

out['all'] = summarize(rows, 'all')
out['last15'] = summarize(rows[-15:], 'last15')
out['first16'] = summarize(rows[:-15], 'first16')
d = out['last15']['mle_dummy_draw'] - out['first16']['mle_dummy_draw']
se = math.hypot(out['last15']['mle_dummy_draw_se'], out['first16']['mle_dummy_draw_se'])
out['halves_difference'] = {'diff': d, 'se': round(se), 'z': round(d / se, 2)}
json.dump(out, open(sys.argv[3], 'w'), indent=1)
print(json.dumps(out, indent=1))
