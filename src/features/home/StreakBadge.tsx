import { Flame } from 'lucide-react'
import { plural } from './format'
import type { WeekDay } from './progress'

interface StreakProps {
  streak: number
  best: number
  week: WeekDay[]
}

/** "3 days in a row" plus the last seven days as dots. Worked out from saved timestamps only. */
export default function StreakBadge({ streak, best, week }: StreakProps) {
  return (
    <div
      className="card streak zen-hide"
      title="Counted from the games, puzzles and lessons saved in this browser."
    >
      <div className="streak-head">
        <Flame size={22} className={streak > 0 ? 'streak-flame on' : 'streak-flame'} aria-hidden />
        <div>
          <div className="streak-number">{streak > 0 ? plural(streak, 'day') : 'No streak yet'}</div>
          <div className="faint small">
            {streak > 0 ? 'in a row' : 'Practise today to start one'}
            {best > streak ? ` · best ${plural(best, 'day')}` : ''}
          </div>
        </div>
      </div>
      <ol className="streak-week" aria-label="The last seven days">
        {week.map((day) => (
          <li
            key={day.key}
            className={`${day.practised ? 'on' : ''} ${day.isToday ? 'today' : ''}`}
            aria-label={`${day.isToday ? 'Today' : day.key}: ${day.practised ? 'practised' : 'no practice'}`}
          >
            <span className="streak-dot" aria-hidden />
            <span className="streak-letter" aria-hidden>
              {day.letter}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
