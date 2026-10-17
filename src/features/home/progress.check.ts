// Checks of Home in its study version (research/2026-10-16-diagnosis/build-plan.md, H1 and H2): today's plan, the
// study status card, the Continue card, and the Safety-check trainer in the plan once the gate opens.
// Run: npx tsx src/features/home/progress.check.ts
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { DEFAULT_SAFETY_SETTINGS, type GameRecord, type PuzzleStats, type SafetyCard, type StoredSafetyCard } from '../../types'
import { OPENING_COURSES } from '../../data/openings'
import { KEYS, writeStored } from '../../lib/storage'
import { gateFor, type GateSource } from '../../lib/studyGate'
import { cleanCardFile } from '../safety/cards'
import { currentDay, markAnswered, remainingIds } from '../safety/queue'
import { readDay, readState, writeDay } from '../safety/stored'
import { parseLichessNdjson } from '../rating/lichessImport'
import { NO_PUZZLE_STATS } from './defaults'
import { cleanGames } from './sanitize'
import {
  LICHESS_POOL_URL,
  STUDY_PUZZLE_THEMES,
  buildContinue,
  buildPlan,
  isStudyGame,
  summariseCourse,
  type PlanItem,
  type SafetyToday,
} from './progress'
import { cleanBackupLog, parseVerdict, studyCardModel, verdictNumbers, type StudyVerdict } from './study'
import StudyCard from './StudyCard'
import TodaysPlan from './TodaysPlan'
import ContinueCard from './ContinueCard'
import { safetyTodayFrom } from './useSafetyToday'
import { lockedHomeHtml } from './fixtures/locked-scenarios'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

const now = new Date('2026-10-20T19:00:00')
const at = (dayOffset: number, hour = 12) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour).toISOString()
const ids = (plan: PlanItem[]) => plan.map((item) => item.id).join(',')
const item = (plan: PlanItem[], id: PlanItem['id']) => plan.find((i) => i.id === id)!

/* ------------------------------------------------------------------ the plan */

function lichessGame(opts: { tc?: string; rated?: boolean; day?: number; source?: GameRecord['source']; extra?: string; event?: string }) {
  const rated = opts.rated ?? true
  const tags = [
    `[Event "${opts.event ?? (rated ? 'Rated Rapid game' : 'Casual Rapid game')}"]`,
    '[White "abustrup"]',
    '[Black "Opponent"]',
    '[Result "1-0"]',
    '[Variant "Standard"]',
    `[TimeControl "${opts.tc ?? '600+0'}"]`,
    ...(rated ? ['[WhiteRatingDiff "+6"]', '[BlackRatingDiff "-6"]'] : []),
    ...(opts.extra ? [opts.extra] : []),
  ]
  const game: GameRecord = {
    id: `g${Math.random().toString(36).slice(2, 10)}`,
    date: at(opts.day ?? 0),
    source: opts.source ?? 'lichess',
    pgn: `${tags.join('\n')}\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0\n`,
    white: 'abustrup',
    black: 'Opponent',
    userSide: 'white',
    result: '1-0',
  }
  return game
}

function puzzles(entries: { theme?: string; solved?: boolean; day?: number }[]): PuzzleStats {
  return {
    ...NO_PUZZLE_STATS,
    history: entries.map((e, i) => ({
      date: at(e.day ?? 0, 9),
      puzzleId: `p${i}`,
      solved: e.solved ?? true,
      puzzleRating: 1000,
      ratingAfter: 1000,
      theme: e.theme,
    })),
  }
}

const empty = buildPlan({ puzzleStats: NO_PUZZLE_STATS, games: [], now })
check('plan is exactly [puzzles, lichess 10+0]', ids(empty) === 'puzzles,lichess', ids(empty))
const lichess = item(empty, 'lichess')
check('lichess item opens the 10+0 pool in a new tab', lichess.to === LICHESS_POOL_URL && lichess.external === true &&
  LICHESS_POOL_URL === 'https://lichess.org/#pool/10+0', lichess.to)
check('lichess item is not done without a game today', !lichess.done)
const puzzleItem = item(empty, 'puzzles')
check('puzzle item asks for easy puzzles from the three sets', /^Solve 5 easy puzzles: free pieces, forks, defending$/.test(puzzleItem.title), puzzleItem.title)
check('puzzle item links to one of the three sets, easy level', STUDY_PUZZLE_THEMES.some((t) => puzzleItem.to === `/puzzles?theme=${t.key}&level=easy`),
  puzzleItem.to)
