import type { PuzzleStats } from '../../types'

// Small questions about the stats: which themes go well, and which need more practice?

export interface ThemeRow {
  key: string
  solved: number
  failed: number
  total: number
  /** 0..1 */
  accuracy: number
}

/** A theme needs at least this many puzzles before we call it "weak" (a single miss says very little). */
const MIN_FOR_WEAK = 3
const WEAK_BELOW = 0.7

/** One row per theme the player has tried (and that can still be trained), most-practised first. */
export function themeRows(stats: PuzzleStats, trainable: ReadonlySet<string>): ThemeRow[] {
  return Object.entries(stats.byTheme)
    .filter(([key]) => trainable.has(key))
    .map(([key, { solved, failed }]) => {
      const total = solved + failed
      return { key, solved, failed, total, accuracy: total === 0 ? 0 : solved / total }
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key))
}

/** The themes that go worst, worst first. */
export function weakestRows(rows: ThemeRow[], limit = 3): ThemeRow[] {
  return rows
    .filter((row) => row.total >= MIN_FOR_WEAK && row.accuracy < WEAK_BELOW)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, limit)
}

export function accuracyPercent(stats: PuzzleStats): number | null {
  const total = stats.solved + stats.failed
  return total === 0 ? null : Math.round((stats.solved / total) * 100)
}
