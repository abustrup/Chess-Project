# Rating page: what to show (spec for the build phase)

Written 2026-10-16 by the rating investigation. Evidence and numbers: [README.md](README.md).
Status labels: **verified** = checked in this investigation, **inferred** = follows from what was checked,
**assumed** = not checked.

## 1. Headline: his live Lichess ratings (replace the current blended estimate)

Source: `GET https://lichess.org/api/user/{username}` (public, no login, no token). Username from Settings
(`abustrup`). Fields per time control in `perfs.rapid`, `perfs.blitz`: `rating`, `rd`, `games`, `prov`, `prog`.

- Order: **rapid first** (his training time control is 10+0, which Lichess counts as rapid), then blitz.
  Hide bullet, classical and correspondence unless they have games.
- Show the rating, the number of games, and Lichess's own range `rating - 2*rd` to `rating + 2*rd`
  (that is how Lichess itself computes `intervalMin`/`intervalMax` in lila `Glicko.scala`; verified 2026-10-16).
- Add `?` and the word "provisional" when `prov` is true. Lichess marks a rating provisional while `rd >= 110`
  (scalachess `Glicko.scala`, `provisionalDeviation = 110`; verified 2026-10-16).
- `prog` = rating change over his last 12 games in that time control (Lichess's own field).
- No rapid games yet (true on 2026-10-16: 0 rapid games, rating 1500 with rd 500 is Lichess's placeholder):
  show "No rapid rating yet. It appears after your first rated 10+0 games on Lichess and loses the '?' once
  Lichess is sure enough." Never show the 1500 placeholder as a rating.
- History chart: build it from the games the app already imports (each Lichess game carries his rating before
  the game and `ratingDiff`; verified in the export on 2026-10-16). `GET /api/user/{u}/rating-history` returned
  an empty list for his account on 2026-10-16, so do not rely on it.
- Browser access: the app already calls `lichess.org/api/games/user/...` from the browser; `api/user/...` is the
  same host (inferred to work the same way; test in a real browser).
- Refresh on page open; cache the last answer with its time so the page works offline and says "as of <date>".

## 2. Chess.com equivalent: a translated range, never "your rating"

He said "real Elo" means his chess.com rating. He has no usable chess.com rating: `abustrup` on chess.com has
3 games, the last in March 2020, with rating deviations above 300 (verified 2026-10-16). So the page can only
translate.

- One line under each established (non-provisional) Lichess rating:
  "On chess.com this is about **X** (8 in 10 similar players: **A to B**)."
  Values from the table in `results/chesscom_map.json` (same time control on both sites:
  Lichess blitz -> chess.com blitz, Lichess rapid -> chess.com rapid). Interpolate between rows; round to 10.
- Under it, small: "Translated from N players with accounts on both sites (October 2026). The two sites'
  numbers are different scales; Lichess itself advises against comparing them. Your exact chess.com rating only
  exists if you play about 20 rated games there."
- Do not show a chess.com line for a provisional Lichess rating, and do not show one outside the table's range.
- Do not show a single number without the range.

## 3. Unrated games (games against the app's bot, pasted over-the-board games)

Decision: **show no rating for unrated games.** The best move-based method (Maia-3 with a fitted correction)
failed its pre-declared range test on 84 unseen players (its 80% ranges held 66% and 60% of the time at 5 and 10
games; mean miss 190 at 10 games), and with his Lichess rating known to RD 64 it would barely move the number
(README section 3).

- For bot games show what the training measures instead: result, the bot level, blunders per 100 of his moves,
  and how many of his mistakes were one-move safety errors (definitions belong to the measurement work, not here).
- For pasted over-the-board games with opponents' ratings, the results may be listed, but no rating is computed.
- One line where the old estimate was: "Your rating comes from rated games on Lichess. Games against the bot and
  pasted games are for practice and review; they do not change it."
- If a move-based estimate is ever wanted again: calibrate on all 128 players already scored
  (`results/maia_cv_posthoc.json`, model "no rapid offset"), write a new pass rule first, and test it on new
  players before showing it.

## 4. Remove

- The blended estimate (results + "quality of your moves" + "your own guess") and its "how I worked this out"
  breakdown. Its move-quality part was no better than guessing a constant on 834 games (research/2026-10-16/exp:
  mean absolute error 455 vs 457 at one game), and for Lichess games the Lichess rating already is the
  results-based number, computed by Lichess on all his games.
- "Your own guess" (self-rating) as an input to any number. Keep it only as a fallback label before any data.
- The Home rating card's single number: replace it with the live Lichess rating (rapid when it exists, else
  blitz) with its range.

## 5. Optional, for the "is it working" page (not this page's job)

Performance over the last N games (score against the opponents' ratings, with its error) is how the slow check
of the pre-registration is computed; `scripts/owner_snapshot.py` shows the formula. If shown, always with the
error and the number of games.
