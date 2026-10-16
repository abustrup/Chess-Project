// For every downloaded game: log-likelihood of the target player's moves under Maia-3 at each Elo on a grid.
import { load, logProbs } from './maia.mjs'
import { Chess } from 'chess.js'
import fs from 'node:fs'
import readline from 'node:readline'

const GAMES = process.argv[2]
const OUT = process.argv[3]
const SHARD = Number(process.argv[4] ?? 0), NSH = Number(process.argv[5] ?? 1)
const SKIP_FILES = (process.argv[6] ?? '').split(',').filter(Boolean)
const GRID = Array.from({ length: 11 }, (_, i) => 600 + i * 200)
await load()
const done = new Set()
for (const f of [OUT, ...SKIP_FILES]) if (fs.existsSync(f)) for (const l of fs.readFileSync(f, 'utf8').split('\n')) if (l) { try { done.add(JSON.parse(l).id) } catch {} }
const out = fs.createWriteStream(OUT, { flags: 'a' })
const rl = readline.createInterface({ input: fs.createReadStream(GAMES) })
let n = 0, idx = -1
const t0 = Date.now()
for await (const line of rl) {
  if (!line) continue
  idx++
  if (idx % NSH !== SHARD) continue
  const g = JSON.parse(line)
  if (done.has(g.id)) continue
  if (g.variant !== 'standard' || g.initialFen || !g.moves) continue
  const wName = g.players.white.user?.name, bName = g.players.black.user?.name
  const side = wName?.toLowerCase() === g._target.toLowerCase() ? 'w' : bName?.toLowerCase() === g._target.toLowerCase() ? 'b' : null
  if (!side) continue
  const me = side === 'w' ? g.players.white : g.players.black
  const opp = side === 'w' ? g.players.black : g.players.white
  const board = new Chess()
  const items = []
  for (const san of g.moves.split(' ')) {
    const fen = board.fen()
    const mv = board.move(san)
    if (board.turn() !== side && fen.split(' ')[1] === side) {
      const nLegal = new Chess(fen).moves().length
      if (nLegal > 1) items.push({ fen, uci: mv.from + mv.to + (mv.promotion ?? ''), oppElo: opp.rating })
    }
  }
  if (items.length < 5) continue
  const lp = await logProbs(items, GRID)
  const sum = new Array(GRID.length).fill(0)
  let used = 0
  for (const row of lp) { if (Number.isNaN(row[0])) continue; used++; for (let k = 0; k < GRID.length; k++) sum[k] += row[k] }
  out.write(JSON.stringify({ id: g.id, target: g._target, perf: g._perf, speed: g.speed, createdAt: g.createdAt, rating: me.rating, oppRating: opp.rating, ratingDiff: me.ratingDiff, nMoves: used, grid: GRID, ll: sum,
    perMove: lp.map(r => Array.from(r).map(x => Math.round(x * 1000) / 1000)) }) + '\n')
  n++
  if (n % 20 === 0) console.log(n, 'games', ((Date.now() - t0) / 1000).toFixed(0), 's')
}
out.end()
console.log('done', n)
