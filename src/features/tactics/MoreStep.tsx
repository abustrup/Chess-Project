import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Eye, GraduationCap, Swords } from 'lucide-react'
import type { TacticLesson } from '../../types'
import { useTacticsData, type StepId } from './useTacticsData'
import { useLessonProgress } from './useTacticsProgress'

/** Step 4: take the idea to real puzzles, or move on to the next lesson. */
export default function MoreStep({ lesson, onGoTo }: { lesson: TacticLesson; onGoTo: (step: StepId) => void }) {
  const { lessons, lessonPath, overviewPath } = useTacticsData()
  const { stats } = useLessonProgress(lesson)

  const position = lessons.findIndex((l) => l.id === lesson.id)
  const nextLesson = lessons[position + 1]
  const puzzlesPath = lesson.puzzleTheme ? `/puzzles?theme=${encodeURIComponent(lesson.puzzleTheme)}` : '/puzzles'

  return (
    <div className="tx-article">
      <div className="eyebrow">Step 4 · More puzzles</div>
      <section className="card tx-more">
        <div className="tx-more-icon">
          <GraduationCap size={30} aria-hidden />
        </div>
        <h2>{stats.complete ? 'Well done! Keep it going.' : 'Ready for the real thing?'}</h2>
        <p className="muted tx-text">
          Real puzzles from Lichess use this same idea. The more of them you see, the faster you will spot it in your own games.
        </p>
        <Link to={puzzlesPath} className="btn primary big">
          Practise with real puzzles from Lichess <ArrowRight size={18} aria-hidden />
        </Link>
      </section>

      <div className="tx-more-links zen-hide">
        <div className="row wrap">
          {nextLesson && (
            <Link to={lessonPath(nextLesson.id)} className="btn">
              Next lesson: {nextLesson.name} <ArrowRight size={16} aria-hidden />
            </Link>
          )}
          <Link to={overviewPath} className="btn ghost">
            All tactics
          </Link>
        </div>
        <div className="row wrap">
          <span className="small faint">Go over this lesson again:</span>
          <button className="btn small" onClick={() => onGoTo('learn')}>
            <BookOpen size={14} aria-hidden /> Read
          </button>
          <button className="btn small" onClick={() => onGoTo('watch')}>
            <Eye size={14} aria-hidden /> Watch
          </button>
          <button className="btn small" onClick={() => onGoTo('practice')}>
            <Swords size={14} aria-hidden /> Practise
          </button>
        </div>
      </div>
    </div>
  )
}
