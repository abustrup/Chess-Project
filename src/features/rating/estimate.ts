import type { RatingEstimate } from '../../types'
import { MAX_ELO, MIN_ELO, SLOW_GAME_FACTOR, eloFromAcpl, eloPerAcpl } from './calibration'

// The rating estimate. Pure maths, no browser code, so it can be checked in Node (estimate.check.ts).
//
// Three independent pieces of evidence are blended, each with an honest error bar:
//   A. Results vs opponents   - "you scored 55% against players rated 1150 on average"
//   B. Quality of your moves  - "your moves lose X centipawns on average, and players of rating Y do that"
//   C. Your own guess         - a weak starting point that counts like three games
// Pieces are combined by "inverse variance" weighting: the piece with the smaller error bar gets more say.
// That means the weights grow by themselves when there are more games and when the evidence is consistent.

/** What we know about one game, from the user's point of view. */
export interface GameEvidence {
  id: string
  date: string
  /** 1 = win, 0.5 = draw, 0 = loss; undefined for an unfinished game */
  score?: number
  /** Opponent's rating when known (human rating, or the computer's approximate strength) */
  oppElo?: number
  oppIsBot: boolean
  /** The user's own rating shown in that game (information only, never used in the maths) */
  userElo?: number
  /** User's average centipawn loss (every move capped, see MAX_MOVE_LOSS) when the game was analysed */
  acpl?: number
  /** True when there was plenty of time to think (rapid, classical, no clock): the same player then loses less per move */
  slow?: boolean
  /** How many of the user's moves count for move quality (book and the first opening moves are left out) */
  userMoves: number
  /** How many moves the user made in the whole game, when known. Very short games are left out. */
  gameMoves?: number
}

export interface EstimatePart {
  key: 'results' | 'moves' | 'prior'
  label: string
  elo: number
  /** Standard error in Elo points: how far off this piece alone could easily be */
  se: number
  /** Share of the final number, 0..1 (all parts add up to 1) */
  weight: number
  /** How many games this piece is based on (the prior counts as PRIOR_GAMES) */
  games: number
}

export interface GamePoint {
  id: string
  date: string
  score?: number
  oppElo?: number
  userElo?: number
  /** What the move quality of this single game alone would suggest */
  moveElo?: number
}

export interface EstimateDetail extends RatingEstimate {
  selfRating: number
  /** Standard error of the final number */
  se: number
  /** Details for the "how I worked this out" section */
  parts: (RatingEstimate['parts'][number] & EstimatePart)[]
  results?: { games: number; scorePct: number; avgOpp: number; shift: number; botGames: number }
  moves?: { games: number; acpl: number; slowGames: number }
  /** The rating the user had on average in these games (e.g. their Lichess rating), if shown in the games */
  avgListedRating?: number
  perGame: GamePoint[]
}

/* ---- tunable constants (all in one place so they are easy to explain and adjust) ---------------- */

/** Range shown to the user: about 4 out of 5 times the truth lies inside. */
const Z_80 = 1.28
/** The range is never narrower than +-60 Elo: no honest estimate from a few games can be tighter. */
export const MIN_HALF_RANGE = 60
/** The user's own guess counts like this many games ... */
export const PRIOR_GAMES = 5
/** ... where one game on its own is only worth an Elo estimate with this spread. */
const SD_PER_GAME = 300
/** Games against the built-in computer count less: its rating is only approximate. */
export const BOT_GAME_WEIGHT = 0.4
/** Different rating pools (Lichess, chess.com, FIDE ...) differ by this much, even with perfect data. */
const POOL_SD = 40
/** The move-quality curve itself is uncertain by this much (time controls, engine depth, playing style). */
const CALIBRATION_SD = 110
/** Games with fewer than this many own moves (after the opening) tell us almost nothing about move quality. */
export const MIN_MOVES_FOR_QUALITY = 8
/** Each side's first moves are usually memorised opening theory, so they are left out of move quality. */
export const OPENING_MOVES_SKIPPED = 8
/** A game where you made fewer moves than this (a quick draw, an early resignation) is left out completely. */
export const MIN_GAME_MOVES = 20
/** With fewer games than this we show a wide range and ask for more games instead of one confident number. */
export const FEW_GAMES = 5
/** With few games the range is never narrower than +-this many Elo. */
const FEW_GAMES_HALF_RANGE = 175

