"""Reach of every course node in the September 2026 sample (both players 1000-1300, blitz + rapid).
reach = product over the opponent's moves on the path of (games with that move / games at that position);
the owner's moves count as played. Positions seen in no sample game give reach 0 below them.
Usage: .venv/bin/python -I reach.py POS.pkl COURSES.json OUT.json"""
import sys, json, pickle
import chess, chess.polyglot

pos_path, courses_path, out_path = sys.argv[1:4]
ST = pickle.load(open(pos_path, 'rb'))['stats']
zh = chess.polyglot.zobrist_hash
ROOT = {'london': 0, 'caro-kann': 1, 'slav': 1}


def moves_at(b):
    s = ST.get(zh(b))
    if not s:
        return {}, 0
    out = {k: v[0] + v[2] for k, v in s['mv'].items()}
    return out, sum(out.values())


res = {}
for c in json.load(open(courses_path)):
    own = chess.WHITE if c['side'] == 'white' else chess.BLACK
    for ch in c['chapters']:
        for node in ch['nodes']:
            key = c['id'] + '|' + ' '.join(node['path'])
            if key in res:
                continue
            b = chess.Board(); reach = 1.0; nb = 0; nm = 0
            for i, san in enumerate(node['path']):
                mvs, tot = moves_at(b)
                if i == len(node['path']) - 1:
                    nb, nm = tot, mvs.get(san, 0)
                if i >= ROOT[c['id']] and b.turn != own:
                    reach *= (mvs.get(san, 0) / tot) if tot else 0.0
                b.push_san(san)
            res[key] = {'reach': reach, 'nPos': nb, 'nMove': nm}
json.dump(res, open(out_path, 'w'))
print(len(res), 'nodes')
