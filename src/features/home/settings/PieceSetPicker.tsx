import { useMemo } from 'react'
import { DEFAULT_PROFILE } from '../../../types'
import { PIECE_SETS, piecesFor } from '../../../lib/pieceSets'
import { KEYS, useStored } from '../../../lib/storage'
import ChoiceCard from './ChoiceCard'

const TYPES = ['K', 'Q', 'R', 'B', 'N', 'P'] as const

/** White pieces on the top row, black pieces below, on the player's own board colours. */
function PieceStrip({ setId }: { setId: string }) {
  const pieces = useMemo(() => piecesFor(setId), [setId])
  return (
    <span className="piece-strip" aria-hidden>
      {(['w', 'b'] as const).flatMap((colour, row) =>
        TYPES.map((type, col) => {
          const draw = pieces[`${colour}${type}`]
          return (
            <span key={`${colour}${type}`} className={(row + col) % 2 === 0 ? 'light' : 'dark'}>
              {draw?.({ svgStyle: { width: '100%', height: '100%', display: 'block' } })}
            </span>
          )
        }),
      )}
    </span>
  )
}

export default function PieceSetPicker() {
  const [profile, setProfile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  return (
    <div className="choice-grid two" role="radiogroup" aria-label="Pieces">
      {PIECE_SETS.map((set) => (
        <ChoiceCard
          key={set.id}
          group="piece-set"
          checked={profile.pieceSet === set.id}
          onSelect={() => setProfile((p) => ({ ...p, pieceSet: set.id }))}
        >
          <PieceStrip setId={set.id} />
          <span className="choice-name">{set.name}</span>
          <span className="small muted">{set.description}</span>
        </ChoiceCard>
      ))}
    </div>
  )
}
