// Turning a list of moves into positions, and spotting the end of a game.

import { Chess, type Move } from 'chess.js'
import type { Side } from '../../types'
import type { Outcome } from './types'

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface Derived {
  /** The game after all moves. */
  chess: Chess
  moves: Move[]
  sans: string[]
  /** fens[0] is the start position, fens[n] the position after move n. */
  fens: string[]
  /** Moves that were actually legal (a damaged saved game is cut at the first bad move). */
  ucis: string[]
}

export function uciOf(m: { from: string; to: string; promotion?: string }): string {
  return m.from + m.to + (m.promotion ?? '')
}

export function derive(startFen: string, ucis: string[]): Derived {
  const chess = new Chess(startFen)
  const moves: Move[] = []
  const fens = [startFen]
  for (const u of ucis) {
    try {
      moves.push(chess.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }))
    } catch {
      break
    }
    fens.push(chess.fen())
  }
  return { chess, moves, sans: moves.map((m) => m.san), fens, ucis: moves.map(uciOf) }
}

export function sideOf(color: 'w' | 'b'): Side {
  return color === 'w' ? 'white' : 'black'
}

/** Does this side still have enough pieces to be able to give checkmate at all? */
function canMate(chess: Chess, color: 'w' | 'b'): boolean {
  let minors = 0
  for (const row of chess.board()) {
    for (const p of row) {
      if (!p || p.color !== color) continue
      if (p.type === 'p' || p.type === 'r' || p.type === 'q') return true
      if (p.type === 'n' || p.type === 'b') minors++
    }
  }
  return minors >= 2
}

/** Result if the given side runs out of time. */
export function timeoutOutcome(chess: Chess, loser: Side): Outcome {
  const winnerColor = loser === 'white' ? 'b' : 'w'
  if (!canMate(chess, winnerColor)) return { result: '1/2-1/2', reason: 'timeout' }
  return { result: loser === 'white' ? '0-1' : '1-0', reason: 'timeout' }
}

/** Has the game ended on the board? (Resignation, timeout and agreed draws are decided elsewhere.) */
export function boardOutcome(chess: Chess): Outcome | null {
  if (chess.isCheckmate()) return { result: chess.turn() === 'w' ? '0-1' : '1-0', reason: 'checkmate' }
  if (chess.isStalemate()) return { result: '1/2-1/2', reason: 'stalemate' }
  if (chess.isInsufficientMaterial()) return { result: '1/2-1/2', reason: 'material' }
  if (chess.isThreefoldRepetition()) return { result: '1/2-1/2', reason: 'threefold' }
  if (chess.isDrawByFiftyMoves()) return { result: '1/2-1/2', reason: 'fifty' }
  return null
}

/* --------------------------------------------------------------- material */

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }
const START_COUNT: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 }
export const CAPTURE_ORDER = ['q', 'r', 'b', 'n', 'p'] as const

export interface MaterialInfo {
  /** Pieces each side has taken from the other, e.g. captured.white = black pieces white has captured. */
  captured: Record<Side, string[]>
  /** Points of material white has minus what black has. */
  diff: number
  /** Only true for ordinary games (a position from a link has no meaningful capture list). */
  showCaptured: boolean
}

export function materialOf(fen: string, startFen: string): MaterialInfo {
  const chess = new Chess(fen)
  const have: Record<'w' | 'b', Record<string, number>> = { w: {}, b: {} }
  let diff = 0
  for (const row of chess.board()) {
    for (const p of row) {
      if (!p || p.type === 'k') continue
      have[p.color][p.type] = (have[p.color][p.type] ?? 0) + 1
      diff += (p.color === 'w' ? 1 : -1) * VALUE[p.type]
    }
  }
  const missing = (color: 'w' | 'b'): string[] => {
    // a pawn that became a queen (etc.) was not captured, so extra pieces cancel out missing pawns
    let promoted = 0
    for (const t of ['q', 'r', 'b', 'n']) promoted += Math.max(0, (have[color][t] ?? 0) - START_COUNT[t])
    const out: string[] = []
    for (const t of CAPTURE_ORDER) {
      let gone = START_COUNT[t] - (have[color][t] ?? 0)
      if (t === 'p') gone -= promoted
      for (let i = 0; i < gone; i++) out.push(t)
    }
    return out
  }
  return {
    captured: { white: missing('b'), black: missing('w') },
    diff,
    showCaptured: startFen === START_FEN,
  }
}
