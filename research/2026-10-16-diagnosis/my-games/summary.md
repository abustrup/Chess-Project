# My own games: where the points go

Lichess user abustrup, every game up to 2026-10-16 13:20 CEST. Written 2026-10-16.
Labels: [verified] = computed and re-checked here. [inferred] = follows from the data, with the uncertainty given. [assumed] = taken as given, not checked.

## In short

1. **There is no slow-game baseline yet.** All 31 games are rated blitz: 23 at 5+3, 7 at 3+2 and 1 at 3+0, played 2026-10-10 to 2026-10-15. There are 0 rapid games, so nothing here is measured at 10+0. Lichess's own analysis exists for only 6 of the 31 games. The 3 chess.com games (March 2020, all against one opponent, provisional ratings) cannot be used for anything. [verified]
2. **He blunders more often than his opponents in the same games.** He has 12.5 blunders per 100 of his moves (111 of 891; 95% interval 9.4 to 16.0). His opponents have 9.6 (86 of 897), and 950-1250 blitz players in the Lichess database have about 9.0. His typical game sits near the 60th percentile of that population, so a handful of chaotic games carry much of the excess. [verified counts; the comparison is inferred]
3. **The clearest pattern is the threat check.** A "concrete threat" is one the opponent could carry out if it were his move again, worth 2+ points of material or mate. Facing one, he blundered on 31% of moves (39 of 126). His opponents, in the same games, blundered on 15% of such moves (22 of 144). Without such a threat the two are close: 10% against 8%. This fits the "habit" hypothesis, because the gap is in positions where something had to be defended. [inferred; the difference is 4 to 29 points, 95% game-bootstrap interval]
4. **Openings matter as Black against 1.e4, not as White.**
   - As White (London, 15 games) he was fine at move 12: median win chance 55%, and below 25% in only 1 of 14 games.
   - As Black in the Caro-Kann (11 games) he was below 25% at move 12 in 7 of 10 games (median 15%). He left the app's course himself at move 3 or 4 in 9 of 11 games.
   - The damage before move 12 was mostly hung pieces, a fork, lost pawns and one known bishop trap, around moves 4 to 11. It was not deep theory.
   - He has never met the Slav. In 5 Black games without 1.e4 he played 1...c6 or 1...g6, and no opponent played c4 against ...d5.
   [verified counts; Fisher test 7/10 against 1/14, p = 0.002; the cause is inferred from 7 games]
5. **He lets winning chances go.** In 16 games he reached a 75%+ win chance and failed to win 9 of them (56%; 95% interval 33% to 77%). His opponents in the same games failed to win 6 of 27 (22%), and the 950-1250 population fails in 36%. In 6 of those 9 games the chance vanished on his very next move: he missed the punishing capture, missed a tactic, or hung a piece. [inferred; p = 0.045 against his opponents, p = 0.08 against the population]
6. **He does not blunder by moving fast or by running out of time.**
   - He spends a median 6.6 seconds on his blunders, against 4.0 s on unjudged moves.
   - Only 13% of blunders took 2 s or less, while 22% of all his moves did.
   - 11% of blunders came with under 10% of his clock left, about the same as the 12% share of all moves.
   - He lost 4 of his 22 losses on time.
   [verified]
7. **What "working" will need.** Given how much his blunder rate varies from game to game, detecting a one-third drop in blunders per 100 moves takes about 77 games before and 77 after. A halving takes about 34 games each. Count in games, and expect his first rapid games to become the baseline. [inferred, normal approximation from 30 blitz games]

## The data

| Source | What | Usable? |
|---|---|---|
| Lichess API, lichess_abustrup.ndjson + lichess_abustrup_raw.pgn | 31 rated games, all blitz, with clocks, opening names and Lichess's division; 9 wins, 22 losses, 0 draws; 15 as White, 16 as Black | Yes. 6 of 31 carry Lichess's own computer analysis (XLCmExKA, KC803zNe, YqqVv08X, yXoWmgsR, pEKoVG79, tf4EY5pN). [verified] |
| Lichess profile, 2026-10-16 | blitz 1017 (RD 64); 0 rapid, classical or bullet games; puzzle 2 attempts (provisional) | The rating rests on 31 blitz games, starting from Lichess's provisional 1500. [verified] |
| chess.com API, chesscom_abustrup_2020-03.* | 3 games on 2020-03-22/23, all against the same opponent: a 10-minute game abandoned after about 10 moves, a daily game lost, a 60-minute game won. Ratings 1437 blitz, 1456 rapid, 1064 daily, each with RD above 300 | No. There is no current chess.com rating, so his "real Elo" does not exist in data today. [verified] |
| Lichess database slice, 2026-09 | 3,991 rated games where both players are 950-1250, blitz or rapid, analysed by Lichess. They come from 386,424 games in bytes 15,000,000,000 to 15,125,829,119 (2026-09-16 afternoon UTC) | Yes, as the comparison group, using the same rule and definitions as for his games. Raw games are not kept in the repo. [verified] |

