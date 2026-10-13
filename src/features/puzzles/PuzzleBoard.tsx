import Board, { type BoardMove } from '../../components/Board'
import type { RunState } from './useRun'

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

interface Props {
  /** The puzzle on screen. null = no puzzle yet, so an empty board is shown. */
  run: RunState | null
  /** Called with every legal move the player makes. Return false to send the piece back. */
  onMove: (move: BoardMove) => boolean
  /** Pieces cannot be moved at all (for example between two Puzzle Rush puzzles). */
  locked?: boolean
}

/** The board for the puzzle on screen: shows hints, the last move, and only lets you move when it is your turn. */
export default function PuzzleBoard({ run, onMove, locked = false }: Props) {
  if (!run) return <Board className="puzzle-board is-empty" fen={START_POSITION} />

  const yourTurn = !locked && (run.phase === 'solving' || run.phase === 'wrong')
  const expected = run.start.solution[run.step]
  const hinting = yourTurn && run.hint > 0 && !!expected
  const from = expected?.slice(0, 2)
  const to = expected?.slice(2, 4)

  return (
    <Board
      className="puzzle-board"
      fen={run.fen}
      orientation={run.start.orientation}
      interactive={yourTurn ? run.start.orientation : false}
      onMove={onMove}
      lastMove={run.lastMove}
      hintSquares={hinting ? [from] : undefined}
      arrows={hinting && run.hint === 2 ? [{ from, to, color: 'blue' }] : undefined}
      highlights={run.phase === 'solved' && run.lastMove ? [{ square: run.lastMove[1], color: 'green' }] : undefined}
      animationMs={220}
    />
  )
}
