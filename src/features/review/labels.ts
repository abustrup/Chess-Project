import type { AnalysedMove, GameAnalysis, MoveClass } from '../../types'
import { MATE_CP } from '../../lib/evaluation'
import { LICHESS_START, serverDrop, serverJudgment, type Eval, type Judgment } from '../../lib/lichessRules'

// The labels Review puts on moves (Inaccuracy, Mistake, Blunder) follow Lichess's game page exactly: the move gave
// away 5, 10 or 15 points of winning chances, with Lichess's own rules when a forced mate appears or disappears, and
// no label for the engine's own first choice (lichessRules.ts serverJudgment). Moves without a label keep the app's
// calmer names: an opening move, the best move, or a good move.
//
// The numbers come from Stockfish in the browser, which looks less deeply than Lichess's server, so on the same game
// the counts can differ from Lichess's. Fed Lichess's own evaluations, Review gives Lichess's label on every
// move of his 6 analysed games (labels.check.ts).

const STANDARD_START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -'

const FROM_JUDGMENT: Record<Judgment, MoveClass> = {
  Inaccuracy: 'inaccuracy',
  Mistake: 'mistake',
  Blunder: 'blunder',
}

/**
 * A stored score from White's point of view as a Lichess evaluation. Review stores a forced mate as
 * +-(10000 - 10 x N) (evaluation.ts scoreToCp) and a finished checkmate as +-10000; Lichess's rule only needs to know
 * that there is a forced mate and for whom, which that number keeps.
 */
export function evalFromScore(cpWhite: number): Eval {
  if (Math.abs(cpWhite) < MATE_CP - 1000) return { cp: cpWhite }
  const n = Math.max(0, Math.round((MATE_CP - Math.abs(cpWhite)) / 10))
  if (n === 0) return { mate: 0, mated: cpWhite < 0 ? 'white' : 'black' }
  return { mate: cpWhite > 0 ? n : -n }
}

/** The facts one move's label depends on. */
export interface LabelInput {
  /** Scores before and after the move, White's point of view, as Review stores them. */
  evalBefore: number
  evalAfter: number
  moverWhite: boolean
  /** The move played is the engine's own first choice. */
  playedBest: boolean
  /** The move is part of the named opening the game follows. */
  isBook: boolean
  /** Count the position before the move as +0.15, as Lichess does for the first move of a game. */
  fromStart?: boolean
}

/**
 * Review's label for one move. A Lichess label always wins, even on an opening move, so a move Lichess calls a
 * blunder is never shown as anything else. The rest are an opening move, the best move (the engine's choice, or
 * within 1 point of it), or a good move.
 */
export function reviewLabel(m: LabelInput): MoveClass {
  const before = m.fromStart ? LICHESS_START : evalFromScore(m.evalBefore)
  const after = evalFromScore(m.evalAfter)
  const judgment = serverJudgment(before, after, m.moverWhite, m.playedBest)
  if (judgment) return FROM_JUDGMENT[judgment]
  if (m.isBook) return 'book'
  if (m.playedBest) return 'best'
  return serverDrop(before, after, m.moverWhite) <= 1 ? 'best' : 'good'
}

/** The position fields of a FEN; saved data is checked loosely (gameStore), so a missing FEN gives ''. */
function fenFields(fen: unknown): string[] {
  return typeof fen === 'string' ? fen.split(' ') : []
}

/** Does the game start from the normal starting position (only then does the first move count from +0.15)? */
function startsNormally(moves: readonly Pick<AnalysedMove, 'fenBefore'>[]): boolean {
  return fenFields(moves[0]?.fenBefore).slice(0, 4).join(' ') === STANDARD_START
}

/** Who made the move: read from the position, so a game set up with Black to move is right too. */
function moverIsWhite(m: Pick<AnalysedMove, 'fenBefore' | 'ply'>): boolean {
  const turn = fenFields(m.fenBefore)[1]
  return turn ? turn === 'w' : m.ply % 2 === 1
}

/** Labels for a whole game. `isBook(i)` says whether move i belongs to the named opening. */
export function labelMoves(
  moves: readonly Omit<AnalysedMove, 'classification'>[],
  isBook: (index: number) => boolean,
): MoveClass[] {
  const normalStart = startsNormally(moves)
  return moves.map((m, i) =>
    reviewLabel({
      evalBefore: m.evalBefore,
      evalAfter: m.evalAfter,
      moverWhite: moverIsWhite(m),
      playedBest: m.bestUci === m.uci,
      isBook: isBook(i),
      fromStart: i === 0 && normalStart,
    }),
  )
}

const relabelled = new WeakMap<GameAnalysis, GameAnalysis>()

/**
 * A saved analysis with Lichess's labels. Analyses saved before Review followed Lichess (2026-10-16) called a move a
 * blunder only above 20 points; their scores are still right, so the labels are simply worked out again. Opening
 * moves are recognised by their saved "opening move" label. Returns the same object when nothing changes, so it is
 * cheap to call on every read.
 */
export function withLichessLabels(analysis: GameAnalysis): GameAnalysis {
  const known = relabelled.get(analysis)
  if (known) return known
  const labels = labelMoves(analysis.moves, (i) => analysis.moves[i].classification === 'book')
  const same = labels.every((c, i) => c === analysis.moves[i].classification)
  const moves = same
    ? analysis.moves
    : analysis.moves.map((m, i) => (m.classification === labels[i] ? m : { ...m, classification: labels[i] }))
  const result = same ? analysis : { ...analysis, moves }
  relabelled.set(analysis, result)
  relabelled.set(result, result)
  return result
}
