import type { TacticLesson } from '../../types'

// The in-between move (zwischenzug / intermezzo). Exercise positions come from real Lichess puzzles (CC0);
// every line was checked with Stockfish.
export const zwischenzugLesson: TacticLesson = {
  id: 'zwischenzug',
  name: 'The in-between move',
  tagline: 'Before you make the obvious recapture, ask if a stronger move can be played first.',
  puzzleTheme: 'intermezzo',
  intro: [
    {
      type: 'text',
      text: '**Zwischenzug** is German for an **in-between move**. When pieces are being captured you expect to take back right away, but first you slip in a check or a big threat that your opponent has to answer. The recapture is usually still there afterwards, and now it wins more.',
    },
    {
      type: 'board',
      fen: 'r3k3/pp3ppp/2n5/8/3q4/5B2/5PPP/3QK3 w - - 0 1',
      arrows: [
        { from: 'f3', to: 'c6', color: 'blue' },
        { from: 'd1', to: 'd4', color: 'red' },
      ],
      highlights: [{ square: 'c6', color: 'yellow' }],
      caption:
        "Black's queen on d4 is guarded by the knight on c6, so Qxd4 Nxd4 is only a swap. First play Bxc6+, with check. After bxc6 you take the queen with Qxd4, and nothing guards it any more.",
    },
    {
      type: 'tip',
      text: 'How to spot it: when you are about to recapture, stop and ask, "Is there a check, a capture or a threat I can play first?" The recapture rarely runs away. A forcing move that removes a guard can turn an even swap into a win.',
    },
    {
      type: 'board',
      fen: '3q2k1/5ppp/8/4n3/3Q4/5N2/5PPP/6K1 b - - 0 1',
      orientation: 'black',
      arrows: [
        { from: 'e5', to: 'f3', color: 'blue' },
        { from: 'd8', to: 'd4', color: 'red' },
      ],
      highlights: [{ square: 'f3', color: 'yellow' }],
      caption:
        "The same idea with Black. The queens face each other and the white knight on f3 guards its queen. Nxf3+ is check, so White has to take the knight with gxf3, and then Qxd4 wins the queen.",
    },
    {
      type: 'board',
      fen: 'r1b1k2r/p2pppbp/6p1/1pPP1q2/4B3/2N1BN1P/5PP1/1R1QK2R b Kkq - 0 18',
      orientation: 'black',
      arrows: [
        { from: 'g7', to: 'c3', color: 'blue' },
        { from: 'f5', to: 'e4', color: 'red' },
      ],
      highlights: [{ square: 'c3', color: 'yellow' }],
      caption:
        "In a real game it can look like this. Black's queen is attacked by the bishop on e4, but Qxe4 Nxe4 would lose the queen. Bxc3+ takes the guarding knight with check first, and then Qxe4 wins the bishop.",
    },
    {
      type: 'text',
      text: 'The in-between move can be played against you too. When you capture something, your opponent does not have to take back at once, and may answer with a check instead. Before you take, ask yourself what check or threat they could play first.',
    },
    {
      type: 'tip',
      text: 'Look at forcing moves in this order: checks, captures, then threats. Every in-between move is one of those three, because your opponent must answer it.',
    },
  ],
  examples: [
    {
      title: 'Take the guard with check, then take the queen',
      fen: 'r3kb1r/pp3ppp/2n1p3/8/3q4/P4B1P/1P3PP1/R1BQK2R w KQkq - 0 13',
      moves: ['f3c6', 'b7c6', 'd1d4'],
      explanations: [
        "Black's queen on d4 is guarded by the knight on c6. Instead of Qxd4, the bishop takes that knight, and it is check.",
        'Black must answer the check. Taking the bishop is the natural way. (Any other move loses the queen as well.)',
        'Now the queen takes the black queen. The knight that guarded her is gone, so White has won a whole queen.',
      ],
    },
    {
      title: 'A check removes the guard of a rook',
      fen: '5r1k/r6p/1q1p1p2/4pp2/p1P1n3/3NR2P/PP3PB1/2RQ3K b - - 0 26',
      moves: ['e4f2', 'd3f2', 'b6e3'],
      explanations: [
        "The knight takes the pawn on f2 with check. That pawn was the only guard of White's rook on e3.",
        'White takes the knight with its own knight, because the king is in check.',
        "Now nothing protects the rook, and the queen takes it. Black gave a knight for a pawn but won a whole rook.",
      ],
    },
    {
      title: 'Your queen is attacked? Check first',
      fen: 'r4rk1/pp3R2/3p3p/3Pp3/4P1q1/1B2b3/PP3QP1/5RK1 w - - 0 28',
      moves: ['f7f8', 'a8f8', 'f2e3', 'f8f1', 'g1f1'],
      explanations: [
        "White's queen is attacked by the bishop on e3. If she simply took the bishop, Black's rook would capture the rook on f7. So White first takes the rook on f8, with check.",
        'Black recaptures with the other rook. The check is over, and the f7 rook is gone.',
        'Now the queen takes the bishop that was attacking her.',
        'Black trades the last pair of rooks.',
        'White recaptures and is a clean bishop ahead.',
      ],
    },
    {
      title: 'A check that ends in checkmate',
      fen: 'r2q1rk1/1pp2pp1/2b4p/8/8/P1Q1PP2/1B3P1P/RN3RK1 b - - 0 18',
      moves: ['d8g5', 'g1h1', 'c6f3'],
      explanations: [
        "Black's bishop wants to take on f3, but first the queen gives check along the g-file. Black has not captured anything yet, but White has to answer.",
        "White's king has only one safe square, h1.",
        'Now the bishop takes the pawn on f3 with check. The queen on g5 covers g1 and g2, so the king cannot escape. Checkmate.',
      ],
    },
  ],
  exercises: [
    {
      id: 'zwischenzug-1',
      fen: 'rnbqk2r/pp3pp1/5b1p/3Q4/8/P1N2N2/1P2PPPP/R3KB1R b KQkq - 0 10',
      solution: ['f6c3', 'b2c3', 'd8d5'],
      hint: 'Do not take the queen yet. Look at the knight that guards her, and at a check you can give.',
      explanation:
        'Bxc3+ takes the knight that guards the white queen, and it is check. After bxc3 nothing protects the queen on d5, so Qxd5 wins her. Taking at once with Qxd5 would only swap queens, because Nxd5 takes back.',
      difficulty: 1,
    },
    {
      id: 'zwischenzug-2',
      fen: 'r5k1/4qpp1/2Nb1nbp/pr1p4/B7/P3PPP1/1P5P/R1B1R1K1 w - - 0 23',
      solution: ['c6e7', 'd6e7', 'a4b5'],
      hint: 'You can win the rook on b5, but something bigger is hanging first. Look for a capture with check.',
      explanation:
        'The obvious move is Bxb5, but Black\'s queen on e7 is attacked too. Nxe7+ takes her with check, and after Bxe7 you still play Bxb5. You have won a queen and a rook for a knight.',
      difficulty: 1,
    },
    {
      id: 'zwischenzug-3',
      fen: '1n4k1/2b1nppp/r3p3/2PpP3/3P4/5N2/5PPP/RR4K1 w - - 0 26',
      solution: ['b1b8', 'c7b8', 'a1a6'],
      hint: 'The black rook on a6 is guarded by a knight. Can you take that knight with check first?',
      explanation:
        'Rxa6 at once would be met by Nxa6, a swap of rooks. Rxb8+ takes the guard with check, and after Bxb8 the rook on a6 has no protector. Then Rxa6 wins it.',
      difficulty: 1,
    },
    {
      id: 'zwischenzug-4',
      fen: 'r4rk1/ppp2ppp/2nb1n2/7q/2P1N3/P2P3P/1P3PP1/R1BQ1RK1 w - - 0 15',
      solution: ['e4f6', 'g7f6', 'd1h5'],
      hint: "Black's queen is guarded by a knight. Remove the guard with check, then take the queen.",
      explanation:
        'Qxh5 Nxh5 would only swap queens. Nxf6+ takes the knight that guards the black queen, with check. After gxf6, Qxh5 wins the queen.',
      difficulty: 1,
    },
    {
      id: 'zwischenzug-5',
      fen: 'r4rk1/3b1p1p/1q2pp2/p2pB3/P7/1B6/1PP1QPPP/2R1b1K1 w - - 0 19',
      solution: ['e2g4', 'g8h8', 'e5f6'],
      hint: 'Taking on f6 at once lets Black fight back. Drive the king into the corner with a check first.',
      explanation:
        'Bxf6 straight away lets Black counterattack with Qxf2+. Qg4+ forces the king to h8, and then Bxf6 is checkmate: the bishop attacks the king and the queen covers the g-file.',
      difficulty: 2,
    },
    {
      id: 'zwischenzug-6',
      fen: 'r4r2/1b1p1pkp/pp1PpNp1/8/2Bn4/8/PP2QPPP/R4RK1 b - - 0 19',
      solution: ['d4e2', 'c4e2', 'g7f6'],
      hint: 'Look at the white queen. Can you capture her with check before you do anything else?',
      explanation:
        "Nxe2+ takes the white queen with check, so White has to recapture with Bxe2 first. Then the king takes the knight on f6 for free. If you took the knight at once, White would have time to save the queen.",
      difficulty: 2,
    },
    {
      id: 'zwischenzug-7',
      fen: 'r1br2k1/pp3pp1/4pq1p/2P1N3/8/P5P1/5PBP/RN1Q1RK1 b - - 0 17',
      solution: ['d8d1', 'f1d1', 'f6e5'],
      hint: "You want the knight on e5, but your rook and White's queen are looking at each other. Which capture comes first?",
      explanation:
        'Qxe5 at once would leave your rook on d8 unprotected, and Qxd8+ would win it. Rxd1 takes the white queen first. After Rxd1 you still have Qxe5.',
      difficulty: 2,
    },
    {
      id: 'zwischenzug-8',
      fen: '1k6/pppr1pp1/5p1p/2N2b2/1P1P1b2/2PR1N1P/PK3PP1/4r3 w - - 0 19',
      solution: ['c5d7', 'f5d7', 'f3e1'],
      hint: 'Do not rush to take on e1. Take something with check first and see what happens to Black\'s pieces.',
      explanation:
        'Nxd7+ wins a rook with check. After Bxd7 the bishop is no longer attacking your rook on d3, and Nxe1 wins the other black rook. Taking on e1 straight away would let Black play Re7.',
      difficulty: 2,
    },
    {
      id: 'zwischenzug-9',
      fen: '2kr4/ppp2ppp/2n2n2/7B/3b4/P1N1Q3/1PP3PP/R4RK1 b - - 0 15',
      solution: ['d4e3', 'g1h1', 'f6h5'],
      hint: "White's queen is attacking your bishop. Can you take the queen with check before you save anything?",
      explanation:
        'Nxh5 at once would lose the bishop on d4 to Qxd4. Bxe3+ takes the white queen with check. After Kh1, Nxh5 wins the bishop on h5 as well.',
      difficulty: 2,
    },
    {
      id: 'zwischenzug-10',
      fen: '5bk1/1q1R1pp1/3p3p/3Pp3/2Q5/1r2B1PP/5PB1/6K1 b - - 0 28',
      solution: ['b3b1', 'g1h2', 'b7d7'],
      hint: 'Your rook and your queen are both attacked. Move the rook with check and see what your queen can take next.',
      explanation:
        'Qxd7 at once loses the rook on b3 to Qxb3. Rb1+ moves the rook to safety with check, and after Kh2 the queen takes the rook on d7.',
      difficulty: 3,
    },
    {
      id: 'zwischenzug-11',
      fen: '2r3k1/1p3qpp/p2b4/3N1p2/4pP2/P3B3/1P3QPP/2R3K1 b - - 0 27',
      solution: ['c8c1', 'e3c1', 'f7d5'],
      hint: 'Your rook on c8 is attacked. If you take the knight at once, what happens to it?',
      explanation:
        'Qxd5 straight away would lose the rook on c8 to Rxc8+. Rxc1+ trades the rooks with check, and after Bxc1 the queen takes the knight on d5 for free.',
      difficulty: 3,
    },
    {
      id: 'zwischenzug-12',
      fen: 'r2q1r2/1p3pkp/3N1b2/p1p5/2B1PPb1/8/PP1Q2PP/1R3RK1 b - - 0 19',
      solution: ['f6d4', 'g1h1', 'd8d6'],
      hint: 'The white queen guards the knight along the d-file. Block that file with a check.',
      explanation:
        'The knight on d6 is protected by the queen on d2. Bd4+ comes with check and puts a bishop in the way, so the queen no longer protects the knight. Then Qxd6 wins it.',
      difficulty: 3,
    },
  ],
}
