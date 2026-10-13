import { APP_THEMES } from '../../../lib/themes'
import ChoiceCard from './ChoiceCard'
import { useProfile } from './useProfile'

/** Ocean / Ember as two little mock-ups of the app, painted in each theme's own colours. */
export default function AppThemePicker() {
  const [profile, change] = useProfile()
  return (
    <div className="choice-grid two" role="radiogroup" aria-label="App colours">
      {APP_THEMES.map((theme) => (
        <ChoiceCard
          key={theme.id}
          group="app-theme"
          checked={profile.appTheme === theme.id}
          onSelect={() => change({ appTheme: theme.id })}
        >
          <span className="theme-preview" data-preview={theme.id} aria-hidden>
            <span className="tp-bar">
              <i className="tp-pill on" />
              <i className="tp-pill" />
              <i className="tp-pill" />
            </span>
            <span className="tp-body">
              <span className="tp-card">
                <i className="tp-line long" />
                <i className="tp-line short" />
                <i className="tp-button" />
              </span>
              <span className="tp-card">
                <i className="tp-line short" />
                <i className="tp-line long" />
              </span>
            </span>
          </span>
          <span className="choice-name">{theme.name}</span>
          <span className="small muted">{theme.blurb}</span>
        </ChoiceCard>
      ))}
    </div>
  )
}
