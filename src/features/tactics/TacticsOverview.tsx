import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, Crosshair, Eye, Puzzle, Sparkles, Swords } from 'lucide-react'
import type { TacticLesson } from '../../types'
import LessonIcon from './LessonIcon'
import FixtureNotice from './FixtureNotice'
import { useTacticsData } from './useTacticsData'
import { lessonStats, useAllTacticsProgress, type LessonStats } from './useTacticsProgress'

const HOW_IT_WORKS = [
  { icon: BookOpen, label: 'Learn the idea' },
  { icon: Eye, label: 'Watch it happen' },
  { icon: Swords, label: 'Find the moves' },
  { icon: Puzzle, label: 'Try real puzzles' },
]

export default function TacticsOverview() {
  const { lessons, lessonPath } = useTacticsData()
  const progress = useAllTacticsProgress()

  const rows = lessons.map((lesson) => ({ lesson, stats: lessonStats(lesson, progress[lesson.id]) }))
  const doneCount = rows.filter((r) => r.stats.complete).length
  // keep going with something you already began; otherwise start the first lesson you have not finished
  const nextUp = rows.find((r) => r.stats.started && !r.stats.complete) ?? rows.find((r) => !r.stats.complete)

  return (
    <div className="page tx-home">
      <div className="page-head">
        <div>
          <div className="eyebrow">Learn</div>
          <h1>Tactics</h1>
          <p>Tactics win games. Learn one pattern at a time.</p>
        </div>
        <div className="row">
          <FixtureNotice />
          {lessons.length > 0 && (
            <span className="chip blue" title="Lessons where you solved every exercise">
              {doneCount} of {lessons.length} lessons done
            </span>
          )}
        </div>
      </div>

      {lessons.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="stack tx-overview">
          <ul className="tx-how zen-hide" aria-label="How each lesson works">
            {HOW_IT_WORKS.map(({ icon: Icon, label }, i) => (
              <li key={label}>
                <span className="tx-how-num">
                  <Icon size={15} aria-hidden />
                </span>
                <span>
                  {i + 1}. {label}
                </span>
              </li>
            ))}
          </ul>

          <NextUp lesson={nextUp?.lesson} started={!!nextUp?.stats.started} path={nextUp ? lessonPath(nextUp.lesson.id) : ''} />

          <div className="tx-grid">
            {rows.map(({ lesson, stats }) => (
              <LessonCard key={lesson.id} lesson={lesson} stats={stats} to={lessonPath(lesson.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NextUp({ lesson, started, path }: { lesson: TacticLesson | undefined; started: boolean; path: string }) {
  if (!lesson) {
    return (
      <div className="card tx-nextup zen-hide">
        <div className="tx-nextup-icon">
          <Sparkles size={26} aria-hidden />
        </div>
        <div className="tx-nextup-text">
          <div className="eyebrow">All done</div>
          <h2>You have finished every tactics lesson!</h2>
          <p className="muted">Keep your eyes sharp with real puzzles. You can also open any lesson below to practise again.</p>
        </div>
        <Link to="/puzzles" className="btn primary">
          Go to puzzles <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    )
  }
  return (
    <div className="card tx-nextup">
      <div className="tx-nextup-icon">
        <LessonIcon lessonId={lesson.id} size={28} />
      </div>
      <div className="tx-nextup-text">
        <div className="eyebrow">Next up</div>
        <h2>{lesson.name}</h2>
        <p className="muted">{lesson.tagline}</p>
      </div>
      <Link to={path} className="btn primary big">
        {started ? 'Continue' : 'Start lesson'} <ArrowRight size={18} aria-hidden />
      </Link>
    </div>
  )
}

function LessonCard({ lesson, stats, to }: { lesson: TacticLesson; stats: LessonStats; to: string }) {
  const percent = stats.total ? Math.round((stats.solved / stats.total) * 100) : 0
  return (
    <Link to={to} className={`card interactive tx-card ${stats.complete ? 'done' : ''}`}>
      <div className="tx-card-top">
        <span className="tx-card-icon">
          <LessonIcon lessonId={lesson.id} />
        </span>
        {stats.complete && (
          <span className="tx-done-badge" title="All exercises solved">
            <Check size={14} aria-hidden /> Done
          </span>
        )}
      </div>
      <div>
        <h3>{lesson.name}</h3>
        <p className="muted tx-card-tagline">{lesson.tagline}</p>
      </div>
      <div className="tx-card-progress">
        <div className="progress" role="progressbar" aria-label={`${lesson.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <span className="small muted">
          {stats.total === 0 ? 'No exercises yet' : `${stats.solved}/${stats.total} solved`}
        </span>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="card tx-empty">
      <Crosshair size={40} aria-hidden />
      <h2>The lessons are on their way</h2>
      <p className="muted">
        Tactics lessons will show up here soon: forks, pins, discovered attacks and more. Until then you can train on real
        puzzles.
      </p>
      <Link to="/puzzles" className="btn primary">
        Try real puzzles <ArrowRight size={18} aria-hidden />
      </Link>
    </div>
  )
}
