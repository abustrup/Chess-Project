# Task: OPENINGS TRAINER — study and drill the opening courses

**You own:** `src/pages/Openings.tsx`, `src/features/openings/**`. (The *content* of the courses lives in `src/data/openings/*` and is written by other builders at the same time — do NOT edit those files.)

## Why this matters
This is the **primary feature of the whole app**: the owner (≈1100 Elo) wants to truly learn the **London System** (as White), the **Caro-Kann** and the **Slav** (as Black), including their variations. Make learning effective, pleasant and simple.

## Data you consume
`OPENING_COURSES` / `getCourse()` from `src/data/openings`. Types: `OpeningCourse`, `OpeningChapter`, `IdeaCard` in `src/types.ts`. A chapter's `pgn` is parsed with `parsePgnTree` (`src/lib/pgnTree.ts`) into a tree of `PgnNode`s
(each has `san`, `uci`, `fen`, `comment`, `arrows`, `highlights`, `nags`, `children`, `mover`; `children[0]` = main move). Rules for the data (also described in `types.ts`): the user plays `course.side`;
at nodes where the user is to move, `children[0]` is the move to learn and further children are acceptable alternatives; at nodes where the opponent is to move, every child is a prepared reply.
Comments are plain-language explanations; `arrows`/`highlights` come from `[%cal]`/`[%csl]` commands — draw them on the board.
The content may be **empty or partial while you work** — build against the contract with your own small fixture inside `src/features/openings/fixtures/` (a fake course with 2 chapters, with variations, comments, arrows) and test with it
(e.g. enable via `?fixture=1`), then re-test with the real content at the end (`npx tsx scripts/check-openings.ts` shows how many chapters exist). Handle "no chapters yet" gracefully.

## Pages (nested routes inside the page; see the URL contract in the brief)
1. **`/openings`** — a beautiful overview: 3 big course cards (colour side icon, name, tagline, signature moves, #variations, overall mastery bar, "Continue" button that goes to the next unfinished chapter) + a short intro line for a beginner.
2. **`/openings/<courseId>`** — the course home: intro (`overview` paragraphs), **Key ideas** (`keyIdeas` as cards with small non-interactive mini boards when `fen` is given — use `Board` with `interactive={false}`),
   **Common mistakes** (`commonMistakes`), and the **list of chapters** ordered by difficulty with difficulty dots, summary, mastery %, and buttons **Study** / **Drill**. Plus course-level buttons: **Quiz me on everything** (drill across random chapters) and **Play it against the computer** (→ `/play?course=..&mode=practice`) and **Face it as the opponent** (→ `/play?course=..&mode=face`).
3. **Study mode** `/openings/<courseId>/<chapterId>/study` — a guided lesson: the board shows the position, a coach panel shows the comment for the current move in large friendly type, arrows/highlights from the PGN.
   Controls: Next / Previous (buttons + ← → keys), restart, autoplay (optional). When the position is one where the *opponent* has several prepared replies, show them as clickable choices ("Black can also play: …") so the user explores the tree;
   a breadcrumb/"line so far" in plain moves with a way to jump back; label the user's moves clearly ("Your move"). Mark moves with `!`/`?` glyphs from NAGs. Mark the chapter `studied` at the end (or after reaching depth). Include a "Try it yourself from here" button that switches to drill from the current position.
4. **Drill mode** `/openings/<courseId>/<chapterId>/drill` — **the user plays the moves from memory**. The app plays the opponent's replies (random among prepared ones, favouring weaker lines the user has failed before).
   - Correct move (main or an accepted alternative) → green feedback + the explanation; wrong move → the piece snaps back, show a friendly message ("Not quite. In this position the idea is …"), count a mistake, offer **Retry**, **Show hint** (first hint: highlight the piece; second: show the arrow), and **Show answer**. Don't be punishing; the goal is learning.
   - A "line" ends when the tree ends: show **Line complete** with mistakes count + button **Next line**; keep a streak. Track per-node mistakes so weak spots come back more often (simple weighted random is enough).
   - Save progress into `KEYS.openingProgress` (`OpeningProgress` shape in `types.ts`: key `${courseId}/${chapterId}`): `studied`, `drillsCompleted`, `drillMistakes`, `bestStreak`, `mastery` (0..1 — you define a fair formula, e.g. from recent clean completions), `lastPracticed`.
   - Support a **start-from-node** (continue from the study position) and **orientation** matching the user's side (black courses show the board from Black's side).
5. Everything has an **empty/loading/error state**. Keyboard accessible.

## Zen mode
In study/drill, zen shows only: board, the coach comment (`zen-keep`), and the main buttons (`zen-keep`). Hide progress stats, line lists etc. with `zen-hide`.

## Done when
- You can study and drill the fixture and (at the end) the real content end-to-end in the real browser, mouse and keyboard, both as White and Black. Progress persists after reload. No console errors; screenshots reviewed on desktop, phone, zen.
- Report anything wrong you noticed in the real content (illegal-looking structure, missing comments, confusing text) so the lead can pass it on.