## The hypotheses from the prompt, tested on his games

A "big blunder" is a move that drops his win chance by 30+ points (the research/2026-10-16 definition). A "blunder" follows Lichess's own rule (15+ points). Population figures come from research/2026-10-16 (Lichess evals, 2026-09-01 00-06 UTC) and from this folder's slice (2026-09-16 afternoon), both 950-1250 vs 950-1250.

| Hypothesis | Population 950-1250 | His 31 blitz games | Verdict |
|---|---|---|---|
| 40-50% of big mistakes are one-move safety errors | Research classifier (hung piece, left piece en prise, allowed mate): 38.9% blitz, 41.5% rapid. With missed free material: 47.2%, 50.2% | Same classifier: 11 of 45 = 24% (95% 14% to 39%); 16 of 45 = 36% with missed free material. Engine-checked version (hung piece, executed threat, mate in 3 or less): 20 of 45 = 44% (31% to 59%); 26 of 45 = 58% with missed free material or mate | **Cannot tell.** On the comparable definition he is at or below the population; on the engine-checked one he is in the 40-60% range. With only 45 big blunders the intervals are about 25 points wide. The research classifier misses forks, pins and moves that walk into a threat, which the engine check catches. |
| 17-27% of big mistakes start in the first 12 moves | 23.3% blitz, 26.7% rapid (research); 23.4%, 29.8% (slice) | 10 of 45 = 22% (95% 13% to 36%; game bootstrap 9% to 40%) | **Consistent.** |
| Many lost games start in the first 12 moves | Decisive error in moves 1-12: 31% blitz, 36% rapid. Loser already below 25% at move 12: 27%, 35% | Decisive error in moves 1-12: 6 of 22 losses = 27% (13% to 48%). Below 25% at move 12: 8 of 20 = 40% (22% to 61%), 7 of them as Black in the Caro-Kann | **Consistent overall, but concentrated in one opening** (see below). |
| Much early damage is simple safety, not theory | not measured as such | Of 26 blunders in moves 1-12, 12 show no material swing in the engine lines ("opening-type"; 3 of these lose a pawn). The other 14 are tactical: 4 hung pieces, 4 allowed tactics, 3 missed tactics, 1 executed threat, 1 missed free piece, 1 allowed mate. Of the 10 big ones, 7 are tactical | **Mostly supported for the big early mistakes; small numbers.** [inferred] |
| Won games get thrown away surprisingly often | Had a 90%+ win chance for 3 plies and did not win: 22% blitz, 21% rapid. Reached 75%+ and did not win: 36%, 35% | 90%+ sustained: 3 of 7 not won (43%; 16% to 75%). 75%+: 9 of 16 not won (56%; 33% to 77%). His opponents in the same games: 6 of 27 (22%) | **Supported as a weakness of his, not just of the level.** The interval is wide. [inferred] |
| The Slav comes up in under 10% of Black games | research: under 10% at this level | 0 of 16 Black games reached 1.d4 d5 2.c4 c6. Against 1.d4 he played 1...c6 (2 games) or 1...g6 (1). Opponents answered 1...c6 with 2.Nc3 and 2.e3, which transposed into the course's anti-Slav lines, never 2.c4 | **Consistent: zero Slavs.** [verified] |

## 1. Blunder rate, the baseline for the main measure (blitz only)

- 111 blunders in 891 of his moves = **12.46 per 100** (95% game-bootstrap interval 9.4 to 16.0). He also made 49 mistakes and 71 inaccuracies. [verified]
- Per game, the median is 9.8 per 100 (30 games with 10+ moves). The population per-player-game median for 950-1250 blitz is 8.0, so his median game sits at the 60th percentile. [verified]
- His opponents in the same games (mean rating 1164) had 9.59 per 100. He blundered more than his opponent in 22 games, fewer in 3 and the same in 6. Part of this gap is mechanical: the loser's last blunder usually ends the game, and he lost 22 of 31. [inferred]
- By Lichess's division into game phases:
  - opening phase: 6.4 per 100 (20 of 314)
  - middlegame: 18.8 (63 of 336)
  - endgame: 11.6 (28 of 241)
  - moves 1-12: 7.1 per 100; after move 12: 16.3 per 100
  [verified]
