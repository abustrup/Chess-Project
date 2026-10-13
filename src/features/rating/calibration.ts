// How good are the moves of a player of a given rating? This file is the ONE place that answers that question.
// Change the numbers below and the whole rating estimate follows.
//
// PROVISIONAL numbers: replaced by the measured table once the calibration run has finished.

/**
 * Anchor points (average centipawn loss -> Elo), from worst play to best play.
 * Average centipawn loss (ACPL) = how many hundredths of a pawn a player gives away per move, on average.
 */
export const ACPL_ANCHORS: ReadonlyArray<readonly [acpl: number, elo: number]> = [
  [110, 800],
  [85, 1100],
  [65, 1400],
  [48, 1700],
  [35, 2000],
  [25, 2300],
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
