// Shared data shapes ("contracts") used across the whole app.
// Every feature reads/writes data in exactly these shapes, so please don't change them
// without checking who else uses them.

export type Side = 'white' | 'black'
export type Result = '1-0' | '0-1' | '1/2-1/2' | '*'

/* ------------------------------------------------------------------ */
/* Openings (the main teaching feature)                                */
/* ------------------------------------------------------------------ */

/**
 * One opening the user wants to learn, e.g. the London System.
 * Content lives in src/data/openings/<id>.ts and is registered in src/data/openings/index.ts
 */
export interface OpeningCourse {
  id: string // 'london' | 'caro-kann' | 'slav'
  name: string // 'London System'
  /** Which colour the USER plays in this opening. */
  side: Side
  /** Short catchy line shown on cards. */
  tagline: string
  /** The first moves that define the opening, in SAN, e.g. ['d4','d5','Bf4'] */
  signatureMoves: string[]
  /** Lichess/ECO opening names this course covers (used to recognise the opening in games). */
  ecoNames: string[]
  /** Plain-language intro paragraphs: what is it, why play it, what are the plans. */
  overview: string[]
  /** "Big ideas" — short cards, each optionally with a small board diagram. */
  keyIdeas: IdeaCard[]
  /** Typical mistakes people around 1100 make in this opening, and what to do instead. */
  commonMistakes: IdeaCard[]
  /** The variations, ordered easiest -> hardest. */
  chapters: OpeningChapter[]
}

export interface IdeaCard {
  title: string
  /** Plain, friendly language. 1-4 short sentences. */
  text: string
  /** Optional diagram */
  fen?: string
  arrows?: BoardArrow[]
  highlights?: BoardHighlight[]
  orientation?: Side
}

export interface OpeningChapter {
  id: string // unique inside the course, e.g. 'main-line-nf6'
  title: string // 'Main line: ...Nf6 and ...Bf5 by Black'
  /** When does this variation come up? One or two plain sentences. */
  summary: string
  difficulty: 1 | 2 | 3
  /**
   * The repertoire as PGN movetext WITH variations ( ... ) and comments { ... }, starting from the
   * normal start position. The user plays the side given by the course. At every position where it is the
   * user's turn, the FIRST move listed is the move to learn (alternatives in brackets are acceptable
   * alternatives). At positions where the opponent is to move, every listed move is an opponent
   * reply we have prepared for.
   * Comments may contain Lichess-style drawing commands: [%cal Ge2e4,Rb1c3] (arrows) and [%csl Gd4] (squares).
   * Comments should explain the IDEA of the move in plain language.
   */
  pgn: string
}

/* ------------------------------------------------------------------ */
/* Tactics lessons                                                     */
/* ------------------------------------------------------------------ */

export interface BoardArrow {
  from: string
  to: string
  color?: string // css colour or one of 'green' | 'red' | 'yellow' | 'blue'
}
export interface BoardHighlight {
  square: string
  color?: string
}

export interface TacticLesson {
  id: string // 'fork'
  name: string // 'Forks'
  tagline: string
  /** Matching Lichess puzzle theme so we can offer extra practice puzzles, e.g. 'fork', 'discoveredAttack' */
  puzzleTheme?: string
  /** Teaching text blocks shown first, in order. Plain, friendly language. */
  intro: TacticBlock[]
  /** Worked examples the user can step through ("watch how it works"). */
  examples: TacticExample[]
  /** Positions where the user must find the move. */
  exercises: TacticExercise[]
}

export type TacticBlock =
  | { type: 'text'; text: string }
  | { type: 'tip'; text: string }
  | {
      type: 'board'
      fen: string
      caption?: string
      arrows?: BoardArrow[]
      highlights?: BoardHighlight[]
      orientation?: Side
    }

export interface TacticExample {
  title: string
  fen: string
  /** Moves in UCI (e.g. 'e2e4') played one after another to demonstrate the idea. */
  moves: string[]
  /** One short explanation per move (same length as `moves`), plain language. */
  explanations: string[]
  orientation?: Side
}

export interface TacticExercise {
  id: string
  fen: string // user is to move
  /** Correct line in UCI. Index 0 is the user's move, index 1 the reply, index 2 the user's next move, ... */
  solution: string[]
  hint?: string
  explanation: string // shown after solving
  difficulty?: 1 | 2 | 3
}

/* ------------------------------------------------------------------ */
/* Puzzles (Lichess puzzle database subset)                            */
/* ------------------------------------------------------------------ */

/**
 * Same layout as the Lichess puzzle database. `fen` is the position BEFORE the opponent's first move;
 * moves[0] is the opponent's move (it creates the puzzle), then the user plays moves[1], the opponent
 * replies moves[2], and so on. Moves are UCI.
 */
