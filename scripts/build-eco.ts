// Builds src/data/eco.json (the opening-name table) from the Lichess openings database (CC0).
//
//   npx tsx scripts/build-eco.ts                 download a.tsv ... e.tsv from GitHub
//   npx tsx scripts/build-eco.ts <folder>        read a.tsv ... e.tsv from a local folder instead (offline)
//
// How it works: replay every database line with chess.js, take the fingerprint of the position after
// each move (positionKey), and store it. Positions at the END of a line get the line's name; positions
// passed on the way are stored without a name (used by isBookPosition). See docs/eco-data.md.
import { Chess } from 'chess.js'
import { readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { positionKey } from '../src/lib/openingName'

const SOURCE_URL = 'https://raw.githubusercontent.com/lichess-org/chess-openings/master'
const OUT_FILE = new URL('../src/data/eco.json', import.meta.url)

interface DbLine {
  eco: string
  name: string
  sans: string[]
}

async function readTsv(letter: string, folder: string | undefined): Promise<string> {
  if (folder) return readFile(`${folder}/${letter}.tsv`, 'utf8')
  const res = await fetch(`${SOURCE_URL}/${letter}.tsv`)
  if (!res.ok) throw new Error(`Could not download ${letter}.tsv (HTTP ${res.status})`)
  return res.text()
}

/** "1. d4 d5 2. c4" -> ['d4', 'd5', 'c4'] */
function pgnToSans(pgn: string): string[] {
  return pgn.replace(/\d+\.+/g, ' ').split(/\s+/).filter(Boolean)
}

function parseTsv(text: string): DbLine[] {
  const [header, ...rows] = text.split(/\r?\n/).filter((line) => line.trim())
  if (header !== 'eco\tname\tpgn') throw new Error(`Unexpected TSV header: ${header}`)
  return rows.map((row) => {
    const [eco, name, pgn] = row.split('\t')
    return { eco, name, sans: pgnToSans(pgn) }
  })
}

/** When two lines end in the same position, keep the more specific one: longer name, then longer line,
 *  then alphabetical - so the result never depends on the order of the files. */
function moreSpecific(a: DbLine, b: DbLine): DbLine {
  if (a.name.length !== b.name.length) return a.name.length > b.name.length ? a : b
  if (a.sans.length !== b.sans.length) return a.sans.length > b.sans.length ? a : b
  return `${a.eco} ${a.name}` <= `${b.eco} ${b.name}` ? a : b
}

async function main() {
  const folder = process.argv[2]
  const lines: DbLine[] = []
  for (const letter of 'abcde') lines.push(...parseTsv(await readTsv(letter, folder)))

  const named = new Map<string, DbLine>() // key -> the line that names this position
  const onTheWay = new Set<string>() // keys of positions passed through (named or not)
  const epdOfKey = new Map<string, string>() // only to detect hash collisions
  let sharedPositions = 0

  for (const line of lines) {
    const game = new Chess()
    line.sans.forEach((san, i) => {
      try {
        game.move(san)
      } catch {
        throw new Error(`Illegal move ${san} in "${line.name}" (${line.sans.join(' ')})`)
      }
      const epd = game.fen().split(' ').slice(0, 4).join(' ')
      const key = positionKey(game.fen())
      const seen = epdOfKey.get(key)
      if (seen !== undefined && seen !== epd) throw new Error(`Hash collision between "${seen}" and "${epd}"`)
      epdOfKey.set(key, epd)
      if (i < line.sans.length - 1) onTheWay.add(key)
      else {
        const earlier = named.get(key)
        if (earlier) sharedPositions++
        named.set(key, earlier ? moreSpecific(earlier, line) : line)
      }
    })
  }

  // Stable order (by ECO code, then name) so a rebuild produces a small, readable diff.
  const rows = [...named.entries()].sort(([ka, a], [kb, b]) => a.eco.localeCompare(b.eco) || a.name.localeCompare(b.name) || ka.localeCompare(kb))
  const pathKeys = [...onTheWay].filter((key) => !named.has(key)).sort()

  // One entry per line, written by hand (JSON.stringify would put every value on its own line).
  const json = [
    '{',
    `"source":"Lichess openings database (CC0), https://github.com/lichess-org/chess-openings - rebuild with: npx tsx scripts/build-eco.ts",`,
    '"named":[',
    rows.map(([key, l]) => JSON.stringify([key, l.eco, l.name])).join(',\n'),
    '],',
    '"path":[',
    pathKeys.map((key) => JSON.stringify(key)).join(',\n'),
    ']',
    '}',
    '',
  ].join('\n')
  await writeFile(OUT_FILE, json)

  const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`
  console.log(`Database lines read:          ${lines.length}`)
  console.log(`Named positions:              ${rows.length}  (${sharedPositions} lines shared a position with an earlier line)`)
  console.log(`Unnamed positions on the way: ${pathKeys.length}`)
  console.log(`Wrote src/data/eco.json:      ${kb(Buffer.byteLength(json))} raw, ${kb(gzipSync(json).length)} gzipped`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
