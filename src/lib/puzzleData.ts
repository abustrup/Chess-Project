import { Chess } from 'chess.js'
import type { Puzzle, PuzzleIndex, PuzzleIndexEntry, Side } from '../types'

// Loads the puzzle files made by scripts/build-puzzles.ts (see docs/puzzle-data.md).
// Files are fetched on demand, one theme or opening at a time, and kept in memory afterwards.

/** An error whose `message` is safe to show to the user as it is. */
export class PuzzleLoadError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'PuzzleLoadError'
  }
}

/** An index entry as written by the build script, which also fills in a heading for the page. */
type GroupedEntry = PuzzleIndexEntry & { group?: string }

let indexPromise: Promise<PuzzleIndex> | null = null
const fileCache = new Map<string, Promise<Puzzle[]>>()

// The messages below are shown to the player as they are, so they say what happened in plain words.
// (The file name stays in the error's `cause` and in the browser's network tab for whoever fixes it.)
const MISSING_FILES = 'The puzzle files may be missing from this copy of the app.'

async function fetchJson(file: string, what: string): Promise<unknown> {
  const url = `${import.meta.env.BASE_URL}${file}`
  let response: Response
  try {
    response = await fetch(url)
  } catch (cause) {
    throw new PuzzleLoadError(`We could not load ${what}. Please check your internet connection and try again.`, { cause })
  }
  if (!response.ok) {
    throw new PuzzleLoadError(`We could not find ${what}. ${MISSING_FILES}`, { cause: `${file}: error ${response.status}` })
  }
  try {
    return await response.json()
  } catch (cause) {
    // A dev server answers a missing file with the home page, which is not JSON.
    throw new PuzzleLoadError(`We could not read ${what}. ${MISSING_FILES}`, { cause: `${file}: not valid JSON (${String(cause)})` })
  }
}

const isText = (value: unknown): value is string => typeof value === 'string'

/** Keep only the index entries that have everything the page needs (a damaged entry is left out, not a crash). */
function isUsableEntry(entry: unknown): entry is PuzzleIndexEntry {
  if (typeof entry !== 'object' || entry === null) return false
  const e = entry as Record<string, unknown>
  return (
    isText(e.key) &&
    (e.kind === 'theme' || e.kind === 'opening') &&
    isText(e.label) &&
    isText(e.file) &&
    typeof e.count === 'number' &&
    (e.description === undefined || isText(e.description)) &&
    (e.group === undefined || isText(e.group))
  )
}

/** A puzzle with everything needed to play it. Anything else in a puzzle file is skipped. */
function toPuzzle(item: unknown): Puzzle | null {
  if (typeof item !== 'object' || item === null) return null
  const p = item as Record<string, unknown>
  if (!isText(p.id) || !isText(p.fen) || typeof p.rating !== 'number' || !Number.isFinite(p.rating)) return null
  if (!Array.isArray(p.moves) || p.moves.length < 2 || !p.moves.every(isText)) return null
  const themes = Array.isArray(p.themes) ? p.themes.filter(isText) : []
  return { id: p.id, fen: p.fen, moves: p.moves, rating: p.rating, themes, ...(isText(p.opening) ? { opening: p.opening } : {}) }
}

/** The list of every puzzle file (themes and openings) with friendly names. Loaded once. */
export function loadPuzzleIndex(): Promise<PuzzleIndex> {
  if (!indexPromise) {
    const pending = fetchJson('puzzles/index.json', 'the puzzle list').then((data) => {
      const index = data as Partial<PuzzleIndex> | null
      if (!Array.isArray(index?.entries)) throw new PuzzleLoadError(`We could not read the puzzle list. ${MISSING_FILES}`)
      return { ...index, entries: index.entries.filter(isUsableEntry) } as PuzzleIndex
    })
    // Do not remember a failure, so "Try again" really tries again.
    pending.catch(() => {
      indexPromise = null
    })
    indexPromise = pending
  }
  return indexPromise
}

