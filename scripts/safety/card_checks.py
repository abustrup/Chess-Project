# Checks every card file must pass before build_cards.py writes it; check_cards.py runs them too, plus the engine
# checks. Engine-free and fast. Names follow trainer-spec section 7B; the two checks marked "new" come from the
# build plan (C1). Each check returns a list of problems ("card id: what is wrong"); an empty list is a pass.
import json, os, re
import chess
import retro_rule as R
import facts as F
from classify import see, VAL

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = os.path.join(HERE, 'cards.schema.json')
RULES = json.load(open(os.path.join(HERE, 'config.json')))['rules']   # safeMaxLoss, safeMinGain for the safety rule


# --- a small JSON Schema validator (the subset cards.schema.json uses; no third-party package needed) -------------
_TYPES = {'object': dict, 'array': list, 'string': str, 'boolean': bool, 'null': type(None)}


def _is_type(v, t):
    if t == 'integer':
        return isinstance(v, int) and not isinstance(v, bool)
    if t == 'number':
        return isinstance(v, (int, float)) and not isinstance(v, bool)
    return isinstance(v, _TYPES[t])


def validate(v, s, root, path='$'):
    if '$ref' in s:
        node = root
        for part in s['$ref'].lstrip('#/').split('/'):
            node = node[part]
        return validate(v, node, root, path)
    errs = []
    if 'type' in s:
        ts = s['type'] if isinstance(s['type'], list) else [s['type']]
        if not any(_is_type(v, t) for t in ts):
            return [f'{path}: expected {s["type"]}, got {type(v).__name__}']
    if 'const' in s and v != s['const']:
        errs.append(f'{path}: must be {s["const"]!r}')
    if 'enum' in s and v not in s['enum']:
        errs.append(f'{path}: {v!r} not in {s["enum"]}')
    for key in ('oneOf', 'anyOf'):
        if key in s:
            ok = sum(1 for sub in s[key] if not validate(v, sub, root, path))
            if (key == 'oneOf' and ok != 1) or (key == 'anyOf' and ok < 1):
                errs.append(f'{path}: matches {ok} of the {key} options')
    if isinstance(v, str):
        if 'pattern' in s and not re.search(s['pattern'], v):
            errs.append(f'{path}: {v!r} does not match {s["pattern"]}')
        if 'minLength' in s and len(v) < s['minLength']:
            errs.append(f'{path}: shorter than {s["minLength"]}')
    if _is_type(v, 'number'):
        if 'minimum' in s and v < s['minimum']:
            errs.append(f'{path}: below {s["minimum"]}')
        if 'maximum' in s and v > s['maximum']:
            errs.append(f'{path}: above {s["maximum"]}')
    if isinstance(v, list):
        if 'minItems' in s and len(v) < s['minItems']:
            errs.append(f'{path}: fewer than {s["minItems"]} items')
        if 'maxItems' in s and len(v) > s['maxItems']:
            errs.append(f'{path}: more than {s["maxItems"]} items')
        if 'items' in s:
            for k, x in enumerate(v):
                errs += validate(x, s['items'], root, f'{path}[{k}]')
    if isinstance(v, dict):
        props = s.get('properties', {})
        for k in s.get('required', []):
            if k not in v:
                errs.append(f'{path}: missing {k}')
        for k, x in v.items():
            if k in props:
                errs += validate(x, props[k], root, f'{path}.{k}')
            elif s.get('additionalProperties') is False:
                errs.append(f'{path}: unexpected field {k}')
    return errs


def check_schema(doc):
    schema = json.load(open(SCHEMA))
    return validate(doc, schema, schema)


