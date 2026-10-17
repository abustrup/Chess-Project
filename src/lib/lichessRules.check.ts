// Lichess's move rules, checked against trainer-spec section 7A (A1-A7) and the pre-registered Python rule:
//   npx tsx src/lib/lichessRules.check.ts
// With --label it instead reads vectors [before, after, moverWhite, playedIsBest] as JSON on stdin and prints this
// module's verdicts; scripts/check-rule-parity.py uses that to compare it with prereg/lichess_rule.py directly.
import { readFileSync } from 'node:fs'
import type { Side } from '../types'
import {
  LICHESS_START,
  isRetroCandidate,
  lichessApiEval,
  povDiff,
  rawWinningChances,
  retroAccept,
  retroEvalReady,
  serverDrop,
  serverJudgment,
  winningChances,
  type Eval,
  type Judgment,
} from './lichessRules'

interface FixtureEntry {
  eval?: number
  mate?: number
  best?: string
  judgment?: Judgment
}
interface FixtureGame {
  id: string
  speed: string
  side: Side
  moves: string
  analysis: FixtureEntry[]
}
type Bit = 0 | 1
/** before, after, moverWhite, playedIsBest, Python label, Python drop, retroAccept, isRetroCandidate */
type Vector = [Eval, Eval, Bit, Bit, Judgment | null, number, Bit, Bit]
interface Fixture {
  ruleSha256: string
  games: FixtureGame[]
  vectors: Vector[]
}

/**
 * The verdicts for one move; retroAccept compares the eval after the move with the eval before it. The last entry,
 * the client rule's raw povDiff, lets the parity script compare numbers as well as yes/no answers.
 */
function verdicts(before: Eval, after: Eval, moverWhite: boolean, playedIsBest: boolean) {
  const side: Side = moverWhite ? 'white' : 'black'
  return [
    serverJudgment(before, after, moverWhite, playedIsBest),
    serverDrop(before, after, moverWhite),
    retroAccept(side, after, before),
    isRetroCandidate(before, after, !playedIsBest),
    povDiff(side, after, before),
  ] as const
}

/** --label: verdicts for vectors on stdin. No process.exit here, so Node flushes the whole answer into the pipe. */
function printLabels() {
  const input = JSON.parse(readFileSync(0, 'utf8')) as [Eval, Eval, boolean, boolean][]
  process.stdout.write(JSON.stringify(input.map(([b, a, w, best]) => verdicts(b, a, w, best))))
}

if (process.argv.includes('--label')) printLabels()
else runChecks()

