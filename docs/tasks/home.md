# Task: HOME DASHBOARD, SETTINGS, README, DEPLOYMENT

**You own:** `src/pages/Home.tsx`, `src/pages/Settings.tsx`, `src/features/home/**`, `README.md`, `LICENSE`, `.github/workflows/deploy.yml`, `docs/CREDITS.md`.

## Home (`/`)
A warm, motivating dashboard (think chess.com home + a personal coach):
- Greeting with the user's name (`profile.name`), today's suggestion: **"Today's plan"** — 3 concrete cards chosen from the user's progress: e.g. "Learn the next London chapter" (from `KEYS.openingProgress` + `OPENING_COURSES`), "Do a tactic: Forks" (`KEYS.tacticsProgress` + `TACTIC_LESSONS`), "Solve 5 puzzles" (`KEYS.puzzleStats`), "Play a game as Black using the Caro-Kann". Deep links per the URL contract.
- **Continue where you left off** (last practised chapter, unfinished game → `/play`).
- **Openings progress**: one card per course (London, Caro-Kann, Slav) with a mastery bar from `OpeningProgress`.
- **Rating card**: the estimate from `KEYS.ratingEstimate` (+ range) vs self-rating; if none: a call to action to `/rating`. **Puzzle rating** card with the sparkline from `PuzzleStats.history`.
- **Recent games** (from `KEYS.games`): result chip, opponent, opening, accuracy, link to review.
- Streak / "days practised" (derive from timestamps in progress records and history) — only if you can compute it honestly.
All widgets handle empty data gracefully (new user!) with friendly empty states and buttons. Don't import other features' internals; read only the shared types/KEYS and `OPENING_COURSES` / `TACTIC_LESSONS` data.
Zen: Home shows just the greeting and a single big "Continue" button.

## Settings (`/settings`)
- **Profile**: name, Lichess username, "my rating" (self-rating).
- **Look**: App theme (Ocean / Ember) as nice preview cards; **Board colours**: swatch grid of `BOARD_THEMES` (8 options in the blue and warm families) shown as mini 4×4 boards; **Pieces**: `PIECE_SETS` from `src/lib/pieceSets.tsx` (another builder is adding 5+ sets right now — the list updates automatically) shown as preview strips with `pieceUrl()` or `piecesFor()`; a **live preview board** (`Board`, interactive=false) that reflects the choices. Zen mode toggle. Sounds toggle. Legal-move dots toggle.
- **Your data**: **Export** all progress as one JSON file (all `cc.*` localStorage keys), **Import** it back (validate), and **Reset** (with a confirm). Explain in plain words that data lives in this browser only, so exporting is the backup.
- **Credits & licences** section (render `docs/CREDITS.md` content or a typed list in code): Stockfish (GPL-3.0), Lichess openings & puzzle database (CC0), chess.js (BSD-2), react-chessboard (MIT), piece sets (credit per set from `PIECE_SETS[].credit`), lucide icons (ISC).

## Repo-level files
- **`README.md`**: written for a *non-coder*: what the app is, how to open/use it, a "How do I put this online for free" section (GitHub Pages via the included workflow — numbered steps with the exact buttons to click in GitHub: Settings → Pages → Source: GitHub Actions; alternatives: Cloudflare Pages, Netlify with build command `npm run build` and output dir `dist`), how to run locally (`npm install`, `npm run dev`), a short map of the folders, and credits.
- **`.github/workflows/deploy.yml`**: build with Node 22 (`npm ci && npm run build`) and deploy `dist` to GitHub Pages (official `actions/configure-pages`, `upload-pages-artifact`, `deploy-pages`), on push to `main` + manual trigger. Because the site is built with relative base (`base: './'`) and a HashRouter, no repository-name config is needed.
- **`LICENSE`**: GPL-3.0 full text (the project bundles Stockfish which is GPL-3.0): `curl -s https://www.gnu.org/licenses/gpl-3.0.txt`.
- **`docs/CREDITS.md`**.

## Done when
Everything renders with an empty profile and with data seeded by a Playwright script into localStorage (write one that seeds plausible progress, games, puzzle stats and an estimate, so you can see the full dashboard); Settings changes apply instantly (theme, board colours, pieces, zen); export/import round-trips; no console errors; desktop/phone/zen screenshots reviewed.
