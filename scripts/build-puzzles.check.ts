// How we decide that a puzzle is safe to teach with. Used by build-puzzles.ts and build-puzzles.worker.ts.
//
// Two steps:
//   1. replay()      - pure chess.js: every move is legal, and what happens at the end (mate? material won?).
//   2. engineCheck() - Stockfish: the first move you must find really is (about) the best move.
import { Chess } from 'chess.js'
import type { NodeEngine } from './lib/nodeEngine'
import type { EngineLine } from '../src/engine/uci'
import { scoreToCp, winPercent } from '../src/lib/evaluation'

/** One line of scripts/.cache/puzzles.jsonl. */
export interface CachedPuzzle {
  id: string
  fen: string
  moves: string[]
  rating: number
  themes: string[]
  opening: string | null
  popularity: number
  plays: number
  bucket: string
  kind: 'theme' | 'course'
}

/** What we write down about a puzzle after checking it (one line per puzzle in the check cache). */
export interface Verdict {
  id: string
  ok: boolean
  /** Why it was dropped (plain words), or a short note when kept. */
  reason: string
}

const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** Engine depths. This is deep enough to spot a puzzle whose "solution" is clearly not the best move. */
const FIRST_MOVE_DEPTH = 12
const LATER_MOVE_DEPTH = 10
const FINAL_POSITION_DEPTH = 8
/** Safety net so one odd position cannot stall the whole build. */
const MOVE_TIME_CAP_MS = 4000

/** The solution move may be this much worse than the engine's best (centipawns) and still count as "equally good". */
const SAME_QUALITY_CP = 30
/** The same idea in win chances, which is fairer when the position is already clearly won. */
const SAME_QUALITY_WIN_PERCENT = 3
/** A final position is "good for you" when the engine sees at least this much for the solver. */
const GOOD_END_CP = 120
/** For puzzles whose goal is to survive, the end only has to be about level. */
const SURVIVED_END_CP = -150

export interface Replay {
  ok: boolean
  reason: string
  /** Position the user sees first (after the opponent's first move). */
  startFen: string
  finalFen: string
  /** The user checkmates at the end of the line. */
  mate: boolean
  /** The line ends in stalemate. */
  stalemate: boolean
  /** Material the user gains over the whole line (pawn = 1, queen = 9). */
  gain: number
}

function material(chess: Chess, colour: 'w' | 'b'): number {
  let total = 0
  for (const row of chess.board()) {
    for (const sq of row) if (sq && sq.color === colour) total += PIECE_VALUE[sq.type]
  }
  return total
}

function playUci(chess: Chess, uci: string): boolean {
  try {
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined })
    return true
  } catch {
    return false
  }
}

function fail(reason: string, startFen = '', finalFen = ''): Replay {
  return { ok: false, reason, startFen, finalFen, mate: false, stalemate: false, gain: 0 }
}

/** Play the whole line with chess.js. Fails on any illegal move or an odd-looking line. */
export function replay(p: Pick<CachedPuzzle, 'fen' | 'moves'>): Replay {
  if (p.moves.length < 2 || p.moves.length % 2 !== 0) return fail('line has an odd number of moves')
  let chess: Chess
  try {
    chess = new Chess(p.fen)
  } catch {
    return fail('bad starting position')
  }
  if (!playUci(chess, p.moves[0])) return fail('opponent first move is illegal')
  const startFen = chess.fen()
  const user = chess.turn()
  const other = user === 'w' ? 'b' : 'w'
  const before = material(chess, user) - material(chess, other)
  for (const uci of p.moves.slice(1)) {
    if (chess.isGameOver()) return fail('line continues after the game is over', startFen)
    if (!playUci(chess, uci)) return fail('illegal move in the line', startFen)
  }
  const after = material(chess, user) - material(chess, other)
  return {
    ok: true,
    reason: '',
    startFen,
    finalFen: chess.fen(),
    mate: chess.isCheckmate(),
    stalemate: chess.isStalemate(),
    gain: after - before,
  }
}

/** Engine score for the side to move, as one number (mates become huge numbers, closer mate = bigger). */
function lineScore(line: EngineLine): number {
  return scoreToCp(line)
}

const isMateFor = (line: EngineLine) => line.mate != null && line.mate > 0

