#!/usr/bin/env python3
"""Deep engine check of every opening line in the app (London, Caro-Kann, Slav).

What it checks
  1. Every position where the owner is to move and the course teaches a move (the FIRST move
     listed at that position): how much worse is that move than the engine's best move,
     in centipawns and in Lichess win-chance points.
  2. Every other owner move listed at that position (an "alternative"): same test.
  3. Every opponent move the course marks ?!, ? or ?? : does it really lose at least 40 cp
     against the opponent's best move, and how would Lichess itself label it.
  4. Every line end: the evaluation from the owner's side, so lines that stop in a worse
     position can be found.
  5. Positions where two chapters teach different moves.

Two independent sources
  - Local Stockfish (native binary), searched at a fixed node count (pass 1), and re-searched at a
    much larger node count (confirmation pass) for every item that either source flags or that
    is near a threshold.
  - Lichess cloud evaluation (https://lichess.org/api/cloud-eval), where the position is stored.

Run from the repo root (about 1-2 hours on a shared 10-core Mac; re-runs reuse the caches):
    .venv/bin/python scripts/deep-check-openings/check.py
Options: --nodes, --confirm-nodes, --threads, --hash, --no-cloud, --out, --fresh, --strict.

The check that runs on GitHub (.github/workflows/content-checks.yml) re-uses the committed caches, asks Lichess
nothing and fails on problems:
    .venv/bin/python scripts/deep-check-openings/check.py --strict --offline \
        --cache-from research/2026-10-16-diagnosis/engine --out <scratch folder>
See scripts/deep-check-openings/README.md for the exact settings and how to read the output.
"""
import argparse
import datetime as dt
import json
import math
import os
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import chess
import chess.engine

REPO = Path(__file__).resolve().parents[2]
DEFAULT_OUT = REPO / "research" / "2026-10-16-diagnosis" / "engine"
DEFAULT_ENGINE = os.environ.get("STOCKFISH") or "/opt/homebrew/bin/stockfish"
DEFAULT_DELIBERATE = REPO / "scripts" / "deep-check-openings" / "deliberate-choices.json"
# An honest User-Agent naming the project (2026-10-16; the first run used a browser-like one). A 404 is only cached as
# "not stored" after a position Lichess surely stores answered, so a refused client cannot fill the cache with 404s.
UA = "ChessCoach-deep-check/1.0 (+https://github.com/abustrup/Chess-Project)"
CLOUD_URL = "https://lichess.org/api/cloud-eval"
PROBE_FEN = "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1"  # after 1.d4: always in the cloud

# Thresholds (fixed in advance, from the task):
REC_CP = 50        # a taught owner move is flagged if it loses MORE than 50 cp ...
REC_WC = 5.0       # ... or MORE than 5 win-chance points (0-100 scale) against the best move
OPP_CP = 40        # an opponent move marked ?!/?/?? is "not a mistake" if it loses LESS than 40 cp
# Near-threshold band that also gets the confirmation search (so noise at pass 1 cannot hide a flag):
REC_CP_NEAR, REC_WC_NEAR = 30, 3.0
OPP_CP_NEAR = 70
LINE_END_BAD_CP = -50  # a line that ends with the owner 50 cp or more worse is listed

NAG_TEXT = {1: "!", 2: "?", 3: "!!", 4: "??", 5: "!?", 6: "?!"}
FLAG_NAGS = {2, 4, 6}


# ---------------------------------------------------------------- formulas
def clamp_cp(cp):
    return max(-1000, min(1000, cp))


def win_pct(cp):
    """Lichess win percentage for the side the cp is measured for (lila WinPercent):
    cp clamped to +-1000, mate counted as +-1000."""
    cp = clamp_cp(cp)
    return 50 + 50 * (2 / (1 + math.exp(-0.00368208 * cp)) - 1)


def lichess_label(wc_loss):
    """Lichess's own move labels: winning-chance drop of 0.1 / 0.2 / 0.3 on its -1..1 scale,
    which is 5 / 10 / 15 points on the 0-100 win-percentage scale."""
    if wc_loss >= 15:
        return "blunder"
    if wc_loss >= 10:
        return "mistake"
    if wc_loss >= 5:
        return "inaccuracy"
    return "ok"


def score_to_cp(score):
    """python-chess PovScore already turned to a side -> clamped cp (mate = +-1000)."""
    return clamp_cp(score.score(mate_score=100000))


def now():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fmt_path(path, first_ply=1):
    out = []
    for i, san in enumerate(path):
        ply = first_ply + i
        if ply % 2 == 1:
            out.append(f"{(ply + 1) // 2}. {san}")
        elif i == 0:
            out.append(f"{ply // 2}... {san}")
        else:
            out.append(san)
    return " ".join(out)


# ---------------------------------------------------------------- extraction
def extract():
    tsx = REPO / "node_modules" / ".bin" / "tsx"
    cmd = [str(tsx), str(REPO / "scripts" / "deep-check-openings" / "extract.ts")]
    res = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def build_items(moves):
    """Turn every listed move into check items, de-duplicated by (position, move)."""
    items = {}   # key (kind, epd, uci) -> item
    positions = {}  # epd -> full fen (first seen)

    def add(kind, fen, uci, san, occ):
        b = chess.Board(fen)
        epd = b.epd()
        positions.setdefault(epd, fen)
        key = (kind, epd, uci)
        it = items.get(key)
        if it is None:
            it = items[key] = {"kind": kind, "epd": epd, "fen": fen, "uci": uci, "san": san,
                               "stm": "w" if b.turn else "b", "occurrences": []}
        it["occurrences"].append(occ)

    for m in moves:
        occ = {"course": m["course"], "chapter": m["chapter"], "nodeId": m["nodeId"],
               "line": fmt_path(m["path"]), "nags": [NAG_TEXT.get(n, str(n)) for n in m["nags"]],
               "comment": m["comment"]}
        if m["byOwner"]:
            add("recommended" if m["siblingIndex"] == 0 else "alternative",
                m["fenBefore"], m["uci"], m["san"], occ)
        elif set(m["nags"]) & FLAG_NAGS:
            add("opponent-flagged", m["fenBefore"], m["uci"], m["san"], occ)
        if m["isLeaf"]:
            side = m["side"]
            add("line-end", m["fenAfter"], "", "", dict(occ, ownerSide=side))
    return list(items.values()), positions


