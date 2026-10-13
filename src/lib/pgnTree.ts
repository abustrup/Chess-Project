import { Chess } from 'chess.js'
import type { BoardArrow, BoardHighlight } from '../types'

// Parses PGN movetext WITH variations and comments into a tree.
// Used for the opening lessons (so we can write lessons in the same format Lichess/ChessBase use).

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface PgnNode {
  /** Unique, stable id based on the path through the tree, e.g. '0.1.0' (root is '') */
  id: string
  san: string // '' for the root
  uci: string
  ply: number // 0 for the root, 1 for white's first move
  fenBefore: string
  fen: string
  /** Comment text with drawing commands removed. */
  comment: string
  arrows: BoardArrow[]
  highlights: BoardHighlight[]
  /** Numeric annotation glyphs, e.g. 1 = '!', 2 = '?', 3 = '!!', 4 = '??', 5 = '!?', 6 = '?!' */
  nags: number[]
  /** children[0] is the main continuation; the others are variations. */
  children: PgnNode[]
  parentId: string | null
  /** 'w' or 'b': who made this move (root: who is to move at the start is the opposite). */
  mover: 'w' | 'b' | null
}

export interface PgnTree {
  root: PgnNode
  headers: Record<string, string>
  nodes: Map<string, PgnNode>
}

export class PgnParseError extends Error {
  constructor(message: string, public readonly context: string) {
    super(`${message} (near: "${context}")`)
  }
}

const COLOR_MAP: Record<string, string> = {
  G: 'green',
  R: 'red',
  Y: 'yellow',
  B: 'blue',
}

function extractCommands(text: string, arrows: BoardArrow[], highlights: BoardHighlight[]): string {
  let out = text
  out = out.replace(/\[%cal\s+([^\]]*)\]/g, (_, list: string) => {
    for (const item of list.split(',')) {
      const t = item.trim()
      const m = /^([GRYB])([a-h][1-8])([a-h][1-8])$/.exec(t)
      if (m) arrows.push({ from: m[2], to: m[3], color: COLOR_MAP[m[1]] })
    }
    return ''
  })
  out = out.replace(/\[%csl\s+([^\]]*)\]/g, (_, list: string) => {
    for (const item of list.split(',')) {
      const t = item.trim()
      const m = /^([GRYB])([a-h][1-8])$/.exec(t)
      if (m) highlights.push({ square: m[2], color: COLOR_MAP[m[1]] })
    }
    return ''
  })
  // drop any other [%...] commands such as clock/eval
  out = out.replace(/\[%[^\]]*\]/g, '')
  return out.replace(/\s+/g, ' ').trim()
}

const NAG_SUFFIX: Record<string, number> = { '!': 1, '?': 2, '!!': 3, '??': 4, '!?': 5, '?!': 6 }

