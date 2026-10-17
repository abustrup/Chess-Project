import type { SafetyCard, SafetyEval, SafetyTopMove } from '../../types'
import { povChances, retroAccept } from '../../lib/lichessRules'

// Is the trainee's move right? On his own mistakes (own cards), Lichess's "Learn from your mistakes" rule
// (lichessRules.retroAccept): right when it keeps his winning chances within 4 points of the best move. On held and
// quiet cards the point is to check and then play a safe move, not to match the engine, so a move is also right when
// it is SAFE: it loses under 15 points, allows no mate and gives away under 2 points of material (the card builder's
// safety rule). The builder searched the moves with native Stockfish 19, so answers are the same on every device. The
// order is the one scripts/safety/README.md and cards.schema.json fix for the app:
//   1. own card, the game move: wrong ("That was the game move"), as on Lichess;
//   2. held or quiet card with every legal move stored (`moves`): right when within 4 points of the best, or safe;
//   3. a stored top move: right when within 4 points of the best one;
//   4. the game move on a held or quiet card: the builder's own verdict for it;
//   5. the list is complete (its 5th move already fails): any other move is wrong at once;
//   6. otherwise the browser engine judges it (Lichess's readiness rule: a best move, 1,000,000 nodes or 3 s).
// A move that gives checkmate is always right, as on Lichess.

export type DecidedBy = 'top' | 'game' | 'complete' | 'engine' | 'moves'

export interface Verdict {
  ok: boolean
  /** Win% points lost against the best move (0 or more); null when only "worse than the 5th best" is known. */
  loss: number | null
  by: DecidedBy
  /** The stored top move he played, when it is one. */
  entry?: SafetyTopMove
  /** His move was the move from the game. */
  gameMove: boolean
  /** Held and quiet cards: right only because it is safe (more than 4 points below the best, but nothing to win). */
  safeOnly?: boolean
  /** Held and quiet cards, a wrong move: he can mate, win material, or the move simply costs 15 points or more. */
  why?: 'mate' | 'material' | 'loss'
  /** Held and quiet cards: the move's line (starting with it), for his answer on the board and in the sentence. */
  line?: string[]
}

export type Decision = { decided: true; verdict: Verdict } | { decided: false }

/** His winning chances 0..100 on the "Learn from your mistakes" scale (cp clamped to +-1000). */
export function traineeWin(card: Pick<SafetyCard, 'side'>, e: SafetyEval): number {
  return 50 + 50 * povChances(card.side, e)
}

function lossAgainstBest(card: SafetyCard, e: SafetyEval): number {
  return Math.max(0, traineeWin(card, card.top[0].eval) - traineeWin(card, e))
}

/** The trainee is mated by force after a move with this eval (White's point of view). */
function matedAfter(card: Pick<SafetyCard, 'side'>, e: SafetyEval): boolean {
  return e.mate !== undefined && e.mate !== 0 && (card.side === 'white' ? e.mate < 0 : e.mate > 0)
}

/** Decides a move from the stored data alone, or says the browser engine must look (step 6). */
export function judgeMove(card: SafetyCard, uci: string, givesMate = false): Decision {
  const gameMove = uci === card.human.uci
  const decided = (v: Omit<Verdict, 'gameMove'>): Decision => ({ decided: true, verdict: { ...v, gameMove } })
  if (card.kind === 'own' && gameMove) return decided({ ok: false, loss: lossAgainstBest(card, card.human.eval), by: 'game' })
  if (givesMate) return decided({ ok: true, loss: 0, by: 'top' })
  const entry = card.top.find((t) => t.uci === uci)
  const listed = card.kind !== 'own' ? card.moves?.find((m) => m.uci === uci) : undefined
  if (listed) {
    const within = retroAccept(card.side, listed.eval, card.top[0].eval)
    const safe = listed.safe === true
    const why = within || safe ? undefined : matedAfter(card, listed.eval) ? 'mate' : (listed.gain ?? 0) >= 2 ? 'material' : 'loss'
    return decided({
      ok: within || safe,
      loss: lossAgainstBest(card, listed.eval),
      by: 'moves',
      ...(entry ? { entry } : {}),
      ...(!within && safe ? { safeOnly: true } : {}),
      ...(why ? { why } : {}),
      ...(listed.line ? { line: listed.line } : {}),
    })
  }
  if (entry) {
    return decided({ ok: retroAccept(card.side, entry.eval, card.top[0].eval), loss: lossAgainstBest(card, entry.eval), by: 'top', entry })
  }
  if (gameMove) return decided({ ok: card.human.passes, loss: lossAgainstBest(card, card.human.eval), by: 'game' })
  if (card.topComplete) return decided({ ok: false, loss: null, by: 'complete' })
  return { decided: false }
}

/** Step 5: the browser engine's evaluation of the position after his move (White's point of view). */
export function judgeWithEngine(card: SafetyCard, uci: string, after: SafetyEval): Verdict {
  return {
    ok: retroAccept(card.side, after, card.top[0].eval),
    loss: lossAgainstBest(card, after),
    by: 'engine',
    gameMove: uci === card.human.uci,
  }
}

/**
 * The engine's score for the side to move in `fen`, turned to White's point of view, as Lichess stores evals.
 * A side to move with no legal moves: checkmate (mate 0 against it) or stalemate (0).
 */
export function whiteEval(fen: string, line: { cp?: number; mate?: number } | null, noMoves?: 'checkmate' | 'stalemate'): SafetyEval {
  const whiteToMove = fen.split(' ')[1] !== 'b'
  const sign = whiteToMove ? 1 : -1
  if (noMoves === 'checkmate') return { mate: whiteToMove ? -1 : 1 } // the side to move is mated (judgeMove accepts mates first)
  if (noMoves === 'stalemate' || !line) return { cp: 0 }
  if (line.mate != null) return { mate: sign * line.mate }
  return { cp: sign * (line.cp ?? 0) }
}
