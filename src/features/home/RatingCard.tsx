import { Link } from 'react-router-dom'
import { ArrowRight, Gauge, Settings as SettingsIcon } from 'lucide-react'
import type { RatingEstimate } from '../../types'
import { DEFAULT_PROFILE } from '../../types'
import { KEYS, useStored } from '../../lib/storage'
import { cleanUsername } from '../rating/lichessImport'
import {
  PERF_LABEL,
  asOfText,
  hasRating,
  headlinePerf,
  isProvisional,
  ratingRange,
  ratingText,
} from '../rating/lichessRating'
import { useLichessRating } from '../rating/useLichessRating'
import { plural } from './format'

// Home's rating card: the live Lichess rating (rapid once it has games, his study time control, otherwise blitz)
// with Lichess's own range. The app's old blended estimate is gone (research/2026-10-16-diagnosis/rating).

/** A saved answer younger than this is shown as it is; Home does not ask Lichess on every visit. */
const REFRESH_AFTER_MS = 10 * 60_000

/** Lichess's range as a band on a scale, with the rating as a dot. */
function RangeBar({ rating, low, high }: { rating: number; low: number; high: number }) {
  const lowest = Math.floor((low - 150) / 100) * 100
  const highest = Math.ceil((high + 150) / 100) * 100
  const at = (value: number) => `${((value - lowest) / (highest - lowest)) * 100}%`
  return (
    <div aria-hidden>
      <div className="range">
        <div className="range-band" style={{ left: at(low), width: `calc(${at(high)} - ${at(low)})` }} />
        <div className="range-dot" style={{ left: at(rating) }} />
      </div>
      <div className="range-ends faint">
        <span>{lowest}</span>
        <span>{highest}</span>
      </div>
    </div>
  )
}

function Title() {
  return (
    <div className="card-title" id="rating-title">
      <Gauge size={16} aria-hidden /> Your Lichess rating
    </div>
  )
}

/**
 * The props are kept as they were so Home compiles unchanged. Neither is shown any more: the rating is Lichess's,
 * and the self-rating only sets the bot's starting strength in Play.
 */
export default function RatingCard(_props: { estimate: RatingEstimate | null; selfRating: number }) {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const username = cleanUsername(profile.lichessUsername ?? '') ?? ''
  const live = useLichessRating(username, REFRESH_AFTER_MS)

  if (!username) {
    return (
      <section className="card home-card" aria-labelledby="rating-title">
        <Title />
        <p>Your rating is the one Lichess gives you. Add your Lichess username and it shows here, read live.</p>
        <Link className="btn" to="/settings">
          <SettingsIcon size={17} aria-hidden /> Add it in Settings
        </Link>
      </section>
    )
  }

  const ratings = live.ratings
  if (!ratings) {
    return (
      <section className="card home-card" aria-labelledby="rating-title">
        <Title />
        {live.status === 'loading' ? (
          <p className="muted">Reading your rating from Lichess…</p>
        ) : (
          <p className="muted">{live.error?.message ?? 'I could not reach Lichess.'} Your rating shows here once it can.</p>
        )}
        <Link to="/rating" className="small">
          Open My rating
        </Link>
      </section>
    )
  }

  const perf = headlinePerf(ratings)
  const p = perf ? ratings.perfs[perf] : undefined
  if (!perf || !hasRating(p)) {
    return (
      <section className="card home-card" aria-labelledby="rating-title">
        <Title />
        <p>No Lichess rating yet. It appears after your first rated games on Lichess.</p>
        <Link to="/rating" className="small">
          Open My rating
        </Link>
      </section>
    )
  }

  const { low, high } = ratingRange(p)
  const rapid = ratings.perfs.rapid
  return (
    <section className="card home-card" aria-labelledby="rating-title">
      <Title />
      <div className="row between wrap">
        <div className="big-number" data-testid="home-rating">
          {ratingText(p)}
        </div>
        <span className="chip blue">
          {PERF_LABEL[perf]} · {plural(p.games, 'game')}
        </span>
      </div>
      <p className="muted small rating-range">
        Lichess's range: {low} to {high}
        {isProvisional(p) ? '. Provisional: Lichess is not sure yet.' : '.'}
      </p>
      <RangeBar rating={p.rating} low={low} high={high} />
      <p className="muted small">
        {perf !== 'rapid' && !hasRating(rapid) ? 'No rapid (10+0) rating yet. ' : ''}
        {live.status !== 'cached'
          ? 'As of '
          : live.error?.kind === 'rate-limit'
            ? 'Lichess asked to wait a minute; as of '
            : 'Could not reach Lichess; as of '}
        {asOfText(ratings.fetchedAt)}.
      </p>
      <Link to="/rating" className="small">
        See your rating <ArrowRight size={14} aria-hidden />
      </Link>
    </section>
  )
}
