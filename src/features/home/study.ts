// The study status card on Home: how many of his rated 10+0 games the study has counted, the phase, the next
// milestone and, once the daily job has written public/data/study/verdict.json, the verdict.
// Rules (research/2026-10-16-diagnosis/build-plan.md, H1): no blunder rate on screen before a verdict exists, so a
// running number cannot steer how he plays; at games 110 and 160 the card asks for his backup (training dose for the
// report). Pure functions, no React, so the checks can run them without a browser (progress.check.ts).

import { PHASE_LABELS, type StudyGate } from '../../lib/studyGate'
import { daysAgo, plural } from './format'

/** The two looks of the pre-registered study (verdict.py windows with the trainer after game 40). */
export const FIRST_CHECK_GAME = 110
export const FINAL_CHECK_GAME = 160
export type CheckGame = typeof FIRST_CHECK_GAME | typeof FINAL_CHECK_GAME

/**
 * The study's stretches of games, for the little track on the card. The two stretches the verdict compares get
 * matching names ("Before the trainer", "With the trainer"): calling only the later one "measured" would tell him
 * that games 11-40 matter less, and he might play them less carefully than games 61-160.
 */
export const STUDY_STRETCHES = [
  { key: 'warm-up', label: 'Warm-up', from: 1, to: 10 },
  { key: 'baseline', label: 'Before the trainer', from: 11, to: 40 },
  { key: 'wash-in', label: 'Trainer starts', from: 41, to: 60 },
  { key: 'measured', label: 'With the trainer', from: 61, to: 160 },
] as const
export const STUDY_TICKS = [10, 40, 60, 110, 160] as const

/** The phase on the card: the gate's words, except that games 61-160 mirror "Before the trainer" (see above). */
export const CARD_PHASE_LABELS: Record<StudyGate['phase'], string> = { ...PHASE_LABELS, measured: 'With the trainer' }

const BASE_URL: string = import.meta.env?.BASE_URL ?? '/'
/** Written by the daily job at games 110 and 160 (verdict.py's report); missing before that. */
export const VERDICT_URL = `${BASE_URL}data/study/verdict.json`

/* ------------------------------------------------------------- verdict.json */

export type VerdictKind = 'worked' | 'no big effect' | 'cannot tell' | 'other'

export type StudyVerdict =
  | { decided: false; nextCheckGame: number | null }
  | {
      decided: true
      kind: VerdictKind
      /** the answer ("Worked", "No big effect", "Cannot tell") and what it means, in plain words */
      answer: string
      meaning: string
      decidedAtGame: number
      /** blunders per 100 of his moves before the trainer and with it; null when the file does not say */
      before: { rate: number; from: number; to: number } | null
      after: { rate: number; from: number; to: number } | null
      /** before minus after (positive = fewer blunders), with its 90% range */
      drop: number | null
      range90: [number, number] | null
      /** the pre-set second test: did blunders facing a threat fall by a larger share? */
      mechanism: 'supported' | 'not supported' | null
    }

function asObject(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
}

