import sys, math, json, statistics, collections
import chess, chess.pgn

VAL = {chess.PAWN:1, chess.KNIGHT:3, chess.BISHOP:3, chess.ROOK:5, chess.QUEEN:9, chess.KING:100}
def winp(cp): return 50 + 50*(2/(1+math.exp(-0.00368208*cp))-1)
def wp_white(node, board):
    ev = node.eval()
    if ev is None:
        if board.is_checkmate():
            return 0.0 if board.turn == chess.WHITE else 100.0
        return None
    w = ev.white()
    if w.is_mate():
        return 100.0 if w.mate() > 0 else 0.0
    return winp(max(-1000, min(1000, w.score())))

def see(board, sq, side):
    """Static exchange gain for `side` capturing on sq (no x-rays). >0 means side wins material."""
    target = board.piece_at(sq)
    if target is None or target.color == side: return 0
    def atk(color):
        vs = []
        for s in board.attackers(color, sq):
            if board.is_pinned(color, s): continue
            vs.append(VAL[board.piece_type_at(s)])
        return sorted(vs)
    a = atk(side); d = atk(not side)
    if not a: return 0
    gain = [VAL[target.piece_type]]
    on_sq = a.pop(0); turn_lists = [d, a]; i = 0
    while True:
        lst = turn_lists[i % 2]
        if not lst: break
        gain.append(on_sq - gain[-1])
        on_sq = lst.pop(0); i += 1
    for k in range(len(gain)-1, 0, -1):
        gain[k-1] = -max(-gain[k-1], gain[k])
    return max(0, gain[0])

def hang_map(board, owner):
    """squares of owner's non-king pieces that the opponent wins >=2 by capturing"""
    res = {}
    for sq, pc in board.piece_map().items():
        if pc.color != owner or pc.piece_type == chess.KING: continue
        g = see(board, sq, not owner)
        if g >= 2: res[sq] = g
    return res

def speed(tc):
    try:
        b, inc = tc.split('+'); est = int(b) + 40*int(inc)
    except Exception: return 'other'
    if est < 29: return 'ultrabullet'
    if est < 179: return 'bullet'
    if est < 479: return 'blitz'
    if est < 1499: return 'rapid'
    return 'classical'

def phase(board):
    npm = sum(1 for p in board.piece_map().values() if p.piece_type not in (chess.PAWN, chess.KING))
    if npm <= 6: return 'endgame'
    if board.fullmove_number <= 12: return 'opening'
    return 'middlegame'

