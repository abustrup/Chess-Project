// Who made the pieces this app is built from. The same list is written out in docs/CREDITS.md.
// (Piece-set credits are not here: they come from PIECE_SETS in lib/pieceSets.tsx, so new sets show up by themselves.)

export interface Credit {
  name: string
  /** What it does for this app, in plain words. */
  use: string
  licence: string
  url: string
}

export const CREDITS: Credit[] = [
  {
    name: 'Stockfish',
    use: 'The chess engine. It plays against you, gives hints and checks your games.',
    licence: 'GPL-3.0',
    url: 'https://stockfishchess.org/',
  },
  {
    name: 'Stockfish.js by Nathan Rugg',
    use: 'Lets Stockfish run inside your browser (WebAssembly), so nothing is sent anywhere.',
    licence: 'GPL-3.0',
    url: 'https://github.com/nmrugg/stockfish.js',
  },
  {
    name: 'Lichess openings database',
    use: 'The names of openings, such as "Caro-Kann Defence: Advance Variation".',
    licence: 'CC0 (public domain)',
    url: 'https://github.com/lichess-org/chess-openings',
  },
  {
    name: 'Lichess puzzle database',
    use: 'All the puzzles you solve.',
    licence: 'CC0 (public domain)',
    url: 'https://database.lichess.org/#puzzles',
  },
  {
    name: 'chess.js',
    use: 'Knows the rules of chess: which moves are legal, check, checkmate and draws.',
    licence: 'BSD-2-Clause',
    url: 'https://github.com/jhlywa/chess.js',
  },
  {
    name: 'react-chessboard',
    use: 'Draws the board and lets you drag the pieces.',
    licence: 'MIT',
    url: 'https://github.com/Clariity/react-chessboard',
  },
  {
    name: 'ts-fsrs',
    use: 'Decides when each Safety-check position comes back: the next day after a miss, otherwise days or weeks later.',
    licence: 'MIT',
    url: 'https://github.com/open-spaced-repetition/ts-fsrs',
  },
  {
    name: 'React and React Router',
    use: 'The foundations of the app itself.',
    licence: 'MIT',
    url: 'https://react.dev/',
  },
  {
    name: 'Lucide icons',
    use: 'The small icons on buttons and menus.',
    licence: 'ISC',
    url: 'https://lucide.dev/',
  },
  {
    name: 'Inter and Fraunces fonts',
    use: 'The letters you are reading (via Fontsource).',
    licence: 'SIL Open Font Licence 1.1',
    url: 'https://fontsource.org/',
  },
]

/** Chess Coach itself. It contains Stockfish, so it is released under the same licence. */
export const APP_LICENCE = {
  name: 'Chess Coach',
  licence: 'GPL-3.0',
  url: 'https://www.gnu.org/licenses/gpl-3.0.html',
}
