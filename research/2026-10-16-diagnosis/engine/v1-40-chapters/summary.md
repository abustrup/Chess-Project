# Deep engine check of the opening courses

Generated 2026-10-16T13:40:04Z by `scripts/deep-check-openings/check.py` (started 2026-10-16T13:30:13Z).
Engine searches behind these numbers were made between 2026-10-16T11:25:14Z and 2026-10-16T13:40:04Z (re-runs reuse earlier searches).
Nothing in the course files was changed.

## What was checked

- 1443 taught moves: every position in the three courses where you are to move and the course teaches a move (the first move listed there). 1 other move(s) listed for you as an alternative.
- 72 opponent moves the courses mark ?!, ? or ??.
- 309 line ends (the last position of each line).
- Local engine: Stockfish 19, 3,000,000 nodes per search, MultiPV 3, Threads 4, Hash 1024 MB. Anything flagged or near a threshold was searched again at 30,000,000 nodes, and anything where that result and the cloud still disagreed, at 150,000,000 nodes.
- Second opinion: Lichess cloud evaluation (positions stored on lichess.org, searched by volunteers' engines; the entries used here have a median depth of 30 (range 14-200), against a median of 19 for the local verdicts).
- Loss = how much worse the move is than the engine's best move, for the side making it, in centipawns (cp, 1/100 of a pawn) and in Lichess win-chance points (0 to 100 scale, the formula Lichess uses for its own inaccuracy / mistake / blunder labels at 5 / 10 / 15 points).

## Headline

- Taught moves that lose more than 50 cp or more than 5 win-chance points by the deep local engine: **9 of 1443 (1%)**; the Lichess cloud agrees on 6 of them.
- Of those, flagged at every local depth that was run and by the cloud: 4. The others sit close to the 50 cp line, where depth changes the verdict. On the 7 items searched a third time, the loss moved by a median of 32 cp (largest 89 cp) between the two deepest searches.
- Largest loss of any taught move at the deepest local search: 117 cp; largest win-chance loss: 7.5 points. Taught moves Lichess would label a mistake (10+ points) or blunder (15+): 0.
- Flagged by the cloud only (the deep local engine did not confirm): 0.
- Opponent moves marked as mistakes that lose less than 40 cp by the deep local engine: **2 of 72 (3%)**; cloud agrees on 1.
- Lines that end with you 50 cp or more worse: 1 of 309 (0%).
- Positions where two chapters teach different moves: 20.

## How close the taught moves are to the engine's choice, per course

| Course | Taught moves | Engine's top move (or equal) | Loss 0-20 cp | Loss 21-50 cp | Loss over 50 cp or 5 pts | Median loss (cp) |
|---|---|---|---|---|---|---|
| London (you play White) | 457 | 291 of 457 (64%) | 411 | 38 | 8 (95% range 1-3%) | 0 |
| Caro-Kann (you play Black) | 557 | 416 of 557 (75%) | 531 | 25 | 1 (95% range 0-1%) | 0 |
| Slav (you play Black) | 429 | 305 of 429 (71%) | 411 | 18 | 0 (95% range 0-1%) | 0 |

The 95% range treats the course as a sample of the moves an AI author would write; for the course itself the count is exact.

## 1. Taught moves that lose more than 50 cp or 5 win-chance points

Sorted by course, then by size of the win-chance loss. 'Deepest local loss' is the local Stockfish at the deepest search that was run for that item (the confirmation or, where engine and cloud disagreed, the tie-break). When you are still clearly winning after the taught move, a large cp loss costs little (the win-chance loss shows that). A flag is a reason to look, not automatically a reason to change: some simple moves are chosen on purpose. The 'Lichess label' is what Lichess's own analysis would call the move.

### Caro-Kann (you play Black)

| Line (taught move last) | Engine prefers | Loss at each local depth | Deepest local loss | Lichess label | Cloud loss | Verdict | Same at every depth and in cloud? | Your eval after the taught move | Chapter(s) |
|---|---|---|---|---|---|---|---|---|---|
| 1. e4 c6 2. d4 d5 3. f3 dxe4 4. fxe4 e5 5. dxe5 Qh4+ 6. Kd2 Bg4 | Qf4+ | 51 / 54 cp (3M/30M nodes) | 54 cp / 4.8 pts (depth 24) | ok | 59 cp / 5.3 pts (depth 29) | engine and cloud agree | yes | +63 cp | caro-kann/fantasy |
### London (you play White)

| Line (taught move last) | Engine prefers | Loss at each local depth | Deepest local loss | Lichess label | Cloud loss | Verdict | Same at every depth and in cloud? | Your eval after the taught move | Chapter(s) |
|---|---|---|---|---|---|---|---|---|---|
| 1. d4 d5 2. Bf4 Nf6 3. e3 e6 4. Nf3 Bd6 5. Bg3 O-O 6. Nbd2 c5 7. c3 Nc6 8. Bd3 Ne4 9. Nxe4 dxe4 10. Bxe4 cxd4 11. exd4 | Nxd4 | 73 / 67 / 117 cp (3M/30M/150M nodes) | 117 cp / 7.5 pts (depth 30) | inaccuracy | 42 cp / 3.4 pts (depth 22) | engine only (cloud disagrees) | no | +281 cp | london/classic-pyramid |
| 1. d4 d5 2. Bf4 Nc6 3. e3 Nf6 4. Nf3 Bf5 5. Bb5 e6 6. O-O | Ne5 | 67 / 73 cp (3M/30M nodes) | 73 cp / 6.6 pts (depth 27) | inaccuracy | 78 cp / 7.1 pts (depth 28) | engine and cloud agree | yes | +18 cp | london/vs-nc6-e5 |
| 1. d4 Nf6 2. Bf4 g6 3. Nf3 Bg7 4. e3 O-O 5. h3 d6 6. Be2 Nbd7 7. O-O e5 8. Bh2 | dxe5 | 66 / 63 cp (3M/30M nodes) | 63 cp / 5.8 pts (depth 26) | inaccuracy | 51 cp / 4.7 pts (depth 28) | engine and cloud agree | yes | +11 cp | london/vs-kings-indian |
| 1. d4 d5 2. Bf4 Nf6 3. e3 Bf5 4. Nf3 Nh5 5. Be5 e6 6. c4 Nd7 7. Nc3 c6 8. Be2 | Qb3 | 52 / 23 / 61 cp (3M/30M/150M nodes) | 61 cp / 5.6 pts (depth 35) | inaccuracy | at least 53 cp / 4.8 pts (depth 26) | engine and cloud agree | no | +14 cp | london/mirror-bf5 |
| 1. d4 b6 2. Nf3 | e4 | 71 / 59 cp (3M/30M nodes) | 59 cp / 5.4 pts (depth 26) | inaccuracy | 64 cp / 5.8 pts (depth 50) | engine and cloud agree | yes | +25 cp | london/keep-calm-weird-moves |
| 1. d4 f5 2. Bf4 Nf6 3. e3 g6 4. Nf3 | h4 | 18 / 20 / 52 cp (3M/30M/150M nodes) | 52 cp / 4.7 pts (depth 30) | ok | 57 cp / 5.2 pts (depth 32) | engine and cloud agree | no | +35 cp | london/vs-dutch |
| 1. d4 d5 2. Bf4 Nf6 3. e3 e6 4. Nf3 Bd6 5. Bd3 Bxf4 6. exf4 c5 7. c3 Nc6 8. O-O | dxc5 | 43 / 55 / 51 cp (3M/30M/150M nodes) | 51 cp / 4.7 pts (depth 36) | ok | 35 cp / 3.2 pts (depth 25) | engine only (cloud disagrees) | no | +0 cp | london/middlegame-plans |
| 1. d4 d5 2. Bf4 Nc6 3. e3 Nf6 4. c3 Bf5 5. Qb3 e6 6. Qxb7 Na5 7. Qxc7 | Qa6 | 51 / 77 / 83 cp (3M/30M/150M nodes) | 83 cp / 4.0 pts (depth 30) | ok | 35 cp / 2.5 pts (depth 24) | engine only (cloud disagrees) | no | +419 cp (still clearly winning) | london/pins-and-pokes |

## 2. Opponent moves marked ?!, ? or ?? that lose less than 40 cp

### Caro-Kann (you play Black)

| Line (marked move last) | Marked | Best for the opponent | Loss at each local depth | Deepest local loss | Cloud loss | Verdict | Same at every depth and in cloud? | Course says |
|---|---|---|---|---|---|---|---|---|
| 1. e4 c6 2. d4 d5 3. f3 dxe4 4. fxe4 e5 5. c3 Qh4+ 6. Ke2 | ?! | Kd2 | 47 / 32 cp (3M/30M nodes) | 32 cp / 2.4 pts | 7 cp / 0.6 pts (depth 28) | engine and cloud agree | no | The king steps forward. |
| 1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. Bd3 Qxd4 7. Bxg6 | ?! | N1e2 | 65 / 44 / 48 cp (3M/30M/150M nodes) | 48 cp / 4.2 pts | 33 cp / 2.9 pts (depth 28) | cloud only (deep engine disagrees) | no | White takes the bishop first. This loses a pawn without a fight, but it is White's most natural try. |
### Slav (you play Black)

| Line (marked move last) | Marked | Best for the opponent | Loss at each local depth | Deepest local loss | Cloud loss | Verdict | Same at every depth and in cloud? | Course says |
|---|---|---|---|---|---|---|---|---|
| 1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. Bg5 | ?! | cxd5 | 45 / 37 cp (3M/30M nodes) | 37 cp / 3.4 pts | not in cloud | engine only (no cloud data) | no | White's bishop attacks your knight on f6, but it does not help White win back the c4-pawn after you take it. |

## 3. All marked opponent moves: the course's mark against Lichess's own label (deep engine)

| Marked in course | Lichess label by deep engine | Count |
|---|---|---|
| ? | blunder | 26 |
| ? | inaccuracy | 2 |
| ? | mistake | 3 |
| ?! | blunder | 1 |
| ?! | inaccuracy | 19 |
| ?! | mistake | 5 |
| ?! | ok | 4 |
| ?? | blunder | 12 |

## 4. Lines that end with you 50 cp or more worse

| Line | Your eval, deep engine (cp) | Your eval, cloud (cp) | Verdict | Chapter |
|---|---|---|---|---|
| 1. e4 c6 2. d4 d5 3. e5 Bf5 4. g4 Bg6 5. Ne2 e6 6. Nbc3 c5 7. h4 cxd4 8. Nxd4 h5 9. Bb5+ | -106 | -78 | engine and cloud agree | caro-kann/advance-pawn-storms |

## 5. Positions where chapters teach different moves

| Position (FEN) | Moves taught (loss cp, chapters) |
|---|---|
| `rnbqk2r/ppp2ppp/3bpn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq - 2 5` | Bg3 (0 cp; london/bishop-harassment, london/classic-pyramid); Bd3 (6 cp; london/middlegame-plans) |
| `rnbqkb1r/pp3ppp/4pn2/2pp4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq - 0 5` | c3 (0 cp; london/classic-pyramid, london/vs-c5-benoni-style); Nbd2 (0 cp; london/knight-first-move-orders) |
| `r1b1kb1r/pp3ppp/1qn1pn2/2pp4/3P1B2/1QP1P3/PP1N1PPP/R3KBNR w KQkq - 0 7` | Ngf3 (0 cp; london/early-c5); Be2 (6 cp; london/early-c5) |
| `r1bqkb1r/ppp1pppp/2n2n2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq - 1 4` | c3 (20 cp; london/pins-and-pokes); Nf3 (0 cp; london/vs-nc6-e5) |
| `r1bqkbnr/ppp2ppp/2n5/3pp3/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq - 0 4` | dxe5 (0 cp; london/pins-and-pokes); Bxe5 (16 cp; london/vs-nc6-e5) |
| `rn1qkb1r/pb1p1ppp/1p2pn2/2p5/3P1B2/3BPN2/PPP2PPP/RN1QK2R w KQkq - 0 6` | O-O (1 cp; london/knight-first-move-orders); c3 (4 cp; london/keep-calm-weird-moves, london/knight-first-move-orders) |
| `rnbqkb1r/pp2pppp/5n2/3p4/3P1B2/8/PPP2PPP/RN1QKBNR w KQkq - 0 5` | Nf3 (0 cp; london/knight-first-move-orders); c3 (3 cp; london/vs-c5-benoni-style) |
| `r2qkb1r/pp2pppp/2n2n2/3p4/3P1Bb1/2P2N2/PP3PPP/RN1QKB1R w KQkq - 1 7` | Qb3 (0 cp; london/knight-first-move-orders); Nbd2 (7 cp; london/vs-c5-benoni-style) |
| `r1q1kb1r/pp3ppp/2n1pn2/3p4/3P1Bb1/1QPB1N2/PP1N1PPP/R3K2R b KQkq - 3 9` | Be7 (0 cp; caro-kann/exchange-others); Bh5 (0 cp; caro-kann/exchange-others) |
| `r1bqkb1r/pp2pppp/2n2n2/3p4/2PP4/2N2N2/PP3PPP/R1BQKB1R b KQkq - 2 6` | e6 (38 cp; caro-kann/two-knights); Bg4 (0 cp; caro-kann/accelerated-panov) |
| `rnbqkbnr/pp2pppp/2p5/8/3PN3/8/PPP2PPP/R1BQKBNR b KQkq - 0 4` | Bf5 (8 cp; caro-kann/classical-h4, caro-kann/classical-quiet, caro-kann/two-knights); Nf6 (0 cp; slav/other-second-moves) |
| `r1bqkb1r/pp2pppp/2n5/3n4/3P4/2N2N2/PP3PPP/R1BQKB1R b KQkq - 0 7` | Bg4 (3 cp; caro-kann/accelerated-panov); e6 (28 cp; caro-kann/accelerated-panov) |
| `rnbqkb1r/pp2pppp/5n2/3p4/2PP4/2N5/PP3PPP/R1BQKBNR b KQkq - 2 5` | Nc6 (0 cp; caro-kann/accelerated-panov); e6 (5 cp; caro-kann/panov) |
| `r2qk1nr/pp1nbpp1/4p1b1/1B1pP1B1/3N1PQP/2N5/PPP5/R3K2R b KQkq - 0 12` | Bxg5 (28 cp; caro-kann/advance-nc3); Bh5 (0 cp; caro-kann/advance-nc3) |
| `rn1qkb1r/pp3ppp/2p1pnb1/3p4/2PP4/3BPN2/PPQ2PPP/RNB2RK1 b kq - 1 7` | Nbd7 (1 cp; slav/slow-slav); Bxd3 (0 cp; slav/vs-colle-catalan) |
| `rnbqkb1r/pp2pppp/2p2n2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R b KQkq - 3 4` | dxc4 (1 cp; slav/krause-ne5, slav/main-slav, slav/slav-accepted); e6 (0 cp; slav/semi-slav-bridge) |
| `rn1qkbnr/pp3ppp/2p1p3/3p1b2/2PP4/2N1PN2/PP3PPP/R1BQKB1R b KQkq - 1 5` | Nd7 (2 cp; slav/vs-colle-catalan); Be7 (0 cp; slav/third-move-sidelines) |
| `rn1qkbnr/pp3ppp/2p1p3/3p4/2PP4/3QPN2/PP3PPP/RNB1K2R b KQkq - 0 6` | Be7 (0 cp; slav/vs-colle-catalan); Nf6 (0 cp; slav/third-move-sidelines) |
| `rn1qk2r/pp2bpp1/2p1pn1p/3p1b2/2PP4/2N3P1/PP1NPPBP/R1BQ1RK1 b kq - 4 8` | O-O (0 cp; slav/vs-colle-catalan); Nbd7 (6 cp; slav/move-four-sidelines) |
| `r2qkb1r/pppnpppp/5nb1/6B1/3Pp3/2N3N1/PPP1QPPP/R3KB1R b KQkq - 9 7` | e6 (0 cp; slav/other-second-moves); h6 (13 cp; slav/other-second-moves) |

## 6. How much the two sources agree (a noise check)

Cloud coverage of the taught moves:

- has cloud result: 803 of 1443 (56%)
- not looked up (rate limit): 500 of 1443 (35%)
- not stored on Lichess: 130 of 1443 (9%)
- stored, but the move's own eval was not found: 10 of 1443 (1%)
- Marked opponent moves with a cloud result: 58 of 72 (81%)
- Line ends with a cloud result: 123 of 309 (40%)

- Taught moves with a cloud loss: 793 of 1443 (55%).
- Same flag (flagged or not) from both sources: 790 of 793 (100%).
- Same best move: 590 of 793 (74%).
- Difference in loss between the sources: median 0 cp, 90th percentile 9 cp.
- Items searched a third time (7): confirmation vs tie-break loss differs by median 32 cp, max 89 cp.
- Items searched twice locally (83): pass 1 vs confirmation loss differs by median 9 cp, max 188 cp.

## What this check cannot tell you

- The engine's best move is not always the best move for a 1000-1300 player. Whether a line is practical at your level is a separate check against human games (Lichess database results), not this one.
- It tests moves, not sentences. Claims in the comments such as 'this wins a pawn' need their own check.
- Stockfish with 4 threads gives slightly different numbers each run; items near a threshold can flip.

## Re-run

`.venv/bin/python scripts/deep-check-openings/check.py` from the repo root, then this summary is rewritten by `.venv/bin/python scripts/deep-check-openings/summarize.py`. Exact settings are in `results.json` under `settings`. See `scripts/deep-check-openings/README.md`.
