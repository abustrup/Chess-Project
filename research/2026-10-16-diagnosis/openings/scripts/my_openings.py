"""The owner's own games: where did each game leave the app's course, and how did the first 12 moves go?

Usage: .venv/bin/python -I my_openings.py GAMES.pgn COURSES.json OUT.json [DEPTH]
GAMES.pgn: Lichess export of user abustrup (api/games/user/abustrup?clocks=true&evals=true&opening=true)
COURSES.json: output of export_courses.ts
Engine: Stockfish 19, Threads 2, fixed depth (default 18), every position up to ply 30 (move 15).
Blunder rule as Lichess: the mover's winning chance (0-100, Lichess formula) drops by >= 15; 'big' >= 30.
Output has no opponent usernames.
"""
import sys, json, math, collections
import chess, chess.pgn, chess.engine
sys.path.insert(0, '/Users/alexanderbustrup/Chess-Project/research/2026-10-16/coaching_lens')
from analyse_lib import hang_map  # static-exchange test for pieces that can be won

games_path, courses_path, out_path = sys.argv[1:4]
DEPTH = int(sys.argv[4]) if len(sys.argv) > 4 else 18
ME = 'abustrup'
MAXPLY = 30

def k3(fen): return ' '.join(fen.split(' ')[:3])
def winp(cp): return 50 + 50 * (2 / (1 + math.exp(-0.00368208 * cp)) - 1)
def wp_white(score):
    w = score.white()
    if w.is_mate(): return 100.0 if w.mate() > 0 else 0.0
    return winp(max(-1000, min(1000, w.score())))

courses = json.load(open(courses_path))
# per course: position(before) -> set of moves in any chapter; position -> chapters containing it
moves_at = {}; chapters_at = {}
for c in courses:
    m = collections.defaultdict(set); chs = collections.defaultdict(set)
    for ch in c['chapters']:
        for n in ch['nodes']:
            m[k3(n['before'])].add(n['san']); chs[k3(n['after'])].add(ch['id'])
    moves_at[c['id']] = m; chapters_at[c['id']] = chs

eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
eng.configure({'Threads': 2, 'Hash': 128})
res = []
with open(games_path) as fh:
    while True:
        g = chess.pgn.read_game(fh)
        if g is None: break
        h = g.headers
        me_white = h['White'].lower() == ME
        color = chess.WHITE if me_white else chess.BLACK
        sans = []; b = g.board(); boards = [b.copy()]
        for mv in g.mainline_moves():
            sans.append(b.san(mv)); b.push(mv); boards.append(b.copy())
        first = sans[0] if sans else ''
        if me_white: course = 'london'
        elif first == 'e4': course = 'caro-kann'
        elif first == 'd4': course = 'slav'
        else: course = None
        # course following
        left_ply = None; left_by = None; left_move = None; chap_hits = collections.Counter()
        if course:
            for i, san in enumerate(sans[:MAXPLY]):
                pos = k3(boards[i].fen())
                if san not in moves_at[course].get(pos, set()):
                    # transposition: resulting position is a course position
                    if k3(boards[i + 1].fen()) in chapters_at[course]:
                        for c_ in chapters_at[course][k3(boards[i + 1].fen())]: chap_hits[c_] += 1
                        continue
                    left_ply = i + 1; left_move = san
                    left_by = 'me' if boards[i].turn == color else 'opponent'
                    break
                for c_ in chapters_at[course].get(k3(boards[i + 1].fen()), ()): chap_hits[c_] += 1
            if left_ply is None: left_ply = min(len(sans), MAXPLY) + 1; left_by = 'never (to move 15)'
        # engine pass to ply MAXPLY
        wps = []
        for i in range(min(len(sans), MAXPLY) + 1):
            bd = boards[i]
            if bd.is_game_over():
                wps.append(0.0 if bd.is_checkmate() and bd.turn == chess.WHITE else 100.0 if bd.is_checkmate() else 50.0); break
            info = eng.analyse(bd, chess.engine.Limit(depth=DEPTH))
            wps.append(wp_white(info['score']))
        mine = []
        for i in range(1, len(wps)):
            mover = boards[i - 1].turn
            before = wps[i - 1] if mover == chess.WHITE else 100 - wps[i - 1]
            after = wps[i] if mover == chess.WHITE else 100 - wps[i]
            drop = before - after
            if mover == color and drop >= 15:
                hang = hang_map(boards[i], mover)
                mine.append({'ply': i, 'move_no': boards[i - 1].fullmove_number, 'san': sans[i - 1], 'drop': round(drop, 1),
                             'big': drop >= 30, 'hangs_after': bool(hang), 'in_course': (left_ply is not None and i < left_ply)})
        my_wp = [round(w if color == chess.WHITE else 100 - w, 1) for w in wps]
        result = h['Result']; score = 1.0 if (result == '1-0') == me_white and result != '1/2-1/2' else 0.5 if result == '1/2-1/2' else 0.0
        has_lichess_eval = any(n.eval() is not None for n in g.mainline())
        res.append({'date': h['UTCDate'], 'tc': h['TimeControl'], 'color': 'white' if me_white else 'black',
                    'my_rating': int(h['WhiteElo' if me_white else 'BlackElo']), 'opp_rating': int(h['BlackElo' if me_white else 'WhiteElo']),
                    'score': score, 'termination': h.get('Termination'), 'opening': h.get('Opening'), 'eco': h.get('ECO'),
                    'moves_24': sans[:24], 'n_plies': len(sans), 'course': course, 'left_course_ply': left_ply, 'left_by': left_by,
                    'left_move': left_move, 'chapters_touched': chap_hits.most_common(3),
                    'my_wp_by_ply': my_wp, 'my_wp_after_move12': my_wp[24] if len(my_wp) > 24 else my_wp[-1],
                    'my_blunders_to_move15': mine, 'lichess_analysis': has_lichess_eval, 'site_game_id': h['Site'].rsplit('/', 1)[-1]})
        print(h['UTCDate'], res[-1]['color'], course, 'left', left_ply, left_by, left_move, 'wp12', res[-1]['my_wp_after_move12'], 'bl', [(x['move_no'], x['san'], x['drop']) for x in mine], 'score', score, flush=True)
eng.quit()
json.dump(res, open(out_path, 'w'), indent=1)
