// Starting a game: the remembered setup choices, links like /play?course=..., and turning the
// choices into a GameConfig.

import { Chess } from 'chess.js'
import { OPENING_COURSES } from '../../data/openings'
import type { OpeningCourse, Side } from '../../types'
import { getLevel, levelNearestTo } from './botLevels'
import { START_FEN, derive } from './position'
import { getTimeControl } from './timeControls'
import { ANY_CHAPTER, type GameConfig, type PlayMode, type SavedGame, type SetupChoices } from './types'

/** localStorage keys (the storage helper adds the 'cc.' prefix): 'cc.play.setup', 'cc.play.current'. */
export const SETUP_KEY = 'play.setup'
export const CURRENT_GAME_KEY = 'play.current'
export const EVAL_BAR_KEY = 'play.evalBar'

export const DEFAULT_SETUP: SetupChoices = {
  colour: 'white',
  levelId: '', // empty = pick the level closest to the player's own rating
  mode: 'free',
  courseId: 'london',
  chapterId: ANY_CHAPTER,
  timeId: 'none',
  coach: true,
}

/* ------------------------------------------------- damaged or old saves */

const MODES: PlayMode[] = ['free', 'practice', 'face']

function asRecord(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback
}

/** A stored setup may be old or damaged (edited by hand, older app version): keep only the parts that make sense. */
export function cleanSetup(raw: unknown): SetupChoices {
  const s = asRecord(raw) ?? {}
  return {
    colour: s.colour === 'white' || s.colour === 'black' || s.colour === 'random' ? s.colour : DEFAULT_SETUP.colour,
    levelId: str(s.levelId, DEFAULT_SETUP.levelId),
    mode: MODES.includes(s.mode as PlayMode) ? (s.mode as PlayMode) : DEFAULT_SETUP.mode,
    courseId: str(s.courseId, DEFAULT_SETUP.courseId),
    chapterId: str(s.chapterId, DEFAULT_SETUP.chapterId),
    timeId: str(s.timeId, DEFAULT_SETUP.timeId),
    coach: typeof s.coach === 'boolean' ? s.coach : DEFAULT_SETUP.coach,
  }
}

/** A saved unfinished game, repaired where possible. Null when it cannot be used at all. */
export function cleanSavedGame(raw: unknown): SavedGame | null {
  const g = asRecord(raw)
  const c = asRecord(g?.config)
  if (!g || !c || typeof c.id !== 'string' || (c.userSide !== 'white' && c.userSide !== 'black')) return null
  const startFen = str(c.startFen, '')
  if (!validFen(startFen) || !Array.isArray(g.ucis)) return null
  // keep the moves up to the first one that does not fit the position
  const ucis = derive(
    startFen,
    g.ucis.filter((u): u is string => typeof u === 'string'),
  ).ucis
  const clock = asRecord(g.clock)
  const mode: PlayMode = MODES.includes(c.mode as PlayMode) ? (c.mode as PlayMode) : 'free'
  return {
    config: {
      id: c.id,
      userSide: c.userSide,
      levelId: getLevel(str(c.levelId, '')).id,
      mode,
      courseId: mode !== 'free' && typeof c.courseId === 'string' ? c.courseId : undefined,
      chapterId: mode !== 'free' && typeof c.chapterId === 'string' ? c.chapterId : undefined,
      startFen,
      timeId: getTimeControl(str(c.timeId, '')).id,
      startedAt: str(c.startedAt, new Date().toISOString()),
    },
    ucis,
    clock: clock && Number.isFinite(clock.w) && Number.isFinite(clock.b) ? { w: clock.w as number, b: clock.b as number } : null,
    hintsUsed: Number.isFinite(g.hintsUsed) ? (g.hintsUsed as number) : 0,
    takebacks: Number.isFinite(g.takebacks) ? (g.takebacks as number) : 0,
  }
}

export function levelIdFor(choices: SetupChoices, selfRating: number): string {
  return choices.levelId ? getLevel(choices.levelId).id : levelNearestTo(selfRating).id
}

export function opposite(side: Side): Side {
  return side === 'white' ? 'black' : 'white'
}

/** Courses that already have lessons (and so can be practised or faced). */
export function playableCourses(): OpeningCourse[] {
  return OPENING_COURSES.filter((c) => c.chapters.length > 0)
}

