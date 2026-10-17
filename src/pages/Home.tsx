import { useMemo } from 'react'
import { DEFAULT_PROFILE } from '../types'
import { KEYS, useStored } from '../lib/storage'
import { OPENING_COURSES } from '../data/openings'
import { useStudyGate } from '../lib/studyGate'
import Hero from '../features/home/Hero'
import StreakBadge from '../features/home/StreakBadge'
import ContinueCard from '../features/home/ContinueCard'
import TodaysPlan from '../features/home/TodaysPlan'
import StudyCard from '../features/home/StudyCard'
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
import {
  cleanEstimate,
  cleanGames,
  cleanProfile,
  cleanOpeningProgress,
  cleanPuzzleStats,
  cleanTacticsProgress,
} from '../features/home/sanitize'
import { BACKUP_LOG_KEY, cleanBackupLog, studyCardModel } from '../features/home/study'
import { useStudyVerdict } from '../features/home/useStudyVerdict'
import { useSafetyToday } from '../features/home/useSafetyToday'
import '../features/home/home.css'

// The Play page keeps a game that is still going under this (private) key; we only read how far it got.
const UNFINISHED_GAME_KEY = 'play.current'
const RECENT_GAMES = 5

/** Home dashboard: greeting, "pick up where you left off", today's plan, the study's progress and an overview. */
export default function Home() {
  const [storedProfile] = useStored<unknown>(KEYS.profile, DEFAULT_PROFILE)
  const profile = useMemo(() => cleanProfile(storedProfile), [storedProfile])
  const [storedGames] = useStored<unknown>(KEYS.games, NO_GAMES)
  const [storedOpenings] = useStored<unknown>(KEYS.openingProgress, NO_OPENING_PROGRESS)
  const [storedTactics] = useStored<unknown>(KEYS.tacticsProgress, NO_TACTICS_PROGRESS)
  const [storedPuzzles] = useStored<unknown>(KEYS.puzzleStats, NO_PUZZLE_STATS)
  const [storedEstimate] = useStored<unknown>(KEYS.ratingEstimate, null)
  const [unfinishedGame] = useStored<unknown>(UNFINISHED_GAME_KEY, null)
  const [storedBackups, setBackups] = useStored<unknown>(BACKUP_LOG_KEY, null)
  // The study count: renders at once from the last known value, then checks Lichess in the background.
  const gate = useStudyGate()
  const verdict = useStudyVerdict(gate.eligibleGames)

  // "Today" is fixed when the page opens; that is accurate enough for a dashboard.
  const now = useMemo(() => new Date(), [])
  // Today's Safety-check positions once the trainer is open; null while it is locked, so the plan stays H1's.
  const safety = useSafetyToday(gate.unlocked, now)

  // Saved data can be old or damaged: clean it first so one bad value never breaks the whole page.
  const openingProgress = useMemo(() => cleanOpeningProgress(storedOpenings), [storedOpenings])
  const tacticsProgress = useMemo(() => cleanTacticsProgress(storedTactics), [storedTactics])
  const puzzleStats = useMemo(() => cleanPuzzleStats(storedPuzzles), [storedPuzzles])
  const estimate = useMemo(() => cleanEstimate(storedEstimate), [storedEstimate])
  const games = useMemo(() => newestFirst(cleanGames(storedGames)), [storedGames])
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

  const plan = useMemo(() => buildPlan({ puzzleStats, games, now, safety }), [puzzleStats, games, now, safety])
  const next = useMemo(
    () =>
      buildContinue({
        courses: OPENING_COURSES,
        summaries,
        progress: openingProgress,
        unfinishedMoves: unfinishedGameMoves(unfinishedGame),
        now,
        // a finished Safety check hands "start here" on to the next step; while locked this is always plan[0]
        firstStep: plan.find((item) => item.id !== 'safety' || !item.done),
        safety,
      }),
    [summaries, openingProgress, unfinishedGame, now, plan, safety],
  )
  const study = useMemo(
    () => studyCardModel(gate, verdict, cleanBackupLog(storedBackups), now),
    [gate, verdict, storedBackups, now],
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
      <StudyCard
        model={study}
        now={now}
        onBackupDownloaded={(game, at) => setBackups((prev: unknown) => ({ ...cleanBackupLog(prev), [game]: at }))}
      />
      <OpeningsProgress summaries={summaries} />

      <div className="grid cols-2 zen-hide">
        <RatingCard estimate={estimate} selfRating={profile.selfRating} />
        <PuzzleCard summary={puzzles} />
      </div>

      <RecentGames games={games.slice(0, RECENT_GAMES)} now={now} />
    </div>
  )
}
