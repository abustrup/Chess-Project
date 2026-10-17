// Browser check of the rating page (R2), in Chrome through Playwright:
//   npx tsx src/features/rating/rating.e2e.ts [outDir]
// APP_URL (default http://localhost:5199/) must serve the app; CHROMIUM overrides the browser path.
// Lichess is mocked with the 2026-10-16 answer, except in the live check: with LIVE=1 the page asks lichess.org for
// real (one request), which is how the published site is tested for CORS (the browser blocks the answer otherwise).
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type BrowserContext, type Page } from 'playwright-core'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.APP_URL || 'http://localhost:5199/'
const OUT = process.argv[2] || 'rating-shots'
const CHROME = process.env.CHROMIUM || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const USER_API = 'https://lichess.org/api/user/abustrup'
mkdirSync(OUT, { recursive: true })

const user = JSON.parse(readFileSync(join(HERE, 'fixtures/lichess-user-2026-10-16.json'), 'utf8'))
const blitzGames = JSON.parse(readFileSync(join(HERE, 'fixtures/blitz-games-2026-10-16.json'), 'utf8')).games as {
  date: string
  side: 'white' | 'black'
  tc: string
  before: number
  diff: number
  opponentBefore: number
  result: 'win' | 'loss' | 'draw'
}[]

/** His 31 blitz games as the app saves imported Lichess games (numbers from the fixture, no real names or ids). */
const savedGames = blitzGames.map((g, i) => {
  // the opponent's name has a space, so it can never be a real Lichess username
  const white = g.side === 'white' ? 'abustrup' : 'Other player'
  const black = g.side === 'white' ? 'Other player' : 'abustrup'
  const result = g.result === 'draw' ? '1/2-1/2' : (g.result === 'win') === (g.side === 'white') ? '1-0' : '0-1'
  const diffTag = `${g.side === 'white' ? 'White' : 'Black'}RatingDiff`
  return {
    id: `fixture${String(i).padStart(2, '0')}`,
    date: g.date,
    source: 'lichess',
    pgn: `[Event "rated blitz game"]\n[White "${white}"]\n[Black "${black}"]\n[Result "${result}"]\n[TimeControl "${g.tc}"]\n[${diffTag} "${g.diff > 0 ? '+' : ''}${g.diff}"]\n\n1. e4 e5 ${result}\n`,
    white,
    black,
    whiteElo: g.side === 'white' ? g.before : g.opponentBefore,
    blackElo: g.side === 'white' ? g.opponentBefore : g.before,
    userSide: g.side,
    result,
  }
})

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

const browser = await chromium.launch({ executablePath: CHROME })

/** A fresh browser profile with his username saved (and his games, unless `games` is false). */
async function newContext(width: number, opts: { games?: boolean; zen?: boolean; ember?: boolean } = {}): Promise<BrowserContext> {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } })
  const profile = { lichessUsername: 'abustrup', ...(opts.zen ? { zenMode: true } : {}), ...(opts.ember ? { appTheme: 'ember' } : {}) }
  const games = opts.games === false ? [] : savedGames
  await ctx.addInitScript(
    ([p, g]) => {
      if (sessionStorage.getItem('seeded')) return // keep what the page saved across reloads
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem('cc.profile', JSON.stringify(p))
      localStorage.setItem('cc.games', JSON.stringify(g))
    },
    [profile, games] as const,
  )
  return ctx
}

/** Answers Lichess from the fixture (with optional changes) and counts the user-API requests. */
async function mockLichess(ctx: BrowserContext, blitz: Record<string, unknown> = {}): Promise<{ calls: number; mode: 'ok' | 'fail' }> {
  const state = { calls: 0, mode: 'ok' as 'ok' | 'fail' }
  await ctx.route('https://lichess.org/**', async (route) => {
    const url = route.request().url()
    if (url.startsWith(USER_API)) {
      state.calls++
      if (state.mode === 'fail') return route.abort('internetdisconnected')
      const body = { ...user, perfs: { ...user.perfs, blitz: { ...user.perfs.blitz, ...blitz } } }
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) })
    }
    // anything else on Lichess (another feature's game count, for example): an empty, harmless answer
    return route.fulfill({ status: 200, contentType: 'application/x-ndjson', headers: { 'access-control-allow-origin': '*' }, body: '' })
  })
  return state
}

function watch(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
  return errors
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)

