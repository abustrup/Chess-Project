import type { OpeningCourse } from '../../types'

// Slav Defence course (you play Black). Pure data: the PGN strings are the lessons.
// You answer 1.d4 with 1...c6 and then ...d5 (the Slav is 1.d4 c6 2.c4 d5). Narrowed on 2026-10-16 (task O1):
// lines end by about move 8, one taught move per position. Reading guide for the PGN: the FIRST move at each
// of your turns is the one to learn; at White's turns every move listed is a reply we prepared for.

const slavEcoNames = [
  "Queen's Gambit Declined: Cambridge Springs Defense",
  "Queen's Gambit Declined: Cambridge Springs Defense, Argentine Variation",
  "Queen's Gambit Declined: Cambridge Springs Defense, Bogoljubow Variation",
  "Queen's Gambit Declined: Cambridge Springs Defense, Capablanca Variation",
  "Queen's Gambit Declined: Cambridge Springs Defense, Rubinstein Variation",
  "Queen's Gambit Declined: Cambridge Springs Defense, Yugoslav Variation",
  "Queen's Gambit Declined: Semi-Slav, Abrahams Variation",
  "Queen's Gambit Declined: Semi-Slav, Junge Variation",
  "Queen's Gambit Declined: Semi-Slav, Koomen Variation",
  'Semi-Slav Defense',
  'Semi-Slav Defense Accepted',
  'Semi-Slav Defense: Accelerated Meran Variation',
  'Semi-Slav Defense: Accelerated Move Order',
  'Semi-Slav Defense: Anti-Moscow Gambit',
  'Semi-Slav Defense: Anti-Noteboom, Stonewall Variation',
  'Semi-Slav Defense: Anti-Noteboom, Stonewall Variation, Portisch Gambit',
  'Semi-Slav Defense: Bogoljubow Variation',
  'Semi-Slav Defense: Botvinnik Variation',
  'Semi-Slav Defense: Botvinnik Variation, Alatortsev System',
  'Semi-Slav Defense: Botvinnik Variation, Ekstrom Variation',
  'Semi-Slav Defense: Botvinnik Variation, Lilienthal Variation',
  'Semi-Slav Defense: Botvinnik Variation, Szabo Variation',
  'Semi-Slav Defense: Chigorin Defense',
  'Semi-Slav Defense: Gunderam Gambit',
  'Semi-Slav Defense: Hastings Variation',
  'Semi-Slav Defense: Main Line',
  'Semi-Slav Defense: Marshall Gambit',
  'Semi-Slav Defense: Marshall Gambit, Forgotten Variation',
  'Semi-Slav Defense: Marshall Gambit, Main Line',
  'Semi-Slav Defense: Marshall Gambit, Tolush Variation',
  'Semi-Slav Defense: Meran Variation',
  'Semi-Slav Defense: Meran Variation, Blumenfeld Variation',
  'Semi-Slav Defense: Meran Variation, Lundin Variation',
  'Semi-Slav Defense: Meran Variation, Old Variation',
  'Semi-Slav Defense: Meran Variation, Pirc Variation',
  'Semi-Slav Defense: Meran Variation, Rabinovich Variation',
  'Semi-Slav Defense: Meran Variation, Rellstab Attack',
  "Semi-Slav Defense: Meran Variation, Reynolds' Variation",
  'Semi-Slav Defense: Meran Variation, Sozin Variation',
  'Semi-Slav Defense: Meran Variation, Stahlberg Variation',
  'Semi-Slav Defense: Meran Variation, Wade Variation',
  'Semi-Slav Defense: Meran Variation, Wade Variation, Kaidanov Gambit',
  'Semi-Slav Defense: Meran Variation, Wade Variation, Larsen Variation',
  'Semi-Slav Defense: Moscow Variation',
  'Semi-Slav Defense: Normal Variation',
  'Semi-Slav Defense: Noteboom Variation',
  'Semi-Slav Defense: Noteboom Variation, Abrahams Variation',
  'Semi-Slav Defense: Noteboom Variation, Anti-Noteboom Gambit',
  'Semi-Slav Defense: Noteboom Variation, Anti-Noteboom Variation',
  'Semi-Slav Defense: Noteboom Variation, Anti-Noteboom Variation, Belyavsky Line',
  'Semi-Slav Defense: Quiet Variation',
  'Semi-Slav Defense: Romih Variation',
  'Semi-Slav Defense: Rubinstein System',
  'Semi-Slav Defense: Semi-Meran Variation',
  'Semi-Slav Defense: Stoltz Variation',
  'Semi-Slav Defense: Stoltz Variation, Center Variation',
  'Semi-Slav Defense: Stoltz Variation, Center Variation, Mikhalchishin Line',
  'Semi-Slav Defense: Stoltz Variation, Shabalov Attack',
  'Semi-Slav Defense: Stonewall Defense',
  'Slav Defense',
  'Slav Defense: Alapin Variation',
  'Slav Defense: Alekhine Variation',
  'Slav Defense: Bonet Gambit',
  'Slav Defense: Breyer Variation',
  'Slav Defense: Chebanenko Variation',
  'Slav Defense: Chebanenko Variation, Advance System',
  'Slav Defense: Czech Variation',
  'Slav Defense: Czech Variation, Bled Attack',
  'Slav Defense: Czech Variation, Carlsbad Variation',
  'Slav Defense: Czech Variation, Carlsbad Variation, Morozevich Variation',
  'Slav Defense: Czech Variation, Classical System',
  'Slav Defense: Czech Variation, Classical System, Main Line',
  'Slav Defense: Czech Variation, Dutch Variation',
  'Slav Defense: Czech Variation, Dutch Variation, Sämisch Variation',
  'Slav Defense: Czech Variation, Krause Attack',
  'Slav Defense: Czech Variation, Krause Attack, Fazekas Gambit',
  'Slav Defense: Czech Variation, Lasker Variation',
  'Slav Defense: Czech Variation, Wiesbaden Variation',
  'Slav Defense: Czech Variation, Wiesbaden Variation, Sharp Line',
  'Slav Defense: Diemer Gambit',
  'Slav Defense: Exchange Variation',
  'Slav Defense: Exchange Variation, Boor Attack',
  'Slav Defense: Exchange Variation, Schallopp Variation',
  'Slav Defense: Exchange Variation, Symmetrical Line',
  'Slav Defense: Exchange Variation, Trifunovic Variation',
  'Slav Defense: Geller Gambit',
  'Slav Defense: Modern Line',
  'Slav Defense: Quiet Variation',
  'Slav Defense: Quiet Variation, Amsterdam Variation',
  'Slav Defense: Quiet Variation, Landau Variation',
  'Slav Defense: Quiet Variation, Pin Defense',
  'Slav Defense: Quiet Variation, Schallopp Defense',
  'Slav Defense: Schlechter Variation',
  'Slav Defense: Slav Gambit, Alekhine Attack',
  'Slav Defense: Smyslov Variation',
  'Slav Defense: Soultanbeieff Variation',
  'Slav Defense: Steiner Variation',
  'Slav Defense: Süchting Variation',
  'Slav Defense: Three Knights Variation',
  'Slav Defense: Two Knights Attack',
  'Slav Defense: Winawer Countergambit',
  'Slav Defense: Winawer Countergambit, Anti-Winawer Gambit',
]

