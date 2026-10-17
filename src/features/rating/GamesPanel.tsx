import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Trash2, Zap } from 'lucide-react'
import type { GameRecord } from '../../types'
import AnalysisProgress from '../review/AnalysisProgress'
import { GAMES_SIZE_WARNING } from '../review/gameStore'
import type { RunState } from '../review/useAnalysisRun'
import AddGames, { type AddMode } from './AddGames'

// "Your games": every stored game with a checkbox (used in "What to work on" or not), plus the buttons to add and analyse games.

const SHOWN_AT_FIRST = 10
/** Typical time to analyse one game on a normal laptop (measured: 4 to 9 seconds for a 40-move game). */
const SECONDS_PER_GAME = 6

function roughTime(seconds: number): string {
  if (seconds < 90) return `${Math.max(5, Math.round(seconds / 5) * 5)} seconds`
  return `${Math.round(seconds / 60)} minutes`
}

function resultOf(g: GameRecord): { text: string; tone: 'green' | 'red' | 'gold' | '' } {
  if (g.result === '1/2-1/2') return { text: 'Draw', tone: 'gold' }
  if (g.result === '*') return { text: 'Unfinished', tone: '' }
  const whiteWon = g.result === '1-0'
  return (whiteWon ? 'white' : 'black') === g.userSide ? { text: 'Win', tone: 'green' } : { text: 'Loss', tone: 'red' }
}

function opponentOf(g: GameRecord): string {
  if (g.botElo !== undefined) return `Computer (about ${g.botElo})`
  const name = g.userSide === 'white' ? g.black : g.white
  const elo = g.userSide === 'white' ? g.blackElo : g.whiteElo
  return elo ? `${name} (${elo})` : name
}

const SOURCE: Record<GameRecord['source'], string> = { app: 'Played here', lichess: 'Lichess', pgn: 'Pasted' }

function dateText(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function GameRow({
  game,
  counted,
  onToggle,
  onDelete,
}: {
  game: GameRecord
  counted: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const result = resultOf(game)
  const accuracy = game.analysis ? Math.round(game.analysis.accuracy[game.userSide]) : null
  return (
    <li className={`rt-game ${counted ? '' : 'off'}`}>
      <label className="rt-game-check">
        <input type="checkbox" checked={counted} onChange={onToggle} />
        <span className="rt-sr">Use this game in What to work on</span>
      </label>
      <span className={`chip ${result.tone}`}>{result.text}</span>
      <div className="rt-game-main">
        <strong className="rt-game-opp">vs {opponentOf(game)}</strong>
        <span className="faint small">
          {game.userSide === 'white' ? 'White' : 'Black'} · {SOURCE[game.source]}
          {dateText(game.date) && ` · ${dateText(game.date)}`}
          {game.openingName && ` · ${game.openingName}`}
        </span>
      </div>
      <span className="rt-game-acc small" title="How close your moves were to the computer's choices">
        {accuracy !== null ? `${accuracy}% accuracy` : <span className="faint">not analysed</span>}
      </span>
      <div className="rt-game-actions">
        <Link className="btn small" to={`/review/${game.id}${game.analysis ? '' : '?auto=1'}`}>
          {game.analysis ? 'Review' : 'Analyse'}
        </Link>
        {confirm ? (
          <button className="btn small danger" onClick={onDelete} onBlur={() => setConfirm(false)} autoFocus>
            Sure?
          </button>
        ) : (
          <button
            className="btn small ghost icon"
            aria-label="Delete this game"
            title="Delete this game"
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </li>
  )
}

export default function GamesPanel({
  games,
  off,
  onToggle,
  onSetAll,
  onDelete,
  addMode,
  onAddMode,
  run,
  onAnalyseAll,
  onCancel,
  storedSize,
}: {
  games: GameRecord[]
  off: Set<string>
  onToggle: (id: string) => void
  onSetAll: (counted: boolean) => void
  onDelete: (id: string) => void
  addMode: AddMode
  onAddMode: (m: AddMode) => void
  run: RunState
  onAnalyseAll: () => void
  onCancel: () => void
  storedSize: number
}) {
  const [showAll, setShowAll] = useState(false)
  const todo = games.filter((g) => !g.analysis).length
  const visible = showAll ? games : games.slice(0, SHOWN_AT_FIRST)
  const counted = games.filter((g) => !off.has(g.id)).length

  return (
    <section className="card zen-hide" id="rt-games" aria-labelledby="rt-games-title">
      <div className="row between wrap">
        <h2 id="rt-games-title">Your games</h2>
        <span className="faint small">
          {games.length} saved · {counted} used in What to work on
        </span>
      </div>

      <AddGames mode={addMode} onMode={onAddMode} />

      {games.length > 0 && (
        <>
          <div className="rt-analyse-all">
            {run.running ? (
              <AnalysisProgress state={run} onCancel={onCancel} />
            ) : (
              <div className="row wrap">
                <button className="btn primary" onClick={onAnalyseAll} disabled={todo === 0}>
                  <Zap size={16} />{' '}
                  {todo === 0
                    ? 'All games analysed'
                    : `Analyse ${todo === games.length ? 'all' : 'the other'} ${todo} game${todo === 1 ? '' : 's'}`}
                </button>
                {todo === 0 ? (
                  <span className="faint small row">
                    <Check size={14} /> Nothing left to do.
                  </span>
                ) : (
                  <span className="faint small">
                    About {roughTime(todo * SECONDS_PER_GAME)}, in your browser. You can cancel at any time.
                  </span>
                )}
              </div>
            )}
            {!run.running && run.analysed > 0 && (
              <div className="callout" role="status">
                Analysed {run.analysed} game{run.analysed === 1 ? '' : 's'}
                {run.durationMs ? ` in ${(run.durationMs / 1000).toFixed(0)} seconds` : ''}.
                {run.failed > 0 && ` ${run.failed} could not be read.`}
              </div>
            )}
            {!run.running && run.error && (
              <div className="callout bad" role="alert">
                {run.error}
              </div>
            )}
          </div>

          {storedSize > GAMES_SIZE_WARNING && (
            <div className="callout warn" role="alert">
              Your saved games are getting big for the browser's storage. Please delete some old games, or new ones may
              not be saved.
            </div>
          )}

          <div className="row wrap rt-select-row">
            <span className="faint small">Tick the games that should count in "What to work on" below.</span>
            <span className="spacer" />
            <button className="btn small ghost" onClick={() => onSetAll(true)}>
              Select all
            </button>
            <button className="btn small ghost" onClick={() => onSetAll(false)}>
              Select none
            </button>
          </div>
          <ul className="rt-games">
            {visible.map((g) => (
              <GameRow
                key={g.id}
                game={g}
                counted={!off.has(g.id)}
                onToggle={() => onToggle(g.id)}
                onDelete={() => onDelete(g.id)}
              />
            ))}
          </ul>
          {games.length > SHOWN_AT_FIRST && (
            <button className="btn small ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer' : `Show all ${games.length} games`}
            </button>
          )}
        </>
      )}
    </section>
  )
}
