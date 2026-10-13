import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import type { TacticLesson, TacticsProgress } from '../../types'
import FixtureNotice from './FixtureNotice'
import LearnStep from './LearnStep'
import WatchStep from './WatchStep'
import PracticeStep from './PracticeStep'
import MoreStep from './MoreStep'
import { useTacticsData, type StepId } from './useTacticsData'
import { useLessonProgress } from './useTacticsProgress'

const STEPS: { id: StepId; label: string }[] = [
  { id: 'learn', label: 'Learn' },
  { id: 'watch', label: 'Watch' },
  { id: 'practice', label: 'Practice' },
  { id: 'more', label: 'More puzzles' },
]

export default function LessonPage() {
  const { lessonId } = useParams()
  const { lessons, overviewPath } = useTacticsData()
  const lesson = lessons.find((l) => l.id === lessonId)

  if (!lesson) {
    return (
      <div className="page">
        <div className="card tx-empty">
          <h2>We could not find that lesson</h2>
          <p className="muted">It may have been renamed. Pick another one from the list.</p>
          <Link to={overviewPath} className="btn primary">
            <ArrowLeft size={18} aria-hidden /> All tactics
          </Link>
        </div>
      </div>
    )
  }
  // a fresh state for every lesson, so switching lessons never keeps a half-finished exercise around
  return <LessonView key={lesson.id} lesson={lesson} />
}

/** Where to pick up: the first step you have not finished yet. */
function startingStep(lesson: TacticLesson, progress: TacticsProgress[string], complete: boolean, anySolved: boolean): StepId {
  if (complete) return 'more'
  if (anySolved) return 'practice'
  if (!progress.introSeen && lesson.intro.length > 0) return 'learn'
  if (progress.examplesSeen < lesson.examples.length) return 'watch'
  return 'practice'
}

function isStepId(value: string | null): value is StepId {
  return STEPS.some((s) => s.id === value)
}

function LessonView({ lesson }: { lesson: TacticLesson }) {
  const { overviewPath } = useTacticsData()
  const [params, setParams] = useSearchParams()
  const { progress, stats } = useLessonProgress(lesson)

  // a link like /tactics/fork?step=practice picks the step; without one we continue where you left off
  const asked = params.get('step')
  const [step, setStep] = useState<StepId>(() => (isStepId(asked) ? asked : startingStep(lesson, progress, stats.complete, stats.solved > 0)))
  useEffect(() => {
    if (isStepId(asked)) setStep(asked)
  }, [asked])

  function goTo(next: StepId) {
    setStep(next)
    // keep the step in the address (without a new history entry), so a reload or the browser's
    // Forward button brings you back to the same step instead of the start of the lesson
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('step', next)
        return nextParams
      },
      { replace: true },
    )
    window.scrollTo({ top: 0 })
  }

  const stepDone: Record<StepId, boolean> = {
    learn: progress.introSeen,
    watch: lesson.examples.length > 0 && progress.examplesSeen >= lesson.examples.length,
    practice: stats.complete,
    more: false,
  }

  return (
    <div className="page tx-page">
      <div className="page-head tx-lesson-head">
        <div>
          <Link to={overviewPath} className="tx-back">
            <ArrowLeft size={16} aria-hidden /> All tactics
          </Link>
          <h1>{lesson.name}</h1>
          <p>{lesson.tagline}</p>
        </div>
        <div className="row">
          <FixtureNotice />
          {stats.total > 0 && (
            <span className={`chip ${stats.complete ? 'green' : 'blue'}`}>
              {stats.complete && <Check size={14} aria-hidden />}
              {stats.solved}/{stats.total} solved
            </span>
          )}
        </div>
      </div>

      <nav className="tabs tx-steps zen-hide" aria-label="Lesson steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            aria-current={step === s.id ? 'step' : undefined}
            className={`tab ${step === s.id ? 'active' : ''}`}
            onClick={() => goTo(s.id)}
          >
            <span className={`tx-step-num ${stepDone[s.id] ? 'done' : ''}`}>
              {stepDone[s.id] ? <Check size={13} aria-label="finished" /> : i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </nav>

      {step === 'learn' && <LearnStep lesson={lesson} onNext={() => goTo(lesson.examples.length ? 'watch' : 'practice')} />}
      {step === 'watch' && <WatchStep lesson={lesson} onNext={() => goTo('practice')} />}
      {step === 'practice' && <PracticeStep lesson={lesson} onFinish={() => goTo('more')} />}
      {step === 'more' && <MoreStep lesson={lesson} onGoTo={goTo} />}
    </div>
  )
}