check('puzzle item starts at 0 of 5', puzzleItem.progressText === '0 of 5 solved today' && !puzzleItem.done)

// Openings and tactics never come back into the plan, whatever was practised, on any day (no phase in the input).
const allPlans = Array.from({ length: 200 }, (_, d) => {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 8)
  return ids(buildPlan({ puzzleStats: puzzles([{ theme: 'fork' }, { theme: 'mateIn1' }]), games: [lichessGame({ tc: '180+2' })], now: day }))
})
check('the same two steps on 200 days in a row', allPlans.every((p) => p === 'puzzles,lichess'))
const turns = [0, 1, 2].map((d) => buildPlan({ puzzleStats: NO_PUZZLE_STATS, games: [], now: new Date(2026, 9, 20 + d, 8) })[0].to)
check('the three puzzle sets take turns from day to day', new Set(turns).size === 3, turns.join(' '))

// A synced rated 10+0 game today marks the lichess step done; nothing else does.
const done = (games: GameRecord[]) => item(buildPlan({ puzzleStats: NO_PUZZLE_STATS, games, now }), 'lichess').done === true
check('a synced rated 600+0 game today: lichess step done', done([lichessGame({})]))
check('a rated arena 600+0 game today (rating change in the PGN): done', done([lichessGame({ event: 'Hourly Rapid Arena' })]))
// Each of these misses one condition (the day, the clock, rated, the source, the opponent, the variant, the start).
const notDone: [string, GameRecord][] = [
  ['casual 600+0 today', lichessGame({ rated: false })],
  ['rated 600+5 today', lichessGame({ tc: '600+5' })],
  ['rated 300+3 today', lichessGame({ tc: '300+3' })],
  ['rated 600+0 yesterday', lichessGame({ day: -1 })],
  ['rated 600+0 pasted as PGN', lichessGame({ source: 'pgn' })],
  ['a game against the app', lichessGame({ source: 'app' })],
  ['rated 600+0 against a BOT', lichessGame({ extra: '[BlackTitle "BOT"]' })],
  ['rated 600+0 Chess960', { ...lichessGame({}), pgn: lichessGame({}).pgn.replace('[Variant "Standard"]', '[Variant "Chess960"]') }],
  ['rated 600+0 from a position', lichessGame({ extra: '[FEN "8/8/8/8/8/8/8/K6k w - - 0 1"]\n[SetUp "1"]' })],
]
for (const [name, game] of notDone) check(`${name}: lichess step not done`, !done([game]))
check('a study game is told apart by its PGN, not by its date', isStudyGame(lichessGame({ day: -1 })) &&
  notDone.filter(([name]) => name !== 'rated 600+0 yesterday').every(([, game]) => !isStudyGame(game)))

// The same through the Rating page's real import, from a line shaped like Lichess's export (lower-case Event tag,
// pgnInJson), and through the sanitizer as Home reads it back from storage.
function exportLine(rated: boolean): string {
  const pgn = [
    `[Event "${rated ? 'rated' : 'casual'} rapid game"]`, '[Site "https://lichess.org/abcd1234"]', '[White "abustrup"]',
    '[Black "Opponent"]', '[Result "0-1"]', '[WhiteElo "1500"]', '[BlackElo "1446"]',
    ...(rated ? ['[WhiteRatingDiff "-6"]', '[BlackRatingDiff "+6"]'] : []),
    '[Variant "Standard"]', '[TimeControl "600+0"]', '[ECO "A48"]', '[Termination "Normal"]', '',
    '1. d4 { [%clk 0:10:00] } 1... g6 { [%clk 0:10:00] } 2. Bf4 Bg7 3. e3 Nf6 0-1', '',
  ].join('\n')
  return JSON.stringify({
    id: rated ? 'abcd1234' : 'casual12', rated, variant: 'standard', speed: 'rapid', perf: 'rapid', createdAt: Date.parse(at(0, 10)),
    status: 'resign', source: 'pool', winner: 'black', moves: 'd4 g6 Bf4 Bg7 e3 Nf6',
    players: { white: { user: { name: 'abustrup', id: 'abustrup' }, rating: 1500 }, black: { user: { name: 'Opponent', id: 'opponent' }, rating: 1446 } },
    clock: { initial: 600, increment: 0, totalTime: 600 }, pgn,
  })
}
const imported = (rated: boolean) => cleanGames(JSON.parse(JSON.stringify(parseLichessNdjson(exportLine(rated), 'abustrup').games)))
check('a rated 10+0 game imported on the Rating page today: done', imported(true).length === 1 && done(imported(true)))
check('a casual 10+0 game imported on the Rating page today: not done', imported(false).length === 1 && !done(imported(false)))

