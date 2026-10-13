// Stockfish for Node scripts (content checking, data building). Same result shape as the browser engine.
//   const eng = await NodeEngine.create()
//   const r = await eng.go({ fen, depth: 14, multipv: 3 })
//   eng.close()
import { createRequire } from 'node:module'
import type { EngineLine, SearchResult } from '../../src/engine/uci'

const require = createRequire(import.meta.url)

export interface NodeGoOptions {
  fen: string
  depth?: number
  movetime?: number
  nodes?: number
  multipv?: number
}

export class NodeEngine {
  private sf: { processCommand(c: string): void; terminate(): void }
  private waiters: ((line: string) => void)[] = []
  private current: { lines: Map<number, EngineLine>; depth: number; resolve: (r: SearchResult) => void } | null = null
  private mpv = 1
  private chain: Promise<unknown> = Promise.resolve()
  // the engine's work doesn't keep Node alive by itself, so hold the event loop open until close()
  private keepAlive = setInterval(() => undefined, 1000)

  private constructor() {
    const factory = require('stockfish')
    this.sf = factory('lite-single', (line: string) => this.onLine(String(line)))
  }

  static async create(): Promise<NodeEngine> {
    const e = new NodeEngine()
    // register the waiter BEFORE sending: the engine may answer synchronously
    const uciok = e.wait((l) => l === 'uciok')
    e.sf.processCommand('uci')
    await uciok
    const readyok = e.wait((l) => l === 'readyok')
    e.sf.processCommand('isready')
    await readyok
    return e
  }

  private wait(test: (l: string) => boolean): Promise<void> {
    return new Promise((resolve) => {
      const w = (l: string) => {
        if (test(l)) {
          this.waiters = this.waiters.filter((x) => x !== w)
          resolve()
        }
      }
      this.waiters.push(w)
    })
  }

  private onLine(line: string) {
    this.waiters.slice().forEach((w) => w(line))
    const c = this.current
    if (!c) return
    if (line.startsWith('info ') && line.includes(' pv ') && line.includes(' score ') && !/lowerbound|upperbound/.test(line)) {
      const n = (k: string) => {
        const m = new RegExp(`\\b${k} (-?\\d+)`).exec(line)
        return m ? Number(m[1]) : undefined
      }
      const cp = /score cp (-?\d+)/.exec(line)
      const mate = /score mate (-?\d+)/.exec(line)
      const multipv = n('multipv') ?? 1
      const depth = n('depth') ?? 0
      c.lines.set(multipv, {
        multipv,
        depth,
        cp: cp ? Number(cp[1]) : undefined,
        mate: mate ? Number(mate[1]) : undefined,
        pv: line.slice(line.indexOf(' pv ') + 4).trim().split(/\s+/),
      })
      c.depth = Math.max(c.depth, depth)
    } else if (line.startsWith('bestmove')) {
      const m = /^bestmove (\S+)/.exec(line)
      this.current = null
      c.resolve({
        bestMove: m && m[1] !== '(none)' ? m[1] : null,
        lines: [...c.lines.values()].sort((a, b) => a.multipv - b.multipv),
        depth: c.depth,
      })
    }
  }

  go(o: NodeGoOptions): Promise<SearchResult> {
    const run = () =>
      new Promise<SearchResult>((resolve) => {
        const mpv = o.multipv ?? 1
        if (mpv !== this.mpv) {
          this.sf.processCommand(`setoption name MultiPV value ${mpv}`)
          this.mpv = mpv
        }
        this.current = { lines: new Map(), depth: 0, resolve }
        this.sf.processCommand(`position fen ${o.fen}`)
        const parts = ['go']
        if (o.depth) parts.push('depth', String(o.depth))
        if (o.movetime) parts.push('movetime', String(o.movetime))
        if (o.nodes) parts.push('nodes', String(o.nodes))
        if (parts.length === 1) parts.push('depth', '12')
        this.sf.processCommand(parts.join(' '))
      })
    const p = this.chain.then(run, run)
    this.chain = p.catch(() => undefined)
    return p
  }

  close() {
    clearInterval(this.keepAlive)
    this.sf.terminate()
  }
}
