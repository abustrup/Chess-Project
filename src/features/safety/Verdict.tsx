import { useEffect, useRef } from 'react'
import { ArrowRight, CircleCheck, CircleX, Eye, RotateCcw } from 'lucide-react'
import type { SafetyAttempt, SafetyCard, StoredSafetyCard } from '../../types'
import type { Verdict as VerdictData } from './accept'
import { contextLine, factSentences, gameMoveLine } from './facts'
import { playUci } from './positions'
import { localDay } from './queue'
import type { SafetyRun } from './useSafetyRun'

export type BoardMode = 'mine' | 'reply' | 'best'

interface Props {
  card: SafetyCard
  run: SafetyRun
  /** The line he wrote the previous time he answered this position. */
  lastLine: SafetyAttempt | null
  /** The schedule after this answer (first answer of the day only). */
  scheduled: StoredSafetyCard | null
  /** A repeat at the end of the session after a miss earlier today. */
  repeat: boolean
  mode: BoardMode
  onMode: (mode: BoardMode) => void
  onTryAgain: () => void
  onNext: () => void
  hasNext: boolean
}

/** How long after the verdict appears a key press on "Next position" is still taken as part of the confirming Enter. */
const NEXT_KEY_PAUSE_MS = 700

/** A wrong move loses 4 points or more; one decimal below 10, so a loss of 4.4 never reads as "4" next to the limit. */
const points = (loss: number) => `${loss < 10 ? loss.toFixed(1) : Math.round(loss)} points`

/** What the move did, in one or two plain sentences. */
function explain(card: SafetyCard, v: VerdictData, move: { san: string; uci: string; fen?: string }): string {
  const best = card.top[0]
  const san = move.san
  const engine = v.by === 'engine' ? ' (checked by the engine in your browser)' : ''
  if (v.ok) {
    if (best.uci === move.uci) return `${san} is the engine's first choice.`
    // held and quiet cards: a safe move is right even when the engine prefers another by more than 4 points
    if (v.safeOnly) return `${san} is safe: after it he cannot win material or mate. The engine's first choice was ${best.san}.`
    return `${san} keeps your winning chances within 4 points of the best move, ${best.san}${engine}.`
  }
  if (v.why === 'mate') return `After ${san} he can force mate. Any safe move would have done, such as ${best.san}.`
  if (v.why === 'material') {
    const reply = move.fen && v.line && v.line.length > 1 ? playUci(move.fen, v.line[1])?.san : undefined
    return `After ${san} he can win material${reply ? `, starting with ${reply}` : ''}. Any move that leaves him nothing to win would have done, such as ${best.san}.`
  }
  if (v.why === 'loss' && v.loss !== null) {
    return `${san} costs about ${points(v.loss)} of winning chances against the best move, ${best.san}: as much as a blunder on Lichess (15 points or more).`
  }
  if (v.loss === null) {
    // the card stores up to 5 moves; say how many, so the sentence stays true for a shorter list
    const n = card.top.length
    const nth = ['', 'first', '2nd', '3rd', '4th', '5th'][n] ?? `${n}th`
    return `${san} is not among the engine's ${n} best moves here, and even the ${nth} costs more than 4 points. The best move is ${best.san}.`
  }
  return `${san} costs about ${points(v.loss)} of winning chances against the best move, ${best.san}${engine}. A safe move loses less than 4 points.`
}

function title(card: SafetyCard, v: VerdictData): string {
  if (v.ok) return 'Safe'
  if (v.gameMove && card.kind === 'own') return 'That was the game move'
  return 'Not good enough'
}

function comesBack(s: StoredSafetyCard | null, repeat: boolean, missed: boolean): string | null {
  if (repeat) return 'This second look does not change when the position comes back.'
  if (!s) return null
  if (s.retired) return 'You got it right after two weeks or more, so this position leaves your queue for good.'
  const day = localDay(new Date(s.due))
  return `${missed ? 'You will see it once more at the end of this session, and it' : 'It'} comes back on ${day}.`
}

