// A tiny line chart of the puzzle rating over the last puzzles (no chart library).

interface Props {
  values: number[]
  /** Read out by screen readers. */
  label: string
}

const WIDTH = 220
const HEIGHT = 56
const PAD = 5

export default function RatingChart({ values, label }: Props) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (i: number) => PAD + (i / (values.length - 1)) * (WIDTH - PAD * 2)
  const y = (v: number) => HEIGHT - PAD - ((v - min) / span) * (HEIGHT - PAD * 2)
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const last = values.length - 1

  return (
    <div className="rating-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={label} preserveAspectRatio="none">
        <path className="rating-chart-area" d={`M${x(0).toFixed(1)},${HEIGHT} L${points.join(' L')} L${x(last).toFixed(1)},${HEIGHT} Z`} />
        <polyline className="rating-chart-line" points={points.join(' ')} />
      </svg>
      <span
        className="rating-chart-dot"
        style={{ left: `${(x(last) / WIDTH) * 100}%`, top: `${(y(values[last]) / HEIGHT) * 100}%` }}
        aria-hidden
      />
    </div>
  )
}
