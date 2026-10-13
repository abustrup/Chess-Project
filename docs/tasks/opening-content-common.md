# Opening course content — shared instructions (read together with your opening's own file)

**You own exactly one file:** `src/data/openings/<yourfile>.ts` (it currently holds a placeholder; replace it completely, keep the exported constant name and `id`). You may create helper scratch files in the scratchpad only.

## The reader
A ~1100-rated player who wants to *understand* their opening, not memorise 30 moves of theory. At this level opponents rarely follow theory, so the course must
(1) teach the **main plans and ideas** simply, (2) cover the **main variations**, and (3) prepare for the **sidelines and mistakes that 1000–1400 players really play**.
Text is plain friendly English (see the brief): short sentences, explain why. No jargon without a one-line explanation. Never "= +0.3" style engine speak.

## What to write (contract: `OpeningCourse` in `src/types.ts`)
- `overview`: 3–5 short paragraphs: what the opening is, why it suits the player, the typical plan in 3 sentences, what the typical middlegame feels like, what to be careful about.
- `keyIdeas`: 6–9 cards (title + 1–4 sentences, optional diagram with `fen`, `arrows`, `highlights`, `orientation`). E.g. pawn structure, the plan for the "bad/good" bishop, typical piece placement, typical pawn breaks, typical endgame.
- `commonMistakes`: 5–7 cards: real mistakes players around 1100 make in this opening and what to do instead (with diagrams where it helps).
- `chapters`: **10–14 chapters**, ordered easiest → hardest (`difficulty` 1–3). Each chapter = one variation / one opponent set-up, with `summary` (when does it arise, 1–2 sentences) and a `pgn` **tree**:
  - Standard PGN movetext starting from the initial position, with `( ... )` variations and `{ ... }` comments, and optional `[%cal Gg1f3,Rb5e8]` arrows / `[%csl Gd4]` square highlights inside comments (colours G R Y B).
  - At **every position where the user is to move**: the **first** move listed is the move to learn; list additional playable alternatives in parentheses only if they are genuinely good.
  - At **every position where the opponent moves**: list *all* the replies you have prepared (main reply first, then the other sensible and the common-but-weak replies). Mark clearly weak replies with `?!`/`?` and say why they are weak and how to punish them.
  - **Every move of the user needs a comment** (1–2 plain sentences: the idea/why/what it prevents), plus a comment on important opponent moves (what they threaten, why it's a mistake). Add arrows for the key idea (`[%cal]`).
  - Depth: each line should run until the opening ideas are achieved and the plan is clear (typically 8–14 moves each side), not stop at move 5.
  - 4–10 leaf lines per chapter. Include well-known **traps** (and name them only if you are sure of the name; otherwise describe them).
- `ecoNames`: Lichess/ECO names that belong to this course (exact strings from the Lichess openings database, e.g. `"Caro-Kann Defense: Advance Variation"`) — used to recognise the opening in games.
- `signatureMoves`: the defining first moves in SAN.

## Quality process (mandatory)
1. Download the Lichess openings database (`curl -s https://raw.githubusercontent.com/lichess-org/chess-openings/master/{a,b,c,d,e}.tsv` → scratchpad) and use it to confirm names and move orders of every chapter's main lines.
   You may also try the Lichess opening explorer (`https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid&ratings=1000,1200,1400&fen=...`) to see which replies players of this level actually choose; it may require a token — if it is blocked, rely on your knowledge and say so in your report.
2. **Legality**: `npx tsx scripts/check-openings.ts` must report **0 errors** for your course. Fix every warning you reasonably can (uncommented user moves, lines that end right after the user's move).
3. **Soundness with the engine**: write a scratch script (in the scratchpad, importing `scripts/lib/nodeEngine.ts`) that walks every line of your course and, for **every move the user is meant to play** and every prepared opponent reply, compares the engine's evaluation (depth ≥ 14, multipv 3) with the best move's.
   - A user move that is >60 cp worse than the engine's best, or a clearly dubious opening choice, must be fixed or deliberately justified in its comment ("slightly less accurate but simpler to play").
   - Opponent replies that are bad should be marked `?!`/`?` and their punishment shown — verify the punishment is real (the engine agrees the position is clearly better for the user).
   - Keep the script's output and include a summary in your report (number of positions checked, the flagged ones, how you resolved them).
4. Re-read all comments as a teacher: are they correct, simple, useful? Delete anything you aren't sure about.
5. Make sure the TypeScript file compiles (`npx tsc --noEmit | grep data/openings/<yourfile>`) and the PGN strings contain no accidental backticks / `${`.
6. Then open the app and look at your content in the real UI if the openings trainer page exists by then (`/#/openings`), but it is being built concurrently — don't wait for it.

## Style of the data file
Export a single `OpeningCourse` constant (name given in your task file). Put each chapter's PGN in a template string with readable line breaks (one variation per line when practical). Keep text out of the code in the sense of "no logic": it is data.
