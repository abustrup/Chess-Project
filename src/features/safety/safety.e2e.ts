// Browser test of the Safety-check trainer (build plan S1, trainer-spec C1-C3, C5-C8):
//   npx tsx src/features/safety/safety.e2e.ts <outDir>     (dev server or a preview must be running; APP_URL overrides)
// Lichess's game export and the daily job's status.json are served by Playwright (page.route), so no request leaves
// the machine: 39 counted games for the locked page, 40 for the open one. The open page gets a fixture of 6 real
// cards (fixtures/safety-cards.json, copied unchanged from public/data/safety/cards.json of 2026-10-16) and today's
// queue in a fixed order, so every step knows which position is on the board.
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Chess } from 'chess.js'
import { chromium, type Browser, type Page } from 'playwright-core'
import type { SafetyCard } from '../../types'

const base = process.env.APP_URL || 'http://localhost:5199/'
// screenshots go outside the repo unless a folder is given, so they are never committed by accident
const out = process.argv[2] || join(tmpdir(), 'safety-shots')
mkdirSync(out, { recursive: true })
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const executablePath = process.env.CHROMIUM || (existsSync(MAC_CHROME) ? MAC_CHROME : '/opt/pw-browsers/chromium')

const FIXTURE_TEXT = readFileSync(new URL('./fixtures/safety-cards.json', import.meta.url), 'utf8')
const fixture = JSON.parse(FIXTURE_TEXT) as { cards: SafetyCard[] }
const cardById = (id: string) => fixture.cards.find((c) => c.id === id)!
// own:u820NzSm:22 has an incomplete top list, so a move outside it goes to the browser engine (held and quiet cards
// list every legal move since 2026-10-17 and never need the engine)
const ORDER = ['own:XLCmExKA:38', 'quiet:FWvViwBk:15', 'held:uUCQ83zH:23', 'own:FWvViwBk:27', 'held:EMxzd6WS:12', 'own:u820NzSm:22']

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

/** Lichess NDJSON with `n` games that the study counts (rated 10+0, standard). Opponent names contain a space, so
 *  they can never be real Lichess usernames. */
function exportOf(n: number): string {
  const lines: string[] = []
  for (let i = 0; i < n; i++) {
    const me = { user: { name: 'abustrup', id: 'abustrup' }, rating: 1100 }
    const opp = { user: { name: `Opponent ${i + 1}`, id: `opponent ${i + 1}` }, rating: 1100 }
    lines.push(
      JSON.stringify({
        id: `e2e${String(i).padStart(5, '0')}`,
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

interface Opened {
  page: Page
  errors: string[]
  cardRequests: string[]
  close: () => Promise<void>
}

async function open(
  browser: Browser,
  opts: { games: number; width?: number; height?: number; profile?: Record<string, unknown>; seedDay?: boolean },
): Promise<Opened> {
  const ctx = await browser.newContext({ viewport: { width: opts.width ?? 1360, height: opts.height ?? 860 }, acceptDownloads: true })
  if (opts.profile) {
    await ctx.addInitScript((p) => {
      if (!localStorage.getItem('cc.profile')) localStorage.setItem('cc.profile', JSON.stringify(p))
    }, opts.profile)
  }
  if (opts.seedDay) {
    // today's queue in a fixed order (only once: a reload must find what the app saved). Written as text: tsx would
    // add a helper (__name) to a named arrow function here, which does not exist in the browser.
    await ctx.addInitScript(`(() => {
      if (localStorage.getItem('cc.safety.day')) return
      const d = new Date()
      const date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      const ids = ${JSON.stringify(ORDER)}
      localStorage.setItem('cc.safety.day', JSON.stringify({ date, ids, newIds: ids, done: [], repeats: [], repeatsDone: [], caps: [10, 10] }))
    })()`)
  }
  const page = await ctx.newPage()
  const errors: string[] = []
  const cardRequests: string[] = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
  page.on('request', (r) => r.url().includes('cards.json') && cardRequests.push(r.url()))
  await page.route('**/lichess.org/api/games/user/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/x-ndjson', headers: { 'access-control-allow-origin': '*' }, body: exportOf(opts.games) }),
  )
  await page.route('**/data/study/status.json', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ asOf: new Date(Date.now() - 3_600_000).toISOString(), eligibleGames: opts.games, unlockAfterGame: 40, U: 40 }),
    }),
  )
  await page.route('**/data/safety/cards.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: FIXTURE_TEXT }))
  return { page, errors, cardRequests, close: () => ctx.close() }
}

