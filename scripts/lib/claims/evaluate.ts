// Judges parsed claims against the board position(s) the text belongs to.
// Verdicts: 'true', 'false', 'could-not-parse'. A claim is only 'false' when every reasonable reading of it
// is false on the board; any doubt about what the sentence means gives 'could-not-parse'.
import { Chess } from 'chess.js'
import {
  Board,
  VALUE,
  NAME,
  opp,
  attacks,
  attackersOf,
  attackersWithXray,
  pinsOf,
  see,
  material,
  materialDiff,
  trappedInfo,
  checkersOf,
  isLightSquare,
  gameFor,
  sqFile,
  sqRank,
  type Color,
  type Piece,
  type PieceType,
} from './board'
import type { ClaimBody, MoveTok, ParsedClaim, Ref } from './parse'
import type { LinePos, TextUnit } from './units'
import type { UciEngine } from './engine'

export type Verdict = 'true' | 'false' | 'could-not-parse'

export interface ClaimResult {
  verdict: Verdict
  /** short machine label of the claim, e.g. "attacks(knight on d4 -> queen)" */
  claim: string
  /** why: the board fact that decided it, or why it could not be judged */
  reason: string
  /** which position was used: "after 7...Nxd4" etc. */
  position?: string
  fen?: string
  /** 'high' for plain board facts; 'medium' when the judgement uses a rule of thumb (trapped, safe, material via engine) */
  confidence?: 'high' | 'medium'
}

interface Pos {
  fen: string
  board: Board
  /** move that led here (if known) */
  move?: { san: string; from: string; to: string; mover: Color; piece: PieceType; captured?: PieceType; before: string }
  label: string
  hypothetical: boolean
  /** index in unit.line when the position is on the written line */
  idx?: number
}

export interface EvalContext {
  unit: TextUnit
  engine: UciEngine | null
  /** piece/move references mentioned in this unit so far (reading order), for pronouns */
  history: { ref: Ref; sentence: number; pos: number }[]
  sentenceIndex: number
  /** reference ids of the current sentence in reading order */
  currentOrder: number[]
  /** moves carried over from the previous sentence (this sentence starts with "Now" / "Then") */
  carry: MoveTok[]
  /** earlier sentences of this text played moves or described moves in words */
  priorStory: boolean
}

