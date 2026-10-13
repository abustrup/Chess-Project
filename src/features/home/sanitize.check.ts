// Regression check for the dashboard's data cleaning: damaged saved data must never crash Home.
// Run: npx tsx src/features/home/sanitize.check.ts
import assert from 'node:assert/strict'
import { OPENING_COURSES } from '../../data/openings'
import { TACTIC_LESSONS } from '../../data/tactics'
import { authoredText } from './format'
import { buildContinue, buildPlan, practiceDays, summariseCourse, summarisePuzzles } from './progress'
import { cleanEstimate, cleanGames, cleanOpeningProgress, cleanProfile, cleanPuzzleStats, cleanTacticsProgress } from './sanitize'

const junk: unknown[] = [null, undefined, 'str', 5, [], [null], { a: null }, { history: [null], byTheme: { fork: null } }, { rating: 'x' }]
const now = new Date('2026-10-13T20:00:00')

for (const value of junk) {
  const openingProgress = cleanOpeningProgress(value)
  const tacticsProgress = cleanTacticsProgress(value)
  const puzzleStats = cleanPuzzleStats(value)
  const games = cleanGames(value)
  cleanProfile(value)
  assert.equal(cleanEstimate(value), null)
  const summaries = OPENING_COURSES.map((course) => summariseCourse(course, openingProgress))
  const puzzles = summarisePuzzles(puzzleStats, now)
  assert.ok(Number.isFinite(puzzles.rating))
  practiceDays({ games, puzzleStats, openingProgress, tacticsProgress })
  assert.equal(buildPlan({ summaries, lessons: TACTIC_LESSONS, tacticsProgress, puzzles, games, now }).length, 3)
  buildContinue({ courses: OPENING_COURSES, summaries, progress: openingProgress, unfinishedMoves: null, now })
}

assert.deepEqual(cleanGames([null, { id: 1 }, { id: 'g', date: '2026-10-13' }]).length, 1)
assert.equal(cleanEstimate({ elo: 1180, low: 1050, high: 1310 })?.elo, 1180)
assert.equal(authoredText('TODO'), '')
assert.equal(authoredText('  Solid and simple. '), 'Solid and simple.')
console.log('sanitize.check: all good')
