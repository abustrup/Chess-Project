// Self-check of the rating page (R2 acceptance):   npx tsx src/features/rating/rating.check.ts
// Renders the page's headline from a mocked 2026-10-16 Lichess answer and checks what it says, the chess.com table,
// the history line, that nothing still uses the old blended estimate, and that Play's bot level still follows
// "Bot starting strength". The browser half (offline, Home, CORS) is rating.e2e.ts.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import type { AnalysedMove, GameRecord } from '../../types'
import RatingCard from '../home/RatingCard'
import { DEFAULT_SETUP, levelIdFor } from '../play/session'
import LiveRatingHero from './LiveRatingHero'
import WorkOnPanel from './WorkOnPanel'
import { cleanMap, translate, type ChesscomMap } from './chesscomMap'
import { perfOfTimeControl, ratingHistory } from './history'
import { computeInsights, type Insights } from './insights'
import { headlinePerf, parseLichessUser, ratingRange, shownPerfs, trendGames, trendText, type LichessRatings } from './lichessRating'
import type { LiveRating } from './useLichessRating'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '../../..')

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

const fixture = JSON.parse(readFileSync(join(HERE, 'fixtures/lichess-user-2026-10-16.json'), 'utf8'))
const FETCHED = '2026-10-16T15:22:00.000Z'
const map = cleanMap(JSON.parse(readFileSync(join(ROOT, 'public/data/rating/chesscom-map.json'), 'utf8'))) as ChesscomMap

function hero(ratings: LichessRatings, status: LiveRating['status'] = 'live'): string {
  const live: LiveRating = { ratings, status, busy: false, error: null, refresh: () => {} }
  return renderToStaticMarkup(
    createElement(MemoryRouter, null, createElement(LiveRatingHero, { username: 'abustrup', live, map, onImport: () => {} })),
  )
}
const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")

// --- 1. the mocked 2026-10-16 answer
const r = parseLichessUser(fixture, 'abustrup', FETCHED)
const page = text(hero(r))
check('blitz 1017 shown', /Blitz.*1017/.test(page))
check("Lichess's range 889 to 1145", page.includes("Lichess's range: 889 to 1145"), JSON.stringify(ratingRange(r.perfs.blitz!)))
check('31 games', page.includes('31 games'))
check('"No rapid rating yet"', page.includes('No rapid rating yet.'))
check('never the 1500 placeholder', !/\b1500\b/.test(page))
check('rapid first, then blitz; nothing else', JSON.stringify(shownPerfs(r)) === '["rapid","blitz"]')
check('Home headline falls back to blitz', headlinePerf(r) === 'blitz')
check('trend is over the last 11 games', trendText(r.perfs.blitz!) === '−117 over your last 11 games', String(trendText(r.perfs.blitz!)))
// Lichess keeps recent ratings only from game 11 on, at most 12 (lila Perf.updateRecentWith), so a young rating's
// `prog` spans fewer games; his rapid rating is young during the whole "before" phase
check('trend span follows Lichess (11 games: none, 12: 1, 15: 4, 22+: 11)', [[11, 0], [12, 1], [15, 4], [21, 10], [22, 11], [160, 11]].every(([g, s]) => trendGames(g) === s))
check('trend at 15 games says 4 games', trendText({ rating: 1150, rd: 75, games: 15, prov: false, prog: 40 }) === '+40 over your last 4 games')
check('trend at 12 games says one game', trendText({ rating: 1150, rd: 75, games: 12, prov: false, prog: -8 }) === '−8 over your last game')
check('no trend at 11 games', trendText({ rating: 1150, rd: 75, games: 11, prov: false, prog: 5 }) === null)
const m = /Translated to chess\.com blitz: about (\d+) \(8 in 10 similar players: (\d+) to (\d+)\)/.exec(page)
check('one chess.com line', !!m && (page.match(/Translated to chess\.com/g) ?? []).length === 1)
if (m) {
  const [center, low, high] = [Number(m[1]), Number(m[2]), Number(m[3])]
  check('chess.com centre 480-525', center >= 480 && center <= 525, String(center))
  check('8-in-10 range inside 350-690', low >= 350 && high <= 690, `${low} to ${high}`)
}
// 139 players: the pooled 140 blitz pairs hold one September player twice (build_pooled_map.py counts each player once)
check('chess.com line names N and the date', /From 139 players with accounts on both sites, 47 of them within 100 points/.test(page) && page.includes('2026-10-16'))
check('chess.com never called his rating', !/your chess\.com rating is/i.test(page) && page.includes('You only get a real chess.com rating by playing'))
check('says bot and pasted games do not change it', page.includes('Games against the bot and pasted games are for practice and review; they do not change it.'))
check('as-of date shown', page.includes('as of 16 Oct 2026'))

