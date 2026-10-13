// Friendly names and one-line explanations for the puzzle themes we ship.
// Used only by scripts/build-puzzles.ts; the app reads the finished text from public/puzzles/index.json.
//
// A theme that is not listed here is NOT shipped (it is too rare, too advanced, or not useful for a ~1100 player).

export interface ThemeInfo {
  label: string
  /** One sentence a beginner understands. */
  description: string
  /** Heading the puzzles page can group the theme under. */
  group: string
}

const TACTICS = 'Tactics'
const MATES = 'Checkmates'
const ATTACK = 'Attack and defence'
const ENDGAMES = 'Endgames'
const GOALS = 'Game phase and goals'
export const OPENINGS_GROUP = 'Your openings'

/** Order here = order in the index (and so on the puzzles page). */
export const THEME_INFO: Record<string, ThemeInfo> = {
  // ---- Tactics -------------------------------------------------------
  fork: {
    label: 'Forks',
    description: 'Fork — one piece attacks two or more enemy pieces at once, so your opponent can only save one.',
    group: TACTICS,
  },
  pin: {
    label: 'Pins',
    description: 'Pin — an enemy piece cannot move (or should not) because a more valuable piece sits behind it.',
    group: TACTICS,
  },
  skewer: {
    label: 'Skewers',
    description: 'Skewer — you attack a valuable piece; when it moves away, you win the piece behind it.',
    group: TACTICS,
  },
  discoveredAttack: {
    label: 'Discovered attacks',
    description: 'Discovered attack — you move one piece out of the way and uncover an attack from the piece behind it.',
    group: TACTICS,
  },
  doubleCheck: {
    label: 'Double check',
    description: 'Double check — two pieces give check at the same time, so the king has to move.',
    group: TACTICS,
  },
  xRayAttack: {
    label: 'X-ray',
    description: 'X-ray — a piece attacks or defends a square "through" an enemy piece that is standing in the way.',
    group: TACTICS,
  },
  hangingPiece: {
    label: 'Free pieces',
    description: 'Free pieces — an enemy piece is left without enough protection, so you can simply win it.',
    group: TACTICS,
  },
  trappedPiece: {
    label: 'Trapped pieces',
    description: 'Trapped piece — an enemy piece has no safe square to go to, so you can win it.',
    group: TACTICS,
  },
  capturingDefender: {
    label: 'Removing the defender',
    description: 'Removing the defender — take or chase away the piece that protects something, then win what it was guarding.',
    group: TACTICS,
  },
  deflection: {
    label: 'Deflection',
    description: 'Deflection — force an enemy piece away from an important job, like guarding a square or another piece.',
    group: TACTICS,
  },
  attraction: {
    label: 'Attraction',
    description: 'Attraction — lure an enemy piece (often the king) onto a square where you can hit it.',
    group: TACTICS,
  },
  clearance: {
    label: 'Clearing the way',
    description: 'Clearance — move a piece away on purpose so another one of your pieces can use the square or the line.',
    group: TACTICS,
  },
  interference: {
    label: 'Interference',
    description: 'Interference — put a piece between two enemy pieces to cut the link between them.',
    group: TACTICS,
  },
  intermezzo: {
    label: 'In-between move (zwischenzug)',
    description: 'In-between move — instead of the move everyone expects, you first play a surprising check or threat.',
    group: TACTICS,
  },
  quietMove: {
    label: 'Quiet move',
    description: 'Quiet move — a calm move with no check and no capture that sets up a threat the opponent cannot stop.',
    group: TACTICS,
  },

  // ---- Checkmates ----------------------------------------------------
  mateIn1: {
    label: 'Mate in 1',
    description: 'Mate in 1 — you can checkmate the king with your very next move.',
    group: MATES,
  },
  mateIn2: {
    label: 'Mate in 2',
    description: 'Mate in 2 — you checkmate the king in two moves, whatever your opponent does in between.',
    group: MATES,
  },
  mateIn3: {
    label: 'Mate in 3',
    description: 'Mate in 3 — you checkmate the king in three moves, whatever your opponent does in between.',
    group: MATES,
  },
  backRankMate: {
    label: 'Back-rank mate',
    description: 'Back-rank mate — a rook or queen checkmates a king that is stuck behind its own pawns on the edge row.',
    group: MATES,
  },
  smotheredMate: {
    label: 'Smothered mate',
    description: 'Smothered mate — a knight checkmates a king that is completely surrounded by its own pieces.',
    group: MATES,
  },
  arabianMate: {
    label: 'Arabian mate',
    description: 'Arabian mate — a rook and a knight team up to checkmate a king in the corner.',
    group: MATES,
  },
  anastasiaMate: {
    label: "Anastasia's mate",
    description: "Anastasia's mate — a knight and a rook trap the king against the edge of the board.",
    group: MATES,
  },
  bodenMate: {
    label: "Boden's mate",
    description: "Boden's mate — two bishops on crossing diagonals checkmate a king boxed in by its own pieces.",
    group: MATES,
  },
  hookMate: {
    label: 'Hook mate',
    description: 'Hook mate — a rook, a knight and a pawn work together to checkmate the king.',
    group: MATES,
  },
  doubleBishopMate: {
    label: 'Two-bishop mate',
    description: 'Two-bishop mate — both of your bishops cover the escape squares and deliver checkmate.',
    group: MATES,
  },

  // ---- Attack and defence -------------------------------------------
  sacrifice: {
    label: 'Sacrifices',
    description: 'Sacrifice — you give up material on purpose to get something bigger back, like a winning attack.',
    group: ATTACK,
  },
  attackingF2F7: {
    label: 'Attack on f2/f7',
    description: 'Attack on f2/f7 — the squares next to the king at the start of the game (f2 for White, f7 for Black) are the weakest.',
    group: ATTACK,
  },
  exposedKing: {
    label: 'Exposed king',
    description: 'Exposed king — the enemy king has little cover around it, which makes attacks against it strong.',
    group: ATTACK,
  },
  kingsideAttack: {
    label: 'Attack on the kingside',
    description: 'Kingside attack — you go after an enemy king that has castled on the short side, near the h-file.',
    group: ATTACK,
  },
  queensideAttack: {
    label: 'Attack on the queenside',
    description: 'Queenside attack — you go after an enemy king that has castled on the long side, near the a-file.',
    group: ATTACK,
  },
  defensiveMove: {
    label: 'Finding the defence',
    description: 'Defence — your opponent is threatening something, and you must find the move that keeps you safe.',
    group: ATTACK,
  },
  zugzwang: {
    label: 'Zugzwang',
    description: 'Zugzwang — it is your opponent\'s turn, and every move they can make makes their position worse.',
    group: ATTACK,
  },

  // ---- Endgames ------------------------------------------------------
  endgame: {
    label: 'Endgames (mixed)',
    description: 'Endgame — only a few pieces are left, so every single move counts.',
    group: ENDGAMES,
  },
  pawnEndgame: {
    label: 'Pawn endgames',
    description: 'Pawn endgame — only kings and pawns are left, so it is all about pawns and king moves.',
    group: ENDGAMES,
  },
  rookEndgame: {
    label: 'Rook endgames',
    description: 'Rook endgame — rooks (and pawns) are the only pieces left besides the kings.',
    group: ENDGAMES,
  },
  bishopEndgame: {
    label: 'Bishop endgames',
    description: 'Bishop endgame — bishops (and pawns) are the only pieces left besides the kings.',
    group: ENDGAMES,
  },
  knightEndgame: {
    label: 'Knight endgames',
    description: 'Knight endgame — knights (and pawns) are the only pieces left besides the kings.',
    group: ENDGAMES,
  },
  queenEndgame: {
    label: 'Queen endgames',
    description: 'Queen endgame — queens (and pawns) are the only pieces left besides the kings.',
    group: ENDGAMES,
  },
  advancedPawn: {
    label: 'Advanced pawns',
    description: 'Advanced pawn — a pawn that is close to the last row can decide the game.',
    group: ENDGAMES,
  },
  promotion: {
    label: 'Promotion',
    description: 'Promotion — push a pawn to the last row and turn it into a queen or another strong piece.',
    group: ENDGAMES,
  },

  // ---- Game phase and goals -----------------------------------------
  opening: {
    label: 'Opening tactics',
    description: 'Opening tactics — tricks that come up in the first moves of the game.',
    group: GOALS,
  },
  middlegame: {
    label: 'Middlegame tactics',
    description: 'Middlegame tactics — tricks in the busy part of the game, when most pieces are still on the board.',
    group: GOALS,
  },
  crushing: {
    label: 'Punish the mistake',
    description: 'Punish the mistake — your opponent just slipped, so find the move that wins big.',
    group: GOALS,
  },
  advantage: {
    label: 'Get an advantage',
    description: 'Advantage — find the move that leaves you clearly better.',
    group: GOALS,
  },
}

/** The three openings the user studies. Key = course id (same as in src/data/openings). */
export const OPENING_INFO: Record<string, { label: string; description: string }> = {
  london: {
    label: 'London System puzzles',
    description: 'Puzzles from real games that began like your London System (White plays d4 and Bf4).',
  },
  'caro-kann': {
    label: 'Caro-Kann Defence puzzles',
    description: 'Puzzles from real games that began like your Caro-Kann Defence (Black answers e4 with ...c6).',
  },
  slav: {
    label: 'Slav Defence puzzles',
    description: 'Puzzles from real games that began like your Slav Defence (Black answers d4 and c4 with ...d5 and ...c6).',
  },
}

/** Lichess tags that describe the puzzle's length or source, not what you should learn. They are not shipped. */
export const NOISE_TAGS = new Set([
  'short',
  'long',
  'veryLong',
  'oneMove',
  'master',
  'masterVsMaster',
  'superGM',
])
