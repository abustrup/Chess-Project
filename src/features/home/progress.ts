// Everything the dashboard works out from the saved progress. Pure functions, no React,
// so the rules ("what should I do next?") are easy to read and to check on their own.

import type {
  GameRecord,
  OpeningChapter,
  OpeningCourse,
  OpeningProgress,
  PuzzleStats,
  TacticsProgress,
} from '../../types'
import { authoredText, dayKey, daysAgo, isoToDayKey, plural, prettyTheme, relativeDay, shiftDay, shortCourseName } from './format'

/** A chapter counts as "learned" once its mastery reaches this (0..1). */
export const LEARNED_AT = 0.8
/** The daily puzzle goal shown in "Today's plan". */
export const DAILY_PUZZLES = 5

/* ------------------------------------------------------------------ openings */

type ProgressEntry = OpeningProgress[string]

export interface NextStep {
  chapter: OpeningChapter
  /** study = first walk-through, drill = play it from memory, refresh = everything is learned, keep it fresh */
  kind: 'study' | 'drill' | 'refresh'
  to: string
}

export interface CourseSummary {
  course: OpeningCourse
  chapterCount: number
  /** chapters walked through (or drilled) at least once */
  studied: number
  learned: number
  /** 0..1 — average over ALL chapters, so unstarted chapters count as 0 */
  mastery: number
  lastPracticed: string | null
  next: NextStep | null
}

function entryOf(progress: OpeningProgress, courseId: string, chapterId: string): ProgressEntry | undefined {
  return progress[`${courseId}/${chapterId}`]
}

function chapterMastery(entry: ProgressEntry | undefined): number {
  return Math.min(1, Math.max(0, entry?.mastery ?? 0))
}

/** Never opened (or only started): the next useful thing is the guided walk-through. */
function needsStudy(entry: ProgressEntry | undefined): boolean {
  return !entry || (!entry.studied && entry.drillsCompleted === 0)
}

function stepFor(course: OpeningCourse, chapter: OpeningChapter, kind: NextStep['kind']): NextStep {
  const mode = kind === 'study' ? 'study' : 'drill'
  return { chapter, kind, to: `/openings/${course.id}/${chapter.id}/${mode}` }
}

function timeOf(iso: string | undefined): number {
  const time = iso ? Date.parse(iso) : Number.NaN
  return Number.isNaN(time) ? 0 : time
}

/** The next thing to do in a course: finish each chapter (study, then drill until learned) before the next one. */
function nextStepIn(course: OpeningCourse, progress: OpeningProgress): NextStep | null {
  for (const chapter of course.chapters) {
    const entry = entryOf(progress, course.id, chapter.id)
    if (needsStudy(entry)) return stepFor(course, chapter, 'study')
    if (chapterMastery(entry) < LEARNED_AT) return stepFor(course, chapter, 'drill')
  }
  // Everything is learned: suggest the chapter that was practised the longest time ago.
  const stalest = [...course.chapters].sort(
    (a, b) =>
      timeOf(entryOf(progress, course.id, a.id)?.lastPracticed) - timeOf(entryOf(progress, course.id, b.id)?.lastPracticed),
  )[0]
  return stalest ? stepFor(course, stalest, 'refresh') : null
}

export function summariseCourse(course: OpeningCourse, progress: OpeningProgress): CourseSummary {
  let studied = 0
  let learned = 0
  let masterySum = 0
  let lastTime = 0
  let lastIso: string | null = null
  for (const chapter of course.chapters) {
    const entry = entryOf(progress, course.id, chapter.id)
    if (!entry) continue
    if (entry.studied || entry.drillsCompleted > 0) studied++
    const mastery = chapterMastery(entry)
    if (mastery >= LEARNED_AT) learned++
    masterySum += mastery
    const time = timeOf(entry.lastPracticed)
    if (time > lastTime) {
      lastTime = time
      lastIso = entry.lastPracticed
    }
  }
  const count = course.chapters.length
  return {
    course,
    chapterCount: count,
    studied,
    learned,
    mastery: count ? masterySum / count : 0,
    lastPracticed: lastIso,
    next: nextStepIn(course, progress),
  }
}

/** The chapter the player touched most recently, anywhere. */
function lastPracticedChapter(
  courses: OpeningCourse[],
  progress: OpeningProgress,
): { course: OpeningCourse; chapter: OpeningChapter; entry: ProgressEntry } | null {
  let best: { course: OpeningCourse; chapter: OpeningChapter; entry: ProgressEntry } | null = null
  for (const course of courses) {
    for (const chapter of course.chapters) {
      const entry = entryOf(progress, course.id, chapter.id)
      if (entry && timeOf(entry.lastPracticed) > (best ? timeOf(best.entry.lastPracticed) : 0)) {
        best = { course, chapter, entry }
      }
    }
  }
  return best
}