function runChecks() {
  let failures = 0
  function check(name: string, ok: boolean, detail = '') {
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
    if (!ok) failures++
  }
  const near = (x: number, want: number, tol = 5e-5) => Math.abs(x - want) <= tol

  // A1-A5: the 4-point rule of "Learn from your mistakes" (trainer-spec 7A).
  check('A1 +0.20 against +0.50 passes', retroAccept('white', { cp: 20 }, { cp: 50 }) && near(povDiff('white', { cp: 20 }, { cp: 50 }), -0.0275),
    povDiff('white', { cp: 20 }, { cp: 50 }).toFixed(4))
  check('A1 -0.40 against +0.50 fails', !retroAccept('white', { cp: -40 }, { cp: 50 }) && near(povDiff('white', { cp: -40 }, { cp: 50 }), -0.0827),
    povDiff('white', { cp: -40 }, { cp: 50 }).toFixed(4))
  check('A2 from +0.50: +0.07 passes, +0.06 fails', retroAccept('white', { cp: 7 }, { cp: 50 }) && !retroAccept('white', { cp: 6 }, { cp: 50 }))
  check('A2 from 0.00: -0.43 passes, -0.44 fails', retroAccept('white', { cp: -43 }, { cp: 0 }) && !retroAccept('white', { cp: -44 }, { cp: 0 }))
  check("A3 Black's view: +0.80 against +0.50 passes, +1.20 fails",
    retroAccept('black', { cp: 80 }, { cp: 50 }) && !retroAccept('black', { cp: 120 }, { cp: 50 }))
  check('A4 clamp: +9.00 against +15.00 passes, +6.00 fails',
    retroAccept('white', { cp: 900 }, { cp: 1500 }) && !retroAccept('white', { cp: 600 }, { cp: 1500 }))
  check('A5 mate in 3 against mate in 1 passes', retroAccept('white', { mate: 3 }, { mate: 1 }))
  check('A5 +8.00 against mate in 2 fails', !retroAccept('white', { cp: 800 }, { mate: 2 }) && near(povDiff('white', { cp: 800 }, { mate: 2 }), -0.049),
    povDiff('white', { cp: 800 }, { mate: 2 }).toFixed(4))
  check('A5 +5.00 against mate in 2 fails', !retroAccept('white', { cp: 500 }, { mate: 2 }))
  // lila's mate mapping, value by value: mate in N counts as (21 - min(10, N)) x 100 cp, so every mate from 10 moves
  // on counts the same, and mate 0 counts as being mated.
  const mateCp: [number, number][] = [[1, 2000], [3, 1800], [10, 1100], [11, 1100], [15, 1100], [-4, -1700], [-12, -1100], [0, -2100]]
  check('mate in N counts as (21 - min(10, N)) x 100 cp in the client rule',
    mateCp.every(([m, cp]) => winningChances({ mate: m }) === rawWinningChances(cp)) &&
      winningChances({ cp: 1500 }) === rawWinningChances(1000) && winningChances({ cp: -1500 }) === rawWinningChances(-1000))

  // Game-page rule: hand-made cases for each branch of lila's Advice.
  const J = (p: Eval, c: Eval, w: boolean, best = false) => serverJudgment(p, c, w, best)
  check('15 points is a Blunder, just under is a Mistake', J({ cp: 0 }, { cp: -169 }, true) === 'Blunder' && J({ cp: 0 }, { cp: -168 }, true) === 'Mistake')
  check('Black: +0.00 to +1.69 is a Blunder', J({ cp: 0 }, { cp: 169 }, false) === 'Blunder')
  // The whole-centipawn moves that come closest to each line (found by search; each misses it by under 0.00004
  // points), so a line moved by even 0.001 points fails here.
  const edges: [number, number, boolean, number, Judgment | null][] = [
    [-793, -1831, true, 5, 'Inaccuracy'], [-799, -2459, true, 5, null],
    [-943, -516, false, 10, 'Mistake'], [-596, -2259, true, 10, 'Inaccuracy'],
    [-239, -62, false, 15, 'Blunder'], [-471, -2727, true, 15, 'Mistake'],
  ]
  check('moves within 0.00004 points of the 5, 10 and 15 point lines get the right label',
    edges.every(([p, c, w, line, want]) =>
      J({ cp: p }, { cp: c }, w) === want && Math.abs(serverDrop({ cp: p }, { cp: c }, w) - line) < 4e-5))
  check('no clamp: -7.08 to -10.93 is an Inaccuracy (Lichess game yXoWmgsR, move 39)', J({ cp: -708 }, { cp: -1093 }, true) === 'Inaccuracy')
  check('the start counts as +0.15: a first move to -0.40 is an Inaccuracy, to -0.39 nothing',
    J(LICHESS_START, { cp: -40 }, true) === 'Inaccuracy' && J(LICHESS_START, { cp: -39 }, true) === null)
  check("the engine's first choice gets no label", J({ cp: 300 }, { cp: -300 }, true, true) === null)
  check('giving checkmate gets no label', J({ cp: 200 }, { mate: 0 }, true) === null)
  check('walking into a forced mate: Blunder, Mistake below -7.00, Inaccuracy below -9.99',
    J({ cp: 0 }, { mate: -3 }, true) === 'Blunder' && J({ cp: -701 }, { mate: -3 }, true) === 'Mistake' && J({ cp: -1000 }, { mate: -3 }, true) === 'Inaccuracy')
  check('losing a forced mate: Blunder, Mistake above +7.00, Inaccuracy above +9.99',
    J({ mate: 2 }, { cp: 300 }, true) === 'Blunder' && J({ mate: 2 }, { cp: 701 }, true) === 'Mistake' && J({ mate: 2 }, { cp: 1000 }, true) === 'Inaccuracy')
  check('Black losing a forced mate to a mate against him is a Blunder', J({ mate: -2 }, { mate: 1 }, false) === 'Blunder')
  check('a slower forced mate gets no label', J({ mate: 2 }, { mate: 5 }, true) === null)
  check('mate in 3 lost to +9.00 is a retro candidate only by the mate rule',
    isRetroCandidate({ mate: 3 }, { cp: 900 }, true) && !isRetroCandidate({ mate: 4 }, { cp: 900 }, true) && !isRetroCandidate({ mate: 3 }, { cp: 900 }, false))
  // lichessApiEval reads an export entry as prereg lichess_api_score does: mate first, then eval, a zero kept.
  const api = (a: { eval?: number; mate?: number }) => JSON.stringify(lichessApiEval(a))
  check('an export entry reads like the prereg rule: mate before eval, 0 kept, nothing gives null',
    api({ eval: 120, mate: 3 }) === '{"mate":3}' && api({ eval: 0 }) === '{"cp":0}' && api({ mate: 0 }) === '{"mate":0}' &&
      api({ mate: -2 }) === '{"mate":-2}' && lichessApiEval({}) === null)
  check('readiness: best move, 1M nodes or over 3 s',
    retroEvalReady({ bestmove: 'e2e4', nodes: 10 }) && retroEvalReady({ nodes: 1_000_000 }) && retroEvalReady({ nodes: 5, millis: 3001 }) &&
      !retroEvalReady({ nodes: 999_999, millis: 3000 }))

  // A6, A7: Lichess's own evals and labels for his 6 analysed games.
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/lichess-rule-vectors.json', import.meta.url), 'utf8')) as Fixture
  let entries = 0
  let agree = 0
  let judgedAgree = 0
  const misses: string[] = []
  // Lichess's export keeps `best` only on the moves it labelled, so on the others "no best" already says "no label".
  // The blind count therefore also labels every move as if it were not the engine's first choice.
  let blindAgree = 0
  const blindMisses: string[] = []
  let myMoves = 0
  const candidates: Record<string, number> = {}
  for (const g of fixture.games) {
    let prev: Eval = LICHESS_START
    for (const [i, a] of g.analysis.entries()) {
      const cur = lichessApiEval(a)
      if (!cur) break
      const mine = serverJudgment(prev, cur, i % 2 === 0, a.best === undefined)
      const lichess = a.judgment ?? null
      entries++
      if (mine === lichess) agree++
      else misses.push(`${g.id} ply ${i + 1}: ${mine} vs Lichess ${lichess}`)
      if (lichess && mine === lichess) judgedAgree++
      const blind = serverJudgment(prev, cur, i % 2 === 0, false)
      if (blind === lichess) blindAgree++
      else blindMisses.push(`${g.id} ply ${i + 1}: ${blind} vs Lichess ${lichess}`)
      prev = cur
    }
    const plies = g.moves.split(' ').length
    for (let i = 0; i < plies; i++) {
      if ((i % 2 === 0) !== (g.side === 'white')) continue
      myMoves++
      // The first move is never offered: the start position has no computer line in Lichess's tree.
      if (i === 0 || i >= g.analysis.length) continue
      const before = lichessApiEval(g.analysis[i - 1])
      const after = lichessApiEval(g.analysis[i])
      const name = g.analysis[i].judgment
      if (before && after && isRetroCandidate(before, after, name !== undefined)) candidates[name!] = (candidates[name!] ?? 0) + 1
    }
  }
  const labelled = fixture.games.reduce((n, g) => n + g.analysis.filter((a) => a.judgment).length, 0)
  check(`A6 serverJudgment reproduces Lichess's label on every move of the ${fixture.games.length} analysed games`,
    fixture.games.length === 6 && entries === 428 && agree === entries, `${agree} of ${entries}; labelled moves ${judgedAgree} of ${labelled}`)
  for (const m of misses.slice(0, 10)) console.log(`     ${m}`)
  // The one blind difference: pEKoVG79 ply 34 (17...Bb7, +0.91 to +1.77) loses 7.4 points, yet Lichess gives no
  // label; by lila's rule that can only mean its engine's first choice was the move played.
  check('A6 without Lichess\'s "better line" marker the rule still gives Lichess\'s answer on 427 of 428 moves',
    blindAgree === 427 && blindMisses.length === 1 && blindMisses[0] === 'pEKoVG79 ply 34: Inaccuracy vs Lichess null',
    `${blindAgree} of ${entries}; differs: ${blindMisses.join(', ')}`)
  const nCand = Object.values(candidates).reduce((a, b) => a + b, 0)
  check('A7 isRetroCandidate marks exactly 45 of his 215 moves (31 Blunders, 14 Mistakes)',
    myMoves === 215 && nCand === 45 && candidates.Blunder === 31 && candidates.Mistake === 14,
    `${nCand} of ${myMoves}: ${JSON.stringify(candidates)}`)

  // Parity with the pre-registered Python rule on the stored vectors (scripts/check-rule-parity.py builds them and also
  // runs this module live against the Python file).
  let same = 0
  let mates = 0
  const diffs: string[] = []
  for (const [before, after, w, best, label, drop, ra, rc] of fixture.vectors) {
    const [tl, td, tra, trc] = verdicts(before, after, w === 1, best === 1)
    if (before.mate != null || after.mate != null) mates++
    // stored drops are rounded to 6 decimals
    if (tl === label && Math.abs(td - drop) <= 1e-6 && tra === (ra === 1) && trc === (rc === 1)) same++
    else diffs.push(JSON.stringify([before, after, w, best, label, tl, drop, td, ra, tra, rc, trc]))
  }
  check('stored vectors: same label, drop, retroAccept and isRetroCandidate as the Python rules',
    fixture.vectors.length >= 2000 && same === fixture.vectors.length,
    `${same} of ${fixture.vectors.length}, ${mates} with a forced mate`)
  for (const d of diffs.slice(0, 10)) console.log(`     ${d}`)

  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed')
  process.exitCode = failures ? 1 : 0
}
