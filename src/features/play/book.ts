// The "opening book" the computer follows in Practise / Face modes.
//
// A book is made from the PGN of one chapter (or of every chapter of a course, for "Surprise me").
// While the game stays inside the prepared moves, the computer answers from the book. As soon as
// somebody plays a move that is not in the book, the book is over and the engine takes charge.

import type { OpeningChapter, OpeningCourse } from '../../types'
import { mainLine, parsePgnTree, type PgnNode, type PgnTree } from '../../lib/pgnTree'
import { ANY_CHAPTER } from './types'

export interface Book {
  trees: { chapter: OpeningChapter; tree: PgnTree }[]
  /**
   * 'opponent': the computer plays the OTHER side of the course (Practise mode). Every listed move is a
   *             reply we prepared for; the first is the most common.
   * 'repertoire': the computer plays the course's own side (Face mode). The first move is the main move,
   *             the others are occasional alternatives.
   */
  role: 'opponent' | 'repertoire'
}

const parsed = new Map<string, PgnTree | null>()

function treeOf(course: OpeningCourse, chapter: OpeningChapter): PgnTree | null {
  const key = `${course.id}/${chapter.id}`
  if (!parsed.has(key)) {
    try {
      parsed.set(key, parsePgnTree(chapter.pgn))
    } catch {
      parsed.set(key, null) // a broken chapter must never break the game
    }
  }
  return parsed.get(key) ?? null
}

export function buildBook(course: OpeningCourse, chapterId: string, role: Book['role']): Book {
  const chapters = chapterId === ANY_CHAPTER ? course.chapters : course.chapters.filter((c) => c.id === chapterId)
  const trees: Book['trees'] = []
  for (const chapter of chapters) {
    const tree = treeOf(course, chapter)
    if (tree) trees.push({ chapter, tree })
  }
  return { trees, role }
}

/** Where the game currently is in each chapter's tree (chapters the game has left are dropped). */
export function liveNodes(book: Book, ucis: string[]): { chapter: OpeningChapter; node: PgnNode }[] {
  const out: { chapter: OpeningChapter; node: PgnNode }[] = []
  for (const { chapter, tree } of book.trees) {
    let node: PgnNode | undefined = tree.root
    for (const u of ucis) {
      node = node.children.find((c) => c.uci === u)
      if (!node) break
    }
    if (node) out.push({ chapter, node })
  }
  return out
}

/** Still inside the prepared moves? (A game that reached the end of a line counts as still in the book.) */
export function isInBook(book: Book, ucis: string[]): boolean {
  return liveNodes(book, ucis).length > 0
}

/** The book move to play now, or null if the book has nothing (the game left it, or the line ended). */
export function pickBookMove(book: Book, ucis: string[], rng: () => number = Math.random): PgnNode | null {
  const weights = new Map<string, { node: PgnNode; weight: number }>()
  for (const { node } of liveNodes(book, ucis)) {
    node.children.forEach((child, i) => {
      const w = book.role === 'opponent' ? 1 / (i + 1) : Math.pow(0.25, i)
      const prev = weights.get(child.uci)
      weights.set(child.uci, { node: prev?.node ?? child, weight: (prev?.weight ?? 0) + w })
    })
  }
  const options = [...weights.values()]
  if (options.length === 0) return null
  let r = rng() * options.reduce((s, o) => s + o.weight, 0)
  for (const o of options) {
    r -= o.weight
    if (r <= 0) return o.node
  }
  return options[options.length - 1].node
}

/** The move the lesson wants from the player now (first listed move), for the Hint button. */
export function lessonMove(book: Book, ucis: string[]): { node: PgnNode; chapter: OpeningChapter } | null {
  for (const { chapter, node } of liveNodes(book, ucis)) {
    if (node.children.length > 0) return { node: node.children[0], chapter }
  }
  return null
}

/** "1.d4 d5 2.Bf4 Nf6" - the first few moves of a chapter's main line, for the setup screen. */
export function previewMoves(course: OpeningCourse, chapter: OpeningChapter, plies = 8): string {
  const tree = treeOf(course, chapter)
  if (!tree) return ''
  return formatMoves(mainLine(tree.root).slice(0, plies).map((n) => n.san))
}

function formatMoves(sans: string[]): string {
  return sans.map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}.${san}` : san)).join(' ')
}
