"""Turn engine_check.json into the summary paragraph of PROPOSAL.md (prints markdown)."""
import json, sys
E = json.load(open(sys.argv[1])); C = json.load(open(sys.argv[2]))
shortest = {}
for cid, r in C['courses'].items():
    for d in r['own_decisions_used_1_in_500_games']: shortest[(cid, d['fen'])] = d['line']
print(f"Depth {E['depth']}, {E['engine']}. Losses are in hundredths of a pawn, from his side.\n")
print('| Course | Positions checked | Course move = engine first choice | Within 0.25 pawn | 0.25-0.50 | Over 0.50 |')
print('|---|---|---|---|---|---|')
for cid, rows in E['decisions'].items():
    n = len(rows); top = sum(1 for r in rows if r['cp_loss'] <= 0); a = sum(1 for r in rows if r['cp_loss'] <= 25)
    b = sum(1 for r in rows if 25 < r['cp_loss'] <= 50); c = sum(1 for r in rows if r['cp_loss'] > 50)
    print(f'| {cid} | {n} | {top} | {a} | {b} | {c} |')
print('\nLargest differences (course move vs Stockfish first choice), with what 1000-1300 players score with each:\n')
for cid, rows in E['decisions'].items():
    for r in sorted(rows, key=lambda r: -r['cp_loss'])[:4]:
        if r['cp_loss'] < 20: continue
        hum = {m['san']: m for m in r['what_1000_1300_players_play_here']}
        best = r['engine_top3'][0][0]
        def h(sn):
            m = hum.get(sn); return f"{round(100*m['score_me'])}% (n={m['n']})" if m else 'not among the 5 most played'
        line = shortest.get((cid, r['fen']), r['line'])
        print(f"- {cid}, after {line or 'the start'}: course {r['course_move']} vs engine {best}, {r['cp_loss']} worse, used in {100*r['mass']:.1f}% of games. Human score: course move {h(r['course_move'])}, engine move {h(best)}.")
print('\nEngine first choice at each gap (1 in 100 games or more):\n')
for cid, rows in E['gaps'].items():
    for g in rows:
        t = g['engine_top3']
        print(f"- {cid}, {g['line']} ({100*g['mass']:.1f}%): " + ', '.join(f"{m} ({v:+d})" for m, v, _ in t))
