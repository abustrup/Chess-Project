#!/usr/bin/env python3
"""Turn results.json from check.py into summary.md (plain English) and flagged.json (compact list).
Run: .venv/bin/python scripts/deep-check-openings/summarize.py [--out research/2026-10-16-diagnosis/engine]
"""
import argparse
import json
import statistics as st
from collections import Counter, defaultdict
from pathlib import Path

import chess

REPO = Path(__file__).resolve().parents[2]
DEFAULT_OUT = REPO / "research" / "2026-10-16-diagnosis" / "engine"
COURSE_NAME = {"london": "London (you play White)", "caro-kann": "Caro-Kann (you play Black)",
               "slav": "Slav (you play Black)"}


def san(fen, uci):
    if not uci:
        return ""
    b = chess.Board(fen)
    try:
        return b.san(chess.Move.from_uci(uci))
    except Exception:
        return uci


def final(r):
    return r.get("localTiebreak") or r.get("localConfirm") or r.get("localPass1")


def chapters(r):
    return sorted(set(f"{o['course']}/{o['chapter']}" for o in r["occurrences"]))


def short(text, n=110):
    text = (text or "").strip()
    return text if len(text) <= n else text[: n - 3].rstrip() + "..."


def pct(a, b):
    return f"{a} of {b} ({100 * a / b:.0f}%)" if b else f"{a} of 0"


def wilson(k, n, z=1.96):
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    c = p + z * z / (2 * n)
    h = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5)
    return (100 * (c - h) / d, 100 * (c + h) / d)


def depths_txt(r):
    """Loss in cp at every local depth that was run, then the cloud, e.g. '56 / 139 / 50 (3M/30M/150M)'."""
    vals, labels = [], []
    for key in ("localPass1", "localConfirm", "localTiebreak"):
        e = r.get(key)
        if e and "cpLoss" in e:
            vals.append(str(e["cpLoss"]))
            labels.append(f"{e['nodes'] // 1_000_000}M")
    return f"{' / '.join(vals)} cp ({'/'.join(labels)} nodes)" if vals else "?"


def robust(r):
    """Flagged at every local depth that was run AND by the cloud."""
    from_rec = r["kind"] in ("recommended", "alternative")
    test = (lambda e: e and "cpLoss" in e and (e["cpLoss"] > 50 or e["wcLoss"] > 5)) if from_rec else \
           (lambda e: e and "cpLoss" in e and e["cpLoss"] < 40)
    locs = [r.get(k) for k in ("localPass1", "localConfirm", "localTiebreak") if r.get(k)]
    c = r.get("cloud") or {}
    if from_rec:
        cloud_ok = ("cpLoss" in c and (c["cpLoss"] > 50 or c["wcLoss"] > 5)) or \
                   ("cpLossAtLeast" in c and (c["cpLossAtLeast"] > 50 or c["wcLossAtLeast"] > 5))
    else:
        cloud_ok = "cpLoss" in c and c["cpLoss"] < 40
    return bool(locs) and all(test(e) for e in locs) and cloud_ok


def evaltxt(cp):
    """Owner's eval after the taught move, with a plain note when the game is already decided."""
    if cp is None:
        return "?"
    note = " (still clearly winning)" if cp >= 300 else " (already clearly worse)" if cp <= -300 else ""
    return f"{cp:+d} cp{note}"


