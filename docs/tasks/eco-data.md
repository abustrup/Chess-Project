# Task: OPENING NAME LOOKUP (Lichess openings database)

**You own:** `src/lib/openingName.ts` (replace the stub, keep the exported API), `src/data/eco.json` (or a `.ts` module) and its build script `scripts/build-eco.ts`, `docs/eco-data.md`.

## What
Build the lookup behind `identifyOpening(sans: string[]) → { eco, name, plies } | null` from the **Lichess openings database** (public domain / CC0): `https://raw.githubusercontent.com/lichess-org/chess-openings/master/{a,b,c,d,e}.tsv` (columns `eco`, `name`, `pgn`).
- Match the game's **position**, not just the move text, so **transpositions** are recognised: precompute, for every database line, the *EPD* (FEN without move counters) after its last move; walk the user's game and return the **last** (deepest) position that is in the table (keeping the ply index). Handle that several lines can end in the same position (pick the most specific / longest name; deterministic).
- Output size matters (ships to the browser): store compactly (e.g. `{ epd: [eco, name] }` or arrays) ≤ ~400 KB raw; gzip is fine. Load synchronously from a bundled module (import the JSON statically) so `identifyOpening` stays synchronous.
- Also export `isBookPosition(sans)`, and a helper `openingFamily(name)` that returns the part before `:` (e.g. "Caro-Kann Defense") and `courseIdForOpening(name): 'london'|'caro-kann'|'slav'|null` (Slav and Semi-Slav → 'slav', "London System" anywhere in the name → 'london', "Caro-Kann" → 'caro-kann'). The app uses it to link a played opening to the matching course.
- Unit-check with a Node script: a handful of known games/lines → expected names (e.g. 1.e4 c6 2.d4 d5 3.e5 → Caro-Kann Defense: Advance Variation; 1.d4 d5 2.Bf4 → Queen's Pawn Game: London System-ish; 1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 dxc4 → Slav Defense: ... ; a transposition example; a non-book line → null).
- Document in `docs/eco-data.md` (source, licence CC0, how to rebuild).
Finish quickly (this is a small task) and report.
