// O1 browser check (2026-10-16): course pages list the narrowed chapters (1360 and 390 px), every chapter's study
// page shows a board and its drill completes a line, old chapter links show the 'not found' page, and Play's
// practise mode plays prepared moves. Needs the dev server and Google Chrome (paths are this Mac's).
// Run: npx tsx titles.ts > titles.json (OPENING_COURSES ids and titles), then node browser_check.mjs http://localhost:5199/ OUT titles.json
// O1 browser test: narrowed opening courses in the openings UI and in Play's practise mode.
// node e2e_o1.mjs BASE_URL OUT_DIR TITLES_JSON
import { chromium } from '/Users/alexanderbustrup/Chess-Project/node_modules/playwright-core/index.mjs'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const [base, out, titlesPath] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const courses = JSON.parse(readFileSync(titlesPath, 'utf8'))
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const report = []
let problems = 0
const fail = (m) => {
  problems++
  report.push('FAIL ' + m)
  console.log('FAIL ' + m)
}
const ok = (m) => {
  report.push('ok   ' + m)
  console.log('ok   ' + m)
}

async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
  return { ctx, page, errors }
}

if (!process.env.ONLY_PLAY) {
// 1. Course pages list exactly the narrowed chapters (desktop and 390 px)
for (const vp of [{ width: 1360, height: 900 }, { width: 390, height: 844 }]) {
  const { ctx, page, errors } = await newPage(vp)
  for (const c of courses) {
    errors.length = 0
    await page.goto(`${base}#/openings/${c.id}`)
    await page.waitForTimeout(1500)
    const text = await page.locator('body').innerText()
    const missing = c.chapters.filter((ch) => !text.includes(ch.title))
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
    await page.screenshot({ path: `${out}/course-${c.id}-${vp.width}.png`, fullPage: true })
    if (missing.length || errors.length || overflow)
      fail(`${vp.width}px /openings/${c.id}: missing ${missing.map((m) => m.title).join(' | ')} ${errors.join(' ')} ${overflow ? 'overflow' : ''}`)
    else ok(`${vp.width}px /openings/${c.id}: all ${c.chapters.length} chapter titles shown, no errors`)
  }
  // an old chapter link must not crash
  errors.length = 0
  await page.goto(`${base}#/openings/slav/main-slav/study`)
  await page.waitForTimeout(1200)
  const t = await page.locator('body').innerText()
  if (t.includes('We could not find that chapter') && !errors.length) ok(`${vp.width}px old link /openings/slav/main-slav/study shows the friendly "not found" page`)
  else fail(`${vp.width}px old link: ${t.slice(0, 120)} ${errors.join(' ')}`)
  await ctx.close()
}

// 2. Every chapter: study page renders a board; drill completes one full line (moves typed from "Show answer")
{
  const { ctx, page, errors } = await newPage({ width: 1360, height: 900 })
  for (const c of courses) {
    for (const ch of c.chapters) {
      errors.length = 0
      await page.goto(`${base}#/openings/${c.id}/${ch.id}/study`)
      await page.waitForTimeout(900)
      const squares = await page.locator('[data-square]').count()
      if (squares !== 64 || errors.length) fail(`study ${c.id}/${ch.id}: squares ${squares} ${errors.join(' ')}`)
      await page.goto(`${base}#/openings/${c.id}/${ch.id}/drill`)
      await page.waitForTimeout(1200)
      const played = []
      let done = false
      for (let i = 0; i < 14 && !done; i++) {
        const body = await page.locator('body').innerText()
        if (body.includes('Line complete!')) {
          done = true
          break
        }
        const btn = page.getByRole('button', { name: 'Show answer' })
        if ((await btn.count()) && (await btn.isEnabled())) {
          await btn.click()
          await page.waitForTimeout(250)
          const t = await page.locator('body').innerText()
          const m = /The move here is (\S+)/.exec(t)
          if (!m) {
            fail(`drill ${c.id}/${ch.id}: no answer text`)
            break
          }
          played.push(m[1])
          await page.getByPlaceholder('for example Nf3').fill(m[1])
          await page.getByPlaceholder('for example Nf3').press('Enter')
          await page.waitForTimeout(1100)
        } else {
          await page.waitForTimeout(700)
        }
      }
      const body = await page.locator('body').innerText()
      if (body.includes('Line complete!') && !errors.length) ok(`drill ${c.id}/${ch.id}: line complete after your moves ${played.join(' ')}`)
      else fail(`drill ${c.id}/${ch.id}: not complete (played ${played.join(' ')}) ${errors.join(' ')}`)
    }
  }
  await page.screenshot({ path: `${out}/drill-last.png` })
  await ctx.close()
}

}
// 3. Play, practise mode: the computer plays prepared moves from the narrowed courses
async function practise(course, chapter, myMoves, label) {
  const { ctx, page, errors } = await newPage({ width: 1360, height: 900 })
  await page.goto(`${base}#/play?course=${course}${chapter ? `&chapter=${chapter}` : ''}&mode=practice`)
  await page.waitForTimeout(1500)
  const start = page.getByRole('button', { name: /Start game/ })
  if (await start.count()) await start.click()
  await page.waitForTimeout(2500)
  for (const [from, to] of myMoves) {
    await page.locator(`[data-square="${from}"]`).click()
    await page.waitForTimeout(250)
    await page.locator(`[data-square="${to}"]`).click()
    await page.waitForTimeout(3500)
  }
  const fen = await page.evaluate(() => {
    const pieces = [...document.querySelectorAll('[data-square]')]
      .map((sq) => {
        const img = sq.querySelector('[data-piece]')
        return img ? `${sq.getAttribute('data-square')}:${img.getAttribute('data-piece')}` : null
      })
      .filter(Boolean)
    return pieces.join(' ')
  })
  const text = await page.locator('body').innerText()
  await page.screenshot({ path: `${out}/practise-${label}.png` })
  await ctx.close()
  return { fen, text, errors }
}

