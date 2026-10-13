import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Handshake, Plus, RotateCcw, Search, Trophy, X } from 'lucide-react'
import { copyText } from './ActionPanels'
import { describeOutcome, verdictFor } from './outcomeText'
import type { GameApi } from './useGame'

interface Props {
  game: GameApi
  onRematch: () => void
  onNewGame: () => void
  getPgn: () => string
}

function Summary({ game }: { game: GameApi }) {
  const moves = Math.ceil(game.plyCount / 2)
  return (
    <p className="muted small" style={{ margin: 0 }}>
      {moves} {moves === 1 ? 'move' : 'moves'} against {game.level.name} (about {game.level.elo})
      {game.hintsUsed > 0 && ` · ${game.hintsUsed} ${game.hintsUsed === 1 ? 'hint' : 'hints'} used`}
      {game.takebacks > 0 && ` · ${game.takebacks} ${game.takebacks === 1 ? 'take-back' : 'take-backs'}`}
      <br />
      Saved to your games.
    </p>
  )
}

function Buttons({ game, onRematch, onNewGame, getPgn }: Props) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row wrap">
        <Link to={`/review/${game.config.id}`} className="btn primary">
          <Search size={18} /> Review game
        </Link>
        <button className="btn" onClick={onRematch}>
          <RotateCcw size={18} /> Rematch
        </button>
        <button className="btn" onClick={onNewGame}>
          <Plus size={18} /> New game
        </button>
      </div>
      <div>
        <button
          className="btn ghost small"
          onClick={async () => {
            setCopied(await copyText(getPgn()))
            setTimeout(() => setCopied(false), 1800)
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy PGN'}
        </button>
      </div>
    </div>
  )
}

/** Pop-up shown once when the game ends. It can be closed; the same buttons stay next to the board. */
export function ResultModal(props: Props & { onClose: () => void }) {
  const { game, onClose } = props
  const outcome = game.outcome
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  if (!outcome) return null
  const verdict = verdictFor(outcome, game.userSide)
  const { headline, detail } = describeOutcome(outcome, game.userSide)

  return (
    <div className="pl-modal-backdrop" onClick={onClose}>
      <div className={`pl-modal ${verdict}`} role="dialog" aria-modal="true" aria-label="Game result" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="btn ghost icon pl-modal-close" onClick={onClose} aria-label="Close and look at the board">
          <X size={18} />
        </button>
        <div className="pl-result-icon" aria-hidden>
          {verdict === 'draw' ? <Handshake size={34} /> : <Trophy size={34} />}
        </div>
        <h2 className="pl-result-title">{headline}</h2>
        {detail && <p className="muted" style={{ margin: 0 }}>{detail}</p>}
        <Summary game={game} />
        <Buttons {...props} />
      </div>
    </div>
  )
}

/** The same result, kept beside the board after the pop-up is closed. Visible in zen mode too. */
export function ResultCard(props: Props) {
  const { game } = props
  const outcome = game.outcome
  if (!outcome) return null
  const { headline, detail } = describeOutcome(outcome, game.userSide)
  return (
    <div className="card zen-keep pl-result-card">
      <div className="card-title">Game over</div>
      <h2 style={{ marginBottom: 4 }}>{headline}</h2>
      {detail && <p className="muted small">{detail}</p>}
      <Buttons {...props} />
    </div>
  )
}
