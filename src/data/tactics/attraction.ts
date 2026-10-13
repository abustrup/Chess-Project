import type { TacticLesson } from '../../types'

// Decoys & attraction. Exercise positions come from real Lichess puzzles (CC0); every line was checked with Stockfish.
export const attractionLesson: TacticLesson = {
  id: 'attraction',
  name: 'Decoys & attraction',
  tagline: 'Sacrifice a piece to lure an enemy piece, often the king, onto a square where it can be punished.',
  puzzleTheme: 'attraction',
  intro: [
    {
      type: 'text',
      text: '**Attraction** (also called a **decoy**) means luring an enemy piece onto a bad square, usually with a sacrifice. The piece is often the king, which has to capture because it is in check. Once it stands on the new square, you finish it with a checkmate, a fork or a new queen.',
    },
    {
      type: 'board',
      fen: 'r4r1k/ppp3pp/8/8/8/1B6/PP5R/3Q3K w - - 0 1',
      arrows: [
        { from: 'h2', to: 'h7', color: 'blue' },
        { from: 'd1', to: 'h5', color: 'red' },
      ],
      highlights: [{ square: 'h7', color: 'yellow' }],
      caption:
        'Rxh7+ is a rook sacrifice. The king has to take it, and now it stands on h7. Qh5 is checkmate: the bishop on b3 covers g8, and the queen covers the squares in front of the king.',
    },
    {
      type: 'tip',
      text: 'How to spot it: ask yourself, "If that piece stood on this square, what could I do to it?" Look for squares where the king or queen would be exposed to a mate, a fork or a pawn promotion. Decoys often start with a check or a capture, so the enemy piece has no choice.',
    },
    {
      type: 'board',
      fen: 'r2kr3/pppp2p1/5p2/8/8/5N1Q/PPP2PPP/4R1K1 w - - 0 1',
      arrows: [
        { from: 'e1', to: 'e8', color: 'blue' },
        { from: 'h3', to: 'h8', color: 'red' },
      ],
      highlights: [
        { square: 'e8', color: 'yellow' },
        { square: 'a8', color: 'red' },
      ],
      caption:
        'Here the king is lured onto e8. After Rxe8+ Kxe8, the queen goes to h8 with check. The rook on a8 now stands behind the king on the same row. The king has to step off the row, so Qxa8 wins the rook.',
    },
    {
      type: 'board',
      fen: 'k3rb1r/ppB1p1p1/8/3P3p/2PQn1p1/8/4qPPP/5R1K w - - 3 27',
      arrows: [
        { from: 'd4', to: 'a7', color: 'blue' },
        { from: 'f1', to: 'a1', color: 'red' },
      ],
      highlights: [{ square: 'a7', color: 'yellow' }],
      caption:
        'Real games are messier, but the idea is the same. Qxa7+ drags the king onto a7, and then Ra1+ forces Black to block with the queen, and Rxa2 is mate.',
    },
    {
      type: 'text',
      text: 'How to protect yourself: before you capture an offered piece, look at the square your piece will land on. Ask, "What can my opponent do to it there?" If you can see a mate or a fork waiting, answer the check in another way or leave the gift alone.',
    },
    {
      type: 'tip',
      text: 'Lure squares to remember: h7 and h2 next to a castled king, f7 and f2 early in the game, and the back row.',
    },
  ],
  examples: [
    {
      title: 'A rook sacrifice pulls the king forward',
      fen: '1k5r/ppp2pp1/5q1p/2b5/4N2r/3B1P2/PPP3PP/R2Q1R1K b - - 6 17',
      moves: ['h4h2', 'h1h2', 'f6h4'],
      explanations: [
        'The rook takes the pawn on h2 and gives check. It looks like Black is just giving a rook away.',
        'The king has no other move, because the bishop on c5 covers g1. It takes the rook and now stands on h2.',
        "The queen jumps to h4 with check. The bishop covers g1, the queen covers g3, h3 and h1 behind the king, and White's own pawn blocks g2. It is checkmate.",
      ],
    },
    {
      title: 'A queen sacrifice and a back-row mate',
      fen: 'r1b1Qbk1/pp3ppp/8/2n2q2/8/2P5/PP4PP/2KRR3 w - - 4 23',
      moves: ['e8f8', 'g8f8', 'd1d8'],
      explanations: [
        'The queen takes the bishop on f8 with check. Nothing protects her, so it is a real sacrifice.',
        'The king has to take the queen, because it has no other move and the rook on a8 is blocked by its own bishop. Now the king stands on f8, on the back row.',
        "The rook goes to d8 with check. The rook on e1 covers e7, the king's own pawns block f7 and g7, and nothing can take the rook. Checkmate.",
      ],
    },
    {
      title: 'Lure the king, then fork the king and a rook',
      fen: 'rn1qkbnr/4pb1p/pp4p1/2p5/2B5/P2P4/1PP2PPP/RNBQK2R w KQkq - 0 9',
      moves: ['c4f7', 'e8f7', 'd1f3', 'g8f6', 'f3a8'],
      explanations: [
        'The bishop takes the bishop on f7 with check. White is offering a bishop to pull the king forward.',
        'The king takes the bishop and now stands on f7. That is exactly where the queen wants it.',
        'The queen checks the king along the f-file, and she also attacks the rook on a8 along the long diagonal. That is a fork.',
        'Black blocks the check with the knight, but the rook on a8 is still attacked.',
        'The queen takes the rook. The knight on b8 is in the way, so nothing can take her back. White has won a rook.',
      ],
    },
    {
      title: 'Two rooks are sacrificed to drag the king',
      fen: '4rrk1/p3n1p1/1p2P1Qq/3p1R2/3b4/8/P5PP/5R1K w - - 0 25',
      moves: ['f5f8', 'e8f8', 'f1f8', 'g8f8', 'g6f7'],
      explanations: [
        'The rook takes on f8 with check. Black has to recapture.',
        'Black takes with the other rook.',
        'The second white rook takes on f8 with check as well.',
        'The king has to capture. It has been dragged to f8, where it has no air.',
        "The queen jumps to f7 with check. The pawn on e6 protects her, and Black's own knight and pawn block e7 and g7. Checkmate.",
      ],
    },
  ],
  exercises: [
    {
      id: 'attraction-1',
      fen: '1r4k1/2p2pb1/3p2pp/5b2/R1B2P2/7P/1pP3P1/1K2B1NR b - - 0 28',
      solution: ['f5c2', 'b1c2', 'b2b1q'],
      hint: 'Your pawn on b2 is one step from queening, but the white king stands in its way. Can you pull the king away with a check?',
      explanation:
        'Bxc2+ is check, so the king takes the bishop (stepping to a2 loses even faster). Now b1 is free, and b1=Q+ queens with check. You lured the king off the square your pawn needed.',
      difficulty: 1,
    },
    {
      id: 'attraction-2',
      fen: 'r1b3k1/pp3rP1/4pp1p/3pn3/6R1/1PPB4/P2N1PP1/R3K3 w Q - 0 25',
      solution: ['d3h7', 'g8h7', 'g7g8q'],
      hint: 'Your pawn on g7 cannot queen, because the black king stands on g8. Can a sacrifice pull the king away?',
      explanation:
        'Bh7+ forces Kxh7: the king cannot take your pawn on g7 because the rook on g4 protects it, and the pawn covers f8 and h8. The king has left g8, so g8=Q is checkmate. Your rook on g4 protects the new queen.',
      difficulty: 1,
    },
    {
      id: 'attraction-3',
      fen: '7k/1p4pp/p4r1r/3Np3/1PPb1p2/5P2/P1Q3PP/3R1R1K b - - 2 25',
      solution: ['h6h2', 'h1h2', 'f6h6'],
      hint: "White's king is boxed in on h1. A rook sacrifice next to it pulls the king forward, and your other rook is ready to follow up.",
      explanation:
        'Rxh2+ forces the king to take, and now it stands on h2. Rh6 is checkmate: the bishop covers g1, the pawn on f4 covers g3, and the rook covers the h-file.',
      difficulty: 1,
    },
    {
      id: 'attraction-4',
      fen: 'r4r1k/pp5p/6p1/3NnpP1/3Q1P1P/1P6/P1q2R1K/R7 b - - 2 25',
      solution: ['c2f2', 'd4f2', 'e5g4', 'h2g3', 'g4f2'],
      hint: "Your queen can take something on f2 with check. White's queen has to take her, and then a knight check is waiting.",
      explanation:
        'Qxf2+ takes a rook with check, and White\'s best is to take back with the queen. That drags her onto f2, where Ng4+ forks her and the king. Nxf2 wins the queen back. Even if the king then takes your knight, you have won a rook for a knight.',
      difficulty: 2,
    },
    {
      id: 'attraction-5',
      fen: 'r2kr3/ppp2pp1/5p2/3q4/8/3B1N1Q/PbP2PPP/3KR3 w - - 6 20',
      solution: ['e1e8', 'd8e8', 'h3h8', 'e8d7', 'h8a8'],
      hint: 'The black king and its rook on a8 are on the same row. A rook trade can pull the king onto a square where your queen checks it and wins the rook behind it.',
      explanation:
        'Rxe8+ forces Kxe8, which drags the king onto the same row as its rook on a8. Qh8+ then checks the king, and the rook stands behind it on the same row. The king has to step off the row, and Qxa8 wins the rook.',
      difficulty: 2,
    },
    {
      id: 'attraction-6',
      fen: 'r3q1rk/1ppn1p1p/p2p1Pp1/3P4/5R2/7Q/PPP3PP/5RK1 w - - 5 21',
      solution: ['h3h7', 'h8h7', 'f4h4'],
      hint: 'A queen sacrifice next to the king pulls it forward. Your rook on f4 is ready to swing over.',
      explanation:
        "Qxh7+ forces Kxh7. Rh4 is then checkmate: the pawn on f6 covers g7, Black's own rook and pawn block g8 and g6, and the rook covers the h-file.",
      difficulty: 2,
    },
    {
      id: 'attraction-7',
      fen: '2knR3/ppp2rpp/3b4/5q2/3p4/7P/PPP1QPP1/4R1K1 w - - 4 19',
      solution: ['e8d8', 'c8d8', 'e2e8'],
      hint: 'A rook sacrifice can drag the king into the open. Your queen and your other rook are lined up on the e-file.',
      explanation:
        "Rxd8+ forces Kxd8. Qe8 is then checkmate: the rook on e1 protects the queen, the pawn on c7 blocks the king, and the queen covers d7 and c8.",
      difficulty: 2,
    },
    {
      id: 'attraction-8',
      fen: '6k1/1q2bppp/p3p3/Qp2P3/5BP1/Pr3bKP/4B3/3R4 w - - 0 32',
      solution: ['d1d8', 'e7f8', 'd8f8', 'g8f8', 'a5d8'],
      hint: 'Start with a check on the back row. Then take the piece that has to block.',
      explanation:
        'Rd8+ forces the bishop to block on f8 (taking the rook with Bxd8 allows Qxd8 mate at once). Rxf8+ takes the blocker, and the king has to recapture. Now the king stands on f8 and Qd8 is checkmate.',
      difficulty: 3,
    },
    {
      id: 'attraction-9',
      fen: '3r3r/1kp3p1/pP2p3/4p1p1/2N5/B1n5/5PPP/R4RK1 b - - 0 22',
      solution: ['c3e2', 'g1h1', 'h8h2', 'h1h2', 'd8h8'],
      hint: 'A knight check pushes the king into the corner. Then a rook sacrifice next to it pulls the king out again.',
      explanation:
        'Ne2+ forces the king to h1. Rxh2+ drags it onto h2, and Rh8 is checkmate: the knight on e2 covers g1 and g3, and the rook covers the h-file.',
      difficulty: 3,
    },
    {
      id: 'attraction-10',
      fen: '1r2k2r/5pQp/pq2b3/8/8/P4P2/1pP3PP/1K1R1B1R b k - 0 20',
      solution: ['e6a2', 'b1a2', 'b2b1q', 'd1b1', 'b6b1'],
      hint: 'Your pawn on b2 is ready to queen, but the white king is in its way. Can you pull the king off b1 with a check?',
      explanation:
        'Ba2+ forces Kxa2, so the king leaves b1. Then b1=Q+ queens with check, and White has to take with Rxb1. Qxb1 is checkmate, because your rook on b8 protects the queen.',
      difficulty: 3,
    },
    {
      id: 'attraction-11',
      fen: 'r1b1r1k1/ppp1npp1/4Pn1p/8/2P5/B2q1N2/P4PPP/R3QRK1 w - - 0 16',
      solution: ['e6f7', 'g8f7', 'f3e5', 'f7g8', 'e5d3'],
      hint: 'The black queen on d3 is far from its king. A pawn sacrifice could pull the king onto a square where one knight attacks both.',
      explanation:
        'exf7+ is a pawn sacrifice with check, and Black\'s best reply is to take it with the king. Now the king stands on f7, where Ne5+ gives check and also attacks the queen on d3. After the king moves, Nxd3 wins the queen.',
      difficulty: 3,
    },
    {
      id: 'attraction-12',
      fen: 'rnbq1rk1/pp3pp1/2p5/6b1/3PB3/4P3/PPQ2PP1/R3K1NR w KQ - 0 13',
      solution: ['e4h7', 'g8h8', 'h7g8', 'h8g8', 'c2h7'],
      hint: 'Two sacrifices in a row. First send the king to the corner, then drag it back out so your queen can mate.',
      explanation:
        'Bh7+ forces Kh8, because the queen protects the bishop. Bg8+ uncovers a check from the rook on h1. The king takes the bishop (blocking the h-file with a bishop does not help: Qh7 is mate anyway). Then Qh7 is checkmate, because the rook on h1 protects her.',
      difficulty: 3,
    },
  ],
}
