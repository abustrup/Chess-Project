import type { SafetyAttempt, SafetyDay, SafetySettings, SafetyState, StoredSafetyCard } from '../../types'
import type { DecidedBy } from './accept'
import { markAnswered } from './queue'
import { gradeFor, reviewCard } from './schedule'
import { LOG_CAP } from './stored'

// What one answer changes, as a pure function (the page saves the result; queue.check.ts tests it):
// - every answer adds a row to the log;
// - only the first answer of the day is graded and moves the schedule (FSRS); a miss also queues one repeat;
// - the repeat at the end of the session, and any retry after a miss, change nothing but the log.

/** What the page hands over for one answer. */
export interface Answer {
  move?: string
  ok: boolean
  loss: number | null
  by?: DecidedBy
  checked: string
  msToMove: number
  msToWrite: number
  shownAnswer: boolean
  retry: boolean
}

export interface Store {
  state: SafetyState
  log: SafetyAttempt[]
  day: SafetyDay
  settings: SafetySettings
}

export function applyAnswer(
  store: Store,
  cardId: string,
  how: 'first' | 'repeat',
  a: Answer,
  now: Date,
  opts: { fuzz?: boolean } = {},
): Store & { scheduled: StoredSafetyCard | null; row: SafetyAttempt } {
  const row: SafetyAttempt = {
    cardId,
    at: now.toISOString(),
    ok: a.ok,
    loss: a.loss === null ? null : Math.round(a.loss * 10) / 10,
    checked: a.checked,
    msToMove: Math.max(0, Math.round(a.msToMove)),
    msToWrite: Math.max(0, Math.round(a.msToWrite)),
    shownAnswer: a.shownAnswer,
    how: a.retry ? 'retry' : how,
  }
  if (a.move) row.move = a.move
  if (a.by) row.by = a.by
  let state = store.state
  let scheduled: StoredSafetyCard | null = null
  if (row.how === 'first') {
    const grade = gradeFor(a, store.settings.slowMs)
    scheduled = reviewCard(store.state[cardId], grade, now, opts)
    state = { ...store.state, [cardId]: scheduled }
    row.grade = grade
  }
  const log = [...store.log, row]
  const day = a.retry ? store.day : markAnswered(store.day, cardId, how, a.ok && !a.shownAnswer)
  return { state, log: log.length > LOG_CAP ? log.slice(log.length - LOG_CAP) : log, day, settings: store.settings, scheduled, row }
}