export function courseById(id: string): OpeningCourse | undefined {
  return OPENING_COURSES.find((c) => c.id === id)
}

export function newGameId(): string {
  return `app-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`
}

/** The colour the player gets, given the setup (the opening can decide it). */
function resolveSide(choices: SetupChoices, course: OpeningCourse | undefined, forced?: Side): Side {
  if (forced) return forced
  if (course && choices.mode === 'practice') return course.side
  if (course && choices.mode === 'face') return opposite(course.side)
  if (choices.colour === 'random') return Math.random() < 0.5 ? 'white' : 'black'
  return choices.colour
}

export interface StartOptions {
  selfRating: number
  /** Start from this position instead of the normal one. */
  fen?: string
  /** Colour the player gets (needed for a custom position). */
  side?: Side
}

/** Turn the setup into a new game. Opening modes without lessons quietly become free play. */
export function makeConfig(choices: SetupChoices, opts: StartOptions): GameConfig {
  const course = playableCourses().find((c) => c.id === choices.courseId)
  const mode: PlayMode = choices.mode !== 'free' && course ? choices.mode : 'free'
  const effective = { ...choices, mode }
  const chapterOk = course?.chapters.some((c) => c.id === choices.chapterId)
  return {
    id: newGameId(),
    userSide: resolveSide(effective, course, opts.side),
    levelId: levelIdFor(choices, opts.selfRating),
    mode,
    courseId: mode === 'free' ? undefined : course?.id,
    chapterId: mode === 'free' ? undefined : chapterOk ? choices.chapterId : ANY_CHAPTER,
    startFen: opts.fen ?? START_FEN,
    timeId: getTimeControl(choices.timeId).id,
    startedAt: new Date().toISOString(),
  }
}

export function newSavedGame(config: GameConfig): SavedGame {
  return { config, ucis: [], clock: null, hintsUsed: 0, takebacks: 0 }
}

/** Same settings again. In a normal free game the colours swap, like a real rematch. */
export function rematchConfig(old: GameConfig): GameConfig {
  const swap = old.mode === 'free' && old.startFen === START_FEN
  return {
    ...old,
    id: newGameId(),
    userSide: swap ? opposite(old.userSide) : old.userSide,
    startedAt: new Date().toISOString(),
  }
}

/* ------------------------------------------------------------------ links */

export interface LaunchRequest {
  /** Setup choices to fill in (the rest stay as the player last left them). */
  prefill: Partial<SetupChoices>
  fen?: string
  side?: Side
  /** True when the link has everything needed to start straight away. */
  autoStart: boolean
  /** Friendly message when part of the link could not be used. */
  problem?: string
}

function validFen(fen: string): boolean {
  try {
    new Chess(fen)
    return true
  } catch {
    return false
  }
}

/** Reads /play?course=..&chapter=..&mode=practice|face and /play?fen=..&side=white|black. */
export function parseLaunch(params: URLSearchParams): LaunchRequest {
  const out: LaunchRequest = { prefill: {}, autoStart: false }

  const fen = params.get('fen')
  const sideParam = params.get('side')
  if (fen) {
    if (validFen(fen)) {
      out.fen = fen
      out.side = sideParam === 'black' ? 'black' : sideParam === 'white' ? 'white' : new Chess(fen).turn() === 'w' ? 'white' : 'black'
      out.prefill = { mode: 'free', colour: out.side }
      out.autoStart = true
    } else {
      out.problem = 'That position link could not be read, so here is the normal setup.'
    }
  }

  const courseId = params.get('course')
  if (courseId && !out.fen) {
    const course = courseById(courseId)
    const mode: PlayMode = params.get('mode') === 'face' ? 'face' : 'practice'
    if (!course || course.chapters.length === 0) {
      out.prefill = { mode: 'free' }
      out.problem = course
        ? `The ${course.name} lessons are coming soon. You can play a normal game for now.`
        : 'That opening could not be found, so here is the normal setup.'
    } else {
      const chapter = params.get('chapter')
      const chapterId = chapter && course.chapters.some((c) => c.id === chapter) ? chapter : ANY_CHAPTER
      out.prefill = { mode, courseId: course.id, chapterId }
      out.autoStart = true
    }
  }
  return out
}