export interface Puzzle {
  id: string
  fen: string
  moves: string[]
  rating: number
  themes: string[]
  /** Lichess opening tag when present, e.g. 'London_System' */
  opening?: string
}

/** public/puzzles/index.json — lists every puzzle file so the app can load them on demand. */
export interface PuzzleIndexEntry {
  /** Lichess theme key (e.g. 'fork') or opening tag (e.g. 'Caro-Kann_Defense') */
  key: string
  kind: 'theme' | 'opening'
  /** Friendly label, e.g. 'Forks' */
  label: string
  /** One plain-language sentence about what the puzzle theme is */
  description?: string
  count: number
  /** Path relative to the site root, e.g. 'puzzles/themes/fork.json' */
  file: string
  minRating: number
  maxRating: number
}
export interface PuzzleIndex {
  generatedAt: string
  source: string
  entries: PuzzleIndexEntry[]
}

/* ------------------------------------------------------------------ */
/* Games, analysis and rating                                          */
/* ------------------------------------------------------------------ */

export interface GameRecord {
  id: string
  date: string // ISO
  source: 'app' | 'lichess' | 'pgn'
  pgn: string
  white: string
  black: string
  whiteElo?: number
  blackElo?: number
  userSide: Side
  result: Result
  /** e.g. 'Caro-Kann Defense: Advance Variation' */
  openingName?: string
  /** If the opponent was the built-in computer, its strength setting. */
  botElo?: number
  /** Which opening course was being practised, if any. */
  courseId?: string
  analysis?: GameAnalysis
}

export type MoveClass = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'book'

export interface AnalysedMove {
  ply: number // 1 = white's first move
  san: string
  uci: string
  fenBefore: string
  fenAfter: string
  /** Evaluation in centipawns from WHITE's point of view (mate scores are converted to +-10000 style). */
  evalBefore: number
  evalAfter: number
  bestUci?: string
  bestSan?: string
  /** Centipawns lost by the player who moved (0 if best). */
  cpLoss: number
  /** Lichess-style 0..100 accuracy of this single move. */
  accuracy: number
  classification: MoveClass
}

export interface GameAnalysis {
  engine: string // 'stockfish-19-lite depth 12'
  depth: number
  moves: AnalysedMove[]
  acpl: { white: number; black: number }
  accuracy: { white: number; black: number }
  analysedAt: string
}

export interface RatingEstimate {
  /** Final blended estimate */
  elo: number
  low: number
  high: number
  gamesUsed: number
  /** Short plain-language reasons / caveats */
  notes: string[]
  /** Pieces that went into the estimate */
  parts: { label: string; elo: number; weight: number }[]
  computedAt: string
}

/* ------------------------------------------------------------------ */
/* Saved profile + progress (localStorage)                             */
/* ------------------------------------------------------------------ */

export interface Profile {
  name: string
  /** Lichess username, used to import the user's games. */
  lichessUsername: string
  /** What the user says their rating currently is (starting point for the estimate). */
  selfRating: number
  boardTheme: 'green' | 'brown' | 'blue' | 'purple'
  soundOn: boolean
  showLegalMoves: boolean
}

export const DEFAULT_PROFILE: Profile = {
  name: 'Player',
  lichessUsername: '',
  selfRating: 1100,
  boardTheme: 'green',
  soundOn: true,
  showLegalMoves: true,
}

/* ------------------------------------------------------------------ */
/* Progress records (stored in localStorage through lib/storage.ts)    */
/* ------------------------------------------------------------------ */

/** KEYS.openingProgress — keyed by `${courseId}/${chapterId}` */
export type OpeningProgress = Record<
  string,
  {
    courseId: string
    chapterId: string
    studied: boolean // walked through the study mode at least once
    drillsCompleted: number // full lines played correctly in drill mode
    drillMistakes: number
    bestStreak: number
    /** 0..1 how well the user knows this chapter (the openings feature decides how to compute it) */
    mastery: number
    lastPracticed: string // ISO date
  }
>

/** KEYS.tacticsProgress — keyed by lesson id */
export type TacticsProgress = Record<
  string,
  {
    lessonId: string
    introSeen: boolean
    examplesSeen: number
    solvedExerciseIds: string[]
    failedAttempts: number
    completedAt?: string // ISO date once every exercise is solved
  }
>

/** KEYS.puzzleStats */
export interface PuzzleStats {
  rating: number // user's puzzle rating, starts at 1000
  solved: number
  failed: number
  streak: number
  bestStreak: number
  history: { date: string; puzzleId: string; solved: boolean; puzzleRating: number; ratingAfter: number; theme?: string }[]
  byTheme: Record<string, { solved: number; failed: number }>
}
