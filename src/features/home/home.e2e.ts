// Browser check of Home in its study version (build plan H1 and H2), in Chrome through Playwright:
//   npx tsx src/features/home/home.e2e.ts [outDir]
// APP_URL (default http://localhost:5199/) must serve the app; CHROMIUM overrides the browser path.
// Lichess's game export, status.json, verdict.json and the Safety-check card file are answered by the test
// (page.route), so the study count can be set to any number without touching real Lichess; no real names are used.
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type BrowserContext, type Page } from 'playwright-core'
import { LOCKED_CLOCK, LOCKED_SITUATIONS, captureLocked, lockedSeed } from './fixtures/locked-capture'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.APP_URL || 'http://localhost:5199/'
// screenshots go outside the repo unless a folder is given, so they are never committed by accident
const OUT = process.argv[2] || join(tmpdir(), 'home-shots')
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const CHROME = process.env.CHROMIUM || (existsSync(MAC_CHROME) ? MAC_CHROME : '/opt/pw-browsers/chromium')
mkdirSync(OUT, { recursive: true })

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

/** n games that the study counts, as Lichess's export sends them (one JSON object per line). */
function exportOf(n: number): string {
  const start = Date.parse('2026-10-16T08:00:00Z')
  return Array.from({ length: n }, (_, i) =>
    JSON.stringify({
      id: `study${String(i).padStart(3, '0')}`,
      rated: true,
      variant: 'standard',
      speed: 'rapid',
      perf: 'rapid',
      createdAt: start + i * 3_600_000,
      status: 'resign',
      players: { white: { user: { name: 'abustrup', id: 'abustrup' }, rating: 1500 }, black: { user: { name: 'Opponent', id: 'opponent' }, rating: 1500 } },
      moves: 'e4 e5 Nf3 Nc6',
      clock: { initial: 600, increment: 0, totalTime: 600 },
    }),
  ).join('\n')
}

/** Today, rated, 10+0, as the app saves a game it brought in from Lichess. */
function syncedGameToday() {
  return {
    id: 'syncedtoday1',
    date: new Date().toISOString(),
    source: 'lichess',
    pgn: '[Event "Rated Rapid game"]\n[White "abustrup"]\n[Black "Opponent"]\n[Result "1-0"]\n[Variant "Standard"]\n[TimeControl "600+0"]\n[WhiteRatingDiff "+6"]\n[BlackRatingDiff "-6"]\n\n1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0\n',
    white: 'abustrup',
    black: 'Opponent',
    whiteElo: 1500,
    blackElo: 1500,
    userSide: 'white',
    result: '1-0',
  }
}

/* The Safety-check card file for the open trainer: S1's 6 fixture positions, copied 5 times as different games. */
type RawCard = { id: string; kind: string; context: { gameId: string } & Record<string, unknown> } & Record<string, unknown>
const fixtureFile = JSON.parse(readFileSync(join(HERE, '../safety/fixtures/safety-cards.json'), 'utf8')) as { cards: RawCard[] } & Record<string, unknown>
const CARDS = Array.from({ length: 5 }, (_, copy) =>
  fixtureFile.cards.map((c) => {
    const game = `${c.context.gameId}${copy}`
    return { ...c, id: `${c.kind}:${game}:${c.id.split(':').pop()}`, context: { ...c.context, gameId: game } }
  }),
).flat()
const CARD_FILE = JSON.stringify({ ...fixtureFile, cards: CARDS })
/** A position he has seen once, due again on `due`. */
const reviewed = (due: string) => ({
  due, stability: 3, difficulty: 5, elapsed_days: 3, scheduled_days: 3, learning_steps: 0, reps: 1, lapses: 0, state: 2,
  last_review: '2026-10-16T08:00:00.000Z',
})
/** On the fixed clock (2026-10-20): 2 reviews due and the default 10 new a day make 12 positions. */
const TWELVE_DUE = {
  'cc.safety.state': { [CARDS[0].id]: reviewed('2026-10-19T08:00:00.000Z'), [CARDS[1].id]: reviewed('2026-10-20T06:00:00.000Z'),
    [CARDS[2].id]: reviewed('2026-10-27T08:00:00.000Z') },
}
/** No new positions a day and nothing due: today's queue is empty. */
const NOTHING_DUE = {
  'cc.safety.state': { [CARDS[2].id]: reviewed('2026-10-27T08:00:00.000Z') },
  'cc.safety.settings': { newPerDay: 0, maxReviews: 10, slowMs: 90_000 },
}

