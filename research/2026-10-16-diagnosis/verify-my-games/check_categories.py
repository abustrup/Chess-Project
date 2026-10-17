"""Spot-check the safety categories in mistakes.json with the independent depth-16 engine rows.
hung_piece: opponent's best reply (our engine) is a capture and, along our PV (<=6 plies, even), he ends 2+ points
down compared with before his move. ignored_threat: the null-move threat existed before his move (our engine) and
the opponent's reply equals the threat move. Prints each case for a human read-through."""
import json, sys, chess, collections
sys.path.insert(0, '.')
from vanalyse import norm_mine, material, threat_info
data = norm_mine(['eng_w0.jsonl', 'eng_w1.jsonl'])
games = {json.loads(l)['id']: json.loads(l) for l in open('../my-games/lichess_abustrup.ndjson')}
m = json.load(open('../my-games/mistakes.json'))['mistakes']
res = collections.Counter()
for r in m:
    if r['judgment'] != 'Blunder' or r['category'] not in ('hung_piece', 'ignored_threat', 'allowed_short_mate'): continue
    rows = data[r['game_id']]; k = r['ply']  # row k = position after ply k = after his move
    before = rows[k - 1]; after = rows[k]
    b0 = chess.Board(before['fen']); me = b0.turn
    m0 = material(b0, me) - material(b0, not me)
    b = chess.Board(after['fen'])
    pv = after.get('pv') or []
    first_is_capture = bool(pv) and b.is_capture(chess.Move.from_uci(pv[0]))
    kk = min(len(pv), 6)
    if kk % 2 == 0 and kk > 0: kk -= 1  # end after the opponent's move? keep odd so his reply... use even after his reply below
    # end after HIS reply: plies opp,me,opp,me -> even count
    kk = min(len(pv), 6); kk -= kk % 2
    bb = b.copy()
    for u in pv[:kk]: bb.push(chess.Move.from_uci(u))
    m1 = material(bb, me) - material(bb, not me)
    mate = 'mate' in after and ((after['mate'] < 0) == (me == chess.WHITE))
    nextply = rows[k].get('played')
    if r['category'] == 'hung_piece':
        ok = first_is_capture and (m0 - m1 >= 2)
    elif r['category'] == 'ignored_threat':
        ti = threat_info(before)
        npv = before.get('null_pv') or []
        ok = ti is not None and ti[0] >= 15 and (ti[1] >= 2 or ti[2]) and bool(npv) and nextply == npv[0]
    else:
        ok = mate and abs(after['mate']) <= 3
    res[(r['category'], ok)] += 1
    print(r['category'], 'CONFIRMED' if ok else 'NOT CONFIRMED', r['game_id'], 'ply', k, r['move_san'],
          '| our reply PV:', ' '.join(pv[:4]), '| material swing for him', m1 - m0, '| opp next move', nextply,
          '| claimed opp line:', r['opponent_best_reply_line_san'])
print(dict(res))