# --- the trainer's verdict on stored data (reference for the app's accept.ts) ---------------------------------------
def stage_verdict(card, uci):
    """(True / False / None, step). None = the browser engine decides (step 6 of the schema's verdict order)."""
    side_white = card['side'] == 'white'
    top0 = card['top'][0]['eval']
    if card['kind'] == 'own' and uci == card['human']['uci']:
        return False, 'game move'
    if card['kind'] != 'own':
        for e in card.get('moves', []):
            if e['uci'] == uci:
                return R.retro_accept(side_white, e['eval'], top0) or e.get('safe') is True, 'moves'
    for e in card['top']:
        if e['uci'] == uci:
            return R.retro_accept(side_white, e['eval'], top0), 'top'
    if uci == card['human']['uci']:
        return card['human']['passes'], 'game move entry'
    if card['topComplete']:
        return False, 'outside a complete top'
    return None, 'engine'


def safe_by_rule(side_white, ev, top0, gain):
    """The safety rule of held and quiet cards (build_cards.is_safe), recomputed from the stored numbers."""
    loss = R.win_pct(side_white, top0) - R.win_pct(side_white, ev)
    mate = ev.get('mate')
    mated = mate is not None and mate != 0 and ((mate < 0) if side_white else (mate > 0))
    return not mated and loss < RULES['safeMaxLoss'] and (gain is None or gain < RULES['safeMinGain'])


def moves_list(c):
    """Held and quiet cards list every legal move once, sorted by uci, each with the eval of its own search; a move more
    than 4 points below top[0] carries a legal line starting with it, `gain` recomputed from that line (claim_gain) and
    `safe` by the safety rule; one within 4 points carries nothing more. Own cards carry no list."""
    if c['kind'] == 'own':
        return ['own card with a moves list'] if 'moves' in c else []
    if 'moves' not in c:
        return ['held or quiet card without the list of every legal move']
    b = card_board(c); me = b.turn; side_white = c['side'] == 'white'; top0 = c['top'][0]['eval']; out = []
    ucis = [e['uci'] for e in c['moves']]
    legal = sorted(m.uci() for m in b.legal_moves)
    if ucis != legal:
        out.append(f'moves lists {len(ucis)} moves, not the {len(legal)} legal moves sorted by uci')
    by = {e['uci']: e for e in c['moves']}
    for e in c['top']:
        if e['uci'] in by and by[e['uci']]['eval'] != e['eval']:
            out.append(f'top move {e["san"]} has another eval in moves')
    h = c['human']
    if h['uci'] in by and by[h['uci']]['eval'] != h['eval']:
        out.append('the game move has another eval in moves')
    for e in c['moves']:
        within = R.retro_accept(side_white, e['eval'], top0)
        extra = [k for k in ('line', 'gain', 'safe') if k in e]
        if within:
            if extra:
                out.append(f'{e["uci"]} is within 4 points but carries {extra}')
            continue
        if len(extra) != 3:
            out.append(f'{e["uci"]} is more than 4 points below the best but lacks line, gain or safe'); continue
        line = e['line']
        if not line or line[0] != e['uci'] or F.legal_prefix(b, line) != line:
            out.append(f'{e["uci"]} line is not a legal line starting with the move'); continue
        gain = F.claim_gain(b, line, me)
        if e['gain'] != gain:
            out.append(f'{e["uci"]} gain {e["gain"]} differs from its line ({gain})')
        if e['safe'] != safe_by_rule(side_white, e['eval'], top0, gain):
            out.append(f'{e["uci"]} safe is {e["safe"]}, the safety rule says {not e["safe"]}')
    return out


def card_board(c):
    b = chess.Board(c['fenBefore'])
    b.push(chess.Move.from_uci(c['lastMove']))
    return b


# --- trainer-spec 7B checks --------------------------------------------------------------------------------------
def b1(c):
    """lastMove is legal from fenBefore; afterwards side is to move and not checkmated or stalemated."""
    b = chess.Board(c['fenBefore']); mv = chess.Move.from_uci(c['lastMove'])
    if mv not in b.legal_moves:
        return ['lastMove is not legal from fenBefore']
    if b.san(mv) != c['lastMoveSan']:
        return ['lastMoveSan does not match lastMove']
    b.push(mv)
    out = []
    if (b.turn == chess.WHITE) != (c['side'] == 'white'):
        out.append('side is not to move after lastMove')
    if b.is_checkmate() or b.is_stalemate():
        out.append('no move possible after lastMove')
    return out