interface Setup {
  width: number
  games: number
  ember?: boolean
  zen?: boolean
  verdict?: string
  synced?: boolean
  /** a fixed clock (ISO) for the page; the H1 checks run on the real clock */
  clock?: string
  timezoneId?: string
  /** extra localStorage (key -> value), written before the app starts */
  seed?: Record<string, unknown>
  /** the card file answers after this long, or with this error status */
  cardsDelayMs?: number
  cardsStatus?: number
}

const browser = await chromium.launch({ executablePath: CHROME })
/** Problems only known at the end of a visit (see the verdict.json note in open). */
const lateFlags = new WeakMap<Page, () => string[]>()

interface Opened {
  ctx: BrowserContext
  page: Page
  errors: string[]
  verdictCalls: () => number
  /** requests for the Safety-check card file, and for the code that loads it */
  cardCalls: () => number
}

async function open(setup: Setup): Promise<Opened> {
  const ctx = await browser.newContext({ viewport: { width: setup.width, height: 900 }, acceptDownloads: true, timezoneId: setup.timezoneId })
  if (setup.clock) await ctx.clock.setFixedTime(new Date(setup.clock))
  let verdictCalls = 0
  let cardCalls = 0
  await ctx.route('https://lichess.org/**', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'content-type': 'application/x-ndjson' },
      body: exportOf(setup.games),
    }),
  )
  await ctx.route('**/data/study/status.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ asOf: '2026-10-20T05:20:00Z', eligibleGames: setup.games, unlockAfterGame: 40, U: 40, phase: 'baseline' }),
    }),
  )
  await ctx.route('**/data/study/verdict.json', (route) => {
    verdictCalls++
    return setup.verdict
      ? route.fulfill({ status: 200, contentType: 'application/json', body: readFileSync(join(HERE, `fixtures/${setup.verdict}.json`), 'utf8') })
      : route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>not a verdict</title>' })
  })
  await ctx.route('**/data/safety/cards.json', async (route) => {
    if (setup.cardsDelayMs) await new Promise((done) => setTimeout(done, setup.cardsDelayMs))
    return setup.cardsStatus
      ? route.fulfill({ status: setup.cardsStatus, contentType: 'text/plain', body: 'not here' })
      : route.fulfill({ status: 200, contentType: 'application/json', body: CARD_FILE })
  })
  const profile = { ...(setup.zen ? { zenMode: true } : {}), ...(setup.ember ? { appTheme: 'ember' } : {}) }
  const games = setup.synced ? [syncedGameToday()] : []
  const seed: Record<string, unknown> = { 'cc.profile': profile, 'cc.games': games, ...setup.seed }
  await ctx.addInitScript((entries) => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, JSON.stringify(value))
  }, seed)
  const page = await ctx.newPage()
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))
  // React's StrictMode (development only) runs a newly mounted component's effects twice, so when the count is already
  // known as Home mounts, the first verdict.json request is cancelled by its cleanup and asked again at once. That
  // cancel is not an error; a verdict request that never finishes is.
  let verdictCancelled = 0
  let verdictFinished = 0
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText ?? ''
    if (why === 'net::ERR_ABORTED' && r.url().endsWith('/data/study/verdict.json')) verdictCancelled++
    else errors.push(`requestfailed: ${r.url()} ${why}`)
  })
  page.on('requestfinished', (r) => {
    if (r.url().endsWith('/data/study/verdict.json')) verdictFinished++
  })
  lateFlags.set(page, () => (verdictCancelled > 0 && verdictFinished === 0 ? ['verdict.json was cancelled and never asked again'] : []))
  page.on('request', (r) => {
    // the file itself, and the code that loads it (src/... on the dev server, assets/cards-<hash>.js when built)
    if (/\/data\/safety\/cards\.json|\/features\/safety\/cards\.ts|\/assets\/cards-[\w-]+\.js/.test(r.url())) cardCalls++
  })
  await page.goto(`${BASE}#/`)
  await page.waitForSelector('.study-card, .home-continue')
  await page.waitForTimeout(1200)
  return { ctx, page, errors, verdictCalls: () => verdictCalls, cardCalls: () => cardCalls }
}

async function clean(page: Page, errors: string[]): Promise<string[]> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  return [...errors, ...(lateFlags.get(page)?.() ?? []), ...(overflow ? ['horizontal overflow'] : [])]
}

