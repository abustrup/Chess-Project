import sys; sys.path.insert(0,'.')
from mysim import run
import statistics as st
for gpw in (10,25,50):
    w1=[];w8=[]
    for i in range(300):
        h,T=run(20,gpw,seed=500000+i)
        w1+=[h[k+1]-h[k] for k in range(len(h)-1)]
        w8+=[h[k+8]-h[k] for k in range(len(h)-8)]
    print(gpw, 'weekly SD %.1f'%st.pstdev(w1), '8wk SD %.1f'%st.pstdev(w8), 'median|8wk| %.0f'%st.median([abs(x) for x in w8]), 'share|8wk|>=50 %.2f'%(sum(abs(x)>=50 for x in w8)/len(w8)), '>=100 %.3f'%(sum(abs(x)>=100 for x in w8)/len(w8)))
