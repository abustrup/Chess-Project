// How good are the moves of a player of a given rating? This file is the ONE place that answers that question.
// Change the numbers below and the whole rating estimate follows.
//
// WHERE THE NUMBERS COME FROM
// Average centipawn loss (ACPL) is how many hundredths of a pawn a player gives away per move, on average.
// Public ACPL-vs-rating numbers (Lichess forum and blog posts, Kenneth Regan's "intrinsic performance rating"
// work) agree that better players lose less, but they disagree on the exact values, because ACPL depends on how
// deep the engine looks, how mates and huge swings are capped, and on the time control. So no published table was
// copied. Instead the table was MEASURED with the same code the app uses (Stockfish 19 lite, depth 12, every move
// capped at 300 centipawns, see analyse.ts):
//   - 1,022 player-games from five finished Lichess arena tournaments (Oct 2026): 3+0, 5+0 and 10+0 games,
//     players rated about 600 to 2400, both players' Lichess ratings taken from the game itself.
//   - For each rating band the typical ACPL (robust mean, as in estimate.ts) was computed, then a smooth curve
//     ln(ACPL) = a + b * Elo was fitted through the bands.
//   Re-run it any time with  npx tsx src/features/rating/calibrate.ts  (instructions at the top of that file).
//
// HOW MUCH TO TRUST IT
//   - A single game is a very noisy sample: its ACPL typically sits +-43% around the curve, which is worth
//     several hundred Elo. Only the average of many games means something (that is why the app asks for ~20 games).
//   - The table says "the average player of this rating". An individual can differ by about 100 Elo (playing
//     style, how much they blunder under time pressure ...). The estimate adds that uncertainty on purpose.
//   - It is a Lichess-style rating scale, and the data are mostly 3+0 and 5+0 blitz. Slower games are corrected
//     with SLOW_GAME_FACTOR. Bullet is not covered at all.
//   - Below 600 and above 2400 there is very little data: the curve is simply cut off there.

/**
 * Anchor points (average centipawn loss -> Elo) for FAST games (under 8 minutes), from worst to best play.
 * For comparison: a first guess from other sources was 110, 85, 65, 48, 35 and 25 for the same six ratings.
 * That turned out too steep when measured at depth 12 with the 300 cp cap, and would have rated a 1100 player
 * at about 1500.
 */
export const ACPL_ANCHORS: ReadonlyArray<readonly [acpl: number, elo: number]> = [
  [78, 800],
  [65, 1100],
  [54, 1400],
  [45, 1700],
  [37, 2000],
  [31, 2300],
]

/** Never claim anything outside this range: the data cannot tell it apart. */
export const MIN_ELO = 500
export const MAX_ELO = 2800

/** Estimated Elo for an average centipawn loss, interpolating between the anchors (smoothly in log-ACPL). */
export function eloFromAcpl(acpl: number): number {
  const a = Math.max(1, acpl)
  const first = ACPL_ANCHORS[0]
  const last = ACPL_ANCHORS[ACPL_ANCHORS.length - 1]
  if (a >= first[0]) return first[1]
  if (a <= last[0]) return last[1]
  for (let i = 0; i < ACPL_ANCHORS.length - 1; i++) {
    const [hiAcpl, loElo] = ACPL_ANCHORS[i]
    const [loAcpl, hiElo] = ACPL_ANCHORS[i + 1]
    if (a <= hiAcpl && a >= loAcpl) {
      const t = (Math.log(hiAcpl) - Math.log(a)) / (Math.log(hiAcpl) - Math.log(loAcpl))
      return loElo + t * (hiElo - loElo)
    }
  }
  return last[1]
}

/** How many Elo points one point of ACPL is worth around this ACPL (always positive). Used for the error bars. */
export function eloPerAcpl(acpl: number): number {
  const a = Math.max(1, acpl)
  const worse = a * 1.05
  const better = a / 1.05
  return Math.max(1, (eloFromAcpl(better) - eloFromAcpl(worse)) / (worse - better))
}

/**
 * With more time to think, the same player loses fewer centipawns per move (measured: about 6% fewer in
 * 10+0 rapid games than in blitz at the same rating). An analysed rapid / classical / untimed game is multiplied
 * by this before it is looked up in the table above, so it is judged a little more strictly.
 */
export const SLOW_GAME_FACTOR = 1.06
