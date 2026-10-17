"""Which set-ups do 1000-1300 White players choose against 1...d5 and against 1...c6, and how often is it a real Slav?

Usage: .venv/bin/python -I systems.py OUT.json IN1.jsonl [IN2.jsonl ...]
Counts games (blitz + rapid, and rapid alone; both players 1000-1300; Sept 2026 sample).
'Real Slav' = at some point by ply 8 (Black's 4th move) the board has White pawns c4+d4 and Black pawns c6+d5.
"""
import sys, json, collections, math
import chess

out_path, ins = sys.argv[1], sys.argv[2:]
PTS = {'1-0': 1.0, '0-1': 0.0, '1/2-1/2': 0.5}
seen = set(); games = []
for p in ins:
    for line in open(p):
        g = json.loads(line)
        if g['sp'] not in ('blitz', 'rapid') or g['res'] not in PTS: continue
        k = (g['t'], g['w'], g['b'], tuple(g['mv'][:12]))
        if k in seen: continue
        seen.add(k); games.append(g)

def classify_d4_d5(mv):
    w = [mv[i] for i in range(0, min(len(mv), 8), 2)]  # White moves 1-4
    w3 = w[1:3]  # White moves 2 and 3
    if 'c4' in w3: return "Queen's Gambit family: c4 by move 3"
    if w[1:2] == ['e4']: return 'Blackmar-Diemer / 2.e4 gambit'
    if 'Bf4' in w3 and 'Nc3' in w3: return 'Jobava London: Nc3 + Bf4 by move 3'
    if 'Bf4' in w3: return 'London: Bf4 by move 3'
    if 'Bg5' in w3: return 'Bg5 systems (Levitsky / Torre / Veresov)'
    if 'Nc3' in w3: return 'Nc3 systems (Veresov-type without Bg5, Jobava without Bf4)'
    if 'e3' in w3: return 'Colle / Stonewall type: e3 by move 3'
    if 'Nf3' in w3: return '2.Nf3 / 3.Nf3 other (g3, Bf4 later, etc.)'
    return 'other'

def slav_by(mv, maxply=8):
    b = chess.Board()
    P = lambda sq, col: b.piece_at(sq) == chess.Piece(chess.PAWN, col)
    for i, san in enumerate(mv[:maxply]):
        try: b.push_san(san)
        except ValueError: return False
        if P(chess.C4, chess.WHITE) and P(chess.D4, chess.WHITE) and P(chess.C6, chess.BLACK) and P(chess.D5, chess.BLACK): return True
    return False

def tab(G, key, black_pov=True):
    c = collections.defaultdict(lambda: [0, 0.0])
    for g in G:
        k = key(g); c[k][0] += 1; c[k][1] += (1 - PTS[g['res']]) if black_pov else PTS[g['res']]
    n = len(G)
    return {'n': n, 'rows': [{'name': k, 'games': v[0], 'share': round(v[0] / n, 4), 'score_black' if black_pov else 'score_white': round(v[1] / v[0], 3)}
                             for k, v in sorted(c.items(), key=lambda kv: -kv[1][0])]}

R = {}
for label, G0 in [('blitz+rapid', games), ('rapid only', [g for g in games if g['sp'] == 'rapid']), ('rapid 10+0 only', [g for g in games if g['tc'] == '600+0'])]:
    r = {'games': len(G0)}
    fm = collections.Counter(g['mv'][0] for g in G0 if g['mv'])
    r['first_move_share'] = {k: round(v / len(G0), 4) for k, v in fm.most_common(8)}
    d4 = [g for g in G0 if g['mv'][:1] == ['d4']]
    r['after_1d4_black_replies'] = {k: round(v / len(d4), 4) for k, v in collections.Counter(g['mv'][1] for g in d4 if len(g['mv']) > 1).most_common(10)}
    d4d5 = [g for g in d4 if g['mv'][1:2] == ['d5'] and len(g['mv']) >= 8]
    r['after_1d4_d5_white_systems'] = tab(d4d5, lambda g: classify_d4_d5(g['mv']))
    # Slav-minded Black: ...c6 among Black's moves 2-3
    slavish = [g for g in d4d5 if 'c6' in g['mv'][3:6:2]]
    r['after_1d4_d5_with_black_c6_by_move3_white_systems'] = tab(slavish, lambda g: classify_d4_d5(g['mv']))
    r['real_slav_structure_by_ply8_among_1d4_d5_games_where_black_plays_c6_by_move3'] = round(sum(slav_by(g['mv']) for g in slavish) / max(1, len(slavish)), 4)
    r['real_slav_structure_by_ply8_among_all_1d4_d5_games'] = round(sum(slav_by(g['mv']) for g in d4d5) / max(1, len(d4d5)), 4)
    # How often White plays c4 by move 3 after 1.d4 d5, whatever Black does: upper bound for a Slav if Black always answers c4 with ...c6
    r['white_c4_by_move3_after_1d4_d5'] = round(sum(1 for g in d4d5 if 'c4' in g['mv'][2:5:2]) / max(1, len(d4d5)), 4)
    e4 = [g for g in G0 if g['mv'][:1] == ['e4']]
    e4c6 = [g for g in e4 if g['mv'][1:2] == ['c6'] and len(g['mv']) >= 4]
    r['after_1e4_share_c6'] = round(len(e4c6) / max(1, len(e4)), 4)
    r['after_1e4_c6_white_move2'] = tab(e4c6, lambda g: g['mv'][2])
    ck = [g for g in e4c6 if g['mv'][2:4] == ['d4', 'd5'] and len(g['mv']) >= 5]
    r['after_1e4_c6_2d4_d5_white_move3'] = tab(ck, lambda g: g['mv'][4])
    r['after_1e4_c6_reaching_2d4_d5_share'] = round(sum(1 for g in e4c6 if g['mv'][2:4] == ['d4', 'd5']) / max(1, len(e4c6)), 4)
    r['after_1e4_c6_black_move2'] = {k: round(v / len(e4c6), 4) for k, v in collections.Counter(g['mv'][3] for g in e4c6).most_common(6)}
    R[label] = r
    print('==', label, len(G0), 'first moves', r['first_move_share'])
    print('  1.d4 replies', r['after_1d4_black_replies'])
    print('  1.d4 d5 systems (n=%d):' % len(d4d5), [(x['name'][:30], x['share'], x['score_black']) for x in r['after_1d4_d5_white_systems']['rows']])
    print('  slavish n=%d real slav %.3f; all d4d5 real slav %.3f; c4 by move3 %.3f' % (len(slavish), r['real_slav_structure_by_ply8_among_1d4_d5_games_where_black_plays_c6_by_move3'], r['real_slav_structure_by_ply8_among_all_1d4_d5_games'], r['white_c4_by_move3_after_1d4_d5']))
    print('  1.e4 c6 share %.3f; move2:' % r['after_1e4_share_c6'], [(x['name'], x['share'], x['score_black']) for x in r['after_1e4_c6_white_move2']['rows'][:10]])
    print('  1.e4 c6 2.d4 d5 move3:', [(x['name'], x['share'], x['score_black']) for x in r['after_1e4_c6_2d4_d5_white_move3']['rows'][:8]], 'reach 2.d4 d5', r['after_1e4_c6_reaching_2d4_d5_share'])
json.dump(R, open(out_path, 'w'), indent=1)