if (process.env.LIVE === '1') {
  // ---- live: the page itself asks lichess.org for the user API (CORS), unmocked. Other Lichess requests (the study
  // gate's game count) get an empty answer: they are not what this checks, one real request is enough, and Lichess
  // answers the game export with 404 for a headless browser (seen 2026-10-16), which would fail the "no errors" check.
  const ctx = await newContext(1280, { games: false })
  await ctx.route('https://lichess.org/**', (route) =>
    route.request().url().startsWith(USER_API)
      ? route.continue()
      : route.fulfill({ status: 200, contentType: 'application/x-ndjson', headers: { 'access-control-allow-origin': '*' }, body: '' }),
  )
  const page = await ctx.newPage()
  const errors = watch(page)
  const answer = page.waitForResponse((r) => r.url().startsWith(USER_API), { timeout: 20_000 })
  await page.goto(BASE + '#/rating')
  const res = await answer
  const headers = await res.allHeaders()
  await page.waitForSelector('[data-testid="rating-blitz"]', { timeout: 15_000 })
  const blitz = await page.textContent('[data-testid="rating-blitz"]')
  check('live: lichess.org answered the page', res.status() === 200, `HTTP ${res.status()}, access-control-allow-origin: ${headers['access-control-allow-origin']}`)
  check('live: the browser let the page read it (CORS) and it shows a blitz rating', /^\d{3,4}\??$/.test(blitz ?? ''), `blitz ${blitz} on ${BASE}`)
  check('live: no errors', errors.length === 0, errors.join(' | '))
  await page.screenshot({ path: join(OUT, 'live-rating.png'), fullPage: true })
  await browser.close()
  process.exit(failures ? 1 : 0)
}

// ---- 1. the mocked 2026-10-16 answer, desktop and phone
for (const [label, width] of [['desktop', 1360], ['phone', 390]] as const) {
  const ctx = await newContext(width)
  await mockLichess(ctx)
  const page = await ctx.newPage()
  const errors = watch(page)
  await page.goto(BASE + '#/rating')
  await page.waitForSelector('[data-testid="rating-blitz"]')
  await page.waitForSelector('[data-testid="chesscom-blitz"]')
  const hero = (await page.textContent('.rt-hero')) ?? ''
  check(`${label}: blitz 1017`, (await page.textContent('[data-testid="rating-blitz"]')) === '1017')
  check(`${label}: range 889 to 1145, 31 games`, hero.includes("Lichess's range: 889 to 1145") && hero.includes('31 games'))
  check(`${label}: "No rapid rating yet"`, hero.includes('No rapid rating yet.'))
  const cc = (await page.textContent('[data-testid="chesscom-blitz"]')) ?? ''
  const m = /about (\d+) \(8 in 10 similar players: (\d+) to (\d+)\)/.exec(cc)
  check(`${label}: chess.com line centre 480-525, range inside 350-690`, !!m && +m[1] >= 480 && +m[1] <= 525 && +m[2] >= 350 && +m[3] <= 690, m ? m.slice(1).join(' / ') : cc)
  const history = (await page.textContent('#rt-history-title + .rt-history')) ?? ''
  check(`${label}: history line from 31 saved games plus now`, history.includes('each of the 31 rated blitz games') && (await page.locator('.rt-hist-dot').count()) === 30 && (await page.locator('.rt-hist-now').count()) === 1)
  check(`${label}: no old estimate on the page`, !/estimate|how I worked this out/i.test((await page.textContent('main, #root')) ?? ''))
  check(`${label}: no horizontal overflow`, !(await overflow(page)))
  check(`${label}: no errors`, errors.length === 0, errors.join(' | '))
  await page.screenshot({ path: join(OUT, `${label}-rating.png`), fullPage: true })
  await ctx.close()
}

// ---- 2. RD 120: "?" and no chess.com line
{
  const ctx = await newContext(1360, { games: false })
  await mockLichess(ctx, { rd: 120, prov: true })
  const page = await ctx.newPage()
  await page.goto(BASE + '#/rating')
  await page.waitForSelector('[data-testid="rating-blitz"]')
  const hero = (await page.textContent('.rt-hero')) ?? ''
  check('RD 120: shows 1017? and "provisional"', (await page.textContent('[data-testid="rating-blitz"]')) === '1017?' && hero.includes('provisional'))
  check('RD 120: no chess.com line', (await page.locator('[data-testid="chesscom-blitz"]').count()) === 0 && !hero.includes('chess.com blitz'))
  await page.screenshot({ path: join(OUT, 'rd120-rating.png'), fullPage: true })
  await ctx.close()
}

// ---- 3. offline: the saved answer with its date
{
  const ctx = await newContext(1360, { games: false })
  const lichess = await mockLichess(ctx)
  const page = await ctx.newPage()
  await page.goto(BASE + '#/rating')
  await page.waitForSelector('[data-testid="rating-blitz"]')
  await page.waitForTimeout(500)
  check('one visit sends one request (React runs effects twice in development)', lichess.calls === 1, `${lichess.calls} requests`)
  // pretend the saved answer is from the fixture's time, so the next visit asks Lichess again
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('cc.rating.lichessLive') ?? 'null')
    saved.fetchedAt = '2026-10-16T15:22:00.000Z'
    localStorage.setItem('cc.rating.lichessLive', JSON.stringify(saved))
  })
  lichess.mode = 'fail'
  await page.reload()
  await page.waitForSelector('.rt-status.callout')
  const status = (await page.textContent('.rt-status.callout')) ?? ''
  check('offline (Lichess unreachable): saved rating shown', (await page.textContent('[data-testid="rating-blitz"]')) === '1017')
  check('offline: says it could not reach Lichess and gives the date', status.includes('I could not reach Lichess.') && status.includes('as of 16 Oct 2026'), status.trim())
  await page.screenshot({ path: join(OUT, 'offline-rating.png'), fullPage: true })
  // and with the whole browser offline, pressing "Check again"
  await ctx.setOffline(true)
  await page.click('.rt-status.callout button')
  await page.waitForTimeout(800)
  check('browser offline + Check again: saved rating still shown', (await page.textContent('[data-testid="rating-blitz"]')) === '1017' && ((await page.textContent('.rt-status.callout')) ?? '').includes('as of 16 Oct 2026'))
  await ctx.setOffline(false)
  await ctx.close()
}

