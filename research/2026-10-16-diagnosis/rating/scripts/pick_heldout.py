"""Pick fresh held-out players (never used in research/2026-10-16/exp) from a September 2026 database range,
stratified by rating band and time control. Writes a list of [perf, username, db_rating].
Usage: python pick_heldout.py <players.json> <exclude.txt> <out.json>"""
import sys, json, random
P = json.load(open(sys.argv[1]))['players']
excl = set(l.strip().lower() for l in open(sys.argv[2]) if l.strip())
bands = [(700, 900, 6), (900, 1100, 10), (1100, 1300, 10), (1300, 1500, 6), (1500, 1800, 5), (1800, 2200, 5)]
random.seed(20261016)
pick = []
for sp in ('rapid', 'blitz'):
    for lo, hi, n in bands:
        cands = sorted(u for u, d in P.items() if sp in d and d[sp][1] >= 2 and lo <= d[sp][0] < hi and u.lower() not in excl)
        random.shuffle(cands)
        for u in cands[:n * 2]:          # twice as many as needed: some will have too few recent games
            pick.append([sp, u, P[u][sp][0], lo, n])
json.dump(pick, open(sys.argv[3], 'w'))
print(len(pick))
