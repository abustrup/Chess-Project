// Exports every opening chapter's move tree as flat JSON so the Python analysis can read it.
// Run from the repo root: npx tsx research/2026-10-16-diagnosis/openings/scripts/export_courses.ts OUT.json
import fs from 'node:fs'
import { OPENING_COURSES } from '../../../../src/data/openings/index.ts'
import { parsePgnTree, type PgnNode } from '../../../../src/lib/pgnTree.ts'

const key = (fen: string) => fen.split(' ').slice(0, 4).join(' ')
const out: any[] = []
for (const c of OPENING_COURSES) {
  const chapters: any[] = []
  for (const ch of c.chapters) {
    const tree = parsePgnTree(ch.pgn)
    const nodes: any[] = []
    const visit = (n: PgnNode, path: string[], main: boolean) => {
      n.children.forEach((child, i) => {
        const p = [...path, child.san]
        nodes.push({ ply: child.ply, san: child.san, uci: child.uci, mover: child.mover, before: key(child.fenBefore), after: key(child.fen),
          main: main && i === 0, first: i === 0, path: p, comment: child.comment, nags: child.nags })
        visit(child, p, main && i === 0)
      })
    }
    visit(tree.root, [], true)
    chapters.push({ id: ch.id, title: ch.title, difficulty: ch.difficulty, summary: ch.summary, nodes })
  }
  out.push({ id: c.id, name: c.name, side: c.side, signatureMoves: c.signatureMoves, chapters })
}
fs.writeFileSync(process.argv[2], JSON.stringify(out))
for (const c of out) console.log(c.id, c.side, c.chapters.length, 'chapters', c.chapters.map((h: any) => `${h.id}:${h.nodes.length}`).join(' '))