/* ---------------------------------------------------------------- page helpers */

const pieceOn = (page: Page, sq: string) =>
  page.evaluate((s) => document.querySelector(`#cc-board-square-${s} [data-piece]`)?.getAttribute('data-piece') ?? null, sq)
const highlighted = (page: Page, sq: string) =>
  page.evaluate((s) => getComputedStyle(document.querySelector(`#cc-board-square-${s} > div`)!).backgroundImage.includes('gradient'), sq)
const visible = (page: Page, selector: string) => page.locator(selector).first().isVisible()
const store = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key)
const lastLog = async (page: Page) => {
  const log = JSON.parse((await store(page, 'cc.safety.log')) ?? '[]') as Record<string, unknown>[]
  return log[log.length - 1] ?? {}
}

async function playMove(page: Page, uci: string) {
  await page.locator(`#cc-board-square-${uci.slice(0, 2)}`).click()
  await page.locator(`#cc-board-square-${uci.slice(2, 4)}`).click()
}
/** Waits until he may move, and for the board's 0.22 s piece animation to finish (a click mid-animation misses). */
async function waitForMoving(page: Page) {
  await page.locator('.safety-prompt h2', { hasText: /^(Your move|Try again)$/ }).waitFor({ timeout: 15_000 })
  await page.waitForTimeout(400)
}
async function writeAndConfirm(page: Page, line: string) {
  await page.locator('#safety-checked').fill(line)
  await page.locator('#safety-checked').press('Enter')
}
async function next(page: Page) {
  await page.getByRole('button', { name: /^(Next position|Finish)/ }).click()
}

/** A legal move for the trainee that is not among the stored top moves and not the game move. */
function outsideMove(card: SafetyCard): string {
  const g = new Chess(card.fenBefore)
  g.move({ from: card.lastMove.slice(0, 2), to: card.lastMove.slice(2, 4), promotion: card.lastMove[4] })
  const moves = g.moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ''))
  const quiet = moves.filter((u) => !card.top.some((t) => t.uci === u) && u !== card.human.uci)
  return quiet.find((u) => /^[a-h][27][a-h][36]$/.test(u)) ?? quiet[0]
}

function relLuminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => {
    const c = Number(v) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [x, y] = [relLuminance(a), relLuminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/* ---------------------------------------------------------------- the run */

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] })

// ---- 1. locked: 39 games
{
  const { page, errors, cardRequests, close } = await open(browser, { games: 39 })
  await page.goto(base + '#/safety')
  const text = page.getByTestId('safety-locked-text')
  await page.waitForFunction(() => document.querySelector('[data-testid="safety-locked-text"]')?.textContent?.includes('you have 39'), null, { timeout: 15_000 })
  check('locked: /#/safety says when it opens, with the count from the gate', (await text.textContent()) === 'Opens after your 40th rated 10+0 game on Lichess (you have 39)', (await text.textContent()) ?? '')
  const nav = await page.locator('.topnav .nav-link').allInnerTexts()
  check('locked: no Safety item in the menu', !nav.some((t) => /safety/i.test(t)), nav.join(', '))
  await page.screenshot({ path: `${out}/locked-desktop.png` })
  await page.goto(base + '#/')
  await page.waitForTimeout(3500) // past the 2.5 s background preload of other pages
  await page.goto(base + '#/play')
  await page.waitForTimeout(800)
  check('locked: no request for cards.json on any page', cardRequests.length === 0, cardRequests.join(' '))
  check('locked: no console or page errors', errors.length === 0, errors.join(' | '))
  await close()
}

