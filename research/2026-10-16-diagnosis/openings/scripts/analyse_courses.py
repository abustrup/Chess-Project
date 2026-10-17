"""How far do 1000-1300 opponents follow the app's opening courses, and where do they leave them?

Usage: .venv/bin/python -I analyse_courses.py POSITIONS.pkl COURSES.json OUTDIR [all|rapid|blitz]

Method ("course walk", like an opening explorer):
  - start from the course's first position (London: start; Caro-Kann: after 1.e4; Slav: after 1.d4);
  - on the owner's turn play the course's move (the first-listed move in the chapter PGN; where chapters
    disagree, the move most chapters list first, ties to the earlier chapter);
  - on the opponent's turn branch into every move 1000-1300 players made from that exact position in the
    database sample (transpositions merged), weighted by how often they made it;
  - an opponent move the course does not list, and that does not transpose into a course position, is a
    'gap' (no prepared answer); a position seen in fewer than MIN_NODE sample games is 'too rare to say';
    a line where the course has no next move for the owner before move 12 'runs out';
    a line still inside the course after Black's 12th move 'reached move 12'.
Masses are shares of the owner's games with that colour and that first move (London: all White games;
Caro-Kann: Black games after 1.e4; Slav: Black games after 1.d4).
"""
import sys, os, json, pickle, math, collections
import chess, chess.polyglot

stats_path, courses_path, outdir = sys.argv[1:4]
SPEEDS = sys.argv[4] if len(sys.argv) > 4 else 'all'
MAXPLY = 24
MIN_NODE = int(sys.argv[5]) if len(sys.argv) > 5 else 30
PRUNE = 1e-6
TREE_MIN_REACH = 0.002
D = pickle.load(open(stats_path, 'rb'))
ST = D['stats']
zh = chess.polyglot.zobrist_hash
os.makedirs(outdir, exist_ok=True)

def moves_at(h):
    s = ST.get(h)
    if not s: return {}
    out = {}
    for san, (nb, pb, nr, pr) in s['mv'].items():
        n, p = (nb + nr, pb + pr) if SPEEDS == 'all' else (nr, pr) if SPEEDS == 'rapid' else (nb, pb)
        if n: out[san] = (n, p)
    return out

def score_me(n, wpts2, own):
    s = wpts2 / 2 / n
    return s if own == chess.WHITE else 1 - s

def wilson(s, n, z=1.96):
    if n == 0: return (None, None)
    d = 1 + z * z / n; c = (s + z * z / (2 * n)) / d; e = z * math.sqrt(s * (1 - s) / n + z * z / (4 * n * n)) / d
    return (round(c - e, 3), round(c + e, 3))

courses = json.load(open(courses_path))
# The owner answers 1.d4 with 1...c6 (3 of his 4 games against 1.d4 by 2026-10-16), not the Slav course's 1...d5.
# 'black-vs-d4-with-1c6' merges the Slav and Caro-Kann chapters and starts after 1.d4 c6, so 2.e4 d5 lands in the
# Caro-Kann and 2.c4 d5 / 2.Bf4 d5 / 2.Nf3 d5 land in the Slav course by transposition.
_sl = next(c for c in courses if c['id'] == 'slav'); _ck = next(c for c in courses if c['id'] == 'caro-kann')
courses.append({'id': 'black-vs-d4-with-1c6', 'name': 'Slav + Caro-Kann after 1.d4 c6', 'side': 'black', 'signatureMoves': ['d4', 'c6'],
                'chapters': [dict(ch, id='slav:' + ch['id']) for ch in _sl['chapters']] + [dict(ch, id='caro:' + ch['id']) for ch in _ck['chapters']]})