/* ----------------------------------------------------------------- continue */

export interface ContinueTarget {
  kind: 'game' | 'chapter' | 'start' | 'safety'
  title: string
  detail: string
  to: string
  /** the button's word, when the kind's usual one ("Continue", "Start") does not fit */
  button?: string
}

const STEP_WORDS: Record<NextStep['kind'], string> = {
  study: 'Learn it step by step',
  drill: 'Play it from memory',
  refresh: 'A quick refresh',
}

/**
 * The Play page saves a game that is still going under 'cc.play.current' (`{ config, ucis: [...moves], ... }`).
 * Returns how many moves were played, or null when there is no game worth resuming.
 */
export function unfinishedGameMoves(saved: unknown): number | null {
  if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return null
  const moves = (saved as { ucis?: unknown }).ucis
  if (!Array.isArray(moves)) return null
  return moves.length > 0 ? moves.length : null
}

/**
 * Once the trainer is open, positions left today come before everything else: the trainer is what the study tests
 * (build plan H2, trainer-spec 5.1). While they are still being counted it points there too, so the big button does
 * not jump from one suggestion to another a moment after the page opens.
 */
function safetyContinue(safety: SafetyToday): ContinueTarget | null {
  if (safety.failed || safety.left === 0) return null
  if (safety.left === null) {
    return { kind: 'safety', title: 'Your Safety check', detail: 'Positions from your own games, for today.', to: '/safety' }
  }
  return {
    kind: 'safety',
    title: `${plural(safety.left, 'position')} ${safety.left === 1 ? 'is' : 'are'} waiting`,
    detail:
      safety.answered > 0
        ? `Your Safety check: ${safety.answered} done today, ${safety.left} to go.`
        : 'Your Safety check for today, from your own games.',
    to: '/safety',
    button: safety.answered > 0 ? 'Continue' : 'Start',
  }
}

/** The single best "pick up where you left off" suggestion (also the big button in zen mode). */
export function buildContinue(args: {
  courses: OpeningCourse[]
  summaries: CourseSummary[]
  progress: OpeningProgress
  /** moves played in the unfinished game, or null */
  unfinishedMoves: number | null
  now: Date
  /** where a new player starts: the first step of today's plan (the study plan), when it lives in the app */
  firstStep?: PlanItem
  /** today's Safety-check queue; null or left out while the trainer is locked */
  safety?: SafetyToday | null
}): ContinueTarget {
  const { courses, summaries, progress, unfinishedMoves, now, firstStep, safety } = args
  const trainer = safety ? safetyContinue(safety) : null
  if (trainer) return trainer
  if (unfinishedMoves !== null) {
    return {
      kind: 'game',
      title: 'Your game is waiting',
      detail: `You are ${plural(Math.ceil(unfinishedMoves / 2), 'move')} into a game against the computer. Jump back in.`,
      to: '/play',
    }
  }

  const last = lastPracticedChapter(courses, progress)
  if (last) {
    const summary = summaries.find((s) => s.course.id === last.course.id)
    // If that chapter is already learned, move on to whatever comes next in the same opening.
    const step =
      chapterMastery(last.entry) >= LEARNED_AT && summary?.next ? summary.next : stepFor(last.course, last.chapter, needsStudy(last.entry) ? 'study' : 'drill')
    const when = relativeDay(last.entry.lastPracticed, now)
    return {
      kind: 'chapter',
      title: `${shortCourseName(last.course.name)} · ${step.chapter.title}`,
      detail: `${STEP_WORDS[step.kind]}.${when ? ` You last practised ${when.toLowerCase()}.` : ''}`,
      to: step.to,
    }
  }

  if (firstStep && !firstStep.external) {
    // with the trainer open and today's Safety check done, the step offered here is the plan's second one
    const detail = safety && firstStep.id !== 'safety' ? "Next in today's plan." : "Step one of today's plan."
    return { kind: 'start', title: firstStep.title, detail, to: firstStep.to }
  }
  const first = courses.find((c) => c.chapters.length > 0) ?? courses[0]
  if (!first) {
    return { kind: 'start', title: 'Explore the openings', detail: 'See what there is to learn.', to: '/openings' }
  }
  return {
    kind: 'start',
    title: `Start with the ${first.name}`,
    detail: authoredText(first.tagline) || `Your first opening to learn as ${first.side === 'white' ? 'White' : 'Black'}.`,
    to: `/openings/${first.id}`,
  }
}

