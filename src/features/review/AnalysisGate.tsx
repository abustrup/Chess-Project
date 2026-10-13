import { Zap } from 'lucide-react'
import AnalysisProgress from './AnalysisProgress'
import type { RunState } from './useAnalysisRun'

/** Shown instead of the coach box while a game has not been analysed yet. */
export default function AnalysisGate({
  state,
  onStart,
  onCancel,
  plyCount,
}: {
  state: RunState
  onStart: () => void
  onCancel: () => void
  plyCount: number
}) {
  if (state.running) {
    return (
      <>
        <h3>Checking your game…</h3>
        <AnalysisProgress state={state} onCancel={onCancel} />
      </>
    )
  }
  // roughly a tenth of a second per position on a normal laptop
  const seconds = Math.max(5, Math.round(plyCount * 0.12))
  return (
    <>
      <h3>This game has not been checked yet</h3>
      <p className="muted">
        The computer (Stockfish) will look at every move and show you where the game turned. It runs inside your
        browser, costs nothing and takes about {seconds} seconds.
      </p>
      {state.error && <div className="callout bad">{state.error}</div>}
      <button className="btn primary big" onClick={onStart} disabled={plyCount === 0}>
        <Zap size={18} /> Analyse this game
      </button>
    </>
  )
}
