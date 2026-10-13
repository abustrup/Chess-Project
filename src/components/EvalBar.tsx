import { formatEval, winPercent } from '../lib/evaluation'
import type { Side } from '../types'

/** Vertical evaluation bar. `cpWhite` is the evaluation in centipawns from White's point of view. */
export default function EvalBar({ cpWhite, orientation = 'white' }: { cpWhite: number | null; orientation?: Side }) {
  const pct = cpWhite == null ? 50 : winPercent(cpWhite)
  const label = cpWhite == null ? '' : formatEval(cpWhite)
  const whiteLeads = (cpWhite ?? 0) >= 0
  const flipped = orientation === 'black'
  return (
    <div className={`eval-bar ${flipped ? 'flipped' : ''}`} title={label ? `Evaluation ${label}` : 'No evaluation yet'}>
      <div className="white-part" style={{ height: `${pct}%` }} />
      {label && (
        <span
          className={`label ${whiteLeads !== flipped ? 'bottom' : 'top'}`}
          style={{ color: whiteLeads ? '#262522' : '#f0efe9' }}
        >
          {label.replace('+', '')}
        </span>
      )}
    </div>
  )
}
