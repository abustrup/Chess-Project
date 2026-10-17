# Diagnosis of the owner's own Lichess games.
# Inputs: the Lichess NDJSON export, the Stockfish pass (engine_eval.py output, merged), the course export (export_courses.ts).
# Output: mistakes.json (one record per judged mistake, for a trainer), moves.jsonl (every one of his moves, for re-checks),
#         stats.json (all numbers used in summary.md).
# Usage: .venv/bin/python -I scripts/analyse_games.py lichess_abustrup.ndjson sf_evals.jsonl courses.json OUTDIR
import sys, os, json, math, random, statistics, collections, importlib.util
import chess
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lichess_rule import lichess_judgment, lichess_api_score, wp_mover, winp, START

# research/2026-10-16 classifier (SEE-based hung-piece test), reused unchanged
spec = importlib.util.spec_from_file_location('alib', os.path.join(HERE, '../../../2026-10-16/coaching_lens/analyse_lib.py'))
alib = importlib.util.module_from_spec(spec); spec.loader.exec_module(alib)

ME = 'abustrup'
games_path, sf_path, courses_path, outdir = sys.argv[1:5]
LINES = {}
if len(sys.argv) > 5:   # optional: longer sequential engine lines for judged moves (lines.py)
    for l in open(sys.argv[5]):
        r = json.loads(l); LINES[(r['id'], r['ply'])] = r
GAMES = [json.loads(l) for l in open(games_path)]
SF = {}
for l in open(sf_path):
    r = json.loads(l); SF[r['id']] = r
COURSES = json.load(open(courses_path))
VAL = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0}

def material(board, color):
    s = 0
    for pc in board.piece_map().values():
        v = VAL[pc.piece_type]
        s += v if pc.color == color else -v
    return s

def pv_material_path(board, pv_uci, color, plies):
    """Material (color's POV) after each ply of the PV, up to `plies`. Stops if the PV is illegal or ends."""
    b = board.copy(stack=False); out = []
    for u in pv_uci[:plies]:
        mv = chess.Move.from_uci(u)
        if mv not in b.legal_moves: break
        b.push(mv); out.append(material(b, color))
    return out

def san_line(board, pv_uci, n):
    b = board.copy(stack=False); out = []
    for u in pv_uci[:n]:
        mv = chess.Move.from_uci(u)
        if mv not in b.legal_moves: break
        out.append(b.san(mv)); b.push(mv)
    return ' '.join(out)

def key3(fen): return ' '.join(fen.split(' ')[:3])

def score_str(s):
    if s is None: return None
    if 'mate' in s: return f"#{s['mate']}"
    return f"{s['cp']/100:+.2f}"

def my_pov(s, white):
    if 'mate' in s:
        m = s['mate'];  return {'mate': (m if white else -m)}
    return {'cp': s['cp'] if white else -s['cp']}

def division_phase(ply_before, div):
    # Lichess division: plies at which the middlegame and endgame start (index of the position before the move)
    if div.get('end') is not None and ply_before >= div['end']: return 'endgame'
    if div.get('middle') is not None and ply_before >= div['middle']: return 'middlegame'
    return 'opening'

def speed_of(tc):
    est = tc['initial'] + 40 * tc['increment']
    return 'bullet' if est < 179 else 'blitz' if est < 479 else 'rapid' if est < 1499 else 'classical'

all_moves = []      # every move he played (one dict each)
opp_moves = []      # opponents' moves that have a null-move probe (only when engine_eval ran with NULL_SIDE=both)
mistakes = []       # his Blunders and Mistakes (Lichess rule on our engine evals, plus Lichess's own where it exists)
game_rows = []

