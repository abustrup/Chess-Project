import type { MoveClass } from '../types'

// Evaluation helpers shared by Play, Review, Rating and Puzzles.
// Formulas for win chances / move accuracy are the public ones used by Lichess.

/** Cap used to turn "mate in N" into a big centipawn number. */
export const MATE_CP = 10000

/** Convert a UCI score (cp or mate) to centipawns, mates become +-(10000 - 10*N). */
export function scoreToCp(score: { cp?: number; mate?: number }): number {
  if (score.mate != null) {
    const sign = score.mate > 0 ? 1 : -1
    return sign * (MATE_CP - Math.min(Math.abs(score.mate), 100) * 10)
  }
  return score.cp ?? 0
}

/** Chance of winning in percent (0..100) for the side the cp number favours (Lichess formula). */
export function winPercent(cp: number): number {
  const clamped = Math.max(-MATE_CP, Math.min(MATE_CP, cp))
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clamped)) - 1)
}

/**
 * Accuracy (0..100) of a single move, from the mover's win-percent before and after the move
 * (Lichess formula).
 */
export function moveAccuracy(winBefore: number, winAfter: number): number {
  const diff = Math.max(0, winBefore - winAfter)
  const acc = 103.1668100711649 * Math.exp(-0.04354415386753951 * diff) - 3.166924740191411
  return Math.max(0, Math.min(100, acc + 1))
}

/** Classify a move by how much win-chance it threw away. */
export function classifyMove(winBefore: number, winAfter: number): MoveClass {
  const loss = winBefore - winAfter
  if (loss <= 1) return 'best'
  if (loss <= 5) return 'good'
  if (loss <= 10) return 'inaccuracy'
  if (loss <= 20) return 'mistake'
  return 'blunder'
}

/** Nice text for an evaluation: +0.35, -1.20, #3, #-5 */
export function formatEval(cpWhite: number): string {
  if (Math.abs(cpWhite) >= MATE_CP - 1000) {
    const n = Math.round((MATE_CP - Math.abs(cpWhite)) / 10)
    return `${cpWhite > 0 ? '' : '-'}#${n}`
  }
  const v = cpWhite / 100
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}`
}

/** Harmonic-style mean used for whole-game accuracy (Lichess blends harmonic + volatility-weighted mean; we use a simple harmonic/arithmetic average). */
export function gameAccuracy(moveAccuracies: number[]): number {
  if (!moveAccuracies.length) return 0
  const arith = moveAccuracies.reduce((a, b) => a + b, 0) / moveAccuracies.length
  const harm = moveAccuracies.length / moveAccuracies.reduce((a, b) => a + 1 / Math.max(b, 1), 0)
  return (arith + harm) / 2
}