const planTitles = (page: Page) => page.$$eval('.plan-card', (els) => els.map((e) => e.querySelector('h3')?.textContent ?? ''))
const RATE = /per 100|blunders? per|\d+(\.\d+)? ?%/i

/* 1. Locked, 12 games: the plan, the card, both themes, phone and desktop */
for (const width of [390, 1360]) {
  for (const ember of [false, true]) {
    const name = `${width}-${ember ? 'ember' : 'ocean'}-12`
    const { ctx, page, errors, verdictCalls, cardCalls } = await open({ width, games: 12, ember })
    await page.waitForFunction(() => document.querySelector('.study-number')?.textContent === '12', null, { timeout: 8000 }).catch(() => {})
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
    const cards = await planTitles(page)
    check(`${name}: plan is [puzzles, lichess 10+0]`, cards.length === 2 && /^Solve 5 easy puzzles/.test(cards[0]) &&
      cards[1] === 'Play a rated 10+0 game on Lichess', cards.join(' | '))
    const link = await page.$eval('a.plan-card[href^="https://lichess.org"]', (a) => ({
      href: a.getAttribute('href'),
      rel: a.getAttribute('rel'),
      target: a.getAttribute('target'),
    }))
    check(`${name}: external link has rel=noopener, new tab`, link.href === 'https://lichess.org/#pool/10+0' &&
      /\bnoopener\b/.test(link.rel ?? '') && link.target === '_blank', JSON.stringify(link))
    const card = await page.$eval('.study-card', (e) => (e as HTMLElement).innerText)
    check(`${name}: card shows the live count and phase`, card.includes('12') && card.includes('Before the trainer') &&
      card.includes('Counted from your Lichess games today'), card.replace(/\s+/g, ' ').slice(0, 160))
    check(`${name}: no blunder rate on the card`, !RATE.test(card))
    check(`${name}: verdict.json not asked before game 110`, verdictCalls() === 0)
    check(`${name}: locked, so the Safety-check positions are not downloaded`, cardCalls() === 0)
    const flags = await clean(page, errors)
    check(`${name}: clean (no errors, no sideways scroll)`, flags.length === 0, flags.join('; '))
    await ctx.close()
  }
}

/* 2. Zen: the card is hidden, the Continue button stays */
{
  const { ctx, page, errors } = await open({ width: 390, games: 12, zen: true })
  await page.screenshot({ path: `${OUT}/390-zen-12.png`, fullPage: true })
  const visible = await page.$eval('.study-card', (e) => (e as HTMLElement).offsetParent !== null)
  check('zen: study card hidden, page clean', !visible && (await clean(page, errors)).length === 0)
  await ctx.close()
}

// Zen at game 110: the card comes back for the backup ask, because it needs him
{
  const { ctx, page, errors } = await open({ width: 390, games: 110, zen: true })
  await page.waitForFunction(() => document.querySelector('.study-number')?.textContent === '110', null, { timeout: 8000 }).catch(() => {})
  await page.screenshot({ path: `${OUT}/390-zen-110.png`, fullPage: true })
  const visible = await page.$eval('.study-card', (e) => (e as HTMLElement).offsetParent !== null && (e as HTMLElement).innerText.includes('Download backup'))
  check('zen at 110: the backup ask shows, page clean', visible && (await clean(page, errors)).length === 0, errors.join('; '))
  await ctx.close()
}

/* 3. A synced rated 10+0 game today marks the Lichess step done */
{
  const { ctx, page, errors } = await open({ width: 390, games: 12, synced: true })
  const done = await page.$eval('a.plan-card[href^="https://lichess.org"]', (a) => a.classList.contains('is-done') && a.textContent?.includes('Done today'))
  check('synced rated 600+0 game today: Lichess step done', done === true)
  check('synced game: page clean', (await clean(page, errors)).length === 0)
  await ctx.close()
}

