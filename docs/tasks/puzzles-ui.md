# Task: PUZZLES PAGE

**You own:** `src/pages/Puzzles.tsx`, `src/features/puzzles/**`.
Puzzle files are produced concurrently by the puzzles-data builder under `public/puzzles/` (see `PuzzleIndex`/`Puzzle` in `src/types.ts`, and `src/lib/puzzleData.ts` which that builder writes — it exports `loadPuzzleIndex`, `loadPuzzles`, `pickPuzzle`, `puzzleToStart`; until it exists, code against the types and your own tiny fixture, then switch). If `public/puzzles/index.json` is not there yet, wait/poll for it while building the UI against a fixture of 5 hand-made puzzles.

## What to build (`/puzzles`, `/puzzles?theme=<key>`, `/puzzles?opening=<courseId>`)
1. **Trainer**: the main experience. Board + a clear prompt ("Your move — find the best move for White"). The first move (`moves[0]`) is played by the opponent automatically (animated), then the user solves. Correct move → the reply is auto-played, continue until the line ends → "Puzzle solved!" + **Next**. Wrong move → piece snaps back, friendly message, the attempt is a failure (rating drops), user can **retry** (no rating change) or **show solution**.
   Special case: if a different move delivers checkmate, accept it.
   **Hint** (highlight the piece; second press shows the move) — using hints means no rating gain.
2. **Puzzle rating**: Elo-style rating, starts at 1000, K=32 for the first 30 puzzles then 20; puzzle selection near the user's rating (± 100–200) in the chosen theme(s), never repeating a puzzle until the pool is exhausted. Persist in `KEYS.puzzleStats` (`PuzzleStats` in `types.ts`).
3. **Pick what to train**: a theme picker (cards/chips with label + description + count; searchable), "Mixed" (all themes), and **"Puzzles from your openings"** (London / Caro-Kann / Slav). Show the theme(s) of the puzzle **only after** solving (so it isn't a spoiler) — but when the user chooses a theme they know it. Remember last choice.
4. **Stats**: current rating with a small sparkline from `history`, streak/best streak, solved/failed, accuracy per theme (weakest themes highlighted with a "Train this" button). Keep it clean, in a collapsible panel (`zen-hide`).
5. **Puzzle Rush (optional if time allows)**: 3 minutes, as many as you can, wrong answer = strike (3 strikes).
6. Zen mode: board + prompt + feedback + Next/Hint buttons only.
7. Loading/error/empty states (offline, file missing).

## Done when
You solved/failed puzzles in the real browser through Playwright with real data (when it exists), rating math is right (write a tiny node check for the Elo function), stats persist after reload, no console errors, screenshots reviewed (desktop, phone, zen).
