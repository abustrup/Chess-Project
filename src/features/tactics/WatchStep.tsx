import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import type { TacticLesson } from '../../types'
import Board from '../../components/Board'
import { playLine, sideName, sideToMove } from './chessHelpers'
import { useShortcuts } from './useShortcuts'
import { useLessonProgress } from './useTacticsProgress'

/** How long to stay on a move while auto-playing: longer explanations get more time to be read. */
function readingTime(text: string | undefined): number {
  return Math.min(7000, 1800 + (text?.length ?? 0) * 45)
}

/** Step 2: watch a worked example, one move at a time, with a short explanation for every move. */
export default function WatchStep({ lesson, onNext }: { lesson: TacticLesson; onNext: () => void }) {
  const { progress, markExamplesSeen } = useLessonProgress(lesson)
  const [exampleIndex, setExampleIndex] = useState(0)
  const [step, setStep] = useState(0) // 0 = starting position, n = after the n-th move
  const [playing, setPlaying] = useState(false)

  const example = lesson.examples[exampleIndex]
  // bad data (an illegal move) just shortens the example instead of breaking the page
  const line = useMemo(() => (example ? playLine(example.fen, example.moves) : []), [example])
  const total = line.length
  const atEnd = step >= total
  const isLastExample = exampleIndex >= lesson.examples.length - 1

  // when an example has been watched to its last move, remember it
  useEffect(() => {
    if (example && total > 0 && step === total) markExamplesSeen(exampleIndex + 1)
  }, [example, exampleIndex, step, total, markExamplesSeen])

  // auto-play: wait long enough to read the current explanation, then show the next move
  useEffect(() => {
    if (!playing) return
    if (atEnd) {
      setPlaying(false)
      return
    }
    const delay = step === 0 ? 1500 : readingTime(example?.explanations[step - 1])
    const timer = setTimeout(() => setStep((s) => s + 1), delay)
    return () => clearTimeout(timer)
  }, [playing, atEnd, step, example])

  function goTo(next: number) {
    setPlaying(false)
    setStep(Math.max(0, Math.min(total, next)))
  }
  function togglePlay() {
    if (playing) return setPlaying(false)
    if (atEnd) setStep(0)
    setPlaying(true)
  }
  function pickExample(index: number) {
    setExampleIndex(index)
    setStep(0)
    setPlaying(false)
  }

  useShortcuts({
    ArrowRight: () => goTo(step + 1),
    ArrowLeft: () => goTo(step - 1),
    Home: () => goTo(0),
  })

  if (!example) {
    return (
      <div className="card tx-empty">
        <h2>No examples in this lesson yet</h2>
        <p className="muted">You can go straight to the exercises.</p>
        <button className="btn primary" onClick={onNext}>
          Try it yourself <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    )
  }

  const orientation = example.orientation ?? sideToMove(example.fen)
  const fen = step === 0 ? example.fen : line[step - 1].fen
  const played = step > 0 ? line[step - 1] : null

  return (
    <div className="board-layout">
      <div className="board-col tx-board-col">
        <Board
          fen={fen}
          orientation={orientation}
          lastMove={played ? [played.from, played.to] : null}
          animationMs={350}
        />
      </div>

      <div className="side-col">
        <section className="card zen-keep tx-explain" aria-live="polite">
          <div className="eyebrow">
            {example.title} · {step === 0 ? 'Start' : `Move ${step} of ${total}`}
          </div>
          {played ? (
            <>
              <div className="tx-move-line">
                <span className={`tx-side-dot ${played.side}`} aria-hidden />
                {sideName(played.side)} plays <strong>{played.san}</strong>
              </div>
              <p className="tx-explain-text">{example.explanations[step - 1]}</p>
            </>
          ) : (
            <>
              <div className="tx-move-line">
                <span className={`tx-side-dot ${sideToMove(example.fen)}`} aria-hidden />
                {sideName(sideToMove(example.fen))} to move
              </div>
              <p className="tx-explain-text">Take a look at the position first. Then press Next to watch the idea.</p>
            </>
          )}
        </section>

        <div className="zen-keep tx-controls">
          <div className="row tx-control-row">
            <button className="btn icon" onClick={() => goTo(0)} disabled={step === 0} aria-label="Back to the start" title="Back to the start (Home)">
              <RotateCcw size={18} aria-hidden />
            </button>
            <button className="btn icon" onClick={() => goTo(step - 1)} disabled={step === 0} aria-label="Previous move" title="Previous move (←)">
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button className="btn icon" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play automatically'} title={playing ? 'Pause' : 'Play automatically'}>
              {playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
            </button>
            <button className="btn icon" onClick={() => goTo(step + 1)} disabled={atEnd} aria-label="Next move" title="Next move (→)">
              <ChevronRight size={20} aria-hidden />
            </button>
            {atEnd && !isLastExample && (
              <button className="btn primary" onClick={() => pickExample(exampleIndex + 1)}>
                Next example <ArrowRight size={18} aria-hidden />
              </button>
            )}
            {atEnd && isLastExample && (
              <button className="btn primary" onClick={onNext}>
                Try it yourself <ArrowRight size={18} aria-hidden />
              </button>
            )}
          </div>
          <p className="small faint tx-key-hint zen-hide">Tip: use the ← and → keys to step through the moves.</p>
        </div>

        <div className="card zen-hide">
          <div className="card-title">Examples</div>
          <div className="tx-example-list">
            {lesson.examples.map((ex, i) => (
              <button
                key={i}
                className={`tx-example-pick ${i === exampleIndex ? 'active' : ''}`}
                onClick={() => pickExample(i)}
                aria-current={i === exampleIndex}
              >
                <span className="tx-example-num">{i < progress.examplesSeen ? <Check size={14} aria-label="watched" /> : i + 1}</span>
                <span>{ex.title}</span>
              </button>
            ))}
          </div>
        </div>

        {!atEnd || !isLastExample ? (
          <div className="zen-keep tx-skip">
            <button className="btn ghost small" onClick={onNext}>
              Skip to the exercises <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
