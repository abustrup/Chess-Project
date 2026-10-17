"""Independent metrics (written from scratch) from a per-ply engine record.
Input format (normalised): for each game, a list of rows ply k = 0..N: eval (white POV {'cp'} / {'mate'}) or terminal,
best (uci), null eval (white POV) + null_pv, played (uci, for k < N)."""
import json, math, random, chess, sys
sys.path.insert(0, '.')
from vrule import judge, winpct

ME = 'abustrup'
VAL = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0}

def load_games():
    return {json.loads(l)['id']: json.loads(l) for l in open('../my-games/lichess_abustrup.ndjson')}

def norm_theirs(path):
    """Their sf_250k_bothnull.jsonl -> normalised rows (only raw engine outputs are used, none of their labels)."""
    games = load_games(); res = {}
    for l in open(path):
        r = json.loads(l); g = games[r['id']]; sans = g['moves'].split()
        b = chess.Board(); rows = []
        for k, p in enumerate(r['positions']):
            row = {'ply': k, 'fen': b.fen(), 'in_check': b.is_check()}
            s = p.get('score') or {}
            if b.is_checkmate(): row['terminal'] = 'checkmate'
            elif b.is_stalemate() or b.is_insufficient_material(): row['terminal'] = 'draw'
            else:
                if 'cp' in s: row['cp'] = s['cp']
                elif 'mate' in s: row['mate'] = s['mate']
                row['best'] = p.get('best'); row['pv'] = p.get('pv') or []
                if p.get('null'):
                    ns = p['null']['score']; row['null'] = {'cp': ns['cp']} if 'cp' in ns else {'mate': ns['mate']}
                    row['null_pv'] = p['null'].get('pv') or []
            if k < len(sans):
                mv = b.parse_san(sans[k]); row['played'] = mv.uci(); b.push(mv)
            rows.append(row)
        res[r['id']] = rows
    return res

def norm_mine(paths):
    res = {}
    for path in paths:
        for l in open(path):
            r = json.loads(l); res[r['id']] = r['rows']
    return res

def ev(row):
    if 'cp' in row: return {'cp': row['cp']}
    if 'mate' in row: return {'mate': row['mate']}
    return None

def wp_white(row):
    """White win% at this position."""
    if row.get('terminal') == 'checkmate':
        b = chess.Board(row['fen']); return 0.0 if b.turn == chess.WHITE else 100.0
    if row.get('terminal') == 'draw': return 50.0
    if 'mate' in row: return 100.0 if row['mate'] > 0 else 0.0
    return winpct(row['cp'])

def wp_for(row, white):
    w = wp_white(row); return w if white else 100 - w

def material(board, color):
    return sum(VAL[p.piece_type] for p in board.piece_map().values() if p.color == color)

def threat_info(row):
    """Null-move threat for the side NOT to move at row (i.e. what the opponent threatens).
    Returns (drop_in_win_pct_for_mover, material_gain_for_opponent, opponent_mates)."""
    if 'null' not in row: return None
    b = chess.Board(row['fen']); mover_white = b.turn == chess.WHITE
    w_real = wp_for(row, mover_white)
    n = row['null']
    if 'mate' in n: w_null_white = 100.0 if n['mate'] > 0 else 0.0
    else: w_null_white = winpct(n['cp'])
    w_null = w_null_white if mover_white else 100 - w_null_white
    opp_mates = ('mate' in n) and ((n['mate'] < 0) if mover_white else (n['mate'] > 0))
    nb = b.copy(); nb.push(chess.Move.null())
    opp = nb.turn
    pv = row.get('null_pv') or []
    k = min(len(pv), 6)
    if k >= 2 and k % 2 == 1: k -= 1   # end after the threatened side's reply, never mid-exchange
    m0 = material(nb, opp) - material(nb, not opp)
    try:
        for u in pv[:k]: nb.push(chess.Move.from_uci(u))
    except Exception: pass
    gain = (material(nb, opp) - material(nb, not opp)) - m0
    return w_real - w_null, gain, opp_mates

def wilson(k, n, z=1.96):
    if n == 0: return (float('nan'),) * 2
    p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return ((c - h) / d, (c + h) / d)

def per_move(rows, g):
    """Yield one dict per ply with judgement for the mover."""
    me_white = g['players']['white']['user']['id'] == ME
    for k in range(len(rows) - 1):
        a, b = rows[k], rows[k + 1]
        mover_white = (k % 2 == 0)
        mine = (mover_white == me_white)
        d = {'ply': k + 1, 'mine': mine, 'mover_white': mover_white, 'movenum': k // 2 + 1}
        pe = ev(a)
        if pe is None:  # should not happen for a non-terminal position
            continue
        if b.get('terminal') == 'checkmate':
            d['label'] = None; d['drop'] = 0.0
        else:
            ne = ev(b) if b.get('terminal') != 'draw' else {'cp': 0}
            if a.get('best') and a.get('played') == a.get('best'):
                d['label'] = None
            else:
                d['label'] = judge(pe, ne, mover_white)
            d['drop'] = wp_for(a, mover_white) - wp_for(b, mover_white)
        d['threat'] = threat_info(a)
        d['in_check'] = a.get('in_check')
        yield d

def result_for(g, white):
    w = g.get('winner')
    if w is None: return 'draw'
    return 'win' if (w == 'white') == white else 'loss'