def b2(c):
    """top sorted by win, 1-5 entries, all legal; win and san match eval and uci; top[0] passes against itself."""
    b = card_board(c); side_white = c['side'] == 'white'; out = []
    top = c['top']
    if not 1 <= len(top) <= 5:
        out.append(f'top has {len(top)} entries')
    if len({e['uci'] for e in top}) != len(top):
        out.append('top repeats a move')
    for k, e in enumerate(top):
        mv = chess.Move.from_uci(e['uci'])
        if mv not in b.legal_moves:
            out.append(f'top[{k}] {e["uci"]} is illegal'); continue
        if b.san(mv) != e['san']:
            out.append(f'top[{k}] san mismatch')
        if abs(R.win_pct(side_white, e['eval']) - e['win']) > 0.006:
            out.append(f'top[{k}] win does not match eval')
        if not e['pv'] or e['pv'][0] != e['uci'] or F.legal_prefix(b, e['pv']) != e['pv']:
            out.append(f'top[{k}] pv is not a legal line starting with the move')
        # rounding must never flip the 4-point decision that the stored win% would give
        by_eval = R.retro_accept(side_white, e['eval'], top[0]['eval'])
        if by_eval != (e['win'] > top[0]['win'] - 4):
            out.append(f'top[{k}] rounded win% flips the 4-point decision')
    if any(top[k]['win'] < top[k + 1]['win'] for k in range(len(top) - 1)):
        out.append('top is not sorted by win')
    if not R.retro_accept(side_white, top[0]['eval'], top[0]['eval']):
        out.append('top[0] fails against itself')
    return out


def b3(c):
    """topComplete exactly when the last entry fails the 4-point test against top[0]."""
    side_white = c['side'] == 'white'
    fails = not R.retro_accept(side_white, c['top'][-1]['eval'], c['top'][0]['eval'])
    return [] if c['topComplete'] == fails else [f'topComplete is {c["topComplete"]} but the last entry {"fails" if fails else "passes"}']


def b6(c):
    """nothing-to-win cards (the defend kind of the spec): threat.loss >= 15; top[0].win <= 65; top[0] is not a capture
    with exchange gain >= 2."""
    if not c['nothingToWin']:
        return []
    out = []
    if not c['threat'] or c['threat']['loss'] < 15:
        out.append('nothingToWin without a 15-point threat')
    if c['top'][0]['win'] > 65:
        out.append(f'nothingToWin but top[0].win is {c["top"][0]["win"]}')
    b = card_board(c); mv = chess.Move.from_uci(c['top'][0]['uci'])
    if b.is_capture(mv) and see(b, mv.to_square, b.turn) >= 2:
        out.append('nothingToWin but the best move wins 2+ by exchange')
    return out


def _check_wins(board_at_reply, reply_uci, wins, mover_is_opponent_of):
    """The named piece stands on the named square and belongs to the side that loses it; the reply captures it."""
    out = []
    sq = chess.parse_square(wins['square'])
    pc = board_at_reply.piece_at(sq)
    if pc is None or pc.piece_type != F.PIECE_TYPE[wins['piece']] or pc.color != mover_is_opponent_of:
        out.append(f'named piece {wins["piece"]} is not on {wins["square"]}')
    if chess.Move.from_uci(reply_uci).to_square != sq:
        out.append(f'the reply does not take on {wins["square"]}')
    return out


