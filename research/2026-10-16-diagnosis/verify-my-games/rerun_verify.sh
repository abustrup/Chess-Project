#!/bin/sh
# Re-runs the independent verification of research/2026-10-16-diagnosis/my-games (written 2026-10-16).
# Needs: ../../../.venv (python-chess, zstandard), /opt/homebrew/bin/stockfish (19), curl. About 20-30 min on a loaded Mac.
set -e
cd "$(dirname "$0")"
PY=../../../.venv/bin/python
$PY check_rule.py > check_rule.out                    # Lichess rule vs Lichess's own labels (6 analysed games)
$PY check_mistakes_json.py > check_mistakes_json.out  # replay every mistakes.json record
rm -f eng_w0.jsonl eng_w1.jsonl                       # independent engine pass: depth 16, hash kept per game
$PY veng.py 0 2 eng_w0.jsonl > eng_w0.log 2>&1 & $PY veng.py 1 2 eng_w1.jsonl > eng_w1.log 2>&1 & wait
$PY vmetrics.py theirs > /dev/null                    # their raw 250k evals, my code -> vmetrics_theirs.json
$PY vmetrics.py mine > /dev/null                      # my depth-16 evals, my code   -> vmetrics_mine.json
$PY compare_labels.py > compare_labels.out
$PY check_categories.py > check_categories.out
$PY check_ignored_threat.py > check_ignored_threat.out
for s in check_misc check_power check_losses_move12 check_openings_raw check_opp_lichess; do $PY $s.py > $s.out; done
$PY deep_check.py > deep_check.out 2>&1               # 1.5M-node re-search of a sample and of disputed moves
# Population from two other byte ranges of the 2026-09 Lichess database (derived numbers only, no raw games kept)
TMP=${TMPDIR:-/tmp}/verify_pop; mkdir -p $TMP
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"
URL=https://database.lichess.org/standard/lichess_db_standard_rated_2026-09.pgn.zst
for S in 5000000000 25000000000; do curl -s -A "$UA" -r $S-$((S+69999999)) $URL | $PY -I vpop_stream.py $TMP/pop_$S.jsonl; done
$PY vpop_metrics.py $TMP/pop_5000000000.jsonl $TMP/pop_25000000000.jsonl > vpop_results.json
