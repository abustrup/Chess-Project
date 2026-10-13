import { useCallback, useMemo } from 'react'
import type { GameAnalysis, GameRecord } from '../../types'
import { KEYS, readStored, useStored, writeStored } from '../../lib/storage'
import { identifyOpening } from '../../lib/openingName'
import { replayPgn, sansOf } from './pgnGame'

// Small helpers around the stored game list (KEYS.games). Everything that adds, removes or
// updates games goes through here so the list stays newest-first, without duplicates.

/** The Play page keeps the last 200 games too, so we use the same limit. */
export const MAX_STORED_GAMES = 200

const NO_GAMES: GameRecord[] = []

function isGame(g: unknown): g is GameRecord {
  if (!g || typeof g !== 'object') return false
  const r = g as Partial<GameRecord>
  return typeof r.id === 'string' && typeof r.pgn === 'string' && (r.userSide === 'white' || r.userSide === 'black')
}

/** Stored data can be old or damaged: keep only entries that look like real games, so a page never crashes on them. */
function cleanGames(value: unknown): GameRecord[] {
  if (!Array.isArray(value)) return NO_GAMES
  return value.every(isGame) ? value : value.filter(isGame)
}

export function readGames(): GameRecord[] {
  return cleanGames(readStored<unknown>(KEYS.games, NO_GAMES))
}

export function useGames(): [GameRecord[], (next: GameRecord[] | ((prev: GameRecord[]) => GameRecord[])) => void] {
  const [raw, setRaw] = useStored<GameRecord[]>(KEYS.games, NO_GAMES)
  const games = useMemo(() => cleanGames(raw), [raw])
  const setGames = useCallback(
    (next: GameRecord[] | ((prev: GameRecord[]) => GameRecord[])) =>
      setRaw(typeof next === 'function' ? (prev: GameRecord[]) => next(cleanGames(prev)) : next),
    [setRaw],
  )
  return [games, setGames]
}

function newestFirst(list: GameRecord[]): GameRecord[] {
  return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Adds games that are not stored yet (matched by id). Returns how many were really added. */
export function addGames(records: GameRecord[]): { added: number; skipped: number } {
  const current = readGames()
  const known = new Set(current.map((g) => g.id))
  const fresh = records.filter((r) => {
    if (known.has(r.id)) return false
    known.add(r.id)
    return true
  })
  if (fresh.length) writeStored(KEYS.games, newestFirst([...fresh, ...current]).slice(0, MAX_STORED_GAMES))
  return { added: fresh.length, skipped: records.length - fresh.length }
}

export function removeGames(ids: string[]): void {
  const gone = new Set(ids)
  writeStored(
    KEYS.games,
    readGames().filter((g) => !gone.has(g.id)),
  )
}

/**
 * Stores a finished analysis inside the game record, so it is never computed twice.
 * Also fills in the opening name when the game did not have one yet.
 */
export function saveAnalysis(gameId: string, analysis: GameAnalysis): boolean {
  const games = readGames()
  const index = games.findIndex((g) => g.id === gameId)
  if (index < 0) return false
  const game = games[index]
  let openingName = game.openingName
  if (!openingName) {
    try {
      openingName = identifyOpening(sansOf(replayPgn(game.pgn)))?.name
    } catch {
      /* the PGN was already replayed once by the analysis, so this is just a safety net */
    }
  }
  const next = [...games]
  next[index] = { ...game, analysis, ...(openingName ? { openingName } : {}) }
  writeStored(KEYS.games, next)
  return true
}

/** Size of the saved games in characters. Browsers allow roughly 5 million per site, so we can warn early. */
export function storedGamesSize(games: GameRecord[]): number {
  return JSON.stringify(games).length
}

/** Above this many characters we ask the user to delete a few games (the browser limit is about 5 million). */
export const GAMES_SIZE_WARNING = 3_200_000
