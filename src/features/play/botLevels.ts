// The computer opponent's levels.
//
// We do NOT use Stockfish's own "limit strength" mode. Instead we ask Stockfish for its best few
// moves (a quick, shallow search) and then pick one of them the way a person might: usually a good
// one, sometimes a slightly worse one, now and then an oversight. That feels much more like playing
// a human than an engine that suddenly drops its queen at random.
//
// The Elo numbers are only APPROXIMATE (they are our own scale, tuned by playing the levels against
// each other and against Stockfish's built-in limited-strength mode). Don't treat them as exact.

export interface BotLevel {
  id: string
  name: string
  /** Approximate strength, shown to the player. */
  elo: number
  /** One friendly sentence for the setup screen. */
  blurb: string
  /** How the engine looks for candidate moves. */
  search: {
    depth: number // how many moves ahead it looks (small = short-sighted)
    multipv: number // how many candidate moves it considers
    movetime: number // safety limit in ms so a search never takes too long
  }
  /** In centipawns (100 = a pawn). Higher = picks weaker candidates more often. */
  temperature: number
  /** Never picks a candidate that is worse than the best one by more than this (centipawns). */
  maxLoss: number
  /** Chance (0..1) of a plain oversight: a random one of the candidate moves. */
  oversight: number
  /** What the level always avoids, however unlucky the dice. */
  safety: 'none' | 'mate' | 'mate-and-queen'
}

export const BOT_LEVELS: BotLevel[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    elo: 700,
    blurb: 'Still learning. Often leaves pieces hanging and misses simple threats.',
    search: { depth: 1, multipv: 8, movetime: 400 },
    temperature: 300,
    maxLoss: 1500,
    oversight: 0.25,
    safety: 'none',
  },
  {
    id: 'casual',
    name: 'Casual',
    elo: 900,
    blurb: 'Plays sensible-looking moves but overlooks a lot of tactics.',
    search: { depth: 1, multipv: 8, movetime: 400 },
    temperature: 240,
    maxLoss: 900,
    oversight: 0.16,
    safety: 'mate-and-queen',
  },
  {
    id: 'club',
    name: 'Club',
    elo: 1100,
    blurb: 'A friendly club player. A fair fight at your level.',
    search: { depth: 1, multipv: 8, movetime: 500 },
    temperature: 150,
    maxLoss: 700,
    oversight: 0.09,
    safety: 'mate-and-queen',
  },
  {
    id: 'improver',
    name: 'Improver',
    elo: 1300,
    blurb: 'Spots most simple tactics. Mistakes are rarer, so keep your pieces safe.',
    search: { depth: 2, multipv: 7, movetime: 600 },
    temperature: 130,
    maxLoss: 550,
    oversight: 0.06,
    safety: 'mate-and-queen',
  },
  {
    id: 'strong',
    name: 'Strong',
    elo: 1600,
    blurb: 'Rarely gives anything away. You will need a real plan to win.',
    search: { depth: 3, multipv: 5, movetime: 700 },
    temperature: 100,
    maxLoss: 450,
    oversight: 0.05,
    safety: 'mate-and-queen',
  },
  {
    id: 'expert',
    name: 'Expert',
    elo: 1900,
    blurb: 'Sharp and careful. Punishes almost every mistake.',
    search: { depth: 5, multipv: 4, movetime: 900 },
    temperature: 50,
    maxLoss: 280,
    oversight: 0.012,
    safety: 'mate-and-queen',
  },
  {
    id: 'max',
    name: 'Max',
    elo: 2500,
    blurb: 'Full-strength Stockfish. Very hard. Great for testing yourself.',
    search: { depth: 16, multipv: 2, movetime: 1200 },
    temperature: 8,
    maxLoss: 30,
    oversight: 0,
    safety: 'mate-and-queen',
  },
]

export function getLevel(id: string): BotLevel {
  return BOT_LEVELS.find((l) => l.id === id) ?? BOT_LEVELS[2]
}

/** The level whose Elo is closest to the player's own rating (used as the default). */
export function levelNearestTo(rating: number): BotLevel {
  return BOT_LEVELS.reduce((best, l) => (Math.abs(l.elo - rating) < Math.abs(best.elo - rating) ? l : best), BOT_LEVELS[2])
}
