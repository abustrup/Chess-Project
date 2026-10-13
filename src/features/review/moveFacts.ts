import { Chess } from 'chess.js'
import type { AnalysedMove, MoveClass, Side } from '../../types'
import { MATE_CP, winPercent } from '../../lib/evaluation'

// Small facts about analysed moves that both the Review page (to explain a move) and the Rating page
// (to find habits like "hangs pieces") need. Everything here is a simple, explainable rule.

export const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
export const PIECE_NAME: Record<string, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

export function sideOfPly(ply: number): Side {
  return ply % 2 === 1 ? 'white' : 'black'
}

/** +1 when White made the move, -1 for Black: multiplies a White's-view score into the mover's view. */
function signOf(m: AnalysedMove): 1 | -1 {
  return m.ply % 2 === 1 ? 1 : -1
}

/** Evaluation in centipawns from the mover's point of view, before and after the move. */
export function moverEval(m: AnalysedMove): { before: number; after: number } {
  const s = signOf(m)
  return { before: s * m.evalBefore, after: s * m.evalAfter }
}

/** The mover's chance of winning, in percent (0..100), before and after the move. */
export function moverWinChances(m: AnalysedMove): { before: number; after: number } {
  const e = moverEval(m)
  return { before: winPercent(e.before), after: winPercent(e.after) }
}

/** How many percentage points of winning chances the move threw away (0 when it did not). */
export function winLoss(m: AnalysedMove): number {
  const w = moverWinChances(m)
  return Math.max(0, w.before - w.after)
}

/** Marks added to the SAN in the move list. Good moves stay clean so the list is easy to scan. */
export function symbolFor(c: MoveClass): string {
  switch (c) {
    case 'blunder':
      return '??'
    case 'mistake':
      return '?'
    case 'inaccuracy':
      return '?!'
    default:
      return ''
  }
}

export const CLASS_LABEL: Record<MoveClass, string> = {
  best: 'Best move',
  good: 'Good move',
  book: 'Opening move',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
}

/** Is this one of the three "bad move" classes? */
export function isBadMove(c: MoveClass): boolean {
  return c === 'inaccuracy' || c === 'mistake' || c === 'blunder'
}

/** "mate in N" encoded in a +-10000 style score, or null when the score is no mate. */
export function mateIn(cp: number): number | null {
  if (Math.abs(cp) < MATE_CP - 1000) return null
  return Math.max(0, Math.round((MATE_CP - Math.abs(cp)) / 10))
}

/* ------------------------------------------------------------------------------------------ */
/* captures                                                                                    */
/* ------------------------------------------------------------------------------------------ */

export interface CaptureFact {
  piece: string // 'n' of the captured piece
  square: string
  /** The piece that captures, and whether the other side can capture it back right away. */
  attacker: string
  recapturable: boolean
  /** Material the capturer wins in points: the captured piece, minus the capturing piece when it can be recaptured. */
  netGain: number
}

/** If `uci` is a capture in `fen`, says what it wins (counting a possible recapture). */
export function captureFact(fen: string, uci: string): CaptureFact | null {
  const game = new Chess(fen)
  let move
  try {
    move = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
  } catch {
    return null
  }
  if (!move.captured) return null
  const recapturable = game.moves({ verbose: true }).some((m) => m.to === move.to)
  const victim = PIECE_VALUE[move.captured] ?? 0
  const attacker = PIECE_VALUE[move.piece] ?? 0
  return { piece: move.captured, square: move.to, attacker: move.piece, recapturable, netGain: victim - (recapturable ? attacker : 0) }
}

/** Points of material the mover took with this very move (0 for a quiet move). */
function materialTaken(move: AnalysedMove): number {
  try {
    const taken = new Chess(move.fenBefore).move({ from: move.uci.slice(0, 2), to: move.uci.slice(2, 4), promotion: move.uci[4] }).captured
    return taken ? (PIECE_VALUE[taken] ?? 0) : 0
  } catch {
    return 0
  }
}

/**
 * Did this move leave a piece to be taken for nothing? We look at what the opponent's best reply would be
 * (it is stored on the NEXT analysed move) and check that, after counting what the move itself took and any
 * recapture, it wins at least two points of material, and that the engine agrees the move was really costly.
 */
export function hungPiece(move: AnalysedMove, reply: AnalysedMove | undefined): CaptureFact | null {
  if (!reply?.bestUci || move.cpLoss < 100) return null
  const fact = captureFact(move.fenAfter, reply.bestUci)
  if (!fact) return null
  // a pawn that has just promoted is worth a pawn to its owner, not a queen
  const promoted = move.uci.length === 5 && fact.square === move.uci.slice(2, 4)
  const victim = promoted ? PIECE_VALUE.p : (PIECE_VALUE[fact.piece] ?? 0)
  const net = victim - materialTaken(move) - (fact.recapturable ? (PIECE_VALUE[fact.attacker] ?? 0) : 0)
  return net >= 2 ? { ...fact, netGain: net } : null
}

/**
 * A "missed chance": a clearly better move existed (the position was worth at least +1.5 pawns with best play),
 * the player gave away at least 1.5 pawns of that with their move, and it was not simply a hung piece.
 */
export function isMissedChance(move: AnalysedMove, reply: AnalysedMove | undefined): boolean {
  if (move.classification !== 'mistake' && move.classification !== 'blunder') return false
  if (move.cpLoss < 150 || moverEval(move).before < 150) return false
  return hungPiece(move, reply) === null
}

/** Value (in points) of all pieces except pawns and kings on a board, for both sides together. */
export function pieceMaterial(fen: string): number {
  let total = 0
  for (const ch of fen.split(' ')[0]) {
    const v = PIECE_VALUE[ch.toLowerCase()]
    if (v && ch.toLowerCase() !== 'p') total += v
  }
  return total
}

/** "14. Bxf7" for White's move, "14... Bxf7" for Black's. */
export function moveLabel(ply: number, san: string): string {
  return `${Math.ceil(ply / 2)}${ply % 2 === 1 ? '.' : '...'} ${san}`
}
