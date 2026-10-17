# Handover note: Chess Coach

Updated 2026-10-17 by task D1 (build plan version 2, `research/2026-10-16-diagnosis/build-plan.md`), after every other
task of that plan was built and independently verified. The note of 2026-10-13 is in git history
(`git show ff2a436:docs/HANDOFF.md`). Revised the same night (02:20-03:40 CEST) by the fixer after the final critique:
the fallback if game 11 comes first, the merge-time Lichess count, no interim numbers on the website, the judge's own
files under the freeze, and the safety rule on held and quiet cards; rows marked "fixer" were re-run then.
Labels: **[verified]** = run or read by D1 on 2026-10-17 (01:20-02:10 CEST, the night after 2026-10-16);
**[reported]** = from a task's own verified report of 2026-10-16/17, not re-run by D1; **[inferred]** = follows from
those; **[assumed]** = not checked.

## Read this first: the app is in a study

The owner, Alexander (Lichess **abustrup**), is testing whether a Safety-check trainer cuts his blunders in rated
10+0 Lichess games. The rule was written before any game counted: `research/2026-10-16-diagnosis/preregistration.md`.
**A careless change can ruin it, and nobody can undo that.** Before you touch anything:

1. **Read `public/data/study/status.json`** (live: https://abustrup.github.io/Chess-Project/data/study/status.json).
   `eligibleGames` is the number of his rated 10+0 games that count. Pull `main` first: the daily job commits to it.
   It is written once a day (04:23 UTC), so it can miss games played since. **Before any merge that touches teaching
   or judge files, also count now:** `perfs.rapid.games` at https://lichess.org/api/user/abustrup (send an honest
   User-Agent such as `ChessCoach-measure/1.0 (+https://github.com/abustrup/Chess-Project)`; bare curl gets 404) is an
   upper bound on his eligible games (it also counts other rapid time controls). The `study-freeze` job counts the
   export with `measure.py`'s own rule and judges by the larger of that and status.json.
2. **From game 11 to game 160** (later if the trainer opened late: the end of `windows.looks` in status.json) nothing
   that teaches may change: course lines and text, lesson text, Home's plan, Review labels, puzzle selection,
   tactics, Play's coach, the engine, the Lichess rules, the study gate or the menu. The full list is `FROZEN` in
   `scripts/lib/claims/study-freeze.ts`. Only **error fixes** (a false sentence, a crash) may change those files, and
   the pull request must carry the label `error-fix`. The trainer itself (`src/features/safety/`,
   `src/pages/Safety.tsx`, `public/data/safety/`) may be improved after it opens. The rest of the rating page,
   settings and looks may change any time.
3. **The trainer stays invisible until game 40.** Never show him an interactive build, a preview link or one of his
   card positions before the app opens it. Screenshots of made-up positions are fine.
4. **No blunder rate before the verdict** (game 110 at the earliest), on screen or in words. Counts and the phase
   only. Never compute or tell him (or write anywhere he reads) blunder numbers from `data/measure/` (`games.csv`,
   `interim-look-*.json`) or the verdict files before `public/data/study/verdict.json` holds a verdict, even when he
   asks "how am I doing?": the answer is the count, the phase and the next milestone. A check at game 110 that does not
   decide keeps its numbers in `data/measure/interim-look-1.json` (not on the website; SHA-256 in status.json).
5. **Never edit the 6 pre-registered files** in `research/2026-10-16-diagnosis/prereg/` (their SHA-256 hashes are in
   preregistration.md 3.9; the daily job refuses to run if one changes). Never hand-edit `data/measure/**`. The judge's
   own files (`INSTRUMENT` in `scripts/lib/claims/study-freeze.ts`: `scripts/measure/**`, `measure.yml`, the prereg
   folder, `newcomers.json`, the 3 pinned my-games inputs and the freeze rule) change during the study only with the
   label `instrument-deviation` and a dated entry in preregistration.md 3.8 in the same change; status.json's
   `judgeSha256` shows each day which version of the job ran.
6. Anything that differs from the plan gets written down with its date: preregistration.md 3.8 lists the deviations
   the final report must name.

