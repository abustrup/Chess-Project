import fs from 'node:fs';
const games = fs.readFileSync(process.argv[2],'utf8').trim().split('\n').map(JSON.parse);
const cp = e => e==null?null: e.startsWith('#') ? (e.startsWith('#-')?-1000:1000) : Math.max(-1000,Math.min(1000,Math.round(parseFloat(e)*100)));
const wp = c => 50+50*(2/(1+Math.exp(-0.00368208*c)));
const W = c => 50+50*(2/(1+Math.exp(-0.00368208*c))-1);
let errs={open:0,mid:0,late:0}, firstBlunder=[], decidedBy={16:0,20:0,30:0}, n=0, decisiveGames=0;
let lossesFromOpening=0, lossesTotal=0;
for (const g of games) {
  const e = g.ev.map(cp); if (e.length<10) continue; n++;
  let first=null;
  for (let i=0;i<e.length;i++){ const before = i===0?W(20):(e[i-1]==null?null:W(e[i-1])); if(before==null||e[i]==null) continue; const after=W(e[i]);
    const mover=i%2===0?'w':'b'; const drop = mover==='w'?before-after:after-before;
    if (drop>=20){ const ph = i<20?'open':i<60?'mid':'late'; errs[ph]++; if(first===null) first=i; } }
  if(first!==null) firstBlunder.push(first);
  for (const P of [16,20,30]) { const v=e[Math.min(P,e.length)-1]; if (v!=null && Math.abs(W(v)-50)>=30) decidedBy[P]++; }
}
firstBlunder.sort((a,b)=>a-b);
const tot=errs.open+errs.mid+errs.late;
console.log(`engine-annotated 1000-1599 blitz/rapid/classical games with >=10 plies: ${n}`);
console.log(`one-move errors losing >=20 win-% points: ${tot}; in plies 1-20 (moves 1-10): ${(100*errs.open/tot).toFixed(1)}%, plies 21-60: ${(100*errs.mid/tot).toFixed(1)}%, ply 61+: ${(100*errs.late/tot).toFixed(1)}%`);
console.log(`games with at least one such error: ${(100*firstBlunder.length/n).toFixed(1)}%; median ply of the first one: ${firstBlunder[Math.floor(firstBlunder.length/2)]} (move ${Math.ceil((firstBlunder[Math.floor(firstBlunder.length/2)]+1)/2)}); share of first errors before ply 20: ${(100*firstBlunder.filter(x=>x<20).length/firstBlunder.length).toFixed(1)}%`);
for (const P of [16,20,30]) console.log(`games where one side already has >=80% win chance (Lichess win% model) after ply ${P}: ${(100*decidedBy[P]/n).toFixed(1)}%`);
