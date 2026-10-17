# Stockfish access for the card builder: a small pool of single-thread engines plus a cache of every search result.
# Every search starts from an empty hash (a new "game" for python-chess, so it sends ucinewgame), with Threads 1 and a
# fixed node count, so the same position always gives the same answer and a rebuild is byte-identical.
# The cache is keyed by engine name, kind, position and setting; a rebuild from the cache needs no engine at all.
import json, os, threading
from concurrent.futures import ThreadPoolExecutor
import chess, chess.engine


def score_json(pov_score):
    w = pov_score.white()
    return {'mate': w.mate()} if w.is_mate() else {'cp': w.score()}


class Engines:
    def __init__(self, path, name, workers, cache_path, threads=1, hash_mb=64):
        self.path, self.name, self.workers = path, name, max(1, workers)
        self.threads, self.hash_mb = threads, hash_mb
        self.cache_path = cache_path
        self.cache = {}
        self.used = set()
        self.lock = threading.Lock()
        self.local = threading.local()
        self.all = []
        self.searches = 0
        # one persistent pool: its threads keep their engine, so there are never more than `workers` engine processes
        self.ex = ThreadPoolExecutor(max_workers=self.workers)
        if cache_path and os.path.exists(cache_path):
            for l in open(cache_path):
                r = json.loads(l)
                self.cache[r['key']] = r['value']

    # --- engine processes -----------------------------------------------------------------------------------------
    def _eng(self):
        e = getattr(self.local, 'eng', None)
        if e is None:
            e = chess.engine.SimpleEngine.popen_uci(self.path)
            e.configure({'Threads': self.threads, 'Hash': self.hash_mb})
            got = e.id.get('name')
            if got != self.name:
                e.quit()
                raise SystemExit(f'engine at {self.path} says "{got}", the configured setting is "{self.name}"; '
                                 f'cards from different engines must not be mixed (change config.json on purpose)')
            self.local.eng = e
            with self.lock:
                self.all.append(e)
        return e

    def close(self):
        self.ex.shutdown(wait=True)
        for e in self.all:
            try: e.quit()
            except Exception: pass
        self.all = []

    def map(self, fn, items):
        """Run fn over items on the pool (engine work never runs on the main thread), results in input order."""
        return list(self.ex.map(fn, list(items)))

    # --- cache --------------------------------------------------------------------------------------------------------
    def _get(self, key):
        k = json.dumps(key, separators=(',', ':'))
        with self.lock:
            if k in self.cache:
                self.used.add(k)
                return True, self.cache[k]
        return False, None

    def _put(self, key, value):
        k = json.dumps(key, separators=(',', ':'))
        with self.lock:
            self.cache[k] = value; self.used.add(k); self.searches += 1

    def save(self):
        """Rewrite the cache sorted by key, so the committed file is the same whatever order the workers finished in."""
        if not self.cache_path:
            return
        os.makedirs(os.path.dirname(self.cache_path) or '.', exist_ok=True)
        tmp = self.cache_path + '.tmp'
        with open(tmp, 'w') as f:
            for k in sorted(self.cache):
                f.write(json.dumps({'key': k, 'value': self.cache[k]}, separators=(',', ':'), sort_keys=True) + '\n')
        os.replace(tmp, self.cache_path)

    # --- searches -----------------------------------------------------------------------------------------------------
    def search(self, fen, nodes, multipv=1, root_moves=None):
        """Lines from a fresh-hash search of `fen` (no move history): [{'uci', 'score' (White POV), 'pv', 'depth'}]."""
        key = [self.name, 'search', fen, nodes, multipv, sorted(root_moves) if root_moves else None]
        hit, val = self._get(key)
        if hit:
            return val
        b = chess.Board(fen)
        kw = {}
        if root_moves:
            kw['root_moves'] = [chess.Move.from_uci(u) for u in root_moves]
        infos = self._eng().analyse(b, chess.engine.Limit(nodes=nodes), multipv=multipv, game=object(), **kw)
        if isinstance(infos, dict):
            infos = [infos]
        out = []
        for info in infos:
            pv = info.get('pv') or []
            if not pv:
                continue
            out.append({'uci': pv[0].uci(), 'score': score_json(info['score']), 'pv': [m.uci() for m in pv[:12]],
                        'depth': info.get('depth')})
        self._put(key, out)
        return out

    def extend(self, fen, prefix, plies, nodes):
        """lines.py semantics: from `fen` play `prefix`, then keep playing the engine's best move (sequential searches,
        one hash for the whole line, cleared at its start) until the line has `plies` moves or the game is over."""
        key = [self.name, 'extend', fen, nodes, list(prefix), plies]
        hit, val = self._get(key)
        if hit:
            return val
        b = chess.Board(fen); out = []
        for u in prefix:
            mv = chess.Move.from_uci(u)
            if mv not in b.legal_moves:
                break
            b.push(mv); out.append(u)
        marker = object()
        eng = None
        while len(out) < plies and not b.is_game_over():
            eng = eng or self._eng()
            info = eng.analyse(b, chess.engine.Limit(nodes=nodes), game=marker)
            pv = info.get('pv') or []
            if not pv:
                break
            b.push(pv[0]); out.append(pv[0].uci())
        self._put(key, out)
        return out

    def settle(self, fen, prefix, extra, nodes, quiet_end):
        """`prefix` carried on by the engine's best moves (as extend: one hash for the line, cleared at its start) until
        quiet_end(board, line) holds, i.e. no exchange is left open, or `extra` more plies were played. A prefix that
        already ends quiet costs no search and is not cached."""
        if quiet_end(chess.Board(fen), list(prefix)):
            return list(prefix)
        key = [self.name, 'settle', fen, nodes, list(prefix), extra]
        hit, val = self._get(key)
        if hit:
            return val
        b = chess.Board(fen); out = []
        for u in prefix:
            b.push(chess.Move.from_uci(u)); out.append(u)
        marker = object()
        eng = self._eng()
        for _ in range(extra):
            if b.is_game_over():
                break
            info = eng.analyse(b, chess.engine.Limit(nodes=nodes), game=marker)
            pv = info.get('pv') or []
            if not pv:
                break
            b.push(pv[0]); out.append(pv[0].uci())
            if quiet_end(chess.Board(fen), out):
                break
        self._put(key, out)
        return out

    def measure_position(self, g, ply, my_white, nodes, null_nodes):
        """prereg measure.py analyse_game for one position (ply = moves played so far), unchanged in substance: the
        position searched with the game's move history at `nodes`, and the null-move threat probe where he is to move
        and not in check. Every search has an empty hash, so positions can be split across engines freely."""
        b = chess.Board()
        for san in g['moves'].split()[:ply]:
            b.push_san(san)
        row = {'ply': ply, 'fen': b.fen()}
        if b.is_checkmate():
            row['score'] = {'mate': 0, 'mated': 'white' if b.turn == chess.WHITE else 'black'}
        elif b.is_stalemate() or b.is_insufficient_material():
            row['score'] = {'cp': 0}; row['terminal'] = True
        else:
            eng = self._eng()
            info = eng.analyse(b, chess.engine.Limit(nodes=nodes), game=object())
            pv = info.get('pv', [])
            row['score'] = score_json(info['score']); row['best'] = pv[0].uci() if pv else None
            row['pv'] = [m.uci() for m in pv[:12]]; row['depth'] = info.get('depth')
            if (b.turn == chess.WHITE) == my_white and not b.is_check():
                nb = b.copy(stack=False); nb.push(chess.Move.null())
                if nb.is_valid():
                    ni = eng.analyse(chess.Board(nb.fen()), chess.engine.Limit(nodes=null_nodes), game=object())
                    npv = ni.get('pv', [])
                    row['null'] = {'score': score_json(ni['score']), 'best': npv[0].uci() if npv else None,
                                   'pv': [m.uci() for m in npv[:8]]}
            with self.lock:
                self.searches += 1 + ('null' in row)
        return row
