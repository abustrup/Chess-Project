import { useState } from 'react'
import { ArrowUpDown, Copy, Flag, Handshake, Lightbulb, Plus, Undo2, Check } from 'lucide-react'
import type { GameApi } from './useGame'

/** The three buttons that matter most. They stay visible in zen mode. */
export function EssentialActions({ game }: { game: GameApi }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="card pl-actions zen-keep" role="alertdialog" aria-label="Resign the game?">
        <div className="pl-confirm">
          <span>Give up this game?</span>
          <div className="row">
            <button
              className="btn danger"
              onClick={() => {
                setConfirming(false)
                game.resign()
              }}
            >
              <Flag size={18} /> Yes, resign
            </button>
            <button className="btn" onClick={() => setConfirming(false)} autoFocus>
              Keep playing
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card pl-actions zen-keep">
      <div className="pl-action-row">
        <button
          className="btn"
          onClick={() => void game.requestHint()}
          disabled={!game.canAskHint || game.hintBusy}
          title="Get a hint. Press again for more."
        >
          <Lightbulb size={18} /> {game.hintBusy ? 'Thinking…' : 'Hint'}
          {game.hintsUsed > 0 && <span className="pl-count">{game.hintsUsed}</span>}
        </button>
        <button className="btn" onClick={game.takeBack} disabled={!game.canTakeBack} title="Take back your last move">
          <Undo2 size={18} /> Take back
        </button>
        <button className="btn danger" onClick={() => setConfirming(true)} disabled={!!game.outcome} title="Resign the game">
          <Flag size={18} /> Resign
        </button>
      </div>
    </div>
  )
}

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (on: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="pl-switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="pl-switch-track" aria-hidden />
      <span>
        {label}
        {hint && <span className="faint small"> {hint}</span>}
      </span>
    </label>
  )
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // older browsers or blocked clipboard: fall back to a hidden text box
    const box = document.createElement('textarea')
    box.value = text
    box.style.position = 'fixed'
    box.style.opacity = '0'
    document.body.appendChild(box)
    box.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    box.remove()
    return ok
  }
}

/** Everything else: draw offer, flip, new game, copy PGN, coach and evaluation switches. Hidden in zen mode. */
export function MoreActions({
  game,
  coachOn,
  setCoachOn,
  evalOn,
  setEvalOn,
  onNewGame,
  getPgn,
}: {
  game: GameApi
  coachOn: boolean
  setCoachOn: (on: boolean) => void
  evalOn: boolean
  setEvalOn: (on: boolean) => void
  onNewGame: () => void
  getPgn: () => string
}) {
  const [copied, setCopied] = useState(false)
  const over = !!game.outcome
  return (
    <div className="card zen-hide">
      <div className="pl-more-grid">
        <button
          className="btn small"
          onClick={() => void game.offerDraw()}
          disabled={over || !game.canInteract || game.drawBusy || game.engineStatus === 'failed'}
          title={game.drawBlocked ? 'You asked just now. Wait a few moves.' : 'Offer the bot a draw'}
        >
          <Handshake size={16} /> {game.drawBusy ? 'Asking…' : 'Offer draw'}
        </button>
        <button className="btn small" onClick={game.flip} title="Turn the board around">
          <ArrowUpDown size={16} /> Flip board
        </button>
        <button
          className="btn small"
          onClick={async () => {
            setCopied(await copyText(getPgn()))
            setTimeout(() => setCopied(false), 1800)
          }}
          title="Copy the game so you can paste it somewhere else"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy PGN'}
        </button>
        <button className="btn small" onClick={onNewGame} title="Go back to the setup screen">
          <Plus size={16} /> New game
        </button>
      </div>
      <div className="pl-switches">
        <Switch checked={coachOn} onChange={setCoachOn} label="Coach" hint="warns you about big blunders" />
        <Switch checked={evalOn} onChange={setEvalOn} label="Evaluation bar" hint="shows who is better" />
      </div>
    </div>
  )
}