# ---------------------------------------------------------------- caches
class JsonlCache:
    """Append-only JSON-lines cache. `seeds` are other cache files that are read but never written (the committed
    caches, when the results go to another folder). For engine searches, `get_any` also finds a stored search of the
    same position, node count, MultiPV and root moves made with another thread count or hash size."""

    def __init__(self, path, fresh=False, seeds=()):
        self.path = Path(path)
        self.data = {}
        self.by_base = {}
        self.lock = threading.Lock()
        files = [Path(x) for x in seeds if Path(x).resolve() != self.path.resolve()]
        if fresh and self.path.exists():
            self.path.unlink()
        if not fresh:
            files.append(self.path)
        self.bad_lines = 0  # a line cut short (e.g. read while another run was appending) is skipped, not fatal
        for f in files:
            if not f.exists():
                continue
            for line in f.read_text().splitlines():
                if line.strip():
                    try:
                        self._index(json.loads(line))
                    except (json.JSONDecodeError, KeyError):
                        self.bad_lines += 1

    def _index(self, rec):
        self.data[rec["key"]] = rec
        base = rec["key"].rsplit("|", 1)[0]
        self.by_base.setdefault(base, rec)  # the first stored search wins, so lookups are reproducible

    def get(self, key):
        return self.data.get(key)

    def get_any(self, key):
        return self.data.get(key) or self.by_base.get(key.rsplit("|", 1)[0])

    def put(self, key, rec):
        rec = dict(rec, key=key)
        with self.lock:
            self._index(rec)
            with self.path.open("a") as f:
                f.write(json.dumps(rec) + "\n")


# ---------------------------------------------------------------- local engine
class Engine:
    def __init__(self, path, threads, hash_mb, cache):
        self.path = path
        self.threads = threads
        self.hash = hash_mb
        self.cache = cache
        self.engine = None
        self.id = None
        self.searches = 0
        self.cache_hits = 0
        self.deadline = None      # time.time() after which no NEW search is started (see --max-search-seconds)
        self.skipped = 0          # searches not run because the deadline had passed

    def start(self):
        if self.engine is None:
            self.engine = chess.engine.SimpleEngine.popen_uci(self.path)
            self.engine.configure({"Threads": self.threads, "Hash": self.hash})
            self.id = self.engine.id.get("name", "?")
        return self

    def close(self):
        if self.engine is not None:
            self.engine.quit()
            self.engine = None

    def settings_tag(self):
        return f"t{self.threads}-h{self.hash}"

    def search(self, fen, nodes, multipv, root_moves=None):
        board = chess.Board(fen)
        epd = board.epd()
        rm = sorted(root_moves) if root_moves else None
        key = f"{epd}|n{nodes}|m{multipv}|{','.join(rm) if rm else '*'}|{self.settings_tag()}"
        hit = self.cache.get_any(key)
        if hit:
            self.cache_hits += 1
            return hit
        if self.deadline is not None and time.time() > self.deadline:
            self.skipped += 1
            return None
        self.start()
        if board.is_game_over():
            outcome = board.outcome()
            cp = 0 if outcome.winner is None else (1000 if outcome.winner == board.turn else -1000)
            rec = {"epd": epd, "fen": fen, "nodesLimit": nodes, "multipv": multipv, "rootMoves": rm,
                   "lines": [], "terminalCp": cp, "engine": self.id, "at": now()}
            self.cache.put(key, rec)
            return rec
        t0 = time.time()
        infos = self.engine.analyse(
            board, chess.engine.Limit(nodes=nodes), multipv=multipv,
            root_moves=[chess.Move.from_uci(u) for u in rm] if rm else None,
            game=epd)  # same game id for searches of one position -> hash kept between them
        took = time.time() - t0
        self.searches += 1
        lines = []
        for inf in infos:
            if "pv" not in inf or not inf["pv"]:
                continue
            sc = inf["score"].pov(board.turn)
            lines.append({
                "move": inf["pv"][0].uci(),
                "cp": score_to_cp(sc),
                "rawCp": sc.score(),
                "mate": sc.mate(),
                "depth": inf.get("depth"),
                "seldepth": inf.get("seldepth"),
                "pv": [m.uci() for m in inf["pv"][:10]],
            })
        nodes_used = infos[0].get("nodes") if infos else None
        rec = {"epd": epd, "fen": fen, "nodesLimit": nodes, "multipv": multipv, "rootMoves": rm,
               "lines": lines, "nodes": nodes_used, "seconds": round(took, 2),
               "engine": self.id, "threads": self.threads, "hash": self.hash, "at": now()}
        self.cache.put(key, rec)
        return rec


