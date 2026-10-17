// Collects every piece of teaching text in the app together with the board position(s) it belongs to.
// Used by scripts/check-claims.ts. Reads content only; never edits it.
import fs from 'node:fs'
import path from 'node:path'
import { Chess } from 'chess.js'
import type { OpeningCourse, TacticLesson } from '../../../src/types'
import { parsePgnTree, type PgnNode } from '../../../src/lib/pgnTree'

export type UnitKind =
  | 'no-board' // text with no diagram or move attached (overviews, summaries, plain paragraphs)
  | 'opening-comment' // a { comment } after a move in an opening chapter
  | 'opening-card' // a key idea / common mistake card with a diagram
  | 'tactic-caption' // caption under a diagram in a tactics lesson intro
  | 'example-step' // explanation of one move in a worked example
  | 'exercise-hint' // hint of an exercise (position before the solver's first move)
  | 'exercise-explanation' // explanation shown after solving (describes the whole solution line)

/** One position on the line a text talks about, plus the move that led to it (if any). */
export interface LinePos {
  fen: string
  /** move that produced this position, SAN, or '' for the start position of the unit */
  san: string
  from?: string
  to?: string
  /** colour that made `san` */
  mover?: 'w' | 'b'
}

export interface TextUnit {
  kind: UnitKind
  /** human-readable location, e.g. "caro-kann / exchange-bd3 / 1.e4 c6 2.d4 d5 3.exd5" */
  location: string
  file: string
  text: string
  /**
   * Positions in the order the text walks through them. `focus` is the index of the position the text is
   * mainly about (the position right after the move it comments on, or the diagram).
   */
  line: LinePos[]
  focus: number
  /** who "you/your" is, when the text has a clear reader side; null when unclear */
  you: 'w' | 'b' | null
  /** material reference for "wins X" claims: the position the story starts from (index in line) */
  storyStart: number
  /** positions after a move drawn as an arrow on the diagram (the text may describe that position) */
  extra?: LinePos[]
}

/** Positions after each arrow on a diagram that is a legal move for the side to move. */
function arrowPositions(fen: string, arrows: { from: string; to: string }[] | undefined): LinePos[] {
  const out: LinePos[] = []
  for (const a of arrows ?? []) {
    try {
      const g = new Chess(fen)
      const mv = g.move({ from: a.from, to: a.to, promotion: 'q' })
      out.push({ fen: g.fen(), san: mv.san, from: mv.from, to: mv.to, mover: mv.color })
    } catch {
      /* not a legal move: the arrow shows an attack or a move already made */
    }
  }
  return out
}

function movePath(nodes: PgnNode[]): string {
  const out: string[] = []
  for (const n of nodes) {
    const num = Math.ceil(n.ply / 2)
    if (n.mover === 'w') out.push(`${num}.${n.san}`)
    else if (out.length === 0) out.push(`${num}...${n.san}`)
    else out.push(n.san)
  }
  return out.join(' ')
}

function chainTo(nodes: Map<string, PgnNode>, n: PgnNode): PgnNode[] {
  const out: PgnNode[] = []
  let cur: PgnNode | undefined = n
  while (cur && cur.parentId !== null) {
    out.unshift(cur)
    cur = nodes.get(cur.parentId)
  }
  return out
}

function playUci(fen: string, ucis: string[]): LinePos[] {
  const g = new Chess(fen)
  const out: LinePos[] = [{ fen, san: '' }]
  for (const u of ucis) {
    const mv = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined })
    out.push({ fen: g.fen(), san: mv.san, from: mv.from, to: mv.to, mover: mv.color })
  }
  return out
}

const OPENING_FILE: Record<string, string> = {
  london: 'src/data/openings/london.ts',
  'caro-kann': 'src/data/openings/caroKann.ts',
  slav: 'src/data/openings/slav.ts',
}
const OPENINGS_DIR = 'src/data/openings'
let openingSources: { file: string; text: string }[] | null = null
/**
 * The file a chapter is written in, found by its `id: '...'` in the course files, so the report can point at a
 * line even when chapters move between files (the London chapters live in three files today).
 */
const chapterFile = (courseId: string, chapterId: string) => {
  if (!openingSources) {
    openingSources = fs.existsSync(OPENINGS_DIR)
      ? fs
          .readdirSync(OPENINGS_DIR)
          .filter((f) => f.endsWith('.ts'))
          .sort()
          .map((f) => ({ file: path.posix.join(OPENINGS_DIR, f), text: fs.readFileSync(path.join(OPENINGS_DIR, f), 'utf8') }))
      : []
  }
  const idRe = new RegExp(`(?:^|[^\\w])['"]?id['"]?\\s*:\\s*['"\`]${chapterId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`)
  const hits = openingSources.filter((s) => idRe.test(s.text)).map((s) => s.file)
  const main = OPENING_FILE[courseId]
  if (hits.length === 1) return hits[0]
  if (main && hits.includes(main)) return main
  return hits[0] ?? main ?? `src/data/openings (${courseId})`
}

