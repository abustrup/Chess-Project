import { useMemo, useState } from 'react'
import { ArrowRight, Check, X } from 'lucide-react'
import type { TacticExercise, TacticLesson } from '../../types'
import ExerciseRunner from './ExerciseRunner'
import { useLessonProgress } from './useTacticsProgress'

/** Step 3: solve the exercises one by one. Keeps track of which one you are on and which are done. */
export default function PracticeStep({ lesson, onFinish }: { lesson: TacticLesson; onFinish: () => void }) {
  const { progress, stats, addFailedAttempt, markSolved } = useLessonProgress(lesson)
  const exercises = useMemo(() => lesson.exercises.filter((e) => e.solution.length > 0), [lesson])
  const solvedIds = useMemo(() => new Set(progress.solvedExerciseIds), [progress.solvedExerciseIds])

  // start with the first exercise you have not solved yet (or the first one if you solved them all)
  const [index, setIndex] = useState(() => Math.max(0, exercises.findIndex((e) => !solvedIds.has(e.id))))
  const [attempt, setAttempt] = useState(0) // changing this starts the same exercise again
  const [struggled, setStruggled] = useState<ReadonlySet<string>>(new Set()) // wrong move or gave up, this visit

  const exercise = exercises[index]
  if (!exercise) {
    return (
      <div className="card tx-empty">
        <h2>No exercises in this lesson yet</h2>
        <p className="muted">Try some real puzzles instead.</p>
        <button className="btn primary" onClick={onFinish}>
          More puzzles <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    )
  }

  // after the last exercise, go back to any you have not solved; when none are left, the lesson is finished
  const nextIndex = index + 1 < exercises.length ? index + 1 : exercises.findIndex((e, i) => i !== index && !solvedIds.has(e.id))
  const hasNext = nextIndex !== -1

  function goTo(i: number) {
    setIndex(i)
    setAttempt(0)
  }

  return (
    <ExerciseRunner
      key={`${exercise.id}:${attempt}`}
      exercise={exercise}
      lessonComplete={stats.complete}
      nextLabel={hasNext ? 'Next exercise' : 'Finish'}
      onSolved={() => markSolved(exercise.id)}
      onFailedAttempt={() => {
        addFailedAttempt()
        setStruggled((prev) => new Set(prev).add(exercise.id))
      }}
      onRetry={() => setAttempt((a) => a + 1)}
      onNext={() => (hasNext ? goTo(nextIndex) : onFinish())}
      extra={
        <div className="card zen-hide tx-progress-card">
          <div className="card-title">
            Exercises · {stats.solved}/{stats.total} solved
          </div>
          <ExerciseDots exercises={exercises} index={index} solved={solvedIds} struggled={struggled} onPick={goTo} />
          <p className="small muted tx-progress-note">
            {progress.failedAttempts === 0
              ? 'No wrong tries so far. Nice!'
              : `${progress.failedAttempts} wrong ${progress.failedAttempts === 1 ? 'try' : 'tries'} so far. Mistakes are how we learn.`}
          </p>
        </div>
      }
    />
  )
}

type DotState = 'done' | 'failed' | 'todo'

function ExerciseDots({
  exercises,
  index,
  solved,
  struggled,
  onPick,
}: {
  exercises: TacticExercise[]
  index: number
  solved: ReadonlySet<string>
  struggled: ReadonlySet<string>
  onPick: (index: number) => void
}) {
  const labels: Record<DotState, string> = { done: 'solved', failed: 'missed so far', todo: 'not solved yet' }
  return (
    <div className="tx-dots" role="group" aria-label="Exercises">
      {exercises.map((e, i) => {
        const state: DotState = solved.has(e.id) ? 'done' : struggled.has(e.id) ? 'failed' : 'todo'
        return (
          <button
            key={e.id}
            className={`tx-dot ${state} ${i === index ? 'current' : ''}`}
            onClick={() => onPick(i)}
            aria-label={`Exercise ${i + 1}: ${labels[state]}`}
            aria-current={i === index ? 'step' : undefined}
            title={`Exercise ${i + 1}: ${labels[state]}`}
          >
            {state === 'done' ? <Check size={16} aria-hidden /> : state === 'failed' ? <X size={16} aria-hidden /> : i + 1}
          </button>
        )
      })}
    </div>
  )
}
