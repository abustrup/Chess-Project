import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Play, RotateCcw, Timer, Trophy, X } from 'lucide-react'
import type { PuzzleIndex } from '../../types'
import type { BoardMove } from '../../components/Board'
import { playSound } from '../../lib/sound'
import { KEYS, useStored } from '../../lib/storage'
import PuzzleBoard from './PuzzleBoard'
import { DEFAULT_PUZZLE_STATS } from './rating'
import { pickNext } from './selection'
import { isLastUserMove, judgeMove, prepare, usePuzzleRun } from './useRun'
import { errorMessage } from './errors'

// Puzzle Rush: solve as many puzzles as you can in 3 minutes. Three wrong moves and it is over.
// It does not change your puzzle rating; it has its own best score.

const RUSH_SECONDS = 180
const MAX_STRIKES = 3
/** Rush starts a bit below your rating and gets harder with every puzzle you solve. */
const START_BELOW = 300
const HARDER_PER_PUZZLE = 40
const MAX_TARGET = 2000
const MIN_TARGET = 450
const RUSH_WINDOW = 120
/** Pauses so you can see what happened before the next puzzle appears. */
const AFTER_SOLVED_MS = 450
const AFTER_STRIKE_MS = 900

type Phase = 'ready' | 'running' | 'over'
type Prepared = NonNullable<ReturnType<typeof prepare>>

