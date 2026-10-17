# Builds the job's test fixture: his saved blitz export (31 games, opponents already "Opponent NN", 2026-10-10 to
# 2026-10-15) with the first N games in date order relabelled as rated 10+0 rapid games, so measure.py counts them.
# Only the time control changes (clock 600+0, speed and perf "rapid"); the embedded PGN, whose headers would still say
# blitz, is dropped. Moves, clocks, ratings, ids and Lichess's evals stay as they were.
# Usage, from the repo root:  .venv/bin/python -I scripts/measure/make_fixture.py N OUT.ndjson [--offset-days D]
#   --offset-days D moves every createdAt/lastMoveAt D days later (default 0)
import json, os, sys

SRC = 'research/2026-10-16-diagnosis/my-games/lichess_abustrup.ndjson'
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def relabel(g, offset_ms=0):
    h = json.loads(json.dumps(g))
    h['clock'] = {'initial': 600, 'increment': 0, 'totalTime': 600}
    h['speed'] = h['perf'] = 'rapid'
    h.pop('pgn', None)
    for k in ('createdAt', 'lastMoveAt'):
        if k in h:
            h[k] += offset_ms
    return h


def build(n, offset_days=0):
    games = sorted((json.loads(l) for l in open(os.path.join(ROOT, SRC), encoding='utf-8') if l.strip()),
                   key=lambda g: g['createdAt'])
    return [relabel(g, offset_days * 86400000) for g in games[:n]]


if __name__ == '__main__':
    args = sys.argv[1:]
    off = int(args[args.index('--offset-days') + 1]) if '--offset-days' in args else 0
    with open(args[1], 'w', encoding='utf-8') as f:
        for g in build(int(args[0]), off):
            f.write(json.dumps(g, separators=(',', ':'), ensure_ascii=False) + '\n')
