# Deep engine check of the opening courses

A permanent, re-runnable check of every move in the three opening courses
(London, Caro-Kann, Slav) against a deep Stockfish search and the Lichess cloud evaluation.
It never edits course files. Written 2026-10-16.

## Run it

From the repo root (needs the `.venv` with `python-chess`, `node_modules` with `tsx`, and a
native Stockfish at `/opt/homebrew/bin/stockfish` or `--engine PATH`):

```
.venv/bin/python scripts/deep-check-openings/check.py          # search + cloud, writes results.json
.venv/bin/python scripts/deep-check-openings/summarize.py      # writes summary.md and flagged.json
```

Output goes to `research/2026-10-16-diagnosis/engine/` unless `--out DIR` is given.

Re-runs reuse `engine-cache.jsonl` and `cloud-cache.jsonl`, so after a course edit only new or
changed positions are searched, and positions the cloud could not be asked about last time are
asked again. A stored search is reused when position, node count, MultiPV and root moves match,
whatever thread count and hash size it was made with (added 2026-10-16, so a 2-thread re-run can
use the 4-thread searches). `--fresh` ignores the caches. `--tiebreak-nodes 0` / `--confirm-nodes 0`
skip the deeper tiers.

## The gate on GitHub (`--strict`, added 2026-10-16)

`.github/workflows/content-checks.yml` runs, on every change to the courses or the checkers:

```
python scripts/deep-check-openings/check.py --strict --offline --threads 4 --hash 512 \
    --max-search-seconds 720 --cache-from research/2026-10-16-diagnosis/engine --out <scratch folder>
```

- `--cache-from DIR` reads the committed caches but never writes them; new searches and the
  results go to `--out`. On unchanged courses every search is a cache hit (2026-10-16: 2,108 of
  2,108 on the 40-chapter courses and 698 of 698 on the narrowed 20-chapter ones, about 1 second
  each). A planted taught move that loses a bishop needed 7 new searches, 108 seconds with 2
  threads on the shared Mac.
- `--offline` asks Lichess nothing (0 requests); cloud results come from the committed cache, so
  the confirmation and tie-break choices are the same as in the run that made the cache.
- `--max-search-seconds` caps the time spent on new searches; anything left unevaluated fails.
  After a large course edit, run the check on the Mac (command at the top) and commit the cache.
- `--strict` exits 1 on any of these, each named with its course, chapter and line:
  - a taught move (or listed alternative) that loses more than 50 cp or 5 win-chance points at
    **every** local depth that was run, unless it is listed in `deliberate-choices.json`;
  - a move marked `?!`, `?` or `??` that loses less than 40 cp at every local depth;
  - a line that ends with the owner 50 cp or more worse at the deepest local search;
  - a position where two chapters teach different moves;
  - an item the engine could not evaluate (time budget).
  Flags that hold at some depths only are printed as notes: near 50 cp, depth decides (see below).
  The cloud is shown in `results.json` but never decides the gate.
- `deliberate-choices.json` lists taught moves kept on purpose, each with its position, move and a
  reason a reader can check (today: 1.d4 b6 2.Nf3). Add one only with such a reason.
- `make_ci_canary.py` plants one false sentence and one taught move that loses a bishop, for a
  throwaway branch that must fail the workflow (instructions in the script).

Time on 2026-10-16 (10-core Mac shared with about eight other jobs, load average 20-60):
pass 1 took about 93 minutes for 1,825 check items (1,946 searches, about 3 s each, median
depth 19), the confirmation pass 26 minutes for 95 items (median depth 26), the tie-break
10 minutes for 7 items. Lichess cloud entries used had a median depth of 30.
On a quiet machine expect roughly a third of that.

## What it checks

1. **Taught moves.** Every position where the owner is to move and the course lists a move. The
   first listed move is the one the app teaches. Loss = best move's score minus the taught move's
   score, for the side to move.
2. **Listed alternatives** for the owner (other moves at the same position): same test.
3. **Opponent moves marked `?!`, `?`, `??`.** Do they really lose at least 40 cp against the
   opponent's best move, and what would Lichess itself call them.
