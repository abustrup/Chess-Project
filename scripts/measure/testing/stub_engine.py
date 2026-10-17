# A fake UCI engine for the job's self-test only: answers instantly with a deterministic score (material plus a small
# position-dependent offset) and a short line of legal moves, so the plumbing (looks at games 110 and 160, the recount,
# appending, refusals) can be tested in seconds. It reports the name "Stockfish 19 (test stub)", so it can never pass
# check_instrument.py or the card builder's engine-name check, and its numbers mean nothing.
import hashlib, sys
import chess

VAL = {chess.PAWN: 100, chess.KNIGHT: 300, chess.BISHOP: 300, chess.ROOK: 500, chess.QUEEN: 900, chess.KING: 0}


def score(b):
    m = sum(VAL[p.piece_type] * (1 if p.color == b.turn else -1) for p in b.piece_map().values())
    return m + int(hashlib.sha256(b.board_fen().encode()).hexdigest()[:4], 16) % 401 - 200


def line(b, n=6):
    b = b.copy(stack=False); out = []
    for _ in range(n):
        moves = sorted(b.legal_moves, key=lambda m: m.uci())
        if not moves:
            break
        mv = moves[int(hashlib.sha256(b.fen().encode()).hexdigest()[:4], 16) % len(moves)]
        out.append(mv.uci()); b.push(mv)
    return out


def main():
    b = chess.Board()
    for raw in sys.stdin:
        cmd = raw.strip().split()
        if not cmd:
            continue
        if cmd[0] == 'uci':
            print('id name Stockfish 19 (test stub)\nid author test\n'
                  'option name Threads type spin default 1 min 1 max 1024\n'
                  'option name Hash type spin default 16 min 1 max 33554432\nuciok', flush=True)
        elif cmd[0] == 'isready':
            print('readyok', flush=True)
        elif cmd[0] == 'position':
            if cmd[1] == 'startpos':
                b = chess.Board(); rest = cmd[2:]
            else:
                i = cmd.index('moves') if 'moves' in cmd else len(cmd)
                b = chess.Board(' '.join(cmd[2:i])); rest = cmd[i:]
            for u in rest[1:] if rest and rest[0] == 'moves' else []:
                b.push_uci(u)
        elif cmd[0] == 'go':
            pv = line(b)
            if pv:
                print(f'info depth 10 seldepth 10 multipv 1 score cp {score(b)} nodes 250000 pv {" ".join(pv)}', flush=True)
                print(f'bestmove {pv[0]}', flush=True)
            else:
                print('info depth 0 score cp 0', flush=True)
                print('bestmove (none)', flush=True)
        elif cmd[0] == 'quit':
            return


if __name__ == '__main__':
    main()
