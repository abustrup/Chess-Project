import type { Puzzle, PuzzleIndexEntry } from '../../types'
import { loadPuzzles, pickPuzzle } from '../../lib/puzzleData'
import { readStored, writeStored } from '../../lib/storage'

// Which puzzle comes next? One that is close to the player's rating and that they have not seen before.

/** How far (in rating points) a puzzle may be from the player's rating. */
export const RATING_WINDOW = 150
/** Puzzles already shown are remembered so they do not come back until every puzzle has been used. */
const SEEN_KEY = 'puzzles.seen'
const SEEN_LIMIT = 6000

export function readSeen(): Set<string> {
  return new Set(readStored<string[]>(SEEN_KEY, []))
}

export function markSeen(id: string): void {
  const seen = readStored<string[]>(SEEN_KEY, []).filter((x) => x !== id)
  writeStored(SEEN_KEY, [...seen, id].slice(-SEEN_LIMIT))
}

function forgetSeen(ids: Iterable<string>): void {
  const forget = new Set(ids)
  writeStored(
    SEEN_KEY,
    readStored<string[]>(SEEN_KEY, []).filter((id) => !forget.has(id)),
  )
}

export interface Pick {
  puzzle: Puzzle
  /** True when every puzzle of the choice had been seen, so the memory was cleared and we start over. */
  startedOver: boolean
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

interface PickOptions {
  targetRating: number
  /** Puzzle ids that may not be picked. */
  exclude: Set<string>
  /** Forget the excluded puzzles of this choice when all of them are used up (training only). */
  startOverWhenEmpty?: boolean
  window?: number
}

/**
 * Pick the next puzzle out of one or more puzzle files. With several files (Mixed) the files are tried in a
 * random order, so the themes come in a surprise order, until one has a puzzle close to the player's rating.
 * Returns null only when the files hold no puzzles at all.
 */
export async function pickNext(entries: PuzzleIndexEntry[], options: PickOptions): Promise<Pick | null> {
  const { targetRating, exclude, startOverWhenEmpty = false, window = RATING_WINDOW } = options
  const order = shuffled(entries)
  const loaded: Puzzle[][] = []
  let best: (Pick & { gap: number }) | null = null

  for (const entry of order) {
    const puzzles = await loadPuzzles(entry)
    loaded.push(puzzles)
    const puzzle = pickPuzzle(puzzles, { targetRating, excludeIds: exclude, window })
    if (!puzzle) continue
    const gap = Math.abs(puzzle.rating - targetRating)
    if (!best || gap < best.gap) best = { puzzle, startedOver: false, gap }
    if (gap <= window) break
  }
  if (best) return best

  // Nothing fresh is left anywhere: start again from the beginning.
  const everything = loaded.flat()
  if (everything.length === 0) return null
  if (startOverWhenEmpty) forgetSeen(everything.map((p) => p.id))
  const puzzle = pickPuzzle(loaded[0], { targetRating, window })
  return puzzle ? { puzzle, startedOver: true } : null
}
