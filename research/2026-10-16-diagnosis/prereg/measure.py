# Pre-registered measuring instrument (research/2026-10-16-diagnosis/preregistration.md, 2026-10-16).
# Turns Alexander's rated 10+0 Lichess games into one CSV row per game: his moves, his blunders by Lichess's own
# game-page rule (replicated on a fixed Stockfish setting, so no "Request computer analysis" click is needed),
# the threat test, his opponents' blunders, ratings, and Lichess's own count where Lichess analysed the game.
#
# Usage, from the repo root (needs .venv with python-chess 1.11.x and Stockfish 19):
#   .venv/bin/python -I research/2026-10-16-diagnosis/prereg/measure.py --out games.csv --cache evals.jsonl
#   options: --input FILE.ndjson   use a saved Lichess export instead of downloading
#            --tc 600+0            time control (default 600+0); --perf rapid (default rapid)
#            --stockfish PATH      (default /opt/homebrew/bin/stockfish, or $STOCKFISH)
#            --max-games N         only the first N games (tests)
# The engine setting is FROZEN by the pre-registration: Stockfish 19, 250,000 nodes per position, Threads 1,
# Hash 64 MB, a new game (empty hash) before every search; the same setting for the threat test. Calibrated on
# 2026-10-16 against Lichess's own labels on his 6 analysed games: precision 0.92, recall 0.91 (429 moves).
# Version 2 (2026-10-16, before the time-stamp): adds two descriptive columns (win_nothreat_moves and
# win_nothreat_blunders: tested moves made with his win chance above 75% and no concrete threat). Nothing else changed.
import sys, os, json, csv, argparse, urllib.request
import chess, chess.engine
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lichess_rule import lichess_judgment, wp_mover, START   # identical copy of my-games/scripts/lichess_rule.py

USER = 'abustrup'
NODES = 250000
NULL_NODES = 250000
THREADS = 1
HASH_MB = 64
PIPELINE = 'prereg-measure-2'
SINCE_MS = 1792108800000   # 2026-10-16 00:00 UTC; he had 0 rapid games before this date
VAL = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0}


