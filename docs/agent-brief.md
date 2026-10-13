# Chess Coach — shared brief for everyone building a part of this app

Read this whole file first. Then read your own task file in `docs/tasks/`.

## The product
**Chess Coach** is a personal, free, static web app (like a small chess.com / lichess for one person) whose
**main purpose is to teach the owner chess**. It runs fully in the browser (no server): React + TypeScript + Vite,
`chess.js` for the rules, Stockfish (WebAssembly) as the engine, and open data (Lichess openings + puzzle database).

Features: Play vs computer (with opening choice) · Opening trainer (study + drill) for the **London System** (as White),
the **Caro-Kann Defence** and the **Slav Defence** (as Black) · Tactics lessons (forks, discovered attacks, pins …) ·
Puzzles (Lichess database) · Game review + **rating estimate** · Home dashboard · Settings · Zen mode.

## The user — design for them
- A **non-coder**, about **1100 Elo** on Lichess. They want to *learn*. All text you write for the app must be in
  **plain, friendly, simple English**: short sentences, no jargon without a one-line explanation, never code or
  notation soup as an explanation. Say *why* a move is good ("it protects the knight and opens a path for the bishop"),
  not only *what* it is. Speak to the player as "you".
- Visual taste: **blue or warm colours** (never green boards), **simple, clear, recognisable pieces**, calm and polished,
  quality at the level of chess.com / lichess. There is a **zen mode** (see below).
- Everything must stay **free** (no paid services, no API keys, no backend).
- Moves in text should use normal chess notation (SAN like `Nf3`) but always with a plain explanation next to it.

## Repository map (what exists already)
```
src/types.ts                 shared data shapes — READ THIS FIRST (contracts for openings, tactics, puzzles, games, profile, progress)
src/App.tsx                  shell: sidebar nav + routes (HashRouter). Applies theme/zen. Don't edit unless your task says so.
src/styles/theme.css         design system: tokens (--bg-*, --accent, --text-*...), .card .btn .chip .tabs .progress .page .grid ...
src/components/Board.tsx     THE chessboard (click + drag, legal-move dots, arrows, highlights, promotion, uses user's piece set + board colours)
src/components/EvalBar.tsx   vertical evaluation bar          src/components/MoveList.tsx   move list
src/components/ZenToggle.tsx floating zen button (already mounted in App)
src/engine/uci.ts            Stockfish web-worker wrapper: UciEngine.create(), engine.go({fen, depth|movetime, multipv}), scoreForWhite()
src/lib/storage.ts           localStorage store: useStored(KEYS.x, default) / readStored / writeStored
src/lib/pgnTree.ts           parse PGN WITH variations + comments + [%cal]/[%csl] arrows into a tree (opening lessons use this)
src/lib/evaluation.ts        winPercent, moveAccuracy, classifyMove, formatEval, gameAccuracy (Lichess formulas)
src/lib/openingName.ts       identifyOpening(sans) -> {eco,name,plies}|null   (stub until the eco-data task fills it)
src/lib/pieceSets.tsx        piece sets (piecesFor(id)); src/lib/themes.ts board colour themes
src/data/openings/*          opening course content (contract: OpeningCourse in types.ts), index.ts registers them
src/data/tactics/*           tactic lessons (contract: TacticLesson), index.ts registers them
src/pages/*.tsx              one page per route (Home, Play, Openings, Tactics, Puzzles, Rating, Review, Settings, Dev)
src/features/<name>/         put ALL your feature code + css here
public/engine/               Stockfish lite (single-threaded WASM) — already there
scripts/lib/nodeEngine.ts    Stockfish for Node scripts: NodeEngine.create().go({fen, depth, multipv}) — use it to CHECK chess content
scripts/.cache/puzzles.jsonl 51,920 vetted Lichess puzzles (CC0), rating 400–2200, by theme and for the user's 3 openings
scripts/check-openings.ts    run:  npx tsx scripts/check-openings.ts   (validates all opening PGN content)
scripts/shot.mjs             screenshot helper (see Testing)
```

## URL contract between features (HashRouter, so real URLs look like `http://localhost:5173/#/play?...`)
| Route | Owner |
|---|---|
| `/` | home |
| `/play` , `/play?course=<courseId>&chapter=<chapterId>&mode=practice` (you play the course's side, bot follows the prepared replies of that chapter) , `/play?course=<courseId>&mode=face&chapter=<id>` (BOT plays the course's opening, you play the other side — to learn how to face it) , `/play?fen=<FEN>&side=white|black` (start from a position) | play |
| `/openings` , `/openings/<courseId>` , `/openings/<courseId>/<chapterId>/study` , `/openings/<courseId>/<chapterId>/drill` | openings-ui |
| `/tactics` , `/tactics/<lessonId>` | tactics-ui |
| `/puzzles` , `/puzzles?theme=<themeKey>` , `/puzzles?opening=<courseId>` | puzzles-ui |
| `/rating` , `/review/<gameId>` | rating |
| `/settings` | home |
Use react-router `<Link to="/play?...">`/`useNavigate` for navigation. Pages are mounted with a wildcard (`/openings/*`) so a page can do its own nested `<Routes>`.