def cloud_txt(c):
    if not c:
        return "not in cloud"
    if "cpLoss" in c:
        return f"{c['cpLoss']} cp / {c['wcLoss']:.1f} pts (depth {c.get('depth')})"
    if "cpLossAtLeast" in c:
        return f"at least {c['cpLossAtLeast']} cp / {c['wcLossAtLeast']:.1f} pts (depth {c.get('depth')})"
    return "not in cloud"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    args = ap.parse_args()
    out = Path(args.out)
    rep = json.loads((out / "results.json").read_text())
    items = rep["items"]
    S = rep["settings"]
    rec = [r for r in items if r["kind"] == "recommended"]
    alt = [r for r in items if r["kind"] == "alternative"]
    opp = [r for r in items if r["kind"] == "opponent-flagged"]
    ends = [r for r in items if r["kind"] == "line-end"]

    # cloud coverage: was the position looked up at all, and did Lichess have it?
    cstat = {}
    cpath = out / "cloud-cache.jsonl"
    if cpath.exists():
        for line in cpath.read_text().splitlines():
            if line.strip():
                rr = json.loads(line)
                cstat.setdefault(rr["epd"], set()).add((rr["multipv"], rr["status"]))

    def cloud_status(r):
        if r.get("cloud") and ("cpLoss" in r["cloud"] or "cpLossAtLeast" in r["cloud"] or "cp" in r["cloud"]):
            return "has cloud result"
        st_ = cstat.get(r["epd"], set())
        if (3, 404) in st_ and (1, 404) in st_:
            return "not stored on Lichess"
        if any(code == 200 for _, code in st_):
            return "stored, but the move's own eval was not found"
        return "not looked up (rate limit)"

    def course_of(r):
        return r["occurrences"][0]["course"]

    flagged = [r for r in rec + alt if r["verdict"]["flaggedByEngine"] or r["verdict"]["flaggedByCloud"]]
    flagged.sort(key=lambda r: (course_of(r), -((final(r) or {}).get("wcLoss") or 0)))
    notmist = [r for r in opp if r["verdict"]["notAMistakeByEngine"] or r["verdict"]["notAMistakeByCloud"]]
    notmist.sort(key=lambda r: (course_of(r), (final(r) or {}).get("cpLoss") or 0))
    badends = [r for r in ends if r["verdict"]["badEndByEngine"] or r["verdict"]["badEndByCloud"]]
    badends.sort(key=lambda r: (course_of(r), r.get("ownerCpEngine") or 0))

    L = []
    w = L.append
    w("# Deep engine check of the opening courses")
    w("")
    w(f"Generated {rep['generated']} by `scripts/deep-check-openings/check.py` (started {rep['started']}).")
    ats = []
    epath = out / "engine-cache.jsonl"
    if epath.exists():
        for line in epath.read_text().splitlines():
            if line.strip():
                ats.append(json.loads(line).get("at", ""))
    ats = sorted(a for a in ats if a)
    if ats:
        w(f"Engine searches behind these numbers were made between {ats[0]} and {ats[-1]} (re-runs reuse earlier searches).")
    w("Nothing in the course files was changed.")
    w("")
    w("## What was checked")
    w("")
    w(f"- {len(rec)} taught moves: every position in the three courses where you are to move and the course teaches a move "
      f"(the first move listed there). {len(alt)} other move(s) listed for you as an alternative.")
    w(f"- {len(opp)} opponent moves the courses mark ?!, ? or ??.")
    w(f"- {len(ends)} line ends (the last position of each line).")
    tbn = (S.get("tiebreak") or {}).get("nodes")
    w(f"- Local engine: {S['engine']}, {S['pass1']['nodes']:,} nodes per search, MultiPV 3, Threads {S['pass1']['threads']}, "
      f"Hash {S['pass1']['hashMB']} MB. Anything flagged or near a threshold was searched again at "
      f"{S['confirmation']['nodes']:,} nodes"
      + (f", and anything where that result and the cloud still disagreed, at {tbn:,} nodes." if tbn else "."))
    cdeps = sorted(r["cloud"]["depth"] for r in rec if r.get("cloud") and r["cloud"].get("depth"))
    cdep_txt = (f"; the entries used here have a median depth of {st.median(cdeps):.0f} "
                f"(range {cdeps[0]}-{cdeps[-1]}), against a median of "
                f"{st.median(final(r)['depth'] for r in rec if final(r) and final(r).get('depth')):.0f} "
                "for the local verdicts") if cdeps else ""
    w("- Second opinion: Lichess cloud evaluation (positions stored on lichess.org, searched by volunteers' engines"
      + cdep_txt + ").")
    w("- Loss = how much worse the move is than the engine's best move, for the side making it, in centipawns (cp, "
      "1/100 of a pawn) and in Lichess win-chance points (0 to 100 scale, the formula Lichess uses for its own "
      "inaccuracy / mistake / blunder labels at 5 / 10 / 15 points).")
    w("")

    # ---------------- headline
    def agree_counts(rs, key):
        return Counter(r["verdict"]["agreement"] for r in rs)

    w("## Headline")
    w("")
    rec_fl = [r for r in rec if r["verdict"]["flaggedByEngine"]]
    rec_fl_both = [r for r in rec_fl if r["verdict"]["flaggedByCloud"]]
    w(f"- Taught moves that lose more than 50 cp or more than 5 win-chance points by the deep local engine: "
      f"**{pct(len(rec_fl), len(rec))}**; the Lichess cloud agrees on {len(rec_fl_both)} of them.")
    tb_all = [r for r in rec + opp if r.get("localTiebreak") and r.get("localConfirm")]
    move_txt = ""
    if tb_all:
        d3 = [abs(r["localTiebreak"]["cpLoss"] - r["localConfirm"]["cpLoss"]) for r in tb_all]
        move_txt = (f" On the {len(tb_all)} items searched a third time, the loss moved by a median of "
                    f"{st.median(d3):.0f} cp (largest {max(d3)} cp) between the two deepest searches.")
    w(f"- Of those, flagged at every local depth that was run and by the cloud: {sum(1 for r in rec_fl if robust(r))}. "
      "The others sit close to the 50 cp line, where depth changes the verdict." + move_txt)
    allf = [final(r) for r in rec if final(r)]
    big = max(allf, key=lambda e: e["cpLoss"])
    w(f"- Largest loss of any taught move at the deepest local search: {big['cpLoss']} cp; largest win-chance loss: "
      f"{max(e['wcLoss'] for e in allf):.1f} points. "
      f"Taught moves Lichess would label a mistake (10+ points) or blunder (15+): "
      f"{sum(1 for e in allf if e['wcLoss'] >= 10)}.")
    cloud_only = [r for r in rec if r["verdict"]["flaggedByCloud"] and r["verdict"]["flaggedByEngine"] is False]
    w(f"- Flagged by the cloud only (the deep local engine did not confirm): {len(cloud_only)}.")
    opp_nm = [r for r in opp if r["verdict"]["notAMistakeByEngine"]]
    w(f"- Opponent moves marked as mistakes that lose less than 40 cp by the deep local engine: **{pct(len(opp_nm), len(opp))}**; "
      f"cloud agrees on {sum(1 for r in opp_nm if r['verdict']['notAMistakeByCloud'])}.")
    be = [r for r in ends if r["verdict"]["badEndByEngine"]]
    w(f"- Lines that end with you 50 cp or more worse: {pct(len(be), len(ends))}.")
    w(f"- Positions where two chapters teach different moves: {len(rep['conflicts'])}.")
    w("")

    # ---------------- per-course quality profile
    w("## How close the taught moves are to the engine's choice, per course")
    w("")
    w("| Course | Taught moves | Engine's top move (or equal) | Loss 0-20 cp | Loss 21-50 cp | Loss over 50 cp or 5 pts | Median loss (cp) |")
    w("|---|---|---|---|---|---|---|")
    byc = defaultdict(list)
    for r in rec:
        byc[course_of(r)].append(r)
    for c in ("london", "caro-kann", "slav"):
        rs = [r for r in byc[c] if final(r)]
        n = len(rs)
        top = sum(1 for r in rs if final(r)["cpLoss"] == 0 or final(r)["bestMove"] == r["uci"])
        a = sum(1 for r in rs if final(r)["cpLoss"] <= 20 and not r["verdict"]["flaggedByEngine"])
        b = sum(1 for r in rs if 20 < final(r)["cpLoss"] <= 50 and not r["verdict"]["flaggedByEngine"])
        f = sum(1 for r in rs if r["verdict"]["flaggedByEngine"])
        med = st.median(final(r)["cpLoss"] for r in rs) if rs else 0
        lo, hi = wilson(f, n)
        w(f"| {COURSE_NAME[c]} | {n} | {pct(top, n)} | {a} | {b} | {f} (95% range {lo:.0f}-{hi:.0f}%) | {med:.0f} |")
    w("")
    w("The 95% range treats the course as a sample of the moves an AI author would write; for the course itself the count is exact.")
    w("")

    # ---------------- flagged taught moves
    w("## 1. Taught moves that lose more than 50 cp or 5 win-chance points")
    w("")
    w("Sorted by course, then by size of the win-chance loss. 'Deepest local loss' is the local Stockfish at the deepest search "
      "that was run for that item (the confirmation or, where engine and cloud disagreed, the tie-break). "
      "When you are still clearly winning after the taught move, a large cp loss costs little (the win-chance loss shows that). "
      "A flag is a reason to look, not automatically a reason to change: some simple moves are chosen on purpose. "
      "The 'Lichess label' is what Lichess's own analysis would call the move.")
    w("")
    cur = None
    for r in flagged:
        c = course_of(r)
        if c != cur:
            cur = c
            w(f"### {COURSE_NAME[c]}")
            w("")
            w("| Line (taught move last) | Engine prefers | Loss at each local depth | Deepest local loss | Lichess label | Cloud loss | Verdict | Same at every depth and in cloud? | Your eval after the taught move | Chapter(s) |")
            w("|---|---|---|---|---|---|---|---|---|---|")
        f = final(r) or {}
        kind = "" if r["kind"] == "recommended" else " (listed alternative)"
        w(f"| {r['occurrences'][0]['line']}{kind} | {san(r['fen'], f.get('bestMove'))} | {depths_txt(r)} | "
          f"{f.get('cpLoss')} cp / {f.get('wcLoss', 0):.1f} pts (depth {f.get('depth')}) | "
          f"{r['verdict']['lichessLabelEngine']} | {cloud_txt(r.get('cloud'))} | {r['verdict']['agreement']} | "
          f"{'yes' if robust(r) else 'no'} | {evaltxt(f.get('moveCp'))} | {', '.join(chapters(r))} |")
    if not flagged:
        w("None.")
    w("")

    # ---------------- opponent mistakes that are not
    w("## 2. Opponent moves marked ?!, ? or ?? that lose less than 40 cp")
    w("")
    cur = None
    for r in notmist:
        c = course_of(r)
        if c != cur:
            cur = c
            w(f"### {COURSE_NAME[c]}")
            w("")
            w("| Line (marked move last) | Marked | Best for the opponent | Loss at each local depth | Deepest local loss | Cloud loss | Verdict | Same at every depth and in cloud? | Course says |")
            w("|---|---|---|---|---|---|---|---|---|")
        f = final(r) or {}
        w(f"| {r['occurrences'][0]['line']} | {''.join(r['verdict']['markedAs'])} | {san(r['fen'], f.get('bestMove'))} | "
          f"{depths_txt(r)} | {f.get('cpLoss')} cp / {f.get('wcLoss', 0):.1f} pts | {cloud_txt(r.get('cloud'))} | "
          f"{r['verdict']['agreement']} | {'yes' if robust(r) else 'no'} | "
          f"{short(r['occurrences'][0]['comment']).replace('|', '/')} |")
    if not notmist:
        w("None.")
    w("")

    # ---------------- severity of all marked opponent moves
    w("## 3. All marked opponent moves: the course's mark against Lichess's own label (deep engine)")
    w("")
    sev = Counter()
    for r in opp:
        sev[(",".join(r["verdict"]["markedAs"]), r["verdict"]["lichessLabelEngine"])] += 1
    w("| Marked in course | Lichess label by deep engine | Count |")
    w("|---|---|---|")
    for (m, lab), n in sorted(sev.items()):
        w(f"| {m} | {lab} | {n} |")
    w("")

    # ---------------- line ends
    w("## 4. Lines that end with you 50 cp or more worse")
    w("")
    if badends:
        w("| Line | Your eval, deep engine (cp) | Your eval, cloud (cp) | Verdict | Chapter |")
        w("|---|---|---|---|---|")
        for r in badends:
            w(f"| {r['occurrences'][0]['line']} | {r.get('ownerCpEngine')} | {r.get('ownerCpCloud')} | "
              f"{r['verdict']['agreement']} | {', '.join(chapters(r))} |")
    else:
        w("None.")
    w("")

    # ---------------- conflicts
    w("## 5. Positions where chapters teach different moves")
    w("")
    if rep["conflicts"]:
        w("| Position (FEN) | Moves taught (loss cp, chapters) |")
        w("|---|---|")
        for c in rep["conflicts"]:
            parts = [f"{m['san']} ({m['cpLoss']} cp; {', '.join(m['chapters'])})" for m in c["moves"]]
            w(f"| `{c['fen']}` | {'; '.join(parts)} |")
    else:
        w("None.")
    w("")

    # ---------------- engine vs cloud agreement (noise)
    w("## 6. How much the two sources agree (a noise check)")
    w("")
    w("Cloud coverage of the taught moves:")
    w("")
    for k, n in Counter(cloud_status(r) for r in rec).most_common():
        w(f"- {k}: {pct(n, len(rec))}")
    w(f"- Marked opponent moves with a cloud result: {pct(sum(1 for r in opp if cloud_status(r) == 'has cloud result'), len(opp))}")
    w(f"- Line ends with a cloud result: {pct(sum(1 for r in ends if cloud_status(r) == 'has cloud result'), len(ends))}")
    w("")
    both = [r for r in rec if r.get("cloud") and "cpLoss" in r["cloud"] and final(r)]
    if both:
        diffs = [abs(final(r)["cpLoss"] - r["cloud"]["cpLoss"]) for r in both]
        same_flag = sum(1 for r in both if bool(r["verdict"]["flaggedByEngine"]) == bool(r["verdict"]["flaggedByCloud"]))
        same_best = sum(1 for r in both if final(r)["bestMove"] == r["cloud"]["bestMove"])
        w(f"- Taught moves with a cloud loss: {pct(len(both), len(rec))}.")
        w(f"- Same flag (flagged or not) from both sources: {pct(same_flag, len(both))}.")
        w(f"- Same best move: {pct(same_best, len(both))}.")
        w(f"- Difference in loss between the sources: median {st.median(diffs):.0f} cp, "
          f"90th percentile {sorted(diffs)[int(0.9 * (len(diffs) - 1))]:.0f} cp.")
    tbs = [r for r in rec + opp if r.get("localTiebreak") and r.get("localConfirm")]
    if tbs:
        d3 = [abs(r["localTiebreak"]["cpLoss"] - r["localConfirm"]["cpLoss"]) for r in tbs]
        w(f"- Items searched a third time ({len(tbs)}): confirmation vs tie-break loss differs by median {st.median(d3):.0f} cp, "
          f"max {max(d3)} cp.")
    p1 = [r for r in rec + opp if r.get("localConfirm") and r.get("localPass1")]
    if p1:
        d = [abs(r["localConfirm"]["cpLoss"] - r["localPass1"]["cpLoss"]) for r in p1]
        w(f"- Items searched twice locally ({len(p1)}): pass 1 vs confirmation loss differs by median {st.median(d):.0f} cp, "
          f"max {max(d)} cp.")
    w("")
    w("## What this check cannot tell you")
    w("")
    w("- The engine's best move is not always the best move for a 1000-1300 player. Whether a line is practical at your "
      "level is a separate check against human games (Lichess database results), not this one.")
    w("- It tests moves, not sentences. Claims in the comments such as 'this wins a pawn' need their own check.")
    w("- Stockfish with 4 threads gives slightly different numbers each run; items near a threshold can flip.")
    w("")
    w("## Re-run")
    w("")
    w("`.venv/bin/python scripts/deep-check-openings/check.py` from the repo root, then this summary is rewritten by "
      "`.venv/bin/python scripts/deep-check-openings/summarize.py`. Exact settings are in `results.json` under "
      "`settings`. See `scripts/deep-check-openings/README.md`.")
    (out / "summary.md").write_text("\n".join(L) + "\n")

    # compact machine-readable list for other tools / agents
    comp = {
        "generated": rep["generated"], "settings": S,
        "taughtMovesFlagged": [{
            "course": course_of(r), "chapters": chapters(r), "line": r["occurrences"][0]["line"],
            "fen": r["fen"], "move": r["san"], "kind": r["kind"],
            "enginePrefers": san(r["fen"], (final(r) or {}).get("bestMove")),
            "engine": {k: (final(r) or {}).get(k) for k in ("cpLoss", "wcLoss", "bestCp", "moveCp", "depth", "nodes", "method")},
            "cloud": r.get("cloud"), "verdict": r["verdict"]} for r in flagged],
        "opponentMarksNotMistakes": [{
            "course": course_of(r), "chapters": chapters(r), "line": r["occurrences"][0]["line"],
            "fen": r["fen"], "move": r["san"], "marked": r["verdict"]["markedAs"],
            "opponentBest": san(r["fen"], (final(r) or {}).get("bestMove")),
            "engine": {k: (final(r) or {}).get(k) for k in ("cpLoss", "wcLoss", "bestCp", "moveCp", "depth", "nodes", "method")},
            "cloud": r.get("cloud"), "verdict": r["verdict"],
            "comment": r["occurrences"][0]["comment"]} for r in notmist],
        "badLineEnds": [{"course": course_of(r), "chapters": chapters(r), "line": r["occurrences"][0]["line"],
                         "fen": r["fen"], "ownerCpEngine": r.get("ownerCpEngine"), "ownerCpCloud": r.get("ownerCpCloud"),
                         "verdict": r["verdict"]} for r in badends],
        "conflicts": rep["conflicts"],
    }
    (out / "flagged.json").write_text(json.dumps(comp, indent=1))
    print(f"wrote {out / 'summary.md'} and {out / 'flagged.json'}")


if __name__ == "__main__":
    main()
