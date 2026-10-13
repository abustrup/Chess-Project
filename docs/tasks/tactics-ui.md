# Task: TACTICS LEARNING PAGE

**You own:** `src/pages/Tactics.tsx`, `src/features/tactics/**`. Lesson *content* lives in `src/data/tactics/*` (written concurrently by other builders; registered in `src/data/tactics/index.ts` by the lead — it is empty right now). Do not edit those.

## What to build (`/tactics`, `/tactics/<lessonId>`)
1. **Overview**: a grid of lesson cards (icon, name, tagline, progress "6/10 solved", completed check). A friendly intro line ("Tactics win games. Learn one pattern at a time."). Show a "next up" suggestion.
2. **Lesson page** with a clear 3-step flow in tabs/stepper — **Learn → Watch → Practice** — and a final **More puzzles** step:
   - **Learn**: render `intro` blocks in order: text paragraphs, highlighted tip boxes, and board diagrams (non-interactive `Board` with arrows/highlights + caption). Beautiful, readable typography (max ~65ch), diagrams large enough.
   - **Watch**: step through each `TacticExample`: board + explanation per move; Next/Previous (buttons + ← → keys), play/pause autoplay, restart, example selector. The board animates each move; show the explanation text for the current step.
   - **Practice**: solve `exercises`. Board shows the position with the side to move at the bottom. The user plays the solution move(s); after a correct user move the opponent's reply from `solution` is auto-played (animated); wrong move → friendly feedback ("Not that one — look for…"), piece snaps back, count a failed attempt; **Hint** (shows `hint` text, second press highlights the piece/square), **Show solution**, **Retry**. On success show the `explanation` and a **Next** button. Progress dots for all exercises (done/failed/todo). Track in `KEYS.tacticsProgress` (`TacticsProgress` in `types.ts`).
   - **More puzzles**: a button linking to `/puzzles?theme=<lesson.puzzleTheme>` ("Practise with real puzzles from Lichess").
3. Orientation: the board is oriented to the side to move for exercises.
4. Empty state when no lessons exist yet. Use a small fixture lesson of your own inside `src/features/tactics/fixtures/` to build/test (enable with `?fixture=1`), then re-test with real lessons when they exist (check `src/data/tactics/` for files).
5. Zen mode: in Practice show only board + prompt/feedback + main buttons (`zen-keep`); hide dots/stats (`zen-hide`).

## Done when
Everything works with the fixture and with real lessons (mouse + keyboard), progress persists, no console errors, screenshots reviewed (desktop, phone, zen).
