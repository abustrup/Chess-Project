import { Link } from 'react-router-dom'
import { ArrowRight, Puzzle } from 'lucide-react'
import Sparkline from './Sparkline'
import type { PuzzleSummary } from './progress'

export default function PuzzleCard({ summary }: { summary: PuzzleSummary }) {
  const played = summary.solved + summary.failed
  if (played === 0) {
    return (
      <section className="card home-card" aria-labelledby="puzzle-title">
        <div className="card-title" id="puzzle-title">
          <Puzzle size={16} aria-hidden /> Puzzle rating
        </div>
        <p>
          Puzzles are small chess problems with one best answer. Solving them is the quickest way to spot tactics in real
          games. You start at {summary.rating}.
        </p>
        <Link className="btn primary" to="/puzzles">
          Solve your first puzzle <ArrowRight size={17} aria-hidden />
        </Link>
      </section>
    )
  }
  const weak = summary.weakest
  return (
    <section className="card home-card" aria-labelledby="puzzle-title">
      <div className="card-title" id="puzzle-title">
        <Puzzle size={16} aria-hidden /> Puzzle rating
      </div>
      <div className="row between wrap">
        <div className="big-number">{summary.rating}</div>
        <span className="chip">
          {summary.solved} solved · {summary.failed} missed
        </span>
      </div>
      <Sparkline values={summary.series} label={`Puzzle rating over your last ${summary.series.length} puzzles`} />
      <div className="puzzle-facts small muted">
        {summary.accuracy !== null && <span>{summary.accuracy}% solved</span>}
        <span>Streak {summary.streak}</span>
        <span>Best streak {summary.bestStreak}</span>
      </div>
      {weak && (
        <p className="small muted">
          Tricky for you: <strong>{weak.label}</strong> ({Math.round(weak.accuracy * 100)}% solved).{' '}
          <Link to={`/puzzles?theme=${encodeURIComponent(weak.key)}`}>Train this</Link>
        </p>
      )}
      <Link className="btn" to="/puzzles">
        Solve more <ArrowRight size={17} aria-hidden />
      </Link>
    </section>
  )
}