stats = collections.defaultdict(lambda: collections.Counter())
lists = collections.defaultdict(list)
f = open(sys.argv[1])
n = 0
while True:
    g = chess.pgn.read_game(f)
    if g is None: break
    h = g.headers
    band = h.get('Band'); sp = speed(h.get('TimeControl','-'))
    if sp not in ('blitz','rapid','classical'): continue
    if sp == 'classical': sp = 'rapid'  # few classical; pool with rapid as 'slow'
    key = (band, sp)
    try:
        base, inc = [int(x) for x in h['TimeControl'].split('+')]
    except Exception: continue
    board = g.board(); prev_wp = winp(20); node = g
    plies = []; ok = True
    clocks = {chess.WHITE: base, chess.BLACK: base}
    while node.variations:
        nxt = node.variations[0]; mv = nxt.move
        mover = board.turn
        before = board.copy(stack=False)
        ph = phase(before)
        threatened_before = hang_map(before, mover)
        opp_hang_before = hang_map(before, not mover)
        captured = before.piece_at(mv.to_square)
        cap_val = VAL[captured.piece_type] if captured else (1 if before.is_en_passant(mv) else 0)
        board.push(mv)
        w = wp_white(nxt, board)
        if w is None:
            ok = False; break
        clk = nxt.clock()
        spent = None
        if clk is not None:
            spent = clocks[mover] - clk + inc; clocks[mover] = clk
        before_m = prev_wp if mover == chess.WHITE else 100 - prev_wp
        after_m = w if mover == chess.WHITE else 100 - w
        drop = before_m - after_m
        hang_after = hang_map(board, mover)
        new_hang = {s:v for s,v in hang_after.items() if s not in threatened_before}
        kept_hang = {s:v for s,v in hang_after.items() if s in threatened_before}
        plies.append(dict(mover=mover, ph=ph, drop=drop, before=before_m, after=after_m, spent=spent, clk=clk,
                          fm=before.fullmove_number, new_hang=(max(new_hang.values())-cap_val if new_hang else 0),
                          kept_hang=(max(kept_hang.values()) if kept_hang else 0),
                          hang_sqs=set(hang_after), opp_free=(max(opp_hang_before.values()) if opp_hang_before else 0),
                          took=cap_val, mate_after=(nxt.eval() is not None and nxt.eval().pov(mover).is_mate() and nxt.eval().pov(mover).mate() < 0),
                          move=mv))
        prev_wp = w; node = nxt
    if not ok or len(plies) < 10: continue
    n += 1
    S = stats[key]; S['games'] += 1; S['player_games'] += 2
    res = h.get('Result')
    loser = chess.WHITE if res == '0-1' else chess.BLACK if res == '1-0' else None
    for i, p in enumerate(plies):
        S['moves'] += 1; S['moves_'+p['ph']] += 1
        S['drop_sum_'+p['ph']] += max(0, p['drop'])
        if p['spent'] is not None and p['spent'] >= 0:
            lists[key+('spent_all',)].append(p['spent'])
        if p['drop'] >= 15:
            S['blunders'] += 1; S['bl_'+p['ph']] += 1
            if p['spent'] is not None and p['spent'] >= 0: lists[key+('spent_bl',)].append(p['spent'])
            if p['clk'] is not None and p['clk'] < 0.1*base: S['bl_lowclock'] += 1
            # classification (mutually exclusive, in priority order)
            nxtp = plies[i+1] if i+1 < len(plies) else None
            if p['new_hang'] >= 2: cat = 'hung_material_new'
            elif p['kept_hang'] >= 2 and p['took'] < 2: cat = 'ignored_attacked_piece'
            elif p['mate_after']: cat = 'allowed_forced_mate'
            elif p['opp_free'] >= 2 and p['took'] < 2: cat = 'missed_free_material'
            else: cat = 'other_tactic_or_positional'
            S['cat_'+cat] += 1
            if p['drop'] >= 30:
                S['big_blunders'] += 1; S['big_'+p['ph']] += 1; S['bigcat_'+cat] += 1
                if p['clk'] is not None and p['clk'] < 0.1*base: S['big_lowclock'] += 1
                if p['spent'] is not None and p['spent'] >= 0: lists[key+('spent_big',)].append(p['spent'])
            if cat in ('hung_material_new','ignored_attacked_piece'):
                S['hang_bl'] += 1
                if nxtp is not None:
                    S['hang_bl_followed'] += 1
                    if nxtp['move'].to_square in p['hang_sqs'] and nxtp['took'] >= 1: S['hang_punished'] += 1
            if nxtp is not None:
                S['bl_followed'] += 1
                if nxtp['drop'] < 0.5*p['drop']: S['bl_punished'] += 1   # opponent kept at least half the gain
        if p['clk'] is not None and p['clk'] < 0.1*base:
            S['moves_lowclock'] += 1
    if loser is not None:
        S['decisive'] += 1
        lp = [p for p in plies if p['mover'] == loser]
        if lp:
            big = max(lp, key=lambda p: p['drop'])
            S['decider_'+big['ph']] += 1
            if big['drop'] >= 15:
                if big['new_hang'] >= 2 or (big['kept_hang'] >= 2 and big['took'] < 2): S['decider_hang'] += 1
        # loser already clearly worse (<25% win) after move 12?
        p24 = [p for p in plies if p['fm'] <= 12]
        if len(p24) >= 24:
            lw = p24[-1]['after'] if p24[-1]['mover'] == loser else 100 - p24[-1]['after']
            S['dec_reach12'] += 1
            if lw < 25: S['loser_lost_by12'] += 1
            if lw > 75: S['loser_winning_at12'] += 1
            if lw >= 50: S['loser_equal_or_better_at12'] += 1
out = {}
for key, S in sorted(stats.items(), key=lambda kv: str(kv[0])):
    d = dict(S)
    for t in ('spent_all','spent_bl','spent_big'):
        L = lists[key+(t,)]
        if L: d['median_'+t] = statistics.median(L); d['mean_'+t] = round(sum(L)/len(L),1)
    out['|'.join(key)] = d
print(json.dumps(out, indent=1))
print('analysed', n, file=sys.stderr)
