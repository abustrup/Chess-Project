#!/usr/bin/env python3
"""Plant a canary for the content checks: one false sentence and one taught move that loses material.

Use it on a throwaway branch to see that .github/workflows/content-checks.yml fails and names both:
    git switch -c ci-canary
    .venv/bin/python scripts/deep-check-openings/make_ci_canary.py
    git commit -am "CI canary: must fail the content checks" && git push -u origin ci-canary
    open a pull request from ci-canary, check that "Content checks" fails naming the sentence and the move,
    then close the pull request and delete the branch.
On the Mac the same is done in a copy of the repo with --root <copy>.

What it adds: a chapter "ci-canary" at the end of the White course (appended to src/data/openings/index.ts):
1.d4 a6 2.Bf4 h6 3.Bxh6?? Rxh6, with the sentence "The knight on g8 attacks the pawn on d4." after 1...a6.
3.Bxh6 gives a bishop for a pawn; the knight on g8 attacks e7, f6 and h6, not d4. Before writing, the script checks
with Stockfish that the move loses 100+ cp and that the line teaches nothing that clashes with the courses
(otherwise it tries the next candidate), so exactly the two planted errors (plus the bad line end the blunder
leaves) are expected.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import chess
import chess.engine

REPO = Path(__file__).resolve().parents[2]
SENTENCE = "The knight on g8 attacks the pawn on d4."
# (moves, index of the opponent move that carries the false sentence); the owner (White) blunders on the last own move
CANDIDATES = [
    (["d4", "a6", "Bf4", "h6", "Bxh6", "Rxh6"], 1),
    (["d4", "h6", "Bf4", "a6", "Bxh6", "Rxh6"], 1),
    (["d4", "a5", "Bf4", "h6", "Bxh6", "Rxh6"], 1),
]


def pgn_text(moves, comment_at):
    out = []
    for i, san in enumerate(moves):
        if i % 2 == 0:
            out.append(f"{i // 2 + 1}. {san}")
        else:
            out.append(f"{i // 2 + 1}... {san}" if out and out[-1].endswith("}") else san)
        if i == comment_at:
            out.append("{ " + SENTENCE + " }")
    return " ".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=str(REPO), help="repo (or copy of it) to plant the canary in")
    ap.add_argument("--engine", default="/opt/homebrew/bin/stockfish")
    args = ap.parse_args()
    root = Path(args.root)
    index = root / "src" / "data" / "openings" / "index.ts"
    if "ci-canary" in index.read_text():
        sys.exit("the canary is already planted")

    # what the courses teach now (White course): position -> taught move
    res = subprocess.run([str(root / "node_modules" / ".bin" / "tsx"), "scripts/deep-check-openings/extract.ts"],
                         cwd=root, capture_output=True, text=True, check=True)
    taught = {}
    for m in json.loads(res.stdout):
        if m["byOwner"] and m["siblingIndex"] == 0:
            taught.setdefault(chess.Board(m["fenBefore"]).epd(), set()).add(m["uci"])

    eng = chess.engine.SimpleEngine.popen_uci(args.engine)
    eng.configure({"Threads": 1, "Hash": 64})
    try:
        for moves, comment_at in CANDIDATES:
            b = chess.Board()
            clash = False
            for i, san in enumerate(moves):
                mv = b.parse_san(san)
                if i % 2 == 0 and taught.get(b.epd(), {mv.uci()}) != {mv.uci()}:
                    clash = True
                if i == len(moves) - 2:
                    before = b.copy()
                    blunder = mv
                b.push(mv)
            if clash:
                print(f"skip {' '.join(moves)}: a course teaches another move on this line")
                continue
            info = eng.analyse(before, chess.engine.Limit(nodes=1_000_000), multipv=1)
            best_cp = info[0]["score"].pov(before.turn).score(mate_score=100000)
            after = before.copy()
            after.push(blunder)
            info2 = eng.analyse(after, chess.engine.Limit(nodes=1_000_000))
            move_cp = -info2["score"].pov(after.turn).score(mate_score=100000)
            loss = best_cp - move_cp
            print(f"{' '.join(moves)}: {before.san(blunder)} loses {loss} cp (Stockfish, 1M nodes)")
            if loss < 100:
                continue
            chapter = {"id": "ci-canary", "title": "CI canary (must fail the content checks)",
                       "summary": "Planted on a test branch to show the content checks catch a false sentence and a bad move.",
                       "difficulty": 1, "pgn": pgn_text(moves, comment_at)}
            code = ("\n// CI canary, planted by scripts/deep-check-openings/make_ci_canary.py on a test branch only.\n"
                    "OPENING_COURSES.find((c) => c.side === 'white')!.chapters.push("
                    f"{{ ...OPENING_COURSES.find((c) => c.side === 'white')!.chapters[0], ...({json.dumps(chapter)} as const) }})\n")
            index.write_text(index.read_text() + code)
            print(f"planted in {index}: {chapter['pgn']}")
            print(f"expected: check:claims names \"{SENTENCE}\"; the deep check names the taught move "
                  f"{before.san(blunder)} (and the bad line end after it)")
            return
        sys.exit("no candidate line fits: every one clashes with the courses or loses under 100 cp")
    finally:
        eng.quit()


if __name__ == "__main__":
    main()
