// Regression check for the dashboard's data cleaning: damaged saved data must never crash Home.
// Run: npx tsx src/features/home/sanitize.check.ts
import assert from 'node:assert/strict'
import { OPENING_COURSES } from '../../data/openings'
import { TACTIC_LESSONS } from '../../data/tactics'
import { authoredText, dayKey } from './format'
import { buildContinue, buildPlan, currentStreak, longestStreak, practiceDays, summariseCourse, summarisePuzzles } from './progress'
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
// Wrong field types inside otherwise valid entries (old versions, hand edits, odd backups).
const oddGame = cleanGames([{ id: 'g', date: '2026-10-12', white: { name: 'x' }, black: null, openingName: { eco: 'A' }, botElo: {}, result: 'win', userSide: 'red' }])[0]
assert.equal(typeof oddGame.white, 'string')
assert.equal(oddGame.black, 'Unknown player')
assert.equal(oddGame.openingName, undefined)
assert.equal(oddGame.botElo, undefined)
assert.equal(oddGame.result, '*')
assert.equal(oddGame.userSide, 'white')
const oddChapter = cleanOpeningProgress({ 'london/x': { mastery: 'abc', studied: 'no', drillsCompleted: 'x', lastPracticed: 5 } })['london/x']
assert.deepEqual([oddChapter.mastery, oddChapter.studied, oddChapter.drillsCompleted, oddChapter.lastPracticed], [0, false, 0, ''])
const oddLesson = cleanTacticsProgress({ fork: { solvedExerciseIds: 'abcdef', completedAt: 5 } }).fork
assert.deepEqual([oddLesson.solvedExerciseIds, oddLesson.completedAt], [[], undefined])
const oddProfile = cleanProfile({ name: 'A'.repeat(500), selfRating: -5, appTheme: 'green', boardTheme: 'green', pieceSet: 'old', zenMode: 'yes' })
assert.deepEqual(
  [oddProfile.name.length, oddProfile.selfRating, oddProfile.appTheme, oddProfile.boardTheme, oddProfile.pieceSet, oddProfile.zenMode],
  [40, 100, 'ocean', 'ocean', 'classic', false],
)
const upsideDown = cleanEstimate({ elo: 1200, low: 1400, high: 1000 })
assert.deepEqual([upsideDown?.low, upsideDown?.high], [1000, 1400])

// Streaks: consecutive local days count, a gap breaks the run, and today may still be empty.
const dayIso = (offset: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12).toISOString()
const streakDays = practiceDays({
  games: cleanGames([-1, -2, -3, -5, -6, -7, -8].map((d) => ({ id: `g${d}`, date: dayIso(d), source: 'app' }))),
  puzzleStats: cleanPuzzleStats(null),
  openingProgress: {},
  tacticsProgress: {},
})
assert.equal(currentStreak(streakDays, now), 3)
assert.equal(longestStreak(streakDays), 4)
// Across the end of summer time (25 Oct 2026 in Denmark) and across a new year the days still join up.
const run = (from: Date, length: number) =>
  new Set(Array.from({ length }, (_, i) => dayKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + i))))
assert.equal(longestStreak(run(new Date(2026, 9, 20), 10)), 10)
assert.equal(longestStreak(run(new Date(2026, 11, 28), 8)), 8)
assert.equal(longestStreak(run(new Date(2027, 2, 25), 6)), 6)
assert.equal(currentStreak(run(new Date(2026, 9, 20), 10), new Date(2026, 9, 29, 23, 30)), 10)

console.log('sanitize.check: all good')
