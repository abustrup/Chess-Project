"""Opening facts straight from the raw move lists."""
import json, collections
gs=[json.loads(l) for l in open('../my-games/lichess_abustrup.ndjson')]
w=[g for g in gs if g['players']['white']['user']['id']=='abustrup']
b=[g for g in gs if g['players']['black']['user']['id']=='abustrup']
print('white games', len(w), 'first move', collections.Counter(g['moves'].split()[0] for g in w))
print('Bf4 within his first 4 moves', sum(1 for g in w if 'Bf4' in g['moves'].split()[0:8:2]))
print('opp reply to 1.d4', collections.Counter(g['moves'].split()[1] for g in w))
print('black games', len(b), 'replies', collections.Counter((g['moves'].split()[0], g['moves'].split()[1]) for g in b))
print('Slav 1.d4 d5 2.c4 c6:', [g['id'] for g in b if g['moves'].split()[:4]==['d4','d5','c4','c6']])
for g in b:
    m=g['moves'].split()
    if m[0]!='e4': print(' non-e4:', g['id'], ' '.join(m[:6]))
