// Minimal Node port of the official maiachess.com Maia-3 browser pipeline
// (tokenization and output decoding follow CSSLab/maia-platform-frontend src/lib/engine/tensor.ts and maia.ts).
import ort from 'onnxruntime-node'
import { Chess } from 'chess.js'
import fs from 'node:fs'

const DL = process.argv.find(a => a.startsWith('--model-dir='))?.split('=')[1]
  ?? '/private/tmp/claude-501/-Users-alexanderbustrup/44ec3c39-6237-4512-b2cf-8e6f8a092f05/scratchpad/dl_model'
const MOVES = JSON.parse(fs.readFileSync(`${DL}/all_moves_maia3.json`, 'utf8'))

const PIECES = ['P','N','B','R','Q','K','p','n','b','r','q','k']

function mirrorSquare(sq) { return sq[0] + (9 - parseInt(sq[1])).toString() }
export function mirrorMove(m) { return mirrorSquare(m.slice(0,2)) + mirrorSquare(m.slice(2,4)) + m.slice(4) }
function swapCase(r) { let o=''; for (const c of r) o += /[A-Z]/.test(c) ? c.toLowerCase() : /[a-z]/.test(c) ? c.toUpperCase() : c; return o }
function swapCastling(c) {
  if (c === '-') return '-'
  const s = new Set(c.split('')); let o=''
  if (s.has('k')) o+='K'; if (s.has('q')) o+='Q'; if (s.has('K')) o+='k'; if (s.has('Q')) o+='q'
  return o || '-'
}
function mirrorFEN(fen) {
  const [p, a, c, e, h, f] = fen.split(' ')
  return `${p.split('/').reverse().map(swapCase).join('/')} ${a==='w'?'b':'w'} ${swapCastling(c)} ${e!=='-'?mirrorSquare(e):'-'} ${h} ${f}`
}
function tokens(fen) {
  const t = new Float32Array(64*12)
  const rows = fen.split(' ')[0].split('/')
  for (let rank=0; rank<8; rank++) {
    const row = 7-rank; let file=0
    for (const ch of rows[rank]) {
      if (isNaN(parseInt(ch))) { const i = PIECES.indexOf(ch); if (i>=0) t[(row*8+file)*12+i]=1; file++ } else file += parseInt(ch)
    }
  }
  return t
}
/** Returns {tok, legal: [{idx, uci(real orientation)}]} */
export function prep(fen) {
  const black = fen.split(' ')[1] === 'b'
  // chess.js rejects some mirrored en-passant FENs; strip ep if needed
  let mf = black ? mirrorFEN(fen) : fen
  let board
  try { board = new Chess(mf) } catch { const p = mf.split(' '); p[3]='-'; mf = p.join(' '); board = new Chess(mf) }
  const tok = tokens(board.fen())
  const legal = []
  for (const m of board.moves({ verbose: true })) {
    const u = m.from + m.to + (m.promotion ?? '')
    const idx = MOVES[u]
    if (idx !== undefined) legal.push({ idx, uci: black ? mirrorMove(u) : u })
  }
  return { tok, legal }
}

let session
export async function load() {
  session = await ort.InferenceSession.create(`${DL}/maia3_simplified.onnx`, { graphOptimizationLevel: 'basic', intraOpNumThreads: Number(process.env.ORT_THREADS ?? 8) })
  return session
}

/** For each (fen, playedUci) and each elo in grid, log-prob of played move. Returns Float64Array [n][grid] */
export async function logProbs(items, grid, eloOppoMode = 'same') {
  const B = items.length * grid.length
  const tok = new Float32Array(B*64*12), es = new Float32Array(B), eo = new Float32Array(B)
  const preps = items.map(it => prep(it.fen))
  let k = 0
  for (let i=0;i<items.length;i++) for (const e of grid) {
    tok.set(preps[i].tok, k*768); es[k]=e; eo[k]= eloOppoMode==='same' ? e : items[i].oppElo; k++
  }
  const out = await session.run({
    tokens: new ort.Tensor('float32', tok, [B,64,12]),
    elo_self: new ort.Tensor('float32', es, [B]),
    elo_oppo: new ort.Tensor('float32', eo, [B]),
  })
  const L = out.logits_move.data
  const res = []
  k = 0
  for (let i=0;i<items.length;i++) {
    const row = new Float64Array(grid.length)
    const legal = preps[i].legal
    const played = legal.find(l => l.uci === items[i].uci)
    for (let g=0; g<grid.length; g++, k++) {
      if (!played) { row[g] = NaN; continue }
      let mx = -Infinity
      for (const l of legal) mx = Math.max(mx, L[k*4352+l.idx])
      let s = 0
      for (const l of legal) s += Math.exp(L[k*4352+l.idx]-mx)
      row[g] = (L[k*4352+played.idx]-mx) - Math.log(s)
    }
    res.push(row)
  }
  return res
}
