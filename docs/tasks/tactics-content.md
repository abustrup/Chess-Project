# Task: TACTICS LESSON CONTENT (two builders, split by lesson list below)

**You own:** only the lesson files you create in `src/data/tactics/<lessonId>.ts` (kebab/camel file names as you like) — and **nothing else**. Do NOT edit `src/data/tactics/index.ts` (the lead registers your lessons; your report must list exported constant names, e.g. `forkLesson`). 
Contract: `TacticLesson`, `TacticBlock`, `TacticExample`, `TacticExercise` in `src/types.ts`.

## Reader
A ~1100 player learning tactics from scratch, one pattern at a time. Plain, friendly English; explain *why it works* and *how to spot it* ("look for a piece that attacks two things at once"). Never confusing engine talk.

## Lessons per builder
- **Builder A:** `fork` (name "Forks"), `discovered-attack` ("Discovered attacks"), `pin` ("Pins"), `skewer` ("Skewers").
- **Builder B:** `back-rank-mate` ("Back-rank mate"), `removing-the-defender` ("Removing the defender" — Lichess theme `capturingDefender`), `deflection` ("Deflection"), `trapped-piece` ("Trapped pieces").
- **Builder C:** `loose-pieces` ("Loose pieces & blunder checks" — Lichess theme `hangingPiece`: spotting undefended pieces to win, and the habit of checking what your own move leaves undefended / what the opponent just threatened; include many exercises of the type "your piece is attacked — find the move that saves it AND keeps your position" and "free piece, take it safely"), `attraction` ("Decoys & attraction" — theme `attraction`: lure a piece to a bad square, often a king), `zwischenzug` ("The in-between move" — theme `intermezzo`: instead of the obvious recapture, play a stronger forcing move first), `mate-patterns` ("Checkmate patterns" — a tour of the 5 patterns every club player should know: smothered mate, Arabian mate, Anastasia's mate, Boden's/two-bishop mate, hook mate; use themes `smotheredMate`, `arabianMate`, `anastasiaMate`, `bodenMate`, `hookMate`; `puzzleTheme: 'mateIn2'`).
Lichess `puzzleTheme` keys: fork, discoveredAttack, pin, skewer, backRankMate, capturingDefender, deflection, trappedPiece, hangingPiece, attraction, intermezzo, mateIn2.

## Each lesson must contain
- `tagline` (one line) and `intro`: 4–7 blocks, mixing `text` (short paragraphs), `tip` (a memorable rule of thumb / "how to spot it") and `board` diagrams (`fen`, `arrows`, `highlights`, `caption`) that *show* the pattern: the simplest possible example first, then a version with a queen/knight/pawn variety, then "what it looks like in real games".
  Include a "**how to defend / how not to fall for it**" block — knowing the pattern protects you too.
- `examples`: 3–4 worked examples (watch-the-moves): `fen`, `moves` (UCI), `explanations` (one per move). From simple to realistic.
- `exercises`: **10–12** positions, easy → harder (`difficulty` 1–3), `fen` with the user to move, `solution` UCI line (user move, reply, user move …, 1–3 user moves; first move is the user's), `hint` (a nudge, not the answer: "Look for a square where the knight attacks the king and the queen"), `explanation` (why it works, 1–3 sentences).
  Mix of: the simplest pattern; the pattern when the pieces are in the middle of a messy middlegame; the pattern as the *second* move of a combination; positions as Black as well as White.

## Where to get positions — use real, verified puzzles
`scripts/.cache/puzzles.jsonl` (51,920 Lichess puzzles, CC0; one JSON object per line: `id, fen, moves[], rating, themes[], bucket, kind, opening`). Query it with a small script (python or node) from the scratchpad, e.g. all puzzles whose `themes` include your theme and rating 450–1500, choose varied, clean, instructive ones.
**Lichess format**: `fen` is the position BEFORE the opponent's first move; `moves[0]` is the opponent's move (it creates the puzzle); the user plays `moves[1]`, the opponent replies `moves[2]` … So for our `TacticExercise`: **apply `moves[0]` to the fen, use the resulting FEN as `fen`, and `solution = moves.slice(1)`** (trim the solution after the user's last decisive move if it turns into a long finish; keep 1–3 user moves).
For `examples` and some diagram positions you may also use classic textbook positions or hand-made simple ones.
**Every position must be verified**:
 - legal (apply moves with chess.js), and the solution first move must be the engine's #1 (or equal-best) move (use `scripts/lib/nodeEngine.ts`, depth ≥ 12, multipv 2) and clearly better than the alternatives (≥ ~150 cp or a mate) — otherwise drop it;
 - the pattern you describe in the text really is what happens (check the PV). Use only positions where the tactic is *clearly* of the lesson's type. Don't reuse the same position across lessons or twice in one lesson.
 - Diagram FENs must be valid and show exactly what the caption says. Arrow/highlight squares correct.
Create a verification script in the scratchpad that loads your lesson files (`npx tsx` from the project root), checks all FENs/moves, runs the engine check, and prints a table. Include the summary in your report.

## Style
Data only (one exported `TacticLesson` const per file, plus no logic). Each text ≤ 3 short sentences. Use friendly second person. IDs of exercises: `<lesson-id>-1`, `-2`, …
`npx tsc --noEmit 2>&1 | grep data/tactics` must be clean.
