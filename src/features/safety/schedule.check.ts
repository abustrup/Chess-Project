// Self-check of the Safety-check schedule:   npx tsx src/features/safety/schedule.check.ts
// trainer-spec D1-D4 with fuzz off and a fixed clock of 2026-10-20 08:00 UTC, plus the retirement rule (build plan S1:
// a position answered right after 14 days or more leaves the queue) and the exact ts-fsrs pin.
import { readFileSync } from 'node:fs'
import type { StoredSafetyCard } from '../../types'
import { FSRS_SETTINGS, RETIRE_AFTER_DAYS, gradeFor, reviewCard, type SafetyGrade } from './schedule'
import { isDue } from './queue'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

const CLOCK = new Date('2026-10-20T08:00:00Z')
const DAY = 86_400_000
const day = (iso: string) => iso.slice(0, 10)
const gap = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY)

/** Answers on each due date, starting at CLOCK; returns the schedule after every answer. */
function answer(grades: SafetyGrade[]): StoredSafetyCard[] {
  const out: StoredSafetyCard[] = []
  let card: StoredSafetyCard | undefined
  let now = CLOCK
  for (const g of grades) {
    card = reviewCard(card, g, now, { fuzz: false })
    out.push(card)
    now = new Date(card.due)
  }
  return out
}
const AGAIN = 1 as const
const HARD = 2 as const
const GOOD = 3 as const

// --- the pin: exactly ts-fsrs 5.4.2 in package.json, the lockfile and node_modules
const pkg = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'))
const lock = JSON.parse(readFileSync(new URL('../../../package-lock.json', import.meta.url), 'utf8'))
const installed = JSON.parse(readFileSync(new URL('../../../node_modules/ts-fsrs/package.json', import.meta.url), 'utf8'))
check('package.json pins ts-fsrs at exactly 5.4.2', pkg.dependencies?.['ts-fsrs'] === '5.4.2', pkg.dependencies?.['ts-fsrs'])
check('package-lock.json resolves ts-fsrs 5.4.2', lock.packages?.['node_modules/ts-fsrs']?.version === '5.4.2')
check('the installed ts-fsrs is 5.4.2, MIT', installed.version === '5.4.2' && installed.license === 'MIT', `${installed.version} ${installed.license}`)
check('settings: 90% retention, 60-day cap, whole days', FSRS_SETTINGS.request_retention === 0.9 && FSRS_SETTINGS.maximum_interval === 60 && FSRS_SETTINGS.enable_short_term === false)

// --- D1: new position, Good: due 2026-10-23; Good again: +14 d; (without retirement the next would be +57 d)
{
  const s = answer([GOOD, GOOD])
  check('D1 Good on a new position: due 2026-10-23', day(s[0].due) === '2026-10-23', s[0].due)
  check('D1 Good again: 14 days later', gap(s[0].due, s[1].due) === 14, `${gap(s[0].due, s[1].due)} d`)
  check('D1 not retired after +3 d', !s[0].retired && !s[1].retired)
  const third = reviewCard(s[1], GOOD, new Date(s[1].due), { fuzz: false })
  check(`D1 the third Good comes ${RETIRE_AFTER_DAYS} days after the second, so the position retires`, !!third.retired, third.retired ?? 'not retired')
  check('D1 the schedule itself would say +57 d (spec E11)', gap(s[1].due, third.due) === 57, `${gap(s[1].due, third.due)} d`)
  check('D1 a retired position is never due again', !isDue(third, new Date(Date.parse(third.due) + 365 * DAY)))
}

// --- D2: new position, Again: due 2026-10-21; then Good +3 d, +8 d, +22 d
{
  const s = answer([AGAIN, GOOD, GOOD, GOOD])
  check('D2 Again on a new position: due 2026-10-21', day(s[0].due) === '2026-10-21', s[0].due)
  const gaps = [1, 2, 3].map((i) => gap(s[i - 1].due, s[i].due))
  check('D2 then Good: +3, +8, +22 days', gaps.join(',') === '3,8,22', gaps.join(','))
  check('D2 none of those answers retires it (all under 14 days apart)', s.every((c) => !c.retired))
  const fifth = reviewCard(s[3], GOOD, new Date(s[3].due), { fuzz: false })
  check('D2 the Good after the 22-day gap retires it', !!fifth.retired)
}

// --- D3: Good, Good, Again: +2 d; no gap above 61 days, whatever the answers
{
  const s = answer([GOOD, GOOD, AGAIN])
  check('D3 Good, Good, Again: back after 2 days', gap(s[1].due, s[2].due) === 2, `${gap(s[1].due, s[2].due)} d`)
  check('D3 a miss after 14 days does not retire it', !s[2].retired)
  let card: StoredSafetyCard | undefined
  let now = CLOCK
  let maxGap = 0
  for (let i = 0; i < 12; i++) {
    const next = reviewCard(card, GOOD, now, { fuzz: false })
    maxGap = Math.max(maxGap, gap(now.toISOString(), next.due))
    card = { ...next, retired: undefined } // keep going past retirement to test the cap
    now = new Date(next.due)
  }
  check('D3 no interval above 61 days', maxGap <= 61, `longest ${maxGap} d`)
}

// --- D4: the grade is decided by the app
{
  const slow = 90_000
  check('D4 wrong first move gives 1 (Again)', gradeFor({ ok: false, shownAnswer: false, msToMove: 5_000 }, slow) === 1)
  check('D4 right after 95 s gives 2 (Hard)', gradeFor({ ok: true, shownAnswer: false, msToMove: 95_000 }, slow) === 2)
  check('D4 right in 20 s gives 3 (Good)', gradeFor({ ok: true, shownAnswer: false, msToMove: 20_000 }, slow) === 3)
  check('D4 "Show answer" gives 1 (Again)', gradeFor({ ok: false, shownAnswer: true, msToMove: 3_000 }, slow) === 1)
  // a retry never reaches the schedule: the page calls reviewCard only for the first answer of the day
  // (SafetyPage onAnswer, checked in the browser by safety.e2e.ts); here: the same answer twice is not idempotent,
  // so a second call would show up as a different schedule
  const once = reviewCard(undefined, AGAIN, CLOCK, { fuzz: false })
  const twice = reviewCard(once, GOOD, new Date(CLOCK.getTime() + 60_000), { fuzz: false })
  check('D4 a second update the same day would change the schedule (so the page must skip retries)', twice.due !== once.due)
}

// --- the app's fuzz stays within a day or so of the plain schedule
{
  const plain = reviewCard(undefined, GOOD, CLOCK, { fuzz: false })
  const fuzzed = reviewCard(plain, GOOD, new Date(plain.due), { fuzz: true })
  const plain2 = reviewCard(plain, GOOD, new Date(plain.due), { fuzz: false })
  check('fuzz moves the 14-day step by at most 3 days', Math.abs(gap(plain2.due, fuzzed.due)) <= 3, `${gap(plain2.due, fuzzed.due)} d`)
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall schedule checks passed')
process.exit(failures ? 1 : 0)
