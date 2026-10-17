#!/usr/bin/env python3
# Card builder for the Safety-check trainer: turns his own Lichess games into public/data/safety/cards.json.
# Spec: research/2026-10-16-diagnosis/build-plan.md (C1) and design/trainer-spec.md (2.2-2.5). CLI: README.md here.
#
# Three kinds of card, all positions from his own rated games, just after his opponent's move:
#   own   : his move met Lichess's "Learn from your mistakes" rule, was a Blunder or Mistake (ours or Lichess's), and
#           lost material, allowed mate, missed a tactic or was made facing a concrete threat; already-lost positions
#           (below 10%) are left out. The game move always fails, as on Lichess.
#   held  : he faced a concrete threat (the pre-registered threat test) and made no Blunder or Mistake.
#   quiet : nothing was threatened (under 5 points), nothing to win, and his move was fine; at most 15% of the file,
#           at most one per game, picked in game order so that adding games never changes earlier picks.
# On held and quiet cards every legal move is searched (`moves`), and a move is right when it is within 4 points of the
# best or SAFE: it costs under 15 points (not a Blunder by size), allows no mate, and its settled line gives away less
# than 2 points of material. Those cards train "check, then play a safe move", not matching the engine's first choice.
# Steps: measurement evals (prereg measure.py setting, reused from its cache when given) -> 8-ply lines for judged
# moves (lines.py) -> the my-games classifier (classify.py) -> card searches (MultiPV 5, 1M nodes) -> facts -> checks.
# Every search is cached (data/safety/engine-cache.jsonl), so an unchanged game costs nothing and a rebuild is
# byte-identical. The file is only written when every check in card_checks.py passes.
import argparse, datetime, hashlib, json, os, sys, time, collections
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import chess
import classify as C
import engine as E
import facts as F
import retro_rule as R
import card_checks as K

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
JUDGED = ('Blunder', 'Mistake')
BAD_STATUS = ('created', 'started', 'aborted', 'noStart', 'unknownFinish')
CODE_FILES = ('build_cards.py', 'classify.py', 'engine.py', 'facts.py', 'retro_rule.py', 'card_checks.py', 'config.json')


def rp(p):
    return p if os.path.isabs(p) else os.path.join(ROOT, p)


def log(*a):
    print(*a, file=sys.stderr, flush=True)


# --- inputs -------------------------------------------------------------------------------------------------------
def load_games(paths):
    by_id = {}
    for p in paths:
        for l in open(rp(p)):
            if not l.strip():
                continue
            g = json.loads(l)
            old = by_id.get(g['id'])
            if old is None or ('analysis' in g and 'analysis' not in old):   # a later export may carry Lichess's analysis
                by_id[g['id']] = g
    return list(by_id.values())


def eligible(g, user, speeds):
    pl = g.get('players', {})
    mine = [c for c in ('white', 'black') if C.is_me(pl.get(c), user)]
    if len(mine) != 1:
        return False
    opp = pl['black' if mine[0] == 'white' else 'white']
    return (g.get('rated') is True and g.get('variant') == 'standard' and 'initialFen' not in g
            and g.get('speed') in speeds and ((opp or {}).get('user') or {}).get('title') != 'BOT'
            and g.get('status') not in BAD_STATUS and len(g.get('moves', '').split()) >= 2 and g.get('clock'))


def load_evals(paths, nodes, null_nodes):
    ev = {}
    for p in paths:
        if not os.path.exists(rp(p)):
            continue
        for l in open(rp(p)):
            r = json.loads(l)
            if r.get('nodes') == nodes and r.get('null_nodes') == null_nodes and r['id'] not in ev:
                ev[r['id']] = r
    return ev


