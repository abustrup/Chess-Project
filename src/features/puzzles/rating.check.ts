// A tiny check of the rating maths. Run it with:  npx tsx src/features/puzzles/rating.check.ts
import assert from 'node:assert/strict'
import { DEFAULT_PUZZLE_STATS, MIN_RATING, applyAttempt, expectedScore, kFactor, ratingChange, type Attempt } from './rating'

const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  puzzleId: 'abc',
  puzzleRating: 1000,
  themes: ['fork'],
  solved: true,
  usedHint: false,
  date: '2026-01-01T00:00:00.000Z',
  ...over,
})

// Equal ratings = 50% chance. A puzzle 400 points harder = about 9%.
assert.equal(expectedScore(1000, 1000), 0.5)
assert.ok(Math.abs(expectedScore(1000, 1400) - 0.0909) < 0.001)

// K = 32 for the first 30 puzzles, 20 after that.
assert.equal(kFactor(0), 32)
assert.equal(kFactor(29), 32)
assert.equal(kFactor(30), 20)

// Same rating: +16 for a solve, -16 for a miss at the start; +-10 later.
assert.equal(ratingChange(1000, 1000, true, 0), 16)
assert.equal(ratingChange(1000, 1000, false, 0), -16)
assert.equal(ratingChange(1000, 1000, true, 50), 10)
assert.equal(ratingChange(1000, 1000, false, 50), -10)
// Beating a much harder puzzle pays more than beating an easy one.
assert.ok(ratingChange(1000, 1400, true, 0) > ratingChange(1000, 600, true, 0))
// Missing an easy puzzle hurts more than missing a hard one.
assert.ok(ratingChange(1000, 600, false, 0) < ratingChange(1000, 1400, false, 0))
// The rating never drops below the floor.
assert.equal(1000 + ratingChange(1000, 1000, false, 0), 984)
assert.equal(MIN_RATING + ratingChange(MIN_RATING, 3000, false, 0), MIN_RATING)

// A clean solve: rating up, streak up, theme counted.
let result = applyAttempt(DEFAULT_PUZZLE_STATS, attempt())
assert.equal(result.delta, 16)
assert.equal(result.stats.rating, 1016)
assert.equal(result.stats.solved, 1)
assert.equal(result.stats.streak, 1)
assert.equal(result.stats.bestStreak, 1)
assert.deepEqual(result.stats.byTheme.fork, { solved: 1, failed: 0 })
assert.equal(result.stats.history.length, 1)
assert.equal(result.stats.history[0].ratingAfter, 1016)

// A solve with a hint: counted as solved, but no rating gain and the streak stays where it is.
result = applyAttempt(result.stats, attempt({ usedHint: true }))
assert.equal(result.delta, 0)
assert.equal(result.stats.rating, 1016)
assert.equal(result.stats.solved, 2)
assert.equal(result.stats.streak, 1)

// A miss: rating down, streak back to 0, best streak remembered.
result = applyAttempt(result.stats, attempt({ solved: false, themes: ['fork', 'pin'] }))
assert.ok(result.delta < 0)
assert.equal(result.stats.rating, 1016 + result.delta)
assert.equal(result.stats.failed, 1)
assert.equal(result.stats.streak, 0)
assert.equal(result.stats.bestStreak, 1)
assert.deepEqual(result.stats.byTheme.fork, { solved: 2, failed: 1 })
assert.deepEqual(result.stats.byTheme.pin, { solved: 0, failed: 1 })

// After 30 puzzles the smaller K applies.
let long = DEFAULT_PUZZLE_STATS
for (let i = 0; i < 30; i++) long = applyAttempt(long, attempt({ puzzleRating: long.rating })).stats
assert.equal(long.solved, 30)
const next = applyAttempt(long, attempt({ puzzleRating: long.rating }))
assert.equal(next.delta, 10)

// The history stays short.
let many = DEFAULT_PUZZLE_STATS
for (let i = 0; i < 600; i++) many = applyAttempt(many, attempt({ puzzleRating: many.rating })).stats
assert.equal(many.history.length, 500)

console.log('rating maths: all checks passed')
