# Replaces opponents' usernames in the raw game files with fixed placeholders, so the files can sit in the public repo.
# Lichess opponents become "Opponent 01", "Opponent 02", ... in the order of his games; chess.com opponents continue the
# numbering after the Lichess ones. The number depends only on the order of the games, whether a name is still real or
# already a placeholder, so a fresh Lichess export gets the same numbers as before for the same games (a chess.com
# placeholder moves up when new Lichess opponents arrive). A space never appears in a Lichess or chess.com username, so a
# placeholder cannot point at a real account.
# Only names change: ratings, rating changes, titles, game ids, moves, clocks and evals stay byte for byte, and the
# script refuses to write if anything else would differ or if a name would survive. Running it on already scrubbed
# files changes nothing.
# Usage: .venv/bin/python -I scripts/scrub_usernames.py SRC_DIR DST_DIR   (DST_DIR may equal SRC_DIR)
# Written 2026-10-16 (R1 in research/2026-10-16-diagnosis/build-plan.md); numbering made order-only the same day.
import json, os, re, sys

ME = 'abustrup'
LI_JSON, LI_PGN = 'lichess_abustrup.ndjson', 'lichess_abustrup_raw.pgn'
CC_JSON, CC_PGN = 'chesscom_abustrup_2020-03.json', 'chesscom_abustrup_2020-03.pgn'
PLACEHOLDER = re.compile(r'^Opponent \d+$', re.I)
src, dst = sys.argv[1:3]
dump = lambda o: json.dumps(o, separators=(',', ':'), ensure_ascii=False)
read = lambda f: open(os.path.join(src, f), encoding='utf-8').read()

li = [json.loads(l) for l in read(LI_JSON).splitlines() if l.strip()]
cc = json.loads(read(CC_JSON))
assert ''.join(dump(g) + '\n' for g in li) == read(LI_JSON) and dump(cc) == read(CC_JSON), 'unexpected JSON layout'

users = lambda g: [g['players'][c]['user'] for c in ('white', 'black') if 'user' in g['players'][c]]   # no user: AI game


def number(names, start):
    # Distinct opponents in order of first game -> "Opponent NN", counting on from start. Lichess and chess.com get
    # separate maps, because the same text on the two sites can be two different people.
    m = {}
    for n in names:
        if n.lower() != ME and n.lower() not in m:
            m[n.lower()] = f'Opponent {start + len(m) + 1:02d}'
    return m


def substituter(m):
    if not m:
        return lambda s: s
    word = re.compile(r'(?<![A-Za-z0-9_-])(' + '|'.join(re.escape(n) for n in sorted(m, key=len, reverse=True)) +
                      r')(?![A-Za-z0-9_-])', re.I)
    return lambda s: word.sub(lambda x: m[x.group(1).lower()], s)


MAP_LI = number([u['name'] for g in sorted(li, key=lambda g: g['createdAt']) for u in users(g)], 0)
MAP_CC = number([g[c]['username'] for g in sorted(cc['games'], key=lambda g: g['end_time']) for c in ('white', 'black')],
                len(MAP_LI))
sub_li, sub_cc = substituter(MAP_LI), substituter(MAP_CC)
REAL = [n for n in list(MAP_LI) + list(MAP_CC) if not PLACEHOLDER.match(n)]   # real names found in the input


def leaves(o, p=''):
    if isinstance(o, dict):
        for key, v in o.items(): yield from leaves(v, f'{p}.{key}')
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from leaves(v, f'{p}[{i}]')
    else:
        yield p, o


def same_but_names(a, b, allowed):
    la, lb = dict(leaves(a)), dict(leaves(b))
    assert la.keys() == lb.keys(), 'structure changed'
    bad = [p for p in la if la[p] != lb[p] and not re.search(allowed, p)]
    assert not bad, f'non-name fields changed: {bad[:5]}'


def pgn_only_names(a, b):
    for x, y in zip(a.split('\n'), b.split('\n')):
        assert x == y or re.match(r'^\[(White|Black|Termination) "', x), f'PGN line changed: {x[:60]}'


new_li = []
for g in li:
    h = json.loads(dump(g))
    for u in users(h):
        if u['name'].lower() in MAP_LI:
            u['name'] = MAP_LI[u['name'].lower()]; u['id'] = u['name'].lower()
    h['pgn'] = sub_li(h['pgn'])
    same_but_names(g, h, r'\.user\.(name|id)$|\.pgn$'); pgn_only_names(g['pgn'], h['pgn'])
    new_li.append(h)
new_cc = json.loads(dump(cc))
for g in new_cc['games']:
    for c in ('white', 'black'):
        p = g[c]
        if p['username'].lower() in MAP_CC:
            p['username'] = MAP_CC[p['username'].lower()]; p['@id'] = '(removed)'; p['uuid'] = '(removed)'
    g['pgn'] = sub_cc(g['pgn'])
same_but_names(cc, new_cc, r'\.(username|@id|uuid|pgn)$')
for a, b in zip(cc['games'], new_cc['games']): pgn_only_names(a['pgn'], b['pgn'])
out = {LI_JSON: ''.join(dump(g) + '\n' for g in new_li), CC_JSON: dump(new_cc),
       LI_PGN: sub_li(read(LI_PGN)), CC_PGN: sub_cc(read(CC_PGN))}
pgn_only_names(read(LI_PGN), out[LI_PGN]); pgn_only_names(read(CC_PGN), out[CC_PGN])
# No real name may survive anywhere, and every opponent left in a name field must be a placeholder
if REAL:
    left = re.compile(r'(?<![A-Za-z0-9_-])(' + '|'.join(re.escape(n) for n in REAL) + r')(?![A-Za-z0-9_-])', re.I)
    assert not any(left.search(t) for t in out.values()), 'a name survived the replacement'
fields = [u['name'] for g in new_li for u in users(g)] + [g[c]['username'] for g in new_cc['games'] for c in ('white', 'black')]
fields += [h for t in [*out.values(), *(g['pgn'] for g in new_li), *(g['pgn'] for g in new_cc['games'])]
           for h in re.findall(r'^\[(?:White|Black) "([^"]*)"\]', t, re.M) if h != 'Anonymous' and not h.startswith('lichess AI')]
assert all(n.lower() == ME or PLACEHOLDER.match(n) for n in fields), 'a name field is neither his nor a placeholder'
for f, text in out.items():
    open(os.path.join(dst, f), 'w', encoding='utf-8').write(text)
moved = sum(1 for m in (MAP_LI, MAP_CC) for k, v in m.items() if PLACEHOLDER.match(k) and k != v.lower())
print(f'{len(REAL)} opponent names replaced, {moved} placeholders renumbered; only name fields changed')
