// Exports every position in the app's opening courses with the course moves from it (SAN),
// so the Python analysis can find where the owner's real games leave the repertoire.
// Run: node_modules/.bin/tsx research/2026-10-16-diagnosis/my-games/scripts/export_courses.ts > out.json
import { OPENING_COURSES } from '../../../../src/data/openings/index.ts'
import { parsePgnTree, type PgnNode } from '../../../../src/lib/pgnTree.ts'

const key = (fen: string) => fen.split(' ').slice(0, 3).join(' ')
const out: Record<string, { side: string; name: string; signature: string[]; positions: Record<string, string[]>; maxPly: number }> = {}
for (const c of OPENING_COURSES) {
  const positions: Record<string, string[]> = {}
  let maxPly = 0
  for (const ch of c.chapters) {
    const tree = parsePgnTree(ch.pgn)
    const visit = (n: PgnNode, ply: number) => {
      for (const child of n.children) {
        const k = key(child.fenBefore)
        const arr = positions[k] ?? (positions[k] = [])
        if (!arr.includes(child.san)) arr.push(child.san)
        maxPly = Math.max(maxPly, ply + 1)
        visit(child, ply + 1)
      }
    }
    visit(tree.root, 0)
  }
  out[c.id] = { side: c.side, name: c.name, signature: c.signatureMoves, positions, maxPly }
}
console.log(JSON.stringify(out))