def local_eval_move(eng, fen, uci, nodes):
    """Best move vs the given move, both from one search where possible.
    Returns dict with bestMove, bestCp, moveCp (side to move), method, depth, nodes."""
    s = eng.search(fen, nodes, 3)
    if s is None or "terminalCp" in s:
        return None
    lines = s["lines"]
    best = lines[0]
    found = next((l for l in lines if l["move"] == uci), None)
    if found is not None:
        method = "multipv3"
        move_cp, best_cp, best_move = found["cp"], best["cp"], best["move"]
        move_depth = found["depth"]
        rank = lines.index(found) + 1
    else:
        # not in the top 3: search the best move and this move side by side in one search
        p = eng.search(fen, nodes, 2, root_moves=[best["move"], uci])
        if p is None:
            return None
        pl = {l["move"]: l for l in p["lines"]}
        if uci not in pl or best["move"] not in pl:
            return None
        move_cp, best_cp, best_move = pl[uci]["cp"], pl[best["move"]]["cp"], best["move"]
        move_depth = pl[uci]["depth"]
        method = "pair-search"
        rank = None
        if move_cp > best_cp:  # the pair search found this move better after all
            best_cp, best_move = move_cp, uci
    cp_loss = best_cp - move_cp
    wc_loss = win_pct(best_cp) - win_pct(move_cp)
    return {"bestMove": best_move, "bestCp": best_cp, "moveCp": move_cp,
            "cpLoss": max(0, cp_loss), "wcLoss": round(max(0.0, wc_loss), 2),
            "method": method, "rankInTop3": rank, "depth": best["depth"], "moveDepth": move_depth,
            "nodes": nodes, "topLines": [{k: l[k] for k in ("move", "cp", "depth")} for l in lines]}


def local_confirm_move(eng, fen, uci, nodes, candidates):
    """Confirmation search: ONE search restricted to the candidate best moves (pass-1 top lines and
    the cloud's best move) plus the move under test, MultiPV = number of root moves. All scores come
    from the same search, so the loss is not mixed across searches."""
    roots = []
    for m in list(candidates) + [uci]:
        if m and m not in roots:
            roots.append(m)
    board = chess.Board(fen)
    roots = [m for m in roots if chess.Move.from_uci(m) in board.legal_moves]
    if uci not in roots:
        return None
    if len(roots) == 1:  # both sources already call this move best: open search, 2 lines
        s = eng.search(fen, nodes, 2)
        if s is None or "terminalCp" in s or not s["lines"]:
            return None
        if uci not in {l["move"] for l in s["lines"]}:
            roots = [s["lines"][0]["move"], uci]
            s = eng.search(fen, nodes, 2, root_moves=roots)
        mpv = 2
    else:
        mpv = len(roots)
        s = eng.search(fen, nodes, mpv, root_moves=roots)
    if s is None or "terminalCp" in s or not s["lines"]:
        return None
    pl = {l["move"]: l for l in s["lines"]}
    if uci not in pl:
        return None
    best = s["lines"][0]
    move = pl[uci]
    cp_loss = best["cp"] - move["cp"]
    return {"bestMove": best["move"], "bestCp": best["cp"], "moveCp": move["cp"],
            "cpLoss": max(0, cp_loss), "wcLoss": round(max(0.0, win_pct(best["cp"]) - win_pct(move["cp"])), 2),
            "method": f"confirm-restricted-multipv{mpv}", "rootMoves": roots, "depth": best["depth"],
            "moveDepth": move["depth"], "nodes": nodes,
            "topLines": [{k: l[k] for k in ("move", "cp", "depth")} for l in s["lines"]]}


def local_eval_position(eng, fen, nodes, multipv=3):
    s = eng.search(fen, nodes, multipv)
    if s is None:
        return None
    if "terminalCp" in s:
        return {"cp": s["terminalCp"], "bestMove": None, "depth": 0, "nodes": nodes}
    l = s["lines"][0]
    return {"cp": l["cp"], "bestMove": l["move"], "depth": l["depth"], "nodes": nodes,
            "pv": l["pv"]}


