// Regression check: damaged or old saved setups and games must never crash the Play page.
//   npx tsx src/features/play/session.check.ts
import assert from 'node:assert/strict'
import { DEFAULT_SETUP, cleanSavedGame, cleanSetup } from './session'
import { START_FEN } from './position'

for (const bad of [null, undefined, 'nope', 7, [], {}]) {
  assert.deepEqual(cleanSetup(bad), DEFAULT_SETUP)
  assert.equal(cleanSavedGame(bad), null)
}
const mixed = cleanSetup({ colour: 7, levelId: 'club', mode: 'weird', coach: false })
assert.equal(mixed.colour, 'white')
assert.equal(mixed.mode, 'free')
assert.equal(mixed.levelId, 'club')
assert.equal(mixed.coach, false)

assert.equal(cleanSavedGame({ config: { id: 'x', userSide: 'purple', startFen: START_FEN }, ucis: [] }), null)
assert.equal(cleanSavedGame({ config: { id: 'x', userSide: 'white', startFen: 'garbage' }, ucis: [] }), null)
const repaired = cleanSavedGame({
  config: { id: 'x', userSide: 'black', startFen: START_FEN, levelId: '??', timeId: '??', mode: 'odd' },
  ucis: ['e2e4', 'c7c6', 'zzzz', 'd2d4'],
  clock: 5,
})
assert.ok(repaired)
assert.deepEqual(repaired.ucis, ['e2e4', 'c7c6'])
assert.equal(repaired.clock, null)
assert.equal(repaired.config.mode, 'free')
assert.equal(repaired.hintsUsed, 0)
console.log('session.check: ok')
