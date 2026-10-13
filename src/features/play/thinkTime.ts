// How long the computer "thinks" before moving, so it feels like a person: quick in obvious or
// simple positions, slower when there are many choices, and always quicker when its clock is low.

export interface ThinkContext {
  legalMoves: number
  /** Gap between the best and the second-best move in centipawns (null = only one sensible move). */
  gapCp: number | null
  inBook: boolean
  /** Milliseconds left on the computer's clock (null = no clock). */
  clockMs: number | null
  incrementMs: number
}

/** Roughly bell-shaped random number around 0 (sum of three uniform numbers). */
function wobble(rng: () => number): number {
  return (rng() + rng() + rng() - 1.5) / 1.5
}

export function thinkTimeMs(ctx: ThinkContext, rng: () => number = Math.random): number {
  if (ctx.legalMoves <= 1) return 250 + rng() * 150
  if (ctx.inBook) return 450 + rng() * 650

  let ms = 450 + 260 * Math.log2(Math.max(2, ctx.legalMoves))
  if (ctx.gapCp !== null) {
    if (ctx.gapCp > 250) ms *= 0.45 // one move is clearly best, so it is quick to see
    else if (ctx.gapCp > 120) ms *= 0.7
  }
  ms *= Math.exp(wobble(rng) * 0.45)

  let cap = 3500
  if (ctx.clockMs !== null) {
    cap = Math.min(cap, ctx.clockMs / 30 + ctx.incrementMs / 2)
    if (ctx.clockMs < 15_000) cap = Math.min(cap, 500)
  }
  return Math.round(Math.max(250, Math.min(cap, ms)))
}
