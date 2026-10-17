// Browser test of the Review page with Lichess's labels:
//   npx tsx src/features/review/review.e2e.ts <outDir>      (dev server or a preview must be running; APP_URL overrides)
// Two of his games that Lichess analysed are stored in the browser: one with an analysis saved under the old labels
// (20 points for a blunder), one not analysed yet. The page must show Lichess's counts for the first, analyse the
// second with the browser engine, and load clean (no errors, no sideways scrolling) at phone and desktop size, in
// both app themes (Ocean and Ember, both dark), with and without zen mode.
// Lichess and the daily job's status file are answered by the test (0 study games, the 2026-10-16 profile), so the
// run is the same offline; every page asks Lichess for the study count, and on 2026-10-16 lichess.org answered the
// headless browser's request with 404.
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Chess } from 'chess.js'
import { chromium, type Page } from 'playwright-core'
import type { AnalysedMove, GameRecord, MoveClass } from '../../types'
import { classifyMove, scoreToCp, winPercent } from '../../lib/evaluation'
import { identifyOpening } from '../../lib/openingName'
import type { Judgment } from '../../lib/lichessRules'
import { analysePlies, type PositionEval } from './analyse'
import { replayPgn } from './pgnGame'

const base = process.env.APP_URL || 'http://localhost:5199/'
// screenshots go outside the repo unless a folder is given, so they are never committed by accident
const out = process.argv[2] || join(tmpdir(), 'review-shots')
mkdirSync(out, { recursive: true })
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const executablePath = process.env.CHROMIUM || (existsSync(MAC_CHROME) ? MAC_CHROME : '/opt/pw-browsers/chromium')

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
const pick = (id: string) => fixture.games.find((g) => g.id === id)!
const USER_FIXTURE = new URL('../rating/fixtures/lichess-user-2026-10-16.json', import.meta.url)
const userAnswer = existsSync(USER_FIXTURE) ? readFileSync(USER_FIXTURE, 'utf8') : '{}'

