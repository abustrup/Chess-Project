"""Integrity check of the Maia test's inputs against Lichess itself (verify-rating pass, 2026-10-16).
1. Re-downloads every scored game by id (POST /api/games/export/_ids, 300 ids per request) and checks that the
   target player is in the game, that the stored 'truth' rating equals the rating Lichess shows for that player in
   that game, and that rated games are rated and computer games are unrated games against Lichess AI.
2. For a random sample of games, rebuilds the list of positions where the target had a choice (python-chess, written
   here) and writes them for v_maia_rescore.mjs, which scores them with Maia-3 again so the stored log-likelihoods
   can be compared.
Usage: python v_games_check.py <rated_ll.ndjson> <ai_ll.ndjson> <out_check.json> <out_items.json> <n_sample>"""
import sys, json, random, time, urllib.request
import chess

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
rated = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
ai = [json.loads(l) for l in open(sys.argv[2]) if l.strip()]
stored = {r['id']: ('rated', r) for r in rated}
for r in ai: stored[r['id']] = ('ai', r)
ids = list(stored)
fetched = {}
for s in range(0, len(ids), 300):
    req = urllib.request.Request('https://lichess.org/api/games/export/_ids?moves=true&clocks=false&evals=false&opening=false',
                                 data=','.join(ids[s:s + 300]).encode(), headers={'User-Agent': UA, 'Accept': 'application/x-ndjson', 'Content-Type': 'text/plain'})
    for line in urllib.request.urlopen(req, timeout=120).read().decode().splitlines():
        if line.strip():
            g = json.loads(line); fetched[g['id']] = g
    time.sleep(2)
problems = []
checked = {'rated': 0, 'ai': 0}
for gid, (kind, r) in stored.items():
    g = fetched.get(gid)
    if not g: problems.append((gid, 'not returned')); continue
    side = None
    for c in ('white', 'black'):
        u = (g['players'][c].get('user') or {}).get('name', '')
        if u.lower() == r['target'].lower(): side = c
    if side is None: problems.append((gid, 'target not in game')); continue
    checked[kind] += 1
    if kind == 'rated':
        if not g.get('rated'): problems.append((gid, 'not rated'))
        if g['players'][side]['rating'] != r['rating']: problems.append((gid, f"rating {g['players'][side]['rating']} vs stored {r['rating']}"))
        if g.get('speed') != r.get('perf'): problems.append((gid, f"speed {g.get('speed')} vs perf {r.get('perf')}"))
    else:
        other = 'black' if side == 'white' else 'white'
        if g.get('rated') or 'aiLevel' not in g['players'][other]: problems.append((gid, 'not an unrated game vs Lichess AI'))
# sample for re-scoring
rnd = random.Random(16)
sample = rnd.sample(rated, int(sys.argv[5]))
items_out = []
for r in sample:
    g = fetched[r['id']]
    side = chess.WHITE if (g['players']['white'].get('user') or {}).get('name', '').lower() == r['target'].lower() else chess.BLACK
    b = chess.Board(); items = []
    for san in g['moves'].split():
        mv = b.parse_san(san)
        if b.turn == side and b.legal_moves.count() > 1:
            items.append({'fen': b.fen(), 'uci': mv.uci()})
        b.push(mv)
    items_out.append({'id': r['id'], 'stored_ll': r['ll'], 'stored_grid': r['grid'], 'stored_nMoves': r['nMoves'], 'items': items})
json.dump(items_out, open(sys.argv[4], 'w'))
rep = {'games_stored': len(stored), 'games_returned_by_lichess': len(fetched), 'checked': checked, 'problems': problems[:50], 'n_problems': len(problems),
       'sample_for_rescoring': [x['id'] for x in items_out]}
json.dump(rep, open(sys.argv[3], 'w'), indent=1)
print(json.dumps(rep, indent=1)[:3000])
