import type { GameRecord } from '../../types'
import { averageCpLoss, movesOfSide } from '../review/analyse'
import { OPENING_MOVES_SKIPPED, type GameEvidence } from './estimate'

/**
 * Did this game have plenty of time per move? Uses the PGN's TimeControl tag ("300+0" = 5 minutes, no increment).
 * Lichess calls a game "rapid" when initial time + 40 x increment is at least 8 minutes. No clock = plenty of time.
 */
export function isSlowGame(pgn: string): boolean {
  const tag = /\[TimeControl "(\d+)(?:\+(\d+))?"\]/.exec(pgn)
  if (!tag) return true
  return Number(tag[1]) + 40 * Number(tag[2] ?? 0) >= 480
}

/** How many moves each side made, read from the move numbers in the PGN ("23." means 23 moves). */
export function movesInPgn(pgn: string): number | undefined {
  const body = pgn.replace(/\[[^\]]*\]/g, ' ').replace(/\{[^}]*\}/g, ' ')
  let max = 0
  for (const m of body.matchAll(/(?:^|\s)(\d+)\.(?!\d)/g)) max = Math.max(max, Number(m[1]))
  return max || undefined
}

/** Boils a stored game down to what the rating maths needs, from the user's point of view. */
export function evidenceFromGame(g: GameRecord): GameEvidence {
  const mine = g.userSide
  const theirs = mine === 'white' ? 'black' : 'white'
  const ratings = { white: g.whiteElo, black: g.blackElo }

  let score: number | undefined
  if (g.result === '1/2-1/2') score = 0.5
  else if (g.result === '1-0') score = mine === 'white' ? 1 : 0
  else if (g.result === '0-1') score = mine === 'black' ? 1 : 0

  const oppIsBot = g.botElo !== undefined
  const allMine = g.analysis ? movesOfSide(g.analysis.moves, mine) : []
  // Opening moves are usually memorised, not found at the board, so they say little about strength:
  // leave out book moves and each side's first OPENING_MOVES_SKIPPED moves.
  const userMoves = allMine.filter((m) => m.classification !== 'book' && m.ply > 2 * OPENING_MOVES_SKIPPED)
  return {
    id: g.id,
    date: g.date,
    score,
    oppElo: oppIsBot ? g.botElo : ratings[theirs],
    oppIsBot,
    userElo: oppIsBot ? undefined : ratings[mine],
    acpl: g.analysis && userMoves.length ? averageCpLoss(userMoves) : undefined,
    slow: isSlowGame(g.pgn),
    userMoves: userMoves.length,
    gameMoves: g.analysis ? allMine.length : movesInPgn(g.pgn),
  }
}