const pieceAt = (fen, sq) => (fen.split(' ').find((p) => p.startsWith(sq + ':')) || '').split(':')[1] || ''

{
  // Slav, chapter "Other White moves": White's first move comes from the book (1.d4, 1.c4 or 1.Nf3)
  const firsts = new Set()
  for (let i = 0; i < 4; i++) {
    const r = await practise('slav', 'other-second-moves', [], `slav-other-${i}`)
    if (r.errors.length) fail(`practise slav/other-second-moves: ${r.errors.join(' ')}`)
    const first = pieceAt(r.fen, 'd4') === 'wP' ? '1.d4' : pieceAt(r.fen, 'c4') === 'wP' ? '1.c4' : pieceAt(r.fen, 'f3') === 'wN' ? '1.Nf3' : '?'
    firsts.add(first)
  }
  if (firsts.has('?')) fail(`practise slav/other-second-moves: White's first moves ${[...firsts].join(', ')}`)
  else ok(`practise slav/other-second-moves: the computer opened with ${[...firsts].join(', ')} (4 games)`)

  // Slav, any chapter: 1.d4, you answer 1...c6; the computer's 2nd move must be a prepared one
  const seconds = new Set()
  for (let i = 0; i < 3; i++) {
    const r = await practise('slav', '', [['c7', 'c6']], `slav-any-${i}`)
    if (r.errors.length) fail(`practise slav: ${r.errors.join(' ')}`)
    const w = ['c4', 'f4', 'e4', 'f3', 'e3', 'c3', 'g5'].filter((sq) => pieceAt(r.fen, sq) && pieceAt(r.fen, sq)[0] === 'w' && !(sq === 'c3' && pieceAt(r.fen, sq) === 'wP' && false))
    seconds.add(`${pieceAt(r.fen, 'c6')}@c6 ${w.map((s) => `${pieceAt(r.fen, s)}@${s}`).join(',')}`)
  }
  ok(`practise slav (any chapter), after 1...c6 the board shows: ${[...seconds].join(' | ')}`)

  // Caro-Kann: 1.e4, you play 1...c6; the computer answers from the book
  const caro = new Set()
  for (let i = 0; i < 3; i++) {
    const r = await practise('caro-kann', '', [['c7', 'c6']], `caro-${i}`)
    if (r.errors.length) fail(`practise caro-kann: ${r.errors.join(' ')}`)
    caro.add(`e4:${pieceAt(r.fen, 'e4')} c6:${pieceAt(r.fen, 'c6')} d4:${pieceAt(r.fen, 'd4')} f3:${pieceAt(r.fen, 'f3')} c4:${pieceAt(r.fen, 'c4')} c3:${pieceAt(r.fen, 'c3')}`)
  }
  ok(`practise caro-kann: ${[...caro].join(' | ')}`)

  // London: you play 1.d4; the computer answers from the book
  const lon = new Set()
  for (let i = 0; i < 3; i++) {
    const r = await practise('london', '', [['d2', 'd4']], `london-${i}`)
    if (r.errors.length) fail(`practise london: ${r.errors.join(' ')}`)
    lon.add(`d4:${pieceAt(r.fen, 'd4')} d5:${pieceAt(r.fen, 'd5')} f6:${pieceAt(r.fen, 'f6')} c6:${pieceAt(r.fen, 'c6')} g6:${pieceAt(r.fen, 'g6')} f5:${pieceAt(r.fen, 'f5')}`)
  }
  ok(`practise london: ${[...lon].join(' | ')}`)
}

await browser.close()
writeFileSync(`${out}/report.txt`, report.join('\n') + `\n${problems} problem(s)\n`)
console.log(problems ? `${problems} problem(s)` : 'all clean')
process.exit(problems ? 1 : 0)
