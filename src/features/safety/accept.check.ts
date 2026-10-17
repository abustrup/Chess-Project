// Self-check of the Safety-check verdicts and sentences:   npx tsx src/features/safety/accept.check.ts
// The verdict order from scripts/safety/README.md on every card of public/data/safety/cards.json, Lichess's 4-point
// boundary, the engine fallback, the safety rule of held and quiet cards (2026-10-17), and the fact sentences (with the
// card builder's wording notes of 2026-10-16).
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import type { SafetyCard } from '../../types'
import { retroAccept } from '../../lib/lichessRules'
import { cleanCardFile } from './cards'
import { judgeMove, judgeWithEngine, traineeWin, whiteEval } from './accept'
import { clockLabel, contextLine, factSentence, factSentences, gameMoveLine, tcLabel } from './facts'
import { playUci } from './positions'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

const file = cleanCardFile(JSON.parse(readFileSync(new URL('../../../public/data/safety/cards.json', import.meta.url), 'utf8')))
const cards = file.cards
const raw = JSON.parse(readFileSync(new URL('../../../public/data/safety/cards.json', import.meta.url), 'utf8')) as { cards: unknown[] }
check('every card in the file survives cleaning', cards.length === raw.cards.length, `${cards.length} of ${raw.cards.length}`)

/* ---- the verdict order on every card ---- */
const problems: string[] = []
let decidedOutside = 0
let engineNeeded = 0
let listedOutside = 0
for (const c of cards) {
  const start = playUci(c.fenBefore, c.lastMove)
  if (!start) {
    problems.push(`${c.id}: last move not legal`)
    continue
  }
  // 1. own card, game move: wrong
  const human = judgeMove(c, c.human.uci)
  if (c.kind === 'own' && (!human.decided || human.verdict.ok || human.verdict.by !== 'game')) problems.push(`${c.id}: game move not failed`)
  // 3. held/quiet game move: the builder's verdict
  if (c.kind !== 'own' && (!human.decided || human.verdict.ok !== c.human.passes)) problems.push(`${c.id}: game move verdict differs`)
  // 2. top moves: within 4 points of the best (held and quiet cards: or safe, from the list of every move)
  for (const t of c.top) {
    if (c.kind === 'own' && t.uci === c.human.uci) continue
    const d = judgeMove(c, t.uci)
    const within = retroAccept(c.side, t.eval, c.top[0].eval)
    const listed = c.kind !== 'own' ? c.moves?.find((m) => m.uci === t.uci) : undefined
    const want = within || listed?.safe === true
    if (!d.decided || d.verdict.ok !== want || d.verdict.by !== (listed ? 'moves' : 'top')) problems.push(`${c.id}: top move ${t.san}`)
    if (within !== t.win > c.top[0].win - 4 + 0.01 && Math.abs(t.win - (c.top[0].win - 4)) > 0.02) problems.push(`${c.id}: stored win% disagrees with the evals for ${t.san}`)
  }
  if (c.kind !== 'own' && !c.moves) problems.push(`${c.id}: held or quiet card without the list of every move`)
  if (!judgeMove(c, c.top[0].uci).decided || !(judgeMove(c, c.top[0].uci) as { verdict: { ok: boolean } }).verdict.ok) problems.push(`${c.id}: best move not right`)
  // 4./5. a legal move outside top
  const g = new Chess(start.fen)
  const outside = g.moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? '')).filter((u) => !c.top.some((t) => t.uci === u) && u !== c.human.uci)
  for (const u of c.moves ? outside : outside.slice(0, 3)) {
    const after = playUci(start.fen, u)!
    const d = judgeMove(c, u, new Chess(after.fen).isCheckmate())
    if (c.kind !== 'own' && c.moves) {
      // every legal move is listed: decided at once, right exactly when within 4 points or safe
      const m = c.moves.find((x) => x.uci === u)
      const want = !!m && (retroAccept(c.side, m.eval, c.top[0].eval) || m.safe === true)
      if (!m || !d.decided || (d.verdict.ok !== want && !new Chess(after.fen).isCheckmate())) problems.push(`${c.id}: listed move ${u}`)
      else listedOutside++
    } else if (c.topComplete) {
      if (!d.decided || d.verdict.ok || d.verdict.by !== 'complete') problems.push(`${c.id}: ${u} outside a complete list not failed at once`)
      else decidedOutside++
    } else if (d.decided && !new Chess(after.fen).isCheckmate()) problems.push(`${c.id}: ${u} decided without the engine`)
    else engineNeeded++
  }
}
check('verdict order holds on every card (game move, top moves, best move, outside moves)', problems.length === 0, problems.slice(0, 5).join('; ') || `${cards.length} cards`)
check('moves outside a complete list fail at once, with no engine', decidedOutside > 0, `${decidedOutside} sampled moves`)
check('moves outside an incomplete list go to the engine (own cards)', engineNeeded > 0, `${engineNeeded} sampled moves`)
check('held and quiet cards decide every legal move from the stored list, with no engine', listedOutside > 0, `${listedOutside} moves outside top`)

