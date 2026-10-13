import { Chess } from 'chess.js'
import type { Result } from '../../types'

// Turns a PGN text into a plain list of half-moves with the position before and after each one.
// Review, analysis and the importers all need exactly this, so it lives in one place.

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface ReplayedPly {
  /** 1 = White's first move */
  ply: number
  san: string
  uci: string
  fenBefore: string
  fenAfter: string
  color: 'w' | 'b'
}

export interface ReplayedGame {
  headers: Record<string, string>
  startFen: string
  plies: ReplayedPly[]
  result: Result
}

const RESULTS: Result[] = ['1-0', '0-1', '1/2-1/2', '*']

/** Replays a PGN. Throws an Error with a friendly message when the text is not a usable standard-chess game. */
export function replayPgn(pgn: string): ReplayedGame {
  const chess = new Chess()
  try {
    chess.loadPgn(pgn)
  } catch {
    throw new Error('These moves are not a valid chess game (a move is illegal or the text is not a PGN).')
  }
  const headers = chess.getHeaders()
  const variant = (headers.Variant ?? 'Standard').toLowerCase()
  if (variant !== 'standard' && variant !== 'from position') {
    throw new Error(`Only normal chess is supported, but this game is "${headers.Variant}".`)
  }

  const history = chess.history({ verbose: true })
  const plies: ReplayedPly[] = history.map((m, i) => ({
    ply: i + 1,
    san: m.san,
    uci: m.from + m.to + (m.promotion ?? ''),
    fenBefore: m.before,
    fenAfter: m.after,
    color: m.color,
  }))

  let result: Result = '*'
  const fromHeader = headers.Result as Result | undefined
  if (fromHeader && RESULTS.includes(fromHeader)) result = fromHeader
  else if (chess.isCheckmate()) result = chess.turn() === 'w' ? '0-1' : '1-0'
  else if (chess.isDraw()) result = '1/2-1/2'

  return { headers, startFen: headers.FEN || START_FEN, plies, result }
}

/** Just the SAN moves, handy for opening recognition. */
export function sansOf(game: ReplayedGame): string[] {
  return game.plies.map((p) => p.san)
}