- On the 6 games Lichess analysed, Lichess's own count for him is 32 blunders in 215 moves (14.9 per 100). Our replication finds 34, with 31 in common, and gives the same count as Lichess in 5 of the 6 games. [verified]

## 2. What kind of mistakes (111 blunders)

| Category (one per blunder, first match wins) | Blunders | Big (30+) | In moves 1-12 |
|---|---|---|---|
| Hung or left a piece en prise (the very next move captures and he stays 2+ down) | 16 | 13 | 4 |
| Opponent's threat carried out (the threat existed before his move and the reply executes it) | 10 | 6 | 1 |
| Allowed mate in 3 or less | 2 | 1 | 1 |
| Missed free material (the best move is a capture that nets 2+ more) | 8 | 6 | 1 |
| Allowed a longer tactic (material lost within about 6 plies, or a longer mate) | 20 | 7 | 4 |
| Missed his own tactic | 12 | 5 | 3 |
| Opening-type: moves 1-12, no material swing in the engine lines | 12 | 3 | 12 |
| Other: after move 12, no material swing (positional, endgame technique, king safety beyond the engine lines) | 31 | 4 | 0 |

The big blunders (45) are mostly concrete: 38 of 45 involve material or mate within 8 plies. The 43 blunders with no material swing are mostly moderate drops in balanced positions, where the Lichess rule is most sensitive. These categories come from a heuristic on engine lines and are [inferred]. A read-through of all 48 labels in the five safety, missed-material and tactic categories found them plausible. One rule was tightened after a false positive: a "threat" that matched only by destination square.

## 3. The habit: threats, and what the last move allowed

Method: before each of his moves (when not in check), the engine was asked what the opponent would play if it were the opponent's move again (a "null move" test). A threat counts as real when it is worth 15+ win-chance points and wins 2+ points of material or mates. The same test was run on every opponent move.

| | Him | His opponents, same games |
|---|---|---|
| Moves tested | 748 | 846 |
| Moves facing a real threat | 126 (17%) | 144 (17%) |
| Blundered when facing a real threat | 39 of 126 = **31%** (95% 20% to 42%) | 22 of 144 = **15%** (8% to 23%) |
| Blundered with no real threat | 63 of 622 = 10% (7.5% to 13%) | 59 of 702 = 8% (6% to 12%) |
| Difference, him minus opponents (game bootstrap) | threatened: +4 to +29 points | not threatened: -1 to +4 points |

[inferred] His extra blunders come where something had to be defended. Two caveats:
- One game (B4575r7G) contributes 7 of his 10 "threat carried out" blunders: he ignored the same h-file attack on 7 moves in a row.
- His opponents were rated slightly higher on average: 1164, against his mean pre-game rating of 1149.

The other half of the habit, "what did his opponent's last move allow", shows in the thrown wins. In 6 of the 9 games where he reached 75%+ and did not win, the chance disappeared on his very next move: 3 hung pieces, 2 missed tactics and 1 missed free piece. [inferred]

For the trainer: 39 of his 111 blunders were made while facing a real threat. In 16 of them the best move wins nothing, so they are pure "defend" positions. Both are flagged in mistakes.json (flags.something_to_defend and flags.nothing_to_win).

## 4. Openings

| | Games | Score | Reached move 12 | Median win% at move 12 | Below 25% at move 12 | Who left the course first |
|---|---|---|---|---|---|---|
| White, London course | 15 | 7 wins | 14 | 55% | 1 | opponent 10, him 5 (median move 2) |
| Black vs 1.e4, Caro-Kann course | 11 | 1 win | 10 | 15% | 7 | him 9, opponent 2 (median move 4) |
| Black vs 1.d4, Slav course | 3 | 0 | 2 | 55% | 0 | him 3 (1...c6 or 1...g6 on move 1) |
| Black vs 1.c4 / 1.Nf3 (no course) | 2 | 1 | 2 | 40% | 0 | - |

