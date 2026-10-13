import { useStored, readStored, writeStored, KEYS } from '../../lib/storage'
import type { OpeningChapter, OpeningCourse, OpeningProgress } from '../../types'
import type { PgnNode, PgnTree } from '../../lib/pgnTree'
import { learnNodes } from './treeUtils'

// Everything the trainer remembers.
//
//  - KEYS.openingProgress (shared with the rest of the app): one record per chapter.
//  - 'openings.nodes' (private to this feature): for every position where YOU must find a move,
//    how well you know it. This is what makes weak spots come back more often, and it is where
//    the chapter's "mastery" number comes from.
//
// How mastery works (in simple words): every position you have to answer has a "knowledge" score
// from 0 to 1. Answering it right the first time moves the score 60% of the way to 1 (0.6, 0.84, 0.94 ...).
// A slip drops it to 40% of what it was. Mastery of a chapter is the average over all its positions,
// so unseen positions count as 0 and you only reach the top by knowing every branch.

type Entry = OpeningProgress[string]

export interface NodeStat {
  /** knowledge 0..1 */
  s: number
  seen: number
  missed: number
}
type NodeStats = Record<string, NodeStat>
type AllNodeStats = Record<string, NodeStats>

const NODES_KEY = 'openings.nodes'
const NO_PROGRESS: OpeningProgress = {}

/** A chapter at or above this mastery counts as "learned". */
export const MASTERED = 0.75

export const progressKey = (courseId: string, chapterId: string): string => `${courseId}/${chapterId}`

export function useOpeningProgress(): OpeningProgress {
  return useStored<OpeningProgress>(KEYS.openingProgress, NO_PROGRESS)[0]
}

function blankEntry(courseId: string, chapterId: string): Entry {
  return { courseId, chapterId, studied: false, drillsCompleted: 0, drillMistakes: 0, bestStreak: 0, mastery: 0, lastPracticed: '' }
}

export const chapterMastery = (progress: OpeningProgress, courseId: string, chapterId: string): number =>
  progress[progressKey(courseId, chapterId)]?.mastery ?? 0

export function courseMastery(progress: OpeningProgress, course: OpeningCourse): number {
  if (!course.chapters.length) return 0
  const sum = course.chapters.reduce((total, ch) => total + chapterMastery(progress, course.id, ch.id), 0)
  return sum / course.chapters.length
}

/** Chapters from easiest to hardest (keeps the author's order inside the same difficulty). */
export const sortedChapters = (course: OpeningCourse): OpeningChapter[] =>
  [...course.chapters].sort((a, b) => a.difficulty - b.difficulty)

export interface NextStep {
  chapter: OpeningChapter
  mode: 'study' | 'drill'
  /** True when everything is already learned and we are just suggesting a refresher. */
  review: boolean
}

/** What should the user do next in this course? New chapters get studied first, then drilled until learned. */
export function nextStep(course: OpeningCourse, progress: OpeningProgress): NextStep | null {
  const chapters = sortedChapters(course)
  if (!chapters.length) return null
  const entry = (c: OpeningChapter) => progress[progressKey(course.id, c.id)]
  const untouched = chapters.find((c) => !entry(c)?.studied && !((entry(c)?.mastery ?? 0) > 0))
  if (untouched) return { chapter: untouched, mode: 'study', review: false }
  const notLearned = chapters.find((c) => (entry(c)?.mastery ?? 0) < MASTERED)
  if (notLearned) return { chapter: notLearned, mode: 'drill', review: false }
  const weakest = chapters.reduce((a, b) => ((entry(b)?.mastery ?? 0) < (entry(a)?.mastery ?? 0) ? b : a))
  return { chapter: weakest, mode: 'drill', review: true }
}

export function hasStarted(course: OpeningCourse, progress: OpeningProgress): boolean {
  return course.chapters.some((c) => {
    const e = progress[progressKey(course.id, c.id)]
    return !!e && (e.studied || e.drillsCompleted > 0 || e.mastery > 0)
  })
}

/* ------------------------------------------------------------ writing */

function updateEntry(courseId: string, chapterId: string, change: (e: Entry) => Entry) {
  const all = readStored<OpeningProgress>(KEYS.openingProgress, NO_PROGRESS)
  const key = progressKey(courseId, chapterId)
  const next = change({ ...(all[key] ?? blankEntry(courseId, chapterId)) })
  writeStored(KEYS.openingProgress, { ...all, [key]: { ...next, lastPracticed: new Date().toISOString() } })
}

/** The user walked a chapter through to the end of a line in study mode. */
export function markStudied(courseId: string, chapterId: string) {
  const already = readStored<OpeningProgress>(KEYS.openingProgress, NO_PROGRESS)[progressKey(courseId, chapterId)]?.studied
  if (already) return
  updateEntry(courseId, chapterId, (e) => ({ ...e, studied: true }))
}

export function readNodeStats(courseId: string, chapterId: string): NodeStats {
  return readStored<AllNodeStats>(NODES_KEY, {})[progressKey(courseId, chapterId)] ?? {}
}

function masteryFrom(tree: PgnTree, course: OpeningCourse, stats: NodeStats): number {
  const nodes = learnNodes(tree.root, course)
  if (!nodes.length) return 0
  return nodes.reduce((total, n) => total + (stats[n.id]?.s ?? 0), 0) / nodes.length
}

/**
 * Remember how one position went. `clean` = you found the move without a slip.
 * A position only counts as a slip once per line, however many wrong tries you needed.
 */
export function recordMove(course: OpeningCourse, chapter: OpeningChapter, tree: PgnTree, nodeId: string, clean: boolean) {
  const all = readStored<AllNodeStats>(NODES_KEY, {})
  const key = progressKey(course.id, chapter.id)
  const stats: NodeStats = { ...(all[key] ?? {}) }
  const old = stats[nodeId] ?? { s: 0, seen: 0, missed: 0 }
  stats[nodeId] = {
    s: clean ? old.s + (1 - old.s) * 0.6 : old.s * 0.4,
    seen: old.seen + 1,
    missed: old.missed + (clean ? 0 : 1),
  }
  writeStored(NODES_KEY, { ...all, [key]: stats })
  const mastery = masteryFrom(tree, course, stats)
  updateEntry(course.id, chapter.id, (e) => ({ ...e, mastery, drillMistakes: e.drillMistakes + (clean ? 0 : 1) }))
}

/** A whole line was played to the end. `streak` is the number of clean lines in a row including this one. */
export function recordLineComplete(courseId: string, chapterId: string, streak: number) {
  updateEntry(courseId, chapterId, (e) => ({
    ...e,
    drillsCompleted: e.drillsCompleted + 1,
    bestStreak: Math.max(e.bestStreak, streak),
  }))
}

/* ------------------------------------------------------- choosing lines */

/** 0 (known well) .. 1 (never seen / often missed): how shaky the user is in this branch. */
export function weaknessOf(node: PgnNode, course: OpeningCourse, stats: NodeStats): number {
  const nodes = learnNodes(node, course)
  if (!nodes.length) return 0
  return nodes.reduce((total, n) => total + (1 - (stats[n.id]?.s ?? 0)), 0) / nodes.length
}

/** Picks one item at random; heavier items are picked more often. */
export function pickWeighted<T>(items: T[], weight: (item: T) => number): T {
  const weights = items.map((i) => Math.max(0.01, weight(i)))
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return items[i]
  }
  return items[items.length - 1]
}