def b8(c):
    """Every fact replays: moves legal; the named piece stands on the named square; mateIn equals the engine's mate
    distance and the line mates in exactly that many moves; a quiet fact only where threat.loss < 5.
    New (build plan C1): no fact says it wins material unless its stored line wins 2+ points, counted at the line's
    end with no exchange left open and by the median rule (facts.claim_gain); a free fact's piece has no defender."""
    b = card_board(c); me = b.turn; out = []
    for f in c['facts']:
        t = f['t']
        if t == 'quiet':
            if not c['threat'] or c['threat']['loss'] >= 5:
                out.append('quiet fact where the threat is 5 points or more (or untested)')
            continue
        if t == 'threat':
            start = b.copy(stack=False); start.push(chess.Move.null())
            loser = me
        else:
            start = b.copy(stack=False)
            loser = (not me) if t == 'free' else me
        line = f['line']
        if F.legal_prefix(start, line) != line or not line:
            out.append(f'{t} fact line is not legal'); continue
        if F.sans(start, line) != f['lineSan']:
            out.append(f'{t} fact lineSan does not match line')
        if t == 'threat':
            if f['reply'] != f['lineSan'][0]:
                out.append('threat reply is not the first move of its line')
            reply_board, reply = start, line[0]
        elif t == 'allowed':
            if f['move'] != f['lineSan'][0] or f['move'] != c['human']['san'] or len(line) < 2 or f['reply'] != f['lineSan'][1]:
                out.append('allowed fact does not start with the game move and its reply')
                continue
            reply_board = start.copy(stack=False); reply_board.push(chess.Move.from_uci(line[0])); reply = line[1]
        else:
            reply_board, reply = start, line[0]
        if 'mateIn' in f:
            n = f['mateIn']
            engine_n = (c['threat'] or {}).get('mateIn') if t == 'threat' else None
            if t == 'threat' and engine_n != n:
                out.append(f'threat mateIn {n} differs from the engine mate distance {engine_n}')
            mate_from = reply_board if t != 'threat' else start
            mline = line[1:] if t == 'allowed' else line
            if not F.mates_in(mate_from, mline, n):
                out.append(f'{t} fact says mate in {n} but its line does not mate in exactly {n}')
            continue
        if t == 'free':
            before_last = chess.Board(c['fenBefore'])
            gain = F.free_gain(before_last, c['lastMove'], line)
        else:
            gain = F.claim_gain(start, line, loser)
        if gain is None:
            out.append(f'{t} fact claims material but its line stops in the middle of an exchange'); continue
        if gain < 2:
            out.append(f'{t} fact claims material but its line wins {gain}')
        if f.get('gain') != gain:
            out.append(f'{t} fact gain {f.get("gain")} differs from its line ({gain})')
        if 'wins' in f:
            out += [f'{t}: {x}' for x in _check_wins(reply_board, reply, f['wins'], loser)]
            v = VAL[F.PIECE_TYPE[f['wins']['piece']]]
            if gain < max(2, v - 2):
                out.append(f'{t} fact names a {f["wins"]["piece"]} but the line nets only {gain}')
        if t == 'free':
            sq = chess.parse_square(f['square'])
            pc = b.piece_at(sq)
            if pc is None or pc.color == me or pc.piece_type != F.PIECE_TYPE[f['piece']]:
                out.append(f'free fact: no {f["piece"]} of his on {f["square"]}')
            if b.attackers(not me, sq):
                out.append(f'free fact: his {f["piece"]} on {f["square"]} is defended, so "unprotected" would be false')
            if chess.Move.from_uci(line[0]).to_square != sq or line[0] != c['top'][0]['uci']:
                out.append('free fact: the best move does not take the named piece')
    return out


def new_quiet_never_failing(c):
    """New (build plan C1): a card with a quiet fact never has a failing game move."""
    if any(f['t'] == 'quiet' for f in c['facts']):
        ok, _ = stage_verdict(c, c['human']['uci'])
        if ok is not True:
            return ['quiet fact on a card whose game move does not pass']
    return []


