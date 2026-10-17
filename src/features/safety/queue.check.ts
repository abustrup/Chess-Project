// Self-check of the Safety-check queue:   npx tsx src/features/safety/queue.check.ts
// Fixed clock 2026-10-20 08:00 UTC, fuzz off. Covers trainer-spec D5-D8 at the build plan's defaults (10 new + 10
// reviews, a setting), the new-position mix (about 35% held or quiet, quiet at most 15%) and "no two positions from
// the same game side by side" on the real card file, today's queue surviving a reload, retirement, and
// safetyDueToday() for Home.
import { readFileSync } from 'node:fs'
import {
  DEFAULT_SAFETY_SETTINGS,
  type SafetyCard,
  type SafetyDay,
  type SafetySettings,
  type SafetyState,
} from '../../types'
import { KEYS, writeStored } from '../../lib/storage'
import { cleanCardFile } from './cards'
import {
  NEW_MIX,
  QUIET_MAX_SHARE,
  addMoreNew,
  canSpread,
  currentDay,
  isDue,
  localDay,
  pickNew,
  planDay,
  remainingIds,
  safetyDueToday,
  spreadGames,
} from './queue'
import { applyAnswer, type Answer, type Store } from './record'
import { reviewCard } from './schedule'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

const CLOCK = new Date('2026-10-20T08:00:00Z')
const DAY = 86_400_000
const at = (days: number) => new Date(CLOCK.getTime() + days * DAY)

/* ---- synthetic cards ---- */
let serial = 0
function card(kind: SafetyCard['kind'], game: string, extra: Partial<SafetyCard> = {}): SafetyCard {
  serial++
  return {
    id: `${kind}:${game}:${serial}`,
    kind,
    cls: kind === 'own' ? 'allowed_longer_tactic' : kind,
    fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    lastMove: 'e2e4',
    lastMoveSan: 'e4',
    side: 'black',
    phase: 'opening',
    facingThreat: false,
    nothingToWin: false,
    wasWinning: false,
    winBefore: 50,
    top: [{ uci: 'e7e5', san: 'e5', win: 50, eval: { cp: 0 }, pv: ['e7e5'] }],
    topComplete: false,
    human: { uci: 'e7e5', san: 'e5', win: 50, eval: { cp: 0 }, passes: true, judgment: null, lichessJudgment: null, drop: 0 },
    threat: null,
    facts: [],
    context: { gameId: game, date: '2026-10-10', tc: '600+0', speed: 'rapid', rated: true, moveNumber: 10, clockMs: 300000, spentMs: 5000 },
    ...extra,
  }
}
const scheduled = (dueDays: number, extra: Partial<SafetyState[string]> = {}): SafetyState[string] => ({
  due: at(dueDays).toISOString(),
  stability: 3,
  difficulty: 5,
  elapsed_days: 3,
  scheduled_days: 3,
  learning_steps: 0,
  reps: 1,
  lapses: 0,
  state: 2,
  last_review: at(dueDays - 3).toISOString(),
  ...extra,
})
const sameGameNeighbours = (ids: string[], byId: Map<string, SafetyCard>) =>
  ids.filter((id, i) => i > 0 && byId.get(id)!.context.gameId === byId.get(ids[i - 1])!.context.gameId).length

/* ---- 1. spreading games: the feasibility rule against brute force ---- */
{
  function brute(counts: number[], prev: number | null): boolean {
    const items: number[] = counts.flatMap((c, g) => Array<number>(c).fill(g))
    const used = items.map(() => false)
    const go = (last: number | null, left: number): boolean => {
      if (left === 0) return true
      const tried = new Set<number>()
      for (let i = 0; i < items.length; i++) {
        if (used[i] || items[i] === last || tried.has(items[i])) continue
        tried.add(items[i])
        used[i] = true
        if (go(items[i], left - 1)) return (used[i] = false), true
        used[i] = false
      }
      return false
    }
    return go(prev, items.length)
  }
  let cases = 0
  let wrong = 0
  for (let a = 0; a <= 4; a++)
    for (let b = 0; b <= 4; b++)
      for (let c = 0; c <= 3; c++)
        for (const prev of [null, 0, 1, 2]) {
          const counts = [a, b, c]
          const map = new Map<string, number>()
          counts.forEach((n, g) => n > 0 && map.set(String(g), n))
          cases++
          if (canSpread(map, a + b + c, prev === null ? null : String(prev)) !== brute(counts, prev)) wrong++
        }
  check('the "can these be spread out" rule agrees with trying every order', wrong === 0, `${cases - wrong} of ${cases} cases`)

  let bad = 0
  for (let trial = 0; trial < 300; trial++) {
    const games = ['a', 'b', 'c', 'd'].slice(0, 2 + (trial % 3))
    const items = Array.from({ length: 3 + (trial % 9) }, (_, i) => games[(i * 7 + trial) % games.length] + (i % 2 ? '' : ''))
    const counts = new Map<string, number>()
    for (const g of items) counts.set(g, (counts.get(g) ?? 0) + 1)
    const out = spreadGames(items, (g) => g)
    const adjacent = out.filter((g, i) => i > 0 && g === out[i - 1]).length
    if (canSpread(counts, items.length, null) && adjacent > 0) bad++
    if (out.length !== items.length) bad++
  }
  check('spreadGames never puts one game twice in a row when that can be avoided', bad === 0, `${bad} bad of 300`)
}