const stripSan = (s: string) => s.replace(/[+#!?]/g, '').replace(/^\d+\.(\.\.)?\s?/, '').replace(/^\.\.\./, '')
const sameSan = (a: string, b: string) => stripSan(a) === stripSan(b)
/** does the written move (SAN or long notation) match this move on the line? */
const sameMove = (lp: LinePos, written: string) => (isLong(written) ? `${lp.from}${lp.to}` === written : sameSan(lp.san, written))

const isLong = (s: string) => /^[a-h][1-8][a-h][1-8]$/.test(s)
const playOne = (g: Chess, san: string) => (isLong(san) ? g.move({ from: san.slice(0, 2), to: san.slice(2, 4), promotion: 'q' }) : g.move(stripSan(san)))

function moveInfo(beforeFen: string, san: string): Pos['move'] | null {
  try {
    const g = new Chess(beforeFen)
    const m = playOne(g, san)
    return { san: m.san, from: m.from, to: m.to, mover: m.color, piece: m.piece as PieceType, captured: m.captured as PieceType | undefined, before: beforeFen }
  } catch {
    return null
  }
}

function playSeq(fen: string, sans: string[]): { fen: string; move: Pos['move'] } | null {
  let cur = fen
  let last: Pos['move'] | null = null
  for (const s of sans) {
    const mi = moveInfo(cur, s)
    if (!mi) return null
    const g = new Chess(cur)
    playOne(g, s)
    cur = g.fen()
    last = mi
  }
  return last ? { fen: cur, move: last } : null
}

function posFromLine(unit: TextUnit, i: number, hypothetical = false): Pos {
  const lp: LinePos = unit.line[i]
  let move: Pos['move']
  if (i > 0 && lp.san) move = moveInfo(unit.line[i - 1].fen, lp.san) ?? undefined
  return { fen: lp.fen, board: new Board(lp.fen), move, label: lp.san ? `after ${lp.san}` : 'diagram', hypothetical, idx: i }
}

/** Default positions a claim without written moves can refer to. */
function defaultPositions(unit: TextUnit): Pos[] {
  if (!unit.line.length) return []
  const last = unit.line.length - 1
  let idxs: number[]
  if (unit.kind === 'exercise-explanation') idxs = unit.line.map((_, i) => i) // the explanation walks the whole line
  else if (unit.kind === 'exercise-hint') idxs = [0, Math.min(1, last)] // the start, or right after the move it hints at
  else if (unit.kind === 'example-step') idxs = [unit.focus, unit.focus - 1] // after this move, or the reason for it
  else idxs = [unit.focus]
  const out = Array.from(new Set(idxs.filter((i) => i >= 0 && i <= last))).map((i) => posFromLine(unit, i))
  // a diagram with an arrow often describes the position after the arrowed move
  for (const lp of unit.extra ?? []) {
    const mv = moveInfo(unit.line[0].fen, lp.san)
    if (mv) out.push({ fen: lp.fen, board: new Board(lp.fen), move: mv, label: `after the arrow move ${lp.san}`, hypothetical: true })
  }
  return out
}

interface Anchoring {
  positions: Pos[]
  problem?: string
  /** the moves were replayed by the checker from a position on the line (not found on the line itself) */
  replayed: boolean
}

/** Where the moves written in a sentence lead. `carry` holds moves from the previous sentence ("Then ...", "Now ..."). */
function anchoredPositions(unit: TextUnit, moves: MoveTok[], carry: MoveTok[]): Anchoring {
  const seq = [...carry, ...moves]
  if (!seq.length) return { positions: defaultPositions(unit), replayed: false }
  const last = seq[seq.length - 1]
  // 1. the moves are on the written line: match as many trailing moves as possible
  let bestK = 0
  let hits: number[] = []
  unit.line.forEach((lp, i) => {
    if (i === 0 || !lp.san || !sameMove(lp, last.san)) return
    let k = 1
    while (k < seq.length && i - k >= 1 && sameMove(unit.line[i - k], seq[seq.length - 1 - k].san)) k++
    if (k > bestK) {
      bestK = k
      hits = [i]
    } else if (k === bestK) hits.push(i)
  })
  if (hits.length) return { positions: hits.map((i) => posFromLine(unit, i)), replayed: false }
  // 2. the moves can be played from a position on the line (a side line written in the text)
  const order = unit.line.map((_, i) => i)
  order.sort((a, b) => {
    const da = a >= unit.focus ? a - unit.focus : 100 + unit.focus - a
    const db = b >= unit.focus ? b - unit.focus : 100 + unit.focus - b
    return da - db
  })
  // with carried moves the whole story must replay; otherwise a later part of the sentence may start fresh
  const starts = carry.length ? [0] : seq.map((_, i) => i)
  for (const start of starts) {
    const sans = seq.slice(start).map((m) => m.san)
    for (const i of order) {
      const r = playSeq(unit.line[i].fen, sans)
      if (r) {
        const from = unit.line[i].san ? `after ${unit.line[i].san}` : 'the diagram'
        return { positions: [{ fen: r.fen, board: new Board(r.fen), move: r.move, label: `after ${sans.join(' ')} (played from ${from})`, hypothetical: true }], replayed: true }
      }
    }
  }
  // 3. the (last) move was already played: the diagram shows the position after it
  {
    const f = posFromLine(unit, unit.focus)
    if (isLong(last.san)) {
      const p = f.board.at(last.san.slice(2, 4))
      if (p && p.color !== f.board.turn && !f.board.at(last.san.slice(0, 2))) return { positions: [{ ...f, label: `diagram (already after ${last.raw})` }], replayed: false }
    }
    const m = /^([KQRBN])?.*?([a-h][1-8])(=[QRBN])?$/.exec(stripSan(last.san))
    if (m && !isLong(last.san)) {
      const p = f.board.at(m[2])
      const want = (m[1] ?? 'P').toLowerCase()
      if (p && p.type === want && p.color !== f.board.turn) return { positions: [{ ...f, label: `diagram (already after ${last.san})` }], replayed: false }
    }
  }
  return { positions: [], replayed: false, problem: `the moves ${seq.map((m) => m.raw.trim()).join(' ')} cannot be replayed from this line` }
}

/* ------------------------------------------------------------------------------------------------ */
/* resolving references                                                                              */

interface Resolved {
  pieces: Piece[]
  square?: string
  /** an explicit square that holds the wrong piece / nothing */
  missing?: string
  ambiguous?: boolean
}

function ownerColor(owner: Ref['owner'], unit: TextUnit, roleColor?: Color): Color | null {
  if (owner === 'w' || owner === 'b') return owner
  if (owner === 'you') return unit.you
  if (owner === 'opp') return unit.you ? opp(unit.you) : null
  return roleColor ?? null
}

function resolve(ref: Ref, pos: Pos, ctx: EvalContext, roleColor?: Color, beforeBoard?: Board): Resolved[] {
  const b = beforeBoard ?? pos.board
  const unit = ctx.unit
  switch (ref.kind) {
    case 'move': {
      if (!pos.move) return [{ pieces: [] }]
      const p = pos.board.at(pos.move.to)
      return [{ pieces: p ? [p] : [] }]
    }
    case 'mover' as Ref['kind']: {
      if (!pos.move) return [{ pieces: [] }]
      const p = pos.board.at(pos.move.to)
      return [{ pieces: p ? [p] : [] }, { pieces: pos.board.pieces({ color: pos.move.mover }) }]
    }
    case 'color': {
      const c = ownerColor(ref.owner, unit)
      if (!c) return [{ pieces: [], ambiguous: true }]
      const mv = pos.move && pos.move.mover === c ? pos.board.at(pos.move.to) : null
      const all = pos.board.pieces({ color: c })
      return mv ? [{ pieces: [mv] }, { pieces: all }] : [{ pieces: all }]
    }
    case 'square': {
      const p = b.at(ref.square!)
      return [{ pieces: p ? [p] : [], square: ref.square }]
    }
    case 'piece': {
      const color = ownerColor(ref.owner, unit, roleColor)
      if (ref.square) {
        // "the d7-knight" written under ...Ndf6: the piece that just left that square
        if (!beforeBoard && pos.move && ref.square === pos.move.from) {
          const moved = pos.board.at(pos.move.to)
          if (moved && (!ref.type || ref.type === 'any' || moved.type === ref.type)) return [{ pieces: [moved], square: pos.move.to }]
        }
        const p = b.at(ref.square)
        const want = ref.type && ref.type !== 'any' ? NAME[ref.type] : 'piece'
        if (!p) return [{ pieces: [], missing: `there is no ${want} on ${ref.square}` }]
        if (ref.type && ref.type !== 'any' && p.type !== ref.type) return [{ pieces: [], missing: `${ref.square} holds a ${NAME[p.type]}, not a ${want}` }]
        if ((ref.owner === 'w' || ref.owner === 'b' || (ref.owner === 'you' && unit.you) || (ref.owner === 'opp' && unit.you)) && color && p.color !== color)
          return [{ pieces: [], missing: `the ${want} on ${ref.square} belongs to the other side` }]
        return [{ pieces: [p], square: ref.square }]
      }
      let cands = b.pieces({}).filter((p) => !ref.type || ref.type === 'any' || p.type === ref.type)
      if (ref.type === 'any') cands = cands.filter((p) => p.type !== 'k' && p.type !== 'p')
      if (color) cands = cands.filter((p) => p.color === color)
      if (ref.file) cands = cands.filter((p) => p.square[0] === ref.file)
      if (ref.shade) cands = cands.filter((p) => (isLightSquare(p.square) ? 'light' : 'dark') === ref.shade)
      if (ref.both || ref.plural || (ref.count && ref.count > 1)) return [{ pieces: cands }]
      // prefer the piece that just moved, then the others one by one
      const mv = pos.move ? b.at(beforeBoard ? pos.move.from : pos.move.to) : null
      const out: Resolved[] = []
      if (mv && cands.some((p) => p.square === mv.square)) out.push({ pieces: [mv] })
      for (const p of cands) if (!mv || p.square !== mv.square) out.push({ pieces: [p], ambiguous: cands.length > 1 })
      return out.length ? out : [{ pieces: [], ambiguous: true }]
    }
    case 'pronoun': {
      // the parser has worked out what "it" points back to; with nothing named before, it is the piece just moved
      const out: Resolved[] = []
      for (const a of ref.antecedents ?? []) out.push(...resolve(a, pos, ctx, roleColor, beforeBoard).filter((r) => r.pieces.length))
      // the piece just moved is always a possible reading of a subject "it"; an object "it" needs something named before
      if (pos.move && (ref.pronounRole !== 'object' || !out.length) && !(ref.pronounRole === 'object' && !(ref.antecedents ?? []).length)) {
        const p = pos.board.at(pos.move.to)
        if (p) out.push({ pieces: [p] })
      }
      return out.length ? out : [{ pieces: [], ambiguous: true }]
    }
    default:
      return [{ pieces: [], ambiguous: true }]
  }
}

const describe = (r: Ref) => (r.kind === 'move' ? r.move?.raw.trim() ?? 'move' : r.raw)
const pieceName = (p: Piece) => `${p.color === 'w' ? 'white' : 'black'} ${NAME[p.type]} on ${p.square}`

/* ------------------------------------------------------------------------------------------------ */
/* the board tests                                                                                   */

function attacksOrXray(b: Board, s: Piece, target: string): boolean {
  if (attacks(b, s, target)) return true
  // a battery: the attacker stands behind its own slider on the same line
  return attackersWithXray(b, target, s.color).some((p) => p.square === s.square)
}

function aligned(s: Piece, target: string): boolean {
  const df = sqFile(target) - sqFile(s.square)
  const dr = sqRank(target) - sqRank(s.square)
  if (df === 0 && dr === 0) return false
  const diag = Math.abs(df) === Math.abs(dr)
  const ortho = df === 0 || dr === 0
  if (s.type === 'b') return diag
  if (s.type === 'r') return ortho
  if (s.type === 'q') return diag || ortho
  return false
}

/** defenders that can really take back: not pinned off the line, and a king only if the square is then safe */
function effectiveDefenders(b: Board, sq: string): Piece[] {
  const target = b.at(sq)
  if (!target) return []
  const defs = attackersOf(b, sq, target.color)
  const enemyCount = attackersWithXray(b, sq, opp(target.color)).length
  return defs.filter((d) => {
    if (d.type === 'k') return enemyCount <= 1
    const pins = pinsOf(b, d.square).filter((p) => p.absolute)
    if (!pins.length) return true
    // moving along the pin line (towards the pinner) is still legal
    return pins.every((p) => p.pinner.square === sq)
  })
}

/** Best material gain for `by` from a legal first capture on `sq` followed by best exchanges. */
function captureGain(fen: string, sq: string, by: Color): number | null {
  const b = new Board(fen)
  const target = b.at(sq)
  if (!target || target.color === by) return null
  const g = gameFor(fen, by)
  if (!g) return null
  let best = -Infinity
  for (const m of g.moves({ verbose: true })) {
    if (m.to !== sq) continue
    const after = new Board(m.after)
    const back = Math.max(0, see(after, sq, opp(by)))
    best = Math.max(best, VALUE[target.type] - back)
  }
  return best === -Infinity ? null : best
}

type Test = { ok: boolean | null; why: string; confidence?: 'high' | 'medium' }

function testBody(body: ClaimBody, pos: Pos, ctx: EvalContext, flags: { beforeAlso: boolean }): { results: Test[]; missing?: string } {
  const b = pos.board
  const results: Test[] = []
  let missing: string | undefined
  const R = (ref: Ref, role?: Color, onBefore = false) => {
    const before = onBefore && pos.move ? new Board(pos.move.before) : undefined
    const rs = resolve(ref, pos, ctx, role, before)
    for (const r of rs) if (r.missing) missing = r.missing
    return rs
  }
  switch (body.kind) {
    case 'covers': {
      // "the rook covers a1": a square is covered even through the enemy piece that would have to go there
      for (const o of body.objs)
        for (const s of R(body.subj))
          for (const sp of s.pieces) {
            const t = o.square
            if (!t) continue
            let ok = attacks(b, sp, t)
            if (!ok)
              for (const e of b.pieces({ color: opp(sp.color) }))
                if (attacks(b, sp, t, new Set([e.square]))) {
                  ok = true
                  break
                }
            results.push({ ok: body.neg ? !ok : ok, why: `${pieceName(sp)} ${ok ? 'covers' : 'does not cover'} ${t}` })
          }
      break
    }
    case 'attacks':
    case 'aims': {
      const subs = R(body.subj)
      // "attacked by two pawns": enough pieces of that kind must attack
      if (body.kind === 'attacks' && body.subj.kind === 'piece' && body.subj.count && body.subj.count > 1) {
        const all = subs.flatMap((r) => r.pieces)
        for (const o of body.objs)
          for (const or of R(o))
            for (const op of or.pieces) {
              const n = all.filter((sp) => sp.color !== op.color && attacks(b, sp, op.square)).length
              results.push({ ok: n >= body.subj.count!, why: `${n} ${body.subj.raw} attack the ${pieceName(op)}` })
            }
        break
      }
      for (const o of body.objs) {
        for (const s of subs) {
          for (const sp of s.pieces) {
            const objs = R(o, opp(sp.color))
            for (const or of objs) {
              const targets = or.square && !or.pieces.length ? [or.square] : or.pieces.map((p) => p.square)
              for (const t of targets) {
                const tp = b.at(t)
                if (tp && tp.color === sp.color && body.kind === 'attacks') continue
                if (body.kind === 'aims') {
                  const ok = sp.type === 'n' || sp.type === 'p' || sp.type === 'k' ? attacks(b, sp, t) : aligned(sp, t)
                  results.push({ ok, why: `${pieceName(sp)} ${ok ? 'is' : 'is not'} lined up with ${t}` })
                } else {
                  const ok = attacksOrXray(b, sp, t)
                  results.push({ ok: body.neg ? !ok : ok, why: `${pieceName(sp)} ${ok ? 'attacks' : 'does not attack'} ${t}` })
                }
              }
            }
          }
        }
      }
      break
    }
    case 'defends': {
      const subs = body.subj.kind === 'nothing' ? [] : R(body.subj)
      if (body.subj.kind === 'nothing') {
        // "no pawn guards it"
        for (const o of body.objs)
          for (const or of R(o))
            for (const op of or.pieces) {
              const defs = attackersOf(b, op.square, op.color).filter((d) => !body.subj.type || body.subj.type === 'any' || d.type === body.subj.type)
              results.push({ ok: defs.length === 0, why: defs.length ? `${pieceName(op)} is guarded by ${defs.map(pieceName).join(', ')}` : `nothing of that kind guards ${op.square}` })
            }
        break
      }
      for (const o of body.objs)
        for (const s of subs)
          for (const sp of s.pieces) {
            const objs = R(o, sp.color)
            for (const or of objs) {
              const targets = or.square && !or.pieces.length ? [or.square] : or.pieces.map((p) => p.square)
              for (const t of targets) {
                const tp = b.at(t)
                if (tp && tp.color !== sp.color) continue
                if (t === sp.square) continue
                const ok = attacksOrXray(b, sp, t)
                if (body.neg) {
                  if (!ok) results.push({ ok: true, why: `${pieceName(sp)} does not guard ${t}` })
                  else {
                    const pinned = pinsOf(b, sp.square).some((p) => p.absolute && p.pinner.square !== t)
                    results.push({ ok: pinned ? null : false, why: `${pieceName(sp)} still guards ${t}${pinned ? ' (but it is pinned)' : ''}` })
                  }
                } else results.push({ ok, why: `${pieceName(sp)} ${ok ? 'guards' : 'does not guard'} ${t}` })
              }
            }
          }
      break
    }
    case 'attack-count':
    case 'defend-count': {
      for (const or of R(body.obj))
        for (const op of or.pieces) {
          const side = body.kind === 'attack-count' ? opp(op.color) : op.color
          const d = attackersOf(b, op.square, side).length
          const x = attackersWithXray(b, op.square, side).length
          const ok = body.n === d || body.n === x
          results.push({ ok, why: `${pieceName(op)} is ${body.kind === 'attack-count' ? 'attacked' : 'guarded'} by ${d} piece(s)${x !== d ? ` (${x} counting pieces lined up behind)` : ''}, text says ${body.n}` })
        }
      break
    }
    case 'defended-only-by': {
      for (const or of R(body.obj))
        for (const op of or.pieces) {
          const d = attackersOf(b, op.square, op.color)
          const x = attackersWithXray(b, op.square, op.color)
          for (const br of R(body.by, op.color))
            for (const bp of br.pieces) {
              const ok = (d.length === 1 && d[0].square === bp.square) || (x.length === 1 && x[0].square === bp.square)
              results.push({ ok, why: `${pieceName(op)} is guarded by ${d.length ? d.map(pieceName).join(', ') : 'nothing'}` })
            }
        }
      break
    }
    case 'undefended': {
      for (const or of R(body.obj))
        for (const op of or.pieces) {
          if (op.type === 'k') continue
          const direct = attackersOf(b, op.square, op.color)
          const eff = effectiveDefenders(b, op.square)
          const ok = direct.length === 0 || eff.length === 0
          results.push({ ok, why: ok ? `${pieceName(op)} has no working defender` : `${pieceName(op)} is guarded by ${eff.map(pieceName).join(', ')}` })
        }
      break
    }
    case 'defended':
    case 'attacked': {
      for (const or of R(body.obj))
        for (const op of or.pieces) {
          const side = body.kind === 'attacked' ? opp(op.color) : op.color
          const n = attackersWithXray(b, op.square, side).length
          results.push({ ok: n > 0, why: `${pieceName(op)} is ${body.kind === 'attacked' ? 'attacked' : 'guarded'} by ${n} piece(s)` })
        }
      break
    }
    case 'hanging':
    case 'safe': {
      for (const or of R(body.obj))
        for (const op of or.pieces) {
          if (op.type === 'k') continue
          const gain = captureGain(pos.fen, op.square, opp(op.color))
          const eff = effectiveDefenders(b, op.square)
          const hanging = (gain !== null && gain > 0) || eff.length === 0
          const strictlyLost = gain !== null && gain > 0
          if (body.kind === 'hanging')
            results.push({ ok: hanging, why: hanging ? `${pieceName(op)} can be taken${gain !== null ? ` (net gain ${gain})` : ' (no defender)'}` : `${pieceName(op)} is defended and taking it does not win material`, confidence: 'medium' })
          else results.push({ ok: !strictlyLost, why: strictlyLost ? `${pieceName(op)} can be won: taking it nets ${gain}` : `${pieceName(op)} cannot be won by a capture`, confidence: 'medium' })
        }
      break
    }
    case 'pinned': {
      for (const or of R(body.obj))
        for (const op of or.pieces) {
          let pins = pinsOf(b, op.square)
          const anyGeometry = pins.length > 0
          if (body.by) {
            const bys = R(body.by, opp(op.color)).flatMap((r) => r.pieces.map((p) => p.square))
            pins = pins.filter((p) => bys.includes(p.pinner.square))
          }
          if (body.to) {
            const tos = R(body.to, op.color).flatMap((r) => r.pieces.map((p) => p.square))
            pins = pins.filter((p) => tos.includes(p.behind.square))
          }
          if (!body.to) {
            const valuable = pins.filter((p) => p.absolute || VALUE[p.behind.type] > VALUE[op.type])
            if (!valuable.length && pins.length) {
              results.push({ ok: null, why: `${pieceName(op)} stands in front of a less valuable piece only` })
              continue
            }
            pins = valuable
          }
          const ok = pins.length > 0
          results.push({
            ok,
            why: ok
              ? `${pieceName(op)} is pinned by the ${pieceName(pins[0].pinner)} to the ${pieceName(pins[0].behind)}`
              : `${pieceName(op)} is not pinned${anyGeometry ? ' that way' : ''}`,
          })
        }
      break
    }
    case 'not-pinned': {
      for (const or of R(body.obj))
        for (const op of or.pieces) {
          const pins = pinsOf(b, op.square).filter((p) => p.absolute || VALUE[p.behind.type] > VALUE[op.type])
          results.push({ ok: pins.length === 0, why: pins.length ? `${pieceName(op)} is still pinned by the ${pieceName(pins[0].pinner)} to the ${pieceName(pins[0].behind)}` : `${pieceName(op)} is not pinned` })
        }
      break
    }
    case 'trapped': {
      for (const or of R(body.obj))
        for (const op of or.pieces) {
          const t = trappedInfo(pos.fen, op.square)
          if (!t) continue
          results.push({ ok: t.trapped, why: t.trapped ? `${pieceName(op)} has no safe square` : `${pieceName(op)} can still go to ${t.safeSquares.join(', ')}`, confidence: 'medium' })
        }
      break
    }
    case 'uncapturable': {
      for (const or of R(body.obj))
        for (const op of or.pieces) {
          if (op.type === 'k') continue
          const g = gameFor(pos.fen, opp(op.color))
          if (!g) continue
          let caps = g.moves({ verbose: true }).filter((m) => m.to === op.square)
          if (body.by) {
            const bys = R(body.by, opp(op.color)).flatMap((r) => r.pieces.map((p) => p.square))
            caps = caps.filter((m) => bys.includes(m.from))
          }
          results.push({ ok: caps.length === 0, why: caps.length ? `${caps.map((m) => m.san).join(', ')} can take the ${pieceName(op)}` : `no legal move takes the ${pieceName(op)}` })
        }
      break
    }
    case 'check': {
      const side = b.turn
      const checkers = checkersOf(b, side)
      if (!checkers.length) {
        results.push({ ok: false, why: `the ${side === 'w' ? 'white' : 'black'} king is not in check` })
        break
      }
      if (body.double) {
        results.push({ ok: checkers.length >= 2, why: `${checkers.length} piece(s) give check` })
        break
      }
      if (body.discovered && pos.move) {
        const disc = checkers.some((c) => c.square !== pos.move!.to)
        results.push({ ok: disc, why: disc ? 'check comes from a piece that did not move' : 'only the moved piece gives check' })
        break
      }
      if (!body.by) {
        results.push({ ok: true, why: `check by ${checkers.map(pieceName).join(', ')}` })
        break
      }
      for (const r of R(body.by, opp(side)))
        for (const p of r.pieces) {
          const ok = checkers.some((c) => c.square === p.square)
          results.push({ ok: ok ? true : false, why: ok ? `${pieceName(p)} gives check` : `check comes from ${checkers.map(pieceName).join(', ')}, not ${pieceName(p)}` })
        }
      break
    }
    case 'mate': {
      const g = new Chess(pos.fen)
      const ok = g.isCheckmate()
      if (!ok && body.named) {
        // a named pattern under a diagram may show the position one move before the mate
        const m1 = g.moves({ verbose: true }).find((m) => new Chess(m.after).isCheckmate())
        if (m1) {
          results.push({ ok: true, why: `${m1.san} mates at once` })
          break
        }
      }
      results.push({ ok, why: ok ? 'checkmate on the board' : g.inCheck() ? 'check, but not mate' : 'not even check' })
      break
    }
    case 'fork': {
      const subjRef = body.subj
      let pieces: Piece[] = []
      if (subjRef) for (const r of R(subjRef)) pieces.push(...r.pieces)
      else if (pos.move) {
        const p = b.at(pos.move.to)
        if (p) pieces = [p]
      }
      for (const sp of pieces) {
        if (body.objs.length) {
          const all = body.objs.every((o) =>
            R(o, opp(sp.color)).some((r) => r.pieces.some((tp) => tp.color !== sp.color && attacks(b, sp, tp.square)) || (r.square && !r.pieces.length && attacks(b, sp, r.square))),
          )
          results.push({ ok: all, why: `${pieceName(sp)} ${all ? 'hits' : 'does not hit'} all the named targets` })
        } else {
          const hit = b.pieces({ color: opp(sp.color) }).filter((t) => attacks(b, sp, t.square) && (t.type !== 'p' || effectiveDefenders(b, t.square).length === 0))
          const ok = hit.length >= 2
          results.push({ ok, why: `${pieceName(sp)} hits ${hit.length ? hit.map(pieceName).join(', ') : 'nothing'}` })
        }
      }
      break
    }
    default:
      break
  }
  return { results, missing }
}

/* ------------------------------------------------------------------------------------------------ */

function label(body: ClaimBody): string {
  switch (body.kind) {
    case 'attacks':
      return `${body.neg ? 'does not attack' : 'attacks'}(${describe(body.subj)} -> ${body.objs.map(describe).join(' + ')})`
    case 'covers':
      return `${body.neg ? 'does not cover' : 'covers'}(${describe(body.subj)} -> ${body.objs.map(describe).join(' + ')})`
    case 'aims':
      return `aims-at(${describe(body.subj)} -> ${body.objs.map(describe).join(' + ')})`
    case 'defends':
      return `${body.neg ? 'does not guard' : 'guards'}(${describe(body.subj)} -> ${body.objs.map(describe).join(' + ')})`
    case 'attack-count':
      return `attacked ${body.n}x(${describe(body.obj)})`
    case 'defend-count':
      return `guarded ${body.n}x(${describe(body.obj)})`
    case 'defended-only-by':
      return `guarded only by(${describe(body.obj)} <- ${describe(body.by)})`
    case 'undefended':
      return `undefended(${describe(body.obj)})`
    case 'defended':
      return `guarded(${describe(body.obj)})`
    case 'attacked':
      return `attacked(${describe(body.obj)})`
    case 'hanging':
      return `hanging(${describe(body.obj)})`
    case 'safe':
      return `safe(${describe(body.obj)})`
    case 'pinned':
      return `pinned(${describe(body.obj)}${body.by ? ' by ' + describe(body.by) : ''}${body.to ? ' to ' + describe(body.to) : ''})`
    case 'trapped':
      return `trapped(${describe(body.obj)})`
    case 'not-pinned':
      return `not pinned(${describe(body.obj)})`
    case 'uncapturable':
      return `cannot be taken(${describe(body.obj)}${body.by ? ' by ' + describe(body.by) : ''})`
    case 'check':
      return `${body.discovered ? 'discovered ' : body.double ? 'double ' : ''}check${body.by ? '(' + describe(body.by) + ')' : ''}`
    case 'mate':
      return 'checkmate'
    case 'mate-in':
      return `mate in ${body.n}`
    case 'fork':
      return `fork${body.subj ? '(' + describe(body.subj) + (body.objs.length ? ' -> ' + body.objs.map(describe).join(' + ') : '') + ')' : ''}`
    case 'captures':
      return `takes(${body.subj ? describe(body.subj) : 'the move'} x ${describe(body.obj)}${body.free ? ', for free' : ''})`
    case 'material-up':
      return `material(${body.side} is ${body.atLeast ? 'at least ' : ''}${body.amount} up)`
    case 'material-won':
      return `wins material(${body.subjMove ? body.subjMove.raw.trim() : body.side}: ${body.amount})`
  }
}

interface PvMaterial {
  /** balance now */
  now: number
  /** balance once an exchange in progress (a recapture on the square just taken on) is finished */
  settled: number
  /** balances at the quiet points of Stockfish's line (where the next move is not a capture), 8 plies */
  quiet: number[]
  line: string
}

/** Material for `color` along Stockfish's best line, without counting half-finished exchanges. */
async function pvMaterial(fen: string, color: Color, engine: UciEngine | null, lastMoveTo?: string): Promise<PvMaterial | null> {
  if (!engine) return null
  const g = new Chess(fen)
  const now = materialDiff(new Board(fen), color)
  if (g.isGameOver()) return { now, settled: now, quiet: [now], line: '' }
  const r = await engine.analyse(fen, 14)
  const sans: string[] = []
  const quiet: number[] = []
  let settled = now
  let inExchange = Boolean(lastMoveTo)
  let exchangeSquare = lastMoveTo
  for (const u of r.pv.slice(0, 8)) {
    let mv
    try {
      mv = new Chess(g.fen()).move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined })
    } catch {
      break
    }
    if (!mv.captured && !mv.promotion) quiet.push(materialDiff(new Board(g.fen()), color))
    // a recapture on the square just taken on continues the exchange in progress
    if (inExchange && !(mv.captured && mv.to === exchangeSquare)) inExchange = false
    g.move(mv.san)
    sans.push(mv.san)
    if (inExchange) settled = materialDiff(new Board(g.fen()), color)
  }
  if (!quiet.length || sans.length) quiet.push(materialDiff(new Board(g.fen()), color))
  return { now, settled, quiet, line: sans.join(' ') }
}