IDX = {}
for c in courses:
    own = chess.WHITE if c['side'] == 'white' else chess.BLACK
    first_moves = collections.defaultdict(list); any_moves = collections.defaultdict(set)
    pos_ch = collections.defaultdict(set); decisions = collections.defaultdict(dict); main_pos = collections.defaultdict(list)
    fen_of = {}
    for ci, ch in enumerate(c['chapters']):
        for node in ch['nodes']:
            b = chess.Board()
            for san in node['path'][:-1]: b.push_san(san)
            hb = zh(b); fen_of[hb] = b.fen()
            mover = b.turn
            b.push_san(node['san']); ha = zh(b); fen_of[ha] = b.fen()
            any_moves[hb].add(node['san']); pos_ch[hb].add(ch['id']); pos_ch[ha].add(ch['id'])
            if mover == own and node['first']:
                first_moves[hb].append((ci, node['san']))
                decisions[ch['id']][hb] = {'ply': node['ply'], 'san': node['san'], 'line': ' '.join(node['path'])}
            if node['main']: main_pos[ch['id']].append((node['ply'], ha, ' '.join(node['path'])))
    # merged own choice + conflicts
    choice = {}; conflicts = []
    for hb, lst in first_moves.items():
        cnt = collections.Counter(s for _, s in lst)
        best = max(cnt.items(), key=lambda kv: (kv[1], -min(ci for ci, s in lst if s == kv[0])))[0]
        choice[hb] = best
        if len(cnt) > 1:
            by = collections.defaultdict(list)
            for ci, s in lst: by[s].append(c['chapters'][ci]['id'])
            conflicts.append({'fen': fen_of[hb], 'moves_by_chapter': {s: sorted(set(v)) for s, v in by.items()}, 'walk_uses': best})
    # signature position per chapter: first main-line position not on any other chapter's main line
    sig = {}
    for ch in c['chapters']:
        others = set()
        for o in c['chapters']:
            if o['id'] != ch['id']: others.update(h for _, h, _ in main_pos[o['id']])
        for ply, h, line in main_pos[ch['id']]:
            if h not in others: sig[ch['id']] = (ply, h, line); break
    IDX[c['id']] = dict(own=own, choice=choice, any=any_moves, pos_ch=pos_ch, decisions=decisions, conflicts=conflicts, sig=sig,
                        n_ch=len(c['chapters']), chapters=c['chapters'])

ROOTS = {'london': [], 'caro-kann': ['e4'], 'slav': ['d4'], 'black-vs-d4-with-1c6': ['d4', 'c6']}

def slav_structure(b):
    P = lambda sq, col: b.piece_at(sq) == chess.Piece(chess.PAWN, col)
    return P(chess.C4, chess.WHITE) and P(chess.D4, chess.WHITE) and P(chess.C6, chess.BLACK) and P(chess.D5, chess.BLACK)

