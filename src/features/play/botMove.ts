// How the computer picks a move. Pure logic (no browser code) so we can also test it in Node.
//
//   1. Ask the engine for its few best moves, with scores.
//   2. Throw away moves the level would never play (far worse than the best one).
//   3. Pick one at random, favouring the better ones. Weaker levels spread their picks more widely.
//   4. Never allow the "silly" things the level promises to avoid (mate in one, hanging the queen).

import { Chess, type Move } from 'chess.js'
import type { SearchResult } from '../../engine/uci'
import { scoreToCp } from '../../lib/evaluation'
import type { BotLevel } from './botLevels'

export interface SearchRequest {
  fen: string
  depth?: number
  movetime?: number
  multipv?: number
}
/** Anything that can run a search, e.g. `engine.go` in the browser or `NodeEngine.go` in a script. */
export type SearchFn = (req: SearchRequest) => Promise<SearchResult>

export interface Candidate {
  uci: string
  /** Score in centipawns for the side that is moving (mates become huge numbers). */
  cp: number
}

export interface BotChoice {
  uci: string
  /** Score of the move that was played (side to move's point of view). */
  cp: number
  /** Score of the engine's favourite move. */
  bestCp: number
  /** Score of the second favourite (or null) - tells us how "obvious" the best move is. */
  secondCp: number | null
  legalMoves: number
  oversight: boolean
}

const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

export function candidatesFrom(result: SearchResult): Candidate[] {
  const out: Candidate[] = []
  for (const line of result.lines) {
    const uci = line.pv[0]
    if (uci) out.push({ uci, cp: scoreToCp(line) })
  }
  return out.sort((a, b) => b.cp - a.cp)
}

function toMove(game: Chess, uci: string): Move | null {
  try {
    return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
  } catch {
    return null
  }
}

/** True if, after playing `uci`, the opponent can checkmate straight away. */
function allowsMateInOne(fen: string, uci: string): boolean {
  const game = new Chess(fen)
  if (!toMove(game, uci)) return false
  for (const reply of game.moves({ verbose: true })) {
    game.move(reply)
    const mate = game.isCheckmate()
    game.undo()
    if (mate) return true
  }
  return false
}

/** True if, after playing `uci`, the opponent can win our queen for a cheaper piece (or for nothing). */
function hangsQueen(fen: string, uci: string): boolean {
  const game = new Chess(fen)
  const mover = game.turn()
  if (!toMove(game, uci)) return false
  for (const reply of game.moves({ verbose: true })) {
    if (!reply.captured || reply.captured !== 'q') continue
    if (PIECE_VALUE[reply.piece] < 9) return true
    // queen takes queen: only a problem if we cannot take back
    game.move(reply)
    const canRecapture = game.moves({ verbose: true }).some((m) => m.to === reply.to && m.color === mover)
    game.undo()
    if (!canRecapture) return true
  }
  return false
}

function isSilly(level: BotLevel, fen: string, uci: string): boolean {
  if (level.safety === 'none') return false
  if (allowsMateInOne(fen, uci)) return true
  return level.safety === 'mate-and-queen' && hangsQueen(fen, uci)
}

function pickWeighted<T>(items: T[], weights: number[], rng: () => number): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

/** Choose among the candidates the way the level would. `cands` must be sorted best first. */
export function sampleCandidate(
  cands: Candidate[],
  level: BotLevel,
  fen: string,
  rng: () => number = Math.random,
): { pick: Candidate; oversight: boolean } {
  const best = cands[0]
  // Moves the level never plays because they are far worse than the best move.
  const sensible = cands.filter((c, i) => i === 0 || best.cp - c.cp <= level.maxLoss)
  const oversight = cands.length > 1 && rng() < level.oversight

  // Try picks until one passes the safety rules; the best move is the last resort.
  let pool = oversight ? [...cands] : [...sensible]
  while (pool.length > 1) {
    const weights = pool.map((c) => (oversight ? 1 : Math.exp(-(best.cp - c.cp) / Math.max(1, level.temperature))))
    const pick = pickWeighted(pool, weights, rng)
    if (!isSilly(level, fen, pick.uci)) return { pick, oversight }
    pool = pool.filter((c) => c !== pick)
  }
  return { pick: pool[0] ?? best, oversight }
}

/** The whole decision: search, then sample. */
export async function chooseBotMove(
  fen: string,
  level: BotLevel,
  search: SearchFn,
  rng: () => number = Math.random,
): Promise<BotChoice | null> {
  const legalMoves = new Chess(fen).moves().length
  if (legalMoves === 0) return null
  const result = await search({
    fen,
    depth: level.search.depth,
    movetime: level.search.movetime,
    multipv: Math.min(level.search.multipv, legalMoves),
  })
  const cands = candidatesFrom(result)
  if (cands.length === 0) {
    return result.bestMove
      ? { uci: result.bestMove, cp: 0, bestCp: 0, secondCp: null, legalMoves, oversight: false }
      : null
  }
  const { pick, oversight } = sampleCandidate(cands, level, fen, rng)
  return {
    uci: pick.uci,
    cp: pick.cp,
    bestCp: cands[0].cp,
    secondCp: cands[1]?.cp ?? null,
    legalMoves,
    oversight,
  }
}

/**
 * A simple move for emergencies (the engine did not answer). Takes free material when it can,
 * avoids walking into an immediate capture, otherwise picks a random reasonable move.
 */
export function fallbackMove(fen: string, rng: () => number = Math.random): string | null {
  const game = new Chess(fen)
  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return null
  let bestScore = -Infinity
  let bestMoves: Move[] = []
  for (const m of moves) {
    let score = rng() * 0.5
    if (m.captured) score += PIECE_VALUE[m.captured]
    if (m.promotion) score += 8
    game.move(m)
    if (game.isCheckmate()) score += 100
    else {
      if (game.isCheck()) score += 0.5
      // how much can the opponent take straight back?
      let worst = 0
      for (const reply of game.moves({ verbose: true })) {
        if (reply.captured) worst = Math.max(worst, PIECE_VALUE[reply.captured])
      }
      score -= worst
    }
    game.undo()
    if (score > bestScore) {
      bestScore = score
      bestMoves = [m]
    } else if (score === bestScore) bestMoves.push(m)
  }
  const m = bestMoves[Math.floor(rng() * bestMoves.length)]
  return m.from + m.to + (m.promotion ?? '')
}
