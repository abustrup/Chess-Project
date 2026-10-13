import type { TacticLesson } from '../../types'

// Checkmate patterns: smothered, Arabian, Anastasia's, Boden's and hook mate.
// Exercise positions come from real Lichess puzzles (CC0); every line was checked with Stockfish.
export const matePatternsLesson: TacticLesson = {
  id: 'mate-patterns',
  name: 'Checkmate patterns',
  tagline: 'Five famous mating pictures. Learn to recognise them and you will start to see mates before they happen.',
  puzzleTheme: 'mateIn2',
  intro: [
    {
      type: 'text',
      text: 'Checkmates come in shapes. Strong players do not work out every mate from scratch. They **recognise a picture** they have seen before. Here are five patterns that every club player should know, and each one needs only a few pieces.',
    },
    {
      type: 'board',
      fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1',
      arrows: [{ from: 'g5', to: 'f7', color: 'blue' }],
      highlights: [
        { square: 'g8', color: 'yellow' },
        { square: 'g7', color: 'yellow' },
        { square: 'h7', color: 'yellow' },
      ],
      caption:
        'Smothered mate. The black king is boxed in by its own rook and pawns (marked). Nf7 is checkmate: the knight jumps over the crowd and nothing can capture it.',
    },
    {
      type: 'board',
      fen: '7k/8/5N2/8/8/8/7R/6K1 w - - 0 1',
      arrows: [
        { from: 'h2', to: 'h7', color: 'blue' },
        { from: 'f6', to: 'h7', color: 'red' },
        { from: 'f6', to: 'g8', color: 'red' },
      ],
      highlights: [{ square: 'g8', color: 'yellow' }],
      caption:
        'Arabian mate. A rook and a knight trap a king in the corner. Rh7 is mate: the knight on f6 protects the rook and also covers g8, and the rook covers g7.',
    },
    {
      type: 'board',
      fen: '8/4N1pk/8/8/8/8/K7/1R6 w - - 0 1',
      arrows: [
        { from: 'b1', to: 'h1', color: 'blue' },
        { from: 'e7', to: 'g8', color: 'red' },
        { from: 'e7', to: 'g6', color: 'red' },
      ],
      highlights: [{ square: 'g7', color: 'yellow' }],
      caption:
        "Anastasia's mate. The knight on e7 takes away g8 and g6, and the king's own pawn blocks g7. Rh1 is mate: the rook controls the whole h-file.",
    },
    {
      type: 'board',
      fen: '2kr4/p2n1ppp/8/8/5B2/3B4/8/6K1 w - - 0 1',
      arrows: [
        { from: 'd3', to: 'a6', color: 'blue' },
        { from: 'f4', to: 'b8', color: 'red' },
      ],
      highlights: [
        { square: 'd8', color: 'yellow' },
        { square: 'd7', color: 'yellow' },
      ],
      caption:
        "Boden's mate. Two bishops attack along crossing diagonals. Ba6 gives check, the bishop on f4 covers b8 and c7, and Black's own pieces block d7 and d8.",
    },
    {
      type: 'board',
      fen: '5r2/6k1/5Np1/6P1/8/8/7R/6K1 w - - 0 1',
      arrows: [
        { from: 'h2', to: 'h7', color: 'blue' },
        { from: 'f6', to: 'h7', color: 'red' },
        { from: 'g5', to: 'f6', color: 'red' },
      ],
      highlights: [{ square: 'f8', color: 'yellow' }],
      caption:
        "Hook mate. The pawn on g5 guards the knight, and the knight guards the rook, like a hook. Rh7 is mate: the king can't take the rook, and its own rook blocks f8.",
    },
    {
      type: 'tip',
      text: 'How to spot them: count the squares the enemy king can use. If its own pieces block most of them, look for a knight check or a rook check from a protected square. How to stay safe: give your own king air with a pawn move like h3, and do not let enemy knights reach the squares next to your king.',
    },
  ],
  examples: [
    {
      title: 'Smothered mate: the queen sacrifice',
      fen: '5r1k/npq1pQbp/1p4p1/2pB1bN1/5P2/6P1/1P3B1P/7K w - - 3 28',
      moves: ['f7g8', 'f8g8', 'g5f7'],
      explanations: [
        'The queen jumps next to the king with check. The bishop on d5 guards g8, so the king cannot take her. It looks like White is giving the queen away.',
        'Black has to capture, and the rook on f8 takes the queen. Now that rook sits on g8, right next to its own king.',
        'The knight jumps to f7 with check. The king is boxed in by its own rook, bishop and pawn, and nothing can capture the knight. It is smothered mate.',
      ],
    },
    {
      title: 'Arabian mate: a queen sacrifice opens the door',
      fen: '5r1k/pp2qp1p/2p2Nb1/4p3/7Q/3r3R/PPP3PP/6K1 w - - 0 22',
      moves: ['h4h7', 'g6h7', 'h3h7'],
      explanations: [
        'The queen takes the pawn on h7 with check. The knight on f6 guards that square, so the king cannot capture her.',
        'The only way out of check is to capture the queen with the bishop. Now the bishop stands on h7.',
        'The rook takes the bishop on h7. The knight on f6 protects the rook and covers g8, and the rook covers g7. The king is trapped in the corner: Arabian mate.',
      ],
    },
    {
      title: "Anastasia's mate: a knight check and a rook",
      fen: 'r4rk1/2p2pp1/2N5/p2P2p1/1pn1P3/5R2/PP4BP/6K1 w - - 2 27',
      moves: ['c6e7', 'g8h7', 'f3h3'],
      explanations: [
        'The knight jumps to e7 with check. From e7 it also covers g6 and g8, which is exactly what White wants.',
        'The king steps to h7. (Kh8 loses in the same way.) Black has no good choice, because the king is running out of room.',
        'The rook swings to h3 and gives check along the h-file. The knight covers g8 and g6, the pawn on g7 blocks the king, and the rook covers h8 and h6. Checkmate.',
      ],
    },
    {
      title: "Boden's mate: lure the queen away",
      fen: '2kr3r/p2n2b1/2pB2b1/q1pp1p2/3P4/1P1Q3p/P3BP1P/RN3RK1 w - - 0 23',
      moves: ['d3a6', 'a5a6', 'e2a6'],
      explanations: [
        'The queen goes to a6 with check along the diagonal to c8. She is protected by the bishop on e2, and she looks lost.',
        'Black takes the queen with its own queen. That is the only way to stop the check.',
        'The bishop recaptures on a6 with check. The bishop on d6 covers b8 and c7, and Black\'s own knight and rook block d7 and d8. That is Boden\'s mate.',
      ],
    },
    {
      title: 'Hook mate: rook, knight and pawn',
      fen: '2kr1r2/p2n2p1/2n1p2p/qNppP3/P2P2P1/3Q4/2K1N3/RR6 w - - 2 27',
      moves: ['b5d6', 'c8c7', 'b1b7'],
      explanations: [
        'The knight jumps to d6 with check. The pawn on e5 guards it, so Black cannot capture it.',
        'The king steps to c7. Black has no good alternative.',
        'The rook lands on b7, next to the king. The knight on d6 protects the rook, and the pawn on e5 protects the knight. That is the hook, and the king has no squares left.',
      ],
    },
  ],
  exercises: [
    {
      id: 'mate-patterns-1',
      fen: '2r2r1k/5pnq/p2b1N2/1p5R/3P1P2/7P/6P1/5RK1 w - - 0 28',
      solution: ['h5h7'],
      hint: 'Your knight on f6 guards two squares near the king. Which of your pieces could use that help?',
      explanation:
        'Rxh7 is checkmate. The knight on f6 protects the rook and covers g8, and Black\'s own knight on g7 blocks the king. This is the Arabian mate.',
      difficulty: 1,
    },
    {
      id: 'mate-patterns-2',
      fen: 'r2q1r2/1p2N1pk/p3p3/2p5/3b4/R7/1P3PPP/2B3K1 w - - 0 22',
      solution: ['a3h3'],
      hint: 'Your knight on e7 already takes away two squares from the king. Use your rook on the h-file.',
      explanation:
        'Rh3 is checkmate. The knight covers g8 and g6, the black pawn on g7 blocks the king, and the rook covers the h-file. This is Anastasia\'s mate.',
      difficulty: 1,
    },
    {
      id: 'mate-patterns-3',
      fen: '2krr3/p2n4/2pB3p/3nP1p1/P4p2/1P1B4/5PPP/4R1K1 w - - 0 34',
      solution: ['d3a6'],
      hint: 'Your bishop on d6 already takes away b8 and c7. Can your other bishop give check from a different diagonal?',
      explanation:
        'Ba6 is checkmate. It attacks the king along the diagonal, and the bishop on d6 covers the escape squares. Black\'s own pieces block d7 and d8. This is Boden\'s mate.',
      difficulty: 1,
    },
    {
      id: 'mate-patterns-4',
      fen: 'rn4rk/ppp3pp/5p1N/8/3P4/q1P4P/P4BP1/1K1R4 w - - 0 23',
      solution: ['h6f7'],
      hint: 'Black\'s king is surrounded by its own rook and pawns. Which piece can check from a square nobody can attack?',
      explanation:
        'Nf7 is checkmate. The king cannot move because its own rook and pawns fill every nearby square, and nothing can capture the knight. This is a smothered mate.',
      difficulty: 1,
    },
    {
      id: 'mate-patterns-5',
      fen: '5r2/4n1k1/p4Np1/1p4P1/2p5/3Pp3/PPP3K1/7R w - - 0 31',
      solution: ['h1h7'],
      hint: 'Your pawn guards your knight on f6. Now find a check for your rook that the knight can protect.',
      explanation:
        'Rh7 is checkmate. The knight protects the rook, and the pawn on g5 protects the knight, so the king cannot take either of them. Black\'s own rook blocks f8. This is a hook mate.',
      difficulty: 1,
    },
    {
      id: 'mate-patterns-6',
      fen: 'r1b1k2r/pp3ppp/2pp4/2b5/4PPn1/2N5/PPP1B1PP/R1BQ2RK b kq - 0 13',
      solution: ['g4f2'],
      hint: 'White\'s king in the corner is boxed in by its own rook and pawns. Your knight can jump with check.',
      explanation:
        'Nf2 is checkmate. The knight checks the king on h1, and White\'s own rook and pawns on g1, g2 and h2 take away every square. Nothing can capture the knight. This is a smothered mate, this time with the black pieces.',
      difficulty: 2,
    },
    {
      id: 'mate-patterns-7',
      fen: '5bk1/1R5p/4p1p1/p7/4N1K1/5P2/4r1P1/8 w - - 0 35',
      solution: ['e4f6', 'g8h8', 'b7h7'],
      hint: 'A knight check can push the king into the corner. Then look at your rook on the seventh row.',
      explanation:
        'Nf6+ forces the king into the corner, because the rook already covers f7 and g7. Then Rxh7 is mate: the knight protects the rook and covers g8. This is the Arabian mate again.',
      difficulty: 2,
    },
    {
      id: 'mate-patterns-8',
      fen: 'r4rk1/pbp2pp1/np1p4/5Np1/4P3/P1qP4/2P1Q2P/2KR1B1R w - - 0 17',
      solution: ['f5e7', 'g8h7', 'e2h5'],
      hint: 'Check with the knight first, so it takes away g8 and g6. Then bring your queen to the h-file.',
      explanation:
        'Ne7+ forces the king to the h-file. Qh5 is then checkmate: the knight covers g8 and g6, the pawn on g7 blocks the king, and the queen covers the rest. A queen can play the rook\'s part in Anastasia\'s mate.',
      difficulty: 2,
    },
    {
      id: 'mate-patterns-9',
      fen: '1k1r1b1r/ppp1qp2/2p5/5bpp/Q2P4/2P1P1BP/P2NBPP1/2KR3R b - - 0 15',
      solution: ['e7a3', 'a4a3', 'f8a3'],
      hint: 'Give up your queen to pull the white queen onto a3. Then your other bishop finishes the job.',
      explanation:
        'Qa3+ forces White to take the queen. Then Bxa3 is checkmate: this bishop checks the king, and the bishop on f5 covers b1 and c2. White\'s own pieces block d1 and d2. This is Boden\'s mate.',
      difficulty: 2,
    },
    {
      id: 'mate-patterns-10',
      fen: 'rn3rk1/5p1p/1q2p1p1/p2pP1P1/b1pP2N1/2P5/1P3PP1/R1B1K2R w KQ - 0 23',
      solution: ['g4f6', 'g8g7', 'h1h7'],
      hint: 'Your pawn on g5 can protect a knight on f6. Check with the knight, then look for a rook move on the h-file.',
      explanation:
        'Nf6+ is protected by the pawns on g5 and e5. After the king steps away, Rxh7 is mate, because the knight guards the rook. This is a hook mate.',
      difficulty: 2,
    },
    {
      id: 'mate-patterns-11',
      fen: '5rk1/p4Nbp/6p1/3Q2B1/8/q1n4P/5PP1/1R4K1 w - - 7 27',
      solution: ['f7h6', 'g8h8', 'd5g8', 'f8g8', 'h6f7'],
      hint: 'Move the knight away with a double check. Then sacrifice your queen to drag a rook next to the king.',
      explanation:
        'Nh6+ is a double check (knight and queen), so the king has to move to h8. Qg8+ forces Rxg8, and then Nf7 is a smothered mate. This famous combination is called Philidor\'s legacy.',
      difficulty: 3,
    },
    {
      id: 'mate-patterns-12',
      fen: '3r1rk1/5nqp/p3p1p1/1b6/2ppN2Q/8/1P4P1/R3KB1R w KQ - 4 26',
      solution: ['e4f6', 'g8h8', 'h4h7', 'g7h7', 'h1h7'],
      hint: 'A knight check puts the king in the corner. Then give up your queen on h7 so that your rook can mate there.',
      explanation:
        'Nf6+ drives the king into the corner. Qxh7+ takes away the black queen\'s protection of h7, and after Qxh7 the rook takes back with Rxh7. The knight protects the rook and covers g8, so it is an Arabian mate.',
      difficulty: 3,
    },
  ],
}
