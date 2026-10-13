import { useEffect, useRef } from 'react'

/**
 * Two-column move list. `sans` are the moves in order (white first unless `startsWithBlack`).
 * `currentPly` is 1-based (1 = after white's first move); 0 = start position.
 */
export default function MoveList({
  sans,
  currentPly,
  onSelect,
  startsWithBlack = false,
  classes,
}: {
  sans: string[]
  currentPly: number
  onSelect?: (ply: number) => void
  startsWithBlack?: boolean
  /** optional css class per ply (1-based index -> class), e.g. 'q-blunder' */
  classes?: Record<number, string>
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current?.querySelector('.mv.current') as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [currentPly, sans.length])

  const offset = startsWithBlack ? 1 : 0
  const rows: { no: number; w?: { san: string; ply: number }; b?: { san: string; ply: number } }[] = []
  sans.forEach((san, i) => {
    const slot = i + offset
    const rowIdx = Math.floor(slot / 2)
    if (!rows[rowIdx]) rows[rowIdx] = { no: rowIdx + 1 }
    if (slot % 2 === 0) rows[rowIdx].w = { san, ply: i + 1 }
    else rows[rowIdx].b = { san, ply: i + 1 }
  })

  const cell = (m?: { san: string; ply: number }) =>
    m ? (
      <span
        className={`mv ${m.ply === currentPly ? 'current' : ''} ${classes?.[m.ply] ?? ''}`}
        onClick={() => onSelect?.(m.ply)}
      >
        {m.san}
      </span>
    ) : (
      <span />
    )

  return (
    <div className="movelist" ref={ref}>
      {rows.map((r) => (
        <div key={r.no} style={{ display: 'contents' }}>
          <span className="no">{r.no}</span>
          {cell(r.w)}
          {cell(r.b)}
        </div>
      ))}
    </div>
  )
}
