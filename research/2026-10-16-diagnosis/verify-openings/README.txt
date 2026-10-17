Independent check of the "openings" investigation (research/2026-10-16-diagnosis/openings), 2026-10-16.

Labels: verified = counted directly by a script here; inferred = follows from the data plus a stated assumption.
Nothing here reuses the investigation's code. Their files were read only to know what they claimed, and as a
source of positions to re-test (their trees, gaps and engine positions).

Different paths used
- Database: 64 byte ranges of 20 MiB from lichess_db_standard_rated_2026-09.pgn.zst, each starting HALF-WAY
  between the investigation's 64 slices, so no game is shared. 322,704 rated blitz+rapid games with both players
  1000-1300 (speed from TimeControl, Lichess rule base+40*inc), 2026-09-01 to 2026-09-30. 40,101 carry Lichess evals.
- Course trees: parsed from the chapter PGN text with python-chess (their exporter used the app's own pgnTree.ts).
- Frequencies: by exact move sequence in real games (theirs: position-based, transpositions merged), plus my own walk.
- His games: re-fetched from the Lichess API 2026-10-16 (31 rated blitz games), Stockfish 19 depth 18 (theirs 14),
  plus Lichess's own evals where they exist (6 games; 3 of them Black).
- Population after move 12: Lichess evals on a disjoint sample, AND Stockfish depth 14 on 500 random games that
  Lichess did NOT analyse (tests whether the analysed subset is biased).
- Engine claim: 17 of their 150 positions (all 7 they rated worse than 0.25 pawn + 10 random; stopped early to spare
  a loaded shared machine) re-tested with single-PV search at depth 22 and evaluation of the position after each
  candidate move (theirs: MultiPV 3 at depth 20).

Results (numbers in brackets are theirs)
1. 1.d4 share 22.8% [22.6%]; 1...e5 after 1.d4 8.3%, 6,115 of 73,443 [8.4%, 6,009 of 71,678]: CONFIRMED.
   Englund 4.Bf4 (after 1.d4 e5 2.dxe5 Nc6 3.Nf3 Qe7): White scores 44.6%, n=233, 95% 38-51% [38%, n=253, 32-44%]:
   PARTLY. Both samples put White under 50%, but 38% is the low end; pooled 41% (200 of 486 points).
   4.Bf4 is still the most common 4th move (48%) and 4...Qb4+ follows in 91% of those games.
2. London still in course: after Black's 1st move 73.0% [73%]; after Black's 2nd 53.7% walk, 54.1% Kaplan-Meier with
   13,957 games at risk [53%, 54%, 13,608]: CONFIRMED.
3. Slav structure: walk with 1...d5 32.9% [32%]; with 1...c6 26.3% walk, 28.3% in real 1.d4 c6 games [24%];
   x 22.8% 1.d4 = 6.0-7.5% of Black games from 1.d4 alone; about 7.7% once 1.c4/1.Nf3/1.e3 ...c6 transpositions
   are added (rapid only: about 6%) [5-7%]: PARTLY (slightly higher, still clearly under 10%).
4. His Black games below 30% after move 12: 10 of 16 at depth 18 [9 of 16 at depth 14]; the extra game sat at exactly
   30.0 in their run. Lichess's own evals agree on the 3 Black games it analysed.
   Population, Black below 30% after move 12: 30.6% (Lichess evals, 38,668 games, same rule as theirs) [31%];
   28.7% blitz only; 32.7% (95% 28.5-37.2) by Stockfish on 500 unanalysed games; 31.7-35.2% if games that ended
   before move 12 count by result. Chance of 9+ of 16 at those rates: 0.02-0.07 [about 0.03]: CONFIRMED with caveats.
   Pattern of the first big drop (moves 7-11, after leaving the course): 8 of 10 at depth 18 [7 of 9]; 1 game on the
   move that left the course (4.h4 e6); both White losses by move 12 came from a piece left en prise at move 11.
5. Caro-Kann 2.Bc4 d5 3.exd5 cxd5 4.Bb3: 5.5% of 1.e4 c6 games (n=699) in both my walk and by sequence [5.7%, n=733];
   2.Nf3 after 1.e4 c6: 33.7% of 14,606 [32.6% of 14,365]: CONFIRMED (within about 1 point).
6. Course decisions: 449 / 552 / 424 unique own-move positions = 1,425 [same]; used in at least 1 of 200 games:
   London 41, Caro-Kann 61, Slav 46 (47 with their one-move transposition rule) = 148-149 [41/65/44 = 150]: CONFIRMED.
Also checked: all 75 gaps they list at 0.5%+ are real gaps by my parser; 120 random opponent-move labels in their
trees agree with my parser; the 19 conflicting positions (8/5/6) and the 3 they highlight exist.
Engine spot-check: of 17 re-tested positions only 1.d4 b6 2.Nf3 is worse than half a pawn (57 cp, same as theirs);
the other 16 are within 0.42 pawn, largest gap between their and my loss 15 cp. Consistent with "149 of 150" (not a
full re-check of all 150).
Not confirmed side-number: Black's score after the Jobava 2.Nc3 c6 3.Bf4 is 50% (n=236) here [44%, n=223].

Files
- scripts/v_sample.py (database sampler), v_dump_pgn.ts + v_courses.py (course parsing), v_walk.py (walk + KM),
  v_freq.py (sequence frequencies), v_slav_all.py (Slav share over all first moves), v_my_games.py (his games),
  v_pop12.py (population after move 12), v_engine_spot.py (engine spot-check).
- Results: v_freq.json, v_walk_all.json, v_pop12.json, v_my_games_d18.json (no opponent names or links), v_engine_spot.json.

Re-run from the repo root; raw data stays outside the repo in a scratch folder $S:
  .venv/bin/python -I research/2026-10-16-diagnosis/verify-openings/scripts/v_sample.py $S/v_db.jsonl 0 64 20   (~25 min)
  npx tsx research/2026-10-16-diagnosis/verify-openings/scripts/v_dump_pgn.ts $S/course_pgn.json
  V=research/2026-10-16-diagnosis/verify-openings
  .venv/bin/python -I $V/scripts/v_freq.py $S/v_db.jsonl $V/v_freq.json
  .venv/bin/python -I $V/scripts/v_walk.py $S/v_db.jsonl $S/course_pgn.json $V/v_walk_all.json all   (~7 min)
  .venv/bin/python -I $V/scripts/v_slav_all.py $S/v_db.jsonl all
  .venv/bin/python -I $V/scripts/v_pop12.py $S/v_db.jsonl $V/v_pop12.json 500 14
  curl -A "<browser user agent>" "https://lichess.org/api/games/user/abustrup?clocks=true&evals=true&opening=true" -o $S/games.pgn
  .venv/bin/python -I $V/scripts/v_my_games.py $S/games.pgn $S/course_pgn.json $S/v_my_games_d18.json 18   (~25 min)
  .venv/bin/python -I $V/scripts/v_engine_spot.py research/2026-10-16-diagnosis/openings/engine_check.json $V/v_engine_spot.json 24 22
Lichess endpoints return 404 to bare curl: send a browser-like User-Agent. The opening explorer API now needs a login
(401), so it was not used.
