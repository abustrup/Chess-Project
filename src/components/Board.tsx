import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard, defaultPieces } from 'react-chessboard'
import type { BoardArrow, BoardHighlight, Side } from '../types'

// The one chessboard used everywhere in the app. It is "controlled": the parent owns the position (fen)
// and this component just draws it, lets the user move pieces (click or drag) and reports moves.

export interface BoardMove {
  from: string
  to: string
  promotion?: string
  san: string
  uci: string
  fenBefore: string
  fenAfter: string
  captured?: string
  isCheck: boolean
  isCheckmate: boolean
}

export interface BoardProps {
  fen: string
  orientation?: Side
  /** Which side's pieces the user may move. false = look only. */
  interactive?: Side | 'both' | false
  /**
   * Called when the user makes a LEGAL move. Return false to reject it (piece snaps back);
   * otherwise update `fen` yourself.
   */
  onMove?: (move: BoardMove) => boolean | void
  /** Highlighted last move [from, to] */
  lastMove?: [string, string] | null
  arrows?: BoardArrow[]
  highlights?: BoardHighlight[]
  /** Show dots for legal moves of the selected piece (default true) */
  showLegalMoves?: boolean
  showCoordinates?: boolean
  /** Let the user draw their own arrows with right-click (default false) */
  allowUserArrows?: boolean
  animationMs?: number
  className?: string
  /** Squares that get a special red/green "hint" glow, e.g. the target of a hint */
  hintSquares?: string[]
}

const ARROW_COLORS: Record<string, string> = {
  green: 'rgba(129, 182, 76, 0.85)',
  red: 'rgba(228, 87, 75, 0.85)',
  yellow: 'rgba(240, 185, 74, 0.9)',
  blue: 'rgba(94, 163, 234, 0.85)',
}
const HIGHLIGHT_COLORS: Record<string, string> = {
  green: 'rgba(129, 182, 76, 0.55)',
  red: 'rgba(228, 87, 75, 0.55)',
  yellow: 'rgba(240, 185, 74, 0.55)',
  blue: 'rgba(94, 163, 234, 0.55)',
}

const PROMO_PIECES = ['q', 'r', 'b', 'n'] as const

function fileRankIsPromotion(game: Chess, from: Square, to: Square): boolean {
  const piece = game.get(from)
  if (!piece || piece.type !== 'p') return false
  const rank = to[1]
  return (piece.color === 'w' && rank === '8') || (piece.color === 'b' && rank === '1')
}