/* ---- 2. D5 and the caps ---- */
{
  const cards: SafetyCard[] = []
  const state: SafetyState = {}
  for (let i = 0; i < 30; i++) {
    const c = card('own', `g${String(i).padStart(7, '0')}`)
    cards.push(c)
    state[c.id] = scheduled(-i) // due 0..29 days ago
  }
  for (let i = 0; i < 40; i++) cards.push(card(i % 3 === 0 ? 'held' : 'own', `n${String(i % 20).padStart(7, '0')}`))
  const byId = new Map(cards.map((c) => [c.id, c]))
  const plan = planDay(cards, state, DEFAULT_SAFETY_SETTINGS, CLOCK)
  const reviews = plan.ids.filter((id) => !plan.newIds.includes(id))
  check('defaults are 10 new + 10 reviews', DEFAULT_SAFETY_SETTINGS.newPerDay === 10 && DEFAULT_SAFETY_SETTINGS.maxReviews === 10)
  check('D5 30 due + 40 new: 10 reviews + 10 new by default', reviews.length === 10 && plan.newIds.length === 10, `${reviews.length} + ${plan.newIds.length}`)
  const overdue = [...reviews].sort((a, b) => Date.parse(state[a].due) - Date.parse(state[b].due))
  const tenMost = Object.keys(state).sort((a, b) => Date.parse(state[a].due) - Date.parse(state[b].due)).slice(0, 10)
  check('D5 the reviews are the 10 most overdue', overdue.join() === [...tenMost].join(), '')
  const spec = planDay(cards, state, { newPerDay: 5, maxReviews: 15 }, CLOCK)
  check('D5 with the spec caps (15 reviews, 5 new): 15 + 5', spec.ids.length - spec.newIds.length === 15 && spec.newIds.length === 5)
  check('no two positions from the same game side by side (D5 pool)', sameGameNeighbours(plan.ids, byId) === 0)
  const retired = { ...state, [cards[0].id]: { ...state[cards[0].id], retired: CLOCK.toISOString() } }
  check('a retired position is not due', !isDue(retired[cards[0].id], CLOCK) && !planDay(cards, retired, DEFAULT_SAFETY_SETTINGS, CLOCK).ids.includes(cards[0].id))
}

/* ---- 3. D6: own positions newest game first; within a game safety errors first, then the bigger drop ---- */
{
  const old = card('own', 'oldgame1', { cls: 'hung_piece' })
  const newBig = card('own', 'newgame1', { cls: 'allowed_longer_tactic', human: { ...card('own', 'x').human, drop: 40 } })
  const newSafety = card('own', 'newgame1', { cls: 'ignored_threat', human: { ...card('own', 'x').human, drop: 20 } })
  const newSafetyBig = card('own', 'newgame1', { cls: 'hung_piece', human: { ...card('own', 'x').human, drop: 30 } })
  const newest = card('own', 'newgame2', { cls: 'positional_or_endgame' })
  const file = [old, newBig, newSafety, newSafetyBig, newest] // the file lists games oldest first
  const order = pickNew(file, {}, 5).map((c) => c.id)
  check('D6 the newest game comes first', order[0] === newest.id, order.join(' '))
  check('D6 within a game: safety errors first, bigger drop first among them', order.indexOf(newSafetyBig.id) < order.indexOf(newSafety.id) && order.indexOf(newSafety.id) < order.indexOf(newBig.id), order.join(' '))
  check('D6 older games after newer ones in each round', order.indexOf(old.id) === 2, order.join(' '))
}

