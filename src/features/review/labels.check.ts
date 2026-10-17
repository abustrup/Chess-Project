// Review's move labels against Lichess's own, on his 6 games that Lichess analysed:
//   npx tsx src/features/review/labels.check.ts        (npm run check:review)
// Lichess's evaluations go in three ways: straight into the step that labels a game's moves, through the whole
// analysis with a stand-in engine that answers with Lichess's numbers, and into a saved analysis that still carries
// the old labels (20 points for a blunder). Each must give Lichess's label on every move Lichess judged.
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import type { AnalysedMove, GameAnalysis, MoveClass } from '../../types'
import type { SearchResult } from '../../engine/uci'
import { MATE_CP, classifyMove, scoreToCp, winPercent } from '../../lib/evaluation'
import { identifyOpening } from '../../lib/openingName'
import type { Judgment } from '../../lib/lichessRules'
import { analyseGame, analysePlies, clearEvalCache, type EngineLike, type PositionEval } from './analyse'
import { evalFromScore, labelMoves, reviewLabel, withLichessLabels } from './labels'
import { replayPgn, type ReplayedPly } from './pgnGame'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

/** One entry of Lichess's `analysis` array: the eval after the move, White's view; `best` only on labelled moves. */
interface LichessEntry {
  eval?: number
  mate?: number
  best?: string
  judgment?: Judgment
}
interface FixtureGame {
  id: string
  side: 'white' | 'black'
  moves: string
  analysis: LichessEntry[]
}
const fixture = JSON.parse(
  readFileSync(new URL('../../lib/fixtures/lichess-rule-vectors.json', import.meta.url), 'utf8'),
) as { games: FixtureGame[] }

const asJudgment = (c: MoveClass): Judgment | null =>
  c === 'blunder' ? 'Blunder' : c === 'mistake' ? 'Mistake' : c === 'inaccuracy' ? 'Inaccuracy' : null