/* ---- the safety rule on held and quiet cards (fixer, 2026-10-17) ---- */
{
  const listed = cards.filter((c) => c.kind !== 'own' && c.moves)
  const all = listed.flatMap((c) => c.moves!.map((m) => ({ c, m, d: judgeMove(c, m.uci) })))
  const safeOnly = all.filter((x) => x.d.decided && x.d.verdict.safeOnly)
  check('some moves more than 4 points below the best are right because they are safe', safeOnly.length > 0 && safeOnly.every((x) => x.d.decided && x.d.verdict.ok), `${safeOnly.length} of ${all.length} listed moves`)
  const wrong = all.filter((x) => x.d.decided && !x.d.verdict.ok)
  check('every wrong listed move says why (mate, material or 15+ points)', wrong.every((x) => x.d.decided && !!x.d.verdict.why), `${wrong.length} wrong moves`)
  const lossOnly = wrong.filter((x) => x.d.decided && x.d.verdict.why === 'loss')
  check('a move wrong without mate or material costs 15 points or more', lossOnly.every((x) => x.d.decided && (x.d.verdict.loss ?? 0) >= 15), `${lossOnly.length} such moves`)
  const rate = (id: string) => {
    const c = listed.find((x) => x.id === id)
    if (!c) return 'card not in the file'
    const ok = c.moves!.filter((m) => {
      const d = judgeMove(c, m.uci)
      return d.decided && d.verdict.ok
    }).length
    return `${ok} of ${c.moves!.length} moves right`
  }
  console.log(`     quiet:FWvViwBk:15 ${rate('quiet:FWvViwBk:15')}; quiet:B4575r7G:22 ${rate('quiet:B4575r7G:22')}`)
  const a3 = listed.find((x) => x.id === 'quiet:FWvViwBk:15')
  const a3d = a3 ? judgeMove(a3, 'a2a3') : null
  check('quiet:FWvViwBk:15: a3 (4.4 points below the best, hangs nothing) is now right', !!a3d && a3d.decided && a3d.verdict.ok, a3d && a3d.decided ? JSON.stringify({ ok: a3d.verdict.ok, loss: a3d.verdict.loss, safeOnly: a3d.verdict.safeOnly }) : 'missing')
  const heldFailing = listed.filter((c) => c.kind === 'held' && !c.human.passes)
  check('no held card fails its own game move', heldFailing.length === 0, heldFailing.map((c) => c.id).join(', '))
}

/* ---- the 4-point boundary and the engine fallback (trainer-spec A2, E4) ---- */
{
  const base = cards.find((c) => c.side === 'white' && !c.topComplete) ?? cards[0]
  const c: SafetyCard = { ...base, side: 'white', top: [{ ...base.top[0], eval: { cp: 50 } }] }
  const engine = (cp: number) => judgeWithEngine(c, 'a2a3', { cp })
  check('engine: from +0.50, +0.07 is right and +0.06 is wrong (Lichess 4-point rule)', engine(7).ok && !engine(6).ok)
  check('engine verdict reports its loss in win% points', Math.abs((engine(6).loss ?? 0) - (traineeWin(c, { cp: 50 }) - traineeWin(c, { cp: 6 }))) < 1e-9)
  const black: SafetyCard = { ...c, side: 'black', top: [{ ...c.top[0], eval: { cp: 50 } }] }
  check('engine, Black to move: +0.80 right, +1.20 wrong against +0.50 (A3)', judgeWithEngine(black, 'a7a6', { cp: 80 }).ok && !judgeWithEngine(black, 'a7a6', { cp: 120 }).ok)
  check('a mate-giving move is always right', (() => {
    const d = judgeMove({ ...c, topComplete: true }, 'h1h8', true)
    return d.decided && d.verdict.ok
  })())
  check('whiteEval: Black to move, +30 for Black is -30 for White', JSON.stringify(whiteEval('8/8/8/8/8/8/8/K6k b - - 0 1', { cp: 30 })) === '{"cp":-30}')
  check('whiteEval: White to move, mate in 2 stays mate 2; Black to move flips', whiteEval('8/8/8/8/8/8/8/K6k w - - 0 1', { mate: 2 }).mate === 2 && whiteEval('8/8/8/8/8/8/8/K6k b - - 0 1', { mate: 2 }).mate === -2)
  check('whiteEval: stalemate is 0', JSON.stringify(whiteEval('k7/8/1Q6/8/8/8/8/7K b - - 0 1', null, 'stalemate')) === '{"cp":0}')
}

