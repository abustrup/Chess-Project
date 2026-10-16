// Head-to-head: how close does each method get to the player's real Lichess rating from N games?
// usage (from the Chess-Project dir): npx tsx analyse.mts <ll.ndjson> <acpl files...>
import { readFileSync, existsSync } from 'node:fs'
const REPO = '/Users/alexanderbustrup/Chess-Project'
const { movesPart } = await import(`${REPO}/src/features/rating/estimate.ts`)

const [llFile, ...acplFiles] = process.argv.slice(2)
const ll: any[] = []
const seen = new Set<string>()
for (const f of llFile.split(',')) if (existsSync(f)) for (const l of readFileSync(f, 'utf8').split('\n').filter(Boolean)) { try { const g = JSON.parse(l); if (!seen.has(g.id)) { seen.add(g.id); ll.push(g) } } catch {} }
const acpl = new Map<string, any>()
for (const f of acplFiles) if (existsSync(f)) for (const l of readFileSync(f, 'utf8').split('\n').filter(Boolean)) { const r = JSON.parse(l); acpl.set(r.id, r) }

const GRID: number[] = ll[0].grid
function argmaxInterp(v: number[]): number {
  let i = 0
  for (let k = 1; k < v.length; k++) if (v[k] > v[i]) i = k
  if (i === 0 || i === v.length - 1) return GRID[i]
  const [a, b, c] = [v[i - 1], v[i], v[i + 1]]
  const d = a - 2 * b + c
  const off = d < 0 ? 0.5 * (a - c) / d : 0
  return GRID[i] + off * (GRID[1] - GRID[0])
}
const PRIOR_MU = 1500, PRIOR_SD = 400
const withPrior = (v: number[]) => v.map((x, k) => x - 0.5 * ((GRID[k] - PRIOR_MU) / PRIOR_SD) ** 2)

// group by player, oldest first
const byPlayer = new Map<string, any[]>()
for (const g of ll) byPlayer.set(g.target, [...(byPlayer.get(g.target) ?? []), g])
for (const v of byPlayer.values()) v.sort((a, b) => a.createdAt - b.createdAt)

