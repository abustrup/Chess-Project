import type { TacticLesson } from '../../types'

// Loose pieces & blunder checks. Exercise positions come from real Lichess puzzles (CC0); every line was checked with Stockfish.
export const loosePiecesLesson: TacticLesson = {
  id: 'loose-pieces',
  name: 'Loose pieces & blunder checks',
  tagline: 'Win the pieces your opponent leaves unprotected, and check your own before every move.',
  puzzleTheme: 'hangingPiece',
  intro: [
    {
      type: 'text',
      text: 'A **loose piece** is a piece that no other piece protects. If an enemy piece attacks it, its owner can lose it for nothing. Many games at club level are decided by one loose piece, so learn to see them for both sides.',
    },
    {
      type: 'board',
      fen: 'r3k2r/ppp2ppp/2n5/1B1n4/8/5N2/PPP2PPP/R2R2K1 w kq - 0 1',
      arrows: [
        { from: 'd1', to: 'd5', color: 'blue' },
        { from: 'b5', to: 'c6', color: 'red' },
      ],
      highlights: [{ square: 'd5', color: 'yellow' }],
      caption:
        'Two black knights are attacked. The knight on c6 is protected by a pawn, so taking it would only be a swap. The knight on d5 has no protector at all, so Rxd5 wins it for free.',
    },
    {
      type: 'tip',
      text: 'Before you capture, ask: "Is that piece protected?" If nothing protects it, it is free. If something does, count the attackers and the protectors first.',
    },
    {
      type: 'board',
      fen: '3r1rk1/ppp2ppp/3n4/2N1b3/2B5/2P3P1/PP3P1P/3RR1K1 b - - 4 17',
      orientation: 'black',
      arrows: [
        { from: 'd6', to: 'c4', color: 'blue' },
      ],
      highlights: [{ square: 'c4', color: 'yellow' }],
      caption:
        'Loose pieces hide in busy positions. The white bishop on c4 has no protector, and the knight on d6 attacks it. After Nxc4 Rxd8 Rxd8, Black is a clean piece ahead.',
    },
    {
      type: 'text',
      text: 'Now the other side: run a quick **blunder check** before every move. Ask yourself what your opponent\'s last move attacks, whether your move leaves a piece unprotected, and whether one move could hit two of your pieces. Do it every time, even when you are in a hurry.',
    },
    {
      type: 'board',
      fen: 'r1bqkbnr/p1pp1ppp/2n5/1p2p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
      arrows: [{ from: 'b5', to: 'c4', color: 'red' }],
      highlights: [
        { square: 'c4', color: 'yellow' },
        { square: 'b5', color: 'yellow' },
      ],
      caption:
        'Black has just played b5. The pawn attacks your bishop on c4, so a quiet developing move would lose a piece. First deal with the threat. Here the pawn on b5 is loose itself, so Bxb5 saves the bishop and wins a pawn.',
    },
    {
      type: 'tip',
      text: 'The habit that stops most blunders: after every opponent move, look at what changed. Which of my pieces are attacked now? Which of their pieces are unprotected now?',
    },
  ],
  examples: [
    {
      title: 'A loose knight that gives check',
      fen: 'r1b1kb1r/ppppqppp/8/1B6/4Q3/2Pn4/PP1P1PPP/RNB1K2R w KQkq - 1 8',
      moves: ['b5d3', 'e7e4', 'd3e4'],
      explanations: [
        "Black's knight on d3 gives check, but nothing protects it. The bishop simply takes it.",
        "Black's queen takes the white queen on e4, and it is check.",
        'The bishop that just took the knight now takes the black queen. The queens are off the board and White is a whole knight ahead.',
      ],
    },
    {
      title: 'A loose queen',
      fen: '6k1/1p3pbp/p5p1/8/Pqb5/1P3P2/N1r2BPP/1R4K1 w - - 0 28',
      moves: ['a2b4', 'c2f2', 'g1f2'],
      explanations: [
        "Black's queen on b4 has no protector, and the knight on a2 attacks it. The knight takes her.",
        'Black takes the bishop on f2 with the rook. It is the best Black has left, but it only wins a bishop.',
        'The king takes the rook. White has won a queen and a rook for a bishop.',
      ],
    },
    {
      title: 'A protector that cannot recapture',
      fen: 'rnb1k2r/5ppp/1q1bpn2/p2p4/P2p2P1/4PP2/1PQ1N2P/RNB1KB1R w KQkq - 0 11',
      moves: ['c2c8', 'e8e7', 'c8h8'],
      explanations: [
        'The bishop on c8 looks protected by the rook on a8, but the knight on b8 is in the way. So the bishop is really loose, and the queen takes it with check.',
        'The king steps out of check. Blocking with the queen on d8 is no better: White trades queens with Qxd8+ and has still won a whole bishop.',
        'Now the queen also takes the rook on h8. Black has lost a bishop and a rook, and White is winning.',
      ],
    },
    {
      title: 'Two pieces attacked? One move can save both',
      fen: 'r4rk1/1p2ppbp/pn4p1/4n3/P2q4/2N1BQ2/BP4PP/R4RK1 w - - 0 17',
      moves: ['f3f2', 'd4d6', 'a1d1'],
      explanations: [
        "White has two problems. The queen on f3 is attacked by the knight on e5, and the bishop on e3 is attacked by Black's queen. Only the queen protects that bishop, so the queen must keep that job when it moves. Qf2 saves the queen and keeps protecting the bishop.",
        'White\'s bishop on e3 attacks Black\'s queen, and nothing protects the queen, so it has to move. It cannot take the bishop either, because White\'s queen still guards it. Black\'s queen steps back.',
        'The rook comes to the d-file and attacks the black queen again. White keeps all of its pieces and gains time.',
      ],
    },
  ],
  exercises: [
    {
      id: 'loose-pieces-1',
      fen: 'r2qr1k1/1b3ppB/p1nb4/1p6/2pP4/5N1P/PP3PP1/R1BQR1K1 b - - 0 16',
      solution: ['g8h7'],
      hint: 'White has left a bishop next to your king with nothing to protect it. Is there any reason you cannot take it?',
      explanation:
        'The bishop on h7 has no protector, so the king can simply take it. White has no check or trick that punishes this, and you have won a whole bishop.',
      difficulty: 1,
    },
    {
      id: 'loose-pieces-2',
      fen: '3r3k/6b1/pp1r1n1p/3Np3/4B3/6P1/PP1R1P1P/3R2K1 w - - 3 32',
      solution: ['f2f3'],
      hint: 'Your bishop on e4 is attacked and has no protector. Which move protects it without breaking up your other pieces?',
      explanation:
        'The black knight attacks your bishop, and your knight on d5 is under pressure too. f3 protects the bishop with a pawn and keeps it guarding the knight. Moving the bishop away does not work: even on g2 or h1 it is cut off when Black pushes the pawn to e4, and then the knight on d5 falls.',
      difficulty: 1,
    },
    {
      id: 'loose-pieces-3',
      fen: '5rk1/p1p2ppp/1p3n2/5b2/1P1rN3/P2BKP2/2P3PP/R5R1 b - - 1 16',
      solution: ['d4d5'],
      hint: 'A king can capture any unprotected piece next to it. Your rook on d4 is next to the white king, so move it. Pick a square where it also looks after your bishop on f5.',
      explanation:
        'The white king attacks your unprotected rook on d4. Your bishop on f5 is loose too: if the knight on e4 moves away, the white bishop on d3 attacks it. Rd5 moves the rook to safety and protects the bishop along the fifth row. Rxe4+ looks tempting, but fxe4 just takes the rook.',
      difficulty: 1,
    },
    {
      id: 'loose-pieces-4',
      fen: 'r1b1k1nr/pppp1ppp/2N5/2b5/4P2q/8/PPP2PPP/RNBQKB1R w KQkq - 1 6',
      solution: ['c6d4'],
      hint: 'You have two problems at once: a knight under attack, and a threat against f2. Look for one move that solves both.',
      explanation:
        "Your knight is attacked by two pawns, and Black's queen and bishop are aiming at f2. Nd4 saves the knight and blocks the bishop's diagonal at the same time.",
      difficulty: 1,
    },
    {
      id: 'loose-pieces-5',
      fen: '3br3/1p3pkp/pnr3p1/n1B5/P3P1N1/2P2P2/4B1PP/1R1R2K1 b - - 0 26',
      solution: ['c6c5', 'd1d8', 'e8d8'],
      hint: 'One of White\'s bishops has no protector, and your rook can reach it.',
      explanation:
        'The bishop on c5 is not protected, so Rxc5 wins it. Then check your own pieces too. After Rxd8 Rxd8, your knight on b6 has lost its protectors, so White can take it with Rxb6. You answer Rxc3, and you are still clearly ahead with a rook against a bishop.',
      difficulty: 2,
    },
    {
      id: 'loose-pieces-6',
      fen: 'r1bqkbnr/pppn2pp/8/4Np2/2P5/2N5/PP2PPPP/R1BQKB1R b KQkq - 0 6',
      solution: ['d7e5', 'd1d8', 'e8d8'],
      hint: "White's knight on e5 is all alone. Which of your pieces can take it?",
      explanation:
        'The knight on e5 has no protector, so Nxe5 wins it. White can trade queens with Qxd8+, but Kxd8 recaptures and you keep the knight you won.',
      difficulty: 2,
    },
    {
      id: 'loose-pieces-7',
      fen: 'rnbqk2r/ppp2p1p/3p2p1/3Q4/3b4/3B4/PPP3PP/RN3R1K b kq - 1 12',
      solution: ['d4f6'],
      hint: 'Your bishop is attacked, and the f7 pawn is in danger too. Find a square for the bishop that helps with both.',
      explanation:
        'Your bishop on d4 is attacked by the queen, and the f7 pawn is under fire from the queen and the rook. Bf6 saves the bishop and also blocks the f-file, so the rook can no longer attack f7.',
      difficulty: 2,
    },
    {
      id: 'loose-pieces-8',
      fen: 'r2q1rk1/pp3ppp/2nQb3/4p3/8/BN3B2/P1P1nPPP/R4RK1 w - - 1 14',
      solution: ['f3e2', 'd8d6', 'a3d6'],
      hint: 'A black knight has wandered onto e2 with nothing to protect it. Take it, but think about what Black\'s queen can do next.',
      explanation:
        'The knight on e2 gives check, but it has no protector, so Bxe2 wins it. Black can trade queens with Qxd6, but Bxd6 takes back, and you keep the knight you won.',
      difficulty: 2,
    },
    {
      id: 'loose-pieces-9',
      fen: '1r2r3/p2kbpp1/2p4p/2N1n3/2Pp4/1P1P2P1/P2B1P1P/1R2RK2 b - - 0 21',
      solution: ['e7c5'],
      hint: "White's knight on c5 is giving check, and nothing protects it. Which of your pieces can take it?",
      explanation:
        'The knight on c5 gives check but has no protector, so Bxc5 wins it. Your knight on e5 is attacked by a rook, but taking with the bishop also opens the e-file, so your rook on e8 now protects the knight.',
      difficulty: 2,
    },
    {
      id: 'loose-pieces-10',
      fen: 'r2q1rk1/pp2bppp/5n2/2p1n3/3pP1b1/P4N2/1BPNBPPP/R2Q1RK1 w - - 0 12',
      solution: ['f3e5', 'g4e2', 'd1e2'],
      hint: 'Black has a knight with no protector. Before you take it, check what Black\'s bishop on g4 can do afterwards.',
      explanation:
        "The knight on e5 is not protected, so Nxe5 wins it. Black's bishop can take your bishop on e2, but Qxe2 takes it back, and you keep the knight you won.",
      difficulty: 3,
    },
    {
      id: 'loose-pieces-11',
      fen: 'r3kb1r/pp1bpppp/2np1n2/qB1N4/4P3/8/PPPB1PPP/R2QK1NR b KQkq - 7 8',
      solution: ['a5d8'],
      hint: 'Your queen is attacked. Before you grab the bishop on b5, ask what the white knight on d5 could do.',
      explanation:
        'Your queen is attacked by the bishop on d2. Qxb5 looks like it wins a bishop, but Nc7+ forks your king and queen and wins her. Qd8 simply retreats to a safe square.',
      difficulty: 3,
    },
    {
      id: 'loose-pieces-12',
      fen: 'r4rk1/pp3pb1/q4npp/4n3/2NNp2P/2P1B3/PP2QPP1/1K1R3R w - - 2 19',
      solution: ['c4e5', 'a6e2', 'd4e2'],
      hint: "Black's knight on e5 has no protector. Check what your move opens up for Black's queen.",
      explanation:
        "The knight on e5 has no protector, so Nxe5 wins it. Moving your knight opens the diagonal for Black's queen, but Qxe2 is met by Nxe2, so the queens are traded and you are a knight ahead.",
      difficulty: 3,
    },
  ],
}