// The puzzle step counts only the three sets, only today, only solved.
const p = (entries: Parameters<typeof puzzles>[0]) => item(buildPlan({ puzzleStats: puzzles(entries), games: [], now }), 'puzzles')
const five = p(['hangingPiece', 'fork', 'fork', 'defensiveMove', 'hangingPiece'].map((theme) => ({ theme })))
check('5 solved today in the three sets: done', five.done === true && five.progressText === '5 of 5 solved today')
check('5 solved today in other themes: not done', p(Array(5).fill({ theme: 'mateIn1' })).progressText === '0 of 5 solved today')
check('5 solved yesterday: not done', p(Array(5).fill({ theme: 'fork', day: -1 })).done === false)
check('3 solved and 4 failed today: 3 of 5', p([...Array(3).fill({ theme: 'fork' }), ...Array(4).fill({ theme: 'fork', solved: false })])
  .progressText === '3 of 5 solved today')
const afterTwo = p([{ theme: STUDY_PUZZLE_THEMES[0].key }, { theme: STUDY_PUZZLE_THEMES[1].key }, { theme: STUDY_PUZZLE_THEMES[1].key }])
check('after some puzzles the next set is one with none solved today', afterTwo.to === `/puzzles?theme=${STUDY_PUZZLE_THEMES[2].key}&level=easy`,
  afterTwo.to)

// The plan as the page draws it: the Lichess card is a real link to another site, in a new tab, without opener access.
const planHtml = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(TodaysPlan, { items: empty })))
const lichessLink = /<a [^>]*href="https:\/\/lichess\.org\/#pool\/10\+0"[^>]*>/.exec(planHtml)?.[0] ?? ''
check('the external link has rel=noopener and target=_blank', /rel="[^"]*\bnoopener\b/.test(lichessLink) && /target="_blank"/.test(lichessLink),
  lichessLink)
check('the plan says two steps', planHtml.includes('Two small steps. Do one, or both.'))

// Continue card: a new player starts with step one of the plan, not an opening course.
const summaries = OPENING_COURSES.map((course) => summariseCourse(course, {}))
const start = buildContinue({ courses: OPENING_COURSES, summaries, progress: {}, unfinishedMoves: null, now, firstStep: empty[0] })
check('Continue for a new player points to the puzzle step', start.kind === 'start' && start.to === empty[0].to, start.to)
const resume = buildContinue({ courses: OPENING_COURSES, summaries, progress: {}, unfinishedMoves: 12, now, firstStep: empty[0] })
check('an unfinished game still comes first', resume.kind === 'game' && resume.to === '/play')

/* ---------------------------------------------------------- the study card */

const fixture = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8')) as unknown
const asOf = '2026-10-20T17:45:00.000Z'
const gateAt = (n: number, source: GateSource = 'lichess') => gateFor({ eligibleGames: n, asOf, source })
const cardText = (n: number, verdict: StudyVerdict | null, backups: unknown = null, source: GateSource = 'lichess') =>
  renderToStaticMarkup(
    createElement(StudyCard, { model: studyCardModel(gateAt(n, source), verdict, cleanBackupLog(backups), now), now, onBackupDownloaded: () => {} }),
  )
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')

// No blunder rate before verdict.json exists: at every count, with any source.
const RATE = /per 100|blunders? per|\d+(\.\d+)? ?%/i
const leaks = [0, 5, 10, 11, 39, 40, 41, 60, 61, 109, 110, 140, 159, 160, 161, 200]
  .flatMap((n) => (['lichess', 'daily job', 'cache', 'none'] as GateSource[]).map((s) => [n, s] as const))
  .filter(([n, s]) => RATE.test(cardText(n, null, null, s)))
