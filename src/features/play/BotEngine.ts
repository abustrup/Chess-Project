// The one Stockfish worker used by a game: it plays the computer's moves AND answers the coach / hint /
// evaluation questions. Jobs run one after another, and nothing here can leave the game stuck:
// a search that takes too long is stopped, and the computer then plays a simple fallback move.

import { UciEngine, type SearchResult } from '../../engine/uci'
import type { BotLevel } from './botLevels'
import { chooseBotMove, fallbackMove, type BotChoice } from './botMove'

/** How deep hints, the coach and the evaluation bar look. Deep enough to be right, quick enough to feel instant. */
export const ANALYSIS_DEPTH = 12

const START_TIMEOUT_MS = 20_000
const MAX_START_TRIES = 3

interface Job {
  kind: 'move' | 'analysis'
  cancelled: boolean
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

export class BotEngine {
  private engine: UciEngine | null = null
  private starting: Promise<UciEngine | null> | null = null
  private startTries = 0
  private disposed = false
  private chain: Promise<unknown> = Promise.resolve()
  private running: Job | null = null
  private moveJobs = new Set<Job>()
  private cache = new Map<string, SearchResult>()

  /** Starts the engine. Resolves to false if it could not be started (the computer then plays simple moves). */
  async ready(): Promise<boolean> {
    // wait one tick: React StrictMode starts and immediately stops effects, and we must not load a worker for that
    await Promise.resolve()
    if (this.disposed) return false
    return (await this.ensure()) !== null
  }

  private ensure(): Promise<UciEngine | null> {
    if (this.engine) return Promise.resolve(this.engine)
    if (this.disposed || this.startTries >= MAX_START_TRIES) return Promise.resolve(null)
    if (!this.starting) {
      this.startTries++
      const creating = UciEngine.create()
      this.starting = withTimeout(creating, START_TIMEOUT_MS).then(
        (engine) => {
          this.starting = null
          if (this.disposed) {
            engine.terminate()
            return null
          }
          this.engine = engine
          return engine
        },
        () => {
          this.starting = null
          // if it turns up late, switch it off so no worker is left running
          creating.then((late) => late.terminate(), () => undefined)
          return null
        },
      )
    }
    return this.starting
  }

  /** Throw the current engine away (it stopped answering); the next job starts a fresh one. */
  private restart() {
    this.engine?.terminate()
    this.engine = null
  }

  private enqueue<T>(job: Job, work: (engine: UciEngine) => Promise<T>, timeoutMs: number): Promise<T | null> {
    const result = this.chain.then(async (): Promise<T | null> => {
      if (job.cancelled || this.disposed) return null
      const engine = await this.ensure()
      if (!engine || job.cancelled || this.disposed) return null
      this.running = job
      try {
        return await withTimeout(work(engine), timeoutMs)
      } catch {
        if (!this.disposed) this.restart()
        return null
      } finally {
        this.running = null
      }
    })
    this.chain = result.catch(() => undefined)
    return result
  }

  /** The computer's move for this position. Always returns a legal move unless the game is over. */
  async choose(fen: string, level: BotLevel): Promise<BotChoice | null> {
    const job: Job = { kind: 'move', cancelled: false }
    this.moveJobs.add(job)
    try {
      const choice = await this.enqueue(job, (engine) => chooseBotMove(fen, level, (req) => engine.go(req)), 6000 + level.search.movetime * 3)
      if (choice) return choice
      const uci = fallbackMove(fen)
      return uci ? { uci, cp: 0, bestCp: 0, secondCp: null, legalMoves: 0, oversight: false } : null
    } finally {
      this.moveJobs.delete(job)
    }
  }

  /** Stop thinking about the computer's move (used when the player takes a move back or leaves). */
  cancelMoves() {
    for (const job of this.moveJobs) job.cancelled = true
    if (this.running?.kind === 'move') this.engine?.stop()
  }

  /** Strong analysis of a position (cached). Scores are for the side to move. Null if the engine is unavailable. */
  async analyse(fen: string, depth: number = ANALYSIS_DEPTH): Promise<SearchResult | null> {
    const key = `${fen}|${depth}`
    const hit = this.cache.get(key)
    if (hit) return hit
    const job: Job = { kind: 'analysis', cancelled: false }
    const result = await this.enqueue(job, (engine) => engine.go({ fen, depth, movetime: 5000 }), 12_000)
    if (result && result.lines.length > 0) {
      if (this.cache.size > 300) this.cache.clear()
      this.cache.set(key, result)
    }
    return result
  }

  dispose() {
    this.disposed = true
    for (const job of this.moveJobs) job.cancelled = true
    this.engine?.terminate()
    this.engine = null
  }
}