export function openingUnits(courses: OpeningCourse[]): TextUnit[] {
  const units: TextUnit[] = []
  for (const c of courses) {
    const you = c.side === 'white' ? 'w' : 'b'
    const file = OPENING_FILE[c.id] ?? `src/data/openings (${c.id})`
    const cards = [
      ...c.keyIdeas.map((k, i) => ({ k, where: `keyIdeas[${i}]` })),
      ...c.commonMistakes.map((k, i) => ({ k, where: `commonMistakes[${i}]` })),
    ]
    for (const { k, where } of cards) {
      if (!k.fen) continue
      units.push({
        kind: 'opening-card',
        location: `${c.id} / ${where} "${k.title}"`,
        file,
        text: k.text,
        line: [{ fen: k.fen, san: '' }],
        focus: 0,
        you,
        storyStart: 0,
        extra: arrowPositions(k.fen, k.arrows),
      })
    }
    for (const ch of c.chapters) {
      const tree = parsePgnTree(ch.pgn)
      const chFile = chapterFile(c.id, ch.id)
      for (const n of tree.nodes.values()) {
        if (!n.comment) continue
        if (n.id === '') {
          units.push({
            kind: 'opening-comment',
            location: `${c.id} / ${ch.id} / (start)`,
            file: chFile,
            text: n.comment,
            line: [{ fen: n.fen, san: '' }],
            focus: 0,
            you,
            storyStart: 0,
          })
          continue
        }
        const chain = chainTo(tree.nodes, n)
        // the whole line from the start position, so "you won a pawn" can be measured from move 1
        const line: LinePos[] = [{ fen: tree.root.fen, san: '' }]
        for (const step of chain) {
          const g = new Chess(step.fenBefore)
          const mv = g.move(step.san)
          line.push({ fen: step.fen, san: step.san, from: mv.from, to: mv.to, mover: mv.color })
        }
        units.push({
          kind: 'opening-comment',
          location: `${c.id} / ${ch.id} / ${movePath(chain)}`,
          file: chFile,
          text: n.comment,
          line,
          focus: line.length - 1,
          you,
          storyStart: 0,
        })
      }
    }
    // text without a board: still counted, so the report shows what could not be checked
    const plain: [string, string][] = [
      ...c.overview.map((t, i): [string, string] => [`overview[${i}]`, t]),
      ...cards.filter(({ k }) => !k.fen).map(({ k, where }): [string, string] => [`${where} "${k.title}" (no diagram)`, k.text]),
      ...c.chapters.map((ch): [string, string] => [`${ch.id} / summary`, ch.summary]),
    ]
    for (const [where, text] of plain) units.push({ kind: 'no-board', location: `${c.id} / ${where}`, file, text, line: [], focus: 0, you, storyStart: 0 })
  }
  return units
}

const TACTIC_FILE = (id: string) => `src/data/tactics/${id}.ts`

export function tacticUnits(lessons: TacticLesson[]): TextUnit[] {
  const units: TextUnit[] = []
  for (const l of lessons) {
    const file = TACTIC_FILE(l.id)
    l.intro.forEach((b, i) => {
      if (b.type === 'text' || b.type === 'tip') {
        units.push({ kind: 'no-board', location: `${l.id} / intro[${i}] ${b.type}`, file, text: b.text, line: [], focus: 0, you: null, storyStart: 0 })
        return
      }
      if (b.type !== 'board' || !b.caption) return
      units.push({
        kind: 'tactic-caption',
        location: `${l.id} / intro[${i}] caption`,
        file,
        text: b.caption,
        line: [{ fen: b.fen, san: '' }],
        focus: 0,
        you: null,
        storyStart: 0,
        extra: arrowPositions(b.fen, b.arrows),
      })
    })
    l.examples.forEach((ex, ei) => {
      const line = playUci(ex.fen, ex.moves)
      ex.explanations.forEach((t, mi) => {
        units.push({
          kind: 'example-step',
          location: `${l.id} / example ${ei + 1} "${ex.title}" / move ${mi + 1} (${line[mi + 1].san})`,
          file,
          text: t,
          line,
          focus: mi + 1,
          you: null,
          storyStart: 0,
        })
      })
    })
    for (const ex of l.exercises) {
      const line = playUci(ex.fen, ex.solution)
      const you = new Chess(ex.fen).turn()
      if (ex.hint)
        units.push({
          kind: 'exercise-hint',
          location: `${l.id} / exercise ${ex.id} / hint`,
          file,
          text: ex.hint,
          line,
          focus: 0,
          you,
          storyStart: 0,
        })
      units.push({
        kind: 'exercise-explanation',
        location: `${l.id} / exercise ${ex.id} / explanation`,
        file,
        text: ex.explanation,
        line,
        focus: 1,
        you,
        storyStart: 0,
      })
    }
  }
  return units
}

/** Split text into sentences without breaking on move numbers ("6. h4") or "...". */
export function sentences(text: string): string[] {
  const t = text
    .replace(/\*\*/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
  const out: string[] = []
  let start = 0
  const re = /([.!?])(["')]?)\s+(?=["(]?[A-Z0-9.])/g
  let m: RegExpExecArray | null
  while ((m = re.exec(t))) {
    const endIdx = m.index + m[1].length + m[2].length
    const before = t.slice(start, m.index + 1)
    // "6. h4" or "12. Qa4": a move number, not the end of a sentence
    if (m[1] === '.' && /(^|[\s(])\d+\.$/.test(before)) continue
    // "..." directly before a move (e.g. "play ...Nf6") is handled because no space follows it
    out.push(t.slice(start, endIdx).trim())
    start = endIdx
  }
  const rest = t.slice(start).trim()
  if (rest) out.push(rest)
  return out.filter(Boolean)
}
