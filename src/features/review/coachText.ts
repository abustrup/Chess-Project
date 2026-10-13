import type { AnalysedMove } from '../../types'
import { formatEval } from '../../lib/evaluation'
import {
  CLASS_LABEL,
  PIECE_NAME,
  captureFact,
  hungPiece,
  mateIn,
  moverEval,
  moverWinChances,
  winLoss,
} from './moveFacts'

// Plain-English explanations for one analysed move. We only say things we can actually see in the
// engine data ("it lets the opponent take your knight for free", "mate in 2"), never guesses about plans.

export interface CoachMessage {
  /** Short title, e.g. "Mistake" */
  headline: string
  /** "You played Bxf7. Better was Nxe5." (or the opponent's version) */
  summary: string
  /** Why it matters, in a sentence or two. */
  why: string[]
  /** "Your winning chances went from 62% to 18%." */
  chances: string | null
  /** The engine's score before and after, from White's point of view, e.g. "+0.4 -> -3.1" */
  scoreLine: string
}

function movesWord(n: number): string {
  return n === 1 ? 'one move' : `${n} moves`
}

/** Why was the better move better? Looks at the best move's concrete features. */
function whyBetter(move: AnalysedMove): string | null {
  const best = move.bestUci
  const bestSan = move.bestSan
  if (!best || !bestSan) return null
  const e = moverEval(move)
  const mate = mateIn(e.before)
  if (mate !== null && e.before > 0) {
    return mate <= 1 ? `${bestSan} is checkmate!` : `${bestSan} leads to checkmate in ${movesWord(mate)}.`
  }
  const capture = captureFact(move.fenBefore, best)
  if (capture && capture.netGain >= 2) return `${bestSan} wins a free ${PIECE_NAME[capture.piece]}.`
  if (capture && capture.netGain >= 1) return `${bestSan} wins material.`
  if (bestSan.includes('+')) return `${bestSan} gives check and keeps the pressure on.`
  if (e.before >= 150) return `${bestSan} keeps your advantage.`
  if (e.before <= -150) return `${bestSan} gives you the best chances to fight back.`
  return `${bestSan} keeps the position balanced and safe.`
}

/** What went wrong with the move that was played? */
function whatWentWrong(move: AnalysedMove, reply: AnalysedMove | undefined, pov: 'you' | 'opponent'): string | null {
  const e = moverEval(move)
  const subject = pov === 'you' ? 'your opponent' : 'you'
  const possessive = pov === 'you' ? 'your' : 'their'
  const mate = mateIn(e.after)
  if (mate !== null && e.after < 0) {
    return `This lets ${subject} checkmate ${pov === 'you' ? 'you' : 'them'} in ${movesWord(mate)}.`
  }
  const hung = hungPiece(move, reply)
  if (hung) return `After this move, ${subject} can win ${possessive} ${PIECE_NAME[hung.piece]} for free.`
  return null
}

export function explainMove(
  move: AnalysedMove,
  reply: AnalysedMove | undefined,
  pov: 'you' | 'opponent',
): CoachMessage {
  const w = moverWinChances(move)
  const cls = move.classification
  const who = pov === 'you' ? 'You' : 'Your opponent'
  const bad = cls === 'inaccuracy' || cls === 'mistake' || cls === 'blunder'

  let headline: string = CLASS_LABEL[cls]
  if (pov === 'opponent' && bad) headline = `${CLASS_LABEL[cls]} by your opponent`
  if (pov === 'you' && cls === 'best') headline = 'Best move!'

  const why: string[] = []
  let summary: string
  if (bad) {
    summary = `${who} played ${move.san}. Better was ${move.bestSan ?? 'another move'}.`
    const wrong = whatWentWrong(move, reply, pov)
    if (wrong) why.push(wrong)
    const better = whyBetter(move)
    if (better) why.push(better)
    if (pov === 'opponent' && winLoss(move) >= 10)
      why.push('Mistakes like this are your chances. Look for how to punish it!')
  } else if (cls === 'best') {
    summary = `${who} played ${move.san}, the move the computer likes most.`
  } else if (cls === 'book') {
    summary = `${who} played ${move.san}, a normal move in a well-known opening.`
    why.push('Moves like this have been played in thousands of games, so they are safe.')
  } else {
    summary = `${who} played ${move.san}. A good move.`
    if (move.bestSan && move.bestSan !== move.san)
      why.push(`The computer slightly prefers ${move.bestSan}, but this is fine too.`)
  }

  const showChances = bad && Math.abs(w.before - w.after) >= 3
  const chances = showChances
    ? pov === 'you'
      ? `Your winning chances went from ${Math.round(w.before)}% to ${Math.round(w.after)}%.`
      : `Their winning chances went from ${Math.round(w.before)}% to ${Math.round(w.after)}%.`
    : null

  return {
    headline,
    summary,
    why,
    chances,
    scoreLine: `${formatEval(move.evalBefore)} → ${formatEval(move.evalAfter)}`,
  }
}