for g in GAMES:
    gid = g['id']
    if gid not in SF:
        print('no engine data for', gid, file=sys.stderr); continue
    sf = SF[gid]['positions']
    me_white = g['players']['white'].get('user', {}).get('id') == ME
    my_color = chess.WHITE if me_white else chess.BLACK
    opp = g['players']['black' if me_white else 'white']
    mine = g['players']['white' if me_white else 'black']
    tc = g['clock']; base, inc = tc['initial'], tc['increment']
    winner = g.get('winner')
    result = 'draw' if winner is None and g['status'] in ('draw', 'stalemate') else ('win' if winner == ('white' if me_white else 'black') else 'loss' if winner else 'draw')
    div = g.get('division', {})
    sans = g['moves'].split()
    clocks = g.get('clocks', [])
    lich = g.get('analysis')
    b = chess.Board()
    prev_clock = {chess.WHITE: base * 100, chess.BLACK: base * 100}
    my_wp_series = []   # his win% after every ply (engine)
    plies = []
    for i, san in enumerate(sans):
        ply = i + 1
        mover = b.turn
        before = b.copy(stack=False)
        mv = b.parse_san(san)
        pos_before = sf[i]; pos_after = sf[i + 1]
        prev_s = START if i == 0 else pos_before['score']
        cur_s = pos_after['score']
        mover_white = mover == chess.WHITE
        best = pos_before.get('best')
        j, drop = lichess_judgment(prev_s, cur_s, mover_white, played_is_best=(best == mv.uci()))
        # Lichess's own judgement for this ply, if Lichess analysed the game
        lj = None; l_score = None
        if lich and i < len(lich):
            lj = lich[i].get('judgment', {}).get('name'); l_score = lichess_api_score(lich[i])
        clk = clocks[i] / 100 if i < len(clocks) else None
        spent = None
        if clk is not None:
            spent = (prev_clock[mover] - clocks[i]) / 100 + inc
            prev_clock[mover] = clocks[i]
            if ply <= 2: spent = 0.0  # Lichess does not run the clock for each side's first move
        b.push(mv)
        my_wp_series.append(wp_mover(cur_s, me_white))
        rec = dict(ply=ply, fm=before.fullmove_number, mover_is_me=(mover == my_color), san=san, uci=mv.uci(), judgment=j, drop=drop,
                   lichess_judgment=lj, clk=clk, spent=spent, before=before, after=b.copy(stack=False),
                   prev_s=prev_s, cur_s=cur_s, best=best, pv_before=pos_before.get('pv', []), pv_after=pos_after.get('pv', []),
                   null=pos_before.get('null'), l_score=l_score)
        plies.append(rec)

    # per-game facts
    my_plies = [p for p in plies if p['mover_is_me']]
    sustained90 = any(all(x >= 90 for x in my_wp_series[k:k + 3]) for k in range(len(my_wp_series) - 2))
    ever75 = any(x >= 75 for x in my_wp_series)
    opp_series = [100 - x for x in my_wp_series]
    opp_sustained90 = any(all(x >= 90 for x in opp_series[k:k + 3]) for k in range(len(opp_series) - 2))
    opp_ever75 = any(x >= 75 for x in opp_series)
    first75 = next((k + 1 for k, x in enumerate(my_wp_series) if x >= 75), None)
    wp_at_12 = my_wp_series[23] if len(my_wp_series) >= 24 else None
    s_at_12 = sf[24]['score'] if len(sf) > 24 else None
    timeout_loss = result == 'loss' and g['status'] == 'outoftime'
    # repertoire walk
    course_id = None
    if me_white and sans and sans[0] == 'd4': course_id = 'london'
    elif not me_white and sans and sans[0] == 'e4': course_id = 'caro-kann'
    elif not me_white and sans and sans[0] == 'd4': course_id = 'slav'
    left = None
    if course_id:
        positions = COURSES[course_id]['positions']; bb = chess.Board()
        for i, san in enumerate(sans):
            k = key3(bb.fen()); allowed = positions.get(k)
            if allowed is None:
                left = dict(ply=i + 1, who='course ends' , san=san); break
            if san not in allowed:
                who = 'me' if (bb.turn == my_color) else 'opponent'
                left = dict(ply=i + 1, who=who, san=san, course_moves=allowed); break
            bb.push_san(san)
        if left is None: left = dict(ply=len(sans) + 1, who='game ended in course')
        else:
            # did the game transpose back into a course position later (within the first 12 moves)?
            for j in range(left['ply'] - 1, min(len(sans), 24)):
                bb.push_san(sans[j])
                if key3(bb.fen()) in positions:
                    left['transposed_back_at_ply'] = j + 2; break
        lp = left['ply']
        left['fm'] = (lp + 1) // 2
        s_left = sf[lp - 1]['score']  # position where the game left the course (before the leaving move)
        left['eval_before_leaving_my_pov'] = score_str(my_pov(s_left, me_white))
        if left['who'] in ('me', 'opponent'):
            s_after = sf[lp]['score'] if lp < len(sf) else None
            left['eval_after_leaving_my_pov'] = score_str(my_pov(s_after, me_white)) if s_after else None
    # decisive mistake in lost games: his single biggest win% drop
    decider = None
    if result == 'loss' and my_plies:
        d = max(my_plies, key=lambda p: p['drop'])
        decider = dict(ply=d['ply'], fm=d['fm'], drop=round(d['drop'], 1), san=d['san'])
    game_rows.append(dict(id=gid, color='white' if me_white else 'black', speed=g['speed'], tc=f'{base}+{inc}', rated=g['rated'],
                          my_rating=mine.get('rating'), opp_rating=opp.get('rating'), my_rating_diff=mine.get('ratingDiff'),
                          result=result, status=g['status'], plies=len(sans), my_moves=len(my_plies), lichess_analysed=bool(lich),
                          lichess_my_counts=(mine.get('analysis') or None), opening=g.get('opening', {}).get('name'), eco=g.get('opening', {}).get('eco'),
                          first_moves=' '.join(sans[:6]), course=course_id, left_course=left, my_wp_at_move12=(round(wp_at_12, 1) if wp_at_12 is not None else None),
                          eval_at_move12_my_pov=(score_str(my_pov(s_at_12, me_white)) if s_at_12 else None), had_sustained_90=sustained90,
                          ever_75=ever75, first_ply_at_75=first75, opp_ever_75=opp_ever75, opp_sustained_90=opp_sustained90, timeout_loss=timeout_loss, decider=decider, division=div,
                          my_clock_end=(my_plies[-1]['clk'] if my_plies and my_plies[-1]['clk'] is not None else None),
                          opp_moves=sum(1 for p in plies if not p['mover_is_me']), opp_blunders=sum(1 for p in plies if not p['mover_is_me'] and p['judgment'] == 'Blunder'),
                          my_blunders=sum(1 for p in my_plies if p['judgment'] == 'Blunder')))

    # opponents' moves: was there a real threat against them (null-move probe), and did they blunder?
    for p in plies:
        if p['mover_is_me'] or p['null'] is None or p['ply'] <= 1: continue
        mover_white = not me_white
        ns = p['null']['score']
        size = wp_mover(p['prev_s'], mover_white) - wp_mover(ns, mover_white)
        oc = not my_color
        nb2 = p['before'].copy(stack=False); nb2.push(chess.Move.null())
        m0 = material(p['before'], oc)
        npath = [m0] + pv_material_path(nb2, p['null'].get('pv', []), oc, 6)
        nloss = m0 - sorted(npath[-3:])[len(npath[-3:]) // 2] if len(npath) >= 3 else m0 - min(npath)
        nmate = 'mate' in ns and ((ns['mate'] > 0) != mover_white)
        real = size >= 15 and (nloss >= 2 or nmate)
        opp_moves.append(dict(game_id=gid, ply=p['ply'], judgment=p['judgment'], threat_size=round(size, 1), threat_real=real,
                              opp_rating=opp.get('rating'), clk=p['clk'], spent=p['spent']))

    # per-move classification of his moves
    for idx, p in enumerate(plies):
        if not p['mover_is_me']: continue
        before, after = p['before'], p['after']; mv = chess.Move.from_uci(p['uci'])
        # research/2026-10-16 classifier, unchanged logic
        thr = alib.hang_map(before, my_color); oppfree = alib.hang_map(before, not my_color)
        cap = before.piece_at(mv.to_square)
        cap_val = alib.VAL[cap.piece_type] if cap else (1 if before.is_en_passant(mv) else 0)
        ha = alib.hang_map(after, my_color)
        new = {s: v for s, v in ha.items() if s not in thr}; kept = {s: v for s, v in ha.items() if s in thr}
        nh = (max(new.values()) - cap_val) if new else 0; kh = max(kept.values()) if kept else 0
        mate_after = 'mate' in p['cur_s'] and p['cur_s']['mate'] != 0 and ((p['cur_s']['mate'] > 0) != (my_color == chess.WHITE))
        if nh >= 2: rcat = 'hung_material_new'
        elif kh >= 2 and cap_val < 2: rcat = 'ignored_attacked_piece'
        elif mate_after: rcat = 'allowed_forced_mate'
        elif (max(oppfree.values()) if oppfree else 0) >= 2 and cap_val < 2: rcat = 'missed_free_material'
        else: rcat = 'other_tactic_or_positional'
        # engine-backed facts. Material is followed along two lines from the position before his move:
        #   played line = his move + the engine's best reply line;  best line = the engine's best line.
        # "settled" material = median of three consecutive plies, so a capture that is recaptured next ply does not count.
        mat_before = material(before, my_color)
        ln = LINES.get((gid, p['ply']))
        if ln:
            played_path = pv_material_path(before, ln['played_line'], my_color, 8)
            best_path = pv_material_path(before, ln['best_line'], my_color, 8)
        else:
            played_path = [material(after, my_color)] + pv_material_path(after, p['pv_after'], my_color, 7)  # k=1 is his move
            best_path = pv_material_path(before, p['pv_before'], my_color, 8)
        def settled(path, ks):
            vals = [path[k - 1] for k in ks if len(path) >= k]
            if not vals: vals = path[-1:] or [mat_before]
            return sorted(vals)[len(vals) // 2] - mat_before
        played_short = settled(played_path, (2, 3, 4))
        played_long = min(settled(played_path, (4, 5, 6)), settled(played_path, (6, 7, 8)))
        best_short = settled(best_path, (2, 3, 4))
        best_long = max(settled(best_path, (4, 5, 6)), settled(best_path, (6, 7, 8)))
        hang_sqs = set(new) | set(kept)
        reply = (ln['played_line'][1] if ln and len(ln['played_line']) > 1 else (p['pv_after'][0] if p['pv_after'] else None))
        reply_is_capture = bool(reply) and after.is_capture(chess.Move.from_uci(reply))
        engine_takes_flagged = bool(reply_is_capture and chess.Move.from_uci(reply).to_square in hang_sqs)
        best_is_capture = bool(p['best']) and before.is_capture(chess.Move.from_uci(p['best']))
        prev_my = my_pov(p['prev_s'], my_color == chess.WHITE); cur_my = my_pov(p['cur_s'], my_color == chess.WHITE)
        opp_mate_len = (-cur_my['mate']) if ('mate' in cur_my and cur_my['mate'] < 0) else None
        my_mate_len = prev_my['mate'] if ('mate' in prev_my and prev_my['mate'] > 0) else None
        already_mated = 'mate' in prev_my and prev_my['mate'] < 0
        # null-move threat probe: what could the opponent do if it were his move again?
        threat = None
        if p['null'] is not None:
            ns = p['null']['score']; wp_null = wp_mover(ns, my_color == chess.WHITE)  # ns is White-POV
            wp_now = wp_mover(p['prev_s'], my_color == chess.WHITE)
            tmove = p['null']['best']
            tsan = None
            if tmove:
                nb = before.copy(stack=False); nb.push(chess.Move.null())
                try: tsan = nb.san(chess.Move.from_uci(tmove))
                except Exception: tsan = tmove
            # concrete = the threat line wins 2+ points of material for the opponent, or mates
            nb2 = before.copy(stack=False); nb2.push(chess.Move.null())
            npath = [material(before, my_color)] + pv_material_path(nb2, p['null'].get('pv', []), my_color, 6)
            nloss = mat_before - sorted(npath[-3:])[len(npath[-3:]) // 2] if len(npath) >= 3 else mat_before - min(npath)
            nmate = 'mate' in ns and ((ns['mate'] > 0) != (my_color == chess.WHITE))
            threat = dict(size=round(wp_now - wp_null, 1), move=tmove, san=tsan, score=score_str(my_pov(ns, my_color == chess.WHITE)),
                          line_san=san_line(nb2, p['null'].get('pv', []), 6), material_threatened=nloss, mate_threatened=nmate)
        threat_real = threat is not None and threat['size'] >= 15 and (threat['material_threatened'] >= 2 or threat['mate_threatened'])
        # carried out = the reply is the threat move itself, or a capture on the square the threat move went to
        threat_executed = threat_real and reply is not None and threat['move'] is not None and (
            reply == threat['move'] or (reply_is_capture and chess.Move.from_uci(reply).to_square == chess.Move.from_uci(threat['move']).to_square))
        wp_b = wp_mover(p['prev_s'], my_color == chess.WHITE); wp_a = wp_mover(p['cur_s'], my_color == chess.WHITE)
        # task categories (one primary category, first match in this order) + flags
        if opp_mate_len is not None and opp_mate_len <= 3 and not already_mated:
            cat = 'allowed_short_mate'
        elif played_short <= -2 and reply_is_capture:
            cat = 'hung_piece'                      # the opponent's very next move captures and he stays >=2 down
        elif threat_executed:
            cat = 'ignored_threat'
        elif my_mate_len is not None and my_mate_len <= 3:
            cat = 'missed_short_mate'
        elif best_is_capture and best_short - played_short >= 2:
            cat = 'missed_free_material'            # the best move captures and nets >=2 more than what he played
        elif opp_mate_len is not None or played_long <= -2:
            cat = 'allowed_longer_tactic'
        elif my_mate_len is not None or best_long - played_long >= 2:
            cat = 'missed_own_tactic'
        elif p['fm'] <= 12:
            cat = 'opening_positional'
        else:
            cat = 'positional_or_endgame'
        group = {'hung_piece': 'hung or left a piece en prise', 'missed_free_material': 'missed free material or a short mate',
                 'missed_short_mate': 'missed free material or a short mate',
                 'allowed_short_mate': "ignored opponent's threat / allowed a short mate", 'ignored_threat': "ignored opponent's threat / allowed a short mate",
                 'allowed_longer_tactic': 'longer tactic missed', 'missed_own_tactic': 'longer tactic missed',
                 'opening_positional': 'opening-theory-type mistake', 'positional_or_endgame': 'other (positional or endgame play)'}[cat]
        tt = p['clk'] is not None and p['clk'] < 0.1 * base
        div_ph = division_phase(p['ply'] - 1, div)
        mrec = dict(game_id=gid, url=f'https://lichess.org/{gid}#{p["ply"]}', color='white' if my_color else 'black', speed=g['speed'],
                    time_control=f'{base}+{inc}', ply=p['ply'], move_number=p['fm'], first_12_moves=p['fm'] <= 12, phase_lichess_division=div_ph,
                    phase_research=alib.phase(before), clock_left_s=p['clk'], time_spent_s=(round(p['spent'], 2) if p['spent'] is not None else None),
                    fen_before=before.fen(), move_san=p['san'], move_uci=p['uci'],
                    best_move_san=(before.san(chess.Move.from_uci(p['best'])) if p['best'] else None), best_move_uci=p['best'],
                    best_line_san=san_line(before, ln['best_line'] if ln else p['pv_before'], 8),
                    opponent_best_reply_line_san=san_line(after, ln['played_line'][1:] if ln else p['pv_after'], 7), long_lines=bool(ln),
                    eval_before=score_str(p['prev_s']), eval_after=score_str(p['cur_s']), eval_pov='white',
                    win_pct_before=round(wp_b, 1), win_pct_after=round(wp_a, 1), win_pct_drop=round(p['drop'], 1),
                    judgment=p['judgment'], lichess_judgment=p['lichess_judgment'],
                    lichess_eval_after=score_str(p['l_score']) if p['l_score'] else None,
                    category=cat, category_group=group, research_category=rcat,
                    hung_squares=[chess.square_name(s) for s in sorted(hang_sqs)] if rcat in ('hung_material_new', 'ignored_attacked_piece') else [],
                    engine_takes_flagged_piece=engine_takes_flagged,
                    material=dict(played_short=played_short, played_long=played_long, best_short=best_short, best_long=best_long),
                    opponent_mate_in=opp_mate_len,
                    threat_before=threat, threat_was_real=threat_real, threat_executed_next=threat_executed,
                    flags=dict(threw_away_win=(wp_b >= 75 and wp_a < 50), time_trouble=tt, moved_fast=(p['spent'] is not None and p['spent'] <= 2.0 and p['ply'] > 2),
                               something_to_defend=threat_real, pawn_lost_to_reply=(played_short == -1 and reply_is_capture), best_move_is_capture=(best_is_capture if p['best'] else None),
                               nothing_to_win=(threat_real and not best_is_capture and best_long <= 0 and my_mate_len is None)))
        all_moves.append(mrec)

os.makedirs(outdir, exist_ok=True)
with open(os.path.join(outdir, 'moves.jsonl'), 'w') as f:
    for m in all_moves: f.write(json.dumps(m) + '\n')
json.dump(game_rows, open(os.path.join(outdir, 'games.json'), 'w'), indent=1)
with open(os.path.join(outdir, 'opp_moves.jsonl'), 'w') as f:
    for m in opp_moves: f.write(json.dumps(m) + '\n')
print('games', len(game_rows), 'his moves', len(all_moves), file=sys.stderr)
