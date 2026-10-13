import type { TacticLesson } from '../../types'

// Discovered attacks (including discovered check and double check).
// Exercise positions come from real Lichess puzzles (CC0); every line was checked with Stockfish.
export const discoveredAttackLesson: TacticLesson = {
  id: 'discovered-attack',
  name: 'Discovered attacks',
  tagline: 'Move one piece and unleash another: two threats with a single move.',
  puzzleTheme: 'discoveredAttack',
  intro: [
    {
      type: 'text',
      text: 'A **discovered attack** happens when you move one piece out of the way and uncover an attack from a piece standing behind it. Now your opponent faces two threats at once: one from the piece that moved and one from the piece you uncovered. The piece behind is a bishop, rook or queen, because they attack along long lines.',
    },
    {
      type: 'board',
      fen: '4k3/8/8/4N3/8/8/8/4R1K1 w - - 0 1',
      arrows: [
        { from: 'e1', to: 'e8', color: 'red' },
        { from: 'e5', to: 'c6', color: 'blue' },
      ],
      highlights: [{ square: 'e5', color: 'yellow' }],
      caption:
        'The rook on e1 is aimed at the black king, but White’s own knight is in the way. If the knight jumps away (for example to c6), the rook gives check. That is a discovered check.',
    },
    {
      type: 'tip',
      text: '**Give the moving piece a job too:** capture something, give check, or attack the queen. Then your opponent can’t answer both threats. A discovered check is the strongest kind, because your opponent must deal with the check first.',
    },
    {
      type: 'board',
      fen: '8/8/6k1/1q6/5N2/6P1/7P/4KB2 b - - 1 1',
      arrows: [
        { from: 'd3', to: 'f4', color: 'blue' },
        { from: 'f4', to: 'g6', color: 'red' },
        { from: 'f1', to: 'b5', color: 'red' },
      ],
      caption:
        'White’s knight on d3 was blocking the bishop on f1. Nf4+ gives check and uncovers an attack on the black queen on b5. Black must answer the check, so White wins the queen.',
    },
    {
      type: 'board',
      fen: 'r1b3k1/pp1p1ppp/8/8/8/2nq2P1/P2B1PBP/R2Q1K1R w - - 7 21',
      arrows: [
        { from: 'e2', to: 'c3', color: 'blue' },
        { from: 'd3', to: 'f1', color: 'red' },
        { from: 'c3', to: 'd1', color: 'red' },
      ],
      orientation: 'black',
      caption:
        'A discovered check in a real game. Black’s knight on e2 was blocking its own queen on d3. Nc3+ uncovers a check from the queen and attacks White’s queen on d1.',
    },
    {
      type: 'text',
      text: 'You can fall for discovered attacks too. Watch for a line from an enemy bishop, rook or queen to your king or queen with just one piece in between, even if that piece belongs to your opponent. Move your king or queen off the line before the piece in between jumps away.',
    },
    {
      type: 'board',
      fen: '6k1/3q1ppp/8/3N4/8/8/5PPP/3R2K1 b - - 0 1',
      arrows: [
        { from: 'd1', to: 'd7', color: 'red' },
        { from: 'd5', to: 'f6', color: 'blue' },
      ],
      orientation: 'black',
      caption:
        'Black to move: the queen and White’s rook face each other on the d-file, with only White’s knight between them. White threatens Nf6+, and after ...gxf6 the rook takes the queen. Black should move the queen off the d-file, for example to e6.',
    },
  ],
  examples: [
    {
      title: 'A discovered check wins the queen',
      fen: '4k3/p4p1p/2q5/4N3/8/8/PP3PPP/4R1K1 w - - 0 1',
      moves: ['e5c6', 'e8d7', 'c6e5'],
      explanations: [
        'The knight takes the queen. By leaving the e-file it uncovers a check from the rook on e1. That is a discovered check.',
        'Black must deal with the check first, so the knight can’t be taken back right now. The king steps to d7 and now attacks the knight.',
        'The knight jumps to safety with another check, protected by the rook. White is a whole queen up.',
      ],
    },
    {
      title: 'A discovered check from a bishop',
      fen: '8/pR4p1/2R3k1/3pb1p1/5r2/P1P3K1/1P6/8 b - - 0 43',
      orientation: 'black',
      moves: ['f4f6', 'g3g2', 'f6c6'],
      explanations: [
        'The black rook steps off the diagonal of the bishop on e5. That uncovers a check on the king on g3, and the rook also attacks White’s rook on c6.',
        'White must answer the check. The king goes to g2, so there is no time to save the rook.',
        'Black takes the rook. White could not meet both threats.',
      ],
    },
    {
      title: 'Double check',
      fen: '5r2/p3N1pk/bbRp3p/1p1B4/1P2P3/P7/5nPP/5RK1 b - - 1 26',
      orientation: 'black',
      moves: ['f2h3', 'g1h1', 'f8f1'],
      explanations: [
        'This is a double check. The knight checks the king on g1, and by leaving f2 it opens the diagonal for the bishop on b6, which checks too.',
        'You can’t block or capture two checks at once, so the king has to move. Its only square is h1.',
        'The rook takes the rook, and it is checkmate. The king has nowhere to go.',
      ],
    },
    {
      title: 'A trap in the opening',
      fen: 'rnbqkb1r/ppp2ppp/5n2/4N3/2p5/8/PPPPQPPP/RNB1K2R w KQkq - 0 7',
      moves: ['e5c6', 'd8e7', 'c6e7'],
      explanations: [
        'The knight leaves the e-file, so White’s queen on e2 gives check to the king on e8. The knight also attacks the black queen on d8.',
        'Black has to stop the check. Blocking with the queen on e7 is one try.',
        'The knight takes the queen. After ...Bxe7, White has won a queen for a knight.',
      ],
    },
  ],
  exercises: [
    {
      id: 'discovered-attack-1',
      fen: '6k1/5pb1/p2rp2p/1p4p1/2p5/P1PB4/1P3P2/3RK3 w - - 0 32',
      solution: ['d3h7', 'g8h7', 'd1d6'],
      hint: 'Your bishop is blocking your rook. What if the bishop moves with check?',
      explanation:
        'Bh7+ gives check, so Black has to answer it. The bishop has also opened the d-file, so the rook on d1 attacks the black rook on d6. If the king takes the bishop, Rxd6 wins a rook for a bishop.',
      difficulty: 1,
    },
    {
      id: 'discovered-attack-2',
      fen: '3r2k1/p1pN1pp1/4p1bp/P7/2n5/P5P1/5PBP/3R2K1 w - - 4 26',
      solution: ['d7f6', 'g7f6', 'd1d8'],
      hint: 'Your knight stands between your rook and the black rook. A check from the knight would force Black to answer first.',
      explanation:
        'Nf6+ is check, and the knight leaves the d-file so the rook on d1 attacks the rook on d8. Black takes the knight, but Rxd8+ wins a whole rook with check.',
      difficulty: 1,
    },
    {
      id: 'discovered-attack-3',
      fen: 'r3k1r1/pp2bp1p/2p1pp2/1P6/P4Pb1/3P1B2/2P2P1P/R2Q1RK1 b q - 0 17',
      solution: ['g4f3'],
      hint: 'Your rook on g8 looks down the g-file, but your own bishop is in the way. Can the bishop move with a capture?',
      explanation:
        'Bxf3 takes the knight and moves off the g-file. That uncovers a check from the rook on g8, and the bishop on f3 covers the king’s escape squares. Nothing can block, so it is checkmate.',
      difficulty: 1,
    },
    {
      id: 'discovered-attack-4',
      fen: 'r3q1k1/pp3p1p/2p3p1/4n3/2PQ1N2/1P6/P4PPP/4R1K1 b - - 4 24',
      solution: ['e5f3', 'g2f3', 'e8e1'],
      hint: 'Your knight blocks the e-file. Is there a knight jump with check that opens the line for your queen?',
      explanation:
        'Nf3+ is check, and the knight leaves the e-file so your queen on e8 attacks the rook on e1. White takes the knight, but Qxe1+ wins the rook with check.',
      difficulty: 2,
    },
    {
      id: 'discovered-attack-5',
      fen: 'r1b1k2r/pp2pp2/1q1p2p1/4b3/2N1P2p/2P2PP1/PP2B1P1/RN1Q1R1K b kq - 0 15',
      solution: ['h4g3'],
      hint: 'Your h-pawn is blocking your rook. A pawn capture could open the file with check.',
      explanation:
        'The pawn takes on g3 and steps off the h-file, so the rook on h8 gives check. The king has no escape: g1 and h2 are covered, g2 is blocked by its own pawn, and nothing can block the check. It is checkmate.',
      difficulty: 2,
    },
    {
      id: 'discovered-attack-6',
      fen: '5r1k/3bq1p1/3n1bp1/1p2pP1N/p2pP3/Pn1P2BQ/1Pr3B1/3R1RK1 w - - 0 30',
      solution: ['h5f6'],
      hint: 'Your queen on h3 is aimed at the king, but your own knight is in the way. Look for a knight capture.',
      explanation:
        'Nxf6+ takes the bishop and uncovers a check from the queen on h3. The knight on f6 covers g8 and h7, so the king has no squares, and nothing can block. It is checkmate.',
      difficulty: 2,
    },
    {
      id: 'discovered-attack-7',
      fen: '2r3k1/Q1P3pp/3q4/3pr3/1Pb5/P1N2R1P/5PPK/2R5 b - - 0 35',
      solution: ['e5e1', 'f3g3', 'e1c1'],
      hint: 'Your rook on e5 blocks your queen’s diagonal to the king on h2. Where could the rook go to attack something?',
      explanation:
        'Re1+ moves the rook away with a discovered check from the queen on d6. The rook now attacks the rook on c1, but White must answer the check first. After White blocks, Rxc1 wins a rook.',
      difficulty: 2,
    },
    {
      id: 'discovered-attack-8',
      fen: '2k3r1/ppp5/3p4/3P1p1Q/2P2Pn1/2P2n2/P2BR2P/6RK b - - 0 29',
      solution: ['g4f2', 'e2f2', 'g8g1'],
      hint: 'Move a knight with check so that your rook on g8 attacks the rook on g1.',
      explanation:
        'Nf2+ is check, and the knight leaves the g-file so your rook attacks the rook on g1. If White takes the knight, Rxg1 is checkmate: the knight on f3 protects your rook and covers the king’s escape squares.',
      difficulty: 3,
    },
    {
      id: 'discovered-attack-9',
      fen: 'r3k2r/1p2bppp/pqn1pn2/1N1p4/3P2b1/1QN1P1P1/PP3PBP/R1B1K2R w KQkq - 0 12',
      solution: ['b5d6', 'e7d6', 'b3b6'],
      hint: 'Both queens are on the b-file with your knight between them. A knight move with check would uncover an attack.',
      explanation:
        'Nd6+ is check, so Black must answer it first. The knight has also uncovered your queen’s attack on the black queen on b6. After ...Bxd6, Qxb6 wins the queen for a knight.',
      difficulty: 3,
    },
    {
      id: 'discovered-attack-10',
      fen: 'r1b1k2r/ppppqppp/2n5/8/1P2n3/3B1N2/1PPN1PPP/R1BQK2R b KQkq - 0 9',
      solution: ['e4c3', 'd2e4', 'c3d1'],
      hint: 'Black’s queen is aimed at the king on e1, but the knight on e4 is in the way. Where can the knight jump to attack something big?',
      explanation:
        'Nc3+ uncovers a check from the queen on e7, and the knight attacks the white queen on d1 at the same time. White blocks the check with Ne4, and then Nxd1 wins the queen.',
      difficulty: 3,
    },
    {
      id: 'discovered-attack-11',
      fen: '5rk1/pp3Npp/2q5/3Q4/3P4/3n4/P6P/5R1K w - - 1 30',
      solution: ['f7h6', 'g8h8', 'f1f8'],
      hint: 'A double check can only be answered by moving the king. Look for a knight move that checks and also uncovers your queen.',
      explanation:
        'Nh6+ is a double check: the knight checks the king, and by leaving f7 it uncovers the queen’s check from d5. The king must move, and h8 is its only square. Then Rxf8 is checkmate.',
      difficulty: 3,
    },
  ],
}
