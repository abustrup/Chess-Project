// Re-measures the "moves -> Elo" table in calibration.ts. You only need this if you want fresh numbers.
//
//   1. Download games of players with many different ratings. Every game must carry both players' ratings.
//      An easy free source is a finished Lichess arena tournament (use a normal browser User-Agent):
//        curl -H "Accept: application/x-ndjson" -H "User-Agent: Mozilla/5.0 Chrome/131" \
//          "https://lichess.org/api/tournament/<id>/games?pgnInJson=true" > arena.ndjson
//   2. Let Stockfish look at them (about 5 seconds per game):
//        npx tsx src/features/rating/calibrate.ts analyse arena.ndjson more.ndjson > rows.jsonl
//   3. Turn the rows into the numbers for calibration.ts:
//        npx tsx src/features/rating/calibrate.ts fit rows.jsonl

import { readFileSync } from 'node:fs'
import { NodeEngine } from '../../../scripts/lib/nodeEngine'
import { analyseGame, averageCpLoss, movesOfSide } from '../review/analyse'
import { isSlowGame } from './evidence'
import { robustAcpl } from './estimate'

interface Row {
  rating: number
  pace: 'fast' | 'slow'
  /** average centipawn loss of that player in that game (each move capped, as in the app) */
  acpl: number
  moves: number
}

interface LichessLine {
  variant?: string
  pgn?: string
  players: { white: { rating?: number }; black: { rating?: number } }
}

const MIN_PLIES = 24
const MIN_MOVES = 10
const BIN = 200

async function analyse(files: string[]) {
  const engine = await NodeEngine.create()
  for (const file of files) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue
      const g = JSON.parse(line) as LichessLine
      const { white, black } = g.players
      if (g.variant !== 'standard' || !g.pgn || !white.rating || !black.rating) continue
      const analysis = await analyseGame({ pgn: g.pgn }, { engine: engine as never, depth: 12 })
      if (analysis.moves.length < MIN_PLIES) continue
      for (const side of ['white', 'black'] as const) {
        const own = movesOfSide(analysis.moves, side)
        if (own.length < MIN_MOVES) continue
        const row: Row = {
          rating: g.players[side].rating!,
          pace: isSlowGame(g.pgn) ? 'slow' : 'fast',
          acpl: averageCpLoss(own),
          moves: own.length,
        }
        console.log(JSON.stringify(row))
      }
    }
  }
  engine.close()
}

/** ln(typical ACPL) = intercept + slope * Elo, fitted over rating bins (each bin counts by its number of games). */
function fitLine(rows: Row[]) {
  const bins = new Map<number, number[]>()
  for (const r of rows) {
    const key = Math.floor(r.rating / BIN) * BIN + BIN / 2
    bins.set(key, [...(bins.get(key) ?? []), r.acpl])
  }
  const points = [...bins].map(([elo, values]) => ({ elo, n: values.length, ln: Math.log(robustAcpl(values).acpl) }))
  const n = points.reduce((s, p) => s + p.n, 0)
  const meanX = points.reduce((s, p) => s + p.n * p.elo, 0) / n
  const meanY = points.reduce((s, p) => s + p.n * p.ln, 0) / n
  const slope =
    points.reduce((s, p) => s + p.n * (p.elo - meanX) * (p.ln - meanY), 0) /
    points.reduce((s, p) => s + p.n * (p.elo - meanX) ** 2, 0)
  return { slope, intercept: meanY - slope * meanX, n, points }
}

function fit(file: string) {
  const rows = readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Row)
  const fast = fitLine(rows.filter((r) => r.pace === 'fast'))
  const slow = fitLine(rows.filter((r) => r.pace === 'slow'))
  const at = (f: { slope: number; intercept: number }, elo: number) => Math.exp(f.intercept + f.slope * elo)

  console.log(`fast games: ${fast.n} player-games, slow games: ${slow.n}`)
  console.log('typical ACPL per rating bin (fast games):')
  for (const p of fast.points.sort((a, b) => a.elo - b.elo))
    console.log(`  ${p.elo}  n=${p.n}  ${Math.exp(p.ln).toFixed(1)}`)
  console.log('\nACPL_ANCHORS (paste into calibration.ts, worst play first):')
  for (const elo of [800, 1100, 1400, 1700, 2000, 2300]) console.log(`  [${Math.round(at(fast, elo))}, ${elo}],`)

  if (slow.n >= 30) {
    const ratings = [1000, 1200, 1400, 1600]
    const factor = ratings.reduce((s, r) => s + at(fast, r) / at(slow, r), 0) / ratings.length
    console.log(`\nSLOW_GAME_FACTOR = ${factor.toFixed(2)}  (fast ACPL / slow ACPL at the same rating, 1000-1600)`)
  } else {
    console.log('\nToo few slow games to measure SLOW_GAME_FACTOR.')
  }

  const spread = rows.map((r) => Math.log(r.acpl) - (fast.intercept + fast.slope * r.rating))
  const mean = spread.reduce((a, b) => a + b, 0) / spread.length
  const sd = Math.sqrt(spread.reduce((s, v) => s + (v - mean) ** 2, 0) / spread.length)
  console.log(`\nSpread of one game around the curve: ${(sd * 100).toFixed(0)}% (ACPL_SPREAD_SHARE)`)
}

const [mode, ...args] = process.argv.slice(2)
if (mode === 'analyse' && args.length) await analyse(args)
else if (mode === 'fit' && args.length === 1) fit(args[0])
else console.log('Usage:\n  calibrate.ts analyse <games.ndjson ...> > rows.jsonl\n  calibrate.ts fit <rows.jsonl>')
