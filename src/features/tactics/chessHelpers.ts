import { Chess } from 'chess.js'
import type { Side } from '../../types'

// Small chess.js helpers for the tactics pages. Lesson data is written by hand, so none of these
// may throw: a typo in one move must never crash the whole page.

export interface PlayedMove {
  /** Position after the move. */
  fen: string
  san: string
  from: string
  to: string
  /** Which side made the move. */
  side: Side
}

export function sideToMove(fen: string): Side {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white'
}

export function sideName(side: Side): string {
  return side === 'white' ? 'White' : 'Black'
}

/** Plays one UCI move (like 'e2e4' or 'e7e8q'). Returns null if it is not legal in this position. */
export function playUci(fen: string, uci: string): PlayedMove | null {
  try {
    const chess = new Chess(fen)
    const side = sideToMove(fen)
    const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined })
    return { fen: chess.fen(), san: move.san, from: move.from, to: move.to, side }
  } catch {
    return null
  }
}

/** Plays a whole line of UCI moves. Stops quietly at the first move that is not legal. */
export function playLine(fen: string, ucis: string[]): PlayedMove[] {
  const played: PlayedMove[] = []
  let current = fen
  for (const uci of ucis) {
    const move = playUci(current, uci)
    if (!move) break
    played.push(move)
    current = move.fen
  }
  return played
}
