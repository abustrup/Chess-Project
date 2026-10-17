"""Line ends where you must react (O1 verifier, 2026-10-16).

A drill line can stop in a position where the opponent's last move left a threat: a piece attacked twice, a pin, a
pawn about to be won. If the comment there does not say what to do, a learner may play a quiet move and lose
material. This test asks, at every line end where you are to move, "what if you ignore the position?": Stockfish
searches the position as it is, and again with your turn skipped (a null move). A big difference means a threat.
Each such line end is printed with its comment, so a person can check that the comment says what to do.

Run from the repo root (about 5 minutes on a quiet Mac, 1 engine process, 1 thread):
    .venv/bin/python -I research/2026-10-16-diagnosis/openings-v2/scripts/line_end_threats.py [--nodes 800000] [--min-cp 150]
On 2026-10-16, after the second check's text fixes, 22 of 146 line ends were printed and every one says what to do.
Results near the threshold can differ a little between runs. Exit code is always 0: reading the comments is a
person's job.
"""
import argparse, io, json, re, subprocess
import chess, chess.engine, chess.pgn

ap = argparse.ArgumentParser()
ap.add_argument('--engine', default='/opt/homebrew/bin/stockfish')
ap.add_argument('--nodes', type=int, default=800_000)
ap.add_argument('--min-cp', type=int, default=150)
a = ap.parse_args()

courses = json.loads(subprocess.run(
    ['npx', 'tsx', '-e', "import { OPENING_COURSES } from './src/data/openings'; process.stdout.write(JSON.stringify(OPENING_COURSES))"],
    check=True, capture_output=True, text=True).stdout)

ends = {}
for c in courses:
    side = chess.WHITE if c['side'] == 'white' else chess.BLACK
    for ch in c['chapters']:
        stack = [(chess.pgn.read_game(io.StringIO(ch['pgn'])), [])]
        while stack:
            node, sans = stack.pop()
            b = node.board()
            for k in node.variations:
                stack.append((k, sans + [b.san(k.move)]))
            if not node.variations and b.turn == side:
                text = re.sub(r'\[%c(al|sl)[^\]]*\]', '', node.comment).strip()
                ends.setdefault(b.epd(), (f"{c['id']}/{ch['id']}", ' '.join(sans), b.fen(), text, side))

eng = chess.engine.SimpleEngine.popen_uci(a.engine)
eng.configure({'Threads': 1, 'Hash': 64})
limit = chess.engine.Limit(nodes=a.nodes)
found = []
for where, line, fen, text, side in ends.values():
    b = chess.Board(fen)
    best = eng.analyse(b, limit)
    best_cp = best['score'].pov(side).score(mate_score=10000)
    if b.is_check():
        found.append((10**6, where, line, f"you are in check; best {b.san(best['pv'][0])}", text))
        continue
    skipped = b.copy()
    skipped.push(chess.Move.null())
    r = eng.analyse(skipped, limit)
    if_ignored = r['score'].pov(side).score(mate_score=10000)
    if best_cp - if_ignored >= a.min_cp:
        found.append((best_cp - if_ignored, where, line,
                      f"best {b.san(best['pv'][0])} {best_cp} cp; if you ignore it, {skipped.san(r['pv'][0])} -> {if_ignored} cp", text))
eng.quit()

print(f'Line ends with you to move: {len(ends)}. With a threat worth {a.min_cp} cp or more if ignored (or a check): {len(found)}.')
for size, where, line, what, text in sorted(found, reverse=True):
    print(f'\n[{where}] {line}\n  {what}\n  comment: {text or "(none)"}')
