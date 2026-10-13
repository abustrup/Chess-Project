import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { CourseSummary, NextStep } from './progress'
import { plural } from './format'

/** ['d4','d5','Bf4'] -> "1.d4 d5 2.Bf4" (the moves that define the opening, as chess notation). */
function movesText(sans: string[]): string {
  return sans.map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}.${san}` : san)).join(' ')
}

const STEP_BUTTON: Record<NextStep['kind'], string> = {
  study: 'Learn next chapter',
  drill: 'Practise',
  refresh: 'Quick refresh',
}

function CourseCard({ summary }: { summary: CourseSummary }) {
  const { course, chapterCount, studied, mastery, next } = summary
  const percent = Math.round(mastery * 100)
  const to = next ? next.to : `/openings/${course.id}`
  const button = !next ? 'Open' : next.kind === 'study' && studied === 0 ? 'Start' : STEP_BUTTON[next.kind]

  return (
    <Link to={to} className="card interactive course-card">
      <div className="row between">
        <span className="chip">
          <span className={`side-dot ${course.side}`} aria-hidden />
          You play {course.side === 'white' ? 'White' : 'Black'}
        </span>
        <span className="course-percent">{percent}%</span>
      </div>
      <h3>{course.name}</h3>
      {course.signatureMoves.length > 0 && <div className="course-moves">{movesText(course.signatureMoves)}</div>}
      {course.tagline && <p className="muted small">{course.tagline}</p>}
      <div
        className="progress"
        role="progressbar"
        aria-label={`${course.name}, ${percent}% learned`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="faint small">
        {chapterCount === 0
          ? 'The lessons for this opening are on their way.'
          : studied === 0
            ? `${plural(chapterCount, 'chapter')} to learn. Nothing started yet.`
            : `${studied} of ${plural(chapterCount, 'chapter')} studied · ${percent}% learned`}
      </div>
      <span className="plan-cta">
        {button} <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  )
}

export default function OpeningsProgress({ summaries }: { summaries: CourseSummary[] }) {
  return (
    <section className="zen-hide" aria-labelledby="openings-title">
      <div className="home-section-head">
        <h2 id="openings-title">Your openings</h2>
        <Link to="/openings" className="small">
          See all lessons
        </Link>
      </div>
      <div className="grid cols-3">
        {summaries.map((summary) => (
          <CourseCard key={summary.course.id} summary={summary} />
        ))}
      </div>
    </section>
  )
}
