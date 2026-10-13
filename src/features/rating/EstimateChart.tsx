import type { EstimateDetail } from './estimate'

// Two small SVG charts for "How I worked this out". No chart library needed.

const Z = 1.28 // same "4 out of 5" range as the headline

/** One row per piece of evidence: a dot (its Elo) with a bar showing how sure it is, plus the final answer. */
export function EvidenceChart({ detail }: { detail: EstimateDetail }) {
  const rows = [
    ...detail.parts.map((p) => ({
      label: p.label,
      short: shortLabel(p.key),
      elo: p.elo,
      half: Z * p.se,
      weight: p.weight,
      final: false,
    })),
    {
      label: 'Estimate',
      short: 'Estimate',
      elo: detail.elo,
      half: (detail.high - detail.low) / 2,
      weight: 1,
      final: true,
    },
  ]
  const lo = Math.min(...rows.map((r) => r.elo - r.half))
  const hi = Math.max(...rows.map((r) => r.elo + r.half))
  const min = Math.floor((lo - 40) / 100) * 100
  const max = Math.ceil((hi + 40) / 100) * 100
  const W = 600
  const left = 112
  const right = W - 16
  const x = (v: number) => left + ((v - min) / (max - min)) * (right - left)
  const rowH = 38
  const top = 14
  const H = top + rows.length * rowH + 30
  const ticks: number[] = []
  const step = max - min > 900 ? 200 : 100
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) ticks.push(t)

  return (
    <div className="rt-chart-wrap">
      <svg
        className="rt-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Chart of the pieces of evidence and the final estimate of ${detail.elo}.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="rt-grid" x1={x(t)} y1={top - 6} x2={x(t)} y2={top + rows.length * rowH} />
            <text className="rt-axis" x={x(t)} y={H - 8} textAnchor="middle">
              {t}
            </text>
          </g>
        ))}
        <rect
          className="rt-final-band"
          x={x(detail.low)}
          y={top - 6}
          width={x(detail.high) - x(detail.low)}
          height={rows.length * rowH}
          rx={6}
        />
        {rows.map((r, i) => {
          const y = top + i * rowH + rowH / 2
          return (
            <g key={r.label}>
              <text className={`rt-row-label ${r.final ? 'final' : ''}`} x={0} y={y + 4}>
                {r.short}
              </text>
              <line
                className={`rt-bar ${r.final ? 'final' : ''}`}
                x1={x(r.elo - r.half)}
                y1={y}
                x2={x(r.elo + r.half)}
                y2={y}
              />
              <line
                className={`rt-cap ${r.final ? 'final' : ''}`}
                x1={x(r.elo - r.half)}
                y1={y - 5}
                x2={x(r.elo - r.half)}
                y2={y + 5}
              />
              <line
                className={`rt-cap ${r.final ? 'final' : ''}`}
                x1={x(r.elo + r.half)}
                y1={y - 5}
                x2={x(r.elo + r.half)}
                y2={y + 5}
              />
              <circle className={`rt-dot ${r.final ? 'final' : ''}`} cx={x(r.elo)} cy={y} r={r.final ? 7 : 5.5} />
              <text className="rt-dot-label" x={x(r.elo)} y={y - 11} textAnchor="middle">
                {r.elo}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function shortLabel(key: 'results' | 'moves' | 'prior'): string {
  return key === 'results' ? 'Results' : key === 'moves' ? 'Your moves' : 'Your guess'
}

/** Game by game: what the quality of the moves in each analysed game would suggest, with the final range behind it. */
export function GameTrendChart({ detail }: { detail: EstimateDetail }) {
  const points = detail.perGame.map((g, i) => ({ ...g, i })).filter((g) => g.moveElo !== undefined)
  if (points.length < 2) {
    return <p className="faint small">Analyse at least two games to see how your play changes from game to game.</p>
  }
  const W = 600
  const H = 170
  const padL = 40
  const padR = 12
  const padT = 12
  const padB = 24
  const values = [...points.map((p) => p.moveElo!), detail.low, detail.high]
  const min = Math.floor((Math.min(...values) - 40) / 100) * 100
  const max = Math.ceil((Math.max(...values) + 40) / 100) * 100
  const n = detail.perGame.length
  const x = (i: number) => padL + (n === 1 ? 0.5 : i / (n - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB)
  const line = points.map((p) => `${x(p.i).toFixed(1)},${y(p.moveElo!).toFixed(1)}`).join(' ')
  const ticks: number[] = []
  for (let t = min; t <= max; t += max - min > 800 ? 200 : 100) ticks.push(t)

  return (
    <div className="rt-chart-wrap">
      <svg
        className="rt-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Chart: the playing strength shown in each analysed game, oldest on the left."
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="rt-grid" x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} />
            <text className="rt-axis" x={padL - 6} y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <rect
          className="rt-final-band"
          x={padL}
          y={y(detail.high)}
          width={W - padL - padR}
          height={y(detail.low) - y(detail.high)}
        />
        <line className="rt-final-line" x1={padL} y1={y(detail.elo)} x2={W - padR} y2={y(detail.elo)} />
        <polyline className="rt-trend" points={line} />
        {points.map((p) => (
          <circle
            key={p.id}
            className={`rt-game-dot ${p.score === 1 ? 'win' : p.score === 0 ? 'loss' : 'draw'}`}
            cx={x(p.i)}
            cy={y(p.moveElo!)}
            r={5}
          >
            <title>{`Game ${p.i + 1}: moves like a ${p.moveElo} player${p.score === 1 ? ' (won)' : p.score === 0 ? ' (lost)' : ''}`}</title>
          </circle>
        ))}
        <text className="rt-axis" x={padL} y={H - 6}>
          older games
        </text>
        <text className="rt-axis" x={W - padR} y={H - 6} textAnchor="end">
          newer games
        </text>
      </svg>
    </div>
  )
}
