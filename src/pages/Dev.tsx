// Developer page at /#/dev for testing the board and engine together. It exists only in development (see App.tsx).
import { useEffect, useState } from 'react'
import { Chess } from 'chess.js'
import Board, { type BoardMove } from '../components/Board'
import EvalBar from '../components/EvalBar'
import MoveList from '../components/MoveList'
import { getSharedEngine, scoreForWhite } from '../engine/uci'
import { START_FEN } from '../lib/pgnTree'

export default function Dev() {
  const [fen, setFen] = useState(START_FEN)
  const [sans, setSans] = useState<string[]>([])
  const [last, setLast] = useState<[string, string] | null>(null)
  const [cp, setCp] = useState<number | null>(null)
  const [status, setStatus] = useState('engine: loading…')
  const [bestArrow, setBestArrow] = useState<string | null>(null)

  async function think(f: string) {
    try {
      const engine = await getSharedEngine()
      setStatus('engine: thinking…')
      const res = await engine.go({ fen: f, depth: 10, multipv: 2 })
      if (res.lines[0]) setCp(scoreForWhite(f, res.lines[0]))
      setBestArrow(res.bestMove)
      setStatus(`engine ready · depth ${res.depth} · best ${res.bestMove}`)
      return res
    } catch (e) {
      setStatus('engine error: ' + String(e))
    }
  }
  useEffect(() => {
    void think(fen)
  }, [])

  function onMove(m: BoardMove) {
    setFen(m.fenAfter)
    setSans((s) => [...s, m.san])
    setLast([m.from, m.to])
    void think(m.fenAfter).then((res) => {
      if (!res?.bestMove) return
      const g = new Chess(m.fenAfter)
      const mv = g.move({ from: res.bestMove.slice(0, 2), to: res.bestMove.slice(2, 4), promotion: res.bestMove[4] })
      setTimeout(() => {
        setFen(g.fen())
        setSans((s) => [...s, mv.san])
        setLast([mv.from, mv.to])
        void think(g.fen())
      }, 400)
    })
  }

  return (
    <div className="page">
      <h1>Dev lab</h1>
      <p data-testid="status">{status}</p>
      <div className="board-layout">
        <div className="board-col">
          <div className="board-with-eval">
            <EvalBar cpWhite={cp} />
            <Board
              fen={fen}
              interactive="white"
              onMove={onMove}
              lastMove={last}
              arrows={bestArrow ? [{ from: bestArrow.slice(0, 2), to: bestArrow.slice(2, 4), color: 'blue' }] : []}
            />
          </div>
        </div>
        <div className="side-col">
          <div className="card">
            <MoveList sans={sans} currentPly={sans.length} />
          </div>
        </div>
      </div>
    </div>
  )
}
