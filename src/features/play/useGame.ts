// The brain of the game screen: it owns the list of moves, the clock, the computer's turns, the coach,
// hints, take-backs and the end of the game. The screen components only show what it returns.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import type { BoardMove } from '../../components/Board'
import { MATE_CP, scoreToCp } from '../../lib/evaluation'
import { playSound } from '../../lib/sound'
import { KEYS, readStored, removeStored, writeStored } from '../../lib/storage'
import { DEFAULT_PROFILE, type Side } from '../../types'
import { getCourse } from '../../data/openings'
import { BotEngine } from './BotEngine'
import { buildBook, isInBook, lessonMove, liveNodes, pickBookMove, type Book } from './book'
import { getLevel } from './botLevels'
import { fallbackMove } from './botMove'
import { describeMove, reviewUserMove, type CoachWarning } from './coach'
import { GameClock } from './GameClock'
import { buildRecord, saveRecord } from './gameRecord'
import { boardOutcome, derive, sideOf, START_FEN, timeoutOutcome } from './position'
import { CURRENT_GAME_KEY } from './session'
import { thinkTimeMs } from './thinkTime'
import { getTimeControl } from './timeControls'
import type { Outcome, SavedGame } from './types'

export type EngineStatus = 'loading' | 'ready' | 'failed'

export interface HintState {
  /** Number of moves played when the hint was asked (the hint is only valid for that position). */
  ply: number
  /** 1 = only the piece is shown, 2 = the move is shown too. */
  stage: 1 | 2
  uci: string
  san: string
  /** Name of the piece to move, e.g. 'knight'. */
  piece: string
  why: string
  fromLesson: boolean
}

export interface BookStatus {
  courseName: string
  chapterTitle: string | null
  /** The game is still inside the prepared moves. */
  inBook: boolean
  /** The game left the prepared moves. */
  left: boolean
  /** The game followed the prepared moves all the way to the end of the line. */
  ended: boolean
}

const PIECE_NAMES: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
/** After a declined draw offer the player has to wait a few moves before asking again. */
const DRAW_RETRY_PLIES = 8
/** The computer accepts a draw when it thinks it is worse by at least this many centipawns. */
const DRAW_ACCEPT_CP = 50

