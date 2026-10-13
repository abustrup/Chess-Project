// A tiny line chart (no chart library). Shows how a number changed over time, e.g. the puzzle rating.
// The line stretches to the width of its card; the end dot is a normal element so it stays round.

interface Props {
  values: number[]
  /** Read out by screen readers, e.g. "Puzzle rating over your last 12 puzzles" */
  label: string
}

const WIDTH = 240
const HEIGHT = 64
const PAD = 6

export default function Sparkline({ values, label }: Props) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (i: number) => PAD + (i / (values.length - 1)) * (WIDTH - PAD * 2)
  const y = (v: number) => HEIGHT - PAD - ((v - min) / span) * (HEIGHT - PAD * 2)
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const last = values.length - 1
  const area = `M${x(0).toFixed(1)},${HEIGHT} L${points.join(' L')} L${x(last).toFixed(1)},${HEIGHT} Z`

  return (
    <div className="spark">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={label} preserveAspectRatio="none">
        <path className="spark-area" d={area} />
        <polyline className="spark-line" points={points.join(' ')} />
      </svg>
      <span
        className="spark-dot"
        style={{ left: `${(x(last) / WIDTH) * 100}%`, top: `${(y(values[last]) / HEIGHT) * 100}%` }}
        aria-hidden
      />
    </div>
  )
}
