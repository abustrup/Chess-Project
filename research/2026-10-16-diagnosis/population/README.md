# Population baselines and a comparison group (2026-10-16)

Purpose: numbers the pre-registration needs. What is normal for players rated 950-1250 on Lichess,
how noisy one player's blunder count is, and how much similar players change by themselves over
their next 50-150 games with no known training. Scripts and aggregate results only. No raw games
and no usernames are kept here (usernames stayed in a scratch folder that is not in the repo).

Labels: **verified** = computed and cross-checked here; **inferred** = follows from the numbers but
not tested directly; **assumed** = taken as given.

## 1. Which number is "Lichess's own blunders" (verified, and it changes the baseline)

Lichess labels blunders in two places, with two different rules:

| Where | Rule (replicated from the evaluations) | Checked on |
|---|---|---|
| Game page and games API (`players.<colour>.analysis.blunder`, per-move "judgment") | the mover's winning chances drop by 0.3 or more (cp capped at 1000); 0.2 mistake, 0.1 inaccuracy | 22,034 analysed player-games from the API: replicated blunder count equal in 21,903 (99.4%); 61,915 vs 61,903 blunders |
| `??` glyphs in the monthly database files | marked only if winning chances drop by 0.1 or more, then graded by centipawn loss (cp capped at 1000): 300+ blunder, 100+ mistake, 50+ inaccuracy | 30,937 analysed in-band blitz player-games: replicated count equal in 99.5% |

On the same 285 games found in both sources (277 with identical evaluations), the API count equals
the database glyph count in only 259 of 571 player-games, and the API shows 1,584 blunders against
1,202 glyphs (+32%). Across the whole sample the game-page rule gives 26-32% more blunders than the
glyphs.

**Use the game-page / API count** (what the owner sees on lichess.org). Never mix the two, and do
not use the "15 win-percentage points" or `??`-glyph numbers from earlier research as the same
quantity. All baselines below use the game-page rule unless marked "glyphs".

## 2. Population baselines, September 2026 (verified)

Source: `lichess_db_standard_rated_2026-09.pgn.zst`, 96 byte ranges of 10 MB spread evenly over the
29.2 GB file (one every ~7.5 hours of play, 2026-09-01 06:22 to 2026-09-30 20:08 UTC; all 30 days and
all 24 hours of the day, in proportion to how many games were played), 2,359,333 games. Band = the player's own pre-game rating 950-1250. Only games Lichess
analysed have evaluations. Intervals: 95%, bootstrap over the 96 time slices.

| | Rapid 10+0 (training time control) | Blitz, all time controls (his current games) |
|---|---|---|
| In-band player-games | 111,337 | 293,801 |
| Analysed | 17,903 (16.1%) | 30,937 (10.5%) |
| **Blunders per 100 own moves** | **9.31 (9.19-9.44)** | **8.96 (8.85-9.06)** |
| same, database glyphs | 7.38 (7.26-7.49) | 6.90 (6.81-7.00) |
| Blunders per game, mean (SD) | 2.84 (2.36) | 2.76 (2.30) |
| Own moves per game | 30.5 | 30.8 |
| Per-game rate: median; 10th-90th percentile | 8.3; 0-20.0 | 8.0; 0-18.8 |
| Games with no blunder | 12.7% | 13.0% |
| Share of blunders in moves 1-12 | 35.2% (glyphs 28.3%) | 30.6% (glyphs 24.4%) |
| Share of blunders with under 10% of base time left | 1.8% | 6.0% |

By rating, rapid 10+0: 950-1050: 9.84 (9.60-10.09), 1050-1150: 9.44 (9.22-9.66), 1150-1250:
8.87 (8.67-9.05). Blitz: 9.45, 8.91, 8.67. Roughly 0.4-0.5 fewer blunders per 100 moves per 100
rating points, so a 25% drop (about 2.3 per 100 moves) is more than the whole difference between
1000 and 1200 players (about 1.0) (inferred; the band is only 300 points wide). Per time control (blitz 3+0 9.39, 3+2 8.98, 5+0 9.13, 5+3 8.45; rapid 10+5
8.80, 15+10 8.60) are in `results_population.json`.

**Spread (verified, two independent estimates):**
- One game is very noisy: the per-game rate has SD about 6.9-7.5 per 100 moves within the same player.
- Players at the same rating differ little in their true rate: between-player SD 1.9 (rapid 10+0)
  and 1.8 (blitz) from the database (players with 2+ analysed games in a sample slice), and 1.3 / 1.1
  from the comparison group's long series. Intraclass correlation 0.02-0.07.
- Consecutive games are not correlated (lag-1 autocorrelation 0.00 rapid, -0.02 blitz).

