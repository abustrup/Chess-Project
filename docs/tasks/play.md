# Task: PLAY — play a game against the computer

**You own:** `src/pages/Play.tsx`, `src/features/play/**`, `src/lib/sound.ts`. (Create more files only inside those places.)

## What to build
A polished "play a game" experience, chess.com-style, at `/play`.

### 1. Setup screen (nice card layout, remembers last choices in localStorage `cc.play.setup`)
- **Your colour**: White / Black / Random.
- **Opponent strength**: friendly named levels from beginner to strong, e.g. "Beginner ~700, Casual ~900, Club ~1100, Improver ~1300, Strong ~1600, Expert ~1900, Max".
  Show the approximate Elo. Default = about the user's `profile.selfRating`.
  Implement the bot with the engine in `src/engine/uci.ts` (own instance: `UciEngine.create()`). This build of Stockfish has `UCI_LimitStrength`/`UCI_Elo` (range 1320–3190) and `Skill Level` (0–20).
  Below 1320 you must weaken it yourself. **Goal: a human-feeling opponent, not a random blunderer.** Good approach: search with `multipv` 4–6 at modest depth/`movetime` and
  pick a move by sampling from the candidate list with a probability that falls off with how much worse it is than the best (softmax with a temperature that depends on the level), never choosing moves that
  lose the queen/mate in one at the middle levels, plus occasionally a plain "oversight". Make a quick Node experiment (`scripts/lib/nodeEngine.ts`) with a few self-play games between adjacent levels
  to check the levels are ordered sensibly (stronger level wins clearly more often); label the Elo numbers as *approximate* in the UI.
- **Opening to play** (the key feature!). Radio cards:
  - **Free play** — no opening.
  - **Practise my opening** (`mode=practice`): choose a course (London System / Caro-Kann / Slav — from `OPENING_COURSES` in `src/data/openings`) and a variation (a chapter, or "Surprise me").
    You play the course's side. The bot answers using the prepared opponent replies of that chapter (parse `chapter.pgn` with `parsePgnTree`; at opponent nodes pick among the children, favouring the first/most common but with variety)
    and leaves "book" to Stockfish as soon as the game leaves the tree.
  - **Face an opening** (`mode=face`): the **bot plays that opening** (e.g. bot plays the Caro-Kann as Black, or the London as White) so the user learns to play *against* it. Bot follows the repertoire side of the tree (first child = main move, sometimes an alternative at the user-side nodes), then Stockfish.
  Show a short description of the chosen chapter (`chapter.summary`) and the first moves.
  The course data may still be empty/stub while you work (other builders are writing it). Build against the contract in `types.ts`, test with a tiny fixture of your own inside `src/features/play/` (e.g. 2 chapters of a fake course), and handle "no chapters yet" gracefully ("Lessons are coming — play free for now").
- **Time control**: No clock · 5 min · 10 min · 15+10 · 30 min. The bot also uses the clock (give it human-looking thinking times, shorter in simple positions).
- Support URL parameters from the contract (`/play?course=..&chapter=..&mode=practice|face`, `/play?fen=..&side=..`) to pre-fill and auto-start.

### 2. Game screen
- Board (`Board` component) with player strips above/below: avatar, name ("You"/profile.name, "Bot ~1100"), captured pieces + material difference, clock.
- Right panel (`.side-col`): move list (click a move to look at that position; ← → keys; "back to live"), opening name (use `identifyOpening` from `src/lib/openingName.ts` — it is a stub until another builder fills it; just call it),
  buttons: **Hint** (show best move as an arrow; count hints used), **Take back**, **Resign**, **Offer draw** (bot accepts if it is worse), **Flip board**, **New game**.
  Optional evaluation bar toggle (off by default; `zen-hide`).
- **Coach mode** toggle (default on, easy to turn off): after each of the user's moves, run a quick engine check (depth ~10). If the move loses a lot (e.g. hangs a piece/blunders mate) show a friendly inline message such as
  "Careful — that leaves your knight undefended. Want to take it back?" with **Take back** / **Keep it** buttons. Keep it light so it doesn't nag: only for real blunders (> ~250 cp or a lost piece).
- Premove not required. Auto-promote dialog is handled by `Board`. Highlight last move, check, legal moves (handled by `Board`).
- **Game over**: detect checkmate, stalemate, draw (threefold, 50-move, insufficient material), resignation, timeout. Show a result card/modal: result, how it ended, buttons **Review game** (→ `/review/<id>`), **Rematch**, **New game**.
  Save a `GameRecord` (see `types.ts`) to `KEYS.games` (newest first, keep the last 200) with PGN (with headers incl. result, opening name, `botElo`, `courseId`), `userSide`, `source: 'app'`.
  Also a **Copy PGN** button.
- Sounds (`src/lib/sound.ts`): tiny WebAudio-synthesised sounds (no audio files): move, capture, check, castle, game end, low-time tick. Respect `profile.soundOn`. Must be silent until the first user click (browser autoplay rules).
- If the user closes the tab mid-game, resume it next time (persist the in-progress game in `cc.play.current`). A "Resume game" card appears on the setup screen.

### 3. Zen mode
In zen mode the user sees: board, player strips (minimal), clocks if used, and one row of essential buttons (Hint, Take back, Resign) with class `zen-keep`. The coach messages also stay. Everything else `zen-hide`.

## Done when
- You played several complete games in the real browser (via Playwright): as White and as Black, vs weak and strong levels; with and without clock; checkmate/resign/draw paths; take back; hint; coach warning; reload mid-game; opening practice using your fixture. No console errors.
- Bot never makes illegal moves, never "hangs" in a stuck state (handle engine errors/timeouts: fall back to a simple move), terminates its worker on unmount.
- Screenshots at desktop + phone width + zen look good (you looked at them).
