"""How many moves deep do real 1000-1300 games stay inside each course? (Kaplan-Meier over plies)

Usage: .venv/bin/python -I km.py COURSES.json OUT.json IN1.jsonl [IN2.jsonl ...]
For each course, take every sample game that starts with the course's first move(s)
(London: 1.d4; Caro-Kann: 1.e4 c6; Slav: 1.d4 d5). Replay it while both sides stay in the course
(a move listed in any chapter, or a move that lands on any course position).
 - the opponent's move leaves the course -> 'event' at that ply (the owner would be on his own from here);
 - the owner's side leaves the course -> 'censored' (this game cannot tell us more; the player was not following the course);
 - still inside after ply 24 -> survived.
Survival S(k) = product over plies <= k of (1 - events / games still inside and not censored).
This pools positions by ply instead of needing 30 games in each exact position, so it reaches deeper than the walk.
It assumes the opponent's behaviour does not depend on whether this White/Black player happens to follow the course.
Per chapter: games that touched a position found only in that chapter (or its signature position), followed from that ply.
"""
import sys, json, collections, math
import chess, chess.polyglot

courses_path, out_path, ins = sys.argv[1], sys.argv[2], sys.argv[3:]
MAXPLY = 24
zh = chess.polyglot.zobrist_hash
courses = json.load(open(courses_path))
# The owner answers 1.d4 with 1...c6 (3 of his 4 games against 1.d4 by 2026-10-16), not the Slav course's 1...d5.
# 'black-vs-d4-with-1c6' merges the Slav and Caro-Kann chapters and starts after 1.d4 c6, so 2.e4 d5 lands in the
# Caro-Kann and 2.c4 d5 / 2.Bf4 d5 / 2.Nf3 d5 land in the Slav course by transposition.
_sl = next(c for c in courses if c['id'] == 'slav'); _ck = next(c for c in courses if c['id'] == 'caro-kann')
courses.append({'id': 'black-vs-d4-with-1c6', 'name': 'Slav + Caro-Kann after 1.d4 c6', 'side': 'black', 'signatureMoves': ['d4', 'c6'],
                'chapters': [dict(ch, id='slav:' + ch['id']) for ch in _sl['chapters']] + [dict(ch, id='caro:' + ch['id']) for ch in _ck['chapters']]})
ROOT = {'london': ['d4'], 'caro-kann': ['e4', 'c6'], 'slav': ['d4', 'd5'], 'black-vs-d4-with-1c6': ['d4', 'c6']}
IDX = {}
for c in courses:
    own = chess.WHITE if c['side'] == 'white' else chess.BLACK
    anym = collections.defaultdict(set); pos_ch = collections.defaultdict(set); main_pos = collections.defaultdict(list)
    for ch in c['chapters']:
        for node in ch['nodes']:
            b = chess.Board()
            for san in node['path'][:-1]: b.push_san(san)
            hb = zh(b); b.push_san(node['san']); ha = zh(b)
            anym[hb].add(node['san']); pos_ch[hb].add(ch['id']); pos_ch[ha].add(ch['id'])
            if node['main']: main_pos[ch['id']].append(ha)
    sig = {}
    for ch in c['chapters']:
        others = set(h for o in c['chapters'] if o['id'] != ch['id'] for h in main_pos[o['id']])
        for h in main_pos[ch['id']]:
            if h not in others: sig[h] = ch['id']; break
    IDX[c['id']] = (own, anym, pos_ch, sig)

