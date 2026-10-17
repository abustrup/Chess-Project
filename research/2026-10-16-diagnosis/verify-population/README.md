# Independent check of the "population" investigation (2026-10-16)

What was checked: the numbers in `../population/README.md` that the pre-registration will lean on.
How: new scripts written from scratch (none of the population scripts are imported), a different slice of the
same monthly database, Lichess's own API labels fetched for fresh games, a different engine setting, a fresh
comparison group of 145 other players, and a simulation instead of a formula. The population run's raw scratch
data was also re-analysed with the new code, to separate "their code is right" from "their sample is typical".

Labels: **verified** = re-derived here by a different path; **inferred** = follows from the numbers;
**assumed** = taken as given. Intervals are 95%. Usernames and raw games stay in a scratch folder outside the repo;
game ids were removed from the result files.

## Verdict in one table

| Claim | Verdict | Independent result |
|---|---|---|
| Rapid 10+0 baseline 9.31 (9.19-9.44), 16.1% analysed | confirmed | 9.48 (9.30-9.64), 13,484 of 83,939 analysed (16.1%); straight from Lichess's API on 2,543 player-games: 9.44 (9.08-9.83) |
| Blitz baseline 8.96 (8.85-9.06), 10.5% analysed | confirmed | 9.06 (8.95-9.17), 23,161 of 223,898 (10.3%); API direct 9.18 (8.74-9.61) |
| Two Lichess blunder counts; use the game page / API | confirmed | fresh 4,051 player-games: API equals `??` count in 1,879 (46%); 11,505 vs 9,136 blunders |
| "`??` glyphs show about 23-24% fewer" | partly | 20.6% fewer overall; **19.5-20.3% for rapid 10+0**, 22.3-22.5% for blitz |
| Within-player SD 7.51, between-player SD 1.30 (comparison group) | confirmed | within 7.38-7.51, between 1.09-1.60 (three groups); combined 7.46 and 1.32 |
| Database estimate 7.23 and 1.94 | partly | same estimator on new slices: 7.17 and 2.17; a standard estimator gives 1.81; the README describes the grouping wrongly (see 3) |
| Rapid drift: variogram rise 2.99 at 101-160 games, drift SD 2.45 | partly | reproduces on their data, but not robust: fresh group 0.63, same-players-only 1.08, block method drift SD 1.6 (upper 2.6) |
| Blitz drift about 0 | confirmed | fresh group rise 0.44 (-2.3 to 4.4); combined 0.00 (-1.4 to 1.7) |
| Rating change over 150 games, rapid +20 (SD 71, p95 +115) | confirmed | fresh +31 (SD 57, p95 +114, n=34); combined +26 (12 to 40), SD 65, p95 +115, n=78 |
| Rating change over 150 games, blitz +31 (8-54), SD 69, p95 +140 | confirmed | fresh +23 (-1 to 52), SD 73, p95 +150, n=28; combined +27 (10 to 44), SD 70, p95 +142, n=64 |
| Analysed vs not-analysed engine ratio 0.92 (0.74-1.13) | confirmed | 0.99 (0.84-1.17) on 150+150 other games, depth 14, game-page rule; both together about 0.96 (0.84-1.10) (inferred) |
| 100+100 games detect about a 28% drop with no drift | confirmed | simulation with real games: 80% power at about 26% |
| With rapid drift the drop must be about 70% | partly | rests on the fragile 2.45; with the better-supported drift SD of about 1.6 it is about 50%, with 2.6 about 73% |

Bottom line (inferred): every number the pre-registration needs reproduces, except the size of natural drift in
rapid, which is shakier than the README says. The practical conclusion survives either way: a before/after on one
player is a weak judge (even with zero drift, 100+100 fully analysed games only detect a drop of about a quarter).

## 1. Baselines (verified)

`v_sample.py` streams 96 byte ranges of 8 MB starting at k x size / 96, so they sit exactly between the population
run's 96 ranges (never overlapping) and cover 2026-09-01 00:00 to 2026-09-30 17:28 UTC, 1,793,641 games.
`v_stats.py` applies a from-scratch game-page rule (`v_rules.py`) to the database evaluations. Band = own pre-game
rating 950-1250; intervals from a bootstrap over the 96 slices.

