import type { PgnNode } from '../../../lib/pgnTree'
import { GlyphBadge } from './shared'

/**
 * The moves played so far, as clickable chips ("1. d4 d5 2. Bf4 ..."). Your own moves are tinted so you can
 * see at a glance which ones are yours. `onJump` is left out where jumping back makes no sense (drills).
 */
export function LineSoFar({
  path,
  me,
  currentId,
  onJump,
}: {
  path: PgnNode[]
  me: 'w' | 'b'
  currentId?: string
  onJump?: (nodeId: string) => void
}) {
  if (path.length === 0) return <p className="small faint">No moves yet.</p>
  return (
    <ol className="op-line" aria-label="Moves so far">
      {path.map((n, i) => {
        const showNumber = n.mover === 'w' || i === 0
        const cls = `op-ply ${n.mover === me ? 'mine' : ''} ${n.id === currentId ? 'current' : ''}`
        return (
          <li key={n.id}>
            {showNumber && (
              <span className="op-ply-no">
                {Math.ceil(n.ply / 2)}
                {n.mover === 'w' ? '.' : '...'}
              </span>
            )}
            {onJump ? (
              <button className={cls} onClick={() => onJump(n.id)} aria-label={`Go to move ${n.san}`}>
                {n.san}
                <GlyphBadge nags={n.nags} />
              </button>
            ) : (
              <span className={cls}>
                {n.san}
                <GlyphBadge nags={n.nags} />
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
