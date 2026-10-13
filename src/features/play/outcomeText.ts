import type { Side } from '../../types'
import type { EndReason, Outcome } from './types'

export type Verdict = 'win' | 'loss' | 'draw'

export function verdictFor(outcome: Outcome, userSide: Side): Verdict {
  if (outcome.result === '1/2-1/2') return 'draw'
  const whiteWon = outcome.result === '1-0'
  return whiteWon === (userSide === 'white') ? 'win' : 'loss'
}

const HOW_DRAW: Partial<Record<EndReason, string>> = {
  stalemate: 'Stalemate: the player to move has no legal move, but is not in check.',
  threefold: 'The same position appeared three times.',
  fifty: 'Fifty moves passed without a capture or a pawn move.',
  material: 'Neither side has enough pieces left to give checkmate.',
  agreed: 'You and the bot agreed to a draw.',
  timeout: 'Time ran out, but the other side cannot checkmate with what is left.',
}

export function describeOutcome(outcome: Outcome, userSide: Side): { headline: string; detail: string } {
  const verdict = verdictFor(outcome, userSide)
  if (verdict === 'draw') return { headline: 'Draw', detail: HOW_DRAW[outcome.reason] ?? 'The game is drawn.' }
  const win = verdict === 'win'
  switch (outcome.reason) {
    case 'checkmate':
      return {
        headline: win ? 'You won!' : 'You lost',
        detail: win ? 'Checkmate. The bot\'s king has no escape.' : 'Checkmate. Your king has no escape.',
      }
    case 'resign':
      return { headline: 'You resigned', detail: 'You gave up the game. It is still worth a look to see what happened.' }
    case 'timeout':
      return {
        headline: win ? 'You won!' : 'You lost',
        detail: win ? 'The bot ran out of time.' : 'You ran out of time.',
      }
    default:
      return { headline: win ? 'You won!' : 'You lost', detail: '' }
  }
}
