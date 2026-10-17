import type { SafetyCard, SafetyDay, SafetyKind, SafetySettings, SafetyState, StoredSafetyCard } from '../../types'
import { readDay, readSettings, readState } from './stored'

// Today's Safety-check queue, as pure functions (queue.check.ts runs them without a browser).
//
// 1. Reviews: positions whose next review falls today or earlier, most overdue first, at most `maxReviews`.
// 2. New positions, at most `newPerDay`. Over time about 35% of them hide no mistake of his: held threats (25%) and
//    quiet positions (10%, never above 15%), so the check is trained, not trick-hunting (build plan S1). Own
//    mistakes come newest game first; within a game the one-move safety errors first, then the bigger drop.
// 3. The order avoids two positions from the same game next to each other whenever the day's mix allows it.
// 4. A position missed today comes back once at the end of the session; that repeat changes no schedule.
//
// The day's queue is saved (cc.safety.day), so a reload keeps the order and what is left. It is rebuilt when the
// date or the daily caps change; positions already answered today count against the caps.

/** Share of new positions per kind, while each kind has positions left. */
export const NEW_MIX: Record<SafetyKind, number> = { own: 0.65, held: 0.25, quiet: 0.1 }
/** Quiet positions never go above this share of all positions he has started. */
export const QUIET_MAX_SHARE = 0.15
const KINDS: SafetyKind[] = ['own', 'held', 'quiet']

// my-games categories, safest teaching first: one-move safety errors, then other tactics, then the rest
const CLASS_RANK: Record<string, number> = {
  hung_piece: 0,
  ignored_threat: 0,
  allowed_short_mate: 0,
  allowed_longer_tactic: 1,
  missed_free_material: 1,
  missed_own_tactic: 1,
  missed_short_mate: 1,
}

/* ---------------------------------------------------------------- dates */

/** The local calendar date, YYYY-MM-DD. */
export function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** A review is due today when its due time falls before tonight's midnight, so the time of day never matters. */
export function isDue(s: StoredSafetyCard, now: Date): boolean {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()
  return !s.retired && Date.parse(s.due) < midnight
}

/* ---------------------------------------------------------------- picking */

export const kindOfId = (id: string): string => id.split(':')[0]
const plyOf = (c: SafetyCard) => Number(c.id.split(':').pop()) || 0

/** Cards of one kind, newest game first and spread over games (one per game per round). */
function orderKind(cards: SafetyCard[], gameRank: Map<string, number>, within: (a: SafetyCard, b: SafetyCard) => number) {
  const byGame = new Map<string, SafetyCard[]>()
  for (const c of cards) {
    const list = byGame.get(c.context.gameId)
    if (list) list.push(c)
    else byGame.set(c.context.gameId, [c])
  }
  const games = [...byGame.keys()].sort((a, b) => (gameRank.get(b) ?? 0) - (gameRank.get(a) ?? 0) || (a < b ? -1 : 1))
  const lists = games.map((g) => byGame.get(g)!.sort((a, b) => within(a, b) || plyOf(a) - plyOf(b)))
  const out: SafetyCard[] = []
  for (let round = 0; out.length < cards.length; round++) for (const l of lists) if (l[round]) out.push(l[round])
  return out
}

const byOwnPriority = (a: SafetyCard, b: SafetyCard) =>
  (CLASS_RANK[a.cls] ?? 2) - (CLASS_RANK[b.cls] ?? 2) || b.human.drop - a.human.drop
const byHeldPriority = (a: SafetyCard, b: SafetyCard) =>
  Number(b.nothingToWin) - Number(a.nothingToWin) || (b.threat?.loss ?? 0) - (a.threat?.loss ?? 0)
const byQuietPriority = (a: SafetyCard, b: SafetyCard) => Number(b.wasWinning) - Number(a.wasWinning)

/** How many positions of each kind he has started so far (from the saved schedule, files old and new). */
export function startedByKind(state: SafetyState): Record<SafetyKind, number> {
  const out: Record<SafetyKind, number> = { own: 0, held: 0, quiet: 0 }
  for (const id of Object.keys(state)) {
    const k = kindOfId(id)
    if (k === 'own' || k === 'held' || k === 'quiet') out[k]++
  }
  return out
}

/**
 * The next `n` new positions. Each slot goes to the kind furthest below its share (NEW_MIX) counting everything
 * started so far, among kinds with positions left; quiet only while it stays within QUIET_MAX_SHARE.
 */
