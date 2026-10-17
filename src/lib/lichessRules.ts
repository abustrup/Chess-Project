import type { Side } from '../types'

// Lichess's own move rules, copied from its source (lila and scalachess, master branch, read on 2026-10-16).
// Lichess has two rules that look alike but differ on purpose; they are kept apart here by name:
//
// 1. Analysis board and "Learn from your mistakes" (lila ui/lib/src/ceval/winningChances.ts,
//    ui/analyse/src/retrospect/retroCtrl.ts, ui/analyse/src/nodeFinder.ts): centipawns clamped to +-1000, a mate in N
//    counted as (21 - min(10, N)) x 100 cp. The trainer's verdict (retroAccept) and the choice of which moves become
//    cards (isRetroCandidate) follow this one.
// 2. Game-page labels Inaccuracy / Mistake / Blunder (lila modules/tree/src/main/Advice.scala, scalachess
//    eval.scala WinPercent.winningChances): no clamp, separate rules when a forced mate appears or disappears, and no
//    label for the engine's own first choice. Review and the study's measure follow this one (serverJudgment). It
//    mirrors research/2026-10-16-diagnosis/prereg/lichess_rule.py; scripts/check-rule-parity.py shows both give the
//    same label on every test vector.
//
// The app's older classifyMove (evaluation.ts) uses 20 points for a blunder and a +-10000 clamp; it is not Lichess's.

/** An engine evaluation from White's point of view: cp, or mate (mate > 0 = White mates). Holds one of the two. */
export interface Eval {
  cp?: number
  mate?: number
  /** Only with mate 0 (checkmate on the board): who is mated. The measurement's engine pass records it. */
  mated?: Side
}

export type Judgment = 'Inaccuracy' | 'Mistake' | 'Blunder'

/** lila PR 11148: the logistic curve fitted to human games. */
const MULTIPLIER = -0.00368208

/** Winning chances -1..1 for White from centipawns, with no clamp. */
export function rawWinningChances(cp: number): number {
  return 2 / (1 + Math.exp(MULTIPLIER * cp)) - 1
}

// ---------------------------------------------------------------------------------------------------------------
// 1. Analysis board and "Learn from your mistakes"

/** Winning chances -1..1 for White, as Lichess's analysis board computes them (cp clamped to +-1000). */
export function winningChances(e: Eval): number {
  if (e.mate != null) {
    // lila multiplies by (mate > 0 ? 1 : -1), so mate 0 counts as being mated
    const cp = (21 - Math.min(10, Math.abs(e.mate))) * 100
    return rawWinningChances(cp * (e.mate > 0 ? 1 : -1))
  }
  return rawWinningChances(Math.min(Math.max(-1000, e.cp ?? 0), 1000))
}

/** Winning chances -1..1 from one side's point of view. */
export function povChances(side: Side, e: Eval): number {
  const c = winningChances(e)
  return side === 'white' ? c : -c
}

/** Half the difference in winning chances, for `side`: 0.04 = 4 points on the 0-100 scale. Positive = `a` is better. */
export function povDiff(side: Side, a: Eval, b: Eval): number {
  return (povChances(side, a) - povChances(side, b)) / 2
}

/** "Learn from your mistakes" accepts a move that loses less than this against the position before the mistake. */
export const RETRO_TOLERANCE = 0.04

/**
 * Lichess's "Learn from your mistakes" verdict (retroCtrl checkCeval): the move is right when the eval after it is
 * within 4 points of the eval before the original mistake. Lichess also always accepts the engine's own best move and
 * a checkmate, always rejects the move played in the game, and accepts masters-explorer moves in the opening; those
 * belong to the caller.
 */
export function retroAccept(side: Side, afterMove: Eval, beforeFault: Eval): boolean {
  return povDiff(side, afterMove, beforeFault) > -RETRO_TOLERANCE
}

/** Lichess judges a move with the browser engine only once it has a best move, 1,000,000 nodes, or more than 3 s. */
export function retroEvalReady(ceval: { bestmove?: string | null; nodes: number; millis?: number }): boolean {
  return Boolean(ceval.bestmove || ceval.nodes >= 1_000_000 || (ceval.millis ?? 0) > 3000)
}