/** True for a game too short to say anything (only when its length is known). */
export const isTooShort = (g: GameEvidence) => g.gameMoves !== undefined && g.gameMoves < MIN_GAME_MOVES
const countsForResults = (g: GameEvidence) => g.score !== undefined && g.oppElo !== undefined && !isTooShort(g)
const countsForMoves = (g: GameEvidence) => g.acpl !== undefined && g.userMoves >= MIN_MOVES_FOR_QUALITY && !isTooShort(g)
/** Full weight for a game from this many own moves on; shorter games count proportionally less. */
const FULL_WEIGHT_MOVES = 30
/** One awful game must not drag the estimate down: a game's ACPL counts at most this many times the median. */
const WINSOR_FACTOR = 1.8
/** Max shift (in Elo) a score can add to the opponents' average: like the FIDE table, 100% or 0% are not infinite. */
const MAX_SHIFT = 700

/** Pretend we already saw this many neighbouring "average" games so the spread of few games is not trusted blindly. */
const SPREAD_PRIOR_GAMES = 4
/** Typical game-to-game spread of the ACPL, as a share of its average (measured: see calibration.ts). */
const ACPL_SPREAD_SHARE = 0.43

const clampElo = (v: number) => Math.max(MIN_ELO, Math.min(MAX_ELO, v))

/* ---- A: results vs opponents ------------------------------------------------------------------- */

/** Elo difference that matches a score share (0..1): 400 * log10(p / (1 - p)), kept finite. */
export function shiftFromScore(p: number): number {
  const q = Math.min(0.999, Math.max(0.001, p))
  return Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, 400 * Math.log10(q / (1 - q))))
}

/** The Elo formula: how many points a player rated `rating` is expected to score against `opponent` (0..1). */
export function expectedScore(rating: number, opponent: number): number {
  return 1 / (1 + 10 ** ((opponent - rating) / 400))
}

/** 400 / ln(10): turns "number of games" statistics into Elo points. */
const ELO_PER_LOGIT = 173.7

/**
 * "Performance rating": the rating at which the expected total score equals the real one.
 * Against opponents who all have the same rating this is exactly "their rating + a shift from the score %".
 * One imaginary draw is added, so winning 10 of 10 means "very strong" and not "infinitely strong".
 */
export function resultsPart(games: GameEvidence[], selfRating: number) {
  const usable = games.filter(countsForResults)
  if (!usable.length) return null

  const entries = usable.map((g) => ({ w: g.oppIsBot ? BOT_GAME_WEIGHT : 1, score: g.score!, opp: g.oppElo! }))
  const nEff = entries.reduce((s, e) => s + e.w, 0)
  const avgOpp = entries.reduce((s, e) => s + e.w * e.opp, 0) / nEff
  entries.push({ w: 1, score: 0.5, opp: avgOpp })

  // the expected score rises with the rating, so a simple bisection finds where it matches the real score
  const surplus = (rating: number) => entries.reduce((s, e) => s + e.w * (e.score - expectedScore(rating, e.opp)), 0)
  let lo = avgOpp - MAX_SHIFT
  let hi = avgOpp + MAX_SHIFT
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (surplus(mid) > 0) lo = mid
    else hi = mid
  }
  const performance = clampElo((lo + hi) / 2)

  // How sure can we be? A game against someone far stronger or weaker than you says little (the result is
  // nearly certain either way), so we measure the information at a rating between this result and your own guess.
  const where = (performance + selfRating) / 2
  const information = entries.reduce((s, e) => {
    const p = expectedScore(where, e.opp)
    return s + e.w * p * (1 - p)
  }, 0)
  const seElo = ELO_PER_LOGIT / Math.sqrt(Math.max(information, 1e-9))

  const points = entries.slice(0, -1).reduce((s, e) => s + e.w * e.score, 0)
  return {
    elo: performance,
    se: Math.sqrt(seElo ** 2 + POOL_SD ** 2),
    games: usable.length,
    nEff,
    scorePct: (points / nEff) * 100,
    avgOpp,
    shift: performance - avgOpp,
    botGames: usable.filter((g) => g.oppIsBot).length,
  }
}

