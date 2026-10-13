# Chess Coach

A calm, free place to **learn chess**, made for one player: you. It runs in your web browser. There is no account, no server and nothing to pay for.

**Open it here: https://abustrup.github.io/Chess-Project/** (bookmark it on your computer and your phone)

On this Mac you can also double-click **Open Chess Coach.command** in this folder: it opens the app in your browser without the internet.

## What it does

| Where | What you can do |
|---|---|
| **Home** | See what to practise today and pick up where you left off. |
| **Play** | Play the computer. Choose how strong it is, and practise one of your openings against it. A coach warns you about big mistakes. |
| **Openings** | Learn your three openings step by step: the **London System** as White, the **Caro-Kann** and the **Slav** as Black. First you study a line, then you play it from memory. |
| **Tactics** | Short lessons on tricks that win material: forks, pins, discovered attacks and more. |
| **Puzzles** | Thousands of real puzzles from Lichess. Your puzzle rating grows as you improve. |
| **My rating** | Bring in your Lichess games (or play here) and get an honest estimate of your real rating, plus what to work on. |
| **Settings** | Your name, colours, board and piece styles, sounds, and a backup of your progress. |

**Zen mode:** press **Z** (or the leaf button at the top right) to hide everything except the board. Press **Z** again to come back.

**Use it like an app:** on iPhone, open the link in Safari, tap **Share**, then **Add to Home Screen**. In Chrome on a computer, click the install icon at the right end of the address bar. It then opens in its own window with the Chess Coach icon.

## Your progress stays in your browser

Everything you do (games, lessons, puzzle rating, settings) is saved **only in the browser on the device you use**. Nothing is sent anywhere. That keeps it private, but it also means:

- A different device or browser starts from zero, and clearing your browser data wipes your progress.
- **Back up** now and then: **Settings → Your data → Download backup**. Keep the file somewhere safe.
- **Move to a new device:** open **Settings → Your data → Restore from backup** there and choose the file.

The app only goes online for its own files, and when you ask it to fetch your public games from Lichess (no password needed).

---

## For developers

React 19 + TypeScript + Vite, `chess.js` for the rules, `react-chessboard` for the board, Stockfish 19 (single-threaded WebAssembly, in a web worker) as the engine, and open Lichess data (openings and puzzles). Fully static: no backend, no API keys. Data lives in `localStorage` under `cc.*` keys (see `src/lib/storage.ts`).

Needs **Node.js 22.12 or newer** (24 recommended).

```
npm install
npm run dev         # local dev server with hot reload
npm run typecheck   # TypeScript check
npm run build       # typecheck + production build into dist/
npm run preview     # serve dist/ locally
```

**Deploying.** `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main` (or by hand: Actions → Deploy to GitHub Pages → Run workflow). One-time setup: repository **Settings → Pages → Source: GitHub Actions**. The build uses relative paths (`base: './'`) and hash routes (`#/play`), so it works under any sub-path, such as `/Chess-Project/`, with no extra configuration.

**How the app is put together**

- `src/App.tsx` is the shell: top navigation, theme and zen mode on `<html>`, and the routes. Each page is loaded on demand (`React.lazy`), and the other pages are fetched in the background a moment later. A failed page load shows a friendly "reload" card instead of a blank screen.
- `index.html` holds the start-up splash and applies the saved theme before the first paint. `public/manifest.webmanifest` and `public/icons/` make it installable (there is no service worker, so it needs a connection).
- `/#/dev` is a small board and engine test page. It only exists in development builds.

```
src/pages/          one file per screen
src/features/       the code behind each screen, one folder per feature
src/components/     shared parts: the board, evaluation bar, move list, zen button
src/data/           opening courses, tactics lessons, opening names (Lichess ECO)
src/lib/            storage, piece sets, board themes, evaluation and PGN helpers
src/engine/uci.ts   the Stockfish web-worker wrapper
src/styles/         the design tokens and shared classes (Ocean and Ember themes)
public/engine/      Stockfish files     public/pieces/  piece sets     public/puzzles/  puzzle files
scripts/            data preparation and checks (not needed to run the app)
docs/               notes, credits and licences
```

## Credits and licence

Chess Coach builds on the work of the Stockfish team, Nathan Rugg (Stockfish.js), Lichess (openings and the puzzle database), the authors of the piece sets, and the makers of chess.js, react-chessboard, React and Lucide. The full list is in [`docs/CREDITS.md`](docs/CREDITS.md) and in the app under **Settings → Credits and licences**.

Because it contains Stockfish, the app is released under the **GNU General Public License v3.0**. See [`LICENSE`](LICENSE).
