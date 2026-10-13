# Task: PIECE SETS (simple, recognisable, free) + BOARD VISUAL POLISH

**You own:** `public/pieces/**`, `src/lib/pieceSets.tsx`, `src/lib/themes.ts` (you may tweak colours of the 8 board themes for beauty and contrast, keep the ids), `docs/pieces-credits.md`.

## Piece sets
The owner wants **several simple, clear, instantly recognisable piece sets** they can switch between in Settings (plus "Classic", which is built into the board library and stays the default). Add **5–6 additional sets**.
- Source: the Lichess web app's piece sets, e.g. `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/<set>/{wK,wQ,wR,wB,wN,wP,bK,bQ,bR,bB,bN,bP}.svg` (sets such as cburnett, merida, alpha, staunty, pixel, mono, letter, kosal, companion, caliente, celtic, ... — look at the directory listing via `https://api.github.com/repos/lichess-org/lila/contents/public/piece` or by trying names). **Check each set's licence** in `https://raw.githubusercontent.com/lichess-org/lila/master/COPYING.md` (or `public/piece/COPYING` / README): this is a free personal, non-commercial project distributed under GPL-3.0, so GPL, CC-BY(-SA), CC0 and CC-BY-NC(-SA) are acceptable **as long as the credit is recorded**; skip anything proprietary or unclear.
- Pick for *clarity and variety*: one very classic Staunton, one slightly rounded/friendly, one flat/modern minimal, one bold high-contrast one that is easy to read on a blue board, one very simple "mono/letter"-style for beginners, one that works especially well on **warm** boards. Test each on every one of the 8 board themes (blue + warm) — pieces must stay readable (white pieces on light squares, black pieces on dark squares).
- Put each in `public/pieces/<dir>/wK.svg …` (12 files), keep file sizes small (strip junk metadata, e.g. with `svgo` via `npx --yes svgo` into the scratchpad first if available, or by hand), then register them in `src/lib/pieceSets.tsx` (`PIECE_SETS` array: `id`, `name`, `description` (one friendly sentence), `credit` (author + licence), `dir`). Keep `classic` first.
- Visual verification: write a Playwright script that loads the dev server, sets `localStorage 'cc.profile'` to each `{pieceSet, boardTheme}` combination and screenshots a middlegame position (use the `/#/dev` page, it shows the board) — view a contact sheet (stitch a few screenshots, or look at them one by one) and drop sets that look wrong (e.g. missing pieces, wrong colours, distorted sizes).
- `docs/pieces-credits.md`: author + licence + source URL per set.

## Board polish
Look at the board in all 8 themes: coordinates contrast, last-move highlight visibility on each theme (the CSS variables are `--sq-last`, `--sq-select` in `theme.css`; if some themes need a different highlight tint, you may export an optional `highlight` colour per theme from `themes.ts` — the lead will wire it), arrow colours readable on blue and warm boards. Report concrete suggestions for `Board.tsx`/`theme.css` improvements instead of editing them.

## Done when
Settings (built concurrently) will list your sets automatically; you verified each set renders all 12 pieces correctly in the real browser (no 404s in the network log) on at least a blue and a warm theme, and the credits file is complete.
