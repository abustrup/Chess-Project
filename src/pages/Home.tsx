import { useMemo } from 'react'
import { DEFAULT_PROFILE, type GameRecord, type RatingEstimate } from '../types'
import { KEYS, useStored } from '../lib/storage'
import { OPENING_COURSES } from '../data/openings'
import { TACTIC_LESSONS } from '../data/tactics'
import Hero from '../features/home/Hero'
import StreakBadge from '../features/home/StreakBadge'
import ContinueCard from '../features/home/ContinueCard'
import TodaysPlan from '../features/home/TodaysPlan'
import OpeningsProgress from '../features/home/OpeningsProgress'
import RatingCard from '../features/home/RatingCard'
import PuzzleCard from '../features/home/PuzzleCard'
import RecentGames from '../features/home/RecentGames'
import { NO_GAMES, NO_OPENING_PROGRESS, NO_PUZZLE_STATS, NO_TACTICS_PROGRESS } from '../features/home/defaults'
import {
  buildContinue,
  buildPlan,
  currentStreak,
  lastWeek,
  longestStreak,
  newestFirst,
  practiceDays,
  summariseCourse,
  summarisePuzzles,
  unfinishedGameMoves,
} from '../features/home/progress'
import '../features/home/home.css'

// The Play page keeps a game that is still going under this (private) key; we only read how far it got.
const UNFINISHED_GAME_KEY = 'play.current'
const RECENT_GAMES = 5

/** Home dashboard: greeting, "pick up where you left off", today's plan and an overview of progress. */
export default function Home() {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const [storedGames] = useStored<GameRecord[]>(KEYS.games, NO_GAMES)
  const [openingProgress] = useStored(KEYS.openingProgress, NO_OPENING_PROGRESS)
  const [tacticsProgress] = useStored(KEYS.tacticsProgress, NO_TACTICS_PROGRESS)
  const [puzzleStats] = useStored(KEYS.puzzleStats, NO_PUZZLE_STATS)
  const [estimate] = useStored<RatingEstimate | null>(KEYS.ratingEstimate, null)
  const [unfinishedGame] = useStored<unknown>(UNFINISHED_GAME_KEY, null)

  // "Today" is fixed when the page opens; that is accurate enough for a dashboard.
  const now = useMemo(() => new Date(), [])

  const games = useMemo(() => newestFirst(Array.isArray(storedGames) ? storedGames : NO_GAMES), [storedGames])
  const summaries = useMemo(
    () => OPENING_COURSES.map((course) => summariseCourse(course, openingProgress)),
    [openingProgress],
  )
  const puzzles = useMemo(() => summarisePuzzles(puzzleStats, now), [puzzleStats, now])

  const days = useMemo(
    () => practiceDays({ games, puzzleStats, openingProgress, tacticsProgress }),
    [games, puzzleStats, openingProgress, tacticsProgress],
  )
  const streak = currentStreak(days, now)

  const plan = useMemo(
    () => buildPlan({ summaries, lessons: TACTIC_LESSONS, tacticsProgress, puzzles, games, now }),
    [summaries, tacticsProgress, puzzles, games, now],
  )
  const next = useMemo(
    () =>
      buildContinue({
        courses: OPENING_COURSES,
        summaries,
        progress: openingProgress,
        unfinishedMoves: unfinishedGameMoves(unfinishedGame),
        now,
      }),
    [summaries, openingProgress, unfinishedGame, now],
  )

  const isNewPlayer = days.size === 0 && games.length === 0

  return (
    <div className="page home">
      <header className="home-hero">
        <Hero name={profile.name} now={now} isNewPlayer={isNewPlayer} />
        {days.size > 0 && <StreakBadge streak={streak} best={longestStreak(days)} week={lastWeek(days, now)} />}
      </header>

      <ContinueCard target={next} />
      <TodaysPlan items={plan} />
      <OpeningsProgress summaries={summaries} />

      <div className="grid cols-2 zen-hide">
        <RatingCard estimate={estimate} selfRating={profile.selfRating} />
        <PuzzleCard summary={puzzles} />
      </div>

      <RecentGames games={games.slice(0, RECENT_GAMES)} now={now} />
    </div>
  )
}
