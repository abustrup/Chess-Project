# Matched newcomers (study check S6)

Built 2026-10-16 for the pre-registered study (`../preregistration.md`, section 3.6). Labels: **verified** = computed
and checked here; **inferred** = follows from the evidence; **assumed** = taken as given.

## In plain words

- **Why this exists.** You are new to Lichess and to 10+0, so you might blunder less over time all by yourself. If
  that happened, the trainer could look like it worked when it did not. This folder measures how much players like
  you change by themselves, so that "worked" has to beat that as well.
- **Who they are.** 100 Lichess players who were rated 900-1300 at 10+0 in September 2026, started 10+0 within 60
  days of opening their account (60 of 100 within a day), played at least 160 rated 10+0 games, and asked
  Lichess to analyse enough of them. 70 of the 100 began 10+0 in 2025 or 2026; the earliest in 2017.
- **What they did by themselves.** On average, nothing: from their games 11-40 to their games 61-160 (the same
  windows as yours) their blunders went from 9.98 to 10.13 per 100 moves, a change of +0.16 (standard error 0.37; 90% range
  -0.45 to +0.78). They did not improve by themselves. But individual players moved up or down a lot: the spread of
  their true change is about 2.3 blunders per 100 moves, more than the 1.6 assumed for established players.
  [verified on the saved answers, 2026-10-16]
- **What it means for the study.** On this evidence, newcomer learning is unlikely to fake a "worked": players
  like you did not improve on their own, on average (you could still differ from them). [inferred] The check
  still matters: because newcomers' rates wander more, a "worked" must now also beat that larger wander, which
  makes "worked" harder to reach. Re-running the pre-registration's own simulation with these numbers (4,000
  simulated players per case): with no real effect, a false "worked" falls from 3.5-4.3 in 100 to 1.6-2.5 in 100;
  with a real one-third drop, "worked" falls from 40-52 in 100 to 24-37 in 100; with a halving, from 76-89 to 57-76
  in 100 (`power/power_with_newcomers.json` against `../prereg/power_results.json`). [inferred: model results]
- **Settled 2026-10-16 (after the final critique):** the check stays exactly as written and this file binds. It is
  committed together with the pre-registration, before the time-stamp, so there is no later point at which leaving
  it out could make "worked" easier. The pre-registration now gives the chances with this file
  (`power/power_with_newcomers.json`, 4,000 simulated players per case: false "worked" 1.6-2.5 in 100, one-third drop
  24-37, halving 57-76; `power/mechanism_with_newcomers.json` for the mechanism scenarios), and names the file's
  SHA-256 (preregistration.md answer 5 and 3.6). Its known limits, among them that Lichess's own counts on the games
  players chose to analyse may overstate the drift, are in preregistration.md 3.6. [inferred: model results]
- **What you need to do.** Nothing. The lead commits the file with the pre-registration; the daily measuring job
  records that it binds (`newcomersBinding` in status.json).
- **Privacy.** The files here hold no Lichess usernames and no game ids (checked by a scan, see below).

## Files

| File | What |
|---|---|
| `newcomers.json` | The result that `prereg/verdict.py --newcomers` reads: `players`, `mean_change`, `mean_change_se`, `drift_sd`, plus the counts at every step and descriptive numbers |
| `players.csv` | One anonymous row per kept player (N001 ...): analysed games, moves, blunders, rate and sampling variance in games 11-40, 61-160 and 61-110. Every number in `newcomers.json` can be recomputed from it |
| `newcomers.py` | The pipeline: database sample, Lichess API (one request at a time), build, privacy scan |
| `selftest.py` | 49 checks on constructed players and a mock Lichess (no network) |
| `ci.sh` | The steps of `.github/workflows/newcomers.yml`, runnable on a Mac with `DRY_RUN=1` |
| `drift_check.py`, `drift_check.json` | Descriptive check (changes nothing): could the drift estimator report this much drift from noise alone? Plus the same numbers for players who began 10+0 in 2025-2026 |
| `power/` | How often the pre-registered rule says "worked" with this file binding (2026-10-16): `power_with_newcomers.py` and `mechanism_with_newcomers.py` run `prereg/power_sim.py`'s own simulation code and `prereg/verdict.py` unchanged with `newcomers.json` as the newcomer input; their `.json` results are what preregistration.md 3.3 quotes. Re-runs give byte-identical files (seeded; checked 2026-10-16) |

## The rule, as implemented

