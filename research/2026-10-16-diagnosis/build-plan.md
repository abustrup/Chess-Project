# Build plan for the next phase (version 2, 2026-10-16)

Written by the lead after two independent critiques of version 1. Plain summary for Alexander first, then the
tasks. Every task owns its files alone, so agents can work in parallel. Acceptance checks are things a script or a
browser test can verify.

## In plain words

- **What gets built:** a daily measuring job (the judge), a Safety-check trainer on your own positions (it opens by
  itself after your 40th rated 10+0 game), a smaller set of opening courses, a simpler daily plan, a rating page
  that shows your Lichess rating, and checks that keep the course text honest.
- **One rule protects the experiment:** everything that changes what the app teaches, except the trainer, goes live
  before your 11th rated 10+0 game. Whatever misses that point waits until the study ends (game 160). Error fixes
  are always allowed.
- **Nothing costs money:** GitHub Actions on a public repo, Lichess's public API, Stockfish and ts-fsrs (MIT).

## What changed from version 1, and why

| Change | Why (evidence) |
|---|---|
| Courses, daily plan and Review labels ship before game 11, not at the unlock | Both critics: at the unlock five things changed at once, so a "worked" could not be pinned on the trainer |
| 30-game "before" (games 11-40), trainer after game 40, study ends at game 160 | Pace unknown and 10+0 games are slow; power for a one-third drop 40-52% against 47-60% with 50 games, false "worked" unchanged at about 4% (version-2 simulation, 4,000 players per case) |
| "Did not work" renamed "no big effect" | A real 15% drop gets that answer 14-19 times in 100 |
| Matched newcomers become a binding second condition for "worked" | Without it, newcomer learning of 2 per 100 moves gives a false "worked" 12-20% of the time; with it 3.5-3.9% |
| Mechanism test pre-set (key secondary) | If the trainer halves only threat blunders, the main rule says "worked" 14-19 times in 100, the mechanism test 76-86 times |
| Own cards only from mistakes that lose material, allow mate or leave a threat standing (99 of 163) | 74 of 163 records are positional; a safety check does not fix them and the fact templates cannot describe them truthfully [verified count] |
| About a third of new cards hide nothing (held threats and quiet positions); the line is written before the move is confirmed | Only 17% of his tested moves faced a threat (126 of 748); otherwise the drill trains trick-hunting |
| Englund chapter, London idea card and Jobava dropped | White is fine (1 of 14 games below 25% at move 12); Jobava's reason did not reproduce (Black 50%, n = 236) |
| Self-rating input kept, relabelled "Bot starting strength" | It sets Play's default bot level (`session.ts` `levelIdFor`) [verified] |
| Fresh full recount at each look | The verdict must not trust a saved cache |
| Opponent overshoot needs no design change | A 100-point stronger opponent changes the blunder rate by a factor of 1.006 (95% 0.994-1.018; 17,278 analysed 10+0 player-games, 950-1250, September 2026) [verified] |

## Order and deadlines

1. **Now (lead):** R1, then commit `research/2026-10-16-diagnosis` with the version-2 prereg scripts, the claim
   checker and the deep-check tools; write a paste-ready AsPredicted file with the real commit hash; send Alexander
   its link. He time-stamps before his 11th rated 10+0 game.
2. **Before his 11th rated 10+0 game (hard):** M1 live; G1, H1, O1, V1 merged. The lead reads
   `public/data/study/status.json` before each merge; anything that teaches and arrives later is held until the
   study ends.
3. **Before his 41st game (hard for N1, soft for the rest):** L1, C1, S1, H2 merged (they stay invisible until the
   unlock); N1 committed.
4. **Any time:** R2, Q1, D1.

## Tasks

### R1. Research folder safe for the public repo
- **Goal:** replace the 31 Lichess and 1 chess.com opponent usernames in the 4 raw files with fixed placeholders
  (keep titles, ratings, rating changes, game ids); save `my-games/summary.md` (the my-games text verbatim plus a dated
  "Corrections after the independent check" section); show that nothing downstream changed.
- **Why:** the repo is public; the lead's scan found names only in these 4 files; the my-games agent could not
  write summary.md.
- **Owns:** `research/2026-10-16-diagnosis/my-games/lichess_abustrup.ndjson`, `lichess_abustrup_raw.pgn`,
  `chesscom_abustrup_2020-03.json`, `chesscom_abustrup_2020-03.pgn`, `summary.md`.