/* 4. Game 110 without a verdict file yet: backup ask, download works and is remembered */
{
  const { ctx, page, errors, verdictCalls } = await open({ width: 390, games: 110 })
  await page.waitForFunction(() => document.querySelector('.study-number')?.textContent === '110', null, { timeout: 8000 }).catch(() => {})
  await page.screenshot({ path: `${OUT}/390-ocean-110.png`, fullPage: true })
  let card = await page.$eval('.study-card', (e) => (e as HTMLElement).innerText)
  check('110: asks for the backup', card.includes('You reached game 110') && card.includes('send the file to Claude'))
  check('110: no blunder rate without verdict.json', !RATE.test(card) && card.includes('first check is worked out in the next daily run'))
  check('110: verdict.json asked once it can exist', verdictCalls() >= 1)
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('.study-backup .btn')])
  const file = await download.path()
  const backup = JSON.parse(readFileSync(file!, 'utf8')) as { app: string; data: Record<string, unknown> }
  check('110: the backup file downloads with the study keys in it', backup.app === 'chess-coach' && 'cc.study.backups' in backup.data &&
    'cc.study.gate' in backup.data, download.suggestedFilename())
  card = await page.$eval('.study-card', (e) => (e as HTMLElement).innerText)
  check('110: the card remembers the download', card.includes('Backup for game 110 downloaded today'))
  check('110: page clean', (await clean(page, errors)).length === 0, errors.join('; '))
  await ctx.close()
}

/* 5. Game 160: a new backup ask; a decided verdict shows its line and numbers */
{
  const { ctx, page, errors } = await open({ width: 390, games: 161, verdict: 'verdict-cannot-tell-160', ember: true })
  await page.waitForSelector('.study-verdict', { timeout: 8000 }).catch(() => {})
  await page.screenshot({ path: `${OUT}/390-ember-161-verdict.png`, fullPage: true })
  const card = await page.$eval('.study-card', (e) => (e as HTMLElement).innerText)
  check('161 with verdict.json: verdict line and numbers', card.includes('Verdict after game 160: Cannot tell') && /per 100 of your moves/.test(card))
  check('161: asks for the backup for game 160', card.includes('You reached game 160'))
  check('161: page clean', (await clean(page, errors)).length === 0, errors.join('; '))
  await ctx.close()
}
{
  const { ctx, page, errors } = await open({ width: 1360, games: 115, verdict: 'verdict-worked-110' })
  await page.waitForSelector('.study-verdict', { timeout: 8000 }).catch(() => {})
  await page.screenshot({ path: `${OUT}/1360-ocean-115-verdict.png`, fullPage: true })
  const card = await page.$eval('.study-card', (e) => (e as HTMLElement).innerText)
  check('115 with a decided first check: verdict shown, no next milestone', card.includes('Verdict after game 110: Worked') &&
    !card.includes('Next:') && card.includes('Decided after game 110'))
  check('115: page clean', (await clean(page, errors)).length === 0, errors.join('; '))
  await ctx.close()
}

/* 6. H2, locked: the page parts are exactly as H1 drew them (snapshot taken from H1's code before H2) */
{
  const snapshot = JSON.parse(readFileSync(join(HERE, 'fixtures/locked-home.e2e-snapshot.json'), 'utf8')) as {
    situations: Record<string, Record<string, string>>
  }
  for (const [name, situation] of Object.entries(LOCKED_SITUATIONS)) {
    const { ctx, page, errors, cardCalls } = await open({
      width: 390,
      games: situation.games,
      clock: LOCKED_CLOCK,
      timezoneId: 'Europe/Copenhagen',
      seed: lockedSeed(situation),
    })
    await page.waitForFunction((n) => document.querySelector('.study-number')?.textContent === String(n), situation.games, { timeout: 10_000 })
    await page.waitForTimeout(800)
    const parts = await captureLocked(page)
    const expected = snapshot.situations[name] ?? {}
    const differ = Object.keys(expected).filter((part) => parts[part] !== expected[part])
    check(`locked snapshot (${name}): identical to H1`, Object.keys(expected).length === 7 && differ.length === 0, differ.join(', '))
    check(`locked snapshot (${name}): no Safety-check positions downloaded, page clean`, cardCalls() === 0 &&
      (await clean(page, errors)).length === 0, errors.join('; '))
    await ctx.close()
  }
}

