"""Verifier: his own 31 Lichess games, re-analysed independently (2026-10-16).

Usage: .venv/bin/python -I v_my_games.py GAMES.pgn COURSE_PGN.json OUT.json DEPTH
- Engine: Stockfish 19 at /opt/homebrew/bin/stockfish, Threads 2, Hash 64, fixed DEPTH (the investigation used 14).
- Every position from ply 0 to ply 30 (or game end).
- Winning chance: Lichess formula 50 + 50*(2/(1+exp(-0.00368208*cp)) - 1), cp clipped to +-1000, mate = 0/100.
- 'After move 12' = after ply 24 (Black's 12th move). Games that ended earlier are reported separately, with the
  value at the final position (checkmate/resignation/flag), so the reader sees how they are counted.
- Lichess's own [%eval] is used too where the game was analysed on Lichess.
- Course membership uses my own parser (v_courses.py): a move is 'in course' if any chapter gives it at that
  position, or if the position after it occurs in any chapter (transposition).
Output has no opponent names and no game links.
"""
import sys, json, math, time
import chess, chess.pgn, chess.engine
sys.path.insert(0, __import__('os').path.dirname(__file__))
from v_courses import load_courses, key

games_path, course_path, out_path, DEPTH = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
ME = 'abustrup'
C = load_courses(course_path)

def wp_cp(cp): return 50 + 50 * (2 / (1 + math.exp(-0.00368208 * max(-1000, min(1000, cp)))) - 1)
def wp_white_score(sc):
    w = sc.white()
    if w.is_mate(): return 100.0 if w.mate() > 0 else 0.0
    return wp_cp(w.score())

eng = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
eng.configure({'Threads': 2, 'Hash': 64})
rows = []
t0 = time.time()
with open(games_path) as fh:
    while True:
        g = chess.pgn.read_game(fh)
        if g is None: break
        h = g.headers
        white = h['White'].lower() == ME
        col = chess.WHITE if white else chess.BLACK
        b = g.board(); boards = [b.copy()]; sans = []; lich = [None]
        for node in g.mainline():
            sans.append(b.san(node.move)); b.push(node.move); boards.append(b.copy())
            e = node.eval()
            lich.append(None if e is None else (100.0 if e.white().is_mate() and e.white().mate() > 0 else 0.0 if e.white().is_mate() else wp_cp(e.white().score())))
        if white: course = 'london'
        elif sans and sans[0] == 'e4': course = 'caro-kann'
        elif sans and sans[0] == 'd4': course = 'slav'
        else: course = None
        # course leaving (strict: position-based)
        left = None
        if course:
            X = C[course]
            start = 0 if course == 'london' else 1
            for i in range(start, min(len(sans), 30)):
                kb = key(boards[i]); ka = key(boards[i + 1])
                if sans[i] in X['pos_moves'].get(kb, set()) or ka in X['pos_in']:
                    continue
                left = {'ply': i + 1, 'move_no': boards[i].fullmove_number, 'san': sans[i], 'by': 'me' if boards[i].turn == col else 'opponent'}
                break
            if left is None: left = {'ply': None, 'by': 'never to move 15'}
        # engine
        wps = []
        last = min(len(sans), 30)
        for i in range(last + 1):
            bd = boards[i]
            if bd.is_checkmate(): wps.append(0.0 if bd.turn == chess.WHITE else 100.0); continue
            if bd.is_game_over(): wps.append(50.0); continue
            info = eng.analyse(bd, chess.engine.Limit(depth=DEPTH))
            wps.append(wp_white_score(info['score']))
        mine = [w if white else 100 - w for w in wps]
        mine_l = [None if x is None else (x if white else 100 - x) for x in lich[:last + 1]]
        drops = []
        for i in range(1, len(mine)):
            if boards[i - 1].turn == col:
                d = mine[i - 1] - mine[i]
                if d >= 15: drops.append({'ply': i, 'move_no': boards[i - 1].fullmove_number, 'san': sans[i - 1], 'drop': round(d, 1)})
        res = h['Result']
        score = 0.5 if res == '1/2-1/2' else 1.0 if (res == '1-0') == white else 0.0
        after12 = mine[24] if len(mine) > 24 else None
        rows.append({'date': h['UTCDate'] + ' ' + h['UTCTime'], 'tc': h['TimeControl'], 'colour': 'white' if white else 'black',
                     'score': score, 'plies': len(sans), 'termination': h.get('Termination'), 'first_moves': ' '.join(sans[:8]),
                     'course': course, 'left_course': left,
                     'my_wp_after_ply24': None if after12 is None else round(after12, 1),
                     'ended_before_ply24_final_wp': None if after12 is not None else round(mine[-1], 1),
                     'lichess_wp_after_ply24': None if len(mine_l) <= 24 or mine_l[24] is None else round(mine_l[24], 1),
                     'drops_15_by_me_to_move15': drops, 'my_wp_by_ply': [round(x, 1) for x in mine]})
        print(f"{rows[-1]['date']} {rows[-1]['colour']} {score} plies {len(sans)} wp24 {rows[-1]['my_wp_after_ply24']} early {rows[-1]['ended_before_ply24_final_wp']} lich24 {rows[-1]['lichess_wp_after_ply24']} left {left} drops {[(d['move_no'], d['san'], d['drop']) for d in drops]}  t={time.time()-t0:.0f}s", flush=True)
eng.quit()
json.dump(rows, open(out_path, 'w'), indent=1)