- He plays the London as White: 1.d4 in all 15 games and Bf4 within his first 4 moves in 13. [verified]
- Opponents left the London course on move 1 in 5 of 15 games (1...g6, 1...e5 twice, 1...c6, 1...e6), because the course has no line for those replies. [verified]
- He plays the Caro-Kann against 1.e4 in 11 of 11 games, but not the course's moves. He deviates at move 3 or 4:
  - 3...Nd7 twice, where the course has 3...Bf5
  - 3...Nf6 twice, where the course has 3...dxe4
  - 3...dxe4 once, where the course has 3...Bg4
  - 4...Bf5 twice, where the course has 4...Nc6
  - 4...Nc6 once, where the course has 4...Bd7
  - 4...e6 once, where the course has 4...h5. That course move avoids the bishop trap (h4, g4, f3) that lost game 11.
  [verified]
- In the 7 Caro-Kann games where he was below 25% at move 12, the decisive early damage was:
  - the bishop trap in the Advance after 4...e6 (game 11)
  - a tactic allowed by 11...Bxe5 (game 13)
  - a hung bishop, 11...e5 (game 14)
  - a missed free knight, 9...Qa5+, then a hung bishop, 10...Bb4 (game 18)
  - a lost pawn plus a weakened position, 11...h6 (game 19)
  - a knight fork allowed by 8...f6 (game 21)
  - a lost pawn, 9...Nd7 (game 28)
  [inferred from 7 games]
- The eval at move 12 and the exact point of leaving the course are in the per-game table at the end and in out/games.json.

## 5. Clock

- Median time per move is 5.1 s (6.2 s at 5+3, 3.1 s at 3+2). The research population's blitz median is 3.0 s, with all blitz time controls mixed. [verified]
- Blunders take a median 6.6 s, against 4.0 s for unjudged moves; the population blitz figure for blunders is 6.0 s. So his blunders are not rushed moves. [verified]
- Time trouble (under 10% of the starting clock): 12 of 111 blunders (11%) and 106 of 891 moves (12%). In the population, 5.9% of blitz blunders happen in time trouble. [verified]
- He lost 4 of 22 losses on time. In the other 18 losses he still had a median 34% of his starting time at the end; population losers have 47%. [verified]

## 6. Rating

- Lichess blitz is 1017 (RD 64) after 31 games. He started at the provisional 1500, and his pre-game rating averaged 1149. He scored 9 of 31 against a mean opponent of 1164, a performance rating of about 1008. [verified]
- There is no Lichess rapid rating and no current chess.com rating. [verified]

## What 31 blitz games cannot tell

- Anything about 10+0. Blunder rates, clock use and opening choices may all differ at rapid. [assumed that they may differ; not testable yet]
- Category shares. With 45 big blunders every share has an interval about 25 points wide, so "40-50% safety errors" can be neither confirmed nor rejected.
- Whether he is above the population on blunders. His pooled rate is above it, but his typical game is not far from it.
- Whether the Caro-Kann problem is the opening or the colour. All 11 Caro-Kanns are also his only Black games against 1.e4.
- Whether his rating is stable. It rests on 31 games from a provisional start.

## What this suggests for training (for the lead to decide)

1. Train the threat check first, on his own positions. The 39 blunders made while facing a real threat, plus the 16 hung pieces, are in mistakes.json with the threat move and line.
2. Train "punish the last move": the 8 missed-free-material and 12 missed-own-tactic blunders, plus the 6 games where a 75%+ chance vanished on the next move.
3. If openings get any time, give it to Black against 1.e4. The problem is the first 10 moves after he leaves the line, not a lack of theory. Cut the London and Slav content he never reaches before adding anything.
4. Build the 10+0 baseline from his first rated rapid games. Given how much his results vary, plan for 30-80 games per period.

## How this was done, so it can be re-checked

1. **Raw games** were fetched on 2026-10-16 at 13:20 CEST from https://lichess.org/api/games/user/abustrup (with clocks, evals, accuracy, opening, division and literate annotations), using a browser-like User-Agent. The chess.com games came from the chess.com public API.
2. **Engine pass** (scripts/engine_eval.py):
   - native Stockfish 19 at 250,000 nodes per position, 1 thread, 64 MB hash, with the hash emptied before every search
   - this makes each result depend only on the position, so it is reproducible: 8 of 8 re-run positions gave identical scores and best moves
   - every position of every game was evaluated for both sides: 1,819 positions
   - plus 1,645 null-move threat tests at 250,000 nodes
