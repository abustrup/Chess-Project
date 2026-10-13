import { useCallback, useMemo } from 'react'
import type { TacticLesson, TacticsProgress } from '../../types'
import { KEYS, useStored } from '../../lib/storage'

type LessonProgress = TacticsProgress[string]

const NO_PROGRESS: TacticsProgress = {}

function blankProgress(lessonId: string): LessonProgress {
  return { lessonId, introSeen: false, examplesSeen: 0, solvedExerciseIds: [], failedAttempts: 0 }
}

/** Saved data can be damaged (edited by hand, an old version, a bad backup): never let it crash a page. */
function cleanAll(raw: unknown): TacticsProgress {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as TacticsProgress) : NO_PROGRESS
}

function count(value: unknown): number {
  // capped, so a damaged value never shows as "1e+308 wrong tries"
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), 99999) : 0
}

function cleanLesson(lessonId: string, raw: unknown): LessonProgress {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return blankProgress(lessonId)
  const p = raw as Partial<LessonProgress>
  return {
    ...p,
    lessonId,
    introSeen: p.introSeen === true,
    examplesSeen: count(p.examplesSeen),
    solvedExerciseIds: Array.isArray(p.solvedExerciseIds) ? p.solvedExerciseIds.filter((id) => typeof id === 'string') : [],
    failedAttempts: count(p.failedAttempts),
    completedAt: typeof p.completedAt === 'string' ? p.completedAt : undefined,
  }
}

/** What the cards and the stepper need to know about one lesson. */
export interface LessonStats {
  solved: number
  total: number
  started: boolean
  complete: boolean
}

/** Counts only exercises that still exist in the lesson, so edited lessons never show "12/10". */
export function lessonStats(lesson: TacticLesson, saved: LessonProgress | undefined): LessonStats {
  const progress = saved === undefined ? undefined : cleanLesson(lesson.id, saved)
  const solvedIds = new Set(progress?.solvedExerciseIds ?? [])
  const solved = lesson.exercises.filter((e) => solvedIds.has(e.id)).length
  const total = lesson.exercises.length
  const started = !!progress && (progress.introSeen || progress.examplesSeen > 0 || solved > 0 || progress.failedAttempts > 0)
  return { solved, total, started, complete: total > 0 && solved === total }
}

/** Progress of every lesson (for the overview). */
export function useAllTacticsProgress(): TacticsProgress {
  return cleanAll(useStored(KEYS.tacticsProgress, NO_PROGRESS)[0])
}

/** Progress of one lesson, plus the few ways the pages change it. Everything is saved in the browser. */
export function useLessonProgress(lesson: TacticLesson) {
  const [stored, setAll] = useStored(KEYS.tacticsProgress, NO_PROGRESS)
  const progress = useMemo(() => cleanLesson(lesson.id, cleanAll(stored)[lesson.id]), [stored, lesson.id])
  const lessonId = lesson.id

  const update = useCallback(
    (change: (current: LessonProgress) => LessonProgress) => {
      setAll((prev) => {
        const all = cleanAll(prev)
        return { ...all, [lessonId]: change(cleanLesson(lessonId, all[lessonId])) }
      })
    },
    [lessonId, setAll],
  )

  const markIntroSeen = useCallback(() => update((p) => (p.introSeen ? p : { ...p, introSeen: true })), [update])

  /** `count` = how many examples have been watched up to the end (we never go backwards). */
  const markExamplesSeen = useCallback(
    (count: number) => update((p) => (p.examplesSeen >= count ? p : { ...p, examplesSeen: count })),
    [update],
  )

  const addFailedAttempt = useCallback(() => update((p) => ({ ...p, failedAttempts: p.failedAttempts + 1 })), [update])

  const markSolved = useCallback(
    (exerciseId: string) =>
      update((p) => {
        if (p.solvedExerciseIds.includes(exerciseId)) return p
        const solvedExerciseIds = [...p.solvedExerciseIds, exerciseId]
        const everythingSolved = lesson.exercises.every((e) => solvedExerciseIds.includes(e.id))
        return {
          ...p,
          solvedExerciseIds,
          completedAt: everythingSolved && !p.completedAt ? new Date().toISOString() : p.completedAt,
        }
      }),
    [update, lesson],
  )

  return { progress, stats: lessonStats(lesson, progress), markIntroSeen, markExamplesSeen, addFailedAttempt, markSolved }
}
