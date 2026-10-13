// Turn scripts/.cache/puzzles.jsonl into the static files the app loads from public/puzzles/.
//
//   npx tsx scripts/build-puzzles.ts            full build: pick puzzles, check them with chess.js + Stockfish, write files
//   npx tsx scripts/build-puzzles.ts --draft    same, but skip Stockfish (quick, for trying the app; NOT checked)
//   npx tsx scripts/build-puzzles.ts --recheck  forget all earlier Stockfish results first
//
// The Stockfish check takes several minutes. Its results are saved in scripts/.cache/puzzle-checks/,
// so a stopped build carries on where it stopped. See docs/puzzle-data.md.
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpus } from 'node:os'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Puzzle, PuzzleIndex, PuzzleIndexEntry } from '../src/types'
import { replay, type CachedPuzzle, type Verdict } from './build-puzzles.check'
import { NOISE_TAGS, OPENINGS_GROUP, OPENING_INFO, THEME_INFO } from './build-puzzles.themes'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE_FILE = join(ROOT, 'scripts/.cache/puzzles.jsonl')
const CHECK_DIR = join(ROOT, 'scripts/.cache/puzzle-checks')
const OUT_DIR = join(ROOT, 'public/puzzles')
const SOURCE = 'Lichess puzzle database (CC0) - https://database.lichess.org/#puzzles'

/* ---- How many puzzles, and where in the rating range ------------------ */

const MIN_RATING = 400
const MAX_RATING = 2000
/** Puzzles per theme file. */
const PER_THEME = 400
/** We check more than we ship, so a few failed checks do not leave a theme short. */
const PER_THEME_TO_CHECK = 500
/** Opening files: keep (nearly) everything we have, there are not many. */
const PER_OPENING = 400
/** Hard limits from the task: each file small, the whole folder small. */
const MAX_FILE_BYTES = 350 * 1024
const MAX_TOTAL_BYTES = 9 * 1024 * 1024

/**
 * How much of a theme's file each 100-point rating band gets (400-499, 500-599 ... 1900-2000).
 * The user is around 1100, so the middle gets the most; very easy and very hard puzzles get a smaller share.
 */
const BAND_WEIGHTS = [0.5, 0.8, 1.2, 1.5, 1.8, 2, 2, 2, 2, 1.8, 1.5, 1.3, 1, 0.7, 0.6, 0.5]
const bandOf = (rating: number) => Math.min(BAND_WEIGHTS.length - 1, Math.floor((rating - MIN_RATING) / 100))

/** Better puzzles first: well liked, then often played (the same idea as the cache script). */
const quality = (p: CachedPuzzle) => p.popularity * 10 + Math.min(p.plays, 100000) / 1000

/**
 * Pick `target` puzzles from `rows`, spread over the rating bands by BAND_WEIGHTS and best-quality first.
 * A band that has too few puzzles hands its unused share to the other bands.
 */
function allocate<T extends CachedPuzzle>(rows: T[], target: number): T[] {
  const bands: T[][] = BAND_WEIGHTS.map(() => [])
  for (const r of rows) bands[bandOf(r.rating)].push(r)
  for (const b of bands) b.sort((x, y) => quality(y) - quality(x) || x.id.localeCompare(y.id))

  const take = BAND_WEIGHTS.map(() => 0)
  let left = Math.min(target, rows.length)
  while (left > 0) {
    const open = BAND_WEIGHTS.map((_, i) => i).filter((i) => take[i] < bands[i].length)
    const totalWeight = open.reduce((sum, i) => sum + BAND_WEIGHTS[i], 0)
    let given = 0
    for (const i of open) {
      const share = Math.floor((left * BAND_WEIGHTS[i]) / totalWeight)
      const g = Math.min(share, bands[i].length - take[i])
      take[i] += g
      given += g
    }
    if (given === 0) {
      // Less left than bands: hand out single puzzles, heaviest band first.
      for (const i of [...open].sort((a, b) => BAND_WEIGHTS[b] - BAND_WEIGHTS[a])) {
        if (given >= left) break
        take[i]++
        given++
      }
    }
    left -= given
  }
  return bands.flatMap((b, i) => b.slice(0, take[i]))
}

/* ---- Reading the cache ------------------------------------------------ */

interface Candidate extends CachedPuzzle {
  /** Only the themes we ship (see THEME_INFO). */
  shownThemes: string[]
}

function loadCandidates(): { all: Candidate[]; badLine: Map<string, number> } {
  const badLine = new Map<string, number>()
  const seen = new Set<string>()
  const all: Candidate[] = []
  for (const line of readFileSync(CACHE_FILE, 'utf8').split('\n')) {
    if (!line) continue
    const row = JSON.parse(line) as CachedPuzzle
    // The cache lists a puzzle once per bucket it was picked for; we want each puzzle once.
    if (row.rating < MIN_RATING || row.rating > MAX_RATING || seen.has(row.id)) continue
    seen.add(row.id)
    const played = replay(row)
    if (!played.ok) {
      badLine.set(played.reason, (badLine.get(played.reason) ?? 0) + 1)
      continue
    }
    all.push({ ...row, shownThemes: row.themes.filter((t) => t in THEME_INFO) })
  }
  return { all, badLine }
}

