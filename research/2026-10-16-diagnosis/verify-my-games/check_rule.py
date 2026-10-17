"""Check 2: apply the from-scratch rule to Lichess's OWN evals in the 6 analysed games, compare to Lichess's labels."""
import json, sys, collections
sys.path.insert(0, '.')
from vrule import judge
GAMES = '../my-games/lichess_abustrup.ndjson'
gs = [json.loads(l) for l in open(GAMES)]
for clamp in (None, 1000):
    conf = collections.Counter(); tot = 0; dis = []
    him_lichess = 0; him_moves = 0
    for g in gs:
        if 'analysis' not in g: continue
        an = g['analysis']; moves = g['moves'].split()
        me_white = g['players']['white']['user']['id'] == 'abustrup'
        me = 'white' if me_white else 'black'
        him_lichess += g['players'][me]['analysis']['blunder']
        for i in range(1, len(an)):   # ply i+1 is move index i (0-based); prev = eval after ply i
            prev = an[i-1]; nxt = an[i]
            if not (('cp' in prev or 'mate' in prev) and ('cp' in nxt or 'mate' in nxt)):
                # Lichess gives 'eval' key; normalise
                pass
            p = {'cp': prev['eval']} if 'eval' in prev else {'mate': prev['mate']}
            n = {'cp': nxt['eval']} if 'eval' in nxt else ({'mate': nxt['mate']} if 'mate' in nxt else None)
            if n is None: continue
            mover_white = (i % 2 == 0)
            mine = judge(p, n, mover_white, clamp)
            lab = nxt.get('judgment', {}).get('name')
            # Lichess only judges when the played move was not the engine's best ('best' present).
            # We cannot see 'best' for unjudged moves, so compare our raw verdict to Lichess's label.
            conf[(mine, lab)] += 1; tot += 1
            if mine != lab: dis.append((g['id'], i+1, moves[i], mine, lab, p, n))
        # count his moves in analysed games
        him_moves += sum(1 for i in range(len(moves)) if (i % 2 == 0) == me_white)
    agree = sum(v for (a, b), v in conf.items() if a == b)
    print(f'clamp={clamp}: agreement {agree}/{tot}', dict(conf))
    for d in dis: print('   disagree', d)
print('Lichess own blunder count for him in the 6 games:', him_lichess, 'in', him_moves, 'of his moves',
      round(100*him_lichess/him_moves, 2), 'per 100')
