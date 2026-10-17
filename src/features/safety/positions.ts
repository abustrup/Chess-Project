import { Chess } from 'chess.js'

// Small chess.js helpers for the Safety check's board: play a UCI move or a short line on a position.

export interface Played {
  fen: string
  from: string
  to: string
  san: string
  uci: string
}

/** The position after one UCI move, or null when the move is not legal there. */
export function playUci(fen: string, uci: string): Played | null {
  try {
    const g = new Chess(fen)
    const m = g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    return { fen: g.fen(), from: m.from, to: m.to, san: m.san, uci }
  } catch {
    return null
  }
}

/** Plays a line move by move; stops at the first move that is not legal. */
export function playLine(fen: string, ucis: readonly string[]): Played[] {
  const out: Played[] = []
  let at = fen
  for (const uci of ucis) {
    const p = playUci(at, uci)
    if (!p) break
    out.push(p)
    at = p.fen
  }
  return out
}

/** Does this position (side to move) stand checkmated? */
export function isMate(fen: string): boolean {
  try {
    return new Chess(fen).isCheckmate()
  } catch {
    return false
  }
}