/** Puzzles from the cache that belong to one of the user's openings. */
function loadOpeningRows(): Map<string, Set<string>> {
  const byCourse = new Map<string, Set<string>>()
  for (const line of readFileSync(CACHE_FILE, 'utf8').split('\n')) {
    if (!line) continue
    const row = JSON.parse(line) as CachedPuzzle
    if (row.kind !== 'course') continue
    if (!byCourse.has(row.bucket)) byCourse.set(row.bucket, new Set())
    byCourse.get(row.bucket)?.add(row.id)
  }
  return byCourse
}

/* ---- The Stockfish check (several worker processes) ------------------- */

/** Results are filed under a fingerprint of the checker, so changing the rules re-checks everything. */
function checkFingerprint(): string {
  const source = readFileSync(join(ROOT, 'scripts/build-puzzles.check.ts'), 'utf8')
  return createHash('md5').update(source).digest('hex').slice(0, 8)
}

function readVerdicts(fingerprint: string): Map<string, Verdict> {
  const verdicts = new Map<string, Verdict>()
  if (!existsSync(CHECK_DIR)) return verdicts
  for (const name of readdirSync(CHECK_DIR)) {
    if (!name.startsWith(`results-${fingerprint}-`)) continue
    for (const line of readFileSync(join(CHECK_DIR, name), 'utf8').split('\n')) {
      if (line) {
        const v = JSON.parse(line) as Verdict
        verdicts.set(v.id, v)
      }
    }
  }
  return verdicts
}

function runWorker(todo: string, results: string): Promise<void> {
  return new Promise((done, fail) => {
    const worker = spawn(
      process.execPath,
      ['--import', 'tsx', join(ROOT, 'scripts/build-puzzles.worker.ts'), todo, results],
      { stdio: 'inherit', cwd: ROOT },
    )
    worker.on('exit', (code) => (code === 0 ? done() : fail(new Error(`check worker stopped with code ${code}`))))
  })
}

async function checkWithStockfish(toCheck: Candidate[], fingerprint: string): Promise<Map<string, Verdict>> {
  const verdicts = readVerdicts(fingerprint)
  const pending = toCheck.filter((p) => !verdicts.has(p.id))
  console.log(`Stockfish check: ${toCheck.length} puzzles, ${toCheck.length - pending.length} already checked, ${pending.length} to do`)
  if (pending.length === 0) return verdicts

  mkdirSync(CHECK_DIR, { recursive: true })
  const workers = Math.max(1, Math.min(3, cpus().length - 1))
  const jobs: Promise<void>[] = []
  for (let w = 0; w < workers; w++) {
    const mine = pending.filter((_, i) => i % workers === w)
    const todo = join(CHECK_DIR, `todo-${fingerprint}-${w}.jsonl`)
    writeFileSync(todo, mine.map((p) => JSON.stringify(p)).join('\n') + '\n')
    jobs.push(runWorker(todo, join(CHECK_DIR, `results-${fingerprint}-${w}.jsonl`)))
  }
  await Promise.all(jobs)
  return readVerdicts(fingerprint)
}

/* ---- Writing the files ------------------------------------------------ */

function toPuzzle(p: Candidate): Puzzle {
  const out: Puzzle = { id: p.id, fen: p.fen, moves: p.moves, rating: p.rating, themes: p.shownThemes }
  if (p.opening) out.opening = p.opening
  return out
}

function describeEntry(
  key: string,
  kind: PuzzleIndexEntry['kind'],
  file: string,
  puzzles: Puzzle[],
  text: { label: string; description: string },
  group: string,
): PuzzleIndexEntry & { group: string } {
  const ratings = puzzles.map((p) => p.rating)
  return {
    key,
    kind,
    label: text.label,
    description: text.description,
    group,
    count: puzzles.length,
    file,
    minRating: Math.min(...ratings),
    maxRating: Math.max(...ratings),
  }
}

