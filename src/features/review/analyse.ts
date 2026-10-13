import { Chess } from 'chess.js'
import type { AnalysedMove, GameAnalysis, GameRecord, MoveClass, Side } from '../../types'
import { UciEngine, type SearchResult } from '../../engine/uci'
import { MATE_CP, classifyMove, gameAccuracy, moveAccuracy, scoreToCp, winPercent } from '../../lib/evaluation'
import { identifyOpening } from '../../lib/openingName'
import { replayPgn, sansOf, type ReplayedPly } from './pgnGame'
import { saveAnalysis } from './gameStore'

// The shared analysis engine: walks through a game, asks Stockfish about every position once, and turns
// the answers into "how good was each move". Review, Rating and (later) other pages all use this file.
//
// The maths is the public Lichess one (see src/lib/evaluation.ts): a move's accuracy comes from how much
// WIN CHANCE it gave away, not from raw centipawns, so being "+9 instead of +11" is correctly seen as harmless.

export const DEFAULT_DEPTH = 12
export const DEEP_DEPTH = 16

/**
 * One single move can only count this many centipawns against a player when we compute the average
 * centipawn loss (ACPL). Without a cap a single blown-up position (a mate, a dropped queen) would
 * drown out thirty good moves. This is a choice of this app (not an official rule), and the Elo
 * calibration in features/rating/calibration.ts was measured with exactly this cap.
 */
export const MAX_MOVE_LOSS = 300

/** Evaluations are clipped to +-1000 cp before measuring a loss, so "mate in 3" and "+12" count the same. */
const LOSS_CLIP = 1000

/** The small part of the engine we need. `UciEngine` (browser) and `NodeEngine` (scripts) both fit. */
export interface EngineLike {
  go(opts: { fen: string; depth?: number; multipv?: number }): Promise<SearchResult>
  /** Ends the running search early (browser engine). */
  stop?(): void
  terminate?(): void
}

export interface AnalyseOptions {
  /** Search depth for every position. Default 12 (about a second per 10 positions on a laptop). */
  depth?: number
  /** Called after every position: `done` of `total`. */
  onProgress?: (done: number, total: number) => void
  /** Abort the analysis. The promise rejects with an AbortError (check with `isAbortError`). */
  signal?: AbortSignal
  /** Use this engine instead of creating (and finally terminating) a private one. */
  engine?: EngineLike
}

/* ------------------------------------------------------------------------------------------ */
/* helpers                                                                                     */
/* ------------------------------------------------------------------------------------------ */

function abortError(): Error {
  return new DOMException('The analysis was cancelled.', 'AbortError')
}

export function isAbortError(e: unknown): boolean {
  return e instanceof DOMException ? e.name === 'AbortError' : e instanceof Error && e.name === 'AbortError'
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError()
}

/** Only one analysis runs at a time: the engine is the bottleneck, and two at once would just both be slow. */
let queueTail: Promise<void> = Promise.resolve()

function runExclusive<T>(signal: AbortSignal | undefined, job: () => Promise<T>): Promise<T> {
  const myTurn = queueTail
  let release!: () => void
  queueTail = new Promise<void>((resolve) => (release = resolve))
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      void myTurn.then(release)
      reject(abortError())
      return
    }
    const onAbort = () => reject(abortError()) // leave the waiting line at once
    signal?.addEventListener('abort', onAbort, { once: true })
    void myTurn.then(async () => {
      try {
        if (signal?.aborted) return
        resolve(await job())
      } catch (e) {
        reject(e)
      } finally {
        signal?.removeEventListener('abort', onAbort)
        release()
      }
    })
  })
}

const ENGINE_START_TIMEOUT_MS = 20_000

/** Starts a private browser engine. The Stockfish file is only loaded when someone really analyses a game. */
async function startOwnEngine(): Promise<EngineLike & { terminate(): void }> {
  let timedOut = false
  const created = UciEngine.create()
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => {
      timedOut = true
      reject(new Error('The chess engine did not start. Please reload the page and try again.'))
    }, ENGINE_START_TIMEOUT_MS),
  )
  created.then((late) => timedOut && late.terminate()).catch(() => undefined)
  return Promise.race([created, timer])
}

