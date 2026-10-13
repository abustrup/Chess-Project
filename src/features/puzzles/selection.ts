import type { Puzzle, PuzzleIndexEntry } from '../../types'
import { PuzzleLoadError, loadPuzzles, pickPuzzle } from '../../lib/puzzleData'
import { readStored, writeStored } from '../../lib/storage'

// Which puzzle comes next? One that is close to the player's rating and that they have not seen before.

/** How far (in rating points) a puzzle may be from the player's rating. */
export const RATING_WINDOW = 150
/** Puzzles already shown are remembered so they do not come back until every puzzle has been used. */
const SEEN_KEY = 'puzzles.seen'
const SEEN_LIMIT = 6000

/** The remembered ids as a list. A damaged value (not a list of texts) counts as "nothing seen yet". */
function seenIds(): string[] {
  const saved = readStored<unknown>(SEEN_KEY, [])
  return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
}

export function readSeen(): Set<string> {
  return new Set(seenIds())
}

export function markSeen(id: string): void {
  const seen = seenIds().filter((x) => x !== id)
  writeStored(SEEN_KEY, [...seen, id].slice(-SEEN_LIMIT))
}

function forgetSeen(ids: Iterable<string>): void {
  const forget = new Set(ids)
  writeStored(
    SEEN_KEY,
    seenIds().filter((id) => !forget.has(id)),
  )
}

export interface Pick {
  puzzle: Puzzle
  /** True when every puzzle of the choice had been seen, so the memory was cleared and we start over. */
  startedOver: boolean
}

/**
 * The side the player plays in each of their openings. Opening puzzles where you are on that side come first, so you
 * practise the tricks of your own games (the other side's puzzles are used only if a file has none of yours).
 */
const OPENING_SIDE: Record<string, 'w' | 'b'> = { london: 'w', 'caro-kann': 'b', slav: 'b' }

/** The puzzles of a file that fit the player: for an opening, the ones solved from the player's side of the board. */
function forPlayer(entry: PuzzleIndexEntry, puzzles: Puzzle[]): Puzzle[] {
  const side = entry.kind === 'opening' ? OPENING_SIDE[entry.key] : undefined
  if (!side) return puzzles
  // The puzzle position has the opponent to move (they play moves[0]), so the solver is the other colour.
  const mine = puzzles.filter((p) => (p.fen.split(' ')[1] === 'w' ? 'b' : 'w') === side)
  return mine.length > 0 ? mine : puzzles
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
 * A file that cannot be loaded is skipped as long as another one works; the error is only passed on when
 * none of them could be loaded. Returns null only when the files hold no puzzles at all.
 */
export async function pickNext(entries: PuzzleIndexEntry[], options: PickOptions): Promise<Pick | null> {
  const { targetRating, exclude, startOverWhenEmpty = false, window = RATING_WINDOW } = options
  const order = shuffled(entries)
  const loaded: Puzzle[][] = []
  let firstError: unknown = null
  let failures = 0
  let best: (Pick & { gap: number }) | null = null

  for (const entry of order) {
    let puzzles: Puzzle[]
    try {
      puzzles = forPlayer(entry, await loadPuzzles(entry))
    } catch (error) {
      firstError ??= error
      // Offline, every file fails the same way: give up after a few instead of trying all of them.
      if (++failures >= 3 && loaded.length === 0) break
      continue
    }
    loaded.push(puzzles)
    const puzzle = pickPuzzle(puzzles, { targetRating, excludeIds: exclude, window })
    if (!puzzle) continue
    const gap = Math.abs(puzzle.rating - targetRating)
    if (!best || gap < best.gap) best = { puzzle, startedOver: false, gap }
    if (gap <= window) break
  }
  if (best) return best
  if (loaded.length === 0 && firstError) {
    // With several files (Mixed, Your openings) the first error names one random file, which only confuses: say "the puzzles".
    if (entries.length > 1 && firstError instanceof PuzzleLoadError) {
      throw new PuzzleLoadError(firstError.message.replace(/the "[^"]*" puzzles/, 'the puzzles'), { cause: firstError })
    }
    throw firstError
  }

  // Nothing fresh is left anywhere: start again from the beginning.
  const everything = loaded.flat()
  if (everything.length === 0) return null
  if (startOverWhenEmpty) forgetSeen(everything.map((p) => p.id))
  const puzzle = pickPuzzle(everything, { targetRating, window })
  return puzzle ? { puzzle, startedOver: true } : null
}
