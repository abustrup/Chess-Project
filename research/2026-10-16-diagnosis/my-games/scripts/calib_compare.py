# Compares move judgements on the games Lichess itself analysed:
#  (1) our re-implemented rule applied to Lichess's own evals  vs  Lichess's judgements  (tests the rule)
#  (2) our rule applied to our Stockfish evals at a given node count  vs  Lichess's judgements  (tests the engine setting)
# Usage: calib_compare.py GAMES.ndjson SF_EVALS.jsonl [SF_EVALS2.jsonl ...]
import sys, json, collections, os
sys.path.insert(0, os.path.dirname(__file__))
from lichess_rule import lichess_judgment, lichess_api_score, START, wp_mover
import chess

ME = 'abustrup'
games = {g['id']: g for g in (json.loads(l) for l in open(sys.argv[1])) if 'analysis' in g}

def lichess_labels(g):
    out = []
    for i, a in enumerate(g['analysis']):
        out.append(a.get('judgment', {}).get('name'))
    return out

# (1) rule on Lichess evals
agree = collections.Counter()
for gid, g in games.items():
    labs = lichess_labels(g)
    prev = START
    for i, a in enumerate(g['analysis']):
        cur = lichess_api_score(a)
        if cur is None:
            break
        mover_white = (i % 2 == 0)
        j, _ = lichess_judgment(prev, cur, mover_white, played_is_best=('best' not in a))
        agree[(labs[i], j)] += 1
        prev = cur
print('(1) rule on Lichess evals vs Lichess labels:', dict(agree))
same = sum(v for (a, b), v in agree.items() if a == b); tot = sum(agree.values())
print(f'    exact agreement {same}/{tot}')

def wilson(k, n, z=1.96):
    if n == 0: return (0, 0)
    p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); h = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5)
    return ((c - h) / d, (c + h) / d)

for fn in sys.argv[2:]:
    sf = {}
    for l in open(fn):
        r = json.loads(l); sf[r['id']] = r
    conf = collections.Counter(); per_player = []
    cp_diffs = []
    mine_only = []; lich_only = []
    for gid, g in games.items():
        if gid not in sf: continue
        pos = sf[gid]['positions']; labs = lichess_labels(g)
        sans = g['moves'].split(); b = chess.Board()
        cnt = {True: [0, 0, 0], False: [0, 0, 0]}  # mover_white -> [mine, lichess, moves]
        for i in range(len(sans)):
            mv = b.parse_san(sans[i]); b.push(mv)
            mover_white = (i % 2 == 0)
            prev = START if i == 0 else pos[i]['score']
            cur = pos[i + 1]['score']
            best = pos[i].get('best')
            j, drop = lichess_judgment(prev, cur, mover_white, played_is_best=(best == mv.uci()))
            lj = labs[i] if i < len(labs) else None
            conf[(lj == 'Blunder', j == 'Blunder')] += 1
            cnt[mover_white][0] += (j == 'Blunder'); cnt[mover_white][1] += (lj == 'Blunder'); cnt[mover_white][2] += 1
            if j == 'Blunder' and lj != 'Blunder': mine_only.append((gid, i + 1, sans[i], lj, round(drop, 1)))
            if lj == 'Blunder' and j != 'Blunder': lich_only.append((gid, i + 1, sans[i], j, round(drop, 1)))
            la = lichess_api_score(g['analysis'][i]) if i < len(g['analysis']) else None
            if la and 'cp' in la and 'cp' in cur:
                cp_diffs.append(abs(max(-1000, min(1000, la['cp'])) - max(-1000, min(1000, cur['cp']))))
        me_white = g['players']['white'].get('user', {}).get('id') == ME
        for mw in (True, False):
            per_player.append((gid, 'me' if mw == me_white else 'opp', *cnt[mw]))
    tp = conf[(True, True)]; fp = conf[(False, True)]; fn_ = conf[(True, False)]
    print(f'\n(2) {os.path.basename(fn)}: moves {sum(conf.values())}  both-blunder {tp}  ours-only {fp}  lichess-only {fn_}')
    print(f'    precision {tp/(tp+fp):.3f}  recall {tp/(tp+fn_):.3f}  total ours {tp+fp} vs lichess {tp+fn_}')
    cp_diffs.sort()
    if cp_diffs: print(f'    |cp diff| median {cp_diffs[len(cp_diffs)//2]}  p90 {cp_diffs[int(len(cp_diffs)*0.9)]}  n {len(cp_diffs)}')
    mine = sum(r[2] for r in per_player if r[1] == 'me'); lich = sum(r[3] for r in per_player if r[1] == 'me'); mv = sum(r[4] for r in per_player if r[1] == 'me')
    print(f'    owner only: ours {mine} vs lichess {lich} blunders in {mv} of his moves -> per100 ours {100*mine/mv:.2f} lichess {100*lich/mv:.2f}')
    for r in per_player: print('     ', r)
    print('    ours-only:', mine_only)
    print('    lichess-only:', lich_only)
