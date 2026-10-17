"""Extract player names and ratings from a byte range of a Lichess monthly database file (.pgn.zst).
Usage: python db_players.py <range.zst> <out.json>
Decodes every complete zstd frame inside the range (the files are written as many independent frames)."""
import sys, json, re, collections
import zstandard as zstd

data = open(sys.argv[1], 'rb').read()
magic = b'\x28\xb5\x2f\xfd'
starts = []
i = data.find(magic)
while i != -1:
    starts.append(i); i = data.find(magic, i + 1)
text = []
for a, b in zip(starts, starts[1:]):
    try:
        text.append(zstd.ZstdDecompressor().decompressobj().decompress(data[a:b]).decode('utf8', 'replace'))
    except Exception as e:
        print('frame skipped', a, e, file=sys.stderr)
txt = '\n'.join(text)
players = collections.defaultdict(lambda: collections.defaultdict(list))
games = 0
for block in txt.split('[Event "')[1:]:
    h = dict(re.findall(r'^\[(\w+) "([^"]*)"\]', '[Event "' + block, re.M))
    ev = h.get('Event', '')
    m = re.match(r'Rated (\w+) (game|tournament)', ev)
    if not m or 'WhiteElo' not in h or 'BlackElo' not in h: continue
    speed = m.group(1).lower()
    if speed not in ('blitz', 'rapid', 'bullet', 'classical'): continue
    games += 1
    for side in ('White', 'Black'):
        if h.get(side + 'Title') == 'BOT': continue
        try: players[h[side]][speed].append(int(h[side + 'Elo']))
        except: pass
out = {u: {sp: [round(sum(v) / len(v)), len(v)] for sp, v in d.items()} for u, d in players.items()}
json.dump({'games': games, 'players': out}, open(sys.argv[2], 'w'))
print('games', games, 'players', len(out))
