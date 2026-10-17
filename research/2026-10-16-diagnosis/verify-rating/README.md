# Independent check of the rating investigation

Checker pass of 2026-10-16 (15:00 to about 16:00 CEST) on [../rating/README.md](../rating/README.md).
Every number below was re-derived with code written here from scratch, on the investigation's raw data where
that was the only source, and on fresh data where a different path existed. The investigation's own scripts were
read but not reused, except its Maia-3 network wrapper (exp/maia.mjs), which was used once to re-score 12 games.

Labels: **verified** = re-computed here and matches; **partly** = matches on the main point, with a stated caveat;
**refuted** = does not hold; **not checked** = no independent path was available.

## Verdict in one line each

| # | Claim | Verdict | Re-derived here |
|---|---|---|---|
| 1 | Lichess blitz 1017 -> chess.com blitz 483 (95% CI 451-518), 8 in 10 between 254 and 676, 79 checked pairs | **partly** | Same data, own code: 483 (448-516), 254-676, 79 pairs, exact match. Robust estimators on the same data: 481-495. A **new, independent sample** (August 2026 database, 61 checked pairs, no username overlap): 508-538 depending on the estimator (95% CIs about 455-581). Both samples pooled (140 pairs): about **505** (95% CI about 455-545). Spread of the 48 pooled players within 100 of 1017: 368 to 666. So the centre is about 480-525, a little higher than 483, and the 254-676 band is wider than the spread seen near 1017 (conservative on the low side). |
| 2 | Without the identity check the same data give 540 (EloPlus 552, ChessGoals about 395) | **partly** | 540 reproduced (straight line). EloPlus formula gives 552.2 (verified on the live page; it is their **3+0** blitz formula, while 30 of his 31 blitz games were 5+3 or 3+2). ChessGoals table starts at Lichess blitz 1090 = chess.com blitz 500; extrapolating gives 396 (verified, live page "Updated July 2026"). But the story that false matches lift 483 to 540 is weaker than written: on the same data, median-type estimators give 509-521 without the check (a 25-40 point effect, not 57), and in the new August sample the check made no difference (498-547 without, 508-538 with, same five estimators). |
| 3 | Held-out Maia-3 primary model: mean miss 190 at 10 games, 60% coverage of the 80% range, 84 unseen players | **verified** | Re-implemented from PREDECLARED.md: 190.3 (player-bootstrap 95% CI 165-218), coverage 59.5% (95% CI 49-70%). Also 227 / 193 at 1 / 5 games, coverage 76% / 66%. Unchanged when the peak is read with a spline instead of a parabola (188, 62%) or the error model is fitted by maximum likelihood (190, 60%). The 95% ranges also failed the declared 88% floor (83% and 81% at 5 and 10 games). Inputs checked: 84 players, none in the calibration set; all 1,038 games re-downloaded from Lichess, player, rating and type all match; 12 random games re-scored with Maia-3 match within 0.06 log-points. |
| 4 | 55 held-out players rated 800-1400: a constant at their mean misses by 143, Maia by 223 / 180 / 174 | **verified** | Constant 1113 misses by 143.3 at 10 games (144-145 at 1 and 5); Maia 222.6 / 180.2 / 173.9. A fixed 1100, not fitted to the data, gives 145, so the point does not depend on peeking. Caveat: the subset is picked by true rating, which favours any constant. Even the post-hoc model (leave one player out) only reaches 187 / 150 / 139 in this band, so the conclusion holds. |
| 5 | His blitz performance 1001 +/- 69 over 31 games, 885 +/- 106 over the last 15 | **verified** | Fresh export (12:59 UTC): 31 rated blitz games, 9 wins, 22 losses, opponents' average 1163.5. With one imaginary draw: 1001 +/- 69 and 885 +/- 106 (first 16: 1121 +/- 90); exact maximum likelihood without the draw: 995 +/- 70 and 865 +/- 113; bootstrap over games: SD 70 and 115. Halves differ by 1.7 standard errors, as stated. Profile: blitz 1017, RD 64, interval 889-1145; replaying the games' rating changes also ends at 1017. |
| 6 | Post-hoc cross-validation on 128 players: miss 144 at 10 games, 80% range coverage 84%, style floor s_inf about 164 | **verified (approximately)** | Leave-one-player-out: 148 (95% CI 129-167), coverage 81%; 20 random 4-fold splits: 145.5-154.8 (mean 148), coverage 78-85% (mean 82%). 144 is at the lucky edge of the split-to-split range. s_inf on all 128 players: 167 (their fitting method) or 172 (maximum likelihood). The investigation's script also drops one game that two players share, which is why it has 144 ten-game estimates and this check 145. None of this changes the reading. |

