import type { GameRecord } from '../../types'
import type { PerfKey, PerfRating } from './lichessRating'

// His Lichess rating game by game, from the games the app already brought in from Lichess.
// Each Lichess game carries his rating BEFORE the game (WhiteElo / BlackElo) and, when it was rated, the change
// (WhiteRatingDiff / BlackRatingDiff in its PGN). Lined up in time order, the rating before each game is the rating
// after the one before it, and the live rating closes the line. Lichess's rating-history endpoint is not used: it
// answered with an empty list for his account on 2026-10-16.

/** Lichess's starting value; a line never starts with it (it is a placeholder, not a measured rating). */
export const LICHESS_START = 1500

export interface HistoryPoint {
  rating: number
  /** ISO time of the game this is the rating before, or of the live reading */
  date: string
  kind: 'before-game' | 'now'
}

export interface RatingHistory {
  points: HistoryPoint[]
  /** rated games of this time control found among the saved games */
  gamesFound: number
  /** places where a game is missing in between (the rating before a game is not the one after the game before) */
  gaps: number
  /** true when the first saved game started from Lichess's 1500, so the line begins after it */
  startLeftOut: boolean
}

function tag(pgn: string, name: string): string | null {
  const m = new RegExp(`\\[${name} "([^"]*)"\\]`).exec(pgn)
  return m ? m[1] : null
}

/** Lichess's time-control buckets: minutes plus 40 x the extra seconds per move. */
export function perfOfTimeControl(tc: string | null): PerfKey | null {
  const m = /^(\d+)\+(\d+)$/.exec(tc ?? '')
  if (!m) return tc === '-' ? 'correspondence' : null
  const seconds = Number(m[1]) + 40 * Number(m[2])
  if (seconds < 30) return null // ultra-bullet has no place on the page
  if (seconds < 180) return 'bullet'
  if (seconds < 480) return 'blitz'
  if (seconds < 1500) return 'rapid'
  return 'classical'
}

export interface RatedGame {
  date: string
  perf: PerfKey
  before: number
  diff: number
}

/** His rated Lichess games (with the rating before and the change), oldest first. Other games are left out. */
export function ratedLichessGames(games: GameRecord[], username: string): RatedGame[] {
  const me = username.toLowerCase()
  const out: RatedGame[] = []
  for (const g of games) {
    if (g.source !== 'lichess') continue
    const myName = g.userSide === 'white' ? g.white : g.black
    if (!me || myName.toLowerCase() !== me) continue
    const before = g.userSide === 'white' ? g.whiteElo : g.blackElo
    const diffText = tag(g.pgn, g.userSide === 'white' ? 'WhiteRatingDiff' : 'BlackRatingDiff')
    const perf = perfOfTimeControl(tag(g.pgn, 'TimeControl'))
    // a casual game has no rating change in its PGN, so it does not count
    if (before === undefined || diffText === null || !perf) continue
    const diff = Number(diffText.replace('+', ''))
    if (!Number.isFinite(diff)) continue
    out.push({ date: g.date, perf, before, diff })
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** The line for one time control: the rating before each saved rated game, then the rating now. */
export function ratingHistory(
  games: GameRecord[],
  username: string,
  perf: PerfKey,
  live?: { rating: PerfRating; fetchedAt: string },
): RatingHistory {
  const rated = ratedLichessGames(games, username).filter((g) => g.perf === perf)
  let gaps = 0
  for (let i = 1; i < rated.length; i++) if (rated[i - 1].before + rated[i - 1].diff !== rated[i].before) gaps++
  const points: HistoryPoint[] = rated.map((g) => ({ rating: g.before, date: g.date, kind: 'before-game' }))
  const startLeftOut = points.length > 0 && points[0].rating === LICHESS_START
  if (startLeftOut) points.shift()
  if (live && live.rating.games > 0) points.push({ rating: live.rating.rating, date: live.fetchedAt, kind: 'now' })
  return { points, gamesFound: rated.length, gaps, startLeftOut }
}