/** The verdict card: shown only after a move and a written line were confirmed (or after "Show answer"). */
export default function Verdict({ card, run, lastLine, scheduled, repeat, mode, onMode, onTryAgain, onNext, hasNext }: Props) {
  const v = run.verdict
  const facts = factSentences(card)
  const missed = run.shownAnswer || (v !== null && !v.ok)
  const retry = run.retryVerdict
  const tone = run.shownAnswer ? 'info' : v?.ok ? 'good' : 'bad'
  const Icon = run.shownAnswer ? Eye : v?.ok ? CircleCheck : CircleX
  const graded = run.gradedMove
  const hasReply = !!run.reply?.length && (run.retrying ? retry !== null && !retry.ok : !!v && !v.ok)
  // Enter moves on; focus without scrolling, so a phone keeps the verdict's top in view. The verdict appears the
  // moment Enter confirms the line, so a double press or a held key would skip it unread: an Enter within
  // NEXT_KEY_PAUSE_MS of the verdict, or a key repeat, is ignored (a click always works).
  const nextButton = useRef<HTMLButtonElement>(null)
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
    nextButton.current?.focus({ preventScroll: true })
  }, [])

  return (
    <section className={`card safety-verdict tone-${tone} zen-keep`} aria-live="polite">
      <div className="safety-verdict-head">
        <span className="safety-verdict-icon">
          <Icon size={24} aria-hidden />
        </span>
        <div>
          <h2>{run.shownAnswer ? 'Here is the answer' : v ? title(card, v) : ''}</h2>
          {run.shownAnswer ? (
            <p>Looking before moving counts as a miss. The best move was {card.top[0].san}.</p>
          ) : (
            v && graded && <p>{explain(card, v, graded)}</p>
          )}
        </div>
      </div>

      {!run.shownAnswer && run.line.trim() && (
        <blockquote className="safety-you-wrote">
          <span className="safety-small-label">You wrote</span>“{run.line.trim()}”
        </blockquote>
      )}

      {run.retrying && retry && run.move && (
        <p className={`safety-retry ${retry.ok ? 'is-good' : 'is-bad'}`}>
          <strong>{retry.ok ? 'Safe this time.' : 'Still not good enough.'}</strong> {explain(card, retry, run.move)} Tries
          after a miss do not change when the position comes back.
        </p>
      )}

      {card.wasWinning && (
        <p className="safety-winning">
          <strong>You were winning here:</strong> your winning chances were {Math.round(card.winBefore)}% before this move in the
          game.
        </p>
      )}

      {facts.length > 0 && (
        <div className="safety-facts">
          <div className="safety-small-label">What there was to see</div>
          <ul>
            {facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="safety-context">
        {contextLine(card)} {gameMoveLine(card)}
      </p>

      {lastLine && (
        <p className="safety-last-time">
          <span className="safety-small-label">Last time you wrote ({localDay(new Date(lastLine.at))})</span>“{lastLine.checked}”
        </p>
      )}

      {comesBack(scheduled, repeat, missed) && <p className="safety-schedule">{comesBack(scheduled, repeat, missed)}</p>}

      <div className="safety-board-modes" role="group" aria-label="What the board shows">
        {(run.move || run.retrying) && (
          <button type="button" className={`chip ${mode === 'mine' ? 'selected' : ''}`} onClick={() => onMode('mine')} disabled={!run.move}>
            Your move
          </button>
        )}
        {hasReply && (
          <button type="button" className={`chip ${mode === 'reply' ? 'selected' : ''}`} onClick={() => onMode('reply')}>
            His answer
          </button>
        )}
        <button type="button" className={`chip ${mode === 'best' ? 'selected' : ''}`} onClick={() => onMode('best')}>
          Best move
        </button>
      </div>

      <div className="safety-buttons">
        <button
          ref={nextButton}
          type="button"
          className="btn primary"
          onClick={onNext}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && (e.repeat || performance.now() - shownAt.current < NEXT_KEY_PAUSE_MS)) e.preventDefault()
          }}
        >
          {hasNext ? 'Next position' : 'Finish'} <ArrowRight size={17} aria-hidden />
        </button>
        {missed && (
          <button type="button" className="btn" onClick={onTryAgain}>
            <RotateCcw size={16} aria-hidden /> Try again
          </button>
        )}
      </div>
    </section>
  )
}
