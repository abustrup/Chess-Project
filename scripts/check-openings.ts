// Run: npx tsx scripts/check-openings.ts
// Checks every opening chapter: all moves legal, structure sane, comments present. Exits 1 on errors.
import { OPENING_COURSES } from '../src/data/openings'
import { parsePgnTree, allLines, type PgnNode } from '../src/lib/pgnTree'

let errors = 0
let warnings = 0
const err = (m: string) => (errors++, console.log('  ERROR  ' + m))
const warn = (m: string) => (warnings++, console.log('  warn   ' + m))

for (const course of OPENING_COURSES) {
  console.log(`\n== ${course.name} (user plays ${course.side}) — ${course.chapters.length} chapters`)
  if (!course.chapters.length) warn('no chapters yet')
  const userColor = course.side === 'white' ? 'w' : 'b'
  const ids = new Set<string>()
  for (const ch of course.chapters) {
    if (ids.has(ch.id)) err(`duplicate chapter id ${ch.id}`)
    ids.add(ch.id)
    let tree
    try {
      tree = parsePgnTree(ch.pgn)
    } catch (e) {
      err(`${ch.id}: ${(e as Error).message}`)
      continue
    }
    const lines = allLines(tree)
    let userMoves = 0
    let uncommented = 0
    for (const n of tree.nodes.values()) {
      if (n.id === '') continue
      if (n.mover === userColor) {
        userMoves++
        if (!n.comment) uncommented++
      }
    }
    // after the user's move the opponent is to move; at user's turn nodes the first child is "the" move.
    const maxPly = Math.max(...lines.map((l) => l.length))
    console.log(`  ${ch.id.padEnd(28)} lines=${String(lines.length).padStart(3)} depth=${String(maxPly).padStart(2)} userMoves=${String(userMoves).padStart(3)} uncommented=${uncommented}`)
    if (lines.length < 2) warn(`${ch.id}: fewer than 2 lines`)
    if (uncommented > userMoves * 0.4) warn(`${ch.id}: ${uncommented}/${userMoves} of your moves have no explanation`)
    const root = tree.root
    const visit = (n: PgnNode) => {
      // leaf where it is the user's turn with no continuation is fine; leaf right after user's move means opponent reply missing
      if (n.children.length === 0 && n.mover === userColor && n.id !== '') warn(`${ch.id}: line ends right after YOUR move at ply ${n.ply} (${n.san}); add the opponent's reply?`)
      n.children.forEach(visit)
    }
    visit(root)
  }
}
console.log(`\n${errors} error(s), ${warnings} warning(s)`)
process.exit(errors ? 1 : 0)