/** True when playing `played` is about as good as the engine's best move (see the constants above). */
function equallyGood(best: EngineLine, played: { cp: number; mating: boolean }): boolean {
  if (played.mating) return true // mating is as good as it gets (any mate length is fine for a puzzle)
  if (isMateFor(best)) return false // the engine mates but the solution does not
  const bestCp = lineScore(best)
  return (
    bestCp - played.cp <= SAME_QUALITY_CP ||
    winPercent(bestCp) - winPercent(played.cp) <= SAME_QUALITY_WIN_PERCENT
  )
}

/** Score (for the user) of the position after the user plays `uci` from `fen`. */
async function scoreAfterMove(
  engine: NodeEngine,
  fen: string,
  uci: string,
): Promise<{ cp: number; mating: boolean } | null> {
  const chess = new Chess(fen)
  if (!playUci(chess, uci)) return null
  if (chess.isCheckmate()) return { cp: scoreToCp({ mate: 1 }), mating: true }
  if (chess.isGameOver()) return { cp: 0, mating: false }
  const r = await engine.go({ fen: chess.fen(), depth: FIRST_MOVE_DEPTH - 1, movetime: MOVE_TIME_CAP_MS })
  const line = r.lines[0]
  if (!line) return null
  // the engine speaks for the opponent now, so flip the sign
  return { cp: -lineScore(line), mating: line.mate != null && line.mate < 0 }
}

/** Is `uci` a good move in `fen`? Returns null when yes, or a plain-words reason when not. */
async function badMoveReason(engine: NodeEngine, fen: string, uci: string, depth: number): Promise<string | null> {
  const res = await engine.go({ fen, depth, multipv: 2, movetime: MOVE_TIME_CAP_MS })
  const best = res.lines[0]
  if (!best) return 'engine gave no answer'
  if (best.pv[0] === uci) return null
  const second = res.lines[1]
  const mine =
    second && second.pv[0] === uci
      ? { cp: lineScore(second), mating: isMateFor(second) }
      : await scoreAfterMove(engine, fen, uci)
  if (!mine) return 'could not score the solution move'
  return equallyGood(best, mine) ? null : `engine prefers ${best.pv[0]} (${lineScore(best)}) over ${uci} (${mine.cp})`
}

/**
 * Check every move YOU have to find (the first one with more care), and only when needed that the
 * end of the line is good for you.
 */
export async function engineCheck(engine: NodeEngine, p: CachedPuzzle, played: Replay): Promise<Verdict> {
  const chess = new Chess(played.startFen)
  for (let i = 1; i < p.moves.length; i += 2) {
    // Only one legal move? Then there is nothing to compare.
    if (chess.moves().length > 1) {
      const reason = await badMoveReason(engine, chess.fen(), p.moves[i], i === 1 ? FIRST_MOVE_DEPTH : LATER_MOVE_DEPTH)
      if (reason) return { id: p.id, ok: false, reason: `move ${(i + 1) / 2}: ${reason}` }
    }
    playUci(chess, p.moves[i])
    if (p.moves[i + 1]) playUci(chess, p.moves[i + 1])
  }

  if (played.mate) return { id: p.id, ok: true, reason: 'ends in mate' }
  if (played.gain >= 1) return { id: p.id, ok: true, reason: 'wins material' }

  // Nothing won on the board, so ask the engine whether the final position is good for the user.
  const survives = p.themes.includes('defensiveMove') || p.themes.includes('equality')
  if (played.stalemate) {
    return survives
      ? { id: p.id, ok: true, reason: 'saves the game by stalemate' }
      : { id: p.id, ok: false, reason: 'ends in stalemate' }
  }
  const end = await engine.go({ fen: played.finalFen, depth: FINAL_POSITION_DEPTH, movetime: MOVE_TIME_CAP_MS })
  const endLine = end.lines[0]
  if (!endLine) return { id: p.id, ok: false, reason: 'engine gave no answer for the final position' }
  const forUser = -lineScore(endLine)
  const needed = survives ? SURVIVED_END_CP : GOOD_END_CP
  return forUser >= needed
    ? { id: p.id, ok: true, reason: `final position ${forUser >= 0 ? '+' : ''}${forUser}` }
    : { id: p.id, ok: false, reason: `final position only ${forUser >= 0 ? '+' : ''}${forUser} for the solver` }
}
