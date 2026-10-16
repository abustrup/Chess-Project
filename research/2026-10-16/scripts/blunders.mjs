import fs from 'node:fs';
const [,, file, lo, hi] = process.argv; const LO=+lo, HI=+hi;
const games = fs.readFileSync(file,'utf8').trim().split('\n').map(JSON.parse).filter(g=>['blitz','rapid','classical'].includes(g.sp)&&g.w>=LO&&g.w<=HI&&g.b>=LO&&g.b<=HI);
const cp = e => e==null?null: e.startsWith('#') ? (e.startsWith('#-')?-1000:1000) : Math.max(-1000,Math.min(1000,Math.round(parseFloat(e)*100)));
const wp = c => 50+50*(2/(1+Math.exp(-0.00368208*c))-1); // Lichess win% formula (White perspective)
// node stats keyed by move sequence prefix (position before move i)
const reach = new Map(); const err = new Map();
for (const g of games) {
  for (let i=0;i<Math.min(16,g.mv.length);i++){ const k=g.mv.slice(0,i).join(' '); reach.set(k,(reach.get(k)||0)+1);
    if (g.ev && i>=1 && g.ev[i-1]!=null && g.ev[i]!=null) {
      const before=wp(cp(g.ev[i-1])), after=wp(cp(g.ev[i])); const mover = i%2===0?'w':'b';
      const drop = mover==='w'? before-after : after-before;
      const e = err.get(k) || {n:0, big:0, moves:{}}; e.n++; if (drop>=20){ e.big++; e.moves[g.mv[i]]=(e.moves[g.mv[i]]||0)+1;} err.set(k,e);
    }
  }
}
function report(name, rootSeq, repSide){
  const rootN = reach.get(rootSeq.join(' '));
  const rows=[];
  for (const [k,e] of err) {
    if (!(k===rootSeq.join(' ') || k.startsWith(rootSeq.join(' ')+' '))) continue;
    if (e.n<40) continue;
    const ply = k? k.split(' ').length:0; const mover = ply%2===0?'w':'b';
    const r = reach.get(k)/rootN; const rate=e.big/e.n;
    const top = Object.entries(e.moves).sort((a,b)=>b[1]-a[1])[0];
    rows.push({k, who: mover===repSide?'YOU':'OPP', reach:r, rate, n:e.n, top: top?top[0]:'-', score:r*rate});
  }
  rows.sort((a,b)=>b.score-a.score);
  for (const who of ['OPP','YOU']) {
    console.log(`\n== ${name}: positions where ${who==='OPP'?'the OPPONENT':'YOUR side'} most often throws away >=20 win-% points in one move (by reach x error rate)`);
    for (const r of rows.filter(x=>x.who===who).slice(0,6)) console.log(`  after [${r.k}] reached in ${(100*r.reach).toFixed(1)}% of these games; mover errs in ${(100*r.rate).toFixed(0)}% of ${r.n} engine-annotated games; most common error ${r.top}`);
  }
}
console.log('eval-annotated games in band:', games.filter(g=>g.ev).length, 'of', games.length);
report('London (from 1.d4)', ['d4'], 'w');
report('Caro-Kann (from 1.e4 c6)', ['e4','c6'], 'b');
report('Slav (from 1.d4 d5 2.c4 c6)', ['d4','d5','c4','c6'], 'b');
