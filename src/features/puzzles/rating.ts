import type { PuzzleStats } from '../../types'

// The puzzle rating works like a chess rating (Elo): beat a hard puzzle and you gain a lot,
// miss an easy one and you lose a lot. Everything here is plain maths with no React in it,
// so it is easy to check (see rating.check.ts).

export const START_RATING = 1000
/** The rating never goes below this, so a bad day cannot push it to zero. */
export const MIN_RATING = 100
/** For your first puzzles the rating moves fast (to find your level quickly), then it settles down. */
const EARLY_PUZZLES = 30
const K_EARLY = 32
const K_LATER = 20
/** We keep the last 500 puzzles, plenty for the little graph and for "never repeat". */
const HISTORY_LIMIT = 500

/** Only used when cleaning up saved data: no real rating gets anywhere near this. */
const MAX_RATING = 4000

export const DEFAULT_PUZZLE_STATS: PuzzleStats = {
  rating: START_RATING,
  solved: 0,
  failed: 0,
  streak: 0,
  bestStreak: 0,
  history: [],
  byTheme: {},
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const wholeCount = (value: unknown): number => (isNumber(value) && value > 0 ? Math.floor(value) : 0)

/**
 * Saved stats can be old, half-written or edited by hand. This turns whatever was saved into stats the page can
 * always use: anything missing or odd is replaced by a safe value instead of crashing the page.
 */
export function cleanStats(saved: unknown): PuzzleStats {
  if (!isRecord(saved)) return DEFAULT_PUZZLE_STATS

  const history: PuzzleStats['history'] = []
  if (Array.isArray(saved.history)) {
    for (const item of saved.history) {
      if (!isRecord(item) || !isNumber(item.ratingAfter)) continue
      history.push({
        date: typeof item.date === 'string' ? item.date : '',
        puzzleId: typeof item.puzzleId === 'string' ? item.puzzleId : '',
        solved: item.solved === true,
        puzzleRating: isNumber(item.puzzleRating) ? item.puzzleRating : 0,
        ratingAfter: item.ratingAfter,
        ...(typeof item.theme === 'string' ? { theme: item.theme } : {}),
      })
    }
  }

  const byTheme: PuzzleStats['byTheme'] = {}
  if (isRecord(saved.byTheme)) {
    for (const [theme, row] of Object.entries(saved.byTheme)) {
      // A saved key named "__proto__" would change the object itself instead of adding a theme.
      if (isRecord(row) && theme !== '__proto__') byTheme[theme] = { solved: wholeCount(row.solved), failed: wholeCount(row.failed) }
    }
  }

  const streak = wholeCount(saved.streak)
  return {
    rating: isNumber(saved.rating) ? Math.round(Math.min(MAX_RATING, Math.max(MIN_RATING, saved.rating))) : START_RATING,
    solved: wholeCount(saved.solved),
    failed: wholeCount(saved.failed),
    streak,
    bestStreak: Math.max(wholeCount(saved.bestStreak), streak),
    history: history.slice(-HISTORY_LIMIT),
    byTheme,
  }
}

/** Chance (0..1) that a player of `player` rating solves a puzzle of `puzzle` rating. */
export function expectedScore(player: number, puzzle: number): number {
  return 1 / (1 + 10 ** ((puzzle - player) / 400))
}

/** How big a step the rating takes. `attempts` = puzzles finished so far. */
export function kFactor(attempts: number): number {
  return attempts < EARLY_PUZZLES ? K_EARLY : K_LATER
}

/** The whole-number change in rating for one puzzle. Positive when solved, negative when missed. */
export function ratingChange(player: number, puzzle: number, solved: boolean, attempts: number): number {
  const change = Math.round(kFactor(attempts) * ((solved ? 1 : 0) - expectedScore(player, puzzle)))
  return Math.max(change, MIN_RATING - player)
}

export interface Attempt {
  puzzleId: string
  puzzleRating: number
  /** Every theme of the puzzle (so "Forks" accuracy counts all fork puzzles, whatever you were training). */
  themes: string[]
  /** The theme the player chose to train, if any. */
  focusTheme?: string
  solved: boolean
  /** A hint was used: the puzzle counts as solved, but the rating does not go up. */
  usedHint: boolean
  date: string
}

/**
 * Add one finished puzzle to the stats. Returns the new stats and the rating change (for the message on screen).
 * Retrying a puzzle after a miss, or watching a solution, must NOT call this a second time.
 */
export function applyAttempt(stats: PuzzleStats, attempt: Attempt): { stats: PuzzleStats; delta: number } {
  const attempts = stats.solved + stats.failed
  const rawDelta = ratingChange(stats.rating, attempt.puzzleRating, attempt.solved, attempts)
  // A hint takes away the reward, but a miss still costs: hints are for learning, not for climbing.
  const delta = attempt.solved && attempt.usedHint ? 0 : rawDelta
  const rating = stats.rating + delta

  const clean = attempt.solved && !attempt.usedHint
  const streak = !attempt.solved ? 0 : clean ? stats.streak + 1 : stats.streak

  const byTheme = { ...stats.byTheme }
  const themes = attempt.themes.length > 0 ? attempt.themes : attempt.focusTheme ? [attempt.focusTheme] : []
  for (const theme of new Set(themes)) {
    const before = byTheme[theme] ?? { solved: 0, failed: 0 }
    byTheme[theme] = attempt.solved ? { ...before, solved: before.solved + 1 } : { ...before, failed: before.failed + 1 }
  }

  const history = [
    ...stats.history,
    {
      date: attempt.date,
      puzzleId: attempt.puzzleId,
      solved: attempt.solved,
      puzzleRating: attempt.puzzleRating,
      ratingAfter: rating,
      theme: attempt.focusTheme ?? attempt.themes[0],
    },
  ].slice(-HISTORY_LIMIT)

  return {
    delta,
    stats: {
      rating,
      solved: stats.solved + (attempt.solved ? 1 : 0),
      failed: stats.failed + (attempt.solved ? 0 : 1),
      streak,
      bestStreak: Math.max(stats.bestStreak, streak),
      history,
      byTheme,
    },
  }
}
