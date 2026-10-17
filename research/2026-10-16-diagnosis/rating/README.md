# Rating: what the app should show

Investigation of 2026-10-16 (data fetched 13:10 to 14:55 CEST). Build instructions: [rating-page-spec.md](rating-page-spec.md).
Test rule written before the results: [PREDECLARED.md](PREDECLARED.md).
Labels: **verified** = checked here with data or source code; **inferred** = follows from what was checked;
**assumed** = not checked.

## In short

1. **The rating on the page should be your Lichess rating, read live from Lichess.** Today that is blitz 1017
   after 31 games, which Lichess itself puts between 889 and 1145. You have no rapid (10+0) rating yet; it appears
   after your first rated rapid games. (verified)
2. **Your chess.com number can only be translated, not measured.** Your chess.com account has 3 games from March
   2020, so it has no real rating. Among players with accounts on both sites, Lichess blitz 1017 matches about
   **480 on chess.com blitz** (8 in 10 such players: 250 to 680) or about **710 on chess.com rapid** (420 to 940).
   Two published sources give 395 and 552 for the same blitz number, so the middle is fairly settled; the spread
   between people is large and is the honest part of the answer. (verified for the data; how well it fits you is inferred)
3. **No rating for unrated games** (games against the app's bot, pasted games). The best method found, the Maia-3
   human-move model, was tested on 84 players it had never seen. After 10 games it was still off by 190 points on
   average, and its "8 in 10" ranges held only 6 in 10 times. That fails the rule written down before the test.
   And because your Lichess rating is already known to about plus or minus 64, ten bot games would move the best
   estimate by less than a tenth of what they suggest. (verified test; the last sentence is inferred from the model)
4. **Remove the app's current blended estimate** (results + "quality of your moves" + "your own guess"). Its move
   part was no better than guessing one fixed number (earlier study, 834 games), and for Lichess games Lichess's own
   number is the results-based rating. (verified in research/2026-10-16/exp)

Nothing here needs a login, a token or money.

---

## 1. Lichess to chess.com

### What exists already

| Source | How it matches people | Size | Lichess blitz 1017 gives chess.com blitz | Uncertainty stated |
|---|---|---|---|---|
| [Lichess FAQ](https://lichess.org/faq) (official) | none | n/a | Says it is "best not to think of ratings as absolute numbers" and gives no conversion. | n/a |
| [ChessGoals rating comparison](https://chessgoals.com/rating-comparison/), "Updated July 2026" | Players in their database with accounts on both sites, RD under 150, then each side ranked and matched rank to rank ([method page, 2020](https://chessgoals.com/rating-comparison-explained/)) | 1,935 Lichess blitz profiles, 1,066 rapid, all rating levels | The table starts at Lichess blitz 1090 = chess.com blitz 500, so 1017 is off the table. Extrapolating the first step (70 Lichess points per 100 chess.com points) gives about **395** | "+/- 70" Lichess points holds the middle half of players |
| [Elo+Chess / EloPlus write-up](https://www.elopluschess.com/static/research/cross_platform_elo_mapping/medium-import.html), undated | Same username on both sites, game-history filters, then the peak of each 100-point bucket and a straight line through the peaks | 2,076 blitz users between Lichess 650 and 1600 | chess.com blitz = -551.54 + 1.0853 x Lichess blitz = **552** | none given |
| This investigation | Same username, kept only when a second sign says it is the same person (see below) | 79 blitz pairs between Lichess 700 and 1700, 37 of them within 150 of 1017 | **483** (95% interval of the middle: 451 to 518) | 8 in 10 between 254 and 676 |

(verified: each number read from the source page on 2026-10-16; the 395 is my extrapolation.)

Why they differ (inferred): ChessGoals matches ranks, which at the bottom of the scale gives lower numbers than
asking "what do people with this Lichess rating have on chess.com". EloPlus uses all same-username pairs; false
matches (two different people with one name) pull low estimates upward, which EloPlus itself warns about. My own
same-username data without the identity check gives 540, almost exactly EloPlus's 552; with the identity check it
drops to 483.

### This investigation's paired data (verified)

- Lichess side: players seen in a 32 MiB slice of the September 2026 Lichess database (85,127 rated games,
  75,372 players). 6,801 usernames with a blitz or rapid rating of 600 to 1800 (most of them 800 to 1250) were
  looked up on chess.com's free public API; 3,650 exist there.
- For pairs where chess.com has an established rating (RD under 150, at least 20 games), the current Lichess
  profile and chess.com profile were fetched: 1,775 pairs.
- Filters for the fit: Lichess rating not provisional (RD under 110) with at least 20 games; chess.com RD under 150,
  at least 20 games, last game within 365 days; no titled players.
- Identity: the pair counts only if the Lichess profile links that chess.com account (3), the real names match (19),
  or the country flags match (233). 79 pairs had different countries and 1,441 had no way to check; those are used
  only as a comparison. Among pairs where both countries were known, about 1 in 4 disagreed, which is why the
  unchecked pairs are not trusted.
- Fit: straight line of chess.com rating on Lichess rating over Lichess 700 to 1700; the range is the line plus the
  10th to 90th percentile of the misses.

| Lichess rating | chess.com blitz from Lichess blitz | chess.com rapid from Lichess rapid | chess.com rapid from Lichess blitz |
|---|---|---|---|
| 900 | 370 (140 to 560) | 390 (200 to 570) | 600 (310 to 830) |
| 1000 | 470 (240 to 660) | 500 (310 to 690) | 700 (410 to 920) |
| 1100 | 560 (330 to 760) | 620 (430 to 800) | 790 (500 to 1010) |
| 1200 | 660 (430 to 850) | 730 (540 to 910) | 880 (590 to 1110) |
| 1300 | 760 (530 to 950) | 840 (650 to 1020) | 980 (690 to 1200) |
| pairs used | 79 | 103 | 86 |

Full table, Lichess 800 to 1600 in steps of 50: [results/chesscom_map.json](results/chesscom_map.json).
Every fit, with and without the identity check: [results/pairs_mapping.json](results/pairs_mapping.json).

### How good is it

- The middle value at Lichess blitz 1017 is known to about plus or minus 35 (95% interval 451 to 518 from 1,000
  bootstrap resamples). Three methods put it between about 400 and 550. (verified)
- The spread between individuals is much larger: 8 in 10 matched players sit between 229 below and 193 above the
  line. Your own chess.com rating could sit anywhere in that band. (verified for the matched players)
- Weak points: only 79 to 103 checked pairs; country match is weak evidence in large countries; people may take one
  site more seriously than the other; profile ratings are compared, not ratings at the same moment. (assumed to
  matter little, not tested)
- Your own Lichess blitz rating has its own uncertainty (RD 64) on top. (verified RD)
- If you want your actual chess.com number, it only exists if you play about 20 rated games there. (inferred from the
  RD under 150 rule used by every source)

## 2. Your Lichess rating today (verified, fetched 2026-10-16 13:38 CEST)

- Blitz 1017, RD 64, 31 games since 2026-10-10 (9 wins, 22 losses), change over the last 12 games -117.
  Lichess's own range is rating plus or minus 2 x RD: 889 to 1145. No rapid, classical or bullet games.
- Performance from results (Elo formula, one imaginary draw added): all 31 games 1001 (plus or minus 69);
  first 16 games 1121 (plus or minus 90); last 15 games 885 (plus or minus 106). The drop between the halves is
  within chance (about 1.7 standard errors), so it does not show you got worse; it does say the 1017 may still be
  settling. (inferred)
- Lichess shows a "?" while RD is 110 or more (`provisionalDeviation = 110` in Lichess's scalachess `Glicko.scala`;
  verified). Your blitz rating had lost the "?" by game 31.
- Lichess's rating-history endpoint returned an empty list for your account on 2026-10-16; the per-game ratings in
  the game export are complete. (verified)

## 3. A move-based rating for unrated games: held-out test

**Question.** Can the app estimate a Lichess-scale rating from the moves alone, for games with no rating, well
enough to show it with an honest range?

**Method (verified).** Maia-3 (CSSLab's human-move model behind maiachess.com, GPL-3.0 like this app) gives the
probability of each move for players of each rating; the most likely rating is then corrected by a model fitted on
calibration players. The primary model and the pass rule were written down before any held-out result existed
([PREDECLARED.md](PREDECLARED.md)).

- Calibration: the 44 players / 834 games of research/2026-10-16/exp.
- Held-out: 84 new players from the September 2026 database (42 rapid, 42 blitz; 55 rated 800 to 1400), their 10
  latest rated games each (840 games), plus 198 of their unrated games against the Lichess computer (37 players).
- Scored on a 400-point grid (600 to 2600) to fit the shared machine; this costs about 4 points of accuracy at one
  game on the calibration data (222 vs 227).

**Results on the 84 held-out players (primary model, verified):**

| Games per estimate | Estimates | Mean miss | 95% interval of mean miss | "8 in 10" range held | "95 in 100" range held | Half-width of "8 in 10" range |
|---|---|---|---|---|---|---|
| 1 | 840 | 227 | 203 to 251 | 76% | 92% | 323 |
| 5 | 168 | 193 | 168 to 219 | 66% | 83% | 219 |
| 10 | 84 | 190 | 165 to 217 | 60% | 81% | 199 |

For comparison on the same players: guessing the calibration players' average (1567) misses by 390; guessing the
held-out players' own average (1288, which a real tool could not know) misses by 282 per player; for the 55 players
rated 800 to 1400, guessing their own average (1113) misses by 143, which beats Maia (223, 180, 174 at 1, 5, 10
games). The opponents' average rating misses by only 39 to 69, but only because Lichess pairs players of similar
rating, so it means nothing for bot or pasted games.

**Against the Lichess computer (verified, small):** 1 game: mean miss 284 (37 players, 198 games), estimates too
low by 125 on average; 5 games: 329 (19 players, 27 estimates); 10 games: 338 (8 players). Using only computer games
from the last 12 months: 225 at 1 game (25 players).

**Verdict by the pre-declared rule.** Accuracy beats the declared baseline (passes rule 1). The ranges fail rule 2:
66% and 60% instead of 70 to 90% at 5 and 10 games. The declared remedy (widen using the calibration players only)
cannot help, because on the calibration players the ranges already held 84 to 87% of the time. So the estimate
should not be shown.

**After the test (post-hoc, so weaker evidence).** Refitting the same model on all 128 players and testing each
player with a model that never saw them (4-fold cross-validation) gives mean misses of 212, 158 and 144 at 1, 5 and
10 games and ranges that hold 84%, 82% and 84% of the time. So a bigger calibration set would likely fix the ranges,
but the misses stay large: even with many games a player's own style leaves about 165 points of error
(fitted `s_inf` = 164). (verified numbers; the reading is inferred)

**Why it is not worth building for you (inferred).** With your Lichess rating known to RD 64, ten bot games
measured with a miss of about 205 (one standard deviation, from the post-hoc model) would get under 9% of the weight
in a combined estimate (64 squared against 205 squared). The model file is 45.7 MB and would have to load in the browser. A bot game is better used
for what the training measures (blunders per 100 moves, the safety check) than for a rating.

## 4. Numbers most worth re-deriving

1. Lichess blitz 1017 maps to chess.com blitz 483 (95% interval 451 to 518; 8 in 10: 254 to 676), from 79 checked pairs: `scripts/pairs_analysis.py`.
2. Without the identity check the same data give 540, close to EloPlus's 552: the size of the false-match effect.
3. Held-out Maia-3 primary model: mean miss 190 at 10 games and 60% coverage of its 80% range on 84 new players: `scripts/maia_eval.py`.
4. For players rated 800 to 1400, a fixed guess of their band average (143) beats Maia at 1, 5 and 10 games (223, 180, 174).
5. His blitz performance: 1001 plus or minus 69 over 31 games, 885 plus or minus 106 over the last 15: `scripts/owner_snapshot.py`.
6. ChessGoals' table ends at Lichess blitz 1090 = chess.com blitz 500; 1017 is an extrapolation (about 395).

## 5. Files and how to re-run

Results (no usernames of other players are stored in the repo):
- [results/chesscom_map.json](results/chesscom_map.json): the table the app should use.
- [results/pairs_mapping.json](results/pairs_mapping.json): all mapping fits, by identity tier.
- [results/maia_heldout.json](results/maia_heldout.json): the pre-declared held-out test, all estimators, subsets, computer games.
- [results/maia_cv_posthoc.json](results/maia_cv_posthoc.json): post-hoc cross-validation and the model fitted on all 128 players.
- [results/owner_snapshot.json](results/owner_snapshot.json): his ratings and performance on 2026-10-16.

Scripts (Python with the repo's `.venv`; the Maia runner needs `onnxruntime-node` and the Maia-3 model as in research/2026-10-16/exp):
1. `db_players.py`: names and ratings from a byte range of the monthly database (`curl -r 22000000000-22033554431` of `lichess_db_standard_rated_2026-09.pgn.zst`, browser-like User-Agent).
2. `fetch_chesscom_same_name.py`, then `enrich_pairs.py`, then `pairs_analysis.py`: the mapping.
3. `pick_heldout.py`, `fetch_games.py`, `run_grid.mjs` (2 shards, `ORT_THREADS=2`), `split_heldout.py`, `maia_eval.py`, `maia_cv.py`: the rating test.
4. `owner_snapshot.py`: his live numbers.
5. `fetch_lichess_profiles.py`: an abandoned first try (Lichess's bulk profile endpoint rate-limited this machine after about 5,700 lookups; 11 profile-linked pairs found, not used).

Re-run notes: chess.com asks for one request at a time; Lichess's game export needs a browser-like User-Agent.
Raw downloads stay in the session scratchpad and are not committed.