# ---------------------------------------------------------------- Lichess cloud
class Cloud:
    def __init__(self, cache, min_interval=1.0, log=None, max_throttle_s=2700, offline=False):
        self.cache = cache
        self.offline = offline  # answers come from the caches only; Lichess is never asked
        self.min_interval = min_interval
        self.last = 0.0
        self.requests = 0
        self.log = log or (lambda *a: None)
        self.consecutive_429 = 0
        self.throttled_s = 0.0
        self.max_throttle_s = max_throttle_s  # stop asking for this run after this much waiting
        self.gave_up = False
        self.client_ok = None  # True once a stored position answered 200 (so a 404 really means "not stored")

    def fetch(self, fen, multipv):
        epd = chess.Board(fen).epd()
        key = f"{epd}|m{multipv}"
        hit = self.cache.get(key)
        if hit:
            return hit
        if self.gave_up or self.offline:
            return None
        url = CLOUD_URL + "?" + urllib.parse.urlencode({"fen": fen, "multiPv": multipv})
        for attempt in range(6):
            wait = self.last + self.min_interval - time.time()
            if wait > 0:
                time.sleep(wait)
            self.last = time.time()
            self.requests += 1
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
                with urllib.request.urlopen(req, timeout=30) as r:
                    data = json.loads(r.read().decode())
                self.consecutive_429 = 0
                self.client_ok = True
                rec = {"epd": epd, "multipv": multipv, "status": 200, "data": data, "at": now()}
                self.cache.put(key, rec)
                return rec
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    self.consecutive_429 = 0
                    if not self.client_ok and not self.probe():
                        return None  # not cached: a later run asks again
                    rec = {"epd": epd, "multipv": multipv, "status": 404, "at": now()}
                    self.cache.put(key, rec)
                    return rec
                if e.code == 429:
                    # Lichess asks clients to wait a full minute after a 429. Back off further on
                    # repeats, slow down for the rest of the run, and give up (until a re-run) if
                    # the throttle lasts too long. The IP may be shared with other tools.
                    self.consecutive_429 += 1
                    pause = min(600, 65 * 2 ** (self.consecutive_429 - 1))
                    self.min_interval = max(self.min_interval, 3.0)
                    if self.throttled_s + pause > self.max_throttle_s:
                        self.gave_up = True
                        self.log(f"cloud: still rate limited after {self.throttled_s:.0f} s of waiting; "
                                 "skipping the cloud for the rest of this run (a re-run fills the gaps)")
                        return None
                    self.log(f"cloud: 429 rate limited, waiting {pause} s (interval now {self.min_interval} s)")
                    self.throttled_s += pause
                    time.sleep(pause)
                    continue
                self.log(f"cloud: HTTP {e.code}, retrying")
                time.sleep(5 * (attempt + 1))
            except Exception as e:  # network hiccup
                self.log(f"cloud: {type(e).__name__} {e}, retrying")
                time.sleep(5 * (attempt + 1))
        return None  # not cached: a re-run will try again

    def probe(self):
        """Ask for a position Lichess surely stores. 200: our 404s are real. 404: Lichess refuses this client, so stop
        asking for this run. Anything else (429, network): undecided, and the 404 that led here is not cached."""
        url = CLOUD_URL + "?" + urllib.parse.urlencode({"fen": PROBE_FEN, "multiPv": 1})
        time.sleep(max(0.0, self.last + self.min_interval - time.time()))
        self.last = time.time()
        self.requests += 1
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                r.read()
            self.client_ok = True
            return True
        except urllib.error.HTTPError as e:
            if e.code == 404:
                self.gave_up = True
                self.log("cloud: Lichess answered 404 even for a stored position, so it refuses this client; "
                         "skipping the cloud for the rest of this run (nothing cached)")
            return False
        except Exception:
            return False

    def lines(self, fen):
        """Cloud lines for a position, side-to-move cp. Tries multiPv 3, then 1."""
        board = chess.Board(fen)
        for mpv in (3, 1):
            rec = self.fetch(fen, mpv)
            if rec and rec.get("status") == 200:
                d = rec["data"]
                sign = 1 if board.turn == chess.WHITE else -1
                out = []
                for pv in d.get("pvs", []):
                    mv = pv["moves"].split()[0]
                    try:
                        mv = board.parse_uci(mv).uci()  # Lichess writes castling as e1h1
                    except ValueError:
                        continue
                    if "cp" in pv:
                        cp = clamp_cp(sign * pv["cp"])
                    else:
                        m = sign * pv["mate"]
                        cp = 1000 if m > 0 else -1000
                    out.append({"move": mv, "cp": cp})
                return {"multipv": mpv, "depth": d.get("depth"), "knodes": d.get("knodes"), "lines": out}
        return None


def cloud_eval_move(cloud, fen, uci):
    pos = cloud.lines(fen)
    if not pos or not pos["lines"]:
        return None
    best = pos["lines"][0]
    found = next((l for l in pos["lines"] if l["move"] == uci), None)
    base = {"bestMove": best["move"], "bestCp": best["cp"], "depth": pos["depth"],
            "multipv": pos["multipv"], "knodes": pos["knodes"]}
    if found is not None:
        mcp, method, after_depth = found["cp"], f"cloud-multipv{pos['multipv']}", pos["depth"]
    else:
        board = chess.Board(fen)
        board.push_uci(uci)
        after = cloud.lines(board.fen())
        if after and after["lines"]:
            mcp = -after["lines"][0]["cp"]  # opponent's best reply, turned to our side
            method, after_depth = "cloud-position-after", after["depth"]
        elif pos["multipv"] == 3 and len(pos["lines"]) == 3:
            worst = pos["lines"][-1]["cp"]
            cp_lb = best["cp"] - worst
            return dict(base, method="cloud-lower-bound", cpLossAtLeast=max(0, cp_lb),
                        wcLossAtLeast=round(max(0.0, win_pct(best["cp"]) - win_pct(worst)), 2))
        else:
            return dict(base, method="cloud-unavailable")
    if mcp > best["cp"]:
        best_cp, best_move = mcp, uci
    else:
        best_cp, best_move = best["cp"], best["move"]
    return dict(base, bestMove=best_move, bestCp=best_cp, moveCp=mcp,
                cpLoss=max(0, best_cp - mcp),
                wcLoss=round(max(0.0, win_pct(best_cp) - win_pct(mcp)), 2),
                method=method, moveDepth=after_depth)


# ---------------------------------------------------------------- verdicts
def rec_flag(ev):
    if not ev:
        return None
    if "cpLoss" in ev:
        return ev["cpLoss"] > REC_CP or ev["wcLoss"] > REC_WC
    if "cpLossAtLeast" in ev:
        return True if (ev["cpLossAtLeast"] > REC_CP or ev["wcLossAtLeast"] > REC_WC) else None
    return None


def rec_near(ev):
    if not ev:
        return False
    if "cpLoss" in ev:
        return ev["cpLoss"] > REC_CP_NEAR or ev["wcLoss"] > REC_WC_NEAR
    if "cpLossAtLeast" in ev:
        return ev["cpLossAtLeast"] > REC_CP_NEAR or ev["wcLossAtLeast"] > REC_WC_NEAR
    return False


def opp_not_mistake(ev):
    if not ev:
        return None
    if "cpLoss" in ev:
        return ev["cpLoss"] < OPP_CP
    if "cpLossAtLeast" in ev:
        return False if ev["cpLossAtLeast"] >= OPP_CP else None
    return None


def opp_near(ev):
    if not ev:
        return False
    if "cpLoss" in ev:
        return ev["cpLoss"] < OPP_CP_NEAR
    return False


def agreement(local_flag, cloud_flag):
    if local_flag and cloud_flag:
        return "engine and cloud agree"
    if local_flag and cloud_flag is False:
        return "engine only (cloud disagrees)"
    if local_flag and cloud_flag is None:
        return "engine only (no cloud data)"
    if cloud_flag and local_flag is False:
        return "cloud only (deep engine disagrees)"
    return "not flagged"


