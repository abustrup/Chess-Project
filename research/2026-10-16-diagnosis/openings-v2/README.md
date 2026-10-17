# Opening courses, narrowed (task O1, 2026-10-16)

The three opening courses went from 40 chapters to 20, with lines that end by about move 8, one taught move per
position and 1...c6 as the answer to 1.d4. Definition of done: `../build-plan.md`, section "O1". Evidence for the
choices: `../openings/PROPOSAL.md` and `../engine/v1-40-chapters/summary.md`.

Labels: **[verified]** = produced by a command on 2026-10-16 (named below); **[inferred]** = follows from those
results; **[assumed]** = not checked.

## What changed

| | Before | After |
|---|---|---|
| Chapters (London / Caro-Kann / Slav) | 14 / 14 / 12 = 40 | 7 / 8 / 5 = 20 [verified] |
| Your moves written in the chapters (a move that appears in two chapters counts twice) | 1,646 | 521 [verified] |
| Taught moves the deep engine check looks at (each position once) | 1,443 | 441 [verified] |
| Positions where two chapters teach different moves | 20 | 0 [verified] |
| Lines that end after move 8 | 230 of 318 | 1 of 162, a listed trap line (one ply past move 8) [verified] |

- **First commit (an error fix):** the 3 false sentences found by the claim checker were corrected
  (`first-fix.patch`): london.ts "it guards the knight on e5" (the queen on e2 does not), london.ts "Take the pinned
  knight" (it was not pinned any more), slav.ts "White hits b7" (the bishop on b4 blocks the queen). The checker went
  from 3 false to 0 false (`claims-1-before-fix/summary.txt`, `claims-2-after-fix/summary.txt`).
