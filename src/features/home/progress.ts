// Everything the dashboard works out from the saved progress. Pure functions, no React,
// so the rules ("what should I do next?") are easy to read and to check on their own.

import type {
  GameRecord,
  OpeningChapter,
  OpeningCourse,
  OpeningProgress,
  PuzzleStats,
  TacticLesson,
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
  kind: 'game' | 'chapter' | 'start'
  title: string
  detail: string
  to: string
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

/** The single best "pick up where you left off" suggestion (also the big button in zen mode). */
export function buildContinue(args: {
  courses: OpeningCourse[]
  summaries: CourseSummary[]
  progress: OpeningProgress
  /** moves played in the unfinished game, or null */
  unfinishedMoves: number | null
  now: Date
}): ContinueTarget {
  const { courses, summaries, progress, unfinishedMoves, now } = args
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

export interface PlanItem {
  id: 'opening' | 'tactic' | 'puzzles' | 'play'
  kicker: string
  title: string
  reason: string
  to: string
  cta: string
  /** short extra line such as "3 of 5 solved today", drawn with a thin bar when `fraction` is set */
  progressText?: string
  fraction?: number
  done?: boolean
}

function chooseCourse(summaries: CourseSummary[]): CourseSummary | undefined {
  const usable = summaries.filter((s) => s.next)
  const unfinished = usable.filter((s) => s.next?.kind !== 'refresh')
  const recent = unfinished
    .filter((s) => s.lastPracticed)
    .sort((a, b) => timeOf(b.lastPracticed ?? undefined) - timeOf(a.lastPracticed ?? undefined))[0]
  if (recent) return recent
  if (unfinished[0]) return unfinished[0]
  return usable.sort((a, b) => timeOf(a.lastPracticed ?? undefined) - timeOf(b.lastPracticed ?? undefined))[0]
}

function openingItem(summaries: CourseSummary[], now: Date): PlanItem {
  const picked = chooseCourse(summaries)
  if (!picked?.next) {
    return {
      id: 'opening',
      kicker: 'Openings',
      title: 'Explore your openings',
      reason: 'Learn how to start a game with a plan: the London, the Caro-Kann and the Slav.',
      to: '/openings',
      cta: 'Open lessons',
    }
  }
  const { course, next } = picked
  const name = shortCourseName(course.name)
  const practisedToday = picked.lastPracticed ? daysAgo(picked.lastPracticed, now) === 0 : false
  const base = { id: 'opening' as const, kicker: 'Openings', to: next.to, done: practisedToday }
  if (next.kind === 'study') {
    return {
      ...base,
      title: picked.studied === 0 ? `Start the ${name}` : `Learn the next ${name} chapter`,
      reason:
        picked.studied === 0
          ? `Up next: ${next.chapter.title}.`
          : `Up next: ${next.chapter.title}. You have studied ${picked.studied} of ${plural(picked.chapterCount, 'chapter')}.`,
      cta: 'Start lesson',
    }
  }
  if (next.kind === 'drill') {
    return {
      ...base,
      title: `Practise the ${name}`,
      reason: `Play "${next.chapter.title}" from memory until it feels easy.`,
      cta: 'Practise',
    }
  }
  return {
    ...base,
    title: `Keep the ${name} fresh`,
    reason: `You know every chapter. Replay "${next.chapter.title}" so you do not forget it.`,
    cta: 'Refresh',
  }
}

function tacticItem(lessons: TacticLesson[], progress: TacticsProgress): PlanItem {
  const open = lessons.find((lesson) => !progress[lesson.id]?.completedAt)
  if (open) {
    const solved = progress[open.id]?.solvedExerciseIds?.length ?? 0
    return {
      id: 'tactic',
      kicker: 'Tactics',
      title: `Do a tactic: ${open.name}`,
      reason: authoredText(open.tagline) || 'A short lesson on a trick that wins material.',
      to: `/tactics/${open.id}`,
      cta: solved > 0 ? 'Keep going' : 'Start lesson',
      progressText: solved > 0 ? `${solved} of ${open.exercises.length} exercises solved` : undefined,
      fraction: solved > 0 && open.exercises.length ? solved / open.exercises.length : undefined,
    }
  }
  if (lessons.length > 0) {
    const toughest = [...lessons].sort(
      (a, b) => (progress[b.id]?.failedAttempts ?? 0) - (progress[a.id]?.failedAttempts ?? 0),
    )[0]
    return {
      id: 'tactic',
      kicker: 'Tactics',
      title: `Revisit a tactic: ${toughest.name}`,
      reason: 'You finished every lesson. Going over one again keeps it sharp.',
      to: `/tactics/${toughest.id}`,
      cta: 'Revisit',
    }
  }
  return {
    id: 'tactic',
    kicker: 'Tactics',
    title: 'Learn a tactic',
    reason: 'Tactics are short tricks, like forks and pins, that win material.',
    to: '/tactics',
    cta: 'See lessons',
  }
}

function puzzleItem(puzzles: PuzzleSummary): PlanItem {
  const weak = puzzles.weakest
  return {
    id: 'puzzles',
    kicker: 'Puzzles',
    title: weak ? `Solve ${DAILY_PUZZLES} ${weak.label.toLowerCase()} puzzles` : `Solve ${DAILY_PUZZLES} puzzles`,
    reason: weak
      ? `You solve about ${Math.round(weak.accuracy * 100)}% of these. A few more will help.`
      : 'Short puzzles train your eyes to spot tactics in real games.',
    to: weak ? `/puzzles?theme=${encodeURIComponent(weak.key)}` : '/puzzles',
    cta: 'Solve puzzles',
    progressText: `${Math.min(puzzles.solvedToday, DAILY_PUZZLES)} of ${DAILY_PUZZLES} solved today`,
    fraction: Math.min(puzzles.solvedToday, DAILY_PUZZLES) / DAILY_PUZZLES,
    done: puzzles.solvedToday >= DAILY_PUZZLES,
  }
}

function playItem(summaries: CourseSummary[]): PlanItem {
  // Practise with the opening the player knows best, so the game feels like a real test.
  const course = [...summaries].sort((a, b) => b.mastery - a.mastery)[0]?.course
  if (!course) {
    return {
      id: 'play',
      kicker: 'Play',
      title: 'Play a game',
      reason: 'Nothing teaches like a real game. Take your time and think before you move.',
      to: '/play',
      cta: 'Play',
    }
  }
  const side = course.side === 'white' ? 'White' : 'Black'
  return {
    id: 'play',
    kicker: 'Play',
    title: `Play a game as ${side} using the ${shortCourseName(course.name)}`,
    reason: 'Try your opening in a real game. The computer helps you stay on track.',
    to: `/play?course=${encodeURIComponent(course.id)}&mode=practice`,
    cta: 'Play',
  }
}

/** Three concrete things for today, chosen from what the player has (and has not) done yet. */
export function buildPlan(args: {
  summaries: CourseSummary[]
  lessons: TacticLesson[]
  tacticsProgress: TacticsProgress
  puzzles: PuzzleSummary
  games: GameRecord[]
  now: Date
}): PlanItem[] {
  const { summaries, lessons, tacticsProgress, puzzles, games, now } = args
  const lastAppGame = newestFirst(games).find((g) => g.source === 'app')
  const sinceGame = lastAppGame ? daysAgo(lastAppGame.date, now) : null
  const hasStudied = summaries.some((s) => s.studied > 0)
  // After the daily puzzles, or after a few days without a game, a real game is the better exercise.
  const wantsGame = puzzles.solvedToday >= DAILY_PUZZLES || (hasStudied && (sinceGame === null || sinceGame >= 3))
  return [
    openingItem(summaries, now),
    tacticItem(lessons, tacticsProgress),
    wantsGame ? playItem(summaries) : puzzleItem(puzzles),
  ]
}