function finite(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function window2(v: unknown): [number, number] | null {
  return Array.isArray(v) && v.length === 2 && finite(v[0]) !== null && finite(v[1]) !== null ? [v[0] as number, v[1] as number] : null
}

/** What the deciding look says beyond the verdict's words, so the meaning line never contradicts the numbers. */
interface LookFacts {
  /** the main rule passed (Z at or above the look's bar), whatever the newcomer condition said */
  mainPassed: boolean
  /** the matched-newcomer condition: true or false when it was binding, null when it was not used */
  newcomersPassed: boolean | null
  /** the 90% range of the drop lies wholly below zero: the numbers point to more blunders, not fewer */
  riseForSure: boolean
}

const NEWCOMERS = 'new 10+0 players at your level improve on their own'

function plainVerdict(raw: string, facts: LookFacts): { kind: VerdictKind; answer: string; meaning: string } {
  if (raw.startsWith('worked')) {
    const base = raw.includes('smaller than a third')
      ? 'Your blunders fell by more than luck and normal ups and downs explain, though the drop may be smaller than a third.'
      : 'Your blunders fell by more than luck and normal ups and downs explain.'
    return {
      kind: 'worked',
      answer: 'Worked',
      meaning: facts.newcomersPassed === true ? `${base} They also fell by clearly more than ${NEWCOMERS}.` : base,
    }
  }
  if (raw.startsWith('no big effect')) {
    return {
      kind: 'no big effect',
      answer: 'No big effect',
      meaning: facts.riseForSure
        ? 'A drop of a third or more is ruled out, and the numbers point to more blunders, not fewer.'
        : 'A drop of a third or more is ruled out. A smaller real drop is still possible.',
    }
  }
  if (raw.startsWith('cannot tell')) {
    // the main rule can pass while the newcomer condition does not (verdict.py notes it on the look); then there WAS a
    // clear drop, it just cannot be pinned on the trainer, and "no clear drop" would be untrue
    if (facts.mainPassed && facts.newcomersPassed === false) {
      return {
        kind: 'cannot tell',
        answer: 'Cannot tell',
        meaning:
          `Your blunders fell by more than luck and normal ups and downs explain, but not by clearly more than ${NEWCOMERS}, ` +
          'so the drop cannot be pinned on the trainer.',
      }
    }
    return {
      kind: 'cannot tell',
      answer: 'Cannot tell',
      meaning: `The result is in between: no clear drop, and a drop of a third or more is not ruled out either${
        raw.includes('incomplete') ? ' (the study stopped early)' : ''
      }.`,
    }
  }
  return { kind: 'other', answer: raw.charAt(0).toUpperCase() + raw.slice(1), meaning: '' }
}

/**
 * Reads verdict.json (verdict.py's report: `{ primary: { verdict, decided_at_game, windows, baseline, looks }, secondary }`).
 * null when the file is not one. A look that has not decided ("not yet: next look after game 160") carries no numbers.
 */
export function parseVerdict(json: unknown): StudyVerdict | null {
  const root = asObject(json)
  const primary = asObject(root?.primary) ?? root
  const raw = primary?.verdict
  if (!primary || typeof raw !== 'string' || raw.trim() === '') return null
  const decidedAt = finite(primary.decided_at_game)
  if (raw.startsWith('not yet') || decidedAt === null) {
    const next = /after game (\d+)/.exec(raw)
    return { decided: false, nextCheckGame: next ? Number(next[1]) : null }
  }

  const windows = asObject(primary.windows)
  const looks = Array.isArray(primary.looks) ? primary.looks.map(asObject).filter((l) => l !== undefined) : []
  const look = looks.find((l) => window2(l.window)?.[1] === decidedAt) ?? looks[looks.length - 1]
  const baseRate = finite(asObject(primary.baseline)?.rate)
  const baseWindow = window2(windows?.baseline)
  const lookRate = finite(asObject(look?.training)?.rate)
  const lookWindow = window2(look?.window)
  const reading = asObject(asObject(root?.secondary)?.K_mechanism)?.reading
  const range90 = window2(look?.range90)
  // the look's bar from the design block verdict.py writes next to it; verdict.py's note on the look as a fallback
  const designLooks = asObject(root?.design)?.looks
  const bar = finite((Array.isArray(designLooks) ? designLooks.map(asObject) : []).find((l) => l?.name === look?.look)?.worked_z)
  const z = finite(look?.z)
  const passes = asObject(look?.newcomer_adjusted)?.passes
  const facts: LookFacts = {
    mainPassed: z !== null && bar !== null ? z >= bar : typeof look?.note === 'string',
    newcomersPassed: typeof passes === 'boolean' ? passes : null,
    riseForSure: range90 !== null && range90[1] < 0,
  }
  return {
    decided: true,
    ...plainVerdict(raw, facts),
    decidedAtGame: decidedAt,
    before: baseRate !== null && baseWindow ? { rate: baseRate, from: baseWindow[0], to: baseWindow[1] } : null,
    after: lookRate !== null && lookWindow ? { rate: lookRate, from: lookWindow[0], to: lookWindow[1] } : null,
    drop: finite(look?.drop_per100),
    range90,
    mechanism: reading === 'mechanism supported' ? 'supported' : reading === 'mechanism not supported' ? 'not supported' : null,
  }
}

/** One decimal, with a plain minus sign. */
function one(n: number): string {
  return n.toFixed(1)
}

/** The numbers line under a decided verdict, e.g. "12.1 before the trainer (games 11-40), 7.9 with it (games 61-110)". */
export function verdictNumbers(v: Extract<StudyVerdict, { decided: true }>): string | null {
  if (!v.before || !v.after) return null
  const parts = [
    `Blunders per 100 of your moves: ${one(v.before.rate)} before the trainer (games ${v.before.from}-${v.before.to}), ` +
      `${one(v.after.rate)} with it (games ${v.after.from}-${v.after.to}).`,
  ]
  if (v.drop !== null) {
    // verdict.py's range is for the drop; when blunders went up it is turned round, so it is the range of the rise
    const rise = v.drop < 0
    const change = rise ? `A rise of ${one(-v.drop)}` : `A drop of ${one(v.drop)}`
    const range = v.range90 && (rise ? [-v.range90[1], -v.range90[0]] : v.range90)
    parts.push(range ? `${change} (90% range ${one(range[0])} to ${one(range[1])}).` : `${change}.`)
  }
  return parts.join(' ')
}

/* ------------------------------------------------------------ backup asks */

/** Saved under cc.study.backups: when he downloaded his backup from the card for each check (ISO time). */
export const BACKUP_LOG_KEY = 'study.backups'
export type BackupLog = Partial<Record<`${CheckGame}`, string>>

export function cleanBackupLog(v: unknown): BackupLog {
  const o = asObject(v)
  const out: BackupLog = {}
  for (const game of [FIRST_CHECK_GAME, FINAL_CHECK_GAME] as const) {
    const at = o?.[String(game)]
    if (typeof at === 'string' && !Number.isNaN(Date.parse(at))) out[`${game}`] = at
  }
  return out
}

/* ---------------------------------------------------------------- the card */

export interface StudyCardModel {
  /** false while nothing has been counted yet (no answer from Lichess, the daily job or an earlier visit) */
  known: boolean
  games: number
  /** e.g. "Before the trainer"; null while unknown */
  phase: string | null
  /** e.g. "after game 40, the Safety-check trainer opens"; null when nothing is left to wait for */
  next: { text: string; toGo: string } | null
  /** where the count comes from and when, in a sentence */
  source: string
  /** where he is on the track, 0..1; null while unknown */
  position: number | null
  /** at games 110 and 160: please download the backup and send it */
  backup: { game: CheckGame; downloadedAt: string | null } | null
  /** the line explaining why no blunder numbers are shown (null once a verdict is shown) */
  hiddenNote: string | null
  /** the verdict state for the card: shown only once verdict.json says something */
  verdict: StudyVerdict | null
  /** about a check that is done without a verdict, or due but not run yet (null otherwise) */
  checkNote: string | null
}

/** "today at 14:05", "yesterday at 09:30", "on 12 Oct at 21:10". */
export function whenText(iso: string, now: Date): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const days = daysAgo(iso, now)
  if (days === 0) return `today at ${time}`
  if (days === 1) return `yesterday at ${time}`
  return `on ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${time}`
}

