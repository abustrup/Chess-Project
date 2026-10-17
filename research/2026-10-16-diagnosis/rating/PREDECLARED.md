# Pre-declared test for the unrated-game rating estimate

Written 2026-10-16 at about 13:45 CEST, before any result on the held-out players existed.
(The held-out games were still being scored by Maia-3 when this was written; nothing in this file was changed afterwards.)

## What is tested
An estimate of a player's Lichess rating from the moves alone, for games that carry no rating
(games against the app's bot, pasted over-the-board games).

- Primary estimator: "Maia-3 measurement model" (scripts/maia_eval.py, `fit_measurement`).
  Maia-3 (the CSSLab human-move model used on maiachess.com, GPL-3.0) scores how likely each of the player's moves is
  for a player of each rating; the most likely rating is then corrected with a measurement model fitted on the
  calibration players (an offset for rapid vs blitz, and an error that has a part more games can shrink and a part
  that is the player's own style and does not shrink), and combined with a population prior.
  80% and 95% ranges are normal ranges from that model.
- Secondary (reported, not used to choose): the same Maia scores with a per-N linear correction and empirical ranges,
  and a tempered-likelihood posterior.
- Baselines: a constant (the calibration players' average rating) and, for rated games only, the opponents' average
  rating (this one exists only because Lichess pairs players of similar rating, so it says nothing for bot games).

## Data
- Calibration: the 44 players / 834 games already scored in research/2026-10-16/exp (arena players, Oct 2026).
- Held-out test: 84 fresh players never used before, sampled from the 2026-09 Lichess database (byte range from
  22,000,000,000), stratified by rating band and time control (42 rapid, 42 blitz; 40 of them between 900 and 1300),
  10 most recent rated games each in that time control (as of 2026-10-16).
- Bot test: the same held-out players' unrated games against the Lichess computer (up to 10 per player), truth =
  their rated rating in the held-out set.
- Both sets are scored on the same Elo grid (600, 1000, ..., 2600).

## Pass rule (decided now)
Keep a move-based estimate in the app only if, on the held-out players:
1. at 5 games its mean absolute error is clearly below the constant baseline (the upper end of its 95% interval is
   below the constant's mean absolute error), and
2. its 80% range contains the true rating in 70% to 90% of cases at 1, 5 and 10 games, and its 95% range in at
   least 88% of cases.
If (1) fails: remove move-based estimates entirely. If (1) passes but (2) fails: widen the ranges with a factor fitted
on the calibration players only, and say so; do not refit on the held-out players.
The bot-game test is reported separately; if the estimate is clearly worse on bot games than on rated games, the app
must say so next to any bot-game estimate.