export function pickNew(cards: readonly SafetyCard[], state: SafetyState, n: number): SafetyCard[] {
  const gameRank = new Map<string, number>()
  cards.forEach((c, i) => {
    if (!gameRank.has(c.context.gameId)) gameRank.set(c.context.gameId, i) // the file lists games oldest first
  })
  const fresh = cards.filter((c) => !state[c.id])
  const pools: Record<SafetyKind, SafetyCard[]> = {
    own: orderKind(fresh.filter((c) => c.kind === 'own'), gameRank, byOwnPriority),
    held: orderKind(fresh.filter((c) => c.kind === 'held'), gameRank, byHeldPriority),
    quiet: orderKind(fresh.filter((c) => c.kind === 'quiet'), gameRank, byQuietPriority),
  }
  const counts = startedByKind(state)
  let total = counts.own + counts.held + counts.quiet
  const out: SafetyCard[] = []
  while (out.length < n) {
    let best: SafetyKind | null = null
    let bestDeficit = -Infinity
    for (const k of KINDS) {
      if (pools[k].length === 0) continue
      if (k === 'quiet' && counts.quiet + 1 > QUIET_MAX_SHARE * (total + 1)) continue
      const deficit = NEW_MIX[k] * (total + 1) - counts[k]
      if (deficit > bestDeficit + 1e-9) {
        best = k
        bestDeficit = deficit
      }
    }
    if (!best) break
    out.push(pools[best].shift()!)
    counts[best]++
    total++
  }
  return out
}

/* ---------------------------------------------------------------- order */

/**
 * Can `n` positions with these per-game counts be put in a row with no two from one game side by side, the first
 * not from `prev`? (Standard result: the biggest game may fill at most every other place; with `prev` in front, a
 * game other than `prev` that needs every other place of an odd row would have to go first, which `prev` blocks.)
 */
export function canSpread(counts: Map<string, number>, n: number, prev: string | null): boolean {
  if (n === 0) return true
  const m = prev === null ? n : n + 1
  const half = Math.ceil(m / 2)
  for (const [g, c] of counts) {
    const k = g === prev ? c + 1 : c
    if (k > half) return false
    if (prev !== null && g !== prev && m % 2 === 1 && k === half) return false
  }
  return true
}

/** Keeps the priority order where it can, but never puts two positions of one game side by side when avoidable. */
export function spreadGames<T>(items: readonly T[], gameOf: (x: T) => string, prev: string | null = null): T[] {
  const left = [...items]
  const counts = new Map<string, number>()
  for (const x of left) counts.set(gameOf(x), (counts.get(gameOf(x)) ?? 0) + 1)
  const out: T[] = []
  while (left.length) {
    let pick = -1
    for (let i = 0; i < left.length && pick < 0; i++) {
      const g = gameOf(left[i])
      if (g === prev) continue
      counts.set(g, counts.get(g)! - 1)
      if (canSpread(counts, left.length - 1, g)) pick = i
      counts.set(g, counts.get(g)! + 1)
    }
    if (pick < 0) pick = Math.max(0, left.findIndex((x) => gameOf(x) !== prev)) // not avoidable: keep priority
    const [x] = left.splice(pick, 1)
    const g = gameOf(x)
    counts.set(g, counts.get(g)! - 1)
    if (counts.get(g) === 0) counts.delete(g)
    out.push(x)
    prev = g
  }
  return out
}

/* ---------------------------------------------------------------- the day */

export interface DayPlan {
  ids: string[]
  newIds: string[]
}

/** Today's reviews and new positions, in order, for the given caps. */
export function planDay(
  cards: readonly SafetyCard[],
  state: SafetyState,
  caps: { newPerDay: number; maxReviews: number },
  now: Date,
  prevGame: string | null = null,
): DayPlan {
  const reviews = cards
    .filter((c) => state[c.id] && isDue(state[c.id], now))
    .sort((a, b) => Date.parse(state[a.id].due) - Date.parse(state[b.id].due) || (a.id < b.id ? -1 : 1))
    .slice(0, Math.max(0, caps.maxReviews))
  const fresh = pickNew(cards, state, Math.max(0, caps.newPerDay))
  const ordered = spreadGames([...reviews, ...fresh], (c) => c.context.gameId, prevGame)
  return { ids: ordered.map((c) => c.id), newIds: fresh.map((c) => c.id) }
}

