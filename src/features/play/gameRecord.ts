// Turning a finished game into the record the rest of the app reads (My games, Review, Rating).

import { Chess } from 'chess.js'
import { identifyOpening } from '../../lib/openingName'
import { KEYS, readStored, writeStored } from '../../lib/storage'
import type { GameRecord, Profile, Side } from '../../types'
import { getLevel } from './botLevels'
import { getCourse } from '../../data/openings'
import { START_FEN } from './position'
import { getTimeControl } from './timeControls'
import type { GameConfig, Outcome } from './types'

const MAX_SAVED_GAMES = 200

export function botDisplayName(levelId: string): string {
  const level = getLevel(levelId)
  return level.id === 'max' ? 'Bot (full strength)' : `Bot ~${level.elo}`
}

/** "Caro-Kann Defense: Advance Variation" if we know it, otherwise the course being practised. */
export function openingNameFor(config: GameConfig, sans: string[]): string | undefined {
  const found = sans.length > 0 && config.startFen === START_FEN ? identifyOpening(sans) : null
  if (found) return found.name
  return config.courseId ? getCourse(config.courseId)?.name : undefined
}

const TERMINATION: Record<Outcome['reason'], string> = {
  checkmate: 'Normal',
  stalemate: 'Normal',
  threefold: 'Normal',
  fifty: 'Normal',
  material: 'Normal',
  resign: 'Normal',
  agreed: 'Normal',
  timeout: 'Time forfeit',
}

export function buildRecord(config: GameConfig, ucis: string[], outcome: Outcome, profile: Profile): GameRecord {
  const level = getLevel(config.levelId)
  const userName = profile.name.trim() || 'Player'
  const botName = botDisplayName(config.levelId)
  const white = config.userSide === 'white' ? userName : botName
  const black = config.userSide === 'white' ? botName : userName

  const game = new Chess(config.startFen)
  for (const u of ucis) game.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
  const sans = game.history()
  const openingName = openingNameFor(config, sans)
  const date = new Date(config.startedAt)
  const pad = (n: number) => String(n).padStart(2, '0')

  const botSide: Side = config.userSide === 'white' ? 'black' : 'white'
  game.setHeader('Event', 'Chess Coach game')
  game.setHeader('Site', 'Chess Coach')
  game.setHeader('Date', `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`)
  game.setHeader('White', white)
  game.setHeader('Black', black)
  game.setHeader('Result', outcome.result)
  game.setHeader(botSide === 'white' ? 'WhiteElo' : 'BlackElo', String(level.elo))
  game.setHeader('TimeControl', getTimeControl(config.timeId).pgn)
  game.setHeader('Termination', TERMINATION[outcome.reason])
  game.setHeader('BotElo', String(level.elo))
  if (openingName) game.setHeader('Opening', openingName)
  if (config.courseId) game.setHeader('CourseId', config.courseId)

  return {
    id: config.id,
    date: config.startedAt,
    source: 'app',
    pgn: game.pgn(),
    white,
    black,
    whiteElo: botSide === 'white' ? level.elo : undefined,
    blackElo: botSide === 'black' ? level.elo : undefined,
    userSide: config.userSide,
    result: outcome.result,
    openingName,
    botElo: level.elo,
    courseId: config.courseId,
  }
}

/** Newest first, last 200 kept. Saving the same game twice just replaces it. */
export function saveRecord(record: GameRecord) {
  const old = readStored<GameRecord[]>(KEYS.games, [])
  writeStored(KEYS.games, [record, ...old.filter((g) => g.id !== record.id)].slice(0, MAX_SAVED_GAMES))
}