check('no blunder rate on the card before verdict.json exists (16 counts x 4 sources)', leaks.length === 0, leaks.join(' '))
const pending = parseVerdict(fixture('verdict-pending-110'))
check('an undecided first check shows no numbers either', !!pending && !pending.decided && !RATE.test(cardText(125, pending)))
check('the card says the numbers stay hidden', cardText(25, null).includes('Your blunder numbers stay hidden until there is a verdict'))
const unknownCard = renderToStaticMarkup(
  createElement(StudyCard, { model: studyCardModel(gateAt(0, 'none'), null, {}, now), now, onBackupDownloaded: () => {} }),
)
check('unknown count: no number and no phase, a plain sentence', unknownCard.includes('will be counted here') &&
  !unknownCard.includes('study-number') && !unknownCard.includes('study-phase') && !unknownCard.includes('study-dot') &&
  !unknownCard.includes('to go'))

const model = (n: number) => studyCardModel(gateAt(n), null, {}, now)
check('games counted and phase are shown', model(12).games === 12 && model(12).phase === 'Before the trainer' &&
  cardText(12, null).includes('12 rated 10+0 games on Lichess since 16 October 2026'))
check('next milestone with games to go', model(12).next?.text === 'after game 40, the Safety-check trainer opens' &&
  model(12).next?.toGo === '28 games to go', JSON.stringify(model(12).next))
const phases = [10, 11, 40, 41, 60, 61, 160, 161].map((n) => `${n}:${model(n).phase}`).join(' | ')
check('the phase follows the gate', phases ===
  '10:Warm-up (not counted) | 11:Before the trainer | 40:Before the trainer | 41:Trainer started (not measured yet) | ' +
  '60:Trainer started (not measured yet) | 61:With the trainer | 160:With the trainer | 161:Study finished', phases)
// Both stretches the verdict compares carry matching names, so neither looks like the one that "counts" more.
const legend = cardText(12, null)
check('the track names both compared stretches alike, and nothing "measured"', legend.includes('Before the trainer 11-40') &&
  legend.includes('With the trainer 61-160') && !/measured/i.test(legend), legend.slice(0, 260))

// The backup ask at games 110 and 160.
const ask = (n: number, log: unknown = null) => studyCardModel(gateAt(n), null, cleanBackupLog(log), now).backup
check('no backup ask before game 110', ask(109) === null && ask(0) === null && !cardText(109, null).includes('backup'))
check('backup ask at 110', ask(110)?.game === 110 && ask(110)?.downloadedAt === null && cardText(110, null).includes('Download backup'))
check('backup ask stays for the first check until 159', ask(159)?.game === 110)
check('backup ask at 160 is new', ask(160)?.game === 160 && ask(160, { 110: asOf })?.downloadedAt === null)
check('a download is remembered per check', ask(130, { 110: asOf })?.downloadedAt === asOf && ask(170, { 160: asOf })?.downloadedAt === asOf &&
  cardText(130, null, { 110: asOf }).includes('Send the file to Claude'))
check('a damaged backup log counts as no download', ask(110, { 110: 'not a date', x: 1 })?.downloadedAt === null)
check('no backup ask while the count is unknown', studyCardModel(gateAt(0, 'none'), null, {}, now).backup === null)

// verdict.json, as the pre-registered verdict.py writes it (fixtures made by calling it unchanged).
const worked = parseVerdict(fixture('verdict-worked-110'))
check('a decided verdict is read', !!worked && worked.decided && worked.kind === 'worked' && worked.decidedAtGame === 110)
const workedText = cardText(115, worked)
check('the verdict line appears with its numbers', workedText.includes('Verdict after game 110: Worked') &&
  /per 100 of your moves: \d+\.\d before the trainer \(games 11-40\), \d+\.\d with it \(games 61-110\)/.test(workedText) &&
  /90% range -?\d+\.\d to -?\d+\.\d/.test(workedText), workedText.slice(0, 400))
const decidedModel = studyCardModel(gateAt(115), worked, {}, now)
check('a decided study shows no next milestone and no "hidden" note', decidedModel.next === null && decidedModel.hiddenNote === null &&
  decidedModel.phase === 'Decided after game 110')
