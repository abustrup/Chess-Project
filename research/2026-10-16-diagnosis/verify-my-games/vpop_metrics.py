"""Population numbers from the independent DB sample (Lichess's own %eval), written from scratch.
Usage: vpop_metrics.py FILE.jsonl [FILE2.jsonl ...]"""
import sys, json, statistics, math
sys.path.insert(0, '.')
from vrule import judge, winpct

def wpw(e):
    if e is None: return None
    if 'mate' in e: return 100.0 if e['mate'] > 0 else 0.0
    return winpct(e['cp'])

res = {}
for path in sys.argv[1:]:
    for l in open(path):
        g = json.loads(l); sp = g['speed']; R = res.setdefault(sp, {'games': 0, 'player_games': 0, 'moves': 0, 'blunders': 0,
              'big': 0, 'big12': 0, 'ever75': 0, 'ever75_notwon': 0, 's90': 0, 's90_notwon': 0, 'per100': []})
        n = g['n']; evs = [({'cp': v} if t == 'c' else {'mate': v}) for t, v in g['ev']]
        # positions after ply 1..n ; position after ply n may be checkmate (no eval)
        pos = [{'cp': 20}] + evs
        if g['mated_last'] and len(pos) == n:  # add terminal: side who moved last wins
            pos.append({'mate': 1} if n % 2 == 1 else {'mate': -1})
        if len(pos) < n + 1: continue
        R['games'] += 1
        res_white = {'1-0': 'w', '0-1': 'b', '1/2-1/2': 'd'}[g['res']]
        for side_white in (True, False):
            R['player_games'] += 1
            mv = bl = 0
            for k in range(n):
                if (k % 2 == 0) != side_white: continue
                mv += 1
                if g['mated_last'] and k == n - 1: continue
                lab = judge(pos[k], pos[k + 1], side_white)
                if lab == 'Blunder':
                    bl += 1
                    a = wpw(pos[k]); b = wpw(pos[k + 1])
                    drop = (a - b) if side_white else (b - a)
                    if drop >= 30:
                        R['big'] += 1; R['big12'] += (k // 2 + 1) <= 12
            R['moves'] += mv; R['blunders'] += bl
            if mv >= 10: R['per100'].append(100 * bl / mv)
            ws = [wpw(p) for p in pos[1:]]
            ws = [w if side_white else 100 - w for w in ws]
            won = (res_white == 'w') if side_white else (res_white == 'b')
            if max(ws) >= 75:
                R['ever75'] += 1; R['ever75_notwon'] += not won
            if any(all(w >= 90 for w in ws[i:i + 3]) for i in range(len(ws) - 2)):
                R['s90'] += 1; R['s90_notwon'] += not won

def wilson(k, n, z=1.96):
    p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return [round((c - h) / d, 3), round((c + h) / d, 3)]
out = {}
for sp, R in res.items():
    pv = sorted(R.pop('per100'))
    out[sp] = dict(R, per100_pooled=round(100 * R['blunders'] / R['moves'], 2), per_game_median=round(statistics.median(pv), 2),
                   share_big12=round(R['big12'] / R['big'], 3), share_big12_wilson=wilson(R['big12'], R['big']),
                   share_ever75_notwon=round(R['ever75_notwon'] / R['ever75'], 3), ever75_wilson=wilson(R['ever75_notwon'], R['ever75']),
                   share_s90_notwon=round(R['s90_notwon'] / R['s90'], 3),
                   pct_rank_of_9_8=round(sum(1 for x in pv if x < 9.8) / len(pv), 3),
                   pct_rank_of_9_8_le=round(sum(1 for x in pv if x <= 9.8) / len(pv), 3))
print(json.dumps(out, indent=1))
