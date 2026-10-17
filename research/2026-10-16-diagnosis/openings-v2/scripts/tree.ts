// A small editable move tree for narrowing the opening courses (O1, 2026-10-16).
// Parsing goes through the app's own PGN parser, so the narrowed chapters mean exactly what the app shows.
import { Chess } from 'chess.js'
import { parsePgnTree, type PgnNode } from '../../../../src/lib/pgnTree.ts'

export interface TNode {
  san: string
  /** Comment text without drawing commands. */
  comment: string
  /** Drawing commands as written in PGN, e.g. '[%cal Gd2d4] [%csl Gd4]'. */
  draw: string
  nags: number[]
  fenBefore: string
  fen: string
  ply: number
  mover: 'w' | 'b'
  children: TNode[]
}

export interface TRoot {
  comment: string
  draw: string
  fen: string
  children: TNode[]
}

const COLOR_CODE: Record<string, string> = { green: 'G', red: 'R', yellow: 'Y', blue: 'B' }

function drawOf(n: PgnNode): string {
  const parts: string[] = []
  if (n.arrows.length) parts.push(`[%cal ${n.arrows.map((a) => `${COLOR_CODE[a.color ?? 'green'] ?? 'G'}${a.from}${a.to}`).join(',')}]`)
  if (n.highlights.length)
    parts.push(`[%csl ${n.highlights.map((h) => `${COLOR_CODE[h.color ?? 'green'] ?? 'G'}${h.square}`).join(',')}]`)
  return parts.join(' ')
}

function fromPgnNode(n: PgnNode): TNode {
  return {
    san: n.san,
    comment: n.comment,
    draw: drawOf(n),
    nags: [...n.nags],
    fenBefore: n.fenBefore,
    fen: n.fen,
    ply: n.ply,
    mover: n.mover as 'w' | 'b',
    children: n.children.map(fromPgnNode),
  }
}

export function parse(pgn: string, startFen?: string): TRoot {
  const t = parsePgnTree(pgn, startFen ? { startFen } : {})
  return { comment: t.root.comment, draw: drawOf(t.root), fen: t.root.fen, children: t.root.children.map(fromPgnNode) }
}

export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

/** EPD-like key: board, side to move, castling, en-passant (as chess.js writes it). */
export const posKey = (fen: string): string => fen.split(' ').slice(0, 4).join(' ')

/** Node reached by a list of SAN moves from the root (undefined if the path is not in the tree). */
export function find(root: TRoot, path: string[]): TNode | undefined {
  let kids = root.children
  let node: TNode | undefined
  for (const san of path) {
    node = kids.find((c) => c.san === san)
    if (!node) return undefined
    kids = node.children
  }
  return node
}

/** Children list of the node at `path` ([] = the root). */
export function kidsAt(root: TRoot, path: string[]): TNode[] {
  if (!path.length) return root.children
  const n = find(root, path)
  if (!n) throw new Error(`path not found: ${path.join(' ')}`)
  return n.children
}

/** Union: add every line of `src` into `dst`. Where both list the same move, `dst` keeps its own comment.
 *  Where it is the owner's turn and both list a different first move, `dst`'s move stays first. */
export function mergeInto(dst: TNode[], src: TNode[]): void {
  for (const s of src) {
    const d = dst.find((x) => x.san === s.san)
    if (!d) dst.push(clone(s))
    else {
      if (!d.comment && s.comment) {
        d.comment = s.comment
        if (!d.draw) d.draw = s.draw
      }
      mergeInto(d.children, s.children)
    }
  }
}

/** Visit every node with its SAN path. */
export function walk(root: TRoot, fn: (n: TNode, path: string[], parentKids: TNode[]) => void): void {
  const rec = (kids: TNode[], path: string[]) => {
    for (const k of [...kids]) {
      const p = [...path, k.san]
      fn(k, p, kids)
      rec(k.children, p)
    }
  }
  rec(root.children, [])
}

/** Parse a PGN fragment that starts at the position after `path` and return its top-level moves. */
export function fragment(root: TRoot, path: string[], pgn: string): TNode[] {
  const fen = path.length ? find(root, path)!.fen : root.fen
  const t = parse(pgn, fen)
  // the app's parser numbers plies from 0 at the start position; shift them to the real ply
  const base = path.length ? find(root, path)!.ply : 0
  const shift = (n: TNode) => {
    n.ply += base
    n.children.forEach(shift)
  }
  t.children.forEach(shift)
  return t.children
}

/* ------------------------------------------------------------------ writing PGN */

const NAG_SUFFIX: Record<number, string> = { 1: '!', 2: '?', 3: '!!', 4: '??', 5: '!?', 6: '?!' }

function moveText(n: TNode, forceNumber: boolean): string {
  const num = Math.ceil(n.ply / 2)
  const prefix = n.mover === 'w' ? `${num}. ` : forceNumber ? `${num}... ` : `${num}... `
  const suffix = n.nags.map((g) => NAG_SUFFIX[g] ?? '').join('')
  const other = n.nags.filter((g) => !NAG_SUFFIX[g]).map((g) => ` $${g}`).join('')
  const body = [n.comment, n.draw].filter(Boolean).join(' ')
  return `${prefix}${n.san}${suffix}${other}${body ? ` {${body}}` : ''}`
}

/** One move per line; a variation opens with "(" in front of its first move and closes with ")" on its own line. */
export function toPgn(root: TRoot): string {
  const lines: string[] = []
  const rootBody = [root.comment, root.draw].filter(Boolean).join(' ')
  if (rootBody) lines.push(`{${rootBody}}`)
  const line = (kids: TNode[], opening: boolean) => {
    // kids[0] continues the current line; kids[1..] are variations to kids[0]
    let first = true
    let k: TNode[] = kids
    let open = opening
    while (k.length) {
      const main = k[0]
      lines.push((open ? '(' : '') + moveText(main, first))
      open = false
      first = false
      for (const v of k.slice(1)) {
        line([v], true)
        lines.push(')')
      }
      k = main.children
    }
  }
  line(root.children, false)
  return '\n' + lines.join('\n') + '\n'
}

/** Sanity check: re-parse the written PGN and compare the trees. */
export function roundTrip(root: TRoot): void {
  const back = parse(toPgn(root))
  const a = JSON.stringify(strip(root))
  const b = JSON.stringify(strip(back))
  if (a !== b) throw new Error('round trip changed the tree')
}

function strip(r: TRoot): unknown {
  const s = (n: TNode): unknown => ({ san: n.san, c: n.comment, d: n.draw, g: n.nags, k: n.children.map(s) })
  return { c: r.comment, k: r.children.map(s) }
}

/** Legal SAN check helper. */
export function sanAfter(fen: string, san: string): string {
  const g = new Chess(fen)
  return g.move(san).san
}
