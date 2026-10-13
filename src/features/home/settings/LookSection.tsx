import { Palette } from 'lucide-react'
import SettingsCard from './SettingsCard'
import Switch from './Switch'
import AppThemePicker from './AppThemePicker'
import BoardColourPicker from './BoardColourPicker'
import PieceSetPicker from './PieceSetPicker'
import PreviewBoard from './PreviewBoard'
import { useProfile } from './useProfile'

/** Colours, pieces and comfort options, with a live board next to them. This part stays visible in zen mode. */
export default function LookSection() {
  const [profile, change] = useProfile()

  return (
    <SettingsCard icon={Palette} title="Look and feel" intro="Pick what you like. Everything changes straight away.">
      <div className="look-layout">
        <div className="look-options">
          <div className="look-group">
            <h3>App colours</h3>
            <AppThemePicker />
          </div>
          <div className="look-group">
            <h3>Board colours</h3>
            <BoardColourPicker />
          </div>
          <div className="look-group">
            <h3>Pieces</h3>
            <PieceSetPicker />
          </div>
          <div className="look-group">
            <h3>Comfort</h3>
            <div className="switch-list">
              <Switch
                label="Zen mode"
                hint="Hides everything except the board and the buttons you need. Press Z any time to switch it."
                checked={profile.zenMode}
                onChange={(zenMode) => change({ zenMode })}
              />
              <Switch
                label="Sounds"
                hint="Soft clicks when pieces move."
                checked={profile.soundOn}
                onChange={(soundOn) => change({ soundOn })}
              />
              <Switch
                label="Show where a piece can go"
                hint="Small dots on the squares a piece is allowed to move to."
                checked={profile.showLegalMoves}
                onChange={(showLegalMoves) => change({ showLegalMoves })}
              />
            </div>
          </div>
        </div>
        <aside className="look-preview" aria-label="Preview">
          <PreviewBoard />
          <p className="small faint">This is how your board looks everywhere in the app.</p>
        </aside>
      </div>
    </SettingsCard>
  )
}
