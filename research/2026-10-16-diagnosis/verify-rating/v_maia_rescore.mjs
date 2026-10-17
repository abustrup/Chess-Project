// Re-score a sample of held-out games with Maia-3 (verify-rating pass, 2026-10-16).
// Positions come from v_games_check.py (rebuilt with python-chess from games re-downloaded from Lichess), so only the
// network call itself is shared with the investigation (its maia.mjs port of the maiachess.com pipeline).
// Prints, per game, the stored and the recomputed summed log-likelihood on the 6-point grid, and the peak on a
// finer grid (every 100 from 600 to 2600) to check the investigation's claim that the coarse grid costs little.
// Usage: ORT_THREADS=2 node v_maia_rescore.mjs <path/to/maia.mjs> <rescore_items.json> <out.json>
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
const [maiaPath, itemsPath, outPath] = process.argv.slice(2)
const { load, logProbs } = await import(pathToFileURL(maiaPath).href)
await load()
const games = JSON.parse(fs.readFileSync(itemsPath, 'utf8'))
const G6 = [600, 1000, 1400, 1800, 2200, 2600]
const FINE = []; for (let e = 600; e <= 2600; e += 100) FINE.push(e)
const out = []
for (const g of games) {
  const lp = await logProbs(g.items, FINE)
  const sum = new Array(FINE.length).fill(0); let used = 0
  for (const row of lp) { if (Number.isNaN(row[0])) continue; used++; for (let k = 0; k < FINE.length; k++) sum[k] += row[k] }
  const six = G6.map(e => sum[FINE.indexOf(e)])
  const stored = G6.map(e => g.stored_ll[g.stored_grid.indexOf(e)])
  const maxAbsDiff = Math.max(...six.map((v, i) => Math.abs(v - stored[i])))
  const peakFine = FINE[sum.indexOf(Math.max(...sum))]
  out.push({ id: g.id, moves_used: used, stored_moves: g.stored_nMoves, ll6_recomputed: six.map(v => +v.toFixed(3)), ll6_stored: stored.map(v => +v.toFixed(3)), maxAbsDiff: +maxAbsDiff.toFixed(4), fine_ll: sum.map(v => +v.toFixed(3)), peak_fine_grid: peakFine })
  console.log(g.id, 'moves', used, '/', g.stored_nMoves, 'max |diff|', maxAbsDiff.toFixed(4), 'fine peak', peakFine)
}
fs.writeFileSync(outPath, JSON.stringify(out, null, 1))