| | Rapid 10+0 | Blitz (all) |
|---|---|---|
| Player-games / analysed | 83,939 / 13,484 (16.06%) | 223,898 / 23,161 (10.34%) |
| Blunders per 100 own moves, game-page rule | **9.48 (9.30-9.64)** | **9.06 (8.95-9.17)** |
| Same, database glyphs | 7.55 (7.39-7.70) | 6.99 (6.90-7.08) |
| Population run | 9.31 (9.19-9.44) | 8.96 (8.85-9.06) |
| Lichess API count directly, random games from these slices | 9.44 (9.08-9.83), 2,543 player-games | 9.18 (8.74-9.61), 1,508 |
| By rating 950-1049 / 1050-1149 / 1150-1250 | 9.95 / 9.48 / 9.17 | 9.48 / 9.02 / 8.82 |
| Share of blunders in moves 1-12 | 34.8% | 30.3% |

The two samples differ by 0.16 (rapid) and 0.10 (blitz), about 1.5 standard errors: within sampling noise.
On things every game shows, analysed and not-analysed 10+0 games look alike here too (rating 1115 vs 1114,
score 0.500 vs 0.496, time forfeits 9.4% vs 12.1%, 30.5 vs 29.0 own moves).

## 2. Which blunder count (verified)

- `v_api_check.py`: the from-scratch rule (winning-chance drop of 0.3 or more, centipawns capped at 1000, lila's
  mate rules) equals Lichess's own per-player API blunder count in 21,888 of 22,014 player-games of the population
  run's API data and in 4,769 of 4,800 player-games of fresh API data (99.4% both). The API's per-move labels always
  add up to its summary (22,014 of 22,014).
- `v_fetch_ids.py` + `v_compare_api_db.py`: 2,400 random analysed games from the new slices (1,500 rapid 10+0,
  900 blitz) fetched from the API. Evaluations identical to the database in 2,400 of 2,400 games. For the 4,051
  in-band player-games, the API count equals the database `??` count in only 1,879 (46%); 11,505 API blunders vs
  9,136 glyphs. Glyphs are 19.5% fewer in rapid 10+0 and 22.5% fewer in blitz.
- Mechanism: 3,261 moves the game page calls a blunder carry only a `?` in the database, and all 400 of them that
  were inspected lose less than 300 centipawns (example: +0.28 to -1.64). In the other direction, 892 `??` moves
  are only mistakes or inaccuracies on the game page, in lopsided positions (example: +10.86 to +5.18).
- Hand check (`v_handcheck.py`): 15 random moves Lichess calls blunders and 15 random unlabelled moves by 950-1250
  players, re-evaluated at depth 20. All 15 blunders lose at least 0.38 of winning chances (0.38-1.55); none of the
  15 unlabelled moves loses more than 0.14. Lichess's labels hold up.

So: use the game-page / API count, as the population README says. The "23-24% fewer" wording overstates the gap
for the owner's time control; for 10+0 it is about 20% (the inverse: the game page shows about 25% more).

## 3. Noise and spread (verified; one wording error)

