// Run: npx tsx scripts/check-eco.ts
// Checks the opening-name lookup (src/lib/openingName.ts) against known games. Exits 1 on any failure.
import { readFileSync, statSync } from 'node:fs'
import { Chess } from 'chess.js'
import { identifyOpening, isBookPosition, openingFamily, courseIdForOpening } from '../src/lib/openingName'

let failures = 0
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? '  ok   ' : '  FAIL '} ${label}${ok ? '' : `\n         expected ${JSON.stringify(expected)}\n         got      ${JSON.stringify(actual)}`}`)
}

/** "1.e4 c6 2.d4" -> ['e4','c6','d4'] */
const moves = (text: string) => text.replace(/\d+\./g, ' ').split(/\s+/).filter(Boolean)
const id = (text: string) => identifyOpening(moves(text))

console.log('\nidentifyOpening')
check('Caro-Kann Advance', id('1.e4 c6 2.d4 d5 3.e5'), { eco: 'B12', name: 'Caro-Kann Defense: Advance Variation', plies: 5 })
check('Caro-Kann, game goes on past the book', id('1.e4 c6 2.d4 d5 3.e5 Bf5 4.Nf3 e6 5.Be2 c5 6.Be3 Nd7 7.Na3 cxd4 8.Nb5 Ne7'), { eco: 'B12', name: 'Caro-Kann Defense: Advance Variation, Short Variation', plies: 8 })
check('Accelerated London (1.d4 d5 2.Bf4)', id('1.d4 d5 2.Bf4'), { eco: 'D00', name: "Queen's Pawn Game: Accelerated London System", plies: 3 })
check('London with 2.Nf3 Nf6 3.Bf4', id('1.d4 d5 2.Nf3 Nf6 3.Bf4'), { eco: 'D02', name: "Queen's Pawn Game: London System", plies: 5 })
check('Slav 4...dxc4', id('1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 dxc4'), { eco: 'D15', name: 'Slav Defense: Three Knights Variation', plies: 8 })
check('Semi-Slav', id('1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 e6'), { eco: 'D43', name: 'Semi-Slav Defense', plies: 8 })
check('Transposition: London via 1.Nf3 d5 2.d4 Nf6 3.Bf4', id('1.Nf3 d5 2.d4 Nf6 3.Bf4'), { eco: 'D02', name: "Queen's Pawn Game: London System", plies: 5 })
check('Transposition: Slav via 1.c4 c6 2.d4 d5', id('1.c4 c6 2.d4 d5'), { eco: 'D10', name: 'Slav Defense', plies: 4 })
check('Transposition: Caro-Kann via 1.d4 c6 2.e4 d5', id('1.d4 c6 2.e4 d5'), { eco: 'B12', name: 'Caro-Kann Defense', plies: 4 })
check('Repeated knight moves: back to a book position', id('1.Nf3 Nf6 2.Ng1 Ng8 3.e4'), { eco: 'B00', name: "King's Pawn", plies: 5 })
check('Sicilian Najdorf, with check marks and a bad move at the end', id('1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Kh8'), { eco: 'B54', name: 'Sicilian Defense: Open', plies: 7 })
check('Not a known opening (only the first move is)', id('1.a3 a5'), { eco: 'A00', name: 'Anderssen Opening', plies: 1 })
check('Not a known opening at all', id('1.h3 h6'), null)
check('No moves', identifyOpening([]), null)
check('Illegal first move', identifyOpening(['Ke2']), null)

console.log('\nisBookPosition')
check('1.e4 e5 2.Nf3 Nc6 3.Bb5 is book', isBookPosition(moves('1.e4 e5 2.Nf3 Nc6 3.Bb5')), true)
check('transposition is book', isBookPosition(moves('1.Nf3 d5 2.d4 Nf6 3.Bf4')), true)
check('a position on the way to a named line is book', isBookPosition(moves('1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Be7')), true)
check('left the book', isBookPosition(moves('1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 d6 8.c3 O-O 9.h3 Nb8 10.d4 Nbd7 11.Nbd2 Bb7 12.Bc2 Re8 13.a4 Bf8 14.a5 h6')), false)
check('weird opening is not book', isBookPosition(moves('1.h4 h5 2.a4 a5')), false)
check('illegal move is not book', isBookPosition(['e4', 'e4']), false)
check('start position counts as book', isBookPosition([]), true)

console.log('\nopeningFamily')
check('with variation', openingFamily('Caro-Kann Defense: Advance Variation'), 'Caro-Kann Defense')
check('without variation', openingFamily('Slav Defense'), 'Slav Defense')
check('only the first colon splits', openingFamily('Queen\'s Gambit Declined: Semi-Slav, Abrahams Variation'), "Queen's Gambit Declined")

console.log('\ncourseIdForOpening')
check('London System', courseIdForOpening("Queen's Pawn Game: London System"), 'london')
check('Accelerated London System', courseIdForOpening("Indian Defense: Accelerated London System"), 'london')
check('London System, with Be2', courseIdForOpening('London System, with Be2'), 'london')
check('Caro-Kann', courseIdForOpening('Caro-Kann Defense: Advance Variation'), 'caro-kann')
check('Slav', courseIdForOpening('Slav Defense: Exchange Variation'), 'slav')
check('Semi-Slav', courseIdForOpening('Semi-Slav Defense: Meran Variation'), 'slav')
check('Semi-Slav inside the Queen\'s Gambit Declined', courseIdForOpening("Queen's Gambit Declined: Semi-Slav, Junge Variation"), 'slav')
check('Yugoslav Attack is not the Slav', courseIdForOpening('Sicilian Defense: Dragon Variation, Yugoslav Attack'), null)
check('Grob "London Defense" is not the London System', courseIdForOpening('Grob Opening: London Defense'), null)
check('Sicilian', courseIdForOpening('Sicilian Defense: Najdorf Variation'), null)

console.log('\nthe three courses are all recognised')
check('London course', courseIdForOpening(id('1.d4 d5 2.Nf3 Nf6 3.Bf4 e6 4.e3 Bd6 5.Bg3')?.name ?? ''), 'london')
check('Caro-Kann course', courseIdForOpening(id('1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5')?.name ?? ''), 'caro-kann')
check('Slav course', courseIdForOpening(id('1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.e3 Bf5')?.name ?? ''), 'slav')

console.log('\nthe data file')
const size = statSync(new URL('../src/data/eco.json', import.meta.url)).size
const data = JSON.parse(readFileSync(new URL('../src/data/eco.json', import.meta.url), 'utf8')) as { named: string[][]; path: string[] }
check('size is under 400 KB', size < 400 * 1024, true)
check('has thousands of named positions', data.named.length > 3000, true)
check('no key is stored twice', new Set([...data.named.map((e) => e[0]), ...data.path]).size, data.named.length + data.path.length)

console.log('\nspeed')
const long = new Chess()
const longSans: string[] = []
for (let i = 0; i < 200 && !long.isGameOver(); i++) {
  const m = long.moves()[0]
  long.move(m)
  longSans.push(m)
}
const t0 = performance.now()
for (let i = 0; i < 20; i++) identifyOpening(longSans)
const ms = (performance.now() - t0) / 20
check(`identifyOpening on a ${longSans.length}-move game takes ${ms.toFixed(1)} ms (< 50 ms)`, ms < 50, true)

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
