import { createEmptyCard, dateDiffInDays, fsrs, generatorParameters, Rating, type Card, type FSRS, type Grade } from 'ts-fsrs'
import type { StoredSafetyCard } from '../../types'

// When a Safety-check position comes back: FSRS (ts-fsrs 5.4.2, MIT), the free review schedule many flashcard apps
// use. Settings from research/2026-10-16-diagnosis/design/trainer-spec.md section 3: 90% target recall, at most 60
// days between reviews, whole days only (no 1- and 10-minute steps), default weights. The app grades every answer
// itself, never asks: wrong or "Show answer" = Again, right but slower than 90 s = Hard, right = Good.
// A position retires (leaves the queue for good) once it is answered right after 14 days or more (build plan S1).
//
// Without fuzz, a position answered right comes back after 3 days, then 14, and retires at that third answer; a
// missed one comes back the next day, then after 3, 8 and 22 days (checked in schedule.check.ts).

export const FSRS_SETTINGS = {
  request_retention: 0.9,
  maximum_interval: 60,
  enable_short_term: false,
} as const
/** A right answer at least this many days after the previous one retires the position. */
export const RETIRE_AFTER_DAYS = 14

const schedulers = new Map<boolean, FSRS>()
/** The app spreads due dates a little (fuzz) so positions do not bunch up; the checks turn that off. */
function scheduler(fuzz: boolean): FSRS {
  let s = schedulers.get(fuzz)
  if (!s) schedulers.set(fuzz, (s = fsrs(generatorParameters({ ...FSRS_SETTINGS, enable_fuzz: fuzz }))))
  return s
}

export type SafetyGrade = 1 | 2 | 3

/** The grade of a first answer of the day. A retry later the same day never changes it. */
export function gradeFor(answer: { ok: boolean; shownAnswer: boolean; msToMove: number }, slowMs: number): SafetyGrade {
  if (answer.shownAnswer || !answer.ok) return Rating.Again as SafetyGrade
  return answer.msToMove > slowMs ? (Rating.Hard as SafetyGrade) : (Rating.Good as SafetyGrade)
}

function toCard(s: StoredSafetyCard): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days,
    learning_steps: s.learning_steps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  }
}

function fromCard(c: Card): StoredSafetyCard {
  const out: StoredSafetyCard = {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state as StoredSafetyCard['state'],
  }
  if (c.last_review) out.last_review = c.last_review.toISOString()
  return out
}

/**
 * The schedule after one graded answer. `prev` is undefined for a new position. A right answer (Hard or Good)
 * given 14 or more calendar days after the previous answer retires the position.
 */
export function reviewCard(
  prev: StoredSafetyCard | undefined,
  grade: SafetyGrade,
  now: Date,
  opts: { fuzz?: boolean } = {},
): StoredSafetyCard {
  const card = prev ? toCard(prev) : createEmptyCard(now)
  const next = fromCard(scheduler(opts.fuzz ?? true).next(card, now, grade as Grade, (log) => log.card))
  if (grade !== Rating.Again && prev?.last_review && dateDiffInDays(new Date(prev.last_review), now) >= RETIRE_AFTER_DAYS) {
    next.retired = now.toISOString()
  }
  return next
}
