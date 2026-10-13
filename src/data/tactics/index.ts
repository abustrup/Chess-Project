import type { TacticLesson } from '../../types'
import { forkLesson } from './fork'
import { discoveredAttackLesson } from './discovered-attack'
import { pinLesson } from './pin'
import { skewerLesson } from './skewer'
import { backRankMateLesson } from './back-rank-mate'
import { removingTheDefenderLesson } from './removing-the-defender'
import { deflectionLesson } from './deflection'
import { trappedPieceLesson } from './trapped-piece'

/** Every tactics lesson, in the order shown to the user (simple patterns first). */
export const TACTIC_LESSONS: TacticLesson[] = [
  forkLesson,
  discoveredAttackLesson,
  pinLesson,
  skewerLesson,
  backRankMateLesson,
  removingTheDefenderLesson,
  deflectionLesson,
  trappedPieceLesson,
]

export function getLesson(id: string): TacticLesson | undefined {
  return TACTIC_LESSONS.find((l) => l.id === id)
}
