"""Losses already below 25% at move 12, both engine settings."""
import sys
sys.path.insert(0,'.')
from vanalyse import *
games=load_games()
for name,D in (('250k',norm_theirs('../my-games/engine/sf_250k_bothnull.jsonl')),('d16',norm_mine(['eng_w0.jsonl','eng_w1.jsonl']))):
    n=b=caro=0
    for gid,g in games.items():
        mw=g['players']['white']['user']['id']==ME
        if result_for(g,mw)!='loss' or len(D[gid])<=24: continue
        n+=1
        if wp_for(D[gid][24],mw)<25:
            b+=1; s=g['moves'].split(); caro+= (not mw and s[:2]==['e4','c6'])
    print(name,'losses reaching move 12:',n,'below 25% at move 12:',b,'of which Caro-Kann:',caro)
