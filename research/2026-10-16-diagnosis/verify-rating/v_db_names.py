"""Independent re-sample for the Lichess -> chess.com check (verify-rating pass, 2026-10-16).
Reads a byte range of a DIFFERENT monthly Lichess database (August 2026, not the September file the investigation
used), decodes the zstd frames it contains, and lists each human player's rated blitz/rapid games with the rating
shown in the game headers. Writes {username: {speed: [mean rating, games]}}.
Usage: python v_db_names.py <range.zst> <out.json>"""
import sys, json, re
import zstandard as zstd

buf = open(sys.argv[1], 'rb').read()
MAGIC = b'\x28\xb5\x2f\xfd'
pos = buf.find(MAGIC)
chunks = []
while pos != -1 and pos < len(buf):
    d = zstd.ZstdDecompressor().decompressobj()
    try:
        txt = d.decompress(buf[pos:])
        chunks.append(txt.decode('utf-8', 'replace'))
        used = len(buf) - pos - len(d.unused_data)
        nxt = pos + used if used > 0 else pos + 4
    except zstd.ZstdError:
        nxt = pos + 4
    pos = buf.find(MAGIC, nxt)
text = '\n'.join(chunks)
acc = {}
games = 0
hdr = re.compile(r'^\[(\w+) "(.*)"\]$')
cur = {}
def flush(h):
    global games
    ev = h.get('Event', '')
    m = re.match(r'Rated (Blitz|Rapid) (game|tournament)', ev)
    if not m: return
    sp = m.group(1).lower()
    games += 1
    for side in ('White', 'Black'):
        if h.get(side + 'Title') == 'BOT': continue
        try: r = int(h[side + 'Elo'])
        except (KeyError, ValueError): continue
        a = acc.setdefault(h[side], {}).setdefault(sp, [0, 0]); a[0] += r; a[1] += 1
for line in text.split('\n'):
    m = hdr.match(line.strip())
    if m:
        if m.group(1) == 'Event' and cur:
            flush(cur); cur = {}
        cur[m.group(1)] = m.group(2)
if cur: flush(cur)
out = {u: {sp: [round(v[0] / v[1]), v[1]] for sp, v in d.items()} for u, d in acc.items()}
json.dump({'games': games, 'players': out}, open(sys.argv[2], 'w'))
print('rated blitz/rapid games', games, 'players', len(out))
