#!/usr/bin/env bash
# The steps of .github/workflows/newcomers.yml, kept here so they can be run on a Mac exactly as on GitHub.
# Dry run on a Mac (no commit, no push, no new GitHub run; the git and gh commands are printed instead):
#   DRY_RUN=1 PY=.venv/bin/python research/2026-10-16-diagnosis/newcomers/ci.sh all pilot 1 6
# Usage: ci.sh run MODE | ci.sh publish MODE | ci.sh chain MODE ROUND MAX_ROUNDS | ci.sh all MODE ROUND MAX_ROUNDS
#   MODE full  = build newcomers.json from the full database sample and commit it (never over a committed one)
#   MODE pilot = 2 database ranges and at most 20 game exports; nothing is committed
# Environment: PY (python, default python3), WORK (saved Lichess answers; default ~/.cache/chess-project-newcomers),
#   OUT (where the run writes its files first; default a temporary folder), BUDGET_MINUTES (default 300),
#   DRY_RUN=1, GITHUB_OUTPUT / GITHUB_STEP_SUMMARY / GITHUB_REF_NAME (set by GitHub).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
N=research/2026-10-16-diagnosis/newcomers
PY="${PY:-python3}"
WORK="${WORK:-$HOME/.cache/chess-project-newcomers}"
OUT="${OUT:-${RUNNER_TEMP:-${TMPDIR:-/tmp}}/newcomers-out}"
BUDGET_MINUTES="${BUDGET_MINUTES:-300}"
OUTPUTS="${GITHUB_OUTPUT:-/dev/null}"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/null}"
cd "$ROOT"

say() { printf '%s\n' "$*" | tee -a "$SUMMARY" >&2; }
act() { if [ "${DRY_RUN:-}" = 1 ]; then printf 'DRY RUN, would run: %s\n' "$*" >&2; else "$@"; fi; }

run() {   # writes OUT/{newcomers,players} (or pilot-*); exit code 0 = finished, 3 = not finished yet
  local mode="$1" code=0
  mkdir -p "$OUT"; rm -f "$OUT/newcomers.json" "$OUT/players.csv" "$OUT/pilot-newcomers.json" "$OUT/pilot-players.csv"
  if [ "$mode" = pilot ]; then
    "$PY" -I "$N/newcomers.py" run --work "$WORK" --only-points 0,48 --max-exports 20 --pilot --out "$OUT" || code=$?
  else
    "$PY" -I "$N/newcomers.py" run --work "$WORK" --budget-minutes "$BUDGET_MINUTES" --out "$OUT" || code=$?
  fi
  echo "code=$code" >> "$OUTPUTS"
  if [ "$code" != 0 ] && [ "$code" != 3 ]; then say "newcomers.py stopped with an error (exit $code)"; return "$code"; fi
  local f="$OUT/newcomers.json"; [ "$mode" = pilot ] && f="$OUT/pilot-newcomers.json"
  if [ -f "$f" ]; then
    "$PY" -I "$N/newcomers.py" scan --work "$WORK" "$f" "${f%newcomers.json}players.csv"
    say "$("$PY" -I -c 'import json,sys; d=json.load(open(sys.argv[1])); print("Matched newcomers ({}): {} players, mean change {}, SE {}, drift SD {}; steps {}".format(sys.argv[2], d["players"], d.get("mean_change"), d.get("mean_change_se"), d.get("drift_sd"), json.dumps(d["steps"])))' "$f" "$mode")"
  else
    say "Not finished yet (exit $code): progress is saved in the cache; the next run continues."
  fi
  return 0
}

publish() {   # full mode only: commit OUT's files, unless newcomers.json is already committed (then compare)
  local mode="$1" dest="$N/newcomers.json"
  [ "$mode" = full ] || { say "Pilot: nothing is committed."; return 0; }
  [ -f "$OUT/newcomers.json" ] || { say "Nothing to publish yet."; return 0; }
  if git ls-files --error-unmatch "$dest" >/dev/null 2>&1; then
    if cmp -s "$OUT/newcomers.json" "$dest" && cmp -s "$OUT/players.csv" "$N/players.csv"; then
      say "newcomers.json is already committed and this run rebuilt it byte for byte (reproducibility check passed)."
    else
      say "newcomers.json is already committed and is frozen; this run's rebuild differs and was NOT committed:"
      "$PY" -I -c 'import json,sys; a,b=(json.load(open(p)) for p in sys.argv[1:3]); [print(f"  {k}: committed {a.get(k)}, this run {b.get(k)}") for k in ("players","mean_change","mean_change_se","drift_sd")]' "$dest" "$OUT/newcomers.json" | tee -a "$SUMMARY" >&2
    fi
    return 0
  fi
  act cp "$OUT/newcomers.json" "$OUT/players.csv" "$N/"   # a dry run must not touch the repo's copy either
  act git config user.name 'github-actions[bot]'
  act git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
  act git add "$N/newcomers.json" "$N/players.csv"
  act git commit -m "Matched newcomers for the study (preregistration.md 3.6), built by the newcomers workflow"
  local i
  for i in 1 2 3 4 5; do
    if act git pull --rebase && act git push; then
      if [ "${DRY_RUN:-}" = 1 ]; then say "Dry run: nothing was committed or pushed."; else say "newcomers.json committed and pushed."; fi
      return 0
    fi
    sleep $((10 * i))
  done
  say "Push failed 5 times."; return 1
}

chain() {   # not finished: start the next run of this workflow (GitHub stops a job after 6 hours)
  local mode="$1" round="$2" max="$3"
  if [ "$round" -ge "$max" ]; then say "Not finished after $max runs; start the workflow again to continue."; return 1; fi
  say "Starting run $((round + 1)) of at most $max to continue."
  act gh workflow run newcomers.yml --ref "${GITHUB_REF_NAME:-main}" -f mode="$mode" -f round="$((round + 1))" -f max_rounds="$max"
}

case "${1:-}" in
  run) run "$2" ;;
  publish) publish "$2" ;;
  chain) chain "$2" "$3" "$4" ;;
  all)
    code=0; OUTPUTS="$(mktemp)"; run "$2"; code="$(sed -n 's/^code=//p' "$OUTPUTS" | tail -1)"; rm -f "$OUTPUTS"
    if [ "$code" = 0 ]; then publish "$2"; elif [ "$2" = full ]; then chain "$2" "$3" "$4"; fi ;;
  *) echo "usage: ci.sh run|publish MODE | chain|all MODE ROUND MAX_ROUNDS" >&2; exit 2 ;;
esac