/** All puzzles of one theme or opening, sorted from easiest to hardest. Loaded once per file. */
export function loadPuzzles(entry: PuzzleIndexEntry): Promise<Puzzle[]> {
  let pending = fileCache.get(entry.file)
  if (!pending) {
    pending = fetchJson(entry.file, `the "${entry.label}" puzzles`).then((data) => {
      if (!Array.isArray(data)) throw new PuzzleLoadError(`We could not read the "${entry.label}" puzzles. ${MISSING_FILES}`)
      return data.map(toPuzzle).filter((p): p is Puzzle => p !== null)
    })
    pending.catch(() => fileCache.delete(entry.file))
    fileCache.set(entry.file, pending)
  }
  return pending
}

/**
 * The index entries as the headings the puzzles page can show ("Tactics", "Checkmates" ...), in index order.
 * The build script adds a `group` to every entry; an entry without one goes under "More".
 */
export function groupEntries(index: PuzzleIndex): { title: string; entries: PuzzleIndexEntry[] }[] {
  const groups: { title: string; entries: PuzzleIndexEntry[] }[] = []
  for (const entry of index.entries) {
    const title = (entry as GroupedEntry).group ?? 'More'
    const group = groups.find((g) => g.title === title)
    if (group) group.entries.push(entry)
    else groups.push({ title, entries: [entry] })
  }
  return groups
}

export interface PickOptions {
  /** The rating you would like the puzzle to be close to (usually the player's puzzle rating). */
  targetRating: number
  /** Puzzles already solved or shown, so they do not come back. */
  excludeIds?: Iterable<string>
  /** How far from targetRating a puzzle may be. Default 150. */
  window?: number
}

/**
 * Pick a random puzzle near the target rating. If none is that close, the closest ones are used instead,
 * so this only returns null when every puzzle has been excluded.
 */
export function pickPuzzle(puzzles: Puzzle[], { targetRating, excludeIds, window = 150 }: PickOptions): Puzzle | null {
  const skip = new Set(excludeIds ?? [])
  const fresh = puzzles.filter((p) => !skip.has(p.id))
  if (fresh.length === 0) return null
  const distance = (p: Puzzle) => Math.abs(p.rating - targetRating)
  const near = fresh.filter((p) => distance(p) <= window)
  if (near.length > 0) return near[Math.floor(Math.random() * near.length)]
  const closest = [...fresh].sort((a, b) => distance(a) - distance(b)).slice(0, 5)
  return closest[Math.floor(Math.random() * closest.length)]
}

export interface PuzzleStart {
  /** The position you see first: the board after the opponent's first move. */
  startFen: string
  /** Moves in UCI: the move you must find, then the opponent's reply, then your next move, and so on. */
  solution: string[]
  /** The side you play (the side to move in startFen). Show the board from this side. */
  orientation: Side
  /** The opponent's move that started the puzzle, for the "last move" highlight on the board. */
  lastMove: [string, string]
  /** The same move in normal notation, e.g. "Bxf7+". */
  opponentSan: string
}

/** Lichess puzzles begin one move earlier than what you solve: apply the opponent's first move to get the real start. */
export function puzzleToStart(puzzle: Puzzle): PuzzleStart {
  const [first, ...solution] = puzzle.moves
  const chess = new Chess(puzzle.fen)
  let move
  try {
    move = chess.move({ from: first.slice(0, 2), to: first.slice(2, 4), promotion: first.slice(4, 5) || undefined })
  } catch (cause) {
    throw new PuzzleLoadError(`Puzzle ${puzzle.id} is damaged (its first move is not legal).`, { cause })
  }
  return {
    startFen: chess.fen(),
    solution,
    orientation: chess.turn() === 'w' ? 'white' : 'black',
    lastMove: [move.from, move.to],
    opponentSan: move.san,
  }
}