/* ---- facts as sentences ---- */
{
  const all = cards.flatMap((c) => c.facts.map((f) => ({ c, f, s: factSentence(f) })))
  check('every fact in the file becomes a sentence', all.every((x) => x.s), `${all.length} facts`)
  const quiet = all.filter((x) => x.f.t === 'quiet')
  check('quiet cards say only "Nothing was threatened here."', quiet.length > 0 && quiet.every((x) => x.s === 'Nothing was threatened here.'), `${quiet.length} quiet facts`)
  check('no sentence says "His move ... threatens" (builder note b)', all.every((x) => !/^His move .*threatens/.test(x.s ?? '')))
  check('no sentence claims a piece is safe or "was fine" (builder note a)', all.every((x) => !/was fine|keeps your pieces/.test(x.s ?? '')))
  const material = all.filter((x) => /winning material|win material/.test(x.s ?? ''))
  check('material lines show at most 3 moves', material.every((x) => (x.s!.match(/\(([^)]*)\)/)?.[1] ?? '').replace(' …', '').split(' ').length <= 3), `${material.length} sentences`)
  const noFacts = cards.filter((c) => factSentences(c).length === 0)
  check('cards without facts give an empty list (the page then shows no "What there was to see")', noFacts.length === cards.filter((c) => c.facts.length === 0).length, `${noFacts.length} cards`)
  const threat = all.find((x) => x.f.t === 'threat' && 'wins' in x.f && x.f.wins)
  check('a threat that wins a piece names it', !!threat && /^He threatens \S+, winning your (pawn|knight|bishop|rook|queen) on [a-h][1-8]\.$/.test(threat.s!), threat?.s ?? '')
  const mate = all.find((x) => x.f.t === 'threat' && 'mateIn' in x.f && x.f.mateIn)
  check('a mate threat says mate in N', !!mate && /^He threatens mate in \d+, starting with \S+\.$/.test(mate.s!), mate?.s ?? '')
  const free = all.find((x) => x.f.t === 'free')
  check('a free piece says unprotected', !!free && /^His move left his \w+ on [a-h][1-8] unprotected\.$/.test(free.s!), free?.s ?? '')
  const allowed = all.find((x) => x.f.t === 'allowed')
  check('an allowed fact starts with the game move', !!allowed && allowed.s!.startsWith(`After ${(allowed.f as { move: string }).move},`), allowed?.s ?? '')
}

/* ---- context ---- */
check('time controls read as minutes + seconds', tcLabel('180+2') === '3+2' && tcLabel('600+0') === '10+0' && tcLabel('300+3') === '5+3')
check('clock reads as m:ss', clockLabel(41_000) === '0:41' && clockLabel(600_000) === '10:00')
{
  const own = cards.find((c) => c.kind === 'own' && c.human.judgment === 'Blunder')!
  check('context names the date, the time control, the clock and the time spent', /^From your game on \d{4}-\d{2}-\d{2} \(\d+\+\d+\), move \d+\. You had \d+:\d\d left and took \d+ s for your move\.$/.test(contextLine(own)), contextLine(own))
  check('own cards say what the game move was called', /In the game you played \S+ \((Lichess called it a|a) (Blunder|Mistake)/.test(gameMoveLine(own)), gameMoveLine(own))
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall verdict checks passed')
process.exit(failures ? 1 : 0)
