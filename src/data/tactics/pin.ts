import type { TacticLesson } from '../../types'

// Pins (absolute and relative). Exercise positions come from real Lichess puzzles (CC0);
// every line was checked with Stockfish.
export const pinLesson: TacticLesson = {
  id: 'pin',
  name: 'Pins',
  tagline: 'A piece that is stuck because something more valuable stands behind it.',
  puzzleTheme: 'pin',
  intro: [
    {
      type: 'text',
      text: 'A **pin** is when a piece can’t (or shouldn’t) move, because a more valuable piece stands behind it on the same line. Only bishops, rooks and queens can pin, because they attack along long lines. If the piece behind is the king, the pin is **absolute**: the pinned piece is not allowed to move at all.',
    },
    {
      type: 'board',
      fen: '4k3/8/2n5/1B6/8/8/8/4K3 b - - 0 1',
      arrows: [
        { from: 'b5', to: 'c6', color: 'red' },
        { from: 'c6', to: 'e8', color: 'yellow' },
      ],
      highlights: [{ square: 'c6', color: 'yellow' }],
      caption:
        'The bishop on b5 pins the knight on c6 to the king on e8. The knight is not allowed to move, because that would put its own king in check. This is an absolute pin.',
    },
    {
      type: 'board',
      fen: '3qk3/8/5n2/6B1/8/8/8/4K3 b - - 0 1',
      arrows: [
        { from: 'g5', to: 'f6', color: 'red' },
        { from: 'f6', to: 'd8', color: 'yellow' },
      ],
      highlights: [{ square: 'f6', color: 'yellow' }],
      caption:
        'Here the knight is pinned to the queen. The knight may move, but then Bxd8 wins the queen. This is a relative pin: moving is allowed, but it costs a lot.',
    },
    {
      type: 'tip',
      text: '**Pinned pieces are easy targets.** Attack the pinned piece again, ideally with a pawn: it can’t run away. A pinned piece also can’t be trusted as a defender, because if it captures, it exposes the piece behind it.',
    },
    {
      type: 'board',
      fen: '3qk3/8/5n2/6B1/4P3/8/8/4K3 w - - 0 1',
      arrows: [
        { from: 'e4', to: 'e5', color: 'blue' },
        { from: 'e5', to: 'f6', color: 'red' },
      ],
      caption:
        'The knight on f6 is pinned to the queen, so White attacks it with a pawn: e5! If the knight moves, Bxd8 wins the queen; if it stays, exf6 wins the knight.',
    },
    {
      type: 'board',
      fen: 'rn1qkb1r/ppp1pppp/5n2/3p4/3P2b1/4PN2/PPP2PPP/RNBQKB1R w KQkq - 1 4',
      arrows: [
        { from: 'g4', to: 'f3', color: 'red' },
        { from: 'f3', to: 'd1', color: 'yellow' },
      ],
      highlights: [{ square: 'f3', color: 'yellow' }],
      orientation: 'black',
      caption:
        'A pin in a normal opening: Black’s bishop on g4 pins the knight on f3 to the queen on d1. If the knight moves, the bishop takes the queen. White can ask the bishop a question with h3.',
    },
    {
      type: 'text',
      text: 'Pins can hit you too. Don’t leave your king or queen behind a piece on a line where an enemy bishop, rook or queen can attack. To break a pin you can move the valuable piece behind, block the line, attack the pinning piece, or capture it.',
    },
  ],
  examples: [
    {
      title: 'Winning a pinned knight with a pawn',
      fen: '4k3/5ppp/3p4/4n3/8/3P4/5PPP/4R1K1 w - - 0 1',
      moves: ['d3d4', 'e8e7', 'd4e5'],
      explanations: [
        'The black knight on e5 is pinned to its king by the rook on e1, so it can’t move away. White attacks it with a pawn.',
        'Black can’t save the knight. The king steps to e7, but the knight is still pinned there.',
        'The pawn takes the knight. Black can take back the pawn, but White has won a knight for a pawn.',
      ],
    },
    {
      title: 'A pin that backfires: Légal’s trap',
      fen: 'rn1qkbnr/ppp2p1p/3p2p1/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5',
      moves: ['f3e5', 'g4d1', 'c4f7', 'e8e7', 'c3d5'],
      explanations: [
        'Black’s bishop pins the knight on f3 to the queen, but White moves the knight anyway and takes a pawn. The queen is left hanging on purpose, as a trap.',
        'Black grabs the queen with the bishop. It looks like a free queen, but it is a mistake.',
        'The bishop takes a pawn with check. The knight on e5 protects the bishop, so the king can’t take it.',
        'The king has only one square to go to.',
        'Checkmate! Black’s own pieces and White’s bishop and knights block every escape square. A pin is only as strong as the threat behind it.',
      ],
    },
    {
      title: 'Pinning the queen',
      fen: 'r1b2rk1/ppp3pp/2n5/2bqNp2/4n3/3B4/PPPPQPPP/R1B2RK1 w - - 0 10',
      moves: ['d3c4', 'c8e6', 'c4d5'],
      explanations: [
        'The bishop attacks Black’s queen on d5. The queen is pinned to the king on g8 (the f7 pawn is missing), so it can’t leave the diagonal. If it takes the bishop, Qxc4 wins it.',
        'Black blocks the diagonal with the bishop from c8 to e6.',
        'The bishop takes the queen. Black takes back with ...Bxd5, but White has won a queen for a bishop.',
      ],
    },
    {
      title: 'A pinned rook can’t help',
      fen: '6k1/5rpp/p2p4/1p6/6bq/1BP5/PP3PP1/RN2R1K1 w - - 0 19',
      moves: ['e1e8'],
      explanations: [
        'It is checkmate! The bishop on b3 pins the rook on f7 to the king on g8, so that rook can’t go to f8 to block. Nothing else can take the rook on e8.',
      ],
    },
  ],
  exercises: [
    {
      id: 'pin-1',
      fen: '7r/4bkpp/p1B2p2/8/3R4/6P1/PP4PP/6K1 b - - 0 31',
      solution: ['e7c5', 'g1f1', 'c5d4'],
      hint: 'Your bishop can attack the rook while the rook is stuck in front of its own king.',
      explanation:
        'Bc5 attacks the rook on d4, which is pinned to the king on g1 along the diagonal. A rook can’t move diagonally, so it can’t take the bishop or run away. White can move the king, but Bxd4 still wins the rook.',
      difficulty: 1,
    },
    {
      id: 'pin-2',
      fen: '8/5k2/5p2/3npKp1/6P1/7P/8/5B2 w - - 11 54',
      solution: ['f1c4', 'f7f8', 'c4d5'],
      hint: 'Black’s knight has its king right behind it. Can your bishop attack the knight along that line?',
      explanation:
        'Bc4 pins the knight on d5 to the king on f7 and attacks it. The knight can’t move, and nothing protects it. Black can step the king aside, but then Bxd5 wins the knight.',
      difficulty: 1,
    },
    {
      id: 'pin-3',
      fen: '4b3/5k1p/4r1p1/3Qp3/P7/1P4P1/4PPKP/8 b - - 0 35',
      solution: ['e8c6', 'e2e4', 'c6d5'],
      hint: 'White’s queen is on the same diagonal as its king. Which of your pieces can attack it from far away?',
      explanation:
        'Bc6 attacks the queen on d5, which is pinned to the king on g2 along the diagonal. If White blocks with e4, Bxd5 wins the queen. If the queen takes the bishop, your rook on e6 takes the queen.',
      difficulty: 1,
    },
    {
      id: 'pin-4',
      fen: 'rnb3k1/ppb2rpp/8/2p5/2Bq4/3P2P1/PPP4P/RN2Q2K w - - 0 14',
      solution: ['e1e8'],
      hint: 'Your bishop pins a black rook next to the king. What can that rook no longer do?',
      explanation:
        'Qe8# is checkmate. The bishop on c4 pins the rook on f7 to the king on g8, so that rook can’t go to f8 to block the check. Nothing else can stop the queen.',
      difficulty: 1,
    },
    {
      id: 'pin-5',
      fen: '5r1k/p1p3pp/2b5/6B1/8/2N4Q/PPP3RP/7K b - - 0 31',
      solution: ['f8f1'],
      hint: 'Your bishop pins the white rook on g2 to its king. Find a check that the pinned rook can’t answer.',
      explanation:
        'Rf1# is checkmate. Your bishop on c6 pins the rook on g2 to the king on h1, so that rook can’t go to g1 to block the check. The king has no other squares.',
      difficulty: 1,
    },
    {
      id: 'pin-6',
      fen: '1k1r3r/ppq2pp1/2p1pn2/4PbBp/7P/1BP2P2/PP2Q1P1/R4K1R b - - 0 20',
      solution: ['f5d3', 'e2d3', 'd8d3'],
      hint: 'White’s queen stands right next to its king on a diagonal. Can you attack it with a small piece?',
      explanation:
        'Bd3 attacks White’s queen on e2, which is pinned to the king on f1. The queen can only take the bishop, and then Rxd3 captures the queen. Black wins a queen for a bishop.',
      difficulty: 2,
    },
    {
      id: 'pin-7',
      fen: 'rnb1k2r/ppp2ppp/2q5/2b1p3/8/P1B5/3P1PPP/1R1QKBNR w Kkq - 0 12',
      solution: ['f1b5', 'c8d7', 'b5c6'],
      hint: 'Black’s queen is on the same diagonal as its king. Which bishop move attacks it?',
      explanation:
        'Bb5 attacks the queen on c6, which is pinned to the king on e8. If the queen takes the bishop, Rxb5 wins it. Black blocks with Bd7, but Bxc6 still wins the queen for a bishop.',
      difficulty: 2,
    },
    {
      id: 'pin-8',
      fen: '4r3/pb3pk1/1n1N2pp/8/4P3/PP5P/2P1BP2/3K3R b - - 1 25',
      solution: ['e8d8', 'd1c1', 'd8d6'],
      hint: 'White’s knight attacks your rook. Is there a move that saves the rook and traps the knight?',
      explanation:
        'Rd8 moves the rook out of danger and pins the knight on d6 to the king on d1. The knight can’t escape, so Rxd6 wins it. The white king can step aside, but the knight is still attacked.',
      difficulty: 2,
    },
    {
      id: 'pin-9',
      fen: '3r4/ppp2kpp/2n3b1/8/5nP1/2PpR2P/PP1N1P2/R5K1 w - - 1 20',
      solution: ['e3f3', 'f7g8', 'f3f4'],
      hint: 'Black’s knight on f4 is lined up with its king. Attack it with a rook.',
      explanation:
        'Rf3 attacks the knight on f4, which is pinned to the king on f7. The knight can’t run, and nothing protects it. Black can move the king, but Rxf4 wins the knight.',
      difficulty: 3,
    },
    {
      id: 'pin-10',
      fen: 'rn1q1r2/ppp3bk/3pp1p1/6Q1/2BPP2P/2N5/PPP2P2/2KR3R b - - 1 15',
      solution: ['g7h6', 'f2f4', 'h6g5'],
      hint: 'White’s queen and king are on one long diagonal. Which bishop move attacks the queen?',
      explanation:
        'Bh6 attacks the queen on g5, which is pinned to the king on c1 along the long diagonal. White tries to block with f4, but then Bxg5 wins the queen for a bishop.',
      difficulty: 3,
    },
    {
      id: 'pin-11',
      fen: 'r3k2r/1p3pp1/pqp1bb1p/8/5P2/2N2N2/PP2QP1P/R2R2K1 w kq - 0 18',
      solution: ['f4f5', 'e8g8', 'f5e6'],
      hint: 'Black’s bishop on e6 is pinned to its king. Attack it with your cheapest piece.',
      explanation:
        'Your queen pins the bishop on e6 to the king, so the pawn move f5 attacks it. The bishop can’t move. If Black castles, fxe6 wins the bishop (Black can only take back a pawn).',
      difficulty: 3,
    },
  ],
}
