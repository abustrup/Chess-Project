# Per-move diagnosis of the owner's own moves, ported line for line from
# research/2026-10-16-diagnosis/my-games/scripts/analyse_games.py (the script that wrote mistakes.json and moves.jsonl),
# so new games get exactly the same judgement, threat test, categories and flags as the 31 blitz games of 2026-10-16.
# check_cards.py --diagnosis compares this port with moves.jsonl on all 891 moves.
# The static-exchange helpers below are copied unchanged from research/2026-10-16/coaching_lens/analyse_lib.py.
import os, sys, importlib.util
import chess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
_RULE = os.path.join(ROOT, 'research', '2026-10-16-diagnosis', 'prereg', 'lichess_rule.py')   # hashed, read only
_spec = importlib.util.spec_from_file_location('prereg_lichess_rule', _RULE)
rule = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(rule)
lichess_judgment, lichess_api_score, wp_mover, START = rule.lichess_judgment, rule.lichess_api_score, rule.wp_mover, rule.START

VAL = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0}
SEE_VAL = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 100}
OWN_CATEGORIES = ('hung_piece', 'ignored_threat', 'allowed_short_mate', 'allowed_longer_tactic', 'missed_free_material',
                  'missed_own_tactic', 'missed_short_mate')


# --- research/2026-10-16 static exchange helpers (unchanged) ---------------------------------------------------------
def see(board, sq, side):
    """Static exchange gain for `side` capturing on sq (no x-rays). >0 means side wins material."""
    target = board.piece_at(sq)
    if target is None or target.color == side: return 0
    def atk(color):
        vs = []
        for s in board.attackers(color, sq):
            if board.is_pinned(color, s): continue
            vs.append(SEE_VAL[board.piece_type_at(s)])
        return sorted(vs)
    a = atk(side); d = atk(not side)
    if not a: return 0
    gain = [SEE_VAL[target.piece_type]]
    on_sq = a.pop(0); turn_lists = [d, a]; i = 0
    while True:
        lst = turn_lists[i % 2]
        if not lst: break
        gain.append(on_sq - gain[-1])
        on_sq = lst.pop(0); i += 1
    for k in range(len(gain) - 1, 0, -1):
        gain[k - 1] = -max(-gain[k - 1], gain[k])
    return max(0, gain[0])


def hang_map(board, owner):
    """squares of owner's non-king pieces that the opponent wins >=2 by capturing"""
    res = {}
    for sq, pc in board.piece_map().items():
        if pc.color != owner or pc.piece_type == chess.KING: continue
        g = see(board, sq, not owner)
        if g >= 2: res[sq] = g
    return res


def phase(board):
    npm = sum(1 for p in board.piece_map().values() if p.piece_type not in (chess.PAWN, chess.KING))
    if npm <= 6: return 'endgame'
    if board.fullmove_number <= 12: return 'opening'
    return 'middlegame'


# --- analyse_games.py helpers (unchanged) ----------------------------------------------------------------------------
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


def score_str(s):
    if s is None: return None
    if 'mate' in s: return f"#{s['mate']}"
    return f"{s['cp']/100:+.2f}"


def my_pov(s, white):
    if 'mate' in s:
        m = s['mate']; return {'mate': (m if white else -m)}
    return {'cp': s['cp'] if white else -s['cp']}


def is_me(player, user):
    return ((player or {}).get('user') or {}).get('id') == user


def line_targets(g, sf, user):
    """lines.py: his judged moves (ours or Lichess's Blunder/Mistake) whose printed PV, before or after, is under 6 plies.
    Returns [(ply, fen_before, uci)]; the 8-ply lines for these are built by sequential searches."""
    me_white = is_me(g['players']['white'], user)
    b = chess.Board(); sans = g['moves'].split(); lich = g.get('analysis') or []; out = []
    for i, san in enumerate(sans):
        mv = b.parse_san(san); mover_white = b.turn == chess.WHITE
        if mover_white == me_white:
            prev = START if i == 0 else sf[i]['score']
            j, _ = lichess_judgment(prev, sf[i + 1]['score'], mover_white, played_is_best=(sf[i].get('best') == mv.uci()))
            lj = lich[i].get('judgment', {}).get('name') if i < len(lich) else None
            short = len(sf[i].get('pv', [])) < 6 or len(sf[i + 1].get('pv', [])) < 6
            if (j in ('Blunder', 'Mistake') or lj in ('Blunder', 'Mistake')) and short:
                out.append((i + 1, b.fen(), mv.uci()))
        b.push(mv)
    return out


