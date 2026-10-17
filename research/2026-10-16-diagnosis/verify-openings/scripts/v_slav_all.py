"""Verifier: share of ALL his Black games likely to reach a real Slav pawn structure (W c4+d4 vs B c6+d5) by ply 24,
if he answers every first move with ...c6 (as he does), 2026-10-16.
Estimate = sum over White's first move f of P(f in all 1000-1300 games) x P(structure by ply 24 | 1.f c6) from real games
where Black did play 1...c6 after that first move. Usage: .venv/bin/python -I v_slav_all.py SAMPLE.jsonl [all|rapid]"""
import sys, json, collections, chess
G = [json.loads(l) for l in open(sys.argv[1])]
if len(sys.argv) > 2 and sys.argv[2] == 'rapid': G = [g for g in G if g['sp'] == 'rapid']
first = collections.Counter(g['mv'][0] for g in G if g['mv'])
N = sum(first.values())
def slav(b):
    P = lambda sq, c: b.piece_at(sq) == chess.Piece(chess.PAWN, c)
    return P(chess.C4, True) and P(chess.D4, True) and P(chess.C6, False) and P(chess.D5, False)
hit = collections.Counter(); tot = collections.Counter()
for g in G:
    if len(g['mv']) < 2 or g['mv'][1] != 'c6': continue
    f = g['mv'][0]; tot[f] += 1
    b = chess.Board()
    for san in g['mv'][:24]:
        try: b.push_san(san)
        except ValueError: break
        if slav(b): hit[f] += 1; break
est = 0.0; rows = []
for f, n in first.most_common(12):
    p = hit[f] / tot[f] if tot[f] else 0.0
    est += n / N * p
    rows.append((f, round(n / N, 4), tot[f], round(p, 3)))
print('first move, share of all games, games with 1...c6, P(Slav structure by ply 24)')
for r in rows: print(r)
print('estimated share of all his Black games reaching a Slav structure:', round(est, 4))
