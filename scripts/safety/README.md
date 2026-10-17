# Safety-check cards: how they are built

Written 2026-10-16 for build-plan task C1 (`research/2026-10-16-diagnosis/build-plan.md`).

## In plain words

The Safety-check trainer shows you positions from your own rated Lichess games, just after your opponent's move.
This folder turns your games into those positions (cards) and checks them. Three kinds:

- **own**: a real mistake of yours that lost material, allowed mate, missed a tactic, or was made while your opponent
  had a concrete threat. Positions you had already lost (below 10%) are left out. Your game move always counts as
  wrong, as on Lichess.
- **held**: your opponent had a concrete threat and you did not blunder. You get them so that "defend first" is
  trained, not only "find the trick". A position is left out when the card's deeper search finds your game move unsafe.
- **quiet**: nothing was threatened, nothing was there to win, and your move was fine. At most 15% of the cards.

On your own mistakes a move counts as right when it keeps your winning chances within 4 points of the best move:
Lichess's own "Learn from your mistakes" rule. On held and quiet cards a move is also right when it is **safe**: it
costs under 15 points (so it is not a Blunder by Lichess's size), allows no mate, and gives away under 2 points of
material once the exchanges are played out. Those cards train "check, then play a safe move", not "find the engine's
first choice": under the 4-point rule alone, 276 of 755 moves on 19 of 21 quiet cards failed without hanging anything
(2026-10-16). Everything shown on a card ("He threatens Qxe7, winning your knight on e7") is computed by the engine
and re-checked by a script. No AI writes any of it.

Nothing here costs money. It needs Python with python-chess and native Stockfish 19.

## Files

| File | What it is |
|---|---|
| `build_cards.py` | builds `public/data/safety/cards.json` and `data/safety/report.json` |
| `check_cards.py` | every check below; exit code 0 only when all pass |
| `config.json` | user, engine setting, rules, base inputs and output paths |
| `cards.schema.json` | the card format, with the verdict order the app must follow |
| `classify.py` | the my-games diagnosis per move, ported line for line from `my-games/scripts/analyse_games.py` |
| `facts.py` | the facts on a card and how their claims are proved |
| `card_checks.py` | the engine-free checks (run by both scripts; the builder writes nothing when one fails) |
| `engine.py` | Stockfish pool (Threads 1 each, empty hash per search) and the search cache |
| `retro_rule.py` | Lichess's 4-point rule and "Learn from your mistakes" picker in Python |
| `data/safety/engine-cache.jsonl` | every card search, so unchanged games cost nothing (commit it) |
| `data/safety/evals.jsonl` | measurement evals the builder had to compute itself, in prereg `measure.py` cache format (commit it) |
| `data/safety/report.json` | counts, every left-out candidate with its reason, the quiet picks (commit it) |

## Command line (for the daily job, M1)

Run from the repo root. The base inputs in `config.json` (the 31 blitz games of 2026-10-10 to 2026-10-15 with their
saved evals and lines) are always included unless `--no-base` is given.

```
.venv/bin/python -I scripts/safety/build_cards.py \
    --games data/measure/<his export>.ndjson \
    --evals <measure.py --cache file> \
    --workers 4 --stockfish "$STOCKFISH"
.venv/bin/python -I scripts/safety/check_cards.py --games data/measure/<his export>.ndjson
```

- `--games FILE` (repeatable): Lichess export rows (`/api/games/user/abustrup` NDJSON with `clocks=true`, `evals=true`,
  `opening=true`; `division` and `accuracy` are not needed). Opponent usernames are not needed and may be removed;
  he is found by `players.<colour>.user.id == "abustrup"`. A game listed twice is used once, preferring the copy that
  carries Lichess's analysis.
- Games used: rated, standard, not from a position, not against a BOT, finished, at least 2 plies, speed blitz, rapid or
  classical (`config.json` `speeds`).
- `--evals FILE` (repeatable): eval caches written by prereg `measure.py --cache` (250,000 nodes, threat probe on his
  moves). Games found there are not analysed again; other games are analysed with the same code and setting and saved
  to `data/safety/evals.jsonl`, which `measure.py --cache` can also read.
- `--lines FILE` (repeatable): saved 8-ply lines (my-games `lines.py` format); missing ones are computed and cached.
- `--workers N`: engine processes, each Threads 1 (default 3). Use 4 on a 4-CPU GitHub runner.
- `--stockfish PATH` or `$STOCKFISH` (default `/opt/homebrew/bin/stockfish`). The engine must report the name in
  `config.json` (`Stockfish 19`); otherwise the build stops, so cards from different engines are never mixed by
  accident.
- `--out`, `--report`, `--engine-cache`, `--evals-cache`: other paths (tests); `--only-games a,b`: a subset (tests).

Exit codes: **0** the card file was written; **2** a check failed, the card file was NOT written (the old one stays)
and `report.json` lists the first problems; anything else is a crash. A failure here must never block the
measurement commit.

Files to commit after a run: `public/data/safety/cards.json`, `data/safety/report.json`,
`data/safety/engine-cache.jsonl`, `data/safety/evals.jsonl`.

Time, measured 2026-10-16 on this Mac (Apple Silicon, shared with other jobs, load average 8-11) with 3 engine
processes: one new game, from nothing (measurement evals, lines and cards; the longest of the 31 games, 116 plies),
took 92 s and 231 searches. Rebuilding all 31 games with an empty card cache took 16 to 20 min. Unchanged games come from
the cache in about 2 s. A 4-CPU GitHub runner should take about the same per game [inferred, not yet run there].
Every legal move of the held and quiet cards (step 7, added 2026-10-17): 3,581 moves on 101 cards, about 3,200 new
searches and settled lines, took 38 min with 3 engines on this Mac under the same load (853 searches came from the
B10 runs of 2026-10-16). A new game adds about 2.6 held cards and at most one quiet card, so about 100 to 130 more
1M-node searches: roughly 1.5 to 2 minutes with 3 engines [inferred from the totals].

## What the builder does

1. **Measurement evals** at the pre-registered setting (Stockfish 19, 250,000 nodes, Threads 1, Hash 64 MB, empty hash
   per search, with the game's move history; threat probe where he is to move and not in check). Reused from any
   cache given; the base games use `my-games/engine/sf_250k_bothnull.jsonl`.
2. **8-ply lines** for his judged moves whose printed engine line is short (my-games `lines.py`, unchanged in
   substance).
3. **Diagnosis per move** (`classify.py`): Lichess's game-page judgement, Lichess's own label where the game was
   analysed, the threat test, the categories and flags of `mistakes.json`. On the 31 base games it reproduces
   `my-games/out/moves.jsonl` on all 891 moves (`check_cards.py --diagnosis`).
4. **Candidates**
   - own: judged Blunder or Mistake (ours or Lichess's), category in hung_piece, ignored_threat, allowed_short_mate,
     allowed_longer_tactic, missed_free_material, missed_own_tactic, missed_short_mate, or made facing a concrete
     threat. Left out, with the reason in `report.json`: win% before the move below 10; not a "Learn from your
     mistakes" move (swing of 10 points or less on the clamped scale and no lost mate in 3) on our evals and on
     Lichess's; the card search does not confirm the mistake (game move best or within 4 points); one legal move.
   - held: facing a concrete threat (pre-registered test), no Blunder or Mistake by either count. Same 10% rule.
   - quiet: tested move, threat under 5 points, no judgement by either count, from move 6, not lost. Per game the
     first 3 candidates are tried, winning positions (75% or more, the pre-registered S7 situation) first, then a fixed
     hash order. Taken only when the card search agrees (game move passes, best move wins nothing, no mate) and the
     quiet share stays at most 15% of the cards so far, games in date order. At most one per game. Adding newer games
     never changes an earlier pick.
5. **Card searches** (1,000,000 nodes, Threads 1, empty hash): a MultiPV 5 search picks the candidate moves, then each
   is searched on its own (`root_moves`) at the same node count, and the game move too when it is not among them.
   So a move in `top` gets exactly the verdict a separate search gives it (B10). Short lines are lengthened by
   sequential 250,000-node searches (`extendNodes`).
6. **Facts** (`facts.py`): `threat`, `allowed`, `free`, `quiet`. A fact names a piece or says "win material" only
   when its stored line nets 2+ points. The line is first carried on by 250,000-node searches (up to 6 more plies)
   until no exchange is left open (its last move is not a capture or promotion and nobody is in check), and the 2+
   must hold both by the pre-registered median rule and by the plain count at the line's end. Without this, a 6-ply
   line that stopped between a capture and the recapture called an even trade "win material": on 2026-10-16, 9 of
   169 claims of material netted 1 point or less once the exchange was finished, 5 of them naming a piece ("winning
   your bishop on g7" for a line that wins a pawn). `free` counts from before his last move, so a plain trade is not "left
   unprotected", and it needs the piece to have no defender at all, because the app's sentence says "unprotected".
   A mate claim needs a stored line that mates in exactly that many moves.
7. **Every legal move of the held and quiet cards** (`moves`), each searched on its own (`root_moves`, 1,000,000
   nodes, as `top`, so those come from the cache). A move within 4 points of the best stores only its eval. Any other
   also stores its own line (its first 6 plies carried on until no exchange is left open, as for facts), `gain` (the
   material he gives away along it, `facts.claim_gain`) and `safe` (under `safeMaxLoss` = 15 points lost, no mate
   against him, `gain` under `safeMinGain` = 2). The game move's `human.passes` is the same verdict, and a held card
   whose game move is not right this way is left out (listed in `report.json`). `report.json` `safetyRule` counts the
   moves per kind: within 4 points, right only because safe, wrong.
8. **Checks** (`card_checks.py`), then the file is written. Card order: games in date order, then ply.

Byte-identical rebuilds: no wall-clock time in either output (`generatedAt` is the start time of the newest game),
every search is deterministic (Threads 1, fixed nodes, empty hash), and the cache is rewritten sorted.
The Mac (arm64) and a Linux runner may give slightly different numbers for the same search [assumed]; cached cards keep
their numbers, new cards get the runner's.

## The verdict order the app must follow (also in `cards.schema.json`)

For a move the trainee makes on a card:
1. own card and the move is `human.uci`: wrong, "That was the game move";
2. held or quiet card: the move's `moves` entry: right when `retroAccept(side, entry.eval, top[0].eval)` or
   `entry.safe` (every legal move is listed, so these cards never need the browser engine);
3. the move is in `top`: right when `retroAccept(side, entry.eval, top[0].eval)`, i.e. `entry.win > top[0].win - 4`;
4. the move is `human.uci` on a held or quiet card: `human.passes`;
5. `topComplete`: wrong at once;
6. otherwise the browser engine (Lichess readiness rule) compared with `top[0].eval`.

All `eval` values are White point of view, like Lichess. `win` is the trainee's win% on Lichess's retro scale (cp
clamped to +-1000, mate N as (21 - min(10, |N|)) * 100 cp), with 2 decimals, or more on a card where 2 would put a move
on the other side of the 4-point line than its `eval` does (none of the 184 cards of 2026-10-16; without this, such a
card would fail the checks and, its searches being cached, stop every later build). `context.clockMs` is his clock
when the position arose.
Pieces are one letter (`p n b r q k`).

## Checks

```
.venv/bin/python -I scripts/safety/check_cards.py                 # fast: rule vectors, schema, B1-B3, B6, B8, new checks, privacy
.venv/bin/python -I scripts/safety/check_cards.py --diagnosis     # the 31 base games: 99 / 82 / 16 acceptance
.venv/bin/python -I scripts/safety/check_cards.py --engine 50     # B10 on 50 random cards (about 25 min with 3 engines, cached after)
.venv/bin/python -I scripts/safety/check_cards.py --rebuild warm  # B11 from the caches (seconds)
.venv/bin/python -I scripts/safety/check_cards.py --rebuild cold  # B11 with every search repeated
```

Set `SAFETY_SCRATCH` to choose where `--rebuild` puts its temporary folder. The B10 searches are cached in
`scripts/safety/.cache/` (not committed).

## Deviations from the trainer spec, and why

- Kinds are own, held and quiet (build plan version 2), not population, defend and judge.
- Own cards follow the build plan's universe (the mistakes.json records in the listed categories or facing a threat),
  intersected with Lichess's "Learn from your mistakes" picker, which on Lichess only offers moves that carry a
  judgement. A move counts as picked if it is picked on our evals or on Lichess's own evals; the 2 Lichess-only
  Mistakes of the base games qualify only on Lichess's.
- No opening-book exclusion (the build plan dropped it).
- `nothingToWin` on a card is the my-games flag plus the spec's B6 conditions (best move at 65% or less, not a
  capture winning 2+ by exchange), so the flag is never on a card where something was there to win.
- `top` entries are searched one by one after MultiPV picks them (see step 5). On a pilot of 8 cards this raised B10's
  agreement from 98.1% to 99.6%; on the 50-card check of 2026-10-16 it is 99.8% (1,446 of 1,449 decided moves), and
  99.9% (1,715 of 1,716) on 2026-10-17 with the list of every legal move on held and quiet cards.
- No fact type for "you had a tactic": a missed tactic shows through the best move and its line (`top[0].pv`).
  A card may carry no fact at all: on 2026-10-16, 15 own cards and 5 held cards (the held ones failed the 2+ material
  rule once the exchange was played out, so nothing is claimed).
- Held and quiet cards accept any safe move, not only moves within 4 points (fixer after the final critique,
  2026-10-17, before any card was shown to him): the spec's 4-point rule there trained matching the engine in
  positional positions, which the build plan cut from the own cards. Own cards keep Lichess's rule.
- Two of the spec's sentences would be false on some cards, so the app (`src/features/safety/facts.ts`) says less:
  a threat is "He threatens ...", not "His move ... threatens ..." (on 5 of the 74 threats naming a piece on
  2026-10-16, the piece could already be taken before his last move); a quiet card says only "Nothing was threatened
  here.", without "Any move that keeps your pieces protected was fine" (on 19 of the 21 quiet cards some moves that
  leave nothing hanging still fail the 4-point rule).
- `free` only for a piece with no defender (the spec's data definition is "capturable for 2+", but its sentence says
  "unprotected"; on 2026-10-16 that sentence was false for 4 of 8 free facts, such as a queen won by a bishop and
  recaptured by a pawn). Such a piece still shows through the best move and its line.
