# The daily measuring job (the judge)

Written 2026-10-16 for build-plan task M1 (`research/2026-10-16-diagnosis/build-plan.md`). The rules it applies are
in `research/2026-10-16-diagnosis/preregistration.md`; this folder only runs them.

## In plain words

Every morning a free GitHub job (`.github/workflows/measure.yml`) does what the pre-registration promises, with
nobody clicking anything:

- It first checks that the pre-registered scripts are byte for byte the ones that were time-stamped. If one differs,
  it stops and names the file.
- It checks the chess engine on GitHub's computer against the saved results from 2026-10-16. If they differ, it stops.
- It downloads your rated Lichess games since 2026-10-16, replaces your opponents' names with "Opponent 01",
  "Opponent 02" and so on, and counts your rated 10+0 games with the pre-registered script.
- It adds one line per new game to `data/measure/games.csv` and never changes an earlier line.
- It writes `public/data/study/status.json`: how many games count, the phase, the next milestone. The app reads it.
  It shows no blunder numbers.
- After your 110th and 160th counted game it recounts every game from scratch and writes the verdict
  (`public/data/study/verdict.json` and `verdict.txt`). Those files do not exist before game 110. If the check after
  game 110 does not decide, the website only learns "no verdict yet": the numbers of that check go to
  `data/measure/interim-look-1.json` and `.txt`, which are saved in the repo but never put on the website, so you do
  not see a running blunder rate while the study goes on.
- It saves everything in the repo and asks GitHub to put the website up again, so the app shows the new count within
  about 15 minutes. Then it rebuilds the Safety-check cards. If that fails, the measurement is still saved.

If a step fails, nothing is saved that day and the run shows red on GitHub. For a scheduled run GitHub e-mails the
account that last changed the schedule line in `measure.yml` (its notification rule; [inferred], normally abustrup's
account, since his account pushes the repo). The games stay on Lichess, so the next successful run measures them.

Nobody is obliged to act on a normal day. The `asOf` date in `status.json` shows when it last worked. The study-freeze
check (`content-checks.yml`) also warns when that date is over 3 days old, but only on a change that touches the
teaching files; on other days a stopped job shows up only as GitHub's failure e-mail and an old `asOf`.

## Files

| File | What it is |
|---|---|
| `daily.py` | the job itself (steps below); nothing is written unless every step passes |
| `verify_prereg.py` | the hash check: exit code 1 and the file named when a pre-registered file differs |
| `run_instrument.py` | runs prereg `check_instrument.py --engine` on the job's Stockfish and writes the result as JSON |
| `config.json` | the pinned hashes (they must equal preregistration.md 3.9), paths, Lichess settings |
| `common.py` | shared parts: hashes, name replacement and the name scan, phases, git history |
| `push.sh` | commits only the listed paths and pushes, with `git pull --rebase` and 5 tries |
| `cards.sh` | runs `scripts/safety/build_cards.py` and `check_cards.py` when they exist |
| `status_note.py` | notes a later problem (cards) in status.json: `lastRunOk` false |
| `make_fixture.py` | his blitz export with the first N games relabelled as 10+0 (tests) |
| `fixtures/blitz12_as_600.ndjson` | that fixture with 12 games |
| `selftest.py` | the job's tests on a fake engine (about 3 minutes) |
| `workflow_dryrun.py` | runs the shell steps of `measure.yml` on a throwaway copy of the repo, without GitHub, and tests `deploy.yml`'s "is Pages on?" step |
| `main-ruleset.json` | the branch rules for `main` (pull requests, the 5 content checks), with the job's deploy key as the one actor allowed to push past them (see "Pushing to a protected main") |
| `testing/stub_engine.py` | the fake UCI engine for the tests (it can never pass the instrument check) |

