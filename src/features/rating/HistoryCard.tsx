import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { GameRecord } from '../../types'
import { ratingHistory, type HistoryPoint } from './history'
import { PERF_LABEL, hasRating, ratingRange, shownPerfs, type LichessRatings, type PerfKey, type PerfRating } from './lichessRating'

// "How your rating moved": one small line per time control, from the saved Lichess games plus the live rating.
// No chart library: a hand-drawn SVG drawn at the width of its card, so the text stays readable on a phone too.

/** The width of an element in CSS pixels, following resizes (600 until it has been measured). */
function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWidth(Math.max(260, Math.round(el.getBoundingClientRect().width)))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function RatingLine({ perf, points, now }: { perf: PerfKey; points: HistoryPoint[]; now: PerfRating }) {
  const { low, high } = ratingRange(now)
  const [wrap, W] = useWidth<HTMLDivElement>()
  const H = W < 500 ? 170 : 210
  const padL = 40
  const padR = 66
  const padT = 14
  const padB = 26
  const values = [...points.map((p) => p.rating), low, high]
  const min = Math.floor((Math.min(...values) - 20) / 100) * 100
  const max = Math.ceil((Math.max(...values) + 20) / 100) * 100
  const n = points.length
  const x = (i: number) => padL + (n === 1 ? 0.5 : i / (n - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB)
  const ticks: number[] = []
  for (let t = min; t <= max; t += max - min > 800 ? 200 : 100) ticks.push(t)
  const last = points[n - 1]
  const lastX = x(n - 1)
  const first = points[0]
  return (
    <div className="rt-chart-wrap" ref={wrap}>
      <svg
        className="rt-chart"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Chart: your ${PERF_LABEL[perf].toLowerCase()} rating over ${n - 1} saved games, from ${first.rating} to ${last.rating} now.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="rt-grid" x1={padL} y1={y(t)} x2={W - padR + 20} y2={y(t)} />
            <text className="rt-axis" x={padL - 6} y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <polyline className="rt-hist-line" points={points.map((p, i) => `${x(i).toFixed(1)},${y(p.rating).toFixed(1)}`).join(' ')} />
        {points.slice(0, -1).map((p, i) => (
          <circle key={`${p.date}-${i}`} className="rt-hist-dot" cx={x(i)} cy={y(p.rating)} r={3.5}>
            <title>{`Before your game on ${shortDate(p.date)}: ${p.rating}`}</title>
          </circle>
        ))}
        {/* Lichess's range for the rating now, as a bar at the last point */}
        <line className="rt-hist-range" x1={lastX + 14} y1={y(high)} x2={lastX + 14} y2={y(low)} />
        <line className="rt-hist-cap" x1={lastX + 9} y1={y(high)} x2={lastX + 19} y2={y(high)} />
        <line className="rt-hist-cap" x1={lastX + 9} y1={y(low)} x2={lastX + 19} y2={y(low)} />
        <circle className="rt-hist-now" cx={lastX} cy={y(last.rating)} r={6}>
          <title>{`Now: ${last.rating} (Lichess's range ${low} to ${high})`}</title>
        </circle>
        <text className="rt-dot-label" x={lastX + 24} y={y(last.rating) + 4}>
          {last.rating}
        </text>
        <text className="rt-axis" x={padL} y={H - 6}>
          {shortDate(first.date)}
        </text>
        <text className="rt-axis" x={lastX} y={H - 6} textAnchor="end">
          now
        </text>
      </svg>
    </div>
  )
}

export default function HistoryCard({
  games,
  ratings,
  username,
}: {
  games: GameRecord[]
  ratings: LichessRatings
  username: string
}) {
  const lines = useMemo(
    () =>
      shownPerfs(ratings)
        .filter((k) => hasRating(ratings.perfs[k]))
        .map((k) => {
          const now = ratings.perfs[k]!
          return { perf: k, now, history: ratingHistory(games, username, k, { rating: now, fetchedAt: ratings.fetchedAt }) }
        }),
    [games, ratings, username],
  )
  if (lines.length === 0) return null

  return (
    <section className="card zen-hide" aria-labelledby="rt-history-title">
      <h2 id="rt-history-title">How your rating moved</h2>
      {lines.map(({ perf, now, history }) => {
        const saved = history.gamesFound
        const missing = Math.max(0, now.games - saved)
        const label = PERF_LABEL[perf].toLowerCase()
        // Missing games only make the line jump when they fall between two saved games (a gap); missing games
        // before the first or after the last saved one are simply not on the line.
        const missingText =
          missing > 0
            ? ` ${missing} of your ${now.games} rated ${label} games ${missing === 1 ? 'is' : 'are'} not saved here${
                history.gaps > 0
                  ? '; where games are missing in between, the line jumps.'
                  : `, so the line leaves ${missing === 1 ? 'it' : 'them'} out.`
              }`
            : history.gaps > 0
              ? ' Some games in between are not saved here, so the line jumps there.'
              : ''
        return (
          <div key={perf} className="rt-history">
            <h3>{PERF_LABEL[perf]}</h3>
            {history.points.length >= 2 ? (
              <>
                <RatingLine perf={perf} points={history.points} now={now} />
                <p className="faint small">
                  Your rating before each of the {saved} rated {label} game
                  {saved === 1 ? '' : 's'} saved in this app, then your rating now.
                  {history.startLeftOut ? ' Lichess starts everyone at 1500, so the line begins after your first game.' : ''}
                  {missingText}
                </p>
              </>
            ) : saved > 0 ? (
              <p className="muted small">
                Lichess starts everyone at 1500, so the line of your {label} rating begins after your first game. It
                appears here once one more rated {label} game is saved.
              </p>
            ) : (
              <p className="muted small">
                Import your Lichess games below and the line of your {label} rating appears here, game by game.
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}
