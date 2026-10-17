import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ExternalLink, Puzzle, ShieldCheck, Swords, type LucideIcon } from 'lucide-react'
import type { PlanItem } from './progress'

const ICONS: Record<PlanItem['id'], LucideIcon> = {
  safety: ShieldCheck,
  puzzles: Puzzle,
  lichess: Swords,
}

const COUNT_WORDS = ['No steps', 'One small step', 'Two small steps', 'Three small steps']

function PlanCard({ item }: { item: PlanItem }) {
  const Icon = ICONS[item.id]
  const className = `card interactive plan-card ${item.done ? 'is-done' : ''}`
  const body: ReactNode = (
    <>
      <div className="plan-top">
        <span className="plan-icon" aria-hidden>
          <Icon size={20} />
        </span>
        <span className="plan-kicker">{item.kicker}</span>
        {item.done && (
          <span className="chip green">
            <Check size={13} aria-hidden /> Done today
          </span>
        )}
      </div>
      <h3>{item.title}</h3>
      <p className="muted small">{item.reason}</p>
      {item.progressText && (
        <div className="plan-progress">
          {item.fraction !== undefined && (
            <div className="progress" aria-hidden>
              <span style={{ width: `${Math.round(item.fraction * 100)}%` }} />
            </div>
          )}
          <span className="faint small">{item.progressText}</span>
        </div>
      )}
      <span className="plan-cta">
        {item.cta}{' '}
        {item.external ? (
          <>
            <ExternalLink size={16} aria-hidden />
            <span className="visually-hidden">(opens in a new tab)</span>
          </>
        ) : (
          <ArrowRight size={16} aria-hidden />
        )}
      </span>
    </>
  )
  // Another website opens in a new tab, so the app stays where it was; noopener keeps that site away from this tab.
  return item.external ? (
    <a href={item.to} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <Link to={item.to} className={className}>
      {body}
    </Link>
  )
}

export default function TodaysPlan({ items }: { items: PlanItem[] }) {
  const howMany = COUNT_WORDS[items.length] ?? `${items.length} small steps`
  return (
    <section className="zen-hide" aria-labelledby="plan-title">
      <div className="home-section-head">
        <h2 id="plan-title">Today&apos;s plan</h2>
        <span className="muted small">
          {howMany}. {items[0]?.id === 'safety' ? 'The Safety check comes first.' : items.length === 2 ? 'Do one, or both.' : items.length > 2 ? `Do one, or all ${items.length}.` : ''}
        </span>
      </div>
      <div className={`grid cols-${Math.min(items.length, 3)} plan-grid`}>
        {items.map((item) => (
          <PlanCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