const TOKEN_RE =
  /\{[^}]*\}|;[^\n]*|\(|\)|\$\d+|\d+\.(?:\.\.)?|1-0|0-1|1\/2-1\/2|\*|O-O-O[+#]?[!?]*|O-O[+#]?[!?]*|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?[!?]*|\S+/g

/**
 * Parse movetext (optionally with [Header "value"] lines before it).
 * Throws PgnParseError on an illegal move — content authors rely on this to catch typos.
 */
export function parsePgnTree(pgn: string, opts: { startFen?: string } = {}): PgnTree {
  const headers: Record<string, string> = {}
  let text = pgn.replace(/\[(\w+)\s+"([^"]*)"\]/g, (_, k: string, v: string) => {
    headers[k] = v
    return ''
  })
  const startFen = opts.startFen ?? headers.FEN ?? START_FEN

  const rootGame = new Chess(startFen)
  const root: PgnNode = {
    id: '',
    san: '',
    uci: '',
    ply: 0,
    fenBefore: startFen,
    fen: startFen,
    comment: '',
    arrows: [],
    highlights: [],
    nags: [],
    children: [],
    parentId: null,
    mover: null,
  }
  const nodes = new Map<string, PgnNode>([['', root]])

  text = text.trim()
  const tokens = text.match(TOKEN_RE) ?? []

  let curr = root // position we are currently "standing on"
  let last: PgnNode | null = null // the most recently added move (comments/NAGs attach to it)
  const stack: { curr: PgnNode; last: PgnNode | null }[] = []

  for (const tok of tokens) {
    if (tok.startsWith('{')) {
      const target = last ?? root
      const raw = tok.slice(1, -1)
      const extra = extractCommands(raw, target.arrows, target.highlights)
      target.comment = [target.comment, extra].filter(Boolean).join(' ')
      continue
    }
    if (tok.startsWith(';')) continue
    if (tok === '(') {
      if (!last) throw new PgnParseError('Variation starts before any move', tok)
      stack.push({ curr, last })
      curr = nodes.get(last.parentId ?? '') ?? root
      last = null
      continue
    }
    if (tok === ')') {
      const frame = stack.pop()
      if (!frame) throw new PgnParseError('Unbalanced )', tok)
      curr = frame.curr
      last = frame.last
      continue
    }
    if (/^\$\d+$/.test(tok)) {
      if (last) last.nags.push(Number(tok.slice(1)))
      continue
    }
    if (/^\d+\.(?:\.\.)?$/.test(tok)) continue
    if (tok === '1-0' || tok === '0-1' || tok === '1/2-1/2' || tok === '*') continue

    // a move
    const m = /^(.*?)([!?]{1,2})?$/.exec(tok)!
    const sanRaw = m[1]
    const suffix = m[2]
    const game = new Chess(curr.fen)
    let mv
    try {
      mv = game.move(sanRaw)
    } catch {
      throw new PgnParseError(`Illegal or unreadable move "${sanRaw}" at ply ${curr.ply + 1}`, `${curr.fen}`)
    }
    const existing = curr.children.find((c) => c.san === mv.san)
    if (existing) {
      // same move listed twice: just walk into it (keeps tree clean)
      curr = existing
      last = existing
      if (suffix && NAG_SUFFIX[suffix]) existing.nags.push(NAG_SUFFIX[suffix])
      continue
    }
    const id = curr.id === '' ? String(curr.children.length) : `${curr.id}.${curr.children.length}`
    const node: PgnNode = {
      id,
      san: mv.san,
      uci: mv.from + mv.to + (mv.promotion ?? ''),
      ply: curr.ply + 1,
      fenBefore: curr.fen,
      fen: game.fen(),
      comment: '',
      arrows: [],
      highlights: [],
      nags: suffix && NAG_SUFFIX[suffix] ? [NAG_SUFFIX[suffix]] : [],
      children: [],
      parentId: curr.id,
      mover: mv.color,
    }
    curr.children.push(node)
    nodes.set(id, node)
    curr = node
    last = node
  }
  if (stack.length) throw new PgnParseError('Unclosed variation (missing ")")', text.slice(-40))
  void rootGame
  return { root, headers, nodes }
}

/** All root-to-leaf lines, each as an array of nodes (root excluded). */
export function allLines(tree: PgnTree): PgnNode[][] {
  const out: PgnNode[][] = []
  const walk = (n: PgnNode, path: PgnNode[]) => {
    if (n.children.length === 0) {
      if (path.length) out.push(path)
      return
    }
    for (const c of n.children) walk(c, [...path, c])
  }
  walk(tree.root, [])
  return out
}

/** Walk the main line (always first child) from a node. */
export function mainLine(from: PgnNode): PgnNode[] {
  const out: PgnNode[] = []
  let n = from
  while (n.children.length) {
    n = n.children[0]
    out.push(n)
  }
  return out
}

/** The moves from the root down to (and including) the node with this id. */
export function pathTo(tree: PgnTree, id: string): PgnNode[] {
  const out: PgnNode[] = []
  let n: PgnNode | undefined = tree.nodes.get(id)
  while (n && n.parentId !== null) {
    out.unshift(n)
    n = tree.nodes.get(n.parentId)
  }
  return out
}

export const NAG_TEXT: Record<number, string> = { 1: '!', 2: '?', 3: '!!', 4: '??', 5: '!?', 6: '?!' }
