# Chess Coach

A calm, free place to **learn chess**, made for one player: you. It runs in your web browser. There is no account, no server and nothing to pay for.

**Open it here: https://abustrup.github.io/Chess-Project/** (bookmark it on your computer and your phone, and use this address for your training: progress stays in the browser of the address you use)

On this Mac you can also double-click **Open Chess Coach.command** in this folder. It opens the same address in your browser, so your progress stays in one place.

## What it does

| Where | What you can do |
|---|---|
| **Home** | Today's plan: a short block of easy puzzles and one rated 10+0 game on Lichess. A card shows how far your study has come. |
| **Safety check** | Appears by itself after your 40th rated 10+0 game on Lichess. Positions from your own games, just after your opponent's move: you pick a move, write one line on what you checked, then see whether it was safe. Positions come back after days and weeks. 10 new positions and up to 10 reviews a day; change both on the Safety check page. |
| **Play** | Play the computer. Choose how strong it is, and practise one of your openings against it. A coach warns you about big mistakes. |
| **Openings** | Your three openings, cut to what players at your level actually play: the **London System** as White (7 chapters), the **Caro-Kann** (8) and the **Slav** (5) as Black. First you study a line, then you play it from memory. |
| **Tactics** | Short lessons on tricks that win material: forks, pins, discovered attacks and more. |
| **Puzzles** | Thousands of real puzzles from Lichess. Your puzzle rating grows as you improve. |
| **My rating** | Your live Lichess rating, with the range Lichess gives it, and a rough translation to chess.com's scale (never called your chess.com rating). For Lichess games your Lichess rating is the rating, so the app does not calculate one of its own. |
| **Review** | Go through a game move by move. Mistakes are labelled with Lichess's own thresholds. |
| **Settings** | Your name, colours, board and piece styles, sounds, and a backup of your progress. |

**Zen mode:** press **Z** (or the leaf button at the top right) to hide everything except the board. Press **Z** again to come back.

**Use it like an app:** on iPhone, open the link in Safari, tap **Share**, then **Add to Home Screen**. In Chrome on a computer, click the install icon at the right end of the address bar. It then opens in its own window with the Chess Coach icon.

## Your study (started 2026-10-16)

The app is part of a small experiment: does a daily Safety-check trainer cut your blunders in rated 10+0 games on Lichess? The rules were written down before any game counted (`research/2026-10-16-diagnosis/preregistration.md`).

- **You only play.** Rated 10+0 games on Lichess, as you normally would. No clicks on "Request computer analysis" are needed.
- **One thing to do first:** time-stamp the rules on AsPredicted before your 11th rated 10+0 game. The answers to paste and the steps are in `research/2026-10-16-diagnosis/aspredicted.md`.
- **Counted in games, not weeks.** Games 1-10 are a warm-up. Games 11-40 are your "before". After game 40 the Safety check opens and goes first in your daily plan. Games 61-110 and 61-160 are measured.
- **The app stays the same apart from the trainer** from your 11th rated 10+0 game until the study ends. Only error fixes (wrong sentences, crashes) are allowed in between.
- **A free GitHub job checks your games every morning** and counts them with a fixed copy of Lichess's blunder rule. The Home card shows only the count and the phase until a verdict exists (after game 110 at the earliest).
- **Your games are public in this repository**, as they already are on Lichess: moves, clocks, ratings and game ids of your rated games. Your opponents' names are removed.

## Your progress stays in your browser

Everything you do (games, lessons, puzzle rating, Safety-check answers, settings) is saved **only in the browser on the device you use**. That keeps it private, but it also means:

- A different device or browser starts from zero, and clearing your browser data wipes your progress.
- **Back up** now and then: **Settings → Your data → Download backup**. Keep the file somewhere safe. At games 110 and 160 the Home card asks you to send one, so your training can be described next to the result.
- **Move to a new device:** open **Settings → Your data → Restore from backup** there and choose the file.

The app goes online for its own files and to read your **public** Lichess data: your rated 10+0 games (to count them for the study, at most once every 10 minutes), your rating, and the games you choose to import. It never needs a password, and it sends nothing about you except your Lichess username in those requests.