/** The game a position comes from, read from its id ('own:<gameId>:<ply>', 'held:...', 'quiet:...'). */
const gameOfId = (id: string): string => id.split(':')[1] ?? id

/**
 * Positions still to do today, in order: first answers, then the repeats of today's misses. The repeats are spread
 * like the plan, so two positions of one game do not follow each other (counting the one just answered) unless
 * that cannot be avoided, as when the last position of the day was the only miss.
 */
export function remainingIds(day: SafetyDay): string[] {
  const first = day.ids.filter((id) => !day.done.includes(id))
  const repeats = day.repeats.filter((id) => !day.repeatsDone.includes(id))
  const before = first.length ? first[first.length - 1] : (day.repeatsDone.at(-1) ?? day.done.at(-1))
  return [...first, ...spreadGames(repeats, gameOfId, before === undefined ? null : gameOfId(before))]
}

/**
 * Today's queue: the saved one when it is from today with the same caps; otherwise a fresh plan in which the
 * positions already answered today count against the caps. Positions no longer in the card file are skipped.
 */
export function currentDay(
  cards: readonly SafetyCard[],
  state: SafetyState,
  settings: Pick<SafetySettings, 'newPerDay' | 'maxReviews'>,
  now: Date,
  saved: SafetyDay | null,
): SafetyDay {
  const date = localDay(now)
  const known = new Set(cards.map((c) => c.id))
  const caps: [number, number] = [settings.newPerDay, settings.maxReviews]
  const today = saved && saved.date === date ? saved : null
  if (today && today.caps[0] === caps[0] && today.caps[1] === caps[1]) {
    const keep = (ids: string[]) => ids.filter((id) => known.has(id))
    return { ...today, ids: keep(today.ids), repeats: keep(today.repeats) }
  }
  const done = today?.done ?? []
  const newDone = done.filter((id) => today?.newIds.includes(id))
  const lastDone = done.length ? cards.find((c) => c.id === done[done.length - 1])?.context.gameId ?? null : null
  const plan = planDay(
    cards,
    state,
    { newPerDay: settings.newPerDay - newDone.length, maxReviews: settings.maxReviews - (done.length - newDone.length) },
    now,
    lastDone,
  )
  return {
    date,
    ids: [...done, ...plan.ids.filter((id) => !done.includes(id))],
    newIds: [...newDone, ...plan.newIds],
    done,
    repeats: (today?.repeats ?? []).filter((id) => known.has(id)),
    repeatsDone: today?.repeatsDone ?? [],
    caps,
  }
}

/** After an answer: a first answer is done (and a miss is queued once more at the end); a repeat is done. */
export function markAnswered(day: SafetyDay, id: string, how: 'first' | 'repeat' | 'retry', ok: boolean): SafetyDay {
  if (how === 'first' && !day.done.includes(id)) {
    return {
      ...day,
      done: [...day.done, id],
      repeats: ok || day.repeats.includes(id) ? day.repeats : [...day.repeats, id],
    }
  }
  if (how === 'repeat' && !day.repeatsDone.includes(id)) return { ...day, repeatsDone: [...day.repeatsDone, id] }
  return day
}

/** Adds `n` more new positions to today's queue (the "More positions" button), if any are left. */
export function addMoreNew(day: SafetyDay, cards: readonly SafetyCard[], state: SafetyState, n: number): SafetyDay {
  const planned = new Set(day.ids)
  const extra = pickNew(
    cards.filter((c) => !planned.has(c.id)),
    state,
    n,
  )
  const last = day.ids.length ? cards.find((c) => c.id === day.ids[day.ids.length - 1])?.context.gameId ?? null : null
  const ordered = spreadGames(extra, (c) => c.context.gameId, last).map((c) => c.id)
  return { ...day, ids: [...day.ids, ...ordered], newIds: [...day.newIds, ...ordered] }
}

/**
 * For Home's plan (H2): how many Safety-check positions are left today, reviews and new together. Pass the card
 * file's cards (`loadSafetyCards()` in cards.ts) once the study gate is open; without them the answer comes from
 * today's saved queue, or is null when the trainer has not planned today yet. Call it only when the gate is open.
 */
export function safetyDueToday(cards?: readonly SafetyCard[] | null, now: Date = new Date()): number | null {
  const saved = readDay()
  if (!cards) return saved && saved.date === localDay(now) ? remainingIds(saved).length : null
  return remainingIds(currentDay(cards, readState(), readSettings(), now, saved)).length
}
