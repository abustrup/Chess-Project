import { Lightbulb, MessageCircleWarning, X } from 'lucide-react'
import type { GameApi } from './useGame'

/**
 * The friendly voice next to the board: the coach's blunder warning (with Take back / Keep it),
 * hints, and short notes such as "the bot declined your draw offer". Stays visible in zen mode.
 */
export default function CoachMessages({ game }: { game: GameApi }) {
  const { coachPrompt, hint, note, engineStatus } = game
  const hintShown = hint && hint.ply === game.plyCount && game.isLive
  if (!coachPrompt && !hintShown && !note && engineStatus !== 'failed') return null

  return (
    <div className="stack pl-messages zen-keep" aria-live="polite">
      {coachPrompt && (
        <div className="callout warn pl-coach" role="alert">
          <MessageCircleWarning size={22} className="pl-callout-icon" aria-hidden />
          <div className="stack" style={{ gap: 10 }}>
            <div>
              <strong>{coachPrompt.message}</strong>
              {coachPrompt.betterSan && (
                <p className="small muted" style={{ margin: '6px 0 0' }}>
                  A stronger move was <strong>{coachPrompt.betterSan}</strong>. Want to take your move back?
                </p>
              )}
              {!coachPrompt.betterSan && <p className="small muted" style={{ margin: '6px 0 0' }}>Want to take your move back?</p>}
            </div>
            <div className="row wrap">
              <button className="btn primary small" onClick={game.takeBack}>
                Take back
              </button>
              <button className="btn small" onClick={game.keepMove}>
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}

      {hintShown && (
        <div className="callout pl-hint">
          <Lightbulb size={22} className="pl-callout-icon" aria-hidden />
          <div>
            {hint.stage === 1 ? (
              <>
                <strong>Look at your {hint.piece}.</strong>
                <p className="small muted" style={{ margin: '4px 0 0' }}>
                  It is the highlighted piece. Press Hint again to see where it should go.
                </p>
              </>
            ) : (
              <>
                <strong>
                  {hint.fromLesson ? 'Lesson move' : 'Try'} {hint.san}
                </strong>
                <p className="small muted" style={{ margin: '4px 0 0' }}>
                  {hint.why}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {note && (
        <div className="callout pl-note">
          <div className="pl-note-text">{note}</div>
          <button className="btn ghost icon small" onClick={game.dismissNote} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      {engineStatus === 'failed' && (
        <div className="callout bad">
          The chess engine could not start. The bot will play simple moves, and hints and the coach are switched off.
        </div>
      )}
    </div>
  )
}
