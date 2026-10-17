import { useEffect, useState } from 'react'
import type { SafetyCard, SafetyCardFile, SafetyEval, SafetyFact, SafetyMoveEntry, SafetyPiece, SafetyTopMove } from '../../types'
import { playUci } from './positions'

// Loads the Safety-check cards (public/data/safety/cards.json, rebuilt by the daily job from his Lichess games).
// The file is only asked for once the study gate is open: before that nobody may see the positions, and the
// locked page must not even download them. A damaged card is left out rather than breaking the page.

const BASE_URL: string = import.meta.env?.BASE_URL ?? '/'
export const CARDS_URL = `${BASE_URL}data/safety/cards.json`

const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/
const SQUARE = /^[a-h][1-8]$/
const PIECES = new Set(['p', 'n', 'b', 'r', 'q', 'k'])

function asObject(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
}
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isUciList = (v: unknown): v is string[] => Array.isArray(v) && v.every((m) => isStr(m) && UCI.test(m))
const isStrList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr)

function cleanEval(v: unknown): SafetyEval | null {
  const o = asObject(v)
  if (o && Number.isInteger(o.cp)) return { cp: o.cp as number }
  if (o && Number.isInteger(o.mate)) return { mate: o.mate as number }
  return null
}

function cleanTop(v: unknown): SafetyTopMove | null {
  const o = asObject(v)
  const ev = cleanEval(o?.eval)
  if (!o || !ev || !isStr(o.uci) || !UCI.test(o.uci) || !isStr(o.san) || !isNum(o.win) || !isUciList(o.pv)) return null
  return { uci: o.uci, san: o.san, win: o.win, eval: ev, pv: o.pv }
}

/** One entry of a held or quiet card's `moves`; a move more than 4 points below the best must carry its line and verdict. */
function cleanMoveEntry(v: unknown): SafetyMoveEntry | null {
  const o = asObject(v)
  const ev = cleanEval(o?.eval)
  if (!o || !ev || !isStr(o.uci) || !UCI.test(o.uci)) return null
  if (o.safe === undefined) return { uci: o.uci, eval: ev }
  if (typeof o.safe !== 'boolean' || !isUciList(o.line) || o.line[0] !== o.uci) return null
  return { uci: o.uci, eval: ev, line: o.line, gain: Number.isInteger(o.gain) ? (o.gain as number) : null, safe: o.safe }
}

function cleanWins(v: unknown): { piece: SafetyPiece; square: string } | undefined {
  const o = asObject(v)
  return o && isStr(o.piece) && PIECES.has(o.piece) && isStr(o.square) && SQUARE.test(o.square)
    ? { piece: o.piece as SafetyPiece, square: o.square }
    : undefined
}

/** A fact the app knows how to say; unknown or damaged facts are dropped (the card itself stays). */
function cleanFact(v: unknown): SafetyFact | null {
  const o = asObject(v)
  if (!o) return null
  const mateIn = Number.isInteger(o.mateIn) && (o.mateIn as number) > 0 ? (o.mateIn as number) : undefined
  const gain = Number.isInteger(o.gain) ? (o.gain as number) : undefined
  const line = isUciList(o.line) ? o.line : []
  const lineSan = isStrList(o.lineSan) ? o.lineSan : []
  switch (o.t) {
    case 'quiet':
      return { t: 'quiet' }
    case 'threat':
      return isStr(o.reply) ? { t: 'threat', reply: o.reply, line, lineSan, wins: cleanWins(o.wins), mateIn, gain } : null
    case 'allowed':
      return isStr(o.reply) && isStr(o.move)
        ? { t: 'allowed', move: o.move, reply: o.reply, line, lineSan, wins: cleanWins(o.wins), mateIn, gain }
        : null
    case 'free': {
      const wins = cleanWins(o)
      return wins && gain !== undefined ? { t: 'free', piece: wins.piece, square: wins.square, line, lineSan, gain } : null
    }
    default:
      return null
  }
}