/* ------------------------------------------------------------------------------------------ */
/* position evaluation (with a cache so the same position is never searched twice)             */
/* ------------------------------------------------------------------------------------------ */

interface PositionEval {
  /** Centipawns from WHITE's point of view. */
  cp: number
  best: string | null
  depth: number
}

const evalCache = new Map<string, PositionEval>()
const MAX_CACHED_POSITIONS = 6000

/** Position key without the move counters, so the same position reached by another move order is shared. */
function cacheKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ')
}

/** Games that are already over need no engine: checkmate is a huge score, every kind of draw is 0. */
function finishedEval(fen: string): PositionEval | null {
  const chess = new Chess(fen)
  const whiteToMove = fen.split(' ')[1] === 'w'
  if (chess.isCheckmate()) return { cp: whiteToMove ? -MATE_CP : MATE_CP, best: null, depth: 0 }
  const halfMoves = Number(fen.split(' ')[4] ?? 0)
  if (chess.isStalemate() || chess.isInsufficientMaterial() || halfMoves >= 100) return { cp: 0, best: null, depth: 0 }
  return null
}

async function evaluatePosition(fen: string, engine: EngineLike, depth: number): Promise<PositionEval> {
  const key = cacheKey(fen)
  const cached = evalCache.get(key)
  if (cached && cached.depth >= depth) return cached
  const over = finishedEval(fen)
  if (over) return over

  const result = await engine.go({ fen, depth, multipv: 1 })
  const line = result.lines[0]
  const whiteToMove = fen.split(' ')[1] === 'w'
  const stmScore = line ? scoreToCp(line) : 0
  const found: PositionEval = {
    cp: whiteToMove ? stmScore : -stmScore,
    best: result.bestMove,
    depth: result.depth || depth,
  }
  if (evalCache.size > MAX_CACHED_POSITIONS) evalCache.clear()
  evalCache.set(key, found)
  return found
}

/* ------------------------------------------------------------------------------------------ */
/* the analysis itself                                                                         */
/* ------------------------------------------------------------------------------------------ */

function clip(cp: number): number {
  return Math.max(-LOSS_CLIP, Math.min(LOSS_CLIP, cp))
}

function sanOfUci(fen: string, uci: string): string | undefined {
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san
  } catch {
    return undefined
  }
}

function analyseMove(ply: ReplayedPly, before: PositionEval, after: PositionEval, isBook: boolean): AnalysedMove {
  const sign = ply.color === 'w' ? 1 : -1 // turns a White's-view score into the mover's view
  const playedBest = before.best === ply.uci

  const winBefore = winPercent(sign * before.cp)
  // playing the engine's own move can never be worse than the position was; small search noise is ignored
  const winAfter = playedBest ? Math.max(winPercent(sign * after.cp), winBefore) : winPercent(sign * after.cp)

  const cpLoss = playedBest ? 0 : Math.max(0, clip(sign * before.cp) - clip(sign * after.cp))
  let classification: MoveClass = playedBest ? 'best' : classifyMove(winBefore, winAfter)
  if (isBook) classification = 'book'

  return {
    ply: ply.ply,
    san: ply.san,
    uci: ply.uci,
    fenBefore: ply.fenBefore,
    fenAfter: ply.fenAfter,
    evalBefore: before.cp,
    evalAfter: after.cp,
    bestUci: before.best ?? undefined,
    bestSan: playedBest ? ply.san : before.best ? sanOfUci(ply.fenBefore, before.best) : undefined,
    cpLoss,
    accuracy: moveAccuracy(winBefore, winAfter),
    classification,
  }
}

/** Average centipawn loss of one side (every move counts at most MAX_MOVE_LOSS). */
export function averageCpLoss(moves: AnalysedMove[]): number {
  if (!moves.length) return 0
  return moves.reduce((sum, m) => sum + Math.min(MAX_MOVE_LOSS, m.cpLoss), 0) / moves.length
}

export function movesOfSide(moves: AnalysedMove[], side: Side): AnalysedMove[] {
  return moves.filter((m) => (m.ply % 2 === 1) === (side === 'white'))
}