- **Acceptance:**
  - A scan of every repo file for the 32 names (case-insensitive, word boundaries; list kept in the scratchpad only)
    finds 0 hits.
  - `prereg/check_instrument.py` and `--engine` pass; the 6 prereg SHA-256 hashes equal preregistration.md 3.9.
  - `my-games/scripts/stats.py` reproduces 111/891, threat 39/126, opponents 86/897, thrown 9/16 and 6/27,
    Caro-Kann 7/10 against London 1/14.
  - summary.md's corrections section lists: threat-gap lower bound about +1.5; "threat carried out" means "left a
    real threat standing" (played in 3 of 10); B4575r7G gives 9 of the 39 threatened-move blunders (26%, 30 of 115,
    without it); opponents 9.6-10.7 by engine setting; p against the population 0.12 two-sided; halving needs 35
    games; performance 995-1001; 8 of 11 Caro-Kanns predate the course; the 77/34-game figures are superseded.
  - No file over 50 MB and no raw database extract in the folder.
- **Depends on:** nothing.

### M1. Daily measuring job (the judge)
- **Goal:** `.github/workflows/measure.yml`, daily: verify the prereg hashes; fetch his rated games (honest
  User-Agent), save the export without opponent names; run `check_instrument.py`, `measure.py --input`, `verdict.py`;
  commit `data/measure/games.csv`, the eval cache and a heartbeat row; write `public/data/study/status.json`; run
  `scripts/safety/build_cards.py` if present; start `deploy.yml`.
- **Why:** Lichess analyses a game only on request (6 of 31 so far) and he has not committed to clicking; the
  pre-registration names this job.