| Pre-registration 3.6 | In `newcomers.py` |
|---|---|
| 1. Players rated 900-1300 in rated 10+0 games of a sample of the September 2026 database; older months if fewer than 30 qualify | Every non-BOT player whose own pre-game rating was 900-1300 in a rated 600+0 game of the population study's sample: 96 byte ranges of 10 MB at offsets (i + 0.5) x size / 96 of `lichess_db_standard_rated_2026-09.pgn.zst`. If every candidate was tried and fewer than 30 qualify, the 2026-08 sample is added (then 07, ...), skipping players already tried |
| 2. Account created at most 60 days before the first rated 10+0 game; at least 160 rated 10+0 games | Account `createdAt` from `/api/users`; the first game is game 1 of the numbering below; 60 days = 60 x 86,400,000 ms, inclusive |
| 3. Number their rated 10+0 games as for him; Lichess's own blunder count on analysed games; 5+ analysed in games 11-40, 10+ in games 61-160; target 60, stop at 100 | Numbering uses `prereg/measure.py`'s `eligible()` imported unchanged (rated, standard, 600+0, not from a position, no BOT opponent, not aborted or unstarted, at least one move) and orders games by start time (`createdAt`), as measure.py does for him. Blunders = `players.<colour>.analysis.blunder` from the games export (`accuracy=true`). An analysed game counts when the player made at least one move, as in `verdict.py`'s `ratio()`. Candidates are tried in a fixed pseudo-random order (SHA-256 of `chess-project-newcomers-2026-10-16|` and the user id) until 100 qualify |
| 4. c = mean change (61-160 minus 11-40), player-bootstrap SE s; d = drift SD by the block method, floored at 0 | Per-player rates pooled per 100 own moves with `verdict.py`'s `ratio()` (imported unchanged). c = mean of the per-player changes; s = SD of 10,000 player-bootstrap means (seed 20261016); d = sqrt(max(0, sample variance of the changes minus the mean of the per-player sampling variances)) |
| 5. Write `newcomers.json` with players, mean_change, mean_change_se, drift_sd | Yes, rounded to 4 decimals, plus `players.csv` |

Two shortcuts. First, players with fewer than 160 rated rapid games on their profile are not exported, because
160 rated 10+0 games are rapid games. The profile count is almost, but not always, complete: in 1 of the 270
exported histories the export held 2 more finished rated rapid games than the profile said (170 against 168). So
the 8 dropped players closest to the line (152-159 on their profile) were fetched in full on 2026-10-16: all 8 had
fewer than 160 rated rapid games, so this shortcut dropped no one who could qualify in this run [verified].
Second, a history is read only until the rule has decided (for example, game 40 with fewer than 5 analysed games).
The checks run in that cheap order, so the step counts below follow it; who is kept does not depend on the order,
because a kept player must pass every check [verified: a separately written re-derivation on the saved histories
gets the same 100 players and the same counts].

One trap, found and fixed during the build: Lichess's oldest-first export is ordered by when a game *ended*
(0 exceptions in 42,889 saved games), while measure.py numbers his games by when they *started*. In the first
fetch, 4 of 270 histories had two games out of start order. The pipeline therefore sorts by start time and keeps
reading 6 hours past the game that decided the outcome before closing the stream (a rated 10+0 game took at most
27 minutes from creation to last move in 29,634 saved games). Every history was then fetched again under the
corrected rule; the result was identical (same 100 players, same numbers, `players.csv` identical row for row).
[verified]

`newcomers.py` refuses to run if `prereg/measure.py` or `prereg/verdict.py` no longer match their SHA-256 in
`preregistration.md` 3.9.

## Counts at each step (run of 2026-10-16)

Candidates are tried one by one in the fixed order; the run stopped when the 100th player qualified.

| Step | Players |
|---|---|
| Candidates in the September 2026 sample (non-BOT, 900-1300, rated 10+0) | 57,511 |
| Tried, in the fixed order, until 100 qualified | 411 |
| Dropped: account closed or not found | 4 |
| Dropped: fewer than 160 rated rapid games on the profile | 137 |
| Dropped: first rated 10+0 game more than 60 days after the account was created | 60 |
| Dropped: fewer than 5 analysed games in games 11-40 | 32 |
| Dropped: fewer than 160 rated 10+0 games | 7 |
| Dropped: fewer than 10 analysed games in games 61-160 | 71 |
| **Kept** | **100** (target 60, stop at 100) |

So no older month was needed. Of the 411 tried, 100 qualified (24%). [verified]

## Numbers (run of 2026-10-16)

| | Value | Used by verdict.py |
|---|---|---|
| players | 100 | yes (binding needs 30+) |
| mean_change (games 61-160 minus 11-40, per 100 moves; negative = improve) | +0.1593 | yes |
| mean_change_se (player bootstrap) | 0.3742 (formula SD / sqrt(n): 0.3773) | yes |
| drift_sd | 2.3485 (bootstrap upper 95%: 2.95) | yes |
| Mean rate in games 11-40 / 61-160 | 9.98 / 10.13 | no |
| Analysed games per player, median, 11-40 / 61-160 | 10 / 14 | no |
| Days from account to first rated 10+0 game | median 0.35, at most 57 | no |
| Look 1 window only (61-110, 99 players with 2+ analysed games there) | change +0.29, SE 0.40, drift 1.86 | no |
| Began 10+0 in 2025-2026 (70 players) | change -0.17, SE 0.40, drift 1.83 | no |
| Accounts marked for breaking Lichess's terms | 1 of 100 (kept; the rule does not exclude them) | no |

