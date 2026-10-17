# Credits and licences

Chess Coach is free and non-commercial. It is built on the work of the people and projects below. Thank you!
The same list is shown inside the app under **Settings → Credits and licences** (the code for it is `src/features/home/settings/credits.ts`).

## This app

Chess Coach is released under the **GNU General Public License v3.0 (GPL-3.0)**, because it contains Stockfish. See [`LICENSE`](../LICENSE).

## Chess engine

| What | Used for | Licence | Link |
|---|---|---|---|
| **Stockfish** | Plays against you, gives hints, checks your games | GPL-3.0 | https://stockfishchess.org/ |
| **Stockfish.js** by Nathan Rugg (the WebAssembly build in `public/engine/`) | Runs Stockfish inside the browser | GPL-3.0 | https://github.com/nmrugg/stockfish.js |

## Data

| What | Used for | Licence | Link |
|---|---|---|---|
| **Lichess openings database** | Names of openings, e.g. "Caro-Kann Defence: Advance Variation" (`src/data/eco.json`) | CC0 (public domain) | https://github.com/lichess-org/chess-openings |
| **Lichess puzzle database** | All puzzles (`public/puzzles/`) | CC0 (public domain) | https://database.lichess.org/#puzzles |

Games imported from Lichess are read through Lichess's public API. They stay in your browser only.

## Code libraries

| What | Used for | Licence | Link |
|---|---|---|---|
| **chess.js** | The rules of chess | BSD-2-Clause | https://github.com/jhlywa/chess.js |
| **react-chessboard** | Drawing the board, dragging pieces (also the built-in "Classic" pieces) | MIT | https://github.com/Clariity/react-chessboard |
| **React** and **React Router** | The app itself | MIT | https://react.dev/ |
| **Vite** | Building the website | MIT | https://vite.dev/ |
| **Lucide** | Icons | ISC | https://lucide.dev/ |
| **ts-fsrs** | Decides when each Safety-check position comes back: the next day after a miss, otherwise days or weeks later | MIT | https://github.com/open-spaced-repetition/ts-fsrs |

## Fonts

| What | Licence | Link |
|---|---|---|
| **Inter** | SIL Open Font Licence 1.1 | https://rsms.me/inter/ (served through Fontsource) |
| **Fraunces** | SIL Open Font Licence 1.1 | https://github.com/undercasetype/Fraunces (served through Fontsource) |

## Piece sets

The author and licence of every piece set you can choose in Settings are listed in [`pieces-credits.md`](pieces-credits.md). The app shows the same credits next to each set (`credit` in `src/lib/pieceSets.tsx`).
