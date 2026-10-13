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

// Saved data can be broken (old versions, hand edits, other code). Anything that is not a plain
// object is treated as "nothing saved yet" so a bad value never stops the pages from opening.
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

function cleanProgress(v: unknown): OpeningProgress {
  return isRecord(v) ? (v as OpeningProgress) : NO_PROGRESS
}

function readProgress(): OpeningProgress {
  return cleanProgress(readStored<unknown>(KEYS.openingProgress, NO_PROGRESS))
}

export function useOpeningProgress(): OpeningProgress {
  return cleanProgress(useStored<unknown>(KEYS.openingProgress, NO_PROGRESS)[0])
}

function blankEntry(courseId: string, chapterId: string): Entry {
  return { courseId, chapterId, studied: false, drillsCompleted: 0, drillMistakes: 0, bestStreak: 0, mastery: 0, lastPracticed: '' }
}

export const chapterMastery = (progress: OpeningProgress, courseId: string, chapterId: string): number =>
  Math.max(0, Math.min(1, num(progress[progressKey(courseId, chapterId)]?.mastery)))

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
  const mastery = (c: OpeningChapter) => chapterMastery(progress, course.id, c.id)
  const untouched = chapters.find((c) => entry(c)?.studied !== true && !(mastery(c) > 0))
  if (untouched) return { chapter: untouched, mode: 'study', review: false }
  const notLearned = chapters.find((c) => mastery(c) < MASTERED)
  if (notLearned) return { chapter: notLearned, mode: 'drill', review: false }
  const weakest = chapters.reduce((a, b) => (mastery(b) < mastery(a) ? b : a))
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
  const all = readProgress()
  const key = progressKey(courseId, chapterId)
  const old: Partial<Entry> = isRecord(all[key]) ? all[key] : {}
  const blank = blankEntry(courseId, chapterId)
  const next = change({
    ...blank,
    ...old,
    studied: old.studied === true,
    drillsCompleted: num(old.drillsCompleted),
    drillMistakes: num(old.drillMistakes),
    bestStreak: num(old.bestStreak),
    mastery: num(old.mastery),
  })
  writeStored(KEYS.openingProgress, { ...all, [key]: { ...next, lastPracticed: new Date().toISOString() } })
}

/** The user walked a chapter through to the end of a line in study mode. */
export function markStudied(courseId: string, chapterId: string) {
  const already = readProgress()[progressKey(courseId, chapterId)]?.studied === true
  if (already) return
  updateEntry(courseId, chapterId, (e) => ({ ...e, studied: true }))
}

function readAllNodeStats(): AllNodeStats {
  const all = readStored<unknown>(NODES_KEY, {})
  return isRecord(all) ? (all as AllNodeStats) : {}
}

export function readNodeStats(courseId: string, chapterId: string): NodeStats {
  const stats = readAllNodeStats()[progressKey(courseId, chapterId)]
  return isRecord(stats) ? stats : {}
}

function masteryFrom(tree: PgnTree, course: OpeningCourse, stats: NodeStats): number {
  const nodes = learnNodes(tree.root, course)
  if (!nodes.length) return 0
  return nodes.reduce((total, n) => total + num(stats[n.id]?.s), 0) / nodes.length
}

/**
 * Remember how one position went. `clean` = you found the move without a slip.
 * A position only counts as a slip once per line, however many wrong tries you needed.
 */
export function recordMove(course: OpeningCourse, chapter: OpeningChapter, tree: PgnTree, nodeId: string, clean: boolean) {
  const all = readAllNodeStats()
  const key = progressKey(course.id, chapter.id)
  const stats: NodeStats = { ...readNodeStats(course.id, chapter.id) }
  const raw: Partial<NodeStat> = isRecord(stats[nodeId]) ? stats[nodeId] : {}
  const old = { s: Math.max(0, Math.min(1, num(raw.s))), seen: num(raw.seen), missed: num(raw.missed) }
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
  return nodes.reduce((total, n) => total + (1 - num(stats[n.id]?.s)), 0) / nodes.length
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
