// Board facts for the claim checker: who attacks what, who defends what, pins, hanging and trapped
// pieces, material. Pure functions on a FEN; legality questions go to chess.js.
import { Chess, type Square } from 'chess.js'

export type Color = 'w' | 'b'
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export interface Piece {
  type: PieceType
  color: Color
  square: string
}

export const VALUE: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
export const NAME: Record<PieceType, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
export const opp = (c: Color): Color => (c === 'w' ? 'b' : 'w')

export const sqName = (f: number, r: number) => 'abcdefgh'[f] + String(r + 1)
export const sqFile = (s: string) => s.charCodeAt(0) - 97
export const sqRank = (s: string) => Number(s[1]) - 1
export const isLightSquare = (s: string) => (sqFile(s) + sqRank(s)) % 2 === 1

export class Board {
  readonly fen: string
  readonly grid: (Piece | null)[][] // [file][rank]
  readonly turn: Color
  constructor(fen: string) {
    this.fen = fen
    this.grid = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null))
    const [placement, turn] = fen.split(' ')
    this.turn = turn === 'b' ? 'b' : 'w'
    const rows = placement.split('/')
    for (let i = 0; i < 8; i++) {
      const r = 7 - i
      let f = 0
      for (const ch of rows[i]) {
        if (/\d/.test(ch)) f += Number(ch)
        else {
          const color: Color = ch === ch.toUpperCase() ? 'w' : 'b'
          this.grid[f][r] = { type: ch.toLowerCase() as PieceType, color, square: sqName(f, r) }
          f++
        }
      }
    }
  }
  at(s: string): Piece | null {
    if (!/^[a-h][1-8]$/.test(s)) return null
    return this.grid[sqFile(s)][sqRank(s)]
  }
  pieces(filter: Partial<{ type: PieceType; color: Color }> = {}): Piece[] {
    const out: Piece[] = []
    for (let f = 0; f < 8; f++)
      for (let r = 0; r < 8; r++) {
        const p = this.grid[f][r]
        if (!p) continue
        if (filter.type && p.type !== filter.type) continue
        if (filter.color && p.color !== filter.color) continue
        out.push(p)
      }
    return out
  }
}

const KNIGHT = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
]
const KING = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
]
const DIAG = [
  [1, 1], [1, -1], [-1, 1], [-1, -1],
]
const ORTHO = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
]
const inside = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8

/** Squares a piece standing on `from` attacks (sliders stop at the first piece; `ignore` squares are see-through). */
export function attacksFrom(b: Board, p: Piece, ignore: Set<string> = new Set()): string[] {
  const f0 = sqFile(p.square)
  const r0 = sqRank(p.square)
  const out: string[] = []
  const step = (dirs: number[][], slide: boolean) => {
    for (const [df, dr] of dirs) {
      let f = f0 + df
      let r = r0 + dr
      while (inside(f, r)) {
        const s = sqName(f, r)
        out.push(s)
        if (!slide) break
        if (b.grid[f][r] && !ignore.has(s)) break
        f += df
        r += dr
      }
    }
  }
  switch (p.type) {
    case 'p': {
      const dr = p.color === 'w' ? 1 : -1
      for (const df of [-1, 1]) if (inside(f0 + df, r0 + dr)) out.push(sqName(f0 + df, r0 + dr))
      break
    }
    case 'n':
      step(KNIGHT, false)
      break
    case 'k':
      step(KING, false)
      break
    case 'b':
      step(DIAG, true)
      break
    case 'r':
      step(ORTHO, true)
      break
    case 'q':
      step(DIAG, true)
      step(ORTHO, true)
      break
  }
  return out
}

export function attacks(b: Board, attacker: Piece, target: string, ignore?: Set<string>): boolean {
  return attacksFrom(b, attacker, ignore).includes(target)
}

/** Pieces of `color` that attack (or, for own pieces, defend) `target` directly. */
export function attackersOf(b: Board, target: string, color: Color, ignore?: Set<string>): Piece[] {
  return b.pieces({ color }).filter((p) => p.square !== target && !ignore?.has(p.square) && attacks(b, p, target, ignore))
}

/**
 * Attackers including batteries ("x-ray"): a rook/queen behind a rook/queen on the same file, a bishop/queen
 * behind a bishop/queen (or a pawn) on the same diagonal. Counted the way players count "attacked twice".
 */
export function attackersWithXray(b: Board, target: string, color: Color): Piece[] {
  const found: Piece[] = []
  const seen = new Set<string>()
  let ignore = new Set<string>()
  // repeatedly remove the direct attackers and look again, but only let sliders join "through" own pieces
  for (let round = 0; round < 6; round++) {
    const direct = attackersOf(b, target, color, ignore).filter((p) => !seen.has(p.square))
    if (!direct.length) break
    for (const p of direct) {
      if (round > 0 && !['b', 'r', 'q'].includes(p.type)) continue
      seen.add(p.square)
      found.push(p)
    }
    ignore = new Set([...ignore, ...direct.filter((p) => seen.has(p.square)).map((p) => p.square)])
  }
  return found
}

export function defendersOf(b: Board, square: string): Piece[] {
  const p = b.at(square)
  if (!p) return []
  return attackersOf(b, square, p.color)
}

