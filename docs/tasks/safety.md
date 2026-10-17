# Task: SAFETY-CHECK TRAINER (definition of done and cuts)

Written 2026-10-16 by task D1 and updated 2026-10-17, after the trainer's tasks (C1, S1, H2) were built and then
re-checked by separate verifiers. Sources: `research/2026-10-16-diagnosis/build-plan.md` (tasks C1, S1, H2; this file
wins where `design/trainer-spec.md` differs, because the build plan is newer), `research/2026-10-16-diagnosis/preregistration.md`
and `scripts/safety/README.md`.
Labels: **[verified]** = run or read by D1 on 2026-10-17; **[reported]** = from a task's verified report of
2026-10-16/17, not re-run by D1; **[inferred]** = follows from those; **[assumed]** = not checked.

**Code:** `src/features/safety/**`, `src/pages/Safety.tsx`, the route and menu item in `src/App.tsx`, the Safety step
and Continue card in `src/features/home/**`. **Cards:** `scripts/safety/**` writes `public/data/safety/cards.json`
and `data/safety/**`.

## In plain words

- **What it trains:** one habit before every move: (1) what does his last move threaten or allow, (2) what does my
  move allow. That is where his extra blunders were in 31 blitz games: 31% of moves facing a concrete threat (39 of
  126) against his opponents' 15% (22 of 144) [verified counts; the gap is inferred].
- **What a position looks like:** the board shows the position, then plays his opponent's real last move. He picks a
  move (not final), writes one line on what he checked (2 to 140 characters, "nothing" is fine), may change the move,
  then confirms. Only then: safe or not, his line repeated, "What there was to see" (engine-made facts, no AI prose),
  the refutation on the board, "You were winning here" where he was, and "Last time you wrote" when the position
  comes back.
- **Where the positions come from:** his own rated Lichess games, rebuilt every morning by the daily job. On
  2026-10-17: 182 positions from 31 blitz games: 81 of his own mistakes, 80 threatened positions where he held (2 of
  the 82 left out because the card search finds his game move unsafe), 21 quiet positions where nothing was
  threatened [verified by the fixer, `public/data/safety/cards.json`]. On the held and quiet ones every legal move is
  stored: on the 21 quiet cards 539 of 755 moves are right (282 within 4 points, 257 more because they are safe), on
  the 80 held cards 272 of 2,826 (most other moves leave his threat standing).
- **When it opens:** by itself, after his 40th rated 10+0 game on Lichess, counted by the app exactly as the study
  counts. There is no button, address or setting that opens it earlier, and nothing about it is downloaded before.
- **Why it is locked:** games 11-40 are the study's "before". If he used the trainer then, the before and after would
  no longer differ only by the trainer, and the study would be invalid (preregistration.md 3.7).

## Rules the trainer follows (as built)