def evals_fit(g, row, user):
    """The cached evals belong to this game: one row per position with matching FENs, a null probe wherever he was to
    move and not in check (the threat test needs it), and a score everywhere."""
    pos = row.get('positions', [])
    sans = g['moves'].split()
    if len(pos) != len(sans) + 1:
        return False
    me_white = C.is_me(g['players']['white'], user)
    b = chess.Board()
    for k in range(len(sans) + 1):
        if k > 0:
            b.push_san(sans[k - 1])
        if pos[k].get('fen') != b.fen() or 'score' not in pos[k]:
            return False
        if (not b.is_game_over() and (b.turn == chess.WHITE) == me_white and not b.is_check() and 'null' not in pos[k]):
            nb = b.copy(stack=False); nb.push(chess.Move.null())
            if nb.is_valid():
                return False
    return True


def load_lines(paths):
    out = {}
    for p in paths:
        if not os.path.exists(rp(p)):
            continue
        for l in open(rp(p)):
            r = json.loads(l)
            out.setdefault((r['id'], r['ply']), {'played_line': r['played_line'], 'best_line': r['best_line']})
    return out


def code_hash():
    h = hashlib.sha256()
    for f in CODE_FILES:
        h.update(open(os.path.join(HERE, f), 'rb').read())
    return h.hexdigest()[:12]


