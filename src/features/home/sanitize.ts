// Saved data can be old, half written, restored from a backup or edited by hand. Home and Settings only
// read it, so they clean each value into the shape they expect instead of crashing. Pure functions, no React.

import { DEFAULT_PROFILE, type Profile } from '../../types'
import type { GameRecord, OpeningProgress, PuzzleStats, RatingEstimate, Result, TacticsProgress } from '../../types'
import { BOARD_THEMES } from '../../lib/themes'
import { PIECE_SETS } from '../../lib/pieceSets'
import { NO_GAMES, NO_OPENING_PROGRESS, NO_PUZZLE_STATS, NO_TACTICS_PROGRESS } from './defaults'

/** Longest name we show. The name box allows 30 letters; this leaves room for names saved by older versions. */
const MAX_NAME = 40
/** Same limits as the rating box in Settings. */
export const MIN_RATING = 100
export const MAX_RATING = 3000
const RESULTS: Result[] = ['1-0', '0-1', '1/2-1/2', '*']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function count(value: unknown): number {
  return Math.max(0, Math.round(num(value, 0)))
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** Each entry that is an object gets cleaned; null, numbers and other junk entries are dropped. */
function cleanEntries<T>(value: unknown, empty: Record<string, T>, clean: (entry: Record<string, unknown>) => T): Record<string, T> {
  if (!isRecord(value)) return empty
  const out: Record<string, T> = {}
  for (const [key, entry] of Object.entries(value)) if (isRecord(entry)) out[key] = clean(entry)
  return out
}

export function cleanOpeningProgress(value: unknown): OpeningProgress {
  return cleanEntries<OpeningProgress[string]>(value, NO_OPENING_PROGRESS, (entry) => ({
    ...entry,
    courseId: text(entry.courseId),
    chapterId: text(entry.chapterId),
    studied: entry.studied === true,
    drillsCompleted: count(entry.drillsCompleted),
    drillMistakes: count(entry.drillMistakes),
    bestStreak: count(entry.bestStreak),
    mastery: Math.min(1, Math.max(0, num(entry.mastery, 0))),
    lastPracticed: text(entry.lastPracticed),
  }))
}

export function cleanTacticsProgress(value: unknown): TacticsProgress {
  return cleanEntries<TacticsProgress[string]>(value, NO_TACTICS_PROGRESS, (entry) => ({
    ...entry,
    lessonId: text(entry.lessonId),
    introSeen: entry.introSeen === true,
    examplesSeen: count(entry.examplesSeen),
    solvedExerciseIds: Array.isArray(entry.solvedExerciseIds)
      ? [...new Set(entry.solvedExerciseIds.filter((id): id is string => typeof id === 'string'))]
      : [],
    failedAttempts: count(entry.failedAttempts),
    completedAt: optionalText(entry.completedAt),
  }))
}

export function cleanGames(value: unknown): GameRecord[] {
  if (!Array.isArray(value)) return NO_GAMES
  const games: GameRecord[] = []
  for (const game of value) {
    if (!isRecord(game) || typeof game.id !== 'string' || typeof game.date !== 'string') continue
    games.push({
      ...(game as unknown as GameRecord),
      source: game.source === 'lichess' || game.source === 'pgn' ? game.source : 'app',
      pgn: text(game.pgn),
      white: text(game.white, 'Unknown player'),
      black: text(game.black, 'Unknown player'),
      whiteElo: optionalNumber(game.whiteElo),
      blackElo: optionalNumber(game.blackElo),
      userSide: game.userSide === 'black' ? 'black' : 'white',
      result: RESULTS.includes(game.result as Result) ? (game.result as Result) : '*',
      openingName: optionalText(game.openingName),
      botElo: optionalNumber(game.botElo),
      courseId: optionalText(game.courseId),
      analysis: isRecord(game.analysis) ? (game.analysis as unknown as GameRecord['analysis']) : undefined,
    })
  }
  return games
}

export function cleanPuzzleStats(value: unknown): PuzzleStats {
  if (!isRecord(value)) return NO_PUZZLE_STATS
  const history: PuzzleStats['history'] = []
  if (Array.isArray(value.history)) {
    for (const item of value.history) {
      if (!isRecord(item) || typeof item.date !== 'string') continue
      history.push({
        ...(item as unknown as PuzzleStats['history'][number]),
        solved: item.solved === true,
        puzzleRating: num(item.puzzleRating, NO_PUZZLE_STATS.rating),
        ratingAfter: num(item.ratingAfter, NO_PUZZLE_STATS.rating),
      })
    }
  }
  const byTheme: PuzzleStats['byTheme'] = {}
  if (isRecord(value.byTheme)) {
    for (const [key, counts] of Object.entries(value.byTheme)) {
      if (isRecord(counts)) byTheme[key] = { solved: count(counts.solved), failed: count(counts.failed) }
    }
  }
  return {
    rating: num(value.rating, NO_PUZZLE_STATS.rating),
    solved: count(value.solved),
    failed: count(value.failed),
    streak: count(value.streak),
    bestStreak: count(value.bestStreak),
    history,
    byTheme,
  }
}

export function cleanEstimate(value: unknown): RatingEstimate | null {
  if (!isRecord(value)) return null
  if (![value.elo, value.low, value.high].every((n) => typeof n === 'number' && Number.isFinite(n))) return null
  const [elo, low, high] = [value.elo, value.low, value.high] as number[]
  return {
    ...(value as unknown as RatingEstimate),
    elo,
    // a range saved upside down is still a range
    low: Math.min(low, high, elo),
    high: Math.max(low, high, elo),
    gamesUsed: count(value.gamesUsed),
    notes: Array.isArray(value.notes) ? value.notes.filter((n): n is string => typeof n === 'string') : [],
    parts: Array.isArray(value.parts) ? (value.parts.filter(isRecord) as unknown as RatingEstimate['parts']) : [],
  }
}

/** A profile with every field in the right shape. Unknown board colours and piece sets fall back to the
 *  ones the board really shows in that case, so Settings marks the right choice. Extra fields are kept. */
export function cleanProfile(value: unknown): Profile {
  if (!isRecord(value)) return DEFAULT_PROFILE
  const merged = { ...DEFAULT_PROFILE, ...(value as Partial<Profile>) }
  const bool = (field: 'zenMode' | 'soundOn' | 'showLegalMoves') =>
    typeof merged[field] === 'boolean' ? merged[field] : DEFAULT_PROFILE[field]
  return {
    ...merged,
    name: text(merged.name, DEFAULT_PROFILE.name).slice(0, MAX_NAME),
    lichessUsername: text(merged.lichessUsername),
    selfRating: Math.min(MAX_RATING, Math.max(MIN_RATING, Math.round(num(merged.selfRating, DEFAULT_PROFILE.selfRating)))),
    appTheme: merged.appTheme === 'ember' ? 'ember' : 'ocean',
    boardTheme: BOARD_THEMES.some((t) => t.id === merged.boardTheme) ? merged.boardTheme : BOARD_THEMES[0].id,
    pieceSet: PIECE_SETS.some((s) => s.id === merged.pieceSet) ? merged.pieceSet : PIECE_SETS[0].id,
    zenMode: bool('zenMode'),
    soundOn: bool('soundOn'),
    showLegalMoves: bool('showLegalMoves'),
  }
}
