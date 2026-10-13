import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, Crosshair, Puzzle, Swords, type LucideIcon } from 'lucide-react'
import type { PlanItem } from './progress'

const ICONS: Record<PlanItem['id'], LucideIcon> = {
  opening: BookOpen,
  tactic: Crosshair,
  puzzles: Puzzle,
  play: Swords,
}

function PlanCard({ item }: { item: PlanItem }) {
  const Icon = ICONS[item.id]
  return (
    <Link to={item.to} className={`card interactive plan-card ${item.done ? 'is-done' : ''}`}>
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
        {item.cta} <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  )
}

export default function TodaysPlan({ items }: { items: PlanItem[] }) {
  return (
    <section className="zen-hide" aria-labelledby="plan-title">
      <div className="home-section-head">
        <h2 id="plan-title">Today&apos;s plan</h2>
        <span className="muted small">Three small steps. Do one, or all three.</span>
      </div>
      <div className="grid cols-3">
        {items.map((item) => (
          <PlanCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