---

## For developers

React 19 + TypeScript + Vite, `chess.js` for the rules, `react-chessboard` for the board, Stockfish 19 (single-threaded WebAssembly, in a web worker) as the engine, `ts-fsrs` 5.4.2 for the Safety-check review schedule, and open Lichess data (openings and puzzles). Fully static: no backend, no API keys. Data lives in `localStorage` under `cc.*` keys (see `src/lib/storage.ts`).

Needs **Node.js 22.12 or newer** (24 recommended). The data scripts need Python with python-chess (`.venv`) and native Stockfish 19.

```
npm install
npm run dev         # local dev server with hot reload
npm run typecheck   # TypeScript check
npm run build       # typecheck + production build into dist/
npm run preview     # serve dist/ locally
```

**Before you change anything, read [`docs/HANDOFF.md`](docs/HANDOFF.md).** It holds the study rules (what may change when), the freeze on teaching files, the daily jobs, and the command for every check.

**Deploying.** `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main` (or by hand: Actions → Deploy to GitHub Pages → Run workflow). The daily measuring job starts it after each of its commits. The build uses relative paths (`base: './'`) and hash routes (`#/play`), so it works under any sub-path, such as `/Chess-Project/`, with no extra configuration.

**Workflows** (all free on this public repository):

| Workflow | When | What |
|---|---|---|
| `measure.yml` | every day 04:23 UTC, or by hand | the study's judge: checks the pre-registered scripts' hashes and the engine, counts his rated 10+0 games, writes `public/data/study/status.json`, rebuilds the Safety-check cards, deploys |
| `deploy.yml` | push to `main`, or started by `measure.yml` | builds and publishes the site |
| `content-checks.yml` | pushes and pull requests | course and tactics text checks, engine check of every taught move, rule and gate parity, the app's own checks, and the study freeze |
| `newcomers.yml` | by hand | builds the matched-newcomer comparison group from public Lichess data |

**How the app is put together**

- `src/App.tsx` is the shell: top navigation, theme and zen mode on `<html>`, and the routes. Each page is loaded on demand (`React.lazy`), and the other pages are fetched in the background a moment later. A failed page load shows a friendly "reload" card instead of a blank screen.
- `src/lib/studyGate.ts` counts his rated 10+0 games exactly as the pre-registered `measure.py` does and opens the Safety check after game 40. There is no way to open it by hand.
- `index.html` holds the start-up splash and applies the saved theme before the first paint. `public/manifest.webmanifest` and `public/icons/` make it installable (there is no service worker, so it needs a connection).
- `/#/dev` is a small board and engine test page. It only exists in development builds.

```
src/pages/          one file per screen
src/features/       the code behind each screen, one folder per feature (safety/ is the trainer)
src/components/     shared parts: the board, evaluation bar, move list, zen button
src/data/           opening courses, tactics lessons, opening names (Lichess ECO)
src/lib/            storage, Lichess rules, the study gate, piece sets, board themes, evaluation and PGN helpers
src/engine/uci.ts   the Stockfish web-worker wrapper
src/styles/         the design tokens and shared classes (Ocean and Ember themes)
public/engine/      Stockfish files     public/pieces/  piece sets     public/puzzles/  puzzle files
public/data/        files the daily job writes for the app: study status, Safety-check cards, rating map
data/               the daily job's records (not served): his games without opponent names, engine results
scripts/            data preparation and checks (not needed to run the app); measure/ and safety/ run daily
research/           the 2026-10-16 diagnosis, the pre-registration and its scripts
docs/               notes, task specs, credits and licences
```

## Credits and licence

Chess Coach builds on the work of the Stockfish team, Nathan Rugg (Stockfish.js), Lichess (openings, rules and the puzzle database), the authors of the piece sets, and the makers of chess.js, react-chessboard, ts-fsrs, React and Lucide. The full list is in [`docs/CREDITS.md`](docs/CREDITS.md) and in the app under **Settings → Credits and licences**.

Because it contains Stockfish, the app is released under the **GNU General Public License v3.0**. See [`LICENSE`](LICENSE).
