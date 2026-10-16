import fs from 'node:fs';
const [,, file, lo, hi, speedsArg] = process.argv;
const LO = +lo, HI = +hi, speeds = new Set(speedsArg.split(','));
const games = fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse)
  .filter(g => speeds.has(g.sp) && g.w >= LO && g.w <= HI && g.b >= LO && g.b <= HI);
console.log(`band ${LO}-${HI} speeds ${speedsArg}: ${games.length} games`);
const pct = (a, b) => (100 * a / b).toFixed(1) + '%';
function dist(prefix, n = 8) {
  const at = games.filter(g => prefix.every((m, i) => g.mv[i] === m) && g.mv.length > prefix.length);
  const c = {}; for (const g of at) c[g.mv[prefix.length]] = (c[g.mv[prefix.length]] || 0) + 1;
  const s = Object.entries(c).sort((a, b) => b[1] - a[1]);
  console.log(`after [${prefix.join(' ') || 'start'}] n=${at.length}: ` + s.slice(0, n).map(([m, k]) => `${m} ${pct(k, at.length)}`).join(', '));
  return at.length;
}
dist([]); dist(['e4']); dist(['d4']); dist(['d4','d5']); dist(['d4','d5','Bf4']); dist(['d4','Nf6','Bf4']);
dist(['e4','c6']); dist(['e4','c6','d4','d5']); dist(['e4','c6','d4','d5','e5']); dist(['d4','d5','c4']); dist(['d4','d5','c4','c6']); dist(['d4','d5','Nf3']);
// Score per White move after 1.e4 c6 (White perspective)
function score(prefix) {
  const at = games.filter(g => prefix.every((m, i) => g.mv[i] === m) && g.mv.length > prefix.length);
  const c = {}; for (const g of at) { const m = g.mv[prefix.length]; c[m] ??= { n: 0, s: 0 }; c[m].n++; c[m].s += g.res === '1-0' ? 1 : g.res === '0-1' ? 0 : 0.5; }
  console.log(`White score after [${prefix.join(' ')}]: ` + Object.entries(c).sort((a, b) => b[1].n - a[1].n).slice(0, 8).map(([m, v]) => `${m} n=${v.n} W%=${(100 * v.s / v.n).toFixed(0)}`).join(', '));
}
score(['e4','c6']); score(['d4','d5']); score(['d4','d5','Bf4']);
// Coverage trees
function tree(name, root, own, poolFilter) {
  const pool = games.filter(poolFilter);
  const base = games.filter(g => root.every((m, i) => g.mv[i] === m));
  for (const N of [20, 50, 100, 300]) {
    let ownMoves = 0, oppNodes = 0, maxPly = 0; const leaves = [];
    const rec = (prefix, p) => {
      const ply = prefix.length; const ownTurn = (ply % 2 === 0) === (own === 'w');
      if (ply >= 30) return;
      const at = games.filter(g => prefix.every((m, i) => g.mv[i] === m) && g.mv.length > ply);
      if (at.length < 30) { leaves.push(p); return; }
      if (ownTurn) {
        const pc = {}; for (const g of pool) if (g.mv.length > ply && prefix.every((m, i) => g.mv[i] === m)) pc[g.mv[ply]] = (pc[g.mv[ply]] || 0) + 1;
        const best = Object.entries(pc).sort((a, b) => b[1] - a[1])[0];
        if (!best) { leaves.push(p); return; }
        ownMoves++; maxPly = Math.max(maxPly, ply + 1); rec([...prefix, best[0]], p);
      } else {
        oppNodes++;
        const c = {}; for (const g of at) c[g.mv[ply]] = (c[g.mv[ply]] || 0) + 1;
        for (const [m, k] of Object.entries(c)) { const q = p * k / at.length; if (q >= 1 / N) rec([...prefix, m], q); }
      }
    };
    rec(root, 1);
    console.log(`${name} (n=${base.length}) cover every opponent line seen >=1 in ${N}: own moves to learn=${ownMoves}, opponent decision points=${oppNodes}, deepest own move at ply ${maxPly}`);
  }
}
const startsWith = (g, arr) => arr.every((m, i) => g.mv[i] === m);
tree('London (White, given 1.d4)', ['d4'], 'w', g => g.mv[0] === 'd4' && (g.mv[2] === 'Bf4' || g.mv[4] === 'Bf4'));
tree('Caro-Kann (Black, given 1.e4 c6)', ['e4', 'c6'], 'b', g => startsWith(g, ['e4', 'c6']));
tree('Slav-style (Black, given 1.d4 d5)', ['d4', 'd5'], 'b', g => startsWith(g, ['d4', 'd5']) && [3, 5, 7].some(i => g.mv[i] === 'c6'));
