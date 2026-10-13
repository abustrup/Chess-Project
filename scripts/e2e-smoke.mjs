// Visit every page at desktop + phone size (+ zen mode + Ember theme) and report console/page errors.
//   node scripts/e2e-smoke.mjs [outDir]      (dev server or `npm run preview` must be running; APP_URL overrides)
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const base = process.env.APP_URL || 'http://localhost:5173/'
const out = process.argv[2] || 'smoke-shots'
mkdirSync(out, { recursive: true })

const ROUTES = ['/', '/play', '/openings', '/openings/london', '/openings/caro-kann', '/openings/slav', '/tactics', '/puzzles', '/rating', '/settings']
const SIZES = { desktop: { width: 1360, height: 860 }, phone: { width: 390, height: 844 } }
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
let problems = 0

for (const [sizeName, viewport] of Object.entries(SIZES)) {
  for (const variant of ['normal', 'zen-ember']) {
    const ctx = await browser.newContext({ viewport })
    if (variant === 'zen-ember') {
      await ctx.addInitScript(() => localStorage.setItem('cc.profile', JSON.stringify({ zenMode: true, appTheme: 'ember', boardTheme: 'walnut' })))
    }
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
    page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()))
    for (const route of ROUTES) {
      errors.length = 0
      await page.goto(base + '#' + route)
      await page.waitForTimeout(1800)
      const file = `${out}/${sizeName}-${variant}-${route.replace(/\W+/g, '_') || 'home'}.png`
      await page.screenshot({ path: file })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
      const flags = [...errors, ...(overflow ? ['horizontal overflow'] : [])]
      if (flags.length) problems += flags.length
      console.log(`${flags.length ? 'FAIL' : 'ok  '} ${sizeName}/${variant} ${route}${flags.length ? '\n      ' + flags.join('\n      ') : ''}`)
    }
    await ctx.close()
  }
}
await browser.close()
console.log(problems ? `\n${problems} problem(s)` : '\nall pages loaded clean')
process.exit(problems ? 1 : 0)
