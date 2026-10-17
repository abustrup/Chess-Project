import type { GameAnalysis, GameRecord, Side } from '../../types'
import { movesOfSide } from './analyse'
import { symbolFor } from './moveFacts'

// Two small cards: how accurately each player played, and how many bad moves they made, with a short legend
// saying where the labels come from (Lichess's rules, see labels.ts).

function SideCard({ game, analysis, side }: { game: GameRecord; analysis: GameAnalysis; side: Side }) {
  const mine = game.userSide === side
  const name = side === 'white' ? game.white : game.black
  const rating = side === 'white' ? game.whiteElo : game.blackElo
  const moves = movesOfSide(analysis.moves, side)
  const count = (c: 'blunder' | 'mistake' | 'inaccuracy') => moves.filter((m) => m.classification === c).length

  return (
    <div className={`card accuracy-card ${mine ? 'mine' : ''}`}>
      <div className="ac-head">
        <span className={`ac-dot ${side}`} aria-hidden />
        <div className="ac-who">
          <strong title={name}>{mine ? 'You' : name}</strong>
          <span className="faint small">
            {side === 'white' ? 'White' : 'Black'}
            {rating ? ` · ${rating}` : ''}
          </span>
        </div>
      </div>
      <div className="ac-main">
        <span className="big-number">{Math.round(analysis.accuracy[side])}%</span>
        <span className="faint small">accuracy</span>
      </div>
      <div
        className="small muted"
        title="Average centipawn loss: how much the evaluation dropped per move, on average. 100 centipawns = about one pawn. Lower is better."
      >
        Average loss per move: <strong>{(analysis.acpl[side] / 100).toFixed(2)}</strong> pawns
      </div>
      <ul className="ac-counts">
        {(['blunder', 'mistake', 'inaccuracy'] as const).map((c) => (
          <li key={c} className={count(c) ? `q-${c}` : 'faint'}>
            <b>{symbolFor(c)}</b> {count(c)}{' '}
            {c === 'inaccuracy' ? (count(c) === 1 ? 'inaccuracy' : 'inaccuracies') : count(c) === 1 ? c : `${c}s`}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AccuracyCards({ game, analysis }: { game: GameRecord; analysis: GameAnalysis }) {
  // your card first
  const order: Side[] = game.userSide === 'white' ? ['white', 'black'] : ['black', 'white']
  return (
    <>
      <div className="accuracy-cards">
        {order.map((s) => (
          <SideCard key={s} game={game} analysis={analysis} side={s} />
        ))}
      </div>
      <p className="faint small labels-legend">
        These labels follow Lichess's rules: a move that costs 5 or more percentage points of winning chances is an
        inaccuracy, 10 or more a mistake and 15 or more a blunder (forced mates have their own rule). The engine in
        your browser is quicker than Lichess's but looks less far ahead, so Lichess's counts for the same game can
        differ.
      </p>
    </>
  )
}