## Rules of engagement (several people are editing this repo at the same time!)
1. **Only edit files you own** (your task file lists them). Shared files (`types.ts`, `theme.css`, `Board.tsx`, `App.tsx`, `storage.ts`, `package.json` ...) are
   owned by the lead. If you *need* a change there, work around it inside your own files and mention it in your report; tiny, purely additive
   edits to `theme.css` are NOT allowed — put feature CSS in `src/features/<name>/<name>.css` and import it from your page.
2. **Do not run `git commit/push/checkout/stash`**. The lead commits. **Do not run `npm install`** or change `package.json`
   (if you really need a package, say so in your report and use a workaround). Scratch files go in the scratchpad dir (below), never in `/tmp`.
3. **Type-check only your own files**: `npx tsc --noEmit 2>&1 | grep -E "src/(features/<yours>|pages/<Yours>)"` — other people's half-finished files may have errors; ignore them.
   Do **not** run `npm run build`. Keep strict TypeScript happy (no `any` unless unavoidable).
4. Keep every file readable: small components, clear names, comments that explain *why* in simple words. No dead code, no debug logging left behind.
5. Reuse what exists (Board, MoveList, EvalBar, `.card`, `.btn`, `.chip`, tokens). Never hard-code colours — use CSS variables (`var(--accent)`, `var(--bg-2)`, `var(--text-dim)`...) so both app themes (Ocean/Ember) work.
6. **Zen mode** (`<html data-zen="on">`, toggled by the floating button / key Z; handled globally): anything non-essential gets class `zen-hide`
   (eval bar, move list, stats, long text, secondary cards). Inside `.side-col`, panels that must stay visible in zen (the main buttons, the prompt/feedback,
   the comment for the current move) get class `zen-keep`. Check your page in zen mode by setting `localStorage 'cc.profile'` to `{"zenMode":true}` and reloading.
7. **Responsive**: must work at 1360×860 (desktop) and 390×844 (phone, bottom nav). Boards use `.board-layout` / `.board-col` / `.side-col` from theme.css.
8. **React StrictMode** is on: effects run twice in dev. Engines/workers/timers you create in an effect must be cleaned up (`engine.terminate()`), and never create two engines by accident.
9. Never block the UI thread with heavy chess work — Stockfish already runs in a worker; for pure-JS loops over many positions, chunk with `await` / `setTimeout`.
10. Persisted data goes through `src/lib/storage.ts` with the key + shape in `types.ts` (`KEYS.*`). Don't invent other localStorage keys for shared data; your own private UI preferences may use `cc.<yourfeature>.<thing>`.
11. Accessibility basics: real `<button>`s, visible focus, aria-labels on icon buttons, don't rely on colour alone, keyboard shortcuts documented in the UI (← → to step through moves etc.).
12. Honesty: if something doesn't work or you couldn't verify it, say so in the report. Don't claim what you didn't test.

## Testing in a real browser (do this — it is how bugs get found)
- The dev server is **already running** at `http://localhost:5173/` (HMR picks up your edits). Don't start another.
- Screenshot a route: `node scripts/shot.mjs "/play" "<scratchpad>/play.png" 1360 900` then view it with the Read tool (it can show images). Add `WAIT=3000` for slow pages.
- For interaction, write a Playwright script in the scratchpad: `import { chromium } from '/home/user/Chess-Project/node_modules/playwright-core/index.mjs'`,
  `chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })`. Board squares are `[data-square="e4"]` (click them; or drag with `page.mouse`).
  Watch `page.on('pageerror')` and `console` errors — there should be none.
- Scratchpad directory (use it for every temp file): `/tmp/claude-0/-home-user-Chess-Project/d32d4c3a-91fa-5b61-8d2f-fe014f909452/scratchpad`
- Look at your screenshots critically as a designer: spacing, alignment, hierarchy, contrast, empty/loading/error states, mobile width. Fix what looks off.

## Chess-content correctness (anything that teaches chess)
Wrong chess advice is the worst bug in this product. Every move sequence must be legal (the PGN parser throws on illegal moves) **and** sensible:
check key positions with the engine (`scripts/lib/nodeEngine.ts`, depth ≥ 12–14). Don't state facts you aren't sure of (names of traps, engine verdicts, theory);
prefer fewer, correct lines over many doubtful ones. Explain ideas simply. The real opening database is public: `https://raw.githubusercontent.com/lichess-org/chess-openings/master/{a,b,c,d,e}.tsv`
(columns eco, name, pgn) — use it to confirm names and move orders.

## Your final report (your last message; it is returned to the lead)
Short (≤ 300 words), plain text: what you built · files you created/changed · how you verified it (what you ran/clicked) ·
known gaps/bugs · anything you need from the lead or the user (e.g. a package, a decision).
