import ProfileSection from '../features/home/settings/ProfileSection'
import LookSection from '../features/home/settings/LookSection'
import DataSection from '../features/home/settings/DataSection'
import CreditsSection from '../features/home/settings/CreditsSection'
import '../features/home/settings/settings.css'

/** Settings: profile, look and feel (live preview), backup of your data, and credits. */
export default function Settings() {
  return (
    <div className="page settings">
      <div className="page-head">
        <div>
          <div className="eyebrow">Settings</div>
          <h1>Make it yours</h1>
          <p>Your name, the colours of the board, and a backup of your progress.</p>
        </div>
      </div>
      <div className="stack settings-stack">
        <ProfileSection />
        <LookSection />
        <DataSection />
        <CreditsSection />
      </div>
    </div>
  )
}
