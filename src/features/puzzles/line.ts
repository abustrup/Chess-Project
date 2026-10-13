import { Chess, type Move } from 'chess.js'
import type { SoundName } from '../../lib/sound'
import type { PuzzleStart } from '../../lib/puzzleData'

// Small chess helpers for puzzle lines: play a move given as UCI text ('e2e4'), pick the right sound,
// and explain a move in plain words.

const PIECE_NAMES: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

function uciParts(uci: string) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined }
}

export interface PlayedMove {
  fen: string
  /** [from, to] squares, for the "last move" highlight. */
  squares: [string, string]
  san: string
}

/** Play one UCI move on a position. Throws if the move is not legal. */
export function playUci(fen: string, uci: string): PlayedMove {
  const chess = new Chess(fen)
  const move = chess.move(uciParts(uci))
  return { fen: chess.fen(), squares: [move.from, move.to], san: move.san }
}

/** The sound that fits a move written in SAN (a "+" means check, an "x" a capture ...). */
export function soundFor(san: string): SoundName {
  if (san.includes('+') || san.includes('#')) return 'check'
  if (san.startsWith('O-O')) return 'castle'
  if (san.includes('x')) return 'capture'
  return 'move'
}

/** True when every move of the solution can really be played, one after the other. Bad data is skipped, never shown. */
export function isPlayable(start: PuzzleStart): boolean {
  try {
    let fen = start.startFen
    for (const uci of start.solution) fen = playUci(fen, uci).fen
    return start.solution.length > 0
  } catch {
    return false
  }
}

/** "Queen takes the pawn on h7, giving check" — a move in everyday words. */
function plainMove(move: Move): string {
  if (move.san.startsWith('O-O-O')) return 'Castles on the queenside (the king goes to safety, the rook comes to the middle)'
  if (move.san.startsWith('O-O')) return 'Castles on the kingside (the king goes to safety, the rook comes to the middle)'
  const piece = PIECE_NAMES[move.piece]
  const enPassant = move.flags.includes('e')
  const what = enPassant
    ? `takes the pawn "en passant" and lands on ${move.to}`
    : move.captured
      ? `takes the ${PIECE_NAMES[move.captured]} on ${move.to}`
      : `goes to ${move.to}`
  const promotion = move.promotion ? ` and becomes a ${PIECE_NAMES[move.promotion]}` : ''
  const ending = move.san.endsWith('#') ? ' — checkmate!' : move.san.endsWith('+') ? ', giving check' : ''
  return `${piece[0].toUpperCase()}${piece.slice(1)} ${what}${promotion}${ending}`
}

export interface LineStep {
  /** "1." for White's move, "1..." for Black's. */
  number: string
  san: string
  plain: string
  /** True for the moves the player has to find; false for the opponent's replies. */
  yours: boolean
}

/** The solution as a list of steps, each with the move and a plain-words explanation. */
export function describeLine(start: PuzzleStart): LineStep[] {
  const chess = new Chess(start.startFen)
  const steps: LineStep[] = []
  start.solution.forEach((uci, index) => {
    const number = `${chess.moveNumber()}${chess.turn() === 'w' ? '.' : '...'}`
    const move = chess.move(uciParts(uci))
    steps.push({ number, san: move.san, plain: plainMove(move), yours: index % 2 === 0 })
  })
  return steps
}