| His rated 10+0 games | Phase (as the Home card names it) | What the app does |
|---|---|---|
| 1-10 | Warm-up (not counted) | study version: 20-chapter courses, 2-step plan, Lichess labels on Review |
| 11-40 | Before the trainer (the baseline) | the same, frozen |
| after 40 | the trainer opens by itself | Safety check in the menu and first in the plan |
| 41-60 | Trainer starts (not measured yet) | frozen apart from the trainer |
| 61-110 | With the trainer, look 1 (verdict possible) | Home asks for a backup at 110 |
| 61-160 | With the trainer, look 2 (final) | Home asks for a backup at 160; the study ends |

On 2026-10-17 at 01:34 CEST he had **0** eligible games: the app's own gate counted them from the live Lichess export
(HTTP 200) on a local production build [verified]. `status.json` in the working tree says 0 as of 2026-10-16 21:13 UTC.

## State on 2026-10-17

Everything below sits **uncommitted on the branch `study-v1`** in `/Users/alexanderbustrup/Chess-Project`; `main` is
`d5fb2e1`. GitHub Pages **is on**: the API answers `build_type: workflow`, https://abustrup.github.io/Chess-Project/
answers 200 and serves `main`, the pre-study version, so `data/study/status.json` answers 404 there until the study
version is pushed and the daily job's first commit is deployed [verified 2026-10-17 01:22 CEST]. The last deploy ran
on 2026-10-16 11:16 UTC.

Every task below was built, then re-checked by a separate verifier with its own tests; each verifier fixed what it
found and passed its task [reported]. D1 then ran the whole suite on the combined tree (next sections) [verified].

