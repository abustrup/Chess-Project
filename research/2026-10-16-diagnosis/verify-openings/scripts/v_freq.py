"""Verifier: opening frequencies by exact move sequence in real games (no position merging), 2026-10-16.

Usage: .venv/bin/python -I v_freq.py SAMPLE.jsonl OUT.json
Covers: share of 1.d4, share of 1...e5 after 1.d4, the Englund 4.Bf4 line, Caro-Kann 2nd moves and the
2.Bc4 ... 4.Bb3 line, and how often a real Slav pawn structure (W c4+d4, B c6+d5) appears in real games.
Scores are White's score (win 1, draw 0.5) with a Wilson 95% interval.
"""
import sys, json, math, collections
import chess

sample, out = sys.argv[1], sys.argv[2]
G = [json.loads(l) for l in open(sample)]

def wilson(k, n, z=1.96):
    if n == 0: return None
    p = k / n; d = 1 + z * z / n; c = (p + z * z / (2 * n)) / d; e = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return [round(c - e, 3), round(c + e, 3)]

def wpts(r): return 1.0 if r == '1-0' else 0.5 if r == '1/2-1/2' else 0.0

def subset(f): return [g for g in G if f(g)]

def prefix(g, seq): return g['mv'][:len(seq)] == seq

def next_dist(games, seq, top=10):
    gs = [g for g in games if prefix(g, seq) and len(g['mv']) > len(seq)]
    c = collections.Counter(g['mv'][len(seq)] for g in gs)
    n = len(gs)
    out = []
    for san, k in c.most_common(top):
        sc = sum(wpts(g['r']) for g in gs if g['mv'][len(seq)] == san)
        out.append({'move': san, 'n': k, 'share': round(k / n, 4), 'white_score': round(sc / k, 3), 'white_score_ci95': wilson(sc, k)})
    return {'after': ' '.join(seq), 'n': n, 'next': out}