def classify_game(g, sf, lines, user):
    """One record per move he played, with the fields of moves.jsonl that the card builder needs.
    g: Lichess export row; sf: the game's measurement positions (engine_eval.py / measure.py format);
    lines: {ply: {'played_line': [...], 'best_line': [...]}} for this game."""
    me_white = is_me(g['players']['white'], user)
    my_color = chess.WHITE if me_white else chess.BLACK
    tc = g['clock']; base, inc = tc['initial'], tc['increment']
    sans = g['moves'].split()
    clocks = g.get('clocks', [])
    lich = g.get('analysis')
    b = chess.Board()
    prev_clock = {chess.WHITE: base * 100, chess.BLACK: base * 100}
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
        lj = None; l_score = None
        if lich and i < len(lich):
            lj = lich[i].get('judgment', {}).get('name'); l_score = lichess_api_score(lich[i])
        clk = clocks[i] / 100 if i < len(clocks) else None
        spent = None
        clock_before = prev_clock[mover] / 100 if clk is not None else None   # card builder only: time left when he faced the position
        if clk is not None:
            spent = (prev_clock[mover] - clocks[i]) / 100 + inc
            prev_clock[mover] = clocks[i]
            if ply <= 2: spent = 0.0  # Lichess does not run the clock for each side's first move
        b.push(mv)
        plies.append(dict(ply=ply, fm=before.fullmove_number, mover_is_me=(mover == my_color), san=san, uci=mv.uci(), judgment=j,
                          drop=drop, lichess_judgment=lj, clk=clk, clock_before=clock_before, spent=spent, before=before,
                          after=b.copy(stack=False), prev_s=prev_s, cur_s=cur_s, best=best, pv_before=pos_before.get('pv', []),
                          pv_after=pos_after.get('pv', []), null=pos_before.get('null'), l_score=l_score))

    out = []
    for idx, p in enumerate(plies):
        if not p['mover_is_me']: continue
        before, after = p['before'], p['after']; mv = chess.Move.from_uci(p['uci'])
        thr = hang_map(before, my_color); oppfree = hang_map(before, not my_color)
        cap = before.piece_at(mv.to_square)
        cap_val = SEE_VAL[cap.piece_type] if cap else (1 if before.is_en_passant(mv) else 0)
        ha = hang_map(after, my_color)
        new = {s: v for s, v in ha.items() if s not in thr}; kept = {s: v for s, v in ha.items() if s in thr}
        nh = (max(new.values()) - cap_val) if new else 0; kh = max(kept.values()) if kept else 0
        mate_after = 'mate' in p['cur_s'] and p['cur_s']['mate'] != 0 and ((p['cur_s']['mate'] > 0) != (my_color == chess.WHITE))
        if nh >= 2: rcat = 'hung_material_new'
        elif kh >= 2 and cap_val < 2: rcat = 'ignored_attacked_piece'
        elif mate_after: rcat = 'allowed_forced_mate'
        elif (max(oppfree.values()) if oppfree else 0) >= 2 and cap_val < 2: rcat = 'missed_free_material'
        else: rcat = 'other_tactic_or_positional'
        mat_before = material(before, my_color)
        ln = lines.get(p['ply'])
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
        best_is_capture = bool(p['best']) and before.is_capture(chess.Move.from_uci(p['best']))
        prev_my = my_pov(p['prev_s'], my_color == chess.WHITE); cur_my = my_pov(p['cur_s'], my_color == chess.WHITE)
        opp_mate_len = (-cur_my['mate']) if ('mate' in cur_my and cur_my['mate'] < 0) else None
        my_mate_len = prev_my['mate'] if ('mate' in prev_my and prev_my['mate'] > 0) else None
        already_mated = 'mate' in prev_my and prev_my['mate'] < 0
        threat = None
        if p['null'] is not None:
            ns = p['null']['score']; wp_null = wp_mover(ns, my_color == chess.WHITE)
            wp_now = wp_mover(p['prev_s'], my_color == chess.WHITE)
            tmove = p['null']['best']
            tsan = None
            if tmove:
                nb = before.copy(stack=False); nb.push(chess.Move.null())
                try: tsan = nb.san(chess.Move.from_uci(tmove))
                except Exception: tsan = tmove
            nb2 = before.copy(stack=False); nb2.push(chess.Move.null())
            npath = [material(before, my_color)] + pv_material_path(nb2, p['null'].get('pv', []), my_color, 6)
            nloss = mat_before - sorted(npath[-3:])[len(npath[-3:]) // 2] if len(npath) >= 3 else mat_before - min(npath)
            nmate = 'mate' in ns and ((ns['mate'] > 0) != (my_color == chess.WHITE))
            threat = dict(size=round(wp_now - wp_null, 1), move=tmove, san=tsan, score=score_str(my_pov(ns, my_color == chess.WHITE)),
                          line_san=san_line(nb2, p['null'].get('pv', []), 6), material_threatened=nloss, mate_threatened=nmate)
        threat_real = threat is not None and threat['size'] >= 15 and (threat['material_threatened'] >= 2 or threat['mate_threatened'])
        threat_executed = threat_real and reply is not None and threat['move'] is not None and (
            reply == threat['move'] or (reply_is_capture and chess.Move.from_uci(reply).to_square == chess.Move.from_uci(threat['move']).to_square))
        wp_b = wp_mover(p['prev_s'], my_color == chess.WHITE); wp_a = wp_mover(p['cur_s'], my_color == chess.WHITE)
        if opp_mate_len is not None and opp_mate_len <= 3 and not already_mated:
            cat = 'allowed_short_mate'
        elif played_short <= -2 and reply_is_capture:
            cat = 'hung_piece'
        elif threat_executed:
            cat = 'ignored_threat'
        elif my_mate_len is not None and my_mate_len <= 3:
            cat = 'missed_short_mate'
        elif best_is_capture and best_short - played_short >= 2:
            cat = 'missed_free_material'
        elif opp_mate_len is not None or played_long <= -2:
            cat = 'allowed_longer_tactic'
        elif my_mate_len is not None or best_long - played_long >= 2:
            cat = 'missed_own_tactic'
        elif p['fm'] <= 12:
            cat = 'opening_positional'
        else:
            cat = 'positional_or_endgame'
        out.append(dict(
            game_id=g['id'], ply=p['ply'], move_number=p['fm'], fen_before=before.fen(), move_san=p['san'], move_uci=p['uci'],
            phase_research=phase(before), clock_left_s=p['clk'], clock_before_s=p['clock_before'],
            time_spent_s=(round(p['spent'], 2) if p['spent'] is not None else None),
            prev_s=p['prev_s'], cur_s=p['cur_s'], best_move_uci=p['best'], pv_before=p['pv_before'], pv_after=p['pv_after'],
            null=p['null'], lichess_score_after=p['l_score'],
            lichess_score_before=(START if idx == 0 else plies[idx - 1]['l_score']) if lich else None,
            win_pct_before=round(wp_b, 1), win_pct_after=round(wp_a, 1), win_pct_drop=round(p['drop'], 1),
            judgment=p['judgment'], lichess_judgment=p['lichess_judgment'], category=cat, research_category=rcat,
            material=dict(played_short=played_short, played_long=played_long, best_short=best_short, best_long=best_long),
            opponent_mate_in=opp_mate_len, threat_before=threat, threat_was_real=threat_real, threat_executed_next=threat_executed,
            long_line=ln,
            flags=dict(threw_away_win=(wp_b >= 75 and wp_a < 50), something_to_defend=threat_real,
                       best_move_is_capture=(best_is_capture if p['best'] else None),
                       nothing_to_win=(threat_real and not best_is_capture and best_long <= 0 and my_mate_len is None))))
    return out
