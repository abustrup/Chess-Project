import type { SafetyCard, SafetyFact, SafetyPiece } from '../../types'

// "What there was to see": the card builder computes every fact with Stockfish and python-chess and re-checks it
// (scripts/safety/facts.py, check_cards.py); this file only turns them into fixed sentences. No AI writes any of it.
// Wording follows the builder's notes of 2026-10-16: a threat is said as "He threatens ..." (on a few cards the piece
// could already be won before his last move, so "his move threatens" would not always be true); a quiet card says
// only "Nothing was threatened here."; a material line shows its first 3 moves; a card may have no fact at all.

export const PIECE_NAMES: Record<SafetyPiece, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

/** The first moves of a line, e.g. "Bxd1 Kxd1 Nd5 …". */
export function firstMoves(sans: readonly string[], count = 3): string {
  const shown = sans.slice(0, count).join(' ')
  return sans.length > count ? `${shown} …` : shown
}

/** One fact as a sentence; null for a fact this version cannot say truthfully. */
export function factSentence(f: SafetyFact): string | null {
  switch (f.t) {
    case 'quiet':
      return 'Nothing was threatened here.'
    case 'free':
      return `His move left his ${PIECE_NAMES[f.piece]} on ${f.square} unprotected.`
    case 'threat':
      if (f.mateIn) return `He threatens mate in ${f.mateIn}, starting with ${f.reply}.`
      if (f.wins) return `He threatens ${f.reply}, winning your ${PIECE_NAMES[f.wins.piece]} on ${f.wins.square}.`
      if (f.gain && f.lineSan.length) return `He threatens ${f.reply}, winning material (${firstMoves(f.lineSan)}).`
      return `He threatens ${f.reply}.`
    case 'allowed':
      if (f.mateIn) return `After ${f.move}, he can mate in ${f.mateIn}, starting with ${f.reply}.`
      if (f.wins) return `After ${f.move}, he can play ${f.reply} and win your ${PIECE_NAMES[f.wins.piece]} on ${f.wins.square}.`
      if (f.gain && f.lineSan.length > 1) return `After ${f.move}, he can play ${f.reply} and win material (${firstMoves(f.lineSan.slice(1))}).`
      return `After ${f.move}, he can play ${f.reply}.`
  }
}

export function factSentences(card: Pick<SafetyCard, 'facts'>): string[] {
  return card.facts.map(factSentence).filter((s): s is string => !!s)
}

/** '180+2' -> '3+2', '600+0' -> '10+0', '90+30' -> '1.5+30' */
export function tcLabel(tc: string): string {
  const m = /^(\d+)\+(\d+)$/.exec(tc)
  if (!m) return tc
  const minutes = Number(m[1]) / 60
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)}+${m[2]}`
}

/** 41000 -> '0:41', 600000 -> '10:00' */
export function clockLabel(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** "From your game on 2026-10-12 (3+2), move 21. You had 0:41 left and took 3 s for your move." */
export function contextLine(card: Pick<SafetyCard, 'context'>): string {
  const c = card.context
  const parts = [`From your game on ${c.date} (${tcLabel(c.tc)})${c.moveNumber ? `, move ${c.moveNumber}` : ''}.`]
  if (c.clockMs !== null) {
    const spent = c.spentMs !== null ? ` and took ${Math.max(0, Math.round(c.spentMs / 1000))} s for your move` : ''
    parts.push(`You had ${clockLabel(c.clockMs)} left${spent}.`)
  }
  return parts.join(' ')
}

const article = (label: string) => (label === 'Inaccuracy' ? 'an' : 'a')

/** "In the game you played b4 (Lichess called it a Blunder)." or "(a Mistake by Lichess's rule)" from our own count. */
export function gameMoveLine(card: Pick<SafetyCard, 'kind' | 'human'>): string {
  const { san, judgment, lichessJudgment } = card.human
  if (card.kind === 'own' && lichessJudgment) return `In the game you played ${san} (Lichess called it ${article(lichessJudgment)} ${lichessJudgment}).`
  if (card.kind === 'own' && judgment) return `In the game you played ${san} (${article(judgment)} ${judgment} by Lichess's rule).`
  return `In the game you played ${san}.`
}