check('a study decided at game 110 does not ask for a backup again at 160', studyCardModel(gateAt(165), worked, {}, now).backup?.game === 110)
// verdict.py's range90 is for the drop; a rise must show the range of the rise (drop -1.2, range -4.0..1.6 -> rise -1.6..4.0)
const rise = worked && worked.decided ? verdictNumbers({ ...worked, drop: -1.2, range90: [-4.0, 1.6] }) ?? '' : ''
check('when blunders went up, the range belongs to the rise', rise.includes('A rise of 1.2 (90% range -1.6 to 4.0)'), rise)
const final = parseVerdict(fixture('verdict-cannot-tell-160'))
check('the final verdict is read', !!final && final.decided && final.kind === 'cannot tell' && final.decidedAtGame === 160 &&
  cardText(161, final).includes('Verdict after game 160: Cannot tell'))
check('pending verdict: the study goes on', !!pending && !pending.decided && pending.nextCheckGame === 160 &&
  cardText(125, pending).includes('no verdict yet. The study goes on to game 160'))
check('reached a check, no file yet: says the check runs with the daily job', cardText(110, null).includes('first check is worked out in the next daily run') &&
  cardText(160, pending).includes('final check is worked out in the next daily run'))
// The meaning line never contradicts the numbers under it (files made by verdict.py, unchanged).
const blocked = parseVerdict(fixture('verdict-newcomers-cannot-tell-160'))
const blockedText = cardText(161, blocked)
check('cannot tell because of the newcomers: says the drop was clear but cannot be pinned on the trainer',
  !!blocked && blocked.decided && blocked.kind === 'cannot tell' && blockedText.includes('cannot be pinned on the trainer') &&
  !blockedText.includes('no clear drop') && /A drop of \d+\.\d \(90% range \d+\.\d to/.test(blockedText), blockedText.slice(220, 560))
check('cannot tell without the newcomers: still "in between"', !!final && final.decided && /no clear drop/.test(final.meaning))
const rose = parseVerdict(fixture('verdict-rise-110'))
const roseText = cardText(112, rose)
check('no big effect with more blunders: no talk of a possible smaller drop', !!rose && rose.decided && rose.kind === 'no big effect' &&
  roseText.includes('point to more blunders, not fewer') && !roseText.includes('smaller real drop') && roseText.includes('A rise of'),
  roseText.slice(220, 520))
check('worked without the newcomer condition: no claim about newcomers', !!worked && worked.decided && !/newcomer|new 10\+0 players/.test(worked.meaning))
const junk = [null, 5, 'x', [], {}, { primary: {} }, { verdict: 3 }, { primary: { verdict: '' } }]
check('anything that is not a verdict file is ignored', junk.every((j) => parseVerdict(j) === null))

/* ------------------------------------------- H2: the trainer in the plan (gated) */

// Locked: today's plan and the Continue card exactly as H1 drew them (snapshot written from H1's code before H2).
const snapshot = (fixture('locked-home.snapshot') as { html: Record<string, string> }).html
const lockedNow = lockedHomeHtml()
const changed = Object.keys(snapshot).filter((name) => lockedNow[name] !== snapshot[name])
check('locked: plan and Continue card identical to H1 in all 7 situations', Object.keys(snapshot).length === 7 &&
  Object.keys(lockedNow).length === 7 && changed.length === 0, changed.join(', '))
const lockedNull = buildPlan({ puzzleStats: NO_PUZZLE_STATS, games: [], now, safety: null })
check('locked: no trainer step, the same two steps as before', JSON.stringify(lockedNull) === JSON.stringify(empty))

const today = (left: number | null, answered = 0, positions: number | null = 184, failed = false): SafetyToday =>
  failed ? { left, answered, positions, failed } : { left, answered, positions }
const planWith = (s: SafetyToday) => buildPlan({ puzzleStats: NO_PUZZLE_STATS, games: [], now, safety: s })

const twelve = planWith(today(12))
check('with 12 due: [safety "12 positions", puzzles, lichess]', ids(twelve) === 'safety,puzzles,lichess' &&
  twelve[0].title === 'Safety check: 12 positions' && twelve[0].to === '/safety' && !twelve[0].external && !twelve[0].done,
  `${ids(twelve)} | ${twelve[0].title}`)
check('the puzzle and Lichess steps are unchanged by the trainer', JSON.stringify(twelve.slice(1)) === JSON.stringify(empty))
check('one due: "1 position"', planWith(today(1))[0].title === 'Safety check: 1 position')
check('progress counts answers today', planWith(today(9, 3))[0].progressText === '3 of 12 done today' &&
  planWith(today(9, 3))[0].fraction === 0.25 && planWith(today(9, 3))[0].cta === 'Continue')
const emptyQueues: [string, SafetyToday][] = [
  ['all of today answered', today(0, 14)],
  ['nothing due today', today(0, 0)],
  ['no positions in the file yet', today(0, 0, 0)],
]
for (const [name, s] of emptyQueues) {
  const step = planWith(s)[0]
  check(`empty queue (${name}): safety step first and done`, step.id === 'safety' && step.done === true, step.title)
}
check('empty queue says why', planWith(today(0, 14))[0].title === 'Safety check: done for today' &&
  planWith(today(0, 0))[0].title === 'Safety check: nothing due today' && planWith(today(0, 0, 0))[0].title === 'Safety check: no positions yet')
const counting = planWith(today(null, 0, null))[0]
check('still counting: safety step first, not done, no number', ids(planWith(today(null, 0, null))) === 'safety,puzzles,lichess' &&
  !counting.done && counting.title === 'Safety check' && !/\d/.test(counting.title))
const failed = planWith(today(null, 0, null, true))[0]
check('card file failed: safety step stays first, not done, links to the trainer', failed.id === 'safety' && !failed.done &&
  failed.to === '/safety' && /could not be counted/.test(failed.reason))
const unlockedHtml = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(TodaysPlan, { items: twelve })))
check('the plan says three steps, trainer first, as an in-app link', unlockedHtml.includes('Three small steps. The Safety check comes first.') &&
  /<a [^>]*href="\/safety"/.test(unlockedHtml) && unlockedHtml.indexOf('href="/safety"') < unlockedHtml.indexOf('href="/puzzles'))

