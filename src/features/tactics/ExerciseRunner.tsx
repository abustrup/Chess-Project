import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, CircleCheck, CircleX, Eye, Lightbulb, RotateCcw, Target } from 'lucide-react'
import type { TacticExercise } from '../../types'
import Board, { type BoardMove } from '../../components/Board'
import { playUci, sideName, sideToMove } from './chessHelpers'
import { useShortcuts } from './useShortcuts'

// One exercise: the board, the feedback and the buttons. The page above creates a fresh runner for
// every exercise (and for every "Retry"), so nothing here has to be reset by hand.

type Phase =
  | 'user' // waiting for the player's move
  | 'reply' // the opponent's answer is about to be played
  | 'solved' // finished by the player
  | 'revealed' // the player asked to see the solution

interface Message {
  tone: 'neutral' | 'good' | 'bad'
  title: string
  text?: string
}

const REPLY_DELAY_MS = 550
const REVEAL_DELAY_MS = 800
const FLASH_MS = 900

const WRONG_MESSAGES = [
  'Take another look. What does each of your pieces attack? Is anything of theirs left unprotected?',
  'Not yet. Try a different idea, or press Hint for a small nudge.',
  'Still not it. Use Hint, or press Show solution to see how it works. There is no rush.',
]

/** Keeps the newest callback in a ref, so timers can call it without being restarted. */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}

interface Props {
  exercise: TacticExercise
  /** True right after the solve that finished every exercise of the lesson. */
  lessonComplete: boolean
  nextLabel: string
  /** Pass-through panels for the side column (progress dots etc.). */
  extra: ReactNode
  onSolved: () => void
  /** The player made a wrong move or gave up. */
  onFailedAttempt: () => void
  onRetry: () => void
  onNext: () => void
}