/* ---- 4. the real card file: the mix, quiet cap, adjacency, and many simulated days ---- */
{
  const file = cleanCardFile(JSON.parse(readFileSync(new URL('../../../public/data/safety/cards.json', import.meta.url), 'utf8')))
  const byId = new Map(file.cards.map((c) => [c.id, c]))
  const kinds = { own: 0, held: 0, quiet: 0 }
  for (const c of file.cards) kinds[c.kind]++
  check('the card file loads with every card intact', file.cards.length > 0, `${file.cards.length} cards: ${kinds.own} own, ${kinds.held} held, ${kinds.quiet} quiet`)
  check('the mix adds up to 1 with 35% held or quiet and quiet under its cap', Math.abs(NEW_MIX.own + NEW_MIX.held + NEW_MIX.quiet - 1) < 1e-9 && Math.abs(NEW_MIX.held + NEW_MIX.quiet - 0.35) < 1e-9 && NEW_MIX.quiet <= QUIET_MAX_SHARE)

  // simulate 14 days: every planned position answered (every 4th wrong), schedule without fuzz
  let state: SafetyState = {}
  let started: SafetyCard[] = []
  let adjacent = 0
  let maxQuietShare = 0
  let ownLeftDays = 0
  let shareWhileOwnLeft: number[] = []
  for (let d = 0; d < 14; d++) {
    const now = at(d)
    const plan = planDay(file.cards, state, DEFAULT_SAFETY_SETTINGS, now)
    adjacent += sameGameNeighbours(plan.ids, byId)
    const ownLeft = file.cards.some((c) => c.kind === 'own' && !state[c.id])
    for (const [i, id] of plan.ids.entries()) {
      if (plan.newIds.includes(id)) started.push(byId.get(id)!)
      state = { ...state, [id]: reviewCard(state[id], i % 4 === 3 ? 1 : 3, now, { fuzz: false }) }
    }
    const quiet = started.filter((c) => c.kind === 'quiet').length
    maxQuietShare = Math.max(maxQuietShare, quiet / Math.max(1, started.length))
    if (ownLeft) {
      ownLeftDays++
      shareWhileOwnLeft = [started.filter((c) => c.kind !== 'own').length, started.length]
    }
  }
  const [nonOwn, all] = shareWhileOwnLeft
  const share = nonOwn / all
  check('about 35% of new positions are held or quiet while own ones remain', share >= 0.3 && share <= 0.4, `${nonOwn} of ${all} = ${(100 * share).toFixed(0)}% after ${ownLeftDays} days`)
  check('quiet positions never above 15% of those started', maxQuietShare <= QUIET_MAX_SHARE + 1e-9, `highest ${(100 * maxQuietShare).toFixed(1)}%`)
  check('14 simulated days: no two positions from the same game side by side', adjacent === 0, `${adjacent} pairs`)
  const first = planDay(file.cards, {}, DEFAULT_SAFETY_SETTINGS, CLOCK)
  const firstKinds = first.ids.map((id) => byId.get(id)!.kind)
  check('the first day: 10 new, 3 or 4 of them held or quiet, at most 1 quiet', first.ids.length === 10 && [3, 4].includes(firstKinds.filter((k) => k !== 'own').length) && firstKinds.filter((k) => k === 'quiet').length <= 1, firstKinds.join(' '))
}

