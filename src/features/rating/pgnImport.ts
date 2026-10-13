import type { GameRecord, Result, Side } from '../../types'
import { identifyOpening } from '../../lib/openingName'
import { replayPgn, sansOf } from '../review/pgnGame'

// Turns pasted PGN text (one game or many) into game records.

/** Splits a text with several games into one text per game. A new game starts at a tag line after movetext. */
export function splitPgnGames(text: string): string[] {
  const games: string[][] = []
  let current: string[] = []
  let seenMoves = false
  for (const line of text.replace(/\r/g, '').split('\n')) {
    const isTag = /^\s*\[\w+\s+".*"\]\s*$/.test(line)
    if (isTag && seenMoves) {
      games.push(current)
      current = []
      seenMoves = false
    }
    current.push(line)
    if (!isTag && line.trim()) seenMoves = true
  }
  games.push(current)
  return games.map((g) => g.join('\n').trim()).filter(Boolean)
}

export interface ParsedGame {
  id: string
  pgn: string
  white: string
  black: string
  whiteElo?: number
  blackElo?: number
  result: Result
  date: string
  openingName?: string
  plies: number
  /** Which side the user probably played (matched by name), or null when we cannot tell. */
  guessedSide: Side | null
}

/** Short stable id for games that have no id of their own (same game pasted twice = same id). */
function hashId(text: string): string {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `pgn-${(h >>> 0).toString(36)}`
}

function isoDate(headers: Record<string, string>): string {
  const raw = headers.UTCDate ?? headers.Date ?? ''
  const m = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(raw)
  if (!m) return new Date().toISOString()
  const time = /^\d{2}:\d{2}:\d{2}$/.test(headers.UTCTime ?? '') ? headers.UTCTime : '12:00:00'
  return `${m[1]}-${m[2]}-${m[3]}T${time}.000Z`
}

function elo(value: string | undefined): number | undefined {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/**
 * Parses pasted text. `myNames` are the user's names (profile name, Lichess username) used to guess
 * which side they played. Games that cannot be read are reported in `errors`, the rest still work.
 */
export function parsePgnText(text: string, myNames: string[]): { games: ParsedGame[]; errors: string[] } {
  const names = myNames.map((n) => n.trim().toLowerCase()).filter(Boolean)
  const games: ParsedGame[] = []
  const errors: string[] = []
  const chunks = splitPgnGames(text)
  chunks.forEach((chunk, index) => {
    const label = chunks.length > 1 ? `Game ${index + 1}: ` : ''
    try {
      const replayed = replayPgn(chunk)
      if (!replayed.plies.length) throw new Error('There are no moves in this game.')
      const h = replayed.headers
      const white = h.White && h.White !== '?' ? h.White : 'White'
      const black = h.Black && h.Black !== '?' ? h.Black : 'Black'
      const whiteIsMe = names.includes(white.toLowerCase())
      const blackIsMe = names.includes(black.toLowerCase())
      const lichessId = /lichess\.org\/([A-Za-z0-9]{8})/.exec(h.Site ?? '')?.[1]
      games.push({
        id: lichessId ?? hashId(`${white}|${black}|${h.Date ?? ''}|${sansOf(replayed).join(' ')}`),
        pgn: chunk,
        white,
        black,
        whiteElo: elo(h.WhiteElo),
        blackElo: elo(h.BlackElo),
        result: replayed.result,
        date: isoDate(h),
        openingName: h.Opening && h.Opening !== '?' ? h.Opening : identifyOpening(sansOf(replayed))?.name,
        plies: replayed.plies.length,
        guessedSide: whiteIsMe && !blackIsMe ? 'white' : blackIsMe && !whiteIsMe ? 'black' : null,
      })
    } catch (e) {
      errors.push(label + (e instanceof Error ? e.message : 'This game could not be read.'))
    }
  })
  return { games, errors }
}

export function toRecord(p: ParsedGame, userSide: Side): GameRecord {
  return {
    id: p.id,
    date: p.date,
    source: 'pgn',
    pgn: p.pgn,
    white: p.white,
    black: p.black,
    whiteElo: p.whiteElo,
    blackElo: p.blackElo,
    userSide,
    result: p.result,
    openingName: p.openingName,
  }
}