| Task | What | State |
|---|---|---|
| R1 | opponent names replaced in the research folder; reusable scrub script | done |
| M1 | daily measuring job `measure.yml`, `scripts/measure/`, `data/measure/`, `public/data/study/status.json` | done locally; Linux runner and live Pages check not yet run |
| G1 | study gate `src/lib/studyGate.ts` (counts his games like measure.py, opens at 40) | done |
| L1 | Lichess rules `src/lib/lichessRules.ts` | done |
| C1 | Safety-check cards `scripts/safety/`, `public/data/safety/cards.json` (182 cards since the fixer's safety rule, 2026-10-17) | done; 4-CPU runner timing not run |
| S1 | Safety-check page `/safety`, `src/features/safety/` | done, locked |
| H1, H2 | Home: 2-step study plan and study card; the trainer step once unlocked | done |
| O1 | courses narrowed from 40 to 20 chapters (London 7, Caro-Kann 8, Slav 5) | done |
| V1 | Review labels on Lichess's thresholds (5 / 10 / 15 points) | done |
| R2 | rating page shows the live Lichess rating; blended estimate removed | done; CORS check on the real Pages site not run |
| N1 | matched newcomers `research/2026-10-16-diagnosis/newcomers/newcomers.json` (100 players) | done; must reach `main` before game 41 |
| Q1 | `content-checks.yml`: claim checks, deep engine check, parity, app checks, study freeze | done locally; runner not yet run |
| D1 | this note, `docs/tasks/safety.md`, `README.md`, the AsPredicted file, the full check run, a screenshot page | done |

## What changes when (the gated items)

**Must be live before his 11th rated 10+0 game.** In practice that is every task above: the study freeze covers
`src/App.tsx`, `src/lib/studyGate.ts`, `src/lib/lichessRules.ts`, `src/features/home/`, `src/features/review/`,
`src/pages/Home.tsx` and the courses, so G1, L1, V1, O1, H1, H2 and S1's menu and route all have to land before
then. Before each merge read the live status.json and count on Lichess now (rule 1).

**If game 11 comes first (the fallback).** Hold what changes his teaching, H1 (Home's 2-step plan), O1 (the narrowed
courses) and V1 (the Review labels), until the study ends (game 160). Still ship the measurement (M1, N1) at once and
the trainer pieces before game 40: G1 (the gate), L1 (the Lichess rules), C1 (the cards) and S1 including its menu
item and route in `src/App.tsx`, plus H2's trainer step on Home if it can go in without H1's plan. Without the gate,
the menu and the route there is no trainer and so no study, so these go in with the label `error-fix` and a dated
entry in preregistration.md 3.8 saying what shipped late and why (the final report names it). The baseline then has
the old app, which is fine as long as it stays the same through game 160.

**Changes by itself after game 40** (nothing to deploy then):
- the **Safety** item in the menu (`src/App.tsx`, after Home);
- `/#/safety` switches from "Opens after your 40th rated 10+0 game on Lichess (you have N)" to the trainer;
- `public/data/safety/cards.json` is downloaded for the first time (never before the unlock);
- Home's plan becomes [Safety check "N positions", puzzles, a rated 10+0 game] and the Continue card points to
  `/safety` while positions are left today (H2).

**Changes by itself later:** the study card's phase and next milestone (every phase change); the backup ask at games
110 and 160 (fixed games: with a late unlock the looks move by U - 40 but the asks do not); the verdict line on Home
once `public/data/study/verdict.json` exists (game 110 at the earliest).

**U (the unlock game):** 40, unless `src/pages/Safety.tsx` reaches `main` after his 40th eligible game; then U is the
number of eligible games started before that commit, games 41 to U are dropped and every later window moves by
U - 40. The job dates commits by committer time on main's first-parent line: land the trainer and `newcomers.json`
through a pull-request merge, or push them the same day they are committed (a fast-forward keeps the older commit
time) [reported by M1, tested with a throwaway repository].

## The study freeze (Q1)

The `study-freeze` job of `content-checks.yml` runs on every pull request and every push to `main`. While his game
count is 11 up to the study's last game, it fails when a change touches a path in `FROZEN`
(`scripts/lib/claims/study-freeze.ts`), unless the pull request has the label `error-fix` (on a push: "error-fix" in
a commit message). The count is the larger of the base branch's status.json and a live count of his rated 10+0 games
on Lichess with the pre-registered `measure.py` (from the base branch); when Lichess cannot be asked, a change to
frozen files is blocked until a re-run gets an answer. A change to the judge's own files (`INSTRUMENT`, rule 5) needs
the label `instrument-deviation` (on a push: in a commit message) and a change to preregistration.md in the same pull
request, where the deviation is written into 3.8. `FROZEN` holds: the courses, tactics and eco data in `src/data/`; `src/features/` openings, home,
review, puzzles, tactics and play, plus the rating page's advice (`WorkOnPanel.tsx`, `insights.ts`); the pages Home,
Play, Openings, Tactics, Puzzles and Review; `src/App.tsx`; `src/lib/` studyGate, lichessRules, evaluation,
openingName, pgnTree and puzzleData; `src/engine/`, `public/engine/` and `public/puzzles/`. `EXEMPT` (never frozen):
the trainer. The rule and the game count are read from the base branch, so a change cannot loosen the rule it is
judged by. It warns when status.json is over 3 days old. It **only blocks merging** once the branch rules in
`scripts/measure/main-ruleset.json` are applied (open item 6). Self-tests: 59 of 59 freeze cases and 57 of 57
workflow dry-run cases [verified by the fixer, 2026-10-17].

## The daily jobs (all free on this public repository)

| Workflow | When | What it does | If it fails |
|---|---|---|---|
| `measure.yml` | every day 04:23 UTC; by hand with `dry_run` | checks the pinned hashes of the pre-registered files (9 files) and the engine (`check_instrument.py --engine`), fetches his rated games (honest User-Agent), replaces opponent names, runs `measure.py` and `verdict.py`, appends to `data/measure/`, writes `public/data/study/status.json` (with `judgeSha256`, the hashes of the job's own files), rebuilds the cards (a card failure never blocks the measurement), commits, starts `deploy.yml`. At 110 and 160 eligible games it recounts everything from an empty cache and writes `verdict.json` and `verdict.txt`; a check that does not decide writes only "no verdict yet" there and keeps its numbers in `data/measure/interim-look-1.json` and `.txt` (not deployed). | nothing is committed that day; the run shows red and GitHub e-mails the account behind the workflow's last change [inferred]; the games stay on Lichess and the next good run measures them |
| `deploy.yml` | push to `main`, or started by `measure.yml` | builds and publishes the site; skips publishing with a yellow note if Pages is off | site keeps the previous version |
| `content-checks.yml` | pushes and pull requests | check-openings, claim checks, deep engine check from the committed cache (no Lichess requests), rule and gate parity, the app's own checks, study freeze | the pull request shows red |
| `newcomers.yml` | by hand: `pilot` (commits nothing) or `full` (45-60 min) | rebuilds the matched-newcomer group from public Lichess data; never overwrites a committed `newcomers.json` | nothing committed |

**Who must act on them:** nobody on a normal day, by design. `asOf` in status.json shows the last good run. A red
run sends a GitHub e-mail; the next Claude session should check `gh run list --workflow measure.yml` first. GitHub
switches off schedules after 60 days without repository activity; the job's daily heartbeat commit keeps it alive
[inferred]. Once `main` is protected, the job pushes with a deploy key (`scripts/measure/README.md`, "Pushing to a
protected main").

## How to re-run every check

From the repo root. Needs `npm install`, `.venv` (python-chess 1.11.2) and native Stockfish 19 at
`/opt/homebrew/bin/stockfish`. Browser tests need the app served (the tests default to http://localhost:5199/; set
`APP_URL` for anything else, for example a production build served under `/Chess-Project/`) and Chrome or Chromium
(`CHROMIUM` overrides the path). Results: D1's run on 2026-10-17 on the working tree of `study-v1`, which is what
`main` will hold [verified]. `main` itself still holds the pre-study version, so "on main" means after the push.

| Check | Command | Result 2026-10-17 |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | 0 errors |
| Production build | `npm run build` (D1 built into a scratch folder with `npx vite build --outDir <scratch>`) | passes |
| Lichess rules | `npm run check:rules` | all passed (28 ok) |
| Rule parity (TS against prereg Python) | `npm run check:rules:parity` | 3,262 of 3,262 vectors identical on all 5 functions (2,834 generated, 1,137 with a mate, 1,525 labelled) |
| Study gate | `npm run check:gate` | all ok (57 ok) |
| Gate parity (TS against prereg `measure.py`) | `npm run check:gate:parity`; after a build add `-- --dist <build folder>` | same 23 ids in the same order; the build contains the gate and no unlock override or test hook (49 files) |
| Review labels | `npm run check:review` | all passed (20 ok) |
| Home | `npm run check:home` | all good (93 ok, then sanitize) |
| Safety trainer | `npm run check:safety` | verdict 31, schedule 23, queue 34 ok (fixer, 2026-10-17) |
| Rating | `npx tsx src/features/rating/rating.check.ts` | all passed (44 ok) |
| Every other `*.check.ts` | `npx tsx <file>` for `src/features/play/session.check.ts`, `src/features/puzzles/rating.check.ts`, `src/features/rating/import.check.ts`, `src/features/review/moveFacts.check.ts` | all passed (`scripts/build-puzzles.check.ts` is a helper module with nothing to run) |
| Courses well formed | `npx tsx scripts/check-openings.ts` | 3 courses, 20 chapters, 0 errors, 4 warnings (lines ending on his move) |
| Claim checker self-test | `npm run check:claims:test` | 35 of 35 hand-made cases; 93 of 93 fixed mutations and 50 of 50 on today's text caught; 12 of 12 wrong material claims judged false |
| Every testable sentence | `npm run check:claims -- --strict --out <scratch>` | 1,481 claims read, 1,192 true, 0 false (13 s) |
| Every taught move | `.venv/bin/python scripts/deep-check-openings/check.py --strict --offline --threads 2 --hash 256 --cache-from research/2026-10-16-diagnosis/engine --out <scratch>` | 0 problems, 6 notes; 698 searches reused, 0 new, 0 Lichess requests |
| Prereg hashes | `.venv/bin/python -I scripts/measure/verify_prereg.py` | 9 of 9 pinned files match: the 6 of preregistration.md 3.9 (also checked with `shasum -a 256`) plus 3 saved files the instrument check compares against |
| Instrument | `.venv/bin/python -I research/2026-10-16-diagnosis/prereg/check_instrument.py --engine` | fixture 111/891 and every game match; 117 of 117 positions re-searched identically (74 s) |
| Verdict rule | `.venv/bin/python -I research/2026-10-16-diagnosis/prereg/verdict.py --selftest` | passed |
| Daily job | `.venv/bin/python -I scripts/measure/selftest.py --work <scratch>` | 64 of 64 (fake engine, 167 s; fixer, 2026-10-17) |
| Daily job's workflow steps | `python3 scripts/measure/workflow_dryrun.py --work <scratch>` | 21 of 21 (about 20 minutes) |
| Cards | `.venv/bin/python -I scripts/safety/check_cards.py`, then `--diagnosis`, then `--rebuild warm` | ALL PASS each time: 182 cards (81 own, 80 held, 21 quiet), quiet 11.5%, rounding vectors 5 of 5; own = 99 records minus 18 listed exclusions, held = 82 minus 2; byte-identical rebuild (fixer, 2026-10-17) |
| Cards against a full search (B10) | `.venv/bin/python -I scripts/safety/check_cards.py --engine 50` (about 25 min with 3 engines from nothing) | 1,715 of 1,716 decided moves agree (99.9%) [fixer, 2026-10-17] |
| Newcomers | `.venv/bin/python -I research/2026-10-16-diagnosis/newcomers/newcomers.py selftest` | 49 checks passed |
| Study freeze | `node scripts/lib/claims/study-freeze.ts --self-test`; `python3 scripts/lib/claims/workflow-dryrun.py` | 59 of 59; 57 of 57 (fixer, 2026-10-17) |
| AsPredicted text | `python3 research/2026-10-16-diagnosis/make_aspredicted.py --check` | no difference from preregistration.md section 2 |
| Every page | `APP_URL=<site> node scripts/e2e-smoke.mjs <scratch>` | 96 of 96 clean on a production build under `/Chess-Project/` and 96 of 96 on the dev server (locked and open, phone and desktop, normal and zen-Ember) |
| Pages by feature | `APP_URL=<site> npx tsx src/features/<feature>/<name>.e2e.ts <scratch>` for home, rating, review, safety | home 85 ok, rating 38 ok, review 27 ok, safety 78 ok, all on the production build (fixer, 2026-10-17) |

D1 also ran its own browser checks (scratchpad only, not committed): every page in all 16 combinations of locked/open,
390 px/desktop, Ocean/Ember and zen off/on on the production build, 192 of 192 clean (no console error, no sideways
scroll, the Safety item only when open, 2 or 3 plan steps as expected); and the production build with the real
Lichess and status.json: no Safety item, the 2-step plan and study card, 7/8/5 chapters, blitz 1017 on the rating
page, no estimate, no `cards.json` request, no console error [verified].

## Open items, by deadline

**Before the time-stamp (the lead):**
1. N1's design limit, one line, your call: the newcomers are chosen by their September 2026 rating (900-1300), which
   may favour players who did not improve; the 30 who began before 2025 got worse by about 0.93 per 100 moves, the 70
   who began in 2025-2026 by -0.17, so c may understate newcomer learning. `newcomers/README.md` says so; limits
   (a)-(c) in preregistration.md 3.6 do not. Adding it changes no hashed file and not section 2.
2. Today, not later: he can play several 10+0 games a day, and every teaching change that misses game 11 waits until
   game 160 (see the fallback under "What changes when"). Just before pushing, confirm `perfs.rapid.games` is under 11
   at https://lichess.org/api/user/abustrup (honest User-Agent; 0 at 2026-10-17 00:24 UTC [verified by the fixer]).
   Commit and push (see "Commit order" below: the pre-registration commit with `newcomers/newcomers.json` first), run
   item 3, then item 4, then fill `<COMMIT>`:
   `python3 research/2026-10-16-diagnosis/make_aspredicted.py --commit <full hash>`, and send Alexander the GitHub
   link to `research/2026-10-16-diagnosis/aspredicted.md`.
3. On the runner: `gh workflow run measure.yml --ref main -f dry_run=true`. The summary must show "bench 2497913
   nodes", "pre-registered files match their hashes (9 of 9)", the instrument check PASSED with 117 of 117 positions,
   and `instrumentCheck.platform` "Linux x86_64" in the artifact's status.json. If the Linux check fails, nothing is
   measured there and the verdict comes from a build that passes (prereg 3.8).

**Before his 11th rated 10+0 game:**
4. A real run: `gh workflow run measure.yml --ref main -f dry_run=false`. Expect the commit "Daily measurement
   YYYY-MM-DD: 0 new rated 10+0 games (0 counted)" and a `deploy.yml` run; within about 15 minutes
   https://abustrup.github.io/Chess-Project/data/study/status.json must show that run's `asOf`. Then repeat on the
   live site what D1 checked on the local build: no Safety item, the 2-step plan with the study card, 7/8/5 chapters,
   the live rating page; and the feature tests with `APP_URL=https://abustrup.github.io/Chess-Project/`: home 85 ok,
   safety 78 ok, smoke 96 ok, review clean, and `LIVE=1 npx tsx src/features/rating/rating.e2e.ts <out>` (expects
   "live: the browser let the page read it (CORS) and it shows a blitz rating").
5. After the push, open GitHub, Actions, "Content checks": claims, deep-check, parity and app-checks green; the
   Stockfish step prints "bench 2497913 nodes"; the deep-check log ends with "new searches: 0 ... Lichess cloud
   requests this run: 0". Then the canary pull request from `scripts/deep-check-openings/make_ci_canary.py` (steps in
   Q1's report): it must fail naming the planted sentence and the planted move; close it and delete the branch.
6. Branch protection (repository settings, so ask Alexander's yes before game 11): follow `scripts/measure/README.md`,
   "Pushing to a protected main", in its order, and add the label `instrument-deviation` next to `error-fix` (deploy key, secret, the `error-fix` label, then the ruleset in
   `scripts/measure/main-ruleset.json`, which requires `study-freeze`, `claims`, `deep-check`, `parity` and
   `app-checks`). The ruleset JSON is untested against GitHub [reported by M1].
7. Decisions that touch frozen files, so best settled now:
   - the `?fixture=1` URL flag on Openings (`src/features/openings/courses.tsx`) and Tactics
     (`src/features/tactics/useTacticsData.ts`) adds pretend test content in production; it cannot open the trainer,
     but it changes a teaching page. Remove it or confirm it is harmless;
   - Review's "Try it" (`src/features/review/useTryIt.ts`) still judges alternatives at depth 10 with the old clamp,
     not Lichess's 4-point rule. Ship the change before game 11 or leave it until game 160;
   - the Lichess step on Home only shows "Done today" after he imports games by hand on My rating. The gate already
     reads his export every 10 minutes; a small change could tick the step from it;
   - the Continue card and the "Your openings" cards on Home still invite him to openings, which the plan dropped.
     Same before and after, so the study is not broken; a taste call;
   - "My rating" shows a per-game "N% accuracy" for each analysed game (`GamesPanel.tsx`), and Review shows per-game
     accuracy too. Not a running rate, so left in; hide it if you read the "no running blunder rate" rule more widely;
   - `src/App.tsx` shows a blank page when `cc.profile` holds JSON `null` ("Cannot read properties of null (reading
     'appTheme')", reproduced again by D1 on the production build, 2026-10-17; already in git `HEAD`). An error fix,
     cheapest before game 11.
8. Credits: ts-fsrs (MIT) is in the in-app list (`src/features/home/settings/credits.ts`) but not in
   `docs/CREDITS.md`. Add: ts-fsrs, "Decides when each Safety-check position comes back: the next day after a miss,
   otherwise days or weeks later.", MIT, https://github.com/open-spaced-repetition/ts-fsrs.
9. Alexander time-stamps on AsPredicted (steps in `aspredicted.md`).

**Before his 41st game:**
10. `newcomers.json` on `main` (PR merge or same-day push); status.json then shows `newcomersBinding: true`.
11. Teaching decisions on the trainer (`docs/tasks/safety.md`, "Open decisions"): the first three are settled (the
    fixer, 2026-10-17): held and quiet cards now accept any safe move (under 15 points lost, no mate, under 2 points of
    material given away), every legal move of those cards is stored so the browser engine is never needed there, and
    held cards whose game move the card search finds unsafe are left out. The rest of that list is small. Anything
    changed after the unlock (game 40) is a reported deviation.

**At games 110 and 160:** Home asks Alexander for a backup file; add it (or its dose numbers) to the final report.

**Any time (small, not urgent):**
- `research/2026-10-16-diagnosis/prereg/__pycache__/` is untracked and `.gitignore` has no `__pycache__/` rule: add
  the rule or skip the folder when committing.
- `docs/tasks/rating.md` names two famous players' public Lichess accounts as examples (committed in `ff2a436`). The
  rule "no Lichess usernames other than abustrup in committed files", read strictly, needs them replaced.
- R2's correction: 139 pooled chess.com players from 140 pairs (one September player was counted twice), centre 505,
  8 in 10 between 367 and 669 at blitz 1017. `rating/README.md` and `rating/rating-page-spec.md` still name
  `results/chesscom_map.json` (79 pairs, 483); the app uses `results/chesscom_map_pooled.json`.
- `src/features/review/analyse.ts` line 24 points to the deleted `features/rating/calibration.ts` (comment only);
  `src/pages/Home.tsx` still reads the unused `cc.ratingEstimate`. Both frozen: fix after the study or with
  `error-fix`.
- `research/2026-10-16-diagnosis/diagnosis.md` and `openings/PROPOSAL.md` cite the 40-chapter engine numbers; they now
  live in `engine/v1-40-chapters/`. Q1's mutation fixtures still name removed chapters (its self-test passes).
- `scripts/deep-check-openings/deliberate-choices.json`: 1.d4 g6 2.Bf4 passes the strict gate only because the 3M-node
  search said 48 cp (51 at 30M nodes), and the Dutch 4.Nf3 was 52 cp at 150M nodes. Listing both as deliberate
  choices, with the reason, keeps a re-run at other settings from turning the checks red over a known choice.
- An optional online deep-check run can fill the 161 positions without a Lichess cloud evaluation.
- Opening progress is keyed by line position (`src/features/openings/progress.ts`), so stats saved before the
  narrowing attach to different moves. If his old progress matters, clear `openings.nodes` once for the 3 courses.
- Keep `~/.cache/chess-project-newcomers` (8.3 MB) on this Mac until the study ends: it holds other players' names
  and game ids, so it must never go into the repo, and it is the only source for a byte-identical newcomer rebuild.
- Older items from 2026-10-13, not re-checked: in drill, a move made before the opponent's first move lands is
  ignored; `Board.tsx` keeps the promotion menu open after Solution/Skip.

## Commit order (from the task reports)

- **One push before game 11 is simplest**, since the freeze covers most of the app. Within it:
  the pre-registration commit holds `research/2026-10-16-diagnosis/` with `newcomers/newcomers.json` (SHA-256
  c3ca7bbe...) and reaches `main` by a merge or a same-day push.
- R1: commit the 4 scrubbed raw files exactly as they are (M1 pins `my-games/lichess_abustrup.ndjson` at SHA-256
  b6ba04e6...; the job refuses any other version), `my-games/summary.md`, `my-games/scripts/scrub_usernames.py` and
  `rerun.sh`. Re-run R1's 32-name scan just before committing (command in R1's report; expect 0 and 0).
- O1 as one change: the 3 course files, the deletion of `london-more-a.ts` and `london-more-b.ts`, `openings-v2/` and
  `engine/` (both caches: the CI deep check reuses them). Merge only while the live status.json shows under 11.
- Q1: push `content-checks.yml` with or after O1's narrowing, never with O1's 3-sentence fix alone (the 40-chapter
  courses fail the deep check with 26 problems).
- M1 in one push: `measure.yml`, the changed `deploy.yml`, `scripts/measure/**`, `data/measure/README.md`,
  `data/measure/runs.csv` and `public/data/study/status.json`.
- L1 with or before V1 (`labels.ts` imports `lichessRules.ts` and its fixture); `src/features/review/**` together.
- C1: `scripts/safety/**`, `public/data/safety/cards.json`, `data/safety/report.json`, `data/safety/engine-cache.jsonl`.
- S1 with or after G1, L1 and C1, and before or with H2 (Home imports `src/features/safety/`): `src/features/safety/**`,
  `src/pages/Safety.tsx`, `src/App.tsx`, `src/types.ts`, `src/lib/storage.ts`, `package.json`, `package-lock.json`,
  `scripts/e2e-smoke.mjs`.
- H1 and H2: `src/pages/Home.tsx` and `src/features/home/**`, with `src/features/puzzles/choice.ts` and `Trainer.tsx`.
- R2: the new files with the 8 deletions; `public/data/rating/` and `src/features/rating/fixtures/` are new folders.
- N1: `research/2026-10-16-diagnosis/newcomers/**` and `.github/workflows/newcomers.yml`.
- Do not commit `research/2026-10-16-diagnosis/prereg/__pycache__/`. After the commit, delete the scratch copies that
  hold real usernames (R1's list).

## The owner's preferences (follow them)

- Plain, simple language. No code as explanation; never ask him to read code. Treat his messages as open direction.
- Visual taste: blue or warm colours, never a green brand colour; simple, recognisable pieces; must not look like a
  copy of chess.com (top pill navigation, serif headings, flat soft buttons, "Ocean" and "Ember" themes).
- Free to run (GitHub Actions on a public repo, Lichess's public API, Stockfish, ts-fsrs). A paid outside check is
  fine if it is worth it: propose it with the price.
- Defaults in force because he has not answered (build plan, "Questions only Alexander can answer"): pace unknown, so
  dates are estimates; no "Request computer analysis" clicks assumed; 10 new + 10 review positions a day (changed on
  the Safety check page, in its "Today" panel, not in Settings); his games in the public repo without opponent names;
  1...c6 against 1.d4; a 30-game "before" (games 11-40); AsPredicted for the time-stamp.

## Run it locally

```
npm install
npm run dev            # http://localhost:5173/   (hash routes: /#/play, /#/openings ...)
npm run typecheck      # tsc --noEmit
```
Double-clicking `Open Chess Coach.command` opens the published site, https://abustrup.github.io/Chess-Project/, so his
progress stays in one browser and one address. He should train there, never on a local build.
`scripts/.cache/` (the 307 MB Lichess puzzle DB) is not in git; the shipped puzzles are in `public/puzzles/`.

## Where things are

`docs/agent-brief.md` (architecture, rules, URL contract, design), `docs/tasks/*.md` (per-feature definitions of done;
the trainer's is `docs/tasks/safety.md`), `research/2026-10-16-diagnosis/` (diagnosis, pre-registration, build
plan, evidence, `aspredicted.md`), `scripts/measure/README.md` (the daily job), `scripts/safety/README.md` (the cards),
`research/2026-10-16-diagnosis/newcomers/README.md` (the comparison group), `scripts/deep-check-openings/README.md`
(the engine check of the courses). Shared contracts: `src/types.ts`.

## Known issues / gotchas

- Lichess answers HTTP 404 to HeadlessChrome's user agent and to bare curl on the game export. Browser tests serve
  Lichess through Playwright (`page.route`, as every committed browser test now does) or set a normal Chrome user
  agent; scripts send an honest User-Agent naming the repo. His normal browser gets 200 [inferred from a normal
  Chrome user agent getting 200].
- The app runs the study gate on every page, so a browser test that does not route lichess.org makes a real Lichess
  request (at most 1 per 10 minutes per fresh browser profile).
- On the Vite dev server the app imports `studyGate.ts?t=<timestamp>`; a test that imports `/src/lib/studyGate.ts`
  gets a second module with stale state. Import the URL listed in `performance.getEntriesByType('resource')`.
- Lichess's export is ordered by when a game ended; anything that numbers his games sorts by `createdAt`.
- `prefers-color-scheme` changes nothing here: the app's themes are Ocean and Ember (`cc.profile.appTheme`).
- Feature CSS needs two-class selectors to beat `theme.css` (it is imported after `App`).
- The Vite dev server sometimes serves a freshly rewritten file empty; touching the file fixes it.
- Stockfish in Node allows one engine instance per process (`scripts/lib/nodeEngine.ts`).
- Piece sets "Friendly" and "Bold" are CC BY-NC-SA (personal, non-commercial use only), see `docs/pieces-credits.md`;
  the app bundles Stockfish (GPL-3.0), hence the GPL-3.0 `LICENSE`.
- In zsh, an unquoted `$FILE:any` is read as a path modifier; quote `"${FILE}:any"` when passing `FILE:TC` to
  `check-gate-parity.py`.
