// Dumps every move of every opening course as JSON, using the app's own PGN parser,
// so the deep check looks at exactly the positions the app shows.
// Run (normally called by check.py): npx tsx scripts/deep-check-openings/extract.ts > positions.json
import { OPENING_COURSES } from '../../src/data/openings'
import { parsePgnTree, type PgnNode } from '../../src/lib/pgnTree'

interface Out {
  course: string
  courseName: string
  side: 'white' | 'black'
  chapter: string
  chapterTitle: string
  nodeId: string
  ply: number
  mover: 'w' | 'b'
  byOwner: boolean
  fenBefore: string
  fenAfter: string
  san: string
  uci: string
  nags: number[]
  comment: string
  /** 0 = first listed move at that position (for the owner: the move the app teaches). */
  siblingIndex: number
  siblingCount: number
  /** SAN moves from the start position up to and including this move. */
  path: string[]
  isLeaf: boolean
}

const out: Out[] = []
for (const course of OPENING_COURSES) {
  const userColor = course.side === 'white' ? 'w' : 'b'
  for (const ch of course.chapters) {
    const tree = parsePgnTree(ch.pgn)
    const walk = (n: PgnNode, path: string[]) => {
      n.children.forEach((c, i) => {
        const p = [...path, c.san]
        out.push({
          course: course.id,
          courseName: course.name,
          side: course.side,
          chapter: ch.id,
          chapterTitle: ch.title,
          nodeId: c.id,
          ply: c.ply,
          mover: c.mover as 'w' | 'b',
          byOwner: c.mover === userColor,
          fenBefore: c.fenBefore,
          fenAfter: c.fen,
          san: c.san,
          uci: c.uci,
          nags: c.nags,
          comment: c.comment,
          siblingIndex: i,
          siblingCount: n.children.length,
          path: p,
          isLeaf: c.children.length === 0,
        })
        walk(c, p)
      })
    }
    walk(tree.root, [])
  }
}
process.stdout.write(JSON.stringify(out))
