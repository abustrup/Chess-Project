# Opening names (ECO data)

The app can say which opening a game is in, for example "Caro-Kann Defense: Advance Variation" (ECO code B12).
This page explains where the names come from and how to rebuild the table.

## Source and licence
- **Lichess openings database**: <https://github.com/lichess-org/chess-openings> (files `a.tsv` to `e.tsv`).
- Licence: **CC0** (public domain), so it is free to use and ship. No account, key or server is needed.
- Each row is `eco`, `name`, `pgn`: one named opening and the moves that lead to it. At the time of writing there are 3,865 rows.

## Files
| File | What it is |
|---|---|
| `src/lib/openingName.ts` | The lookup the app uses. |
| `src/data/eco.json` | The compact table (about 330 KB, about 90 KB gzipped). Generated, do not edit by hand. |
| `scripts/build-eco.ts` | Builds `eco.json` from the Lichess files. |
| `scripts/check-eco.ts` | Checks the lookup against known games. |

## How the lookup works
1. **Positions, not move text.** For every database line the build script replays the moves with `chess.js`
   and stores a fingerprint of the position after each move. The fingerprint (`positionKey`) is a 53-bit hash
   of the EPD (the FEN without the move counters: pieces, side to move, castling rights, en-passant square).
   A short hash keeps the table small; the build fails if two different positions ever get the same key.
2. **Transpositions work.** `identifyOpening(sans)` replays the player's game and looks up the position after
   every move. It returns the **last** (deepest) position that has a name, with `plies` = how many half-moves
   into the game that was. So `1.Nf3 d5 2.d4 Nf6 3.Bf4` is found as "Queen's Pawn Game: London System" (plies 5),
   just like `1.d4 d5 2.Nf3 Nf6 3.Bf4`.
3. **Two lines in the same position.** The database has none today. If a future version has some, the build keeps
   the longer name, then the longer line, then the alphabetically first one, so the result never depends on file order.
4. **Stored in two lists.** `named` = positions at the end of a database line (`[key, eco, name]`).
   `path` = positions the lines pass through that have no name of their own (`key` only). Only `named` is used
   for names; `isBookPosition` accepts both, because a move that follows a known line is still "book".
5. The JSON is imported statically, so every function is **synchronous**. Loading the table takes a few milliseconds.

## API (all in `src/lib/openingName.ts`)
- `identifyOpening(sans)` gives `{ eco, name, plies }` or `null`. Moves are SAN from the start position.
  An illegal move ends the walk (what was found before it still counts).
  Note: every legal first move has a name in the database ("Clemenz Opening" for `1.h3`), so `null` only happens for no moves or an illegal first move.
- `isBookPosition(sans)` is true when the position after the last move is a known opening position
  (named, or on the way to a named one). The empty list counts as book. An illegal move gives false.
- `openingFamily(name)` is the part before the first `:`.
- `courseIdForOpening(name)` gives `'london' | 'caro-kann' | 'slav' | null`, the ids of the three courses.
  It matches whole words only: "London System", "Caro-Kann", "Slav Defense" and "Semi-Slav". This keeps the
  Sicilian "Yugoslav Attack" out of the Slav course. The White-side "Anglo-Slav" and "Slav Indian" setups are not linked to the Slav course.
- `positionKey(fen)` is the fingerprint function. The build script uses it too, so both sides always agree.

## Rebuild the table
```
npx tsx scripts/build-eco.ts                # downloads the five files from GitHub
npx tsx scripts/build-eco.ts path/to/folder # or reads a.tsv ... e.tsv from a local folder (offline)
npx tsx scripts/check-eco.ts                # then run the checks
```
The build prints how many lines it read and the size of the result. The output is sorted, so a rebuild from
the same files gives an identical `eco.json`.

If you ever change `positionKey`, rebuild straight away: the old table would no longer match.
If `src/data/eco.json` is missing, create it first with `{"named":[],"path":[]}` (the build script imports the lookup, which imports the table), then run the build.
