import fs from 'node:fs';
const [,, file, lo, hi, line] = process.argv; const LO=+lo,HI=+hi;
const games = fs.readFileSync(file,'utf8').trim().split('\n').map(JSON.parse).filter(g=>['blitz','rapid','classical'].includes(g.sp)&&g.w>=LO&&g.w<=HI&&g.b>=LO&&g.b<=HI);
const L=line.split(' ');
for (let k=0;k<=L.length;k++){ const pre=L.slice(0,k); const at=games.filter(g=>pre.every((m,i)=>g.mv[i]===m)&&g.mv.length>k);
 const c={}; for(const g of at) c[g.mv[k]]=(c[g.mv[k]]||0)+1; const s=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,4);
 const W=at.filter(g=>g.res==='1-0').length, B=at.filter(g=>g.res==='0-1').length;
 console.log(`[${pre.join(' ')}] n=${at.length} W/B wins ${W}/${B} next: ${s.map(([m,n])=>m+' '+(100*n/at.length).toFixed(0)+'%').join(', ')}`); if(at.length<5)break;}