// --- 2. RD 120: "?" and no chess.com line (with and without Lichess's own flag)
for (const prov of [true, false]) {
  const shaky = parseLichessUser({ perfs: { ...fixture.perfs, blitz: { ...fixture.perfs.blitz, rd: 120, ...(prov ? { prov: true } : {}) } } }, 'abustrup', FETCHED)
  const t = text(hero(shaky))
  check(`RD 120${prov ? ' (prov flag)' : ' (no flag)'}: shows 1017?`, t.includes('1017?') && t.includes('provisional'))
  check(`RD 120${prov ? ' (prov flag)' : ' (no flag)'}: no chess.com line`, !t.includes('Translated to chess.com'))
}
check('RD 109 is established', translate(map, 'blitz', { rating: 1017, rd: 109, games: 31, prov: false, prog: 0 }) !== null)
check('outside the table: no translation', translate(map, 'blitz', { rating: 1700, rd: 60, games: 200, prov: false, prog: 0 }) === null)
check('0 games: no translation', translate(map, 'blitz', { rating: 1017, rd: 64, games: 0, prov: false, prog: 0 }) === null)

// --- 3. the app's table equals the research result (built together by build_pooled_map.py)
const research = JSON.parse(
  readFileSync(join(ROOT, 'research/2026-10-16-diagnosis/rating/results/chesscom_map_pooled.json'), 'utf8'),
)
for (const [perf, key] of [['blitz', 'blitz_to_chesscom_blitz'], ['rapid', 'rapid_to_chesscom_rapid']] as const) {
  const a = map.maps[perf]!
  const b = research.maps[key]
  const same =
    a.pairs === b.pairs &&
    a.rows.length === b.rows.length &&
    a.rows.every((row, i) => (['lichess', 'center', 'p10', 'p90', 'near'] as const).every((k) => row[k] === b.rows[i][k]))
  check(`${perf} table equals the research file`, same, `${a.pairs} pairs, ${a.rows.length} rows`)
}
check('blitz table built on the pooled pairs, each player once (140 pairs, 139 players)', map.maps.blitz?.pairs === 139)
check('the research file says how many repeats it dropped', research.repeated_usernames_dropped?.september_2026 === 22 && research.usernames_in_both_samples === 0)

// --- 4. history: rating before each rated game, oldest first, then now; casual games and other names left out
const pgn = (tc: string, diff: string | null) =>
  `[Event "x"]\n[TimeControl "${tc}"]\n${diff === null ? '' : `[WhiteRatingDiff "${diff}"]\n`}[White "abustrup"]\n[Black "Other player"]\n\n1. e4 e5 *`
// names with a space, so never a real Lichess username (the only real one is the owner's)
const g = (id: string, date: string, elo: number, tc: string, diff: string | null, white = 'abustrup'): GameRecord => ({
  id, date, source: 'lichess', pgn: pgn(tc, diff), white, black: 'Other player', whiteElo: elo, blackElo: 1200, userSide: 'white', result: '1-0',
})
const games: GameRecord[] = [
  g('c', '2026-10-10T12:00:00Z', 1328, '180+2', '-70'),
  g('a', '2026-10-10T10:00:00Z', 1500, '180+2', '-285'),
  g('b', '2026-10-10T11:00:00Z', 1215, '300+3', '+113'),
  g('casual', '2026-10-10T11:30:00Z', 1300, '180+2', null),
  g('other', '2026-10-10T11:40:00Z', 1400, '180+2', '+5', 'Someone else'),
  g('rapid', '2026-10-10T13:00:00Z', 1500, '600+0', '+200'),
  g('d', '2026-10-11T10:00:00Z', 1200, '180+2', '-8'), // 1328 - 70 = 1258, so one game is missing before it
]
const h = ratingHistory(games, 'abustrup', 'blitz', { rating: { rating: 1192, rd: 70, games: 5, prov: false, prog: 0 }, fetchedAt: FETCHED })
check('history: 1500 start left out, then before-game ratings, then now', JSON.stringify(h.points.map((p) => p.rating)) === '[1215,1328,1200,1192]', JSON.stringify(h.points.map((p) => p.rating)))
check('history: 4 rated blitz games found, 1 gap', h.gamesFound === 4 && h.gaps === 1 && h.startLeftOut)
check('history: 10+0 is rapid, 3+2 and 5+3 are blitz', perfOfTimeControl('600+0') === 'rapid' && perfOfTimeControl('180+2') === 'blitz' && perfOfTimeControl('300+3') === 'blitz' && perfOfTimeControl('900+10') === 'rapid')

// --- 5. no component imports the old estimate code
const OLD = /from\s+['"][^'"]*\/(estimate|evidence|calibration|calibrate|EstimateHero|EstimateBreakdown|EstimateChart)['"]/
const offenders: string[] = []
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(ts|tsx)$/.test(name) && OLD.test(readFileSync(p, 'utf8'))) offenders.push(p.slice(ROOT.length + 1))
  }
}
walk(join(ROOT, 'src'))
check('no file imports the old estimate code', offenders.length === 0, offenders.join(', '))
const gone = ['estimate.ts', 'evidence.ts', 'calibration.ts', 'calibrate.ts', 'EstimateHero.tsx', 'EstimateBreakdown.tsx', 'EstimateChart.tsx']
check('old estimate files removed', gone.every((f) => !readdirSync(HERE).includes(f)))

