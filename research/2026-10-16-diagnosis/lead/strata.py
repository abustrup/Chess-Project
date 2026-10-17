# Lead check, 2026-10-16: his and his opponents' blunder rates by win-chance band and threat, with game-bootstrap
# intervals (10,000 draws, seed 20261016). Reads the my-games outputs. Usage: .venv/bin/python -I strata.py
# Result 2026-10-16: balanced + threat 33/93 vs 13/79; winning + no threat 19/88 vs 22/240 (difference +12.4,
# 95% +0.5 to +30.7, 12 games); any threat +15.7 (+3.9 to +29.0); no threat +1.7 (-1.3 to +4.4).
import json, sys, random, math, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'prereg'))
from lichess_rule import wp_mover, START
D=os.path.join(HERE, '..', 'my-games') + '/'
ev={}
for l in open(D+'engine/sf_250k_bothnull.jsonl'):
    x=json.loads(l); ev[x['id']]=x['positions']
games={json.loads(l)['id']:json.loads(l) for l in open(D+'lichess_abustrup.ndjson')}
mine=[json.loads(l) for l in open(D+'out/moves.jsonl')]
opp=[json.loads(l) for l in open(D+'out/opp_moves.jsonl')]
print(len(mine), len(opp))
print(sorted(mine[5].keys()))
# my moves: tested = threat_before not None and ply>1?
def strat(rows, wpf, realf, judf, testedf):
    out={}
    for r in rows:
        if not testedf(r): continue
        wp=wpf(r); real=realf(r); bl=judf(r)=='Blunder'
        band='bal' if 25<=wp<=75 else ('win' if wp>75 else 'lose')
        k=(band,real); a=out.setdefault(k,[0,0]); a[0]+=bl; a[1]+=1
    return out
def my_wp(r): return r['win_pct_before']
ms=strat(mine, my_wp, lambda r:r['threat_was_real'], lambda r:r['judgment'], lambda r: r.get('threat_before') is not None and r['ply']>1)
def opp_wp(r):
    g=games[r['game_id']]; my_white=g['players']['white'].get('user',{}).get('id')=='abustrup'
    mover_white = not my_white
    i=r['ply']-1
    prev = START if i==0 else ev[r['game_id']][i]['score']
    return wp_mover(prev, mover_white)
os_=strat(opp, opp_wp, lambda r:r['threat_real'], lambda r:r['judgment'], lambda r: r.get('threat_real') is not None)
for k in sorted(set(ms)|set(os_)):
    print(k, 'me',ms.get(k), 'opp',os_.get(k))
print('totals me', sum(v[1] for v in ms.values()), sum(v[0] for v in ms.values()), 'opp', sum(v[1] for v in os_.values()), sum(v[0] for v in os_.values()))

# game bootstrap of differences
def per_game(rows, wpf, realf, judf, testedf, band, real):
    g={}
    for r in rows:
        if not testedf(r): continue
        wp=wpf(r); b='bal' if 25<=wp<=75 else ('win' if wp>75 else 'lose')
        if band=='any' or b==band:
            if real is None or realf(r)==real:
                a=g.setdefault(r['game_id'],[0,0]); a[0]+=judf(r)=='Blunder'; a[1]+=1
    return g
ids=sorted(games)
rng=random.Random(20261016)
def boot(spec):
    gm=per_game(mine, my_wp, lambda r:r['threat_was_real'], lambda r:r['judgment'], lambda r: r.get('threat_before') is not None and r['ply']>1, *spec)
    go=per_game(opp, opp_wp, lambda r:r['threat_real'], lambda r:r['judgment'], lambda r: r.get('threat_real') is not None, *spec)
    def rate(g, s):
        b=sum(g.get(i,[0,0])[0] for i in s); n=sum(g.get(i,[0,0])[1] for i in s)
        return 100*b/n if n else float('nan')
    diffs=[]
    for _ in range(10000):
        s=[rng.choice(ids) for _ in ids]
        d=rate(gm,s)-rate(go,s)
        if d==d: diffs.append(d)
    diffs.sort()
    pt=rate(gm,ids)-rate(go,ids)
    nz=sum(1 for i in gm if gm[i][0]>0)
    print(spec, 'point %.1f'%pt, '95%% %.1f to %.1f'%(diffs[int(.025*len(diffs))], diffs[int(.975*len(diffs))]), 'his blunders in', nz, 'games', 'max per game', max(v[0] for v in gm.values()))
boot(('bal',True)); boot(('win',False)); boot(('any',True)); boot(('any',False))
