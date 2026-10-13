import type { GameRecord } from '../../types'
import { averageCpLoss, movesOfSide } from '../review/analyse'
import type { GameEvidence } from './estimate'

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
    userMoves: userMoves.length,
  }
}