// --- 6. Home's card keeps its props, and Play's bot level still follows "Bot starting strength"
const card = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(RatingCard, { estimate: null, selfRating: 1100 })))
check('RatingCard renders with its old props', card.includes('Your Lichess rating') && !card.includes('estimate'))
check('bot level follows the profile value', [
  [600, 'beginner'], [700, 'beginner'], [900, 'casual'], [1100, 'club'], [1300, 'improver'], [1600, 'strong'], [2000, 'expert'],
].every(([elo, id]) => levelIdFor({ ...DEFAULT_SETUP, levelId: '' }, elo as number) === id))
check('a level picked in Play still wins', levelIdFor({ ...DEFAULT_SETUP, levelId: 'expert' }, 700) === 'expert')
const profileSrc = readFileSync(join(ROOT, 'src/features/home/settings/ProfileSection.tsx'), 'utf8')
check('Settings field is "Bot starting strength" and saves selfRating', profileSrc.includes('>Bot starting strength<') && profileSrc.includes('change({ selfRating })'))

// --- 7. study rule: no running blunder rate on screen until the verdict (build-plan.md "Not built"). Before a
// verdict: no blunder totals, accuracy percentages, average loss or move count (a rate would be one division away);
// after it: counts only, still no rate.
const habits: Insights = {
  gamesAnalysed: 12, userMoves: 400, blunders: 14, mistakes: 9, inaccuracies: 20, blunderRate: 3.5,
  phases: [{ phase: 'opening', moves: 120, accuracy: 81.4, acpl: 22 }, { phase: 'middlegame', moves: 280, accuracy: 63.2, acpl: 61 }],
  hungPieces: { count: 6, games: 5 }, missedChances: { count: 4, games: 3 },
  openings: [{ name: 'London System (as White)', games: 6, wins: 3, draws: 1, losses: 2, scorePct: 58.3, acpl: 47.6 }], suggestions: [],
}
const panel = (showNumbers?: boolean) =>
  text(renderToStaticMarkup(createElement(MemoryRouter, null, createElement(WorkOnPanel, { insights: habits, showNumbers }))))
const hidden = panel()
check('What to work on, no verdict yet: no blunder totals, accuracy %, average loss or move count',
  !/14 \/ 9 \/ 20|blunders \/ mistakes|81%|63%|Accuracy in each|Avg\. loss|48|400|of your moves|per 100|per game|3\.5/.test(hidden) &&
    hidden.includes('Based on 12 analysed games.') && hidden.includes('stay hidden until your study has a verdict') && hidden.includes('58%'),
  hidden.slice(0, 300))
const shown = panel(true)
check('What to work on, after the verdict: counts and accuracy, still no rate per 100 moves or per game',
  !/per 100|per game|3\.5/.test(shown) && shown.includes('14 / 9 / 20') && shown.includes('pieces left hanging, in 5 of 12 games') &&
    shown.includes('400 of your moves') && shown.includes('81%') && !shown.includes('stay hidden'),
  shown.slice(0, 300))
const insightsSrc = readFileSync(join(HERE, 'insights.ts'), 'utf8')
check('advice text never prints the blunder rate', !/text:\s*`[^`]*blunderRate/.test(insightsSrc) && !/per 100 moves/.test(insightsSrc))
// the advice itself, from real analysed moves: no counts or percentages unless showNumbers
const mv = (ply: number, classification: 'blunder' | 'good', accuracy: number) =>
  ({ ply, san: 'a3', uci: 'a2a3', fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', cpBefore: 0, cpAfter: 0, cpLoss: classification === 'blunder' ? 400 : 0, accuracy, classification, bestUci: 'a2a3', bestSan: 'a3' }) as unknown as AnalysedMove
const adviceGames = Array.from({ length: 4 }, (_, i) => ({
  id: `g${i}`, source: 'lichess', userSide: 'white', result: '0-1', openingName: 'London System', pgn: '',
  analysis: { acpl: { white: 40, black: 20 }, moves: Array.from({ length: 40 }, (_, k) => mv(k + 1, k === 24 || k === 32 ? 'blunder' : 'good', k < 20 ? 90 : 55)) },
})) as unknown as GameRecord[]
const quietAdvice = computeInsights(adviceGames).suggestions.map((s) => s.text).join(' | ')
const loudAdvice = computeInsights(adviceGames, { showNumbers: true }).suggestions.map((s) => s.text).join(' | ')
// (the opening score, "You scored 0% in 4 games", is a game result like the rating, not a blunder number, so it stays)
const errorNumbers = /accuracy[^.]*\d|\d+ big blunder|\d+ of \d+ games|\(\d+ times?\)/i
check('advice without blunder counts or accuracy percentages before the verdict',
  /blunder/i.test(quietAdvice) && /least accurate/.test(quietAdvice) && !errorNumbers.test(quietAdvice), quietAdvice)
check('the same advice with its numbers after it', /\d+ big blunders in 4 analysed games/.test(loudAdvice) && /accuracy in the middlegame is \d+%/.test(loudAdvice), loudAdvice)

console.log(failures ? `\n${failures} check(s) FAILED` : '\nall rating checks passed')
process.exit(failures ? 1 : 0)