def walk(cid):
    X = IDX[cid]; own = X['own']
    out = {'gaps': [], 'rare': [], 'ran_out': [], 'reached': 0.0, 'pruned': 0.0, 'rescued': 0.0}
    mass_at_dec = collections.defaultdict(float)
    mass_at_pos = collections.defaultdict(float)
    dec_info = {}
    ends = []
    ch_paths = collections.defaultdict(list)  # chapter -> [(mass, last_course_ply, end_reason)]
    slav_mass = collections.defaultdict(float)
    b = chess.Board()
    for s in ROOTS[cid]: b.push_san(s)
    unique_of = lambda h: next(iter(X['pos_ch'][h])) if len(X['pos_ch'].get(h, ())) == 1 else None
    sig_by_h = {v[1]: k for k, v in X['sig'].items()}

    def finish(p, last_ply, reason, touched):
        ends.append((p, last_ply, reason))
        for chid in touched: ch_paths[chid].append((p, last_ply, reason))

    def rec(seq, p, touched, slav_seen):
        h = zh(b); ply = len(b.move_stack)
        mass_at_pos[h] += p
        t2 = set(touched)
        u = unique_of(h)
        if u: t2.add(u)
        if h in sig_by_h: t2.add(sig_by_h[h])
        if not slav_seen and slav_structure(b):
            slav_seen = True; slav_mass[ply] += p
        if ply >= MAXPLY:
            out['reached'] += p; finish(p, ply, 'reached move 12', t2); return
        if p < PRUNE:
            out['pruned'] += p; finish(p, ply, 'pruned', t2); return
        if b.turn == own:
            mv = X['choice'].get(h)
            if mv is None:
                out['ran_out'].append({'line': ' '.join(seq), 'mass': p, 'ply': ply}); finish(p, ply, 'course runs out', t2); return
            mass_at_dec[h] += p
            if h not in dec_info or len(seq) < len(dec_info[h]['line'].split()):
                dec_info[h] = {'fen': b.fen(), 'line': ' '.join(seq), 'course_move': mv, 'ply': ply + 1}
            b.push_san(mv); rec(seq + [mv], p, t2, slav_seen); b.pop(); return
        mvs = moves_at(h)
        tot = sum(n for n, _ in mvs.values())
        if tot < MIN_NODE:
            out['rare'].append({'line': ' '.join(seq), 'mass': p, 'n': tot}); finish(p, ply, 'too rare in sample', t2); return
        for san, (n, pts) in sorted(mvs.items(), key=lambda kv: -kv[1][0]):
            q = p * n / tot
            b.push_san(san)
            covered = san in X['any'].get(h, ()) or zh(b) in X['pos_ch']
            if covered:
                rec(seq + [san], q, t2, slav_seen)
            else:
                rescue = None
                for m2 in list(b.legal_moves):
                    b.push(m2)
                    if zh(b) in X['pos_ch']: rescue = b.peek()
                    b.pop()
                    if rescue: break
                sc = score_me(n, pts, own)
                gap = {'line': ' '.join(seq + [san]), 'mass': q, 'n_move': n, 'n_position': tot, 'share_at_position': n / tot,
                       'score_me': round(sc, 3), 'score_ci95': wilson(sc, n), 'opp_move_no': (ply // 2) + 1,
                       'transposes_after_one_own_move': None}
                if rescue is not None:
                    san_r = b.san(rescue); gap['transposes_after_one_own_move'] = san_r
                    out['rescued'] += q
                    # continue the walk through the transposition
                    b.push(rescue); rec(seq + [san, san_r], q, t2, slav_seen); b.pop()
                else:
                    out['gaps'].append(gap); finish(q, ply, 'gap', t2)
            b.pop()

    rec(list(ROOTS[cid]), 1.0, set(), False)
    out['ends'] = ends
    out['decisions_used'] = [dict(dec_info[h], mass=round(m, 4), chapters=sorted(X['pos_ch'][h])) for h, m in sorted(mass_at_dec.items(), key=lambda kv: -kv[1]) if m >= 0.002]
    for d in out['decisions_used']:
        bb = chess.Board(d['fen']); mv = moves_at(zh(bb)); tot = sum(n for n, _ in mv.values())
        d['n_position'] = tot
        d['what_1000_1300_players_play_here'] = [{'san': s_, 'n': n, 'share': round(n / tot, 3), 'score_me': round(score_me(n, pp, own), 3)} for s_, (n, pp) in sorted(mv.items(), key=lambda kv: -kv[1][0])[:5]]
    return out, mass_at_dec, mass_at_pos, ch_paths, slav_mass

def rejoin(cid, line, own_plies=2, min_n=10):
    """After a gap, keep playing 'your set-up' for up to own_plies own moves: an own move that lands on a course
    position if one exists, else the most common move at 1000-1300 among moves the course itself plays somewhere
    (same piece and square), else the most common move. Opponent moves by their 1000-1300 frequency.
    Returns the share of these continuations that land back on a course position, and the share we cannot follow."""
    X = IDX[cid]; own = X['own']
    own_sans = set()
    for chp in X['chapters']:
        for n in chp['nodes']:
            if (n['mover'] == 'w') == (own == chess.WHITE): own_sans.add(n['san'])
    b = chess.Board()
    for sm in line.split(): b.push_san(sm)
    res = {'rejoined': 0.0, 'not_rejoined': 0.0, 'unknown': 0.0, 'example_rejoin': None}
    def rec(p, own_left, path):
        h = zh(b)
        if h in X['pos_ch'] and path:
            res['rejoined'] += p
            if res['example_rejoin'] is None or p > res['example_rejoin'][1]: res['example_rejoin'] = (' '.join(path), p)
            return
        if b.is_game_over(): res['not_rejoined'] += p; return
        if b.turn == own:
            if own_left == 0: res['not_rejoined'] += p; return
            pick = None
            for m in b.legal_moves:
                b.push(m); ok = zh(b) in X['pos_ch']; b.pop()
                if ok: pick = b.san(m); break
            if pick is None:
                mv = moves_at(h)
                cand = [(n, sm) for sm, (n, _) in mv.items() if sm.rstrip('+#') in own_sans or sm in own_sans]
                if cand: pick = max(cand)[1]
                elif mv: pick = max((n, sm) for sm, (n, _) in mv.items())[1]
                else: res['unknown'] += p; return
            b.push_san(pick); rec(p, own_left - 1, path + [pick]); b.pop(); return
        mv = moves_at(h); tot = sum(n for n, _ in mv.values())
        if tot < min_n: res['unknown'] += p; return
        for sm, (n, _) in mv.items():
            b.push_san(sm); rec(p * n / tot, own_left, path + [sm]); b.pop()
    rec(1.0, own_plies, [])
    if res['example_rejoin']: res['example_rejoin'] = {'continuation': res['example_rejoin'][0], 'share': round(res['example_rejoin'][1], 3)}
    for k in ('rejoined', 'not_rejoined', 'unknown'): res[k] = round(res[k], 3)
    return res

def build_tree(cid, mass_at_pos):
    X = IDX[cid]; own = X['own']
    b = chess.Board()
    for s in ROOTS[cid]: b.push_san(s)
    def top_moves(h, k=5):
        mv = moves_at(h); tot = sum(n for n, _ in mv.values())
        return tot, [{'san': s, 'n': n, 'share': round(n / tot, 4), 'score_me': round(score_me(n, p, own), 3), 'score_ci95': wilson(score_me(n, p, own), n)}
                     for s, (n, p) in sorted(mv.items(), key=lambda kv: -kv[1][0])[:k]] if tot else []
    def rec(reach, in_course, depth_limit_ok=True):
        h = zh(b); ply = len(b.move_stack)
        node_children = []
        if ply >= MAXPLY: return node_children
        mv = moves_at(h); tot = sum(n for n, _ in mv.values())
        if b.turn == own:
            choice = X['choice'].get(h) if in_course else None
            note = 'course move'
            if choice is None:
                if not tot: return node_children
                choice = max(mv.items(), key=lambda kv: kv[1][0])[0]
                if mv[choice][0] < 10: return node_children
                note = 'course has no move here: most common move at 1000-1300' if in_course else 'outside the course: most common move at 1000-1300'
            n, p = mv.get(choice, (0, 0))
            tt, tops = top_moves(h)
            child = {'san': choice, 'by': 'me', 'ply': ply + 1, 'fen_before': b.fen(), 'n_position': tot, 'n': n,
                     'score_me': round(score_me(n, p, own), 3) if n else None, 'score_ci95': wilson(score_me(n, p, own), n) if n else None,
                     'reach': round(reach, 4), 'in_course': in_course and note == 'course move', 'note': note,
                     'what_1000_1300_players_play_here': tops}
            b.push_san(choice)
            child['children'] = rec(reach, in_course and note == 'course move')
            b.pop()
            return [child]
        if tot < 10: return node_children
        other = 0.0
        for san, (n, p) in sorted(mv.items(), key=lambda kv: -kv[1][0]):
            q = reach * n / tot
            if q < TREE_MIN_REACH or n < 10:
                other += q; continue
            b.push_san(san)
            cov = in_course and (san in X['any'].get(h, ()) or zh(b) in X['pos_ch'])
            sc = score_me(n, p, own)
            child = {'san': san, 'by': 'opponent', 'ply': ply + 1, 'n': n, 'share_at_position': round(n / tot, 4), 'reach': round(q, 4),
                     'score_me': round(sc, 3), 'score_ci95': wilson(sc, n), 'in_course': cov,
                     'note': '' if cov or not in_course else 'GAP: the course has no answer to this move'}
            child['children'] = rec(q, cov)
            b.pop()
            node_children.append(child)
        if other > 0: node_children.append({'san': '(other moves, each under 0.2% of games)', 'by': 'opponent', 'reach': round(other, 4)})
        return node_children
    return {'course': cid, 'you_play': 'White' if own == chess.WHITE else 'Black', 'root_moves': ROOTS[cid], 'speeds': SPEEDS,
            'band': 'both players 1000-1300', 'min_reach_shown': TREE_MIN_REACH, 'children': rec(1.0, True)}

summary = {'sample': {'games': D['games'], 'blitz': D['blitz'], 'rapid': D['rapid'], 'speeds_used': SPEEDS,
                      'first_moves': {k: v for k, v in D['first_move'].most_common(12)}}, 'courses': {}}
for c in courses:
    cid = c['id']; X = IDX[cid]
    out, mdec, mpos, ch_paths, slav_mass = walk(cid)
    gaps = sorted(out['gaps'], key=lambda g: -g['mass'])
    gap_total = sum(g['mass'] for g in gaps); rare_total = sum(r['mass'] for r in out['rare']); ran_total = sum(r['mass'] for r in out['ran_out'])
    by_opp_move = collections.defaultdict(float)
    for g in gaps: by_opp_move[g['opp_move_no']] += g['mass']
    cum = 0; cum_list = []
    for k in sorted(by_opp_move): cum += by_opp_move[k]; cum_list.append([k, round(cum, 4)])
    chapters = []
    for ci, ch in enumerate(X['chapters']):
        paths = ch_paths.get(ch['id'], [])
        reach = sum(p for p, _, _ in paths)
        reasons = collections.defaultdict(float)
        for p, lp, r in paths: reasons[r] += p
        mean_ply = sum(p * lp for p, lp, _ in paths) / reach if reach else None
        def inc(k):
            if not reach: return None
            lo = sum(p for p, lp, r in paths if lp >= k) / reach
            hi = lo + sum(p for p, lp, r in paths if lp < k and r == 'too rare in sample') / reach
            return [round(lo, 3), round(hi, 3)]
        decs = X['decisions'][ch['id']]
        dec_mass = [(mdec.get(h, 0.0), d) for h, d in decs.items()]
        sg = X['sig'].get(ch['id'])
        chapters.append({
            'id': ch['id'], 'title': ch['title'], 'difficulty': ch['difficulty'], 'order': ci + 1,
            'signature_line': sg[2] if sg else None, 'signature_ply': sg[0] if sg else None,
            'reach_signature_position': round(mpos.get(sg[1], 0.0), 4) if sg else None,
            'reach_any_chapter_only_position_or_signature': round(reach, 4),
            'of_those_end': {k: round(v, 4) for k, v in reasons.items()},
            'mean_ply_still_in_course_for_those': round(mean_ply, 1) if mean_ply else None,
            'of_those_still_in_course_after_move_6_low_high': inc(12), 'after_move_8_low_high': inc(16), 'after_move_10_low_high': inc(20),
            'share_of_those_reaching_move_12_in_course': round(reasons.get('reached move 12', 0) / reach, 3) if reach else None,
            'own_moves_to_learn_total': len(decs),
            'own_moves_to_learn_after_move_12': sum(1 for d in decs.values() if d['ply'] > MAXPLY),
            'own_moves_used_1_in_100_games': sum(1 for m, d in dec_mass if m >= 0.01),
            'own_moves_used_1_in_200_games': sum(1 for m, d in dec_mass if m >= 0.005),
            'own_moves_used_1_in_1000_games': sum(1 for m, d in dec_mass if m >= 0.001),
            'own_moves_never_used_in_walk': sum(1 for m, d in dec_mass if m == 0 and d['ply'] <= MAXPLY),
            'most_used_own_moves': [{'line': d['line'], 'mass': round(m, 4)} for m, d in sorted(dec_mass, key=lambda x: -x[0])[:5] if m > 0],
        })
    ends = out['ends']; start_ply = len(ROOTS[cid])
    in_course = []
    for k in range(start_ply + 1, MAXPLY + 1):
        lo = sum(p for p, lp, r in ends if lp >= k)
        hi = lo + sum(p for p, lp, r in ends if lp < k and r == 'too rare in sample')
        in_course.append({'ply': k, 'after_move': (k + 1) // 2, 'still_in_course_low': round(lo, 4), 'still_in_course_high': round(hi, 4)})
    end_ply_hist = collections.defaultdict(lambda: collections.defaultdict(float))
    for p, lp, r in ends: end_ply_hist[r][lp] += p
    res = {'you_play': 'White' if X['own'] == chess.WHITE else 'Black', 'root': ROOTS[cid],
           'reached_move_12_in_course': round(out['reached'], 4), 'gap_no_answer': round(gap_total, 4),
           'too_rare_in_sample': round(rare_total, 4), 'course_runs_out_before_move_12': round(ran_total, 4),
           'pruned_tiny': out['pruned'], 'continued_via_one_move_transposition': round(out['rescued'], 4),
           'cumulative_gap_by_opponent_move_number': cum_list,
           'still_in_course_after_ply': in_course,
           'where_lines_end_by_ply': {r: {k: round(v, 4) for k, v in sorted(d.items())} for r, d in end_ply_hist.items()},
           'gaps_at_least_1_in_100': [dict(g, if_you_keep_playing_your_setup_for_2_moves=rejoin(cid, g['line'])) for g in gaps if g['mass'] >= 0.01],
           'gaps_0p5_to_1_in_100': [dict(g, if_you_keep_playing_your_setup_for_2_moves=rejoin(cid, g['line'])) for g in gaps if 0.005 <= g['mass'] < 0.01],
           'runs_out_top': sorted(out['ran_out'], key=lambda r: -r['mass'])[:15],
           'too_rare_top': sorted(out['rare'], key=lambda r: -r['mass'])[:10],
           'chapters': chapters, 'conflicting_first_moves': X['conflicts'], 'own_decisions_used_1_in_500_games': out['decisions_used'],
           'slav_structure_reached_by_ply': {k: round(v, 4) for k, v in sorted(slav_mass.items())} if cid != 'london' else None}
    summary['courses'][cid] = res
    tree = build_tree(cid, mpos)
    json.dump(tree, open(os.path.join(outdir, f'tree_{cid}_{SPEEDS}.json'), 'w'), indent=1)
    print(f"== {cid} ({SPEEDS}): reached move 12 in course {out['reached']:.3f}, gaps {gap_total:.3f}, rare {rare_total:.3f}, runs out {ran_total:.3f}, pruned {out['pruned']:.4f}, rescued {out['rescued']:.3f}")
    print('   in course after ply (low-high):', ' '.join(f"{x['ply']}:{x['still_in_course_low']:.2f}-{x['still_in_course_high']:.2f}" for x in in_course if x['ply'] % 2 == 0))
    print('   rare ends by ply:', {k: round(v, 3) for k, v in sorted(end_ply_hist['too rare in sample'].items())})
    for g in gaps[:20]: print(f"   gap {100*g['mass']:5.1f}%  {g['line']}  (n={g['n_move']}, score_me {g['score_me']})")
    for chp in chapters: print(f"   {chp['id']:26s} sig {chp['reach_signature_position']}  reach {chp['reach_any_chapter_only_position_or_signature']}  depth {chp['mean_ply_still_in_course_for_those']}  to12 {chp['share_of_those_reaching_move_12_in_course']}  learn {chp['own_moves_to_learn_total']} (>12: {chp['own_moves_to_learn_after_move_12']}) used1/200 {chp['own_moves_used_1_in_200_games']}")
    print('   conflicts:', len(X['conflicts']))
json.dump(summary, open(os.path.join(outdir, f'coverage_{SPEEDS}' + ('' if MIN_NODE == 30 else f'_min{MIN_NODE}') + '.json'), 'w'), indent=1)
