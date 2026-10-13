import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Layers } from 'lucide-react'
import type { OpeningCourse } from '../../types'
import { useCourses } from './courses'
import { courseMastery, hasStarted, nextStep, useOpeningProgress } from './progress'
import { signatureText } from './treeUtils'
import { MasteryBar, SideIcon } from './components/shared'

// /openings: three big cards, one per opening the user is learning.

export default function OverviewPage() {
  const courses = useCourses()
  return (
    <div className="page op-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Your openings</div>
          <h1>Openings</h1>
          <p className="op-intro">
            An opening is just the first handful of moves in a game. Know them well and you start every game calm and
            with a plan. For each opening, first <strong>study</strong> it step by step, then <strong>drill</strong> it
            from memory until it feels automatic.
          </p>
        </div>
      </div>

      <div className="op-course-grid">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      {courses.length === 0 && <p className="muted">No openings are available yet.</p>}
      <p className="op-footnote zen-hide">
        Tip: press <kbd>Z</kbd> any time for zen mode, which hides everything except the board.
      </p>
    </div>
  )
}

function CourseCard({ course }: { course: OpeningCourse }) {
  const progress = useOpeningProgress()
  const step = nextStep(course, progress)
  const started = hasStarted(course, progress)
  const mastery = courseMastery(progress, course)
  const count = course.chapters.length
  const youPlay = course.side === 'white' ? 'White' : 'Black'

  return (
    <article className="card op-course-card" aria-labelledby={`course-${course.id}`}>
      <div className="op-course-top">
        <SideIcon side={course.side} />
        <div>
          <div className="op-you-play">You play {youPlay}</div>
          <h2 id={`course-${course.id}`}>{course.name}</h2>
        </div>
      </div>

      <p className="op-tagline">{course.tagline || 'Lessons are on their way.'}</p>

      {course.signatureMoves.length > 0 && (
        <div className="op-moves" aria-label="Signature moves">
          {signatureText(course.signatureMoves)}
        </div>
      )}

      <div className="op-course-meta">
        <span className="chip">
          <Layers size={14} aria-hidden /> {count} {count === 1 ? 'variation' : 'variations'}
        </span>
      </div>

      <div className="op-course-progress">
        <MasteryBar value={mastery} label="How well you know it" />
      </div>

      <div className="op-course-actions">
        {step ? (
          <>
            <Link className="btn primary big" to={`/openings/${course.id}/${step.chapter.id}/${step.mode}`}>
              {started ? 'Continue' : 'Start'} <ArrowRight size={18} aria-hidden />
            </Link>
            <div className="small muted op-next">
              {step.review ? 'Refresher' : 'Next'}: {step.chapter.title} ({step.mode === 'study' ? 'study' : 'drill'})
            </div>
          </>
        ) : (
          <span className="chip gold op-soon">Coming soon</span>
        )}
        <Link className="btn ghost small" to={`/openings/${course.id}`}>
          <BookOpen size={15} aria-hidden /> Open the course
        </Link>
      </div>
    </article>
  )
}