- **Kept chapter ids are unchanged**; merged chapters keep the main chapter's id. Merged into others: London
  knight-first, Slav-style ...c6, bishop harassment, pins and pokes, middlegame plans (into classic-pyramid),
  Grünfeld (into King's Indian), Benoni-style (into early ...c5); Caro-Kann Exchange Bd3 and Panov (into Exchange),
  accelerated Panov (into odd second moves), Fantasy (into gambits), pawn storms (into Advance others), Classical
  h4 (into Classical); Slav Exchange, Exchange tricks, main Slav, Krause, Slav accepted, Semi-Slav bridge and other
  4th moves (into the Slow Slav chapter). Of those, only the lines 1000-1300 opponents actually reach stayed (rule below).
- **Moves changed or added, as the build plan asks:** 1...c6 as the Black entry against 1.d4, 1.c4 and 1.Nf3
  (2.e4 d5 points to the Caro-Kann course); 3...Bg4 after 1.e4 c6 2.Nf3 d5 3.e5; 6.Ne5 (was 6.O-O) after
  1.d4 d5 2.Bf4 Nc6 3.e3 Nf6 4.Nf3 Bf5 5.Bb5 e6; 8.dxe5 (was 8.Bh2) in the King's Indian line; 2.Bc4 d5 3.exd5 cxd5
  4.Bb3 and 4.Bb5+ (with 5.Qe2 and 6.Nf3) in the Caro-Kann odd-moves chapter; 2.Qf3, 2.e5, 2.f4 there too;
  4.Nc3 and 4.Bb5+ after 2.Nf3 d5 3.exd5 cxd5; 3...e6, 3...f6, 3...a6 after 2...Nc6 3.e3; 1...g6 and 1...Nc6 in the
  London. No Englund chapter, no London idea card, no Jobava.
- **Changed after the deep engine check:** 7...h5 instead of 7...cxd4 in the Caro-Kann Advance with Nc3 and g4
  (7...cxd4 left you about a pawn worse at the end of the line); the King's Indian trap line now stops at 9.Nxe5
  (10.Bxe5 lost 68 cp to 10.Qxd8); the "?!" on the Slav's 4.Bg5 is gone (it costs White less than 40 cp).
- **Changed by the independent check (2026-10-16), text only, made in `scripts/spec.ts` so the recipe still gives
  the same files:** "White's queen has to come out to take back" became "White nearly always takes back with the
  queen" (gxf3 is legal; Qxf3 in 48 of 48 sample games); "as in the London chapter" now names the Slav chapter
  "Against the London System: 2.Bf4"; two London lines that ended with ...f6 hitting your bishop on e5 (after
  3...Bg4?? and in the 1...d6 line) now say where the bishop goes (Stockfish 19: f4 or g3 keep a piece or a pawn
  more). No move changed.
- **Changed by a second independent check (2026-10-16, evening), text only, also in `scripts/spec.ts`:** a test that
  asks "what if you ignore the position?" at every line end where you are to move (`scripts/line_end_threats.py`,
  Stockfish 19, 800,000 nodes) found 22 of 146 line ends with a threat worth about 1.5 pawns or more. 16 already
  said what to do. The other 6 now do: London 3...f6 line ("Black develops" became: your knight on e5 is attacked
  twice, take on c6 first), London 6.Ne5 line after ...Ke7 (take the rook), Slav 3.e3 Bf5 4.cxd5 with 5.Qb3 (play
  ...Nf6 at once, your knight on d7 is pinned), Caro-Kann Advance with Nc3 and Be3 (take on d4 first), Caro-Kann
  Advance with Be2 and Be3 (play ...Nbc6 before White's c4), Caro-Kann Advance with g4 and h4 after 8.Qxe2 (play
  ...e6 before White pushes e6). One more sentence changed: after 1.e4 c6 2.Nf3 d5 3.e5 Bg4 4.d4 e6 5.Be2 c5 6.c3 it
  said "...Nc6 and ...Qb6"; ...Qb6 straight away loses the bishop on g4 to Qa4+ and dxc5 (Stockfish 19: -384 cp),
  so it now says "...Nc6 next". No move changed.
- **Not changed:** the overview, big ideas and common mistakes of each course, apart from three Slav sentences about
  the move order and one that pointed to the removed Semi-Slav chapter.

The rule that decided what stays (`scripts/narrow.ts`): at your turn only the first listed move stays; at the
opponent's turn the first listed reply stays, every reply up to the opponent's 3rd move stays (cut 4 plies later if
it is rare), and deeper replies stay only if 1000-1300 players reach them in at least 1 of 500 of your games
(September 2026 Lichess sample, 316,537 games); no line goes past move 8. Lines that now end on a capture or a
threat got a closing sentence. [verified: the script applies exactly this; the threshold of 1 in 500 is a judgement]

## Acceptance checks (O1), run 2026-10-16

| Check | Result |
|---|---|
| First commit changes only the 3 sentences; `npm run check:claims` 0 false | pass: 3 false before, 0 after (`first-fix.patch`, `claims-1-*`, `claims-2-*`) [verified] |
| At most 20 chapters; ids kept; every line ends by move 8 apart from listed trap lines | pass: 20 chapters, 162 lines, 0 problems, 1 listed trap line (`scripts/check_line_length.ts`) [verified] |
| `check-openings.ts` 0 errors | pass: 0 errors, 4 warnings (lines that end on your own move) [verified] |
| `check:claims` 0 false on the narrowed courses | pass: 1,192 true, 0 false (`claims-3-narrowed/summary.txt`, re-run after the second check's 7 text fixes) [verified] |
| Deep check: 0 taught moves flagged at every depth apart from listed deliberate choices; 0 conflicts; no line ending 50 cp or more worse | pass: 3 flags, of which only 1.d4 b6 2.Nf3 holds at every depth (listed in `scripts/deep-check-openings/deliberate-choices.json`); 0 conflicts; 0 bad line ends; the CI-style `--strict --offline` run from the committed cache exits 0 with 0 new searches (`../engine/summary.md`) [verified] |
| `analyse_courses.py` and `km.py`, same September sample: share still in course after the opponent's 2nd and 3rd move no more than 2 points below today's | pass for every course, both methods (`coverage/before_after.json`, `scripts/compare_coverage.py`) [verified] |

Share of your games still inside the course (walk method, low end; Kaplan-Meier in brackets):

| Course | After opponent's 2nd move: before → after | After opponent's 3rd move: before → after |
|---|---|---|
| London | 53.3% → 58.5% (53.6% → 58.7%) | 40.2% → 48.0% (41.2% → 50.1%) |
| Caro-Kann | 91.3% → 97.7% (91.3% → 97.7%) | 84.3% → 89.5% (84.6% → 89.8%) |
| Slav (before: 1...d5) | 94.4% → 95.2% (94.4% → 96.0%) | 70.6% → 78.4% (71.4% → 77.5%) |
| After 1.d4 c6, Slav + Caro-Kann | 93.6% → 95.2% (93.5% → 95.2%) | 77.2% → 79.1% (75.6% → 77.9%) |

Near-threshold notes from the deep check (not failures, because they do not hold at every depth): 1.d4 f5 2.Bf4 Nf6
3.e3 g6 4.Nf3 (52 cp at 150M nodes, 18-20 cp at 3M/30M), 1.d4 g6 2.Bf4 (48 / 51 cp), and three moves of 30-42 cp.

## Things to know

- Lichess's cloud evaluation answered HTTP 429 to this machine on 2026-10-16 from 16:03 UTC, so the final run used
  `--offline` (cloud results only from the cache): 161 of 441 taught moves were not looked up in the cloud (and 5 are not stored there). The local
  Stockfish decides the gate either way. [verified]
- Saved per-position progress in the app is keyed by position number inside a chapter, so in the kept chapters some
  saved "how well you know this move" values may now sit on different moves. Chapter-level progress keeps its ids.
  Nothing breaks; the numbers settle after a few drills. [inferred from `src/features/openings/progress.ts`]
- Old links to removed chapters show the app's "We could not find that chapter" page. [verified in the browser]

## Re-run

From the repo root. The raw September sample stays outside the repo (see `../openings/scripts/README.txt`, $S).

```
# 1. the input: the course files after the first fix
D=<empty folder>; for f in index.ts london.ts london-more-a.ts london-more-b.ts caroKann.ts slav.ts; do
  git show d5fb2e1:src/data/openings/$f > $D/$f; done
patch -d $D -p4 < research/2026-10-16-diagnosis/openings-v2/first-fix.patch
# 2. narrow (writes london.ts, caroKann.ts, slav.ts into OUT; byte-identical to src/data/openings on 2026-10-16)
cd research/2026-10-16-diagnosis/openings-v2/scripts && npx tsx narrow.ts paths $D $S/merged.json && cd -
.venv/bin/python -I research/2026-10-16-diagnosis/openings-v2/scripts/reach.py $S/pos.pkl $S/merged.json $S/reach.json
cd research/2026-10-16-diagnosis/openings-v2/scripts && npx tsx narrow.ts write $D $S/reach.json OUT && cd -
# 3. checks
npx tsx research/2026-10-16-diagnosis/openings-v2/scripts/check_line_length.ts
.venv/bin/python -I research/2026-10-16-diagnosis/openings-v2/scripts/line_end_threats.py   # read the comments it prints
npx tsx scripts/check-openings.ts
npm run check:claims -- --out research/2026-10-16-diagnosis/openings-v2/claims-3-narrowed
.venv/bin/python scripts/deep-check-openings/check.py --threads 2 --hash 512 --offline
.venv/bin/python scripts/deep-check-openings/summarize.py
npx tsx research/2026-10-16-diagnosis/openings/scripts/export_courses.ts $S/courses_after.json
.venv/bin/python -I research/2026-10-16-diagnosis/openings/scripts/analyse_courses.py $S/pos.pkl $S/courses_after.json research/2026-10-16-diagnosis/openings-v2/coverage all
.venv/bin/python -I research/2026-10-16-diagnosis/openings/scripts/km.py $S/courses_after.json research/2026-10-16-diagnosis/openings-v2/coverage/depth_in_course_km.json $S/db_*.jsonl
python3 -I research/2026-10-16-diagnosis/openings-v2/scripts/compare_coverage.py
```

(`analyse_courses.py` also writes `tree_*.json` files into its output folder; they were not kept here.)

## Files

- `first-fix.patch`: the first commit's 3 sentence fixes.
- `claims-1-before-fix/`, `claims-2-after-fix/`, `claims-3-narrowed/`: claim checker summaries (and the full report
  for the narrowed courses).
- `scripts/narrow.ts`, `scripts/tree.ts`, `scripts/spec.ts`: the narrowing recipe and the tool that applies it.
  `scripts/reach.py`: how often 1000-1300 players reach each course position. `scripts/check_line_length.ts`: the
  move-8 check, with the listed trap line and its reason. `scripts/compare_coverage.py`: the coverage acceptance check.
  `scripts/line_end_threats.py`: lists line ends where ignoring the position would cost you, with their comments.
- `narrowing/report.json`: every line end (and what was cut after it) and the conflict list (empty);
  `narrowing/narrow-log.txt`: every reply and alternative that was dropped.
- `coverage/`: the analysis outputs after narrowing and `before_after.json`.
- `browser-check-2026-10-16.txt`: the browser check of the narrowed courses (made by `scripts/browser_check.mjs` with
  `scripts/titles.ts`, against the dev server): every course page lists its chapters at 1360 and 390 px, every
  chapter's drill completes a line, old chapter links show the "not found" page, and Play's practise mode plays prepared moves.
- Engine results: `../engine/` (results, summary, caches); the 40-chapter run is kept in `../engine/v1-40-chapters/`.
