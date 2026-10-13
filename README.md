# Chess Coach

A calm, free place to **learn chess**. It runs in your web browser. There is no account, no server and nothing to pay for.

Chess Coach is made for one player (you!) who is around 1100 on Lichess and wants to get better in a friendly way. It explains *why* a move is good, not only *which* move to play.

## What can I do with it?

| Where | What you can do |
|---|---|
| **Home** | See what to practise today, pick up where you left off, and check your progress. |
| **Play** | Play a game against the computer. Choose how strong it is and which opening to practise. A coach warns you about big mistakes. |
| **Openings** | Learn three openings step by step: the **London System** (as White), the **Caro-Kann Defence** and the **Slav Defence** (as Black). First you study a variation, then you play it from memory. |
| **Tactics** | Short lessons on tricks that win material: forks, pins, discovered attacks and more. |
| **Puzzles** | Thousands of real puzzles from Lichess. Your puzzle rating goes up as you improve. |
| **My rating** | Bring in your Lichess games (or play here) and get an honest estimate of your real rating, plus a list of what to work on. |
| **Settings** | Your name, board colours, piece styles, sounds, and a backup of your progress. |

**Zen mode:** press the **Z** key (or the leaf button at the top right) to hide everything except the board and the buttons you need. Press **Z** again to come back.

## How do I open it?

- **Online:** once you have put it online (see below) you just open the link, on your computer, tablet or phone. Bookmark it.
- **On your own computer:** see "Run it on your computer" further down.

## How do I put this online for free?

The easiest way is **GitHub Pages**. This project already contains everything it needs (the file `.github/workflows/deploy.yml`). You only need to flip one switch once.

### Option 1: GitHub Pages (recommended)

1. Open your repository on **github.com** (for this project: `https://github.com/abustrup/Chess-Project`).
2. Click **Settings**. It is in the row of tabs at the top of the repository page, on the far right.
3. In the menu on the left, click **Pages**.
4. Under **Build and deployment**, find **Source** and choose **GitHub Actions** from the drop-down list. (There is no Save button. It saves by itself.)
5. Click the **Actions** tab at the top of the repository.
6. In the list on the left, click **Deploy to GitHub Pages**.
7. Click the **Run workflow** button on the right, then click **Run workflow** once more in the little box that opens.
8. Wait one to three minutes. Refresh the page. When the new line has a **green tick**, your site is live.
9. Go back to **Settings → Pages**. At the top it now says **Your site is live at …** and shows the link. For this project it will be `https://abustrup.github.io/Chess-Project/`. Click **Visit site** and bookmark it.

After this, the site **updates itself** every time new changes are saved to the `main` branch. You never have to repeat the steps above.

Good to know:
- On GitHub's free plan, GitHub Pages needs a **public** repository. If your repository is private, use Option 2 or 3 instead, or make it public (Settings → General → scroll to the bottom → Change visibility).
- If step 4 offers no **GitHub Actions** choice, reload the page. If the run in step 8 shows a red cross, click it and then the red step to read what went wrong.
- You do not need to change any settings for the repository name. The site works under any web address.

### Option 2: Cloudflare Pages (also free)

1. Sign in at **dash.cloudflare.com** (free account).
2. Go to **Workers & Pages** and choose **Create**. Pick **Pages**, then **Connect to Git** and choose this repository. (The wording of the buttons changes now and then. You are looking for "create a Pages project from a Git repository".)
3. Fill in the build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - Under environment variables, add `NODE_VERSION` with the value `22`.
4. Click **Save and Deploy**. After a minute you get a link ending in `.pages.dev`.

### Option 3: Netlify (also free)

1. Sign in at **app.netlify.com** (free account).
2. Click **Add new site**, then **Import an existing project**, then **GitHub**, and choose this repository.
3. Fill in the build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - Add an environment variable `NODE_VERSION` with the value `22`.
4. Click **Deploy**. After a minute you get a link ending in `.netlify.app`.

## Your progress and backups

Everything you do (games, lesson progress, puzzle rating, settings) is saved **inside your browser on the device you use**. Nothing is sent to any server. That keeps it private, but it also means:

- If you clear your browser data, or use another device, you start from zero.
- **Backup:** open **Settings → Your data → Download backup**. Keep the file somewhere safe.
- **Restore:** on the new device or browser, open **Settings → Your data → Restore from backup** and choose the file.

The only time the app talks to the internet is when you ask it to import your games from Lichess (it reads your public games, no password needed).

## Run it on your computer

You need **Node.js 22** (free, from `nodejs.org`). Then open a terminal in this folder and run:

```
npm install
npm run dev
```

Open the address it prints, normally `http://localhost:5173`. Press `Ctrl+C` in the terminal to stop it.

Other commands:

- `npm run build` makes the finished website in a folder called `dist`.
- `npm run preview` lets you look at that finished website on your computer.
- `npm run typecheck` checks the code for mistakes.

## A short map of the folders

```
src/pages/          one file per screen (Home, Play, Openings, Tactics, Puzzles, My rating, Review, Settings)
src/features/       the code behind each screen, one folder per feature
src/components/     parts used everywhere: the chessboard, the evaluation bar, the move list
src/data/openings/  the opening lessons (London, Caro-Kann, Slav), written as plain text
src/data/tactics/   the tactics lessons
src/data/eco.json   names of openings (from the Lichess openings database)
src/lib/            small helpers: saving data, piece sets, board colours, rating maths
src/engine/         the connection to Stockfish, the chess engine
src/styles/         the colours and the look of the app
public/engine/      the Stockfish engine files
public/pieces/      the piece styles you can choose in Settings
public/puzzles/     the puzzle files
scripts/            helper scripts used to prepare data (not needed to run the app)
docs/               notes, credits and licences
.github/workflows/  the recipe that puts the site online (deploy.yml)
```

## Credits and licence

Chess Coach stands on the work of many generous people: the Stockfish team, Nathan Rugg (Stockfish.js), Lichess (the openings and the puzzle database, both free to use), the authors of the piece sets, and the makers of chess.js, react-chessboard, React and Lucide. The full list is in [`docs/CREDITS.md`](docs/CREDITS.md) and inside the app under **Settings → Credits and licences**.

Because the app contains Stockfish, it is released under the **GNU General Public License v3.0**. See [`LICENSE`](LICENSE). In short: you may use it, share it and change it, as long as it stays free in the same way.