| Source | Within-player SD per game | Between-player SD of true rate |
|---|---|---|
| Population group, rapid (their data, unbalanced ANOVA written here) | 7.51 (7.29-7.74) | 1.09 (0.75-1.38) |
| Fresh rapid group, 82 players, 4,394 analysed games | 7.38 (7.04-7.65) | 1.60 (1.16-1.96) |
| Both rapid groups, 174 players, 10,745 games | 7.46 (7.27-7.63) | 1.32 (1.06-1.55) |
| Blitz: their data / fresh / both | 6.94 / 6.96 / 6.95 | 1.30 / 1.11 / 1.21 |
| New database slices, rapid, players with 2+ games anywhere in the month (1,711) | 7.17 | 1.81 (standard estimator), 2.17 (population run's estimator) |
| New database slices, players with 2+ games inside one slice (336) | 7.61 | 0.90 |

Wording error in `../population/README.md`: it says the database estimate uses "players with 2+ analysed games in a
sample slice"; the code (`population_stats.py`, `variance_components`) groups by player across the whole month.
The numbers match that code, not the sentence. The database between-player figure is a small difference of two
large variances and moves between 0.9 and 2.2 with the method; the long-series groups (1.1-1.6) are the better guide.

## 4. Natural change in similar players (verified for the means; drift size disputed)

Fresh group (`v_fetch_group.py`): 90 rapid 10+0 and 55 blitz players picked from the new slices (in band, 2+
analysed games there, none from the population run's lists), anchored at their latest such game in September, with
up to 120 games before and 300 after exported on 2026-10-16. `v_group.py` analyses both groups.

- **Blunder rate does not fall by itself (confirmed).** Last 50 games before vs games 1-150 after: fresh rapid
  +0.34 (-1.0 to +1.7), n=25; both rapid groups +0.34 (-0.40 to +1.05), n=59; both blitz groups +0.50 (-0.42 to
  +1.45), n=36.
- **Rating drifts up a little (confirmed).** See the table at the top. Over 150 games the 95th percentile is about
  +115 (rapid) and +140 to +150 (blitz) in every sample.
- **How much a player's true rate wanders (partly).** My code reproduces their rapid variogram rise of 2.99 at
  101-160 games apart (0.19 to 5.80). But:

| Rapid 10+0, rise at 101-160 games apart (drift SD = square root of 2 x rise) | Rise | Drift SD |
|---|---|---|
| Population group, all pairs (their method) | 2.99 (0.19 to 5.80) | 2.45 |
| Fresh group, all pairs | 0.63 (-3.83 to 5.10) | 1.1 |
| Both groups, all pairs | 2.30 (0.19 to 4.52) | 2.1 |
| Both groups, only the 78 players present at every distance | 1.08 (-1.10 to 3.28) | 1.5 |

  In that same-players version the rise is already 1.1-1.9 at 11-60 games apart and does not grow after that
  (161-250 apart: 1.86, against 3.66 when all pairs count). The steady rise in the all-pairs version partly comes
  from which players supply the far-apart pairs. On their data alone the 161-250 rise falls from 4.93 to 1.32 when
  only full-span players count.
  Block method (mean rate in 50-game blocks, one pair per player, sampling noise subtracted), both groups:
  drift SD 1.66 for blocks 50 games apart, 1.60 for 100 apart, 1.57 for 150 apart, upper 95% bounds 2.3-2.6.
  Their own window method already said 0 with upper bounds 0.6-2.3. Best reading (inferred): rapid true rates
  wobble by SD about 1.5 (0 to 2.6), mostly short-term, not a growing drift. Blitz: flat in every version.

## 5. Selection bias of "analysed games only" (verified)

`v_sf_bias.py`: 150 analysed and 150 not-analysed 10+0 games with a 950-1250 player, drawn from all 96 new slices,
re-analysed with Stockfish 19 at depth 14 (1 thread per engine, two engines), judged with the game-page rule.
Not analysed 9.68 vs analysed 9.75 blunders per 100 moves: ratio 0.99 (0.84-1.17, bootstrap over games).
Calibration on the analysed games: this local setting gives 9.75 against Lichess's own 9.24 on the same 248
player-games (+5.5%), the same count in 60% and within one in 92%. Pooling both checks on the log scale gives
about 0.96 (0.84-1.10) (inferred): no sign of bias, and anything beyond about 15% is now unlikely.

## 6. What one player's before/after can detect (verified, with a caveat)

The formula arithmetic in the population README is correct. `v_power_sim.py` re-derives it by simulation from
13,484 real 10+0 player-games (real game lengths and lumpy counts; a drop removes each blunder with that
probability; the 5% threshold is taken from simulated players with no change, so false alarms really are 5%):

| Games before and after | Formula, no drift | Simulation, no drift (drop with 80% power) |
|---|---|---|
| 50 + 50 | 40% | about 37% |
| 100 + 100 | 28% | about 26% |
| 150 + 150 | 23% | about 22% |

With drift the answer depends on the drift size and on how drift is modelled. Formula with drift SD 1.6: about 51%
at 100+100; with 2.6: about 73%. The simulation with drift SD 2.45 that shrinks along with the rate gives about 55%.
So "about 70%" is the pessimistic end, not the central case (inferred).

## Suggested edits before the pre-registration is time-stamped

1. Keep the game-page / API count as the main measure (confirmed). Say "about 20% fewer `??` glyphs at 10+0".
2. Baseline for the owner's band: 9.3-9.5 blunders per 100 own moves at 10+0 (about 9.8-10.0 at 950-1050).
3. Replace "drift SD 2.45, so the drop must be about 70%" with "drift SD about 1.5 (0 to 2.6); with 100+100
   analysed games a single-player drop must be roughly 30-50% to stand out, up to about 70% at the pessimistic end".
4. Fix the sentence about how the database variance estimate groups players.

## Files

| File | What |
|---|---|
| `v_rules.py` | Lichess game-page rule, from scratch |
| `v_sample.py` | Independent database sample, 96 ranges between the population run's |
| `v_stats.py` | Baselines, glyph ratio, spread -> `r_population_baseline.json` |
| `v_api_check.py` | Rule vs Lichess API labels -> `r_api_rule_on_population_api_data.json`, `r_api_rule_on_fresh_api_sample.json` |
| `v_fetch_ids.py`, `v_compare_api_db.py` | Fresh API labels vs database glyphs, direct API baseline -> `r_api_vs_database_glyphs.json` |
| `v_handcheck.py` | 30 labelled moves re-checked at depth 20 -> `r_handcheck_labels.json` |
| `v_fetch_group.py`, `v_group.py` | Fresh comparison group; spread, rating change, drift three ways -> `r_group_*.json` (population data, fresh, combined; rapid10 and blitz) |
| `v_sf_bias.py` | Analysed vs not-analysed engine check -> `r_selection_bias_engine.json` |
| `v_power_sim.py` | Detectable drop by simulation -> `r_power_simulation.json` |

## Rerun (about 60 minutes, mostly API waits; the Mac was shared with other jobs)

```
O=research/2026-10-16-diagnosis/verify-population; W=<scratch folder>
.venv/bin/python -I $O/v_sample.py $W/db.jsonl 96 8 0                       # ~3 min, 768 MB streamed
.venv/bin/python -I $O/v_stats.py $W/db.jsonl $O/r_population_baseline.json
.venv/bin/python -I $O/v_fetch_ids.py $W/db.jsonl $W/api_ids.ndjson 1500 900
.venv/bin/python -I $O/v_compare_api_db.py $W/db.jsonl $W/api_ids.ndjson $O/r_api_vs_database_glyphs.json
.venv/bin/python -I $O/v_api_check.py $O/r_api_rule_on_fresh_api_sample.json $W/api_ids.ndjson
.venv/bin/python -I $O/v_handcheck.py $W/api_ids.ndjson $W/db.jsonl $O/r_handcheck_labels.json   # ~4 min
.venv/bin/python -I $O/v_sf_bias.py $W/db.jsonl $W/sfb $O/r_selection_bias_engine.json 150 14     # ~17 min
.venv/bin/python -I $O/v_power_sim.py $W/db.jsonl $O/r_power_simulation.json
.venv/bin/python -I $O/v_fetch_group.py $W/db.jsonl <population lists> $W/grp_rapid rapid10 90   # ~25 min
.venv/bin/python -I $O/v_fetch_group.py $W/db.jsonl <population lists> $W/grp_blitz blitz 55     # ~15 min
.venv/bin/python -I $O/v_group.py $W/grp_rapid rapid10 $O/r_group_fresh_rapid10.json             # and blitz, combined
```
Results depend on Lichess data as of 2026-10-16 (games after the anchors keep accumulating).
