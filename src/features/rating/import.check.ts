// Quick self-check of the game importers:   npx tsx src/features/rating/import.check.ts
import { cleanUsername, parseLichessNdjson } from './lichessImport'
import { parsePgnText, splitPgnGames } from './pgnImport'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

// --- Lichess usernames
check('plain name', cleanUsername('DrNykterstein') === 'DrNykterstein')
check('@ and spaces are removed', cleanUsername('  @Some_Name-1 ') === 'Some_Name-1')
check('profile link', cleanUsername('https://lichess.org/@/penguingm1') === 'penguingm1')
check('rejects spaces and symbols', cleanUsername('a b!') === null && cleanUsername('') === null && cleanUsername('x') === null)

// --- Lichess NDJSON (one made-up game per line, as the API sends them)
const game = (over: Record<string, unknown>) =>
  JSON.stringify({
    id: 'abcd1234',
    variant: 'standard',
    status: 'mate',
    createdAt: 1_790_000_000_000,
    players: { white: { user: { name: 'Me', id: 'me' }, rating: 1100 }, black: { user: { name: 'Them', id: 'them' }, rating: 1250 } },
    winner: 'white',
    moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6',
    opening: { name: 'Italian Game' },
    ...over,
  })
const ndjson = [
  game({}),
  game({ id: 'black001', players: { white: { user: { name: 'Them', id: 'them' }, rating: 1250 }, black: { user: { name: 'ME', id: 'me' }, rating: 1100 } }, winner: undefined, status: 'draw' }),
  game({ id: 'ai000001', players: { white: { user: { name: 'Me', id: 'me' }, rating: 1100 }, black: { aiLevel: 3 } } }),
  game({ id: 'chess960', variant: 'chess960' }),
  game({ id: 'short001', moves: 'e4 e5' }),
  'this line is not json',
  '{"id":"cut',
].join('\n')
const parsed = parseLichessNdjson(ndjson, 'me')
check('keeps the two normal games', parsed.games.length === 2, parsed.games.map((g) => g.id).join(','))
check('counts what was left out', parsed.skipped.computer === 1 && parsed.skipped.otherVariant === 1 && parsed.skipped.tooShort === 1)
check('finds my side (any capitalisation)', parsed.games[0].userSide === 'white' && parsed.games[1].userSide === 'black')
check('reads ratings, result and opening', parsed.games[0].whiteElo === 1100 && parsed.games[0].blackElo === 1250 && parsed.games[0].result === '1-0' && parsed.games[0].openingName === 'Italian Game')
check('a draw has no winner', parsed.games[1].result === '1/2-1/2')
check('builds a PGN when Lichess sends none', parsed.games[0].pgn.includes('1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6'))

// --- pasted PGN
const one = '[White "Me"]\n[Black "Fritz"]\n[Result "1-0"]\n\n1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0\n'
const two = '[White "Ann"]\n[Black "Bob"]\n[Result "0-1"]\n\n1. f3 e5 2. g4 Qh4# 0-1\n'
check('splits two games', splitPgnGames(`${one}\n${two}`).length === 2)
check('a single game without headers stays one', splitPgnGames('1. e4 e5 2. Nf3 Nc6').length === 1)
const pasted = parsePgnText(`${one}\n${two}\n[White "X"]\n\n1. e4 e5 2. Ke4 *`, ['me'])
check('reads the good games, reports the bad one', pasted.games.length === 2 && pasted.errors.length === 1, pasted.errors.join(' / '))
check('guesses my side by name', pasted.games[0].guessedSide === 'white' && pasted.games[1].guessedSide === null)
check('the same text gives the same id', parsePgnText(one, []).games[0].id === parsePgnText(one, []).games[0].id)

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
