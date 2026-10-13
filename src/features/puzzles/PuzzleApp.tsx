import { useCallback, useEffect, useState } from 'react'
import { Puzzle as PuzzleIcon } from 'lucide-react'
import type { PuzzleIndex } from '../../types'
import { loadPuzzleIndex } from '../../lib/puzzleData'
import { KEYS, useStored } from '../../lib/storage'
import PuzzleRush from './PuzzleRush'
import Trainer from './Trainer'
import { DEFAULT_PUZZLE_STATS } from './rating'
import { errorMessage } from './errors'
import './puzzles.css'

type IndexState = { status: 'loading' } | { status: 'ready'; index: PuzzleIndex } | { status: 'error'; message: string }

/** Load the list of puzzle files once; "Try again" loads it again. */
function usePuzzleIndex(): { state: IndexState; retry: () => void } {
  const [state, setState] = useState<IndexState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    loadPuzzleIndex()
      .then((index) => {
        if (cancelled) return
        setState(index.entries.length > 0 ? { status: 'ready', index } : { status: 'error', message: 'The puzzle list is empty.' })
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ status: 'error', message: errorMessage(e) })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  return { state, retry: useCallback(() => setAttempt((n) => n + 1), []) }
}

/** The whole Puzzles page: the heading with your rating, then either the trainer or Puzzle Rush. */
export default function PuzzleApp() {
  const [stats] = useStored(KEYS.puzzleStats, DEFAULT_PUZZLE_STATS)
  const { state, retry } = usePuzzleIndex()
  const [rush, setRush] = useState(false)

  return (
    <div className="page puzzles-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Puzzles</div>
          <h1>{rush ? 'Puzzle Rush' : 'Find the best move'}</h1>
        </div>
        <div className="rating-pill" title="Your puzzle rating. It goes up when you solve puzzles and down when you miss them.">
          <PuzzleIcon size={18} aria-hidden />
          <span className="small muted">Puzzle rating</span>
          <strong>{stats.rating}</strong>
        </div>
      </header>

      {state.status === 'loading' && (
        <div className="board-layout" aria-busy="true">
          <div className="board-col">
            <div className="board-skeleton" />
          </div>
          <div className="side-col">
            <section className="card prompt-card zen-keep">
              <h2>Getting your puzzles ready…</h2>
              <p>This only takes a moment.</p>
            </section>
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <section className="card puzzle-error" role="alert">
          <h2>The puzzles did not load</h2>
          <p>{state.message}</p>
          <button className="btn primary" onClick={retry}>
            Try again
          </button>
        </section>
      )}

      {state.status === 'ready' &&
        (rush ? <PuzzleRush index={state.index} onExit={() => setRush(false)} /> : <Trainer index={state.index} onStartRush={() => setRush(true)} />)}
    </div>
  )
}