export function material(b: Board, color: Color): number {
  return b.pieces({ color }).reduce((s, p) => s + (p.type === 'k' ? 0 : VALUE[p.type]), 0)
}
/** material of `color` minus material of the other side */
export function materialDiff(b: Board, color: Color): number {
  return material(b, color) - material(b, opp(color))
}

/**
 * Static exchange evaluation: what `byColor` gains (in pawns) by starting a capture sequence on `square`,
 * where each side may stop. Uses least-valuable-attacker order and sees through batteries.
 */
export function see(b: Board, square: string, byColor: Color): number {
  const target = b.at(square)
  if (!target || target.color === byColor) return 0
  const removed = new Set<string>()
  const gains: number[] = []
  let side = byColor
  let onSquare = VALUE[target.type]
  let depth = 0
  gains[0] = 0
  for (;;) {
    const att = attackersOf(b, square, side, removed).filter((p) => p.square !== square)
    if (!att.length) break
    att.sort((a, c) => VALUE[a.type] - VALUE[c.type])
    const a = att[0]
    // a king may only capture if the square is not defended afterwards
    if (a.type === 'k') {
      const rem2 = new Set([...removed, a.square])
      const others = attackersOf(b, square, opp(side), rem2).filter((p) => p.square !== square)
      if (others.length) break
    }
    depth++
    gains[depth] = onSquare - gains[depth - 1]
    onSquare = VALUE[a.type]
    removed.add(a.square)
    side = opp(side)
  }
  // negamax back up: each side can choose to stop
  for (let d = depth; d > 1; d--) gains[d - 1] = -Math.max(-gains[d - 1], gains[d])
  return depth === 0 ? 0 : gains[1]
}

/** A piece is "hanging" when the other side wins material by taking it (static exchange > 0). */
export function isHanging(b: Board, square: string): boolean {
  const p = b.at(square)
  if (!p || p.type === 'k') return false
  return see(b, square, opp(p.color)) > 0
}

export interface PinInfo {
  pinner: Piece
  pinned: Piece
  behind: Piece
  absolute: boolean
}

/** All line-ups "enemy slider -> piece -> own piece behind it" through the piece on `square`. */
export function pinsOf(b: Board, square: string): PinInfo[] {
  const pinned = b.at(square)
  if (!pinned) return []
  const out: PinInfo[] = []
  const f0 = sqFile(square)
  const r0 = sqRank(square)
  const dirs = [...DIAG, ...ORTHO]
  for (const [df, dr] of dirs) {
    // walk one way to find the pinner, the other way to find what stands behind
    const first = (sf: number, sr: number): Piece | null => {
      let f = f0 + sf
      let r = r0 + sr
      while (inside(f, r)) {
        const p = b.grid[f][r]
        if (p) return p
        f += sf
        r += sr
      }
      return null
    }
    const pinner = first(df, dr)
    const behind = first(-df, -dr)
    if (!pinner || !behind) continue
    if (pinner.color === pinned.color || behind.color !== pinned.color) continue
    const diagonal = df !== 0 && dr !== 0
    const slides = pinner.type === 'q' || (diagonal ? pinner.type === 'b' : pinner.type === 'r')
    if (!slides) continue
    out.push({ pinner, pinned, behind, absolute: behind.type === 'k' })
  }
  return out
}

/** Is `color`'s king in check? (independent of whose turn it is) */
export function kingInCheck(b: Board, color: Color): boolean {
  const k = b.pieces({ type: 'k', color })[0]
  if (!k) return false
  return attackersOf(b, k.square, opp(color)).length > 0
}
export function checkersOf(b: Board, color: Color): Piece[] {
  const k = b.pieces({ type: 'k', color })[0]
  if (!k) return []
  return attackersOf(b, k.square, opp(color))
}

/** chess.js game for the given FEN, with the turn switched to `color` if needed (null if that is illegal). */
export function gameFor(fen: string, color: Color): Chess | null {
  try {
    const g = new Chess(fen)
    if (g.turn() === color) return g
    const parts = fen.split(' ')
    parts[1] = color
    parts[3] = '-'
    // the side that would not be to move must not be in check
    const b = new Board(fen)
    if (kingInCheck(b, opp(color))) return null
    return new Chess(parts.join(' '))
  } catch {
    return null
  }
}

/**
 * Is the piece on `square` trapped: every move it has leads to a square where it is lost (static exchange),
 * and staying is not safe either? Returns null when the question does not apply.
 */
export function trappedInfo(fen: string, square: string): { trapped: boolean; safeSquares: string[] } | null {
  const b = new Board(fen)
  const p = b.at(square)
  if (!p || p.type === 'k' || p.type === 'p') return null
  const g = gameFor(fen, p.color)
  if (!g) return null
  const safe: string[] = []
  for (const m of g.moves({ square: square as Square, verbose: true })) {
    const after = new Board(m.after)
    const lossAfter = see(after, m.to, opp(p.color))
    // a capture that wins at least as much as the piece is worth also counts as an escape
    const gained = m.captured ? VALUE[m.captured as PieceType] : 0
    if (lossAfter <= 0 || gained - lossAfter >= 0) safe.push(m.to)
  }
  return { trapped: safe.length === 0, safeSquares: safe }
}