function writePuzzleFile(file: string, puzzles: Puzzle[]): number {
  const sorted = [...puzzles].sort((a, b) => a.rating - b.rating || a.id.localeCompare(b.id))
  const json = JSON.stringify(sorted)
  const target = join(OUT_DIR, file.replace(/^puzzles\//, ''))
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, json)
  return Buffer.byteLength(json)
}

/** Delete files from an older build that this build no longer writes. */
function removeStaleFiles(dir: string, prefix: string, keep: Set<string>) {
  for (const name of readdirSync(dir)) {
    const relative = prefix + name
    if (statSync(join(dir, name)).isDirectory()) removeStaleFiles(join(dir, name), relative + '/', keep)
    else if (!keep.has(relative)) rmSync(join(dir, name))
  }
}

/* ---- Main ------------------------------------------------------------- */

async function main() {
  const draft = process.argv.includes('--draft')
  const fingerprint = checkFingerprint()
  if (process.argv.includes('--recheck')) rmSync(CHECK_DIR, { recursive: true, force: true })

  const { all, badLine } = loadCandidates()
  console.log(`${all.length} puzzles in ${MIN_RATING}-${MAX_RATING}; lines that failed the chess.js replay:`, Object.fromEntries(badLine))
  const openingIds = loadOpeningRows()

  // 1. Decide which puzzles are worth checking: the best PER_THEME_TO_CHECK of every theme and opening.
  const toCheckIds = new Set<string>()
  for (const theme of Object.keys(THEME_INFO)) {
    for (const p of allocate(all.filter((c) => c.shownThemes.includes(theme)), PER_THEME_TO_CHECK)) toCheckIds.add(p.id)
  }
  for (const course of Object.keys(OPENING_INFO)) {
    const ids = openingIds.get(course) ?? new Set<string>()
    for (const p of allocate(all.filter((c) => ids.has(c.id)), PER_OPENING)) toCheckIds.add(p.id)
  }
  const toCheck = all.filter((p) => toCheckIds.has(p.id))

  // 2. Check them.
  let verdicts: Map<string, Verdict>
  if (draft) {
    verdicts = new Map(toCheck.map((p) => [p.id, { id: p.id, ok: true, reason: 'draft: not checked with Stockfish' }]))
  } else {
    verdicts = await checkWithStockfish(toCheck, fingerprint)
  }
  const dropped = toCheck.filter((p) => verdicts.get(p.id)?.ok === false)
  const reasons = new Map<string, number>()
  for (const p of dropped) {
    const reason = (verdicts.get(p.id)?.reason ?? '').replace(/[-+]?\d+/g, '#').replace(/\b[a-h][1-8][a-h][1-8][qrbn]?\b/g, 'move')
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1)
  }
  console.log(`Checked ${toCheck.length}: dropped ${dropped.length}`, Object.fromEntries(reasons))
  const good = toCheck.filter((p) => verdicts.get(p.id)?.ok === true)

  // 3. Write the files. Old files are overwritten in place (not deleted first), so the running dev server never sees a gap.
  const entries: PuzzleIndexEntry[] = []
  const written = new Set<string>(['index.json'])
  let total = 0
  const note = (file: string, bytes: number) => {
    written.add(file.replace(/^puzzles\//, ''))
    total += bytes
    if (bytes > MAX_FILE_BYTES) throw new Error(`${file} is ${bytes} bytes, over the ${MAX_FILE_BYTES} limit`)
  }

  for (const [theme, info] of Object.entries(THEME_INFO)) {
    const chosen = allocate(good.filter((c) => c.shownThemes.includes(theme)), PER_THEME).map(toPuzzle)
    if (chosen.length === 0) throw new Error(`no puzzles left for theme ${theme}`)
    const file = `puzzles/themes/${theme}.json`
    note(file, writePuzzleFile(file, chosen))
    entries.push(describeEntry(theme, 'theme', file, chosen, info, info.group))
  }
  for (const [course, info] of Object.entries(OPENING_INFO)) {
    const ids = openingIds.get(course) ?? new Set<string>()
    const chosen = allocate(good.filter((c) => ids.has(c.id)), PER_OPENING).map(toPuzzle)
    if (chosen.length === 0) throw new Error(`no puzzles left for opening ${course}`)
    const file = `puzzles/openings/${course}.json`
    note(file, writePuzzleFile(file, chosen))
    entries.push(describeEntry(course, 'opening', file, chosen, info, OPENINGS_GROUP))
  }

  const index: PuzzleIndex = {
    generatedAt: new Date().toISOString(),
    source: draft ? `${SOURCE} - DRAFT, not yet checked with Stockfish` : SOURCE,
    entries,
  }
  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2) + '\n')
  removeStaleFiles(OUT_DIR, '', written)
  if (total > MAX_TOTAL_BYTES) throw new Error(`puzzle files are ${total} bytes in total, over the ${MAX_TOTAL_BYTES} limit`)

  const counts = entries.map((e) => e.count)
  console.log(
    `Wrote ${entries.length} files, ${(total / 1024 / 1024).toFixed(2)} MB, ${counts.reduce((a, b) => a + b, 0)} puzzles ` +
      `(${Math.min(...counts)}-${Math.max(...counts)} per file).${draft ? ' DRAFT: not checked with Stockfish.' : ''}`,
  )
}

await main()
