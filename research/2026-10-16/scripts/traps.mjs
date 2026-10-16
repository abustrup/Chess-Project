import fs from 'node:fs';
const [,, file, lo, hi] = process.argv; const LO=+lo, HI=+hi;
const all = fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
const games = all.filter(g => ['blitz','rapid','classical'].includes(g.sp) && g.w>=LO&&g.w<=HI&&g.b>=LO&&g.b<=HI);
console.log('games with any [%eval] in band:', games.filter(g=>g.ev).length, 'of', games.length);
// build move-sequence trie up to ply 16
const root = { n:0, s:0, ch:{} };
for (const g of games) { const sc = g.res==='1-0'?1:g.res==='0-1'?0:0.5; let node=root; node.n++; node.s+=sc;
  for (let i=0;i<Math.min(16,g.mv.length);i++){ const m=g.mv[i]; node=node.ch[m]??={n:0,s:0,ch:{}}; node.n++; node.s+=sc; } }
function scan(name, prefix, repSide, minN=150) {
  // walk nodes under prefix; at nodes where the OPPONENT of repSide moves, find frequent moves that score badly for the mover.
  const res=[];
  const walk=(node,seq)=>{
    const ply=seq.length; const mover = ply%2===0?'w':'b';
    if (ply>=16 || node.n<minN) return;
    const tot=node.n; const avgMover = mover==='w'? node.s/tot : 1-node.s/tot;
    for (const [m,c] of Object.entries(node.ch)) {
      if (c.n>=40) {
        const sc = mover==='w'? c.s/c.n : 1-c.s/c.n;
        const freq=c.n/tot;
        if (freq>=0.05 && avgMover - sc >= 0.06) res.push({who: mover===repSide?'YOU (rep side) err':'opponent errs', seq:[...seq,m].join(' '), freq:(100*freq).toFixed(0)+'%', n:c.n, moverScore:(100*sc).toFixed(0)+'%', nodeAvg:(100*avgMover).toFixed(0)+'%', reach: c.n});
      }
      walk(c,[...seq,m]);
    }
  };
  let node=root; for (const m of prefix) node=node.ch[m]; walk(node,prefix);
  res.sort((a,b)=>b.n-a.n);
  console.log(`\n== ${name}: frequent moves (>=5% at node, >=40 games) scoring >=6 points below the node average for the side that played them`);
  for (const r of res.slice(0,12)) console.log(`${r.who}: ${r.seq} | played ${r.freq} here (n=${r.n}) | mover scores ${r.moverScore} vs ${r.nodeAvg} node avg`);
}
scan('London after 1.d4', ['d4'], 'w');
scan('Caro-Kann after 1.e4 c6', ['e4','c6'], 'b');
scan('Slav after 1.d4 d5 2.c4 c6', ['d4','d5','c4','c6'], 'b', 60);
