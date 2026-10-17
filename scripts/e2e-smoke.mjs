// Visit every page at desktop + phone size (+ zen mode + Ember theme) and report console/page errors and sideways
// scrolling, twice: with the Safety-check trainer locked (39 counted games) and open (40).
//   node scripts/e2e-smoke.mjs [outDir]      (dev server or `npm run preview` must be running; APP_URL overrides)
// Lichess is never asked: its game export, the daily job's status.json and the rating page's user API are served by
// Playwright (page.route) from made-up games and the rating fixture, so the run is the same offline.
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const base = process.env.APP_URL || 'http://localhost:5199/'
// screenshots go outside the repo unless a folder is given, so they are never committed by accident
const out = process.argv[2] || join(tmpdir(), 'smoke-shots')
mkdirSync(out, { recursive: true })
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const executablePath = process.env.CHROMIUM || (existsSync(MAC_CHROME) ? MAC_CHROME : '/opt/pw-browsers/chromium')

const REVIEW_ID = 'smoke-game'
const ROUTES = ['/', '/play', '/openings', '/openings/london', '/openings/caro-kann', '/openings/slav', '/tactics', '/puzzles', '/rating', `/review/${REVIEW_ID}`, '/safety', '/settings']
const SIZES = { desktop: { width: 1360, height: 860 }, phone: { width: 390, height: 844 } }
const STATES = { locked: 39, unlocked: 40 }

/** A short game of the app's own, so /review has something to show (names with spaces are never Lichess usernames). */
const REVIEW_GAME = {
  id: REVIEW_ID,
  date: '2026-10-16T12:00:00.000Z',
  source: 'app',
  pgn: '[White "abustrup"]\n[Black "Chess Coach bot"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6',
  white: 'abustrup',
  black: 'Chess Coach bot',
  userSide: 'white',
  result: '*',
}

/** Lichess NDJSON with `n` games the study counts (rated 10+0, standard). */
function exportOf(n) {
  const lines = []
  for (let i = 0; i < n; i++) {
    const me = { user: { name: 'abustrup', id: 'abustrup' }, rating: 1100 }
    const opp = { user: { name: `Opponent ${i + 1}`, id: `opponent ${i + 1}` }, rating: 1100 }
    lines.push(
      JSON.stringify({
        id: `smoke${String(i).padStart(3, '0')}`,
        rated: true,
        variant: 'standard',
        speed: 'rapid',
        perf: 'rapid',
        createdAt: 1792130000000 + i * 3_600_000,
        status: 'resign',
        players: i % 2 ? { white: opp, black: me } : { white: me, black: opp },
        moves: 'e4 e5 Nf3 Nc6',
        clock: { initial: 600, increment: 0, totalTime: 600 },
      }),
    )
  }
  return lines.join('\n') + '\n'
}
const USER_FIXTURE = new URL('../src/features/rating/fixtures/lichess-user-2026-10-16.json', import.meta.url)
const userAnswer = existsSync(USER_FIXTURE) ? readFileSync(USER_FIXTURE, 'utf8') : null

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] })
let problems = 0

for (const [stateName, games] of Object.entries(STATES)) {
  for (const [sizeName, viewport] of Object.entries(SIZES)) {
    for (const variant of ['normal', 'zen-ember']) {
      const ctx = await browser.newContext({ viewport })
      await ctx.addInitScript(
        ({ zen, game }) => {
          if (zen && !localStorage.getItem('cc.profile'))
            localStorage.setItem('cc.profile', JSON.stringify({ zenMode: true, appTheme: 'ember', boardTheme: 'walnut' }))
          if (!localStorage.getItem('cc.games')) localStorage.setItem('cc.games', JSON.stringify([game]))
        },
        { zen: variant === 'zen-ember', game: REVIEW_GAME },
      )
      const page = await ctx.newPage()
      const errors = []
      const cardRequests = []
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
      page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()))
      page.on('request', (r) => r.url().includes('/data/safety/cards.json') && cardRequests.push(r.url()))
      await page.route('**/lichess.org/api/games/user/**', (r) =>
        r.fulfill({ status: 200, contentType: 'application/x-ndjson', headers: { 'access-control-allow-origin': '*' }, body: exportOf(games) }),
      )
      if (userAnswer) {
        await page.route('**/lichess.org/api/user/**', (r) =>
          r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: userAnswer }),
        )
      }
      await page.route('**/data/study/status.json', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ asOf: new Date(Date.now() - 3_600_000).toISOString(), eligibleGames: games, unlockAfterGame: 40, U: 40 }),
        }),
      )
      for (const route of ROUTES) {
        errors.length = 0
        await page.goto(base + '#' + route)
        await page.waitForTimeout(1800)
        const file = `${out}/${stateName}-${sizeName}-${variant}-${route.replace(/\W+/g, '_') || 'home'}.png`
        await page.screenshot({ path: file })
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
        // the phone menu is fixed to the screen, so it never makes the page scroll: check its links separately
        const navCut = await page.evaluate(() =>
          [...document.querySelectorAll('.topnav .nav-link')].some((a) => {
            const r = a.getBoundingClientRect()
            return r.width > 0 && (r.left < -1 || r.right > window.innerWidth + 1)
          }),
        )
        const nav = await page.locator('.topnav .nav-link').allInnerTexts()
        const hasSafety = nav.some((t) => t.trim() === 'Safety')
        const flags = [
          ...errors,
          ...(overflow ? ['horizontal overflow'] : []),
          ...(navCut ? ['a menu link is cut off'] : []),
          ...(variant === 'normal' && hasSafety !== (stateName === 'unlocked') ? [`Safety in the menu: ${hasSafety}`] : []),
        ]
        if (route === '/safety') {
          const text = await page.locator('main').innerText()
          if (stateName === 'locked' && !text.includes(`Opens after your 40th rated 10+0 game on Lichess (you have ${games})`))
            flags.push('locked text missing')
          if (stateName === 'unlocked' && !(await page.locator('.safety-board').count())) flags.push('trainer board missing')
        }
        if (flags.length) problems += flags.length
        console.log(`${flags.length ? 'FAIL' : 'ok  '} ${stateName}/${sizeName}/${variant} ${route}${flags.length ? '\n      ' + flags.join('\n      ') : ''}`)
      }
      if (stateName === 'locked' && cardRequests.length) {
        problems++
        console.log(`FAIL locked/${sizeName}/${variant}: the locked app asked for cards.json`)
      }
      await ctx.close()
    }
  }
}
await browser.close()
console.log(problems ? `\n${problems} problem(s)` : '\nall pages loaded clean')
process.exit(problems ? 1 : 0)
