# Task: GAME REVIEW + RATING ESTIMATE

**You own:** `src/pages/Rating.tsx`, `src/pages/Review.tsx`, `src/features/rating/**`, `src/features/review/**`.

## Goals
1. Let the user get their games *analysed* by Stockfish in the browser and see where they went wrong (**Game review**).
2. Give an **estimated real Elo** from a set of games ("even if it might not be correct"), with honest uncertainty. The user is about 1100 on Lichess; it should be *interesting* and *plausible*, never fake-precise.

## Shared analysis engine — `src/features/review/analyse.ts`
`analyseGame(game: { pgn: string } | GameRecord, opts: { depth?: number (default 12), onProgress?(done,total), signal?: AbortSignal, engine?: UciEngine }): Promise<GameAnalysis>` (types in `src/types.ts`).
- Walk the PGN (chess.js `loadPgn`), evaluate every position once (Stockfish lite, depth ≈ 12; cache by FEN), compute per move: `evalBefore/evalAfter` (centipawns, White's view, mate = ±10000-ish via `scoreToCp`), `cpLoss`, per-move `accuracy` and `classification` using `src/lib/evaluation.ts` (Lichess formulas), best move (UCI + SAN), mark opening moves as `book` using `identifyOpening` (`src/lib/openingName.ts`, a stub that another builder fills in — call it, don't worry if it returns null for now).
- ACPL and accuracy per side (`gameAccuracy`). Must be **fast enough**: a 40-move game in well under ~30 s on a laptop; use its own engine instance (`UciEngine.create()`), a queue so you don't analyse two games at once, abort support, and **terminate the worker on unmount**.
- Saves the analysis into the stored `GameRecord` (`KEYS.games`) so it's not recomputed.

## Review page — `/review/<gameId>`
Loads the `GameRecord` from `KEYS.games` (not found → friendly message). If not analysed yet: "Analyse this game" button with progress bar (starts automatically when arriving from a just-finished game: `?auto=1`).
Layout (chess.com-style): board with **eval bar**, move list coloured by move quality (`q-*` classes in theme.css) with symbols, an **evaluation graph** (SVG line/area chart across plies, click to jump, mistakes marked), player accuracy cards (accuracy %, ACPL, counts of blunders/mistakes/inaccuracies), a **"Key moments"** list (biggest swings; click to jump), and for the current mistake a coach box: "You played X. Better was Y." with the best move arrow, plus **"Try it"** (the user must find the better move on the board, instant feedback). Keyboard ← → ↑ ↓. Opening name (via `identifyOpening`). Buttons: copy PGN, analyse deeper (depth 16), flip board. Player names/ratings, result.
Zen: board + current move comment + navigation only.

## Rating page — `/rating`
Sections:
1. **Your games**: list of stored games (app games + imported), with result, opponent, rating, opening, accuracy (if analysed), and checkboxes. Buttons: **Import from Lichess** (username input; pre-filled from `profile.lichessUsername`; fetch `https://lichess.org/api/games/user/<name>?max=30&moves=true&opening=true&pgnInJson=true` with header `Accept: application/x-ndjson`; no token needed; handle 404/429/network errors kindly; dedupe by game id; save as `source:'lichess'` records with `whiteElo/blackElo`, `userSide` determined by username, `openingName`), **Paste PGN** (one or many games; ask "which side were you?" or detect by the profile name/username), and **Analyse all** (queue with a single progress bar, cancellable).
   Lichess API etiquette: one request at a time, identify nothing secret, respect 429 (wait 60 s message).
2. **Estimated rating** (stored in `KEYS.ratingEstimate` as `RatingEstimate`): show a big number with a range ("about 1180, probably between 1050 and 1310"), the **confidence** (how many games), and a clear "How I worked this out" breakdown in plain language with 2–3 pieces:
   - **A. Results vs opponents** (when opponent ratings are known, e.g. Lichess imports): a performance rating (average opponent rating + a standard shift from the score %; use the FIDE-style table or logistic `400*log10(p/(1-p))` with clamping for 0%/100%; weight by number of games).
   - **B. Quality of moves**: map **average centipawn loss / accuracy** to an Elo with a *documented, adjustable* calibration curve (put the table in one clearly commented constant, e.g. anchor points typical for Lichess blitz/rapid at depth ~12: ACPL ≈ 110 → 800, 85 → 1100, 65 → 1400, 48 → 1700, 35 → 2000, 25 → 2300 — research public numbers (Lichess blog/forum posts, Regan's work) and state your sources and uncertainty in a comment; interpolate; clamp). Games with huge swings should use *median/trimmed* ACPL (one blunder shouldn't dominate; use cap of 300 cp per move as Lichess does).
   - **C. Prior**: the user's own `profile.selfRating` as a weak prior (like 3 pseudo-games) so a few games can't wildly swing it.
   Blend by weights that grow with the number of games and with the quality of the evidence; compute a range from the spread (e.g. standard error shrinking with games, never narrower than ±60). Show a small chart (trend per game or the three parts as bars) — SVG, no chart library. Compare with the user's self-rating ("You said 1100").
   Honest disclaimer in plain words (different rating pools; the estimate is for the *user's play in these games*; needs ~20+ games to be meaningful; Stockfish depth is limited).
3. **What to work on** (the useful part): from the analysed games derive and show: accuracy by game phase (opening / middlegame / endgame by ply or material), **blunder rate**, how often the user **missed tactics** (positions where best move won ≥ 150 cp and the user missed it) and **hung pieces** (cpLoss from leaving a piece en prise → approximate with: after the move, the opponent's best reply captures material for free: use eval swing + capture on reply), **openings report** (grouped by `openingName`: games, score %, ACPL; highlight the London/Caro-Kann/Slav with a link to the course), and 3 short concrete suggestions with links (`/tactics`, `/puzzles?theme=...`, `/openings/<course>`).
4. Make the page useful with **zero games** too (explains how it works, big buttons to import/paste/play).
5. Zen mode: just the headline estimate (keep it calm); everything else `zen-hide`.

## Done when
Tested in the real browser: import real games from Lichess for a well-known public account (e.g. `DrNykterstein` or `penguingm1` — pick any public username; you can't know the owner's username, which is entered in Settings), paste a PGN, analyse a few games (note actual timings), view the review, see the estimate and the breakdown. Write a small node check of your estimation maths (monotonic: better ACPL → higher Elo; more games → narrower range; extreme results clamp). Network failures handled. No console errors; desktop/phone/zen screenshots reviewed.