**Is the drift real?** (`drift_check.json`) Dealing each player's analysed games at random between the two
windows removes any real drift. The same estimator then gives a median of 0.39 and a 95th percentile of 1.76
(1,000 shuffles); the real 2.35 is above 997 of the 1,000. So the drift is not an artifact of having few analysed
games per player; the estimator's own upward bias is small (0.23 in variance units, against 5.52). [verified]
It is smaller among players who began recently (1.83). [verified; the only split, chosen before seeing its result]

## How it was checked (2026-10-16)

- **Self-test** (`newcomers.py selftest`, 49 checks, about 10 s, no network): every step of the rule at its boundary
  (exactly 60 days passes, 60 days and 1 ms fails; 4 analysed games fail and 5 pass; an analysed game with no own
  move does not count; 159 games fail); 10+5, BOT, aborted and casual games get no number; a game that ended after
  the next one still gets its start-time number, and the early stop waits for it; the numbers against a
  hand calculation; a mock Lichess that answers 429 once (the pipeline then waits 61 s), cuts one stream (asked
  again), and checks that no two requests overlap and that every request carries the honest User-Agent; stop at
  exactly the first 100 in the fixed order; the August sample added only when September gives fewer than 30;
  resume after a budget stop; byte-identical rebuild; the privacy scan finds a planted username and game id, also
  inside a folder; a 404 for the history of an account listed as open stops the run and saves nothing. [verified]
- **Pilot** on the real Lichess: 2 of the 96 database ranges (2,452 candidates), 14 candidates tried, 4 kept,
  16 requests, 0 answers of 429; the output was byte for byte the same on Python 3.9 and 3.14. [verified]
- **The database sample is the population study's:** 96 ranges, 2,359,333 games, the same count as
  `../population/README.md`. [verified]
- **Full run** on the real Lichess, 2026-10-16: every request one at a time with the User-Agent
  `ChessCoach-newcomers/1.0 (research script, one request at a time; +https://github.com/abustrup/Chess-Project)`;
  0 answers of 429 in any run. The final game histories were fetched 18:25-18:58 CEST in 4 resumed runs: 270
  requests, one per history, about 7 seconds each. The 2 account lookups (up to 300 accounts each) and the database
  sample were saved by an earlier fetch that afternoon and not asked again. All saved answers take 8.3 MB outside
  the repo. [verified]
- **Independent re-derivation:** a separately written filter (its own 60-day check and start-time order) gives the
  same 100 players in the same order with the same analysed games, moves and blunders in both windows (100 of 100);
  all 60 players dropped by the 60-day rule were confirmed from their saved games (60 of 60); `mean_change`,
  `mean_change_se` and `drift_sd` recompute exactly from `players.csv` alone. [verified]
- **Byte-identical rebuild** from the saved answers: three rebuilds (Python 3.9 twice, Python 3.14) give the same
  SHA-256 for `newcomers.json` (c3ca7bbe73779d10...) and `players.csv` (3fa8b065e253c6c5...); `drift_check.py`
  reproduces `drift_check.json` (56a892aaea083222...). [verified]
- **Privacy scan** (`newcomers.py scan`): 0 hits in the 13 files of this folder (`power/` included) and the workflow, checked against
  87,888 usernames (every candidate and every opponent in the saved games) and 42,886 game ids. [verified]
- **verdict.py reads it:** `verdict.py --newcomers newcomers.json` on his 31 blitz rows says the condition is
  "binding"; on the same rows repeated to 160 games both looks print the newcomer-adjusted line. [verified]
- **The workflow's steps** (`ci.sh`) ran on this Mac as a dry run: full mode rebuilt the same file with 0 requests,
  passed the scan and printed the commit it would make; pilot mode, from an empty folder, sampled 2 ranges, asked
  Lichess for 20 histories (24 requests, under 2 minutes) and committed nothing. They have not yet run on GitHub
  (the workflow exists there only after a push). [verified locally]
