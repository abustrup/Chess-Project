// The friendly coach: after each of the player's moves it takes a quick look and, only for real blunders,
// says what went wrong in plain words. It never nags about small slips.

import { Chess, type Move } from 'chess.js'
import { MATE_CP, scoreToCp, winPercent } from '../../lib/evaluation'
import type { BotEngine } from './BotEngine'

export interface CoachWarning {
  /** Plain sentence(s) explaining the problem. */
  message: string
  /** The move the coach would have played instead, in normal notation (e.g. 'Nf3'). */
  betterSan?: string
}

const NAMES: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** A move counts as a blunder if it gives away about 2.5 pawns or more AND really changes who is winning. */
const BLUNDER_CP = 250
const BLUNDER_WIN_DROP = 15

function safeMove(game: Chess, uci: string): Move | null {
  try {
    return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
  } catch {
    return null
  }
}

function explain(fenAfter: string, replyUci: string | undefined, mateIn: number | null): string {
  if (mateIn !== null && mateIn <= 4) {
    return mateIn === 1
      ? 'Careful! After that move the bot can checkmate you right away.'
      : `Careful! After that move the bot has a forced checkmate in ${mateIn}.`
  }
  const game = new Chess(fenAfter)
  const reply = replyUci ? safeMove(game, replyUci) : null
  if (reply?.captured) {
    const prey = NAMES[reply.captured]
    const hunter = NAMES[reply.piece]
    const canRecapture = game.moves({ verbose: true }).some((m) => m.to === reply.to)
    if (!canRecapture) return `Careful! Nothing protects your ${prey} on ${reply.to}, so the bot can simply take it.`
    if (VALUE[reply.captured] > VALUE[reply.piece]) {
      return `Careful! The bot can take your ${prey} on ${reply.to} with a ${hunter}, and that trade costs you material.`
    }
    return `Careful! That loses material: the bot can take your ${prey} on ${reply.to}.`
  }
  if (reply) return `Careful! That gives the bot a very strong reply, ${reply.san}.`
  return 'Careful! That move gives the bot a big advantage.'
}

/**
 * Look at the move the player just made. Returns a warning for a real blunder, otherwise null
 * (also null if the engine is not available, so the coach never gets in the way).
 */
export async function reviewUserMove(
  bot: BotEngine,
  fenBefore: string,
  fenAfter: string,
): Promise<CoachWarning | null> {
  const [before, after] = await Promise.all([bot.analyse(fenBefore), bot.analyse(fenAfter)])
  const bLine = before?.lines[0]
  const aLine = after?.lines[0]
  if (!bLine || !aLine) return null

  // both scores from the player's point of view
  const cpBefore = scoreToCp(bLine)
  const cpAfter = -scoreToCp(aLine)
  const lostCp = cpBefore - cpAfter
  const winDrop = winPercent(cpBefore) - winPercent(cpAfter)
  const mateAgainst = aLine.mate !== undefined && aLine.mate > 0 ? aLine.mate : null
  const wasMateAgainst = bLine.mate !== undefined && bLine.mate < 0

  const walkedIntoMate = mateAgainst !== null && mateAgainst <= 4 && !wasMateAgainst
  const bigDrop = lostCp >= BLUNDER_CP && winDrop >= BLUNDER_WIN_DROP && cpAfter < MATE_CP
  if (!walkedIntoMate && !bigDrop) return null

  let betterSan: string | undefined
  const bestUci = bLine.pv[0]
  if (bestUci) betterSan = safeMove(new Chess(fenBefore), bestUci)?.san

  return { message: explain(fenAfter, aLine.pv[0], mateAgainst), betterSan }
}

/* ---------------------------------------------------------------- hints */

/** A short plain description of why a move is worth playing (used by the Hint button). */
export function describeMove(fen: string, uci: string): string {
  const game = new Chess(fen)
  const move = safeMove(game, uci)
  if (!move) return 'It is the strongest move the engine can find.'
  if (game.isCheckmate()) return 'It is checkmate!'
  if (move.isKingsideCastle() || move.isQueensideCastle()) return 'It tucks your king away safely and brings a rook into play.'
  if (move.promotion) return 'It turns your pawn into a new piece.'
  if (move.captured) return `It wins the ${NAMES[move.captured]} on ${move.to}.`
  if (game.isCheck()) return `It gives check with your ${NAMES[move.piece]}.`
  const homeRank = move.color === 'w' ? '1' : '8'
  if ((move.piece === 'n' || move.piece === 'b') && move.from[1] === homeRank) {
    return `It brings your ${NAMES[move.piece]} out into the game.`
  }
  if (move.piece === 'p' && ['d4', 'e4', 'd5', 'e5'].includes(move.to)) return 'It claims space in the centre.'
  return 'It is the strongest move the engine can find here.'
}
