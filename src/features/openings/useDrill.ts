import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { Chess } from 'chess.js'
import type { BoardArrow, BoardHighlight, OpeningChapter, OpeningCourse } from '../../types'
import { pathTo, type PgnNode, type PgnTree } from '../../lib/pgnTree'
import { pickWeighted, readNodeStats, recordLineComplete, recordMove, weaknessOf } from './progress'
import { playSound } from '../../lib/sound'
import { isUserTurn, maskMove, moveLabel, soundFor } from './treeUtils'

// The brain of drill mode. The page only draws; all the rules live here.
//
// A "line" is one walk through the chapter: you find your moves, the app answers with one of the
// prepared replies (more often the ones you know least), until the prepared moves run out.

export interface DrillEntry {
  chapter: OpeningChapter
  tree: PgnTree
}

export interface Note {
  kind: 'right' | 'wrong' | 'info'
  title: string
  /** Small lead-in shown before the text, e.g. "The idea here". */
  label?: string
  text: string
}

type Phase = 'your-turn' | 'opponent' | 'complete'

interface State {
  lineNo: number
  chapterId: string
  /** The position on the board (the node whose move was played last). */
  nodeId: string
  phase: Phase
  /** Positions in this line where you slipped (a position counts once, however many tries). */
  missed: string[]
  /** Wrong tries at the current position. */
  wrongHere: number
  hint: 0 | 1 | 2
  answerShown: boolean
  note: Note | null
  /** Your last correct move, and the reply to it: their explanations stay on screen. */
  userNodeId: string | null
  replyNodeId: string | null
  /** Clean lines in a row (this visit). */
  streak: number
}

type Action =
  | { type: 'new-line'; state: State }
  | { type: 'right'; childId: string; note: Note; complete: boolean; streak: number }
  | { type: 'wrong'; note: Note }
  | { type: 'hint'; counts: boolean }
  | { type: 'answer'; note: Note }
  | { type: 'dismiss' }
  | { type: 'reply'; childId: string; complete: boolean; streak: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'new-line':
      return action.state
    case 'right':
      return {
        ...state,
        nodeId: action.childId,
        phase: action.complete ? 'complete' : 'opponent',
        wrongHere: 0,
        hint: 0,
        answerShown: false,
        note: action.note,
        userNodeId: action.childId,
        replyNodeId: null,
        streak: action.streak,
      }
    case 'wrong':
      return {
        ...state,
        wrongHere: state.wrongHere + 1,
        note: action.note,
        missed: state.missed.includes(state.nodeId) ? state.missed : [...state.missed, state.nodeId],
      }
    case 'hint': {
      const hint = state.hint === 0 ? 1 : 2
      const missed = action.counts && !state.missed.includes(state.nodeId) ? [...state.missed, state.nodeId] : state.missed
      return { ...state, hint, missed }
    }
    case 'answer':
      return {
        ...state,
        hint: 2,
        answerShown: true,
        note: action.note,
        missed: state.missed.includes(state.nodeId) ? state.missed : [...state.missed, state.nodeId],
      }
    case 'dismiss':
      return { ...state, note: null }
    case 'reply':
      return {
        ...state,
        nodeId: action.childId,
        replyNodeId: action.childId,
        phase: action.complete ? 'complete' : 'your-turn',
        streak: action.streak,
        wrongHere: 0,
        hint: 0,
        answerShown: false,
      }
  }
}

/* --------------------------------------------------------------- starting */

function chooseEntry(course: OpeningCourse, entries: DrillEntry[]): DrillEntry {
  if (entries.length === 1) return entries[0]
  return pickWeighted(entries, (e) => 0.15 + weaknessOf(e.tree.root, course, readNodeStats(course.id, e.chapter.id)))
}

function freshLine(course: OpeningCourse, entries: DrillEntry[], startNodeId: string | undefined, lineNo: number, streak: number): State {
  const entry = chooseEntry(course, entries)
  const wanted = startNodeId ? entry.tree.nodes.get(startNodeId) : undefined
  const start = wanted && wanted.children.length > 0 ? wanted : entry.tree.root
  return {
    lineNo,
    chapterId: entry.chapter.id,
    nodeId: start.id,
    phase: isUserTurn(start, course) ? 'your-turn' : 'opponent',
    missed: [],
    wrongHere: 0,
    hint: 0,
    answerShown: false,
    note: null,
    userNodeId: null,
    replyNodeId: null,
    streak,
  }
}

