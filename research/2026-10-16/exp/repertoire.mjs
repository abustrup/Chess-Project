import { load, prep } from './maia.mjs'
import ort from 'onnxruntime-node'
import { Chess } from 'chess.js'
const s = await load()
async function dist(sans, elo) {
  const b = new Chess(); for (const m of sans) b.move(m)
  const fen = b.fen(); const p = prep(fen)
  const out = await s.run({ tokens: new ort.Tensor('float32', p.tok, [1,64,12]), elo_self: new ort.Tensor('float32', Float32Array.from([elo]), [1]), elo_oppo: new ort.Tensor('float32', Float32Array.from([elo]), [1]) })
  const L = out.logits_move.data; const mx = Math.max(...p.legal.map(l => L[l.idx])); const z = p.legal.reduce((t,l)=>t+Math.exp(L[l.idx]-mx),0)
  const arr = p.legal.map(l => { const c = new Chess(fen); const mv = c.move({from:l.uci.slice(0,2), to:l.uci.slice(2,4), promotion:l.uci[4]}); return [mv.san, Math.exp(L[l.idx]-mx)/z] }).sort((a,b)=>b[1]-a[1]).slice(0,5)
  return arr.map(([m,p]) => `${m} ${(p*100).toFixed(0)}%`).join(', ')
}
for (const [name, line] of [['London: 1.d4 d5 2.Bf4, Black to move', ['d4','d5','Bf4']], ['Caro-Kann: 1.e4 c6, White to move', ['e4','c6']], ['Caro-Kann: 1.e4 c6 2.d4 d5, White to move', ['e4','c6','d4','d5']], ['Slav: 1.d4 d5 2.c4 c6, White to move', ['d4','d5','c4','c6']]]) {
  console.log(name); for (const e of [1100, 1500, 2000]) console.log('  ', e, await dist(line, e))
}