type Row = { player: string; truth: number; maia: number; maiaPrior: number; app: number | null; appSe: number | null; opp: number; n: number; se: number; perf: string }
// model-implied standard error from the curvature of the summed log-likelihood at its peak (grid step 200)
function curvSe(v: number[]): number {
  let i = 0
  for (let k = 1; k < v.length; k++) if (v[k] > v[i]) i = k
  const j = Math.min(Math.max(i, 1), v.length - 2)
  const d2 = (v[j - 1] - 2 * v[j] + v[j + 1]) / (GRID[1] - GRID[0]) ** 2
  return d2 < 0 ? Math.sqrt(-1 / d2) : 9999
}
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length
function rowsFor(N: number): Row[] {
  const rows: Row[] = []
  for (const [player, games] of byPlayer) {
    for (let s = 0; s + N <= games.length; s += N) {
      const block = games.slice(s, s + N)
      const sum = GRID.map((_, k) => block.reduce((t, g) => t + g.ll[k], 0))
      const ev = block.map(g => acpl.get(g.id)).filter(Boolean).filter((r: any) => r.acpl !== null).map((r: any) => ({
        id: r.id, date: '2026-10-01', oppIsBot: false, acpl: r.acpl, slow: r.slow, userMoves: r.userMoves, gameMoves: r.gameMoves }))
      const mp = ev.length ? movesPart(ev) : null
      rows.push({ player, truth: mean(block.map(g => g.rating)), maia: argmaxInterp(sum), maiaPrior: argmaxInterp(withPrior(sum)),
        app: mp ? mp.elo : null, appSe: mp ? mp.se : null, se: curvSe(sum), perf: block[0].perf, opp: mean(block.map(g => g.oppRating)), n: N })
    }
  }
  return rows
}
function stats(rows: Row[], key: keyof Row) {
  const r = rows.filter(x => x[key] !== null) as any[]
  const err = r.map(x => x[key] - x.truth)
  const mae = mean(err.map(Math.abs)), bias = mean(err), rmse = Math.sqrt(mean(err.map(e => e * e)))
  // Pearson r
  const mx = mean(r.map(x => x[key])), my = mean(r.map(x => x.truth))
  const cov = mean(r.map(x => (x[key] - mx) * (x.truth - my)))
  const sx = Math.sqrt(mean(r.map(x => (x[key] - mx) ** 2))), sy = Math.sqrt(mean(r.map(x => (x.truth - my) ** 2)))
  return { n: r.length, mae: Math.round(mae), rmse: Math.round(rmse), bias: Math.round(bias), r: +(cov / (sx * sy)).toFixed(2) }
}
// bootstrap over players for MAE CI
function bootMae(rows: Row[], key: keyof Row, B = 1000) {
  const players = [...new Set(rows.map(r => r.player))]
  const res: number[] = []
  let seed = 12345
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
  for (let b = 0; b < B; b++) {
    const pick = players.map(() => players[Math.floor(rnd() * players.length)])
    const errs: number[] = []
    for (const p of pick) for (const r of rows) if (r.player === p && r[key] !== null) errs.push(Math.abs((r[key] as number) - r.truth))
    res.push(mean(errs))
  }
  res.sort((a, b) => a - b)
  return [Math.round(res[Math.floor(0.025 * B)]), Math.round(res[Math.floor(0.975 * B)])]
}
console.log('games analysed:', ll.length, 'players:', byPlayer.size, 'acpl rows:', acpl.size)
console.log('mean player-moves per game used by Maia:', Math.round(mean(ll.map(g => g.nMoves))))
for (const N of [1, 5, 10, 20]) {
  const rows = rowsFor(N)
  const truthMean = mean(rows.map(r => r.truth))
  const constRows = rows.map(r => ({ ...r, c: truthMean }))
  console.log(`\nN=${N} games per estimate (${rows.length} estimates)`)
  console.log('  constant (sample mean, in-sample):', stats(constRows as any, 'c' as any))
  console.log('  Maia-3 likelihood, no prior      :', stats(rows, 'maia'), 'MAE 95% CI', bootMae(rows, 'maia', 300))
  console.log('  Maia-3 likelihood + prior        :', stats(rows, 'maiaPrior'), 'MAE 95% CI', bootMae(rows, 'maiaPrior', 300))
  console.log('  app ACPL method (moves part)     :', stats(rows, 'app'), 'MAE 95% CI', bootMae(rows, 'app', 300))
  console.log('  opponents\' average rating        :', stats(rows, 'opp'))
  const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return Math.round(b[Math.floor(b.length / 2)]) }
  console.log('  Maia model-implied SE (median):', med(rows.map(r => r.se)), '| share of truths inside Maia +-2SE:', (rows.filter(r => Math.abs(r.maia - r.truth) <= 2 * r.se).length / rows.length).toFixed(2))
  const ar = rows.filter(r => r.appSe !== null)
  console.log('  App stated SE (median):', med(ar.map(r => r.appSe as number)), '| share of truths inside app +-2SE:', (ar.filter(r => Math.abs((r.app as number) - r.truth) <= 2 * (r.appSe as number)).length / ar.length).toFixed(2))
  // leave-one-player-out linear recalibration (truth = a + b*estimate), fitted on the other players only
  for (const key of ['maia', 'app'] as const) {
    const ok = rows.filter(r => r[key] !== null)
    const cal = ok.map(r => {
      const tr = ok.filter(x => x.player !== r.player)
      const mx = mean(tr.map(x => x[key] as number)), my = mean(tr.map(x => x.truth))
      const b = tr.reduce((s, x) => s + ((x[key] as number) - mx) * (x.truth - my), 0) / tr.reduce((s, x) => s + ((x[key] as number) - mx) ** 2, 0)
      return { ...r, cal: my + b * ((r[key] as number) - mx) }
    })
    console.log(`  ${key} + held-out linear recalibration:`, stats(cal as any, 'cal' as any), 'MAE 95% CI', bootMae(cal as any, 'cal' as any, 300))
  }
  for (const pf of ['blitz', 'rapid']) { const sub = rows.filter(r => r.perf === pf); if (sub.length) console.log(`    perf ${pf} (${sub.length}): maia ${JSON.stringify(stats(sub, 'maia'))} app ${JSON.stringify(stats(sub, 'app'))}`) }
  for (const [lo, hi] of [[0, 1200], [1200, 1800], [1800, 3000]]) {
    const sub = rows.filter(r => r.truth >= lo && r.truth < hi)
    if (!sub.length) continue
    console.log(`    band ${lo}-${hi} (${sub.length}): maia ${JSON.stringify(stats(sub, 'maia'))} maia+prior ${JSON.stringify(stats(sub, 'maiaPrior'))} app ${JSON.stringify(stats(sub, 'app'))}`)
  }
}