export default function ExerciseRunner({ exercise, lessonComplete, nextLabel, extra, onSolved, onFailedAttempt, onRetry, onNext }: Props) {
  const side = sideToMove(exercise.fen)
  const { solution } = exercise

  const [fen, setFen] = useState(exercise.fen)
  const [ply, setPly] = useState(0) // how many moves of the solution are on the board
  const [phase, setPhase] = useState<Phase>('user')
  const [lastMove, setLastMove] = useState<[string, string] | null>(null)
  const [message, setMessage] = useState<Message>({
    tone: 'neutral',
    title: `${sideName(side)} to move`,
    text: 'Find the best move. Click a piece and then its new square, or drag it.',
  })
  const [wrongCount, setWrongCount] = useState(0)
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0)
  const [wrongSquare, setWrongSquare] = useState<string | null>(null)
  const [matedInstead, setMatedInstead] = useState(false) // solved with a different checkmate

  const onSolvedRef = useLatest(onSolved)
  const onFailedRef = useLatest(onFailedAttempt)

  function finishSolved(otherMate = false) {
    setMatedInstead(otherMate)
    setPhase('solved')
    onSolvedRef.current()
  }

  /* ---- the opponent answers after a correct move --------------------------------------- */
  useEffect(() => {
    if (phase !== 'reply') return
    const timer = setTimeout(() => {
      const reply = playUci(fen, solution[ply])
      if (!reply) return finishSolved() // broken lesson data: end the exercise instead of freezing
      setFen(reply.fen)
      setLastMove([reply.from, reply.to])
      setPly(ply + 1)
      if (ply + 1 >= solution.length) return finishSolved()
      setPhase('user')
      setHintLevel(0)
      setMessage({ tone: 'neutral', title: 'Your turn again', text: 'Good. Now find your next move.' })
    }, REPLY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [phase, fen, ply, solution])

  /* ---- "Show solution" plays the rest of the line, one move at a time ------------------- */
  useEffect(() => {
    if (phase !== 'revealed' || ply >= solution.length) return
    const timer = setTimeout(() => {
      const move = playUci(fen, solution[ply])
      if (!move) return setPly(solution.length)
      setFen(move.fen)
      setLastMove([move.from, move.to])
      setPly(ply + 1)
    }, REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [phase, fen, ply, solution])

  /* ---- the red flash on a wrong square goes away by itself ------------------------------ */
  useEffect(() => {
    if (!wrongSquare) return
    const timer = setTimeout(() => setWrongSquare(null), FLASH_MS)
    return () => clearTimeout(timer)
  }, [wrongSquare])

  /* ---- the player moves ------------------------------------------------------------------ */
  function handleMove(move: BoardMove): boolean {
    if (phase !== 'user') return false
    const isExpected = move.uci.toLowerCase() === solution[ply].toLowerCase()
    // checkmate always wins, even if it is not the move the lesson had in mind
    if (!isExpected && !move.isCheckmate) {
      const count = wrongCount + 1
      setWrongCount(count)
      setWrongSquare(move.to)
      setMessage({ tone: 'bad', title: 'Not that one', text: WRONG_MESSAGES[Math.min(count, WRONG_MESSAGES.length) - 1] })
      onFailedRef.current()
      return false
    }
    setFen(move.fenAfter)
    setLastMove([move.from, move.to])
    setPly(ply + 1)
    setHintLevel(0)
    if (!isExpected || ply + 1 >= solution.length) {
      finishSolved(!isExpected)
    } else {
      setPhase('reply')
      setMessage({ tone: 'good', title: 'Yes, that is the move!', text: 'Watch how your opponent answers.' })
    }
    return true
  }

  /* ---- buttons ---------------------------------------------------------------------------- */
  const hintText = ply === 0 ? exercise.hint : undefined

  function showHint() {
    if (phase !== 'user' || hintLevel === 2) return
    setHintLevel(hintLevel === 0 && hintText ? 1 : 2)
    // a "Not that one" message would look odd above a hint, so go back to the calm prompt
    setMessage({ tone: 'neutral', title: `${sideName(side)} to move`, text: 'Take your time. Here is a little help.' })
  }

  function showSolution() {
    if (phase !== 'user') return
    setPhase('revealed')
    onFailedRef.current()
  }

  const pristine = phase === 'user' && ply === 0 && wrongCount === 0 && hintLevel === 0
  const finished = phase === 'solved' || phase === 'revealed'

  useShortcuts({
    h: showHint,
    r: pristine ? undefined : onRetry,
    ArrowRight: finished ? onNext : undefined,
  })

  /* ---- what to show ------------------------------------------------------------------------ */
  const shown: Message = useMemo(() => {
    if (phase === 'solved') {
      const lines = [
        matedInstead ? 'That is checkmate too. It is not the move we had in mind, but it ends the game, so it counts.' : '',
        exercise.explanation,
        lessonComplete ? 'That was the last one. You have solved every exercise in this lesson!' : '',
      ]
      return { tone: 'good', title: matedInstead ? 'Checkmate!' : 'Correct!', text: lines.filter(Boolean).join(' ') }
    }
    if (phase === 'revealed') return { tone: 'neutral', title: 'Here is the solution', text: exercise.explanation }
    return message
  }, [phase, matedInstead, exercise.explanation, lessonComplete, message])

  const highlights = useMemo(() => (wrongSquare ? [{ square: wrongSquare, color: 'red' }] : undefined), [wrongSquare])
  const nextMove = solution[ply]
  const arrows = useMemo(
    () =>
      phase === 'revealed' && nextMove
        ? [{ from: nextMove.slice(0, 2), to: nextMove.slice(2, 4), color: ply % 2 === 0 ? 'green' : 'blue' }]
        : undefined,
    [phase, nextMove, ply],
  )
  const hintSquares = hintLevel === 2 && phase === 'user' ? [nextMove.slice(0, 2)] : undefined
  const ToneIcon = shown.tone === 'good' ? CircleCheck : shown.tone === 'bad' ? CircleX : Target

  return (
    <div className="board-layout">
      <div className="board-col tx-board-col">
        <Board
          fen={fen}
          orientation={side}
          interactive={phase === 'user' ? side : false}
          onMove={handleMove}
          lastMove={lastMove}
          highlights={highlights}
          arrows={arrows}
          hintSquares={hintSquares}
          animationMs={250}
        />
      </div>

      <div className="side-col">
        <section className={`card zen-keep tx-prompt ${shown.tone}`} aria-live="polite">
          <div className="tx-prompt-title">
            <ToneIcon size={22} aria-hidden />
            {shown.title}
          </div>
          {shown.text && <p className="tx-prompt-text">{shown.text}</p>}
          {phase === 'user' && hintLevel > 0 && (
            <div className="callout warn tx-hint">
              <Lightbulb size={18} aria-hidden />
              <span>
                {hintLevel === 1 && hintText}
                {hintLevel === 2 && `${hintText ? `${hintText} ` : ''}The glowing piece is the one to move.`}
              </span>
            </div>
          )}
        </section>

        <div className="zen-keep tx-actions">
          {finished ? (
            <>
              <button className="btn primary big" onClick={onNext} autoFocus>
                {nextLabel} <ArrowRight size={18} aria-hidden />
              </button>
              <button className="btn" onClick={onRetry} title="Try this exercise again (R)">
                <RotateCcw size={16} aria-hidden /> Retry
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={showHint} disabled={phase !== 'user' || hintLevel === 2} title="Get a small nudge (H)">
                <Lightbulb size={16} aria-hidden /> {hintLevel === 0 ? 'Hint' : 'Show piece'}
              </button>
              <button className="btn" onClick={showSolution} disabled={phase !== 'user'}>
                <Eye size={16} aria-hidden /> Show solution
              </button>
              <button className="btn ghost" onClick={onRetry} disabled={pristine} title="Start this exercise again (R)">
                <RotateCcw size={16} aria-hidden /> Retry
              </button>
            </>
          )}
        </div>

        {extra}
        <p className="small faint tx-key-hint zen-hide">Keys: H for a hint · R to retry · → for the next exercise</p>
      </div>
    </div>
  )
}