- **Owns:** `.github/workflows/measure.yml`, `scripts/measure/**`, `data/measure/**`, `public/data/study/**`.
- **Acceptance:**
  - Refuses to run (non-zero exit, file named) if any prereg file differs from its hash; tested on a tampered copy.
  - On an ubuntu runner (`workflow_dispatch`, dry run) the pinned `sf_19` Linux build passes `check_instrument.py`
    and `--engine`; result in status.json as `instrumentCheck`, reported to the lead before the time-stamp.
  - Fixture: his blitz export with 12 games relabelled 600+0 gives 12 rows byte-identical to running measure.py
    directly. A second live run adds 0 rows and the old games.csv is a byte-exact prefix of the new one.
  - status.json has `asOf`, `eligibleGames`, `phase`, `unlockAfterGame` (from `verdict.windows()`, 40), `unlocked`,
    `U` (40, or the eligible games started before the first main commit containing `src/pages/Safety.tsx`, if later),
    `nextMilestone`, `newcomersBinding` (true only if `newcomers/newcomers.json` with 30+ players was committed
    before game U+1's start time), `lastRunOk`, `instrumentCheck`.
  - At 110 and 160 eligible games the job reruns measure.py on all eligible games with an empty cache and computes
    `public/data/study/verdict.json` and `verdict.txt` from those fresh rows, with any difference from games.csv
    listed; before game 110 neither file exists.
  - Concurrency group plus `git pull --rebase` with retry before push; a failing step commits nothing; a failing
    build_cards.py never blocks the measurement commit; a commit at least every 7 days keeps the schedule alive.
  - After a push the job runs `gh workflow run deploy.yml`; the live `data/study/status.json` shows the new `asOf`
    within 15 minutes. A run with 10 new games finishes in under 30 minutes. No committed file holds an opponent name.
- **Depends on:** R1.

### G1. Study gate
- **Goal:** `src/lib/studyGate.ts`: `readGateSync()` and `useStudyGate()` return `{eligibleGames, unlockAfterGame,
  phase, unlocked, asOf, source}`. Count from the public Lichess export since 2026-10-16 00:00 UTC with exactly
  measure.py's `eligible()`; threshold from status.json `unlockAfterGame`, fallback constant 40. Fallbacks: status.json,
  then cache, then locked.
- **Why:** the trainer must open by itself at U = 40, and the gate's count must equal the instrument's.
- **Owns:** `src/lib/studyGate.ts`, `src/lib/studyGate.check.ts`, `src/lib/fixtures/study-gate-cases.ndjson`,
  `scripts/check-gate-parity.py`.
- **Acceptance:**
  - Fixture of 15+ games (aborted, noStart, casual, 10+5, 15+10, 5+3, Chess960, from position, BOT opponent, no
    moves, opponent-only move, him as White and Black, timeout, resignation after one move);
    `check-gate-parity.py` imports prereg `measure.py` unchanged and gets the same ids in the same order.
  - Injected counts: locked at 39, unlocked at 40; phase changes at 10/11, 40/41, 60/61, 160/161.
  - Network blocked: status.json values with source "daily job"; both blocked: cached value; nothing: locked.
  - No production unlock override: a search of `dist/` for any test hook or URL override finds nothing.
  - At most 1 request per 10 minutes, never blocks rendering; cache key under `cc.study.*`.
- **Depends on:** nothing (reads M1's status.json schema above).

### L1. Lichess rules in TypeScript
- **Goal:** `src/lib/lichessRules.ts`: `winningChances`, `povDiff`, `retroAccept` (4-point rule, +-1000 clamp,
  mate mapping), `serverJudgment` (game-page rule, no clamp, lila mate rules, no judgement for the best move),
  `isRetroCandidate`.
- **Why:** trainer verdicts and Review labels must follow Lichess; the app's `classifyMove` uses 20 points and a
  +-10000 clamp.
- **Owns:** `src/lib/lichessRules.ts`, `src/lib/lichessRules.check.ts`, `src/lib/fixtures/lichess-rule-vectors.json`,
  `scripts/check-rule-parity.py`.
- **Acceptance:** trainer-spec 7A vectors A1-A5 pass; `serverJudgment` on Lichess's evals of his 6 analysed games
  reproduces all 428 labels; `isRetroCandidate` marks exactly 45 of 215 moves; parity script feeds 2,000+ vectors
  (mates included) to the TS rule and to prereg `lichess_rule.py` (unchanged) with identical labels; tsc 0 errors.
- **Depends on:** nothing.

### C1. Card builder from his own games
- **Goal:** `scripts/safety/build_cards.py` writes `public/data/safety/cards.json` from his games and evals. Kinds:
  **own** (his moves meeting Lichess's "Learn from your mistakes" rule whose category is hung_piece, ignored_threat,
  allowed_short_mate, allowed_longer_tactic, missed_free_material, missed_own_tactic or missed_short_mate, or that
  were made facing a concrete threat; positions already below 10% excluded); **held** (threat-test positions where
  he did not blunder; flag `nothing_to_win`); **quiet** (no threat, he played fine; at most 15% of the file). Each card:
  fenBefore, lastMove, side, top 5 moves with win%, topComplete, game move, threat line, template facts,
  `wasWinning` (75%+ before the move), context.
- **Why:** his biggest gaps are threatened positions (31% against 15%) and winning positions with no threat (22%
  against 9%); 74 of 163 records are positional and do not train the check.
- **Owns:** `scripts/safety/**`, `public/data/safety/**`, `data/safety/**`.
- **Acceptance:**
  - `check_cards.py` runs trainer-spec B1-B3, B6, B8, B10, B11 on every card plus two new checks: a card with a
    "quiet" fact never has a failing game move; no fact says "wins material" unless the stored line wins 2+ points.
    The file validates against `cards.schema.json`.
  - On the 31 blitz games with the saved 250k evals: the own cards equal exactly the 99 mistakes.json records in
    the listed categories or flagged `something_to_defend` (74 Blunders, 23 Mistakes, 2 Lichess-only Mistakes), minus listed exclusions; held
    cards are the 82 threatened positions with no Blunder or Mistake (126 minus 44), minus listed exclusions; all 16
    `nothing_to_win` blunders appear.
  - On held and quiet cards the game move passes the 4-point rule when it was within 4 points of the best.
  - No opponent name and no URL in the file; byte-identical rebuild; one new 10+0 game adds in under 5 minutes on a
    4-CPU runner; engine setting recorded; CLI documented in `scripts/safety/README.md` for M1.
- **Depends on:** nothing.

### S1. Safety-check trainer page
- **Goal:** `/safety`, locked until the gate opens. The board shows his opponent's last move. He picks a move (not
  final), writes one line (2-140 characters) on what he checked, may change the move, then confirms; only then the
  verdict (precomputed top moves with the 4-point rule; browser engine for undecided moves), template facts, the
  refutation on the board, "You were winning" when `wasWinning`, and "Last time you wrote". ts-fsrs 5.4.2, automatic
  grades; a card retires after a correct answer at an interval of 14 days or more.
- **Why:** the habit he asked to train, on his own positions, returning over days and weeks.
- **Owns:** `src/features/safety/**`, `src/pages/Safety.tsx`, `src/App.tsx`, `src/types.ts`, `src/lib/storage.ts`,
  `package.json`, `package-lock.json`, `scripts/e2e-smoke.mjs`.
- **Acceptance:**
  - Locked (39 games): no nav item; `/#/safety` says "Opens after your 40th rated 10+0 game on Lichess (you have
    39)" with the number from the gate; no request for `cards.json`.
  - Unlocked with a fixture card file: trainer-spec C1, C3, C5-C8 pass; no verdict before a line is written and the
    move confirmed; an empty line shows "One word is enough"; the move can be changed after writing.
  - `ts-fsrs` pinned at exactly 5.4.2; D1, D2 and D4 pass with fuzz off and a fixed clock of 2026-10-20 08:00 UTC; a
    card answered correctly at 14+ days leaves the queue.
  - Queue defaults 10 new + 10 reviews (a setting); about 35% of new cards are held or quiet (quiet at most 15%);
    no two cards from the same game adjacent.
  - `scripts/e2e-smoke.mjs` gains `/review` and `/safety` and an unlocked run that serves a fake Lichess export and
    status.json through Playwright `page.route`; every page clean in both states at 390 px and desktop.
  - Exports `safetyDueToday()` from `src/features/safety/queue.ts`; Safety is lazy-loaded; the main chunk grows by
    at most 15 KB gzip; tsc 0 errors; `npm run build` passes.
