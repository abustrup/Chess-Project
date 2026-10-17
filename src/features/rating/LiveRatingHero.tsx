import { Link } from 'react-router-dom'
import { Download, Loader2, RefreshCw, Settings as SettingsIcon } from 'lucide-react'
import { translate, type ChesscomMap } from './chesscomMap'
import {
  PERF_HINT,
  PERF_LABEL,
  asOfText,
  hasRating,
  isProvisional,
  ratingRange,
  ratingText,
  shownPerfs,
  trendText,
  type LichessRatings,
  type PerfKey,
} from './lichessRating'
import type { LiveRating } from './useLichessRating'

// The headline of "My rating": his live Lichess ratings, rapid first, each with Lichess's own range, and a
// chess.com translation under an established rating. This is the only part that stays visible in zen mode.

const NOT_A_RATING =
  'Your rating comes from rated games on Lichess. Games against the bot and pasted games are for practice and review; they do not change it.'

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
}

function PerfBlock({ perf, ratings, map }: { perf: PerfKey; ratings: LichessRatings; map: ChesscomMap | null }) {
  const p = ratings.perfs[perf]
  const label = PERF_LABEL[perf]
  if (!hasRating(p)) {
    return (
      <div className="rt-perf empty" data-perf={perf}>
        <div className="rt-perf-head">
          <h2 className="rt-perf-name">{label}</h2>
          <span className="faint small">{PERF_HINT[perf]}</span>
        </div>
        <p className="rt-perf-none">
          {perf === 'rapid'
            ? `No rapid rating yet. It appears after your first rated 10+0 games on Lichess and loses the "?" once Lichess is sure enough.`
            : `No ${label.toLowerCase()} rating yet.`}
        </p>
      </div>
    )
  }
  const provisional = isProvisional(p)
  const { low, high } = ratingRange(p)
  const trend = trendText(p)
  const chesscom = translate(map, perf, p)
  const table = map?.maps[perf]
  const outsideTable =
    !provisional && !chesscom && !!table && (p.rating < table.rows[0].lichess || p.rating > table.rows[table.rows.length - 1].lichess)
  return (
    <div className="rt-perf" data-perf={perf}>
      <div className="rt-perf-head">
        <h2 className="rt-perf-name">{label}</h2>
        <span className="faint small">{PERF_HINT[perf]}</span>
      </div>
      <div className="rt-perf-number">
        <span className="big-number rt-elo" data-testid={`rating-${perf}`}>
          {ratingText(p)}
        </span>
        <span className="rt-perf-chips">
          {provisional && <span className="chip gold">provisional</span>}
          <span className="chip blue">{plural(p.games, 'game')}</span>
        </span>
      </div>
      <p className="rt-perf-range">
        Lichess's range:{' '}
        <strong>
          {low} to {high}
        </strong>
        {trend && <span className="faint"> · {trend}</span>}
      </p>
      <p className="faint small">Lichess is fairly sure your rating is inside this range. It narrows as you play.</p>
      {provisional && (
        <p className="muted small">
          Lichess is not sure yet. The "?" goes away once it is, after a few more rated games. Until then there is no
          chess.com translation.
        </p>
      )}
      {chesscom && (
        <div className="rt-chesscom" data-testid={`chesscom-${perf}`}>
          <p>
            Translated to chess.com {chesscom.chesscom}: about <strong>{chesscom.center}</strong> (8 in 10 similar
            players: {chesscom.low} to {chesscom.high}).
          </p>
          <p className="faint small">
            From {chesscom.pairs} players with accounts on both sites, {chesscom.near} of them within{' '}
            {chesscom.similarWithin} points of this rating (looked up {chesscom.sourceDate}). The two sites use different
            scales, and Lichess itself advises against comparing them. You only get a real chess.com rating by playing
            about 20 rated games there.
          </p>
        </div>
      )}
      {outsideTable && (
        <p className="faint small">No chess.com translation: too few matched players at this rating.</p>
      )}
    </div>
  )
}

function StatusLine({ live }: { live: LiveRating }) {
  const when = live.ratings ? asOfText(live.ratings.fetchedAt) : ''
  if (live.status === 'cached') {
    return (
      <div className="callout warn rt-status" role="status">
        <span>
          {live.error?.message} Showing your rating as of <strong>{when}</strong>.
        </span>
        <button className="btn small" onClick={live.refresh} disabled={live.busy}>
          <RefreshCw size={14} aria-hidden /> Check again
        </button>
      </div>
    )
  }
  return (
    <div className="row wrap rt-status">
      <span className="faint small" data-testid="rating-as-of">
        {live.busy ? 'Checking Lichess…' : `From lichess.org, as of ${when}`}
      </span>
      <button className="btn small ghost" onClick={live.refresh} disabled={live.busy} aria-label="Check Lichess again">
        {live.busy ? <Loader2 size={14} className="rt-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
      </button>
    </div>
  )
}

export default function LiveRatingHero({
  username,
  live,
  map,
  onImport,
}: {
  username: string
  live: LiveRating
  map: ChesscomMap | null
  onImport: () => void
}) {
  if (live.status === 'no-user') {
    return (
      <section className="card rt-hero">
        <div className="eyebrow">Your Lichess rating</div>
        <h2 className="rt-hero-title">Add your Lichess username</h2>
        <p className="muted">
          Your rating is the one Lichess gives you for your rated games. Add your Lichess username and it shows here,
          read live from lichess.org. No password needed.
        </p>
        <div className="row wrap rt-hero-actions">
          <Link className="btn primary" to="/settings">
            <SettingsIcon size={16} aria-hidden /> Add it in Settings
          </Link>
          <button className="btn" onClick={onImport}>
            <Download size={16} aria-hidden /> Import my Lichess games
          </button>
        </div>
        <p className="faint small">{NOT_A_RATING}</p>
      </section>
    )
  }

  if (!live.ratings) {
    return (
      <section className="card rt-hero" aria-busy={live.status === 'loading'}>
        <div className="eyebrow">Your Lichess rating</div>
        {live.status === 'loading' ? (
          <p className="muted row">
            <Loader2 size={16} className="rt-spin" aria-hidden /> Reading the rating of {username} from Lichess…
          </p>
        ) : (
          <div className="callout warn" role="alert">
            <span>
              {live.error?.message} {live.error?.kind === 'not-found' ? '' : 'Please try again in a moment.'}
            </span>
            <button className="btn small" onClick={live.refresh} disabled={live.busy}>
              <RefreshCw size={14} aria-hidden /> Check again
            </button>
          </div>
        )}
        <p className="faint small">{NOT_A_RATING}</p>
      </section>
    )
  }

  const ratings = live.ratings
  return (
    <section className="card rt-hero" aria-labelledby="rt-live-title">
      <div className="row between wrap">
        <div className="eyebrow" id="rt-live-title">
          Your Lichess rating · {ratings.username}
        </div>
        <StatusLine live={live} />
      </div>
      <div className="rt-perfs">
        {shownPerfs(ratings).map((k) => (
          <PerfBlock key={k} perf={k} ratings={ratings} map={map} />
        ))}
      </div>
      <p className="faint small rt-hero-foot">{NOT_A_RATING}</p>
    </section>
  )
}
