#!/bin/zsh
# Re-runs the whole my-games diagnosis from scratch (about 1-2 hours on a shared 10-core Mac).
# Run from the repo root: zsh research/2026-10-16-diagnosis/my-games/scripts/rerun.sh
set -e
D=research/2026-10-16-diagnosis/my-games; PY=.venv/bin/python
# The 2026-10-16 fetch used a browser-like User-Agent; this one says what it is and works for both the API and the
# database (HTTP 200 and 206, tested 2026-10-16). A bare curl gets 404.
UA="ChessCoach-research/1.0 (+https://github.com/abustrup/Chess-Project)"
# 1. raw games (re-fetching adds any newer games; the 2026-10-16 numbers came from the 31 games saved here)
# curl -s -A "$UA" -H "Accept: application/x-ndjson" "https://lichess.org/api/games/user/abustrup?clocks=true&evals=true&accuracy=true&opening=true&division=true&literate=true&pgnInJson=true&sort=dateAsc" -o $D/lichess_abustrup.ndjson
#    a fresh export brings opponents' usernames back (the repo is public); replace them before committing (added 2026-10-16):
# $PY -I $D/scripts/scrub_usernames.py $D $D
# 2. course positions from the app
node_modules/.bin/tsx $D/scripts/export_courses.ts > $D/engine/courses.json
# 3. engine pass (both workers), every position + null-move probes on both sides
for w in 0 1; do NULL_SIDE=both $PY -I $D/scripts/engine_eval.py $D/lichess_abustrup.ndjson $D/engine/sf_w$w.jsonl 250000 250000 $w 2 0 & done; wait
cat $D/engine/sf_w0.jsonl $D/engine/sf_w1.jsonl > $D/engine/sf_250k_bothnull.jsonl
# 4. 8-ply lines for judged moves whose printed PV is short
for w in 0 1; do $PY -I $D/scripts/lines.py $D/lichess_abustrup.ndjson $D/engine/sf_250k_bothnull.jsonl $D/engine/lines_w$w.jsonl 250000 $w 2 & done; wait
cat $D/engine/lines_w0.jsonl $D/engine/lines_w1.jsonl > $D/engine/lines_250k_all.jsonl
# 5. population slice (kept outside the repo), then the comparison numbers
mkdir -p /tmp/popdb
curl -s -A "$UA" -r 15000000000-15125829119 https://database.lichess.org/standard/lichess_db_standard_rated_2026-09.pgn.zst | $PY -I $D/scripts/pop_stream.py /tmp/popdb/low_eval_mid.pgn
$PY -I $D/scripts/pop_compare.py /tmp/popdb/low_eval_mid.pgn $D/out/population_950_1250.json
# 6. analysis, statistics, mistakes.json, tables
$PY -I $D/scripts/analyse_games.py $D/lichess_abustrup.ndjson $D/engine/sf_250k_bothnull.jsonl $D/engine/courses.json $D/out $D/engine/lines_250k_all.jsonl
$PY -I $D/scripts/stats.py $D/out $D/out/population_950_1250.json $D/mistakes.json
$PY -I $D/scripts/tables.py $D/out > $D/out/tables.md
# 7. checks of the rule and the engine setting on the games Lichess analysed
$PY -I $D/scripts/calib_compare.py $D/lichess_abustrup.ndjson $D/calib/sf_250000.jsonl $D/calib/sf_1000000.jsonl > $D/calib/calibration_results.txt
