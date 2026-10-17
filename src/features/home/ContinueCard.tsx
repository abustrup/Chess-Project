import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, ShieldCheck, Sparkles, Swords } from 'lucide-react'
import type { ContinueTarget } from './progress'

const KIND = {
  game: { eyebrow: 'Unfinished game', button: 'Continue', Icon: Swords },
  chapter: { eyebrow: 'Continue where you left off', button: 'Continue', Icon: BookOpen },
  start: { eyebrow: 'A good place to start', button: 'Start', Icon: Sparkles },
  safety: { eyebrow: 'Safety check', button: 'Start', Icon: ShieldCheck },
} as const

/** The one big "pick up where you left off" card. In zen mode it shrinks to a single large button. */
export default function ContinueCard({ target }: { target: ContinueTarget }) {
  const { eyebrow, button, Icon } = KIND[target.kind]
  return (
    <section className="card home-continue" aria-labelledby="continue-title">
      <div className="home-continue-icon zen-hide" aria-hidden>
        <Icon size={26} />
      </div>
      <div className="home-continue-text">
        <div className="eyebrow zen-hide">{eyebrow}</div>
        <h2 id="continue-title">{target.title}</h2>
        <p className="muted zen-hide">{target.detail}</p>
      </div>
      <Link className="btn primary big home-continue-btn" to={target.to}>
        {target.button ?? button}
        <ArrowRight size={19} aria-hidden />
      </Link>
    </section>
  )
}