/** One card, checked field by field; null when anything the trainer needs is missing. */
export function cleanCard(v: unknown): SafetyCard | null {
  const o = asObject(v)
  if (!o) return null
  const kind = o.kind
  if (kind !== 'own' && kind !== 'held' && kind !== 'quiet') return null
  if (!isStr(o.id) || !isStr(o.fenBefore) || !isStr(o.lastMove) || !UCI.test(o.lastMove) || !isStr(o.lastMoveSan)) return null
  if (o.side !== 'white' && o.side !== 'black') return null
  const top = Array.isArray(o.top) ? o.top.map(cleanTop) : []
  if (top.length === 0 || top.length > 5 || top.some((t) => t === null)) return null
  const h = asObject(o.human)
  const humanEval = cleanEval(h?.eval)
  if (!h || !humanEval || !isStr(h.uci) || !UCI.test(h.uci) || !isStr(h.san) || !isNum(h.win)) return null
  const c = asObject(o.context)
  if (!c || !isStr(c.gameId) || !isStr(c.date) || !isStr(c.tc)) return null
  const judgment = (j: unknown) => (j === 'Inaccuracy' || j === 'Mistake' || j === 'Blunder' ? j : null)
  const t = asObject(o.threat)
  const phase = o.phase === 'opening' || o.phase === 'endgame' ? o.phase : 'middlegame'
  // held and quiet cards list every legal move; a damaged list leaves the card out rather than judging it another way
  let moves: SafetyMoveEntry[] | undefined
  if (kind !== 'own' && o.moves !== undefined) {
    const list = Array.isArray(o.moves) ? o.moves.map(cleanMoveEntry) : [null]
    if (list.length === 0 || list.some((m) => m === null)) return null
    moves = list as SafetyMoveEntry[]
  }
  return {
    id: o.id,
    kind,
    cls: isStr(o.cls) ? o.cls : kind,
    fenBefore: o.fenBefore,
    lastMove: o.lastMove,
    lastMoveSan: o.lastMoveSan,
    side: o.side,
    phase,
    facingThreat: o.facingThreat === true,
    nothingToWin: o.nothingToWin === true,
    wasWinning: o.wasWinning === true,
    winBefore: isNum(o.winBefore) ? o.winBefore : 50,
    top: top as SafetyTopMove[],
    topComplete: o.topComplete === true,
    ...(moves ? { moves } : {}),
    human: {
      uci: h.uci,
      san: h.san,
      win: h.win,
      eval: humanEval,
      passes: h.passes === true,
      judgment: judgment(h.judgment),
      lichessJudgment: judgment(h.lichessJudgment),
      drop: isNum(h.drop) ? h.drop : 0,
    },
    threat:
      t && isNum(t.loss)
        ? {
            loss: t.loss,
            material: isNum(t.material) ? t.material : 0,
            mateIn: Number.isInteger(t.mateIn) ? (t.mateIn as number) : null,
            real: t.real === true,
            line: isUciList(t.line) ? t.line : [],
            lineSan: isStrList(t.lineSan) ? t.lineSan : [],
          }
        : null,
    facts: (Array.isArray(o.facts) ? o.facts.map(cleanFact) : []).filter((f): f is SafetyFact => f !== null),
    context: {
      gameId: c.gameId,
      date: c.date,
      tc: c.tc,
      speed: isStr(c.speed) ? c.speed : '',
      rated: c.rated === true,
      moveNumber: Number.isInteger(c.moveNumber) ? (c.moveNumber as number) : 0,
      clockMs: isNum(c.clockMs) ? c.clockMs : null,
      spentMs: isNum(c.spentMs) ? c.spentMs : null,
    },
  }
}

/** The whole file, checked; throws a plain-English error when it cannot be used at all. */
export function cleanCardFile(v: unknown): SafetyCardFile {
  const o = asObject(v)
  if (!o || o.version !== 1 || !Array.isArray(o.cards)) throw new Error('The position file is not in the expected format.')
  const seen = new Set<string>()
  const cards: SafetyCard[] = []
  for (const raw of o.cards) {
    const card = cleanCard(raw)
    // his opponent's last move must be playable, or there is no position to answer
    if (card && !seen.has(card.id) && playUci(card.fenBefore, card.lastMove)) {
      seen.add(card.id)
      cards.push(card)
    }
  }
  return {
    version: 1,
    generatedAt: isStr(o.generatedAt) ? o.generatedAt : '',
    pipeline: isStr(o.pipeline) ? o.pipeline : '',
    source: isStr(o.source) ? o.source : '',
    cards,
  }
}

let loading: Promise<SafetyCardFile> | null = null

/** Fetches the card file once per page session (a failed attempt may be retried). */
export function loadSafetyCards(): Promise<SafetyCardFile> {
  if (!loading) {
    loading = fetch(CARDS_URL, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`The positions could not be loaded (the site answered ${res.status}).`)
        return res.json()
      })
      .then(cleanCardFile)
      .catch((e: unknown) => {
        loading = null
        throw e instanceof Error && e.message.startsWith('The ')
          ? e
          : new Error('The positions could not be loaded. Check your internet connection and try again.')
      })
  }
  return loading
}

export type CardsStatus =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; file: SafetyCardFile }
  | { status: 'error'; message: string }

/** React: the card file, fetched only while `enabled` (the gate is open). `retry` asks again after an error. */
export function useSafetyCards(enabled: boolean): CardsStatus & { retry: () => void } {
  const [state, setState] = useState<CardsStatus>({ status: 'idle' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' })
      return
    }
    let live = true
    setState({ status: 'loading' })
    loadSafetyCards().then(
      (file) => live && setState({ status: 'ready', file }),
      (e: unknown) => live && setState({ status: 'error', message: e instanceof Error ? e.message : String(e) }),
    )
    return () => {
      live = false
    }
  }, [enabled, attempt])
  return { ...state, retry: () => setAttempt((n) => n + 1) }
}
