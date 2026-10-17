# Population comparison numbers computed with the SAME definitions used on the owner's games, from Lichess's own
# evals in a slice of the monthly database (950-1250 vs 950-1250, blitz and rapid, games Lichess analysed).
# Usage: .venv/bin/python -I scripts/pop_compare.py POP.pgn OUT.json
import sys, os, re, json, collections, statistics
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from lichess_rule import lichess_judgment, START, wp_mover

def speed(tc):
    b, i = tc.split('+'); est = int(b) + 40 * int(i)
    return 'blitz' if est < 479 else 'rapid'
tok = re.compile(r'(\d+\.(?:\.\.)?)?\s*([^\s{}]+)\s*\{([^}]*)\}')
def ev(s):
    if s.startswith('#'): return {'mate': int(s[1:])}
    return {'cp': int(round(float(s) * 100))}

text = open(sys.argv[1], encoding='utf-8').read().split('\n\n[Event ')
rows = collections.defaultdict(list)   # speed -> per player-game rows
first12_big = collections.Counter(); decisive = collections.Counter()
for chunk in text:
    h = dict(re.findall(r'\[(\w+) "([^"]*)"\]', chunk))
    if 'TimeControl' not in h: continue
    sp = speed(h['TimeControl']); res = h.get('Result')
    body = chunk.split('\n\n', 1)[1] if '\n\n' in chunk else ''
    seq = []
    for m in tok.finditer(body):
        e = re.search(r'\[%eval ([^\]]+)\]', m.group(3))
        if not e: break
        seq.append(ev(e.group(1)))
    if len(seq) < 10: continue
    stat = {True: dict(moves=0, bl=0, big=0, big12=0, wp=[]), False: dict(moves=0, bl=0, big=0, big12=0, wp=[])}
    prev = START
    for i, cur in enumerate(seq):
        mw = (i % 2 == 0); fm = i // 2 + 1
        j, drop = lichess_judgment(prev, cur, mw)
        s = stat[mw]; s['moves'] += 1
        if j == 'Blunder': s['bl'] += 1
        if drop >= 30:
            s['big'] += 1; s['big12'] += fm <= 12
        for side in (True, False): stat[side]['wp'].append(wp_mover(cur, side))
        prev = cur
    for side in (True, False):
        s = stat[side]; won = (res == '1-0') if side else (res == '0-1'); lost = (res == '0-1') if side else (res == '1-0')
        wp = s['wp']
        sus90 = any(all(x >= 90 for x in wp[k:k + 3]) for k in range(len(wp) - 2))
        rows[sp].append(dict(moves=s['moves'], bl=s['bl'], big=s['big'], big12=s['big12'], won=won, lost=lost, sus90=sus90,
                             ever75=any(x >= 75 for x in wp)))
out = {}
for sp, R in rows.items():
    pm = [100 * r['bl'] / r['moves'] for r in R if r['moves'] >= 10]
    tot_moves = sum(r['moves'] for r in R); tot_bl = sum(r['bl'] for r in R)
    big = sum(r['big'] for r in R); big12 = sum(r['big12'] for r in R)
    sus = [r for r in R if r['sus90']]; ev75 = [r for r in R if r['ever75']]
    lost = [r for r in R if r['lost']]
    out[sp] = dict(player_games=len(R), moves=tot_moves, lichess_rule_blunders=tot_bl, blunders_per_100_pooled=round(100 * tot_bl / tot_moves, 2),
                   per_player_game_blunders_per_100=dict(median=round(statistics.median(pm), 2), p10=round(sorted(pm)[len(pm)//10], 2), p90=round(sorted(pm)[9*len(pm)//10], 2), mean=round(statistics.mean(pm), 2)),
                   big_blunders=big, big_in_first_12_moves=big12, share_big_first12=round(big12 / big, 3),
                   had_sustained_90=len(sus), of_which_not_won=sum(1 for r in sus if not r['won']),
                   share_sustained90_not_won=round(sum(1 for r in sus if not r['won']) / len(sus), 3),
                   lost_games=len(lost), lost_after_sustained_90=sum(1 for r in lost if r['sus90']),
                   share_losses_after_sustained_90=round(sum(1 for r in lost if r['sus90']) / len(lost), 3),
                   ever75=len(ev75), ever75_not_won=sum(1 for r in ev75 if not r['won']), share_ever75_not_won=round(sum(1 for r in ev75 if not r['won']) / len(ev75), 3),
                   per100_values=sorted(round(x, 2) for x in pm))
json.dump(out, open(sys.argv[2], 'w'), indent=1)
for sp, d in out.items():
    print(sp, {k: v for k, v in d.items() if k != 'per100_values'})