/* ------------------------------------------------------------------ hook */

export function useDrill(course: OpeningCourse, entries: DrillEntry[], startNodeId?: string) {
  const [state, dispatch] = useReducer(reducer, undefined, () => freshLine(course, entries, startNodeId, 1, 0))

  const entry = entries.find((e) => e.chapter.id === state.chapterId) ?? entries[0]
  const { chapter, tree } = entry
  const node = tree.nodes.get(state.nodeId) ?? tree.root
  const mainChild: PgnNode | undefined = node.children[0]
  const startNode = startNodeId ? tree.nodes.get(startNodeId) : undefined
  const startedMidway = !!startNode && startNode.children.length > 0 && entries.length === 1

  /** The user plays a move (dragged, clicked or typed). Returns true if the board should keep it. */
  const play = useCallback(
    (uci: string): boolean => {
      if (state.phase !== 'your-turn') return false
      const child = node.children.find((c) => c.uci === uci)

      if (!child) {
        if (!state.missed.includes(node.id)) recordMove(course, chapter, tree, node.id, false)
        const idea = mainChild?.comment ? maskMove(mainChild.comment, mainChild.san) : ''
        const stuck = state.wrongHere >= 1 ? ' Stuck? Use the hint button.' : ''
        const about = aboutWrongMove(node.fen, uci)
        const title = about ? `Not quite. ${about}` : 'Not quite.'
        dispatch({
          type: 'wrong',
          note: idea
            ? { kind: 'wrong', title, label: 'The idea here', text: idea + stuck }
            : {
                kind: 'wrong',
                title,
                text: `Look at the position again and try another move.${stuck || ' You can ask for a hint.'}`,
              },
        })
        return false
      }

      if (!state.missed.includes(node.id)) recordMove(course, chapter, tree, node.id, true)
      const isMain = child === mainChild
      const note: Note = isMain
        ? { kind: 'right', title: `Correct! ${child.san}`, text: child.comment }
        : {
            kind: 'right',
            title: `${child.san} works too`,
            text: `${child.comment ? child.comment + ' ' : ''}The move this lesson teaches here is ${mainChild.san}.`.trim(),
          }
      const complete = child.children.length === 0
      const streak = complete ? finishLine(course, chapter, state.missed.length === 0, state.streak) : state.streak
      playSound(complete ? 'end' : soundFor(child.san))
      dispatch({ type: 'right', childId: child.id, note, complete, streak })
      return true
    },
    [state, node, mainChild, course, chapter, tree],
  )

  /** Typed moves (for keyboard users): "Nf3" -> the same path as a dragged move. */
  const playTyped = useCallback(
    (text: string): 'ok' | 'illegal' => {
      try {
        const mv = new Chess(node.fen).move(text.trim())
        play(mv.from + mv.to + (mv.promotion ?? ''))
        return 'ok'
      } catch {
        return 'illegal'
      }
    },
    [node.fen, play],
  )

  const hint = useCallback(() => {
    if (state.phase !== 'your-turn' || state.hint >= 2 || !mainChild) return
    // The first hint (which piece) is free. The second one gives the move away, so it counts as a slip.
    const counts = state.hint === 1
    if (counts && !state.missed.includes(node.id)) recordMove(course, chapter, tree, node.id, false)
    dispatch({ type: 'hint', counts })
  }, [state, node, mainChild, course, chapter, tree])

  const showAnswer = useCallback(() => {
    if (state.phase !== 'your-turn' || !mainChild) return
    if (!state.missed.includes(node.id)) recordMove(course, chapter, tree, node.id, false)
    dispatch({
      type: 'answer',
      note: {
        kind: 'info',
        title: `The move here is ${mainChild.san}`,
        text: mainChild.comment || 'Play it on the board to carry on.',
      },
    })
  }, [state, node, mainChild, course, chapter, tree])

  const dismiss = useCallback(() => dispatch({ type: 'dismiss' }), [])

  /** A new walk through the chapter. Giving up a line after a slip breaks the streak; a fresh restart does not. */
  const newLine = useCallback(() => {
    const streak = state.phase === 'complete' || state.missed.length === 0 ? state.streak : 0
    dispatch({ type: 'new-line', state: freshLine(course, entries, startNodeId, state.lineNo + 1, streak) })
  }, [state, course, entries, startNodeId])

  // The opponent answers after a short pause (long enough to see your own move land).
  useEffect(() => {
    if (state.phase !== 'opponent' || node.children.length === 0) return
    const timer = window.setTimeout(() => {
      const stats = readNodeStats(course.id, chapter.id)
      const reply = pickWeighted(node.children, (c) => 0.5 + 3 * weaknessOf(c, course, stats))
      const complete = reply.children.length === 0
      const streak = complete ? finishLine(course, chapter, state.missed.length === 0, state.streak) : state.streak
      playSound(complete ? 'end' : soundFor(reply.san))
      dispatch({ type: 'reply', childId: reply.id, complete, streak })
      // At the start of a line there is no move of yours to watch, so the first reply comes quickly.
    }, state.userNodeId ? 600 : 200)
    return () => window.clearTimeout(timer)
    // The reply depends on the position and the line, not on every little state change.
  }, [state.phase, state.nodeId, state.lineNo])

  /* ---- what to draw ---------------------------------------------------- */
  const userNode = state.userNodeId ? tree.nodes.get(state.userNodeId) : undefined
  const replyNode = state.replyNodeId ? tree.nodes.get(state.replyNodeId) : undefined
  const yourTurn = state.phase === 'your-turn'
  const path = useMemo(() => pathTo(tree, node.id), [tree, node.id])

  const draw = useMemo(() => {
    let arrows: BoardArrow[] = []
    let highlights: BoardHighlight[] = []
    if (yourTurn) {
      if (state.hint === 2 && mainChild) arrows = [{ from: mainChild.uci.slice(0, 2), to: mainChild.uci.slice(2, 4), color: 'blue' }]
    } else {
      // Show the drawings that belong to the move that was just played (they match its explanation).
      const shown = state.phase === 'complete' ? node : userNode
      arrows = shown?.arrows ?? []
      highlights = shown?.highlights ?? []
    }
    const hintSquares = yourTurn && state.hint >= 1 && mainChild ? [mainChild.uci.slice(0, 2)] : []
    return { arrows, highlights, hintSquares }
  }, [yourTurn, state.hint, state.phase, mainChild, node, userNode])

  return {
    state,
    chapter,
    tree,
    node,
    mainChild,
    userNode,
    replyNode,
    startedMidway,
    path,
    slips: state.missed.length,
    /** The right moves at the positions where you slipped, e.g. "4. Nf3", to revisit after the line. */
    slippedMoves: state.missed.flatMap((id) => {
      const answer = tree.nodes.get(id)?.children[0]
      return answer ? [moveLabel(answer)] : []
    }),
    interactive: yourTurn ? course.side : (false as const),
    lastMove: node.uci ? ([node.uci.slice(0, 2), node.uci.slice(2, 4)] as [string, string]) : null,
    ...draw,
    play,
    playTyped,
    hint,
    showAnswer,
    dismiss,
    newLine,
  }
}

const PIECE_NAMES: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

/**
 * One short, true sentence about a move that is not in the lesson, worked out with chess.js.
 * It only says the piece hangs when the opponent can really take it and nothing of yours guards it; otherwise
 * it just says the move is not part of the line. It never guesses.
 */
function aboutWrongMove(fen: string, uci: string): string {
  try {
    const game = new Chess(fen)
    const mv = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' })
    const me = mv.color
    const canBeTaken = game.moves({ verbose: true }).some((m) => m.to === mv.to && !!m.captured)
    const guarded = game.isAttacked(mv.to, me)
    if (mv.piece !== 'k' && !mv.captured && canBeTaken && !guarded) {
      return `After ${mv.san}, your ${PIECE_NAMES[mv.piece]} on ${mv.to} is not protected and can be taken for free.`
    }
    return `${mv.san} is not part of this line.`
  } catch {
    return ''
  }
}

/** Saves that a line was finished and returns the new streak of clean lines. */
function finishLine(course: OpeningCourse, chapter: OpeningChapter, clean: boolean, streak: number): number {
  const next = clean ? streak + 1 : 0
  recordLineComplete(course.id, chapter.id, next)
  return next
}
