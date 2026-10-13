import { Link } from 'react-router-dom'
import { BookOpen, Dumbbell } from 'lucide-react'
import type { OpeningChapter, OpeningCourse } from '../../../types'
import { Crumbs } from './shared'

/** Title of a study / drill page, with a switch between the two modes. Hidden in zen mode (it is a .page-head). */
export function ModeHeader({
  course,
  chapter,
  mode,
}: {
  course: OpeningCourse
  chapter: OpeningChapter
  mode: 'study' | 'drill'
}) {
  const base = `/openings/${course.id}/${chapter.id}`
  return (
    <div className="page-head op-mode-head">
      <div>
        <Crumbs items={[{ label: 'Openings', to: '/openings' }, { label: course.name, to: `/openings/${course.id}` }, { label: chapter.title }]} />
        <h1>{chapter.title}</h1>
        <p>{chapter.summary}</p>
      </div>
      <div className="op-seg" role="group" aria-label="Choose how to practise">
        <Link to={`${base}/study`} className={mode === 'study' ? 'on' : ''} aria-current={mode === 'study' ? 'page' : undefined}>
          <BookOpen size={16} aria-hidden /> Study
        </Link>
        <Link to={`${base}/drill`} className={mode === 'drill' ? 'on' : ''} aria-current={mode === 'drill' ? 'page' : undefined}>
          <Dumbbell size={16} aria-hidden /> Drill
        </Link>
      </div>
    </div>
  )
}
