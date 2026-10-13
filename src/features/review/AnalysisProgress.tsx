import { X } from 'lucide-react'
import { runFraction, type RunState } from './useAnalysisRun'

/** A progress bar with plain words and a Cancel button. Used by the review page and the "Analyse all" button. */
export default function AnalysisProgress({ state, onCancel }: { state: RunState; onCancel: () => void }) {
  const percent = Math.round(runFraction(state) * 100)
  const many = state.gameCount > 1
  return (
    <div className="analysis-progress" role="status" aria-live="polite">
      <div className="row between">
        <span>
          {many ? `Game ${state.gameIndex + 1} of ${state.gameCount}` : 'Looking at every move'}
          {state.total > 0 && (
            <span className="faint">
              {' '}
              · position {state.done} of {state.total}
            </span>
          )}
        </span>
        <button className="btn small ghost" onClick={onCancel} aria-label="Cancel the analysis">
          <X size={14} /> Cancel
        </button>
      </div>
      <div className="progress" aria-hidden>
        <span style={{ width: `${Math.max(3, percent)}%` }} />
      </div>
      <span className="faint small">
        {percent}% · the computer is thinking about each position, this runs in your browser.
      </span>
    </div>
  )
}