- **Second check by a separate verifier** (2026-10-16, its own code, none of the pipeline's): the same 100 players
  and the same counts at every step from the saved answers, `players.csv` equal for 100 of 100 players, and the
  same `mean_change` and `drift_sd`; 2 of the 96 database ranges downloaded again and read with python-chess (same
  game counts, no candidate missing); the same files rebuilt byte for byte on Python 3.9 and 3.14; its own privacy
  scan (88,560 usernames, 44,132 game ids and 646 tournament ids) found 0 in this folder and the workflow, and in
  the rest of the repo no game id and no username of 8+ characters apart from 2 ordinary chess words in opening
  texts that someone also uses as a username; its own mock Lichess in a separate process saw 1 request at a time,
  the honest User-Agent, a 61 s wait after a 429 and a cut stream asked again. [verified]
- **Changed after the run** (no saved answer or result affected): if Lichess answers 404 to an account lookup or to
  the history of an open account, the pipeline now stops and saves nothing. Before, it saved an empty answer, which
  would have counted those players as closed or as having too few games. None of the 270 saved histories is empty
  and every account lookup was answered, so the result is unchanged (rebuilt byte for byte after the change).
  [verified]
- **Third check by the task verifier** (2026-10-16, its own code): the same 100 players, the same counts at every
  step and `players.csv` equal for 100 of 100 players; 2 more database ranges (23 and 71 of 96) read with
  python-chess (same game counts, no candidate missing); the 8 players dropped closest to the 160 line (152-159 on
  the profile) asked again: each had at most 158 rated 10+0 games before the run ended; the 3 players who began
  before 2020 have no 10+0 games outside Lichess's rapid category; a fresh pilot about 4 hours after the full run
  gave the same outcome and the same games for all 25 players it tried; its own mock Lichess in a separate process,
  with real waits, saw 1 request at a time (at least 1 s apart), the honest User-Agent on every request, 61 s of
  waiting after a 429, a new request after a cut chunked stream, a cut fixed-length answer and a 500, and the
  expected outcome for 16 of 16 constructed players; the files rebuild byte for byte on Python 3.9 and 3.14, and
  both `power/` files re-run byte for byte. [verified]
- **Changed by that check** (no result affected; rebuilt byte for byte afterwards): the scan now also accepts a
  folder (the scan command below failed once `power/` existed), and a dry run of `ci.sh` no longer copies its
  output over this folder's files. [verified]

## Re-run

From the repo root. The saved Lichess answers live outside the repo (default `~/.cache/chess-project-newcomers`)
because they hold usernames and game ids.

```
.venv/bin/python -I research/2026-10-16-diagnosis/newcomers/newcomers.py selftest      # 10 s, no network
.venv/bin/python -I research/2026-10-16-diagnosis/newcomers/newcomers.py run           # sample + fetch + build; resumable
.venv/bin/python -I research/2026-10-16-diagnosis/newcomers/newcomers.py build --out DIR   # rebuild from saved answers only
.venv/bin/python -I research/2026-10-16-diagnosis/newcomers/newcomers.py scan research/2026-10-16-diagnosis/newcomers/*
```

On GitHub: Actions -> "Matched newcomers" -> Run workflow, mode `full` (or `pilot` for a short test). It never
overwrites a committed `newcomers.json`; it then rebuilds from fresh Lichess answers and reports the difference.
Fresh answers can differ a little from the saved ones (players ask Lichess to analyse old games later, accounts
close), so only a rebuild from the same saved answers is byte for byte identical.

If game 41 comes before a run has finished: `newcomers.py build --finalize` writes `newcomers.json` from the players
kept so far, in the fixed order (so no player can be picked by result). That is a deviation to report.

## Caveats

- **Picked by today's rating, not by when they started.** The rule takes players rated 900-1300 in September 2026,
  whenever they began. Some began years ago and are still at that level, which may favour slow learners
  (see `year_of_first_rated_10_0_game` in `newcomers.json`). [inferred]
- **Only games they asked Lichess to analyse.** Players choose which games to analyse (more often after a win or a
  loss than a draw). Earlier checks found analysed and unanalysed 10+0 games blunder alike (ratio about 0.96,
  0.84-1.10), so this is probably small. [inferred, from `../population` and `../verify-population`]
- **Two counters.** Their blunders are Lichess's own count; his are our replication of Lichess's rule (precision
  0.92, recall 0.91 against Lichess on 429 of his moves). A level difference cancels in a change; a difference in how
  the two counters move over time would not. [inferred]
- **Old analyses.** For players who began years ago, Lichess analysed those games with the engine of that time; the
  API applies today's blunder rule to the stored evaluations. [assumed, not checked here]
- **Not a control group.** They did not use his app, and "no training" is not known. They also play at their own
  pace; he may play fewer games a day. [assumed]
- **Survivors only.** Players who stopped before 160 rated 10+0 games are not in the group. [verified by the rule]
- **Drift is estimated with few games per player** (median 10 analysed games in 11-40 and 14 in 61-160), so
  `drift_sd` is uncertain; `drift_check.json` tests whether the estimator alone could produce it.
