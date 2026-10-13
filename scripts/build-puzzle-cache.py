#!/usr/bin/env python3
"""Stream the Lichess puzzle database (CC0) and keep a well-filtered, rating-balanced subset.

Input : scripts/.cache/lichess_db_puzzle.csv.zst   (download: https://database.lichess.org/lichess_db_puzzle.csv.zst)
Output: scripts/.cache/puzzles.jsonl               one puzzle per line (id, fen, moves[], rating, themes[], opening, popularity, plays)

Filters: reliable rating (deviation <= 90), popular (>= 85% likes), played at least 400 times.
Balance: for each wanted theme and each 100-point rating band keep the PER_BAND best (popularity x plays).
Also keeps puzzles from the user's openings (London System, Caro-Kann, Slav / Semi-Slav).
"""
import csv, io, json, sys, collections, heapq
import zstandard

SRC = 'scripts/.cache/lichess_db_puzzle.csv.zst'
OUT = 'scripts/.cache/puzzles.jsonl'
PER_BAND = 70            # per theme per 100-rating band
PER_OPENING_BAND = 40    # per opening per 200-rating band
MIN_R, MAX_R = 400, 2200

THEMES = [
    'fork', 'discoveredAttack', 'pin', 'skewer', 'backRankMate', 'capturingDefender', 'deflection',
    'trappedPiece', 'attraction', 'doubleCheck', 'hangingPiece', 'intermezzo', 'xRayAttack', 'clearance',
    'interference', 'sacrifice', 'quietMove', 'mateIn1', 'mateIn2', 'mateIn3', 'smotheredMate', 'arabianMate',
    'anastasiaMate', 'bodenMate', 'hookMate', 'doubleBishopMate', 'attackingF2F7', 'exposedKing', 'kingsideAttack',
    'queensideAttack', 'advancedPawn', 'promotion', 'defensiveMove', 'zugzwang', 'endgame', 'rookEndgame',
    'pawnEndgame', 'knightEndgame', 'bishopEndgame', 'queenEndgame', 'opening', 'middlegame', 'crushing', 'advantage', 'equality',
]
THEME_SET = set(THEMES)
OPENING_KEYS = {
    'london': ('London_System',),
    'caro-kann': ('Caro-Kann_Defense',),
    'slav': ('Slav_Defense', 'Semi-Slav_Defense'),
}

theme_heaps = collections.defaultdict(list)   # (theme, band) -> heap of (score, n, row)
open_heaps = collections.defaultdict(list)    # (opening, band) -> heap
n = 0
dctx = zstandard.ZstdDecompressor()
with open(SRC, 'rb') as fh:
    reader = io.TextIOWrapper(dctx.stream_reader(fh), encoding='utf-8', newline='')
    rd = csv.DictReader(reader)
    for row in rd:
        try:
            rating = int(row['Rating']); dev = int(row['RatingDeviation']); pop = int(row['Popularity']); plays = int(row['NbPlays'])
        except Exception:
            continue
        if rating < MIN_R or rating > MAX_R or dev > 90 or pop < 85 or plays < 400:
            continue
        themes = row['Themes'].split()
        tags = (row.get('OpeningTags') or '').split()
        score = pop * 10 + min(plays, 100000) / 1000.0
        n += 1
        rec = None
        for t in themes:
            if t in THEME_SET:
                key = (t, rating // 100)
                h = theme_heaps[key]
                if len(h) < PER_BAND or score > h[0][0]:
                    if rec is None:
                        rec = {'id': row['PuzzleId'], 'fen': row['FEN'], 'moves': row['Moves'].split(), 'rating': rating,
                               'themes': themes, 'opening': tags[-1] if tags else None, 'popularity': pop, 'plays': plays}
                    item = (score, n, rec)
                    if len(h) < PER_BAND: heapq.heappush(h, item)
                    else: heapq.heapreplace(h, item)
        for name, keys in OPENING_KEYS.items():
            if any(any(k in tag for k in keys) for tag in tags):
                key = (name, rating // 200)
                h = open_heaps[key]
                if len(h) < PER_OPENING_BAND or score > h[0][0]:
                    rec2 = {'id': row['PuzzleId'], 'fen': row['FEN'], 'moves': row['Moves'].split(), 'rating': rating,
                            'themes': themes, 'opening': tags[-1] if tags else None, 'popularity': pop, 'plays': plays, 'course': name}
                    item = (score, n, rec2)
                    if len(h) < PER_OPENING_BAND: heapq.heappush(h, item)
                    else: heapq.heapreplace(h, item)

seen = set(); count = 0
with open(OUT, 'w') as out:
    for heaps, tag in ((theme_heaps, 'theme'), (open_heaps, 'course')):
        for (name, band), h in sorted(heaps.items()):
            for score, _, rec in sorted(h, key=lambda x: -x[0]):
                k = (name, rec['id'])
                if k in seen: continue
                seen.add(k)
                out.write(json.dumps({**rec, 'bucket': name, 'kind': tag}, separators=(',', ':')) + '\n'); count += 1
print(f'scanned {n} eligible puzzles; wrote {count} rows to {OUT}', file=sys.stderr)
