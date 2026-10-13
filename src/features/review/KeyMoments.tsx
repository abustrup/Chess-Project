import type { AnalysedMove, GameAnalysis, Side } from '../../types'
import { moveLabel, moverWinChances, sideOfPly, symbolFor, winLoss } from './moveFacts'

// "Key moments": the biggest swings of the game. Click one to jump to it on the board.

/** The moves that changed the game most (at least 10 percentage points of winning chances), biggest first. */
export function findKeyMoments(analysis: GameAnalysis, limit = 5): AnalysedMove[] {
  return analysis.moves
    .filter((m) => m.classification !== 'book' && winLoss(m) >= 10)
    .sort((a, b) => winLoss(b) - winLoss(a))
    .slice(0, limit)
}

export default function KeyMoments({
  analysis,
  userSide,
  ply,
  onSelect,
}: {
  analysis: GameAnalysis
  userSide: Side
  ply: number
  onSelect: (ply: number) => void
}) {
  const moments = findKeyMoments(analysis)
  if (!moments.length) {
    return <p className="muted small">No big swings in this game. Both sides played steadily.</p>
  }
  return (
    <ul className="key-moments">
      {moments.map((m) => {
        const mine = sideOfPly(m.ply) === userSide
        const w = moverWinChances(m)
        return (
          <li key={m.ply}>
            <button className={`km ${m.ply === ply ? 'active' : ''}`} onClick={() => onSelect(m.ply)}>
              <span className={`km-badge q-${m.classification}`}>{symbolFor(m.classification) || '•'}</span>
              <span className="km-text">
                <strong>{moveLabel(m.ply, m.san)}</strong>
                <span className="faint small">
                  {mine ? 'Your' : "Your opponent's"} winning chances: {Math.round(w.before)}% → {Math.round(w.after)}%
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
