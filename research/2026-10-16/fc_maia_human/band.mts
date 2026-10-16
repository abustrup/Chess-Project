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
function pairedBoot(rows: Row[], B = 2000) {
  const ok = rows.filter(r => r.app !== null)
  const players = [...new Set(ok.map(r => r.player))]
  let seed = 999; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
  const d: number[] = []
  for (let b = 0; b < B; b++) {
    const pick = players.map(() => players[Math.floor(rnd() * players.length)])
    const e: number[] = []
    for (const p of pick) for (const r of ok) if (r.player === p) e.push(Math.abs(r.app as number - r.truth) - Math.abs(r.maiaPrior - r.truth))
    d.push(mean(e))
  }
  d.sort((a, b) => a - b)
  return { n: ok.length, players: players.length, appMinusMaia: Math.round(mean(ok.map(r => Math.abs(r.app as number - r.truth) - Math.abs(r.maiaPrior - r.truth)))), ci: [Math.round(d[Math.floor(0.025 * B)]), Math.round(d[Math.floor(0.975 * B)])] }
}
for (const N of [1, 5, 10]) {
  const rows = rowsFor(N)
  console.log('N', N, 'all', JSON.stringify(pairedBoot(rows)))
  for (const [lo, hi] of [[0, 1200], [800, 1400]]) console.log('N', N, `band ${lo}-${hi}`, JSON.stringify(pairedBoot(rows.filter(r => r.truth >= lo && r.truth < hi))))
}