// ---- 2. open: 40 games, the fixture, desktop
{
  const { page, errors, close } = await open(browser, { games: 40, seedDay: true })
  await page.goto(base + '#/safety')
  await page.locator('.safety-board').waitFor({ timeout: 15_000 })
  const nav = await page.locator('.topnav .nav-link').allInnerTexts()
  check('open: Safety is in the menu, right after Home', nav[0] === 'Home' && nav[1] === 'Safety', nav.join(', '))

  // card 1: own, Black, he was winning; the game move, then the line rules, then a retry
  const c1 = cardById(ORDER[0])
  const [lf, lt] = [c1.lastMove.slice(0, 2), c1.lastMove.slice(2, 4)]
  await page.locator('.safety-prompt h2', { hasText: 'His move is coming' }).waitFor({ timeout: 5_000 })
  const beforeFrom = await pieceOn(page, lf)
  await waitForMoving(page)
  const afterFrom = await pieceOn(page, lf)
  const afterTo = await pieceOn(page, lt)
  check('C1 the board first shows the position before his move', beforeFrom !== null && beforeFrom[0] === (c1.side === 'black' ? 'w' : 'b'), `${lf}: ${beforeFrom}`)
  check('C1 then his move is played', afterFrom === null && afterTo === beforeFrom, `${lf}: ${afterFrom}, ${lt}: ${afterTo}`)
  check('C1 both squares of his move are highlighted', (await highlighted(page, lf)) && (await highlighted(page, lt)))
  const a1 = await page.locator('#cc-board-square-a1').boundingBox()
  const h8 = await page.locator('#cc-board-square-h8').boundingBox()
  check('C1 the board is turned to his side (Black at the bottom)', !!a1 && !!h8 && a1.x > h8.x && a1.y < h8.y)
  check('the strip asks the two questions', (await page.locator('.safety-strip').innerText()).includes('What does his move threaten or allow?'))

  await playMove(page, c1.human.uci)
  await page.locator('#safety-checked').waitFor()
  await page.waitForTimeout(400)
  check('C2 after a move no verdict is shown', !(await visible(page, '.safety-verdict')))
  check('C2 the line box has focus', (await page.evaluate(() => document.activeElement?.id)) === 'safety-checked')
  check('the move stays on the board while he writes', (await pieceOn(page, c1.human.uci.slice(2, 4))) !== null)
  await page.locator('#safety-checked').press('Enter')
  check('C2 Enter with an empty box says "One word is enough"', await page.getByText('One word is enough.').isVisible())
  check('C2 ... and shows no verdict', !(await visible(page, '.safety-verdict')))
  await writeAndConfirm(page, 'x')
  check('a 1-character line is not enough either', !(await visible(page, '.safety-verdict')) && (await page.getByText('One word is enough.').isVisible()))
  await page.getByRole('button', { name: 'Change move' }).click()
  await waitForMoving(page)
  check('the move can be changed after writing: the piece is back', (await pieceOn(page, c1.human.uci.slice(0, 2))) !== null)
  await playMove(page, c1.human.uci)
  await page.locator('#safety-checked').waitFor()
  check('... and the written line is kept', (await page.locator('#safety-checked').inputValue()) === 'x')
  await writeAndConfirm(page, 'ok')
  await page.locator('.safety-verdict').waitFor({ timeout: 5_000 })
  check('C2 a 2-character line reveals the verdict', await visible(page, '.safety-verdict'))
  check('C3 the game move shows "That was the game move"', (await page.locator('.safety-verdict h2').innerText()) === 'That was the game move')
  check('C5 the verdict repeats his line word for word', (await page.locator('.safety-you-wrote').innerText()).includes('“ok”'))
  check('"You were winning" on a card where he was winning', await page.getByText('You were winning here:').isVisible())
  const facts = await page.locator('.safety-facts').innerText()
  // labels are upper-cased by CSS, and innerText follows the CSS
  check('the facts are shown', /what there was to see/i.test(facts) && facts.includes(`After ${c1.human.san},`), facts.replace(/\n/g, ' '))
  check('the game context is shown', (await page.locator('.safety-context').innerText()).startsWith('From your game on'))
  const allowed = c1.facts.find((f) => f.t === 'allowed') as { line: string[] }
  await page.waitForTimeout(2200)
  const replyTo = allowed.line[1].slice(2, 4)
  check('the refutation is played on the board', ((await pieceOn(page, replyTo)) ?? '')[0] === (c1.side === 'black' ? 'w' : 'b'), `${allowed.line[1]} -> ${await pieceOn(page, replyTo)}`)
  const row1 = await lastLog(page)
  const state1 = await store(page, 'cc.safety.state')
  check('the answer is logged: game move, wrong, grade Again, his line', row1.move === c1.human.uci && row1.ok === false && row1.grade === 1 && row1.checked === 'ok' && row1.how === 'first', JSON.stringify(row1))
  check('the schedule now has the card', !!state1 && JSON.parse(state1)[c1.id]?.reps === 1)
  await page.getByRole('button', { name: /Try again/ }).click()
  await waitForMoving(page)
  // first a move outside the complete top list: wrong at once, without the engine
  const m1 = outsideMove(c1)
  await playMove(page, m1)
  await page.getByText('Still not good enough.').waitFor({ timeout: 1_500 })
  check('C3 on an own card a move outside a complete list fails at once', true, m1)
  check("... and says why", (await page.locator('.safety-retry').innerText()).includes("not among the engine's 5 best moves"))
  await page.getByRole('button', { name: /Try again/ }).click()
  await waitForMoving(page)
  await playMove(page, c1.top[0].uci)
  await page.getByText('Safe this time.').waitFor({ timeout: 5_000 })
  const row1b = await lastLog(page)
  check('D4 a retry is logged without a grade', row1b.how === 'retry' && row1b.grade === undefined && row1b.ok === true, JSON.stringify(row1b))
  check('D4 a retry does not change the schedule', (await store(page, 'cc.safety.state')) === state1)
  check('a retry keeps the first verdict on screen', (await page.locator('.safety-verdict h2').innerText()) === 'That was the game move')
  await page.screenshot({ path: `${out}/open-desktop-verdict-own.png` })
  await next(page)

  // card 2: quiet, White: a safe move more than 4 points below the best is right at once (the safety rule)
  const c2 = cardById(ORDER[1])
  await waitForMoving(page)
  const safeOnly = (c2.moves ?? []).filter((m) => m.safe === true)
  const m2 = (safeOnly.find((m) => m.uci === 'a2a3') ?? safeOnly[0])?.uci ?? outsideMove(c2)
  await playMove(page, m2)
  await page.locator('#safety-checked').fill('nothing')
  const t0 = Date.now()
  await page.getByRole('button', { name: /^Confirm/ }).click()
  await page.locator('.safety-verdict').waitFor({ timeout: 5_000 })
  const ms = Date.now() - t0
  check('quiet card: a safe move the engine ranks more than 4 points lower is "Safe"', safeOnly.length > 0 && (await page.locator('.safety-verdict h2').innerText()) === 'Safe', m2)
  check('... decided at once from the stored moves, with no engine', ms < 1_500, `${ms} ms`)
  check('... and says why', (await page.locator('.safety-verdict-head p').innerText()).includes('is safe: after it he cannot win material or mate'))
  const row2 = await lastLog(page)
  check('the verdict is logged as decided by the stored moves', row2.by === 'moves' && row2.move === m2 && row2.ok === true, JSON.stringify(row2))
  check('a quiet card says only "Nothing was threatened here."', (await page.locator('.safety-facts li').allInnerTexts()).join('|') === 'Nothing was threatened here.')
  await next(page)

  // card 3: held, White: a stored top move within 4 points is "Safe"
  const c3 = cardById(ORDER[2])
  await waitForMoving(page)
  const within = c3.top.find((t, i) => i > 0 && t.win > c3.top[0].win - 4)!
  await playMove(page, within.uci)
  await writeAndConfirm(page, 'his knight hits e5')
  await page.locator('.safety-verdict').waitFor()
  check('C3 a top move within 4 points shows "Safe"', (await page.locator('.safety-verdict h2').innerText()) === 'Safe', within.san)
  // the verdict appears the moment Enter confirms, and Next has focus: a quick second Enter must not skip it
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  check('a quick second Enter does not skip the verdict', await visible(page, '.safety-verdict'))
  check('no "Last time you wrote" on a first sight', !(await visible(page, '.safety-last-time')))
  await page.screenshot({ path: `${out}/open-desktop-verdict-safe.png` })
  await next(page)

  // card 4: own, no facts: "Show answer" before moving
  const c4 = cardById(ORDER[3])
  await waitForMoving(page)
  await page.getByRole('button', { name: /Show answer/ }).click()
  await page.locator('.safety-verdict').waitFor()
  const row4 = await lastLog(page)
  check('C6 "Show answer" before moving logs shownAnswer and grade Again', row4.cardId === c4.id && row4.shownAnswer === true && row4.grade === 1, JSON.stringify(row4))
  check('a card without facts shows no "What there was to see"', !(await visible(page, '.safety-facts')))
  await next(page)

  // card 5: held, Black: a move that leaves him material to win fails at once, and says so
  const c5 = cardById(ORDER[4])
  await waitForMoving(page)
  const m5 = (c5.moves ?? []).find((m) => m.safe === false && (m.gain ?? 0) >= 2 && !c5.top.some((t) => t.uci === m.uci))?.uci ?? outsideMove(c5)
  await playMove(page, m5)
  await page.locator('#safety-checked').fill('checked his queen')
  const t5 = Date.now()
  await page.getByRole('button', { name: /^Confirm/ }).click()
  await page.locator('.safety-verdict').waitFor({ timeout: 5_000 })
  check('held card: a move that gives away material fails at once', Date.now() - t5 < 1_500 && (await page.locator('.safety-verdict h2').innerText()) === 'Not good enough', `${m5}, ${Date.now() - t5} ms`)
  check('... and says he can win material', (await page.locator('.safety-verdict-head p').innerText()).includes('he can win material'))
  check('... with his answer from the stored line on the board', await visible(page, '.safety-board-modes .chip:has-text("His answer")'))
  await next(page)

  // C7: reload mid-session keeps the schedule, the log and what is left
  await waitForMoving(page)
  const before = { state: await store(page, 'cc.safety.state'), log: await store(page, 'cc.safety.log'), day: await store(page, 'cc.safety.day') }
  await page.reload()
  await waitForMoving(page)
  const after = { state: await store(page, 'cc.safety.state'), log: await store(page, 'cc.safety.log'), day: await store(page, 'cc.safety.day') }
  check('C7 a reload keeps schedule, log and queue', before.state === after.state && before.log === after.log && before.day === after.day)
  const c6 = cardById(ORDER[5])
  check('C7 ... and continues with the next position', (await highlighted(page, c6.lastMove.slice(0, 2))) && (await highlighted(page, c6.lastMove.slice(2, 4))))
  // card 6: own, Black, incomplete top list: a move outside it goes to the browser engine
  const m6 = outsideMove(c6)
  await playMove(page, m6)
  await page.locator('#safety-checked').fill('his knight')
  const t6 = Date.now()
  await page.getByRole('button', { name: /^Confirm/ }).click()
  let sawChecking = false
  try {
    await page.locator('.safety-prompt h2', { hasText: 'Checking…' }).waitFor({ timeout: 1_500 })
    sawChecking = true
  } catch {
    /* too fast to see */
  }
  await page.locator('.safety-verdict').waitFor({ timeout: 15_000 })
  const ms6 = Date.now() - t6
  check('C3 an undecided move shows "Checking…"', !c6.topComplete && sawChecking)
  check('C3 ... and a verdict within 5 s', ms6 <= 5_000, `${(ms6 / 1000).toFixed(1)} s for ${m6}`)
  const row6 = await lastLog(page)
  check('the engine verdict is logged as such', row6.by === 'engine' && row6.move === m6, JSON.stringify(row6))
  await next(page)

  // the misses come back once at the end; card 1 first, with "Last time you wrote"
  await waitForMoving(page)
  check('a missed position comes back as a "Second look"', await page.locator('.safety-count .chip', { hasText: 'Second look' }).isVisible())
  await playMove(page, c1.top[0].uci)
  await writeAndConfirm(page, 'again')
  await page.locator('.safety-verdict').waitFor()
  const lastTime = await page.locator('.safety-last-time').innerText().catch(() => '')
  check('C5 "Last time you wrote" shows his earlier line', /last time you wrote/i.test(lastTime) && lastTime.includes('“ok”'), lastTime.replace(/\n/g, ' '))
  const rowRepeat = await lastLog(page)
  check('the repeat is logged without a grade', rowRepeat.how === 'repeat' && rowRepeat.grade === undefined)
  for (let i = 0; i < 6 && (await page.getByRole('button', { name: /^(Next position|Finish)/ }).isVisible()); i++) {
    await next(page)
    if (await page.locator('.safety-done').isVisible().catch(() => false)) break
    await waitForMoving(page)
    const id = await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('cc.safety.day') ?? '{}') as { repeats: string[]; repeatsDone: string[] }
      return d.repeats.find((x) => !d.repeatsDone.includes(x)) ?? ''
    })
    await playMove(page, cardById(id).top[0].uci)
    await writeAndConfirm(page, 'ok')
    await page.locator('.safety-verdict').waitFor()
  }
  await page.locator('.safety-done h2').waitFor({ timeout: 5_000 })
  check('after the repeats the day is done', (await page.locator('.safety-done h2').innerText()) === 'Done for today')

  // C7: Settings backup and restore round-trip every cc.safety.* key
  await page.getByRole('button', { name: 'More: New positions a day' }).click()
  await page.getByRole('button', { name: 'Fewer: New positions a day' }).click()
  const safetyKeys = () =>
    page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('cc.safety.')).sort().map((k) => [k, localStorage.getItem(k)])))
  const saved = await safetyKeys()
  await page.goto(base + '#/settings')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download backup' }).click()])
  const file = join(out, 'backup.json')
  await download.saveAs(file)
  const backup = JSON.parse(readFileSync(file, 'utf8')) as { data: Record<string, unknown> }
  const inBackup = Object.keys(saved).every((k) => JSON.stringify(backup.data[k]) === saved[k])
  check('C7 the backup holds every cc.safety.* key unchanged', Object.keys(saved).length === 4 && inBackup, Object.keys(saved).join(', '))
  await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('cc.safety.')).forEach((k) => localStorage.removeItem(k)))
  await page.locator('input[type="file"][aria-label="Choose a backup file"]').setInputFiles(file)
  await page.getByRole('button', { name: 'Replace my data with this backup' }).click()
  await page.waitForLoadState('load')
  await page.waitForTimeout(800)
  const restored = await safetyKeys()
  check('C7 restoring the backup brings every cc.safety.* key back', JSON.stringify(restored) === JSON.stringify(saved))
  check('open desktop run: no console or page errors', errors.length === 0, errors.join(' | '))
  await close()
}

