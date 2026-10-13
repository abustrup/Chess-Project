import { ChevronDown, Flame, Trophy } from 'lucide-react'
import type { PuzzleStats } from '../../types'
import RatingChart from './RatingChart'
import { accuracyPercent, themeRows, weakestRows } from './insights'

interface Props {
  stats: PuzzleStats
  /** Theme key -> friendly name, for every theme that can be trained. */
  themeNames: ReadonlyMap<string, string>
  open: boolean
  onToggle: () => void
  onTrain: (themeKey: string) => void
  /** Best Puzzle Rush score, if the player ever played it. */
  rushBest: number
}

const CHART_POINTS = 40

/** "Your stats": rating and its graph, streaks, and how you do on each theme. Collapsible, hidden in zen mode. */
export default function StatsPanel({ stats, themeNames, open, onToggle, onTrain, rushBest }: Props) {
  const played = stats.solved + stats.failed
  const accuracy = accuracyPercent(stats)
  const rows = themeRows(stats, new Set(themeNames.keys()))
  const weak = weakestRows(rows)
  const weakKeys = new Set(weak.map((w) => w.key))
  const series = stats.history.slice(-CHART_POINTS).map((h) => h.ratingAfter)

  return (
    <section className="card stats-panel zen-hide" aria-labelledby="puzzle-stats-title">
      <button className="stats-toggle" onClick={onToggle} aria-expanded={open} aria-controls="puzzle-stats-body">
        <span className="card-title" id="puzzle-stats-title">
          Your stats
        </span>
        <span className="stats-summary">
          <strong>{stats.rating}</strong>
          <ChevronDown size={18} className={open ? 'chev open' : 'chev'} aria-hidden />
        </span>
      </button>

      {open && (
        <div id="puzzle-stats-body" className="stats-body">
          {played === 0 ? (
            <p className="muted small">
              Solve a few puzzles and your stats show up here: your rating, your streak, and the themes that need practice.
            </p>
          ) : (
            <>
              <div className="stats-rating">
                <div>
                  <div className="big-number">{stats.rating}</div>
                  <div className="small faint">puzzle rating</div>
                </div>
                <RatingChart values={series} label={`Your puzzle rating over the last ${series.length} puzzles`} />
              </div>

              <dl className="stat-tiles">
                <div>
                  <dt>Solved</dt>
                  <dd>{stats.solved}</dd>
                </div>
                <div>
                  <dt>Missed</dt>
                  <dd>{stats.failed}</dd>
                </div>
                <div>
                  <dt>Accuracy</dt>
                  <dd>{accuracy}%</dd>
                </div>
                <div>
                  <dt>Streak</dt>
                  <dd>{stats.streak}</dd>
                </div>
              </dl>
              <p className="small muted stats-records">
                <span>
                  <Flame size={15} aria-hidden /> Best streak: {stats.bestStreak}
                </span>
                {rushBest > 0 && (
                  <span>
                    <Trophy size={15} aria-hidden /> Best Puzzle Rush: {rushBest}
                  </span>
                )}
              </p>

              {weak.length > 0 && (
                <div className="weak-box">
                  <div className="stats-heading">Needs practice</div>
                  {weak.map((row) => (
                    <div className="weak-row" key={row.key}>
                      <div>
                        <strong>{themeNames.get(row.key)}</strong>
                        <div className="small muted">
                          {row.solved} of {row.total} solved
                        </div>
                      </div>
                      <button className="btn small primary" onClick={() => onTrain(row.key)}>
                        Train this
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {rows.length > 0 && (
                <div>
                  <div className="stats-heading">Accuracy by theme</div>
                  <ul className="theme-bars">
                    {rows.map((row) => (
                      <li key={row.key} className={weakKeys.has(row.key) ? 'is-weak' : undefined}>
                        <span className="theme-bars-name">{themeNames.get(row.key)}</span>
                        <span className="progress" aria-hidden>
                          <span style={{ width: `${Math.round(row.accuracy * 100)}%` }} />
                        </span>
                        <span className="theme-bars-count small muted">
                          {row.solved}/{row.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