async function analyseWithEngine(pgn: string, engine: EngineLike, opts: AnalyseOptions): Promise<GameAnalysis> {
  const depth = opts.depth ?? DEFAULT_DEPTH
  const game = replayPgn(pgn)
  if (!game.plies.length) throw new Error('This game has no moves to look at.')

  const fens = [game.plies[0].fenBefore, ...game.plies.map((p) => p.fenAfter)]
  const evals: PositionEval[] = []
  for (let i = 0; i < fens.length; i++) {
    throwIfAborted(opts.signal)
    evals.push(await evaluatePosition(fens[i], engine, depth))
    opts.onProgress?.(i + 1, fens.length)
  }
  throwIfAborted(opts.signal)

  const bookPlies = identifyOpening(sansOf(game))?.plies ?? 0
  const moves = game.plies.map((p, i) => analyseMove(p, evals[i], evals[i + 1], p.ply <= bookPlies))
  const white = movesOfSide(moves, 'white')
  const black = movesOfSide(moves, 'black')

  return {
    engine: `stockfish-19-lite depth ${depth}`,
    depth,
    moves,
    acpl: { white: averageCpLoss(white), black: averageCpLoss(black) },
    accuracy: {
      white: gameAccuracy(white.map((m) => m.accuracy)),
      black: gameAccuracy(black.map((m) => m.accuracy)),
    },
    analysedAt: new Date().toISOString(),
  }
}

/**
 * Runs `job` with an engine: the one passed in, or a private one that is switched off again afterwards.
 * Aborting stops the search at once.
 */
async function withEngine<T>(opts: AnalyseOptions, job: (engine: EngineLike) => Promise<T>): Promise<T> {
  throwIfAborted(opts.signal)
  const own = opts.engine ? null : await startOwnEngine()
  const engine = opts.engine ?? own!
  const onAbort = () => (own ? own.terminate() : engine.stop?.())
  opts.signal?.addEventListener('abort', onAbort, { once: true })
  try {
    throwIfAborted(opts.signal)
    return await job(engine)
  } catch (e) {
    if (opts.signal?.aborted) throw abortError() // a stopped search shows up as an engine error; report it as "cancelled"
    throw e
  } finally {
    opts.signal?.removeEventListener('abort', onAbort)
    own?.terminate()
  }
}

/**
 * Analyse one game. Waits its turn if another analysis is running.
 * When given a stored GameRecord, the result is also saved into it (KEYS.games).
 */
export function analyseGame(game: { pgn: string } | GameRecord, opts: AnalyseOptions = {}): Promise<GameAnalysis> {
  return runExclusive(opts.signal, () =>
    withEngine(opts, async (engine) => {
      const analysis = await analyseWithEngine(game.pgn, engine, opts)
      if ('id' in game) saveAnalysis(game.id, analysis)
      return analysis
    }),
  )
}

export interface BatchProgress {
  /** 0-based index of the game being analysed */
  gameIndex: number
  gameCount: number
  /** positions done / total in the current game */
  done: number
  total: number
}

export interface BatchResult {
  analysed: number
  failed: { id: string; message: string }[]
}

/**
 * Analyse several stored games one after the other with ONE engine (starting Stockfish takes a moment,
 * so we do it once). Stops quietly when the signal aborts; games finished before that stay saved.
 */
export function analyseGames(
  games: GameRecord[],
  opts: Omit<AnalyseOptions, 'onProgress' | 'engine'> & { onProgress?: (p: BatchProgress) => void },
): Promise<BatchResult> {
  return runExclusive(opts.signal, () =>
    withEngine({ signal: opts.signal }, async (engine) => {
      const result: BatchResult = { analysed: 0, failed: [] }
      for (let i = 0; i < games.length; i++) {
        throwIfAborted(opts.signal)
        const game = games[i]
        try {
          const analysis = await analyseWithEngine(game.pgn, engine, {
            depth: opts.depth,
            signal: opts.signal,
            onProgress: (done, total) => opts.onProgress?.({ gameIndex: i, gameCount: games.length, done, total }),
          })
          saveAnalysis(game.id, analysis)
          result.analysed++
        } catch (e) {
          if (opts.signal?.aborted) throw abortError()
          result.failed.push({ id: game.id, message: e instanceof Error ? e.message : 'Could not analyse this game.' })
        }
      }
      return result
    }),
  )
}
