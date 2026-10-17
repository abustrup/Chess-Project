// The locked Home (study gate closed) for a fixed set of situations, drawn as HTML: today's plan and the Continue
// card. Build plan H2 says the locked Home must stay exactly as H1 left it, so progress.check.ts compares this with
// locked-home.snapshot.json, which was written from H1's code before H2 changed anything. These calls use only what
// H1 already had (no trainer arguments), so the same file runs on both versions.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import type { GameRecord, OpeningCourse, OpeningProgress, PuzzleStats } from '../../../types'
import { NO_PUZZLE_STATS } from '../defaults'
import { buildContinue, buildPlan, summariseCourse } from '../progress'
import ContinueCard from '../ContinueCard'
import TodaysPlan from '../TodaysPlan'

const NOW = new Date('2026-10-20T19:00:00')
const at = (dayOffset: number, hour = 12) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + dayOffset, hour).toISOString()

function solved(themes: string[], day = 0): PuzzleStats {
  return {
    ...NO_PUZZLE_STATS,
    history: themes.map((theme, i) => ({ date: at(day, 9), puzzleId: `p${i}`, solved: true, puzzleRating: 1000, ratingAfter: 1000, theme })),
  }
}

const studyGameToday: GameRecord = {
  id: 'snapshot1',
  date: at(0, 10),
  source: 'lichess',
  pgn:
    '[Event "Rated Rapid game"]\n[White "abustrup"]\n[Black "Opponent"]\n[Result "1-0"]\n[Variant "Standard"]\n' +
    '[TimeControl "600+0"]\n[WhiteRatingDiff "+6"]\n[BlackRatingDiff "-6"]\n\n1. e4 e5 2. Nf3 Nc6 1-0\n',
  white: 'abustrup',
  black: 'Opponent',
  userSide: 'white',
  result: '1-0',
}

// A made-up course, so changes to the real opening courses (build plan O1) never move this snapshot.
const COURSE: OpeningCourse = {
  id: 'demo',
  name: 'Demo Opening',
  side: 'white',
  tagline: 'A course that exists only in this check.',
  signatureMoves: ['e4'],
  ecoNames: [],
  overview: [],
  keyIdeas: [],
  commonMistakes: [],
  chapters: [
    { id: 'one', title: 'First chapter', summary: '', difficulty: 1, pgn: '1. e4 e5' },
    { id: 'two', title: 'Second chapter', summary: '', difficulty: 1, pgn: '1. e4 c5' },
  ],
}
const PRACTISED: OpeningProgress = {
  'demo/one': {
    courseId: 'demo',
    chapterId: 'one',
    studied: true,
    drillsCompleted: 1,
    drillMistakes: 0,
    bestStreak: 1,
    mastery: 0.4,
    lastPracticed: at(-1),
  },
}

interface Situation {
  puzzleStats?: PuzzleStats
  games?: GameRecord[]
  progress?: OpeningProgress
  unfinishedMoves?: number | null
  dayOffset?: number
}

const SITUATIONS: Record<string, Situation> = {
  'new player': {},
  'three puzzles solved today': { puzzleStats: solved(['fork', 'fork', 'hangingPiece']) },
  'puzzles and a rated 10+0 game done today': {
    puzzleStats: solved(['hangingPiece', 'fork', 'defensiveMove', 'fork', 'hangingPiece']),
    games: [studyGameToday],
  },
  'an unfinished game against the computer': { unfinishedMoves: 12 },
  'an opening chapter practised yesterday': { progress: PRACTISED },
  'the next day': { dayOffset: 1 },
  'the day after': { dayOffset: 2 },
}

/** name -> the HTML of today's plan and the Continue card, as the locked Home draws them. */
export function lockedHomeHtml(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [name, s] of Object.entries(SITUATIONS)) {
    const now = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + (s.dayOffset ?? 0), NOW.getHours())
    const plan = buildPlan({ puzzleStats: s.puzzleStats ?? NO_PUZZLE_STATS, games: s.games ?? [], now })
    const progress = s.progress ?? {}
    const next = buildContinue({
      courses: [COURSE],
      summaries: [summariseCourse(COURSE, progress)],
      progress,
      unfinishedMoves: s.unfinishedMoves ?? null,
      now,
      firstStep: plan[0],
    })
    out[name] = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(ContinueCard, { target: next }), createElement(TodaysPlan, { items: plan })),
    )
  }
  return out
}