- **Depends on:** G1, L1, C1.

### H1. Home: the study version (before game 11)
- **Goal:** today's plan becomes "Solve 5 easy puzzles: hanging pieces, forks, defending" (existing themed sets)
  and "Play a rated 10+0 game on Lichess" (`https://lichess.org/#pool/10+0`, new tab); openings and tactic lessons
  leave the plan but stay in the menu. A study status card shows games counted, phase and next milestone, and the
  verdict line once `verdict.json` exists; at games 110 and 160 it asks him to download his backup and send it.
- **Why:** the plan must be the same before and after the unlock, apart from the trainer.
- **Owns:** `src/features/home/**` except `RatingCard.tsx` and `settings/ProfileSection.tsx`; `src/pages/Home.tsx`.
- **Acceptance:** `buildPlan` returns exactly [puzzles, lichess 10+0] in a new `progress.check.ts` (existing
  `sanitize.check.ts` updated); a synced rated 600+0 game today marks the lichess item done; the status card shows no
  blunder rate before `verdict.json` exists; the external link has `rel=noopener`; 390 px clean in both themes;
  tsc 0 errors; merged before `status.json` shows 11 eligible games.
- **Depends on:** G1.

### H2. Home: the trainer in the plan (gated)
- **Goal:** once unlocked, the plan is [Safety check "N positions", puzzles, lichess 10+0]; the Continue card points
  to `/safety` when reviews are due.
- **Why:** the trainer is the treatment; it goes first.
- **Owns:** same files as H1 (runs after H1).
- **Acceptance:** with 12 due: [safety "12 positions", puzzles, lichess]; empty queue: safety item done; locked
  state identical to H1's output (snapshot); e2e clean locked and unlocked.
- **Depends on:** H1, S1.

### O1. Opening courses, narrowed
- **Goal:** first commit (merge at once, an error fix): correct the 3 false sentences (london.ts:180, london.ts:306,
  slav.ts:580). Then narrow in place from the PROPOSAL table: London 7, Caro-Kann 8, Slav 5 chapters (20 in all);
  lines end by about move 8; one taught move per position (the 20 conflicts); 1...c6 as the Black entry against 1.d4,
  1.c4 and 1.Nf3; 3...Bg4 after 1.e4 c6 2.Nf3 d5 3.e5; 6.Ne5 and 8.dxe5 where those lines survive; 2.Bc4 d5 3.exd5
  cxd5 4.Bb3/4.Bb5+ in the Caro-Kann odd-moves chapter. No Englund chapter, no London idea card, no Jobava.
- **Why:** courses are left by move 2-5 at 1000-1300; about 150 of 1,425 decisions come up in 1 of 200 games; he met
  2.Bc4 in 2 of 11 Caro-Kanns and lost both; White is fine.
- **Owns:** `src/data/openings/**`, `research/2026-10-16-diagnosis/openings-v2/**`,
  `research/2026-10-16-diagnosis/engine/**`.
