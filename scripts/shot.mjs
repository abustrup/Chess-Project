// Take a screenshot of a page of the running dev server.
//   node scripts/shot.mjs "/play" out.png [width] [height]
// The dev server must be running (npm run dev). Uses the pre-installed Chromium.
import { chromium } from 'playwright-core'
const [route = '/', out = 'shot.png', w = '1360', h = '900'] = process.argv.slice(2)
const url = (process.env.APP_URL || 'http://localhost:5173/') + '#' + route
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && console.log('[browser ' + m.type() + ']', m.text()))
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.goto(url)
await page.waitForTimeout(Number(process.env.WAIT || 1500))
await page.screenshot({ path: out, fullPage: false })
await browser.close()
console.log('saved', out)
