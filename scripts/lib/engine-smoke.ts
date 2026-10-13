import { NodeEngine } from './nodeEngine'
const e = await NodeEngine.create()
const t = Date.now()
const r = await e.go({ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', depth: 14, multipv: 3 })
console.log(r.bestMove, r.depth, r.lines.map((l) => `${l.pv[0]} ${l.cp}`).join(' | '), `${Date.now() - t}ms`)
// forced mate position (back-rank mate in 1: Re8#)
const m = await e.go({ fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1', depth: 8 })
console.log(m.bestMove, m.lines[0])
e.close()
