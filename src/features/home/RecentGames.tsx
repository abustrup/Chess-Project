import { Link } from 'react-router-dom'
import { ArrowRight, History } from 'lucide-react'
import type { GameRecord } from '../../types'
import { relativeDay } from './format'
import { accuracyOf, opponentLabel, outcomeOf, type Outcome } from './progress'

const OUTCOME: Record<Outcome, { label: string; chip: string }> = {
  win: { label: 'Win', chip: 'green' },
  loss: { label: 'Loss', chip: 'red' },
  draw: { label: 'Draw', chip: 'gold' },
  open: { label: 'Unfinished', chip: '' },
}

function GameRow({ game, now }: { game: GameRecord; now: Date }) {
  const outcome = OUTCOME[outcomeOf(game)]
  const accuracy = accuracyOf(game)
  return (
    <li className="game-row">
      <span className={`chip ${outcome.chip} game-result`}>{outcome.label}</span>
      <div className="game-main">
        <div className="game-opponent">vs{"\u00a0"}{opponentLabel(game)}</div>
        <div className="small faint">
          As {game.userSide === 'white' ? 'White' : 'Black'} · {game.openingName ?? 'Opening not named'}
        </div>
      </div>
      <div className="game-meta small">
        {accuracy !== null ? (
          <span>
            <strong>{accuracy}%</strong> <span className="faint">accuracy</span>
          </span>
        ) : (
          <span className="faint">Not reviewed yet</span>
        )}
        <span className="faint">{relativeDay(game.date, now)}</span>
      </div>
      <Link className="btn small" to={`/review/${encodeURIComponent(game.id)}`}>
        Review
      </Link>
    </li>
  )
}

export default function RecentGames({ games, now }: { games: GameRecord[]; now: Date }) {
  return (
    <section className="zen-hide" aria-labelledby="games-title">
      <div className="home-section-head">
        <h2 id="games-title">Recent games</h2>
        {games.length > 0 && (
          <Link to="/rating" className="small">
            All games and rating
          </Link>
        )}
      </div>
      {games.length === 0 ? (
        <div className="card home-empty">
          <History size={26} className="faint" aria-hidden />
          <div>
            <h3>No games yet</h3>
            <p className="muted">
              Play your first game against the computer. Afterwards I can show you where it went well and where it went wrong.
            </p>
          </div>
          <Link className="btn" to="/play">
            Play a game <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="card game-list">
          {games.map((game, index) => (
            // ids come from saved data and an imported game can appear twice, so the position keeps keys unique
            <GameRow key={`${index}-${game.id}`} game={game} now={now} />
          ))}
        </ul>
      )}
    </section>
  )
}