Other claims checked on the way (all **verified** unless said):
- Lichess marks a rating provisional at RD 110 or more (`provisionalDeviation = 110` in scalachess `rating/src/main/scala/glicko/model.scala`) and shows the range as rating +/- 2 x RD (`intervalMin`/`intervalMax` in lila `modules/rating/src/main/Glicko.scala`); both read from GitHub on 2026-10-16.
- `lichess.org/api/user/abustrup` answers without login and sends `access-control-allow-origin: *`, so the app can read it from the browser.
- He has no rapid rating: the API returns Lichess's placeholder 1500, RD 500, provisional, 0 games.
- `rating-history` returns an empty list for his account.
- Chess.com `abustrup`: 3 games (1 daily, 1 rapid, 1 blitz), the last on 2020-03-23, RDs 312 to 326.
- Lichess FAQ: "best not to think of ratings as absolute numbers, or compare them against other organisations" (live page).
- Computer games: 284 at 1 game (37 players, bias -125), 329 at 5, 338 at 10; recent ones only: 225 at 1 game (25 players).
- Ten bot games' weight next to his Lichess rating: 64 squared against 205 to 207 squared = 8.7% to 8.9%. On actual computer games the misses were larger, so the real weight would be lower still.
- On the calibration players the ranges held 85% / 84% / 87% (so the declared widening remedy could not widen them), as stated.
- Country flags as an identity sign are stronger than the investigation's README suggests: two different people would match by chance only about 4% of the time (4.1% in September, 4.5% in August, from the flag frequencies), so roughly 1-2% of country-matched pairs are expected to be false matches. Among pairs with both countries known, 25% (September) and 31% (August) disagreed.
- The August sample only took players whose database blitz rating was 850-1200, so its straight-line slopes are flattened by that window; only its estimates near 1017 are compared above.
- `prog` -117 is the change over his last 11 games (12 ratings), not 12 games; a wording detail for the spec.

What this means for the build (inferred):
- The headline (live Lichess rating, no move-based rating, remove the blended estimate) stands on every check.
- For the chess.com line, a centre of about 500 with "8 in 10 between about 370 and 670" is better supported by two samples than 483 with 254-676. Either way it is a wide translation, which is the honest message.
- When he gets a 10+0 rapid rating, note that EloPlus's own 10+0 formula gives about 597 for Lichess rapid 1017, against 522 on the investigation's rapid line; the new sample had too few rapid pairs (36) to settle it.
- Not checked: the earlier study's claim that the app's move-quality part is no better than a constant (455 vs 457). Its own results file shows the two numbers come from different game counts (675 vs 834) and that a recalibrated app number reaches 389, so "no better than a constant" is true only for the raw number. Removing it is still right, because Lichess's own rating is far better.

## Files

| File | What it does |
|---|---|
| `v_owner.py` | His live Lichess numbers and performance rating, three ways (exact maximum likelihood, the investigation's one-imaginary-draw version, bootstrap over games) |
| `owner_check.json` | Output of the above (fetched 2026-10-16 12:59 UTC) |
| `v_pairs.py` | Lichess to chess.com mapping, written from scratch, with five estimators instead of one straight line, and a test of how often a country flag matches by chance |
| `pairs_reanalysis_sept.json` | `v_pairs.py` on the investigation's September 2026 pairs |
| `v_db_names.py`, `v_fetch_pairs.py` | A new, independent sample: players from the **August** 2026 Lichess database (bytes 9,000,000,000 to 9,025,165,823), none of them looked up by the investigation, matched to chess.com and re-graded |
| `pairs_resample_aug.json` | `v_pairs.py` on that new sample (3,200 names looked up, 820 established pairs, 61 identity-checked blitz pairs) |
| `pairs_pooled_identity.json` | Both samples' identity-checked pairs pooled, estimates at Lichess blitz 1017 |
| `v_maia.py` | The pre-declared Maia-3 test re-implemented from PREDECLARED.md's wording, with two other ways to read the peak and to fit the error model, the baselines, computer games, and the post-hoc cross-validation (leave-one-player-out and 20 random 4-fold splits instead of one) |
| `maia_check.json` | Output of the above |
| `v_games_check.py`, `v_maia_rescore.mjs` | All 1,038 scored games re-downloaded from Lichess and checked (player, rating, rated or not, computer opponent); 12 random games re-scored with Maia-3 |
| `maia_inputs_check.json` | Output of the above, without game ids |

No usernames of other players or game ids are stored in this folder; raw downloads stay in the session scratchpad.
Re-run: `.venv/bin/python -I <script>` with the arguments in each script's docstring; the rescoring needs
`ORT_THREADS=2 node v_maia_rescore.mjs <exp/maia.mjs> <items> <out>` with the Maia-3 model as in research/2026-10-16/exp.
