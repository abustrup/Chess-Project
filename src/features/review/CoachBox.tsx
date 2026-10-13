import { Lightbulb, Target, X } from 'lucide-react'
import type { AnalysedMove, GameAnalysis, GameRecord } from '../../types'
import { explainMove } from './coachText'
import { findKeyMoments } from './KeyMoments'
import { isBadMove, moveLabel, sideOfPly, symbolFor } from './moveFacts'
import type { TryState } from './useTryIt'

// The coach box: explains the move you are looking at, in plain words, and offers "Try it".

export interface CoachBoxProps {
  game: GameRecord
  analysis: GameAnalysis
  ply: number
  onJump: (ply: number) => void
  tryState: TryState | null
  onStartTry: (ply: number) => void
  onHint: () => void
  onReveal: () => void
  onExitTry: () => void
}

function TryPanel({
  move,
  tryState,
  onHint,
  onReveal,
  onExitTry,
}: { move: AnalysedMove; tryState: TryState } & Pick<CoachBoxProps, 'onHint' | 'onReveal' | 'onExitTry'>) {
  const best = move.bestSan ?? 'the best move'
  const { status, lastSan } = tryState
  const done = status === 'right' || status === 'alternative' || status === 'revealed'
  return (
    <div className="try-panel" aria-live="polite">
      <div className="card-title">
        <Target size={15} /> Try it
      </div>
      {status === 'waiting' && (
        <p>
          You are back <strong>before</strong> your move {moveLabel(move.ply, move.san)}. Can you find a better move?
          Click or drag a piece.
        </p>
      )}
      {status === 'checking' && <p className="muted">Checking {lastSan}…</p>}
      {status === 'wrong' && (
        <p>
          <strong>{lastSan}</strong> is not it. Look again, or ask for a hint.
        </p>
      )}
      {status === 'right' && (
        <p className="try-good">
          <strong>Yes! {best} is the best move.</strong> Well found.
        </p>
      )}
      {status === 'alternative' && (
        <p className="try-good">
          <strong>{lastSan} works too.</strong> The computer's favourite is {best}, but your move is nearly as good.
        </p>
      )}
      {status === 'revealed' && (
        <p>
          The best move was <strong>{best}</strong>. Try to spot ideas like this in your own games.
        </p>
      )}
      <div className="row wrap">
        {!done && (
          <>
            <button className="btn small" onClick={onHint} disabled={tryState.hint}>
              <Lightbulb size={14} /> Hint
            </button>
            <button className="btn small ghost" onClick={onReveal}>
              Show the answer
            </button>
          </>
        )}
        <button className={`btn small ${done ? 'primary' : 'ghost'}`} onClick={onExitTry}>
          {done ? (
            'Continue'
          ) : (
            <>
              <X size={14} /> Stop
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/** What to say when no move is selected yet: a short summary of the whole game. */
function GameSummary({ game, analysis, onJump }: Pick<CoachBoxProps, 'game' | 'analysis' | 'onJump'>) {
  const accuracy = Math.round(analysis.accuracy[game.userSide])
  const mine = findKeyMoments(analysis, 12).find((m) => sideOfPly(m.ply) === game.userSide)
  return (
    <>
      <p>
        You played with <strong>{accuracy}% accuracy</strong>. That is how close your moves were to the computer's
        choices.
      </p>
      {mine ? (
        <p>
          Your biggest slip was <strong>{moveLabel(mine.ply, mine.san)}</strong>. Want to see it?
        </p>
      ) : (
        <p>You made no big mistakes. Nicely played!</p>
      )}
      <div className="row wrap">
        {mine && (
          <button className="btn primary small" onClick={() => onJump(mine.ply)}>
            Show my biggest mistake
          </button>
        )}
        <button className="btn small" onClick={() => onJump(1)}>
          Step through the game
        </button>
      </div>
      <p className="faint small">Tip: use the arrow keys ← → to step through the moves.</p>
    </>
  )
}

export default function CoachBox(props: CoachBoxProps) {
  const { game, analysis, ply, tryState, onStartTry } = props
  const move = ply > 0 ? analysis.moves[ply - 1] : undefined

  if (tryState && analysis.moves[tryState.ply - 1]) {
    return (
      <TryPanel
        move={analysis.moves[tryState.ply - 1]}
        tryState={tryState}
        onHint={props.onHint}
        onReveal={props.onReveal}
        onExitTry={props.onExitTry}
      />
    )
  }

  if (!move) return <GameSummary game={game} analysis={analysis} onJump={props.onJump} />

  const mine = sideOfPly(move.ply) === game.userSide
  const message = explainMove(move, analysis.moves[ply], mine ? 'you' : 'opponent')
  const bad = isBadMove(move.classification)
  const symbol = symbolFor(move.classification)

  return (
    <>
      <div className="coach-head">
        <span className={`coach-badge q-${move.classification}`} aria-hidden>
          {symbol || (move.classification === 'book' ? '☰' : '✓')}
        </span>
        <div>
          <h3 className={`q-${move.classification}`}>{message.headline}</h3>
          <div className="faint small">
            {moveLabel(move.ply, move.san)} · computer score {message.scoreLine}
          </div>
        </div>
      </div>
      <p className="coach-summary">{message.summary}</p>
      {message.why.map((line) => (
        <p key={line} className="muted">
          {line}
        </p>
      ))}
      {message.chances && <p className="muted">{message.chances}</p>}
      {bad && mine && move.bestUci && (
        <div className="row wrap">
          <button className="btn primary small" onClick={() => onStartTry(move.ply)}>
            <Target size={14} /> Try it
          </button>
          <span className="faint small">Go back and find the better move yourself.</span>
        </div>
      )}
    </>
  )
}
