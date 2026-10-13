import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnalysedMove } from '../../types'
import type { BoardMove } from '../../components/Board'
import { getSharedEngine, scoreForWhite } from '../../engine/uci'
import { winPercent } from '../../lib/evaluation'
import { moverEval } from './moveFacts'

// "Try it": the player goes back to the position before their mistake and has to find a better move.
// The best move from the analysis is checked instantly. Any other move is quickly checked with the engine,
// so a different-but-good move is accepted too.

export type TryStatus = 'waiting' | 'checking' | 'wrong' | 'right' | 'alternative' | 'revealed'

export interface TryState {
  /** The ply of the move being retried (the mistake). */
  ply: number
  status: TryStatus
  /** The move the player just tried, in SAN (shown in the message). */
  lastSan?: string
  /** Position after the accepted move, so the board can show it. */
  acceptedFen?: string
  hint: boolean
}

/** A different move is accepted when it gives away at most this many percentage points of winning chances. */
const ALTERNATIVE_TOLERANCE = 4

export function useTryIt(moves: AnalysedMove[]) {
  const [state, setState] = useState<TryState | null>(null)
  const token = useRef(0) // lets us ignore the answer of an engine check the player has already moved on from

  useEffect(
    () => () => {
      token.current++
    },
    [],
  )

  const start = useCallback((ply: number) => {
    token.current++
    setState({ ply, status: 'waiting', hint: false })
  }, [])

  const exit = useCallback(() => {
    token.current++
    setState(null)
  }, [])

  const showHint = useCallback(() => setState((s) => (s ? { ...s, hint: true } : s)), [])
  const reveal = useCallback(() => {
    token.current++
    setState((s) => (s ? { ...s, status: 'revealed' } : s))
  }, [])

  /** Hand this to the Board's `onMove`. Returns true when the move should stay on the board. */
  const attempt = useCallback(
    (played: BoardMove): boolean => {
      if (!state || state.status === 'right' || state.status === 'alternative' || state.status === 'revealed') return false
      const target = moves[state.ply - 1]
      if (!target) return false

      if (played.uci === target.bestUci) {
        setState({ ...state, status: 'right', lastSan: played.san, acceptedFen: played.fenAfter })
        return true
      }

      // Not the engine's first choice: ask the engine how good it really is (takes a fraction of a second).
      const mine = ++token.current
      setState({ ...state, status: 'checking', lastSan: played.san })
      void getSharedEngine()
        .then((engine) => engine.go({ fen: played.fenAfter, depth: 10 }))
        .then((res) => {
          if (mine !== token.current) return
          const line = res.lines[0]
          const sign = target.ply % 2 === 1 ? 1 : -1
          const after = line ? sign * scoreForWhite(played.fenAfter, line) : moverEval(target).after
          const loss = winPercent(moverEval(target).before) - winPercent(after)
          setState((s) =>
            s && s.ply === target.ply
              ? loss <= ALTERNATIVE_TOLERANCE
                ? { ...s, status: 'alternative', acceptedFen: played.fenAfter }
                : { ...s, status: 'wrong' }
              : s,
          )
        })
        .catch(() => {
          if (mine === token.current) setState((s) => (s ? { ...s, status: 'wrong' } : s))
        })
      return false // the piece jumps back while we check
    },
    [state, moves],
  )

  return { state, start, exit, attempt, showHint, reveal }
}
