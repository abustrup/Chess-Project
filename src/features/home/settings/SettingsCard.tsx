import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  intro?: string
  className?: string
  children: ReactNode
}

/** One titled block of the Settings page. */
export default function SettingsCard({ icon: Icon, title, intro, className = '', children }: Props) {
  const id = `settings-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`
  return (
    <section className={`card settings-card ${className}`} aria-labelledby={id}>
      <h2 id={id} className="settings-title">
        <Icon size={22} aria-hidden /> {title}
      </h2>
      {intro && <p className="muted settings-intro">{intro}</p>}
      {children}
    </section>
  )
}
