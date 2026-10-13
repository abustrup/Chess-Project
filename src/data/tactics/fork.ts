import type { TacticLesson } from '../../types'

// Forks. Exercise positions come from real Lichess puzzles (CC0); every line was checked with Stockfish.
export const forkLesson: TacticLesson = {
  id: 'fork',
  name: 'Forks',
  tagline: 'One piece, two targets: attack two things at once and win one of them.',
  puzzleTheme: 'fork',
  intro: [
    {
      type: 'text',
      text: 'A **fork** is when one piece attacks two (or more) enemy pieces at the same time. Your opponent can only fix one problem per move, so you win the other piece. It is one of the first tactics every player learns.',
    },
    {
      type: 'board',
      fen: 'r3k3/ppN2ppp/8/8/8/8/PPP2PPP/4K3 b - - 1 1',
      arrows: [
        { from: 'd5', to: 'c7', color: 'blue' },
        { from: 'c7', to: 'e8', color: 'red' },
        { from: 'c7', to: 'a8', color: 'red' },
      ],
      highlights: [{ square: 'c7', color: 'yellow' }],
      caption:
        'The knight jumped from d5 to c7. It checks the king on e8 and attacks the rook on a8. Black must save the king, so White wins the rook.',
    },
    {
      type: 'tip',
      text: '**How to spot a fork:** look for two enemy pieces that one of your pieces could attack together. A fork with a check is the strongest, because your opponent must answer the check first. Before you jump, make sure the forking piece can’t simply be captured.',
    },
    {
      type: 'board',
      fen: '6k1/pp3ppp/2n1n3/3P4/8/8/PP3PPP/R5K1 b - - 0 1',
      arrows: [
        { from: 'd4', to: 'd5', color: 'blue' },
        { from: 'd5', to: 'c6', color: 'red' },
        { from: 'd5', to: 'e6', color: 'red' },
      ],
      caption:
        'Even a pawn can fork. After d4-d5 the pawn attacks both knights, and Black can only save one. Bishops, rooks and queens fork too.',
    },
    {
      type: 'board',
      fen: 'q3k2r/2N1bppp/5n2/8/2p5/3p3P/1P1Q1PP1/4KB1R b Kk - 1 18',
      arrows: [
        { from: 'b5', to: 'c7', color: 'blue' },
        { from: 'c7', to: 'e8', color: 'red' },
        { from: 'c7', to: 'a8', color: 'red' },
      ],
      highlights: [{ square: 'c7', color: 'yellow' }],
      caption:
        'In real games a fork hides inside a busy position. Here the knight on c7 hits the king and the queen sitting in the corner. Always check the edges of the board for loose pieces.',
    },
    {
      type: 'text',
      text: 'Forks work against you too. Before each move, look at where your opponent’s knights, pawns and queen could jump next. If one jump would hit two of your pieces, deal with it first: guard that square, move one of the pieces, or make a bigger threat of your own.',
    },
    {
      type: 'tip',
      text: '**Safety check before every move:** “After my move, can any enemy piece attack two of my pieces at once?” Pay extra attention to knights, because they jump to squares you don’t expect.',
    },
  ],
  examples: [
    {
      title: 'A knight forks the king and a rook',
      fen: '2r3k1/pp3ppp/8/3N4/8/8/PPP2PPP/6K1 w - - 0 1',
      moves: ['d5e7', 'g8f8', 'e7c8'],
      explanations: [
        'The knight jumps to e7. From there it checks the king on g8 and attacks the rook on c8 at the same time. That is a fork.',
        'Black has to get out of check, so the king steps aside. There is no time to save the rook.',
        'The knight takes the rook. White has won a whole rook for free.',
      ],
    },
    {
      title: 'A pawn fork in an endgame',
      fen: '8/1p6/1k1n4/8/2PP4/2K5/PP6/8 w - - 4 47',
      moves: ['c4c5', 'b6c6', 'c5d6'],
      explanations: [
        'The pawn steps forward. It checks the king on b6 and attacks the knight on d6 at the same time.',
        'The king has to move out of check. Black steps to c6.',
        'The pawn takes the knight. Black’s king can take the pawn back, but White has won a knight for a pawn.',
      ],
    },
    {
      title: 'A queen fork on the back row',
      fen: '6k1/1b3pp1/pp3q1p/8/P1p5/2P3Q1/1P3NPP/5K2 w - - 0 31',
      moves: ['g3b8', 'g8h7', 'b8b7'],
      explanations: [
        'The queen swings to the back row. It checks the king on g8 and attacks the bishop on b7 next to it.',
        'Black must answer the check. The king steps to h7 and the bishop is left alone.',
        'The queen takes the bishop for free.',
      ],
    },
    {
      title: 'A sacrifice that sets up a fork',
      fen: '2R5/5Rpk/p3r3/1p2p2p/7q/4P1N1/PP3P2/6K1 w - - 0 34',
      moves: ['f7g7', 'h7g7', 'g3f5', 'g7f6', 'f5h4'],
      explanations: [
        'White gives up a rook to pull the king onto g7. It looks strange, but it is a plan.',
        'The king takes the rook. Now it stands on g7, exactly where White wants it.',
        'The knight checks the king on g7 and also attacks the black queen on h4. Another fork!',
        'The king has to move out of check, so the queen is left alone.',
        'The knight takes the queen. White gave a rook, but won a queen.',
      ],
    },
  ],
  exercises: [
    {
      id: 'fork-1',
      fen: '1r4k1/1p1n1pp1/p2N3p/2P5/8/Pn4P1/4PPBP/1R3K2 b - - 12 28',
      solution: ['b3d2', 'f1e1', 'd2b1'],
      hint: 'Look for a square where your knight attacks the king and a rook together.',
      explanation:
        'The knight jumps to d2 with check, and from there it also attacks the rook on b1. White must move the king, so Black takes the rook.',
      difficulty: 1,
    },
    {
      id: 'fork-2',
      fen: '2r3k1/pp4pp/8/3Nb3/2p5/2Pn4/PP4PP/R1B3K1 w - - 3 21',
      solution: ['d5e7', 'g8f7', 'e7c8'],
      hint: 'One knight jump gives check and attacks a rook at the same time.',
      explanation:
        'Ne7+ checks the king on g8 and attacks the rook on c8. After the king moves, the knight takes the rook.',
      difficulty: 1,
    },
    {
      id: 'fork-3',
      fen: '8/4bkpp/8/R7/5n2/5P2/1P5P/5K2 w - - 3 34',
      solution: ['a5f5', 'f7e6', 'f5f4'],
      hint: 'Rooks fork along lines too. Is there a square on the f-file that hits the king and the loose knight?',
      explanation:
        'Rf5+ gives check and attacks the unprotected knight on f4. Black must deal with the check first, so Rxf4 wins the knight.',
      difficulty: 1,
    },
    {
      id: 'fork-4',
      fen: 'r3k2r/pp3ppp/2n1pb2/1q6/2Np4/P2P4/1P3PPP/R1BQ1RK1 w kq - 5 18',
      solution: ['c4d6', 'e8d7', 'd6b5'],
      hint: 'Find a knight jump that gives check and attacks the black queen.',
      explanation:
        'Nd6+ is a “royal fork”: the knight checks the king on e8 and attacks the queen on b5. Black must move the king, so the knight takes the queen for free.',
      difficulty: 2,
    },
    {
      id: 'fork-5',
      fen: 'r2qk1nr/ppp1ppB1/3p2p1/3P3p/2P2Pn1/1P4P1/P3N1BP/R2Q1K1R b kq - 0 15',
      solution: ['g4e3', 'f1f2', 'e3d1'],
      hint: 'Your knight on g4 has a jump that checks the king and attacks the white queen.',
      explanation:
        'Ne3+ forks the king on f1 and the queen on d1. White must answer the check, and then Nxd1+ wins the queen with another check.',
      difficulty: 2,
    },
    {
      id: 'fork-6',
      fen: 'r2qkb1r/pp1npppp/8/1B2Nb2/3Pp3/8/PPP2PPP/R1BQK2R b KQkq - 3 9',
      solution: ['d8a5', 'c2c3', 'a5b5'],
      hint: 'A queen can fork too. Look for a check that also attacks a loose piece.',
      explanation:
        'Qa5+ checks the king along the diagonal and attacks the bishop on b5 at the same time. White blocks with c3, but Qxb5 wins the bishop.',
      difficulty: 2,
    },
    {
      id: 'fork-7',
      fen: '6k1/1p4p1/p1n2p2/2K2b1p/7P/2P5/r5PB/5BR1 w - - 0 31',
      solution: ['f1c4', 'g8h7', 'c4a2'],
      hint: 'Your bishop has a checking move that also lines up with the rook on a2.',
      explanation:
        'Bc4+ checks the king on g8 and attacks the rook on a2 along the other diagonal. Black must answer the check, and then Bxa2 wins the rook.',
      difficulty: 2,
    },
    {
      id: 'fork-8',
      fen: '4k3/q1rn2p1/P1p1p3/4p1b1/N3P3/8/1PP1QP2/3R2K1 w - - 0 28',
      solution: ['e2h5', 'e8f8', 'h5g5'],
      hint: 'One of Black’s pieces has no protection. Can your queen check the king and attack it?',
      explanation:
        'Qh5+ checks the king on e8 and attacks the unprotected bishop on g5. Black can’t save both, so White wins the bishop.',
      difficulty: 2,
    },
    {
      id: 'fork-9',
      fen: 'r1bqk1nr/pppn1pbp/3p2p1/4p3/2PPP3/2NBB3/PP3PPP/R2QK1NR b KQkq - 1 6',
      solution: ['e5d4', 'e3d4', 'g7d4'],
      hint: 'A pawn can fork too. Which black pawn capture attacks two white pieces?',
      explanation:
        '…exd4 takes a pawn and attacks both the knight on c3 and the bishop on e3. White can’t save both pieces: after Bxd4 Bxd4, Black has won a piece.',
      difficulty: 2,
    },
    {
      id: 'fork-10',
      fen: '2r5/p5p1/4pp2/1Nppk1p1/1P4n1/P1P3P1/3K4/2R5 w - - 2 29',
      solution: ['c1e1', 'e5f5', 'b5d6', 'f5g6', 'd6c8'],
      hint: 'Start with a check that leaves the king little room, then look for a knight jump.',
      explanation:
        'Re1+ drives the king to f5. Now Nd6+ is a fork: it checks the king and attacks the rook on c8. A check can push the enemy king onto the square where your fork works.',
      difficulty: 3,
    },
    {
      id: 'fork-11',
      fen: '5r2/3Q2pk/6pp/p1p1P3/1p1PN3/8/Pq4PP/5RK1 b - - 0 31',
      solution: ['f8f1', 'g1f1', 'b2b1', 'f1f2', 'b1e4'],
      hint: 'Trade rooks with check first. Then look for a queen check that attacks something else.',
      explanation:
        'Rxf1+ forces the king to take on f1. Then Qb1+ checks the king and attacks the knight on e4. The king moves, and Qxe4 wins the knight.',
      difficulty: 3,
    },
    {
      id: 'fork-12',
      fen: '2r3k1/pp1q1ppp/8/3Nn1P1/4PBb1/8/PP4BP/2R2KN1 w - - 0 22',
      solution: ['c1c8', 'd7c8', 'd5e7', 'g8h8', 'e7c8'],
      hint: 'Can you drag the black queen onto a square where a knight can fork it with the king?',
      explanation:
        'Rxc8+ takes a rook, and the queen has to take back on c8. Then Ne7+ forks the king and the queen. After the king moves, Nxc8 wins the queen.',
      difficulty: 3,
    },
  ],
}
