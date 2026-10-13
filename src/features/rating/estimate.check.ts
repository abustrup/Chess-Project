// Quick self-check of the rating maths:   npx tsx src/features/rating/estimate.check.ts
// It exits with an error when a property that must always hold is broken.
import { eloFromAcpl, ACPL_ANCHORS, MAX_ELO, MIN_ELO } from './calibration'
import { MIN_HALF_RANGE, estimateRating, movesPart, resultsPart, robustAcpl, shiftFromScore, type GameEvidence } from './estimate'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

/** n synthetic games with the same quality, to see how the estimate reacts to the amount of evidence */
function games(n: number, opts: { acpl?: number; score?: number; opp?: number; bot?: boolean; moves?: number } = {}): GameEvidence[] {
  const { acpl, score = 0.5, opp = 1100, bot = false, moves = 35 } = opts
  return Array.from({ length: n }, (_, i) => ({
    id: `g${i}`,
    date: new Date(2026, 0, 1 + i).toISOString(),
    // wins and losses alternate so the average score matches `score` as closely as possible
    score: (i + 0.5) / n < score ? 1 : 0,
    oppElo: opp,
    oppIsBot: bot,
    acpl: acpl === undefined ? undefined : acpl * (0.8 + 0.4 * ((i * 7) % 5) / 4),
    userMoves: moves,
  }))
}

// 1. the calibration curve: lower ACPL (better moves) never gives a lower Elo
let monotonic = true
let previous = -Infinity
for (let acpl = 200; acpl >= 5; acpl -= 1) {
  const elo = eloFromAcpl(acpl)
  if (elo < previous) monotonic = false
  previous = elo
}
check('better ACPL gives a higher (or equal) Elo along the whole curve', monotonic)
check('curve passes through every anchor', ACPL_ANCHORS.every(([a, e]) => Math.abs(eloFromAcpl(a) - e) < 1e-6))
check('curve is clamped for extreme ACPL', eloFromAcpl(1000) === ACPL_ANCHORS[0][1] && eloFromAcpl(0.1) === ACPL_ANCHORS[ACPL_ANCHORS.length - 1][1])

// 2. the whole estimate: better moves -> higher estimate
const byQuality = [120, 90, 70, 50, 35, 25].map((acpl) => estimateRating(games(20, { acpl, score: 0.5 }), 1100).elo)
check('better moves give a higher estimate', byQuality.every((v, i) => i === 0 || v >= byQuality[i - 1]), byQuality.join(' < '))

// 3. better results -> higher estimate
const byScore = [0.1, 0.3, 0.5, 0.7, 0.9].map((s) => estimateRating(games(20, { score: s }), 1100).elo)
check('better results give a higher estimate', byScore.every((v, i) => i === 0 || v >= byScore[i - 1]), byScore.join(' < '))

// 4. more games -> narrower range
const widths = [0, 3, 6, 12, 25, 50, 100].map((n) => {
  const e = estimateRating(games(n, { acpl: 60, score: 0.5 }), 1100)
  return e.high - e.low
})
check('more games give a narrower (or equal) range', widths.every((w, i) => i === 0 || w <= widths[i - 1]), widths.join(' > '))
check('the range is never narrower than +-60', widths.every((w) => w >= 2 * MIN_HALF_RANGE))

// 5. extreme results are clamped, never infinite
const allWins = estimateRating(games(10, { score: 1, opp: 1500 }), 1100)
const allLosses = estimateRating(games(10, { score: 0, opp: 1500 }), 1100)
check('100% wins stay finite and below the maximum', Number.isFinite(allWins.elo) && allWins.elo < MAX_ELO, String(allWins.elo))
check('0% wins stay finite and above the minimum', Number.isFinite(allLosses.elo) && allLosses.elo > MIN_ELO, String(allLosses.elo))
check('shift for 100% / 0% is finite', Number.isFinite(shiftFromScore(1)) && Number.isFinite(shiftFromScore(0)))
check('shift is 0 at 50%', Math.abs(shiftFromScore(0.5)) < 1e-9)

// 6. no games: it is just the user's own guess, with a wide range
const none = estimateRating([], 1100)
check('without games the estimate equals the own guess', none.elo === 1100 && none.gamesUsed === 0)
check('without games the range is wide', none.high - none.low > 250, `${none.low}-${none.high}`)

// 7. one terrible game cannot dominate
const normal = games(9, { acpl: 60 })
const withDisaster = [...normal, ...games(1, { acpl: 400 }).map((g) => ({ ...g, id: 'bad' }))]
const a = estimateRating(normal, 1100).elo
const b = estimateRating(withDisaster, 1100).elo
check('one disastrous game moves the estimate only a little', Math.abs(a - b) < 80, `${a} vs ${b}`)
check('robust ACPL ignores an outlier', robustAcpl([60, 62, 58, 61, 600]).acpl < 90, robustAcpl([60, 62, 58, 61, 600]).acpl.toFixed(1))

// 8. games vs the computer count less than games against people
const human = resultsPart(games(10, { score: 0.8, bot: false }))!
const bot = resultsPart(games(10, { score: 0.8, bot: true }))!
check('bot games give a wider error bar than human games', bot.se > human.se, `${bot.se.toFixed(0)} vs ${human.se.toFixed(0)}`)

// 9. short games are ignored for move quality
check('games with very few moves are not used for move quality', movesPart(games(5, { acpl: 40, moves: 4 })) === null)

// 10. weights are shares
const mixed = estimateRating(games(15, { acpl: 60, score: 0.6 }), 1200)
check('weights add up to 1', Math.abs(mixed.parts.reduce((s, p) => s + p.weight, 0) - 1) < 1e-9)
check('the prior counts less when there are many games', estimateRating(games(60, { acpl: 60, score: 0.6 }), 1200).parts.at(-1)!.weight < mixed.parts.at(-1)!.weight)

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
