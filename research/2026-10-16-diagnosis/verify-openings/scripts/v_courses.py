"""Verifier: parse every chapter's PGN with python-chess (independent of the app's pgnTree.ts) and build
position indexes for the walk.

Usage (as a module): from v_courses import load_courses; C = load_courses(PATH_TO_course_pgn.json)
Run directly to print counts of own-move decision positions per course.

Definitions used here:
- key(board): FEN fields 1-4 (pieces, side to move, castling, legal en-passant square) -> merges transpositions.
- own decision position: a position where it is the course owner's turn and at least one chapter gives a move.
  'main' move at a position = the move that is the FIRST child at that node in a chapter (the line the chapter
  recommends); when chapters disagree, majority of chapters, ties to the earlier chapter.
"""
import io, json, sys, collections
import chess, chess.pgn

def key(b):
    return ' '.join(b.fen(en_passant='legal').split()[:4])

def load_courses(path):
    raw = json.load(open(path))
    out = {}
    for c in raw:
        own = chess.WHITE if c['side'] == 'white' else chess.BLACK
        pos_moves = collections.defaultdict(set)        # any move given at a position (either side)
        pos_in = collections.defaultdict(set)           # position -> chapters containing it
        first_votes = collections.defaultdict(list)     # own position -> [(chapter_index, san)] first-child moves
        per_chapter_decisions = collections.defaultdict(set)
        parse_errors = []
        for ci, ch in enumerate(c['chapters']):
            g = chess.pgn.read_game(io.StringIO(ch['pgn']))
            if g.errors: parse_errors.append((ch['id'], [str(e) for e in g.errors]))
            stack = [g]
            while stack:
                node = stack.pop()
                b = node.board()
                kb = key(b)
                pos_in[kb].add(ch['id'])
                for vi, child in enumerate(node.variations):
                    san = b.san(child.move)
                    pos_moves[kb].add(san)
                    if b.turn == own and vi == 0:
                        first_votes[kb].append((ci, san))
                        per_chapter_decisions[ch['id']].add(kb)
                    stack.append(child)
        choice, conflicts = {}, []
        for kb, votes in first_votes.items():
            cnt = collections.Counter(s for _, s in votes)
            top = max(cnt.values())
            cands = [s for s, n in cnt.items() if n == top]
            best = min(cands, key=lambda s: min(ci for ci, ss in votes if ss == s))
            choice[kb] = best
            if len(cnt) > 1:
                conflicts.append({'pos': kb, 'moves': {s: sorted({c['chapters'][ci]['id'] for ci, ss in votes if ss == s}) for s in cnt}})
        own_positions_any = {kb for kb, mv in pos_moves.items() if kb.split()[1] == ('w' if own == chess.WHITE else 'b')}
        out[c['id']] = dict(own=own, pos_moves=pos_moves, pos_in=pos_in, choice=choice, conflicts=conflicts,
                            per_chapter_decisions=per_chapter_decisions, own_positions_any=own_positions_any,
                            chapters=[ch['id'] for ch in c['chapters']], parse_errors=parse_errors)
    return out

if __name__ == '__main__':
    C = load_courses(sys.argv[1])
    for cid, X in C.items():
        print(cid, 'chapters', len(X['chapters']),
              '| unique own positions with a first-listed (recommended) move:', len(X['choice']),
              '| unique own positions with any own move:', len(X['own_positions_any']),
              '| sum over chapters of per-chapter decision positions:', sum(len(v) for v in X['per_chapter_decisions'].values()),
              '| positions where chapters disagree:', len(X['conflicts']),
              '| parse errors:', X['parse_errors'][:2])
