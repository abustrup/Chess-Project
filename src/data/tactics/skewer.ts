import type { TacticLesson } from '../../types'

// Skewers. Exercise positions come from real Lichess puzzles (CC0); every line was checked with Stockfish.
export const skewerLesson: TacticLesson = {
  id: 'skewer',
  name: 'Skewers',
  tagline: 'Attack the big piece first: when it runs away, grab what was hiding behind it.',
  puzzleTheme: 'skewer',
  intro: [
    {
      type: 'text',
      text: 'A **skewer** is like a pin turned around. You attack a valuable piece, it has to move away, and then you capture the piece that was hiding behind it. Only bishops, rooks and queens can skewer, because they attack along long lines.',
    },
    {
      type: 'board',
      fen: 'r3k2R/8/8/8/8/8/8/4K3 b - - 1 1',
      arrows: [
        { from: 'h8', to: 'e8', color: 'red' },
        { from: 'e8', to: 'a8', color: 'yellow' },
      ],
      highlights: [{ square: 'a8', color: 'yellow' }],
      caption:
        'White’s rook on h8 checks the king on e8. The king must step out of the way, and then the rook takes the rook on a8, which was hiding behind the king.',
    },
    {
      type: 'tip',
      text: '**A skewer is the opposite of a pin.** In a pin the cheaper piece stands in front; in a skewer the more valuable piece is in front, so it has to run. Skewers often start with a check, because a king in front must move.',
    },
    {
      type: 'board',
      fen: 'rn2k2r/3p1ppp/p3p3/1ppq4/8/3P1B2/PP3PPP/R2Q1RK1 b kq - 1 14',
      arrows: [
        { from: 'f3', to: 'd5', color: 'red' },
        { from: 'd5', to: 'a8', color: 'yellow' },
      ],
      highlights: [{ square: 'a8', color: 'yellow' }],
      caption:
        'A skewer without a check: the bishop on f3 attacks the queen on d5, and the rook on a8 stands behind it on the same diagonal. The bishop is protected, so the queen can’t take it. When the queen moves away, Bxa8 wins the rook.',
    },
    {
      type: 'board',
      fen: 'r1bq1bnr/pppp3p/5k2/4p3/3n3Q/8/PPPP1PPP/RNB1K1NR b KQ - 3 9',
      arrows: [
        { from: 'e4', to: 'h4', color: 'blue' },
        { from: 'h4', to: 'f6', color: 'red' },
        { from: 'f6', to: 'd8', color: 'yellow' },
      ],
      highlights: [{ square: 'd8', color: 'yellow' }],
      caption:
        'It can happen in the opening too. The white queen checks the king on f6 from h4, and the black queen on d8 stands behind the king on the same diagonal. After the king moves, Qxd8 wins the queen.',
    },
    {
      type: 'text',
      text: '**Skewers often start with a check.** The king has to step aside, and whatever stands behind it on the same line falls. So whenever you can give a check along a row, a column or a diagonal, look at what is lined up behind the king.',
    },
    {
      type: 'tip',
      text: '**To avoid skewers,** don’t line up your king or queen with another valuable piece on an open line where an enemy rook, bishop or queen could appear. Keep your rooks and queen off the same row, column or diagonal as your king when you can.',
    },
  ],
  examples: [
    {
      title: 'A rook skewer on the back row',
      fen: '3k2r1/Rp3p2/2p5/8/4b2P/8/1P3PP1/6K1 w - - 0 32',
      moves: ['a7a8', 'd8e7', 'a8g8'],
      explanations: [
        'The rook checks the king on d8 along the back row. The black rook on g8 stands behind the king on the same row.',
        'The king has to step off the row, so it goes to e7.',
        'The rook takes the rook that was hiding behind the king.',
      ],
    },
    {
      title: 'A bishop skewer',
      fen: '8/3b4/3p2p1/2pP1kp1/2P1p3/4K2P/4B1P1/8 w - - 13 60',
      moves: ['e2g4', 'f5e5', 'g4d7'],
      explanations: [
        'The bishop checks the king on f5. The pawn on h3 protects it, so the king can’t take it. The black bishop on d7 stands behind the king on the same diagonal.',
        'The king steps off the diagonal to e5.',
        'The bishop takes the bishop.',
      ],
    },
    {
      title: 'A queen skewer on the back row',
      fen: 'r1bq2k1/6p1/p1pnp3/3p1rPQ/3P4/2P5/PP3PP1/R3K2R w KQ - 3 19',
      moves: ['h5h8', 'g8f7', 'h8d8'],
      explanations: [
        'The queen checks the king on g8. The rook on h1 protects the queen from behind, so the king can’t take it. The black queen on d8 stands behind the king on the same row.',
        'The king has to step aside, so it goes to f7.',
        'The queen takes the queen. The rook on a8 can’t take back, because the bishop on c8 is in the way.',
      ],
    },
    {
      title: 'Attacking the queen with a bishop',
      fen: 'r4rk1/pb3pp1/1p2p2p/8/3pq3/8/PPP1BPP1/R2Q1RK1 w - - 2 18',
      moves: ['e2f3', 'e4e5', 'f3b7'],
      explanations: [
        'The bishop attacks Black’s queen on e4. The bishop is protected, so the queen can’t safely take it. The bishop on b7 stands behind the queen on the same diagonal.',
        'The queen has to move away. Black picks e5.',
        'The bishop takes the bishop, and now it also attacks the rook on a8.',
      ],
    },
  ],
  exercises: [
    {
      id: 'skewer-1',
      fen: 'r3k3/pp3p1p/2ppb3/4p3/P1P1P2r/6R1/1P1NBP1n/2B1K3 w q - 2 25',
      solution: ['g3g8', 'e8d7', 'g8a8'],
      hint: 'Check the king along the back row. What is lined up behind it?',
      explanation:
        'Rg8+ gives check along the back row. The king has to step aside, and then your rook takes the rook on a8, which was hiding behind the king.',
      difficulty: 1,
    },
    {
      id: 'skewer-2',
      fen: '2r1k1nr/pp1b1ppp/4p3/3pP3/3P4/1P1B4/P4PPP/RN2K2R b KQk - 2 13',
      solution: ['c8c1', 'e1d2', 'c1h1'],
      hint: 'Look for a check along the first row. Is anything valuable on the other side of the king?',
      explanation:
        'Rc1+ gives check along the first row. The king has to move, and then Rxh1 takes the rook that was hiding behind the king.',
      difficulty: 1,
    },
    {
      id: 'skewer-3',
      fen: '2b5/p4p1p/1p2k1p1/3pP3/1P1K4/P6P/4B1P1/8 w - - 0 30',
      solution: ['e2g4', 'e6e7', 'g4c8'],
      hint: 'Check the king with your bishop. Is there an enemy piece behind the king on the same diagonal?',
      explanation:
        'Bg4+ checks the king on e6, and the black bishop on c8 stands behind it on the same diagonal. The king has to move away, and then Bxc8 wins the bishop.',
      difficulty: 1,
    },
    {
      id: 'skewer-4',
      fen: 'r1bq1k2/ppb2p1R/2p5/4p1r1/2PP4/3Q4/PP1KBPP1/7R w - - 2 24',
      solution: ['h7h8', 'f8e7', 'h8d8'],
      hint: 'The black king and queen are on the same row. Check the king from the far side.',
      explanation:
        'Rh8+ checks the king on f8, and the black queen on d8 stands behind it on the same row. The king moves, and Rxd8 wins the queen for a rook.',
      difficulty: 1,
    },
    {
      id: 'skewer-5',
      fen: 'rb1q2k1/1p1b2p1/p3p1N1/3ppr1Q/1P5P/P1p5/5PP1/R3R1K1 w - - 4 22',
      solution: ['h5h8', 'g8f7', 'h8d8'],
      hint: 'Look at the back row: the black king and queen are on the same row. Can your queen give check there safely?',
      explanation:
        'Qh8+ is protected by the knight on g6, so the king can’t take it. The king has to step aside, and then Qxd8 takes the queen that was hiding behind it.',
      difficulty: 2,
    },
    {
      id: 'skewer-6',
      fen: 'r1b1k2N/ppp3pp/2n5/3pp3/3q3R/6P1/PPPPK3/RNBQ4 b q - 1 12',
      solution: ['c8g4', 'e2f1', 'g4d1'],
      hint: 'Check the king with your bishop. What is on the other side of the king?',
      explanation:
        'Bg4+ checks the king on e2, and White’s queen on d1 stands behind it on the same diagonal. The king has to move, and then Bxd1 wins the queen.',
      difficulty: 2,
    },
    {
      id: 'skewer-7',
      fen: 'r1b3k1/pp3r2/6p1/8/3PQ3/2P1P1P1/P5K1/1R6 b - - 0 23',
      solution: ['c8f5', 'e4e5', 'f5b1'],
      hint: 'White’s queen has a rook on the same diagonal behind it. Attack the queen with a protected bishop.',
      explanation:
        'Bf5 attacks the queen on e4, and your rook on f7 protects the bishop, so the queen can’t take it. When the queen moves away, Bxb1 wins the rook behind it.',
      difficulty: 2,
    },
    {
      id: 'skewer-8',
      fen: '4rkr1/pp3p2/8/2R5/5P2/3P1n2/PP3P1P/4R2K w - - 0 31',
      solution: ['e1e8', 'f8e8', 'c5c8', 'e8e7', 'c8g8'],
      hint: 'Trade a pair of rooks with check first. Then look at where the black king has to stand.',
      explanation:
        'Rxe8+ forces the king to take on e8. Then Rc8+ checks it along the back row, with the rook on g8 behind it. The king moves, and Rxg8 wins that rook.',
      difficulty: 3,
    },
    {
      id: 'skewer-9',
      fen: '1r2k2r/2pn1ppp/1q2p3/2b5/3P1P2/2Q3P1/PP2NP1P/R1B1R1K1 b k - 0 18',
      solution: ['c5b4', 'c3c2', 'b4e1'],
      hint: 'White’s queen and rook are on one diagonal. Attack the queen with a protected bishop.',
      explanation:
        'Bb4 attacks the queen on c3, and your queen on b6 protects the bishop. When the white queen moves away, Bxe1 takes the rook behind it.',
      difficulty: 3,
    },
    {
      id: 'skewer-10',
      fen: 'r1b1kb1r/3n1p1p/p1q1p1p1/1pp1P3/8/2PBN3/PPQ2PPP/R1B1K2R w KQkq - 1 13',
      solution: ['d3e4', 'c6c7', 'e4a8'],
      hint: 'Black’s queen and rook are on one diagonal. Attack the queen with a protected bishop.',
      explanation:
        'Be4 attacks the queen on c6, and your queen on c2 protects the bishop. When the black queen moves away, Bxa8 takes the rook behind it.',
      difficulty: 3,
    },
    {
      id: 'skewer-11',
      fen: '7k/pp3prp/5Rn1/2bqp2Q/3p4/3B2P1/PPP2P1P/R4K2 b - - 0 28',
      solution: ['d5h1', 'f1e2', 'h1a1'],
      hint: 'Check along the first row. What is on the other side of the king?',
      explanation:
        'Qh1+ checks the king on f1 along the first row, and the rook on a1 stands behind it. The king has to move, and then Qxa1 wins the rook.',
      difficulty: 3,
    },
  ],
}
