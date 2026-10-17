"""Verifier: independent 'course walk' and Kaplan-Meier depth for the three opening courses (2026-10-16).

Usage: .venv/bin/python -I v_walk.py SAMPLE.jsonl COURSE_PGN.json OUT.json [all|rapid] [MIN_NODE]

Written from scratch (does not reuse the investigation's code). Sample = v_sample.py output (byte ranges disjoint
from the investigation's). Position statistics are collected only for positions that occur in some course chapter
(the walk never asks about any other position), from the first 24 plies of every game, transpositions merged.

Walk (the 'opening explorer' method): on the owner's turn play the course's recommended move; on the opponent's turn
branch into every move 1000-1300 players made from that position, weighted by frequency. A move is 'in course' if a
chapter gives it at that position or the resulting position occurs in a chapter. Otherwise it is a gap and the line
ends. A position with fewer than MIN_NODE games ends the line as 'too rare' (low bound counts it as out, high as in).
Variant 'rescue': a gap that lands back on a course position after one own move continues (the investigation did this).

Kaplan-Meier (real games, London only here): at Black's k-th move the games 'at risk' are those where every move so
far was in course; a White move that is not a course move censors the game; an event is a Black move not in course.
"""
import sys, json, collections, math
from multiprocessing import Pool
import chess
sys.path.insert(0, __import__('os').path.dirname(__file__))
from v_courses import load_courses, key

sample_path, course_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
SPEEDS = sys.argv[4] if len(sys.argv) > 4 else 'all'
MIN_NODE = int(sys.argv[5]) if len(sys.argv) > 5 else 30
MAXPLY = 24
C = load_courses(course_path)
COURSE_POS = set()
for X in C.values(): COURSE_POS |= set(X['pos_in'].keys())
_b = chess.Board(); _b.push_san('d4'); _b.push_san('c6'); COURSE_POS.add(key(_b))  # root of his 1.d4 c6 move order

def load_games():
    gs = []
    with open(sample_path) as f:
        for ln in f:
            r = json.loads(ln)
            if SPEEDS == 'rapid' and r['sp'] != 'rapid': continue
            gs.append((r['mv'][:MAXPLY], r['r']))
    return gs

def worker(chunk):
    st = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0]))
    for mv, res in chunk:
        pts = 2 if res == '1-0' else 1 if res == '1/2-1/2' else 0
        b = chess.Board()
        for san in mv:
            kb = key(b)
            try:
                m = b.parse_san(san)
            except ValueError:
                break
            if kb in COURSE_POS:
                s = st[kb][b.san(m)]; s[0] += 1; s[1] += pts
            b.push(m)
    return {k: dict(v) for k, v in st.items()}

def build_stats(games):
    chunks = [games[i::2] for i in range(2)]
    with Pool(2) as p:
        parts = p.map(worker, chunks)
    st = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0]))
    for part in parts:
        for k, d in part.items():
            for san, (n, pts) in d.items():
                s = st[k][san]; s[0] += n; s[1] += pts
    return st

def slav_structure(b):
    return (b.piece_at(chess.C4) == chess.Piece(chess.PAWN, chess.WHITE) and b.piece_at(chess.D4) == chess.Piece(chess.PAWN, chess.WHITE)
            and b.piece_at(chess.C6) == chess.Piece(chess.PAWN, chess.BLACK) and b.piece_at(chess.D5) == chess.Piece(chess.PAWN, chess.BLACK))

def walk(X, ST, roots, rescue):
    own = X['own']
    ends = []                      # (mass, last_ply_in_course, reason)
    dec_mass = collections.defaultdict(float)
    slav = [0.0]
    gaps = []
    def in_course(b, kb, san):
        if san in X['pos_moves'].get(kb, ()): return True
        b2 = b.copy(stack=False); b2.push_san(san)
        return key(b2) in X['pos_in']
    def rec(b, p, seq, slav_seen):
        ply = len(b.move_stack)
        if not slav_seen and slav_structure(b): slav[0] += p; slav_seen = True
        if ply >= MAXPLY: ends.append((p, ply, 'reached ply 24')); return
        if p < 1e-7: ends.append((p, ply, 'pruned')); return
        kb = key(b)
        if b.turn == own:
            mv = X['choice'].get(kb)
            if mv is None: ends.append((p, ply, 'course runs out')); return
            dec_mass[kb] += p
            b.push_san(mv); rec(b, p, seq + [mv], slav_seen); b.pop(); return
        moves = ST.get(kb, {})
        tot = sum(v[0] for v in moves.values())
        if tot < MIN_NODE: ends.append((p, ply, 'too rare')); return
        for san, (n, pts) in sorted(moves.items(), key=lambda kv: -kv[1][0]):
            q = p * n / tot
            if in_course(b, kb, san):
                b.push_san(san); rec(b, q, seq + [san], slav_seen); b.pop(); continue
            b.push_san(san)
            resc = None
            if rescue:
                for m2 in b.legal_moves:
                    b.push(m2); hit = key(b) in X['pos_in']; b.pop()
                    if hit: resc = m2; break
            if resc is not None:
                s2 = b.san(resc); b.push(resc); rec(b, q, seq + [san, s2], slav_seen); b.pop()
            else:
                gaps.append({'line': ' '.join(seq + [san]), 'mass': q, 'n_move': n, 'n_pos': tot,
                             'mover_score': round((pts / 2 / n) if own == chess.WHITE else 1 - pts / 2 / n, 3)})
                ends.append((q, ply, 'gap'))
            b.pop()
    b = chess.Board()
    for s in roots: b.push_san(s)
    rec(b, 1.0, list(roots), False)
    return ends, dec_mass, slav[0], gaps

