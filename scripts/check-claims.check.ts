// Self-test of the claim checker:   npx tsx scripts/check-claims.check.ts   (or: npm run check:claims:test)
// Flags: --no-engine      skip the cases that need Stockfish (Part 1 engine cases and Part 3)
//        --verbose        list every mutated sentence that was not caught
//        --write-fixture  save the live mutation cases as the fixed set used by Part 2a (only on purpose: it
//                         replaces the 2026-10-16 set of 93 that the acceptance numbers refer to)
//
// Part 1:  hand-made sentences with a known answer: true claims, false claims, and sentences that must NOT be judged
//          (hypotheticals, questions, hedges). A false claim judged true, or anything judged false that should not be,
//          fails the test.
// Part 2:  a mutation test: claims the checker judged true are changed so that they become wrong (the named target
//          square is swapped for another square holding the same kind of piece that is NOT attacked/guarded), and we
//          count how many the checker then calls false. This estimates how often a real wrong square would be caught.
//   2a:    a fixed set of 93 such sentences taken from the app's text on 2026-10-16 (scripts/lib/claims/fixtures/),
//          so the test measures the checker, not today's course text. All 93 must be caught.
//   2b:    the same mutation on the app's text as it is now. None may still be judged true; at least 80% caught.
// Part 3:  material claims made wrong on purpose ("a pawn up" -> "two rooks up"); needs Stockfish.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { OPENING_COURSES } from '../src/data/openings'
import { TACTIC_LESSONS } from '../src/data/tactics'
import { checkUnits, type ReportRow } from './check-claims'
import { openingUnits, tacticUnits, type TextUnit, type LinePos } from './lib/claims/units'
import { UciEngine } from './lib/claims/engine'
import { Board, attacks, attackersWithXray, NAME, type PieceType, type Piece } from './lib/claims/board'

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'lib/claims/fixtures/mutation-cases.json')

const attacksOrXrayAny = (b: Board, q: Piece, sq: string) => attacks(b, q, sq) || attackersWithXray(b, sq, q.color).some((p) => p.square === q.square)

type Expect = 'true' | 'false' | 'cnp'
interface Case {
  name: string
  unit: TextUnit
  expect: Expect
  needsEngine?: boolean
}

/** a diagram caption (no reader side) */
function diagram(fen: string, text: string): TextUnit {
  return { kind: 'tactic-caption', location: 'test', file: 'test', text, line: [{ fen, san: '' }], focus: 0, you: null, storyStart: 0 }
}
/** a comment written under the last move of a line played from the start position; `you` plays `side` */
function comment(moves: string, text: string, side: 'w' | 'b'): TextUnit {
  const g = new Chess()
  const line: LinePos[] = [{ fen: g.fen(), san: '' }]
  for (const san of moves.split(' ')) {
    const m = g.move(san)
    line.push({ fen: g.fen(), san: m.san, from: m.from, to: m.to, mover: m.color })
  }
  return { kind: 'opening-comment', location: 'test', file: 'test', text, line, focus: line.length - 1, you: side, storyStart: 0 }
}

const RUY = 'e4 e5 Nf3 Nc6 Bb5'
const QGD = 'd4 d5 c4 e6 Nc3 Nf6 Bg5'
const FORK = 'r3k3/ppN2ppp/8/8/8/8/PPP2PPP/4K3 b - - 1 1'
const BACKRANK = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'
const NOMATE = '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1'
const HANG = '4k3/8/8/3n4/8/8/8/3RK3 w - - 0 1'
const TRAPPED = 'k7/Bpp5/1p6/8/8/8/8/6K1 w - - 0 1'
const NOT_TRAPPED = 'k7/Bp6/1p6/8/8/8/8/6K1 w - - 0 1'
const SCOTCH = 'e4 e5 Nf3 Nc6 d4'
const BLOCKED = '4k3/8/8/4N3/8/4P3/4Q3/4K3 b - - 0 1'