interface Props {
  index: PuzzleIndex
  onExit: () => void
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function PuzzleRush({ index, onExit }: Props) {
  const [stats] = useStored(KEYS.puzzleStats, DEFAULT_PUZZLE_STATS)
  const [best, setBest] = useStored<number>('puzzles.rushBest', 0)
  const { run, dispatch } = usePuzzleRun({ introMs: 350, replyMs: 280 })

  const [phase, setPhase] = useState<Phase>('ready')
  const [score, setScore] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(RUSH_SECONDS)
  const [pausing, setPausing] = useState(false)
  const [newBest, setNewBest] = useState(false)
  const [error, setError] = useState('')

  const entries = useMemo(() => index.entries.filter((e) => e.kind === 'theme'), [index])
  const baseRating = useRef(stats.rating)
  const game = useRef(0) // changes for every new game, so late answers from an old game are ignored
  const used = useRef(new Set<string>())
  const upcoming = useRef<Promise<Prepared | null> | null>(null)
  const timers = useRef<number[]>([])
  const endsAt = useRef(0)

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  // Leaving the page (or starting over) must stop everything.
  useEffect(
    () => () => {
      game.current++
      clearTimers()
    },
    [],
  )

  /** Find a puzzle for a player who has already solved `solved` puzzles in this game. */
  const fetchPrepared = useCallback(
    async (solved: number): Promise<Prepared | null> => {
      const targetRating = Math.max(MIN_TARGET, Math.min(MAX_TARGET, baseRating.current - START_BELOW + solved * HARDER_PER_PUZZLE))
      for (let tries = 0; tries < 5; tries++) {
        const pick = await pickNext(entries, { targetRating, exclude: used.current, window: RUSH_WINDOW })
        if (!pick) return null
        used.current.add(pick.puzzle.id)
        const prepared = prepare(pick.puzzle)
        if (prepared) return prepared
      }
      return null
    },
    [entries],
  )

  const showPuzzle = useCallback(
    async (solved: number, thisGame: number) => {
      try {
        const prepared = await (upcoming.current ?? fetchPrepared(solved))
        upcoming.current = null
        if (thisGame !== game.current) return
        if (!prepared) throw new Error('There are no more puzzles for Puzzle Rush.')
        dispatch({ type: 'load', ...prepared })
        setPausing(false)
        // Get the next one ready while the player is thinking, so there is no waiting between puzzles.
        upcoming.current = fetchPrepared(solved + 1)
      } catch (e) {
        if (thisGame !== game.current) return
        setError(errorMessage(e))
        setPhase('over')
      }
    },
    [dispatch, fetchPrepared],
  )

  function start() {
    game.current++
    clearTimers()
    used.current = new Set()
    upcoming.current = null
    baseRating.current = stats.rating
    endsAt.current = Date.now() + RUSH_SECONDS * 1000
    setScore(0)
    setStrikes(0)
    setSecondsLeft(RUSH_SECONDS)
    setNewBest(false)
    setError('')
    setPausing(false)
    setPhase('running')
    void showPuzzle(0, game.current)
  }

  const finish = useCallback(
    (finalScore: number) => {
      game.current++ // anything still on its way for this game is ignored
      clearTimers()
      upcoming.current = null
      setPhase('over')
      setPausing(true)
      if (finalScore > best) {
        setBest(finalScore)
        setNewBest(true)
      }
      playSound('end')
    },
    [best, setBest],
  )

  // The countdown.
  useEffect(() => {
    if (phase !== 'running') return
    const tick = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) finish(score)
    }, 250)
    return () => window.clearInterval(tick)
  }, [phase, score, finish])

  function handleMove(move: BoardMove): boolean {
    if (!run || phase !== 'running' || pausing) return false
    const verdict = judgeMove(run, move)
    const thisGame = game.current

    if (verdict === 'wrong') {
      const struck = strikes + 1
      setStrikes(struck)
      setPausing(true)
      dispatch({ type: 'wrong' })
      if (struck >= MAX_STRIKES) later(() => finish(score), AFTER_STRIKE_MS)
      else later(() => void showPuzzle(score, thisGame), AFTER_STRIKE_MS)
      return false
    }

    const finished = isLastUserMove(run, verdict)
    dispatch({ type: 'userMoved', move, verdict, finished })
    if (finished) {
      const next = score + 1
      setScore(next)
      setPausing(true)
      later(() => void showPuzzle(next, thisGame), AFTER_SOLVED_MS)
    }
    return true
  }

  const side = run?.start.orientation === 'black' ? 'Black' : 'White'
  const lastStrike = phase === 'running' && pausing && strikes > 0 && run?.phase === 'wrong'
  const status =
    phase !== 'running'
      ? ''
      : lastStrike
        ? `Wrong move — strike ${strikes} of ${MAX_STRIKES}.`
        : run?.phase === 'solved'
          ? 'Solved! Next one…'
          : run
            ? `Your move — play for ${side}.`
            : 'Finding a puzzle…'

  return (
    <div className="board-layout">
      <div className="board-col rush-board" data-puzzle={run?.puzzle.id}>
        <PuzzleBoard run={run} onMove={handleMove} locked={pausing || phase !== 'running'} />

        {phase !== 'running' && (
          <div className="rush-overlay">
            <div className="rush-dialog card">
              {phase === 'ready' ? (
                <>
                  <Timer size={34} aria-hidden className="rush-icon" />
                  <h2>Puzzle Rush</h2>
                  <p>
                    You have 3 minutes. Solve as many puzzles as you can. They start easy and get harder. Three wrong moves and
                    it is over. There are no hints here, so trust your eyes.
                  </p>
                  {best > 0 && (
                    <p className="small muted">
                      Your best: <strong>{best}</strong>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Trophy size={34} aria-hidden className="rush-icon" />
                  <h2>{error ? 'Puzzle Rush stopped' : secondsLeft === 0 ? 'Time is up!' : 'Three strikes!'}</h2>
                  {error ? (
                    <p>{error}</p>
                  ) : (
                    <>
                      <p className="rush-score">
                        <strong>{score}</strong> {score === 1 ? 'puzzle' : 'puzzles'} solved
                      </p>
                      <p className="small muted">
                        {newBest ? 'That is a new best score. Well done!' : `Your best is ${Math.max(best, score)}.`}
                      </p>
                    </>
                  )}
                </>
              )}
              <div className="prompt-buttons rush-buttons">
                <button className="btn primary big" onClick={start}>
                  {phase === 'ready' ? (
                    <>
                      <Play size={18} aria-hidden /> Start
                    </>
                  ) : (
                    <>
                      <RotateCcw size={18} aria-hidden /> Play again
                    </>
                  )}
                </button>
                <button className="btn" onClick={onExit}>
                  <ArrowLeft size={17} aria-hidden /> Back to training
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="side-col">
        <section className="card rush-card zen-keep" aria-label="Puzzle Rush">
          <div className={`rush-clock ${phase === 'running' && secondsLeft <= 10 ? 'low' : ''}`} role="timer" aria-label="Time left">
            {clock(secondsLeft)}
          </div>
          <div className="rush-stats">
            <div>
              <div className="rush-stat-value">{score}</div>
              <div className="small muted">solved</div>
            </div>
            <div>
              <div className="rush-strikes" aria-label={`${strikes} of ${MAX_STRIKES} strikes`}>
                {Array.from({ length: MAX_STRIKES }, (_, i) => (
                  <span key={i} className={i < strikes ? 'strike used' : 'strike'}>
                    <X size={16} aria-hidden />
                  </span>
                ))}
              </div>
              <div className="small muted">strikes</div>
            </div>
            <div>
              <div className="rush-stat-value">{best}</div>
              <div className="small muted">best</div>
            </div>
          </div>
          <p className="rush-status" role="status" aria-live="polite">
            {status}
          </p>
        </section>
        <section className="card zen-hide">
          <p className="small muted">
            Puzzle Rush does not change your puzzle rating. It is just for fun and for training how fast you see tactics.
          </p>
          <button className="btn small" onClick={onExit}>
            <ArrowLeft size={15} aria-hidden /> Back to training
          </button>
        </section>
      </div>
    </div>
  )
}
