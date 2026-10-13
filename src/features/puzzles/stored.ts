import { useMemo } from 'react'
import type { PuzzleStats } from '../../types'
import { KEYS, readStored, useStored } from '../../lib/storage'
import { DEFAULT_PUZZLE_STATS, cleanStats } from './rating'

// Everything the puzzles page remembers goes through here, and comes out safe to use even when the saved
// value is damaged (see cleanStats in rating.ts). Writing always happens with clean data, so a damaged
// value is repaired the next time the player finishes a puzzle.

/** The saved puzzle stats, cleaned up. Updates whenever they change (also from another tab). */
export function usePuzzleStats(): PuzzleStats {
  const [saved] = useStored<unknown>(KEYS.puzzleStats, DEFAULT_PUZZLE_STATS)
  return useMemo(() => cleanStats(saved), [saved])
}

/** The same, for use inside event handlers (always the newest saved value). */
export function readPuzzleStats(): PuzzleStats {
  return cleanStats(readStored<unknown>(KEYS.puzzleStats, DEFAULT_PUZZLE_STATS))
}

/** The best Puzzle Rush score. */
export function useRushBest(): [number, (score: number) => void] {
  const [saved, save] = useStored<unknown>('puzzles.rushBest', 0)
  const best = typeof saved === 'number' && Number.isFinite(saved) && saved > 0 ? Math.floor(saved) : 0
  return [best, save]
}

/** Whether the "Your stats" panel is open. */
export function useStatsOpen(): [boolean, (open: boolean) => void] {
  const [saved, save] = useStored<unknown>('puzzles.statsOpen', false)
  return [saved === true, save]
}