const CASES: Case[] = [
  // ---- true claims
  { name: 'bishop attacks the knight (Ruy Lopez)', unit: comment(RUY, 'The bishop attacks the knight on c6.', 'w'), expect: 'true' },
  { name: 'knight attacks e5', unit: comment(RUY, 'The knight on f3 attacks the pawn on e5.', 'w'), expect: 'true' },
  { name: 'e5 guarded by the c6-knight', unit: comment(RUY, 'The pawn on e5 is guarded by the knight on c6.', 'w'), expect: 'true' },
  { name: 'instruction under the move: pin the knight', unit: comment(QGD, 'Pin the knight on f6.', 'w'), expect: 'true' },
  { name: 'fork: check and attack', unit: diagram(FORK, 'The knight on c7 checks the king and attacks the rook on a8.'), expect: 'true' },
  { name: 'pronoun continues the topic', unit: diagram(FORK, 'The knight jumped to c7. It attacks the rook on a8.'), expect: 'true' },
  { name: 'Ra8 is checkmate', unit: diagram(BACKRANK, 'Ra8 is checkmate.'), expect: 'true' },
  { name: 'loose knight is hanging', unit: diagram(HANG, 'The knight on d5 is hanging.'), expect: 'true', needsEngine: true },
  { name: 'bishop trapped on a7', unit: diagram(TRAPPED, 'The bishop on a7 is trapped.'), expect: 'true' },
  { name: 'e5 attacked twice (Scotch)', unit: comment(SCOTCH, 'The pawn on e5 is attacked twice.', 'w'), expect: 'true' },
  { name: 'pawn guarded by the queen behind it', unit: diagram(BLOCKED, 'The pawn on e3 is guarded by the queen.'), expect: 'true' },
  { name: 'gambit pawn: you are a pawn up', unit: comment('e4 d5 exd5 Nf6 c4 c6', 'You are a pawn up.', 'w'), expect: 'true' },
  { name: 'capture under the move', unit: comment('e4 d5 exd5', 'White takes the pawn on d5.', 'w'), expect: 'true' },
  { name: 'White has mate in one', unit: diagram(BACKRANK, 'White has mate in one.'), expect: 'true', needsEngine: true },
  { name: 'rook on a8 gives check', unit: diagram('R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1', 'The rook on a8 gives check.'), expect: 'true' },
  // ---- false claims
  { name: 'bishop does not attack e5', unit: comment(RUY, 'The bishop attacks the pawn on e5.', 'w'), expect: 'false' },
  { name: 'c6-knight is not pinned (d7 pawn in between)', unit: comment(RUY, 'The knight on c6 is pinned to the king.', 'w'), expect: 'false' },
  { name: 'f6-knight is pinned to the queen, not the king', unit: comment(QGD, 'The knight on f6 is pinned to the king.', 'w'), expect: 'false' },
  { name: 'knight on c7 does not attack b7', unit: diagram(FORK, 'The knight on c7 attacks the pawn on b7.'), expect: 'false' },
  { name: 'Ra7 is not mate', unit: diagram(BACKRANK, 'Ra7 is checkmate.'), expect: 'false' },
  { name: 'no mate in two without the rook', unit: diagram(NOMATE, 'White has mate in two.'), expect: 'false', needsEngine: true },
  { name: 'loose knight is not safe', unit: diagram(HANG, 'The knight on d5 is safe.'), expect: 'false', needsEngine: true },
  { name: 'bishop on a7 can take b6 safely', unit: diagram(NOT_TRAPPED, 'The bishop on a7 is trapped.'), expect: 'false' },
  { name: 'e5 is guarded once, not twice', unit: comment(SCOTCH, 'The pawn on e5 is protected twice.', 'w'), expect: 'false' },
  { name: 'e5 is not undefended', unit: comment(RUY, 'The pawn on e5 is undefended.', 'w'), expect: 'false' },
  { name: 'queen guard blocked by its own pawn', unit: diagram(BLOCKED, 'The queen guards the knight on e5.'), expect: 'false' },
  { name: 'gambit pawn: not a piece up', unit: comment('e4 d5 exd5 Nf6 c4 c6', 'You are a piece up.', 'w'), expect: 'false', needsEngine: true },
  { name: 'exd5 took a pawn, not a knight', unit: comment('e4 d5 exd5', 'The pawn takes the knight.', 'w'), expect: 'false' },
  { name: 'no check on the board', unit: diagram(BACKRANK, 'The rook on a1 gives check.'), expect: 'false' },
  // ---- must not be judged (hypothetical, question, hedge, plan)
  { name: 'conditional with an unwritten move', unit: comment(RUY, 'If the knight moves, the bishop attacks the king.', 'w'), expect: 'cnp' },
  { name: 'plan with a move in words', unit: comment(QGD, 'Next you can bring the queen to c2, and then it attacks h7.', 'w'), expect: 'cnp' },
  { name: 'plan with the move written out is tested', unit: comment(QGD, 'If you play Qc2, the queen attacks h7.', 'w'), expect: 'true' },
  { name: 'question', unit: diagram(FORK, 'Can the knight on c7 attack the king on g8?'), expect: 'cnp' },
  { name: 'hedged', unit: comment(RUY, 'The bishop usually attacks the queen here.', 'w'), expect: 'cnp' },
  { name: 'counterfactual "before"', unit: comment(RUY, 'Retreat the bishop before Black plays a6, which would attack it.', 'w'), expect: 'cnp' },
]

