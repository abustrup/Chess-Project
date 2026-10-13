# Handover note — Chess Coach

Branch history: built on `claude/sleepy-lovelace-2fnxsd` (PR #1), merged to `main` on 2026-10-13.

## STATUS (2026-10-13, local session)
Finished in one local session with ~53 parallel agents (two independent passes per item):
- **London course complete**: tagline, overview, 7 key ideas, 6 common mistakes, 12 Lichess names, 14 chapters
  (`london.ts` + `london-more-a.ts` + `london-more-b.ts`).
- **Content audits done** for all 3 courses and all 12 tactics lessons (auditor 1 + auditor 2, Stockfish + chess.js claim checks).
  Engine depth was 12-18 (not always 18) because ~30 agents shared 10 CPU cores; see "Open items".
- **QA + breaker passes done** for puzzles, play, openings UI, tactics UI, rating/review, home/settings.
- **Design polish, code-splitting, production check under `/Chess-Project/`, manifest, README** done.
- Checks at merge: `tsc` 0 errors, `check-openings` 0 errors, 6/6 `*.check.ts` pass, `e2e-smoke` 40/40 pages clean on the built site.

## Open items (next session)
1. GitHub Pages is not switched on (owner's click: Settings -> Pages -> Source: GitHub Actions, then Actions -> Deploy -> Run workflow).
2. `middlegame-plans` (london-more-b) is thin; King's Indian / Grünfeld chapters have 4-5 lines.
3. Re-run the opening/tactics engine audits at depth 20+ on a quiet machine.
4. Drill: a move made before the opponent's first move lands is ignored (needs a Board.tsx change to queue it).
5. Board.tsx: promotion menu stays open after Solution/Skip; arrow colours may all render the same.
6. Home rating card still shows a single number (rating page now shows a range under 5 games).

## The product in one paragraph
**Chess Coach** is a free, static web app (React + TypeScript + Vite, no server) that teaches its owner chess. The owner is a **non-coder, ~1100 Lichess Elo**; their openings are the **London System (White)**, **Caro-Kann** and **Slav (Black)**.
Features: Play vs Stockfish (bot strength levels, "practise my opening" / "face an opening" modes) · Openings trainer (study + drill + quiz) · Tactics lessons · Puzzles (Lichess database, own puzzle rating) · Game review + **rating estimate** (imports Lichess games) · Home dashboard · Settings · **Zen mode** (key Z).

## The owner's preferences (follow them)
- Talk to the owner in **plain, simple language**. No code as explanation, don't ask them to read code. Treat their messages as open direction.
- Visual taste: **blue or warm colours, never a green brand colour**; **simple, recognisable pieces** (several sets to choose); **must not look like a copy of chess.com** (we use a top pill navigation, serif headings, flat soft buttons, ink-navy "Ocean" and espresso/apricot "Ember" themes).
- Everything must stay **free** (no paid services, no API keys, no backend). If a website/account access is needed (e.g. GitHub Pages, Cloudflare Pages), **ask the owner**; suggest better tools/connectors when they'd improve the result, but don't make the owner spend more time than needed.
- The owner mentioned an "Alexander video library" as a style bar; the cloud session was **not allowed** to open `abustrup/alexanders-brief`. Ask whether they want it used as a style reference.

## Run it locally
```
npm install
npm run dev            # http://localhost:5173/   (hash routes: /#/play, /#/openings ...)
npm run typecheck      # tsc --noEmit
npx tsx scripts/check-openings.ts     # validates all opening PGN content
node scripts/e2e-smoke.mjs shots      # visits every page (desktop/phone/zen/Ember), reports errors  (needs a Chromium: set CHROMIUM=/path/to/chrome, or use Playwright's)
```
Playwright helpers import `playwright-core` and launch `process.env.CHROMIUM || '/opt/pw-browsers/chromium'` — **on your machine set `CHROMIUM`** to a Chrome/Chromium executable (or run `npx playwright install chromium` and point to it).
`scripts/.cache/` (the 307 MB Lichess puzzle DB + filtered cache) is **not in git**; the shipped puzzle files are already in `public/puzzles/` so you only need it to rebuild them (see `docs/puzzle-data.md`).

## Where things are
Read **`docs/agent-brief.md`** first (architecture, rules, URL contract, design direction, testing). Per-feature specs are in **`docs/tasks/*.md`** (they double as the "definition of done"). Shared contracts: `src/types.ts`. Shared parts: `Board`, `UciEngine` (Stockfish worker), `storage`, `pgnTree`, `evaluation`, `theme.css`, `themes.ts`, `pieceSets.tsx`, `openingName.ts` (Lichess ECO lookup).

## State of each part (at the time of writing)
| Part | State |
|---|---|
| Foundation (shell, Board, engine, themes, zen, piece sets, board colours) | done |
| Opening-name lookup (`src/lib/openingName.ts`, `src/data/eco.json`) | done, verified |
| Puzzle data (18,561 engine-checked puzzles in `public/puzzles`) + Puzzles page | done; a QA pass was started, result unknown |
| Tactics page + 12 lessons (fork, discovered-attack, pin, skewer, back-rank-mate, removing-the-defender, deflection, trapped-piece, loose-pieces, attraction, zwischenzug, mate-patterns) | UI done; all 12 lessons written and registered. The first 8 were verified by their authors (engine depth 14); **lessons 9–12 (loose-pieces, attraction, zwischenzug, mate-patterns) have had no independent audit**; an audit of back-rank-mate / removing-the-defender / deflection / trapped-piece was started but its result is unknown |
| Rating estimate + Game review (`src/features/rating`, `src/features/review`) | done; calibrated on 1,022 real Lichess player-games; a QA pass was started, result unknown |
| Home, Settings, README, LICENSE (GPL-3.0), Pages workflow, credits | done; a QA pass was started, result unknown |
| Play vs bot | done; a QA pass was started, result unknown |
| Openings trainer UI | done; a QA pass was started, result unknown |
| Opening **content** | **Caro-Kann: complete** (14 chapters, overview, 8 key ideas, 7 mistakes, 92 ECO names). **Slav: complete** (12 chapters, overview, 9 ideas, 7 mistakes, 102 ECO names). **London: INCOMPLETE** — 6 chapters only; tagline is literally `"TODO"`; `overview`, `keyIdeas`, `commonMistakes`, `ecoNames` are empty. See `docs/tasks/london.md` for the intended scope (≈10–14 chapters: pyramid set-up, vs …c5, …Bf5, …g6, …e6/…Bd6, early …Qb6, anti-London tries, etc.). **No independent audit of any course has been done yet.** |

## Work that was running in the cloud when we switched (status unknown — treat as NOT done)
- London course content (`src/data/openings/london.ts`) — the most important unfinished item.
- QA + "break-it" passes on: puzzles, rating/review, home/settings, tactics UI, play, openings trainer (they fix bugs inside each feature's own files). Any fixes they made are only in the repo if committed before the switch (last snapshot = see `git log`).
- Independent audits of tactics lessons B.

## Remaining plan (in order)
1. **Finish the London course** (tagline, overview, keyIdeas, commonMistakes, ecoNames, ~4–8 more chapters per `docs/tasks/london.md`) so `npx tsx scripts/check-openings.ts` reports 0 errors and no empty fields for all three courses.
2. **Independent content audits** (`docs/tasks/content-audit.md`): for every opening course and every tactics lesson — one auditor, then a second independent auditor (different engine depth, fresh read of every sentence). Chess correctness is the most important quality bar of the whole product.
3. Finish QA/break-it passes (`docs/tasks/qa.md`) for any feature whose pass didn't complete.
4. **Design polish** with the whole app visible: consistency, spacing, contrast, no green brand colour, mobile (390 px) and zen on every page, both app themes, all 8 board colours × all piece sets. Check the design/accessibility skills (`design:design-critique`, `design:accessibility-review`) if available.
5. **Performance**: lazy-load routes (code-splitting), check bundle size, check first load on a phone-class CPU, make sure workers are always terminated.
6. **Production check**: `npm run build && npm run preview`; test in the built site (Stockfish worker, puzzle fetches, fonts, deep links via hash routes) and under a sub-path to simulate GitHub Pages. Optional: installable PWA / offline (vite-plugin-pwa) — nice to have.
7. Ask the owner to enable **GitHub Pages** (Settings → Pages → Source: *GitHub Actions*) so `.github/workflows/deploy.yml` can publish the site for free; offer Cloudflare Pages as the alternative.
8. Update the PR description, mark the PR ready, and write the owner a short, plain-language summary (what's inside, how to open it, what to do next).

## Known issues / gotchas
- Bot levels are *approximate* Elo labels (the Play builder measured Node matches vs Stockfish's own `UCI_Elo`, labels set ~70 lower); no human data. Rating estimate calibration is from blitz/rapid arenas, not bullet.
- Lichess' game export returned 404 for curl/HeadlessChrome user agents in the cloud sandbox but works with a normal Chrome UA — real browsers are fine; test the import with a real browser.
- Feature CSS needs **two-class selectors** to beat `theme.css` (it is imported after `App`).
- Vite dev server sometimes serves a freshly rewritten file empty — touching the file fixes it.
- Stockfish in Node allows one engine instance per process (`scripts/lib/nodeEngine.ts`).
- Piece sets "Friendly" and "Bold" are CC BY-NC-SA (personal, non-commercial use only) — see `docs/pieces-credits.md`; the app bundles Stockfish (GPL-3.0), hence the GPL-3.0 `LICENSE`.
- The Lichess opening explorer needs a (free) token → not used. Possible optional upgrade: let the owner paste a token in Settings to show "what players actually play here".
