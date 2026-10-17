# The study's measurement record

Written by the daily measuring job (`.github/workflows/measure.yml`, code in `scripts/measure/`). Nobody edits these
files by hand: the job checks that every saved row still comes out the same and stops if one does not.

| File | What it holds | How it changes |
|---|---|---|
| `export.ndjson` | Alexander's rated Lichess games since 2026-10-16 (rapid, blitz, classical), one per line, with moves, clocks, ratings and game ids. Opponents are "Opponent 01", "Opponent 02" and so on; their usernames are never saved. | new games are added at the end |
| `games.csv` | One row per counted game (rated 10+0), exactly as the pre-registered `measure.py` writes it: his moves, his blunders by Lichess's rule, the threat test, his opponents' blunders, ratings. Numbered 1, 2, 3 ... in the order played. | new rows are added at the end; an earlier row never changes |
| `evals.jsonl` | Stockfish 19's evaluation of every position of every counted game (250,000 nodes, the pre-registered setting), so a game is searched once. | new games are added at the end |
| `runs.csv` | One heartbeat row per run: when, how many games, the instrument check, notes. | one row per run |
| `interim-look-N.json`, `.txt` | Only if the check after game 110 does not decide: that check's full report (rates, drop, range). Kept here, not on the website; its SHA-256 is in `public/data/study/status.json` (`interimChecks`). Nobody tells Alexander these numbers before the verdict. | written once, at that check |

The verdict at games 110 and 160 does not use these rows: the job recounts every game from scratch then and lists
any difference (`public/data/study/verdict.json`). The `engine` column in games.csv says which engine searched the
game, or `cached` when the row was read from `evals.jsonl`.

Re-deriving games.csv from these files (from the repo root):

```
cp data/measure/evals.jsonl <scratch>/evals.jsonl      # measure.py adds to its cache file, so give it a copy
.venv/bin/python -I research/2026-10-16-diagnosis/prereg/measure.py --input data/measure/export.ndjson \
    --cache <scratch>/evals.jsonl --out <scratch>/games.csv
```