Meaning (inferred): a player's own blunder rate is mostly hidden by game-to-game noise; the population
mean at his rating is already a fair guess of his true rate (within about 2 per 100 moves).

## 3. Selection bias from "analysed games only" (verified, small samples for the engine part)

- On everything visible in every game, analysed and not-analysed in-band games look alike. Rapid 10+0:
  mean rating 1115 vs 1115, score 0.502 vs 0.496, losses 48.6% vs 48.2%, time forfeits 9.2% vs 11.6%,
  60.9 vs 58.1 half-moves. Share analysed after a win 16.5%, after a loss 16.2%, after a draw 9.9%.
  Blitz is similar.
- Engine check: 70 analysed and 70 not-analysed in-band 10+0 games (121 and 120 player-games, four
  time slices), all re-analysed with Stockfish 19 (Threads 2, 30,000 nodes per position) and the same
  rule. Blunders per 100 moves: not analysed 6.80 vs analysed 7.41, ratio 0.92 (95% CI 0.74-1.13).
  No clear bias; a difference of up to about 25% either way cannot be ruled out.
- The same check calibrates a cheap local engine against Lichess: on the analysed games it gave 7.41
  vs 6.97 glyph blunders per 100 moves (+6%), the same count in 60% of player-games and within one
  in 88%. A local engine at this setting is a rough proxy, not a replacement for Lichess's count.

## 4. Comparison group: change with no known training (verified for the sample; small n)

Design, mirroring the owner: players are picked at a September 2026 game (from the database sample)
where they were rated 950-1250. "Before" = their last 50 games up to that game; "after" = the games
that followed, exported from the Lichess API on 2026-10-16. Blunders = Lichess's own API count, so
only analysed games count. Rapid uses 10+0 games only.

Sample: 98 rapid 10+0 players and 53 blitz players with data (from 100 + 55 fetched). They were drawn
at random from in-band players with at least two analysed games in one sample slice, which favours
people who analyse often (like the owner will). Their blunder level matches the population in rapid
(before-block mean 8.9-9.2 vs 9.31) and is about 8% lower in blitz (8.1-8.3 vs 8.96).
Median share of each player's games that are analysed: 23% rapid, 21% blitz.

**Blunders per 100 moves, after minus before (Lichess API count):**

| Window after the anchor | Rapid 10+0 | Blitz |
|---|---|---|
| games 1-50 | +0.04 (CI -0.61 to +0.76), n=50 | -0.47 (-1.63 to +0.58), n=22 |
| games 1-100 | +0.21 (-0.59 to +1.02), n=44 | +0.32 (-0.97 to +1.99), n=21 |
| games 1-150 | +0.33 (-0.54 to +1.13), n=34 | +0.45 (-0.88 to +1.87), n=19 |
| games 101-150 only | +1.25 (+0.19 to +2.36), n=29 | -0.22 (-1.53 to +0.93), n=15 |

No natural improvement on average: similar players do not blunder less 50-150 games later (if
anything slightly more in rapid). Individual changes spread widely (5th-95th percentile about -4.1 to
+4.3 per 100 moves), but that spread is almost all sampling noise, because these players had only
about 10-30 analysed games per window.

**How much one player's true rate wanders (the hard part):** estimated two ways.
- Window method: true drift SD about 0 in rapid and 0.7-2.7 in blitz, upper 95% bounds 0.6-4.2. Weak.
- Variogram over all pairs of a player's analysed games (15,000-92,000 pairs per distance band):
  blitz flat, drift SD about 0 (upper bound 1.7) for games 101-160 apart. Rapid rises steadily:
  drift SD about 2.4 (95% CI 0 to 3.5) for games 101-160 apart, 3.1 for 161-250 apart.
So the honest range for natural drift over 100-150 games is 0 to about 3.5 blunders per 100 moves.

**Lichess rating, change from the anchor game (no training):**

| After | Rapid 10+0 | Blitz |
|---|---|---|
| 50 games | +13 (CI -1 to +26), SD 56, 95th pct +99, n=69 | +16 (+4 to +29), SD 42, 95th pct +100, n=41 |
| 100 games | +17 (0 to +33), SD 62, 95th pct +97, n=55 | +24 (+6 to +43), SD 60, 95th pct +150, n=39 |
| 150 games | +20 (0 to +40), SD 71, 95th pct +115, n=43 | +31 (+8 to +54), SD 69, 95th pct +140, n=35 |

Comparable players gain about 15-30 rating points over 50-150 games by themselves, with 16-17%
gaining 100 or more within 150 games. Results against opponents' ratings (score minus expected score)
change by SD 0.08-0.11 between blocks of 50+ games, about 55-75 rating points of noise (inferred).

## 5. What this means for detecting a real improvement in the owner (inferred)

