import type { GameRecord, OpeningProgress, PuzzleStats, TacticsProgress } from '../../types'

// Stable "nothing saved yet" values. Using the same object every time keeps React from re-rendering for nothing.
export const NO_GAMES: GameRecord[] = []
export const NO_OPENING_PROGRESS: OpeningProgress = {}
export const NO_TACTICS_PROGRESS: TacticsProgress = {}
export const NO_PUZZLE_STATS: PuzzleStats = {
  rating: 1000,
  solved: 0,
  failed: 0,
  streak: 0,
  bestStreak: 0,
  history: [],
  byTheme: {},
}
