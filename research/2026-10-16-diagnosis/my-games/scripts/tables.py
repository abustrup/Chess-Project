# Prints the markdown tables used in summary.md from games.json, moves.jsonl and stats.json.
# Usage: .venv/bin/python -I scripts/tables.py OUTDIR
import sys, os, json, collections
d = sys.argv[1]
G = json.load(open(os.path.join(d, 'games.json')))
M = [json.loads(l) for l in open(os.path.join(d, 'moves.jsonl'))]
S = json.load(open(os.path.join(d, 'stats.json')))
bl = collections.defaultdict(int); mv = collections.defaultdict(int); lbl = collections.defaultdict(int)
for m in M:
    mv[m['game_id']] += 1; bl[m['game_id']] += m['judgment'] == 'Blunder'; lbl[m['game_id']] += m['lichess_judgment'] == 'Blunder'
print('| # | game | colour | time | his rating | opp | result | first moves | course: left at (who) | win% at move 12 | his blunders / moves | Lichess blunders |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|')
for i, g in enumerate(G, 1):
    lc = g['left_course']
    if lc:
        tb = f", back at ply {lc['transposed_back_at_ply']}" if lc.get('transposed_back_at_ply') else ''
        left = f"{g['course']}: ply {lc['ply']} ({lc['who']}{tb})"
    else:
        left = 'no course for this'
    print(f"| {i} | [{g['id']}](https://lichess.org/{g['id']}) | {g['color']} | {g['tc']} | {g['my_rating']} | {g['opp_rating']} | {g['result']} ({g['status']}) | {g['first_moves']} | {left} | "
          f"{g['my_wp_at_move12'] if g['my_wp_at_move12'] is not None else '-'} | {bl[g['id']]} / {mv[g['id']]} | {lbl[g['id']] if g['lichess_analysed'] else '-'} |")
print()
print('| category | blunders | of which big (>=30 win% drop) | in moves 1-12 |')
print('|---|---|---|---|')
B = [m for m in M if m['judgment'] == 'Blunder']
for cat, n in collections.Counter(m['category'] for m in B).most_common():
    print(f"| {cat} | {n} | {sum(1 for m in B if m['category'] == cat and m['win_pct_drop'] >= 30)} | {sum(1 for m in B if m['category'] == cat and m['first_12_moves'])} |")
