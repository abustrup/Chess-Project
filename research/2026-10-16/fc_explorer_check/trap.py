import json,collections
G=[]
for l in open('../data/games.jsonl'):
    g=json.loads(l)
    if g['sp'] in ('blitz','rapid','classical') and 1000<=g['w']<=1599 and 1000<=g['b']<=1599: G.append(g)
def at(prefix): return [g for g in G if g['mv'][:len(prefix)]==prefix and len(g['mv'])>len(prefix)]
def show(prefix):
    A=at(prefix); c=collections.Counter(g['mv'][len(prefix)] for g in A); n=len(A)
    print(' '.join(prefix),'n=',n,[(m,k,round(100*k/n,1)) for m,k in c.most_common(6)])
    return A
base=['d4','e5','dxe5','Nc6','Nf3','Qe7']
show(base)
A=[g for g in at(base) if g['mv'][6]=='Bf4']
r=collections.Counter(g['res'] for g in A); print('after 4.Bf4 results (White persp):',len(A),r)
show(base+['Bf4'])
show(base+['Bf4','Qb4+'])
show(base+['Bf4','Qb4+','Bd2'])
B=show(base+['Bf4','Qb4+','Bd2','Qxb2'])
C=[g for g in B if g['mv'][10]=='Bc3']; print('6.Bc3 games',len(C),collections.Counter(g['res'] for g in C))
D=[g for g in B if g['mv'][10]=='Nc3']; print('6.Nc3 games',len(D),collections.Counter(g['res'] for g in D))