| Part | Rule | Where |
|---|---|---|
| Lock | `useStudyGate()`: unlocked when eligible games reach `unlockAfterGame` (status.json, else 40). Count from the public Lichess export since 2026-10-16 00:00 UTC with measure.py's filter; an answer holding anything other than games is ignored, never read as a count of 0. At most 1 Lichess request per 10 minutes; fallbacks: status.json, then the cached count, then locked. | `src/lib/studyGate.ts` |
| Safe move | Own cards: Lichess's "Learn from your mistakes" rule: the move keeps his winning chances within 4 points of the best move (win% on Lichess's scale, cp clamped to +-1000, mate N as (21 - min(10, N)) x 100 cp). Held and quiet cards (since 2026-10-17): that, or the safety rule: the move costs under 15 points, allows no mate, and gives away under 2 points of material once its line's exchanges are played out. | `src/lib/lichessRules.ts` `retroAccept`; `scripts/safety/build_cards.py` `move_entry` |
| Verdict order | 1 own card and the game move: wrong ("That was the game move"). 2 held or quiet card: the move's entry in `moves` (every legal move is stored): within 4 points or safe. 3 a move in `top`: the 4-point rule against `top[0]`. 4 the game move on a held or quiet card: its stored verdict. 5 `top` complete (the 5th move already fails): wrong at once. 6 otherwise (own cards only) the browser engine on the position after his move (Lichess's readiness rule: bestmove, 1,000,000 nodes or 3 s) against `top[0]`. Stored win% is rounded to 2 decimals; the card builder checks that rounding never flips a 4-point decision. | `src/features/safety/accept.ts`, `scripts/safety/cards.schema.json` |
| Facts | `threat`, `allowed`, `free`, `quiet`, turned into fixed sentences. A fact names a piece or says "winning material" only when its stored line nets 2+ points after the exchange is finished. A threat is said as "He threatens ...". A quiet card says only "Nothing was threatened here." A card may have no fact. This wording in `facts.ts` is the one to keep: trainer-spec 2.4's templates were false on 5 of 74 threats naming a piece and on 19 of 21 quiet cards; `accept.ts` and `facts.ts` gave 0 problems on all 184 real cards [reported by C1's verifier]. | `scripts/safety/facts.py`, `src/features/safety/facts.ts` |
| After the verdict | "Next position" takes focus; an Enter or Space within 0.7 s of the verdict appearing, or a held key, is ignored, so a second Enter cannot skip the verdict unread. A click always works. | `src/features/safety/Verdict.tsx` |
| Schedule | ts-fsrs 5.4.2 (pinned exactly), 90% target recall, at most 60 days, whole days, default weights, fuzz on in the app. Grade set by the app: wrong or "Show answer" = Again, right but slower than 90 s = Hard, right = Good. Without fuzz: right comes back after 3 days, then 14; missed comes back the next day, then 3, 8, 22. A retry the same day never changes the grade. | `src/features/safety/schedule.ts` |
| Retiring | A position answered right 14 or more days after its previous answer leaves the queue for good. | `schedule.ts` `RETIRE_AFTER_DAYS` |
| Daily queue | Reviews first (most overdue first, at most 10), then up to 10 new positions: about 65% own, 25% held, 10% quiet, quiet never above 15% of all positions started. Own mistakes newest game first, one-move safety errors first. No two positions from the same game next to each other when the mix allows it. A missed position comes back once at the end of the session without changing its schedule. Both caps are steppers in the "Today" panel of the Safety check page (0-30 new, 0-50 reviews), not in Settings. | `src/features/safety/queue.ts`, `SafetyPage.tsx`, `stored.ts` |
| Home | Once unlocked, today's plan is [Safety check "N positions", puzzles, a rated 10+0 game on Lichess] and the Continue card points to `/safety` while positions are left today. Locked, Home is identical to the study version (H2's snapshot and its verifier's own H1-only build). | `src/features/home/progress.ts`, `ContinueCard.tsx`, `useSafetyToday.ts` |
| Storage | `cc.safety.state` (schedule per position), `cc.safety.log` (every answer with his line), `cc.safety.day` (today's queue), `cc.safety.settings`. All `cc.*`, so Settings' backup covers them. | `src/features/safety/stored.ts` |

## Definition of done

Every line below passed on 2026-10-17 on this Mac, on a production build served under `/Chess-Project/` and, for the
smoke test, also on the dev server [verified by D1, unless marked]. The ones marked "runner" still need a GitHub runner.

**Cards (C1)**
- `.venv/bin/python -I scripts/safety/check_cards.py` reports ALL PASS: rounding vectors 5 of 5 (stored win% never
  flips the 4-point decision), schema and trainer-spec B1-B3, B6, B8, the two new checks and the list of every legal
  move (each `safe` and `gain` recomputed from its stored line) on all 182 cards, quiet share at most 15% (21 of 182,
  11.5%), no opponent name and no URL in the file [re-run by the fixer, 2026-10-17].
- `check_cards.py --diagnosis`: own cards equal the 99 qualifying records of `my-games/mistakes.json` minus the 18
  listed exclusions (already lost, or not a "Learn from your mistakes" move), held cards are the 82 threatened
  positions with no Blunder or Mistake minus 2 listed exclusions (game move unsafe in the card search), and all 16
  `nothing_to_win` blunders appear.
- `check_cards.py --engine 50` (B10): the stage rule agrees with a separate search of every legal move on at least
  98% of the moves it decides: 1,715 of 1,716 (99.9%) on 2026-10-17, 1,001 of 1,001 on held and quiet cards (those
  moves are stored from the same kind of search, so this mainly shows the searches repeat exactly) [verified by the
  fixer, 241 s with 3 engines, partly from the searches of 2026-10-16].
- `check_cards.py --rebuild warm` (B11): a rebuild gives a byte-identical file.
- Runner: one new 10+0 game adds in under 5 minutes on a 4-CPU GitHub runner (Mac proxy on 2026-10-16: 93.7 s for a
  110-ply game from nothing with 3 engines; 14 s on the daily path with the committed cache) [reported].

**Trainer page (S1)**
- `npm run check:safety`: verdict 31, schedule 23 and queue 34 checks pass (trainer-spec C3 logic, D1, D2, D4 with
  fuzz off and a fixed clock of 2026-10-20 08:00 UTC; a position answered right at 14+ days leaves the queue; 10 + 10
  defaults; no same-game neighbours, repeats included).
- `APP_URL=<site> npm run e2e:safety -- <outDir>`: 78 ok [fixer, 2026-10-17, dev server and production build]. Since
  2026-10-17 it also checks that a safe quiet move 5.2 points below the best (a3) is "Safe" at once, that a held-card
  move giving away material fails at once and says so, and the browser engine on an own card with an incomplete list. Locked at 39 games (no menu item; "Opens after your 40th
  rated 10+0 game on Lichess (you have 39)"; no request for `cards.json`), open at 40 with a 6-card fixture:
  trainer-spec C1, C3, C5-C8; no verdict before a line is written and the move confirmed; an empty line shows "One
  word is enough."; the move can be changed after writing; a fast second Enter does not skip the verdict.
- `APP_URL=<site> node scripts/e2e-smoke.mjs <outDir>`: every page clean, locked and open, at 390 px and desktop,
  normal and zen-Ember (96 of 96).
- The Safety page is lazy-loaded (its own 46.9 kB chunk, 15.3 kB gzip, on 2026-10-17); tsc 0 errors; the production
  build passes.

**Home with the trainer (H2)**
- `npm run check:home`: with 12 due the plan is [safety "12 positions", puzzles, lichess]; an empty queue marks the
  safety step done; the locked plan equals H1's (snapshot).
- `APP_URL=<site> npm run e2e:home -- <outDir>`: 85 ok, clean locked and open.

**Study integrity (all tasks)**
- `python3 -I scripts/check-gate-parity.py --dist <build folder>` after a build: the build contains the gate and no
  unlock override or test hook.
- Nothing in the trainer writes to `data/measure`, `public/data/study` or the pre-registered scripts.
- No blunder rate on any page before `verdict.json` exists (counts and the phase only).
- D1's own browser run: the locked production build never requests `cards.json`, and with the real Lichess count (0
  on 2026-10-17) shows no Safety item.

## Cut, and why

| Cut | Why |
|---|---|
| Population, "defend" and "judge" cards from the Lichess database | His own games already give 99 mistakes plus 82 held threats from 31 games. Revisit only if new own positions fall below the daily quota for 7 days in a row. |
| Cards for his 64 quiet positional mistakes | A safety check does not fix them, and the fact templates cannot describe them truthfully. Revisit after the study. |
| In-app "Sync my Lichess games" and interim cards | The daily job rebuilds the cards every morning. |
| "Log in with Lichess" | The export and the user API are public and CORS-open; no API can request a server analysis. |
| Opening-book exclusion | The build plan dropped it; own cards follow Lichess's picker instead. |
| A weekly job | Daily instead (`measure.yml`, 04:23 UTC). |
| `focus.json` and openings back in the plan by a rule | The plan is fixed for the whole study: puzzles plus a rated 10+0 game, with the trainer first once it opens. |
| Two prompt boxes, showing the position one move earlier, a blunder-check mode in Play, a Review "Try it" rework, new teaching prose | Not needed for the habit; each would be another change to the app during the study. |
| A fact type for "you had a tactic" | A missed tactic shows through the best move and its line. |
| `free` for a piece that has a defender | The sentence says "unprotected", which was false for 4 of 8 such facts on 2026-10-16. |
| Grading his written line | Code cannot mark it fairly; the line is stored and shown back, and its quality is only described at the end, from his backup. |

## What may change, and when

- **Before game 40:** anything in the trainer, as long as it stays invisible. No interactive build, preview link or
  card position from his games may reach him before the trainer opens; screenshots of made-up example positions are
  fine (D1's screenshot page uses two textbook positions that occur in none of his 31 games).
- **After game 40:** the trainer may be improved (preregistration.md answer 4); the measure and the rule may not.
  Every change after the unlock is reported as a deviation with its date.
- **Never during games 11-160:** changes to Home, Review, puzzles, tactics, the opening courses, the menu or the study
  gate, except error fixes labelled `error-fix` (the study-freeze job enforces this; the list is `FROZEN` in
  `scripts/lib/claims/study-freeze.ts`). The trainer's own folder is exempt. The Home trainer step (H2) and the menu
  item are already in, so they need no change later.

## Open decisions (2026-10-17)

1. **Quiet positions fail many reasonable moves.** [Done 2026-10-17 by the fixer: held and quiet cards accept any
   safe move, see "Safe move" above and `scripts/safety/README.md`.] Under the 4-point rule, balanced quiet positions reject most
   moves: 20 of 26 on `quiet:B4575r7G:22`, 38 of 47 on `quiet:FWvViwBk:15` (a3 there loses 4.4 points), and 276 of
   755 legal moves on 19 of 21 quiet cards fail without hanging anything [reported by C1, 2026-10-16]. If quiet cards
   are meant to teach "nothing to fear, play a safe move", limit them to positions where many moves pass (for example
   clearly winning ones). A teaching change: best decided before game 40, so the first quiet card he sees is the final
   kind.
2. **How far B10 reaches on quiet cards.** [Moot since 2026-10-17: held and quiet cards store every legal move, each
   searched on its own, so they never use the browser engine.] Read as "search each move on its own", the stage rule agrees on 99.8%;
   read as "search the position after each move", own and held cards agree on 99.3% but quiet cards only on 93.6%
   (235 of 251) [reported by C1's verifier]. If the second reading is the one that matters, send more quiet-card
   moves to the browser engine.
3. **Held positions with a failing game move.** [Done 2026-10-17: under the safety rule the game move passes on all
   held cards kept; the ones where the card search finds it unsafe are left out and listed in `data/safety/report.json`.] 11 of 82 held cards have a game move that fails the 4-point rule; on
   `held:pfUcWPlw:30` the game move loses 24 points and the card shows no judgement [reported by S1]. Same timing as 1.
4. **"X of Y done" can look wrong** when the daily card rebuild drops one of today's planned positions (for example
   "4 of 4 done" with 1 left). Using Y = done + remaining fixes it [reported by H2; not re-checked by D1]. An error fix.
5. **"Come back after your next game"** (on `/safety` and Home's empty-file step) could say that new positions arrive
   after the next daily check, which runs at 04:23 UTC. Wording only.
6. **Locked Home loads some trainer code.** `useSafetyToday` imports `safety/queue` and `safety/stored` statically
   (2.80 kB gzip); a dynamic import would keep all trainer code out of the locked Home. Optional; Home's page and
   stored data are already identical when locked [reported by H2's verifier].
7. **The app blanks every page when `cc.profile` is stored as JSON `null`**: "Cannot read properties of null (reading
   'appTheme')" [reproduced by D1 on a production build, 2026-10-16 and again 2026-10-17; already in git `HEAD`]. An
   error fix in `src/App.tsx`, which is frozen from game 11, so cheapest before then.
8. **The build plan's question 3** (`build-plan.md`, "Questions only Alexander can answer") says the daily caps are
   "changeable in Settings". They are on the Safety check page, under "Today". Reword it there, or add a Settings
   control built on `readSettings`, `writeSettings` and `SETTING_LIMITS` from `src/features/safety/stored.ts`.
