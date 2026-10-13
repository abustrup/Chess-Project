// Backup, restore and reset of everything the app remembers.
//
// All saved data lives in this browser's localStorage under keys that start with "cc." (see lib/storage.ts).
// A backup is one JSON file that holds all of those keys, so it also covers settings of features that
// keep their own private keys (for example "cc.play.setup").

const PREFIX = 'cc.'
const APP_ID = 'chess-coach'
const VERSION = 1
/** A real backup is a few hundred KB. Anything much bigger is not one of ours. */
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024
const KEY_PATTERN = /^cc\.[A-Za-z0-9._-]{1,80}$/

export interface Backup {
  app: typeof APP_ID
  version: number
  exportedAt: string
  /** Every saved value that is valid JSON, by its full key ("cc.games" ...). */
  data: Record<string, unknown>
  /** Values that are plain text instead of JSON (rare), kept exactly as they were. */
  text?: Record<string, string>
}

export interface DataSummary {
  hasProfile: boolean
  games: number
  openingChapters: number
  tacticLessons: number
  puzzlesTried: number
  /** how many separate items the backup holds */
  keys: number
}

export type ParseResult = { ok: true; backup: Backup; summary: DataSummary } | { ok: false; error: string }

type Raw = Record<string, string>

/* ------------------------------------------------------------------ reading */

function readRaw(): Raw {
  const out: Raw = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(PREFIX)) {
        const value = localStorage.getItem(key)
        if (value !== null) out[key] = value
      }
    }
  } catch {
    /* storage blocked: there is simply nothing to read */
  }
  return out
}

export function createBackup(now = new Date()): Backup {
  const data: Record<string, unknown> = {}
  const text: Record<string, string> = {}
  for (const [key, raw] of Object.entries(readRaw())) {
    try {
      data[key] = JSON.parse(raw)
    } catch {
      text[key] = raw
    }
  }
  const backup: Backup = { app: APP_ID, version: VERSION, exportedAt: now.toISOString(), data }
  if (Object.keys(text).length > 0) backup.text = text
  return backup
}

export function backupFileName(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `chess-coach-backup-${now.getFullYear()}-${month}-${day}.json`
}

/* --------------------------------------------------------------- validation */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasType(obj: Record<string, unknown>, field: string, type: 'string' | 'number' | 'boolean'): boolean {
  return !(field in obj) || typeof obj[field] === type
}

function validProfile(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    (['name', 'lichessUsername', 'boardTheme', 'pieceSet'] as const).every((f) => hasType(value, f, 'string')) &&
    hasType(value, 'selfRating', 'number') &&
    (['zenMode', 'soundOn', 'showLegalMoves'] as const).every((f) => hasType(value, f, 'boolean')) &&
    (!('appTheme' in value) || value.appTheme === 'ocean' || value.appTheme === 'ember')
  )
}

function validGames(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (g) =>
        isRecord(g) &&
        typeof g.id === 'string' &&
        typeof g.pgn === 'string' &&
        typeof g.date === 'string' &&
        (g.userSide === 'white' || g.userSide === 'black') &&
        ['1-0', '0-1', '1/2-1/2', '*'].includes(g.result as string),
    )
  )
}

function validOpeningProgress(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (e) => isRecord(e) && typeof e.courseId === 'string' && typeof e.chapterId === 'string' && typeof e.mastery === 'number',
    )
  )
}

function validTacticsProgress(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.values(value).every((e) => isRecord(e) && typeof e.lessonId === 'string' && Array.isArray(e.solvedExerciseIds))
  )
}

function validPuzzleStats(value: unknown): boolean {
  return isRecord(value) && typeof value.rating === 'number' && (!('history' in value) || Array.isArray(value.history))
}

function validRatingEstimate(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) && typeof value.elo === 'number' && typeof value.low === 'number' && typeof value.high === 'number')
  )
}

