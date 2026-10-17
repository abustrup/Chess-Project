"""The 10 'ignored_threat' ('opponent's threat carried out') blunders: did the threat exist before his move
(my depth-16 null-move test), is it the engine's best reply after his move, and did the opponent actually play it?"""
import json, sys, chess
sys.path.insert(0, '.')
from vanalyse import norm_mine, threat_info
data = norm_mine(['eng_w0.jsonl', 'eng_w1.jsonl'])
m = json.load(open('../my-games/mistakes.json'))['mistakes']
n = ex = best = played = 0
for r in m:
    if r['judgment'] != 'Blunder' or r['category'] != 'ignored_threat': continue
    rows = data[r['game_id']]; k = r['ply']
    before, after = rows[k - 1], rows[k]
    ti = threat_info(before); npv = before.get('null_pv') or []
    real = ti is not None and ti[0] >= 15 and (ti[1] >= 2 or ti[2])
    tmove = npv[0] if npv else None
    eb = (after.get('pv') or [None])[0] == tmove
    op = after.get('played') == tmove
    n += 1; ex += real; best += eb; played += op
    print(r['game_id'], 'ply', k, r['move_san'], '| threat', tmove, 'real(d16)=', real,
          f'(drop {ti[0]:.0f}, gain {ti[1]})' if ti else '', '| engine best reply = threat:', eb, '| opponent actually played it:', op)
print(f'{n} records: threat real by my test {ex}, engine best reply is the threat {best}, opponent actually played it {played}')