R = {'games': len(G), 'by_speed': dict(collections.Counter(g['sp'] for g in G)), 'tc_600+0': sum(1 for g in G if g['tc'] == '600+0')}
for label, games in (('all', G), ('rapid', subset(lambda g: g['sp'] == 'rapid')), ('10+0', subset(lambda g: g['tc'] == '600+0'))):
    r = {}
    first = collections.Counter(g['mv'][0] for g in games if g['mv'])
    nn = sum(first.values())
    r['n_games_with_moves'] = nn
    r['first_move_shares'] = {k: round(v / nn, 4) for k, v in first.most_common(8)}
    r['after_1d4'] = next_dist(games, ['d4'], 12)
    r['englund_after_1d4_e5_2dxe5_Nc6_3Nf3_Qe7'] = next_dist(games, ['d4', 'e5', 'dxe5', 'Nc6', 'Nf3', 'Qe7'], 6)
    r['englund_after_1d4_e5_2dxe5_Nc6_3Nf3'] = next_dist(games, ['d4', 'e5', 'dxe5', 'Nc6', 'Nf3'], 6)
    r['caro_after_1e4_c6'] = next_dist(games, ['e4', 'c6'], 10)
    r['caro_after_1e4_c6_2Bc4'] = next_dist(games, ['e4', 'c6', 'Bc4'], 5)
    r['caro_after_1e4_c6_2Bc4_d5'] = next_dist(games, ['e4', 'c6', 'Bc4', 'd5'], 5)
    r['caro_after_1e4_c6_2Bc4_d5_3exd5_cxd5'] = next_dist(games, ['e4', 'c6', 'Bc4', 'd5', 'exd5', 'cxd5'], 6)
    # chain: share of 1.e4 c6 games reaching 4.Bb3 if Black always plays 2...d5 and 3...cxd5 (product of White's choices)
    a = r['caro_after_1e4_c6']; b_ = r['caro_after_1e4_c6_2Bc4_d5']; c_ = r['caro_after_1e4_c6_2Bc4_d5_3exd5_cxd5']
    pa = next((x['share'] for x in a['next'] if x['move'] == 'Bc4'), 0)
    pb = next((x['share'] for x in b_['next'] if x['move'] == 'exd5'), 0)
    pc = next((x['share'] for x in c_['next'] if x['move'] == 'Bb3'), 0)
    r['caro_Bc4_Bb3_chain_share_of_1e4c6_games'] = round(pa * pb * pc, 4)
    r['after_1d4_d5'] = next_dist(games, ['d4', 'd5'], 10)
    r['after_1d4_c6'] = next_dist(games, ['d4', 'c6'], 10)
    r['after_1d4_d5_2Bf4'] = next_dist(games, ['d4', 'd5', 'Bf4'], 10)
    results_by = {}
    # Slav-structure opportunity in real games
    for start in (['d4', 'd5'], ['d4', 'c6']):
        gs = [g for g in games if prefix(g, start)]
        reach = {8: 0, 12: 0, 16: 0, 24: 0}; c4_opp = {12: 0, 16: 0, 24: 0}; black_c6 = 0; black_c6_reach = 0
        for g in gs:
            b = chess.Board(); hit = None; opp = None; played_c6 = False
            for i, san in enumerate(g['mv'][:24]):
                try: m = b.parse_san(san)
                except ValueError: break
                if b.turn == chess.WHITE and m.from_square == chess.C2 and m.to_square == chess.C4 and b.piece_type_at(chess.C2) == chess.PAWN \
                        and b.piece_at(chess.D4) == chess.Piece(chess.PAWN, chess.WHITE) and b.piece_at(chess.D5) == chess.Piece(chess.PAWN, chess.BLACK) and opp is None:
                    opp = i + 1
                if b.turn == chess.BLACK and m.from_square == chess.C7 and m.to_square == chess.C6 and b.piece_type_at(chess.C7) == chess.PAWN and i < 12: played_c6 = True
                b.push(m)
                if hit is None and b.piece_at(chess.C4) == chess.Piece(chess.PAWN, chess.WHITE) and b.piece_at(chess.D4) == chess.Piece(chess.PAWN, chess.WHITE) \
                        and b.piece_at(chess.C6) == chess.Piece(chess.PAWN, chess.BLACK) and b.piece_at(chess.D5) == chess.Piece(chess.PAWN, chess.BLACK):
                    hit = i + 1
            for k in reach:
                if hit is not None and hit <= k: reach[k] += 1
            for k in c4_opp:
                if opp is not None and opp <= k: c4_opp[k] += 1
            if played_c6:
                black_c6 += 1
                if hit is not None and hit <= 24: black_c6_reach += 1
        n = len(gs)
        results_by[' '.join(start)] = {'games': n,
            'slav_structure_on_board_by_ply': {k: round(v / n, 4) for k, v in reach.items()},
            'white_plays_c4_while_d4_d5_stand_by_ply': {k: round(v / n, 4) for k, v in c4_opp.items()},
            'games_where_black_played_c6_by_move_6': black_c6,
            'of_those_slav_structure_by_ply24': round(black_c6_reach / black_c6, 4) if black_c6 else None}
    r['slav_real_games'] = results_by
    R[label] = r
    print(label, 'games', nn, '1.d4 share', r['first_move_shares'].get('d4'), 'after 1.d4:', [(x['move'], x['n'], x['share']) for x in r['after_1d4']['next'][:5]], flush=True)
    print('  englund 4th:', [(x['move'], x['n'], x['share'], x['white_score'], x['white_score_ci95']) for x in r['englund_after_1d4_e5_2dxe5_Nc6_3Nf3_Qe7']['next']], 'n', r['englund_after_1d4_e5_2dxe5_Nc6_3Nf3_Qe7']['n'])
    print('  caro 2nd:', [(x['move'], x['n'], x['share']) for x in r['caro_after_1e4_c6']['next'][:5]], 'n', r['caro_after_1e4_c6']['n'])
    print('  Bc4 chain', pa, pb, pc, '->', r['caro_Bc4_Bb3_chain_share_of_1e4c6_games'], '4.Bb3 n', next((x['n'] for x in c_['next'] if x['move'] == 'Bb3'), 0), 'pos n', c_['n'])
    print('  slav real', json.dumps(results_by))
json.dump(R, open(out, 'w'), indent=1)