/** The shared data the whole app relies on is checked closely; private feature keys are accepted as they are. */
const CHECKS: { key: string; what: string; valid: (value: unknown) => boolean }[] = [
  { key: 'cc.profile', what: 'profile', valid: validProfile },
  { key: 'cc.games', what: 'saved games', valid: validGames },
  { key: 'cc.openingProgress', what: 'opening progress', valid: validOpeningProgress },
  { key: 'cc.tacticsProgress', what: 'tactics progress', valid: validTacticsProgress },
  { key: 'cc.puzzleStats', what: 'puzzle statistics', valid: validPuzzleStats },
  { key: 'cc.ratingEstimate', what: 'rating estimate', valid: validRatingEstimate },
]

export function summariseData(data: Record<string, unknown>): DataSummary {
  const games = data['cc.games']
  const opening = data['cc.openingProgress']
  const tactics = data['cc.tacticsProgress']
  const puzzles = data['cc.puzzleStats']
  return {
    hasProfile: isRecord(data['cc.profile']),
    games: Array.isArray(games) ? games.length : 0,
    openingChapters: isRecord(opening) ? Object.keys(opening).length : 0,
    tacticLessons: isRecord(tactics) ? Object.keys(tactics).length : 0,
    puzzlesTried:
      isRecord(puzzles) && typeof puzzles.solved === 'number' && typeof puzzles.failed === 'number'
        ? puzzles.solved + puzzles.failed
        : 0,
    keys: Object.keys(data).length,
  }
}

/** Reads the text of a backup file and checks it carefully. Nothing is changed here. */
export function parseBackup(fileText: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(fileText)
  } catch {
    return { ok: false, error: 'This file is not a Chess Coach backup. It could not be read as a backup at all.' }
  }
  if (!isRecord(parsed) || parsed.app !== APP_ID || !isRecord(parsed.data)) {
    return { ok: false, error: 'This file is not a Chess Coach backup. Please choose a file you saved with Download backup.' }
  }
  if (typeof parsed.version === 'number' && parsed.version > VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of Chess Coach, so it cannot be restored here yet.' }
  }

  const data: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(parsed.data)) {
    if (KEY_PATTERN.test(key)) data[key] = value
  }
  const text: Record<string, string> = {}
  if (isRecord(parsed.text)) {
    for (const [key, value] of Object.entries(parsed.text)) {
      if (KEY_PATTERN.test(key) && typeof value === 'string') text[key] = value
    }
  }
  if (Object.keys(data).length + Object.keys(text).length === 0) {
    return { ok: false, error: 'This backup is empty, so there is nothing to restore.' }
  }
  for (const { key, what, valid } of CHECKS) {
    if (key in data && !valid(data[key])) {
      return { ok: false, error: `The ${what} in this file look damaged, so I did not touch your data.` }
    }
  }

  const backup: Backup = {
    app: APP_ID,
    version: VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
    data,
  }
  if (Object.keys(text).length > 0) backup.text = text
  return { ok: true, backup, summary: summariseData(data) }
}

/* ------------------------------------------------------- restore and reset */

/** Removes everything this app saved in the browser. */
export function clearAllData(): void {
  for (const key of Object.keys(readRaw())) localStorage.removeItem(key)
}

function writeRaw(raw: Raw): void {
  for (const [key, value] of Object.entries(raw)) localStorage.setItem(key, value)
}

/**
 * Replaces everything saved in this browser with the backup. If the browser refuses to store it
 * (for example it is full), the previous data is put back and an error is thrown.
 */
export function restoreBackup(backup: Backup): void {
  const incoming: Raw = {}
  for (const [key, value] of Object.entries(backup.data)) incoming[key] = JSON.stringify(value)
  for (const [key, value] of Object.entries(backup.text ?? {})) incoming[key] = value

  const previous = readRaw()
  try {
    clearAllData()
    writeRaw(incoming)
  } catch (error) {
    clearAllData()
    writeRaw(previous)
    throw error
  }
}