// ---- 3. C8: 390 px, both app themes, zen mode
for (const variant of [
  { name: 'phone-ocean', profile: { appTheme: 'ocean' } },
  { name: 'phone-ember', profile: { appTheme: 'ember', boardTheme: 'walnut' } },
  { name: 'phone-zen', profile: { zenMode: true } },
]) {
  const { page, errors, close } = await open(browser, { games: 40, width: 390, height: 844, profile: variant.profile, seedDay: true })
  await page.goto(base + '#/safety')
  await page.locator('.safety-board').waitFor({ timeout: 15_000 })
  await waitForMoving(page)
  const fits = async (sel: string) => {
    const boxes = await page.locator(sel).evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ l: r.left, r: r.right, w: r.width })))
    return boxes.length > 0 && boxes.every((b) => b.w > 0 && b.l >= -0.5 && b.r <= 390.5)
  }
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  const zen = variant.name === 'phone-zen'
  check(`C8 ${variant.name}: board and strip fit`, (await fits('.safety-board')) && (await fits('.safety-strip')) && !(await overflow()))
  if (!zen) check(`C8 ${variant.name}: all 8 menu links fit, Settings included`, (await fits('.topnav .nav-link')) && (await page.locator('.topnav .nav-link').count()) === 8)
  await page.screenshot({ path: `${out}/${variant.name}-moving.png`, fullPage: true })
  const c1 = cardById(ORDER[0])
  await playMove(page, c1.top[0].uci)
  await page.locator('#safety-checked').waitFor()
  check(`C8 ${variant.name}: line box and buttons fit`, (await fits('#safety-checked')) && (await fits('.safety-line .btn')) && !(await overflow()))
  // the box opens below the board: it must come into view, clear of the bottom menu, without him scrolling
  await page.waitForTimeout(300)
  const covered = await page.evaluate(() =>
    [document.querySelector('#safety-checked'), ...document.querySelectorAll('.safety-line .btn')].filter((el) => {
      const r = el!.getBoundingClientRect()
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return !hit || !(hit === el || el!.contains(hit))
    }).length,
  )
  check(`C8 ${variant.name}: the line box and its buttons are on screen, not under the menu`, covered === 0, `${covered} covered`)
  await page.screenshot({ path: `${out}/${variant.name}-writing.png`, fullPage: true })
  await writeAndConfirm(page, 'his rook on the open file')
  await page.locator('.safety-verdict').waitFor()
  check(`C8 ${variant.name}: verdict and its buttons fit`, (await fits('.safety-verdict')) && (await fits('.safety-verdict .btn')) && !(await overflow()))
  if (zen) {
    check('C8 zen mode keeps the board, the line box (seen above) and the verdict', (await visible(page, '.safety-board')) && (await visible(page, '.safety-verdict')))
    check('C8 zen mode hides the menu and the "Today" panel', !(await visible(page, '.topnav')) && !(await visible(page, '.safety-today')))
  } else {
    const colours = await page.evaluate(() => {
      const p = document.querySelector('.safety-verdict p')!
      const page = getComputedStyle(document.documentElement).getPropertyValue('--bg-2').trim()
      const probe = document.createElement('div')
      probe.style.color = page
      document.body.append(probe)
      const bg = getComputedStyle(probe).color
      probe.remove()
      return { text: getComputedStyle(p).color, heading: getComputedStyle(document.querySelector('.safety-verdict h2')!).color, bg }
    })
    const c = Math.min(contrast(colours.text, colours.bg), contrast(colours.heading, colours.bg))
    check(`C8 ${variant.name}: verdict text is readable (contrast at least 4.5:1)`, c >= 4.5, `${c.toFixed(1)}:1`)
  }
  await page.screenshot({ path: `${out}/${variant.name}-verdict.png`, fullPage: true })
  check(`C8 ${variant.name}: no console or page errors`, errors.length === 0, errors.join(' | '))
  await close()
}

await browser.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nall Safety-check browser checks passed')
process.exit(failures ? 1 : 0)
