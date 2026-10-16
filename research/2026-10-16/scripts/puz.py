import sys,csv,collections
rows=list(csv.reader(open(sys.argv[1],encoding='utf-8',errors='replace')))
hdr=rows[0]; rows=[r for r in rows[1:-1] if len(r)==len(hdr)]
n=len(rows); print('sampled puzzles',n)
I={h:i for i,h in enumerate(hdr)}
def has(r,k): return any(t.startswith(k) for t in r[I['OpeningTags']].split())
for k in ['Caro-Kann_Defense','Slav_Defense','London_System','Queens_Pawn_Game']:
    c=sum(has(r,k) for r in rows); print(k,c,f'{c/n:.2%}', '~full DB est', int(6157341*c/n))
band=[r for r in rows if 900<=int(r[I['Rating']])<=1400]
print('rating 900-1400:',len(band),f'{len(band)/n:.1%}')
th=collections.Counter(t for r in band for t in r[I['Themes']].split())
print('top themes 900-1400:',th.most_common(18))
