import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { MAX_RATING, MIN_RATING } from '../sanitize'
import SettingsCard from './SettingsCard'
import { useProfile } from './useProfile'

const LICHESS_NAME = /^[A-Za-z0-9_-]{2,30}$/

/**
 * "Bot starting strength": the number box that used to be "My rating". It only sets which computer level Play picks
 * by default (`levelIdFor` in features/play/session.ts); the rating itself now comes from Lichess.
 * Saves only a sensible value and gives a clear message otherwise.
 */
function RatingField({ value, onSave }: { value: number; onSave: (next: number) => void }) {
  const [text, setText] = useState(String(value))
  // follow outside changes, such as restoring a backup
  useEffect(() => setText(String(value)), [value])
  const parsed = Number(text)
  const valid = text.trim() !== '' && Number.isInteger(parsed) && parsed >= MIN_RATING && parsed <= MAX_RATING
  return (
    <div className="field">
      <label htmlFor="set-rating">Bot starting strength</label>
      <input
        id="set-rating"
        className="input"
        inputMode="numeric"
        value={text}
        aria-invalid={!valid}
        aria-describedby="set-rating-hint"
        onChange={(e) => {
          setText(e.target.value)
          const next = Number(e.target.value)
          if (e.target.value.trim() !== '' && Number.isInteger(next) && next >= MIN_RATING && next <= MAX_RATING) onSave(next)
        }}
        onBlur={() => !valid && setText(String(value))}
      />
      <span id="set-rating-hint" className={`small ${valid ? 'faint' : 'field-error'}`}>
        {valid
          ? 'How strong the computer is when you start a game in Play, until you pick a level there. Your rating comes from Lichess.'
          : `Please type a whole number from ${MIN_RATING} to ${MAX_RATING}.`}
      </span>
    </div>
  )
}

export default function ProfileSection() {
  const [profile, change] = useProfile()
  const username = profile.lichessUsername
  const usernameOk = username === '' || LICHESS_NAME.test(username)

  return (
    <SettingsCard
      icon={User}
      title="Profile"
      intro="Used to greet you, to show your Lichess rating and to bring in your games. It stays on this device; only your Lichess username is sent, to lichess.org."
      className="zen-hide"
    >
      <div className="grid cols-3">
        <div className="field">
          <label htmlFor="set-name">Your name</label>
          <input
            id="set-name"
            className="input"
            value={profile.name}
            maxLength={30}
            autoComplete="given-name"
            onChange={(e) => change({ name: e.target.value })}
          />
          <span className="small faint">Shown on the home page.</span>
        </div>
        <div className="field">
          <label htmlFor="set-lichess">Lichess username</label>
          <input
            id="set-lichess"
            className="input"
            value={username}
            maxLength={30}
            placeholder="Optional"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={!usernameOk}
            aria-describedby="set-lichess-hint"
            onChange={(e) => change({ lichessUsername: e.target.value.replace(/\s+/g, '') })}
          />
          <span id="set-lichess-hint" className={`small ${usernameOk ? 'faint' : 'field-error'}`}>
            {usernameOk
              ? 'So I can show your Lichess rating and bring in your games from lichess.org.'
              : 'Lichess names have 2 to 30 letters, numbers, dashes or underscores.'}
          </span>
        </div>
        <RatingField value={profile.selfRating} onSave={(selfRating) => change({ selfRating })} />
      </div>
    </SettingsCard>
  )
}