def held_quiet_game_move(c):
    """On held and quiet cards the game move passes when it was within 4 points of the best or safe (its moves entry),
    and only then; held cards are only kept when it passes (build_cards.held_confirmed)."""
    if c['kind'] == 'own':
        return []
    within = R.retro_accept(c['side'] == 'white', c['human']['eval'], c['top'][0]['eval'])
    entry = next((e for e in c.get('moves', []) if e['uci'] == c['human']['uci']), {})
    right = within or entry.get('safe') is True
    ok, _ = stage_verdict(c, c['human']['uci'])
    out = []
    if right and ok is not True:
        out.append('game move within 4 points of the best (or safe), but the stage rule does not pass it')
    if not right and ok is True:
        out.append('game move neither within 4 points nor safe, but the stage rule passes it')
    # human.passes and human.eval must agree with top and moves, whichever field the app reads first
    if c['human']['passes'] != right:
        out.append('human.passes does not match human.eval against top[0] and the safety rule')
    if c['kind'] == 'held' and not right:
        out.append('held card whose game move fails')
    if any(e['uci'] == c['human']['uci'] and e['eval'] != c['human']['eval'] for e in c['top']):
        out.append('human.eval differs from the same move in top')
    return out


def own_game_move(c):
    """trainer-spec B4 (own): human.uci is legal and fails, also by the card's own numbers."""
    if c['kind'] != 'own':
        return []
    b = card_board(c); out = []
    if chess.Move.from_uci(c['human']['uci']) not in b.legal_moves:
        out.append('game move is illegal')
    if c['human']['passes'] or R.retro_accept(c['side'] == 'white', c['human']['eval'], c['top'][0]['eval']):
        out.append('own card whose game move passes the 4-point test')
    return out


def kind_rules(c):
    out = []
    if c['kind'] == 'held' and not c['facingThreat']:
        out.append('held card without a concrete threat')
    if c['kind'] == 'quiet' and (c['facingThreat'] or [f['t'] for f in c['facts']] != ['quiet']):
        out.append('quiet card must have exactly the quiet fact and no threat')
    if c['kind'] != 'quiet' and any(f['t'] == 'quiet' for f in c['facts']):
        out.append('quiet fact on a non-quiet card')
    if c['wasWinning'] != (c['winBefore'] >= 75):
        out.append('wasWinning does not match winBefore')
    if c['id'].split(':')[0] != c['kind'] or c['id'].split(':')[1] != c['context']['gameId']:
        out.append('id does not match kind and game')
    return out


CARD_CHECKS = (b1, b2, b3, b6, b8, new_quiet_never_failing, held_quiet_game_move, own_game_move, kind_rules, moves_list)


def other_names(games, user):
    """Every Lichess username in the inputs other than his own: none may appear in a card file."""
    names = set()
    for g in games:
        for c in ('white', 'black'):
            u = ((g.get('players', {}).get(c) or {}).get('user') or {})
            for k in ('id', 'name'):
                if u.get(k) and u[k].lower() != user.lower():
                    names.add(u[k])
    return sorted(names)


def privacy(text, names):
    out = []
    if re.search(r'https?://|lichess\.org|www\.', text, re.I):
        out.append('file contains a URL')
    low = text.lower()
    for n in names:
        if re.search(r'(?<![A-Za-z0-9_-])' + re.escape(n.lower()) + r'(?![A-Za-z0-9_-])', low):
            out.append(f'file contains an opponent username ({len(n)} characters, not printed)')
    return out


def check_file(doc, names=()):
    problems = [f'schema: {e}' for e in check_schema(doc)]
    if problems:
        return problems
    ids = [c['id'] for c in doc['cards']]
    if len(set(ids)) != len(ids):
        problems.append('duplicate card ids')
    counts = {k: sum(1 for c in doc['cards'] if c['kind'] == k) for k in ('own', 'held', 'quiet')}
    if counts != doc['counts']:
        problems.append(f'counts {doc["counts"]} differ from the cards {counts}')
    if doc['cards'] and counts['quiet'] > 0.15 * len(doc['cards']):
        problems.append(f'quiet cards are {counts["quiet"]} of {len(doc["cards"])}, above 15%')
    for c in doc['cards']:
        for fn in CARD_CHECKS:
            problems += [f'{c["id"]} {fn.__name__}: {p}' for p in fn(c)]
    problems += privacy(json.dumps(doc, ensure_ascii=False), names)
    return problems
