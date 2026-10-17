import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SafetyCard } from '../../types'
import type { BoardMove } from '../../components/Board'
import { judgeMove, judgeWithEngine, type Verdict } from './accept'
import type { Answer } from './record'
import { bestReply, evalAfterMove, warmEngine } from './engineCheck'
import { isMate, playUci, type Played } from './positions'

// One Safety-check position, step by step:
//   intro    the board shows the position, then his last move is played (0.75 s, as in puzzles);
//   moving   he picks a move (nothing is final yet; "Show answer" counts as a miss);
//   writing  his move stays on the board, no verdict, and the one-line box asks what he checked (2-140 characters);
//            he may change the move and keep his line; Confirm (or Enter) asks for the verdict;
//   checking only for a move the stored data cannot decide: the browser engine looks (about 3 s at most);
//   verdict  right or wrong, his line repeated, the facts, his opponent's answer on the board.
// After a miss he may try again: the retry is judged at once (no line), logged, and never changes the schedule.

export const INTRO_MS = 750
export const MIN_LINE = 2
export const MAX_LINE = 140
export const EMPTY_LINE_MESSAGE = 'One word is enough.'
export type { Answer }

export type RunPhase = 'intro' | 'moving' | 'writing' | 'checking' | 'verdict'

export interface SafetyRun {
  phase: RunPhase
  /** The position after his last move, which the trainee answers. */
  start: Played | null
  /** The trainee's current move (the graded one, or the latest retry). */
  move: Played | null
  /** The move of the graded answer, kept while he retries. */
  gradedMove: Played | null
  line: string
  lineError: string | null
  /** The graded answer's verdict; null before it, and after "Show answer". */
  verdict: Verdict | null
  shownAnswer: boolean
  retrying: boolean
  retryVerdict: Verdict | null
  /** His answer to the trainee's wrong move (up to 2 moves), null while unknown. */
  reply: string[] | null
  engineError: string | null
}

const noRun = (start: Played | null): SafetyRun => ({
  phase: 'intro',
  start,
  move: null,
  gradedMove: null,
  line: '',
  lineError: null,
  verdict: null,
  shownAnswer: false,
  retrying: false,
  retryVerdict: null,
  reply: null,
  engineError: null,
})

/** His answer from the stored data: the move's own engine line, or the game's line for the game move. */
function storedReply(card: SafetyCard, m: Played, enginePv: string[] | null): string[] | null {
  const listed = card.moves?.find((x) => x.uci === m.uci)
  if (listed?.line && listed.line.length > 1) return listed.line.slice(1, 3)
  const top = card.top.find((t) => t.uci === m.uci)
  if (top && top.pv.length > 1) return top.pv.slice(1, 3)
  for (const f of card.facts) if (f.t === 'allowed' && f.line[0] === m.uci && f.line.length > 1) return f.line.slice(1, 3)
  return enginePv && enginePv.length ? enginePv.slice(0, 2) : null
}

