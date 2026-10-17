#!/usr/bin/env bash
# Rebuilds the Safety-check cards (scripts/safety, build-plan task C1) from the saved export and eval cache, after
# the measurement has been committed. It only runs the builder and its checks and reports the exit code; the job
# restores the card files when this fails, so a failure here never touches the measurement.
# Usage, from the repo root:  STOCKFISH=... [WORKERS=4] [PYTHON=python] bash scripts/measure/cards.sh
set -uo pipefail
builder=scripts/safety/build_cards.py
checker=scripts/safety/check_cards.py
py=${PYTHON:-python3}
if [ ! -f "$builder" ]; then
  echo "No card builder yet ($builder): skipped."
  exit 0
fi
args=()
[ -f data/measure/export.ndjson ] && args+=(--games data/measure/export.ndjson)
[ -f data/measure/evals.jsonl ] && args+=(--evals data/measure/evals.jsonl)
if [ ${#args[@]} -eq 0 ]; then
  echo "No games since 2026-10-16 saved yet: the cards stay as they are."
  exit 0
fi
"$py" -I -B "$builder" "${args[@]}" --workers "${WORKERS:-3}" --stockfish "${STOCKFISH:?set STOCKFISH}"
status=$?
if [ $status -eq 0 ] && [ -f "$checker" ]; then
  check_args=()
  [ -f data/measure/export.ndjson ] && check_args+=(--games data/measure/export.ndjson)
  "$py" -I -B "$checker" ${check_args[@]+"${check_args[@]}"}
  status=$?
fi
if [ $status -ne 0 ]; then
  echo "Card build or check failed (exit $status)."
fi
exit $status
