# Safety-check trainer: build spec

Written 2026-10-16 by the trainer-design agent. Design only: no app source was changed.
Every factual claim carries a label: **[verified]** (checked today with a command, a file or a source),
**[inferred]** (follows from verified facts, not tested end to end) or **[assumed]** (not checked).
Sample sizes and dates are given with every number.

## 0. In plain words (for Alexander)

- A new page, **Safety check**, shows you positions just after your opponent's move. You make your move,
  then type one line on what you checked ("his bishop hits f7, my knight move leaves e5 loose"), and only then
  see whether your move was safe. Positions come from your own Lichess mistakes, from mistakes 950-1250 players
  make all the time, from positions where you must defend with nothing to win, and from "is this move safe?" questions.
- A move counts as right when it keeps your winning chances within 4 points of the best move, which is the
  exact rule Lichess uses in "Learn from your mistakes" [verified in Lichess's source].
- Positions come back after days and weeks using FSRS, a free, well-tested review schedule
  (MIT licence, about 7 KB in the app) [verified].
- Every Monday a free GitHub job fetches your new Lichess games, analyses them with Stockfish, adds your new
  mistakes to the trainer and appends the week's numbers to a log in the repo. Git time-stamps each entry.
  Neither you nor Claude has to do anything. You never need "Log in with Lichess" for this.
- Home starts with Safety check and "Play one 10+0 game on Lichess". Openings drop out of the daily plan unless your
  games show they cost you points.

What only you can decide (section 10): whether you will click "Request computer analysis" after games.
Without those clicks the weekly job's own Stockfish count, which follows Lichess's published rule, is the
complete measure; Lichess's own count exists only for games you asked it to analyse.

---

## 1. Evidence this spec rests on

| # | Fact | Label | Source / sample |
|---|---|---|---|
| E1 | Lichess "Learn from your mistakes" accepts a move when `povDiff(color, evalAfterYourMove, evalBeforeTheFault) > -0.04`, i.e. you lose less than 4 win% points against the position before your original move. Your move is judged once the browser engine has a bestmove, 1,000,000 nodes, or 3 s. The game move itself always fails; the engine's own best move, a checkmate, and (before the middlegame) a masters-explorer move always pass. | verified | `lila/ui/analyse/src/retrospect/retroCtrl.ts`, master, fetched 2026-10-16 |
| E2 | Win chances in that rule: `2/(1+exp(-0.00368208*cp))-1`, cp clamped to +-1000; mate N counts as `(21-min(10,|N|))*100` cp without the clamp. `povDiff` halves the difference, so 0.04 = 4 points on the 0-100 scale. | verified | `lila/ui/lib/src/ceval/winningChances.ts`, fetched 2026-10-16 |
| E3 | Which of your moves "Learn from your mistakes" picks: your moves whose win chance swings by more than 10 points (`|povDiff| > 0.1`), or that throw away a mate in 3 or fewer. | verified | `lila/ui/analyse/src/nodeFinder.ts` `evalSwings`, fetched 2026-10-16 |
| E4 | Near equality the 4-point rule tolerates about 44 cp: from +0.50, a move to +0.07 passes and +0.06 fails; from +3.00 the margin is 56 cp; from +6.00 it is 105 cp. | verified | computed with E2's formula, 2026-10-16 |
| E5 | Of your 31 rated Lichess games (all blitz, 3+2 and 5+3), 6 carry Lichess's own analysis. In those 6 games: 215 of your moves, 32 Blunders, 16 Mistakes, 25 Inaccuracies by Lichess (73 judged moves, each with a `best` move and a better `variation`); 45 moves meet the E3 rule (31 Blunders, 14 Mistakes). | verified | `research/2026-10-16-diagnosis/my-games/lichess_abustrup.ndjson`, downloaded by the my-games agent 2026-10-16 |
| E6 | The game export sends `Access-Control-Allow-Origin: *`, streams 20 games/s anonymously, and takes `since`, `until`, `perfType`, `analysed`, `clocks`, `evals`, `accuracy`, `division`, `sort=dateAsc`. | verified | Lichess OpenAPI 2.0.176 (`api-games-user-username.yaml`) and a live request 2026-10-16 |
| E7 | No public Lichess API endpoint requests a server ("computer") analysis; the "Analysis" tag only covers the cloud-eval cache. | verified | OpenAPI 2.0.176, 2026-10-16 |
| E8 | Lichess answers 404 to a request with no or a bare curl User-Agent, and 200 to an honest one such as `ChessCoach/1.0 (+https://github.com/abustrup/Chess-Project)`. | verified | 3 live requests, 2026-10-16 |
| E9 | `https://lichess.org/#pool/10+0` opens the lobby and joins the 10+0 pool. | verified (source), assumed (live behaviour) | `lila/ui/lobby/src/ctrl.ts` `joinPoolFromLocationHash` |
| E10 | ts-fsrs 5.4.2: MIT, no runtime dependencies, published 2026-09-01, ESM build for browsers; bundled with the parts we need it is 21,314 bytes minified, 6,727 gzipped. | verified | npm registry + esbuild in scratchpad, 2026-10-16 |
| E11 | ts-fsrs 5.4.2 intervals with retention 0.9, `enable_short_term: false`, fuzz off: first answer Good: +3 d, then Good +14 d, then Good +57 d. First answer Again: +1 d, then Good +3 d, +8 d, +22 d, +54 d. Good, Good, Again: +2 d, then +5, +13, +29. With `maximum_interval: 60` a 61-day gap was produced. | verified | simulation in scratchpad, 2026-10-16 |
| E12 | Engine speed on this Mac (load average about 35 on 10 cores, so slow): the app's own WASM engine (stockfish-19-lite-single, one thread) on an 83-position game of yours: depth 12 in 1.1 s, depth 16 in 12.4 s, depth 20 in 107 s, 1M nodes per position in 128 s. Native Stockfish 19, 1M nodes, 1 thread: 3.1 s per position (255 s per game). | verified (under load) | `bench.mts`, `native_bench.py` in scratchpad, game XLCmExKA |
| E13 | GitHub Actions: free and unlimited on public repos with standard runners; ubuntu-latest has 4 CPUs and 16 GB for public repos; scheduled workflows in public repos are disabled after 60 days without repository activity; a push made with `GITHUB_TOKEN` does not start other workflows, except `workflow_dispatch` and `repository_dispatch`. | verified | docs.github.com, 2026-10-16 |
| E14 | Repo `abustrup/Chess-Project` is public; GitHub Pages is on and `https://abustrup.github.io/Chess-Project/` answers 200; the last Pages deploy (push, 2026-10-16 11:16 UTC) succeeded. `raw.githubusercontent.com` sends `Access-Control-Allow-Origin: *` with a 5-minute cache. | verified | GitHub API and curl, 2026-10-16 |
| E15 | Stockfish release `sf_19` ships `stockfish-linux-x86-64-universal.tar.gz` (81,388,977 bytes). | verified | GitHub releases API, 2026-10-16 |
| E16 | The shipped `defensiveMove` puzzles are not "nothing to win" positions: 365 of 400 are endgames, 311 of 400 are tagged `crushing`, 0 are tagged `equality`. In the first 8 MiB of the Lichess puzzle file (167,785 puzzles), 57,488 are rated 900-1400; of those 56 carry `equality` and 224 are non-endgame `defensiveMove`. | verified | `public/puzzles/themes/defensiveMove.json`; puzzle file byte range, 2026-10-16 |
| E17 | Population supply: in the first 200 MiB of the 2026-09 Lichess database (648,377 games), 3,078 rapid games with both players 950-1250 carry Lichess's `%eval`. In those games the research found 7,155 big blunders (win% drop >= 30), of which 2,966 (41%) fall in the three one-move safety classes (new hanging piece 1,438, ignored attacked piece 1,067, allowed forced mate 461). | verified (counts read from files), classification itself from research/2026-10-16 | `research/2026-10-16/fcc/results/split_stats.json`, `coaching_lens/results.json` |
| E18 | The app's own move labels differ from Lichess: `classifyMove` in `src/lib/evaluation.ts` calls a move a blunder only above 20 points (Lichess: 15), a mistake above 10 (Lichess: 10), and `winPercent` clamps at +-10000 cp (Lichess client: +-1000). The Review page's "Try it" checks alternatives at depth 10. | verified | code reading, 2026-10-16 |
| E19 | Backup in Settings already saves every `cc.*` key, so new trainer keys are backed up without extra work. | verified | `src/features/home/settings/backup.ts` |

---

## 2. The habit, and what one card looks like

The habit to train: **before moving, check (1) what his last move threatens and allows, and (2) what my move allows.**
Every card exercises both checks, and a fair share of cards has nothing to win, so "there is always a trick" never
becomes the lesson.

### 2.1 Screen flow (one card)

1. **Intro** (0.75 s, same as puzzles): board shows `fenBefore`, then plays the opponent's `lastMove`.
   The two squares of his move stay highlighted. Board oriented to the trainee's side.
   A small strip above the board, always visible: *"1. What does his move threaten or allow?  2. What does my move allow?"*
2. **Your move.** Board is interactive for the trainee's side only.
   Judge cards instead show an arrow for the candidate move and two buttons: **Safe** / **Not safe**.
   A "Show answer" link exists but counts as a miss.
3. **What I checked.** The moment the move is made (or the button pressed), the piece stays where it was dropped,
   no verdict is shown, and a one-line text box takes focus: *"Before you see the answer: what did you check?"*
   Placeholder: *"e.g. his Bc4 hits f7; after Nxe5 my queen is loose"*. 2 to 140 characters, Enter submits.
   "nothing" is a valid line; empty is not ("One word is enough").
4. **Verdict.** Shown only after the line is submitted:
   - right / wrong (with the trainee's line repeated above it, word for word),
   - **What there was to see**: machine-made facts only (section 2.4), never AI-written prose,
   - the best move as an arrow; for a wrong move, the refutation played on the board (first 2-3 plies of the engine line),
   - for own cards: *"From your game on 2026-10-12 (5+3). You had 0:41 left and spent 3 s on this move."*
   - when the card has been seen before: *"Last time you wrote: ..."*
5. **Retry** is allowed after a miss (for learning) but never changes the grade. **Next** loads the next card.

### 2.2 Card kinds, sources and filters

| Kind | What it is | Source | Pool at start |
|---|---|---|---|
| `own` | Position before one of your real mistakes. Find a safe move. | Your Lichess games, analysed by the weekly job (section 4.1); interim cards from in-app sync (4.2). | about 7-8 per game [inferred from E5: 45 candidates in 6 games], so roughly 230 from the 31 games so far [inferred] |
| `population` | Position before a one-move safety blunder by a 950-1250 player. Find a safe move. | Lichess monthly database, byte range, both players 950-1250, rapid first. | 150 |
| `defend` | His last move created a threat; no move of yours wins anything. Find the move that holds. | Same database games, null-move test (below). Puzzle file only as a top-up (E16: few fit). | 100 |
| `judge` | A candidate move is shown. Safe or not? 50% are safe. | Same database games: unsafe = a human move that lost >= 15 points in a safety class; safe = a human move within 4 points in a position with a real threat (80%) or a quiet one (20%). | 100 (50 safe, 50 unsafe) |

Filters (all checked by script, section 7):

- **own**: your move meets the E3 rule on the weekly job's analysis. Drop it when you were already lost and still lost
  (win% before < 10 and after < 5). Drop moves inside the app's opening book (`identifyOpening` plies), standing in
  for Lichess's masters-explorer exception, because the explorer needs a token (deviation from E1, opening phase only).
  Priority for new cards: newest game first; within a game, safety classes first, then biggest drop.
- **population**: Lichess-rule Blunder on the database's own `%eval`, research class in {`hung_material_new`,
  `ignored_attacked_piece`, `allowed_forced_mate`}; mover's win% before between 30 and 85; mover's clock >= 30 s;
  re-checked with local Stockfish (still loses >= 15 points); at most 4 acceptable moves (otherwise it is not a test);
  one card per game; deduplicated by the first four FEN fields. **No usernames, game ids or URLs are stored.**
- **defend**: null-move test: with the trainee to move and not in check, give the move to the opponent; if his best
  line then costs the trainee >= 15 win% points, there is a threat. "Nothing to win": best move's win% for the trainee
  <= 65 (about +1.70) and the best move is not a capture that wins material (static exchange gain < 2).
  At least one plausible move (the human's move or the second-best capture) loses >= 15.
- **judge**: candidates with a loss strictly between 4 and 15 points are excluded (no grey zone); the refutation is
  stored for unsafe ones.

The kind mix for new cards comes from `focus.json` (section 5.2). Default: 60% own while own cards remain,
the rest population 40% / defend 30% / judge 30%. If the diagnosis shows your safety errors split differently from the
population (for example more allowed mates), population and judge cards are drawn in your proportions, smoothed toward
the population shares with a weight of 20 games.

### 2.3 Acceptance rule (exact)

Implemented once in `src/lib/lichessRules.ts` and mirrored in `scripts/measure/lichess_rule.py`:

```ts
export const winningChances = (e: { cp?: number; mate?: number }): number => // -1..1, E2
  e.mate !== undefined
    ? raw((21 - Math.min(10, Math.abs(e.mate))) * 100 * Math.sign(e.mate))
    : raw(Math.max(-1000, Math.min(1000, e.cp ?? 0)))
export const povDiff = (side: Side, a: Eval, b: Eval) => (pov(side, a) - pov(side, b)) / 2
/** Lichess "Learn from your mistakes": E1. */
export const retroAccept = (side: Side, afterMove: Eval, beforeFault: Eval) => povDiff(side, afterMove, beforeFault) > -0.04
/** Lichess server judgement (Advice): Inaccuracy >= 5, Mistake >= 10, Blunder >= 15 points, plus mate rules. */
export function serverJudgment(prev: Eval, cur: Eval, moverWhite: boolean, playedIsBest: boolean): Judgment | null
/** E3: is this move a "Learn from your mistakes" candidate? */
export const isRetroCandidate = (prev: Eval, cur: Eval, prevMate?: number) =>
  Math.abs(povDiff('white', prev, cur)) > 0.1 || (prevMate !== undefined && Math.abs(prevMate) <= 3 && cur.mate === undefined)
```

`serverJudgment` follows `research/2026-10-16-diagnosis/my-games/scripts/lichess_rule.py` (the my-games agent reports
428/428 agreement with Lichess's labels on your 6 analysed games without the clamp; that number is theirs to verify).
Note the two Lichess rules clamp differently: the server judgement (measurement) uses no clamp per that finding; the
retro rule (trainer) clamps at +-1000 per E2. Both are kept, named apart, and tested.

**How a card applies it, without trusting a weak browser engine:**

1. Each card carries `top`: the 5 best moves with the trainee's win% after each, from native Stockfish 19 at the
   measurement setting (MultiPV 5, Threads 1). `beforeFault` = `top[0]`.
2. Move in `top` → accept if `retroAccept` holds against `top[0]`. The best move always passes; the game move
   (`human.uci`) always fails, as on Lichess.
3. Move not in `top` and `topComplete` (the 5th move already fails the 4-point test) → fail at once.
4. Otherwise (quiet positions, interim cards) → browser engine on the position after the move, stopped at the
   Lichess readiness rule (bestmove, 1M nodes or 3 s), compared with `top[0]`. E12: about 1.5 s on this Mac.

Precomputing makes the verdict instant, identical on every device, and testable in CI. It also avoids comparing a
deep native evaluation with a shallow browser one near the 44-cp margin (E4).

### 2.4 "What there was to see": facts, not prose

The app turns stored facts into sentences with fixed templates. Every fact is computed by the card builder with
python-chess and Stockfish and re-checked by `check_cards.py`. No language model writes any of it.

```ts
type Fact =
  | { t: 'threat'; reply: string /* SAN */; wins?: { piece: PieceCode; square: string }; mateIn?: number }
  | { t: 'allowed'; move: string; reply: string; wins?: { piece: PieceCode; square: string }; mateIn?: number }
  | { t: 'free'; piece: PieceCode; square: string }   // his last move left this piece capturable for >= 2 points
  | { t: 'quiet' }                                     // null-move threat < 5 points
```

Templates: *"His move {last} threatens {reply}, winning your {piece} on {square}."* /
*"... threatens mate in {n}, starting with {reply}."* /
*"After {move}, he can play {reply} and win your {piece} on {square}."* /
*"His move left his {piece} on {square} unprotected."* /
*"Nothing was threatened here. Any move that keeps your pieces protected was fine."*
When the winning line is not a direct capture, `wins` is omitted and the template ends "... and win material
({line})" with the first 3 plies of the engine line.

### 2.5 Data shapes

Card files (static JSON, shipped in `public/data/`):

```ts
export interface SafetyCardFile {
  version: 1
  generatedAt: string                 // ISO
  pipeline: string                    // e.g. 'build_cards.py v1 @ <git sha>'
  engine: { name: 'Stockfish 19'; nodes: number; multipv: 5; threads: 1; hashMb: number }
  source: string                      // plain words, e.g. 'lichess_db_standard_rated_2026-09, bytes 0-209715199, both 950-1250, rapid'
  cards: SafetyCard[]
}

export type SafetyKind = 'own' | 'population' | 'defend' | 'judge'
export type SafetyClass =
  | 'hung_material_new' | 'ignored_attacked_piece' | 'allowed_forced_mate'
  | 'missed_free_material' | 'other_tactic_or_positional' | 'defend' | 'quiet'

export interface SafetyCard {
  id: string            // 'own:XLCmExKA:37' (game id + ply) | 'pop:<12 hex of sha1(fen4+lastMove)>' | 'def:...' | 'judge:...'
  kind: SafetyKind
  fenBefore: string     // position BEFORE the opponent's last move
  lastMove: string      // UCI; after it the trainee is to move
  side: Side            // trainee
  phase: 'opening' | 'middlegame' | 'endgame'   // research/2026-10-16 definition
  cls: SafetyClass
  top: { uci: string; san: string; win: number }[]  // trainee's win% 0..100 (retro scale), best first, <= 5
  topComplete: boolean
  human?: { uci: string; san: string; win: number; judgment: 'Inaccuracy' | 'Mistake' | 'Blunder' }
  candidate?: { uci: string; san: string; safe: boolean; refutation: string[] }  // judge only
  threat?: { loss: number; line: string[] }   // null-move test: points lost if the trainee passed
  facts: Fact[]
  context?: { gameId: string; date: string; tc: string; clockMs: number; spentMs: number }  // own only
}
```

Browser storage (all under `cc.`, so backup covers it, E19):

```ts
// KEYS.safetyState = 'safety.state'   Record<cardId, StoredCard>
export interface StoredCard {
  due: string; stability: number; difficulty: number; scheduled_days: number; learning_steps: number
  reps: number; lapses: number; state: 0 | 1 | 2 | 3; last_review?: string
  retired?: boolean     // interim card the weekly analysis did not confirm
}
// KEYS.safetyLog = 'safety.log'       SafetyAttempt[] (newest last, capped at 3,000, about 1 MB)
export interface SafetyAttempt {
  cardId: string; at: string
  move?: string                 // UCI, move cards
  verdict?: 'safe' | 'unsafe'   // judge cards
  ok: boolean
  loss: number                  // win% points lost against top[0] (0 if accepted best)
  checked: string               // the one line, 2..140 chars
  msToMove: number; msToWrite: number
  grade: 1 | 2 | 3              // Again | Hard | Good (first attempt of the day only)
  shownAnswer: boolean
}
// KEYS.safetyInterim = 'safety.interim'   SafetyCard[] made by in-app sync (4.2)
// KEYS.safetySettings = 'safety.settings' { newPerDay: 5; maxReviews: 15; slowMs: 90000 }
// KEYS.lichessSync = 'lichess.sync'       { lastCreatedAt: number; lastSyncAt: string; lastError?: string }
```

`GameRecord` gains optional fields, all backward compatible: `speed?`, `clock?: { initial: number; increment: number }`,
`clocks?: number[]` (centiseconds), `lichessAnalysis?: { judgments: (string | null)[]; evals: Eval[]; best: (string | null)[] }`,
`rated?: boolean`.

---

## 3. Spaced repetition (FSRS)

**Package:** `ts-fsrs@5.4.2`, pinned exactly (E10). It is 45 days old, MIT, dependency-free, about 7 KB gzipped.
The 6.0 betas (latest 2026-10-09) remove `elapsed_days`; do not take them until stable.

**Card model:** one FSRS card per position where you must move (or judge). Not per game, not per theme.

**Parameters:** `request_retention: 0.9`, `maximum_interval: 60` (the first evaluation window; tests allow 61, E11),
`enable_short_term: false` (day-level scheduling; the 1-minute and 10-minute learning steps make no sense for
positions), `enable_fuzz: true` in the app and `false` in tests. Default weights.

**Grade, decided by the app, never asked:**

| What happened on the first attempt of the day | Grade |
|---|---|
| Move failed the rule, judge answer wrong, or "Show answer" before moving | Again (1) |
| Move passed / judge answer right, but took longer than `slowMs` (90 s) | Hard (2) |
| Move passed / judge answer right | Good (3) |

Easy is not used. The written line does not change the grade (it cannot be marked fairly by code).

**What that means in days** (E11, no fuzz): a card you get right comes back after 3, then 14, then 57 days.
A card you miss comes back the next day, then after 3, 8, 22 and 54 days. A missed card is also shown once more at
the end of the same session, which does not count as a review.

**Daily queue** (`queue.ts`, pure function):
1. Due reviews, most overdue first, at most `maxReviews` (15).
2. New cards up to `newPerDay` (5), by the priority in 2.2.
3. Interleave so two cards of the same kind never follow each other when avoidable, and never two own cards from the
   same game in a row.
4. Retired interim cards and cards whose file disappeared are skipped (their history is kept).

At about 1 minute per card (assumed), a full day is 20 cards, about 20 minutes. You did not give minutes per week,
so the caps are settings, not promises.

---

## 4. How new games get in without Claude

### 4.1 Weekly GitHub job: the measurement of record

`.github/workflows/weekly-measure.yml`, free on this public repo (E13).

```yaml
on:
  schedule: [{ cron: '17 5 * * 1' }]        # Mondays 05:17 UTC; off the hour because GitHub delays top-of-hour schedules [assumed]
  workflow_dispatch: { inputs: { dry_run: { type: boolean, default: false } } }
permissions: { contents: write, actions: write }
concurrency: { group: weekly-measure, cancel-in-progress: false }
jobs:
  measure:
    runs-on: ubuntu-24.04
    timeout-minutes: 90
    steps:
      - actions/checkout@v5
      - actions/setup-python@v5 (3.12); pip install -r scripts/measure/requirements.txt  # chess pinned
      - actions/cache for Stockfish, key sf_19-linux-x86-64
      - download sf_19 linux universal tarball (E15); verify sha256 from scripts/measure/config.json; extract
      - python scripts/measure/weekly.py --config scripts/measure/config.json
      - python scripts/measure/check_log.py          # old log must be an exact prefix of the new log
      - if not dry_run and files changed: git commit -m "Weekly measurement <date>: <n> new games" && git push
      - if pushed: gh workflow run deploy.yml       # env GH_TOKEN: github.token. Needed because of E13
```

`weekly.py`, in order:

1. Read `data/me/state.json` (`lastCreatedAt`).
2. One request: `GET https://lichess.org/api/games/user/abustrup?since=<last+1>&perfType=blitz,rapid,classical&clocks=true&evals=true&accuracy=true&opening=true&division=true&pgnInJson=true&sort=dateAsc`,
   `Accept: application/x-ndjson`, `User-Agent: ChessCoach-weekly/1.0 (+https://github.com/abustrup/Chess-Project)` (E8).
   On 429: wait 60 s, one retry, else fail the run without committing.
3. Drop opponent usernames; keep opponent rating and rating change. Append to `data/me/games.ndjson` (append-only).
4. Analyse every new game from move 1 with native Stockfish 19: Threads 1, fixed Hash, `ucinewgame` per game,
   positions in game order, node count from `config.json` (the calibration result of the my-games agent; 250k and
   1M were being compared on 2026-10-16). Run 4 games in parallel (4 CPUs). Store `data/me/evals/<gameId>.json`.
5. Per game: your move count; Lichess's own counts from `players.<you>.analysis` when present (E5 shows they are);
   the replication's counts from `serverJudgment` on the Stockfish evals. Append one row per game to
   `data/measure/log.csv` (never rewritten):
   `game_id, created_at_utc, speed, tc, rated, color, my_rating, my_rating_diff, opp_rating, score, my_moves,
   lichess_analysed, li_blunders, li_mistakes, li_inaccuracies, sf_blunders, sf_mistakes, sf_inaccuracies,
   sf_version, sf_nodes, pipeline_version, run_id`.
6. Rebuild `public/data/measure/summary.json` from the whole log with the formulas fixed in the pre-registration
   (written by the measurement agent; this job only implements them, counted in games, 10+0 rated games for the main
   measure).
7. Rebuild `public/data/me/mistakes.json` with `scripts/safety/build_cards.py` (MultiPV searches only for new
   positions; cache in `data/me/cardcache/`).
8. Append a heartbeat row to `data/measure/runs.csv` every run, even with 0 new games (keeps the repo "active",
   see risks).
9. Fail without committing when: the fixture check fails (below), any old log row would change, or any game is
   only partly analysed.

**Fixture check (guards against a silent engine change):** the 6 games Lichess analysed (E5) are stored without
opponent names in `scripts/measure/fixtures/`. When `sf_version`, `sf_nodes` or `pipeline_version` changes, the job
re-analyses them and requires agreement with Lichess's labels on your moves at or above the threshold the calibration
sets; otherwise it stops. The result is cached per version, so normal weeks pay nothing.

**Cost:** about 80 positions per 10+0 game. At 1M nodes, E12 measured 3.1 s per position on a loaded Mac
(4.3 min per game); a runner with 4 CPUs doing 4 games at once should handle 20 games in roughly 20-25 minutes
[inferred]. Free either way (E13).

**Determinism:** Threads 1, fixed hash, fixed nodes and game order should give identical output on reruns of the
same binary [inferred]; test W4 checks it. Whether the Linux x86 build and the Mac's Homebrew arm64 build give
identical numbers is unknown [assumed not]; the runner, not the Mac, is the measurement of record, and test W5
compares them once.

**Risks:**
- Schedules in public repos stop after 60 days without activity (E13). The heartbeat commit should count as
  activity [inferred, not verified]. The app shows "Last weekly check: <date>" and, if older than 9 days, a notice
  with the fix: GitHub, Actions tab, "Weekly measurement", "Enable workflow".
- A `GITHUB_TOKEN` push does not start the deploy (E13), hence the explicit `gh workflow run deploy.yml`.
- Lichess may treat GitHub's IP ranges differently from a home connection [assumed fine]; the first run shows it.
- Publishing: your games are public on Lichess already. The repo gets your moves, clocks, ratings and your opponents'
  ratings, not their names [decision flagged in section 10].

### 4.2 In-app "Sync my Lichess games": interim cards between Mondays

- Button on the Safety page and on Home; also runs by itself when the Safety page opens and the last sync is older
  than 6 hours. One request, same parameters as 4.1 with `since=lastCreatedAt+1&max=50`. CORS is open (E6), so no
  login, no token, no server.
- Games go into `KEYS.games` through the existing `addGames` (200-game cap stays).
- Games Lichess analysed: interim cards straight from Lichess's own evals, E3 rule, `top = [Lichess best]`,
  `topComplete = false`, so any other move is judged by the browser engine with Lichess's readiness rule against
  Lichess's eval of the position before. That is literally Lichess's own "Learn from your mistakes".
- Games not analysed: browser analysis at depth 16 (E12: 12.4 s for an 83-position game on a loaded Mac), E3 rule,
  same card shape.
- Interim cards never touch the measurement. When the weekly file has a card with the same id, the interim card is
  replaced and its review history kept; when the weekly analysis does not flag that move, the card is marked
  `retired`.
- Errors reuse the existing friendly messages in `lichessImport.ts` (429: wait 60 s; network; not found).

### 4.3 Why no "Log in with Lichess"

The game export is public and CORS-open (E6), 20 games/s is plenty, and there is no API to request analysis even
when logged in (E7). Logging in would add a token to protect and nothing to use. Not needed.

### 4.4 One place to open the app

Progress lives in the browser of the address you use: the Pages site and the local double-click launcher
(`Open Chess Coach.command`, served at localhost:4173) keep separate progress, and the launcher builds from the local
checkout, which does not have the bot's Monday commits until someone pulls [verified by reading the launcher].
Use `https://abustrup.github.io/Chess-Project/` for training. The loader still tries
`raw.githubusercontent.com/abustrup/Chess-Project/main/public/data/...` (E14) when the bundled copy is older, so the
launcher also works.

---

## 5. Home: today's plan

### 5.1 New rule

`buildPlan` in `src/features/home/progress.ts` gets the safety summary, the focus file and the newest synced game:

1. **Safety check** first: *"Safety check: 12 positions"*, reason *"From your own games and from players at your
   level. Before each move: what does his move threaten, what does mine allow?"*, link `/safety`.
   Done when today's queue is empty. If no cards are loaded yet: *"Sync your Lichess games"*.
2. **Play one 10+0 game on Lichess**: external link `https://lichess.org/#pool/10+0` (E9), new tab.
   Done when a synced rated 10+0 game is dated today. Without a username: link to Settings.
3. **Openings** only when `focus.openingInPlan` is true. Otherwise there is no third card.

Tactics lessons and puzzles leave the daily plan (they stay in the menu). They are untargeted and their text is
largely unaudited AI writing; the plan should only send you to what the diagnosis says costs you points.
`TodaysPlan` says "Two small steps." or "Three small steps." to match. `PlanItem` gains `external?: boolean` and the
ids `'safety' | 'lichess'`. If `focus.primary === 'opening'`, the opening card goes first and Safety check second.

**Continue card:** with reviews due, it points to Safety check (*"8 positions are waiting"*); otherwise the old rule.
**Rating card:** shows your Lichess rapid and blitz ratings from the newest synced games; the app's estimate only for
unrated or in-app games (follows the rating agent's findings).

### 5.2 `public/data/diagnosis/focus.json`

```ts
export interface Focus {
  generatedAt: string
  basis: { games: number; speeds: string[]; from: string; to: string }
  primary: 'safety' | 'opening'
  openingInPlan: boolean
  mix?: { population: number; defend: number; judge: number }   // shares for new non-own cards
  classShares?: Record<SafetyClass, { k: number; n: number }>  // your blunders by class, raw counts
  why: string[]                 // plain sentences generated from the numbers above
}
export const DEFAULT_FOCUS: Focus = { primary: 'safety', openingInPlan: true, /* ... */ }
```

Written first by the diagnosis (this phase), then recomputed by the weekly job with the same rule. The rule for
`openingInPlan` belongs to the diagnosis and must be compared with the population, because "lost by move 12" is common
for everyone: among 950-1250 rapid losers in the research sample, 998 of 2,881 (35%) were already below 25% at move 12
[verified, `coaching_lens/results.json`]. Suggested input: the share of your losses decided by move 12 *without* a
safety-class blunder in moves 1-12, against the same share in the population. Without the file, `DEFAULT_FOCUS`
keeps openings as the third card.

---

## 6. Files to create or change

| File | New / change | What |
|---|---|---|
| `src/lib/lichessRules.ts` + `.check.ts` | new | `winningChances`, `povDiff`, `retroAccept`, `isRetroCandidate`, `serverJudgment` (2.3) |
| `src/features/safety/SafetyPage.tsx` | new | page: board, prompt strip, card flow, session summary |
| `src/features/safety/useSafetyRun.ts` | new | state machine: `intro -> moving -> writing -> checking -> verdict -> (retry)` |
| `src/features/safety/CheckedLine.tsx` | new | the one-line box (focus, Enter, 2-140 chars) |
| `src/features/safety/Verdict.tsx`, `facts.ts` | new | verdict card; fact templates (2.4) |
| `src/features/safety/accept.ts` + `.check.ts` | new | top / topComplete / engine fallback (2.3) |
| `src/features/safety/schedule.ts` + `.check.ts` | new | ts-fsrs wrapper, grade mapping (3) |
| `src/features/safety/queue.ts` + `.check.ts` | new | daily queue, priorities, interleaving (3) |
| `src/features/safety/cards.ts` | new | load card files (bundled, then raw GitHub if newer), merge interim, retire |
| `src/features/safety/stored.ts`, `safety.css` | new | storage helpers; styles (two-class selectors, zen classes) |
| `src/features/sync/lichessSync.ts` + `.check.ts` | new | incremental fetch, interim cards (4.2), reuses `lichessImport.ts` parsing |
| `src/pages/Safety.tsx` | new | lazy route |
| `src/App.tsx` | change | route `/safety`, nav item "Safety" (ShieldCheck icon) after Home, page title |
| `src/types.ts` | change | `SafetyCard`, `Fact`, `StoredCard`, `SafetyAttempt`, `Focus`; optional `GameRecord` fields |
| `src/lib/storage.ts` | change | `KEYS.safetyState`, `safetyLog`, `safetyInterim`, `safetySettings`, `lichessSync` |
| `src/features/home/progress.ts`, `TodaysPlan.tsx`, `ContinueCard.tsx`, `RatingCard.tsx`, `pages/Home.tsx` | change | section 5 |
| `src/lib/evaluation.ts` | change | Lichess thresholds 5/10/15 in `classifyMove` and the +-1000 clamp for win chances (E18), or route callers to `lichessRules.ts`; update the review and rating checks that depend on it |
| `src/features/review/useTryIt.ts` | change | use `retroAccept` and the Lichess readiness rule instead of depth 10 |
| `package.json` | change | `"ts-fsrs": "5.4.2"` exact |
| `scripts/measure/weekly.py`, `lichess_rule.py`, `config.json`, `requirements.txt`, `check_log.py`, `fixtures/` | new | section 4.1; `lichess_rule.py` moved from the my-games agent's folder |
| `scripts/safety/build_cards.py` | new | own cards from evals; MultiPV, null-move, facts |
| `scripts/safety/build_population.py` | new | stream a byte range of the monthly database, pick population, defend and judge cards (2.2) |
| `scripts/safety/check_cards.py` | new | section 7, part B |
| `.github/workflows/weekly-measure.yml` | new | section 4.1 |
| `.github/workflows/build-population.yml` | new (optional) | same pipeline as a manual job, so the population build is reproducible on GitHub |
| `public/data/safety/population.json`, `defend.json`, `judge.json` | new (data) | built once, rebuilt only on purpose |
| `public/data/me/mistakes.json`, `public/data/measure/summary.json`, `public/data/diagnosis/focus.json` | new (data) | written by the weekly job |
| `data/me/games.ndjson`, `data/me/evals/`, `data/me/state.json`, `data/measure/log.csv`, `data/measure/runs.csv` | new (data, not deployed) | the record |
| `docs/tasks/safety.md`, `docs/HANDOFF.md` | new / change | this spec as the build task; handoff update |

Building the population cards: 350 cards at about 3 searches each. At the E12 rate (3.1 s per 1M-node search on a
loaded Mac) that is about 55 minutes on one thread [inferred]; the optional workflow runs it on GitHub for free.

---

## 7. Acceptance tests

Run with `npx tsx <file>.check.ts` (the repo's pattern) or `python -I scripts/.../check_*.py`. Each line is a test case.

**A. Rules (`lichessRules.check.ts`)**
- A1 `retroAccept('white', {cp:20}, {cp:50})` is true (povDiff -0.0275); `{cp:-40}` vs `{cp:50}` false (-0.0827).
- A2 Boundary: from `{cp:50}`, `{cp:7}` passes and `{cp:6}` fails; from `{cp:0}`, `-43` passes and `-44` fails (E4).
- A3 Black's view: `retroAccept('black', {cp:80}, {cp:50})` true; `{cp:120}` false.
- A4 Clamp: `{cp:900}` vs `{cp:1500}` passes; `{cp:600}` vs `{cp:1500}` fails.
- A5 Mates: `{mate:3}` vs `{mate:1}` passes; `{cp:800}` vs `{mate:2}` fails (-0.0490); `{cp:500}` vs `{mate:2}` fails.
- A6 `serverJudgment` on the 6 fixture games reproduces Lichess's label on every judged move (the my-games agent's
  figure is 428/428; the test asserts whatever the fixture holds, exactly).
- A7 `isRetroCandidate` marks exactly 45 of your 215 moves in the fixture (E5), with the +-1000 clamp.

**B. Card builder (`check_cards.py`, run on every card file)**
- B1 `lastMove` is legal from `fenBefore`; afterwards `side` is to move and not checkmated or stalemated.
- B2 `top` is sorted by `win`, 1 to 5 entries, all legal; `top[0]` passes `retroAccept` against itself.
- B3 `topComplete` is true exactly when the last entry fails the 4-point test against `top[0]`.
- B4 own/population: `human.uci` is legal and fails the 4-point test; population: `human.judgment == 'Blunder'` and
  class is one of the three safety classes.
- B5 population/defend: at most 4 accepted moves among `top` when `topComplete`.
- B6 defend: `threat.loss >= 15`; `top[0].win <= 65`; `top[0]` is not a capture with exchange gain >= 2.
- B7 judge: safe candidates lose <= 4; unsafe lose >= 15; none in between; safe share 45-55% of the file.
- B8 Every fact replays: moves legal; the named piece stands on the named square; `mateIn` equals the engine's mate
  distance; a `quiet` fact only where `threat.loss < 5`.
- B9 Population/defend/judge files contain no usernames, game ids or URLs (regex over the file; header names from the
  source sample must not occur).
- B10 Two-stage acceptance against a full check: on 50 random cards, evaluate every legal move separately at the same
  setting; the stage rule (2.3 steps 2-3) must agree on at least 98% of moves it decides without the engine.
- B11 Rebuilding a file twice gives byte-identical output.

**C. Trainer (`useSafetyRun`, `accept`, page smoke via `scripts/e2e-smoke.mjs`)**
- C1 The board shows `fenBefore`, animates `lastMove`, highlights its two squares; orientation = `side`.
- C2 After a move, no verdict is visible and the line box has focus; Enter with an empty box shows "One word is
  enough" and does not reveal anything; a 2-character line reveals the verdict.
- C3 A move in `top` within 4 points shows "Safe"; `human.uci` shows "That was the game move"; a move outside a
  complete `top` fails at once; an undecided move shows "Checking..." and a verdict within 5 s on a laptop.
- C4 Judge card: no move possible; Safe / Not safe buttons, then the line box, then the verdict; an unsafe candidate's
  refutation plays on the board.
- C5 The verdict repeats the trainee's line verbatim and shows "Last time you wrote" when there is an earlier attempt.
- C6 "Show answer" before moving logs `shownAnswer: true`, grade Again.
- C7 Reload mid-session: state, log and remaining queue survive; Settings backup and restore round-trips all
  `cc.safety.*` keys.
- C8 390 px wide: board, strip, line box and buttons fit without sideways scrolling; zen mode keeps board, line box and
  verdict; both app themes readable.

**D. Schedule and queue (`schedule.check.ts`, `queue.check.ts`, fuzz off, fixed clock 2026-10-20 08:00 UTC)**
- D1 New card, Good: due 2026-10-23; Good again: +14 d; Good again: +57 d (E11).
- D2 New card, Again: due 2026-10-21; then Good +3 d, +8 d, +22 d.
- D3 Good, Good, Again: +2 d. No interval above 61 days.
- D4 Grade: wrong first move gives 1; right after 95 s gives 2; right in 20 s gives 3; a later retry does not
  change the stored grade or FSRS state.
- D5 30 due + 40 new available: queue holds 15 reviews (most overdue first) + 5 new.
- D6 New order: own cards from the newest game first; within a game safety classes first, then larger drop.
- D7 No two cards of the same kind adjacent when the pool allows it; no two own cards of the same game adjacent.
- D8 A failed card reappears once at the end of the session; that repeat writes a log row but no FSRS update.
- D9 An interim card replaced by the weekly card with the same id keeps `reps`, `lapses`, `due`; an unconfirmed
  interim card becomes `retired` and leaves the queue.

**E. Sync (`lichessSync.check.ts` on stored NDJSON fixtures; no network in tests)**
- E1 The request URL contains `since=<last+1>`, `clocks=true`, `evals=true`, `accuracy=true`, `max=50`, and the
  Accept header is NDJSON.
- E2 An analysed game produces interim cards only at moves meeting the E3 rule, with `top[0]` = Lichess's `best`.
- E3 An unanalysed game is queued for browser analysis at depth 16 and produces cards with the same shape.
- E4 Importing the same file twice adds 0 games and 0 cards.
- E5 429 shows the 60-second message and sets no new `lastCreatedAt`.
- E6 Nothing in sync writes to `data/measure` or `summary.json` (structural: sync has no code path to them).

**W. Weekly job**
- W1 `workflow_dispatch` with `dry_run: true` on a branch: files are produced, nothing is pushed.
- W2 First live run: `log.csv` gains exactly one row per new game; `check_log.py` passes (old file is a prefix).
- W3 Second run right after: 0 new rows; `runs.csv` gains 1 heartbeat row.
- W4 Re-analysing one game twice on the runner gives identical evals.
- W5 Mac versus runner on the 6 fixture games: same judgement on at least 99% of your moves; differences are listed.
- W6 A changed `sf_nodes` in `config.json` triggers the fixture check; a forced bad threshold makes the run fail
  without committing.
- W7 After a push, the deploy workflow starts (E13) and the site shows the new "Last weekly check" date within
  15 minutes.
- W8 No file written by the job contains an opponent's username.

**H. Home (`progress.check.ts` additions)**
- H1 `focus.primary = 'safety'`, `openingInPlan = false`, 12 due: items are [safety "12 positions", lichess]; no third.
- H2 `openingInPlan = true`: third item is the opening step from the existing rule.
- H3 `primary = 'opening'`: opening first, safety second.
- H4 Queue empty: safety item `done = true`. A synced rated 600+0 game today: lichess item `done = true`.
- H5 No focus file: `DEFAULT_FOCUS` (safety, lichess, opening).
- H6 Continue card points to `/safety` when reviews are due.
- H7 No username set: the lichess item links to `/settings`.

---

## 8. Build order and what to cut

1. `lichessRules.ts` with tests A (everything else depends on it).
2. `build_cards.py` + `check_cards.py`; own cards from the 31 games; then the population build (B).
3. Safety page, FSRS and queue (C, D).
4. Weekly job: dry run, then live (W).
5. In-app sync (E).
6. Home plan (H).

Cut before adding: tactics lessons and puzzles leave the daily plan; no new teaching text is written for the
trainer (facts only); no in-app "blunder check mode" in Play for now. Population pools start at 350 cards and grow
only if you run out.

---

## 9. What "working" means for the trainer itself

This is separate from the main measure (Lichess blunders per 100 of your moves at 10+0, pre-registered by the
measurement agent). The trainer works as software when tests A-H pass. As training, its own logs can show dose
and in-trainer learning, but not transfer to games:

- Dose: cards attempted per 10 rated 10+0 games, from `cc.safety.log` (only in your browser; it reaches the repo only
  if you export a backup, so it is reported, not measured by the job).
- In-trainer learning: first-try success on review cards. FSRS aims at 90%; below 70% over 100 reviews means the
  cards are too hard or not learnable and the mix should change [threshold assumed].
- Transfer: only the weekly log can show it, counted in games.

---

## 10. Decisions for the lead and for Alexander

1. **Clicks on "Request computer analysis".** You did not commit to them, so the complete source is the weekly job's
   replication (Stockfish plus Lichess's published rule, checked against Lichess's own labels). Recommendation: make
   the replication the pre-registered main count on all rated 10+0 games and report Lichess's own count alongside
   whenever it exists. If you do click after every game, Lichess's own count becomes complete too.
2. **Publishing your games in the repo.** Needed for git time stamps. Your games are public on Lichess already;
   opponents' names are left out. Needs the lead's or your yes before the first live run.
3. **Node setting** for both the job and the cards: from the my-games calibration (250k vs 1M on 2026-10-16).
4. **`openingInPlan` rule**: from the diagnosis, compared with the population (section 5.2).
5. **Daily caps** (5 new, 15 reviews): defaults until you say how many minutes you have.
