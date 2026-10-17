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
  /** App colour scheme: 'ocean' (cool blue, default) or 'ember' (warm). */
  appTheme: 'ocean' | 'ember'
  /** One of the ids in lib/themes.ts BOARD_THEMES */
  boardTheme: string
  /** One of the ids in lib/pieceSets.ts PIECE_SETS */
  pieceSet: string
  /** Zen mode: hides everything except the board and the essential controls. */
  zenMode: boolean
  soundOn: boolean
  showLegalMoves: boolean
}

export const DEFAULT_PROFILE: Profile = {
  name: 'Player',
  lichessUsername: '',
  selfRating: 1100,
  appTheme: 'ocean',
  boardTheme: 'ocean',
  pieceSet: 'classic',
  zenMode: false,
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

/* ------------------------------------------------------------------ */
/* Safety check (the study's trainer, src/features/safety/)            */
/* ------------------------------------------------------------------ */

// public/data/safety/cards.json, written by scripts/safety/build_cards.py. The exact format, with every rule, is
// scripts/safety/cards.schema.json; only the fields the app reads are named here.

/** An engine evaluation from WHITE's point of view, like Lichess: centipawns or a forced mate (mate > 0 = White mates). */
export type SafetyEval = { cp: number; mate?: undefined } | { mate: number; cp?: undefined }

export type SafetyKind = 'own' | 'held' | 'quiet'
export type SafetyPiece = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

export interface SafetyTopMove {
  uci: string
  san: string
  /** The trainee's win% (0..100) on Lichess's "Learn from your mistakes" scale after this move. */
  win: number
  eval: SafetyEval
  /** Engine line starting with this move; pv[1..] is the opponent's answer. */
  pv: string[]
}

/**
 * Held and quiet cards: one legal move, as the card builder's safety rule needs it (scripts/safety/build_cards.py,
 * move_entry). A move within 4 points of the best carries only its eval; any other also its settled line (starting with
 * the move), the material he gives away along it (null when the line still ends mid-exchange) and `safe`: under 15
 * points lost, no mate against him, and under 2 points of material given away.
 */
export interface SafetyMoveEntry {
  uci: string
  eval: SafetyEval
  line?: string[]
  gain?: number | null
  safe?: boolean
}

/** "What there was to see": facts computed and re-checked by the card builder, turned into sentences by facts.ts. */
export type SafetyFact =
  | {
      t: 'threat'
      reply: string
      line: string[]
      lineSan: string[]
      wins?: { piece: SafetyPiece; square: string }
      mateIn?: number
      gain?: number
    }
  | {
      t: 'allowed'
      move: string
      reply: string
      line: string[]
      lineSan: string[]
      wins?: { piece: SafetyPiece; square: string }
      mateIn?: number
      gain?: number
    }
  | { t: 'free'; piece: SafetyPiece; square: string; line: string[]; lineSan: string[]; gain: number }
  | { t: 'quiet' }

export interface SafetyCard {
  /** 'own:<gameId>:<ply>' and the like */
  id: string
  kind: SafetyKind
  /** own cards: the my-games category of the mistake; 'held' and 'quiet' otherwise */
  cls: string
  /** The position BEFORE the opponent's last move. */
  fenBefore: string
  /** The opponent's last move (UCI); after it the trainee is to move. */
  lastMove: string
  lastMoveSan: string
  side: Side
  phase: 'opening' | 'middlegame' | 'endgame'
  facingThreat: boolean
  nothingToWin: boolean
  /** His win% before the move was 75 or more. */
  wasWinning: boolean
  winBefore: number
  /** Up to 5 moves, best first. */
  top: SafetyTopMove[]
  /** True when the last `top` move already fails the 4-point rule, so any move outside `top` fails at once. */
  topComplete: boolean
  /** Held and quiet cards: every legal move, so each is decided from stored data (right when within 4 points or safe). */
  moves?: SafetyMoveEntry[]
  /** The move he played in the game. */
  human: {
    uci: string
    san: string
    win: number
    eval: SafetyEval
    passes: boolean
    judgment: 'Inaccuracy' | 'Mistake' | 'Blunder' | null
    lichessJudgment: 'Inaccuracy' | 'Mistake' | 'Blunder' | null
    drop: number
  }
  threat: { loss: number; material: number; mateIn: number | null; real: boolean; line: string[]; lineSan: string[] } | null
  facts: SafetyFact[]
  context: {
    gameId: string
    date: string // YYYY-MM-DD
    tc: string // '600+0'
    speed: string
    rated: boolean
    moveNumber: number
    clockMs: number | null
    spentMs: number | null
  }
}

export interface SafetyCardFile {
  version: 1
  generatedAt: string
  pipeline: string
  source: string
  cards: SafetyCard[]
}

/** KEYS.safetyState: the review schedule of one card (ts-fsrs's card, with dates as ISO text). */
export interface StoredSafetyCard {
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: 0 | 1 | 2 | 3
  last_review?: string
  /** Answered right after 14 days or more: it has left the queue for good. */
  retired?: string
}
export type SafetyState = Record<string, StoredSafetyCard>

/** KEYS.safetyLog: one row per answer, newest last. */
export interface SafetyAttempt {
  cardId: string
  at: string
  /** The move he confirmed (UCI); missing when he looked at the answer first. */
  move?: string
  ok: boolean
  /** Win% points lost against the best move; null when only "worse than the 5th best" is known. */
  loss: number | null
  /** The line he wrote on what he checked (2..140 characters; empty when he looked at the answer first). */
  checked: string
  msToMove: number
  msToWrite: number
  /** 1 Again, 2 Hard, 3 Good: only on the first answer of the day, which is the one that moves the schedule. */
  grade?: 1 | 2 | 3
  shownAnswer: boolean
  /** first answer of the day, the repeat at the end of a session after a miss, or a retry after a miss */
  how: 'first' | 'repeat' | 'retry'
  /** how the verdict was reached: in the stored top moves, the game move, outside a complete list, the browser engine,
   *  or (held and quiet cards) the stored list of every legal move */
  by?: 'top' | 'game' | 'complete' | 'engine' | 'moves'
}

/** KEYS.safetySettings */
export interface SafetySettings {
  newPerDay: number
  maxReviews: number
  /** A right answer slower than this counts as Hard. */
  slowMs: number
}
export const DEFAULT_SAFETY_SETTINGS: SafetySettings = { newPerDay: 10, maxReviews: 10, slowMs: 90_000 }

/** KEYS.safetyDay: today's queue, so a reload keeps the order and what is left. */
export interface SafetyDay {
  /** local date, YYYY-MM-DD */
  date: string
  /** first answers planned today, in order */
  ids: string[]
  /** which of `ids` were new cards when planned */
  newIds: string[]
  /** cards whose first answer today is done */
  done: string[]
  /** missed today: shown once more at the end of the session (no schedule change) */
  repeats: string[]
  repeatsDone: string[]
  /** [newPerDay, maxReviews] the plan was made with */
  caps: [number, number]
}