def survival(ends, plies):
    out = {}
    for k in plies:
        lo = sum(p for p, lp, r in ends if lp >= k)
        hi = lo + sum(p for p, lp, r in ends if lp < k and r == 'too rare')
        out[k] = (round(lo, 4), round(hi, 4))
    return out

def km_london(games, X):
    """Kaplan-Meier over real games for the London (White) course."""
    at_risk = collections.Counter(); events = collections.Counter(); censored = collections.Counter()
    for mv, res in games:
        if not mv or mv[0] != 'd4': continue
        b = chess.Board()
        alive = True
        for i, san in enumerate(mv[:MAXPLY]):
            kb = key(b)
            try: m = b.parse_san(san)
            except ValueError: break
            s = b.san(m)
            b2 = b.copy(stack=False); b2.push(m)
            inc = s in X['pos_moves'].get(kb, ()) or key(b2) in X['pos_in']
            if b.turn == chess.WHITE:
                if not inc: censored[i // 2 + 1] += 1; alive = False; break
            else:
                k = i // 2 + 1
                at_risk[k] += 1
                if not inc: events[k] += 1; alive = False; break
            b.push(m)
    S = 1.0; table = []
    for k in range(1, 9):
        if at_risk[k] == 0: break
        S *= 1 - events[k] / at_risk[k]
        table.append({'black_move': k, 'at_risk': at_risk[k], 'left': events[k], 'S': round(S, 4)})
    return table

if __name__ == '__main__':
    games = load_games()
    print('games', len(games), flush=True)
    ST = build_stats(games)
    print('positions with stats', len(ST), flush=True)
    roots = {'london': [], 'caro-kann': ['e4'], 'slav': ['d4']}
    result = {'speeds': SPEEDS, 'games': len(games), 'min_node': MIN_NODE, 'courses': {}}
    # extra pseudo-course: his move order 1.d4 c6, Slav + Caro-Kann chapters merged
    import copy
    M = copy.deepcopy(C['slav'])
    for kname in ('pos_moves', 'pos_in'):
        for kb, v in C['caro-kann'][kname].items(): M[kname][kb] |= v
    for kb, mv in C['caro-kann']['choice'].items(): M['choice'].setdefault(kb, mv)
    courses = dict(C); courses['d4-c6'] = M; roots['d4-c6'] = ['d4', 'c6']
    for cid in ('london', 'caro-kann', 'slav', 'd4-c6'):
        X = courses[cid]
        r = {}
        for rescue in (False, True):
            ends, dm, slav, gaps = walk(X, ST, roots[cid], rescue)
            tag = 'with_rescue' if rescue else 'strict'
            own_first = 2 if cid == 'london' else (2 if cid != 'd4-c6' else 3)
            # opponent's N-th move -> ply: London (Black moves) 2N; Black courses (White moves) 2N-1
            opp_ply = {n: (2 * n if cid == 'london' else 2 * n - 1) for n in range(1, 9)}
            surv = survival(ends, opp_ply.values())
            nd = len(X['choice']) if cid != 'd4-c6' else None
            r[tag] = {'still_in_course_after_opponent_move_N_low_high': {n: surv[pl] for n, pl in opp_ply.items()},
                      'decisions_total_unique_positions': nd,
                      'decisions_used_ge_1_in_100': sum(1 for m in dm.values() if m >= 0.01),
                      'decisions_used_ge_1_in_200': sum(1 for m in dm.values() if m >= 0.005),
                      'decisions_used_ge_1_in_500': sum(1 for m in dm.values() if m >= 0.002),
                      'slav_structure_mass': round(slav, 4),
                      'end_reasons': {k: round(sum(p for p, _, rr in ends if rr == k), 4) for k in ('gap', 'too rare', 'course runs out', 'reached ply 24', 'pruned')},
                      'top_gaps': [dict(g, mass=round(g['mass'], 4)) for g in sorted(gaps, key=lambda g: -g['mass'])[:15]]}
        if cid == 'london': r['kaplan_meier_real_games'] = km_london(games, X)
        result['courses'][cid] = r
        print(cid, json.dumps({k: (v['still_in_course_after_opponent_move_N_low_high'], v['decisions_used_ge_1_in_200'], v['slav_structure_mass'], v['end_reasons']) for k, v in r.items() if k in ('strict', 'with_rescue')}), flush=True)
        if cid == 'london': print('KM', r['kaplan_meier_real_games'], flush=True)
    json.dump(result, open(out_path, 'w'), indent=1)