/* ---- B: quality of moves ----------------------------------------------------------------------- */

function weightedMedian(values: number[], weights: number[]): number {
  const order = values.map((v, i) => i).sort((a, b) => values[a] - values[b])
  const total = weights.reduce((a, b) => a + b, 0)
  let run = 0
  for (const i of order) {
    run += weights[i]
    if (run >= total / 2) return values[i]
  }
  return values[order[order.length - 1]]
}

/**
 * The typical ACPL of several games, robust against one disaster: games are clamped to between
 * median / 1.8 and median * 1.8 before averaging, and longer games count more.
 */
export function robustAcpl(acpls: number[], weights: number[] = acpls.map(() => 1)) {
  const median = weightedMedian(acpls, weights)
  const lo = median / WINSOR_FACTOR
  const hi = median * WINSOR_FACTOR
  const clamped = acpls.map((a) => Math.min(hi, Math.max(lo, a)))
  const total = weights.reduce((a, b) => a + b, 0)
  const mean = clamped.reduce((s, a, i) => s + a * weights[i], 0) / total
  const variance = clamped.reduce((s, a, i) => s + weights[i] * (a - mean) ** 2, 0) / total
  return { acpl: mean, sd: Math.sqrt(variance), nEff: total }
}

export function movesPart(games: GameEvidence[]) {
  const usable = games.filter(countsForMoves)
  if (!usable.length) return null
  const weights = usable.map((g) => Math.min(1, g.userMoves / FULL_WEIGHT_MOVES))
  // the reference table comes from fast games, so a game with lots of time is first converted to "fast game" terms
  const { acpl, sd, nEff } = robustAcpl(
    usable.map((g) => g.acpl! * (g.slow ? SLOW_GAME_FACTOR : 1)),
    weights,
  )
  // a handful of games shows a spread that can easily be too small by luck, so mix in the typical spread
  const typical = ACPL_SPREAD_SHARE * acpl
  const spread = Math.sqrt(
    (SPREAD_PRIOR_GAMES * typical ** 2 + Math.max(0, nEff - 1) * sd ** 2) /
      (SPREAD_PRIOR_GAMES + Math.max(0, nEff - 1)),
  )
  const seAcpl = spread / Math.sqrt(nEff)
  // A very low ACPL also has a tiny spread, which would make one lucky, quiet game look very precise.
  // So one game is never trusted more than SD_PER_GAME, just like a single result.
  const seElo = Math.max(eloPerAcpl(acpl) * seAcpl, SD_PER_GAME / Math.sqrt(nEff))
  return {
    elo: clampElo(eloFromAcpl(acpl)),
    se: Math.sqrt(seElo ** 2 + CALIBRATION_SD ** 2),
    games: usable.length,
    nEff,
    /** the typical ACPL as it really was, for showing to the user */
    acpl: robustAcpl(
      usable.map((g) => g.acpl!),
      weights,
    ).acpl,
    slowGames: usable.filter((g) => g.slow).length,
  }
}

/* ---- blending ------------------------------------------------------------------------------------ */

export function confidenceWord(gamesUsed: number): string {
  if (gamesUsed < 5) return 'Very rough'
  if (gamesUsed < 10) return 'Rough'
  if (gamesUsed < 20) return 'Getting reliable'
  if (gamesUsed < 40) return 'Fairly reliable'
  return 'Reliable'
}

