import { load, prep, logProbs } from './maia.mjs'
const s = await load()
console.log('inputs', s.inputNames, 'outputs', s.outputNames)
const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// probability of e2e4, d2d4, g1f3, a2a3 at elos
const grid = [600,1100,1600,2100,2600]
for (const u of ['e2e4','d2d4','g1f3','a2a3']) {
  const r = await logProbs([{fen, uci:u}], grid)
  console.log(u, Array.from(r[0]).map(x=>Math.exp(x).toFixed(3)).join(' '))
}
// a blunder position: after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4 4.Nxe5 Qg5 -- white to move; Nxf7 (greedy) vs Bxf7+ vs ...
const fen2 = 'r1b1kbnr/pppp1ppp/8/4N1q1/2BnP3/8/PPPP1PPP/RNBQK2R w KQkq - 2 5'
for (const u of ['e5f7','c4f7','d2d4','e1g1','e5g4']) {
  const r = await logProbs([{fen:fen2, uci:u}], grid)
  console.log(u, Array.from(r[0]).map(x=>Math.exp(x).toFixed(3)).join(' '))
}
// black to move test: after 1.e4
const fen3 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
for (const u of ['c7c6','e7e5','c7c5','g8h6']) {
  const r = await logProbs([{fen:fen3, uci:u}], grid)
  console.log(u, Array.from(r[0]).map(x=>Math.exp(x).toFixed(3)).join(' '))
}
const t0 = performance.now()
const items = Array.from({length: 40}, () => ({fen: fen2, uci: 'e5f7'}))
await logProbs(items, Array.from({length:21},(_,i)=>600+i*100))
console.log('840 inferences ms', (performance.now()-t0).toFixed(0))
