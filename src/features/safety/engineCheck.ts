import { Chess } from 'chess.js'
import type { SafetyEval } from '../../types'
import { getSharedEngine } from '../../engine/uci'
import { whiteEval } from './accept'

// The browser engine (Stockfish 19 lite, one thread, already in the app) for the few moves the stored data cannot
// decide: quiet positions where many moves are fine. Lichess judges such a move once its engine has a best move,
// 1,000,000 nodes or 3 s (lichessRules.retroEvalReady); the same limits stop the search here, so a verdict takes at
// most about 3 s plus the engine's start-up. It also finds his best answer to a move that was wrong at once.

/** Lichess's readiness rule as search limits: whichever comes first. */
export const READY_LIMITS = { nodes: 1_000_000, movetime: 3000 } as const
const GIVE_UP_MS = 15_000

/** Starts loading the engine in the background, so the first check does not wait for it. */
export function warmEngine(): void {
  void getSharedEngine().catch(() => undefined)
}

function withTimeout<T>(p: Promise<T>, ms: number, onTimeout: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout()
      reject(new Error('The engine took too long.'))
    }, ms)
    p.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e: unknown) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

function noMoves(fen: string): 'checkmate' | 'stalemate' | undefined {
  try {
    const g = new Chess(fen)
    if (g.isCheckmate()) return 'checkmate'
    if (g.moves().length === 0) return 'stalemate'
  } catch {
    /* an unreadable position is left to the engine */
  }
  return undefined
}

/** The evaluation (White's point of view) of the position after his move, plus the engine's line from there. */
export async function evalAfterMove(fenAfter: string): Promise<{ eval: SafetyEval; pv: string[] }> {
  const over = noMoves(fenAfter)
  if (over) return { eval: whiteEval(fenAfter, null, over), pv: [] }
  const engine = await getSharedEngine()
  const res = await withTimeout(engine.go({ fen: fenAfter, ...READY_LIMITS }), GIVE_UP_MS, () => engine.stop())
  const line = res.lines[0] ?? null
  return { eval: whiteEval(fenAfter, line), pv: line?.pv ?? (res.bestMove ? [res.bestMove] : []) }
}

/** His best answer to a move (a quick search, for showing on the board). */
export async function bestReply(fenAfter: string): Promise<string[]> {
  if (noMoves(fenAfter)) return []
  const engine = await getSharedEngine()
  const res = await withTimeout(engine.go({ fen: fenAfter, depth: 14, movetime: 1500 }), GIVE_UP_MS, () => engine.stop())
  return res.lines[0]?.pv ?? (res.bestMove ? [res.bestMove] : [])
}