Written by the job: `data/measure/export.ndjson` (his games, opponents replaced, append-only),
`data/measure/games.csv` (measure.py's rows, append-only), `data/measure/evals.jsonl` (the engine results,
append-only, so a day's run searches only new games), `data/measure/runs.csv` (one heartbeat row per run),
`public/data/study/status.json`, and from game 110 `public/data/study/verdict.json` and `verdict.txt` (plus
`data/measure/interim-look-N.json` and `.txt` for a check that does not decide).

## What daily.py does, and why

1. **Instrument.** The 6 prereg files must equal their SHA-256 in preregistration.md 3.9, and the copy of those hashes
   in `config.json` must agree with the table, so editing one place is not enough, and the four files the job runs
   (`measure.py`, `lichess_rule.py`, `verdict.py`, `check_instrument.py`) must stay in the table. The three saved files
   `check_instrument.py` compares against are pinned too. The instrument check must have passed on the binary with the
   same SHA-256 as the one used to measure, at most 24 hours earlier (on GitHub: minutes earlier, in the same run).
   The time control is the pre-registered 600+0, fixed in `daily.py`; a different `tc` in `config.json` is refused.
   So is a different trainer page (`src/pages/Safety.tsx`, which decides U), and a newcomer SHA-256 or path in
   `config.json` that preregistration.md does not name (so editing the settings file alone cannot change which
   newcomer version counts as the pre-registered one).
2. **Games.** measure.py's own `fetch()` (rated rapid since 2026-10-16, User-Agent
   `ChessCoach-measure/1.0 (+https://github.com/abustrup/Chess-Project)`), then the same for blitz and classical
   (for the cards only; measure.py's filter keeps rated standard 10+0 games and nothing else). One request at a time;
   a 429 waits 60 s and retries once. Every game must be one of his.
3. **Names.** Opponents become "Opponent NN" in the order of his games (the same form as R1's
   `scrub_usernames.py`); titles stay, so BOT games stay excluded. A PGN, if an export ever carries one, gets the same
   names in its White and Black tags. Before anything is written, every string in every file to be written is compared
   with the real names of this run's export (exact match, case ignored; inside a PGN, any whole word). A hit stops
   the job and prints only a hash of the name, because Actions logs are public. A false alarm (an account named like a
   Lichess value, such as "draw") is cleared by adding that hash to `nameScanAllow` in `config.json`.
4. **Counting.** measure.py (unchanged) runs on all eligible games with the saved eval cache. New games are searched
   once: the first by that very run of measure.py, the rest beforehand by parallel copies of measure.py that only fill
   the cache. Every search starts from an empty hash at a fixed node count, so a position gives the same result in
   any process. The first new game is left to the main run so that its rows name the engine
   (`Stockfish 19`) exactly as a direct run would, which is why the fixture rows are byte-identical to running
   measure.py directly.
5. **Old rows.** The saved rows must come out the same. A change in a measured column stops the job. A change in what
   Lichess reports (ratings, its own analysis) is listed in `notes`; games.csv keeps the first value. The game list
   must still start with the saved games in the same order; the job never renumbers.
6. **verdict.py** must accept the new games.csv (its output, which shows blunder rates, is not printed).
7. **U and the newcomers** come from the git history of the branch the job runs on (main), first-parent line,
   committer time:
   - `U` = 40, or the eligible games started before the first commit containing `src/pages/Safety.tsx`, if more.
     Until that page exists, U is at least the games played so far.
   - `newcomersBinding` = a version of `research/2026-10-16-diagnosis/newcomers/newcomers.json` committed before the
     start of his game U+1 holds 30+ players with the fields verdict.py needs. Which version: the one pre-registered
     by its SHA-256 (`c3ca7bbe...`, preregistration.md answer 5 and 3.6, pinned in `config.json` `newcomers`), "that
     version, and no other", when it reached the branch in time. Only if it did not does the build plan's rule decide:
     the version in the repo at the start of game U+1. Until game U+1 is played, the newest committed version stands
     in for that. The binding version is passed to `verdict.py --newcomers`.
   - A change to the file after the pre-registered version is a deviation (preregistration.md 3.6, 3.8). status.json
     shows it at once (`newcomers.matchesPreregistered`, `newcomers.atDeadline` with the other version's commit,
     players and SHA-256, `newcomers.changedAfterDeadline`), and at a check `verdict.json` `job.otherNewcomerVersion`
     holds the verdict computed with the other version too, so the final report can give both.
8. **Checks at games U+70 and U+120** (110 and 160): every eligible game is recounted from an empty cache, the
   verdict is computed from those fresh rows, and every difference from games.csv is listed in `verdict.json` (`job`)
   and `verdict.txt`. If the first check decides, the second is not run. Before game U+70 neither file exists; the job
   removes them if they appear. A check that does not decide writes its full report to `data/measure/interim-look-N.json`
   and `.txt` (not deployed) and only the state to `public/data/study/verdict.json` (`primary.verdict` "not yet: next
   look after game 160", `decided_at_game` null, `job.look`, `job.numbers` with the interim file's SHA-256) and a
   one-line `verdict.txt` without numbers. Nobody reads the interim numbers to Alexander before the verdict
   (docs/HANDOFF.md rule 4).

`status.json` fields: `asOf` (when Lichess was asked), `eligibleGames`, `phase` and `phaseLabel` (the words of
`src/lib/studyGate.ts`), `unlockAfterGame` (from `verdict.windows()`, 40), `unlocked`, `U`, `trainerOnMainSince`,
`nextMilestone` (`{game, label}` as in studyGate.ts), `windows`, `newcomersBinding` and `newcomers`, `lastRunOk` and
`problems`, `instrumentCheck`, `newGames`, `lastGameAt`, `verdict` (null before the first check), `interimChecks`
(`[{look, file, sha256, txtSha256}]` for each check that did not decide, null otherwise), `judgeSha256` (the SHA-256 of
`daily.py`, `common.py`, `run_instrument.py`, `verify_prereg.py`, `config.json` and `measure.yml` as run that day, so a
change to the judge during the study shows here; the study freeze asks for the label `instrument-deviation` to change
them), `notes`.

## Running it on a Mac

From the repo root (needs `.venv` with python-chess 1.11.x and Stockfish 19 at `/opt/homebrew/bin/stockfish`):

```
.venv/bin/python -I scripts/measure/verify_prereg.py
.venv/bin/python -I scripts/measure/run_instrument.py --stockfish /opt/homebrew/bin/stockfish --out <scratch>/instrument.json
.venv/bin/python -I scripts/measure/daily.py --instrument <scratch>/instrument.json \
    --stockfish /opt/homebrew/bin/stockfish --workers 3 --work <scratch>
.venv/bin/python -I scripts/measure/selftest.py --work <scratch>        # about 3 minutes, fake engine
python3 scripts/measure/workflow_dryrun.py --work <scratch>              # the workflow's shell steps, no GitHub
```

Anyone can re-derive games.csv from the committed files (only the `engine` column says `cached` instead):

```
cp data/measure/evals.jsonl <scratch>/evals.jsonl      # measure.py adds to its cache file, so give it a copy
.venv/bin/python -I research/2026-10-16-diagnosis/prereg/measure.py --input data/measure/export.ndjson \
    --cache <scratch>/evals.jsonl --out <scratch>/games.csv
```

## The website, while GitHub Pages is off

After each push the job starts `deploy.yml` (a push made with the job's own token starts no workflow by itself). That
start is `continue-on-error`, and `deploy.yml` is a separate run, so the measurement never fails because of the
website. `deploy.yml` itself asks GitHub whether Pages is on before it publishes: while Pages is off (or set to
publish from a branch) it still builds the site, so a broken build still shows red, then skips publishing with a
yellow note instead of failing. Once Pages is switched on (Settings, Pages, Build and deployment, Source: GitHub
Actions), the next run publishes, and https://abustrup.github.io/Chess-Project/data/study/status.json shows the job's
`asOf`. `workflow_dryrun.py --only pages` tests that step against each answer GitHub can give.

## Pushing to a protected main

Once `main` requires pull requests or status checks, GitHub refuses a direct push from the job's own token, so the
daily commit would fail every day. The fix is a deploy key (an SSH key that can write to this one repository and
nothing else) that the branch rules let through. The job checks out with it when the secret exists, and pushes as
before when it does not. The key changes who may push, not what the job checks: the hash check, the instrument check
and the measurement all run before any push.

Steps for the lead, with Alexander's yes (they change repository settings), from the repo root with `gh` logged in
as abustrup. Order matters: the key and the secret first, the rules last, or the next daily run cannot push.

```
ssh-keygen -t ed25519 -N '' -C 'measure.yml daily measurement' -f <scratch>/measure_key
gh repo deploy-key add <scratch>/measure_key.pub --allow-write --title 'measure.yml daily measurement'
gh secret set MEASURE_DEPLOY_KEY < <scratch>/measure_key
rm <scratch>/measure_key <scratch>/measure_key.pub          # GitHub keeps the only copy it needs
gh label create error-fix --description "Fixes a wrong sentence or a crash; allowed during the study freeze"
gh api -X POST repos/abustrup/Chess-Project/rulesets --input scripts/measure/main-ruleset.json
gh workflow run measure.yml --ref main -f dry_run=false
```

Success: the run's summary says "Pushed to main with the deploy key MEASURE_DEPLOY_KEY", and `gh api
repos/abustrup/Chess-Project/rulesets` lists "main: pull requests and study checks". The rules require a pull request
and the checks `study-freeze`, `claims`, `deep-check`, `parity` and `app-checks` (the job names in
`content-checks.yml`; a check a pull request does not need shows as skipped, which GitHub counts as passed). The deploy
key is the only actor that bypasses them. A push with the key also starts `deploy.yml` through its push trigger, so on
those days the site is built twice; harmless, and it keeps the explicit start for the token case.

## Known limits

- The Linux build on GitHub is assumed to give the Mac's results; `check_instrument.py --engine` tests that on every
  run. If it ever fails there, the job measures nothing and the verdict must be computed on a build that passes
  (preregistration.md 3.8), for instance on the Mac with the commands above.
- Commit time stands in for "deployed" and "committed to the public repository": a commit made earlier and pushed
  later would count from its commit time. Merges and squash merges into main count from the merge (checked
  2026-10-16 with a throwaway repository); a fast-forward push keeps the original commit times, so the trainer page
  and the newcomer file should reach main through a pull request merge, or be pushed on the day they are committed.
- If the engine fails twice on a game, the job stops and reports it rather than excluding the game by itself.
  preregistration.md answer 6 says re-run, then exclude and report; the job leaves that exclusion to the lead, who
  reports it, because removing a game changes the numbering.
- If Lichess ever lists an older game that was missing before, the saved numbering would change. The job then stops
  instead of renumbering; the lead decides.
