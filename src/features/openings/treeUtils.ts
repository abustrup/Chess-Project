import type { OpeningChapter, OpeningCourse } from '../../types'
import { allLines, parsePgnTree, type PgnNode, type PgnTree } from '../../lib/pgnTree'
import type { SoundName } from '../../lib/sound'

// Small helpers for reading a chapter's move tree. Nothing here touches React or storage.

export type Colour = 'w' | 'b'

/** Which colour the user plays in this course. */
export const userColour = (course: OpeningCourse): Colour => (course.side === 'white' ? 'w' : 'b')

/** Whose turn it is in the position that exists AFTER this node's move was played. */
export function turnAfter(node: PgnNode): Colour {
  return node.fen.split(' ')[1] === 'b' ? 'b' : 'w'
}

/** True when the user has to choose the next move from this position. */
export const isUserTurn = (node: PgnNode, course: OpeningCourse): boolean => turnAfter(node) === userColour(course)

/* ----------------------------------------------------------------- parsing */

export type ParsedChapter = { ok: true; tree: PgnTree } | { ok: false; error: string }

const parsed = new WeakMap<OpeningChapter, ParsedChapter>()

/** Parses a chapter once and remembers the answer. A broken chapter gives an error instead of throwing. */
export function parseChapter(chapter: OpeningChapter): ParsedChapter {
  const hit = parsed.get(chapter)
  if (hit) return hit
  let result: ParsedChapter
  try {
    const tree = parsePgnTree(chapter.pgn)
    result = tree.root.children.length ? { ok: true, tree } : { ok: false, error: 'This chapter has no moves yet.' }
  } catch (e) {
    result = { ok: false, error: e instanceof Error ? e.message : 'The moves could not be read.' }
  }
  parsed.set(chapter, result)
  return result
}

/* ------------------------------------------------------------ tree walking */

/**
 * Every position where the USER must find a move, following only what is worth learning:
 * your first-listed move at your turn, and every prepared reply at the opponent's turn.
 * `from` lets us look at just one branch.
 */
export function learnNodes(from: PgnNode, course: OpeningCourse): PgnNode[] {
  const out: PgnNode[] = []
  const walk = (n: PgnNode) => {
    if (n.children.length === 0) return
    if (isUserTurn(n, course)) {
      out.push(n)
      walk(n.children[0])
    } else {
      n.children.forEach(walk)
    }
  }
  walk(from)
  return out
}

/** The last leaf nodes under (and including) a node. */
export function leavesUnder(node: PgnNode): PgnNode[] {
  if (node.children.length === 0) return [node]
  return node.children.flatMap(leavesUnder)
}

export const lineCount = (tree: PgnTree): number => allLines(tree).length

/* -------------------------------------------------------------- formatting */

/** "3." for White's move, "3..." for Black's. */
function moveNumber(node: PgnNode): string {
  const n = Math.ceil(node.ply / 2)
  return node.mover === 'b' ? `${n}...` : `${n}.`
}

/** "3. Bf4" or "3... Nf6". */
export const moveLabel = (node: PgnNode): string => `${moveNumber(node)} ${node.san}`

/** Signature moves from the course data (a list of SAN moves starting with White) as "1. d4 d5 2. Bf4". */
export function signatureText(moves: string[]): string {
  return moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ')
}

export interface Glyph {
  text: string
  /** Plain-words meaning, for people who do not know the symbols. */
  label: string
  tone: 'good' | 'bad' | 'warn' | 'interesting'
}

const GLYPHS: Record<number, Glyph> = {
  1: { text: '!', label: 'Good move', tone: 'good' },
  3: { text: '!!', label: 'Excellent move', tone: 'good' },
  5: { text: '!?', label: 'Interesting move', tone: 'interesting' },
  6: { text: '?!', label: 'Slightly dubious move', tone: 'warn' },
  2: { text: '?', label: 'Mistake', tone: 'bad' },
  4: { text: '??', label: 'Blunder', tone: 'bad' },
}

/** The "!" / "?" style mark for a move, if it has one. */
export function glyphOf(nags: number[]): Glyph | null {
  for (const n of nags) if (GLYPHS[n]) return GLYPHS[n]
  return null
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Hides the exact move from an explanation so the drill can give an idea without giving the answer away.
 * "Bf4 gets the bishop out" becomes "This move gets the bishop out".
 */
export function maskMove(text: string, san: string): string {
  const plain = san.replace(/[+#]$/, '')
  // "the move Bf4" and plain "Bf4" both become "this move"; O-O must not match inside O-O-O.
  const re = new RegExp(`(?:\\b[Tt]he move\\s+)?(?<![A-Za-z0-9-])${escapeRegExp(plain)}[+#]?(?![A-Za-z0-9-])`, 'g')
  return text.replace(re, (_m, offset: number) =>
    offset === 0 || /[.!?]\s$/.test(text.slice(0, offset)) ? 'This move' : 'this move',
  )
}

/** Which little sound goes with a move. */
export function soundFor(san: string): SoundName {
  if (san.startsWith('O-O')) return 'castle'
  if (/[+#]$/.test(san)) return 'check'
  return san.includes('x') ? 'capture' : 'move'
}

/** "White" / "Black". */
export const colourName = (c: Colour): string => (c === 'w' ? 'White' : 'Black')

/** Text from a course, or '' when it is missing or still a 'TODO' placeholder from the writers. */
export const realText = (text: string | undefined | null): string => {
  const t = (text ?? '').trim()
  return t && t.toUpperCase() !== 'TODO' ? t : ''
}