const pgnOf = (sans: string[]) => sans.map((s, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${s}` : s)).join(' ')

/** A stored game record; opponents are left anonymous, as in the fixture. */
function record(g: FixtureGame, n: number): GameRecord {
  const sans = g.moves.split(' ')
  const end = new Chess()
  for (const s of sans) end.move(s)
  return {
    id: `e2e-${g.id}`,
    date: `2026-10-0${n}T12:00:00.000Z`,
    source: 'lichess',
    pgn: `[White "${g.side === 'white' ? 'abustrup' : 'Opponent'}"]\n[Black "${g.side === 'black' ? 'abustrup' : 'Opponent'}"]\n\n${pgnOf(sans)}`,
    white: g.side === 'white' ? 'abustrup' : 'Opponent',
    black: g.side === 'black' ? 'abustrup' : 'Opponent',
    userSide: g.side,
    result: end.isCheckmate() ? (end.turn() === 'w' ? '0-1' : '1-0') : '*',
  }
}

/** The analysis as the app saved it before 2026-10-16: Lichess's numbers, but the old labels. */
function oldAnalysis(g: FixtureGame): NonNullable<GameRecord['analysis']> {
  const sans = g.moves.split(' ')
  const plies = replayPgn(pgnOf(sans)).plies
  const evals: PositionEval[] = [{ cp: 15, best: g.analysis[0]?.best ?? plies[0].uci, depth: 12 }]
  plies.forEach((p, j) => {
    const a = g.analysis[j]
    evals.push({
      cp: a.mate != null ? scoreToCp({ mate: a.mate }) : (a.eval ?? 0),
      best: j + 1 < plies.length ? (g.analysis[j + 1]?.best ?? plies[j + 1].uci) : null,
      depth: 12,
    })
  })
  const bookPlies = identifyOpening(sans)?.plies ?? 0
  const moves: AnalysedMove[] = analysePlies(plies, evals, bookPlies).map((m) => {
    const sign = m.ply % 2 === 1 ? 1 : -1
    const best = m.bestUci === m.uci
    const before = winPercent(sign * m.evalBefore)
    const after = best ? Math.max(winPercent(sign * m.evalAfter), before) : winPercent(sign * m.evalAfter)
    const old: MoveClass = m.ply <= bookPlies ? 'book' : best ? 'best' : classifyMove(before, after)
    return { ...m, classification: old }
  })
  return {
    engine: 'stockfish-19-lite depth 12',
    depth: 12,
    moves,
    acpl: { white: 50, black: 50 },
    accuracy: { white: 80, black: 80 },
    analysedAt: '2026-10-01T12:00:00.000Z',
  }
}

/** Lichess's counts for one side, in the order the cards list them. */
function lichessCounts(g: FixtureGame, white: boolean): number[] {
  const of = (j: Judgment) => g.analysis.filter((a, i) => (i % 2 === 0) === white && a.judgment === j).length
  return [of('Blunder'), of('Mistake'), of('Inaccuracy')]
}

/** The counts the two accuracy cards show, "You" first: [blunders, mistakes, inaccuracies] each. */
async function shownCounts(page: Page): Promise<number[][]> {
  return page.$$eval('.accuracy-card .ac-counts', (lists) =>
    lists.map((ul) => [...ul.querySelectorAll('li')].map((li) => Number(/\d+/.exec(li.textContent ?? '')?.[0] ?? -1))),
  )
}

const saved = pick('KC803zNe') // he is White; Lichess labelled 42 moves
const fresh = pick('pEKoVG79') // he is Black; 43 half-moves, analysed in the browser below
const games: GameRecord[] = [{ ...record(saved, 2), analysis: oldAnalysis(saved) }, record(fresh, 1)]
const oldMine = (['blunder', 'mistake', 'inaccuracy'] as const).map(
  (c) => games[0].analysis!.moves.filter((m) => m.ply % 2 === 1 && m.classification === c).length,
)

const SIZES = { desktop: { width: 1360, height: 860 }, phone: { width: 390, height: 844 } }
// The app has no light mode: its two themes are both dark, so the variants are the themes, not colour schemes.
const VARIANTS = [
  { name: 'ocean', scheme: 'dark', profile: { appTheme: 'ocean', zenMode: false } },
  { name: 'ember', scheme: 'dark', profile: { appTheme: 'ember', zenMode: false, boardTheme: 'walnut' } },
  { name: 'zen-ember', scheme: 'dark', profile: { appTheme: 'ember', zenMode: true, boardTheme: 'walnut' } },
] as const

let problems = 0
function report(ok: boolean, name: string, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) problems++
}

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] })
try {
  for (const [sizeName, viewport] of Object.entries(SIZES)) {
    for (const v of VARIANTS) {
      const ctx = await browser.newContext({ viewport, colorScheme: v.scheme })
      await ctx.addInitScript(
        ([g, p]) => {
          localStorage.setItem('cc.games', g)
          localStorage.setItem('cc.profile', p)
        },
        [JSON.stringify(games), JSON.stringify(v.profile)],
      )
      // Lichess: the study count (no games yet) and the profile the Rating page shows
      await ctx.route('https://lichess.org/**', (r) =>
        r.request().url().includes('/api/user/')
          ? r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: userAnswer })
          : r.fulfill({ status: 200, contentType: 'application/x-ndjson', headers: { 'access-control-allow-origin': '*' }, body: '' }),
      )
      await ctx.route('**/data/study/status.json', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ asOf: new Date(Date.now() - 3_600_000).toISOString(), eligibleGames: 0, unlockAfterGame: 40, U: 40 }),
        }),
      )
      const page = await ctx.newPage()
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
      page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()))
      page.on('response', (r) => r.status() >= 400 && errors.push(`http ${r.status()}: ${r.url()}`))

      await page.goto(`${base}#/review/${games[0].id}`)
      await page.waitForSelector('.review-page', { timeout: 15000 })
      await page.waitForTimeout(1200)
      const where = `${sizeName}/${v.name}`
      await page.screenshot({ path: `${out}/${sizeName}-${v.name}-saved.png`, fullPage: true })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
      const flags = [...errors, ...(overflow ? ['horizontal overflow'] : [])]
      report(!flags.length, `${where} /review of a saved game loads clean`, flags.join('; '))

      if (v.profile.zenMode) {
        // zen mode hides the cards, so their legend goes too
        report(!(await page.isVisible('.labels-legend')), `${where} zen mode hides the legend with the cards`)
      } else {
        const shown = await shownCounts(page)
        const want = [lichessCounts(saved, true), lichessCounts(saved, false)]
        report(JSON.stringify(shown) === JSON.stringify(want), `${where} cards show Lichess's counts, not the old ones`,
          `shown ${JSON.stringify(shown)}, Lichess ${JSON.stringify(want)}, old labels for him ${JSON.stringify(oldMine)}`)
        const legend = (await page.textContent('.labels-legend')) ?? ''
        report(/follow Lichess's rules/.test(legend) && /5 or more percentage points/.test(legend) &&
          /quicker than Lichess/.test(legend) && !/—/.test(legend),
          `${where} legend explains Lichess's rules and the quicker engine`)
        // the move list marks every move Lichess called a blunder with "??"
        const marked = await page.$$eval('.movelist .mv.q-blunder', (els) => els.length)
        const lichessBlunders = want[0][0] + want[1][0]
        report(marked === lichessBlunders, `${where} the move list marks exactly Lichess's blunders`,
          `${marked} marked, Lichess ${lichessBlunders}`)
        await page.locator('.labels-legend').scrollIntoViewIfNeeded()
        await page.screenshot({ path: `${out}/${sizeName}-${v.name}-legend.png` })
      }

      // The Rating page reads the same saved games (through gameStore, which now relabels them).
      errors.length = 0
      await page.goto(`${base}#/rating`)
      await page.waitForTimeout(1500)
      report(!errors.length, `${where} /rating with the saved games loads clean`, errors.join('; '))

      // The game without an analysis: the real browser engine, once, at desktop size in the default look.
      if (sizeName === 'desktop' && v.name === 'ocean') {
        errors.length = 0
        await page.goto(`${base}#/review/${games[1].id}`)
        await page.getByRole('button', { name: /Analyse this game/ }).click()
        const started = Date.now()
        await page.waitForSelector('.accuracy-card', { timeout: 240000 })
        const seconds = ((Date.now() - started) / 1000).toFixed(1)
        await page.waitForTimeout(800)
        await page.screenshot({ path: `${out}/desktop-browser-engine.png`, fullPage: true })
        const shown = await shownCounts(page)
        const want = [lichessCounts(fresh, false), lichessCounts(fresh, true)]
        report(!errors.length && shown.length === 2 && shown.every((s) => s.length === 3 && s.every((n) => n >= 0)),
          `browser engine analysed a ${fresh.moves.split(' ').length}-half-move game in ${seconds} s and the page stayed clean`,
          `${errors.join('; ')}${errors.length ? '; ' : ''}browser [blunders, mistakes, inaccuracies] ${JSON.stringify(shown)}, Lichess ${JSON.stringify(want)}`)
      }
      await ctx.close()
    }
  }
} finally {
  await browser.close()
}
console.log(problems ? `\n${problems} problem(s)` : '\nReview loaded clean everywhere')
process.exitCode = problems ? 1 : 0