3. **Lichess's rule** (scripts/lichess_rule.py):
   - win% = 50 + 50 x (2 / (1 + exp(-0.00368208 x cp)) - 1)
   - Blunder at a 15-point drop, Mistake at 10, Inaccuracy at 5
   - lila's rules for positions with a forced mate
   - no judgement when the move played is the engine's best
   - Applied to Lichess's own evals, it reproduces **428 of 428** Lichess labels in his 6 analysed games. research/2026-10-16 capped centipawn scores at +-1000; that version gets 427 of 428, so the cap is off here. [verified]
4. **Engine setting.** research/2026-10-16 does not record which node count matched Lichess, so it was recalibrated on his 6 analysed games (429 moves, both players).
   - At 250k nodes our Blunder labels match Lichess's with precision 0.92 and recall 0.91 (63 against 64 blunders).
   - On the 2 games also run at 1M nodes (167 moves), agreement was the same within noise. At 1M: 40 shared, 4 ours only, 3 Lichess only. At 250k: 38, 3 and 5.
   - 250k and 1M disagreed on 5 of his 84 moves. The disagreements are moves within a few points of the 15-point line.
   - 1M was too slow on a machine shared by about 8 agents.
   - Details are in calib/calibration_results.txt. [verified]
5. **Longer lines** (scripts/lines.py): for 110 judged moves, mostly those whose printed engine line was shorter than 6 plies, 8-ply lines were rebuilt move by move at 250k nodes.
6. **Categories, statistics and tables** come from scripts/analyse_games.py, scripts/stats.py and scripts/tables.py. The population numbers come from scripts/pop_stream.py and scripts/pop_compare.py.
   - Intervals for simple counts are Wilson intervals.
   - Shares of blunders use a bootstrap that resamples whole games (10,000 draws, seed 20261016), because blunders cluster within games.
   - scripts/rerun.sh re-runs everything.

## Files

- mistakes.json: 163 records (111 Blunders, 49 Mistakes, 3 labelled only by Lichess), one per mistake, for a trainer. Each record has the game, colour, speed, move number, phase and clock; the FEN before the move, his move, and the best move and line; the opponent's punishing line; evals and win chances before and after; Lichess's own label where it exists; the category; the threat before the move; and flags.
- out/ holds:
  - moves.jsonl: all 891 of his moves, with the same fields as mistakes.json
  - opp_moves.jsonl: the opponents' threat tests
  - games.json: per-game facts (where he left the course, win% at move 12, thrown wins)
  - stats.json: every number above
  - population_950_1250.json: the comparison group
  - tables.md: the tables
- engine/ holds sf_250k_bothnull.jsonl (every engine evaluation), lines_250k_all.jsonl, and courses.json (course positions exported from the app by scripts/export_courses.ts).
- calib/ holds the calibration runs at 250k and 1M nodes and the comparison with Lichess.
- The raw files are lichess_abustrup.ndjson, lichess_abustrup_raw.pgn, chesscom_abustrup_2020-03.json and chesscom_abustrup_2020-03.pgn. They contain opponents' public usernames.

## Every game

See out/tables.md (generated by scripts/tables.py). It has one row per game with: game link, colour, time control, his pre-game rating, opponent rating, result, first 6 plies, the ply at which the game left the app's course and who left it first (with any later transposition back), his win% at move 12, his blunders / his moves, and Lichess's own blunder count where Lichess analysed the game.

## Corrections after the independent check (added 2026-10-16)

Everything above is the my-games investigation's text, kept word for word. On 2026-10-16 an independent agent re-derived it
with its own code and a second engine setting (Stockfish 19 at depth 16 instead of 250,000 nodes); its scripts and
outputs are in `../verify-my-games/`, the key numbers in `../verify-my-games/verify_results.json`. The headline counts
all reproduce: his 111 blunders in 891 moves, his opponents' 86 in 897, 10 of 45 big blunders in moves 1-12, thrown
wins 9 of 16 against 6 of 27, and the Caro-Kann below 25% at move 12 in 7 of 10 games against the London in 1 of 14.
Where the text above and this list disagree, this list wins.

1. **The threat gap's lower bound is about +1.5 points, not +4.** Item 3 and section 3 give +4 to +29 points as the 95%
   game-bootstrap range for "him minus his opponents when facing a real threat". With the checker's own code and threat
   definition on the same evaluations (him 35 of 114, opponents 22 of 135) the range is +1.5 to +29.8 points, and +1.3
   to +28.7 at depth 16. The gap shows at all 5 threat thresholds tried, at both settings (him 28-32% against his
   opponents' 15-19%), but the evidence is moderate, not strong. [verified: `../verify-my-games/vmetrics_theirs.json`
   and `vmetrics_mine.json`, both re-run on 2026-10-16 with identical output]