seen = set(); recs = {k: [] for k in ROOT}
for p in ins:
    for line in open(p):
        g = json.loads(line)
        if g['sp'] not in ('blitz', 'rapid'): continue
        key = (g['t'], g['w'], g['b'], tuple(g['mv'][:12]))
        if key in seen: continue
        seen.add(key)
        for cid, root in ROOT.items():
            if g['mv'][:len(root)] != root: continue
            own, anym, pos_ch, sig = IDX[cid]
            b = chess.Board(); touched = {}
            status, end = 'survived', None
            mvs = g['mv'][:MAXPLY]; i = 0; skip_check = len(root)
            while i < len(mvs):
                san = mvs[i]
                h = zh(b)
                try: mv = b.parse_san(san)
                except ValueError: status, end = 'censored', i; break
                mover = b.turn
                s = b.san(mv); b.push(mv); ha = zh(b)
                if i < skip_check or s in anym.get(h, ()) or ha in pos_ch:
                    chs = pos_ch.get(ha, set())
                    if len(chs) == 1:
                        cc = next(iter(chs)); touched.setdefault(cc, i + 1)
                    if ha in sig: touched.setdefault(sig[ha], i + 1)
                    i += 1; continue
                if mover == own: status, end = 'censored', i; break
                # opponent left: can the owner transpose back with one move (as the walk allows)?
                back = [m for m in b.legal_moves if (b.push(m), zh(b) in pos_ch, b.pop())[1]]
                if back and i + 1 < len(mvs):
                    try: nxt = b.parse_san(mvs[i + 1])
                    except ValueError: nxt = None
                    if nxt in back:
                        b.push(nxt); i += 2; continue
                    status, end = 'censored', i + 1; break
                status, end = 'event', i + 1
                break
            if status == 'survived':
                n = min(len(g['mv']), MAXPLY)
                status, end = ('survived', MAXPLY) if n >= MAXPLY else ('censored', n)
            recs[cid].append((status, end, touched, g['sp']))

def km(rows, start=0):
    """rows: (status, end_ply). Returns S(k) for k = start+1..MAXPLY and risk-set sizes."""
    out = []; S = 1.0
    for k in range(start + 1, MAXPLY + 1):
        at_risk = sum(1 for st, e in rows if e >= k or (st == 'event' and e == k))
        at_risk = sum(1 for st, e in rows if (st == 'event' and e >= k) or (st != 'event' and e >= k))
        ev = sum(1 for st, e in rows if st == 'event' and e == k)
        if at_risk: S *= 1 - ev / at_risk
        out.append({'ply': k, 'after_move': (k + 1) // 2, 'still_in_course': round(S, 4), 'at_risk': at_risk, 'events': ev})
    return out

R = {'method': __doc__, 'courses': {}}
for cid, rows in recs.items():
    own, anym, pos_ch, sig = IDX[cid]
    base = [(st, e) for st, e, _, _ in rows]
    res = {'games': len(rows), 'status_counts': dict(collections.Counter(st for st, _, _, _ in rows)),
           'survival': km(base, len(ROOT[cid])),
           'survival_rapid_only': km([(st, e) for st, e, _, sp in rows if sp == 'rapid'], len(ROOT[cid])), 'chapters': {}}
    chs = [ch['id'] for c in courses if c['id'] == cid for ch in c['chapters']]
    for chid in chs:
        sub = [(st, e, t[chid]) for st, e, t, _ in rows if chid in t]
        if not sub:
            res['chapters'][chid] = {'games_touching': 0}; continue
        # follow each game from the ply it touched the chapter
        start = min(t for _, _, t in sub)
        surv = km([(st, e) for st, e, _ in sub], start)
        get = lambda k: next((x['still_in_course'] for x in surv if x['ply'] == k), None)
        res['chapters'][chid] = {'games_touching': len(sub), 'share_of_root_games_touching': round(len(sub) / len(rows), 4),
                                 'median_touch_ply': sorted(t for _, _, t in sub)[len(sub) // 2],
                                 'still_in_course_after_move_6': get(12), 'after_move_8': get(16), 'after_move_10': get(20), 'after_move_12': get(24),
                                 'survival': surv}
    R['courses'][cid] = res
    print('==', cid, 'games', len(rows), res['status_counts'])
    print('   S:', ' '.join(f"{x['ply']}:{x['still_in_course']:.3f}({x['at_risk']})" for x in res['survival'] if x['ply'] % 2 == 0))
    print('   rapid S:', ' '.join(f"{x['ply']}:{x['still_in_course']:.3f}" for x in res['survival_rapid_only'] if x['ply'] % 2 == 0))
    for chid, v in res['chapters'].items():
        if v.get('games_touching'): print(f"   {chid:26s} touch {v['games_touching']:6d} ({v['share_of_root_games_touching']:.3f}) at ply {v['median_touch_ply']}  m6 {v['still_in_course_after_move_6']} m8 {v['after_move_8']} m10 {v['after_move_10']} m12 {v['after_move_12']}")
        else: print(f"   {chid:26s} touch 0")
json.dump(R, open(out_path, 'w'), indent=1)