/* ------------------------------------------------------------------ puzzles */

export interface PuzzleSummary {
  rating: number
  solved: number
  failed: number
  /** whole percent, null before the first puzzle */
  accuracy: number | null
  streak: number
  bestStreak: number
  solvedToday: number
  /** puzzle rating after each of the latest puzzles, oldest first */
  series: number[]
  /** the theme the player gets wrong most often (needs a few tries to be fair) */
  weakest: { key: string; label: string; accuracy: number; attempts: number } | null
}

export function summarisePuzzles(stats: PuzzleStats, now: Date): PuzzleSummary {
  const today = dayKey(now)
  const history = Array.isArray(stats.history) ? stats.history : []
  const total = stats.solved + stats.failed

  let weakest: PuzzleSummary['weakest'] = null
  for (const [key, counts] of Object.entries(stats.byTheme ?? {})) {
    const attempts = counts.solved + counts.failed
    if (attempts < 3) continue
    const accuracy = counts.solved / attempts
    if (accuracy >= 0.7) continue
    if (!weakest || accuracy < weakest.accuracy || (accuracy === weakest.accuracy && attempts > weakest.attempts)) {
      weakest = { key, label: prettyTheme(key), accuracy, attempts }
    }
  }

  return {
    rating: Math.round(stats.rating),
    solved: stats.solved,
    failed: stats.failed,
    accuracy: total ? Math.round((stats.solved / total) * 100) : null,
    streak: stats.streak,
    bestStreak: stats.bestStreak,
    solvedToday: history.filter((h) => h.solved && isoToDayKey(h.date) === today).length,
    series: history.slice(-40).map((h) => h.ratingAfter),
    weakest,
  }
}

/* -------------------------------------------------------------------- games */

export type Outcome = 'win' | 'loss' | 'draw' | 'open'

/** Result from the player's point of view. */
export function outcomeOf(game: GameRecord): Outcome {
  if (game.result === '1/2-1/2') return 'draw'
  if (game.result === '*') return 'open'
  const whiteWon = game.result === '1-0'
  return whiteWon === (game.userSide === 'white') ? 'win' : 'loss'
}

export function opponentLabel(game: GameRecord): string {
  if (game.botElo) return `Computer (about ${game.botElo})`
  const youAreWhite = game.userSide === 'white'
  const name = youAreWhite ? game.black : game.white
  const elo = youAreWhite ? game.blackElo : game.whiteElo
  return elo ? `${name} (${elo})` : name
}

/** The player's accuracy in a reviewed game, as a whole percent. */
export function accuracyOf(game: GameRecord): number | null {
  const accuracy = game.analysis?.accuracy?.[game.userSide]
  return typeof accuracy === 'number' ? Math.round(accuracy) : null
}

export function newestFirst(games: GameRecord[]): GameRecord[] {
  return [...games].sort((a, b) => timeOf(b.date) - timeOf(a.date))
}

/* ------------------------------------------------------------ practice days */

export interface PracticeSources {
  games: GameRecord[]
  puzzleStats: PuzzleStats
  openingProgress: OpeningProgress
  tacticsProgress: TacticsProgress
}

/**
 * The calendar days the player practised, worked out from the timestamps we really have:
 * games played in this app, solved or failed puzzles, opening chapters (only the LAST day per chapter
 * is saved) and finished tactic lessons (only the completion day). So older days of opening or tactics
 * practice can be missing, and the numbers shown are a careful minimum, never an invention.
 */
export function practiceDays(src: PracticeSources): Set<string> {
  const days = new Set<string>()
  const add = (iso: string | undefined) => {
    const key = isoToDayKey(iso)
    if (key) days.add(key)
  }
  for (const game of src.games) if (game.source === 'app') add(game.date)
  for (const item of src.puzzleStats.history ?? []) add(item.date)
  for (const entry of Object.values(src.openingProgress)) add(entry.lastPracticed)
  for (const entry of Object.values(src.tacticsProgress)) add(entry.completedAt)
  return days
}

/** Days in a row up to today. Today may still be empty: the streak is alive until the day ends. */
export function currentStreak(days: Set<string>, now: Date): number {
  let cursor = now
  if (!days.has(dayKey(cursor))) cursor = shiftDay(now, -1)
  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak++
    cursor = shiftDay(cursor, -1)
  }
  return streak
}

