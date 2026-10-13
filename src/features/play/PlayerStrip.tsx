import { useMemo } from 'react'
import { Bot } from 'lucide-react'
import { DEFAULT_PROFILE, type Side } from '../../types'
import { piecesFor } from '../../lib/pieceSets'
import { KEYS, useStored } from '../../lib/storage'
import ClockView from './ClockView'
import type { GameClock } from './GameClock'

interface Props {
  name: string
  /** Small grey text after the name, e.g. "Club level". */
  detail?: string
  isBot: boolean
  side: Side
  /** Piece letters this player has captured (e.g. ['p','p','n']). */
  captured: string[]
  /** How many points of material this player is ahead (0 or less = show nothing). */
  lead: number
  showCaptured: boolean
  clock: GameClock
  /** Show a "thinking" hint next to the name. */
  thinking?: boolean
  /** Does this player's clock tick (the human player's clock does). */
  tickSound?: boolean
}

/** A row above or below the board: who is playing, what they have captured, and their clock. */
export default function PlayerStrip({ name, detail, isBot, side, captured, lead, showCaptured, clock, thinking, tickSound }: Props) {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const pieces = useMemo(() => piecesFor(profile.pieceSet), [profile.pieceSet])
  // the pieces this player took are the other colour
  const takenColour = side === 'white' ? 'b' : 'w'

  return (
    <div className="player-strip pl-strip">
      <div className="avatar pl-avatar" aria-hidden>
        {isBot ? <Bot size={22} /> : name.trim().charAt(0).toUpperCase() || 'Y'}
      </div>
      <div className="pl-who">
        <div className="pl-name">
          <strong>{name}</strong>
          {detail && <span className="faint small zen-hide"> {detail}</span>}
          {thinking && (
            <span className="pl-thinking" role="status" aria-label="The bot is thinking">
              <i />
              <i />
              <i />
            </span>
          )}
        </div>
        <div className={`pl-captured zen-hide ${captured.length === 0 && lead <= 0 ? 'empty' : ''}`} aria-label="Captured pieces">
          {showCaptured &&
            captured.map((type, i) => {
              const Piece = pieces[`${takenColour}${type.toUpperCase()}`]
              return (
                <span key={`${type}${i}`} className={`pl-cap ${i > 0 && captured[i - 1] === type ? 'overlap' : ''}`}>
                  {Piece?.({ svgStyle: { width: '100%', height: '100%' } })}
                </span>
              )
            })}
          {lead > 0 && <span className="pl-lead">+{lead}</span>}
        </div>
      </div>
      {clock.enabled && <ClockView clock={clock} side={side} ticks={!!tickSound} />}
    </div>
  )
}