/* ---- 5. today's queue: a reload keeps it; caps changes count what is done; D8 repeats; retries ---- */
{
  const cards = ['g1', 'g2', 'g3', 'g4', 'g1', 'g2'].map((g) => card('own', `game000${g.slice(1)}`))
  const settings: SafetySettings = { ...DEFAULT_SAFETY_SETTINGS, newPerDay: 4 }
  const day0 = currentDay(cards, {}, settings, CLOCK, null)
  check('a new day plans 4 new positions', day0.ids.length === 4 && day0.date === localDay(CLOCK))
  const reloaded = currentDay(cards, {}, settings, CLOCK, JSON.parse(JSON.stringify(day0)) as SafetyDay)
  check('a reload keeps the same queue in the same order', JSON.stringify(reloaded) === JSON.stringify(day0))

  const answer = (ok: boolean, extra: Partial<Answer> = {}): Answer => ({
    move: 'e7e5', ok, loss: ok ? 0 : 20, by: 'top', checked: 'his bishop', msToMove: 20_000, msToWrite: 8_000, shownAnswer: false, retry: false, ...extra,
  })
  let store: Store = { state: {}, log: [], day: day0, settings }
  const firstId = remainingIds(store.day)[0]
  const r1 = applyAnswer(store, firstId, 'first', answer(false), at(0.01), { fuzz: false })
  store = r1
  check('a first answer is graded and moves the schedule', r1.row.grade === 1 && !!r1.state[firstId] && r1.state[firstId].due.startsWith('2026-10-21'))
  check('D8 a missed position comes back once at the end of the session', remainingIds(store.day).at(-1) === firstId && remainingIds(store.day).filter((id) => id === firstId).length === 1)

  const retry = applyAnswer(store, firstId, 'first', answer(true, { retry: true, checked: '' }), at(0.02), { fuzz: false })
  check('D4 a retry adds a log row but no grade', retry.log.length === 2 && retry.row.how === 'retry' && retry.row.grade === undefined)
  check('D4 a retry leaves the schedule and the queue alone', JSON.stringify(retry.state) === JSON.stringify(store.state) && JSON.stringify(retry.day) === JSON.stringify(store.day))
  store = retry

  // answer the rest, then the repeat
  for (const id of remainingIds(store.day).filter((id) => id !== firstId)) store = applyAnswer(store, id, 'first', answer(true), at(0.03), { fuzz: false })
  const before = JSON.stringify(store.state)
  const rep = applyAnswer(store, firstId, 'repeat', answer(true), at(0.04), { fuzz: false })
  check('D8 the repeat writes a log row but changes no schedule', rep.row.how === 'repeat' && rep.row.grade === undefined && JSON.stringify(rep.state) === before)
  check('after the repeat nothing is left today', remainingIds(rep.day).length === 0, remainingIds(rep.day).join())
  store = rep

  // a cap raised mid-day: what is done counts, the rest is planned again
  const more = currentDay(cards, store.state, { ...settings, newPerDay: 6 }, at(0.05), store.day)
  check('raising the new-position cap mid-day adds only the difference', more.ids.length === 6 && remainingIds(more).length === 2, `${more.ids.length} planned, ${remainingIds(more).length} left`)
  const extra = addMoreNew(store.day, cards, store.state, 5)
  check('"5 more new positions" adds the unseen ones, no duplicates', extra.ids.length === 6 && new Set(extra.ids).size === 6)

  // the next day: yesterday's miss is due, the right ones are not
  const tomorrow = currentDay(cards, store.state, settings, at(1), store.day)
  check('the next day starts a fresh queue with yesterday\'s miss as a review', tomorrow.date !== store.day.date && tomorrow.ids.includes(firstId) && !tomorrow.newIds.includes(firstId))

  // the repeats at the end of a session are spread too: misses A1 B1 A2 (games A, B, A), last one shown A2
  const missed: SafetyDay = {
    date: '2026-10-20',
    ids: ['own:A:1', 'own:B:1', 'own:A:2'],
    newIds: [],
    done: ['own:A:1', 'own:B:1', 'own:A:2'],
    repeats: ['own:A:1', 'own:A:2', 'own:B:1'],
    repeatsDone: [],
    caps: [10, 10],
  }
  check('repeats avoid the game just shown and each other when they can', remainingIds(missed).join(' ') === 'own:B:1 own:A:1 own:A:2', remainingIds(missed).join(' '))
  const fourMisses = { ...missed, repeats: ['own:A:1', 'own:A:2', 'own:B:1', 'own:C:1'], done: ['own:A:1', 'own:B:1', 'own:A:2', 'own:C:1'] }
  check('repeats: no two of one game side by side when avoidable', remainingIds(fourMisses).join(' ') === 'own:A:1 own:B:1 own:A:2 own:C:1', remainingIds(fourMisses).join(' '))

  // safetyDueToday for Home, with a tiny in-memory localStorage
  const mem = new Map<string, string>()
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  }
  writeStored(KEYS.safetySettings, settings)
  check('safetyDueToday: nothing planned and no cards given is unknown (null)', safetyDueToday(null, CLOCK) === null)
  check('safetyDueToday with the cards: the 4 planned positions', safetyDueToday(cards, CLOCK) === 4)
  writeStored(KEYS.safetyDay, day0)
  writeStored(KEYS.safetyState, {})
  check('safetyDueToday without the cards reads today\'s saved queue', safetyDueToday(undefined, CLOCK) === 4)
  writeStored(KEYS.safetyDay, store.day)
  writeStored(KEYS.safetyState, store.state)
  check('safetyDueToday is 0 once today is done', safetyDueToday(cards, CLOCK) === 0 && safetyDueToday(null, CLOCK) === 0)
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall queue checks passed')
process.exit(failures ? 1 : 0)