def fetch(perf):
    url = (f'https://lichess.org/api/games/user/{USER}?rated=true&perfType={perf}&clocks=true&evals=true'
           f'&opening=true&sort=dateAsc&since={SINCE_MS}')
    req = urllib.request.Request(url, headers={'Accept': 'application/x-ndjson',
                                               'User-Agent': 'ChessCoach-measure/1.0 (+https://github.com/abustrup/Chess-Project)'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return [json.loads(l) for l in r.read().decode().splitlines() if l.strip()]


def eligible(g, tc):
    c = g.get('clock') or {}
    if tc == 'any':   # tests on other time controls only; the pre-registered measure uses 600+0
        base, inc = c.get('initial'), c.get('increment')
    else:
        base, inc = (int(x) for x in tc.split('+'))
    bot = any((g['players'][c].get('user') or {}).get('title') == 'BOT' for c in ('white', 'black'))
    return (g.get('rated') and g.get('variant') == 'standard' and 'initialFen' not in g and not bot
            and c.get('initial') == base and c.get('increment') == inc
            and g.get('status') not in ('created', 'started', 'aborted', 'noStart', 'unknownFinish')
            and len(g.get('moves', '').split()) >= 1)


def score_json(pov_score):
    w = pov_score.white()
    return {'mate': w.mate()} if w.is_mate() else {'cp': w.score()}


def material(board, color):
    return sum((VAL[p.piece_type] if p.color == color else -VAL[p.piece_type]) for p in board.piece_map().values())


def pv_material_path(board, pv_uci, color, plies):
    b = board.copy(stack=False); out = []
    for u in pv_uci[:plies]:
        mv = chess.Move.from_uci(u)
        if mv not in b.legal_moves:
            break
        b.push(mv); out.append(material(b, color))
    return out


def load_cache(path):
    cache = {}
    if path and os.path.exists(path):
        for l in open(path):
            r = json.loads(l)
            if r.get('nodes') == NODES:
                cache[r['id']] = r
    return cache


def analyse_game(eng, g, my_white):
    """Every position at NODES; the null-move threat probe where he is to move and not in check (same as my-games)."""
    b = chess.Board(); rows = []
    sans = g['moves'].split()
    for ply in range(len(sans) + 1):
        if ply > 0:
            b.push_san(sans[ply - 1])
        row = {'ply': ply, 'fen': b.fen()}
        if b.is_checkmate():
            row['score'] = {'mate': 0, 'mated': 'white' if b.turn == chess.WHITE else 'black'}
        elif b.is_stalemate() or b.is_insufficient_material():
            row['score'] = {'cp': 0}; row['terminal'] = True
        else:
            info = eng.analyse(b, chess.engine.Limit(nodes=NODES), game=object())   # new game = empty hash
            pv = info.get('pv', [])
            row['score'] = score_json(info['score']); row['best'] = pv[0].uci() if pv else None
            row['pv'] = [m.uci() for m in pv[:12]]; row['depth'] = info.get('depth')
            if (b.turn == chess.WHITE) == my_white and not b.is_check():
                nb = b.copy(stack=False); nb.push(chess.Move.null())
                if nb.is_valid():
                    ni = eng.analyse(chess.Board(nb.fen()), chess.engine.Limit(nodes=NULL_NODES), game=object())
                    npv = ni.get('pv', [])
                    row['null'] = {'score': score_json(ni['score']), 'best': npv[0].uci() if npv else None,
                                   'pv': [m.uci() for m in npv[:8]]}
        rows.append(row)
    return {'id': g['id'], 'nodes': NODES, 'null_nodes': NULL_NODES, 'positions': rows}


def game_row(g, sf, my_white):
    my_color = chess.WHITE if my_white else chess.BLACK
    pos = sf['positions']; sans = g['moves'].split()
    b = chess.Board()
    c = dict(my_moves=0, my_blunders=0, my_mistakes=0, my_inaccuracies=0, threat_moves=0, threat_blunders=0,
             nothreat_moves=0, nothreat_blunders=0, win_nothreat_moves=0, win_nothreat_blunders=0, untested_moves=0,
             opp_moves=0, opp_blunders=0)
    for i, san in enumerate(sans):
        mover_white = b.turn == chess.WHITE
        before = b.copy(stack=False)
        mv = b.parse_san(san)
        prev_s = START if i == 0 else pos[i]['score']
        cur_s = pos[i + 1]['score']
        j, _ = lichess_judgment(prev_s, cur_s, mover_white, played_is_best=(pos[i].get('best') == mv.uci()))
        b.push(mv)
        if mover_white != my_white:
            c['opp_moves'] += 1; c['opp_blunders'] += j == 'Blunder'
            continue
        c['my_moves'] += 1
        c['my_blunders'] += j == 'Blunder'; c['my_mistakes'] += j == 'Mistake'; c['my_inaccuracies'] += j == 'Inaccuracy'
        null = pos[i].get('null')
        if null is None or i == 0:   # in check, no probe possible, or the game's first move: not in the threat test
            c['untested_moves'] += 1
            continue
        ns = null['score']
        # threat test, same definition as my-games/scripts/analyse_games.py: if the opponent could move again,
        # he gains 15+ win% points AND wins 2+ points of material (median of the last 3 plies of a 6-ply line) or mates
        size = wp_mover(prev_s, my_white) - wp_mover(ns, my_white)
        nb = before.copy(stack=False); nb.push(chess.Move.null())
        m0 = material(before, my_color)
        path = [m0] + pv_material_path(nb, null.get('pv', []), my_color, 6)
        loss = m0 - sorted(path[-3:])[len(path[-3:]) // 2] if len(path) >= 3 else m0 - min(path)
        mate = 'mate' in ns and ((ns['mate'] > 0) != my_white)
        real = size >= 15 and (loss >= 2 or mate)
        if real:
            c['threat_moves'] += 1; c['threat_blunders'] += j == 'Blunder'
        else:
            c['nothreat_moves'] += 1; c['nothreat_blunders'] += j == 'Blunder'
            if wp_mover(prev_s, my_white) > 75:   # descriptive: winning (above 75%) and nothing threatened
                c['win_nothreat_moves'] += 1; c['win_nothreat_blunders'] += j == 'Blunder'
    return c


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True); ap.add_argument('--cache'); ap.add_argument('--input')
    ap.add_argument('--tc', default='600+0'); ap.add_argument('--perf', default='rapid')
    ap.add_argument('--stockfish', default=os.environ.get('STOCKFISH', '/opt/homebrew/bin/stockfish'))
    ap.add_argument('--max-games', type=int)
    a = ap.parse_args()
    games = [json.loads(l) for l in open(a.input)] if a.input else fetch(a.perf)
    games = sorted((g for g in games if eligible(g, a.tc)), key=lambda g: g['createdAt'])
    if a.max_games:
        games = games[:a.max_games]
    cache = load_cache(a.cache)
    eng = None; sf_version = None
    rows = []
    cache_out = open(a.cache, 'a') if a.cache else None
    for seq, g in enumerate(games, 1):
        my_white = g['players']['white'].get('user', {}).get('id') == USER
        if g['id'] not in cache:
            if eng is None:
                eng = chess.engine.SimpleEngine.popen_uci(a.stockfish)
                eng.configure({'Threads': THREADS, 'Hash': HASH_MB})
                sf_version = eng.id.get('name')
            cache[g['id']] = analyse_game(eng, g, my_white)
            if cache_out:
                cache_out.write(json.dumps(cache[g['id']]) + '\n'); cache_out.flush()
            print('analysed', seq, g['id'], file=sys.stderr, flush=True)
        c = game_row(g, cache[g['id']], my_white)
        me = g['players']['white' if my_white else 'black']; op = g['players']['black' if my_white else 'white']
        w = g.get('winner')
        score = 0.5 if w is None else (1.0 if w == ('white' if my_white else 'black') else 0.0)
        la = me.get('analysis')
        rows.append(dict(seq=seq, game_id=g['id'], created_at_ms=g['createdAt'], colour='white' if my_white else 'black',
                         my_rating=me.get('rating'), my_rating_diff=me.get('ratingDiff'), my_provisional=bool(me.get('provisional')),
                         opp_rating=op.get('rating'), score=score, status=g['status'], plies=len(g['moves'].split()),
                         **c, lichess_analysed=la is not None, lichess_my_blunders=(la or {}).get('blunder'),
                         engine=sf_version or 'cached', nodes=NODES, pipeline=PIPELINE))
    if eng:
        eng.quit()
    fields = list(rows[0].keys()) if rows else ['seq']
    with open(a.out, 'w', newline='') as f:
        wr = csv.DictWriter(f, fieldnames=fields); wr.writeheader(); wr.writerows(rows)
    print(f'{len(rows)} games written to {a.out}', file=sys.stderr)


if __name__ == '__main__':
    main()
