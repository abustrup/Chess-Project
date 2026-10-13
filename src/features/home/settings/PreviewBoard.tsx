import Board from '../../../components/Board'

// A calm middle-game position (a Ruy Lopez), so every kind of piece is on the board.
const FEN = 'r1bqk2r/1pppbppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 4 6'

/** The real board, not clickable. It follows the piece and colour choices as soon as they are made. */
export default function PreviewBoard() {
  return (
    <div className="preview-board">
      <Board fen={FEN} lastMove={['f8', 'e7']} arrows={[{ from: 'd2', to: 'd4', color: 'blue' }]} animationMs={0} />
    </div>
  )
}
