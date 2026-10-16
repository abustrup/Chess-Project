import { estimateRating, movesPart, resultsPart } from '/Users/alexanderbustrup/Chess-Project/src/features/rating/estimate'
const mk = (n: number, withOpp: boolean) => Array.from({ length: n }, (_, i) => ({
  id: 'g' + i, date: new Date(2026, 0, 1 + i).toISOString(), score: withOpp ? (i % 2 ? 1 : 0) : undefined,
  oppElo: withOpp ? 1100 : undefined, oppIsBot: false,
  acpl: 65 * Math.exp(0.43 * (((i * 7) % 20) / 19 - 0.5) * 3.4), userMoves: 35 }))
for (const n of [5, 10, 20, 40]) {
  const a = estimateRating(mk(n, true) as any, 1100); const b = estimateRating(mk(n, false) as any, 1100)
  const mp = movesPart(mk(n, true) as any); const rp = resultsPart(mk(n, true) as any, 1100)
  console.log(n, 'blended se', a.se.toFixed(0), 'range +-', ((a.high - a.low) / 2).toFixed(0), '| moves-only se', b.se.toFixed(0), 'range +-', ((b.high - b.low) / 2).toFixed(0), '| moves piece se', mp?.se.toFixed(0), 'results piece se', rp?.se.toFixed(0))
}
