// Measures how much of what 1000-1599 Lichess opponents actually play is covered by the app's opening courses.
import fs from 'node:fs'
import { Chess } from '/Users/alexanderbustrup/Chess-Project/node_modules/chess.js/dist/esm/chess.js'
import { OPENING_COURSES } from '/Users/alexanderbustrup/Chess-Project/src/data/openings/index.ts'
import { parsePgnTree, type PgnNode } from '/Users/alexanderbustrup/Chess-Project/src/lib/pgnTree.ts'

const [file, lo, hi] = process.argv.slice(2)
const LO = +lo, HI = +hi
const key = (fen: string) => fen.split(' ').slice(0, 3).join(' ')
const MAXPLY = 20
const LOOKAHEAD = process.argv[5] === 'lookahead'

// 1. course position -> ordered list of course moves (SAN)
const courseMoves = new Map<string, Map<string, string[]>>() // course -> key -> sans
for (const c of OPENING_COURSES) {
  const m = new Map<string, string[]>()
  for (const ch of c.chapters) {
    const tree = parsePgnTree(ch.pgn)
    const visit = (n: PgnNode) => {
      for (const child of n.children) {
        const k = key(child.fenBefore)
        const arr = m.get(k) ?? []
        if (!arr.includes(child.san)) arr.push(child.san)
        m.set(k, arr)
        visit(child)
      }
    }
    visit(tree.root)
  }
  courseMoves.set(c.id, m)
  console.log(`${c.name}: ${c.chapters.length} chapters, ${m.size} distinct positions with a course move`)
}

// 2. band games -> position -> reply counts
const lines = fs.readFileSync(file, 'utf8').trim().split('\n')
const stats = new Map<string, Map<string, number>>()
let used = 0
for (const l of lines) {
  const g = JSON.parse(l)
  if (!['blitz', 'rapid', 'classical'].includes(g.sp) || g.w < LO || g.w > HI || g.b < LO || g.b > HI) continue
  if (g.mv[0] !== 'd4' && !(g.mv[0] === 'e4' && g.mv[1] === 'c6')) continue
  used++
  const ch = new Chess()
  for (let i = 0; i < Math.min(MAXPLY, g.mv.length); i++) {
    const k = key(ch.fen())
    let mv
    try { mv = ch.move(g.mv[i]) } catch { break }
    const s = stats.get(k) ?? new Map<string, number>()
    s.set(mv.san, (s.get(mv.san) ?? 0) + 1)
    stats.set(k, s)
  }
}
console.log(`band ${LO}-${HI}, blitz/rapid/classical, games starting 1.d4 or 1.e4 c6: ${used}`)

// 3. walk
function walk(courseId: string, own: 'w' | 'b', rootMoves: string[]) {
  const cm = courseMoves.get(courseId)!
  const gaps: { line: string; mass: number; n: number }[] = []
  const stayByOppPly: number[] = []
  let ended = 0, rare = 0, rescued = 0
  const ch = new Chess()
  for (const m of rootMoves) ch.move(m)
  const rec = (seq: string[], p: number, oppMovesSoFar: number) => {
    const k = key(ch.fen())
    const turn = ch.turn()
    if (seq.length >= MAXPLY) { ended += p; return }
    if (turn === own) {
      const mvs = cm.get(k)
      if (!mvs || !mvs.length) { ended += p; return }
      ch.move(mvs[0]); rec([...seq, mvs[0]], p, oppMovesSoFar); ch.undo()
    } else {
      const s = stats.get(k)
      const tot = s ? [...s.values()].reduce((a, b) => a + b, 0) : 0
      const cmv = cm.get(k) ?? []
      if (!cmv.length) { ended += p; return }
      if (tot < 20) { rare += p; return }
      for (const [san, n] of s!) {
        const q = p * n / tot
        // covered if the course has this move from here, or the resulting position is a course position (transposition)
        ch.move(san)
        const inCourse = cmv.includes(san) || cm.has(key(ch.fen()))
        let rescue: string | null = null
        if (!inCourse && LOOKAHEAD) {
          // transposition rescue: one own move from here lands on a course position
          for (const own2 of ch.moves()) { ch.move(own2); const ok = cm.has(key(ch.fen())); ch.undo(); if (ok) { rescue = own2; break } }
        }
        if (inCourse) {
          rec([...seq, san], q, oppMovesSoFar + 1)
        } else if (rescue) {
          rescued += q
          ch.move(rescue); rec([...seq, san, rescue], q, oppMovesSoFar + 1); ch.undo()
        } else gaps.push({ line: [...seq, san].join(' '), mass: q, n })
        ch.undo()
      }
    }
  }
  rec(rootMoves, 1, 0)
  const totalGap = gaps.reduce((a, g) => a + g.mass, 0)
  console.log(`\n== ${courseId} (you play ${own === 'w' ? 'White' : 'Black'}; given ${rootMoves.join(' ') || 'start'}; following the course's first-listed move)`)
  console.log(`opponent leaves the course (a gap) in ${(100 * totalGap).toFixed(1)}% of games; course runs out normally ${(100 * ended).toFixed(1)}%; position too rare in sample (<20 games) ${(100 * rare).toFixed(1)}%; reached course only by a one-move transposition ${(100 * rescued).toFixed(1)}%`)
  // cumulative gap by opponent move number
  const gapByOpp: number[] = []
  for (const g of gaps) { const parts = g.line.split(' '); const oppIdx = parts.filter((_, i) => (i % 2 === 0 ? 'w' : 'b') !== own).length; gapByOpp[oppIdx] = (gapByOpp[oppIdx] ?? 0) + g.mass }
  let cum = 0
  console.log('cumulative gap by the opponent\'s Nth move: ' + gapByOpp.map((v, i) => v ? (cum += v, `#${i}: ${(100 * cum).toFixed(1)}%`) : '').filter(Boolean).join(', '))
  gaps.sort((a, b) => b.mass - a.mass)
  console.log('biggest gaps (share of your games in this repertoire that reach this uncovered opponent move):')
  for (const g of gaps.slice(0, 10)) console.log(`  ${(100 * g.mass).toFixed(1)}%  ${g.line}  (n=${g.n})`)
}
walk('london', 'w', [])
walk('caro-kann', 'b', ['e4'])
walk('slav', 'b', ['d4'])