- **Acceptance:**
  - The first commit changes only the 3 sentences; `npm run check:claims` then reports 0 false.
  - At most 20 chapters; course ids and kept chapter ids unchanged (merged chapters keep the main chapter's id); a
    script confirms every line ends by move 8 apart from listed trap lines.
  - `check-openings.ts` 0 errors; `check:claims` 0 false (any new false verdict read, then fixed or recorded as a
    misparse); `deep-check-openings` run locally with its cache committed in `engine/`: 0 taught moves flagged at
    every depth apart from listed deliberate choices (1.d4 b6 2.Nf3, with reason), 0 conflicts, no line ending with
    him 50 cp or more worse.
  - `analyse_courses.py` and `km.py` on the narrowed courses with the same September sample: per course, the share
    still in course after the opponent's 2nd and 3rd move is no more than 2 points below today's.
  - Merged before `status.json` shows 11 eligible games, or held until the study ends.
- **Depends on:** nothing.

### V1. Review labels follow Lichess's thresholds
- **Goal:** Review labels moves with `lichessRules.serverJudgment` thresholds (Inaccuracy 5, Mistake 10, Blunder 15
  points, no clamp); the legend says the browser engine is quicker than Lichess's, so counts can differ.
  `src/lib/evaluation.ts` unchanged.
- **Why:** the app should not call a 15-point drop anything but a blunder; ships before game 11 so both phases match.
- **Owns:** `src/features/review/**`.
- **Acceptance:** fed Lichess's own evals for his 6 analysed games, Review's labelling returns Lichess's labels on all
  428 judged moves; e2e `/review` clean; tsc 0 errors; merged before game 11 or held.
- **Depends on:** L1.

### R2. Rating page
- **Goal:** live Lichess ratings from `/api/user/abustrup` (rapid first, then blitz) with games and Lichess's range
  (rating +-2 RD); "?" and "provisional" at RD 110+; never the 1500 placeholder; one chess.com translation line from
  a map rebuilt on the 140 pooled identity-checked pairs (8-in-10 range, N, date, never called his rating); history
  from consecutive pre-game ratings of imported games plus the live rating. Remove the blended estimate and its
  breakdown. Keep the self-rating field, relabelled "Bot starting strength".
- **Why:** he said his Lichess rating is the rating for Lichess games; chess.com has no current rating; the
  move-based estimate failed its test (190 points off at 10 games).
- **Owns:** `src/features/rating/**`, `src/pages/Rating.tsx`, `src/features/home/RatingCard.tsx`,
  `src/features/home/settings/ProfileSection.tsx`, `public/data/rating/**`,
  `research/2026-10-16-diagnosis/rating/scripts/build_pooled_map.py`,
  `research/2026-10-16-diagnosis/rating/results/chesscom_map_pooled.json`.
- **Acceptance:** a mocked 2026-10-16 response shows blitz 1017, range 889-1145, 31 games, "No rapid rating yet" and
  a chess.com line with a centre of 480-525 and an 8-in-10 range inside 350-690; RD 120 shows "?" and no chess.com
  line; no component imports the old estimate code; RatingCard keeps its props so Home compiles unchanged; a check
  shows Play's default bot level still follows the profile value (`levelIdFor`); offline shows the cached value with
  its date; a browser test on the deployed site fetches the user API (CORS); e2e clean.
- **Depends on:** nothing.

### N1. Matched newcomers
- **Goal:** build `newcomers/newcomers.json` by the fixed rule in preregistration.md 3.6 (windows 11-40 and 61-160).
- **Why:** he is a newcomer; without this, newcomer learning can fake "worked" 12-20% of the time.
- **Owns:** `research/2026-10-16-diagnosis/newcomers/**`.
- **Acceptance:** the rule implemented exactly; 30-100 players or the shortfall reported with counts at each step;
  committed before his 41st rated 10+0 game (M1 records `newcomersBinding`); aggregates with anonymous ids only (0
  usernames, 0 game ids by scan); byte-identical rerun from saved responses; one request at a time with an honest
  User-Agent and back-off on 429; `verdict.py --newcomers` dry run on his blitz rows works.
- **Depends on:** nothing.

### Q1. Content checks stay in the repo, plus a study-freeze guard
- **Goal:** `.github/workflows/content-checks.yml` on pushes and pull requests touching `src/data/**` or the checkers:
  check-openings, check:claims:test, check:claims --strict (Stockfish 19 on the runner, 1 thread), deep-check-openings
  --strict from the committed cache with cloud lookups off, rule and gate parity scripts once they exist. A second job
  fails any pull request touching `src/data/openings/**`, `src/features/home/**`, `src/features/review/**`,
  `src/features/puzzles/**` or `src/features/tactics/**` while status.json shows 11-160 eligible games, unless it
  carries the label `error-fix`.
- **Why:** he asked for every engine-testable claim to be tested and the checks kept in the repo; the freeze makes
  the study rule visible to whoever merges.
- **Owns:** `.github/workflows/content-checks.yml`, `scripts/check-claims.ts`, `scripts/check-claims.check.ts`,
  `scripts/lib/claims/**`, `scripts/deep-check-openings/**`, `scripts/check-openings.ts`,
  `research/2026-10-16-diagnosis/claims/**`.
- **Acceptance:** passes on main after O1's first commit and fails before it, naming exactly the 3 sentences; a test
  branch with one false sentence and one taught move losing 100+ cp fails and names both; under 20 minutes with 0
  Lichess cloud requests; the freeze job fails a test PR at a mocked 11 games and passes it with `error-fix`;
  check:claims:test 35 of 35 and the mutation test 93 of 93.
- **Depends on:** nothing (green on main needs O1's first commit).

### D1. Integrate, verify, document
- **Goal:** run the full suite on main; update `docs/HANDOFF.md` (study rules, the freeze, daily jobs, how to re-run
  every check, open items), write `docs/tasks/safety.md` (definition of done and cuts), update `README.md`; publish a
  private screenshot page of the gated features for Alexander (never an interactive build before game 40).
- **Why:** he cannot read code and must trust what shipped; the next session must not contaminate the baseline.
- **Owns:** `docs/HANDOFF.md`, `docs/tasks/safety.md`, `README.md`.
- **Acceptance:** tsc, build, every `*.check.ts`, check-openings, check:claims, check:claims:test, both parity
  scripts, `check_instrument.py`, `verdict.py --selftest` pass on main; e2e clean at 390 px and desktop, both
  themes and zen, locked and unlocked; the live site with under 40 games shows no Safety item, the narrowed courses,
  the study plan and status card, and the new rating page (browser check); HANDOFF lists every gated item and the
  freeze; README has no blended estimate.
- **Depends on:** all other tasks.

## Deliberately not built

- Population, "judge" (safe or not safe) and puzzle-file cards: his own games give 99 mistakes plus 82 held threats
  from 31 blitz games. Revisit only if new own cards fall below the daily quota for 7 days in a row.
- Cards for his 64 quiet positional mistakes: a safety check does not fix them; revisit after the study.
- In-app "Sync my Lichess games" and interim cards: the daily job builds cards overnight.
- "Log in with Lichess": the export and user API are public and CORS-open; no API requests a server analysis.
- Any rating for unrated games, chess.com shown as his rating, the blended estimate.
- Two v1/v2 course sets served side by side: the narrowed courses ship before game 11 or after the study.
- The Englund chapter, the London quiet-moves card and the Jobava; the Slav main lines, Krause, Slav accepted,
  Semi-Slav bridge, other 4th moves, London middlegame plans, bishop harassment, pins and pokes, Grunfeld, and
  Caro-Kann Fantasy, Panov and accelerated Panov as chapters.
- A dynamic rule putting openings back in the plan; new teaching prose; two prompt boxes instead of one line;
  showing the position one move earlier on review; a Review "Try it" rework; a blunder-check mode in Play.
- A weekly cadence (daily instead); the Lichess opening explorer (needs a token); a paid outside check.
- The rejected study designs (everything at the unlock, randomized unlock, coin-flip warm-ups, 50- or 100-game
  baselines, comparison group only).
- His running blunder rate on screen during the study: only counts and the phase until a verdict exists.

## Questions only Alexander can answer

1. Roughly how many rated 10+0 games a week will you play? Only used to give dates. At 2 a day the trainer opens in
   about 3 weeks and the final check comes in about 11.5.
2. Will you click "Request computer analysis" after each rated 10+0 game? Optional; it makes Lichess's own count a
   full second check.
3. Minutes a day for the trainer? Default 10 new positions and 10 reviews, about 20-30 minutes; changeable in
   Settings.
4. Your games in the public repo: default yes. The daily job saves moves, clocks, ratings and game ids of your rated
   games, with no opponent names. Reply "no" and it keeps only counts.
5. 1...c6 as your answer to 1.d4 in the course: default yes, since you play it in 2 of 3 games.
6. Length of your "before": default 30 games. Reply "longer" for 50 (trainer after game 60, study ends at 180); the
   lead then reruns the scripts and hashes before you time-stamp.
7. AsPredicted (default) or OSF for the time-stamp, before your 11th rated 10+0 game.
8. Optional: a real chess.com number needs about 20 rated games there.
