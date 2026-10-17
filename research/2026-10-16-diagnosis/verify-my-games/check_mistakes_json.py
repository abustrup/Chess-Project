"""Check mistakes.json against an independent replay of the raw games: FEN, side, move, counts."""
import json, collections, chess, random
games = {json.loads(l)['id']: json.loads(l) for l in open('../my-games/lichess_abustrup.ndjson')}
m = json.load(open('../my-games/mistakes.json'))['mistakes']
bad = []
cnt = collections.Counter(r['judgment'] for r in m)
src = collections.Counter(r['source'] for r in m)
for r in m:
    g = games[r['game_id']]; sans = g['moves'].split()
    b = chess.Board()
    for s in sans[:r['ply'] - 1]: b.push_san(s)
    me_white = g['players']['white']['user']['id'] == 'abustrup'
    ok = (b.fen() == r['fen_before'] and sans[r['ply'] - 1] == r['move_san'] and (b.turn == chess.WHITE) == me_white
          and r['color'] == ('white' if me_white else 'black'))
    if not ok: bad.append((r['game_id'], r['ply']))
print('records', len(m), dict(cnt), dict(src))
print('FEN/move/colour mismatches:', bad)
bl = [r for r in m if r['judgment'] == 'Blunder']
print('blunders', len(bl), 'big (drop>=30)', sum(1 for r in bl if r['win_pct_drop'] >= 30),
      'big in first 12', sum(1 for r in bl if r['win_pct_drop'] >= 30 and r['first_12_moves']))
print('blunder categories', collections.Counter(r['category'] for r in bl))
print('something_to_defend', sum(1 for r in bl if r['flags']['something_to_defend']),
      'nothing_to_win', sum(1 for r in bl if r['flags']['nothing_to_win']))