Smallest drop in blunders per 100 moves that a before/after comparison of one player detects
(one-sided 5% test, 80% power), assuming every one of his games is analysed and a within-player
SD of 7.5 per game (rapid comparison group). Percent of a 9.3 rate in brackets.

| Games before and after | no drift | drift SD 1.5 | drift SD 2.45 (rapid variogram) |
|---|---|---|---|
| 30 + 30 | 4.8 (52%) | 6.1 (65%) | 7.8 (83%) |
| 50 + 50 | 3.7 (40%) | 5.3 (57%) | 7.1 (77%) |
| 100 + 100 | 2.6 (28%) | 4.6 (49%) | 6.6 (71%) |
| 150 + 150 | 2.2 (23%) | 4.3 (46%) | 6.5 (69%) |

Formula: 2.49 x square root of (2 x 7.51² / games + drift²); the same table with the comparison
group's own mean is in `results_drift_rapid10.json`. Take-aways:
1. With fewer than about 100 analysed 10+0 games before and after, only a very large drop (40%+)
   can be told apart from noise, even if nothing else moves.
2. More games do not fix natural wander: if the rapid drift estimate is right, one player's drop must
   exceed roughly 6.5 per 100 moves (about 70%) before it means anything on its own. The comparison group
   cannot rule this out yet; the blitz data say drift is near zero.
3. There is no natural downward trend to subtract: similar untrained players do not improve on this
   measure over 150 games. A real drop is therefore not "just practice" on average, but a single
   player's drop can still be luck.
4. Rating is the slower check: a gain must beat about +20 natural drift and noise of SD 60-70 over
   100-150 games, so roughly +100 to +140 points in 150 games to stand out (95th percentile).
5. The owner has no 10+0 games yet (2026-10-16), so his "before" is either new 10+0 games played
   before training starts, or the population rate at his rating (9.8 per 100 moves at 950-1050, which
   predicts a player's true rate to within about 2) together with his 31 blitz games
   (blitz and rapid rates differ by only about 4% at this level).

## Caveats

- Comparison group: 43-69 players per rapid rating window and 35-41 in blitz; 15-50 per blunder
  window. They analyse often and are active (median 145 rapid / 248 blitz games in the 2-6 weeks
  after the anchor), so they are not a random sample of all 950-1250 players. Not verified that none
  of them trained; "no known training" only.
- Rapid ratings come from 10+0 games but include rating changes from other rapid games in between.
- The power table treats the measure as an average of per-game rates; the pooled count per 100 moves
  behaves almost the same because games have similar lengths (assumed).
- Glyph-rule and game-page-rule mate handling follow lila's MateAdvice; the game page also skips a
  move when it was the engine's own choice. The replication still matches 99.4% of player-games.
- Lichess may change either rule later. `verify_rules.py` re-checks it in a few minutes.

## Files

| File | What |
|---|---|
| `sample_db.py` | Samples the monthly database by byte ranges, writes one row per in-band player-game (scratch) and both Lichess rules |
| `population_stats.py` | Baselines, spread, selection checks -> `results_population.json` |
| `verify_rules.py` | Which rule each Lichess output uses -> `results_rule_check.json` |
| `sf_bias.py` | Stockfish check of analysed vs not-analysed games -> `results_selection_bias_rapid10.json` |
| `fetch_api.py` | Exports comparison players' games before and after the anchor from the Lichess API |
| `drift.py` | Natural drift, variance components, variogram, detectable drop -> `results_drift_rapid10.json`, `results_drift_blitz.json` |
| `results_sample_points.json` | The 96 byte offsets, games per slice and their UTC time span |

## Rerun (about 45 minutes, mostly waiting on downloads)

```
P=research/2026-10-16-diagnosis/population; W=<scratch folder>
.venv/bin/python -I $P/sample_db.py $W/db 96 10                       # ~3 min, ~1 GB streamed
.venv/bin/python -I $P/population_stats.py $W/db/rows.jsonl $W/pop.json  # ~7 min
.venv/bin/python -I $P/sf_bias.py $W/sf.json 70 30000 600+0              # ~11 min, Threads 2
# candidates and anchors: in-band players with 2+ analysed games in one slice, from rows.jsonl
.venv/bin/python -I $P/fetch_api.py cands.txt anchors.tsv $W/api/rapid rapid 100   # ~25 min
.venv/bin/python -I $P/fetch_api.py cands.txt anchors.tsv $W/api/blitz blitz 55
.venv/bin/python -I $P/drift.py $W/api/rapid rapid10 $W/drift_rapid10.json
.venv/bin/python -I $P/verify_rules.py $W/db/rows.jsonl $W/rules.json $W/api/rapid $W/api/blitz
```
Lichess endpoints need a browser-like User-Agent (built into the scripts). The API export is one
request at a time. Candidate lists hold usernames and must stay out of the repo.
