import { load, logProbs } from './maia.mjs'
await load()
const fen2 = 'r1b1kbnr/pppp1ppp/8/4N1q1/2BnP3/8/PPPP1PPP/RNBQK2R w KQkq - 2 5'
const grid = [600,1100,1600,2100,2600]
for (const u of ['e5f7','c4f7','e5g4']) { const r = await logProbs([{fen:fen2, uci:u}], grid); console.log(u, Array.from(r[0]).map(x=>Math.exp(x).toFixed(3)).join(' ')) }
await logProbs([{fen:fen2, uci:'e5f7'}], grid)
const items = Array.from({length: 40}, () => ({fen: fen2, uci: 'e5f7'}))
const t0 = performance.now()
await logProbs(items, Array.from({length:21},(_,i)=>600+i*100))
console.log('840 inferences ms', (performance.now()-t0).toFixed(0))