export function longestStreak(days: Set<string>): number {
  const indexes = [...days]
    .map((key) => {
      // a day number from the calendar date itself, so summer time and time zones cannot shift it
      const [y, m, d] = key.split('-').map(Number)
      return Date.UTC(y, m - 1, d) / 86_400_000
    })
    .sort((a, b) => a - b)
  let best = 0
  let run = 0
  indexes.forEach((index, i) => {
    run = i > 0 && index - indexes[i - 1] === 1 ? run + 1 : 1
    best = Math.max(best, run)
  })
  return best
}

export interface WeekDay {
  key: string
  letter: string
  practised: boolean
  isToday: boolean
}

/** The last seven days, oldest first, for the little dot strip. */
export function lastWeek(days: Set<string>, now: Date): WeekDay[] {
  const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return Array.from({ length: 7 }, (_, i) => {
    const date = shiftDay(now, i - 6)
    const key = dayKey(date)
    return { key, letter: letters[date.getDay()], practised: days.has(key), isToday: i === 6 }
  })
}

/* ------------------------------------------------------------ today's plan */

// The study version of the plan (research/2026-10-16-diagnosis/build-plan.md, H1): a short puzzle block and one
// rated 10+0 game on Lichess, nothing else. It must look the same before and after the Safety-check trainer opens
// apart from the trainer (H2), so the only input that changes with the study is `safety`: absent while the gate is
// locked, and then the trainer's step comes first. Openings and tactics lessons stay in the menu.

/** Lichess's lobby joins the 10+0 pool when opened with this address (lila ui/lobby joinPoolFromLocationHash). */
export const LICHESS_POOL_URL = 'https://lichess.org/#pool/10+0'
/** The clock of the games the study counts (measure.py, 600+0). */
const STUDY_TIME_CONTROL = '600+0'

/**
 * The daily block asks for easy puzzles (build plan H1; diagnosis: "a short block of easy puzzles stays"): the link
 * carries level=easy, and the Puzzles page then aims about 300 points below his puzzle rating (Lichess's "Easier").
 */
export const STUDY_PUZZLE_LEVEL = 'easy'

/** The three puzzle sets of the daily block, in the order they take turns (keys of public/puzzles/themes). */
export const STUDY_PUZZLE_THEMES = [
  { key: 'hangingPiece', label: 'free pieces' },
  { key: 'fork', label: 'forks' },
  { key: 'defensiveMove', label: 'finding the defence' },
] as const

export interface PlanItem {
  id: 'safety' | 'puzzles' | 'lichess'
  kicker: string
  title: string
  reason: string
  /** an app address ('/puzzles?...'), or a full web address when `external` is set */
  to: string
  /** opens another website in a new tab */
  external?: boolean
  cta: string
  /** short extra line such as "3 of 5 solved today", drawn with a thin bar when `fraction` is set */
  progressText?: string
  fraction?: number
  done?: boolean
}

function pgnTag(pgn: string, name: string): string | null {
  const match = new RegExp(`\\[${name} "([^"]*)"\\]`).exec(pgn)
  return match ? match[1] : null
}

/**
 * A game brought in from Lichess that is the kind the study counts: rated, 10+0, standard chess from the normal
 * starting position, not against a BOT. A rated game carries the rating change in its PGN (casual games do not).
 */
export function isStudyGame(game: GameRecord): boolean {
  if (game.source !== 'lichess') return false
  const { pgn } = game
  const rated =
    pgnTag(pgn, 'WhiteRatingDiff') !== null || pgnTag(pgn, 'BlackRatingDiff') !== null || /^rated\b/i.test(pgnTag(pgn, 'Event') ?? '')
  const variant = pgnTag(pgn, 'Variant')
  const fromStart = pgnTag(pgn, 'FEN') === null && pgnTag(pgn, 'SetUp') !== '1'
  const bot = pgnTag(pgn, 'WhiteTitle') === 'BOT' || pgnTag(pgn, 'BlackTitle') === 'BOT'
  return rated && (variant === null || variant === 'Standard') && fromStart && !bot && pgnTag(pgn, 'TimeControl') === STUDY_TIME_CONTROL
}

/** A number for each calendar day, so the puzzle sets can take turns from day to day. */
function dayNumber(now: Date): number {
  return Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000)
}

export interface StudyPuzzlesToday {
  /** puzzles of the three sets solved today */
  solved: number
  /** the set to do next: the one with the fewest solved today, starting from today's turn */
  next: (typeof STUDY_PUZZLE_THEMES)[number]
}

