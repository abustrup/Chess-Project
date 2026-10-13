import { useRef } from 'react'
import type { AnalysedMove, Side } from '../../types'
import { winPercent } from '../../lib/evaluation'

// The evaluation graph: the light area is White's share of the winning chances, the dark area is Black's.
// Click or drag to jump to a move. Mistakes and blunders get a coloured dot so you can spot the turning points.

const W = 600
const H = 150

export default function EvalGraph({
  moves,
  ply,
  onSelect,
  userSide,
}: {
  moves: AnalysedMove[]
  ply: number
  onSelect: (ply: number) => void
  userSide: Side
}) {
  const ref = useRef<SVGSVGElement>(null)
  const count = moves.length
  if (!count) return null

  const x = (p: number) => (count === 0 ? 0 : (p / count) * W)
  const y = (cp: number) => H - (winPercent(cp) / 100) * H
  const evalAt = (p: number) => (p === 0 ? moves[0].evalBefore : moves[p - 1].evalAfter)

  const points = Array.from({ length: count + 1 }, (_, p) => `${x(p).toFixed(1)},${y(evalAt(p)).toFixed(1)}`)
  const line = `M${points.join(' L')}`
  const area = `${line} L${W},${H} L0,${H} Z`

  const pick = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box || box.width === 0) return
    const p = Math.round(((clientX - box.left) / box.width) * count)
    onSelect(Math.max(0, Math.min(count, p)))
  }

  return (
    <svg
      ref={ref}
      className="eval-graph"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Evaluation graph. Click to jump to a move. The light area means White is better, the dark area means Black is better."
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        pick(e.clientX)
      }}
      onPointerMove={(e) => e.buttons === 1 && pick(e.clientX)}
    >
      <rect className="eg-black" x={0} y={0} width={W} height={H} />
      <path className="eg-white" d={area} />
      <line className="eg-mid" x1={0} y1={H / 2} x2={W} y2={H / 2} />
      {moves.map((m, i) => {
        if (m.classification !== 'mistake' && m.classification !== 'blunder') return null
        const mine = (m.ply % 2 === 1) === (userSide === 'white')
        return (
          <circle
            key={m.ply}
            className={`eg-dot ${m.classification} ${mine ? 'mine' : 'theirs'}`}
            cx={x(i + 1)}
            cy={y(m.evalAfter)}
            r={mine ? 4.5 : 3.5}
          >
            <title>{`${mine ? 'Your' : "Opponent's"} ${m.classification}: ${m.san}`}</title>
          </circle>
        )
      })}
      <line className="eg-cursor" x1={x(ply)} y1={0} x2={x(ply)} y2={H} />
    </svg>
  )
}
