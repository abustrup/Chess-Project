import type { TacticLesson } from '../../types'

export const trappedPieceLesson: TacticLesson = {
  id: 'trapped-piece',
  name: 'Trapped pieces',
  tagline: "A piece with no safe square can't run away, so you can win it.",
  puzzleTheme: 'trappedPiece',
  intro: [
    {
      type: 'text',
      text: "A piece is trapped when it is attacked and has no safe square to go to. It may be boxed in by its own pieces, or every square it could reach may be covered by the enemy. A trapped piece can't escape, so you can win it, even if it is a queen.",
    },
    {
      type: 'board',
      fen: '8/7b/6p1/2kp1pPN/8/2P4P/3K4/8 w - - 0 46',
      caption:
        "The bishop on h7 is stuck behind its own pawn on g6. Its only free square is g8. Nf6 attacks the bishop and covers g8 at the same time, so the bishop is lost.",
      arrows: [{ from: 'h5', to: 'f6', color: 'blue' }],
      highlights: [
        { square: 'h7', color: 'red' },
        { square: 'g8', color: 'yellow' },
      ],
    },
    {
      type: 'tip',
      text: "How to spot it: count the escape squares of a piece. Pieces on the edge or in the corner have the fewest, and pieces that went deep into enemy territory often run out of room. If you can attack such a piece with something it can't safely capture, it is lost.",
    },
    {
      type: 'board',
      fen: 'r2qk1nr/1pp1bpQ1/p2p2bp/8/4P3/2N4P/PPP1BPP1/R1B1R1K1 b kq - 0 13',
      orientation: 'black',
      caption:
        "A queen that grabs a pawn deep in the enemy camp can get trapped. Black plays Bf6 and attacks the queen on g7. Every square it could reach is covered, so White has to give the queen away: for a rook with Qxh8 Bxh8, or for a bishop with Qxg6 fxg6.",
      arrows: [{ from: 'e7', to: 'f6', color: 'blue' }],
      highlights: [
        { square: 'g7', color: 'red' },
        { square: 'h8', color: 'yellow' },
      ],
    },
    {
      type: 'board',
      fen: 'r2qk1nr/pp1bbp2/1nppp2p/6pQ/4P3/PBNPBN1P/1PP2PP1/R3K2R b KQkq - 1 10',
      orientation: 'black',
      caption:
        "Early queen adventures are risky too. White's queen went to h5, and Black plays Nf6. Now g4 is covered by the knight, h4 by the pawn on g5, and g6 by the pawn on f7. Taking on f7, g5 or h6 just loses the queen too, so it has nowhere to go.",
      arrows: [{ from: 'g8', to: 'f6', color: 'blue' }],
      highlights: [
        { square: 'h5', color: 'red' },
        { square: 'g4', color: 'yellow' },
        { square: 'h4', color: 'yellow' },
        { square: 'g6', color: 'yellow' },
      ],
    },
    {
      type: 'tip',
      text: "How not to fall for it: before you grab a pawn with a queen or a bishop, check how it will get back. Keep an escape square for your pieces, and don't let your own pawns lock your bishop in.",
    },
    {
      type: 'board',
      fen: '8/7b/8/2kp1pPN/8/2P4P/3K4/8 w - - 0 46',
      caption:
        "This is the first position again, but Black's pawn is not on g6. Now after Nf6 the bishop has a way out: it just steps to g6.",
      arrows: [
        { from: 'h5', to: 'f6', color: 'red' },
        { from: 'h7', to: 'g6', color: 'blue' },
      ],
      highlights: [{ square: 'g6', color: 'yellow' }],
    },
  ],
  examples: [
    {
      title: 'The knight in the corner',
      fen: 'n4k2/P4p2/P1K1p1p1/4P2p/3p1P2/7P/8/8 w - - 0 43',
      moves: ['c6b7', 'd4d3', 'b7a8'],
      explanations: [
        'The knight on a8 is in the corner. Its only squares are b6 and c7, and the king covers both. Now the king attacks the knight too.',
        "Black can't save the knight, so it just makes another move.",
        'The king takes the trapped knight.',
      ],
    },
    {
      title: 'Boxed in by your own pieces',
      fen: 'rn3k2/pp5p/4p1p1/3pP3/2pP2P1/2P1n2B/PP2K2P/RN6 b - - 1 19',
      moves: ['e3c2', 'b1a3', 'c2a1'],
      explanations: [
        'The white rook on a1 has a pawn on a2 and a knight on b1 right in front of it. It cannot move at all. The knight jumps to c2 and attacks it.',
        'White attacks the black knight with its own knight. But this does not save the rook.',
        'The knight takes the rook. White got in its own way: the rook was trapped by its own pieces.',
      ],
    },
    {
      title: 'A queen that went too deep',
      fen: '4r1k1/1pp2p2/p1p3p1/7p/1P2PPn1/P2P1NPq/2P1R2P/4R1K1 w - - 0 27',
      moves: ['f3g5', 'g4h2', 'g5h3'],
      explanations: [
        'Black\'s queen has gone deep into White\'s camp, to h3. The knight attacks it, and every square it could go to is covered by White\'s king, rook and pawns.',
        "Black grabs a pawn with the knight, but it can't save the queen.",
        'The knight takes the queen. White wins a whole queen for a pawn.',
      ],
    },
    {
      title: 'A king step sets the trap',
      fen: '4r1k1/pp4bQ/2p2qp1/8/N7/1P6/P1PP4/2K4R b - - 1 30',
      moves: ['g8f7', 'c2c3', 'e8h8', 'h7h8', 'g7h8'],
      explanations: [
        "White's queen on h7 gives check, but it has gone too far. Black's rook would love to attack it from h8, and the king on g8 is in the way. Kf7 gets out of check and clears the path.",
        "White cannot rescue the queen, so it just plays on.",
        'The rook attacks the queen. Every square the queen could go to is covered, so it cannot escape.',
        'The queen takes the rook, which is the most it can get.',
        'The bishop takes the queen. Black gave a rook and won a queen.',
      ],
    },
  ],
  exercises: [
    {
      id: 'trapped-piece-1',
      fen: '8/8/3Kp3/4Pk1P/n7/1p6/8/B7 b - - 1 59',
      solution: ['b3b2', 'a1b2', 'a4b2'],
      hint: "White's bishop is in the corner and has only one move. Can a pawn attack it?",
      explanation:
        'b2 attacks the bishop on a1. Its only move is Bxb2, and then your knight takes it. You gave a pawn and won a bishop.',
      difficulty: 1,
    },
    {
      id: 'trapped-piece-2',
      fen: '8/pp2kp1p/2p3b1/8/5PP1/1B2K3/PP6/8 w - - 1 40',
      solution: ['f4f5', 'g6f5', 'g4f5'],
      hint: "Black's bishop is hemmed in by its own pawns. Which of your pawns can attack it?",
      explanation:
        "f5 attacks the bishop. It can't go to h5 because of the pawn on g4, and its own pawns block the other squares. So the best it can do is take on f5, and gxf5 wins it for a pawn.",
      difficulty: 1,
    },
    {
      id: 'trapped-piece-3',
      fen: '4rrk1/p7/1p2p1q1/2p2p2/2P3p1/1PPP2R1/3Q2PP/4R1K1 b - - 1 27',
      solution: ['f5f4', 'g3e3', 'f4e3'],
      hint: 'Look at the white rook on g3. Where could it go, and which of your pawns could attack it?',
      explanation:
        'f4 attacks the rook on g3. It has nowhere safe to go: the pawn on g4 covers f3 and h3, the pawn on f4 covers e3, and Rxg4 runs into your queen. White loses a rook for a pawn.',
      difficulty: 1,
    },
    {
      id: 'trapped-piece-4',
      fen: 'r7/pp3kbQ/6p1/8/8/2P2P1P/P1P5/6K1 b - - 0 23',
      solution: ['a8h8', 'h7h8', 'g7h8'],
      hint: "White's queen is deep in your camp. Which of your rooks can attack it along a file (a column)?",
      explanation:
        'Rh8 attacks the queen. The whole h-file is covered by your rook, and your king and bishop cover the other squares. White can only take the rook with Qxh8, and then Bxh8 wins the queen.',
      difficulty: 2,
    },
    {
      id: 'trapped-piece-5',
      fen: '3r1rk1/p4pbp/1p4p1/2p4q/2PnPB2/P2P2PB/7K/3RQR2 w - - 2 27',
      solution: ['g3g4', 'h5e5', 'f4e5'],
      hint: "Black's queen on h5 has few squares. Which pawn move attacks it?",
      explanation:
        'g4 attacks the queen, and every escape square is covered by your pieces and pawns. Black tries Qe5, but Bxe5 wins the queen for a bishop.',
      difficulty: 2,
    },
    {
      id: 'trapped-piece-6',
      fen: 'rn2k1nr/1b3ppp/pq2p3/2b5/1p2P3/2B2B2/PPP2PPP/RN1Q1RK1 w kq - 0 12',
      solution: ['c3g7', 'g8e7', 'g7h8'],
      hint: "Black's rook on h8 is stuck in the corner. What stands between your bishop and that rook?",
      explanation:
        "Bxg7 attacks the rook on h8. The rook is stuck: the knight on g8 blocks it along the row and the pawn on h7 blocks it along the file. Even if the knight moves, Bxh8 wins the rook.",
      difficulty: 2,
    },
    {
      id: 'trapped-piece-7',
      fen: 'rnbq2n1/ppp1pkbQ/3p2p1/3P1p2/2P4P/2NB4/PP3PP1/R1B1K2R b KQ - 0 14',
      solution: ['g8f6', 'h7g7', 'f7g7'],
      hint: "White's queen is on h7, close to your king. Which of your pieces can attack it?",
      explanation:
        'Nf6 attacks the queen. Every square it could reach is covered by your king, your bishop on g7 or your pawn on g6. At best, White gets a bishop for it with Qxg7+ Kxg7.',
      difficulty: 2,
    },
    {
      id: 'trapped-piece-8',
      fen: 'r1b2rk1/pp3pp1/4p2p/3p4/4nQPP/3RP3/qPP1BP2/2K3NR w - - 0 15',
      solution: ['d3a3', 'a2a3', 'b2a3'],
      hint: "Black's queen is deep in your camp. Which piece can attack it from a safe square?",
      explanation:
        'Ra3 attacks the queen, and it has no safe square: your king covers b1 and b2, the pawn on c2 covers b3, the bishop covers c4, and the rook covers a1. Black can only take with Qxa3, and then bxa3 wins the queen for a rook.',
      difficulty: 2,
    },
    {
      id: 'trapped-piece-9',
      fen: 'r4rk1/1p2nppp/p1n5/3pPR2/3P2Pq/P2Q3P/1P2N3/5RK1 w - - 3 21',
      solution: ['f5h5', 'h4h5', 'g4h5'],
      hint: "Black's queen on h4 has very few squares. Which of your rooks can attack it?",
      explanation:
        'Rh5 attacks the queen, and every square it could go to is covered. The queen can only take the rook, and then gxh5 wins the queen for a rook.',
      difficulty: 3,
    },
    {
      id: 'trapped-piece-10',
      fen: 'rnb2rk1/ppp3pp/8/3pP3/3Ppp2/2N1q1P1/PPP1BR1P/R2Q2K1 w - - 0 15',
      solution: ['c3d5', 'f4g3', 'd5e3'],
      hint: "Black's queen is far from home. Which of your pieces can attack it while taking a pawn?",
      explanation:
        'Nxd5 wins a pawn and attacks the queen on e3. All its squares are covered by your pieces and pawns, so the queen is lost whatever Black does.',
      difficulty: 3,
    },
    {
      id: 'trapped-piece-11',
      fen: 'r1bqkb1r/3pnppp/p1n1p3/3N4/2p1P3/4BN2/PP3PPP/R2Q1RK1 w kq - 0 10',
      solution: ['e3b6', 'e6d5', 'b6d8'],
      hint: "Black's queen is boxed in by its own pieces. Which square lets your bishop attack it?",
      explanation:
        "Bb6 attacks the queen on d8. It is boxed in by its own bishop, king, knight and pawn, and the only squares left (b6 and c7) are covered. So after exd5, Bxd8 wins the queen.",
      difficulty: 3,
    },
    {
      id: 'trapped-piece-12',
      fen: 'rnQ2b1r/p1p1kppp/2q2n2/8/8/2N2N2/PP1PPP1P/R1B1K2R b KQ - 6 11',
      solution: ['b8d7', 'c8a8', 'c6a8'],
      hint: "White's queen sits on c8, and a quiet move can attack it. Which of your pieces is in the way?",
      explanation:
        "Nbd7 opens the line from your rook on a8 to the queen on c8. The queen has no safe square, so White takes the rook with Qxa8, and then Qxa8 wins the queen for a rook.",
      difficulty: 3,
    },
  ],
}
