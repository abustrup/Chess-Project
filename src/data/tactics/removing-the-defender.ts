import type { TacticLesson } from '../../types'

export const removingTheDefenderLesson: TacticLesson = {
  id: 'removing-the-defender',
  name: 'Removing the defender',
  tagline: 'If a piece is protected, capture the piece that protects it.',
  puzzleTheme: 'capturingDefender',
  intro: [
    {
      type: 'text',
      text: 'Many pieces stay safe only because another piece protects them. But a protector has a job, and if you capture it, the piece it was guarding is left on its own. This idea is called removing the defender.',
    },
    {
      type: 'board',
      fen: 'r2qk2r/p2pbpp1/1p3n1p/2pb2B1/8/5NP1/PP2PPBP/R2QR1K1 w kq - 0 13',
      caption:
        "Black's bishop on d5 is protected only by the knight on f6. Bxf6 takes the protector. After Black takes back, Qxd5 wins the bishop for free.",
      arrows: [
        { from: 'g5', to: 'f6', color: 'blue' },
        { from: 'd1', to: 'd5', color: 'blue' },
      ],
      highlights: [
        { square: 'f6', color: 'yellow' },
        { square: 'd5', color: 'red' },
      ],
    },
    {
      type: 'tip',
      text: "How to spot it: find an enemy piece that you attack and that is protected only once, and ask 'who is the protector?'. If you can capture that protector, do it first and take the piece next. Even if you give up a little on the way, you often win more.",
    },
    {
      type: 'board',
      fen: '3r2k1/1p3pp1/p1p1n1qp/8/3P3Q/4R2P/PPb2PP1/R5K1 w - - 2 24',
      caption:
        "Your queen attacks the rook on d8, and only the knight on e6 protects it. Rxe6 trades your rook for a knight. After Black takes back (with fxe6 or Qxe6), you win Black's rook with Qxd8+. That is a good deal.",
      arrows: [
        { from: 'e3', to: 'e6', color: 'blue' },
        { from: 'h4', to: 'd8', color: 'blue' },
      ],
      highlights: [
        { square: 'e6', color: 'yellow' },
        { square: 'd8', color: 'red' },
      ],
    },
    {
      type: 'board',
      fen: 'r3kb1r/ppp2ppp/2n1pn2/q5B1/6b1/2NP1N1P/PPP1BPP1/R2Q1RK1 b kq - 0 9',
      orientation: 'black',
      caption:
        "This happens a lot in the opening. White's bishop on g5 is protected only by the knight on f3. Black takes that knight, White takes back, and then Black's queen wins the bishop on g5.",
      arrows: [
        { from: 'g4', to: 'f3', color: 'blue' },
        { from: 'a5', to: 'g5', color: 'blue' },
      ],
      highlights: [
        { square: 'f3', color: 'yellow' },
        { square: 'g5', color: 'red' },
      ],
    },
    {
      type: 'tip',
      text: "How to protect yourself: protect important pieces twice, and let a pawn be one of the protectors when you can. Before you trade a piece off, ask what it was protecting.",
    },
    {
      type: 'board',
      fen: 'r2qk2r/p2pbpp1/1p2pn1p/2pb2B1/8/5NP1/PP2PPBP/R2QR1K1 w kq - 0 13',
      caption:
        'This is the first position again, but Black has a pawn on e6. The bishop is now protected twice. Bxf6 Bxf6 gets White nothing, because Qxd5 loses the queen for a bishop after exd5.',
      arrows: [
        { from: 'g5', to: 'f6', color: 'red' },
        { from: 'd1', to: 'd5', color: 'red' },
      ],
      highlights: [{ square: 'e6', color: 'yellow' }],
    },
  ],
  examples: [
    {
      title: 'The rook is guarded by a bishop',
      fen: '4r1k1/pp3p1p/2p3p1/4bb2/3B4/2P1R1P1/PP2P1BP/6K1 b - - 1 22',
      moves: ['e5d4', 'c3d4', 'e8e3'],
      explanations: [
        "The white rook on e3 is protected only by the bishop on d4, so Black takes that bishop. This also opens the e-file (the e column), so Black's rook now attacks the white rook. White's rook can't take Black's rook first: the bishop on d4 pins it. That means the rook is not allowed to step off the line, because then the bishop would be giving check to the king on g1.",
        "White takes the bishop back. That is White's best try, but a pawn on d4 doesn't protect the rook on e3.",
        'The rook is now unprotected, and Black takes it. Black traded bishop for bishop and won a whole rook.',
      ],
    },
    {
      title: 'A pawn can be the guard too',
      fen: '2k2r2/p3q1p1/bpp1P2p/3p1p2/3P1Pr1/2P3NQ/PP6/2KRR3 w - - 1 29',
      moves: ['g3f5', 'f8f5', 'h3g4'],
      explanations: [
        "The black rook on g4 is attacked by your queen, and only the pawn on f5 protects it. The knight takes that pawn, and it also attacks the black queen.",
        "Black takes the knight with the other rook. But the rook on g4 has lost its only protector.",
        'The queen takes the rook. White gave up a knight, but won a pawn and a rook.',
      ],
    },
    {
      title: 'Two protectors, but one trade drags both away',
      fen: '6k1/5p2/p1br2pp/1p1n4/3N1p2/1P5P/PB3PP1/3RK3 w - - 12 48',
      moves: ['d4c6', 'd6c6', 'd1d5'],
      explanations: [
        'The black knight on d5 is protected by the bishop on c6 and the rook on d6. Your knight takes the bishop, and it also opens the d-file for your rook on d1.',
        'Black takes back with the rook. But that rook has now left the d-file, so it no longer protects the knight.',
        'Nothing protects the knight on d5 any more, and your rook takes it for free.',
      ],
    },
    {
      title: 'Trade off the protector, then take the piece',
      fen: '2kr1b1r/p1p2ppp/1pb1p3/8/2P3q1/3B1N2/PP2QPPP/R1B2RK1 b - - 1 13',
      moves: ['c6f3', 'e2f3', 'g4f3', 'g2f3', 'd8d3'],
      explanations: [
        "Black's rook attacks the bishop on d3, and White's queen on e2 protects it. The bishop takes the knight on f3, and that attacks the queen.",
        "White takes back with the queen. The queen on f3 still protects the bishop on d3, but Black's queen on g4 attacks it.",
        'Black takes the white queen with the queen. That white queen was the only protector of the bishop on d3.',
        'White has to take back with the pawn on g2. But a pawn on f3 does not protect the bishop on d3.',
        'Nothing protects the bishop on d3 any more, so the rook takes it. Trading off the protector won a piece.',
      ],
    },
  ],
  exercises: [
    {
      id: 'removing-the-defender-1',
      fen: 'r4rk1/ppq2ppp/2pbp3/4n3/6b1/5NP1/PPPBBP1P/R2QR1K1 w - - 0 16',
      solution: ['f3e5', 'd6e5', 'e2g4'],
      hint: "Black's bishop on g4 is protected by a knight. Can you take that knight?",
      explanation:
        'Nxe5 takes the knight that protects the bishop on g4. After Bxe5, your bishop on e2 takes the bishop on g4 for free. (If the bishop on g4 runs away instead, you have simply won a knight. If Black takes your bishop on e2 instead, take back with the queen. Your queen and rook then win the bishop that lands on e5.)',
      difficulty: 1,
    },
    {
      id: 'removing-the-defender-2',
      fen: '2rq1rk1/p4ppp/2n1p3/2Rp4/3P4/5N1P/PP2QPP1/3R2K1 b - - 0 19',
      solution: ['c6d4', 'd1d4', 'c8c5'],
      hint: 'What protects the rook on c5?',
      explanation:
        'Nxd4 takes the pawn that protects the rook on c5, and it also opens the c-file so your rook attacks it. Even if White takes your knight, Rxc5 wins the rook.',
      difficulty: 1,
    },
    {
      id: 'removing-the-defender-3',
      fen: 'r4rk1/2q1ppb1/nn4pp/1R1P4/4P3/5NP1/P1Q2PKP/2B1R3 w - - 2 22',
      solution: ['c2c7', 'a6c7', 'b5b6'],
      hint: 'The black knight on b6 is protected by the queen. Can you get rid of the queen?',
      explanation:
        'Qxc7 takes the queen that protects the knight on b6. After Nxc7, nothing protects the knight on b6, so Rxb6 wins it.',
      difficulty: 1,
    },
    {
      id: 'removing-the-defender-4',
      fen: 'r4rk1/pp1qbppp/8/2pn4/8/1PN1Q3/P1P2PPP/R1B2RK1 w - - 0 13',
      solution: ['c3d5', 'd7d5', 'e3e7'],
      hint: 'The black bishop on e7 has two protectors. Find a way to drag one of them away.',
      explanation:
        'Nxd5 takes the knight, and Black takes back with the queen. But the queen has left d7, so nothing protects the bishop on e7 any more and Qxe7 wins it.',
      difficulty: 2,
    },
    {
      id: 'removing-the-defender-5',
      fen: 'r3r1k1/2qb1pb1/p5pp/3p4/1P1P4/2P1R1NP/1P3PPN/R2Q2K1 b - - 0 23',
      solution: ['e8e3', 'f2e3', 'c7g3'],
      hint: 'The white knight on g3 is protected by a rook and a pawn. Which black piece can start by trading the rook?',
      explanation:
        'Rxe3 takes the rook that protects the knight. When the pawn on f2 takes back, it leaves f2, and it was also a protector of the knight. Now Qxg3 wins the knight.',
      difficulty: 2,
    },
    {
      id: 'removing-the-defender-6',
      fen: 'r2q3k/1pp1n1pp/p2b2r1/6B1/3Pb3/PB3N1P/1P2QPP1/R4RK1 b - - 1 18',
      solution: ['e4f3', 'e2f3', 'g6g5'],
      hint: "White's bishop on g5 is protected only by the knight on f3. Can you take that knight?",
      explanation:
        'Bxf3 takes the knight that protects the bishop on g5. After Qxf3, your rook on g6 takes the bishop on g5 for free.',
      difficulty: 2,
    },
    {
      id: 'removing-the-defender-7',
      fen: '4rrk1/p1p2pp1/1p6/3P1nqp/2PPpR2/1P2P3/PBQ3PP/4R1K1 b - - 3 23',
      solution: ['f5e3', 'e1e3', 'g5f4'],
      hint: 'The white rook on f4 is protected by a pawn. Can you take that pawn?',
      explanation:
        'Nxe3 takes the pawn that protects the rook on f4, and it attacks the white queen too. After Rxe3, nothing protects the rook on f4, so Qxf4 wins it.',
      difficulty: 3,
    },
    {
      id: 'removing-the-defender-8',
      fen: 'r1r2k2/p3R1pp/4bp2/2np4/3Bp3/2P3P1/P3PPBP/5RK1 w - - 8 20',
      solution: ['d4c5', 'c8c5', 'e7e6'],
      hint: "Black's bishop on e6 is protected by a knight. Can you capture that knight?",
      explanation:
        'Bxc5 takes the knight that protects the bishop on e6. After Rxc5, your rook on e7 takes the bishop on e6 for free.',
      difficulty: 3,
    },
    {
      id: 'removing-the-defender-9',
      fen: 'r3k2r/pp3ppp/4p3/2bpP3/5P2/1Q2B3/Pq1N2PP/R4R1K b kq - 0 15',
      solution: ['b2b3', 'd2b3', 'c5e3'],
      hint: 'Look at the white bishop on e3. Which piece protects it?',
      explanation:
        'Qxb3 takes the queen that protects the bishop on e3. After Nxb3, nothing protects the bishop, so Bxe3 wins it.',
      difficulty: 3,
    },
    {
      id: 'removing-the-defender-10',
      fen: '3r3k/1p4pp/p1q5/4p3/3r1n2/Q3N2P/PP4P1/3R1R1K w - - 3 30',
      solution: ['d1d4', 'e5d4', 'f1f4'],
      hint: "Black's knight on f4 has two protectors. Can you force one of them to leave?",
      explanation:
        'Rxd4 takes the rook that protects the knight along the fourth row. The pawn on e5 takes back, and when it does, it stops protecting the knight. Then Rxf4 wins it. The pawn on d4 now attacks your knight on e3, but if Black takes it, Rf8+ Rxf8 Qxf8 is checkmate. (If Black took back with the other rook instead, Qf8 would be checkmate.)',
      difficulty: 3,
    },
    {
      id: 'removing-the-defender-11',
      fen: '5rk1/pp2r1pp/3q2p1/2n3P1/3Bn3/7P/PPP4Q/1K1R3R w - - 0 25',
      solution: ['h2d6', 'e4d6', 'd4c5'],
      hint: 'The knight on c5 is protected by the queen and by the knight on e4. Is there one trade that drags both away?',
      explanation:
        'Qxd6 trades queens, and the knight on e4 takes back. That leaves the knight on c5 without a protector, so Bxc5 wins it.',
      difficulty: 3,
    },
  ],
}