/** material change for `by` along Stockfish's line (8 plies) from a position */
async function lineGain(fen: string, by: Color, engine: UciEngine, start: number, searchmoves?: string[]): Promise<{ gain: number; pv: string; score: number } | null> {
  const r = await engine.analyse(fen, 14, searchmoves)
  if (!r.pv.length) return null
  const h = new Chess(fen)
  const sans: string[] = []
  for (const u of r.pv.slice(0, 8)) {
    try {
      sans.push(h.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined }).san)
    } catch {
      break
    }
  }
  const score = r.mate !== null ? (r.mate > 0 ? 10000 : -10000) : (r.cp ?? 0)
  return { gain: materialDiff(new Board(h.fen()), by) - start, pv: sans.join(' '), score }
}

/**
 * Does taking on `sq` really win material for `by`? Compares Stockfish's best line that starts by taking on `sq`
 * with its best line that does not, both 8 plies long, so material won elsewhere is not credited to this piece.
 */
async function captureLineGain(fen: string, sq: string, by: Color, engine: UciEngine | null): Promise<{ gain: number; extra: number; pv: string; alt: string } | null> {
  // extra = how much better (in centipawns) the best line that takes on sq is than the best line that does not
  if (!engine) return null
  const g = gameFor(fen, by)
  if (!g) return null
  const f = g.fen()
  const start = materialDiff(new Board(f), by)
  const moves = g.moves({ verbose: true })
  const caps = moves.filter((m) => m.to === sq).map((m) => m.from + m.to + (m.promotion ?? ''))
  const others = moves.filter((m) => m.to !== sq).map((m) => m.from + m.to + (m.promotion ?? ''))
  if (!caps.length) return null
  const withCap = await lineGain(f, by, engine, start, caps)
  if (!withCap) return null
  const without = others.length ? await lineGain(f, by, engine, start, others) : { gain: -99, pv: '(no other move)', score: -10000 }
  if (!without) return null
  return { gain: withCap.gain, extra: withCap.score - without.score, pv: withCap.pv, alt: without.pv }
}