# ---------------------------------------------------------------- strict gate
def _rec_test(e):
    return bool(e) and "cpLoss" in e and (e["cpLoss"] > REC_CP or e["wcLoss"] > REC_WC)


def _opp_test(e):
    return bool(e) and "cpLoss" in e and e["cpLoss"] < OPP_CP


def local_depths(r):
    """The local results that were run for an item, shallowest first."""
    return [r[k] for k in ("localPass1", "localConfirm", "localTiebreak") if r.get(k)]


def depth_story(r):
    parts = [f"{e['cpLoss']} cp at {e['nodes'] // 1_000_000}M nodes" for e in local_depths(r) if "cpLoss" in e]
    return ", ".join(parts) if parts else "no local result"


def load_deliberate(path):
    """Taught moves kept on purpose although the engine prefers another move. Matched by position (EPD) and move."""
    p = Path(path)
    if not p.exists():
        return []
    doc = json.loads(p.read_text())
    out = []
    for e in doc.get("entries", []):
        if not e.get("reason") or not e.get("fen") or not e.get("uci"):
            raise SystemExit(f"{p}: every entry needs fen, uci and reason")
        out.append(dict(e, epd=chess.Board(e["fen"]).epd()))
    return out


def strict_problems(results, conflicts, deliberate):
    """What makes --strict fail, and what is only worth a look.

    Fails: a taught move (or listed alternative) that loses more than 50 cp or 5 win-chance points at EVERY local
    depth that was run, unless it is a listed deliberate choice; a move marked ?!/?/?? that loses less than 40 cp at
    every local depth; a line that ends with the owner 50 cp or more worse at the deepest local search; any position
    where two chapters teach different moves; any item the engine could not evaluate (time budget).
    Warnings: flags that hold at some depths only (near the line, depth decides) and deliberate choices.
    The Lichess cloud is shown in results.json but never decides here, so the gate needs no network.
    """
    fails, warns = [], []
    allowed = {(d["epd"], d["uci"]): d for d in deliberate}

    def where(r):
        o = r["occurrences"][0]
        more = f" (+{len(r['occurrences']) - 1} more)" if len(r["occurrences"]) > 1 else ""
        return f"{o['course']}/{o['chapter']}{more}: {o['line']}"

    for r in results:
        k = r["kind"]
        locs = local_depths(r)
        if k in ("recommended", "alternative", "opponent-flagged") and not locs:
            fails.append(("not evaluated", f"{where(r)} {r['san']}: no engine result (time budget or engine error)"))
            continue
        if k in ("recommended", "alternative"):
            flags = [_rec_test(e) for e in locs]
            fin = locs[-1]
            what = "taught move" if k == "recommended" else "listed alternative"
            msg = (f"{where(r)}: {what} {r['san']} loses {fin.get('cpLoss')} cp / {fin.get('wcLoss')} win-chance points; "
                   f"engine prefers {san_of(r['fen'], fin.get('bestMove'))} ({depth_story(r)})")
            if all(flags):
                d = allowed.get((r["epd"], r["uci"]))
                if d:
                    warns.append(("deliberate choice", f"{msg}. Kept on purpose: {d['reason']}"))
                else:
                    fails.append((what, msg))
            elif any(flags):
                warns.append((f"{what} near the line", msg))
        elif k == "opponent-flagged":
            flags = [_opp_test(e) for e in locs]
            fin = locs[-1]
            msg = (f"{where(r)}: {r['san']} is marked {'/'.join(r['verdict'].get('markedAs') or [])} but loses only "
                   f"{fin.get('cpLoss')} cp ({depth_story(r)})")
            if all(flags):
                fails.append(("mark on an opponent move", msg))
            elif any(flags):
                warns.append(("mark near the line", msg))
        elif k == "line-end":
            own = r.get("ownerCpEngine")
            if own is None:
                fails.append(("not evaluated", f"{where(r)}: line end has no engine result (time budget or engine error)"))
            elif own <= LINE_END_BAD_CP:
                fails.append(("line end", f"{where(r)}: the line ends with you {own} cp (50 cp or more worse)"))
    for c in conflicts:
        moves = "; ".join(f"{m['san']} in {', '.join(m['chapters'])}" for m in c["moves"])
        fails.append(("conflict", f"the same position is taught two ways: {moves} (FEN {c['fen']})"))
    return fails, warns


def san_of(fen, uci):
    if not uci:
        return "?"
    try:
        return chess.Board(fen).san(chess.Move.from_uci(uci))
    except Exception:
        return uci


def gh_escape(t):
    return t.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")