export function estimateRating(games: GameEvidence[], selfRating: number, now: Date = new Date()): EstimateDetail {
  const a = resultsPart(games, selfRating)
  const b = movesPart(games)
  const prior = {
    elo: clampElo(selfRating),
    se: SD_PER_GAME / Math.sqrt(PRIOR_GAMES),
  }

  const pieces: { key: EstimatePart['key']; label: string; elo: number; se: number; games: number }[] = []
  if (a) pieces.push({ key: 'results', label: 'Results against your opponents', elo: a.elo, se: a.se, games: a.games })
  if (b) pieces.push({ key: 'moves', label: 'Quality of your moves', elo: b.elo, se: b.se, games: b.games })
  pieces.push({ key: 'prior', label: 'Your own guess', elo: prior.elo, se: prior.se, games: PRIOR_GAMES })

  const precision = pieces.map((p) => 1 / p.se ** 2)
  const totalPrecision = precision.reduce((s, v) => s + v, 0)
  const parts = pieces.map((p, i) => ({ ...p, weight: precision[i] / totalPrecision }))
  const elo = Math.round(clampElo(parts.reduce((s, p) => s + p.elo * p.weight, 0)))
  const se = Math.sqrt(1 / totalPrecision)

  const usedIds = new Set<string>()
  for (const g of games) if (countsForResults(g) || countsForMoves(g)) usedIds.add(g.id)
  const gamesUsed = usedIds.size
  // a handful of games can be lucky or unlucky: keep the range honestly wide until there are enough
  const half = Math.max(MIN_HALF_RANGE, Z_80 * se, gamesUsed < FEW_GAMES ? FEW_GAMES_HALF_RANGE : 0)

  const listed = games.filter((g) => g.userElo !== undefined)
  const detail: EstimateDetail = {
    elo,
    low: Math.round(Math.max(MIN_ELO, elo - half)),
    high: Math.round(Math.min(MAX_ELO, elo + half)),
    gamesUsed,
    notes: buildNotes(games, gamesUsed, !!a, !!b, a?.botGames ?? 0, games.filter(isTooShort).length),
    parts: parts.map((p) => ({ ...p, label: p.label, elo: Math.round(p.elo), weight: p.weight })),
    computedAt: now.toISOString(),
    selfRating,
    se,
    results: a
      ? { games: a.games, scorePct: a.scorePct, avgOpp: a.avgOpp, shift: a.shift, botGames: a.botGames }
      : undefined,
    moves: b ? { games: b.games, acpl: b.acpl, slowGames: b.slowGames } : undefined,
    avgListedRating: listed.length ? listed.reduce((s, g) => s + g.userElo!, 0) / listed.length : undefined,
    perGame: [...games]
      .sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0))
      .map((g) => ({
        id: g.id,
        date: g.date,
        score: g.score,
        oppElo: g.oppElo,
        userElo: g.userElo,
        moveElo: countsForMoves(g) ? Math.round(clampElo(eloFromAcpl(g.acpl!))) : undefined,
      })),
  }
  return detail
}

function buildNotes(
  games: GameEvidence[],
  used: number,
  hasA: boolean,
  hasB: boolean,
  botGames: number,
  shortGames = 0,
): string[] {
  const notes: string[] = []
  if (used === 0) notes.push('No games to work with yet, so this is just your own guess.')
  else if (used < FEW_GAMES)
    notes.push(
      `Only ${used} game${used === 1 ? '' : 's'} so far, so this leans mostly on your own guess.`,
    )
  else if (used < 20) notes.push(`${used} games so far. About 20 or more make the estimate meaningful.`)
  if (shortGames)
    notes.push(
      `${shortGames} very short game${shortGames === 1 ? ' was' : 's were'} left out (fewer than ${MIN_GAME_MOVES} moves each): a quick draw or an early resignation says little about your strength.`,
    )
  const longEnough = games.length - shortGames
  if (longEnough > 0 && !hasA)
    notes.push('These games have no opponent ratings, so your results could not be compared with anyone.')
  if (longEnough > 0 && !hasB)
    notes.push('No game has been analysed yet. Analysing the games adds the quality of your moves.')
  if (botGames) notes.push('Games against the computer count less, because its strength is only approximate.')
  return notes
}
