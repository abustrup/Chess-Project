// Reads Lichess PGN from stdin; writes one JSON line per kept game: {w,b,sp,res,mv:[first 24 SAN], ev:[evals or null]}
import readline from 'node:readline';
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let h = {}; let kept = 0, seen = 0;
const out = [];
function flush(movetext) {
  seen++;
  const ev = h.Event || '';
  let sp = null;
  if (/Rated Blitz/.test(ev)) sp = 'blitz'; else if (/Rated Rapid/.test(ev)) sp = 'rapid'; else if (/Rated Classical/.test(ev)) sp = 'classical'; else if (/Rated Bullet/.test(ev)) sp = 'bullet';
  const w = parseInt(h.WhiteElo), b = parseInt(h.BlackElo);
  if (!sp || isNaN(w) || isNaN(b)) { h = {}; return; }
  // evals: capture per-ply eval comments
  const evs = [];
  const toks = [];
  const re = /\{([^}]*)\}|(\d+\.(?:\.\.)?)|(1-0|0-1|1\/2-1\/2|\*)|([^\s{}]+)/g;
  let m;
  while ((m = re.exec(movetext)) !== null) {
    if (m[1] !== undefined) {
      const e = /\[%eval ([^\]]+)\]/.exec(m[1]);
      if (e && toks.length) evs[toks.length - 1] = e[1];
    } else if (m[4] !== undefined) {
      if (toks.length < 30) toks.push(m[4].replace(/[?!]+$/, ''));
      else if (!evs.length) { /* keep scanning only if evals matter */ }
    }
  }
  const res = h.Result;
  const o = { w, b, sp, res, mv: toks.slice(0, 30), tc: h.TimeControl };
  if (evs.length) o.ev = evs.slice(0, 30);
  out.push(JSON.stringify(o));
  kept++;
  if (out.length >= 5000) { process.stdout.write(out.join('\n') + '\n'); out.length = 0; }
  h = {};
}
rl.on('line', (line) => {
  if (line.startsWith('[')) {
    const mm = /^\[(\w+) "(.*)"\]$/.exec(line);
    if (mm) h[mm[1]] = mm[2];
  } else if (line.trim() && h.Event) {
    flush(line);
  }
});
rl.on('close', () => { if (out.length) process.stdout.write(out.join('\n') + '\n'); process.stderr.write(`seen=${seen} kept=${kept}\n`); });