// The Continue card points to /safety while positions are waiting; otherwise the old rule.
const cont = (s: SafetyToday, unfinishedMoves: number | null = null) => {
  const plan = planWith(s)
  return buildContinue({ courses: OPENING_COURSES, summaries, progress: {}, unfinishedMoves, now, safety: s,
    firstStep: plan.find((i) => i.id !== 'safety' || !i.done) })
}
const c12 = cont(today(12))
check('Continue with 12 due points to /safety', c12.kind === 'safety' && c12.to === '/safety' && c12.title === '12 positions are waiting', c12.title)
check('Continue with 1 due', cont(today(1)).title === '1 position is waiting')
check('Continue: the trainer comes before an unfinished game', cont(today(5), 12).to === '/safety')
check('Continue after some answers says how many are left', cont(today(9, 3)).detail === 'Your Safety check: 3 done today, 9 to go.' &&
  cont(today(9, 3)).button === 'Continue')
check('Continue while counting points to /safety', cont(today(null, 0, null)).to === '/safety')
check('Continue with an empty queue: old rule, start with the puzzles', cont(today(0, 14)).kind === 'start' &&
  cont(today(0, 14)).to === empty[0].to && cont(today(0, 14)).detail === "Next in today's plan.", cont(today(0, 14)).to)
check('Continue with an empty queue and an unfinished game: the game', cont(today(0, 14), 12).to === '/play')
check('Continue when the card file failed: step one of the plan, the trainer', cont(today(null, 0, null, true)).to === '/safety' &&
  cont(today(null, 0, null, true)).kind === 'start')
const contHtml = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ContinueCard, { target: c12 })))
check('Continue card draws the trainer button', contHtml.includes('12 positions are waiting') && /<a [^>]*href="\/safety"[^>]*>Start/.test(contHtml))

// With the trainer's real queue (S1's fixture positions, copied to 30) and storage, as Home reads it.
const mem = new Map<string, string>()
;(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
}
const fixtureCards = cleanCardFile(JSON.parse(readFileSync(new URL('../safety/fixtures/safety-cards.json', import.meta.url), 'utf8'))).cards
const cards: SafetyCard[] = Array.from({ length: 5 }, (_, copy) =>
  fixtureCards.map((c) => {
    const game = `${c.context.gameId}${copy}`
    return { ...c, id: `${c.kind}:${game}:${c.id.split(':').pop()}`, context: { ...c.context, gameId: game } }
  }),
).flat()
const reviewed = (due: string): StoredSafetyCard => ({
  due, stability: 3, difficulty: 5, elapsed_days: 3, scheduled_days: 3, learning_steps: 0, reps: 1, lapses: 0, state: 2,
  last_review: '2026-10-16T08:00:00.000Z',
})
writeStored(KEYS.safetySettings, DEFAULT_SAFETY_SETTINGS)
writeStored(KEYS.safetyState, { [cards[0].id]: reviewed('2026-10-19T08:00:00.000Z'), [cards[1].id]: reviewed('2026-10-20T06:00:00.000Z'),
  [cards[2].id]: reviewed('2026-10-25T08:00:00.000Z') })
