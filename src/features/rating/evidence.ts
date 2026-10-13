import type { GameRecord } from '../../types'
import { averageCpLoss, movesOfSide } from '../review/analyse'
import type { GameEvidence } from './estimate'

/**
 * Did this game have plenty of time per move? Uses the PGN's TimeControl tag ("300+0" = 5 minutes, no increment).
 * Lichess calls a game "rapid" when initial time + 40 x increment is at least 8 minutes. No clock = plenty of time.
 */
export function isSlowGame(pgn: string): boolean {
  const tag = /\[TimeControl "(\d+)(?:\+(\d+))?"\]/.exec(pgn)
  if (!tag) return true
  return Number(tag[1]) + 40 * Number(tag[2] ?? 0) >= 480
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
  const userMoves = g.analysis ? movesOfSide(g.analysis.moves, mine) : []
  return {
    id: g.id,
    date: g.date,
    score,
    oppElo: oppIsBot ? g.botElo : ratings[theirs],
    oppIsBot,
    userElo: oppIsBot ? undefined : ratings[mine],
    acpl: g.analysis ? averageCpLoss(userMoves) : undefined,
    slow: isSlowGame(g.pgn),
    userMoves: userMoves.length,
  }
}