export function useGame(initial: SavedGame, coachOn: boolean, evalOn: boolean) {
  const { config } = initial
  const level = getLevel(config.levelId)
  const userSide = config.userSide
  const botSide: Side = userSide === 'white' ? 'black' : 'white'
  const timeControl = getTimeControl(config.timeId)

  const [ucis, setUcis] = useState<string[]>(() => derive(config.startFen, initial.ucis).ucis)
  const ucisRef = useRef(ucis)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const outcomeRef = useRef<Outcome | null>(null)
  const [viewPlyState, setViewPly] = useState<number | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [coachPrompt, setCoachPrompt] = useState<CoachWarning | null>(null)
  /** The number of moves at which the player chose "Keep it" (so the coach does not ask twice). */
  const [coachClearedAt, setCoachClearedAt] = useState(-1)
  const [hint, setHint] = useState<HintState | null>(null)
  const [hintBusy, setHintBusy] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(initial.hintsUsed)
  const [takebacks, setTakebacks] = useState(initial.takebacks)
  const [note, setNote] = useState<string | null>(null)
  const [thinking, setThinking] = useState(false)
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('loading')
  const [drawOfferedAt, setDrawOfferedAt] = useState<number | null>(null)
  const [drawBusy, setDrawBusy] = useState(false)
  const [evalWhite, setEvalWhite] = useState<number | null>(null)
  const botRef = useRef<BotEngine | null>(null)

  const [clock] = useState(
    () => new GameClock(timeControl.incrementMs, timeControl.baseMs > 0 ? (initial.clock ?? { w: timeControl.baseMs, b: timeControl.baseMs }) : null),
  )

  const derived = useMemo(() => derive(config.startFen, ucis), [config.startFen, ucis])
  const turn = sideOf(derived.chess.turn())
  const plyCount = derived.moves.length
  const viewPly = viewPlyState === null ? plyCount : Math.min(viewPlyState, plyCount)
  const isLive = viewPly === plyCount

  /* ------------------------------------------------------------ opening book */

  const book: Book | null = useMemo(() => {
    if (config.mode === 'free' || !config.courseId || config.startFen !== START_FEN) return null
    const course = getCourse(config.courseId)
    if (!course) return null
    const made = buildBook(course, config.chapterId ?? 'any', config.mode === 'practice' ? 'opponent' : 'repertoire')
    return made.trees.length > 0 ? made : null
  }, [config.mode, config.courseId, config.chapterId, config.startFen])

  const bookStatus: BookStatus | null = useMemo(() => {
    if (!book || !config.courseId) return null
    const course = getCourse(config.courseId)
    if (!course) return null
    const live = liveNodes(book, derived.ucis)
    const chapterTitle =
      live.length === 1 ? live[0].chapter.title : book.trees.length === 1 ? book.trees[0].chapter.title : null
    return {
      courseName: course.name,
      chapterTitle,
      inBook: live.length > 0,
      left: live.length === 0,
      ended: live.length > 0 && live.every((l) => l.node.children.length === 0),
    }
  }, [book, config.courseId, derived.ucis])

  /* ---------------------------------------------------------------- ending */

  const finish = useCallback(
    (result: Outcome, finalUcis: string[]) => {
      if (outcomeRef.current) return
      outcomeRef.current = result
      clock.runFor(null)
      botRef.current?.cancelMoves()
      setOutcome(result)
      setCoachPrompt(null)
      setThinking(false)
      playSound('end')
      saveRecord(buildRecord(config, finalUcis, result, readStored(KEYS.profile, DEFAULT_PROFILE)))
      removeStored(CURRENT_GAME_KEY)
    },
    [clock, config],
  )

  /* ------------------------------------------------------------ making moves */

  const applyMove = useCallback(
    (uci: string, by: 'user' | 'bot'): boolean => {
      if (outcomeRef.current) return false
      const before = ucisRef.current
      const d = derive(config.startFen, before)
      const game = d.chess
      let move
      try {
        move = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
      } catch {
        return false
      }
      const next = [...before, uci]
      ucisRef.current = next
      setUcis(next)
      setHint(null)
      if (by === 'user') {
        setNote(null)
        setViewPly(null)
      }

      // "you left the lesson" note, so the player learns what the prepared move was
      if (by === 'user' && book && config.mode === 'practice' && isInBook(book, before) && !isInBook(book, next)) {
        const lesson = lessonMove(book, before)
        if (lesson) {
          const idea = lesson.node.comment ? ` ${lesson.node.comment}` : ''
          setNote(`You left the lesson line. The lesson move here was ${lesson.node.san}.${idea} The game goes on as a normal game.`)
        }
      }

      const end = boardOutcome(game)
      if (end) {
        finish(end, next)
        return true
      }
      if (move.isKingsideCastle() || move.isQueensideCastle()) playSound('castle')
      else if (game.isCheck()) playSound('check')
      else if (move.captured) playSound('capture')
      else playSound('move')

      // clocks only start once both sides have moved, and each move earns the increment
      const nextTurn = sideOf(game.turn())
      if (next.length === 2) clock.runFor(nextTurn)
      else if (next.length > 2) clock.runFor(nextTurn, true)
      return true
    },
    [book, clock, config.mode, config.startFen, finish],
  )

  const onBoardMove = useCallback(
    (move: BoardMove): boolean => {
      if (outcomeRef.current || coachPrompt) return false
      const d = derive(config.startFen, ucisRef.current)
      if (sideOf(d.chess.turn()) !== userSide) return false
      return applyMove(move.uci, 'user')
    },
    [applyMove, coachPrompt, config.startFen, userSide],
  )

  /* ------------------------------------------------------------------ engine */

  useEffect(() => {
    const bot = new BotEngine()
    botRef.current = bot
    let alive = true
    void bot.ready().then((ok) => {
      if (alive) setEngineStatus(ok ? 'ready' : 'failed')
    })
    return () => {
      alive = false
      bot.dispose()
      if (botRef.current === bot) botRef.current = null
    }
  }, [])

  // finish a game that was saved already over, and restart the clock of a resumed game
  useEffect(() => {
    const d = derive(config.startFen, ucisRef.current)
    const end = boardOutcome(d.chess)
    if (end) {
      finish(end, d.ucis)
      return
    }
    if (d.moves.length >= 2) clock.runFor(sideOf(d.chess.turn()))
    return () => clock.runFor(null)
  }, [clock, config.startFen, finish])

  // someone's time ran out?
  useEffect(() => {
    if (outcome || !clock.enabled) return
    const timer = setInterval(() => {
      const side = clock.flagged()
      if (side) finish(timeoutOutcome(derive(config.startFen, ucisRef.current).chess, side), ucisRef.current)
    }, 200)
    return () => clearInterval(timer)
  }, [clock, config.startFen, finish, outcome])

  /* --------------------------------------------------------- the computer's turn */

  useEffect(() => {
    if (outcome || coachPrompt) return
    const bot = botRef.current
    if (!bot) return
    const d = derive(config.startFen, ucisRef.current)
    if (sideOf(d.chess.turn()) !== botSide || boardOutcome(d.chess)) return

    let cancelled = false
    void (async () => {
      setThinking(true)
      const startedAt = Date.now()
      const fenNow = d.chess.fen()
      const plies = d.ucis
      const lastMove = d.moves[d.moves.length - 1]
      const lastByUser = lastMove !== undefined && sideOf(lastMove.color) === userSide

      // 1. the coach looks at the player's last move (not while it is still a known lesson move)
      const knownLesson = book !== null && isInBook(book, plies)
      if (coachOn && lastByUser && coachClearedAt !== plies.length && !knownLesson) {
        const warning = await reviewUserMove(bot, d.fens[d.fens.length - 2], fenNow)
        if (cancelled) return
        if (warning) {
          clock.runFor(null) // nobody loses time while the player decides
          setCoachPrompt(warning)
          setThinking(false)
          return
        }
      }

      // 2. a prepared opening move, otherwise the engine
      const bookNode = book ? pickBookMove(book, plies) : null
      let uci: string | null = bookNode?.uci ?? null
      let gapCp: number | null = null
      if (!uci) {
        const choice = await bot.choose(fenNow, level)
        if (cancelled) return
        uci = choice?.uci ?? null
        gapCp = choice && choice.secondCp !== null ? choice.bestCp - choice.secondCp : null
      }
      if (!uci) {
        setThinking(false)
        return
      }

      // 3. think for a human-looking while
      const wait =
        thinkTimeMs({
          legalMoves: d.chess.moves().length,
          gapCp,
          inBook: bookNode !== null,
          clockMs: clock.enabled ? clock.remaining(botSide) : null,
          incrementMs: timeControl.incrementMs,
        }) -
        (Date.now() - startedAt)
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
      if (cancelled) return
      setThinking(false)
      if (!applyMove(uci, 'bot')) {
        // should never happen, but a game must never get stuck: play a simple move instead
        const backup = fallbackMove(fenNow)
        if (backup) applyMove(backup, 'bot')
      }
    })()

    return () => {
      cancelled = true
      bot.cancelMoves()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ucis.length, outcome, coachPrompt, coachClearedAt, coachOn])

  // while the player thinks, warm up the analysis so the coach and hints answer instantly
  useEffect(() => {
    if (outcome || turn !== userSide || !coachOn) return
    void botRef.current?.analyse(derived.chess.fen())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ucis.length, outcome, coachOn])

  /* ------------------------------------------------------------- saving */

  const persist = useCallback(() => {
    if (outcomeRef.current || ucisRef.current.length === 0) return
    const saved: SavedGame = {
      config,
      ucis: ucisRef.current,
      clock: clock.snapshot(),
      hintsUsed,
      takebacks,
    }
    writeStored(CURRENT_GAME_KEY, saved)
  }, [clock, config, hintsUsed, takebacks])

  const persistRef = useRef(persist)
  persistRef.current = persist
  useEffect(() => {
    persist()
  }, [persist, ucis])
  useEffect(() => {
    const save = () => persistRef.current()
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', save)
    return () => {
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', save)
      save()
    }
  }, [])

  /* ---------------------------------------------------------------- buttons */

  const takeBack = useCallback(() => {
    if (outcomeRef.current) return
    const d = derive(config.startFen, ucisRef.current)
    let keep = -1
    for (let i = d.moves.length - 1; i >= 0; i--) {
      if (sideOf(d.moves[i].color) === userSide) {
        keep = i
        break
      }
    }
    if (keep < 0) return
    const next = ucisRef.current.slice(0, keep)
    botRef.current?.cancelMoves()
    ucisRef.current = next
    setUcis(next)
    setViewPly(null)
    setHint(null)
    setNote(null)
    setCoachPrompt(null)
    setCoachClearedAt(-1)
    setThinking(false)
    setTakebacks((t) => t + 1)
    clock.runFor(next.length >= 2 ? userSide : null)
  }, [clock, config.startFen, userSide])

  const keepMove = useCallback(() => {
    setCoachPrompt(null)
    setCoachClearedAt(ucisRef.current.length)
    if (ucisRef.current.length >= 2) clock.runFor(botSide)
  }, [botSide, clock])

  const resign = useCallback(() => {
    finish({ result: userSide === 'white' ? '0-1' : '1-0', reason: 'resign' }, ucisRef.current)
  }, [finish, userSide])

  const requestHint = useCallback(async () => {
    const bot = botRef.current
    const d = derive(config.startFen, ucisRef.current)
    if (!bot || outcomeRef.current || sideOf(d.chess.turn()) !== userSide || hintBusy) return
    const ply = d.moves.length
    if (hint && hint.ply === ply) {
      if (hint.stage === 1) setHint({ ...hint, stage: 2 })
      return
    }
    setHintBusy(true)
    const fen = d.chess.fen()
    let uci: string | undefined
    let why = ''
    let fromLesson = false
    const lesson = book && config.mode === 'practice' ? lessonMove(book, d.ucis) : null
    if (lesson) {
      uci = lesson.node.uci
      why = lesson.node.comment || 'This is the move from your lesson.'
      fromLesson = true
    } else {
      const result = await bot.analyse(fen)
      uci = result?.lines[0]?.pv[0] ?? result?.bestMove ?? undefined
      if (uci) why = describeMove(fen, uci)
    }
    setHintBusy(false)
    if (ucisRef.current.length !== ply || outcomeRef.current) return // the position changed meanwhile
    if (!uci) {
      setNote('Sorry, I could not find a hint right now. Try again in a moment.')
      return
    }
    const game = new Chess(fen)
    const piece = game.get(uci.slice(0, 2) as Square)
    const san = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san
    setHint({ ply, stage: 1, uci, san, piece: PIECE_NAMES[piece?.type ?? 'p'], why, fromLesson })
    setHintsUsed((h) => h + 1)
  }, [book, config.mode, config.startFen, hint, hintBusy, userSide])

  const offerDraw = useCallback(async () => {
    const bot = botRef.current
    if (!bot || outcomeRef.current || drawBusy) return
    const d = derive(config.startFen, ucisRef.current)
    if (sideOf(d.chess.turn()) !== userSide) return
    if (drawOfferedAt !== null && d.moves.length < drawOfferedAt + DRAW_RETRY_PLIES) {
      setNote('You asked just now. Play a few more moves before offering a draw again.')
      return
    }
    setDrawBusy(true)
    const result = await bot.analyse(d.chess.fen())
    setDrawBusy(false)
    if (ucisRef.current.length !== d.moves.length || outcomeRef.current) return
    // the analysis is from the player's side; the computer is the other one
    const botCp = result?.lines[0] ? -scoreToCp(result.lines[0]) : 0
    if (result && botCp <= -DRAW_ACCEPT_CP) {
      finish({ result: '1/2-1/2', reason: 'agreed' }, ucisRef.current)
    } else {
      setDrawOfferedAt(d.moves.length)
      setNote('The bot says no thanks. It thinks it is doing fine, so the game goes on.')
    }
  }, [config.startFen, drawBusy, drawOfferedAt, finish, userSide])

  /* ------------------------------------------------------------- navigation */

  const goTo = useCallback(
    (ply: number) => {
      const clamped = Math.max(0, Math.min(ply, ucisRef.current.length))
      setViewPly(clamped >= ucisRef.current.length ? null : clamped)
    },
    [],
  )
  const step = useCallback(
    (delta: number) => {
      setViewPly((current) => {
        const n = ucisRef.current.length
        const now = current === null ? n : Math.min(current, n)
        const next = Math.max(0, Math.min(n, now + delta))
        return next >= n ? null : next
      })
    },
    [],
  )

  /* ------------------------------------------------------------ evaluation bar */

  const viewFen = derived.fens[viewPly]
  useEffect(() => {
    if (!evalOn) return
    let stale = false
    void (async () => {
      const probe = new Chess(viewFen)
      if (probe.isCheckmate()) {
        setEvalWhite(probe.turn() === 'w' ? -MATE_CP : MATE_CP)
        return
      }
      if (probe.isGameOver()) {
        setEvalWhite(0)
        return
      }
      const result = await botRef.current?.analyse(viewFen)
      if (stale || !result?.lines[0]) return
      const cp = scoreToCp(result.lines[0])
      setEvalWhite(probe.turn() === 'w' ? cp : -cp)
    })()
    return () => {
      stale = true
    }
  }, [evalOn, viewFen])

  return {
    config,
    level,
    userSide,
    botSide,
    timeControl,
    clock,
    derived,
    ucis,
    turn,
    plyCount,
    viewPly,
    viewFen,
    isLive,
    outcome,
    flipped,
    orientation: (flipped ? botSide : userSide) as Side,
    thinking,
    engineStatus,
    coachPrompt,
    hint,
    hintBusy,
    hintsUsed,
    takebacks,
    note,
    dismissNote: () => setNote(null),
    book,
    bookStatus,
    evalWhite,
    drawBusy,
    drawBlocked: drawOfferedAt !== null && plyCount < drawOfferedAt + DRAW_RETRY_PLIES,
    canInteract: !outcome && isLive && turn === userSide && !coachPrompt,
    canTakeBack: !outcome && derived.moves.some((m) => sideOf(m.color) === userSide),
    canAskHint: !outcome && isLive && turn === userSide && !coachPrompt && engineStatus !== 'failed',
    onBoardMove,
    takeBack,
    keepMove,
    resign,
    requestHint,
    offerDraw,
    flip: () => setFlipped((f) => !f),
    goTo,
    step,
  }
}

export type GameApi = ReturnType<typeof useGame>
