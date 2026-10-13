// A small, friendly wrapper around the Stockfish web worker (UCI protocol).
//
//   const engine = await UciEngine.create()
//   const res = await engine.go({ fen, depth: 12, multipv: 3 })
//   res.bestMove  -> 'e2e4'
//   res.lines[0]  -> { multipv: 1, depth: 12, cp: 31, pv: ['e2e4', 'e7e5', ...] }
//
// Scores (cp / mate) are from the point of view of the side TO MOVE in the searched position,
// exactly like the UCI protocol. Use `scoreForWhite` to flip them.

import { Chess } from 'chess.js'
import { scoreToCp } from '../lib/evaluation'

export interface EngineLine {
  multipv: number
  depth: number
  cp?: number
  mate?: number
  pv: string[]
  nodes?: number
}

export interface SearchResult {
  bestMove: string | null // UCI, or null if the position has no legal move
  ponder?: string
  lines: EngineLine[] // sorted by multipv (best first)
  depth: number
}

export interface GoOptions {
  fen: string
  /** Optional UCI moves to play on top of `fen` before searching. */
  moves?: string[]
  depth?: number
  movetime?: number // milliseconds
  nodes?: number
  multipv?: number
  searchMoves?: string[]
  /** Called with the latest lines every time the engine reports progress. */
  onInfo?: (lines: EngineLine[]) => void
}

export const ENGINE_URL = `${import.meta.env?.BASE_URL ?? "/"}engine/stockfish-19-lite-single.js`

interface Pending {
  resolve: (r: SearchResult) => void
  reject: (e: unknown) => void
  lines: Map<number, EngineLine>
  onInfo?: (lines: EngineLine[]) => void
  lastDepth: number
}

export class UciEngine {
  private worker: Worker
  private listeners = new Set<(line: string) => void>()
  private queue: Promise<unknown> = Promise.resolve()
  private currentMultiPv = 1
  private pending: Pending | null = null
  private dead = false

  private constructor(url: string) {
    this.worker = new Worker(url)
    this.worker.onmessage = (e: MessageEvent) => {
      const line = typeof e.data === 'string' ? e.data : String(e.data)
      this.handleLine(line)
    }
    this.worker.onerror = (e) => {
      console.error('Engine error', e)
    }
  }

  static async create(url: string = ENGINE_URL): Promise<UciEngine> {
    const engine = new UciEngine(url)
    engine.send('uci')
    await engine.waitFor((l) => l === 'uciok')
    await engine.isReady()
    return engine
  }

  private send(cmd: string) {
    if (!this.dead) this.worker.postMessage(cmd)
  }

  private waitFor(test: (line: string) => boolean): Promise<string> {
    return new Promise((resolve) => {
      const l = (line: string) => {
        if (test(line)) {
          this.listeners.delete(l)
          resolve(line)
        }
      }
      this.listeners.add(l)
    })
  }

  async isReady(): Promise<void> {
    this.send('isready')
    await this.waitFor((l) => l === 'readyok')
  }

  /** Set a UCI option, e.g. setOption('Skill Level', 5) or setOption('UCI_LimitStrength', true). */
  async setOption(name: string, value: string | number | boolean): Promise<void> {
    this.send(`setoption name ${name} value ${value}`)
    await this.isReady()
  }

  async newGame(): Promise<void> {
    this.send('ucinewgame')
    await this.isReady()
  }

  /** Ask the engine to stop the current search; the pending `go()` resolves with the best move found so far. */
  stop() {
    this.send('stop')
  }

  /** Run a search. Searches are queued: calling go() twice runs them one after the other. */
  go(opts: GoOptions): Promise<SearchResult> {
    const run = () => this.runSearch(opts)
    const p = this.queue.then(run, run)
    this.queue = p.catch(() => undefined)
    return p
  }

  private async runSearch(opts: GoOptions): Promise<SearchResult> {
    // no legal moves -> nothing to search
    const probe = new Chess(opts.fen)
    if (opts.moves?.length) for (const m of opts.moves) probe.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] })
    if (probe.moves().length === 0) return { bestMove: null, lines: [], depth: 0 }

    const mpv = Math.max(1, opts.multipv ?? 1)
    if (mpv !== this.currentMultiPv) {
      this.send(`setoption name MultiPV value ${mpv}`)
      this.currentMultiPv = mpv
    }
    this.send(`position fen ${opts.fen}${opts.moves?.length ? ` moves ${opts.moves.join(' ')}` : ''}`)
    const parts = ['go']
    if (opts.depth) parts.push('depth', String(opts.depth))
    if (opts.movetime) parts.push('movetime', String(opts.movetime))
    if (opts.nodes) parts.push('nodes', String(opts.nodes))
    if (!opts.depth && !opts.movetime && !opts.nodes) parts.push('depth', '12')
    if (opts.searchMoves?.length) parts.push('searchmoves', ...opts.searchMoves)

    return new Promise<SearchResult>((resolve, reject) => {
      this.pending = { resolve, reject, lines: new Map(), onInfo: opts.onInfo, lastDepth: 0 }
      this.send(parts.join(' '))
    })
  }

  private handleLine(line: string) {
    this.listeners.forEach((l) => l(line))
    const p = this.pending
    if (!p) return
    if (line.startsWith('info ') && line.includes(' pv ') && line.includes(' score ')) {
      if (line.includes('lowerbound') || line.includes('upperbound')) return
      const get = (key: string) => {
        const m = new RegExp(`\\b${key} (-?\\d+)`).exec(line)
        return m ? Number(m[1]) : undefined
      }
      const depth = get('depth') ?? 0
      const multipv = get('multipv') ?? 1
      const cp = /score cp (-?\d+)/.exec(line)
      const mate = /score mate (-?\d+)/.exec(line)
      const pv = line.slice(line.indexOf(' pv ') + 4).trim().split(/\s+/)
      const entry: EngineLine = {
        multipv,
        depth,
        cp: cp ? Number(cp[1]) : undefined,
        mate: mate ? Number(mate[1]) : undefined,
        pv,
        nodes: get('nodes'),
      }
      p.lines.set(multipv, entry)
      p.lastDepth = Math.max(p.lastDepth, depth)
      p.onInfo?.([...p.lines.values()].sort((a, b) => a.multipv - b.multipv))
    } else if (line.startsWith('bestmove')) {
      const m = /^bestmove (\S+)(?: ponder (\S+))?/.exec(line)
      const best = m && m[1] !== '(none)' ? m[1] : null
      this.pending = null
      p.resolve({
        bestMove: best,
        ponder: m?.[2],
        lines: [...p.lines.values()].sort((a, b) => a.multipv - b.multipv),
        depth: p.lastDepth,
      })
    }
  }

  terminate() {
    this.dead = true
    this.worker.terminate()
    if (this.pending) this.pending.reject(new Error('Engine terminated'))
    this.pending = null
  }
}

/** Score of a line in centipawns from WHITE's point of view. */
export function scoreForWhite(fen: string, line: EngineLine): number {
  const cp = scoreToCp(line)
  return fen.split(' ')[1] === 'w' ? cp : -cp
}

/* A shared engine for casual use (hints, eval bar). Heavy jobs (full game analysis, the computer
   opponent) should create their own engine with UciEngine.create() so they don't block each other. */
let shared: Promise<UciEngine> | null = null
export function getSharedEngine(): Promise<UciEngine> {
  if (!shared) shared = UciEngine.create()
  return shared
}
