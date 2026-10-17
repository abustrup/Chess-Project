#!/usr/bin/env bash
# Commits the given paths (only those) and pushes them to the current branch. When someone else pushed in between,
# it pulls with --rebase and tries again, up to 5 times, then gives up with an error (the remote is left unchanged).
# Writes pushed=true or pushed=false to $GITHUB_OUTPUT when that exists.
# Usage, from the repo root:  bash scripts/measure/push.sh "commit message" path [path ...]
# PUSH_REMOTE (default origin), PUSH_BRANCH (default: the current branch), PUSH_WAIT (seconds per retry, default 10),
# PUSHED_WITH (only printed: which credential measure.yml pushes with, the deploy key or the job token).
set -euo pipefail
msg=$1; shift
remote=${PUSH_REMOTE:-origin}
branch=${PUSH_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}
wait_s=${PUSH_WAIT:-10}
out() { if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "pushed=$1" >> "$GITHUB_OUTPUT"; fi; }

for p in "$@"; do
  # a path counts when it exists now or is tracked (so a deleted file is committed as deleted)
  if [ -e "$p" ] || [ -n "$(git ls-files -- "$p")" ]; then git add -A -- "$p"; fi
done
if git diff --cached --quiet; then
  echo "Nothing changed: no commit."
  out false
  exit 0
fi
git -c user.name='github-actions[bot]' -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
  commit -q -m "$msg"
for i in 1 2 3 4 5; do
  if git pull -q --rebase --autostash "$remote" "$branch" && git push -q "$remote" "HEAD:$branch"; then
    echo "Pushed to $branch${PUSHED_WITH:+ with $PUSHED_WITH}: $msg"
    if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "- Pushed to $branch${PUSHED_WITH:+ with $PUSHED_WITH}: $msg" >> "$GITHUB_STEP_SUMMARY"; fi
    out true
    exit 0
  fi
  git rebase --abort >/dev/null 2>&1 || true
  echo "Push attempt $i failed; trying again in $((i * wait_s)) s."
  sleep $((i * wait_s))
done
echo "Could not push after 5 attempts; nothing was pushed." >&2
echo "If main is protected (pull requests or status checks required), only the deploy key in the secret MEASURE_DEPLOY_KEY may push: see scripts/measure/README.md, 'Pushing to a protected main'." >&2
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "- **Could not push to $branch** after 5 attempts${PUSHED_WITH:+ (with $PUSHED_WITH)}. If main is protected, only the deploy key in MEASURE_DEPLOY_KEY may push (scripts/measure/README.md, 'Pushing to a protected main')." >> "$GITHUB_STEP_SUMMARY"; fi
out false
exit 1
