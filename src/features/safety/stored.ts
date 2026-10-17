import {
  DEFAULT_SAFETY_SETTINGS,
  type SafetyAttempt,
  type SafetyDay,
  type SafetySettings,
  type SafetyState,
  type StoredSafetyCard,
} from '../../types'
import { KEYS, readStored, writeStored } from '../../lib/storage'

// What the Safety check remembers in this browser, all under cc.safety.* (so Settings backup covers it):
// the schedule per position, every answer, the daily caps and today's queue. Saved data can be old or edited by
// hand, so every read is cleaned first; one bad row never breaks the page. No React and no ts-fsrs here, so Home can
// count today's positions without loading the trainer.

/** Newest answers kept (about 1 MB at most); older rows drop off the front. */
export const LOG_CAP = 3000

function asObject(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
}
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isStrList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

function cleanStoredCard(v: unknown): StoredSafetyCard | null {
  const o = asObject(v)
  if (!o || !isDate(o.due)) return null
  const nums = ['stability', 'difficulty', 'scheduled_days', 'reps', 'lapses'] as const
  if (!nums.every((k) => isNum(o[k]))) return null
  const state = o.state
  if (state !== 0 && state !== 1 && state !== 2 && state !== 3) return null
  const out: StoredSafetyCard = {
    due: o.due,
    stability: o.stability as number,
    difficulty: o.difficulty as number,
    elapsed_days: isNum(o.elapsed_days) ? o.elapsed_days : 0,
    scheduled_days: o.scheduled_days as number,
    learning_steps: isNum(o.learning_steps) ? o.learning_steps : 0,
    reps: o.reps as number,
    lapses: o.lapses as number,
    state,
  }
  if (isDate(o.last_review)) out.last_review = o.last_review
  if (isDate(o.retired)) out.retired = o.retired
  return out
}

export function cleanState(v: unknown): SafetyState {
  const out: SafetyState = {}
  for (const [id, raw] of Object.entries(asObject(v) ?? {})) {
    const card = cleanStoredCard(raw)
    if (card) out[id] = card
  }
  return out
}

function cleanAttempt(v: unknown): SafetyAttempt | null {
  const o = asObject(v)
  if (!o || typeof o.cardId !== 'string' || !isDate(o.at) || typeof o.ok !== 'boolean') return null
  const how = o.how === 'repeat' || o.how === 'retry' ? o.how : 'first'
  const row: SafetyAttempt = {
    cardId: o.cardId,
    at: o.at,
    ok: o.ok,
    loss: isNum(o.loss) ? o.loss : null,
    checked: typeof o.checked === 'string' ? o.checked : '',
    msToMove: isNum(o.msToMove) ? o.msToMove : 0,
    msToWrite: isNum(o.msToWrite) ? o.msToWrite : 0,
    shownAnswer: o.shownAnswer === true,
    how,
  }
  if (typeof o.move === 'string') row.move = o.move
  if (o.grade === 1 || o.grade === 2 || o.grade === 3) row.grade = o.grade
  if (o.by === 'top' || o.by === 'game' || o.by === 'complete' || o.by === 'engine' || o.by === 'moves') row.by = o.by
  return row
}

export function cleanLog(v: unknown): SafetyAttempt[] {
  return (Array.isArray(v) ? v.map(cleanAttempt) : []).filter((r): r is SafetyAttempt => r !== null)
}

const clampInt = (v: unknown, lo: number, hi: number, fallback: number) =>
  isNum(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : fallback

export const SETTING_LIMITS = { newPerDay: [0, 30], maxReviews: [0, 50] } as const

export function cleanSettings(v: unknown): SafetySettings {
  const o = asObject(v) ?? {}
  const d = DEFAULT_SAFETY_SETTINGS
  return {
    newPerDay: clampInt(o.newPerDay, ...SETTING_LIMITS.newPerDay, d.newPerDay),
    maxReviews: clampInt(o.maxReviews, ...SETTING_LIMITS.maxReviews, d.maxReviews),
    slowMs: clampInt(o.slowMs, 10_000, 600_000, d.slowMs),
  }
}

export function cleanDay(v: unknown): SafetyDay | null {
  const o = asObject(v)
  if (!o || typeof o.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return null
  const lists = ['ids', 'newIds', 'done', 'repeats', 'repeatsDone'] as const
  if (!lists.every((k) => isStrList(o[k]))) return null
  const caps = Array.isArray(o.caps) && o.caps.length === 2 && o.caps.every(isNum) ? (o.caps as [number, number]) : null
  if (!caps) return null
  return {
    date: o.date,
    ids: o.ids as string[],
    newIds: o.newIds as string[],
    done: o.done as string[],
    repeats: o.repeats as string[],
    repeatsDone: o.repeatsDone as string[],
    caps,
  }
}

/* ---- reads and writes (the page uses useStored on the same keys, so it re-renders on every write) ---- */

export const readState = () => cleanState(readStored<unknown>(KEYS.safetyState, {}))
export const readLog = () => cleanLog(readStored<unknown>(KEYS.safetyLog, []))
export const readSettings = () => cleanSettings(readStored<unknown>(KEYS.safetySettings, DEFAULT_SAFETY_SETTINGS))
export const readDay = () => cleanDay(readStored<unknown>(KEYS.safetyDay, null))

export function writeSettings(s: SafetySettings) {
  writeStored(KEYS.safetySettings, cleanSettings(s))
}

export function writeDay(day: SafetyDay) {
  writeStored(KEYS.safetyDay, day)
}

/** The line he wrote the last time he answered this position (before `beforeIso`), if any. */
export function lastWrittenLine(log: readonly SafetyAttempt[], cardId: string, beforeIso?: string): SafetyAttempt | null {
  for (let i = log.length - 1; i >= 0; i--) {
    const row = log[i]
    if (row.cardId !== cardId || !row.checked) continue
    if (beforeIso && row.at >= beforeIso) continue
    return row
  }
  return null
}