def iso(ms):
    return datetime.datetime.fromtimestamp(ms / 1000, tz=datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def side_name(white):
    return 'white' if white else 'black'


# --- selection ----------------------------------------------------------------------------------------------------
def own_candidate(m, rules):
    """None when the move is not in the own-card universe (the mistakes.json records in the listed categories or
    flagged something_to_defend); otherwise a list of exclusion reasons (empty = keep)."""
    if not (m['judgment'] in JUDGED or m['lichess_judgment'] in JUDGED):
        return None
    if not (m['category'] in C.OWN_CATEGORIES or m['flags']['something_to_defend']):
        return None
    why = []
    if m['ply'] == 1:
        why.append('no opponent move before it')
    if m['win_pct_before'] < rules['minWinBefore']:
        why.append(f"already lost: his win% before the move was {m['win_pct_before']} (below {rules['minWinBefore']})")
    ours = R.is_retro_candidate(m['prev_s'], m['cur_s'])
    li = (m['lichess_score_before'] is not None and m['lichess_score_after'] is not None
          and R.is_retro_candidate(m['lichess_score_before'], m['lichess_score_after']))
    if not (ours or li):
        sw = round(abs(R.pov_diff(True, m['prev_s'], m['cur_s'])) * 100, 1)
        why.append(f'not a "Learn from your mistakes" move: win% swing {sw} points on the +-1000 scale (needs more '
                   f'than 10, or a lost mate in 3 or fewer)')
    if chess.Board(m['fen_before']).legal_moves.count() < 2:
        why.append('only one legal move')
    return why


def held_candidate(m, rules):
    if not m['threat_was_real'] or m['judgment'] in JUDGED or m['lichess_judgment'] in JUDGED:
        return None
    why = []
    if m['win_pct_before'] < rules['minWinBefore']:
        why.append(f"already lost: his win% before the move was {m['win_pct_before']} (below {rules['minWinBefore']})")
    if chess.Board(m['fen_before']).legal_moves.count() < 2:
        why.append('only one legal move')
    return why


def quiet_candidates(moves, rules):
    """His tested moves with no threat (null-move threat under 5 points), no judgement by either count, from move 6 on,
    not lost; winning positions (75%+, the pre-registered S7 situation) first, then a fixed hash order."""
    out = []
    for m in moves:
        t = m['threat_before']
        if (t is None or m['ply'] == 1 or t['size'] >= rules['quietMaxThreat'] or m['judgment'] is not None
                or m['lichess_judgment'] is not None or m['move_number'] < rules['quietMinMoveNumber']
                or m['win_pct_before'] < rules['minWinBefore'] or chess.Board(m['fen_before']).legal_moves.count() < 2):
            continue
        out.append(m)
    key = lambda m: (0 if m['win_pct_before'] >= rules['winningAt'] else 1,
                     hashlib.sha1(f"{m['game_id']}:{m['ply']}".encode()).hexdigest())
    return sorted(out, key=key)[:rules['quietTries']]


# --- card searches and assembly -----------------------------------------------------------------------------------
def opp_mate(score, side_white):
    """Mate distance for the side NOT to be trained, from a White-POV score, or None."""
    if 'mate' not in score or score['mate'] == 0:
        return None
    m = score['mate'] if side_white else -score['mate']
    return -m if m < 0 else None


def card_searches(eng, cfg, m, kind):
    cs = cfg['cards']; ext = cs['extendNodes']
    fen = m['fen_before']; side_white = chess.Board(fen).turn == chess.WHITE
    # MultiPV picks the candidate moves; each is then searched on its own (root_moves) at the same node count, so a
    # move in `top` gets exactly the verdict a separate search of that move gives (trainer-spec B10), and the game
    # move is measured the same way
    alone = lambda u: eng.search(fen, cs['nodes'], 1, root_moves=[u])[0]
    top = [alone(e['uci']) for e in eng.search(fen, cs['nodes'], cs['multipv'])]
    top.sort(key=lambda e: -R.win_pct(side_white, e['score']))   # stable: ties keep the MultiPV order
    hum = next((e for e in top if e['uci'] == m['move_uci']), None) or alone(m['move_uci'])
    extra = {}
    # a line that may back a claim of material is carried on until no exchange is left open (facts.claim_gain)
    settle = lambda f, line, plies: eng.settle(f, F.legal_prefix(chess.Board(f), line)[:plies], F.SETTLE_PLIES, ext, F.quiet_end)
    if m['null'] is not None:
        nl = m['null'].get('pv', [])[:8]
        mn = opp_mate(m['null']['score'], side_white)
        nb = chess.Board(fen); nb.push(chess.Move.null())
        if mn is not None and len(nl) < 2 * mn - 1:
            nl = eng.extend(nb.fen(), nl, 2 * mn - 1, ext)
        extra['null_line'] = nl
        if m['threat_was_real']:
            extra['null_settled'] = settle(nb.fen(), nl, F.THREAT_PLIES)
    if kind == 'own':
        ln = m['long_line']
        pl = list(ln['played_line']) if ln else [m['move_uci']] + list(m['pv_after'][:7])
        mn = m['opponent_mate_in']
        want = max(8, 2 * mn) if mn else 8
        if len(pl) < want:
            pl = eng.extend(fen, pl, want, ext)
        extra['played_line'] = pl
        extra['played_settled'] = settle(fen, pl, F.ALLOWED_PLIES)
    if kind != 'own' and not R.retro_accept(side_white, hum['score'], top[0]['score']):
        extra['hum_line'] = safety_line(eng, cfg, fen, hum)
    if top and chess.Board(fen).is_capture(chess.Move.from_uci(top[0]['uci'])):
        bl = top[0]['pv'][:6]
        if len(bl) < 6:
            bl = eng.extend(fen, bl, 6, ext)
        extra['best_line'] = bl
        extra['best_settled'] = settle(fen, bl, F.FREE_PLIES)
    return {'top': top, 'hum': hum, 'extra': extra}


def safety_line(eng, cfg, fen, e):
    """The line of a move searched on its own (`e`, starting with the move), first SAFE_PLIES plies carried on until no
    exchange is left open, so the material it gives away is final (facts.claim_gain)."""
    pre = F.legal_prefix(chess.Board(fen), e['pv'])[:F.SAFE_PLIES] or [e['uci']]
    return eng.settle(fen, pre, F.SETTLE_PLIES, cfg['cards']['extendNodes'], F.quiet_end)


def move_entry(board, e, line, top0, rules):
    """One legal move of a held or quiet card. Within 4 points of the best: right, and only the eval is stored.
    Otherwise also the settled line, the material it gives away (`gain`, None when the line still ends in an open
    exchange) and `safe`: under `safeMaxLoss` points lost, no mate against him, and less than `safeMinGain` given away."""
    side_white = board.turn == chess.WHITE
    ent = {'uci': e['uci'], 'eval': e['score']}
    if R.retro_accept(side_white, e['score'], top0):
        return ent
    line = F.legal_prefix(board, line) or [e['uci']]
    gain = F.claim_gain(board, line, board.turn)
    ent.update(line=line, gain=gain, safe=is_safe(side_white, e['score'], top0, gain, rules))
    return ent


def is_safe(side_white, ev, top0, gain, rules):
    loss = R.win_pct(side_white, top0) - R.win_pct(side_white, ev)
    return bool(opp_mate(ev, side_white) is None and loss < rules['safeMaxLoss']
                and (gain is None or gain < rules['safeMinGain']))


def every_move(eng, cfg, card):
    """`moves` for a held or quiet card: every legal move searched on its own (root_moves) at the card setting, as the
    top moves are (so those come from the cache), with its settled line when it is more than 4 points below the best."""
    board = chess.Board(card['fenBefore']); board.push(chess.Move.from_uci(card['lastMove']))
    fen = board.fen(); side_white = board.turn == chess.WHITE
    top0 = card['top'][0]['eval']
    out = []
    for u in sorted(mv.uci() for mv in board.legal_moves):
        e = eng.search(fen, cfg['cards']['nodes'], 1, root_moves=[u])[0]
        line = None if R.retro_accept(side_white, e['score'], top0) else safety_line(eng, cfg, fen, e)
        out.append(move_entry(board, e, line, top0, cfg['rules']))
    return out


def entry(board, e, side_white):
    return {'uci': e['uci'], 'san': board.san(chess.Move.from_uci(e['uci'])), 'win': round(R.win_pct(side_white, e['score']), 2),
            'eval': e['score'], 'pv': e['pv'][:6]}


def round_wins(top, side_white):
    """Keeps 2 decimals on each top[].win unless that puts a move on the other side of the 4-point line than its eval
    does; then the card keeps more. Example (verifier, 2026-10-16): White's best move at -2.95 and another at -3.56
    round to 25.23 and 21.23, exactly 4 apart, though the evals put the second move inside the line. card_checks.b2
    refuses such a file, and with cached searches the same card would stop every later build. Returns the places."""
    for places in (2, 3, 4, 6):
        for e in top:
            e['win'] = round(R.win_pct(side_white, e['eval']), places)
        if all(R.retro_accept(side_white, e['eval'], top[0]['eval']) == (e['win'] > top[0]['win'] - 4) for e in top):
            break
    return places


def build_card(kind, m, g, sf, res, cfg, user):
    rules = cfg['rules']
    ply = m['ply']; i = ply - 1
    card_board = chess.Board(m['fen_before'])
    before_last = chess.Board(sf[i - 1]['fen'])
    last = before_last.parse_san(g['moves'].split()[i - 1])
    side_white = card_board.turn == chess.WHITE
    top = [entry(card_board, e, side_white) for e in res['top']]
    places = round_wins(top, side_white)
    top_complete = not R.retro_accept(side_white, top[-1]['eval'], top[0]['eval'])
    h = res['hum']
    if kind == 'own':
        passes = False
    else:   # the safety rule of held and quiet cards (move_entry), so `passes` equals the game move's `moves` entry
        hm = move_entry(card_board, h, res['extra'].get('hum_line'), top[0]['eval'], rules)
        passes = hm.get('safe', True)
    human = {'uci': m['move_uci'], 'san': m['move_san'], 'win': round(R.win_pct(side_white, h['score']), places), 'eval': h['score'],
             'passes': passes, 'judgment': m['judgment'], 'lichessJudgment': m['lichess_judgment'],
             'drop': m['win_pct_drop']}
    threat = None; facts = []
    t = m['threat_before']
    if t is not None:
        mn = opp_mate(m['null']['score'], side_white) if t['mate_threatened'] else None
        nl = res['extra'].get('null_line', [])
        keep = (2 * mn - 1) if mn else 6
        nb = card_board.copy(stack=False); nb.push(chess.Move.null())
        line = F.legal_prefix(nb, nl)[:max(keep, 1)]
        threat = {'loss': t['size'], 'material': t['material_threatened'], 'mateIn': mn, 'real': m['threat_was_real'],
                  'line': line, 'lineSan': F.sans(nb, line)}
        if m['threat_was_real']:
            tf = F.threat_fact(card_board, nl, mn, res['extra'].get('null_settled'))
            if tf:
                facts.append(tf)
    if kind == 'own':
        af = F.allowed_fact(card_board, res['extra']['played_line'], m['opponent_mate_in'], res['extra'].get('played_settled'))
        if af:
            facts.append(af)
    free = None
    if 'best_line' in res['extra']:
        free = F.free_fact(before_last, last.uci(), card_board, res['extra']['best_line'], res['extra'].get('best_settled'))
        if free:
            facts.append(free)
    if kind == 'quiet':
        facts = [{'t': 'quiet'}]
    top0_cap = F.capture_target(card_board, top[0]['uci'])
    top0_see = C.see(card_board, top0_cap[1], card_board.turn) if top0_cap else 0
    ntw = bool(m['flags']['nothing_to_win'] and top[0]['win'] <= rules['nothingToWinMaxWin'] and top0_see < 2
               and threat and threat['loss'] >= 15)
    tc = g['clock']
    card = {
        'id': f"{kind}:{g['id']}:{ply}", 'kind': kind, 'cls': m['category'] if kind == 'own' else kind,
        'fenBefore': before_last.fen(), 'lastMove': last.uci(), 'lastMoveSan': before_last.san(last),
        'side': side_name(side_white), 'phase': m['phase_research'],
        'facingThreat': bool(m['threat_was_real']), 'nothingToWin': ntw,
        'wasWinning': m['win_pct_before'] >= rules['winningAt'], 'winBefore': m['win_pct_before'],
        'top': top, 'topComplete': top_complete, 'human': human, 'threat': threat, 'facts': facts,
        'context': {'gameId': g['id'], 'date': iso(g['createdAt'])[:10], 'tc': f"{tc['initial']}+{tc['increment']}",
                    'speed': g['speed'], 'rated': True, 'moveNumber': m['move_number'],
                    'clockMs': (round(m['clock_before_s'] * 1000) if m['clock_before_s'] is not None else None),
                    'spentMs': (round(m['time_spent_s'] * 1000) if m['time_spent_s'] is not None else None)},
    }
    return card, free, top0_see


def own_confirmed(card):
    """The card's own search must agree that the game move was a mistake: not the best move, and more than 4 points
    below it. Otherwise the trainer would fail a move its own numbers call fine."""
    h = card['human']; top = card['top']
    if h['uci'] == top[0]['uci']:
        return 'the card search (1M nodes, MultiPV 5) finds the game move best'
    if R.retro_accept(card['side'] == 'white', h['eval'], top[0]['eval']):
        return f"the card search (1M nodes, MultiPV 5) puts the game move within 4 points of the best ({h['win']} vs {top[0]['win']})"
    return None


def held_confirmed(card, res, rules):
    """A held card shows a position he held: his game move must be right by the card's own search (the safety rule).
    None when it is, else the reason it is left out."""
    if card['human']['passes']:
        return None
    board = chess.Board(card['fenBefore']); board.push(chess.Move.from_uci(card['lastMove']))
    side_white = card['side'] == 'white'
    h = card['human']; top0 = card['top'][0]
    hm = move_entry(board, res['hum'], res['extra'].get('hum_line'), top0['eval'], rules)
    loss = R.win_pct(side_white, top0['eval']) - R.win_pct(side_white, h['eval'])
    why = ('it allows a forced mate' if opp_mate(h['eval'], side_white) is not None
           else f"its line gives away {hm['gain']} points of material" if (hm.get('gain') or 0) >= rules['safeMinGain']
           else f"it costs {loss:.1f} points against the best move ({h['win']} vs {top0['win']})")
    return f'the card search (1M nodes) finds the game move unsafe: {why}'


def quiet_ok(card, free, top0_see):
    if not R.retro_accept(card['side'] == 'white', card['human']['eval'], card['top'][0]['eval']):
        return 'his move is more than 4 points below the best in the card search'
    if free or top0_see >= 2:
        return 'the best move wins material'
    if 'mate' in card['top'][0]['eval'] and card['top'][0]['win'] > 50:
        return 'he had a forced mate'
    th = card['threat']
    if th is None or th['loss'] >= 5:
        return 'threat of 5 points or more'
    return None


def safety_counts(cards):
    """How the safety rule changes the verdicts on held and quiet cards, per kind: legal moves, moves within 4 points,
    moves that are only right because they are safe, and moves that are wrong (with how many give away 2+ points)."""
    out = {}
    for kind in ('held', 'quiet'):
        ms = [m for c in cards if c['kind'] == kind for m in c.get('moves', [])]
        out[kind] = {'cards': sum(1 for c in cards if c['kind'] == kind), 'moves': len(ms),
                     'within4': sum(1 for m in ms if 'safe' not in m), 'safeOnly': sum(1 for m in ms if m.get('safe') is True),
                     'wrong': sum(1 for m in ms if m.get('safe') is False),
                     'wrongMaterial': sum(1 for m in ms if m.get('safe') is False and (m['gain'] or 0) >= 2)}
    return out


def dump(doc):
    head = [f' {json.dumps(k)}: {json.dumps(v, ensure_ascii=False, separators=(",", ":"))}' for k, v in doc.items() if k != 'cards']
    cards = ',\n'.join('  ' + json.dumps(c, ensure_ascii=False, separators=(',', ':')) for c in doc['cards'])
    return '{\n' + ',\n'.join(head) + ',\n "cards": [\n' + cards + '\n ]\n}\n'


def main():
    ap = argparse.ArgumentParser(description='Build the Safety-check cards from his own Lichess games (see README.md).')
    ap.add_argument('--config', default=os.path.join(HERE, 'config.json'))
    ap.add_argument('--games', action='append', default=[], help='Lichess export (NDJSON); repeatable; added to the base games')
    ap.add_argument('--evals', action='append', default=[], help='measurement eval cache (prereg measure.py format); repeatable')
    ap.add_argument('--lines', action='append', default=[], help='8-ply line files (my-games lines.py format); repeatable')
    ap.add_argument('--no-base', action='store_true', help='leave out the base inputs listed in config.json')
    ap.add_argument('--out'); ap.add_argument('--report')
    ap.add_argument('--engine-cache'); ap.add_argument('--evals-cache')
    ap.add_argument('--stockfish', default=os.environ.get('STOCKFISH', '/opt/homebrew/bin/stockfish'))
    ap.add_argument('--workers', type=int, default=3, help='engine processes (Threads 1 each); default 3')
    ap.add_argument('--only-games', help='comma-separated game ids (tests)')
    a = ap.parse_args()
    t0 = time.time()
    cfg = json.load(open(a.config))
    user, rules, ms = cfg['user'], cfg['rules'], cfg['measurement']
    paths = cfg['paths']
    out_path = rp(a.out or paths['out']); report_path = rp(a.report or paths['report'])
    eng_cache = rp(a.engine_cache or paths['engineCache']); evals_cache = rp(a.evals_cache or paths['evalsCache'])
    base = {'games': [], 'evals': [], 'lines': []} if a.no_base else cfg['base']

    games = [g for g in load_games(base['games'] + a.games) if eligible(g, user, cfg['speeds'])]
    if a.only_games:
        keep = set(a.only_games.split(','))
        games = [g for g in games if g['id'] in keep]
    games.sort(key=lambda g: (g['createdAt'], g['id']))
    if not games:
        raise SystemExit('no eligible games in the inputs')
    log(f'{len(games)} eligible games')

    eng = E.Engines(a.stockfish, cfg['engine']['name'], a.workers, eng_cache, cfg['engine']['threads'], cfg['engine']['hashMb'])
    try:
        # 1. measurement evals: reuse any cache with the frozen setting, analyse the rest
        evals = load_evals(base['evals'] + a.evals + [evals_cache], ms['nodes'], ms['nullNodes'])
        own_evals = load_evals([evals_cache], ms['nodes'], ms['nullNodes'])
        todo = [g for g in games if g['id'] not in evals or not evals_fit(g, evals[g['id']], user)]
        if todo:
            log(f'measurement evals for {len(todo)} games')
            jobs = [(g, ply) for g in todo for ply in range(len(g['moves'].split()) + 1)]
            rows = eng.map(lambda j: eng.measure_position(j[0], j[1], C.is_me(j[0]['players']['white'], user), ms['nodes'],
                                                          ms['nullNodes']), jobs)
            for g in todo:
                r = {'id': g['id'], 'nodes': ms['nodes'], 'null_nodes': ms['nullNodes'],
                     'positions': [row for (gg, _), row in zip(jobs, rows) if gg is g]}
                evals[g['id']] = r; own_evals[g['id']] = r
            os.makedirs(os.path.dirname(evals_cache), exist_ok=True)
            with open(evals_cache + '.tmp', 'w') as f:
                for gid in sorted(own_evals):
                    f.write(json.dumps(own_evals[gid], separators=(',', ':')) + '\n')
            os.replace(evals_cache + '.tmp', evals_cache)

        # 2. 8-ply lines for judged moves with short engine lines (lines.py)
        lines = load_lines(base['lines'] + a.lines)
        targets = []
        for g in games:
            for ply, fen, uci in C.line_targets(g, evals[g['id']]['positions'], user):
                if (g['id'], ply) not in lines:
                    targets.append((g['id'], ply, fen, uci))
        if targets:
            log(f'8-ply lines for {len(targets)} moves')
            got = eng.map(lambda t: (eng.extend(t[2], [t[3]], ms['linePlies'], ms['lineNodes']),
                                     eng.extend(t[2], [], ms['linePlies'], ms['lineNodes'])), targets)
            for t, (pl, bl) in zip(targets, got):
                lines[(t[0], t[1])] = {'played_line': pl, 'best_line': bl}

        # 3. the my-games classifier on every move he played
        moves = {}
        for g in games:
            gl = {ply: v for (gid, ply), v in lines.items() if gid == g['id']}
            moves[g['id']] = C.classify_game(g, evals[g['id']]['positions'], gl, user)

        # 4. candidates
        excluded = []; plan = []   # plan: (game, kind, move)
        for g in games:
            for m in moves[g['id']]:
                for kind, fn in (('own', own_candidate), ('held', held_candidate)):
                    why = fn(m, rules)
                    if why is None:
                        continue
                    if why:
                        excluded.append({'id': f"{kind}:{g['id']}:{m['ply']}", 'kind': kind, 'judgment': m['judgment'],
                                         'lichessJudgment': m['lichess_judgment'], 'category': m['category'], 'reasons': why})
                    else:
                        plan.append((g, kind, m))
            for m in quiet_candidates(moves[g['id']], rules):
                plan.append((g, 'quiet', m))

        # 5. card searches (cached), then assembly in game order
        log(f'card searches for {len(plan)} positions')
        results = eng.map(lambda p: card_searches(eng, cfg, p[2], p[1]), plan)

        cards = []; quiet_log = []
        n_main = n_quiet = 0
        by_game = collections.OrderedDict()
        for (g, kind, m), res in zip(plan, results):
            by_game.setdefault(g['id'], (g, []))[1].append((kind, m, res))
        for gid, (g, items) in by_game.items():
            sf = evals[gid]['positions']
            for kind, m, res in items:
                if kind == 'quiet':
                    continue
                card, _, _ = build_card(kind, m, g, sf, res, cfg, user)
                why = own_confirmed(card) if kind == 'own' else held_confirmed(card, res, rules)
                if why:
                    excluded.append({'id': card['id'], 'kind': kind, 'judgment': m['judgment'], 'lichessJudgment': m['lichess_judgment'],
                                     'category': m['category'], 'reasons': [why]})
                    continue
                cards.append(card); n_main += 1
            taken = 0
            for kind, m, res in items:
                if kind != 'quiet' or taken >= rules['quietPerGame']:
                    continue
                card, free, see0 = build_card(kind, m, g, sf, res, cfg, user)
                why = quiet_ok(card, free, see0)
                if why is None and (n_quiet + 1) > rules['quietMaxShare'] * (n_main + n_quiet + 1):
                    why = 'quiet share would pass 15% of the cards so far'
                quiet_log.append({'id': card['id'], 'taken': why is None, 'why': why})
                if why is None:
                    cards.append(card); n_quiet += 1; taken += 1

        # 6. every legal move of the held and quiet cards, for the safety rule (move_entry)
        need = [c for c in cards if c['kind'] != 'own']
        log(f'every legal move of {len(need)} held and quiet cards')
        for c, mv in zip(need, eng.map(lambda c: every_move(eng, cfg, c), need)):
            c['moves'] = mv
    finally:
        eng.save()
        eng.close()

    order = {g['id']: k for k, g in enumerate(games)}
    cards.sort(key=lambda c: (order[c['context']['gameId']], int(c['id'].split(':')[2])))
    speeds = collections.Counter(g['speed'] for g in games)
    counts = collections.Counter(c['kind'] for c in cards)
    doc = {
        'version': 1,
        'generatedAt': iso(games[-1]['createdAt']),
        'pipeline': f'scripts/safety/build_cards.py v1 code {code_hash()}',
        'engine': {'name': cfg['engine']['name'], 'nodes': cfg['cards']['nodes'], 'multipv': cfg['cards']['multipv'],
                   'threads': cfg['engine']['threads'], 'hashMb': cfg['engine']['hashMb'], 'freshHashEachSearch': True,
                   'measurementNodes': ms['nodes'], 'lineNodes': ms['lineNodes'], 'extendNodes': cfg['cards']['extendNodes']},
        'source': (f"Lichess games of {user}: {len(games)} rated games ("
                   + ', '.join(f'{n} {s}' for s, n in sorted(speeds.items())) + f"), {iso(games[0]['createdAt'])[:10]} to "
                   f"{iso(games[-1]['createdAt'])[:10]}"),
        'counts': {'own': counts['own'], 'held': counts['held'], 'quiet': counts['quiet']},
        'cards': cards,
    }
    text = dump(doc)
    problems = K.check_file(json.loads(text), names=K.other_names(games, user))
    report = {
        'about': 'Build report of scripts/safety/build_cards.py: inputs, counts, every left-out candidate with its reason, '
                 'and the quiet picks. Deterministic, so a rebuild gives the same file.',
        'pipeline': doc['pipeline'], 'engine': doc['engine'],
        'source': doc['source'], 'games': [g['id'] for g in games], 'counts': doc['counts'],
        'excluded': sorted(excluded, key=lambda x: (order[x['id'].split(':')[1]], int(x['id'].split(':')[2]), x['kind'])),
        'quietTried': quiet_log, 'safetyRule': safety_counts(cards),
        'checks': {'problems': len(problems), 'first': problems[:20]},
    }
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w') as f:
        f.write(json.dumps(report, indent=1, ensure_ascii=False) + '\n')
    if problems:
        log(f'{len(problems)} check problems; {os.path.relpath(out_path, ROOT)} NOT written. First: {problems[:5]}')
        sys.exit(2)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w') as f:
        f.write(text)
    log(f"wrote {os.path.relpath(out_path, ROOT)}: {dict(doc['counts'])}, {len(excluded)} left out, "
        f"{eng.searches} new searches, {time.time() - t0:.1f} s")


if __name__ == '__main__':
    main()
