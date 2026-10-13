import type { TacticLesson } from '../../types'

export const backRankMateLesson: TacticLesson = {
  id: 'back-rank-mate',
  name: 'Back-rank mate',
  tagline: 'A king stuck behind its own pawns can be mated by one rook or queen on the back row.',
  puzzleTheme: 'backRankMate',
  intro: [
    {
      type: 'text',
      text: "Your back rank is the row where your king starts: the bottom row for White, the top row for Black. After castling, your king usually sits there with three pawns in front of it. Those pawns feel safe, but they also block your king's way out.",
    },
    {
      type: 'board',
      fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
      caption:
        "White plays Re8, and it is checkmate. The king can't go forward because of its own pawns (marked), and nothing can block or capture the rook.",
      arrows: [{ from: 'e1', to: 'e8', color: 'blue' }],
      highlights: [
        { square: 'f7', color: 'yellow' },
        { square: 'g7', color: 'yellow' },
        { square: 'h7', color: 'yellow' },
      ],
    },
    {
      type: 'tip',
      text: "How to spot it: the enemy king is on its back row, its pawns haven't moved, and none of its pieces guard that row. Then ask yourself: can my rook or queen reach that row with check?",
    },
    {
      type: 'board',
      fen: 'k3r3/pp6/2b5/8/8/4Q3/2R2PPP/6K1 w - - 0 1',
      caption:
        'Sometimes a black piece is in the way. Here the bishop on c6 blocks your rook on c2. Qxe8+ forces Bxe8, which drags the bishop off the c-file (the c column). Then Rc8 is mate.',
      arrows: [
        { from: 'e3', to: 'e8', color: 'blue' },
        { from: 'c2', to: 'c8', color: 'blue' },
      ],
      highlights: [
        { square: 'e8', color: 'red' },
        { square: 'a7', color: 'yellow' },
        { square: 'b7', color: 'yellow' },
      ],
    },
    {
      type: 'board',
      fen: '5r1k/1pp3pp/pb3R1q/8/2B3b1/2Nr1N2/PP3PPP/R5K1 w - - 1 21',
      caption:
        "Real games are crowded, but the idea is the same. Black's king has no air, so Rxf8 is mate, even with all these pieces around.",
      arrows: [{ from: 'f6', to: 'f8', color: 'blue' }],
      highlights: [
        { square: 'g7', color: 'yellow' },
        { square: 'h7', color: 'yellow' },
      ],
    },
    {
      type: 'tip',
      text: "How to protect yourself: make 'luft', the German word for air. That means giving your king a square to escape to with a pawn move, like h3 for White or h6 for Black. Before you move a piece that is guarding your back row, check that the other side can't land a rook or queen there with check.",
    },
    {
      type: 'board',
      fen: '6k1/5pp1/7p/8/8/8/5PPP/4R1K1 w - - 0 1',
      caption:
        'This is the first position again, but Black has played h6. Now Re8+ is only a check, because the king can step to h7.',
      arrows: [{ from: 'e1', to: 'e8', color: 'red' }],
      highlights: [{ square: 'h7', color: 'yellow' }],
    },
  ],
  examples: [
    {
      title: 'Check, block, capture, mate',
      fen: '6k1/5ppp/5b2/8/8/8/5PPP/2R3K1 w - - 0 1',
      moves: ['c1c8', 'f6d8', 'c8d8'],
      explanations: [
        "The rook checks the king along the back row. The king can't step forward because of its own pawns, so Black has to block.",
        "The bishop steps in to block on d8. It is the only move that stops the check.",
        "The rook takes the bishop, and it is check again. The king still has no escape square and nothing can capture the rook, so it is checkmate.",
      ],
    },
    {
      title: 'A queen sacrifice pulls the guard away',
      fen: 'k3r3/pp4q1/2b2r2/3p4/7P/1N1BQ1P1/2R2P2/6K1 w - - 5 34',
      moves: ['e3e8', 'c6e8', 'c2c8'],
      explanations: [
        'Giving up a queen for a rook sounds crazy, but it is check, so Black must answer it. It also removes the rook that guards the back row.',
        'The bishop is the only piece that can take the queen. But now it has left the c-file, which was blocking your rook.',
        'The rook slides to the back row. The king is boxed in by its own pawns and nothing guards c8 any more, so it is checkmate.',
      ],
    },
    {
      title: 'Queen against queen',
      fen: '6k1/pp1q1ppp/8/2pPQ3/8/P6P/5PP1/6K1 w - - 1 28',
      moves: ['e5b8', 'd7c8', 'b8c8'],
      explanations: [
        'The queen jumps to the back row with check. The black king has no square to run to.',
        'Black has to block with the queen. It offers a queen trade, but that does not help, because White takes the queen with check.',
        'White takes the queen with check, and the king is stuck again. Checkmate!',
      ],
    },
    {
      title: 'Trade the guards one by one',
      fen: '1r1r3k/pq4pp/5b2/3R4/Q7/1P2P3/P4PPP/3R2K1 w - - 13 27',
      moves: ['d5d8', 'b8d8', 'd1d8', 'f6d8', 'a4e8'],
      explanations: [
        "White takes the rook on d8 with check. The black king can't move because of its pawns, so Black must take back.",
        'Black recaptures with the other rook.',
        'The second white rook takes again, with check. Again Black has to recapture.',
        "Black's bishop is the only piece left that can recapture. But look where it ends up: bishops move on diagonals, so from d8 it can't guard e8.",
        'The queen swings across the board to e8. Nothing can capture it and the king has no air. Checkmate!',
      ],
    },
  ],
  exercises: [
    {
      id: 'back-rank-mate-1',
      fen: '5rk1/1p4pp/p2n4/3P4/8/8/P1Q3PP/7K b - - 0 30',
      solution: ['f8f1'],
      hint: "White's king is stuck behind its own pawns. Which of your pieces can reach the bottom row with check?",
      explanation:
        "Rf1 is checkmate. The white king can't step forward because of its pawns on g2 and h2, and nothing can block or capture the rook.",
      difficulty: 1,
    },
    {
      id: 'back-rank-mate-2',
      fen: '3r4/1pp5/1k5p/p3N1b1/4P3/1B6/PPP2PPP/1K1R4 b - - 3 20',
      solution: ['d8d1'],
      hint: 'This time the white king is hiding on b1. Look at the white rook on d1.',
      explanation:
        "Rxd1 is checkmate. White's king is trapped by its own pawns on a2, b2 and c2, and nothing can take the rook back. Back-rank mates work on either side of the board.",
      difficulty: 1,
    },
    {
      id: 'back-rank-mate-3',
      fen: '2k1rb1r/pbpp4/1p6/5Np1/6P1/2PB2Pp/PPPn3B/R3R1K1 w - - 5 25',
      solution: ['e1e8'],
      hint: "Black's king is walled in by its own pieces. What can you capture on the back row, with check?",
      explanation:
        'Rxe8 is checkmate. The rook takes the rook with check, and the black king is boxed in by its own bishop and pawns.',
      difficulty: 1,
    },
    {
      id: 'back-rank-mate-4',
      fen: '6k1/3N1ppp/4pb2/3b4/3P4/N3P3/1r1n1PPP/2R3K1 w - - 0 28',
      solution: ['c1c8', 'f6d8', 'c8d8'],
      hint: "Black's back row is empty. Give a check, and think about what Black has to do about it.",
      explanation:
        'Rc8+ is check along the back row. The only way to stop it is to block with the bishop on d8, and then Rxd8 is mate.',
      difficulty: 1,
    },
    {
      id: 'back-rank-mate-5',
      fen: '3rR3/p5kp/1pp3p1/5bp1/P7/1B6/1PP2PPP/3R2K1 b - - 0 22',
      solution: ['d8d1', 'e8e1', 'd1e1'],
      hint: 'Your rook is attacked, but you have a check first. Where does it check from?',
      explanation:
        "Rxd1+ is check, and White's only answer is to block with the rook on e1. Then Rxe1 is mate, because the white king is shut in by its own pawns.",
      difficulty: 2,
    },
    {
      id: 'back-rank-mate-6',
      fen: '2r3k1/p4ppp/8/2p1p1P1/4qnQP/1P1r4/P4R1K/R7 w - - 1 32',
      solution: ['g4c8', 'd3d8', 'c8d8'],
      hint: "Black's pieces look scary, but look at Black's back row first. Is the rook on c8 safe?",
      explanation:
        "Qxc8+ wins a rook with check, and Black can only block with Rd8. Then Qxd8 is mate. When you can mate, ignore the other threats.",
      difficulty: 2,
    },
    {
      id: 'back-rank-mate-7',
      fen: '1r2r1k1/p2B1ppp/1p5q/3b4/3p4/1QP2P2/P3R1PP/4R2K w - - 1 24',
      solution: ['e2e8', 'b8e8', 'e1e8'],
      hint: "Both of Black's back-row guards are rooks. You also have two rooks on the same file.",
      explanation:
        'Rxe8+ Rxe8, and then your second rook takes again: Rxe8 is mate. Two rooks on one file can win the fight for the back row.',
      difficulty: 2,
    },
    {
      id: 'back-rank-mate-8',
      fen: '3r3k/6p1/5p1p/Q3p3/P3P3/2P5/5PPP/3q2RK b - - 2 34',
      solution: ['d1g1', 'h1g1', 'd8d1'],
      hint: 'Your queen can take a rook with check. Think about what the white king must do, and where your rook on d8 goes next.',
      explanation:
        "Qxg1+ forces the king to take back. Then Rd1 is checkmate: the white king is stuck behind its pawns and nothing can block or capture the rook.",
      difficulty: 2,
    },
    {
      id: 'back-rank-mate-9',
      fen: '8/6pk/p3Q2p/1p1p4/3Pnq2/2P2N2/PP4PP/7K b - - 4 37',
      solution: ['f4c1', 'f3e1', 'c1e1'],
      hint: 'White has no air on h1. Which check along the bottom row forces a piece to block?',
      explanation:
        'Qc1+ is check, and only the knight can block, on e1 or g1. After Ne1, Qxe1 is mate, because the king is stuck behind g2 and h2. If the knight blocks on g1 instead, your knight on e4 jumps to f2, which is mate too.',
      difficulty: 3,
    },
    {
      id: 'back-rank-mate-10',
      fen: '2R1r2k/p5pp/1p6/4q3/1Q6/7P/Pb3PP1/6K1 w - - 2 29',
      solution: ['b4f8', 'e8f8', 'c8f8'],
      hint: "The black rook on e8 is the only guard of the back row. How can you pull it away?",
      explanation:
        "Qf8+ is a queen sacrifice. Black has to take with the rook, and that rook is now off e8, so Rxf8 is mate.",
      difficulty: 3,
    },
    {
      id: 'back-rank-mate-11',
      fen: 'r4rk1/ppp3pp/8/8/4Q2q/8/PP3PPP/R1B1R1K1 b - - 0 18',
      solution: ['h4f2', 'g1h1', 'f2f1', 'e1f1', 'f8f1'],
      hint: 'Look for a queen move with check that your rook protects. Later, you will need to give up the queen to drag a defender away.',
      explanation:
        'Qxf2+ takes a pawn with check, and your rook on f8 protects the queen, so the king must go to h1. Qf1+ is the queen sacrifice: White must take with the rook (Rxf1), and then your rook takes back, Rxf1, and it is mate. Every check here leaves White only one reply.',
      difficulty: 3,
    },
  ],
}
