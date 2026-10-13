import { Link } from 'react-router-dom'
import { DEFAULT_PROFILE } from '../../types'
import { greetingFor, longDate } from './format'

interface HeroProps {
  name: string
  now: Date
  isNewPlayer: boolean
}

/** Greeting at the top of the dashboard. This is also what stays visible in zen mode. */
export default function Hero({ name, now, isNewPlayer }: HeroProps) {
  const trimmed = name.trim()
  const hasName = trimmed !== '' && trimmed !== DEFAULT_PROFILE.name
  return (
    <div>
      <div className="eyebrow zen-hide">{longDate(now)}</div>
      <h1 className="home-greeting">
        {greetingFor(now)}
        {hasName ? `, ${trimmed}` : ''}
      </h1>
      <p className="muted zen-hide">
        {isNewPlayer
          ? 'Welcome to Chess Coach, a calm place to learn chess one small step at a time.'
          : 'Here is what to work on today.'}
        {!hasName && (
          <>
            {' '}
            <Link to="/settings">Tell me your name</Link>
          </>
        )}
      </p>
    </div>
  )
}
