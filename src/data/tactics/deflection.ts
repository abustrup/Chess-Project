import type { TacticLesson } from '../../types'

export const deflectionLesson: TacticLesson = {
  id: 'deflection',
  name: 'Deflection',
  tagline: 'Force a defender away from its job, then take what it was guarding.',
  puzzleTheme: 'deflection',
  intro: [
    {
      type: 'text',
      text: "Every defender has a job: guarding a piece, a square or the king. Deflection means forcing a defender to leave its job, usually with a check, a capture or a threat it can't ignore. Once it has left, whatever it was guarding is yours.",
    },
    {
      type: 'board',
      fen: '8/1p2rp2/p1b2k2/8/6P1/7K/PP2RP2/8 w - - 0 37',
      caption:
        "Black's rook on e7 is protected only by the king on f6. The pawn move g5 is check, so the king has to leave f6. Then Rxe7 wins the rook.",
      arrows: [
        { from: 'g4', to: 'g5', color: 'blue' },
        { from: 'e2', to: 'e7', color: 'blue' },
      ],
      highlights: [
        { square: 'f6', color: 'yellow' },
        { square: 'e7', color: 'red' },
      ],
    },
    {
      type: 'tip',
      text: 'How to spot it: look for a defender with an important job, like a piece that guards a queen, a rook or the king. Then ask: can I check it, attack it or trade it, so that it has to move? Checks work best, because the king must answer.',
    },
    {
      type: 'board',
      fen: '2kr3r/1ppb1ppp/p1p5/3nPN2/5P2/2q1B3/P1PQ2PP/1R3RK1 w - - 0 16',
      caption:
        "Black's queen on c3 is protected only by the knight on d5. Ne7+ is check, and Black takes the checking knight with that very knight. Now nothing protects the queen, and Qxc3 wins it.",
      arrows: [
        { from: 'f5', to: 'e7', color: 'blue' },
        { from: 'd2', to: 'c3', color: 'blue' },
      ],
      highlights: [
        { square: 'd5', color: 'yellow' },
        { square: 'c3', color: 'red' },
      ],
    },
    {
      type: 'board',
      fen: 'r3k1r1/pp1q1pbp/2nppQp1/1N6/4P3/2N1P3/PPP3PP/R4RK1 w q - 4 14',
      caption:
        'Real games are crowded, but the idea is the same. The black queen on d7 guards the pawn on f7. Nxd6+ is check. If the queen takes, Qxf7+ wins a pawn and then the rook on g8.',
      arrows: [
        { from: 'b5', to: 'd6', color: 'blue' },
        { from: 'f6', to: 'f7', color: 'blue' },
      ],
      highlights: [
        { square: 'd7', color: 'yellow' },
        { square: 'f7', color: 'red' },
      ],
    },
    {
      type: 'tip',
      text: "How to protect yourself: before you move, ask which of your pieces are protected by only one piece. Then ask whether the other side can force that protector to move. Checks and captures are the most forcing moves, so watch those first.",
    },
    {
      type: 'board',
      fen: '5b2/1p2rp2/p4k2/8/6P1/7K/PP2RP2/8 w - - 0 37',
      caption:
        'This is the first position again, but the black bishop now stands on f8, so the rook on e7 is protected twice. After g5+ Kxg5 Rxe7 Bxe7, White has only traded rooks and lost a pawn.',
      arrows: [
        { from: 'g4', to: 'g5', color: 'red' },
        { from: 'e2', to: 'e7', color: 'red' },
      ],
      highlights: [{ square: 'f8', color: 'yellow' }],
    },
  ],
  examples: [
    {
      title: 'A rook sacrifice pulls the king away',
      fen: 'k7/1p6/p3R3/3p3p/2q5/PQ3P2/KP4PP/2r5 b - - 0 36',
      moves: ['c1a1', 'a2a1', 'c4b3'],
      explanations: [
        "White's queen on b3 is protected only by the king on a2. The rook goes to a1 with check, giving itself up.",
        "The king's only move is to take the rook. But now it has left a2, and it no longer protects the queen.",
        'Black takes the queen for free. Black gave a rook and won a queen.',
      ],
    },
    {
      title: 'A knight check, then mate',
      fen: '7k/3b1q1p/4p2Q/p2pP3/2pP4/2n1P3/P1B3PP/5RK1 b - - 1 34',
      moves: ['c3e2', 'g1h1', 'f7f1'],
      explanations: [
        "The white rook on f1 is protected only by the king on g1. The knight jumps to e2 with check, and nothing can capture it.",
        'The king has to leave g1, and h1 is its only safe square. Now it no longer protects the rook.',
        'The queen takes the rook with checkmate. The king is stuck in the corner behind its own pawns.',
      ],
    },
    {
      title: 'Deflect the guard of the promotion square',
      fen: '8/3n1P2/8/3N4/ppk2K2/8/P7/8 w - - 2 61',
      moves: ['d5b6', 'd7b6', 'f7f8q'],
      explanations: [
        'The pawn on f7 wants to promote, but the knight on d7 guards the square f8. Nb6 is check, and it also attacks that knight.',
        'Black takes the checking knight. But the knight has left d7, so it no longer guards f8.',
        'The pawn promotes to a new queen, and Black cannot stop it.',
      ],
    },
    {
      title: 'A real game: sacrifice the rook, win the knight, mate',
      fen: '4Qnk1/1p3pp1/p3p3/8/8/P6R/1Br3PK/4q3 w - - 6 35',
      moves: ['h3h8', 'g8h8', 'e8f8', 'h8h7', 'f8g7'],
      explanations: [
        "The knight on f8 is protected only by the king on g8, so the rook goes to h8 with check.",
        "The king has to take the rook. It is Black's only move, and it takes the king off g8.",
        'The queen takes the knight with check. Nothing protects it any more.',
        'The king only has one square left.',
        "The queen takes the pawn on g7. It is protected by the bishop on b2, so it is checkmate.",
      ],
    },
  ],
  exercises: [
    {
      id: 'deflection-1',
      fen: '8/p5pp/8/P4p2/7P/3pK3/2kB2P1/8 b - - 0 35',
      solution: ['f5f4', 'e3f4', 'c2d2'],
      hint: 'Who protects the white bishop on d2? Can you force that piece to move?',
      explanation:
        'f4+ is check, so the white king has to move away from e3. Once it has left, it no longer protects the bishop, and Kxd2 wins it.',
      difficulty: 1,
    },
    {
      id: 'deflection-2',
      fen: '6bQ/1p4R1/p6p/8/5p2/P4k2/1PP2P1P/3rBK2 b - - 5 36',
      solution: ['g8c4', 'f1g1', 'd1e1'],
      hint: "White's bishop on e1 is protected only by the king. Can you give a check that makes the king move?",
      explanation:
        'Bc4+ is check, and the king must go to g1. It no longer protects the bishop on e1, so Rxe1 is checkmate.',
      difficulty: 1,
    },
    {
      id: 'deflection-3',
      fen: '2kr1b1r/1pp2ppp/p3pn2/1N3B2/2P5/4Bn2/PP3P1P/2KR3R w - - 0 15',
      solution: ['b5a7', 'c8b8', 'd1d8'],
      hint: "Black's rook on d8 is protected only by the king. Can you check the king so that it has to move?",
      explanation:
        'Na7+ is check, and the king can only go to b8. That leaves the rook on d8 without protection, and Rxd8 is checkmate.',
      difficulty: 1,
    },
    {
      id: 'deflection-4',
      fen: '2k1r3/p2q2pp/2p2p2/P1bp4/4r3/2P1P2Q/6PP/1RB2RK1 w - - 6 26',
      solution: ['b1b8', 'c8b8', 'h3d7'],
      hint: "Black's queen on d7 is protected only by the king. Offer a rook with check.",
      explanation:
        'Rb8+ is check, and the best answer is to take the rook. But then the king no longer protects the queen on d7, and Qxd7 wins it.',
      difficulty: 2,
    },
    {
      id: 'deflection-5',
      fen: '6k1/2R2pp1/4p2p/3q4/3P2P1/5QP1/2P2PK1/1r6 b - - 3 31',
      solution: ['b1g1', 'g2g1', 'd5f3'],
      hint: "White's queen on f3 is protected only by the king. Try a rook check.",
      explanation:
        'Rg1+ is check, so the king has to move. It can no longer protect the queen on f3, and Qxf3 wins the queen for a rook.',
      difficulty: 2,
    },
    {
      id: 'deflection-6',
      fen: '3r2k1/p4pp1/5p1p/8/2Q1qP2/P5P1/1P3P1P/2R3K1 b - - 0 26',
      solution: ['d8d1', 'c1d1', 'e4c4'],
      hint: "White's queen on c4 is protected only by the rook on c1. Can you make that rook leave?",
      explanation:
        'Rd1+ is check. The rook on c1 was the only protector of the queen on c4, so after Rxd1, Qxc4 wins the queen. Blocking with Qf1 loses the queen too, to Rxf1+.',
      difficulty: 2,
    },
    {
      id: 'deflection-7',
      fen: 'rn3rqk/pp6/2p2bQ1/3pp3/4P3/3P4/PPPN1PPP/4RRK1 w - - 5 17',
      solution: ['g6h6', 'g8h7', 'h6f8'],
      hint: "Black's rook on f8 is protected only by the queen. Can you check the king so the queen has to move?",
      explanation:
        'Qh6+ is check, and the only way out is to block with the queen on h7. The queen was protecting the rook on f8, so Qxf8+ wins it with check.',
      difficulty: 2,
    },
    {
      id: 'deflection-8',
      fen: '4kb1r/1r1qpppp/5nb1/Q7/3p1B2/2P2P2/P5PP/R3KB1R w KQk - 6 17',
      solution: ['a5a8', 'd7d8', 'a8b7'],
      hint: "The black queen is the only protector of the rook on b7. Check the king so the queen must step in.",
      explanation:
        'Qa8+ is check, and the best block is the queen on d8. That leaves the rook on b7 without protection, so Qxb7 wins it.',
      difficulty: 2,
    },
    {
      id: 'deflection-9',
      fen: '3qr1k1/5pp1/7p/2PQ4/N1n5/7P/5PP1/3R2K1 b - - 0 28',
      solution: ['e8e1', 'd1e1', 'd8d5'],
      hint: "White's queen on d5 is protected only by the rook on d1. Give a check, and think about which white piece will want to take it.",
      explanation:
        'Re1+ is check. If the rook on d1 takes it, that rook stops protecting the queen, and Qxd5 wins the queen. If White steps aside instead, Rxd1 wins the rook.',
      difficulty: 3,
    },
    {
      id: 'deflection-10',
      fen: '2b1r1k1/r1Pn4/ppQ3p1/2p1q2p/2P5/2PBP2P/P2K2P1/1R5R w - - 0 24',
      solution: ['c6g6', 'e5g7', 'g6e8'],
      hint: "Black's queen is the only protector of the rook on e8. Start with a check that forces it to move.",
      explanation:
        "Qxg6+ is check, and Black's queen has to block on g7, because a king move gets mated. That takes it off the e-file (the e column), so the rook on e8 loses its protector and Qxe8+ wins it with check.",
      difficulty: 3,
    },
    {
      id: 'deflection-11',
      fen: '3Q1b2/5pk1/b1q2nPp/1pp2P1n/p3p2N/1PP4P/P4PB1/2B3K1 w - - 3 33',
      solution: ['c1h6', 'g7h6', 'd8f8'],
      hint: "The black bishop on f8 is protected only by the king. Offer a piece with check, so that the king has to take it.",
      explanation:
        'Bxh6+ is check, and the king takes the bishop. Now the king no longer protects f8, and Qxf8+ wins the bishop with check.',
      difficulty: 3,
    },
    {
      id: 'deflection-12',
      fen: '4k3/pb2qp1Q/1p2p1r1/4P3/8/7P/P4P2/3R1K2 w - - 2 29',
      solution: ['h7h8', 'e7f8', 'd1d8', 'e8d8', 'h8f8'],
      hint: "Black's king has no escape. Use checks to drag the queen and then the king away, one at a time.",
      explanation:
        'Qh8+ forces the queen to block on f8. Then Rd8+ drags the king to d8, and Qxf8+ takes the queen with check. White gave a rook and won a queen.',
      difficulty: 3,
    },
  ],
}
