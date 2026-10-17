"""Opponent blunder counts: Lichess vs 250k vs depth 16 on the 6 analysed games, and per-move agreement on all games."""
import sys, collections
sys.path.insert(0,'.')
from vanalyse import *
games=load_games(); A=norm_theirs('../my-games/engine/sf_250k_bothnull.jsonl'); B=norm_mine(['eng_w0.jsonl','eng_w1.jsonl'])
tot={'lichess':0,'250k':0,'d16':0,'moves':0}
for gid,g in games.items():
    if 'analysis' not in g: continue
    opp='black' if g['players']['white']['user']['id']==ME else 'white'
    tot['lichess']+=g['players'][opp]['analysis']['blunder']
    for name,D in (('250k',A),('d16',B)):
        tot[name]+=sum(1 for d in per_move(D[gid],g) if not d['mine'] and d['label']=='Blunder')
    tot['moves']+=sum(1 for d in per_move(A[gid],g) if not d['mine'])
print('OPPONENTS in the 6 Lichess-analysed games:', tot)
c=collections.Counter()
for gid,g in games.items():
    lb={d['ply']:d for d in per_move(B[gid],g)}
    for d in per_move(A[gid],g):
        if not d['mine']: c[(d['label']=='Blunder', lb[d['ply']]['label']=='Blunder')]+=1
print('opponent moves (250k blunder, d16 blunder):', dict(c))
