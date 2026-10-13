import type { TacticLesson } from '../../../types'

// A small lesson of our own, only used to build and test the Tactics page (open /tactics?fixture=1).
// Exercise positions come from real Lichess puzzles and were checked with Stockfish.
export const forkFixture: TacticLesson = {
  id: 'fixture-fork',
  name: 'Forks (test lesson)',
  tagline: 'One piece attacks two things at once.',
  puzzleTheme: 'fork',
  intro: [
    {
      type: 'text',
      text: 'A fork is when one piece attacks two (or more) things at the same time. Your opponent can only fix one problem per move, so you win the other one.',
    },
    {
      type: 'board',
      fen: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1',
      caption: 'The white knight jumps to c7. It attacks the king on e8 and the rook on a8 at once.',
      arrows: [
        { from: 'b5', to: 'c7', color: 'green' },
        { from: 'c7', to: 'e8', color: 'red' },
        { from: 'c7', to: 'a8', color: 'red' },
      ],
      highlights: [{ square: 'c7', color: 'yellow' }],
    },
    {
      type: 'tip',
      text: 'How to spot it: look for a square where one of your pieces would attack two enemy pieces. A check plus a second target is the strongest kind.',
    },
    {
      type: 'text',
      text: 'Knights are the most famous forkers because they jump over other pieces and are easy to miss. But queens, bishops, rooks and even pawns can fork too.',
    },
    {
      type: 'board',
      fen: '4k3/8/8/3n1r2/8/8/4P3/4K3 w - - 0 1',
      caption: 'Even a pawn can fork! The pawn steps to e4 and attacks the knight on d5 and the rook on f5.',
      arrows: [
        { from: 'e2', to: 'e4', color: 'green' },
        { from: 'e4', to: 'd5', color: 'red' },
        { from: 'e4', to: 'f5', color: 'red' },
      ],
    },
    {
      type: 'tip',
      text: 'Protect yourself: before each move, ask "can an enemy piece land on a square that hits two of my pieces?"',
    },
  ],
  examples: [
    {
      title: 'The royal fork',
      fen: 'r3k2r/pp3ppp/2n1pb2/1q6/2Np4/P2P4/1P3PPP/R1BQ1RK1 w kq - 5 18',
      moves: ['c4d6', 'e8d7', 'd6b5'],
      explanations: [
        'The knight jumps to d6. It gives check to the king on e8 and attacks the queen on b5 at the same time. That is a fork.',
        'Black has to save the king, so the king steps to d7. The queen is left alone.',
        'The knight takes the queen. White has won the strongest piece on the board.',
      ],
    },
    {
      title: 'A fork from Black',
      fen: 'r2q1rkn/1pp1bppp/p2p4/5P2/5Pn1/1BN3R1/PPP3PP/R1BQ3K b - - 4 14',
      moves: ['g4f2', 'h1g1', 'f2d1', 'c3d1'],
      explanations: [
        'The black knight jumps to f2. It checks the king on h1 and attacks the queen on d1 at the same time.',
        'White has to answer the check, so the king steps to g1.',
        'The knight takes the queen on d1.',
        'White takes the knight back, but Black has traded a knight (worth about 3) for a queen (worth about 9). A great deal.',
      ],
    },
  ],
  exercises: [
    {
      id: 'fixture-fork-1',
      fen: 'r3k2r/pp3ppp/2n1pb2/1q6/2Np4/P2P4/1P3PPP/R1BQ1RK1 w kq - 5 18',
      solution: ['c4d6'],
      hint: 'Your knight can give check and attack a second big piece at the same time.',
      explanation: 'Nd6+ attacks the king and the queen on b5 together. The king has to move, and then the knight takes the queen.',
      difficulty: 1,
    },
    {
      id: 'fixture-fork-2',
      fen: 'r1b2rk1/ppp2pp1/2n1p3/4P3/3P4/2n3Q1/P4PPP/R1B2RK1 b - - 1 15',
      solution: ['c3e2', 'g1h1', 'e2g3'],
      hint: 'Your knight on c3 can jump to a square that checks the king and hits the queen.',
      explanation: 'Ne2+ forks the king on g1 and the queen on g3. White must move the king, and then the knight takes the queen.',
      difficulty: 1,
    },
    {
      id: 'fixture-fork-3',
      fen: '2k4r/1p3qpp/p1n5/5b2/2P1N3/1P2P3/P6K/R1BB4 w - - 1 23',
      solution: ['e4d6', 'c8c7', 'd6f7'],
      hint: 'Look for a check from your knight that also attacks the black queen.',
      explanation: 'Nd6+ checks the king and attacks the queen on f7 (and the bishop on f5 too). After the king moves, the knight takes the queen.',
      difficulty: 2,
    },
    {
      id: 'fixture-fork-4',
      fen: 'r3k2r/p1pq1p2/2pb1n1p/3p4/6Np/2N1P3/PPPP2PP/R1B1K2R w KQkq - 0 14',
      solution: ['g4f6', 'e8d8'],
      hint: 'Your knight can take a piece with check. What does it attack from there?',
      explanation: 'Nxf6+ takes a knight with check and also attacks the queen on d7. After the king moves, Nxd7 wins the queen.',
      difficulty: 2,
    },
    {
      id: 'fixture-fork-5',
      fen: 'q3k2r/4bppp/5n2/1N6/2p5/3p3P/1P1Q1PP1/4KB1R w Kk - 0 18',
      solution: ['b5c7'],
      explanation: 'Nc7+ forks the king on e8 and the queen on a8. The king has to move, and then the knight takes the queen.',
      difficulty: 2,
    },
  ],
}