/* 7. H2, unlocked: [safety "12 positions", puzzles, lichess], Continue to /safety, phone and desktop, both themes */
for (const width of [390, 1360]) {
  for (const ember of [false, true]) {
    const name = `${width}-${ember ? 'ember' : 'ocean'}-45-unlocked`
    const { ctx, page, errors, cardCalls } = await open({ width, games: 45, ember, clock: LOCKED_CLOCK, seed: TWELVE_DUE })
    await page.waitForFunction(() => document.querySelectorAll('.plan-card').length === 3 &&
      /positions?$/.test(document.querySelector('.plan-card h3')?.textContent ?? ''), null, { timeout: 10_000 }).catch(() => {})
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
    const titles = await planTitles(page)
    check(`${name}: plan is [safety "12 positions", puzzles, lichess]`, titles.length === 3 && titles[0] === 'Safety check: 12 positions' &&
      /^Solve 5 easy puzzles/.test(titles[1]) && titles[2] === 'Play a rated 10+0 game on Lichess', titles.join(' | '))
    const safetyHref = await page.$eval('.plan-card', (a) => a.getAttribute('href'))
    check(`${name}: the safety step opens the trainer in the app`, safetyHref === '#/safety', String(safetyHref))
    const cont = await page.$eval('.home-continue', (e) => ({
      title: e.querySelector('h2')?.textContent,
      href: e.querySelector('a')?.getAttribute('href'),
    }))
    check(`${name}: Continue points to /safety`, cont.title === '12 positions are waiting' && cont.href === '#/safety', JSON.stringify(cont))
    check(`${name}: the card file was asked for once the gate opened`, cardCalls() >= 1)
    const flags = await clean(page, errors)
    check(`${name}: clean (no errors, no sideways scroll)`, flags.length === 0, flags.join('; '))
    await ctx.close()
  }
}

/* 8. H2: Home and the trainer agree on today's number; after answers in the trainer, Home counts on */
{
  const { ctx, page, errors } = await open({ width: 390, games: 45, clock: LOCKED_CLOCK, seed: TWELVE_DUE })
  await page.waitForFunction(() => document.querySelector('.plan-card h3')?.textContent === 'Safety check: 12 positions', null, { timeout: 10_000 }).catch(() => {})
  await page.click('.home-continue a')
  await page.waitForFunction(() => location.hash === '#/safety' && !!document.querySelector('.safety-today'), null, { timeout: 15_000 }).catch(() => {})
  const today = await page.$eval('.safety-today', (e) => (e as HTMLElement).innerText).catch(() => 'missing')
  check('the trainer shows the same 12 (0 of 12 done)', /0 of 12 done/.test(today), today.replace(/\s+/g, ' ').slice(0, 80))
  // the trainer saved its day; mark 3 answered (1 miss, which comes back once) as the trainer's markAnswered does
  await page.evaluate(() => {
    const day = JSON.parse(localStorage.getItem('cc.safety.day') ?? 'null') as { ids: string[]; done: string[]; repeats: string[] }
    day.done = day.ids.slice(0, 3)
    day.repeats = [day.ids[1]]
    localStorage.setItem('cc.safety.day', JSON.stringify(day))
  })
  await page.goto(`${BASE}#/`)
  await page.waitForFunction(() => document.querySelector('.plan-card h3')?.textContent === 'Safety check: 10 positions', null, { timeout: 10_000 }).catch(() => {})
  const step = await page.$eval('.plan-card', (e) => (e as HTMLElement).innerText)
  check('back on Home after 3 answers (1 miss): 10 positions, 3 of 13 done', step.includes('Safety check: 10 positions') && step.includes('3 of 13 done today'),
    step.replace(/\s+/g, ' '))
  const cont = await page.$eval('.home-continue', (e) => (e as HTMLElement).innerText)
  check('Continue says how many are left', cont.includes('10 positions are waiting') && cont.includes('3 done today, 10 to go'), cont.replace(/\s+/g, ' '))
  await page.screenshot({ path: `${OUT}/390-ocean-45-after-three.png`, fullPage: true })
  check('trainer and back: clean', (await clean(page, errors)).length === 0, errors.join('; '))
  await ctx.close()
}