export default function Board({
  fen,
  orientation = 'white',
  interactive = false,
  onMove,
  lastMove,
  arrows,
  highlights,
  showLegalMoves = true,
  showCoordinates = true,
  allowUserArrows = false,
  animationMs = 180,
  className,
  hintSquares,
}: BoardProps) {
  const game = useMemo(() => {
    try {
      return new Chess(fen)
    } catch {
      return new Chess()
    }
  }, [fen])

  const [selected, setSelected] = useState<Square | null>(null)
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null)

  // clear selection whenever the position changes
  useEffect(() => {
    setSelected(null)
    setPromo(null)
  }, [fen])

  const turn = game.turn() // 'w' | 'b'
  const canMoveColor = (color: 'w' | 'b') =>
    interactive === 'both' || (interactive === 'white' && color === 'w') || (interactive === 'black' && color === 'b')

  const legalTargets = useMemo(() => {
    if (!selected) return new Map<string, boolean>()
    const map = new Map<string, boolean>() // square -> isCapture
    for (const m of game.moves({ square: selected, verbose: true })) map.set(m.to, m.isCapture() || m.isEnPassant())
    return map
  }, [selected, game])

  function attempt(from: Square, to: Square, promotion?: string): boolean {
    let probe: Chess
    try {
      probe = new Chess(fen)
    } catch {
      return false
    }
    let mv
    try {
      mv = probe.move({ from, to, promotion })
    } catch {
      return false
    }
    const result = onMove?.({
      from: mv.from,
      to: mv.to,
      promotion: mv.promotion,
      san: mv.san,
      uci: mv.from + mv.to + (mv.promotion ?? ''),
      fenBefore: fen,
      fenAfter: probe.fen(),
      captured: mv.captured,
      isCheck: probe.isCheck(),
      isCheckmate: probe.isCheckmate(),
    })
    setSelected(null)
    return result !== false
  }

  function tryMove(from: Square, to: Square): boolean {
    if (fileRankIsPromotion(game, from, to) && game.moves({ square: from, verbose: true }).some((m) => m.to === to)) {
      setPromo({ from, to })
      return true // the pending promotion UI takes over
    }
    return attempt(from, to)
  }

  /* ---- styles for squares -------------------------------------------------- */
  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {}
    const add = (sq: string, layer: string) => {
      const prev = styles[sq]?.background as string | undefined
      styles[sq] = { ...styles[sq], background: prev ? `${layer}, ${prev}` : layer }
    }
    if (lastMove) {
      add(lastMove[0], 'linear-gradient(var(--sq-last), var(--sq-last))')
      add(lastMove[1], 'linear-gradient(var(--sq-last), var(--sq-last))')
    }
    for (const h of highlights ?? []) {
      const c = HIGHLIGHT_COLORS[h.color ?? 'green'] ?? h.color!
      add(h.square, `linear-gradient(${c}, ${c})`)
    }
    for (const sq of hintSquares ?? []) {
      add(sq, 'radial-gradient(circle, rgba(94,163,234,0.75) 0%, rgba(94,163,234,0.0) 72%)')
    }
    if (game.isCheck()) {
      // find the king of the side to move
      const board = game.board()
      for (const row of board)
        for (const p of row)
          if (p && p.type === 'k' && p.color === turn)
            add(p.square, 'radial-gradient(circle, rgba(228,87,75,0.9) 0%, rgba(228,87,75,0.35) 45%, rgba(228,87,75,0) 75%)')
    }
    if (selected) {
      add(selected, 'linear-gradient(var(--sq-select), var(--sq-select))')
      if (showLegalMoves) {
        legalTargets.forEach((isCapture, sq) => {
          add(
            sq,
            isCapture
              ? 'radial-gradient(circle, transparent 58%, rgba(20,20,20,0.28) 60%, rgba(20,20,20,0.28) 74%, transparent 76%)'
              : 'radial-gradient(circle, rgba(20,20,20,0.28) 0%, rgba(20,20,20,0.28) 17%, transparent 19%)',
          )
        })
      }
    }
    return styles
  }, [lastMove, highlights, hintSquares, selected, legalTargets, showLegalMoves, game, turn])

  const arrowList = useMemo(
    () =>
      (arrows ?? []).map((a) => ({
        startSquare: a.from,
        endSquare: a.to,
        color: ARROW_COLORS[a.color ?? 'green'] ?? a.color ?? ARROW_COLORS.green,
      })),
    [arrows],
  )

  const promoColor = promo ? game.get(promo.from)?.color ?? 'w' : 'w'

  return (
    <div className={`board-frame ${className ?? ''}`}>
      <Chessboard
        options={{
          id: 'cc-board',
          position: fen,
          boardOrientation: orientation,
          allowDragging: !!interactive,
          allowDrawingArrows: allowUserArrows,
          clearArrowsOnClick: true,
          showNotation: showCoordinates,
          showAnimations: animationMs > 0,
          animationDurationInMs: animationMs,
          arrows: arrowList,
          squareStyles,
          boardStyle: { width: '100%', height: '100%', borderRadius: 6 },
          lightSquareStyle: { backgroundColor: 'var(--sq-light)' },
          darkSquareStyle: { backgroundColor: 'var(--sq-dark)' },
          lightSquareNotationStyle: { color: 'var(--sq-dark)', fontWeight: 700, fontSize: 11 },
          darkSquareNotationStyle: { color: 'var(--sq-light)', fontWeight: 700, fontSize: 11 },
          dropSquareStyle: { boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.55)' },
          canDragPiece: ({ piece }) => {
            if (!interactive) return false
            const color = piece.pieceType[0] === 'w' ? 'w' : 'b'
            return canMoveColor(color) && color === turn
          },
          onPieceDrag: ({ square }) => {
            if (square) setSelected(square as Square)
          },
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare || sourceSquare === targetSquare) return false
            return tryMove(sourceSquare as Square, targetSquare as Square)
          },
          onSquareClick: ({ piece, square }) => {
            if (!interactive || promo) return
            const sq = square as Square
            if (selected && selected !== sq && legalTargets.has(sq)) {
              tryMove(selected, sq)
              return
            }
            if (piece) {
              const color = piece.pieceType[0] === 'w' ? 'w' : 'b'
              if (canMoveColor(color) && color === turn) {
                setSelected(selected === sq ? null : sq)
                return
              }
            }
            setSelected(null)
          },
          pieces: defaultPieces,
        }}
      />
      {promo && (
        <div className="promo-overlay" onClick={() => setPromo(null)}>
          <div className="promo-box" onClick={(e) => e.stopPropagation()}>
            {PROMO_PIECES.map((p) => {
              const key = `${promoColor}${p.toUpperCase()}`
              const Piece = defaultPieces[key]
              return (
                <button
                  key={p}
                  aria-label={`Promote to ${p}`}
                  onClick={() => {
                    const { from, to } = promo
                    setPromo(null)
                    attempt(from, to, p)
                  }}
                >
                  {Piece ? Piece() : p.toUpperCase()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