export const slavCourse: OpeningCourse = {
  id: 'slav',
  name: 'Slav Defence',
  side: 'black',
  tagline: 'Bishop out first, then build the pawn wall. Rock-solid against 1.d4.',
  signatureMoves: ['d4', 'c6', 'c4', 'd5'],
  ecoNames: slavEcoNames,
  overview: [
    "You answer 1.d4 with 1...c6 and follow up with ...d5, the same pawn pair as in your Caro-Kann. When White plays c4, this is the Slav Defence (1.d4 c6 2.c4 d5, more often reached by 1.d4 d5 2.c4 c6). White's c-pawn attacks d5, and you simply protect it with your c-pawn. It looks quiet, but it is one of the most solid answers to 1.d4. Players at every level use it, from beginners to the best players in the world.",
    "It is a great choice for you because the same few ideas come back in almost every line. You do not need to memorise a long list of moves. If you understand the plan and the typical mistakes, you can find good moves even when the opponent leaves the book.",
    "The plan in three sentences: Play ...c6 and ...d5. Bring your light-squared bishop out to f5 or g4 BEFORE you close the pawn chain with ...e6. Then develop your knights, castle, and open the centre with ...c5 or ...e5 when your pieces are ready.",
    "The middlegame is calm and solid. Your king is very safe, you have few weak pawns, and White often has a little more space. You do not need to attack. Trade pieces when you can, wait for White to make a mistake, and strike in the centre when the time is right.",
    "Be careful about three things. First, your b7-pawn is loose once the bishop leaves c8, especially when White's queen goes to b3. Second, White's knights love to jump to h4 and e5 to hit your bishop. Third, do not play ...e6 too early, or your bishop will be locked in. Do not worry that the computer sometimes says White is slightly better: that is normal in the Slav, and it is easy to hold.",
  ],
  keyIdeas: [
    {
      title: 'The Slav triangle: c6, d5, e6',
      text: 'Your pawns on c6, d5 and e6 form a triangle in the middle of the board. It is a very solid wall that is hard for White to break. The price is that the e6-pawn can lock in your light-squared bishop, so you bring that bishop out first (see the next card).',
      fen: 'rn1qkb1r/pp3ppp/2p1pn2/3p1b2/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 6',
      highlights: [
        { square: 'c6', color: 'green' },
        { square: 'd5', color: 'green' },
        { square: 'e6', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'Bishop out first, pawn wall second',
      text: 'In many other defences the light-squared bishop stays locked behind the e6-pawn for half the game. In the Slav you bring it to f5 (or g4) first and play ...e6 only afterwards. This one habit is the secret of the whole opening.',
      fen: 'rn1qkb1r/pp2pppp/2p2n2/3p1b2/2PP4/4PN2/PP3PPP/RNBQKB1R w KQkq - 1 5',
      arrows: [
        { from: 'f5', to: 'b1', color: 'green' },
        { from: 'e7', to: 'e6', color: 'blue' },
      ],
      orientation: 'black',
    },
    {
      title: 'Take on c4, but do not cling to the pawn',
      text: 'In the main line you play 4...dxc4. You are not trying to win a pawn for good, only to free your game. White usually wins it back, and you use the time to develop. If White allows it, ...b5 can keep the pawn, but give it back if keeping it would cost you your development.',
      fen: 'rnbqkb1r/pp2pppp/2p2n2/8/2pP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5',
      highlights: [{ square: 'c4', color: 'yellow' }],
      orientation: 'black',
    },
    {
      title: 'Guard your b7-pawn',
      text: 'Once your bishop has left c8, nothing protects the b7-pawn. If White\'s queen jumps to b3, she attacks b7 and, together with the c4-pawn, puts pressure on d5. Answer with ...Qb6 (which offers a queen trade) or ...Qc7, and stay calm.',
      fen: 'rn1qkb1r/pp2pppp/2p2n2/3p1b2/2PP4/1Q2PN2/PP3PPP/RNB1KB1R b KQkq - 2 5',
      arrows: [
        { from: 'b3', to: 'b7', color: 'red' },
        { from: 'd8', to: 'b6', color: 'green' },
        { from: 'd8', to: 'c7', color: 'blue' },
      ],
      orientation: 'black',
    },
    {
      title: 'Pin the knight with ...Bb4',
      text: 'In the main line, after ...e6 and White\'s Bxc4, you play ...Bb4. It develops your bishop with a pin: the knight on c3 is pinned to the white king, so it cannot move and it is less useful for supporting the centre. It also gets you ready to castle.',
      fen: 'rn1qk2r/pp3ppp/2p1pn2/5b2/PbBP4/2N1PN2/1P3PPP/R1BQK2R w KQkq - 1 8',
      arrows: [
        { from: 'b4', to: 'c3', color: 'red' },
        { from: 'b4', to: 'e1', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'When a knight attacks your bishop',
      text: 'White often jumps a knight to h4 to hit your bishop on f5. Retreat the bishop (to g6 or e6, the chapters tell you which). If White takes on g6, recapture with the h-pawn: your rook can then use the h-file. Never retake with the f-pawn.',
      fen: 'rn1qkb1r/pp2pppp/2p2n2/5b2/P1pP3N/2N5/1P2PPPP/R1BQKB1R b KQkq - 2 6',
      arrows: [
        { from: 'h4', to: 'f5', color: 'red' },
        { from: 'f5', to: 'g6', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'Free your game with ...c5 or ...e5',
      text: 'Your set-up is solid but a little short of space. When your pieces are developed, open the centre with ...c5 or ...e5. Do not play these breaks too early, or you may lose a pawn or leave a piece hanging.',
      fen: 'r2q1rk1/pp1nbppp/2p1pn2/3p1b2/2PP1B2/4PN2/PP1NBPPP/R2Q1RK1 w - - 1 9',
      arrows: [
        { from: 'c6', to: 'c5', color: 'green' },
        { from: 'e6', to: 'e5', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'The Exchange Slav: equal, but not boring',
      text: 'After 3.cxd5 cxd5 the pawns are symmetrical, so the game is equal. Play for activity: knight to c6, bishop to f5, then ...e6, a rook to the c-file and ...Bb4 or ...Ne4. Trade pieces only when it helps you.',
      fen: 'r2qkb1r/pp2pppp/2n2n2/3p1b2/3P1B2/2N1P3/PP3PPP/R2QKBNR w KQkq - 1 7',
      arrows: [
        { from: 'a8', to: 'c8', color: 'blue' },
        { from: 'f8', to: 'b4', color: 'blue' },
        { from: 'f6', to: 'e4', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'A big white centre is a target',
      text: 'When White gets pawns on d4 and e4, do not panic. Those pawns need good pieces behind them, and you can attack them with ...c5, ...e5 and piece trades. Keep your king safe and your pieces active.',
      fen: 'r2q1rk1/pp1n1ppp/2p1pnb1/8/PbBPP3/2N2N2/1P2QPPP/R1B2RK1 w - - 1 11',
      arrows: [
        { from: 'c6', to: 'c5', color: 'green' },
        { from: 'e6', to: 'e5', color: 'green' },
      ],
      highlights: [
        { square: 'd4', color: 'yellow' },
        { square: 'e4', color: 'yellow' },
      ],
      orientation: 'black',
    },
  ],
  commonMistakes: [
    {
      title: 'Playing ...e6 too early',
      text: 'If you play ...e6 before your light-squared bishop is out, that bishop is locked inside your own pawns. It becomes the "bad bishop" for the rest of the game. Bring it out first with ...Bf5 or ...Bg4.',
      fen: 'rnbqkb1r/pp3ppp/2p1pn2/3p4/2PP4/4PN2/PP3PPP/RNBQKB1R w KQkq - 0 5',
      highlights: [{ square: 'c8', color: 'red' }],
      orientation: 'black',
    },
    {
      title: 'Forgetting about b7',
      text: 'After the bishop leaves c8, the b7-pawn has no defender. If White\'s queen goes to b3, she attacks b7 and adds pressure on d5 behind her c4-pawn. Always look at the b3-square before you move. The easy answers are ...Qb6 (offer a trade) or ...Qc7.',
      fen: 'rn1qkb1r/pp2pppp/2p2n2/3p1b2/2PP4/1Q2PN2/PP3PPP/RNB1KB1R b KQkq - 2 5',
      arrows: [
        { from: 'b3', to: 'b7', color: 'red' },
        { from: 'c4', to: 'd5', color: 'red' },
        { from: 'd8', to: 'b6', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'Putting the bishop on g4 when the queen can take it',
      text: 'After White plays e3 and the f3-square is empty, the queen looks straight along the diagonal to g4. Then ...Bg4?? simply loses the bishop to Qxg4. Before every bishop move, ask yourself: can anything take it?',
      fen: 'rn1qkbnr/pp2pppp/2p5/3p4/3P2b1/3BP3/PPP2PPP/RNBQK1NR w KQkq - 2 4',
      arrows: [{ from: 'd1', to: 'g4', color: 'red' }],
      highlights: [{ square: 'g4', color: 'red' }],
      orientation: 'black',
    },
    {
      title: 'Not knowing where the bishop goes when a knight attacks it',
      text: 'When White plays Nh4 against your bishop on f5, the simplest answer here is ...Be6, out of the knight\'s reach. ...Bg4 is also playable, but White answers Qb3, hits your b7-pawn and gets an easier game. Know your retreat squares before the knight jumps.',
      fen: 'rn1qkb1r/pp2pppp/2p2n2/3p1b2/2PP3N/4P3/PP3PPP/RNBQKB1R b KQkq - 2 5',
      arrows: [
        { from: 'h4', to: 'f5', color: 'red' },
        { from: 'f5', to: 'g4', color: 'red' },
        { from: 'f5', to: 'e6', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'Holding on to the pawn with ...b5 at the wrong time',
      text: 'After 4.Nc3 dxc4 5.a4, you can no longer keep the pawn. ...b5? is answered by axb5 cxb5 Nxb5: White gets the pawn back at once and has a much better game. Play 5...Bf5 and develop instead. The ...b5 idea only works when White allows it, for example after 5.e3.',
      fen: 'rnbqkb1r/p3pppp/2p2n2/1p6/P1pP4/2N2N2/1P2PPPP/R1BQKB1R w KQkq - 0 6',
      arrows: [{ from: 'a4', to: 'b5', color: 'red' }],
      orientation: 'black',
    },
    {
      title: 'Recapturing with the wrong pawn',
      text: 'When White takes your bishop on g6, retake with the h-pawn. Retaking with the f-pawn weakens your king and the e6-square, and White gets a big edge. ...hxg6 is solid, and it gives your rook the h-file.',
      fen: 'rn1qkb1r/pp2pppp/2p2nN1/8/P1pP4/2N5/1P2PPPP/R1BQKB1R b KQkq - 0 7',
      arrows: [
        { from: 'h7', to: 'g6', color: 'green' },
        { from: 'f7', to: 'g6', color: 'red' },
      ],
      orientation: 'black',
    },
    {
      title: 'Being too passive in the Exchange Slav',
      text: 'The Exchange Slav is equal, but it is easy to shuffle pieces and slowly drift into a worse game. Give every piece a job: bishop to f5, knights to c6 and e4, a rook to the c-file, and ...Bb4 to pin the knight. Trade pieces on your terms.',
      fen: 'rnbqkb1r/pp2pppp/5n2/3p4/3P4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 5',
      arrows: [
        { from: 'c8', to: 'f5', color: 'green' },
        { from: 'b8', to: 'c6', color: 'green' },
        { from: 'f6', to: 'e4', color: 'blue' },
      ],
      orientation: 'black',
    },
  ],
  chapters: [
    {
      id: 'slow-slav',
      title: 'The Slow Slav and the Exchange Slav: 2.c4 d5 3.Nf3 or 3.cxd5',
      summary:
        'White plays 2.c4 and you answer ...d5: the Slav Defence. After 3.Nf3 Nf6 you bring the light-squared bishop out before ...e6; after 3.cxd5 cxd5 you develop with ...Nf6, ...Nc6 and ...Bf5.',
      difficulty: 1,
      pgn: `
1. d4 {White starts with the queen's pawn.}
1... c6 {Your answer to 1.d4: the same first move as in your Caro-Kann. Next comes ...d5, and the c6-pawn will guard it. [%cal Gc7c6,Gd7d5]}
2. c4 {White plays c4, the Queen's Gambit idea: the pawn attacks the d5-square.}
2... d5 {Now you have the Slav Defence. The c6-pawn guards d5, so you do not need ...e6 yet, and the road stays open for your light-squared bishop. [%cal Gc6d5,Gc8f5]}
3. Nf3 {A natural developing move. The knight also watches the e5 and d4 squares.}
(3. cxd5 {The Exchange Slav. White trades pawns to get a calm, symmetrical position with few risks. It is a safe line, but you can still play for a win if you stay active.}
3... cxd5 {Recapture with the c-pawn. Now the c-file is open for both sides, and both sides have a pawn on d4 and d5. This pawn structure is called "symmetrical". [%csl Gd4,Gd5]}
4. Nc3 {White develops a knight and adds pressure on d5.}
(4. Nf3 {White develops the knight first.}
4... Nf6 {Develop and protect d5. [%cal Gf6d5]}
5. Nc3 {White adds pressure on d5.}
5... Nc6 {Develop the second knight. [%cal Gc6d4]}
6. Bg5 {White's bishop attacks your knight on f6. If it takes the knight, your pawns get damaged.}
6... Ne4 {Jump to e4! The knight is protected by the d5-pawn, it gets away from the bishop, and it attacks both the bishop on g5 and the knight on c3. [%cal Ge4g5,Ge4c3]}
7. Bd2 {White retreats the bishop.}
7... e6 {Close the pawn chain. All your pieces can develop now. [%csl Gd5,Ge6]}
8. e3 {White prepares to develop the bishop.}
)
4... Nf6 {You develop a knight and guard d5 again. [%cal Gf6d5]}
5. Bf4 {White puts the bishop outside the pawn chain, the same idea you use with ...Bf5.}
(5. Nf3 {A very common move order. White develops the knight first.}
5... Nc6 {Develop the second knight. It adds pressure on d4 and keeps all your options open. [%cal Gc6d4]}
6. Bf4 {The same set-up as in the main line, just reached by another move order.}
6... Bf5 {Your bishop gets out before you close the pawn chain. [%cal Gf5b1]}
7. e3 {White protects d4 and opens the road for the bishop on f1.}
7... e6 {Now you close the pawn chain. All your pieces can develop easily. [%csl Gd5,Ge6]}
8. Be2 {White develops the bishop to a safe square.}
)
(5. Bg5 {White's bishop attacks your knight on f6. It looks annoying, but you have a neat answer.}
5... Ne4 {Jump into the centre! Your knight is protected by the d5-pawn, and it attacks both the bishop on g5 and the knight on c3. [%cal Ge4g5,Ge4c3]}
6. Nxe4 {White takes the knight.}
6... dxe4 {Recapture with the d-pawn. The pawn on e4 cramps White: it controls d3 and f3, so White cannot develop easily. The bishop on g5 is now loose, which gives you ...Qa5+ tricks. [%cal Ge4f3,Ge4d3]}
7. Rc1 {White takes the open c-file.}
7... Bd7 {Develop the bishop. It heads for c6, where it supports your e4-pawn. [%cal Gd7c6]}
8. Bd2 {White retreats the loose bishop.}
)
5... Nc6 {Develop the second knight. It pressures d4 and keeps your options open. [%cal Gc6d4]}
6. e3 {White protects d4 and opens the road for the bishop on f1.}
6... Bf5 {Your bishop gets out before you close the pawn chain, just like White's bishop on f4. [%cal Gf5b1]}
7. Nf3 {White develops the knight.}
7... e6 {Now you can close the gate: your bishop is already out. Your pawns d5 and e6 are solid and your pieces have room. [%csl Gd5,Ge6]}
8. Bd3 {White offers to swap the bishops.}
)
3... Nf6 {You develop a knight to a good square. It guards d5 a second time and stops White from playing e4 for free. [%cal Gf6d5,Gf6e4]}
4. e3 {A calm move that opens the way for White's bishop on f1. This set-up is called the Slow Slav (or Quiet Variation). White is not in a hurry.}
(4. Nc3 {White adds a second attacker on d5 and gets ready to push e4 one day.}
4... dxc4 {The main line of the Slav. You take the pawn on c4, which frees your queen's bishop and your position. White will win the pawn back, but you get time to develop. [%cal Gd5c4]}
5. a4 {White stops you from defending the pawn with ...b5. Now White will win the c4-pawn back soon.}
(5. e3 {White plans to win the pawn back with Bxc4.}
5... b5 {The key move: keep the pawn! Your pawn on b5 protects the c4-pawn. The c4-pawn also cramps White: it controls b3 and d3. [%cal Gb5c4]}
6. a4 {White attacks your b5-pawn.}
6... b4 {Push the pawn! It attacks the knight on c3. [%cal Gb4c3]}
7. Na2 {The knight goes to a2, where it eyes the b4 pawn.}
7... e6 {Protect the b4-pawn with the bishop (the f8-b4 diagonal is now open), and free your bishop. [%cal Gf8b4]}
8. Bxc4 {White takes the pawn back. Material is equal again.}
)
(5. e4 {White grabs the centre at once and offers a pawn.}
5... b5 {Hold on to the pawn. The b5-pawn supports c4. White now has a big centre, but you have an extra pawn and a solid position. [%cal Gb5c4]}
6. e5 {White pushes the pawn and attacks your knight.}
6... Nd5 {The knight jumps to a strong square. It is protected by the c6-pawn and it attacks the knight on c3. [%cal Gd5c3]}
7. a4 {White attacks your pawn chain.}
7... e6 {Close the pawn chain and open the diagonal for your bishop. The knight on d5 is also protected once more. [%csl Gc6,Gd5,Ge6]}
8. Be2 {White develops.}
)
5... Bf5 {The key Slav move. Your bishop gets out before you close the chain with ...e6. On f5 it controls e4, so White cannot easily play e4. [%cal Gf5e4,Gf5b1]}
6. e3 {White prepares to take back the pawn on c4 with the bishop.}
6... e6 {Now close the gate. The bishop is already outside, so it is not a prisoner. Your pawns c6 and e6 give you a solid centre. [%csl Gc6,Ge6]}
7. Bxc4 {White regains the pawn. The game is balanced.}
7... Bb4 {Pin the knight on c3 and prepare to castle. While it is pinned, the knight cannot move without exposing White's king. [%cal Rb4c3,Gb4e1]}
8. O-O {White castles.}
)
(4. g3 {A Catalan-style plan: the bishop will go to g2.}
4... Bf5 {Bishop out before ...e6. It eyes the b1-h7 diagonal. [%cal Gf5b1]}
5. Bg2 {White develops.}
5... e6 {Close the pawn chain.}
6. Nc3 {White adds pressure to d5.}
6... h6 {A useful little move. It gives your bishop the h7-square, so it can step back if White plays Nh4 or g4. [%cal Gf5h7]}
7. O-O {White castles.}
7... Be7 {Develop the bishop and get ready to castle.}
8. Nd2 {White prepares e4.}
)
(4. Bf4 {White develops the bishop first. But the bishop does not help to win the c4-pawn.}
4... dxc4 {Take the pawn! The bishop on f4 cannot take it back. [%cal Gd5c4]}
5. e3 {White wants to win the pawn back with Bxc4.}
5... b5 {Keep the pawn! The b5-pawn supports c4. [%cal Gb5c4]}
6. Be2 {White develops.}
6... e6 {Close the pawn chain.}
7. O-O {White castles.}
7... Be7 {Develop the bishop and get ready to castle.}
8. Qc2 {White develops the queen.}
)
(4. cxd5 {White swaps the pawns, which transposes to the Exchange Slav.}
4... cxd5 {Recapture with the c-pawn.}
5. Nc3 {White develops.}
5... Nc6 {Develop the second knight and pressure d4. [%cal Gc6d4]}
6. Bf4 {White develops the bishop outside the chain.}
6... Bf5 {Bishop out before ...e6. See the Exchange Slav line (3.cxd5 cxd5) in this chapter for the full plan. [%cal Gf5b1]}
7. e3 {White prepares to develop. You continue with ...e6 and ...Bb4 or ...Be7.}
)
4... Bf5 {The key Slav idea: bring the light-squared bishop out BEFORE you close the pawn chain with ...e6. On f5 it controls the e4-square, eyes White's queenside, and is not a prisoner behind your own pawns. [%cal Gf5e4,Gf5b1]}
5. Nc3 {White develops a knight and adds a second attacker against d5.}
5... e6 {NOW you close the gate. The pawns on c6, d5 and e6 form the Slav triangle: a rock-solid centre. Your bishop is already outside, so it is not locked in. [%csl Gc6,Gd5,Ge6]}
6. Bd3 {White offers to swap bishops.}
6... Bg6 {Keep the bishop. If White swaps on g6 you retake with the h-pawn and open the h-file for your rook. [%cal Gg6d3]}
7. O-O {White castles.}
7... Nbd7 {Develop and cover e5. [%cal Gd7e5]}
8. b3 {White prepares to put the bishop on b2.}
`,
    },
    {
      id: 'vs-london',
      title: 'Against the London System: 2.Bf4',
      summary:
        'White plays 2.Bf4 (or 2.Nf3 and 3.Bf4) instead of c4. You keep your Slav set-up: ...d5, ...Bf5 first, then ...e6.',
      difficulty: 1,
      pgn: `
1. d4 {White starts with the queen's pawn.}
1... c6 {Your answer to 1.d4: the same first move as in your Caro-Kann. Next comes ...d5, and the c6-pawn will guard it. [%cal Gc7c6,Gd7d5]}
2. Bf4 {The London System. White develops the bishop before playing e3.}
2... d5 {Take your share of the centre. This is your usual Slav set-up against the London. [%cal Gd7d5]}
3. e3 {White protects d4 and opens the road for the bishop on f1.}
(3. Nf3 {White develops the knight first.}
3... Bf5 {Bishop out before ...e6. [%cal Gc8f5]}
4. e3 {This is the same position as after 3.e3 Bf5 4.Nf3 in this chapter. Play ...e6.}
)
3... Bf5 {Bishop out before ...e6! Now both sides have a bishop outside the pawn chain. [%cal Gc8f5]}
4. Nf3 {White develops.}
4... e6 {Now you can close the pawn chain: your bishop is already outside. [%cal Ge7e6]}
5. Nbd2 {White develops the last knight.}
(5. Bd3 {White offers to swap the light-squared bishops.}
5... Bxd3 {Take it. Swapping these bishops is fine for you: White's bishop was aiming at your king-side, and now it is gone.}
6. Qxd3 {White recaptures with the queen.}
6... Nf6 {Develop with a purpose. The knight guards d5 and heads for the centre. [%cal Gf6d5]}
7. c4 {White attacks d5.}
7... Bd6 {Offer to swap White's dark-squared bishop. That bishop is White's best piece in the London. [%cal Gd6f4]}
8. Bxd6 {White takes. Take back with the queen: ...Qxd6.}
)
(5. c4 {White attacks d5 right away.}
5... Bd6 {Challenge White's best bishop. If White takes, you recapture with the queen. [%cal Gd6f4]}
6. Bxd6 {White takes.}
6... Qxd6 {Recapture. Your queen now eyes the white king-side.}
7. Nc3 {White develops and adds pressure to d5.}
7... Nf6 {Develop and protect d5. [%cal Gf6d5]}
8. Nh4 {White attacks your bishop. You can castle first: if White takes on f5, take back with the e-pawn.}
)
5... Nd7 {Develop the knight to d7. It keeps the e5 and f6 squares under control, and the other knight will come to f6. [%cal Gd7f6]}
6. Be2 {White develops.}
6... Ngf6 {Develop the second knight. Both knights now guard the centre. [%cal Gf6e4]}
7. O-O {White castles.}
7... Be7 {Develop the bishop and prepare to castle.}
8. c4 {White pushes the c-pawn to attack d5.}
`,
    },
    {
      id: 'vs-colle-catalan',
      title: 'Against 2.Nf3 and 2.e3: Colle and Catalan set-ups',
      summary:
        'White plays 2.Nf3 or 2.e3 and builds a quiet set-up with e3 (or g3) instead of c4. Your plan stays the same: ...d5, ...Bf5 first, then ...e6.',
      difficulty: 2,
      pgn: `
1. d4 {White starts with the queen's pawn.}
1... c6 {Your answer to 1.d4: the same first move as in your Caro-Kann. Next comes ...d5, and the c6-pawn will guard it. [%cal Gc7c6,Gd7d5]}
2. Nf3 {A flexible developing move. White has not played c4, so this is not yet a Slav.}
(2. e3 {A quiet move. White opens the road for the bishop on f1.}
2... d5 {Take your share of the centre.}
3. Nf3 {This is the same position as after 2.Nf3 d5 3.e3 in this chapter. Play ...Bf5.}
(3. Bd3 {White develops the bishop to d3 at once.}
3... Nf6 {Develop the knight first. Do not play ...Bg4 yet: with nothing on f3, the queen on d1 could take it. [%cal Gg8f6]}
4. Nf3 {White develops. Now ...Bg4 is safe, because the knight on f3 stands between your bishop and the queen. Continue with ...Bg4 and ...e6.}
)
(3. c4 {This is the same position as 1.d4 c6 2.c4 d5 3.e3. Play ...Bf5, as in the chapter on 3.Nc3 and 3.e3.}
)
)
(2. c3 {A quiet move. White supports d4 with a pawn.}
2... d5 {Take the centre, as always.}
3. Bf4 {White plays a London-style set-up. Play ...Bf5 and ...e6, as in the chapter "Against the London System: 2.Bf4".}
)
2... d5 {Take your share of the centre. [%cal Gd7d5]}
3. e3 {White builds a quiet set-up with e3, Bd3 and c3 or c4. This is sometimes called the Colle.}
(3. Bf4 {The London System. This is the same position as after 2.Bf4 d5 3.Nf3 in the chapter "Against the London System: 2.Bf4". Play ...Bf5.}
)
(3. Nc3 {This is the same position as after 2.Nc3 d5 3.Nf3 in the chapter "Other White moves". Play ...Bf5.}
)
(3. c4 {This is the Slav: the same position as 1.d4 c6 2.c4 d5 3.Nf3. Play ...Nf6, as in the chapter on the Slow Slav.}
)
(3. g3 {White plans to put a bishop on g2. This is a Catalan-style set-up.}
3... Bf5 {Again, bishop out first. It keeps an eye on the c2 and b1 squares. [%cal Gf5c2]}
4. Bg2 {White develops.}
4... e6 {Close the pawn chain. Your pieces can now develop easily. [%csl Gc6,Gd5,Ge6]}
5. O-O {White castles.}
5... h6 {A useful little move. It gives your bishop a retreat square on h7 and stops Ng5 or Bg5 ideas. [%cal Gf5h7]}
6. c4 {White attacks d5.}
6... Nf6 {Develop and protect d5. [%cal Gf6d5]}
7. Nfd2 {White gets ready to play Nc3 and e4.}
7... Be7 {Develop the bishop and prepare to castle.}
8. Nc3 {White develops.}
)
3... Bf5 {Bishop out before ...e6, as always. It also stops White from playing e4 easily. [%cal Gc8f5]}
4. c4 {White attacks d5 with a pawn.}
(4. Bd3 {White offers to swap your good bishop.}
4... Bg6 {Keep the bishop. If White trades on g6, you recapture with the h-pawn and your rook gets the h-file. [%cal Gg6d3]}
5. c4 {White attacks d5.}
5... e6 {Close the pawn chain. All your pieces can develop now. [%csl Gc6,Gd5,Ge6]}
6. O-O {White castles.}
6... Nf6 {Develop and protect d5. [%cal Gf6d5]}
7. Qc2 {White lines up against your bishop on g6.}
7... Bxd3 {Trade bishops. White's bishop was the more dangerous one.}
8. Qxd3 {White recaptures.}
)
4... e6 {Close the pawn chain. All your pieces can develop easily. [%csl Gc6,Gd5,Ge6]}
5. Nc3 {This is the same position as after 2.c4 d5 3.e3 Bf5 4.Nc3 e6 5.Nf3 in the chapter on 3.Nc3 and 3.e3. Play ...Be7 and ...Nf6, as you learned there.}
`,
    },
    {
      id: 'third-move-sidelines',
      title: 'The Slav with 3.Nc3 or 3.e3 (and the pawn offers on e4)',
      summary:
        'After 2.c4 d5 White plays 3.Nc3 or 3.e3 instead of 3.Nf3, sometimes with a pawn offer on e4. Get your bishop out and watch out for the queen trick Qb3.',
      difficulty: 2,
      pgn: `
1. d4 {White starts with the queen's pawn.}
1... c6 {Your answer to 1.d4: the same first move as in your Caro-Kann. Next comes ...d5, and the c6-pawn will guard it. [%cal Gc7c6,Gd7d5]}
2. c4 {White plays c4, the Queen's Gambit idea.}
2... d5 {The Slav Defence. Your c6-pawn protects d5 and keeps the bishop's road open. [%cal Gc6d5]}
3. Nc3 {White develops and adds a second attacker on d5.}
(3. e3 {A quiet move. White opens the road for the f1-bishop but blocks the c1-bishop behind the e3-pawn.}
3... Bf5 {Bring the bishop out right away, before ...e6 locks it in. [%cal Gf5b1]}
4. Nc3 {White develops and adds pressure to d5.}
(4. cxd5 {White swaps pawns and plans Qb3.}
4... cxd5 {Recapture with the c-pawn. Your bishop is outside the chain, and d5 is solid.}
5. Qb3 {The queen hits b7 and d5 together.}
5... Qc7 {Protect b7 with the queen. The d5-pawn is still safe: if Qxd5, your queen takes the c1-bishop with check, Qxc1+. [%cal Gc7b7,Gc7c1]}
6. Bb5+ {White checks to disturb your pieces.}
6... Nd7 {Block with the knight. The knight can later go to f6.}
7. Nc3 {White develops.}
7... e6 {Close the pawn chain. All your pieces are well placed.}
8. Nf3 {White develops. Bring your other knight out with ...Nf6 now. Your knight on d7 is pinned, and after a slow move such as ...a6, White takes on d7 and jumps into e5 with the knight.}
)
4... e6 {Close the pawn chain, with your bishop already outside. [%csl Gc6,Gd5,Ge6]}
5. Nf3 {White develops.}
5... Be7 {Develop the bishop and prepare to castle.}
6. Bd3 {White offers to swap bishops.}
6... Bxd3 {Take it. Trading the bishop is easy and your game stays solid.}
7. Qxd3 {White recaptures with the queen.}
7... Nf6 {Develop and guard d5. [%cal Gf6d5]}
8. O-O {White castles.}
)
(3. e4?! {The Diemer Gambit. White offers a pawn to take the centre.}
3... dxe4 {Take it! The pawn is free and White needs to show real compensation. [%cal Gd5e4]}
4. Nc3 {White develops and prepares to win the pawn back.}
4... Nf6 {Develop and defend e4. [%cal Gf6e4]}
5. f3 {White offers a second pawn to open the f-file. Take it too with ...exf3: you can give material back later, at the right moment.}
)
3... Nf6 {You develop with a purpose: the knight guards d5. [%cal Gf6d5]}
4. Nf3 {This is the same position as 1.d4 c6 2.c4 d5 3.Nf3 Nf6 4.Nc3 in the chapter on the Slow Slav. Play ...dxc4, as you learned there.}
(4. e3 {A quiet move. If you now play ...Bf5, you get a position like the Slow Slav.}
4... Bf5 {Bring the bishop out before closing the pawn chain. [%cal Gf5b1]}
5. cxd5 {White swaps pawns to open the c-file and then hit b7 with the queen.}
(5. Nf3 {White develops.}
5... e6 {Close the pawn chain. Here you transpose to the Slow Slav chapter. See that chapter for the full plan. [%csl Gc6,Gd5,Ge6]}
6. Bd3 {White offers to swap bishops. Carry on as in the Slow Slav chapter with ...Bg6.}
)
5... cxd5 {Recapture with the c-pawn. Your bishop is outside and d5 is solid.}
6. Qb3 {The queen attacks b7 and d5 together. This is a favourite trap!}
6... Bc8 {Retreat the bishop to protect b7. Do NOT play ...Qb6 or ...Qc8: White would then win material with Nxd5. [%cal Gc8b7,Rb3b7]}
7. Bd3 {White develops.}
7... e6 {Close the pawn chain and open your bishop's road.}
8. Nf3 {White develops.}
)
(4. Bg5 {White's bishop attacks your knight on f6, but it does not help White win back the c4-pawn after you take it.}
4... dxc4 {Take the pawn! White's bishop on g5 does not help to win it back. [%cal Gd5c4]}
5. Nf3 {White develops.}
5... b5 {Keep the pawn! The b5-pawn supports c4. [%cal Gb5c4]}
6. g3 {White prepares to play Bg2 and attack the queenside.}
6... h6 {Ask the bishop a question: take on f6 or step back. Either way you keep your extra pawn.}
7. Be3 {The bishop retreats.}
7... e6 {Close the pawn chain and open your bishop. Your pieces are developing smoothly.}
8. Ne5 {White's knight jumps into the centre.}
)
`,
    },
    {
      id: 'other-second-moves',
      title: 'Other White moves: 2.e4, 2.Nc3, 2.Bg5, and 1.c4 or 1.Nf3',
      summary:
        'White plays 2.e4 (now you are in the Caro-Kann), 2.Nc3 or 2.Bg5, or starts with 1.c4 or 1.Nf3. You still answer with ...c6 and ...d5.',
      difficulty: 2,
      pgn: `
1. d4 {White starts with the queen's pawn.}
(1. c4 {The English Opening.}
1... c6 {Your usual answer. Next comes ...d5. [%cal Gd7d5]}
2. Nc3 {White develops.}
(2. d4 {This is the Slav move order 1.d4 c6 2.c4. Play ...d5.}
)
2... d5 {Take the centre.}
3. cxd5 {White swaps pawns.}
(3. d4 {This is the Slav: the same position as 1.d4 c6 2.c4 d5 3.Nc3. Play ...Nf6, as in the chapter on 3.Nc3 and 3.e3.}
)
3... cxd5 {Take back with the c-pawn.}
4. d4 {This is the Exchange Slav: the same position as 1.d4 c6 2.c4 d5 3.cxd5 cxd5 4.Nc3. Play ...Nf6, as in the chapter on the Slow Slav and the Exchange Slav.}
)
(1. Nf3 {A flexible first move.}
1... c6 {Your usual answer. Next comes ...d5.}
2. d4 {This is the same as 1.d4 c6 2.Nf3. Play ...d5, as in the chapter "Against 2.Nf3 and 2.e3".}
(2. e4 {Play ...d5: this is the Two Knights line of the Caro-Kann (1.e4 c6 2.Nf3 d5), as in the Caro-Kann course.}
)
(2. g3 {White plans to put the bishop on g2.}
2... d5 {Take the centre.}
3. Bg2 {White develops. Continue with ...Bg4 or ...Bf5, then ...Nf6 and ...e6.}
)
(2. c4 {Play ...d5. After d4 you are in the Slav.}
)
)
1... c6 {Your answer to 1.d4: the same first move as in your Caro-Kann. Next comes ...d5, and the c6-pawn will guard it. [%cal Gc7c6,Gd7d5]}
2. e4 {White grabs the centre. Now ...d5 turns the game into a Caro-Kann, your other opening.}
(2. Nc3 {White develops the knight first. It stands in front of the c-pawn, so White will not play c4 soon.}
2... d5 {Take your share of the centre. [%cal Gd7d5]}
3. e4 {This is the Caro-Kann Classical Variation (1.e4 c6 2.d4 d5 3.Nc3). Take on e4 with ...dxe4 and, after Nxe4, play ...Bf5, as in the Caro-Kann course.}
(3. Nf3 {White develops.}
3... Bf5 {Bishop out before ...e6. [%cal Gf5b1]}
4. Bf4 {White develops the bishop outside the chain.}
4... e6 {Close the pawn chain.}
5. e3 {White protects the bishop.}
5... Nd7 {Develop the knight to d7. It is a flexible square.}
6. Bd3 {White offers to swap bishops.}
6... Ngf6 {Develop the second knight. You are happy to trade bishops.}
7. h3 {White gives the bishop on f4 a retreat on h2.}
)
)
(2. Bg5 {White develops the bishop outside the pawn chain and eyes your e7-pawn.}
2... d5 {Take your share of the centre.}
3. Nf3 {White develops.}
3... Bf5 {Bishop out before ...e6. [%cal Gf5b1]}
4. e3 {White opens the road for the f1-bishop.}
4... Nd7 {Develop the knight to d7. It keeps f6 free for the other knight and protects the e5 square.}
5. Bd3 {White offers to swap your bishop.}
5... Bxd3 {Take it. Trading bishops is simple and leaves you with a solid position.}
6. Qxd3 {White recaptures with the queen. Do not worry about the e7-pawn: the bishop on g5 would only win a pawn at the cost of a bishop.}
6... h6 {Ask the bishop a question. If it takes e7, you take back and have won a piece for a pawn.}
7. Bf4 {The bishop retreats.}
7... e6 {Close the pawn chain and open your king's bishop.}
8. c4 {White attacks d5.}
)
2... d5 {Hit the e4-pawn. This is the Caro-Kann Defence (1.e4 c6 2.d4 d5). [%cal Gd5e4]}
3. e5 {The Advance Variation. Play ...Bf5, as in the Caro-Kann course.}
(3. exd5 {The Exchange Variation. Take back with ...cxd5, as in the Caro-Kann course.}
)
(3. Nc3 {The Classical Variation. Take on e4 with ...dxe4, as in the Caro-Kann course.}
)
(3. Nd2 {Take on e4 with ...dxe4, as in the Classical chapter of the Caro-Kann course.}
)
(3. f3 {The Fantasy Variation. Take on e4 with ...dxe4, as in the Caro-Kann course.}
)
`,
    },
  ],
}
