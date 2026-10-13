# Piece set credits

Chess Coach is a free, personal, non-commercial project. The extra piece sets in `public/pieces/` come from the
[Lichess](https://lichess.org) project, which collects free chess piece artwork
([`lichess-org/lila`, folder `public/piece`](https://github.com/lichess-org/lila/tree/master/public/piece)).
The licence of each set is taken from Lichess's own list:
[`COPYING.md`](https://github.com/lichess-org/lila/blob/master/COPYING.md).
The same author and licence text is shown in the app next to each set (`credit` in `src/lib/pieceSets.tsx`).

| Name in the app | Folder | Author | Licence | Source |
|---|---|---|---|---|
| **Classic** (default) | built in | the `react-chessboard` library | MIT | https://github.com/Clariity/react-chessboard |
| **Book** | `public/pieces/merida/` | Armando Hernandez Marroquin ("Merida") | GPL-2.0 or later | https://github.com/lichess-org/lila/tree/master/public/piece/merida |
| **Friendly** | `public/pieces/fresca/` | sadsnake1 ("Fresca") | CC BY-NC-SA 4.0 | https://github.com/lichess-org/lila/tree/master/public/piece/fresca |
| **Modern** | `public/pieces/mpchess/` | Maxime Chupin ("MPChess", https://github.com/chupinmaxime) | GPL-3.0 or later | https://github.com/lichess-org/lila/tree/master/public/piece/mpchess |
| **Bold** | `public/pieces/icpieces/` | sadsnake1 ("IC Pieces") | CC BY-NC-SA 4.0 | https://github.com/lichess-org/lila/tree/master/public/piece/icpieces |
| **Letters** | `public/pieces/letter/` | usolando ("Letter", https://lichess.org/@/usolando) | AGPL-3.0 or later | https://github.com/lichess-org/lila/tree/master/public/piece/letter |
| **Warm clay** | `public/pieces/rhosgfx/` | RhosGFX (https://rhosgfx.itch.io/) | CC0 1.0 (public domain) | https://github.com/lichess-org/lila/tree/master/public/piece/rhosgfx |

Licence texts: [GPL-2.0](https://www.gnu.org/licenses/gpl-2.0.txt) ·
[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.txt) ·
[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.txt) ·
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) ·
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## What was changed

- **All sets:** the SVG files were cleaned with `svgo` (smaller files, editor leftovers removed). The drawings look the
  same. Each set is 12 files: `wK wQ wR wB wN wP bK bQ bR bB bN bP`.
- **Letters:** the white pieces were changed so they stay easy to see on light squares (white fill with a thicker black
  outline instead of thin grey), and the picture was cropped a little so the letters are bigger on the board.
  This is a modified version of the original, shared under the same licence (AGPL-3.0 or later).

## Things to know

- **Friendly** and **Bold** are CC BY-NC-SA: free for non-commercial use, with credit, and changes must be shared under
  the same licence. That is fine for a personal learning app. If Chess Coach is ever sold or used commercially,
  remove those two folders and their entries in `PIECE_SETS`.
- Sets that Lichess marks as "free for personal use only", "freeware" or with no clear licence (for example `alpha`,
  `companion`, `leipzig`, `chess7`, `riohacha`) were **not** used.
- The pieces are separate picture files, not program code, so their licences apply to those files only.

## Adding another set later

1. Put the 12 SVG files in `public/pieces/<name>/` (names as above, each with a `viewBox`).
2. Add an entry to `PIECE_SETS` in `src/lib/pieceSets.tsx` with a one-sentence description and the credit.
3. Add a row to the table above.
4. Check it on all 8 board themes: white pieces on light squares and black pieces on dark squares must stay clear.
