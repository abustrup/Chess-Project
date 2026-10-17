// Tiny UCI wrapper around a native Stockfish binary, for the few claims that need search
// ("mate in N", "wins material" a few moves later). Set STOCKFISH=/path/to/stockfish to override.
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync } from 'node:fs'

export interface EngineResult {
  /** centipawns from the side to move's point of view (null when a mate score was given) */
  cp: number | null
  /** moves to mate from the side to move's point of view (negative: getting mated), null when no mate */
  mate: number | null
  pv: string[]
  depth: number
}

const CANDIDATES = [process.env.STOCKFISH, '/opt/homebrew/bin/stockfish', '/usr/local/bin/stockfish', '/usr/bin/stockfish', '/usr/games/stockfish']

export function findStockfish(): string | null {
  for (const c of CANDIDATES) if (c && existsSync(c)) return c
  return null
}

export class UciEngine {
  private proc: ChildProcessWithoutNullStreams
  private buf = ''
  private listeners: ((line: string) => void)[] = []
  private queue: Promise<unknown> = Promise.resolve()
  readonly path: string
  /** the engine's own name from its `id name` line, e.g. "Stockfish 19" */
  name: string | null = null

  private constructor(path: string, threads: number, hashMb: number) {
    this.path = path
    this.proc = spawn(path, [], { stdio: ['pipe', 'pipe', 'pipe'] })
    this.proc.stdout.setEncoding('utf8')
    this.proc.stdout.on('data', (chunk: string) => {
      this.buf += chunk
      let i: number
      while ((i = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, i).trim()
        this.buf = this.buf.slice(i + 1)
        for (const l of this.listeners.slice()) l(line)
      }
    })
    this.send('uci')
    this.send(`setoption name Threads value ${threads}`)
    this.send(`setoption name Hash value ${hashMb}`)
  }

  static async create(opts: { threads?: number; hashMb?: number } = {}): Promise<UciEngine | null> {
    const path = findStockfish()
    if (!path) return null
    const e = new UciEngine(path, opts.threads ?? 2, opts.hashMb ?? 64)
    await e.waitFor(
      (l) => l === 'uciok',
      (l) => {
        if (l.startsWith('id name ')) e.name = l.slice(8).trim()
      },
    )
    e.send('isready')
    await e.waitFor((l) => l === 'readyok', () => undefined)
    return e
  }

  private send(cmd: string) {
    this.proc.stdin.write(cmd + '\n')
  }

  private waitFor(done: (l: string) => boolean, onLine: (l: string) => void): Promise<void> {
    return new Promise((resolve) => {
      const fn = (l: string) => {
        onLine(l)
        if (done(l)) {
          this.listeners = this.listeners.filter((x) => x !== fn)
          resolve()
        }
      }
      this.listeners.push(fn)
    })
  }

  /** Search one position to a fixed depth (one search at a time; calls are queued). `searchmoves` limits the root moves. */
  analyse(fen: string, depth: number, searchmoves?: string[]): Promise<EngineResult> {
    const run = async (): Promise<EngineResult> => {
      const res: EngineResult = { cp: null, mate: null, pv: [], depth: 0 }
      this.send('ucinewgame')
      this.send(`position fen ${fen}`)
      const p = this.waitFor(
        (l) => l.startsWith('bestmove'),
        (l) => {
          if (!l.startsWith('info ') || !l.includes(' pv ') || / (lower|upper)bound/.test(l)) return
          if (/ multipv (\d+)/.exec(l)?.[1] && / multipv (\d+)/.exec(l)![1] !== '1') return
          const d = / depth (\d+)/.exec(l)
          const cp = / score cp (-?\d+)/.exec(l)
          const mate = / score mate (-?\d+)/.exec(l)
          res.depth = d ? Number(d[1]) : res.depth
          res.cp = cp ? Number(cp[1]) : null
          res.mate = mate ? Number(mate[1]) : null
          res.pv = l.split(' pv ')[1].trim().split(/\s+/)
        },
      )
      this.send(`go depth ${depth}${searchmoves && searchmoves.length ? ' searchmoves ' + searchmoves.join(' ') : ''}`)
      await p
      return res
    }
    const next = this.queue.then(run, run)
    this.queue = next.catch(() => undefined)
    return next
  }

  close() {
    try {
      this.send('quit')
    } catch {
      /* already gone */
    }
    setTimeout(() => this.proc.kill(), 200).unref()
  }
}
