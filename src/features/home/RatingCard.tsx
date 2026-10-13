import { Link } from 'react-router-dom'
import { ArrowRight, Gauge } from 'lucide-react'
import type { RatingEstimate } from '../../types'
import { plural } from './format'

/** A horizontal scale: the likely range as a band, the estimate as a dot, the player's own guess as a tick. */
function RangeBar({ estimate, selfRating }: { estimate: RatingEstimate; selfRating: number }) {
  // Leave room on both sides so the band reads as "a part of the ratings", not "the whole scale".
  const lowest = Math.floor((Math.min(estimate.low, selfRating) - 250) / 100) * 100
  const highest = Math.ceil((Math.max(estimate.high, selfRating) + 250) / 100) * 100
  const at = (value: number) => `${((value - lowest) / (highest - lowest)) * 100}%`
  return (
    <div aria-hidden>
      <div className="range">
        <div className="range-band" style={{ left: at(estimate.low), width: `calc(${at(estimate.high)} - ${at(estimate.low)})` }} />
        <div className="range-self" style={{ left: at(selfRating) }} />
        <div className="range-dot" style={{ left: at(estimate.elo) }} />
      </div>
      <div className="range-ends faint">
        <span>{lowest}</span>
        <span>{highest}</span>
      </div>
    </div>
  )
}

function compareText(elo: number, selfRating: number): string {
  const diff = Math.round(elo - selfRating)
  if (Math.abs(diff) <= 50) return `That is close to the ${selfRating} you told me.`
  return `That is about ${Math.abs(diff)} points ${diff > 0 ? 'higher' : 'lower'} than the ${selfRating} you told me.`
}

export default function RatingCard({ estimate, selfRating }: { estimate: RatingEstimate | null; selfRating: number }) {
  if (!estimate) {
    return (
      <section className="card home-card" aria-labelledby="rating-title">
        <div className="card-title" id="rating-title">
          <Gauge size={16} aria-hidden /> Your rating estimate
        </div>
        <p>
          Curious how strong you really are? Play a few games here, or bring in your Lichess games, and I will make an
          honest guess. You told me you are around {selfRating}.
        </p>
        <Link className="btn" to="/rating">
          Estimate my rating <ArrowRight size={17} aria-hidden />
        </Link>
      </section>
    )
  }
  return (
    <section className="card home-card" aria-labelledby="rating-title">
      <div className="card-title" id="rating-title">
        <Gauge size={16} aria-hidden /> Your rating estimate
      </div>
      <div className="row between wrap">
        <div className="big-number">{Math.round(estimate.elo)}</div>
        <span className="chip blue">Based on {plural(estimate.gamesUsed, 'game')}</span>
      </div>
      <p className="muted small rating-range">
        Probably between {Math.round(estimate.low)} and {Math.round(estimate.high)}.
      </p>
      <RangeBar estimate={estimate} selfRating={selfRating} />
      <div className="range-legend small faint">
        <span>
          <i className="legend-dot" aria-hidden /> Estimate
        </span>
        <span>
          <i className="legend-tick" aria-hidden /> You said {selfRating}
        </span>
      </div>
      <p className="muted small">
        {compareText(estimate.elo, selfRating)}
        {estimate.gamesUsed < 10 ? ' With so few games it is only a rough guess.' : ''}
      </p>
      <Link to="/rating" className="small">
        See how it was worked out
      </Link>
    </section>
  )
}