function sourceText(gate: StudyGate, now: Date): string {
  const when = gate.asOf ? whenText(gate.asOf, now) : ''
  switch (gate.source) {
    case 'lichess':
      return `Counted from your Lichess games ${when}.`
    case 'daily job':
      return `From the daily check ${when}.`
    case 'cache':
      return `Last count saved on this device ${when}. The app asks Lichess again when it can.`
    default:
      return 'Not counted yet. The app asks Lichess in the background whenever you are online.'
  }
}

export function studyCardModel(gate: StudyGate, verdict: StudyVerdict | null, backups: BackupLog, now: Date): StudyCardModel {
  const known = gate.source !== 'none'
  const games = gate.eligibleGames
  const decided = verdict?.decided === true
  const milestone = decided || !known ? null : gate.nextMilestone
  // a study decided at the first check ends there, so it never asks again at game 160
  const endedEarly = decided && verdict.decidedAtGame < FINAL_CHECK_GAME
  const checkGame: CheckGame | null =
    !known ? null : games >= FINAL_CHECK_GAME && !endedEarly ? FINAL_CHECK_GAME : games >= FIRST_CHECK_GAME ? FIRST_CHECK_GAME : null
  return {
    known,
    games,
    phase: !known ? null : decided && verdict.decidedAtGame < FINAL_CHECK_GAME ? `Decided after game ${verdict.decidedAtGame}` : CARD_PHASE_LABELS[gate.phase],
    next: milestone ? { text: `after game ${milestone.game}, ${milestone.label}`, toGo: `${plural(milestone.game - games, 'game')} to go` } : null,
    source: sourceText(gate, now),
    position: known ? Math.min(games, FINAL_CHECK_GAME) / FINAL_CHECK_GAME : null,
    backup: checkGame ? { game: checkGame, downloadedAt: backups[`${checkGame}`] ?? null } : null,
    hiddenNote: decided
      ? null
      : `Your blunder numbers stay hidden until there is a verdict${games < FIRST_CHECK_GAME ? ', after game 110 at the earliest' : ''}.`,
    verdict,
    checkNote: checkNoteFor(known, games, verdict),
  }
}

function checkNoteFor(known: boolean, games: number, verdict: StudyVerdict | null): string | null {
  if (!known || verdict?.decided || games < FIRST_CHECK_GAME) return null
  const due = games >= FINAL_CHECK_GAME ? 'final' : 'first'
  // the file is written by the daily job, so it can lag a day behind the count
  if (!verdict || (verdict.nextCheckGame !== null && games >= verdict.nextCheckGame)) {
    return `The ${due} check is worked out in the next daily run.`
  }
  return `First check done after game ${FIRST_CHECK_GAME}: no verdict yet. The study goes on to game ${verdict.nextCheckGame ?? FINAL_CHECK_GAME}.`
}
