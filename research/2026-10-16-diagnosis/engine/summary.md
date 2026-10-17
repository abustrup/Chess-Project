# Deep engine check of the opening courses

Generated 2026-10-16T17:12:32Z by `scripts/deep-check-openings/check.py` (started 2026-10-16T17:12:32Z).
Engine searches behind these numbers were made between 2026-10-16T11:25:14Z and 2026-10-16T16:25:07Z (re-runs reuse earlier searches).
Nothing in the course files was changed.

## What was checked

- 441 taught moves: every position in the three courses where you are to move and the course teaches a move (the first move listed there). 0 other move(s) listed for you as an alternative.
- 15 opponent moves the courses mark ?!, ? or ??.
- 150 line ends (the last position of each line).
- Local engine: Stockfish 19 (every search read from the cache), 3,000,000 nodes per search, MultiPV 3, Threads 2, Hash 512 MB. Anything flagged or near a threshold was searched again at 30,000,000 nodes, and anything where that result and the cloud still disagreed, at 150,000,000 nodes.
- Second opinion: Lichess cloud evaluation (positions stored on lichess.org, searched by volunteers' engines; the entries used here have a median depth of 42 (range 17-75), against a median of 19 for the local verdicts).
- Loss = how much worse the move is than the engine's best move, for the side making it, in centipawns (cp, 1/100 of a pawn) and in Lichess win-chance points (0 to 100 scale, the formula Lichess uses for its own inaccuracy / mistake / blunder labels at 5 / 10 / 15 points).

## Headline

- Taught moves that lose more than 50 cp or more than 5 win-chance points by the deep local engine: **3 of 441 (1%)**; the Lichess cloud agrees on 2 of them.
- Of those, flagged at every local depth that was run and by the cloud: 1. The others sit close to the 50 cp line, where depth changes the verdict. On the 1 items searched a third time, the loss moved by a median of 32 cp (largest 32 cp) between the two deepest searches.
- Largest loss of any taught move at the deepest local search: 59 cp; largest win-chance loss: 5.4 points. Taught moves Lichess would label a mistake (10+ points) or blunder (15+): 0.
- Flagged by the cloud only (the deep local engine did not confirm): 0.
- Opponent moves marked as mistakes that lose less than 40 cp by the deep local engine: **0 of 15 (0%)**; cloud agrees on 0.
- Lines that end with you 50 cp or more worse: 0 of 150 (0%).
- Positions where two chapters teach different moves: 0.

## How close the taught moves are to the engine's choice, per course

| Course | Taught moves | Engine's top move (or equal) | Loss 0-20 cp | Loss 21-50 cp | Loss over 50 cp or 5 pts | Median loss (cp) |
|---|---|---|---|---|---|---|
| London (you play White) | 155 | 93 of 155 (60%) | 140 | 12 | 3 (95% range 1-6%) | 0 |
| Caro-Kann (you play Black) | 183 | 140 of 183 (77%) | 177 | 6 | 0 (95% range 0-2%) | 0 |
| Slav (you play Black) | 103 | 71 of 103 (69%) | 103 | 0 | 0 (95% range 0-4%) | 0 |

The 95% range treats the course as a sample of the moves an AI author would write; for the course itself the count is exact.

## 1. Taught moves that lose more than 50 cp or 5 win-chance points

Sorted by course, then by size of the win-chance loss. 'Deepest local loss' is the local Stockfish at the deepest search that was run for that item (the confirmation or, where engine and cloud disagreed, the tie-break). When you are still clearly winning after the taught move, a large cp loss costs little (the win-chance loss shows that). A flag is a reason to look, not automatically a reason to change: some simple moves are chosen on purpose. The 'Lichess label' is what Lichess's own analysis would call the move.

### London (you play White)

| Line (taught move last) | Engine prefers | Loss at each local depth | Deepest local loss | Lichess label | Cloud loss | Verdict | Same at every depth and in cloud? | Your eval after the taught move | Chapter(s) |
|---|---|---|---|---|---|---|---|---|---|
| 1. d4 b6 2. Nf3 | e4 | 71 / 59 cp (3M/30M nodes) | 59 cp / 5.4 pts (depth 26) | inaccuracy | 64 cp / 5.8 pts (depth 50) | engine and cloud agree | yes | +25 cp | london/keep-calm-weird-moves |
| 1. d4 f5 2. Bf4 Nf6 3. e3 g6 4. Nf3 | h4 | 18 / 20 / 52 cp (3M/30M/150M nodes) | 52 cp / 4.7 pts (depth 30) | ok | 57 cp / 5.2 pts (depth 32) | engine and cloud agree | no | +35 cp | london/vs-dutch |
| 1. d4 g6 2. Bf4 | e4 | 48 / 51 cp (3M/30M nodes) | 51 cp / 4.7 pts (depth 29) | ok | not in cloud | engine only (no cloud data) | no | +8 cp | london/vs-kings-indian |

## 2. Opponent moves marked ?!, ? or ?? that lose less than 40 cp

None.

## 3. All marked opponent moves: the course's mark against Lichess's own label (deep engine)

| Marked in course | Lichess label by deep engine | Count |
|---|---|---|
| ? | blunder | 2 |
| ? | inaccuracy | 1 |
| ? | mistake | 1 |
| ?! | inaccuracy | 9 |
| ?! | mistake | 1 |
| ?? | blunder | 1 |

## 4. Lines that end with you 50 cp or more worse

None.

## 5. Positions where chapters teach different moves

None.

## 6. How much the two sources agree (a noise check)

Cloud coverage of the taught moves:

- has cloud result: 275 of 441 (62%)
- not looked up (rate limit): 161 of 441 (37%)
- not stored on Lichess: 5 of 441 (1%)
- Marked opponent moves with a cloud result: 12 of 15 (80%)
- Line ends with a cloud result: 77 of 150 (51%)

- Taught moves with a cloud loss: 275 of 441 (62%).
- Same flag (flagged or not) from both sources: 275 of 275 (100%).
- Same best move: 203 of 275 (74%).
- Difference in loss between the sources: median 0 cp, 90th percentile 7 cp.
- Items searched a third time (1): confirmation vs tie-break loss differs by median 32 cp, max 32 cp.
- Items searched twice locally (27): pass 1 vs confirmation loss differs by median 10 cp, max 48 cp.

## What this check cannot tell you

- The engine's best move is not always the best move for a 1000-1300 player. Whether a line is practical at your level is a separate check against human games (Lichess database results), not this one.
- It tests moves, not sentences. Claims in the comments such as 'this wins a pawn' need their own check.
- Stockfish with 4 threads gives slightly different numbers each run; items near a threshold can flip.

## Re-run

`.venv/bin/python scripts/deep-check-openings/check.py` from the repo root, then this summary is rewritten by `.venv/bin/python scripts/deep-check-openings/summarize.py`. Exact settings are in `results.json` under `settings`. See `scripts/deep-check-openings/README.md`.