const sideColor = (side: string, unit: TextUnit, pos?: Pos): Color | null => {
  if (side === 'w' || side === 'b') return side
  if (side === 'you') return unit.you
  if (side === 'opp') return unit.you ? opp(unit.you) : null
  if (side === 'own' && pos?.move) return pos.move.mover
  return null
}

export async function evaluateClaim(pc: ParsedClaim, ctx: EvalContext): Promise<ClaimResult[]> {
  const unit = ctx.unit
  const body = pc.body
  const name = label(body)
  const cnp = (reason: string): ClaimResult[] => [{ verdict: 'could-not-parse', claim: name, reason }]
  if (!unit.line.length) return cnp('this text has no board position')
  const f = pc.flags
  if (f.question) return cnp('question, not a statement')
  if (f.hedged) return cnp('hedged wording ("almost", "usually", "looks ...")')
  if (f.advice && !pc.embedded) return cnp('advice, not a statement about this position')
  if (f.past) return cnp('past tense: talks about an earlier position')
  if (f.hypothetical && (f.unspecifiedMoves || !pc.moves.length)) return cnp('talks about a position after moves that are not written out')
  if (f.imperative) {
    const lp = unit.line[unit.focus]
    const ok = unit.kind === 'opening-comment' && lp?.mover && unit.you && lp.mover === unit.you
    if (!ok) return cnp('instruction about a future move')
  }
  // which positions
  const { positions, problem, replayed } = anchoredPositions(unit, pc.moves, ctx.carry)
  if (!positions.length) return cnp(problem ?? 'no position')
  // a sentence in the middle of a story ("The king has to take it ... Qh5 is checkmate") may start from a
  // position the checker cannot rebuild; such a claim is never called false
  const storyGuard = (r: ClaimResult[]): ClaimResult[] =>
    replayed && ctx.priorStory ? r.map((x) => (x.verdict === 'false' ? { ...x, verdict: 'could-not-parse' as Verdict, reason: `the text continues a story the checker could not replay (${x.reason})` } : x)) : r
  // capture clauses can describe the position just before the capture
  // a comment under a capture (or a sentence about taking) often describes the board just before the capture;
  // an adjective inside a noun phrase ("retreats the loose bishop") can too
  const capCl = /\b(takes?|taking|captures?|capturing|wins?|won|grabs?|retreats?|moves? away|steps? away|saves?)\b/.test(pc.clause) || Boolean(pc.embedded)
  const positionsAll = [...positions]
  for (const p of positions)
    if (p.move && (capCl || p.move.captured)) positionsAll.push({ fen: p.move.before, board: new Board(p.move.before), label: `before ${p.move.san}`, hypothetical: p.hypothetical })
  // imperative: the subject is the move itself
  const swapMover = (r: Ref): Ref => (r.id === -1 ? { ...r, kind: 'mover' as Ref['kind'] } : r)
  let bodyX: ClaimBody = body
  if ('subj' in body && body.subj && body.subj.id === -1) bodyX = { ...body, subj: swapMover(body.subj) } as ClaimBody
  if (body.kind === 'pinned' && f.imperative && !body.by) bodyX = { ...body, by: { id: -1, raw: '(the move)', kind: 'mover' as Ref['kind'], definite: true, adjs: [] } }

  // --- claims that need the move or the engine
  if (body.kind === 'captures') {
    const objType = body.obj.kind === 'piece' ? body.obj.type : undefined
    const tests: { ok: boolean | null; why: string }[] = []
    let candMoves: Pos[] = positions.filter((p) => p.move)
    if (!pc.moves.length && unit.kind === 'exercise-explanation') candMoves = defaultPositions(unit).filter((p) => p.move)
    for (const p of candMoves) {
      const m = p.move!
      if (body.subj && body.subj.kind === 'piece' && body.subj.type && body.subj.type !== 'any' && body.subj.type !== m.piece) {
        tests.push({ ok: null, why: `the move ${m.san} is made by a ${NAME[m.piece]}` })
        continue
      }
      if (body.subj && body.subj.kind === 'color' && sideColor(body.subj.owner ?? '', unit) !== m.mover) {
        tests.push({ ok: null, why: `${m.san} is played by the other side` })
        continue
      }
      if (!m.captured) {
        // "Qe8 wins the rook" may win it a move later; "Bxd5 takes the queen" must capture now
        tests.push({ ok: body.subj?.kind === 'move' && !body.win ? false : null, why: `${m.san} does not capture anything` })
        continue
      }
      if (objType && objType !== 'any' && objType !== m.captured) {
        tests.push({ ok: false, why: `${m.san} takes a ${NAME[m.captured]}, not a ${NAME[objType]}` })
        continue
      }
      if (body.obj.kind === 'piece' && body.obj.square && body.obj.square !== m.to) {
        tests.push({ ok: null, why: `${m.san} captures on ${m.to}, not ${body.obj.square}` })
        continue
      }
      if (body.free) {
        const back = see(new Board(p.fen), m.to, opp(m.mover))
        tests.push({ ok: back <= 0, why: back <= 0 ? `${m.san} cannot be answered by a winning recapture` : `after ${m.san} the capturing piece can be won back (net ${back})` })
        continue
      }
      tests.push({ ok: true, why: `${m.san} takes a ${NAME[m.captured]}` })
    }
    return storyGuard(finish(name, tests, undefined, positions[0], f))
  }
  if (body.kind === 'safe' || body.kind === 'hanging') {
    const tests: Test[] = []
    for (const p of positionsAll) {
      for (const or of resolve(body.obj, p, ctx)) {
        for (const op of or.pieces) {
          if (op.type === 'k') continue
          const by = opp(op.color)
          const staticGain = captureGain(p.fen, op.square, by)
          const eff = effectiveDefenders(p.board, op.square)
          if (staticGain === null) {
            // nothing can take it right now
            if (body.kind === 'safe') tests.push({ ok: true, why: `nothing can take the ${pieceName(op)} [${p.label}]` })
            else tests.push({ ok: eff.length === 0 ? true : null, why: `nothing can take the ${pieceName(op)} right now [${p.label}]` })
            continue
          }
          const line = await captureLineGain(p.fen, op.square, by, ctx.engine)
          if (line === null) {
            tests.push({ ok: staticGain <= 0 ? (body.kind === 'safe') : null, why: `static count: taking the ${pieceName(op)} nets ${staticGain}; no engine to confirm [${p.label}]` })
            continue
          }
          // lost = taking it wins material, and the line that takes it scores clearly better (80 cp) than the best line that leaves it
          const lost = line.gain >= 1 && line.extra >= 80
          tests.push({
            ok: body.kind === 'safe' ? !lost : lost || eff.length === 0,
            why: `Stockfish: taking the ${pieceName(op)} (${line.pv}) nets ${line.gain >= 0 ? '+' : ''}${line.gain} in material and scores ${line.extra >= 0 ? '+' : ''}${line.extra} cp against the best other line (${line.alt}) [${p.label}]`,
            confidence: 'medium',
          })
        }
      }
    }
    return storyGuard(finish(name, tests, undefined, positions[0], f))
  }
  if (body.kind === 'mate-in') {
    if (!ctx.engine) return cnp('needs Stockfish, which was not found')
    const tests: Test[] = []
    for (const p of positions) {
      const r = await ctx.engine.analyse(p.fen, Math.max(18, 2 * body.n + 10))
      if (r.mate !== null && r.mate > 0) tests.push({ ok: r.mate <= body.n, why: `Stockfish: mate in ${r.mate}` })
      else tests.push({ ok: false, why: `Stockfish (depth ${r.depth}) finds no forced mate for the side to move` })
    }
    return storyGuard(finish(name, tests, undefined, positions[0], f))
  }
  if (body.kind === 'material-up') {
    const tests: Test[] = []
    for (const p of positions) {
      const c = sideColor(body.side, unit, p)
      if (!c) return cnp('cannot tell which side "you" is here')
      const d = materialDiff(p.board, c)
      // "a pawn up" when it is really two pawns understates by one pawn; that is loose, not wrong
      const match = (x: number) => (body.atLeast ? x >= body.amount : x === body.amount || x === body.amount + 1)
      const sign = (x: number) => `${x >= 0 ? '+' : ''}${x}`
      const lastCapture = p.move?.captured ? p.move.to : undefined
      const pm = await pvMaterial(p.fen, c, ctx.engine, lastCapture)
      if (!pm) {
        // no engine: only a count on the board can be judged
        tests.push({ ok: match(d) && !lastCapture ? true : null, why: `material balance ${sign(d)} for ${c === 'w' ? 'White' : 'Black'}; text says ${body.amount}${match(d) ? '' : '; no engine to look further'}` })
        continue
      }
      // a queen taken but not yet taken back is not "a queen up": judge the balance once the exchange in progress is over;
      // otherwise the balance now, or at the next quiet point of the best line
      // "two pawns up for the moment": the text itself says the count is temporary
      const momentary = /\b(for the moment|for now|at the moment|right now|temporarily|for a moment)\b/i.test(pc.clause)
      let ok: boolean | null = match(pm.settled) || (pm.settled === d && match(pm.quiet[0] ?? d))
      if (!ok && pm.settled !== d && match(d)) ok = momentary ? true : null // true now, but only until the exchange in progress ends
      tests.push({
        ok,
        why: `material balance ${sign(d)} now${pm.settled !== d ? `, ${sign(pm.settled)} once the exchange in progress ends` : ''}; quiet points of Stockfish's line ${pm.quiet.map(sign).join(' ')} (${pm.line || 'no moves'}); text says ${body.amount}`,
        confidence: 'medium',
      })
    }
    return storyGuard(finish(name, tests, undefined, positions[0], f))
  }
  if (body.kind === 'material-won') {
    const tests: Test[] = []
    for (const p of positions) {
      let c: Color | null
      let base: number
      if (body.subjMove) {
        if (!p.move) continue
        c = p.move.mover
        base = materialDiff(new Board(p.move.before), c)
      } else {
        c = sideColor(body.side, unit, p)
        if (!c) return cnp('cannot tell which side is meant')
        if (body.back) base = materialDiff(p.board, c)
        else if (unit.kind === 'opening-card') return cnp('no starting position to count material from')
        else base = unit.kind === 'opening-comment' ? 0 : materialDiff(new Board(unit.line[unit.storyStart].fen), c)
      }
      // the move itself won it ("You win the knight" under ...Nxd4, "Bxa2 wins the rook")
      const own = p.move && p.move.mover === c && p.move.captured ? VALUE[p.move.captured] : 0
      // balances at quiet points along Stockfish's line, from here and from the end of the written line
      const endIdx = unit.line.length - 1
      const pmHere = await pvMaterial(p.fen, c, ctx.engine, p.move?.captured ? p.move.to : undefined)
      const endPos = p.idx !== undefined && p.idx < endIdx ? posFromLine(unit, endIdx) : null
      const pmEnd = endPos ? await pvMaterial(endPos.fen, c, ctx.engine, endPos.move?.captured ? endPos.move.to : undefined) : pmHere
      if (!pmHere || !pmEnd) {
        tests.push({ ok: own >= body.amount ? true : null, why: own ? `${p.move!.san} takes a ${NAME[p.move!.captured!]}` : 'needs Stockfish to look ahead' })
        continue
      }
      // measured from the start of the story, and from just before this move (the gain of the move and its answers)
      const bases = Array.from(new Set([base, p.move ? materialDiff(new Board(p.move.before), c) : base]))
      const values = [pmHere.settled, ...pmHere.quiet, pmEnd.settled, ...pmEnd.quiet]
      const gains = bases.flatMap((b0) => values.map((v) => v - b0))
      const best = Math.max(...gains, own > 0 ? own : -99)
      const ok = best >= body.amount ? true : best <= body.amount - 2 ? false : null
      tests.push({ ok, why: `best net material gain for ${c === 'w' ? 'White' : 'Black'}: ${best >= 0 ? '+' : ''}${best} (Stockfish's line ${pmEnd.line || pmHere.line || 'quiet'}); text says ${body.amount}`, confidence: 'medium' })
    }
    if (!tests.length) return cnp('no move to measure')
    return storyGuard(finish(name, tests, undefined, positions[0], f))
  }

  // --- static board claims
  const tests: Test[] = []
  let missing: string | undefined
  let anyResolved = false
  for (const p of positionsAll) {
    const r = testBody(bodyX, p, ctx, { beforeAlso: capCl })
    if (r.results.length) anyResolved = true
    tests.push(...r.results.map((t) => ({ ...t, why: `${t.why} [${p.label}]` })))
    if (r.missing && !missing) missing = `${r.missing} [${p.label}]`
  }
  if (!anyResolved && missing && !f.hypothetical && !pc.embedded) {
    return storyGuard([{ verdict: 'false', claim: name, reason: missing, position: positions[0].label, fen: positions[0].fen, confidence: 'medium' }])
  }
  if (!anyResolved) return cnp(missing ? `could not find the piece: ${missing}` : 'could not tell which piece is meant')
  return storyGuard(finish(name, tests, missing, positions[0], f))
}

function finish(name: string, tests: Test[], missing: string | undefined, pos: Pos, f: ParsedClaim['flags']): ClaimResult[] {
  if (!tests.length) return [{ verdict: 'could-not-parse', claim: name, reason: missing ?? 'nothing on the board to test' }]
  const t = tests.find((x) => x.ok === true)
  if (t) return [{ verdict: 'true', claim: name, reason: t.why, position: pos.label, fen: pos.fen }]
  if (tests.some((x) => x.ok === null)) return [{ verdict: 'could-not-parse', claim: name, reason: tests.find((x) => x.ok === null)!.why }]
  const conf = tests.some((x) => x.confidence === 'medium') ? 'medium' : 'high'
  return [{ verdict: 'false', claim: name, reason: Array.from(new Set(tests.map((x) => x.why))).slice(0, 3).join('; '), position: pos.label, fen: pos.fen, confidence: conf }]
}