function pgnOf(sans: string[]): string {
  return sans.map((s, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${s}` : s)).join(' ')
}

/** A Lichess eval (White's view) as Review stores it: centipawns, a forced mate as +-(10000 - 10 x N). */
function storedScore(a: LichessEntry): number {
  return a.mate != null ? scoreToCp({ mate: a.mate }) : (a.eval ?? 0)
}

/** Review scores a finished checkmate itself, without the engine (analyse.ts finishedEval). */
function finishedScore(fen: string): number | null {
  const chess = new Chess(fen)
  if (!chess.isCheckmate()) return null
  return fen.split(' ')[1] === 'w' ? -MATE_CP : MATE_CP
}

/**
 * The score of every position of a game from Lichess's analysis. The engine's best move is the move played unless
 * Lichess gave a better line (it keeps `best` only then), or `blind` is set, which assumes it never was.
 */
function lichessEvals(g: FixtureGame, plies: ReplayedPly[], blind = false): PositionEval[] {
  const best = (j: number) => (j < plies.length ? (blind ? null : (g.analysis[j]?.best ?? plies[j].uci)) : null)
  const evals: PositionEval[] = [{ cp: 15, best: best(0), depth: 99 }]
  for (let j = 1; j <= plies.length; j++) {
    const a = g.analysis[j - 1]
    const cp = a ? storedScore(a) : finishedScore(plies[j - 1].fenAfter)
    if (cp === null) throw new Error(`${g.id}: no score after ply ${j}`)
    evals.push({ cp, best: best(j), depth: 99 })
  }
  return evals
}

/** A stand-in for Stockfish that answers every position with Lichess's numbers (side to move's view, like UCI). */
function lichessEngine(plies: ReplayedPly[], evals: PositionEval[]): EngineLike & { calls: number } {
  const byPosition = new Map<string, PositionEval>()
  const key = (fen: string) => fen.split(' ').slice(0, 4).join(' ')
  byPosition.set(key(plies[0].fenBefore), evals[0])
  plies.forEach((p, i) => byPosition.set(key(p.fenAfter), evals[i + 1]))
  const engine = {
    calls: 0,
    async go({ fen }: { fen: string }): Promise<SearchResult> {
      engine.calls++
      const e = byPosition.get(key(fen))
      if (!e) throw new Error(`unknown position ${fen}`)
      const sign = fen.split(' ')[1] === 'w' ? 1 : -1
      const white = evalFromScore(e.cp)
      const line = white.mate != null ? { mate: sign * white.mate } : { cp: sign * (white.cp ?? 0) }
      return { bestMove: e.best, lines: [{ multipv: 1, depth: 99, pv: [], ...line }], depth: 99 }
    },
  }
  return engine
}

/** The labels the app gave before 2026-10-16 (classifyMove: 20 points for a blunder, opening moves always "book"). */
function oldLabels(moves: AnalysedMove[], bookPlies: number): AnalysedMove[] {
  return moves.map((m) => {
    const sign = m.ply % 2 === 1 ? 1 : -1
    const playedBest = m.bestUci === m.uci
    const winBefore = winPercent(sign * m.evalBefore)
    const winAfter = playedBest ? Math.max(winPercent(sign * m.evalAfter), winBefore) : winPercent(sign * m.evalAfter)
    const old: MoveClass = m.ply <= bookPlies ? 'book' : playedBest ? 'best' : classifyMove(winBefore, winAfter)
    return { ...m, classification: old }
  })
}

const analysisOf = (moves: AnalysedMove[]): GameAnalysis => ({
  engine: 'lichess fixture',
  depth: 99,
  moves,
  acpl: { white: 0, black: 0 },
  accuracy: { white: 0, black: 0 },
  analysedAt: '2026-10-16T00:00:00.000Z',
})

interface Tally {
  judged: number
  agree: number
  labelled: number
  labelledAgree: number
  misses: string[]
}
const tally = (): Tally => ({ judged: 0, agree: 0, labelled: 0, labelledAgree: 0, misses: [] })

/** Compares Review's labels with Lichess's on every move Lichess judged (every move it has an eval after). */
function compare(t: Tally, g: FixtureGame, moves: AnalysedMove[]) {
  g.analysis.forEach((a, i) => {
    const lichess = a.judgment ?? null
    const review = moves[i] ? asJudgment(moves[i].classification) : 'missing'
    t.judged++
    if (lichess) t.labelled++
    if (review === lichess) {
      t.agree++
      if (lichess) t.labelledAgree++
    } else t.misses.push(`${g.id} ply ${i + 1} ${moves[i]?.san}: Review ${review}, Lichess ${lichess}`)
  })
}

async function main() {
  const direct = tally()
  const engineRun = tally()
  const resaved = tally()
  const blind = tally()
  let changedByRelabel = 0
  let stable = true
  let engineCalls = 0
  let bookJudged = 0
  const book = { expected: 0, agree: 0, total: 0 }
  const mine = { review: { Inaccuracy: 0, Mistake: 0, Blunder: 0 }, lichess: { Inaccuracy: 0, Mistake: 0, Blunder: 0 } }
  const oldMine = { inaccuracy: 0, mistake: 0, blunder: 0 }

  for (const g of fixture.games) {
    const sans = g.moves.split(' ')
    const pgn = pgnOf(sans)
    const plies = replayPgn(pgn).plies
    const bookPlies = identifyOpening(sans)?.plies ?? 0
    const evals = lichessEvals(g, plies)

    // 1. The labelling step itself, as analyse.ts runs it after the engine.
    const moves = analysePlies(plies, evals, bookPlies)
    compare(direct, g, moves)
    g.analysis.forEach((a, i) => a.judgment && plies[i].ply <= bookPlies && bookJudged++)
    // "Opening move" goes on exactly the named opening's half-moves that Lichess does not label, as before.
    moves.forEach((m, i) => {
      const want = plies[i].ply <= bookPlies && !g.analysis[i]?.judgment
      if (want) book.expected++
      if ((m.classification === 'book') === want) book.agree++
      book.total++
    })

    // 2. The whole analysis, with Lichess's numbers in place of the browser engine.
    clearEvalCache()
    const engine = lichessEngine(plies, evals)
    const run = await analyseGame({ pgn }, { engine })
    engineCalls += engine.calls
    compare(engineRun, g, run.moves)

    // 3. A saved analysis with the old labels, read back the way gameStore reads it.
    const old = analysisOf(oldLabels(moves, bookPlies))
    const relabelled = withLichessLabels(old)
    compare(resaved, g, relabelled.moves)
    changedByRelabel += relabelled.moves.filter((m, i) => m.classification !== old.moves[i].classification).length
    stable &&= withLichessLabels(relabelled) === relabelled && withLichessLabels(analysisOf(moves)).moves.every((m, i) => m === moves[i])

    // 4. Without Lichess's "better line" marker: every move counts as not the engine's choice.
    compare(blind, g, analysePlies(plies, lichessEvals(g, plies, true), bookPlies))

    // His own moves: Review's counts against Lichess's, and what the old rule said.
    g.analysis.forEach((a, i) => {
      if ((plies[i].color === 'w') !== (g.side === 'white')) return
      const r = asJudgment(moves[i].classification)
      if (r) mine.review[r]++
      if (a.judgment) mine.lichess[a.judgment]++
      const o = old.moves[i].classification
      if (o === 'inaccuracy' || o === 'mistake' || o === 'blunder') oldMine[o]++
    })
  }

  const games = fixture.games.length
  check(`Review's labelling step gives Lichess's label on all 428 judged moves of his ${games} analysed games`,
    games === 6 && direct.judged === 428 && direct.agree === 428,
    `${direct.agree} of ${direct.judged}; labelled by Lichess: ${direct.labelledAgree} of ${direct.labelled}`)
  for (const m of direct.misses.slice(0, 10)) console.log(`     ${m}`)
  check("the whole analysis, fed Lichess's numbers by a stand-in engine, gives the same 428 of 428",
    engineRun.judged === 428 && engineRun.agree === 428 && engineCalls > 400,
    `${engineRun.agree} of ${engineRun.judged}; labelled ${engineRun.labelledAgree} of ${engineRun.labelled}; ${engineCalls} engine calls`)
  for (const m of engineRun.misses.slice(0, 10)) console.log(`     ${m}`)
  check('an analysis saved with the old labels is read back with Lichess\'s on all 428',
    resaved.judged === 428 && resaved.agree === 428,
    `${resaved.agree} of ${resaved.judged}; the old rule differed on ${changedByRelabel} moves`)
  for (const m of resaved.misses.slice(0, 10)) console.log(`     ${m}`)
  check('reading labels again changes nothing (same objects back)', stable)
  // Review used to call every move of the named opening an "opening move", even one Lichess labels; in these games
  // no labelled move falls inside the named opening, so the hand-made case further down covers that rule.
  console.log(`     (${bookJudged} of Lichess's ${direct.labelled} labels fall inside the named opening in these games)`)
  check('"opening move" marks exactly the named opening\'s unlabelled half-moves',
    book.agree === book.total && book.expected > 0,
    `${book.agree} of ${book.total} moves right; ${book.expected} opening moves`)
  // The one move where the marker matters: pEKoVG79 ply 34 (17...Bb7, +0.91 to +1.77) loses 7.4 points, yet Lichess
  // gives no label, so its engine's first choice must have been the move played (as lichessRules.check.ts A6 says).
  check('without the "better line" marker Review still matches Lichess on 427 of 428, missing only pEKoVG79 ply 34',
    blind.agree === 427 && blind.misses.length === 1 && blind.misses[0].startsWith('pEKoVG79 ply 34 '),
    `${blind.agree} of ${blind.judged}; differs: ${blind.misses.join(', ')}`)
  check('his own moves: Review counts the same inaccuracies, mistakes and blunders as Lichess',
    JSON.stringify(mine.review) === JSON.stringify(mine.lichess),
    `Review ${JSON.stringify(mine.review)}, Lichess ${JSON.stringify(mine.lichess)}, old rule ${JSON.stringify(oldMine)}`)

  // Hand-made cases for the parts Lichess's games above do not reach.
  const L = (evalBefore: number, evalAfter: number, more: Partial<Parameters<typeof reviewLabel>[0]> = {}) =>
    reviewLabel({ evalBefore, evalAfter, moverWhite: true, playedBest: false, isBook: false, ...more })
  check('a 15-point drop is a blunder (the old rule called up to 20 points a mistake)',
    L(0, -169) === 'blunder' && L(0, -168) === 'mistake' && classifyMove(winPercent(0), winPercent(-169)) === 'mistake')
  check('5 and 10 points: inaccuracy and mistake; under 5 no label',
    L(0, -55) === 'inaccuracy' && L(0, -54) === 'good' && L(0, -111) === 'mistake' && L(0, -110) === 'inaccuracy')
  check('up to 1 point is still "best", over 1 point "good" (as before)',
    L(0, -10) === 'best' && L(0, -21) === 'good' && L(0, 10, { moverWhite: false }) === 'best' && L(0, 21, { moverWhite: false }) === 'good')
  check("Black's moves are judged from Black's side", L(0, 169, { moverWhite: false }) === 'blunder' && L(0, -169, { moverWhite: false }) === 'best')
  check("the engine's own first choice gets no label, as on Lichess", L(300, -300, { playedBest: true }) === 'best')
  check('an opening move keeps "opening move" unless Lichess would label it',
    L(15, 0, { isBook: true }) === 'book' && L(15, -200, { isBook: true }) === 'blunder')
  check('walking into a forced mate is a blunder; from a lost position a mistake or an inaccuracy',
    L(0, scoreToCp({ mate: -3 })) === 'blunder' && L(-800, scoreToCp({ mate: -3 })) === 'mistake' &&
      L(-1200, scoreToCp({ mate: -3 })) === 'inaccuracy')
  check('losing a forced mate is a blunder; still winning big, a mistake or an inaccuracy',
    L(scoreToCp({ mate: 2 }), 300) === 'blunder' && L(scoreToCp({ mate: 2 }), 800) === 'mistake' &&
      L(scoreToCp({ mate: 2 }), 1200) === 'inaccuracy')
  check('giving checkmate and a slower forced mate get no label',
    L(200, MATE_CP) === 'best' && L(scoreToCp({ mate: 2 }), scoreToCp({ mate: 5 })) === 'best')
  check('stored mate scores read back as mates for the right side',
    evalFromScore(scoreToCp({ mate: 3 })).mate === 3 && evalFromScore(scoreToCp({ mate: -12 })).mate === -12 &&
      evalFromScore(-MATE_CP).mated === 'white' && evalFromScore(MATE_CP).mated === 'black' && evalFromScore(8999).cp === 8999)

  // The first move of a normal game counts from +0.15, as on Lichess, whatever the browser engine said.
  const start = new Chess()
  const e4 = start.move('e4')
  const first = (evalBefore: number, evalAfter: number, fenBefore = e4.before) =>
    labelMoves([{ ply: 1, san: 'e4', uci: 'e2e4', fenBefore, fenAfter: e4.after, evalBefore, evalAfter, bestUci: 'd2d4', cpLoss: 0, accuracy: 100 }],
      () => false)[0]
  check('the first move counts from +0.15: to -0.39 no label even when the engine said +0.60, to -0.40 an inaccuracy',
    first(60, -39) !== 'inaccuracy' && first(60, -40) === 'inaccuracy' && first(-100, -40) === 'inaccuracy')
  const setUp = '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1'
  check('a game from a set-up position uses the engine\'s own first score', first(60, -39, setUp) === 'inaccuracy')
  // A set-up position with Black to move first: the mover is read from the position, not from the move number.
  const blackFirst = labelMoves([{ ply: 1, san: 'Kd7', uci: 'e8d7', fenBefore: '4k3/8/8/8/8/8/4P3/4K3 b - - 0 1',
    fenAfter: '8/3k4/8/8/8/8/4P3/4K3 w - - 1 2', evalBefore: 0, evalAfter: 169, bestUci: 'e8e7', cpLoss: 0, accuracy: 0 }], () => false)[0]
  check('Black moving first from a set-up position is judged from Black\'s side', blackFirst === 'blunder', blackFirst)

  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed')
  process.exitCode = failures ? 1 : 0
}

void main()
