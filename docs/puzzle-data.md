# Puzzle data

The Puzzles page uses real puzzles from the **Lichess puzzle database**. This page explains where they come from,
how they get into the app, and how to rebuild them.

## Where the puzzles come from

- Source: the open Lichess puzzle database, <https://database.lichess.org/#puzzles>.
- Licence: **CC0** (public domain). We may copy, change and ship the puzzles for free, and no credit is needed.
  (Giving credit to Lichess is still polite, so the app can say "Puzzles from Lichess" somewhere.)
- The raw download is big (millions of puzzles), so it is **not** in the repository.

## From the database to the browser

```
lichess_db_puzzle.csv.zst          raw download, very large   (scripts/.cache, not in git)
        |  python3 scripts/build-puzzle-cache.py
        v
scripts/.cache/puzzles.jsonl       51,920 popular, well-rated puzzles, balanced by theme and rating
        |  npx tsx scripts/build-puzzles.ts
        v
public/puzzles/                    small JSON files the app loads on demand (this is what ships)
```

### What `build-puzzles.ts` does

1. **Picks** puzzles for every theme (forks, pins, mate in 2 ...) and for the user's three openings.
   Ratings 400 to 2000, with the biggest share between about 700 and 1500 because the player is around 1100.
   Better-liked, more-played puzzles win ties.
2. **Replays every line with chess.js.** All moves must be legal, in order, and the line must have the normal shape
   (the opponent moves first, you move last).
3. **Checks every move you have to find with Stockfish** (first move at depth 12, later moves at depth 10, comparing the two best lines).
   A puzzle is **dropped** when the solution move is clearly worse than the engine's best move.
   "Equally good" means: within 30 centipawns, or within 3% win chance (fairer when you are already winning),
   or the solution mates (any mate counts, because a puzzle should not insist on the shortest one).
4. **Checks the ending.** The line must end in checkmate, or win material, or leave the solver clearly better
   (engine at least +1.2 pawns; for "defence" puzzles, not worse than -1.5 pawns).
5. **Writes the files** and fails loudly if a file is over 350 KB or the folder is over 9 MB.

Stockfish results are saved in `scripts/.cache/puzzle-checks/`, so if the build is stopped it carries on where it
stopped. If you change the checking rules in `scripts/build-puzzles.check.ts`, the saved results are ignored automatically.

### Rebuilding

```bash
# 0. (rarely) refresh the cache: download lichess_db_puzzle.csv.zst into scripts/.cache and run
python3 scripts/build-puzzle-cache.py      # needs: pip install zstandard

# 1. build the shipped files (takes about 10-20 minutes, mostly Stockfish)
npx tsx scripts/build-puzzles.ts

# quick try-out build without the Stockfish check (do NOT ship this one)
npx tsx scripts/build-puzzles.ts --draft

# throw away saved Stockfish results and check everything again
npx tsx scripts/build-puzzles.ts --recheck
```

The script only writes inside `public/puzzles/`. Friendly names and one-line explanations for each theme live in
`scripts/build-puzzles.themes.ts`; edit them there and rebuild (no new Stockfish run is needed for text changes).

## The files

```
public/puzzles/index.json              list of every file below
public/puzzles/themes/<theme>.json     one per theme, e.g. fork.json, mateIn2.json   (about 400 puzzles each)
public/puzzles/openings/<course>.json  london.json, caro-kann.json, slav.json
```

`index.json` follows `PuzzleIndex` in `src/types.ts`. Each entry has `key`, `kind` (`'theme'` or `'opening'`),
`label`, `description`, `count`, `file`, `minRating`, `maxRating`, plus one extra field, `group`
(the heading to show it under: Tactics, Checkmates, Attack and defence, Endgames, Game phase and goals, Your openings).

Each puzzle file is an array of `Puzzle` objects, sorted by rating (easiest first):

```json
{ "id": "xHxom", "fen": "2r5/7R/4kp2/8/4K3/Pn3P2/6PP/8 w - - 0 43", "moves": ["h7b7", "b3c5", "e4d4", "c5b7"], "rating": 1157, "themes": ["crushing", "endgame", "fork"] }
```

- `fen` is the position **before** the opponent's first move. `moves[0]` is the opponent's move, then you play `moves[1]`,
  the opponent answers `moves[2]`, and so on (UCI notation).
- `themes` only lists the themes we ship, so every value is a `key` in the index (use its `label` to show it).
  Lichess "length" and "source" tags (short, long, master ...) are removed.
- `opening` (when present) is the Lichess opening tag, like `Caro-Kann_Defense_Advance_Variation`.

A puzzle can appear in several theme files (a fork that also wins a pinned piece, for example). That is on purpose.

## Using the data in the app

`src/lib/puzzleData.ts` is the only code that should read these files:

- `loadPuzzleIndex()` / `loadPuzzles(entry)`: fetch (with the Vite base path) and cache in memory. Errors are
  `PuzzleLoadError`s whose message can be shown to the player as it is.
- `groupEntries(index)`: the entries grouped under their headings, in order.
- `pickPuzzle(puzzles, { targetRating, excludeIds, window })`: a random puzzle near your rating that you have not seen.
- `puzzleToStart(puzzle)`: plays the opponent's first move and returns `{ startFen, solution, orientation, lastMove, opponentSan }`.

When checking the player's move: it is right if it equals the expected move **or it checkmates** (Lichess does the same,
so mate-in-N puzzles with several mating moves do not mark a correct answer as wrong).

## Honest limits

- Stockfish is checking at a modest depth. It catches puzzles whose answer is clearly wrong; it cannot promise that
  no better, different solution exists in every deep line. Puzzles where the engine found a clearly better first move
  were dropped.
- The opponent's replies inside a line are taken from Lichess as they are.
