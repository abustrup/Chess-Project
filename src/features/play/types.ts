import type { Result, Side } from '../../types'

/* ---------------------------------------------------------------- setup */

export type ColourChoice = Side | 'random'
export type PlayMode = 'free' | 'practice' | 'face'

/** "Surprise me": use every variation of the opening at once. */
export const ANY_CHAPTER = 'any'

/** What the setup screen remembers between visits (localStorage 'cc.play.setup'). */
export interface SetupChoices {
  colour: ColourChoice
  levelId: string
  mode: PlayMode
  courseId: string
  chapterId: string
  timeId: string
  coach: boolean
}

/* ----------------------------------------------------------------- game */

/** Everything that is decided when a game starts and never changes afterwards. */
export interface GameConfig {
  id: string
  userSide: Side
  levelId: string
  mode: PlayMode
  courseId?: string
  chapterId?: string
  /** Position the game started from (the normal start position unless a link asked for another). */
  startFen: string
  timeId: string
  startedAt: string
}

/** The unfinished game that is saved so it can be continued after the tab was closed ('cc.play.current'). */
export interface SavedGame {
  config: GameConfig
  /** Every move played so far, in UCI (e.g. 'e2e4'). */
  ucis: string[]
  /** Milliseconds left on each clock (null when playing without a clock). */
  clock: { w: number; b: number } | null
  hintsUsed: number
  takebacks: number
}

export type EndReason = 'checkmate' | 'stalemate' | 'threefold' | 'fifty' | 'material' | 'resign' | 'timeout' | 'agreed'

export interface Outcome {
  result: Result
  reason: EndReason
}
