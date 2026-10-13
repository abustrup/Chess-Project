import type { CSSProperties } from 'react'
import { BOARD_THEMES } from '../../../lib/themes'
import ChoiceCard from './ChoiceCard'
import { useProfile } from './useProfile'

const FAMILIES = [
  { id: 'blue', title: 'Blue boards' },
  { id: 'warm', title: 'Warm boards' },
] as const

/** Every board colour as a small 4 by 4 board, grouped into blue and warm. */
export default function BoardColourPicker() {
  const [profile, change] = useProfile()
  return (
    <div className="stack" role="radiogroup" aria-label="Board colours">
      {FAMILIES.map((family) => (
        <div key={family.id}>
          <div className="faint small choice-family">{family.title}</div>
          <div className="choice-grid four">
            {BOARD_THEMES.filter((t) => t.family === family.id).map((theme) => (
              <ChoiceCard
                key={theme.id}
                group="board-colours"
                checked={profile.boardTheme === theme.id}
                onSelect={() => change({ boardTheme: theme.id })}
                className="compact"
              >
                <span
                  className="mini-board"
                  style={{ '--l': theme.light, '--d': theme.dark } as CSSProperties}
                  aria-hidden
                />
                <span className="choice-name">{theme.name}</span>
              </ChoiceCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