export function studyPuzzlesToday(stats: PuzzleStats, now: Date): StudyPuzzlesToday {
  const today = dayKey(now)
  const counts = new Map<string, number>(STUDY_PUZZLE_THEMES.map((t) => [t.key, 0]))
  for (const item of Array.isArray(stats.history) ? stats.history : []) {
    if (!item?.solved || typeof item.theme !== 'string' || !counts.has(item.theme) || isoToDayKey(item.date) !== today) continue
    counts.set(item.theme, (counts.get(item.theme) ?? 0) + 1)
  }
  const start = dayNumber(now) % STUDY_PUZZLE_THEMES.length
  const turn = STUDY_PUZZLE_THEMES.map((_, i) => STUDY_PUZZLE_THEMES[(start + i) % STUDY_PUZZLE_THEMES.length])
  const next = turn.reduce((best, t) => ((counts.get(t.key) ?? 0) < (counts.get(best.key) ?? 0) ? t : best), turn[0])
  return { solved: [...counts.values()].reduce((a, b) => a + b, 0), next }
}

function puzzleItem(stats: PuzzleStats, now: Date): PlanItem {
  const { solved, next } = studyPuzzlesToday(stats, now)
  const shown = Math.min(solved, DAILY_PUZZLES)
  return {
    id: 'puzzles',
    kicker: 'Puzzles',
    title: `Solve ${DAILY_PUZZLES} easy puzzles: free pieces, forks, defending`,
    reason: `Today: ${next.label}. Free pieces, forks and finding the defence take turns from day to day.`,
    to: `/puzzles?theme=${encodeURIComponent(next.key)}&level=${STUDY_PUZZLE_LEVEL}`,
    cta: 'Solve puzzles',
    progressText: `${shown} of ${DAILY_PUZZLES} solved today`,
    fraction: shown / DAILY_PUZZLES,
    done: solved >= DAILY_PUZZLES,
  }
}

function lichessItem(games: GameRecord[], now: Date): PlanItem {
  const playedToday = games.some((g) => isStudyGame(g) && daysAgo(g.date, now) === 0)
  return {
    id: 'lichess',
    kicker: 'Lichess',
    title: 'Play a rated 10+0 game on Lichess',
    reason: 'Only rated 10+0 games on Lichess count for your study. Play as you normally would.',
    to: LICHESS_POOL_URL,
    external: true,
    cta: 'Open Lichess',
    done: playedToday,
  }
}

/** What Home knows about today's Safety-check queue once the trainer is open (useSafetyToday.ts fills it in). */
export interface SafetyToday {
  /** positions left today: reviews, new ones and second looks at today's misses; null while not counted yet */
  left: number | null
  /** answers given today, second looks included (the trainer's "3 of 12 done") */
  answered: number
  /** positions in the card file; 0 before the daily job has added any */
  positions: number | null
  /** the card file could not be loaded, so nothing could be counted */
  failed?: boolean
}

const SAFETY_REASON = 'From your own games. Before each move: what does his last move threaten, and what does yours allow?'

/** The trainer's step: how many positions are left today. Done once today's queue is empty, as in the trainer. */
function safetyItem(s: SafetyToday): PlanItem {
  const base = { id: 'safety', kicker: 'Your trainer', to: '/safety' } as const
  if (s.left === null) {
    return {
      ...base,
      title: 'Safety check',
      reason: s.failed ? "Today's positions could not be counted here. Open the trainer to try again." : SAFETY_REASON,
      cta: 'Open Safety check',
      progressText: s.failed ? undefined : "Counting today's positions…",
    }
  }
  const total = s.answered + s.left
  const progress = total > 0 ? { progressText: `${s.answered} of ${total} done today`, fraction: s.answered / total } : {}
  if (s.left > 0) {
    return { ...base, title: `Safety check: ${plural(s.left, 'position')}`, reason: SAFETY_REASON, cta: s.answered ? 'Continue' : 'Start', ...progress }
  }
  const [title, reason] =
    s.positions === 0
      ? ['Safety check: no positions yet', 'The daily check adds positions from your rated Lichess games. Come back after your next game.']
      : s.answered > 0
        ? ['Safety check: done for today', 'Every position planned for today is answered. They come back on their review days.']
        : ['Safety check: nothing due today', 'No reviews are due and no new positions are planned for today.']
  return { ...base, title, reason, cta: 'Open Safety check', ...progress, done: true }
}

/**
 * Today's plan in the study version: [puzzles, a rated 10+0 game on Lichess], always in this order. Once the
 * Safety-check trainer is open (`safety` given) its step goes first: [safety, puzzles, lichess] (build plan H2).
 */
export function buildPlan(args: { puzzleStats: PuzzleStats; games: GameRecord[]; now: Date; safety?: SafetyToday | null }): PlanItem[] {
  const { puzzleStats, games, now, safety } = args
  const study = [puzzleItem(puzzleStats, now), lichessItem(games, now)]
  return safety ? [safetyItem(safety), ...study] : study
}
