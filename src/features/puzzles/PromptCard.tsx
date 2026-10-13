import { ArrowRight, CircleCheck, CircleX, ExternalLink, Eye, Hourglass, Lightbulb, RotateCcw, SkipForward, Target } from 'lucide-react'
import type { ReactNode } from 'react'
import { describeLine } from './line'
import type { RunState } from './useRun'

export interface ThemeNote {
  key: string
  label: string
  /** "Fork — one piece attacks two or more enemy pieces at once." */
  description: string
}

interface Props {
  run: RunState
  /** Name of what the player is training, and whether it is a single theme (then it is no spoiler to show it). */
  topic: { title: string; isTheme: boolean }
  /** Rating change recorded for this puzzle (null = none, or not finished). */
  delta: number | null
  rating: number
  /** The next puzzle is being fetched. */
  busy: boolean
  themes: ThemeNote[]
  onHint: () => void
  onTryAgain: () => void
  onShowSolution: () => void
  onSkip: () => void
  onNext: () => void
}

type Tone = 'neutral' | 'good' | 'bad' | 'info'
interface Message {
  tone: Tone
  icon: ReactNode
  title: string
  text: string
  /** A general tip rather than feedback: hidden in zen mode. */
  tip?: boolean
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`)

function ratingNote(delta: number | null): string {
  if (delta === null) return ''
  if (delta < 0) return ` Your puzzle rating went down by ${-delta}.`
  if (delta > 0) return ` Your puzzle rating went up by ${delta}.`
  return ''
}

function messageFor(run: RunState, delta: number | null): Message {
  const side = run.start.orientation === 'white' ? 'White' : 'Black'
  const icon = (Icon: typeof Target) => <Icon size={26} aria-hidden />
  switch (run.phase) {
    case 'intro':
      return { tone: 'neutral', icon: icon(Hourglass), title: 'Get ready…', text: 'Your opponent is making a move. Then it is your turn.' }
    case 'replying':
      return { tone: 'good', icon: icon(CircleCheck), title: 'Good move!', text: 'Your opponent answers…' }
    case 'wrong':
      return {
        tone: 'bad',
        icon: icon(CircleX),
        title: run.wrongMoves > 1 ? 'Still not the one.' : 'Not quite.',
        text:
          run.wrongMoves > 1
            ? 'Keep trying, or look at the solution. More tries do not cost anything.'
            : `That is not the best move here.${ratingNote(delta)} You can try again (it will not cost more) or look at the solution.`,
      }
    case 'solved':
      if (run.otherMate)
        return { tone: 'good', icon: icon(CircleCheck), title: 'Checkmate — that works too!', text: 'The puzzle had another move in mind, but checkmate is checkmate. Well spotted.' }
      if (run.failed)
        return { tone: 'good', icon: icon(CircleCheck), title: 'You found it!', text: 'This puzzle still counts as a miss, because the first try was not right. Keep an eye out for this idea next time.' }
      if (run.usedHint)
        return { tone: 'good', icon: icon(CircleCheck), title: 'Solved, with a hint.', text: 'Good work. Your rating stays the same when you use a hint.' }
      return { tone: 'good', icon: icon(CircleCheck), title: 'Puzzle solved!', text: `You found every move.${delta ? ` Rating ${signed(delta)}.` : ''}` }
    case 'showing':
      return { tone: 'info', icon: icon(Eye), title: 'Here is the solution.', text: 'Watch the moves on the board.' }
    case 'shown':
      return {
        tone: 'info',
        icon: icon(Eye),
        title: 'That was the solution.',
        text: `Look at the moves below and ask yourself: what did I miss?${ratingNote(delta)}`,
      }
    case 'solving': {
      if (run.hint > 0) {
        const rule = run.failed
          ? 'This puzzle already counts as a miss, so you can relax and just learn from it.'
          : 'With a hint, this puzzle will not raise your rating.'
        return run.hint === 1
          ? { tone: 'neutral', icon: icon(Lightbulb), title: 'Hint: move the glowing piece.', text: `Which move is best for it? ${rule}` }
          : { tone: 'neutral', icon: icon(Lightbulb), title: 'Hint: follow the arrow.', text: `The arrow shows the move. ${rule}` }
      }
      if (run.failed)
        return { tone: 'neutral', icon: icon(Target), title: `Try again — find the best move for ${side}.`, text: 'This puzzle already counts as a miss, so you can relax and just learn from it.' }
      if (run.step > 0)
        return { tone: 'neutral', icon: icon(Target), title: `Good! Now find the next move for ${side}.`, text: 'Keep going, you are on the right track.' }
      return {
        tone: 'neutral',
        icon: icon(Target),
        title: `Your move — find the best move for ${side}.`,
        text: 'Look for checks, captures and threats. Drag a piece, or tap it and then tap where it goes.',
        tip: true,
      }
    }
  }
}

/** The big card next to the board: what to do now, how it went, and the buttons. Stays visible in zen mode. */
export default function PromptCard({ run, topic, delta, rating, busy, themes, onHint, onTryAgain, onShowSolution, onSkip, onNext }: Props) {
  const message = messageFor(run, delta)
  const done = run.phase === 'solved' || run.phase === 'shown'
  const playing = run.phase === 'solving' || run.phase === 'wrong'
  const line = done || run.phase === 'showing' ? describeLine(run.start) : []

  return (
    <section className={`card prompt-card tone-${message.tone} zen-keep`} aria-label="Puzzle" data-puzzle={run.puzzle.id}>
      <div className="prompt-main" role="status" aria-live="polite">
        <span className="prompt-icon">{message.icon}</span>
        <div>
          <h2>{message.title}</h2>
          <p className={message.tip ? 'zen-hide' : undefined}>{message.text}</p>
        </div>
      </div>

      {!done && (
        <div className="prompt-topic zen-hide">
          {topic.isTheme ? (
            <span className="chip">Theme: {topic.title}</span>
          ) : (
            <span className="chip">{topic.title} — the theme shows when you are done</span>
          )}
        </div>
      )}

      {playing && (
        <div className="prompt-buttons">
          {run.phase === 'wrong' && (
            <button className="btn primary" onClick={onTryAgain}>
              <RotateCcw size={17} aria-hidden /> Try again
            </button>
          )}
          <button className="btn" onClick={onHint} disabled={run.hint === 2}>
            <Lightbulb size={17} aria-hidden /> {run.hint === 0 ? 'Hint' : run.hint === 1 ? 'Show move' : 'Hint shown'}
          </button>
          <button className="btn ghost" onClick={onShowSolution}>
            <Eye size={17} aria-hidden /> Solution
          </button>
          {run.phase === 'solving' && !run.failed && (
            <button className="btn ghost" onClick={onSkip} title="Skip this puzzle. Your rating does not change.">
              <SkipForward size={17} aria-hidden /> Skip
            </button>
          )}
        </div>
      )}

      {done && (
        <div className="prompt-buttons">
          <button className="btn primary big" onClick={onNext} disabled={busy} autoFocus>
            Next puzzle <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      )}

      {done && themes.length > 0 && (
        <div className="prompt-details zen-hide">
          <div className="stats-heading">This puzzle was about</div>
          <ul className="theme-notes">
            {themes.map((t) => {
              const [term, ...rest] = t.description.split(' — ')
              return (
                <li key={t.key}>
                  <strong>{term}</strong>
                  {rest.length > 0 && <> — {rest.join(' — ')}</>}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {(done || run.phase === 'showing') && line.length > 0 && (
        <details className="prompt-details line-details zen-hide" open={run.phase === 'shown' || run.phase === 'showing'}>
          <summary>The winning moves</summary>
          <ol className="line-list">
            {line.map((step, i) => (
              <li key={i} className={step.yours ? 'yours' : undefined}>
                <span className="line-no">{step.number}</span>
                <strong>{step.san}</strong>
                <span className="muted">
                  {step.yours ? 'You: ' : 'Opponent: '}
                  {step.plain}
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {done && (
        <p className="prompt-foot small faint zen-hide">
          Puzzle rating {run.puzzle.rating} · your rating {rating} ·{' '}
          <a href={`https://lichess.org/training/${run.puzzle.id}`} target="_blank" rel="noreferrer">
            see it on Lichess <ExternalLink size={12} aria-hidden />
          </a>
        </p>
      )}

      <p className="prompt-keys small faint zen-hide">
        Keys: <kbd>H</kbd> hint · <kbd>N</kbd> next puzzle · <kbd>Z</kbd> zen mode
      </p>
    </section>
  )
}
