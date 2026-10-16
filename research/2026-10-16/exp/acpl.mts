// Runs the owner's app's own analysis (Stockfish 19 lite, depth 12, 300cp cap) on the downloaded games,
// and records the target player's ACPL exactly as the app's evidenceFromGame() would.
// usage: npx tsx acpl.ts <games.ndjson> <out.ndjson> <shard> <nShards>
import { readFileSync, appendFileSync, existsSync } from 'node:fs'
const REPO = '/Users/alexanderbustrup/Chess-Project'
const { NodeEngine } = await import(`${REPO}/scripts/lib/nodeEngine.ts`)
const { analyseGame, averageCpLoss, movesOfSide } = await import(`${REPO}/src/features/review/analyse.ts`)
const { OPENING_MOVES_SKIPPED } = await import(`${REPO}/src/features/rating/estimate.ts`)

const [file, out, shardS, nS] = process.argv.slice(2)
const shard = Number(shardS), nShards = Number(nS)
const done = new Set<string>()
if (existsSync(out)) for (const l of readFileSync(out, 'utf8').split('\n')) if (l) done.add(JSON.parse(l).id)
const engine = await NodeEngine.create()
const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean)
let i = -1
const t0 = Date.now()
let n = 0
for (const line of lines) {
  i++
  if (i % nShards !== shard) continue
  const g = JSON.parse(line)
  if (done.has(g.id) || g.variant !== 'standard' || g.initialFen || !g.moves) continue
  const wName = g.players.white.user?.name, bName = g.players.black.user?.name
  const side = wName?.toLowerCase() === g._target.toLowerCase() ? 'white' : bName?.toLowerCase() === g._target.toLowerCase() ? 'black' : null
  if (!side) continue
  const sans: string[] = g.moves.split(' ')
  let body = ''
  sans.forEach((s, k) => { body += (k % 2 === 0 ? `${k / 2 + 1}. ` : '') + s + ' ' })
  const tc = g.clock ? `${g.clock.initial}+${g.clock.increment}` : '-'
  const pgn = `[Event "x"]\n[White "${wName}"]\n[Black "${bName}"]\n[TimeControl "${tc}"]\n[Result "*"]\n\n${body.trim()} *\n`
  try {
    const analysis = await analyseGame({ pgn }, { engine, depth: 12 })
    const allMine = movesOfSide(analysis.moves, side)
    const userMoves = allMine.filter((m: any) => m.classification !== 'book' && m.ply > 2 * OPENING_MOVES_SKIPPED)
    const me = g.players[side]
    appendFileSync(out, JSON.stringify({ id: g.id, target: g._target, perf: g._perf, rating: me.rating, oppRating: g.players[side === 'white' ? 'black' : 'white'].rating,
      slow: g._perf === 'rapid', userMoves: userMoves.length, gameMoves: Math.ceil(sans.length / 2), acpl: userMoves.length ? averageCpLoss(userMoves) : null,
      acplAll: averageCpLoss(allMine) }) + '\n')
    n++
    if (n % 10 === 0) console.log(shard, n, ((Date.now() - t0) / 1000).toFixed(0) + 's')
  } catch (e) { console.log('fail', g.id, String(e).slice(0, 200)) }
}
engine.close()
console.log('done shard', shard, n)
process.exit(0)
