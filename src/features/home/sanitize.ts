// Saved data can be old, half written or edited by hand. The dashboard only reads it, so it cleans
// each value into the shape it expects instead of crashing. Pure functions, no React.

import { DEFAULT_PROFILE, type Profile } from '../../types'
import type { GameRecord, OpeningProgress, PuzzleStats, RatingEstimate, TacticsProgress } from '../../types'
import { NO_GAMES, NO_OPENING_PROGRESS, NO_PUZZLE_STATS, NO_TACTICS_PROGRESS } from './defaults'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** Keeps only the entries that are objects (drops null and other junk). */
function objectEntries<T>(value: unknown, empty: Record<string, T>): Record<string, T> {
  if (!isRecord(value)) return empty
  const entries = Object.entries(value).filter(([, entry]) => isRecord(entry))
  return entries.length === Object.keys(value).length ? (value as Record<string, T>) : (Object.fromEntries(entries) as Record<string, T>)
}

export function cleanOpeningProgress(value: unknown): OpeningProgress {
  return objectEntries<OpeningProgress[string]>(value, NO_OPENING_PROGRESS)
}

export function cleanTacticsProgress(value: unknown): TacticsProgress {
  return objectEntries<TacticsProgress[string]>(value, NO_TACTICS_PROGRESS)
}

export function cleanGames(value: unknown): GameRecord[] {
  if (!Array.isArray(value)) return NO_GAMES
  return value.filter(
    (game): game is GameRecord => isRecord(game) && typeof game.id === 'string' && typeof game.date === 'string',
  )
}

export function cleanPuzzleStats(value: unknown): PuzzleStats {
  if (!isRecord(value)) return NO_PUZZLE_STATS
  const history = Array.isArray(value.history)
    ? value.history.filter((item): item is PuzzleStats['history'][number] => isRecord(item) && typeof item.date === 'string')
    : []
  const byTheme: PuzzleStats['byTheme'] = {}
  if (isRecord(value.byTheme)) {
    for (const [key, counts] of Object.entries(value.byTheme)) {
      if (isRecord(counts)) byTheme[key] = { solved: num(counts.solved, 0), failed: num(counts.failed, 0) }
    }
  }
  return {
    rating: num(value.rating, NO_PUZZLE_STATS.rating),
    solved: num(value.solved, 0),
    failed: num(value.failed, 0),
    streak: num(value.streak, 0),
    bestStreak: num(value.bestStreak, 0),
    history: history.map((item) => ({ ...item, ratingAfter: num(item.ratingAfter, NO_PUZZLE_STATS.rating) })),
    byTheme,
  }
}

export function cleanEstimate(value: unknown): RatingEstimate | null {
  if (!isRecord(value)) return null
  if (![value.elo, value.low, value.high].every((n) => typeof n === 'number' && Number.isFinite(n))) return null
  return {
    ...(value as unknown as RatingEstimate),
    gamesUsed: num(value.gamesUsed, 0),
    notes: Array.isArray(value.notes) ? (value.notes as string[]) : [],
    parts: Array.isArray(value.parts) ? (value.parts as RatingEstimate['parts']) : [],
  }
}

export function cleanProfile(value: unknown): Profile {
  if (!isRecord(value)) return DEFAULT_PROFILE
  const profile = { ...DEFAULT_PROFILE, ...(value as Partial<Profile>) }
  return {
    ...profile,
    name: typeof profile.name === 'string' ? profile.name : DEFAULT_PROFILE.name,
    selfRating: num(profile.selfRating, DEFAULT_PROFILE.selfRating),
  }
}
