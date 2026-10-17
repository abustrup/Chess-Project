// Checks the narrowed courses (task O1, 2026-10-16): every line ends by move 8 (its last move is at most
// Black's 8th move, ply 16), apart from the trap lines listed below, and no course has more than 20 chapters.
// Run from the repo root: npx tsx research/2026-10-16-diagnosis/openings-v2/scripts/check_line_length.ts
// Exits 1 on any problem.
import { OPENING_COURSES } from '../../../../src/data/openings/index.ts'
import { parsePgnTree, allLines } from '../../../../src/lib/pgnTree.ts'

const MAX_PLY = 16
const MAX_CHAPTERS = 20

/** Lines allowed past move 8, each with its reason. Matched by course, chapter and the full line. */
const TRAP_LINES: { course: string; chapter: string; line: string; reason: string }[] = [
  {
    course: 'london',
    chapter: 'vs-kings-indian',
    line: 'd4 Nf6 Bf4 g6 Nf3 Bg7 e3 O-O h3 d6 Be2 Nbd7 O-O e5 dxe5 dxe5 Nxe5',
    reason:
      '8.dxe5 (the engine move that replaced 8.Bh2) only makes sense with its point: after 8...dxe5, 9.Nxe5 wins a pawn. One ply past move 8.',
  },
]

let problems = 0
let lines = 0
let chapters = 0
const used = new Set<string>()
for (const course of OPENING_COURSES) {
  chapters += course.chapters.length
  for (const ch of course.chapters) {
    for (const line of allLines(parsePgnTree(ch.pgn))) {
      lines++
      const ply = line[line.length - 1].ply
      if (ply <= MAX_PLY) continue
      const sans = line.map((n) => n.san).join(' ')
      const listed = TRAP_LINES.find((t) => t.course === course.id && t.chapter === ch.id && t.line === sans)
      if (listed) {
        used.add(listed.line)
        console.log(`  listed trap line, ends at ply ${ply}: ${course.id}/${ch.id}: ${sans}`)
        continue
      }
      problems++
      console.log(`  TOO LONG (ply ${ply}): ${course.id}/${ch.id}: ${sans}`)
    }
  }
}
for (const t of TRAP_LINES) {
  if (!used.has(t.line)) console.log(`  note: listed trap line not found any more: ${t.course}/${t.chapter}: ${t.line}`)
}
if (chapters > MAX_CHAPTERS) {
  problems++
  console.log(`  TOO MANY CHAPTERS: ${chapters} (at most ${MAX_CHAPTERS})`)
}
console.log(
  `${OPENING_COURSES.map((c) => `${c.name}: ${c.chapters.length}`).join(', ')} = ${chapters} chapters; ${lines} lines; ` +
    `${problems} problem(s); ${TRAP_LINES.length} listed trap line(s) past move 8`,
)
process.exit(problems ? 1 : 0)
