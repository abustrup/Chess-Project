import type { GameRecord, Result, Side } from '../../types'

// Imports a player's latest games from Lichess. The API is free, needs no key and allows browser requests.
// Etiquette: one request at a time, only when the user presses the button, and a one-minute pause after "429".

export const LICHESS_WAIT_SECONDS = 60
const MIN_PLIES = 6
const TIMEOUT_MS = 30_000

export type ImportErrorKind = 'invalid-name' | 'not-found' | 'rate-limit' | 'network' | 'server'

export class LichessImportError extends Error {
  constructor(
    public readonly kind: ImportErrorKind,
    message: string,
  ) {
    super(message)
  }
}

export interface LichessImportResult {
  games: GameRecord[]
  /** how many games were left out, and why */
  skipped: { computer: number; otherVariant: number; tooShort: number }
}

/** "@Name", "lichess.org/@/Name" or " Name " all become "Name". Returns null when it cannot be a Lichess name. */
export function cleanUsername(raw: string): string | null {
  const fromUrl = /lichess\.org\/@\/([A-Za-z0-9_-]+)/.exec(raw)
  const name = (fromUrl ? fromUrl[1] : raw).trim().replace(/^@/, '')
  return /^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/.test(name) ? name : null
}

interface LichessPlayer {
  user?: { name?: string; id?: string }
  rating?: number
  aiLevel?: number
}
interface LichessGame {
  id: string
  variant?: string
  status?: string
  createdAt?: number
  players: { white: LichessPlayer; black: LichessPlayer }
  winner?: Side
  moves?: string
  pgn?: string
  opening?: { name?: string }
}

function resultOf(g: LichessGame): Result {
  if (g.winner === 'white') return '1-0'
  if (g.winner === 'black') return '0-1'
  return g.status === 'started' || g.status === 'created' ? '*' : '1/2-1/2'
}

/** Builds a PGN from the plain move list, for the rare case that Lichess sends no PGN text. */
function pgnFromMoves(g: LichessGame, result: Result): string {
  const sans = (g.moves ?? '').split(' ').filter(Boolean)
  const text = sans.map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${san}` : san)).join(' ')
  const name = (p: LichessPlayer) => p.user?.name ?? 'Anonymous'
  return `[Site "https://lichess.org/${g.id}"]\n[White "${name(g.players.white)}"]\n[Black "${name(g.players.black)}"]\n[Result "${result}"]\n\n${text} ${result}\n`
}

/** Turns the NDJSON text from Lichess (one JSON game per line) into stored game records. */
export function parseLichessNdjson(text: string, username: string): LichessImportResult {
  const me = username.toLowerCase()
  const out: LichessImportResult = { games: [], skipped: { computer: 0, otherVariant: 0, tooShort: 0 } }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    let g: LichessGame
    try {
      g = JSON.parse(line) as LichessGame
    } catch {
      continue // a cut-off last line must not spoil the others
    }
    if (!g.id || !g.players) continue
    if (g.variant && g.variant !== 'standard') {
      out.skipped.otherVariant++
      continue
    }
    if (g.players.white.aiLevel !== undefined || g.players.black.aiLevel !== undefined) {
      out.skipped.computer++
      continue
    }
    const sans = (g.moves ?? '').split(' ').filter(Boolean)
    if (sans.length < MIN_PLIES || g.status === 'aborted' || g.status === 'noStart') {
      out.skipped.tooShort++
      continue
    }
    const isMe = (p: LichessPlayer) => (p.user?.id ?? p.user?.name ?? '').toLowerCase() === me
    const userSide: Side | null = isMe(g.players.white) ? 'white' : isMe(g.players.black) ? 'black' : null
    if (!userSide) continue

    const result = resultOf(g)
    const name = (p: LichessPlayer) => p.user?.name ?? 'Anonymous'
    out.games.push({
      id: g.id,
      date: new Date(g.createdAt ?? Date.now()).toISOString(),
      source: 'lichess',
      pgn: g.pgn ?? pgnFromMoves(g, result),
      white: name(g.players.white),
      black: name(g.players.black),
      whiteElo: g.players.white.rating,
      blackElo: g.players.black.rating,
      userSide,
      result,
      openingName: g.opening?.name,
    })
  }
  return out
}

export interface FetchOptions {
  /** How many of the latest games to ask for (Lichess default order: newest first). */
  max?: number
  /** Leave out bullet games: they are played in a rush, so they say little about how you really play. */
  skipBullet?: boolean
  signal?: AbortSignal
}

/** Downloads the latest games of a Lichess user. Throws a LichessImportError with a friendly message. */
export async function fetchLichessGames(rawName: string, opts: FetchOptions = {}): Promise<LichessImportResult> {
  const username = cleanUsername(rawName)
  if (!username) {
    throw new LichessImportError(
      'invalid-name',
      'That does not look like a Lichess username. Use letters, numbers, "_" or "-" only.',
    )
  }
  const params = new URLSearchParams({ max: String(opts.max ?? 30), moves: 'true', opening: 'true', pgnInJson: 'true' })
  if (opts.skipBullet !== false) params.set('perfType', 'blitz,rapid,classical')
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?${params}`

  const timeout = new AbortController()
  const timer = window.setTimeout(() => timeout.abort(), TIMEOUT_MS)
  const onCallerAbort = () => timeout.abort()
  opts.signal?.addEventListener('abort', onCallerAbort, { once: true })
  try {
    let res: Response
    try {
      res = await fetch(url, { headers: { Accept: 'application/x-ndjson' }, signal: timeout.signal })
    } catch (e) {
      if (opts.signal?.aborted) throw e
      throw new LichessImportError(
        'network',
        'I could not reach Lichess. Check your internet connection and try again.',
      )
    }
    if (res.status === 404) {
      throw new LichessImportError(
        'not-found',
        `Lichess does not know a player called "${username}". Please check the spelling.`,
      )
    }
    if (res.status === 429) {
      throw new LichessImportError(
        'rate-limit',
        `Lichess asks everyone to slow down, so please wait ${LICHESS_WAIT_SECONDS} seconds and try again.`,
      )
    }
    if (!res.ok) {
      throw new LichessImportError(
        'server',
        `Lichess had a problem (code ${res.status}). Please try again in a little while.`,
      )
    }
    let body: string
    try {
      body = await res.text()
    } catch (e) {
      if (opts.signal?.aborted) throw e
      throw new LichessImportError(
        'network',
        'The connection to Lichess broke while the games were coming in. Please try again.',
      )
    }
    return parseLichessNdjson(body, username)
  } finally {
    window.clearTimeout(timer)
    opts.signal?.removeEventListener('abort', onCallerAbort)
  }
}