/**
 * Does "Learn from your mistakes" pick this move (lila nodeFinder evalSwings)? `prev` and `cur` are the evals before
 * and after the move; `judged` is true when Lichess's analysis gives a better line for it, which happens exactly when
 * the game page labels the move. The win-chance swing is measured with the clamp, from White's side, in either
 * direction, as Lichess does. The caller keeps only the trainee's moves and skips the game's first move (Lichess never
 * offers it, because the start position has no computer line). Lichess also drops an opening move (before the
 * middlegame starts) that has more than one game in its masters explorer; that check belongs to the caller too.
 */
export function isRetroCandidate(prev: Eval, cur: Eval, judged: boolean): boolean {
  if (!judged) return false
  return Math.abs(povDiff('white', prev, cur)) > 0.1 || (!!prev.mate && !cur.mate && Math.abs(prev.mate) <= 3)
}

// ---------------------------------------------------------------------------------------------------------------
// 2. Game-page labels (the measure)

/** The position before the first move counts as +0.15 (lila evals.initial). */
export const LICHESS_START: Eval = { cp: 15 }

/** Game-page win% 0..100 for White from centipawns, with no clamp. */
export function serverWinPercent(cp: number): number {
  return 50 + 50 * rawWinningChances(cp)
}

/** Win% 0..100 for the player who just moved. A forced mate counts as 100 or 0. */
export function moverWinPercent(e: Eval, moverWhite: boolean): number {
  if (e.mate != null) {
    // mate 0: the side to move is mated, so without a record the player who just moved delivered it
    if (e.mate === 0) return e.mated ? ((e.mated === 'white') === moverWhite ? 0 : 100) : 100
    return (e.mate > 0) === moverWhite ? 100 : 0
  }
  const cp = e.cp ?? 0
  return serverWinPercent(moverWhite ? cp : -cp)
}

/** Win% points the mover gave away with the move (negative = gained). */
export function serverDrop(prev: Eval, cur: Eval, moverWhite: boolean): number {
  return moverWinPercent(prev, moverWhite) - moverWinPercent(cur, moverWhite)
}

/** Lichess's label for a win% drop between two centipawn evals: 15 points Blunder, 10 Mistake, 5 Inaccuracy. */
export function judgmentForDrop(drop: number): Judgment | null {
  if (drop >= 15) return 'Blunder'
  if (drop >= 10) return 'Mistake'
  if (drop >= 5) return 'Inaccuracy'
  return null
}

/**
 * Lichess's game-page label for one move (lila Advice). `prev` and `cur` are the evals before and after the move;
 * `playedIsBest` is true when the move is the engine's first choice (Lichess then keeps no better line and gives no
 * label). When a forced mate appears or disappears, Lichess's mate rules apply instead of the win% drop.
 */
export function serverJudgment(prev: Eval, cur: Eval, moverWhite: boolean, playedIsBest: boolean): Judgment | null {
  if (playedIsBest) return null
  if (cur.mate === 0) return null // the move gave checkmate
  const prevIsCp = prev.mate == null
  const curIsCp = cur.mate == null
  if (prevIsCp && curIsCp) return judgmentForDrop(serverDrop(prev, cur, moverWhite))
  const sgn = moverWhite ? 1 : -1
  const prevMate = prevIsCp ? null : prev.mate! * sgn
  const nextMate = curIsCp ? null : cur.mate! * sgn
  const prevCp = prevIsCp ? (prev.cp ?? 0) * sgn : 0
  const nextCp = curIsCp ? (cur.cp ?? 0) * sgn : 0
  if (prevMate === null && nextMate !== null && nextMate < 0) {
    // he now gets mated by force; milder if he was already lost
    return prevCp < -999 ? 'Inaccuracy' : prevCp < -700 ? 'Mistake' : 'Blunder'
  }
  if (prevMate !== null && prevMate > 0 && (nextMate === null || nextMate < 0)) {
    // he had a forced mate and lost it; milder if he is still clearly winning
    return nextCp > 999 ? 'Inaccuracy' : nextCp > 700 ? 'Mistake' : 'Blunder'
  }
  return null
}

/**
 * One entry of the `analysis` array in Lichess's game export (White's point of view) as an Eval. The export keeps
 * `best` only on the moves it labelled, so a missing `best` means "no label", not proof that the engine's first
 * choice was played; with evals from another engine, decide `playedIsBest` from that engine's own best move.
 */
export function lichessApiEval(a: { eval?: number; mate?: number }): Eval | null {
  if (a.mate != null) return { mate: a.mate }
  if (a.eval != null) return { cp: a.eval }
  return null
}