const trainerDay = () => currentDay(cards, readState(), DEFAULT_SAFETY_SETTINGS, now, readDay())
const fresh = safetyTodayFrom(cards, now)
check('real queue: 2 reviews due and 10 new (the default caps) make 12', cards.length === 30 && fresh.left === 12 &&
  fresh.answered === 0 && fresh.positions === 30, JSON.stringify(fresh))
check('real queue: Home counts what the trainer will show', fresh.left === remainingIds(trainerDay()).length)
check('real queue: the plan says 12 positions', planWith(fresh)[0].title === 'Safety check: 12 positions')
check('before the trainer has planned today, without the card file nothing is counted yet', safetyTodayFrom(null, now).left === null)

// He answers 3 (one wrong, so it comes back once at the end), the trainer saves its day, Home re-counts
let day = trainerDay()
writeDay(day)
check('without the card file, today\'s saved queue gives the same 12', safetyTodayFrom(null, now).left === 12)
day = markAnswered(markAnswered(markAnswered(day, day.ids[0], 'first', true), day.ids[1], 'first', false), day.ids[2], 'first', true)
writeDay(day)
const afterThree = safetyTodayFrom(cards, now)
check('after 3 answers (1 miss): 10 left, 3 done, as the trainer counts them', afterThree.left === 10 && afterThree.answered === 3 &&
  afterThree.left === remainingIds(readDay()!).length && afterThree.answered + afterThree.left === day.ids.length + day.repeats.length,
  JSON.stringify(afterThree))
check('the plan step shows 3 of 13', planWith(afterThree)[0].progressText === '3 of 13 done today')
for (const id of remainingIds(day)) day = markAnswered(day, id, day.done.includes(id) ? 'repeat' : 'first', true)
writeDay(day)
const allDone = safetyTodayFrom(cards, now)
check('all answered: 0 left, the safety step is done', allDone.left === 0 && allDone.answered === 13 && planWith(allDone)[0].done === true)
const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9)
check('a new day: yesterday\'s answers do not count, nothing counted without the file', safetyTodayFrom(null, tomorrow).left === null &&
  safetyTodayFrom(null, tomorrow).answered === 0)
writeStored(KEYS.safetySettings, { ...DEFAULT_SAFETY_SETTINGS, newPerDay: 0 })
writeStored(KEYS.safetyState, { [cards[2].id]: reviewed('2026-10-25T08:00:00.000Z') })
const nothingNew = safetyTodayFrom(cards, tomorrow)
check('no new positions a day and no reviews due: empty queue, step done', nothingNew.left === 0 && planWith(nothingNew)[0].done === true,
  JSON.stringify(nothingNew))

// "12 due" read literally: 12 reviews due on a new day. With room for them and no new positions the step says 12;
// with the default caps (10 reviews + 10 new) it says what the trainer will show that day, 20, never a different count.
const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 9)
writeStored(KEYS.safetyState, Object.fromEntries(cards.slice(0, 12).map((c, i) => [c.id, reviewed(`2026-10-${10 + i}T08:00:00.000Z`)])))
writeStored(KEYS.safetySettings, { ...DEFAULT_SAFETY_SETTINGS, newPerDay: 0, maxReviews: 15 })
const twelveReviews = safetyTodayFrom(cards, dayAfter)
check('12 reviews due, room for all, no new: "12 positions"', twelveReviews.left === 12 && planWith(twelveReviews)[0].title === 'Safety check: 12 positions',
  JSON.stringify(twelveReviews))
writeStored(KEYS.safetySettings, DEFAULT_SAFETY_SETTINGS)
const capped = safetyTodayFrom(cards, dayAfter)
const cappedDay = currentDay(cards, readState(), DEFAULT_SAFETY_SETTINGS, dayAfter, readDay())
check('12 reviews due with the default caps: 10 reviews + 10 new, as the trainer plans the day', capped.left === 20 &&
  capped.left === remainingIds(cappedDay).length, JSON.stringify(capped))

console.log(failures ? `\n${failures} check(s) failed` : '\nprogress.check: all good')
process.exit(failures ? 1 : 0)
