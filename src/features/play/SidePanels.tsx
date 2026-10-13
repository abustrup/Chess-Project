import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react'
import MoveList from '../../components/MoveList'
import { identifyOpening } from '../../lib/openingName'
import { START_FEN } from './position'
import type { GameApi } from './useGame'

/** The list of moves. Click one to look at that position; the arrow keys work too. */
export function MovesCard({ game }: { game: GameApi }) {
  const blackFirst = game.config.startFen.split(' ')[1] === 'b'
  return (
    <div className="card zen-hide">
      <div className="card-title">Moves</div>
      {game.derived.sans.length === 0 ? (
        <p className="muted small" style={{ margin: 0 }}>
          No moves yet. {game.userSide === 'white' ? 'You are White, so you go first.' : 'You are Black. The bot goes first.'}
        </p>
      ) : (
        <MoveList sans={game.derived.sans} currentPly={game.viewPly} onSelect={game.goTo} startsWithBlack={blackFirst} />
      )}
      <div className="row between pl-nav">
        <div className="row" style={{ gap: 4 }}>
          <button className="btn ghost icon small" onClick={() => game.goTo(0)} aria-label="Go to the start" disabled={game.viewPly === 0}>
            <SkipBack size={16} />
          </button>
          <button className="btn ghost icon small" onClick={() => game.step(-1)} aria-label="One move back" disabled={game.viewPly === 0}>
            <ChevronLeft size={18} />
          </button>
          <button className="btn ghost icon small" onClick={() => game.step(1)} aria-label="One move forward" disabled={game.isLive}>
            <ChevronRight size={18} />
          </button>
          <button className="btn ghost icon small" onClick={() => game.goTo(game.plyCount)} aria-label="Go to the latest move" disabled={game.isLive}>
            <SkipForward size={16} />
          </button>
        </div>
        {!game.isLive ? (
          <button className="btn primary small" onClick={() => game.goTo(game.plyCount)}>
            Back to live
          </button>
        ) : (
          <span className="faint small">Use ← → to look back</span>
        )}
      </div>
    </div>
  )
}

/** The name of the opening so far, and (when practising or facing an opening) how the lesson is going. */
export function OpeningCard({ game }: { game: GameApi }) {
  const sans = game.derived.sans.slice(0, game.viewPly)
  const found = useMemo(
    () => (game.config.startFen === START_FEN && sans.length > 0 ? identifyOpening(sans) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game.config.startFen, sans.join(' ')],
  )
  const status = game.bookStatus
  const practising = game.config.mode === 'practice'

  return (
    <div className="card zen-hide">
      <div className="card-title">Opening</div>
      <div className="pl-opening-name">
        {status?.inBook && sans.length > 0 ? (
          // still inside one of your courses: name it the way the lessons do
          <>
            {status.courseName}
            {status.chapterTitle && <div className="small muted">{status.chapterTitle}</div>}
          </>
        ) : found ? (
          <>{found.name}</>
        ) : (
          <span className="muted">
            {game.config.startFen !== START_FEN
              ? 'Custom starting position'
              : sans.length === 0
                ? 'The game has not started yet'
                : 'No named opening yet'}
          </span>
        )}
      </div>
      {status && (
        <div className="pl-lesson">
          <div className="small">
            <strong>{practising ? 'Practising' : 'Facing'}:</strong> {status.courseName}
            {status.chapterTitle ? ` – ${status.chapterTitle}` : ' – any variation'}
          </div>
          <div className={`chip ${status.inBook ? 'green' : ''}`} style={{ marginTop: 8 }}>
            {status.ended
              ? 'End of the prepared line'
              : status.inBook
                ? practising
                  ? 'Following the lesson'
                  : 'The bot is playing its opening'
                : 'Out of the lesson – normal game now'}
          </div>
          {status.leftWith && (
            <p className="small muted" style={{ margin: '8px 0 0' }}>
              {status.leftWith.byUser
                ? `You left the lesson with ${status.leftWith.played}.` +
                  (status.leftWith.lesson ? ` The lesson move was ${status.leftWith.lesson}.` : '')
                : `The bot left the lesson with ${status.leftWith.played}. From here you are on your own: use the ideas you learned.`}
            </p>
          )}
          {practising && status.inBook && !status.ended && (
            <p className="small muted" style={{ margin: '8px 0 0' }}>
              Stuck? The Hint button shows the lesson move and why it is played.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