def report_strict(fails, warns, stats, log):
    log(f"STRICT: {len(fails)} problem(s), {len(warns)} note(s)")
    for kind, msg in fails:
        log(f"  FAIL  [{kind}] {msg}")
        if os.environ.get("GITHUB_ACTIONS") == "true":
            print(f"::error title=Deep engine check: {kind}::{gh_escape(msg)}", flush=True)
    for kind, msg in warns:
        log(f"  note  [{kind}] {msg}")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        L = ["### Deep engine check of the opening courses", "",
             f"Searches reused from the committed cache: {stats['hits']}. New searches on this runner: {stats['new']}. "
             f"Lichess cloud requests: {stats['cloud']}.", ""]
        if not fails:
            L.append("0 problems.")
        else:
            L += [f"**{len(fails)} problem(s).**", "", "| Kind | Where and what |", "|---|---|"]
            L += [f"| {k} | {m.replace('|', '/')} |" for k, m in fails]
        if warns:
            L += ["", f"{len(warns)} note(s), not failures:", ""] + [f"- {k}: {m}" for k, m in warns]
        with open(summary, "a") as f:
            f.write("\n".join(L) + "\n\n")


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--engine", default=DEFAULT_ENGINE)
    ap.add_argument("--nodes", type=int, default=3_000_000, help="pass-1 nodes per search (min 1,000,000)")
    ap.add_argument("--confirm-nodes", type=int, default=30_000_000, help="confirmation nodes; 0 = skip")
    ap.add_argument("--tiebreak-nodes", type=int, default=150_000_000,
                    help="nodes for items where the confirmed engine verdict and the cloud disagree; 0 = skip")
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--hash", type=int, default=1024)
    ap.add_argument("--no-cloud", action="store_true")
    ap.add_argument("--cloud-interval", type=float, default=3.0,
                    help="seconds between cloud requests (1.0 drew HTTP 429 after ~1,500 requests on 2026-10-16)")
    ap.add_argument("--cloud-max-wait", type=float, default=2700,
                    help="total seconds to wait out Lichess rate limits (HTTP 429) before skipping the cloud for this run")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--fresh", action="store_true", help="ignore caches")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 on a problem: a taught move flagged at every local depth (unless a listed deliberate "
                         "choice), a wrong ?!/? mark, a bad line end, a conflict, or an item left unevaluated")
    ap.add_argument("--offline", action="store_true",
                    help="never ask Lichess: cloud results come from the caches only (0 requests)")
    ap.add_argument("--cache-from", default=None,
                    help="folder whose engine-cache.jsonl and cloud-cache.jsonl are read but never written "
                         "(the committed caches); new searches go to --out")
    ap.add_argument("--deliberate", default=str(DEFAULT_DELIBERATE),
                    help="JSON list of taught moves kept on purpose (with a reason); --strict does not fail on them")
    ap.add_argument("--max-search-seconds", type=float, default=0,
                    help="stop starting new engine searches after this many seconds (0 = no limit); "
                         "anything left unevaluated fails --strict")
    ap.add_argument("--limit", type=int, default=0, help="only the first N positions (testing)")
    args = ap.parse_args()
    if args.nodes < 1_000_000:
        sys.exit("--nodes must be at least 1,000,000")

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    logf = (out / "run.log").open("a")

    def log(*a):
        msg = f"[{now()}] " + " ".join(str(x) for x in a)
        print(msg, flush=True)
        logf.write(msg + "\n")
        logf.flush()

    started = now()
    moves = extract()
    items, positions = build_items(moves)
    if args.limit:
        keep = set(list(positions)[: args.limit])
        items = [it for it in items if it["epd"] in keep]
    log(f"extracted {len(moves)} moves -> {len(items)} check items over {len(set(i['epd'] for i in items))} positions")

    seed = Path(args.cache_from) if args.cache_from else None
    ecache = JsonlCache(out / "engine-cache.jsonl", fresh=args.fresh, seeds=[seed / "engine-cache.jsonl"] if seed else ())
    ccache = JsonlCache(out / "cloud-cache.jsonl", fresh=args.fresh, seeds=[seed / "cloud-cache.jsonl"] if seed else ())
    eng = Engine(args.engine, args.threads, args.hash, ecache)
    if args.max_search_seconds:
        eng.deadline = time.time() + args.max_search_seconds
    cloud = Cloud(ccache, args.cloud_interval, log, max_throttle_s=args.cloud_max_wait, offline=args.offline)
    deliberate = load_deliberate(args.deliberate)
    if seed:
        log(f"reading committed caches from {seed} ({len(ecache.data)} engine and {len(ccache.data)} cloud records in all)")
    if ecache.bad_lines or ccache.bad_lines:
        log(f"skipped {ecache.bad_lines + ccache.bad_lines} unreadable cache line(s)")

    # --- cloud in a background thread (network only, no CPU)
    cloud_results = {}

    def cloud_worker():
        # taught moves and marked opponent moves first, line ends last (if Lichess rate-limits us,
        # the most important items are already fetched)
        order = sorted(items, key=lambda it: it["kind"] == "line-end")
        for i, it in enumerate(order):
            k = (it["kind"], it["epd"], it["uci"])
            try:
                if it["kind"] == "line-end":
                    pos = cloud.lines(it["fen"])
                    cloud_results[k] = ({"cp": pos["lines"][0]["cp"], "bestMove": pos["lines"][0]["move"],
                                         "depth": pos["depth"]} if pos and pos["lines"] else None)
                else:
                    cloud_results[k] = cloud_eval_move(cloud, it["fen"], it["uci"])
            except Exception as e:
                log(f"cloud worker error on {it['epd']}: {e}")
                cloud_results[k] = None
            if (i + 1) % 100 == 0:
                log(f"cloud: {i + 1}/{len(items)} items, {cloud.requests} requests")

    th = None
    if not args.no_cloud:
        th = threading.Thread(target=cloud_worker, daemon=True)
        th.start()

    # --- pass 1, local engine
    try:
        local1 = {}
        t0 = time.time()
        for i, it in enumerate(items):
            k = (it["kind"], it["epd"], it["uci"])
            if it["kind"] == "line-end":
                local1[k] = local_eval_position(eng, it["fen"], args.nodes)
            else:
                local1[k] = local_eval_move(eng, it["fen"], it["uci"], args.nodes)
            if (i + 1) % 50 == 0:
                log(f"engine pass 1: {i + 1}/{len(items)} items, {eng.searches} new searches, {time.time() - t0:.0f} s")
        log(f"engine pass 1 done: {eng.searches} new searches")
        if th:
            th.join()
            log(f"cloud done: {cloud.requests} requests this run")

        # --- confirmation pass: everything flagged or near a threshold by either source
        local2 = {}
        local3 = {}
        if args.confirm_nodes:
            todo = []
            for it in items:
                k = (it["kind"], it["epd"], it["uci"])
                l1, c = local1.get(k), cloud_results.get(k)
                if it["kind"] in ("recommended", "alternative"):
                    if rec_near(l1) or rec_near(c) or rec_flag(c):
                        todo.append(it)
                elif it["kind"] == "opponent-flagged":
                    if opp_near(l1) or opp_near(c) or opp_not_mistake(c) is not False:
                        todo.append(it)
                elif it["kind"] == "line-end":
                    def owner_cp(e, it=it):
                        if not e:
                            return None
                        own = it["occurrences"][0]["ownerSide"][0]
                        return e["cp"] if own == it["stm"] else -e["cp"]
                    a, b = owner_cp(l1), owner_cp(c)
                    if (a is not None and a <= LINE_END_BAD_CP + 20) or (b is not None and b <= LINE_END_BAD_CP + 20):
                        todo.append(it)
            log(f"confirmation pass: {len(todo)} items at {args.confirm_nodes:,} nodes")
            t0 = time.time()
            for i, it in enumerate(todo):
                k = (it["kind"], it["epd"], it["uci"])
                l1, c = local1.get(k), cloud_results.get(k)
                if it["kind"] == "line-end":
                    local2[k] = local_eval_position(eng, it["fen"], args.confirm_nodes, multipv=1)
                else:
                    cands = [l["move"] for l in (l1 or {}).get("topLines", [])]
                    if l1 and l1.get("bestMove"):
                        cands.insert(0, l1["bestMove"])
                    if c and c.get("bestMove"):
                        cands.append(c["bestMove"])
                    local2[k] = local_confirm_move(eng, it["fen"], it["uci"], args.confirm_nodes, cands)
                if (i + 1) % 10 == 0:
                    log(f"confirmation: {i + 1}/{len(todo)}, {time.time() - t0:.0f} s")

        # --- tie-break: where the confirmed local verdict and the cloud verdict disagree, search
        # once more, much deeper, with the same restricted method (root moves now include the
        # confirmation's lines and the cloud's best move).
        if args.tiebreak_nodes and args.confirm_nodes:
            tb = []
            for it in items:
                k = (it["kind"], it["epd"], it["uci"])
                l2, c = local2.get(k), cloud_results.get(k)
                if not l2 or not c:
                    continue
                if it["kind"] in ("recommended", "alternative"):
                    a, b = rec_flag(l2), rec_flag(c)
                elif it["kind"] == "opponent-flagged":
                    a, b = opp_not_mistake(l2), opp_not_mistake(c)
                else:
                    continue
                if a is not None and b is not None and bool(a) != bool(b):
                    tb.append(it)
            log(f"tie-break pass: {len(tb)} items where engine and cloud disagree, at {args.tiebreak_nodes:,} nodes")
            for it in tb:
                k = (it["kind"], it["epd"], it["uci"])
                l2, c = local2[k], cloud_results.get(k)
                cands = list(l2.get("rootMoves") or []) + [l["move"] for l in l2.get("topLines", [])]
                if c and c.get("bestMove"):
                    cands.append(c["bestMove"])
                local3[k] = local_confirm_move(eng, it["fen"], it["uci"], args.tiebreak_nodes, cands)
                log(f"tie-break: {it['occurrences'][0]['line'][-40:]} -> "
                    f"{(local3[k] or {}).get('cpLoss')} cp (was {l2.get('cpLoss')}, cloud {c.get('cpLoss', c.get('cpLossAtLeast'))})")
    finally:
        eng.close()

    # --- assemble
    results = []
    for it in items:
        k = (it["kind"], it["epd"], it["uci"])
        l1, l2, l3, c = local1.get(k), local2.get(k), local3.get(k), cloud_results.get(k)
        final = l3 or l2 or l1
        r = dict(it, localPass1=l1, localConfirm=l2, localTiebreak=l3, cloud=c,
                 localFinalNodes=(final or {}).get("nodes"))
        if it["kind"] in ("recommended", "alternative"):
            lf, cf = rec_flag(final), rec_flag(c)
            r["verdict"] = {"flaggedByEngine": lf, "flaggedByCloud": cf, "agreement": agreement(lf, cf),
                            "lichessLabelEngine": lichess_label(final["wcLoss"]) if final else None,
                            "lichessLabelCloud": lichess_label(c["wcLoss"]) if c and "wcLoss" in c else None}
        elif it["kind"] == "opponent-flagged":
            lf, cf = opp_not_mistake(final), opp_not_mistake(c)
            r["verdict"] = {"notAMistakeByEngine": lf, "notAMistakeByCloud": cf, "agreement": agreement(lf, cf),
                            "lichessLabelEngine": lichess_label(final["wcLoss"]) if final else None,
                            "lichessLabelCloud": lichess_label(c["wcLoss"]) if c and "wcLoss" in c else None,
                            "markedAs": sorted(set(n for o in it["occurrences"] for n in o["nags"]))}
        else:
            own = it["occurrences"][0]["ownerSide"][0]
            oc = lambda e: None if not e else (e["cp"] if own == it["stm"] else -e["cp"])
            r["ownerCpEngine"], r["ownerCpCloud"] = oc(final), oc(c)
            lf = r["ownerCpEngine"] is not None and r["ownerCpEngine"] <= LINE_END_BAD_CP
            cf = None if r["ownerCpCloud"] is None else r["ownerCpCloud"] <= LINE_END_BAD_CP
            r["verdict"] = {"badEndByEngine": lf, "badEndByCloud": cf, "agreement": agreement(lf, cf)}
        results.append(r)

    # positions where chapters teach different moves
    by_pos = {}
    for r in results:
        if r["kind"] == "recommended":
            by_pos.setdefault(r["epd"], []).append(r)
    conflicts = [{"epd": e, "fen": rs[0]["fen"],
                  "moves": [{"san": r["san"], "uci": r["uci"],
                             "cpLoss": ((r["localTiebreak"] or r["localConfirm"] or r["localPass1"]) or {}).get("cpLoss"),
                             "wcLoss": ((r["localTiebreak"] or r["localConfirm"] or r["localPass1"]) or {}).get("wcLoss"),
                             "chapters": sorted(set(f"{o['course']}/{o['chapter']}" for o in r["occurrences"]))}
                            for r in rs]}
                 for e, rs in by_pos.items() if len(rs) > 1]

    # when every search came from the cache the engine never started: name it from the stored searches instead
    cached_engine = next((r["engine"] for r in ecache.data.values() if r.get("engine")), None)
    settings = {
        "engine": eng.id or (f"{cached_engine} (every search read from the cache)" if cached_engine else "?"),
        "enginePath": args.engine,
        "nnue": "default net bundled with the binary",
        "pass1": {"nodes": args.nodes, "multipv": 3, "threads": args.threads, "hashMB": args.hash},
        "confirmation": {"nodes": args.confirm_nodes, "threads": args.threads, "hashMB": args.hash,
                         "rootMoves": "only the pass-1 top 3, the cloud's best move and the move under test",
                         "multipv": "one line per root move, so best and tested move come from one search",
                         "lineEnds": "MultiPV 1, unrestricted"},
        "tiebreak": {"nodes": args.tiebreak_nodes, "when": "confirmed engine verdict and cloud verdict disagree",
                     "method": "same restricted search as the confirmation, root moves = confirmation lines + cloud best + the move"},
        "moveNotInTop3": "second search with only {best move, this move} as root moves, MultiPV 2, same nodes",
        "hashPolicy": "ucinewgame (hash cleared) before each new position; kept between the searches of one position",
        "scores": "centipawns from the side to move, clamped to +-1000; mate = +-1000 (Lichess convention)",
        "winPercent": "50 + 50*(2/(1+exp(-0.00368208*cp))-1)  (lila WinPercent); a win-chance point = 1 on this 0-100 scale",
        "lichessLabels": "inaccuracy >= 5, mistake >= 10, blunder >= 15 win-chance points lost (lila Advice: 0.1/0.2/0.3)",
        "thresholds": {"recommendedCp": REC_CP, "recommendedWinChance": REC_WC, "opponentMistakeCp": OPP_CP,
                       "lineEndBadCp": LINE_END_BAD_CP,
                       "confirmIfNear": {"recommendedCp": REC_CP_NEAR, "recommendedWinChance": REC_WC_NEAR,
                                         "opponentCp": OPP_CP_NEAR, "lineEndCp": LINE_END_BAD_CP + 20}},
        "cloud": None if args.no_cloud else {
            "url": CLOUD_URL, "params": "fen, multiPv=3 (fallback multiPv=1 when the 3-line entry is missing)",
            "minSecondsBetweenRequests": args.cloud_interval, "userAgent": UA,
            "notStored": "a 404 is cached only after a stored position answered 200 in the same run",
            "moveNotInCloudLines": "eval of the position after the move (its best line, negated); "
                                   "if missing, a lower bound from the third cloud line"},
        "determinism": "Threads > 1 makes Stockfish non-deterministic: re-runs can differ by a few cp and, "
                       "rarely, in the move order of close lines.",
        "cacheLookup": "a stored search of the same position, node count, MultiPV and root moves is reused whatever "
                       "thread count and hash size it was made with (the first one stored wins)",
        "cacheFrom": str(seed) if seed else None,
        "offline": args.offline,
    }
    settings["cloudRun"] = None if args.no_cloud else {
        "requestsThisRun": cloud.requests, "secondsWaitedOn429": cloud.throttled_s, "gaveUpOnRateLimit": cloud.gave_up}
    settings["engineRun"] = {"searchesReused": eng.cache_hits, "newSearches": eng.searches,
                             "skippedForTimeBudget": eng.skipped}
    report = {"generated": now(), "started": started, "settings": settings,
              "counts": {"movesInCourses": len(moves), "checkItems": len(results)},
              "conflicts": conflicts, "items": results}
    (out / "results.json").write_text(json.dumps(report, indent=1))
    log(f"wrote {out / 'results.json'}")

    flagged = [r for r in results if r["kind"] in ("recommended", "alternative") and r["verdict"]["flaggedByEngine"]]
    notmist = [r for r in results if r["kind"] == "opponent-flagged" and r["verdict"]["notAMistakeByEngine"]]
    log(f"taught moves flagged by deep engine: {len(flagged)}; marked opponent mistakes that are not: {len(notmist)}")
    log(f"engine searches reused from caches: {eng.cache_hits}; new searches: {eng.searches}; "
        f"skipped for the time budget: {eng.skipped}; Lichess cloud requests this run: {cloud.requests}")
    if args.strict:
        fails, warns = strict_problems(results, conflicts, deliberate)
        if eng.skipped:
            # a skipped confirmation leaves a verdict resting on the shallower search only, so the check is incomplete
            fails.append(("not evaluated", f"{eng.skipped} engine search(es) were not run within --max-search-seconds, "
                                           "so some verdicts rest on a shallower search or none: run the deep check on "
                                           "the Mac and commit its cache (research/2026-10-16-diagnosis/engine/)"))
        report_strict(fails, warns, {"hits": eng.cache_hits, "new": eng.searches, "cloud": cloud.requests}, log)
        if fails:
            sys.exit(1)


if __name__ == "__main__":
    main()