export function useSafetyRun(card: SafetyCard, onAnswer: (a: Answer) => void) {
  const start = useMemo(() => playUci(card.fenBefore, card.lastMove), [card])
  const [run, setRun] = useState<SafetyRun>(() => noRun(start))
  const times = useRef({ startedAt: 0, movedAt: 0 })
  const token = useRef(0) // a newer action makes older engine answers stale
  const answerRef = useRef(onAnswer)
  answerRef.current = onAnswer

  // the intro, once per card; the engine starts loading early when this card may need it
  useEffect(() => {
    setRun(noRun(start))
    if (!card.topComplete && !card.moves) warmEngine()
    const timer = window.setTimeout(() => {
      times.current.startedAt = Date.now()
      setRun((r) => ({ ...r, phase: 'moving' }))
    }, INTRO_MS)
    return () => {
      window.clearTimeout(timer)
      token.current++
    }
  }, [card, start])

  const judge = useCallback(
    (m: Played, retry: boolean, meta: Pick<Answer, 'checked' | 'msToMove' | 'msToWrite'>) => {
      const mine = ++token.current
      const finish = (verdict: Verdict, enginePv: string[] | null) => {
        if (mine !== token.current) return
        const reply = verdict.ok ? null : storedReply(card, m, enginePv)
        setRun((r) => ({
          ...r,
          phase: 'verdict',
          engineError: null,
          reply,
          ...(retry ? { retryVerdict: verdict } : { verdict, gradedMove: m }),
        }))
        answerRef.current({ move: m.uci, ok: verdict.ok, loss: verdict.loss, by: verdict.by, shownAnswer: false, retry, ...meta })
        if (!verdict.ok && !reply) {
          bestReply(m.fen).then(
            (pv) => mine === token.current && setRun((r) => ({ ...r, reply: pv.slice(0, 2) })),
            () => undefined,
          )
        }
      }
      const decision = judgeMove(card, m.uci, isMate(m.fen))
      if (decision.decided) {
        finish(decision.verdict, null)
        return
      }
      setRun((r) => ({ ...r, phase: 'checking', engineError: null }))
      evalAfterMove(m.fen).then(
        (res) => finish(judgeWithEngine(card, m.uci, res.eval), res.pv),
        () => {
          if (mine !== token.current) return
          setRun((r) => ({
            ...r,
            phase: retry ? 'moving' : 'writing',
            engineError: 'The engine could not finish the check. Please try again.',
          }))
        },
      )
    },
    [card],
  )

  /** Hand this to the Board's onMove. The piece stays where it was dropped. */
  const onBoardMove = useCallback(
    (bm: BoardMove): boolean => {
      if (run.phase !== 'moving') return false
      const m: Played = { fen: bm.fenAfter, from: bm.from, to: bm.to, san: bm.san, uci: bm.uci }
      const now = Date.now()
      times.current.movedAt = now
      if (run.retrying) {
        setRun((r) => ({ ...r, move: m, retryVerdict: null, reply: null }))
        judge(m, true, { checked: '', msToMove: now - times.current.startedAt, msToWrite: 0 })
        return true
      }
      setRun((r) => ({ ...r, phase: 'writing', move: m, lineError: null, engineError: null }))
      return true
    },
    [run.phase, run.retrying, judge],
  )

  const setLine = useCallback((text: string) => {
    setRun((r) => ({ ...r, line: text.slice(0, MAX_LINE), lineError: null }))
  }, [])

  /** Back to the position before his move; the written line stays. */
  const changeMove = useCallback(() => {
    token.current++
    setRun((r) => (r.phase === 'writing' ? { ...r, phase: 'moving', move: null, engineError: null } : r))
  }, [])

  /** No verdict without a move and a line of 2+ characters. */
  const confirm = useCallback(() => {
    if (run.phase !== 'writing' || !run.move) return
    const checked = run.line.trim()
    if (checked.length < MIN_LINE) {
      setRun((r) => ({ ...r, lineError: EMPTY_LINE_MESSAGE }))
      return
    }
    const now = Date.now()
    judge(run.move, false, {
      checked,
      msToMove: times.current.movedAt - times.current.startedAt,
      msToWrite: now - times.current.movedAt,
    })
  }, [run.phase, run.move, run.line, judge])

  /** Looking before moving counts as a miss (grade Again). */
  const showAnswer = useCallback(() => {
    if (run.phase !== 'moving' || run.retrying) return
    token.current++
    setRun((r) => ({ ...r, phase: 'verdict', shownAnswer: true, move: null }))
    answerRef.current({
      ok: false,
      loss: null,
      checked: '',
      msToMove: Date.now() - times.current.startedAt,
      msToWrite: 0,
      shownAnswer: true,
      retry: false,
    })
  }, [run.phase, run.retrying])

  /** After a miss: the position again, for learning only. */
  const tryAgain = useCallback(() => {
    token.current++
    times.current.startedAt = Date.now()
    setRun((r) => ({ ...r, phase: 'moving', retrying: true, move: null, retryVerdict: null, reply: null, engineError: null }))
  }, [])

  return { run, onBoardMove, setLine, changeMove, confirm, showAnswer, tryAgain }
}