4. **Line ends.** The evaluation of the last position of every line, from the owner's side.
5. **Conflicts.** Positions reached in two chapters that teach different moves.

Positions are taken from the app's own PGN parser (`extract.ts` imports `src/lib/pgnTree.ts`),
so the check sees exactly what the app shows. Positions are de-duplicated by EPD
(board, side to move, castling, legal en-passant square).

## Fixed settings (change them only on purpose, and say so in the results)

| Setting | Value |
|---|---|
| Engine | Stockfish 19, native, default NNUE net bundled with the binary |
| Pass 1 (every item) | 3,000,000 nodes per search, MultiPV 3, Threads 4, Hash 1024 MB |
| Move not in the pass-1 top 3 | second search restricted to {best move, this move} (`searchmoves`), MultiPV 2, same node count, so both scores come from one search |
| Confirmation pass | 30,000,000 nodes, for every item that either source flags or that is near a threshold (taught move > 30 cp or > 3 points; marked opponent move < 70 cp; line end <= -30 cp). One search restricted to the pass-1 top 3, the cloud's best move and the move under test, one line per root move, so the best move and the tested move are scored in the same search. Line ends: MultiPV 1, unrestricted |
| Tie-break pass | 150,000,000 nodes, same restricted method, for every item where the confirmed engine verdict and the cloud verdict disagree |
| Verdict | the deepest local search that was run for the item; the cloud is shown beside it |
| Hash | cleared (`ucinewgame`) before each new position, kept between the searches of one position |
| Scores | centipawns for the side to move, clamped to +-1000; mate = +-1000 (Lichess convention) |
| Win-chance points | Lichess formula `50 + 50*(2/(1+exp(-0.00368208*cp))-1)`, 0-100 scale |
| Lichess labels | inaccuracy >= 5, mistake >= 10, blunder >= 15 win-chance points lost (lila: 0.1 / 0.2 / 0.3 on its -1..1 scale) |
| Thresholds | taught move flagged if it loses > 50 cp **or** > 5 points; marked opponent move is "not a mistake" if it loses < 40 cp; line end listed if the owner is <= -50 cp |
| Cloud | `https://lichess.org/api/cloud-eval?fen=...&multiPv=3`, falling back to `multiPv=1` when Lichess has no 3-line entry; one request every 3 s. User-Agent `ChessCoach-deep-check/1.0 (+https://github.com/abustrup/Chess-Project)` since 2026-10-16 (the first run used a browser-like one); a 404 is cached as "not stored" only after a position Lichess surely stores (1.d4) answered 200 in the same run, so a refused client cannot fill the cache with false 404s. Not yet tested against cloud-eval: Lichess answered 429 to this machine at about 15:41 and 15:45 UTC on 2026-10-16 |
| Cloud rate limit | on HTTP 429: wait 65 s, doubling up to 10 min, slow to one request per 3 s, and stop asking for the rest of the run after `--cloud-max-wait` seconds (default 2,700) of waiting. Positions not asked are asked on the next run |
| Cloud, move not in its lines | the cloud eval of the position after the move (best line, sign flipped); if that position is not stored, a lower bound from the third cloud line |

Stockfish with more than one thread is not deterministic, and near the 50 cp line depth matters:
on 2026-10-16 the loss of the same move moved by a median of 32 cp (largest 89 cp) between the
30M and 150M node searches. The summary therefore marks which flags hold at every depth and in
the cloud.

## Lesson from the first run (2026-10-16)

At one cloud request per second, Lichess answered HTTP 429 after about 1,500 requests (from
11:50 UTC) and was still refusing cloud-eval from this machine at 13:41 UTC, while other Lichess
endpoints answered normally. That left 500 of the 1,443 taught moves without a cloud lookup.
Hence the 3-second default and the give-up rule; a later re-run fills the gaps from the cache.

## Files written

- `results.json`: every check item with all local searches, the cloud result and the verdict,
  plus the exact `settings` (including how many searches were reused and how many were new).
- `summary.md`: plain-English summary with every flagged item.
- `flagged.json`: the flagged items only, in a compact form for other tools.
- `engine-cache.jsonl`, `cloud-cache.jsonl`: raw search and cloud records (re-run cache).
- `run.log`: progress log.