// ---- 4. Home's card
for (const [label, width] of [['desktop', 1360], ['phone', 390]] as const) {
  const ctx = await newContext(width, { games: false })
  await mockLichess(ctx)
  const page = await ctx.newPage()
  const errors = watch(page)
  await page.goto(BASE + '#/')
  await page.waitForSelector('[data-testid="home-rating"]')
  const card = (await page.locator('section:has(#rating-title)').textContent()) ?? ''
  check(`Home ${label}: live blitz 1017 with its range`, (await page.textContent('[data-testid="home-rating"]')) === '1017' && card.includes("Lichess's range: 889 to 1145") && card.includes('Blitz · 31 games'))
  check(`Home ${label}: no old estimate`, !/estimate|You said/i.test(card))
  check(`Home ${label}: no horizontal overflow`, !(await overflow(page)))
  check(`Home ${label}: no errors`, errors.length === 0, errors.join(' | '))
  await page.locator('section:has(#rating-title)').screenshot({ path: join(OUT, `${label}-home-card.png`) })
  await ctx.close()
}

// ---- 5. Settings: "Bot starting strength" still sets Play's default bot level
{
  const ctx = await newContext(1360, { games: false })
  await mockLichess(ctx)
  const page = await ctx.newPage()
  const errors = watch(page)
  await page.goto(BASE + '#/settings')
  const label = (await page.textContent('label[for="set-rating"]')) ?? ''
  check('Settings: field is labelled "Bot starting strength"', label === 'Bot starting strength', label)
  const picked: string[] = []
  for (const value of ['700', '1600']) {
    await page.goto(BASE + '#/settings')
    await page.fill('#set-rating', value)
    await page.locator('#set-rating').blur()
    await page.goto(BASE + '#/play')
    await page.waitForSelector('[aria-label="Opponent strength"] [aria-checked="true"]')
    picked.push(((await page.textContent('[aria-label="Opponent strength"] [aria-checked="true"]')) ?? '').trim())
  }
  check('Play: 700 picks Beginner, 1600 picks Strong', /^Beginner/.test(picked[0]) && /^Strong/.test(picked[1]), picked.map((p) => p.slice(0, 20)).join(' | '))
  check('Settings and Play: no errors', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ---- 6. no username yet, and zen mode
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  // mocked too: the study gate still counts the owner's games on Lichess, and the test must not depend on the network
  const lichess = await mockLichess(ctx)
  const page = await ctx.newPage()
  const errors = watch(page)
  await page.goto(BASE + '#/rating')
  await page.waitForSelector('.rt-hero')
  await page.waitForTimeout(500)
  check(
    'no username: asks for it, no user-API request',
    ((await page.textContent('.rt-hero')) ?? '').includes('Add your Lichess username') && lichess.calls === 0,
    `${lichess.calls} requests`,
  )
  check('no username: no errors, no overflow', errors.length === 0 && !(await overflow(page)), errors.join(' | '))
  await ctx.close()
  const zen = await newContext(390, { zen: true, ember: true })
  await mockLichess(zen)
  const zp = await zen.newPage()
  const zenErrors = watch(zp)
  await zp.goto(BASE + '#/rating')
  await zp.waitForSelector('[data-testid="rating-blitz"]')
  check('zen (Ember theme): the rating stays, the rest hides', (await zp.isVisible('.rt-hero')) && !(await zp.isVisible('#rt-history-title')))
  check('zen (Ember theme): no errors, no overflow', zenErrors.length === 0 && !(await overflow(zp)), zenErrors.join(' | '))
  await zp.screenshot({ path: join(OUT, 'phone-zen-ember-rating.png'), fullPage: true })
  await zen.close()
  const ember = await newContext(1360, { ember: true })
  await mockLichess(ember)
  const ep = await ember.newPage()
  const emberErrors = watch(ep)
  await ep.goto(BASE + '#/rating')
  await ep.waitForSelector('[data-testid="chesscom-blitz"]')
  check('Ember theme: page clean', emberErrors.length === 0 && !(await overflow(ep)), emberErrors.join(' | '))
  await ep.screenshot({ path: join(OUT, 'desktop-ember-rating.png'), fullPage: true })
  await ember.close()
}

await browser.close()
console.log(failures ? `\n${failures} check(s) FAILED` : '\nall browser checks passed')
process.exit(failures ? 1 : 0)
