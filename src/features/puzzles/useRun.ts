import { useEffect, useReducer } from 'react'
import type { Puzzle } from '../../types'
import type { BoardMove } from '../../components/Board'
import { playSound, type SoundName } from '../../lib/sound'
import { puzzleToStart, type PuzzleStart } from '../../lib/puzzleData'
import { isPlayable, playUci, soundFor } from './line'

// The state of the puzzle on screen, as a small state machine:
//
//   intro ──► solving ──► replying ──► solving ──► … ──► solved
//                │  ▲
//                ▼  │
//               wrong ──► showing ──► shown
//
// intro     the opponent plays the first move (the puzzle starts after it)
// solving   it is your turn: find the move
// replying  you were right; the opponent answers
// wrong     your move was not the one; you may try again
// showing   the solution is being played on the board, step by step
// shown     the solution was shown (or you finished); nothing more to do but go on

export type Phase = 'intro' | 'solving' | 'replying' | 'wrong' | 'solved' | 'showing' | 'shown'

export interface RunState {
  puzzle: Puzzle
  start: PuzzleStart
  fen: string
  /** Which move of `start.solution` is played next. */
  step: number
  lastMove: [string, string] | null
  phase: Phase
  /** 0 = no hint, 1 = the piece to move is lit up, 2 = the move is drawn as an arrow. */
  hint: 0 | 1 | 2
  usedHint: boolean
  /** The player already missed (or gave up) on this puzzle, so the rating was already adjusted. */
  failed: boolean
  /** How many wrong moves were tried (for the wording of the message). */
  wrongMoves: number
  /** The player finished with a different checkmate than the puzzle's own line. */
  otherMate: boolean
  /** A sound to play for the move just made; `id` changes every time. */
  sound: { id: number; name: SoundName } | null
}

type Action =
  | { type: 'load'; puzzle: Puzzle; start: PuzzleStart }
  | { type: 'opponentMoved' }
  | { type: 'userMoved'; move: BoardMove; verdict: 'right' | 'mate'; finished: boolean }
  | { type: 'replied' }
  | { type: 'wrong' }
  | { type: 'tryAgain' }
  | { type: 'hint' }
  | { type: 'showSolution' }
  | { type: 'showNext' }

export const INTRO_MS = 750
export const REPLY_MS = 480
export const SHOW_MS = 1000

/** Turn a puzzle into the data the run needs. Returns null when the puzzle is damaged (it is then skipped). */
export function prepare(puzzle: Puzzle): { puzzle: Puzzle; start: PuzzleStart } | null {
  try {
    const start = puzzleToStart(puzzle)
    return isPlayable(start) ? { puzzle, start } : null
  } catch {
    return null
  }
}

function makeSound(state: RunState, name: SoundName) {
  return { id: (state.sound?.id ?? 0) + 1, name }
}

function reduce(state: RunState | null, action: Action): RunState | null {
  if (action.type === 'load') {
    return {
      puzzle: action.puzzle,
      start: action.start,
      // The board first shows the position BEFORE the opponent's move; then the opponent moves.
      fen: action.puzzle.fen,
      step: 0,
      lastMove: null,
      phase: 'intro',
      hint: 0,
      usedHint: false,
      failed: false,
      wrongMoves: 0,
      otherMate: false,
      sound: null,
    }
  }
  if (!state) return state

  switch (action.type) {
    case 'opponentMoved':
      if (state.phase !== 'intro') return state
      return {
        ...state,
        fen: state.start.startFen,
        lastMove: state.start.lastMove,
        phase: 'solving',
        sound: makeSound(state, soundFor(state.start.opponentSan)),
      }

    case 'userMoved':
      return {
        ...state,
        fen: action.move.fenAfter,
        lastMove: [action.move.from, action.move.to],
        step: state.step + 1,
        phase: action.finished ? 'solved' : 'replying',
        hint: 0,
        otherMate: action.verdict === 'mate',
        sound: makeSound(state, action.finished ? 'end' : soundFor(action.move.san)),
      }

    case 'replied': {
      if (state.phase !== 'replying') return state
      const reply = playUci(state.fen, state.start.solution[state.step])
      return {
        ...state,
        fen: reply.fen,
        lastMove: reply.squares,
        step: state.step + 1,
        phase: 'solving',
        sound: makeSound(state, soundFor(reply.san)),
      }
    }

    case 'wrong':
      return { ...state, phase: 'wrong', failed: true, wrongMoves: state.wrongMoves + 1 }

    case 'tryAgain':
      return state.phase === 'wrong' ? { ...state, phase: 'solving', hint: 0 } : state

    case 'hint':
      if (state.phase !== 'solving' && state.phase !== 'wrong') return state
      return { ...state, hint: state.hint === 0 ? 1 : 2, usedHint: true }

    case 'showSolution':
      // Start again from the first position and play the whole solution.
      return {
        ...state,
        fen: state.start.startFen,
        lastMove: state.start.lastMove,
        step: 0,
        phase: 'showing',
        hint: 0,
        failed: true,
      }

    case 'showNext': {
      if (state.phase !== 'showing') return state
      const move = playUci(state.fen, state.start.solution[state.step])
      const step = state.step + 1
      return {
        ...state,
        fen: move.fen,
        lastMove: move.squares,
        step,
        phase: step >= state.start.solution.length ? 'shown' : 'showing',
        sound: makeSound(state, soundFor(move.san)),
      }
    }
  }
}

/**
 * Runs one puzzle at a time. `dispatch({type:'load', ...})` starts a puzzle; the hook then plays the
 * opponent's moves with small pauses and the sounds. Timers are cleaned up when the puzzle changes or the page closes.
 */
export function usePuzzleRun(timing: { introMs?: number; replyMs?: number } = {}) {
  const [run, dispatch] = useReducer(reduce, null)
  const { introMs = INTRO_MS, replyMs = REPLY_MS } = timing

  const phase = run?.phase
  const step = run?.step
  const puzzleId = run?.puzzle.id
  useEffect(() => {
    const next =
      phase === 'intro'
        ? { type: 'opponentMoved' as const, wait: introMs }
        : phase === 'replying'
          ? { type: 'replied' as const, wait: replyMs }
          : phase === 'showing'
            ? { type: 'showNext' as const, wait: step === 0 ? introMs : SHOW_MS }
            : null
    if (!next) return
    const timer = window.setTimeout(() => dispatch({ type: next.type }), next.wait)
    return () => window.clearTimeout(timer)
  }, [phase, step, puzzleId, introMs, replyMs])

  const sound = run?.sound
  useEffect(() => {
    if (sound) playSound(sound.name)
  }, [sound])

  return { run, dispatch }
}

export type RunDispatch = ReturnType<typeof usePuzzleRun>['dispatch']

/** Was this move the one the puzzle wants? ('mate' = a different move, but it checkmates, so it is just as good.) */
export function judgeMove(run: RunState, move: BoardMove): 'right' | 'mate' | 'wrong' {
  if (move.uci === run.start.solution[run.step]) return 'right'
  return move.isCheckmate ? 'mate' : 'wrong'
}

/** After this correct move, does the player have to find another one? */
export function isLastUserMove(run: RunState, verdict: 'right' | 'mate'): boolean {
  return verdict === 'mate' || run.step + 2 >= run.start.solution.length
}