2. **"Opponent's threat carried out" really means "left a real threat standing".** Section 2 counts 10 blunders in that
   category. In all 10 the engine's best reply carries out the threat, but the opponent actually played it in only 3 of
   the 10. [verified: `../verify-my-games/check_ignored_threat.out`]
3. **One game, B4575r7G, weighs heavily.** It gives 6 of those 10 blunders (section 3 says 7) and 9 of the 39 blunders
   he made while facing a real threat (23%), from 11 threatened moves. Without that game his rate on threatened moves is
   26% (30 of 115) instead of 31% (39 of 126), still above his opponents' 15% (22 of 144). [verified: counted from
   `out/moves.jsonl` on 2026-10-16]
4. **His opponents' blunder rate depends on the engine setting: 9.6 to 10.7 per 100 moves.** 9.6 (86 of 897) at this
   folder's 250,000 nodes, 10.7 (96 of 897) at depth 16. In the 6 games Lichess analysed, Lichess's own count of their
   blunders is 32, against 29 at 250,000 nodes and 35 at depth 16. His own rate is 12.5 (111 of 891) at both settings,
   so his excess over his opponents is 1.8 to 2.9 per 100 moves, not a firm 2.9 (item 2's 12.5 against 9.6).
   [verified: `../verify-my-games/check_opp_lichess.out` and `verify_results.json`]
5. **Thrown wins against the population: p = 0.12 two-sided.** The p = 0.08 in item 5 is one-sided (0.077); two-sided
   it is 0.12 (0.116). The comparison with his opponents in the same games, p = 0.045, stands.
   [verified: `../verify-my-games/check_misc.out`]
6. **A halving needs 35 games per period, not 34.** The one-third figure, 77, is right. Both are superseded anyway (point
   9). [verified: `../verify-my-games/check_power.out`]
7. **His performance rating is 995 to 1001, not about 1008.** 9 points from 31 games against opponents averaging 1164
   give 995 by exact maximum likelihood, and 1001 (plus or minus 69) with the usual one imaginary draw added.
   [verified: `../verify-my-games/check_misc.out`; `../verify-rating/README.md`, row 5]
8. **8 of his 11 Caro-Kanns were played before the course existed in the app.** Those 8 were played on 2026-10-11 and
   2026-10-12. The app's Caro-Kann course file was first created on 2026-10-13 at 19:37 CEST (a 15-line stub, filled in
   from 20:26 CEST), and the course reached the app with commit ff2a436 on 2026-10-13 at 22:33 CEST; only 3 Caro-Kanns
   came after that (2026-10-14 and 2026-10-15). So "he left the app's course himself" (item 4, and the deviations
   listed in section 4) mostly describes games where there was no course to follow yet, and the 7 of 10 says little
   about the course itself. [verified: game start times in `lichess_abustrup.ndjson` against the git history; the
   conclusion is inferred]
9. **The 77- and 34-game figures in item 7 are superseded by the pre-registration** (`../preregistration.md`, version 2,
   2026-10-16): 10 warm-up games, a 30-game "before" (games 11-40), the trainer after game 40, and checks after games
   110 and 160, with a fixed allowance for the natural ups and downs of untrained players at his level (1.6 blunders per
   100 moves). The old figures left out those ups and downs and are not used for anything. [verified: preregistration.md
   sections 1 and 2]
10. **The raw files no longer contain opponents' usernames.** On 2026-10-16 the 31 Lichess opponents were renamed
    "Opponent 01" to "Opponent 31" in the order of his games, and the chess.com opponent "Opponent 32", with that
    account's profile link and player id removed. A space can never appear in a Lichess or chess.com username, so the
    placeholders cannot point at a real account. Ratings, rating changes, titles, game ids, moves, clocks and evaluations
    are unchanged. Every output here that needs no new engine run (out/, mistakes.json, calib/calibration_results.txt)
    re-computes byte for byte from the edited files, and a fresh Stockfish search of 2 games read from the edited file
    matches the saved evaluations in 117 of 117 positions (`../prereg/check_instrument.py --engine`). The last
    sentence of the "Files" section above is out of date. Each game can still be opened on Lichess from its game id.
    A fresh export brings the names back, so `scripts/scrub_usernames.py` does the replacement (it gives the same
    Lichess games the same numbers, changes nothing on files already done, and refuses to write if anything but a name
    would change or if a name would survive). [verified 2026-10-16]
