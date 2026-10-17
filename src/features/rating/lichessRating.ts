// The player's live Lichess ratings, read from Lichess's public user API (no login, no token).
//
// Why this and not an estimate: for Lichess games his Lichess rating IS the rating, worked out by Lichess from every
// rated game he played. The app's old blended estimate missed by about 190 points on unseen players and was removed
// (research/2026-10-16-diagnosis/rating/README.md). Lichess's rules used here, read from its source on 2026-10-16:
//  - a rating is provisional (Lichess shows "?") while its deviation (RD) is 110 or more (scalachess Glicko);
//  - Lichess's own range for a rating is rating - 2 x RD to rating + 2 x RD (lila Glicko intervalMin/intervalMax);
//  - `prog` is the change across the recent ratings it keeps: at most 12, and only from the 11th game on
//    (lila Perf.updateRecentWith: `if nb < 10 then recent`). So it covers the last 11 games once there are 22 or
//    more, and fewer before that (4 games at 15 games); trendText says how many.
// A time control with 0 games carries Lichess's placeholder (1500, RD 500). It is never shown as a rating.

export const PROVISIONAL_RD = 110
const TIMEOUT_MS = 15_000

/** The time controls the page can show, in the order it shows them (rapid first: his study games are 10+0). */
export const PERF_ORDER = ['rapid', 'blitz', 'classical', 'bullet', 'correspondence'] as const
export type PerfKey = (typeof PERF_ORDER)[number]

export const PERF_LABEL: Record<PerfKey, string> = {
  rapid: 'Rapid',
  blitz: 'Blitz',
  classical: 'Classical',
  bullet: 'Bullet',
  correspondence: 'Correspondence',
}

/** What each Lichess time control covers, in plain words (Lichess sorts by minutes + 40 x the extra seconds). */
export const PERF_HINT: Record<PerfKey, string> = {
  rapid: 'games of about 8 to 25 minutes, such as your 10+0 games',
  blitz: 'games of about 3 to 8 minutes, such as 3+2 and 5+3',
  classical: 'games of 25 minutes or more',
  bullet: 'games under 3 minutes',
  correspondence: 'games with days per move',
}

export interface PerfRating {
  rating: number
  rd: number
  games: number
  /** Lichess's own "provisional" flag (it only sends it when true) */
  prov: boolean
  /** rating change over the last 11 games, as Lichess reports it */
  prog: number
}

export interface LichessRatings {
  username: string
  /** ISO time the answer came from Lichess */
  fetchedAt: string
  perfs: Partial<Record<PerfKey, PerfRating>>
}

export type RatingErrorKind = 'invalid-name' | 'not-found' | 'rate-limit' | 'network' | 'server'

export class LichessRatingError extends Error {
  constructor(
    public readonly kind: RatingErrorKind,
    message: string,
  ) {
    super(message)
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Turns Lichess's answer into the few numbers the app uses. Damaged or missing parts are left out, never guessed. */
export function parseLichessUser(json: unknown, username: string, fetchedAt: string): LichessRatings {
  const out: LichessRatings = { username, fetchedAt, perfs: {} }
  if (!json || typeof json !== 'object') return out
  const perfs = (json as { perfs?: unknown }).perfs
  if (!perfs || typeof perfs !== 'object') return out
  for (const key of PERF_ORDER) {
    const p = (perfs as Record<string, unknown>)[key]
    if (!p || typeof p !== 'object') continue
    const { rating, rd, games, prov, prog } = p as Record<string, unknown>
    if (!isNum(rating) || !isNum(rd) || !isNum(games)) continue
    out.perfs[key] = { rating, rd, games, prov: prov === true, prog: isNum(prog) ? prog : 0 }
  }
  return out
}

/** True when the time control has a real rating (at least one rated game), not Lichess's 1500 placeholder. */
export function hasRating(p: PerfRating | undefined): p is PerfRating {
  return !!p && p.games > 0
}

/** Lichess shows "?" while it is not sure yet. */
export function isProvisional(p: PerfRating): boolean {
  return p.prov || p.rd >= PROVISIONAL_RD
}

/** Lichess's own range for the rating: rating plus or minus two deviations. */
export function ratingRange(p: PerfRating): { low: number; high: number } {
  return { low: Math.round(p.rating - 2 * p.rd), high: Math.round(p.rating + 2 * p.rd) }
}

/** "1017", or "1500?" while provisional, as Lichess writes it. */
export function ratingText(p: PerfRating): string {
  return `${Math.round(p.rating)}${isProvisional(p) ? '?' : ''}`
}

/** The rating Home shows: rapid once it has games (his study games), otherwise blitz, otherwise any other. */
export function headlinePerf(r: LichessRatings): PerfKey | null {
  return PERF_ORDER.find((k) => hasRating(r.perfs[k])) ?? null
}

/** Rapid and blitz always (with "no rating yet" when empty); the others only when he has played them. */
export function shownPerfs(r: LichessRatings): PerfKey[] {
  return PERF_ORDER.filter((k) => k === 'rapid' || k === 'blitz' || hasRating(r.perfs[k]))
}

/** How many games Lichess's `prog` spans: its recent ratings start at game 11 and hold at most 12. */
export function trendGames(games: number): number {
  return Math.max(0, Math.min(11, games - 11))
}

/** "-117 over your last 11 games", or null before Lichess has two recent ratings to compare (12 games). */
export function trendText(p: PerfRating): string | null {
  const span = trendGames(p.games)
  if (span < 1 || p.prog === 0) return null
  return `${p.prog > 0 ? '+' : '−'}${Math.abs(p.prog)} over your last ${span === 1 ? 'game' : `${span} games`}`
}

/** Short absolute date and time, e.g. "16 Oct 2026, 17:30" (always written out, never "today"). */
export function asOfText(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

export const LICHESS_NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/

/** Reads the live ratings. One request; throws a LichessRatingError with a message that can be shown as it is. */
export async function fetchLichessRatings(username: string, signal?: AbortSignal): Promise<LichessRatings> {
  if (!LICHESS_NAME.test(username)) {
    throw new LichessRatingError('invalid-name', 'That does not look like a Lichess username. Please check it in Settings.')
  }
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS)
  const onAbort = () => timeout.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    let res: Response
    try {
      res = await fetch(`https://lichess.org/api/user/${encodeURIComponent(username)}`, {
        headers: { Accept: 'application/json' },
        signal: timeout.signal,
      })
    } catch (e) {
      if (signal?.aborted) throw e
      throw new LichessRatingError('network', 'I could not reach Lichess.')
    }
    if (res.status === 404) {
      throw new LichessRatingError('not-found', `Lichess does not know a player called "${username}". Please check the name in Settings.`)
    }
    if (res.status === 429) throw new LichessRatingError('rate-limit', 'Lichess asked the app to slow down for a minute.')
    if (!res.ok) throw new LichessRatingError('server', `Lichess had a problem (code ${res.status}).`)
    let json: unknown
    try {
      json = await res.json()
    } catch (e) {
      if (signal?.aborted) throw e
      throw new LichessRatingError('network', 'The answer from Lichess was cut off.')
    }
    return parseLichessUser(json, username, new Date().toISOString())
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}
