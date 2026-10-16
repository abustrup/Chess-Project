// Compares ACPL the way calibrate.ts measured it (all own moves) with the way the app feeds it
// into the estimate (evidence.ts: no book moves, no first 8 moves per side). Read-only use of repo code.
import { readFileSync } from 'node:fs'
const R = '/Users/alexanderbustrup/Chess-Project'
const { NodeEngine } = await import(R + '/scripts/lib/nodeEngine.ts')
const { analyseGame, averageCpLoss, movesOfSide } = await import(R + '/src/features/review/analyse.ts')
const { eloFromAcpl } = await import(R + '/src/features/rating/calibration.ts')
const { OPENING_MOVES_SKIPPED, robustAcpl } = await import(R + '/src/features/rating/estimate.ts')
const { SLOW_GAME_FACTOR } = await import(R + '/src/features/rating/calibration.ts')

const file = process.argv[2]
const limit = Number(process.argv[3] ?? 20)
const engine = await NodeEngine.create()
let n = 0
const rows: { rating: number; all: number; app: number; nAll: number; nApp: number }[] = []
for (const line of readFileSync(file, 'utf8').split('\n')) {
  if (!line.trim() || n >= limit) continue
  const g = JSON.parse(line)
  const plies = (g.moves ?? '').split(' ').filter(Boolean).length
  if (g.variant !== 'standard' || !g.pgn || plies < 40) continue
  n++
  const a = await analyseGame({ pgn: g.pgn }, { engine, depth: 12 })
  for (const side of ['white', 'black'] as const) {
    const own = movesOfSide(a.moves, side)
    if (own.length < 10) continue
    const app = own.filter((m: any) => m.classification !== 'book' && m.ply > 2 * OPENING_MOVES_SKIPPED)
    if (app.length < 8) continue
    rows.push({ rating: g.players[side].rating, all: averageCpLoss(own), app: averageCpLoss(app), nAll: own.length, nApp: app.length })
  }
}
engine.close()
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }
const all = rows.map((r) => r.all), app = rows.map((r) => r.app)
console.log(`games=${n} player-games=${rows.length} meanRating=${mean(rows.map((r) => r.rating)).toFixed(0)}`)
console.log(`ACPL all moves: mean ${mean(all).toFixed(1)} median ${median(all).toFixed(1)}  -> Elo(median) ${eloFromAcpl(median(all)).toFixed(0)}`)
console.log(`ACPL app way:   mean ${mean(app).toFixed(1)} median ${median(app).toFixed(1)}  -> Elo(median) ${eloFromAcpl(median(app)).toFixed(0)}`)
console.log(`ratio app/all (mean of per-row ratios): ${mean(rows.map((r) => r.app / Math.max(1, r.all))).toFixed(3)}`)
console.log(`moves per row: all ${mean(rows.map((r) => r.nAll)).toFixed(1)}, app ${mean(rows.map((r) => r.nApp)).toFixed(1)}`)
const pooled = robustAcpl(app.map((a) => a * SLOW_GAME_FACTOR)).acpl
console.log(`pooled app-way ACPL x1.06 = ${pooled.toFixed(1)} -> Elo ${eloFromAcpl(pooled).toFixed(0)} vs mean Lichess rating ${mean(rows.map((r) => r.rating)).toFixed(0)}`)
const errs = rows.map((r) => eloFromAcpl(r.app * SLOW_GAME_FACTOR) - r.rating)
console.log(`single-game error: mean ${mean(errs).toFixed(0)}, median ${median(errs).toFixed(0)}, mean abs ${mean(errs.map(Math.abs)).toFixed(0)}`)
process.exit(0)
