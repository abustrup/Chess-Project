import { Heart } from 'lucide-react'
import { PIECE_SETS } from '../../../lib/pieceSets'
import SettingsCard from './SettingsCard'
import { APP_LICENCE, CREDITS } from './credits'

export default function CreditsSection() {
  return (
    <SettingsCard
      icon={Heart}
      title="Credits and licences"
      intro="Chess Coach is free, and it stands on the work of many generous people. Thank you to all of them."
      className="zen-hide"
    >
      <ul className="credit-list">
        {CREDITS.map((credit) => (
          <li key={credit.name}>
            <div>
              <a href={credit.url} target="_blank" rel="noreferrer">
                {credit.name}
              </a>
              <div className="small muted">{credit.use}</div>
            </div>
            <span className="chip">{credit.licence}</span>
          </li>
        ))}
      </ul>

      <h3 className="credit-heading">Piece sets</h3>
      <ul className="credit-list">
        {PIECE_SETS.map((set) => (
          <li key={set.id}>
            <div>
              <strong>{set.name}</strong>
              <div className="small muted">{set.credit}</div>
            </div>
          </li>
        ))}
      </ul>

      <p className="small muted credit-foot">
        Because Chess Coach contains Stockfish, the app itself is free software under the{' '}
        <a href={APP_LICENCE.url} target="_blank" rel="noreferrer">
          {APP_LICENCE.licence}
        </a>{' '}
        licence. You may use, share and change it, as long as it stays free in the same way.
      </p>
    </SettingsCard>
  )
}