/* 9. H2: empty queue, the safety step is done and Continue goes back to the old rule; zen points to the trainer */
{
  const { ctx, page, errors } = await open({ width: 390, games: 45, clock: LOCKED_CLOCK, seed: NOTHING_DUE })
  await page.waitForFunction(() => /nothing due today$/.test(document.querySelector('.plan-card h3')?.textContent ?? ''), null, { timeout: 10_000 }).catch(() => {})
  await page.screenshot({ path: `${OUT}/390-ocean-45-empty.png`, fullPage: true })
  const step = await page.$eval('.plan-card', (a) => ({ done: a.classList.contains('is-done'), text: (a as HTMLElement).innerText }))
  check('empty queue: safety step first and done', step.done && step.text.includes('Done today') && step.text.includes('Safety check: nothing due today'),
    step.text.replace(/\s+/g, ' '))
  const cont = await page.$eval('.home-continue', (e) => ({ href: e.querySelector('a')?.getAttribute('href'), text: (e as HTMLElement).innerText }))
  check('empty queue: Continue goes to the puzzle step, the next in the plan', /^#\/puzzles\?theme=/.test(cont.href ?? '') &&
    cont.text.includes("Next in today's plan."), JSON.stringify(cont))
  check('empty queue: clean', (await clean(page, errors)).length === 0, errors.join('; '))
  await ctx.close()
}
{
  const { ctx, page, errors } = await open({ width: 390, games: 45, zen: true, clock: LOCKED_CLOCK, seed: TWELVE_DUE })
  await page.waitForFunction(() => document.querySelector('.home-continue h2')?.textContent === '12 positions are waiting', null, { timeout: 10_000 }).catch(() => {})
  await page.screenshot({ path: `${OUT}/390-zen-45-unlocked.png`, fullPage: true })
  const button = await page.$eval('.home-continue a', (a) => ({ href: a.getAttribute('href'), visible: (a as HTMLElement).offsetParent !== null }))
  check('zen, unlocked: the one big button opens the trainer', button.href === '#/safety' && button.visible, JSON.stringify(button))
  check('zen, unlocked: clean', (await clean(page, errors)).length === 0, errors.join('; '))
  await ctx.close()
}

/* 10. H2: while the card file is on its way, the trainer still comes first; then the number arrives */
{
  const { ctx, page, errors } = await open({ width: 390, games: 45, clock: LOCKED_CLOCK, seed: TWELVE_DUE, cardsDelayMs: 4000 })
  await page.waitForFunction(() => document.querySelectorAll('.plan-card').length === 3, null, { timeout: 10_000 }).catch(() => {})
  await page.screenshot({ path: `${OUT}/390-ocean-45-counting.png`, fullPage: true })
  const step = await page.$eval('.plan-card', (e) => (e as HTMLElement).innerText)
  const cont = await page.$eval('.home-continue', (e) => ({ href: e.querySelector('a')?.getAttribute('href'), title: e.querySelector('h2')?.textContent }))
  check('counting: the safety step is first, without a number yet', step.includes('Safety check') && step.includes("Counting today's positions") &&
    !/\d+ positions?/.test(step), step.replace(/\s+/g, ' '))
  check('counting: Continue already points to the trainer', cont.href === '#/safety' && cont.title === 'Your Safety check', JSON.stringify(cont))
  await page.waitForFunction(() => document.querySelector('.plan-card h3')?.textContent === 'Safety check: 12 positions', null, { timeout: 10_000 }).catch(() => {})
  const after = await page.$eval('.home-continue h2', (e) => e.textContent)
  check('counting: then 12 positions arrive', after === '12 positions are waiting', String(after))
  check('counting: clean', (await clean(page, errors)).length === 0, errors.join('; '))
  await ctx.close()
}

/* 11. H2: the card file fails to load; Home still offers the trainer, which shows the error and a retry */
{
  const { ctx, page, errors } = await open({ width: 390, games: 45, clock: LOCKED_CLOCK, seed: TWELVE_DUE, cardsStatus: 404 })
  await page.waitForFunction(() => /could not be counted/.test(document.querySelector('.plan-card')?.textContent ?? ''), null, { timeout: 10_000 }).catch(() => {})
  await page.screenshot({ path: `${OUT}/390-ocean-45-failed.png`, fullPage: true })
  const step = await page.$eval('.plan-card', (a) => ({ href: a.getAttribute('href'), done: a.classList.contains('is-done'), text: (a as HTMLElement).innerText }))
  check('file failed: safety step first, not done, says so, opens the trainer', step.href === '#/safety' && !step.done &&
    step.text.includes("Today's positions could not be counted here"), step.text.replace(/\s+/g, ' '))
  const cont = await page.$eval('.home-continue a', (a) => a.getAttribute('href'))
  check('file failed: Continue opens the trainer (it shows the error and a retry)', cont === '#/safety', String(cont))
  // the browser reports the missing file itself; nothing else may go wrong
  const flags = (await clean(page, errors)).filter((e) => !/status of 404/.test(e))
  check('file failed: no other errors, no sideways scroll', flags.length === 0, flags.join('; '))
  await ctx.close()
}

await browser.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nhome.e2e: all good')
process.exit(failures ? 1 : 0)