function judge(rows: ReportRow[]): Expect | 'none' {
  const parsed = rows.filter((r) => !r.claim.startsWith('(unread'))
  if (!parsed.length) return 'none'
  if (parsed.some((r) => r.verdict === 'false')) return 'false'
  if (parsed.every((r) => r.verdict === 'true')) return 'true'
  if (parsed.every((r) => r.verdict === 'could-not-parse')) return 'cnp'
  return 'true' // a mix of true and not-judged: the testable part was true
}

/** One true attack/guard claim from the app's text, rewritten so that it names a wrong square. */
interface MutationCase {
  location: string
  claim: 'attacks' | 'guards'
  sentence: string
  mutated: string
  /** the wrong square the sentence now names */
  alt: string
  /** the text the sentence belongs to, with the mutated sentence already written in */
  unit: TextUnit
}

/** Build the strict mutation cases from the checker's verdicts on `units` (rows from checkUnits without engine). */
function mutationCases(units: TextUnit[], base: ReportRow[]): MutationCase[] {
  const out: MutationCase[] = []
  const seen = new Set<string>()
  for (const r of base.filter((x) => x.verdict === 'true' && /^(attacks|guards)\(/.test(x.claim) && x.fen)) {
    // only claims whose target is written as "<piece> on <square>", e.g. attacks(the bishop -> the knight on c6)
    const lab = /^(attacks|guards)\((.*) -> (.*)\)$/.exec(r.claim)
    if (!lab) continue
    const m = /\b(knight|bishop|rook|queen|pawn) on ([a-h][1-8])$/i.exec(lab[3])
    if (!m) continue
    const unit = units.find((u) => u.location === r.location && u.text.includes(r.sentence))
    if (!unit) continue
    const b = new Board(r.fen!)
    const type = Object.entries(NAME).find(([, v]) => v === m[1].toLowerCase())?.[0] as PieceType
    const orig = b.at(m[2])
    if (!orig || orig.type !== type) continue
    // a square with the same kind of piece of the same colour where the claim is false under every reading:
    // nothing of the other colour attacks it (for "attacks"), nothing of its own colour guards it (for "guards")
    const side = lab[1] === 'attacks' ? (orig.color === 'w' ? 'b' : 'w') : orig.color
    const alt = b
      .pieces({ type, color: orig.color })
      .find((p) => p.square !== m[2] && !b.pieces({ color: side }).some((q) => q.square !== p.square && attacksOrXrayAny(b, q, p.square)))
    if (!alt) continue
    const key = `${r.location}|${r.sentence}|${m[2]}`
    if (seen.has(key)) continue
    seen.add(key)
    const mutated = r.sentence.replace(new RegExp(`(${m[1]}\\s+on\\s+)${m[2]}`, 'i'), `$1${alt.square}`)
    if (mutated === r.sentence) continue
    out.push({
      location: r.location,
      claim: lab[1] as MutationCase['claim'],
      sentence: r.sentence,
      mutated,
      alt: alt.square,
      unit: { ...unit, text: unit.text.replace(r.sentence, mutated) },
    })
  }
  return out
}

/** Run mutation cases: caught = judged false, stillTrue = judged true (a real miss), the rest not judged. */
async function runMutations(cases: MutationCase[], verbose: boolean) {
  let caught = 0
  let stillTrue = 0
  let notJudged = 0
  for (const c of cases) {
    const rows = await checkUnits([c.unit], null)
    const v = judge(rows.filter((x) => x.sentence === c.mutated && x.claim.startsWith(c.claim + '(') && x.claim.endsWith(`on ${c.alt})`)))
    if (v === 'false') caught++
    else if (v === 'true') {
      stillTrue++
      if (verbose) console.log(`  still true: "${c.mutated}" (${c.location})`)
    } else {
      notJudged++
      if (verbose) console.log(`  not judged: "${c.mutated}" (${c.location})`)
    }
  }
  return { tried: cases.length, caught, stillTrue, notJudged }
}

async function main() {
  const useEngine = !process.argv.includes('--no-engine')
  const verbose = process.argv.includes('--verbose')
  const engine = useEngine ? await UciEngine.create({ threads: 1, hashMb: 64 }) : null
  if (useEngine && !engine) {
    console.log('Stockfish was not found (set STOCKFISH=/path/to/stockfish), so the engine cases cannot run. Use --no-engine to skip them on purpose.')
    process.exit(2)
  }
  let failures = 0
  let ran = 0
  let passed = 0
  const tally = { true: 0, false: 0, cnp: 0 }
  console.log('Part 1: hand-made sentences')
  for (const c of CASES) {
    if (c.needsEngine && !engine) {
      console.log(`skip ${c.name} (needs Stockfish)`)
      continue
    }
    ran++
    tally[c.expect]++
    const rows = await checkUnits([c.unit], engine)
    const got = judge(rows)
    const ok = got === c.expect || (c.expect === 'cnp' && got === 'none')
    if (ok) passed++
    else failures++
    console.log(`${ok ? 'ok  ' : 'FAIL'} [expect ${c.expect.padEnd(5)} got ${got.padEnd(5)}] ${c.name}`)
    if (!ok) for (const r of rows) console.log(`       ${r.verdict}: ${r.claim}: ${r.reason}`)
  }
  console.log(`\n${ran} cases (${tally.true} true, ${tally.false} false, ${tally.cnp} must-not-judge), ${ran - passed} failed`)
  console.log(`RESULT Part 1: ${passed} of ${CASES.length} hand-made cases passed${ran < CASES.length ? ` (${CASES.length - ran} skipped without Stockfish)` : ''}`)

  // ---- Part 2: mutation tests (no engine needed)
  const units = [...openingUnits(OPENING_COURSES), ...tacticUnits(TACTIC_LESSONS)]
  const base = await checkUnits(units, null)
  const live = mutationCases(units, base)
  if (process.argv.includes('--write-fixture')) {
    fs.mkdirSync(path.dirname(FIXTURE), { recursive: true })
    const doc = {
      note: 'Fixed mutation cases for scripts/check-claims.check.ts Part 2a: true attack/guard claims from the app text, rewritten to name a wrong square. Regenerate only on purpose (--write-fixture).',
      generated: new Date().toISOString().slice(0, 10),
      count: live.length,
      cases: live,
    }
    fs.writeFileSync(FIXTURE, JSON.stringify(doc, null, 1) + '\n')
    console.log(`\nwrote ${live.length} mutation cases to ${path.relative(process.cwd(), FIXTURE)}`)
  }

  console.log('\nPart 2a: mutation test on the fixed set of real sentences (from the app text of 2026-10-16)')
  if (!fs.existsSync(FIXTURE)) {
    console.log(`FAIL: ${FIXTURE} is missing`)
    failures++
  } else {
    const fixed = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) as { generated: string; cases: MutationCase[] }
    const res = await runMutations(fixed.cases, verbose)
    console.log(`mutated ${res.tried} true attack/guard claims to a wrong square: ${res.caught} judged false, ${res.stillTrue} still judged true, ${res.notJudged} not judged`)
    console.log(`RESULT Part 2a: ${res.caught} of ${res.tried} wrong squares caught (fixed set from ${fixed.generated})`)
    if (res.caught !== res.tried) {
      console.log('FAIL: every sentence of the fixed set must be judged false')
      failures++
    }
  }

  console.log('\nPart 2b: the same mutation on the app text as it is now')
  const now = await runMutations(live, verbose)
  console.log(`mutated ${now.tried} true attack/guard claims to a wrong square: ${now.caught} judged false, ${now.stillTrue} still judged true, ${now.notJudged} not judged`)
  console.log(`RESULT Part 2b: ${now.caught} of ${now.tried} wrong squares caught (today's text)`)
  if (now.stillTrue) {
    console.log('FAIL: a claim made wrong on purpose was still judged true')
    failures++
  }
  const minCatch = 0.8
  if (now.tried && now.caught / now.tried < minCatch) {
    console.log(`FAIL: catch rate ${(now.caught / now.tried).toFixed(2)} below ${minCatch}`)
    failures++
  }
  // looser mutation, for information only: the square is wrong for the named piece, but another reading of a vague
  // subject ("White protects ...", an instruction) may still make it true; the checker is lenient there on purpose
  let looseTried = 0
  let looseCaught = 0
  for (const r of base.filter((x) => x.verdict === 'true' && /^(attacks|guards)\(/.test(x.claim) && x.fen)) {
    const lab = /^(attacks|guards)\((.*) -> (.*)\)$/.exec(r.claim)
    const m = lab && /\b(knight|bishop|rook|queen|pawn) on ([a-h][1-8])$/i.exec(lab[3])
    if (!lab || !m) continue
    const unit = units.find((u) => u.location === r.location && u.text.includes(r.sentence))
    if (!unit) continue
    const b = new Board(r.fen!)
    const type = Object.entries(NAME).find(([, v]) => v === m[1].toLowerCase())?.[0] as PieceType
    const orig = b.at(m[2])
    if (!orig || orig.type !== type) continue
    const subjects = b.pieces().filter((p) => attacks(b, p, m[2]))
    const alt = b.pieces({ type, color: orig.color }).find((p) => p.square !== m[2] && !subjects.some((q) => attacks(b, q, p.square)))
    if (!alt) continue
    const mutated = r.sentence.replace(new RegExp(`(${m[1]}\\s+on\\s+)${m[2]}`, 'i'), `$1${alt.square}`)
    if (mutated === r.sentence) continue
    looseTried++
    const rows = await checkUnits([{ ...unit, text: unit.text.replace(r.sentence, mutated) }], null)
    if (judge(rows.filter((x) => x.sentence === mutated && x.claim.startsWith(lab[1] + '(') && x.claim.endsWith(`on ${alt.square})`))) === 'false') looseCaught++
  }
  console.log(`looser mutation (wrong for the named piece only): ${looseCaught} of ${looseTried} judged false (information only)`)

  // ---- Part 3: material claims made wrong on purpose ("a pawn up" -> "a rook up"); needs Stockfish
  if (engine) {
    console.log('\nPart 3: material claims made wrong on purpose (Stockfish)')
    const withEngine = await checkUnits(units.filter((u) => /\b(pawn|piece) up\b/i.test(u.text)), engine)
    const mat = withEngine.filter((r) => r.verdict === 'true' && /^material\(/.test(r.claim))
    let mt = 0
    let mc = 0
    let mTrue = 0
    for (const r of mat.slice(0, 40)) {
      const unit = units.find((u) => u.location === r.location && u.text.includes(r.sentence))
      if (!unit) continue
      const mutated = r.sentence.replace(/\b(a|one)\s+((?:clean|whole|solid)\s+)?(pawn|piece)\s+up\b/i, (_x, _a, adj, w) => `two ${adj ?? ''}${w === 'pawn' ? 'rooks' : 'queens'} up`)
      if (mutated === r.sentence) continue
      mt++
      const rows = await checkUnits([{ ...unit, text: unit.text.replace(r.sentence, mutated) }], engine)
      const v = judge(rows.filter((x) => x.sentence === mutated && x.claim.startsWith('material(')))
      if (v === 'false') mc++
      else if (v === 'true') mTrue++
      if (v !== 'false' && verbose) console.log(`  not caught (${v}): "${mutated}" (${r.location})`)
    }
    console.log(`material claims turned wrong: ${mc} of ${mt} judged false, ${mTrue} judged true`)
    if (mTrue) {
      console.log('FAIL: a material claim made wrong on purpose was judged true')
      failures++
    }
  }
  engine?.close()
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed')
  process.exit(failures ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
