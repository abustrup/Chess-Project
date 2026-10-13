import type { OpeningCourse } from '../../types'

/**
 * Caro-Kann Defence, played as Black.
 *
 * Every chapter is a PGN tree. At each position where you (Black) are to move, the FIRST move is the
 * move to learn. At each White move, every listed move is a reply we have prepared for.
 * Weak White moves are marked ?! or ? and the comment shows how to punish them.
 */
export const caroKannCourse: OpeningCourse = {
  id: 'caro-kann',
  name: 'Caro-Kann Defence',
  side: 'black',
  tagline: 'Rock-solid and easy to understand: bring your bishop out first, then build a fortress in the centre.',
  signatureMoves: ['e4', 'c6', 'd4', 'd5'],
  ecoNames: [
    'Caro-Kann Defense',
    'Caro-Kann Defense: Accelerated Panov Attack',
    'Caro-Kann Defense: Accelerated Panov Attack, Modern Variation',
    'Caro-Kann Defense: Accelerated Panov Attack, Open Variation',
    'Caro-Kann Defense: Accelerated Panov Attack, Pseudo-Scandinavian',
    'Caro-Kann Defense: Accelerated Panov Attack, Van Weersel Attack',
    'Caro-Kann Defense: Apocalypse Attack',
    'Caro-Kann Defense: Breyer Variation',
    'Caro-Kann Defense: Breyer Variation, Stein Attack',
    'Caro-Kann Defense: Dinic Gambit',
    'Caro-Kann Defense: Endgame Offer',
    'Caro-Kann Defense: Endgame Variation',
    'Caro-Kann Defense: Euwe Attack',
    'Caro-Kann Defense: Goldman Variation',
    'Caro-Kann Defense: Hector Gambit',
    'Caro-Kann Defense: Hillbilly Attack',
    'Caro-Kann Defense: Hillbilly Attack, Schaeffer Gambit',
    'Caro-Kann Defense: Labahn Attack',
    'Caro-Kann Defense: Labahn Attack, Double Gambit',
    'Caro-Kann Defense: Labahn Attack, Polish Variation',
    'Caro-Kann Defense: Scorpion-Horus Gambit',
    'Caro-Kann Defense: Spike Variation',
    'Caro-Kann Defense: Spike Variation, Scorpion-Grob Gambit',
    'Caro-Kann Defense: St. Patrick\'s Attack',
    'Caro-Kann Defense: Toikkanen Gambit',
    'Caro-Kann Defense: Two Knights Attack',
    'Caro-Kann Defense: Two Knights Attack, Mindeno Variation',
    'Caro-Kann Defense: Two Knights Attack, Mindeno Variation, Exchange Line',
    'Caro-Kann Defense: Two Knights Attack, Mindeno Variation, Retreat Line',
    'Caro-Kann Defense: Advance Variation',
    'Caro-Kann Defense: Advance Variation, Bayonet Attack',
    'Caro-Kann Defense: Advance Variation, Botvinnik-Carls Defense',
    'Caro-Kann Defense: Advance Variation, Bronstein Variation',
    'Caro-Kann Defense: Advance Variation, Prins Attack',
    'Caro-Kann Defense: Advance Variation, Short Variation',
    'Caro-Kann Defense: Advance Variation, Tal Variation',
    'Caro-Kann Defense: Advance Variation, Van der Wiel Attack',
    'Caro-Kann Defense: Advance Variation, Van der Wiel Attack, Dreyev Defense',
    'Caro-Kann Defense: Advance, Short Variation',
    'Caro-Kann Defense: De Bruycker Defense',
    'Caro-Kann Defense: Edinburgh Variation',
    'Caro-Kann Defense: Maróczy Variation',
    'Caro-Kann Defense: Maróczy Variation, Maróczy Gambit',
    'Caro-Kann Defense: Masi Variation',
    'Caro-Kann Defense: Massachusetts Defense',
    'Caro-Kann Defense: Mieses Attack, Landau Gambit',
    'Caro-Kann Defense: Mieses Gambit',
    'Caro-Kann Defense: Modern Variation',
    'Caro-Kann Defense: Ulysses Gambit',
    'Caro-Kann Defense: Exchange Variation',
    'Caro-Kann Defense: Exchange Variation, Bulla Attack',
    'Caro-Kann Defense: Exchange Variation, Rubinstein Variation',
    'Caro-Kann Defense: Panov Attack',
    'Caro-Kann Defense: Panov Attack, Gunderam Attack',
    'Caro-Kann Defense: Panov Attack, Modern Defense',
    'Caro-Kann Defense: Panov Attack, Modern Defense, Carlsbad Line',
    'Caro-Kann Defense: Panov Attack, Modern Defense, Czerniak Line',
    'Caro-Kann Defense: Panov Attack, Modern Defense, Mieses Line',
    'Caro-Kann Defense: Panov Attack, Modern Defense, Reifir-Spielmann Line',
    'Caro-Kann Defense: Panov-Botvinnik, Herzog Defense',
    'Caro-Kann Defense: Panov Attack, Fianchetto Defense',
    'Caro-Kann Defense: Panov Attack, Fianchetto Defense, Fianchetto Gambit',
    'Caro-Kann Defense: Panov Attack, Main Line',
    'Caro-Kann Defense: Alekhine Gambit',
    'Caro-Kann Defense: Alien Gambit',
    'Caro-Kann Defense: Campomanes Attack',
    'Caro-Kann Defense: Forgacs Variation',
    'Caro-Kann Defense: Gurgenidze Counterattack',
    'Caro-Kann Defense: Gurgenidze System',
    'Caro-Kann Defense: Main Line',
    'Caro-Kann Defense: Rasa-Studier Gambit',
    'Caro-Kann Defense: Tartakower Variation',
    'Caro-Kann Defense: Tartakower Variation, Perlis Line',
    'Caro-Kann Defense: von Hennig Gambit',
    'Caro-Kann Defense: Bronstein-Larsen Variation',
    'Caro-Kann Defense: Finnish Variation',
    'Caro-Kann Defense: Karpov Variation',
    'Caro-Kann Defense: Karpov Variation, Modern Main Line',
    'Caro-Kann Defense: Karpov Variation, Modern Variation',
    'Caro-Kann Defense: Karpov Variation, Modern Variation, Ivanchuk Defense',
    'Caro-Kann Defense: Karpov Variation, Modern Variation, Kasparov Attack',
    'Caro-Kann Defense: Karpov Variation, Smyslov Variation',
    'Caro-Kann Defense: Karpov Variation, Smyslov Variation, Main Line',
    'Caro-Kann Defense: Karpov Variation, Tiviakov-Fischer Attack',
    'Caro-Kann Defense: Classical Variation',
    'Caro-Kann Defense: Classical Variation, Flohr Variation',
    'Caro-Kann Defense: Classical Variation, Main Line',
    'Caro-Kann Defense: Classical Variation, Maróczy Attack',
    'Caro-Kann Defense: Martian Gambit',
    'Caro-Kann Defense: Classical Variation, Lobron System',
    'Caro-Kann Defense: Classical Variation, Seirawan Variation',
    'Caro-Kann Defense: Classical Variation, Spassky Variation',
  ],
  overview: [
    'The Caro-Kann Defence starts with 1.e4 c6. It looks quiet, but it has a clear job: next you play ...d5 and challenge White\'s centre. The pawn on c6 guards the pawn on d5, so your centre stays solid and your queen does not have to come out early.',
    'It suits you because it is built on ideas, not on memorised tricks. Your pawns are healthy, your king is safe, and you almost never get crushed by a quick attack. When your opponent plays a weak move, you can punish it calmly. At club level that happens a lot.',
    'The plan in three sentences. Challenge the e4-pawn with ...d5. Bring your light-squared bishop out (usually to f5 or g4) BEFORE you close the position with ...e6. Then finish your development, castle, and hit White\'s centre with ...c5 (or sometimes ...e5) at the right moment.',
    'The middlegames feel solid and patient. In some lines White has a little more space, so you wait, trade pieces and use your good pawn structure. When the queens come off, you usually get an easy ending with no weak pawns.',
    'What to be careful about: never lock your bishop behind your own pawns (bishop first, then ...e6). Do not grab pawns with the queen too early. Watch out for checks and pins on b5 and g5. And remember that after White plays e5, your knight cannot go to f6.',
  ],
  keyIdeas: [
    {
      title: 'Why 1...c6 and 2...d5?',
      text: 'The c6-pawn guards d5. So when you play ...d5, your pawn is safe and White\'s e4-pawn is under pressure. If White takes on d5, you take back with the c-pawn and keep a pawn in the centre. You do not need to bring your queen out.',
      fen: 'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3',
      arrows: [
        { from: 'c6', to: 'd5', color: 'green' },
        { from: 'd5', to: 'e4', color: 'red' },
      ],
      orientation: 'black',
    },
    {
      title: 'Bishop first, then ...e6',
      text: 'Your light-squared bishop on c8 is the piece that can get stuck. If you play ...e6 first, it is locked inside your own pawns. So bring it out to f5 (or g4) first, outside the pawn chain, and only then close the door with ...e6.',
      fen: 'rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3',
      arrows: [{ from: 'c8', to: 'f5', color: 'green' }],
      highlights: [{ square: 'e6', color: 'yellow' }],
      orientation: 'black',
    },
    {
      title: 'Hit the base of the pawn chain',
      text: 'Against the Advance (e5), White\'s pawns on d4 and e5 form a chain. The d4-pawn is the base that holds it all up. Attack it with ...c5, ...Nc6 and ...Qb6. If the base falls, the e5-pawn becomes weak.',
      fen: 'rn1qkbnr/pp3ppp/4p3/2ppPb2/3P4/5N2/PPP1BPPP/RNBQK2R w KQkq - 0 6',
      arrows: [{ from: 'c5', to: 'd4', color: 'green' }],
      highlights: [{ square: 'd4', color: 'red' }],
      orientation: 'black',
    },
    {
      title: 'Knights like the closed positions',
      text: 'In the Advance Variation your knight belongs on e7. From there it protects the bishop on f5 and can jump to f5 or g6 later. It also hits d4 and e5. A knight on f5 is hard to chase away.',
      fen: 'rn1qkb1r/pp2nppp/4p3/3pPb2/3N4/4B3/PPP1BPPP/RN1QK2R w KQkq - 1 8',
      arrows: [
        { from: 'e7', to: 'f5', color: 'green' },
        { from: 'd4', to: 'f5', color: 'red' },
      ],
      orientation: 'black',
    },
    {
      title: 'Classical line: ...Bg6, ...h6, ...Bh7',
      text: 'In the Classical line White chases your bishop with Ng3 and then h4-h5. Answer with ...Bg6 and ...h6, so that after h5 the bishop can retreat to h7. It is safe there and still looks along the diagonal. Then play ...Nd7, ...e6, ...Ngf6 and ...Be7.',
      fen: 'r2qkbnr/pp1npppb/2p4p/7P/3P4/5NN1/PPP2PP1/R1BQKB1R w KQkq - 1 9',
      highlights: [
        { square: 'h7', color: 'green' },
        { square: 'h6', color: 'yellow' },
      ],
      orientation: 'black',
    },
    {
      title: 'Exchange Variation: knights, then ...Bg4',
      text: 'After 3.exd5 cxd5 the pawns are symmetrical, so the fight is about development. Play ...Nc6 and ...Nf6, then bring the bishop to g4 before ...e6. It attacks White\'s queen and keeps White busy. Next come ...e6, ...Bd6 and castling.',
      fen: 'r2qkb1r/pp2pppp/2n2n2/3p4/3P1Bb1/2PB4/PP3PPP/RN1QK1NR w KQkq - 3 7',
      arrows: [{ from: 'g4', to: 'd1', color: 'red' }],
      orientation: 'black',
    },
    {
      title: 'Panov Attack: play against the lonely d-pawn',
      text: 'In the Panov (4.c4) White usually ends up with an "isolated queen pawn": a pawn on d4 with no pawn neighbours. While many pieces are on the board it gives White space and attacks. Your plan is to swap pieces, put a knight on d5 (a great blocking square) and aim for an ending where the pawn becomes a weakness.',
      fen: 'rnbqk2r/pp2bppp/4p3/3n4/3P4/2N2N2/PP3PPP/R1BQKB1R w KQkq - 0 8',
      highlights: [
        { square: 'd4', color: 'red' },
        { square: 'd5', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'The Caro-Kann endgame',
      text: 'This opening is famous for good endings. Your pawn structure has no weak pawns and your king is safe. So if White offers a trade of queens, do not worry. You are not worse, and you can simply improve your king and rooks and wait for White to go wrong.',
    },
  ],
  commonMistakes: [
    {
      title: 'Playing ...e6 before the bishop is out',
      text: 'After 3.e5, the move 3...e6? locks your bishop on c8 behind its own pawns. It stays shut in for a long time and White enjoys a lot of space. Play 3...Bf5 first, then ...e6.',
      fen: 'rnbqkbnr/pp3ppp/2p1p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4',
      arrows: [{ from: 'c8', to: 'f5', color: 'green' }],
      highlights: [{ square: 'c8', color: 'red' }],
      orientation: 'black',
    },
    {
      title: 'Playing ...Nf6 after White plays e5',
      text: 'After 3.e5 the white pawn attacks f6. So 3...Nf6?? just loses a piece to exf6. Develop the bishop with 3...Bf5 instead. Your knights can come out later, to d7 or e7.',
      fen: 'rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3',
      arrows: [
        { from: 'e5', to: 'f6', color: 'red' },
        { from: 'c8', to: 'f5', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'Grabbing the d4-pawn with the queen',
      text: 'If White\'s queen guards d4, then ...Qxd4?? just loses your queen for a pawn. Always count: how many pieces protect the pawn? Here, after 5.Ng5, the d4-pawn looks loose but White\'s queen guards it. Develop with ...e6 or ...h6 instead.',
      fen: 'rn1qkbnr/pp2pppp/2p5/5bN1/3P4/8/PPP2PPP/R1BQKBNR b KQkq - 2 5',
      arrows: [{ from: 'd8', to: 'd4', color: 'red' }],
      orientation: 'black',
    },
    {
      title: 'Forgetting the bishop\'s escape square',
      text: 'In the Classical line, after 6.h4 do NOT play 6...Nf6?, because 7.h5 traps your bishop. First play 6...h6. Then after h5 your bishop retreats to h7 and is perfectly safe.',
      fen: 'rn1qkbnr/pp2pppp/2p3b1/8/3P3P/6N1/PPP2PP1/R1BQKBNR b KQkq - 0 6',
      arrows: [
        { from: 'h7', to: 'h6', color: 'green' },
        { from: 'h4', to: 'h5', color: 'red' },
      ],
      orientation: 'black',
    },
    {
      title: 'Blocking a check with the queen',
      text: 'After 4.Bb5+ in the Exchange Variation, block with the bishop: 4...Bd7. If you play 4...Qd7?? then 5.Bxd7+ wins your queen for a bishop. Before every block, ask which piece is the cheapest one to put in the way.',
      fen: 'rnbqkbnr/pp2pppp/8/1B1p4/3P4/8/PPP2PPP/RNBQK1NR b KQkq - 1 4',
      arrows: [
        { from: 'd8', to: 'd7', color: 'red' },
        { from: 'c8', to: 'd7', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'Running away when a knight attacks your bishop',
      text: 'In the Advance Variation, after 6.Be3 cxd4 7.Nxd4 the knight attacks your bishop on f5. Do not retreat with 7...Bg6?, which loses time and lets White attack with h4. Protect the bishop with 7...Ne7. Then Nxf5 Nxf5 is a fine trade for you.',
      fen: 'rn1qkbnr/pp3ppp/4p3/3pPb2/3N4/4B3/PPP1BPPP/RN1QK2R b KQkq - 0 7',
      arrows: [
        { from: 'd4', to: 'f5', color: 'red' },
        { from: 'g8', to: 'e7', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'Forgetting about the b7-pawn',
      text: 'Once your light-squared bishop leaves c8, the b7-pawn is only protected by your queen. White\'s queen often goes to b3 to attack it. Answer with ...Qd7 or ...Qc8 (do not just ignore it).',
      fen: 'r2qkb1r/pp2pppp/2n2n2/3p4/3P1Bb1/1QPB4/PP3PPP/RN2K1NR b KQkq - 4 7',
      arrows: [
        { from: 'b3', to: 'b7', color: 'red' },
        { from: 'd8', to: 'd7', color: 'green' },
      ],
      orientation: 'black',
    },
  ],
  chapters: [
    {
      id: 'exchange-bd3',
      title: 'Exchange Variation: White plays Bd3 and Bf4',
      summary: 'White swaps pawns on d5 and plays a quiet, simple set-up with Bd3, c3 and Bf4. You get easy development, a free bishop and a solid position.',
      difficulty: 1,
      pgn: `
1. e4 {White starts with the king's pawn, the most popular first move.}
1... c6 {Welcome to the Caro-Kann. This quiet move prepares ...d5. The c6-pawn will guard the d5-pawn, so your centre stays solid. [%cal Gc6d5]}
2. d4 {White takes the centre with a second pawn.}
2... d5 {Now you strike at the e4-pawn. Your d5-pawn is guarded by the c6-pawn, and your light-squared bishop is not locked in behind an e6-pawn. That is the big plus of the Caro-Kann. [%cal Gd5e4]}
3. exd5 {White takes. This is the Exchange Variation: White is happy with a quiet game and a simple pawn structure.}
3... cxd5 {Take back with the c-pawn. You keep a pawn in the centre and you open the c-file for your rooks later. Both sides now have the same pawns, so the fight is about who develops better.}
4. Bd3 {White develops the bishop. It looks at your kingside and helps White to castle soon.}
4... Nc6 {Develop a knight and put pressure on the d4-pawn. Knights usually come out before bishops. [%cal Gc6d4]}
5. c3 {White protects d4 with a pawn, so the centre stays strong.}
(5. Nf3 {White develops first, so d4 is guarded only by the knight.}
5... Bg4 {Same plan as always: bishop out before ...e6. Now the bishop attacks the knight that guards d4. [%cal Gg4f3]}
6. c3 {A pawn now guards d4, so the knight is free.}
(6. h3?! {This looks natural, but it lets you win a pawn.}
6... Bxf3 {Take it. The f3-knight was guarding d4, so after the swap you can win a pawn. [%cal Gg4f3]}
7. Qxf3 Nxd4 {The knight takes the pawn and attacks the queen at the same time. White has no good way to take back. [%cal Gc6d4,Gd4f3]}
8. Qd1 {The queen has to run away. Other queen moves are no better.}
8... Nf6 {You are a clean pawn up. Develop your pieces calmly and keep your knights safe.}
9. O-O {White castles. Next you can play ...e6 and ...Be7, and simply play on with the extra pawn.}
)
6... Nf6 {Develop the second knight. It guards d5 and also watches e4. [%cal Gf6d5]}
7. Bf4 {White's bishop jumps outside the pawn chain.}
7... e6 {Now your bishop is already out, so the e-pawn can support d5 without locking anything in. It also opens the road for your other bishop. [%cal Ge6d5,Gf8d6]}
8. O-O Bd6 {Trade off White's good bishop. Your pieces are all developing smoothly. [%cal Gd6f4]}
9. Bxd6 Qxd6 {The queen takes back and looks at the kingside. You are one move from castling.}
10. Re1 O-O {Castle to keep your king safe. Plan: ...Rac8 to use the open c-file, and maybe ...Bg6 to swap the light-squared bishops.}
11. Nbd2 Rac8 {The rook uses the open c-file. You have an easy, healthy position.}
12. Qa4 {White tries to bother you, but your pieces are all well placed. You can answer with ...Qf4 or ...Bf5.}
)
5... Nf6 {Develop the second knight. It guards d5 and also watches e4. [%cal Gf6d5]}
6. Bf4 {White's bishop jumps outside the pawn chain. It also prepares ideas with the queen.}
6... Bg4 {This is the key move of the chapter. Your light-squared bishop comes out BEFORE you play ...e6. Right now it attacks White's queen, so White has to react. [%cal Rg4d1]}
7. Qb3 {The queen steps away and attacks the b7-pawn. [%cal Rb3b7]}
(7. Nf3 {White blocks the attack by developing a knight. The knight is now tied to the queen: if it moves, you play ...Bxd1.}
7... e6 {Now the pawn move is safe. It supports d5 and opens the path for your other bishop. [%cal Ge6d5,Gf8d6]}
8. h3 {White asks your bishop what it wants to do.}
(8. Nbd2 {White develops the last knight.}
8... Bd6 {Offer a trade of the dark-squared bishops. [%cal Gd6f4]}
9. Bxd6 Qxd6 {The queen takes back. You are almost developed.}
10. O-O O-O {King safe. Next you can play ...Rac8 or ...Bf5 to swap bishops.}
11. Re1 {White puts a rook on the open e-file. You answer with ...Bf5, trading your light-squared bishop for White's good one.}
)
8... Bh5 {Keep your bishop. It stays on the diagonal and keeps pressure on the f3-knight. [%cal Gh5f3]}
9. O-O Bd6 {Offer the trade of dark-squared bishops. [%cal Gd6f4]}
10. Bxd6 Qxd6 {The queen takes back. Your pieces are all out.}
11. Nbd2 O-O {Castle. Later you can swap the light-squared bishops with ...Bg6. The position is equal and easy to play.}
12. Qe2 {White lines up the queen. You continue with ...Ne7 and ...Bg6, a very comfortable plan.}
)
(7. Qc2 {The queen also steps out of the way and lines up with the bishop on d3 against h7.}
7... e6 {Solid. It supports d5 and frees your other bishop. [%cal Ge6d5]}
8. Nd2 {White prepares Ngf3.}
8... Bd6 {Swap off the bishop that sits on the b8-h2 diagonal. [%cal Gd6f4]}
9. Bxd6 Qxd6 {Take back with the queen. Your king is next.}
10. h3 Bh5 {Do not give the bishop away for free. It stays on the diagonal.}
11. Ngf3 O-O {Castle. Your plan: ...Rfc8, ...Rab8 and ...Bg6 to swap bishops.}
12. O-O {White castles too. Now you are ready for the middlegame with an easy plan and no weaknesses.}
)
(7. Ne2 {The knight blocks the bishop's attack on the queen.}
7... e6 {Now it is safe to play the pawn. It supports d5 and frees your other bishop. [%cal Ge6d5]}
8. O-O Bd6 {Offer to swap the dark-squared bishops. [%cal Gd6f4]}
9. Bxd6 Qxd6 {The queen takes back. You are almost developed.}
10. h3 Bh5 {Keep the bishop on its diagonal.}
11. Nd2 O-O {Castle. Next you can play ...Bg6 to swap off the white bishop on d3.}
12. Re1 {White brings a rook to the e-file. You answer with ...Rfe8 and ...Bg6, a calm and equal game.}
)
(7. Nd2? {A mistake. White forgot about your bishop: nothing protects the queen from it.}
7... Bxd1 {You win the queen for a bishop. That is a huge gain. [%cal Gg4d1]}
8. Rxd1 {White takes back with the rook.}
(8. Kxd1 {White takes back with the king.}
8... e6 {You are a queen up for a bishop. Do not get fancy: finish your development and trade pieces.}
9. Ngf3 {White develops, but White is a long way behind. Play ...Be7 and castle, and trade pieces.}
)
8... e6 {You are a queen up for a bishop. Do not get fancy: finish your development and trade pieces.}
9. Ngf3 {White develops, but White is a long way behind. Play ...Be7 and castle, and trade pieces.}
)
7... Qd7 {Guard the b7-pawn with the queen. The queen also protects your bishop on g4. [%cal Gd7b7,Gd7g4]}
8. Nd2 {White develops and prepares Ngf3.}
(8. h3 {White asks your bishop what it wants to do.}
8... Bh5 {Keep the bishop on the diagonal. You can swap it later with ...Bg6.}
9. Nd2 e6 {Same plan as in the main line: now the pawn move is safe.}
10. Ngf3 Bd6 {Offer the trade of dark-squared bishops. You reach the same set-up as in the main line.}
11. Bxd6 {White takes. You retake with the queen and castle, exactly as in the main line.}
11... Qxd6 {The queen takes back and you are almost fully developed.}
12. O-O O-O {Castle. A solid and equal position.}
13. Rfe1 {White uses the open file. Your plan is the same: ...Qc7 and ...Rac8.}
)
8... e6 {Now the pawn move. Your bishop is out, so nothing gets locked in. It supports d5 and frees your dark-squared bishop. [%cal Ge6d5,Gf8d6]}
9. Ngf3 {White develops the second knight.}
9... Bd6 {Offer a trade of dark-squared bishops. [%cal Gd6f4]}
10. Bxd6 Qxd6 {Take back with the queen. All your pieces are out except the rooks.}
11. h3 {White asks your bishop to make up its mind.}
11... Bh5 {Keep the bishop. It still pins down the f3-knight. You can swap it later with ...Bg6.}
12. O-O O-O {Castle. A solid and equal position with an easy plan: ...Qc7, ...Rac8, ...Bg6.}
13. Rfe1 {White puts a rook on the e-file. You answer with ...Qc7 and ...Rac8, and you can swap bishops with ...Bg6.}
`,
    },
    {
      id: 'exchange-others',
      title: 'Exchange Variation: Nf3, Nc3, Bf4 and Bb5+',
      summary: 'Same Exchange Variation, but White develops in another order or tries a small trick (a bishop check or a knight jump). The plan stays the same: knights out, bishop to g4, then ...e6.',
      difficulty: 1,
      pgn: `
1. e4 c6 {You start the Caro-Kann. The c-pawn supports a future ...d5. [%cal Gc6d5]}
2. d4 d5 {Hit the e4-pawn. Your d5-pawn is protected by the c6-pawn. [%cal Gd5e4]}
3. exd5 cxd5 {White swapped pawns. Take back with the c-pawn so you keep a pawn in the centre.}
4. Nf3 {White develops the knight first and keeps the bishops flexible.}
(4. Bf4 {White puts the bishop outside the pawn chain before playing anything else.}
4... Nc6 {Develop a knight and hit d4. [%cal Gc6d4]}
5. c3 {A pawn now protects d4.}
5... Nf6 {The second knight guards d5 and eyes e4. [%cal Gf6d5]}
6. Nf3 {White develops the knight.}
6... Bg4 {Your light-squared bishop comes out before ...e6, and it pins down the knight that guards d4. [%cal Gg4f3]}
7. Nbd2 {White adds a defender to f3.}
(7. Qb3 {The queen attacks b7.}
7... Qc8 {Defend b7. Notice that ...Qd7 would be a mistake here: White's knight would jump to e5 with a double attack. The queen on c8 also keeps your bishop on g4 protected. [%cal Gc8b7,Gc8g4]}
8. Nbd2 e6 {Now your pawn can support d5 and the bishop is safely outside.}
9. Bd3 Bh5 {Keep the bishop. You can swap it for the white bishop later with ...Bg6.}
10. O-O Be7 {Develop your last piece and get ready to castle. Equal and healthy.}
11. Ne5 {White jumps into the centre. You can trade it with ...Nxe5, then castle. You are fine.}
)
(7. h3 {White asks the bishop what it wants to do.}
7... Bxf3 {Take on f3. The bishop cannot go back safely, so trade it for the knight. [%cal Gg4f3]}
8. Qxf3 e6 {Now ...e6 supports d5 and frees your other bishop.}
9. Nd2 Bd6 {Offer a trade of the dark-squared bishops. [%cal Gd6f4]}
10. Bd3 O-O {Castle. You have a solid position and no weaknesses.}
11. Bg5 {White pins your knight. Answer with ...h6 and you can follow with ...e5. Everything is fine.}
)
7... e6 {Support the d5-pawn and open the way for your other bishop. [%cal Ge6d5,Gf8d6]}
8. Qb3 {White attacks b7 again.}
8... Qc8 {Guard b7 and keep the bishop on g4 protected. [%cal Gc8b7]}
9. Bd3 Be7 {Develop the last bishop and get ready to castle. You have a healthy, equal position.}
10. h3 {White asks the bishop again. Retreat with ...Bh5 and keep an eye on g4. Castle soon.}
)
(4. Nc3 {White develops the knight and puts pressure on your d5-pawn.}
4... Nc6 {Develop and hit d4. [%cal Gc6d4]}
5. Nf3 {White develops again.}
(5. Bf4 {The bishop eyes c7. White now threatens Nb5, with a fork on c7.}
5... a6 {A useful little move: it takes the b5-square away from the knight, so Nb5 and Nc7 are gone. [%cal Ra6b5]}
6. Nf3 Bg4 {Bishop out before ...e6, and it attacks the knight.}
7. Be2 e6 {Support d5 and free your dark-squared bishop.}
8. Ne5 Bxe2 {Swap off the bishop before White can use it.}
9. Nxe2 Nxe5 {Take the knight before it can jump anywhere.} 10. Bxe5 Ne7 {Everything is protected and you are fine. You will castle and play ...Nf5 or ...f6 to hit the bishop.}
11. c3 {White supports d4. Castle and play ...Nf5, a very comfortable game.}
)
5... Bg4 {Bishop out before ...e6. It attacks the knight on f3. [%cal Gg4f3]}
6. h3 {White asks the bishop what it wants to do.}
6... Bxf3 {Take it. If the bishop goes back, White plays g4 and takes space with tempo. So trade it for the knight. [%cal Gg4f3]}
7. Qxf3 e6 {Support d5. Your pawn on d5 is attacked twice (by the knight and the queen), and now it is guarded enough.}
8. Be3 Nf6 {Develop the second knight. It adds one more guard to d5. [%cal Gf6d5]}
9. Bd3 Bb4 {Pin the knight on c3. That takes pressure off d5 and gets your bishop active. [%cal Gb4c3]}
10. O-O O-O {Castle. You are solid and the position is equal.}
11. a3 {White asks the bishop. Trade it with ...Bxc3 or keep it with ...Ba5. Either way you are fine.}
)
(4. Bb5+ {White gives a check to gain a move.}
4... Bd7 {Block with the bishop. Never block with the queen: ...Qd7? loses her for a bishop after Bxd7+. [%cal Gc8d7]}
5. Bxd7+ {White swaps off bishops.}
(5. Be2 {White retreats. You lost nothing.}
5... Nc6 {Develop and hit d4. [%cal Gc6d4]}
6. Nf3 Nf6 {The second knight guards d5.} 7. O-O Bg4 {Now the bishop comes out to g4 and pins down the knight.}
8. c3 e6 {Support d5. Everything is solid and equal.}
9. Bf4 {White develops the last bishop. You play ...Bd6 and castle. Level and easy to play.}
)
5... Qxd7 {Take back with the queen. She is safe on d7 and the knights stay free to choose their best squares.}
6. Nf3 Nc6 {Develop a knight and hit d4. [%cal Gc6d4]}
7. O-O Nf6 {The second knight guards d5. [%cal Gf6d5]}
8. c3 e6 {Support d5 and free your dark-squared bishop. [%cal Ge6d5,Gf8d6]}
9. Bf4 Bd6 {Offer a trade of the dark-squared bishops. [%cal Gd6f4]}
10. Bxd6 Qxd6 {Take back with the queen. All your pieces are out, and you are a move from castling. Equal and easy to play.}
11. Nbd2 O-O {Castle. Your plan: ...Rfc8 or ...Rac8 and a calm game.}
12. Nb3 {White heads for the c5-square. You answer with ...Nd7, covering it. The game is equal.}
)
4... Nc6 {Develop a knight and hit d4. [%cal Gc6d4]}
5. c3 {White protects d4 with a pawn.}
(5. Bb5 {The bishop pins your knight against the king and hits the piece that guards d4.}
5... Bd7 {Unpin by blocking with the bishop. [%cal Gc8d7]}
6. Bxc6 Bxc6 {Take back with the bishop. You keep both bishops pointing at the centre.}
7. O-O e6 {Support d5 and open the way for your dark-squared bishop.}
8. Ne5 Bd6 {Hit the knight and develop. [%cal Gd6e5]}
9. Bf4 Ne7 {Support the bishop on c6 and get ready to castle.}
10. Nxc6 Nxc6 {Take back with the knight. It is a fine square and hits d4.} 11. Bxd6 Qxd6 {A simple, equal position. You can castle and play ...Rac8 or ...Rfd8.}
12. c3 {White supports the centre. You castle and then play ...Rac8 or ...Rfd8. The game is level and calm.}
)
5... Nf6 {Develop the second knight. It guards d5 and eyes e4. [%cal Gf6d5]}
6. Bd3 {The bishop develops and points at your kingside.}
6... Bg4 {Bishop out before ...e6. It attacks the knight on f3. [%cal Gg4f3]}
7. O-O e6 {Support d5 and open the road for your dark-squared bishop. [%cal Ge6d5,Gf8d6]}
8. Bf4 Bd6 {Offer a trade of the dark-squared bishops. [%cal Gd6f4]}
9. Bxd6 Qxd6 {Take back with the queen. You are almost fully developed.}
10. Re1 O-O {Castle. You have a solid, equal position. Your plan: ...Rac8 and perhaps ...Bf5 to swap the light-squared bishops.}
11. Nbd2 {White finishes developing. You continue with ...Ne7 and ...Bf5 or ...Bg6, a very comfortable game.}
`,
    },
    {
      id: 'advance-short',
      title: 'Advance Variation: White plays Nf3 (the "Short" line)',
      summary: 'White pushes the pawn to e5 and develops with Nf3 and Be2. You develop your bishop first, close the door with ...e6, and attack White\'s centre with ...c5.',
      difficulty: 2,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5 and will guard that pawn. [%cal Gc6d5]}
2. d4 {White builds a big centre.}
2... d5 {You challenge the centre straight away. [%cal Gd5e4]}
3. e5 {White pushes the pawn forward. This is the Advance Variation. White gains space, but the pawn on e5 can become a target later.}
3... Bf5 {This is the key idea of the whole variation. Bring your light-squared bishop out NOW, outside your pawn chain. After ...e6 it would be shut in behind its own pawns. [%cal Gc8f5]}
4. Nf3 {White develops the knight. This is the most natural move.}
4... e6 {Now you can close the door behind the bishop. The e6-pawn supports d5, and your bishop stays active on f5. [%cal Ge6d5]}
5. Be2 {White develops the bishop and gets ready to castle.}
(5. c3 {White supports the d4-pawn.}
5... c5 {Still the right idea. You attack the pawn that holds White's centre together. [%cal Gc5d4]}
6. Bd3 {White offers to swap bishops.}
(6. Be2 {White develops quietly.}
6... Nc6 {Another attacker joins the fight against d4. [%cal Gc6d4]}
7. O-O cxd4 {Take on d4 to open the position and pull the c3-pawn away.}
8. cxd4 Nge7 {The knight heads for f5 or g6 and protects your bishop.}
9. Be3 Bg4 {Pin down the knight on f3 and get ready to swap bishops. [%cal Gg4f3]}
10. Nh4 Bxe2 {Swap the bishops before White can trap yours with g4.}
11. Qxe2 Ng6 {Hit the knight on h4. [%cal Gg6h4]}
12. Nxg6 hxg6 {Take back with the h-pawn. Your pawns are a little doubled, but you get a half-open h-file and a solid position.}
13. Nd2 Be7 {Develop your last piece. You are ready to castle.}
14. Nf3 {White heads for the centre. You can castle and play ...Qb6 or ...Rc8. A balanced game.}
)
6... Bxd3 {Take it. Trading White's good bishop makes your game easier.}
7. Qxd3 Nc6 {Another attacker on d4. [%cal Gc6d4]}
8. O-O Rc8 {Use the open c-file once the pawns come off. The rook also protects the knight.}
9. Be3 cxd4 {Time to take. This opens the c-file for your rook.}
10. cxd4 Nge7 {The knight comes out and heads for f5.}
11. Nc3 Nf5 {A great square. The knight attacks the bishop on e3 and nothing can drive it away easily. [%cal Gf5e3]}
12. Bd2 {White steps back. You are comfortable: you can continue with ...Be7 and ...O-O.}
)
(5. Bd3 {White offers to swap bishops.}
5... Bxd3 {Take it. Swapping White's good bishop makes your game easier.}
6. Qxd3 c5 {Now hit d4 as usual. [%cal Gc5d4]}
7. c3 {White protects d4.}
7... Nc6 {Pile up on d4. [%cal Gc6d4]}
8. O-O Rc8 {Get the rook onto the c-file where the action will happen.}
9. Nbd2 {White develops. You continue with ...h6 and ...Nge7. A normal, balanced game.}
)
(5. Nh4? {This looks clever because it attacks your bishop, but it loses a piece. [%cal Rh4f5]}
5... Qxh4 {Your queen looks along the diagonal to h4, so she simply takes the knight. [%cal Gd8h4]}
6. Be2 Qd8 {The queen goes home. You are a whole piece up.}
7. O-O {White castles, but White is a piece down. Develop calmly with ...Be7 and ...Nd7 and trade pieces.}
)
5... c5 {The key break. White's chain is e5 and d4, and its base is the d4-pawn. Strike at the base with ...c5. [%cal Gc6c5,Gc5d4]}
6. Be3 {White protects d4 and develops.}
(6. O-O {White castles first.}
6... Nc6 {Another attacker on d4. [%cal Gc6d4]}
7. Be3 cxd4 {Take on d4. White's knight must retake, and then the pawn on e5 has lost a defender.}
8. Nxd4 Nge7 {Protect the bishop on f5 and get the knight to a useful square.}
9. Nxc6?! {This gives away the best knight for nothing. It lets you win the e5-pawn.}
9... Nxc6 {Take the knight. Now the pawn on e5 is only guarded by the d4 pawn that is gone. [%cal Gc6e5]}
10. Nd2 Nxe5 {Win the pawn. It was loose.}
11. Bb5+ Nc6 {Block the check with the knight.}
12. Nf3 a6 {Ask the bishop a question. [%cal Ga6b5]}
13. Bxc6+ bxc6 {Take back. You have two bishops and an extra pawn.}
14. c4 {White tries to open the centre. You answer with ...Qd7 or ...Be7 and keep your extra pawn.}
)
(6. c3 {White protects d4 with a pawn.}
6... Nc6 {Another attacker on d4. [%cal Gc6d4]}
7. O-O cxd4 {Take on d4.}
8. cxd4 Nge7 {The knight protects the bishop and heads for g6 or f5.}
9. Be3 Bg4 {Pin the knight on f3 and get ready to swap bishops. [%cal Gg4f3]}
10. Nh4 Bxe2 {Swap bishops before White traps yours with g4.}
11. Qxe2 Ng6 {Hit the knight on h4. [%cal Gg6h4]}
12. Nxg6 hxg6 {Take back with the h-pawn. You get a half-open h-file and a solid position.}
13. Nd2 Be7 {Develop. You can castle next.}
14. Nf3 {White heads for the centre. You are fine. Castle and play ...Qb6 or ...Rc8.}
)
(6. dxc5?! {White takes first. But this gives up the pawn that was holding up e5, and it hands you the initiative.}
6... Bxc5 {Take back with the bishop. It is a strong piece on c5, and White's e5-pawn has lost its support.}
7. c4 {White attacks d5.}
7... Ne7 {Protect d5 and prepare to castle. [%cal Ge7d5]}
8. O-O Nbc6 {Develop the last knight.}
9. Nc3 dxc4 {Take on c4. White's centre is now gone and your bishops are active.}
10. Qa4 Bb4 {Pin the knight on c3. [%cal Gb4c3]}
11. Bxc4 O-O {Castle. Your king is safe and your pieces are active.}
12. Rd1 {White puts the rook on the d-file. You are fine: you have comfortable play with ...Qc7 and ...Rfd8.}
)
6... cxd4 {Take on d4. After White retakes, the knight leaves f3 and the e5-pawn has no friends left. [%cal Gc5d4]}
7. Nxd4 {White retakes and attacks your bishop. [%cal Rd4f5]}
7... Ne7 {The best answer. The knight protects the bishop, so Nxf5 is no problem. It also stays flexible. [%cal Ge7f5]}
8. O-O {White castles.}
(8. c4 {White hits d5.}
8... Nbc6 {Develop and hit d4. [%cal Gc6d4]}
9. Qa4 {The queen pins the c6-knight to your king.}
9... dxc4 {Take the pawn. White's centre is now gone.}
10. Nd2 Qa5 {Offer a queen swap. That helps you, since your pieces are well placed. [%cal Ga5a4]}
11. Qxa5 Nxa5 {Take back with the knight. It attacks the c4-pawn too.}
12. Nxc4 Nxc4 {Trade the knights.}
13. Bxc4 a6 {A calm move that keeps White's bishop and knight out of b5.}
14. O-O {White castles. You can play ...Be4 and ...Nc6. You have the bishop pair and an easy game.}
)
(8. Nd2 {White develops the knight and wants to play Ngf3.}
8... Nbc6 {Develop and hit d4. [%cal Gc6d4]}
9. N2f3 Bg4 {Pin the knight and prepare to swap bishops for a knight. [%cal Gg4f3]}
10. O-O Bxf3 {Take it. The knight was guarding the centre.}
11. Nxf3 Ng6 {Give the knight a better home. It heads for e5 and h4 later.}
12. c4 dxc4 {Take the pawn.}
13. Bxc4 Be7 {Develop. You will castle next.}
14. Rc1 {White uses the open file. You castle and play ...Qb6 or ...Rc8. A level game.}
)
8... Nbc6 {Develop the last knight. It attacks both d4 and e5. [%cal Gc6d4,Gc6e5]}
9. Bb5 {The bishop attacks your knight on c6.}
(9. Nxf5?! {This swaps your bishop, but it gives up the pressure on e5.}
9... Nxf5 {Take back. Now e5 is weak.}
10. Bf4 g5 {Attack the bishop and win time. [%cal Gg5f4]}
11. Bd2 Bg7 {The bishop hits e5 and the whole long diagonal. [%cal Gg7e5]}
12. Bd3 Nxe5 {Win the pawn.}
13. Bxf5 exf5 {Take back. You are a clean pawn up.}
14. Be3 {White develops, but you are a pawn up and have the better structure. Castle with ...O-O and play ...Nc4 or ...Qd7.}
)
9... a6 {Ask the bishop a question. [%cal Ga6b5]}
10. Bxc6+ {White swaps off the knight.}
10... bxc6 {Take back with the pawn. You have two bishops, a strong centre and a half-open b-file. [%cal Gb7c6]}
11. c4 {White attacks d5.}
11... c5 {Hit the knight on d4 and keep the centre solid. [%cal Gc6c5,Gc5d4]}
12. Nxf5 Nxf5 {Swap pieces. Your knight on f5 is strong.}
13. cxd5 Qxd5 {Take back with the queen. Your queen is active and your pawns are healthy.}
14. Qa4+ {White checks. Step aside with ...Qd7 and you are fine. You have the bishop pair and an active game.}
`,
    },
    {
      id: 'advance-others',
      title: 'Advance Variation: Bd3, c3 and Be3 on move 4',
      summary: 'White pushes e5 and then develops in a different way: offering a bishop swap with Bd3, supporting the centre with c3, or putting the bishop on e3. The same plan works: ...e6 and ...c5.',
      difficulty: 2,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5. [%cal Gc6d5]}
2. d4 {White builds a big centre.}
2... d5 {You challenge the centre. [%cal Gd5e4]}
3. e5 {White advances and gains space.}
3... Bf5 {The key idea: develop the light-squared bishop BEFORE you play ...e6. [%cal Gc8f5]}
4. Bd3 {White offers to swap bishops.}
(4. c3 {White supports the d4-pawn and gives the queen the d1-a4 diagonal.}
4... e6 {Close the door behind the bishop. The pawn also supports d5. [%cal Ge6d5]}
5. Nf3 c5 {The usual break. You attack the pawn that holds White's centre together. [%cal Gc5d4]}
6. Be2 Nc6 {Another attacker on d4. [%cal Gc6d4]}
7. O-O cxd4 {Take on d4 and open the position for your pieces.}
8. cxd4 Nge7 {The knight protects your bishop and heads for g6 or f5.}
9. Nc3 Bg4 {Pin the knight on f3 and get ready to swap bishops. [%cal Gg4f3]}
10. Nh4 Bxe2 {Swap the bishops before White traps yours with a pawn push.}
11. Nxe2 Ng6 {Attack the knight on h4. [%cal Gg6h4]}
12. Nf3 Be7 {Develop your last piece. You are about to castle.}
13. g3 O-O {Castle. The position is balanced. Your plan: ...f6 to challenge the e5-pawn, or ...Rc8 to use the open c-file.}
14. Kg2 {White tucks the king away. You continue with ...f6 or ...Rc8 and have a comfortable game.}
)
(4. Be3 {White develops the bishop. It protects d4 but blocks the c1-h6 diagonal.}
4... Qb6 {Hit b2 and d4 at the same time. White's b2-pawn is not protected now that the bishop has left c1. [%cal Gb6b2,Gb6d4]}
5. Qc1 {White protects b2.}
5... e6 {Now close the bishop's door and support d5. [%cal Ge6d5]}
6. Nf3 {White develops.}
(6. Nd2 {White keeps the f3-square for the other knight.}
6... c5 {Strike at d4 as usual. [%cal Gc5d4]}
7. Ngf3 Nc6 {Another attacker on d4. [%cal Gc6d4]}
8. c3 cxd4 {Take on d4.}
9. Nxd4 Nxd4 {Swap the knights.}
10. Bxd4 Bc5 {Trade the dark-squared bishops, which also hits the white bishop. [%cal Gc5d4]}
11. Nb3 Bxd4 {Take it. White's good bishop disappears.}
12. cxd4 {White retakes. You continue with ...f6 or ...Ne7, hitting the e5-pawn. A fine game.}
)
6... c5 {Strike at the base of White's chain. [%cal Gc5d4]}
7. c3 Nc6 {Pile up on d4. [%cal Gc6d4]}
8. Nbd2 cxd4 {Take on d4.}
9. Nxd4 Nxd4 {Swap knights.}
10. Bxd4 Bc5 {Offer to swap the dark-squared bishops. [%cal Gc5d4]}
11. Bxc5 Qxc5 {Take back with the queen. It is a strong square for her.}
12. Nb3 {White hits the queen. You move her and keep a comfortable game; the e5-pawn is a target for ...f6.}
)
4... Bxd3 {Take it. White's good bishop disappears and your game becomes easier.}
5. Qxd3 e6 {Now close the bishop's door and support d5. [%cal Ge6d5]}
6. Nf3 c5 {The standard break. Attack the base of White's pawn chain. [%cal Gc5d4]}
7. dxc5 {White takes the pawn at once.}
(7. O-O {White castles.}
7... cxd4 {Take on d4.}
8. Nxd4 Ne7 {The knight heads for f5 or c6 and protects d5.}
9. Be3 Nbc6 {Develop the last knight. It hits d4 and e5. [%cal Gc6d4,Gc6e5]}
10. f4 h5 {Take the g4-square away and keep White's kingside in check. [%cal Gh5g4]}
11. c3 Nxd4 {Swap knights.}
12. Bxd4 a6 {Stop the white pieces from using b5. You are fine and can play ...Nf5 or ...Rc8.}
13. Na3 {White heads for c2. You play ...g6 and ...Nf5, a comfortable game.}
)
(7. c3 Nc6 {Another attacker on d4. [%cal Gc6d4]}
8. O-O Rc8 {The c-file will open soon. The rook also protects the knight.}
9. Be3 cxd4 {Time to take. This opens the c-file for your rook.}
10. cxd4 Nge7 {The knight comes out and heads for f5.}
11. Nc3 Nf5 {A great square. The knight attacks the bishop on e3. [%cal Gf5e3]}
12. Bd2 {White steps back. You continue with ...Be7 and ...O-O. A comfortable game.}
)
7... Bxc5 {Take back with the bishop. It is strong on c5, and the e5-pawn has lost its support. [%cal Gf8c5]}
8. c4 {White hits the d5-pawn.}
8... Ne7 {Protect d5 and get ready to castle. [%cal Ge7d5]}
9. O-O Nbc6 {Develop the last knight.}
10. Nc3 Bb4 {Pin the knight on c3. This eases the pressure on d5. [%cal Gb4c3]}
11. Rd1 {White puts the rook on the d-file. You are comfortable: castle and play ...Bxc3 and ...Qc7.}
`,
    },
    {
      id: 'advance-nc3',
      title: 'Advance Variation: White plays Nc3 (and the g4 pawn push)',
      summary: 'White pushes e5 and develops the knight to c3. If White follows up with g4 the game becomes sharp. You keep the bishop safe on g6, strike with ...c5 and use ...h5 to break up White\'s kingside pawns.',
      difficulty: 3,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5. [%cal Gc6d5]}
2. d4 {White builds a big centre.}
2... d5 {You challenge the centre. [%cal Gd5e4]}
3. e5 {White advances and gains space.}
3... Bf5 {Develop the light-squared bishop BEFORE you play ...e6. [%cal Gc8f5]}
4. Nc3 {White develops a knight. It prepares g4, which would try to trap or chase your bishop.}
4... e6 {Close the door behind the bishop and support d5. [%cal Ge6d5]}
5. g4 {White attacks your bishop with a pawn. This is the sharpest move.}
(5. Nf3 {A calm developing move.}
5... c5 {The usual break. Attack the base of White's pawn chain. [%cal Gc5d4]}
6. Be2 Nc6 {Another attacker on d4. [%cal Gc6d4]}
7. O-O a6 {A useful waiting move. It stops Nb5 and Bb5, and prepares ...b5 or ...c4 later.}
8. Be3 cxd4 {Take on d4. The knight on f3 must retake, and e5 loses a defender.}
9. Nxd4 Nge7 {The knight protects the bishop on f5 and heads for g6 or f5 later.}
10. g4 Bg6 {Retreat. The bishop is safe on g6 and still eyes the long diagonal.}
11. f4 {White pushes the pawns forward. They are strong, but they also leave holes behind them.}
)
(5. Be3 {White develops the bishop and keeps the pawn on g2 for now.}
5... Ne7 {The knight prepares to go to f5 or g6 and supports the bishop. [%cal Ge7f5]}
6. Be2 h5 {Stop g4 once and for all. The h5-pawn also gives your bishop the h7-square. [%cal Gh5g4]}
7. h3 Bg6 {Retreat to a safe square, where the bishop still stands well.}
8. Nf3 Nf5 {The knight attacks the bishop on e3 and is very hard to chase away. [%cal Gf5e3]}
9. Bg5 Be7 {Offer a swap that helps you. You also get ready to castle.}
10. Bxe7 Qxe7 {The queen takes back and eyes the kingside and the e5-pawn.}
11. Bd3 {White swaps your good bishop, but you are fine. Castle and play ...Nd7 and ...c5, a balanced game.}
)
(5. Bd3 {White offers to swap bishops.}
5... Bxd3 {Take it. The swap helps you.}
6. Qxd3 c5 {The usual break. Attack the base of White's pawn chain. [%cal Gc5d4]}
7. Nce2 cxd4 {Take on d4.}
8. Nxd4 Bc5 {Develop with tempo: the bishop attacks the knight. [%cal Gc5d4]}
9. Nb3 Qb6 {The queen eyes b2 and adds more pressure.}
10. Nxc5 Qxc5 {Take back with the queen, which is well placed on c5.}
11. Nf3 Ne7 {Develop and get ready to castle. The knight can go to f5 or g6 later.}
12. O-O {White castles. You are fine: castle, play ...Nd7 and ...Nf5. A level game.}
)
(5. h4 {White takes space on the kingside.}
5... h5 {Stop the pawn in its tracks. Now g4 is not so easy for White. [%cal Gh5g4]}
6. Bd3 Bxd3 {Swap the bishops.}
7. Qxd3 Qb6 {Attack b2 and d4 together. [%cal Gb6b2,Gb6d4]}
8. Nf3 Qa6 {Offer a queen swap. Your queen is also well placed on a6, where she hits the d3-queen.}
9. Qd1 Bb4 {Pin the knight on c3 and prepare to trade it.}
10. Bd2 Bxc3 {Take the knight. It was guarding the centre.}
11. Bxc3 Nd7 {Develop the last piece. You are about to castle with a comfortable position.}
12. Bb4 {White hits the a-pawn. You answer with ...Rc8 and have a level game.}
)
5... Bg6 {Retreat the bishop to its safe square. White has weakened the kingside by pushing the g-pawn. [%cal Gf5g6]}
6. Nge2 {White develops the knight. It supports the knight on c3 and prepares Nf4.}
6... c5 {Strike at the base of White's chain. [%cal Gc5d4]}
7. h4 {White threatens h5, trapping your bishop.}
(7. Be3 {White protects d4 with the bishop, but it is not a very active square.}
7... Nc6 {Another attacker on d4. [%cal Gc6d4]}
8. dxc5 h5 {Hit the g4-pawn. If White takes, the h-file opens for your rook. [%cal Gh5g4]}
9. Nd4 hxg4 {Take the pawn.}
10. Bb5 Ne7 {Defend your knight and prepare to bring it to f5.}
11. Qxg4 Bh5 {Hit the queen and keep the bishop alive.}
12. Qg3 a6 {Ask the bishop a question. [%cal Ga6b5]}
13. Bxc6+ Nxc6 {Take back with the knight.}
14. Nxc6 bxc6 {Take with the pawn. You have a healthy position, and the bishop on h5 is active.}
15. f3 {White protects the e4-square. You continue with ...Bg6 and ...Qc7. A level game.}
)
7... cxd4 {Take on d4. After White retakes, the knight on d4 will lose its support.}
8. Nxd4 h5 {The key move. Hit the g4-pawn and keep your bishop's retreat. If White takes on h5, you recapture with the bishop and the h-file opens. [%cal Gh5g4]}
9. Bb5+ {White gives a check to gain time.}
(9. gxh5?! {White takes the pawn, but this opens the h-file for you and gives your bishop a better square.}
9... Bxh5 {Take back with the bishop. It is much more active here than on g6. [%cal Gg6h5]}
10. Bb5+ Nd7 {Block the check with the knight.}
11. Qd3 Ne7 {Protect the bishop and get the knight ready to go to f5 or g6.}
12. Nce2 Qc7 {Hit the e5-pawn and get the queen ready to castle long.}
13. Bxd7+ Kxd7 {Take back with the king. It is safe in the centre because the position is closed.}
14. Be3 {White develops, but you are better: your bishop on h5 is strong and the e5-pawn is weak. Play ...Rc8 or ...Rd8 next.}
)
(9. Bg5 {White attacks your queen with the bishop. [%cal Rg5d8]}
9... Be7 {Block the attack and offer a swap of bishops. [%cal Gf8e7]}
10. Bb5+ Nd7 {Block the check with the knight.}
11. f4 hxg4 {Take the pawn. Your h-rook now looks down the h-file.}
12. Qxg4 Bh5 {Hit the queen and keep the bishop safe.}
13. Qg2 {White steps away. You are fine: castle (or play ...a6) next.}
)
9... Nd7 {Block the check with the knight. It is a useful square for the knight, and your king stays at home.}
10. Bg5 {White attacks your queen. This is the main line.}
10... Be7 {Block the attack on your queen and offer a swap of bishops. [%cal Gf8e7]}
11. f4 {White adds more attackers on the kingside.}
11... hxg4 {Take the pawn. This opens the h-file for your rook. [%cal Gh8h1]}
12. Qxg4 Bxg5 {Take the bishop.}
13. O-O-O {White castles long and is ready to attack with the pieces.}
13... Bxf4+ {Take the pawn with check. Your bishop is safe because the queen covers f4.}
14. Qxf4 a6 {The bishop on b5 pins your knight to the king, so ask it a question. [%cal Ga6b5]}
15. h5 {White tries to open the h-file.}
15... Rxh5 {Take the pawn. The rook on h5 is protected by the bishop on g6.}
16. Rxh5 Bxh5 {Take back with the bishop. White's attack is over and the position is balanced.}
17. Rh1 {White hits the bishop. Retreat it with ...Bg6 and you are fine. This is a sharp line, so practise it in drill mode.}
`,
    },
    {
      id: 'advance-pawn-storms',
      title: 'Advance Variation: the h4 and g4 pawn pushes (and Ne2)',
      summary: 'White pushes e5 and then throws pawns forward (h4, g4) or heads for g3 with the knight, trying to chase your bishop. Keep calm: ...h5 or ...Bg6 keeps your bishop safe and these pawn pushes usually weaken White\'s own king.',
      difficulty: 3,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5. [%cal Gc6d5]}
2. d4 {White builds a big centre.}
2... d5 {You challenge the centre. [%cal Gd5e4]}
3. e5 {White advances and gains space.}
3... Bf5 {Develop the light-squared bishop BEFORE you play ...e6. [%cal Gc8f5]}
4. h4 {The Tal Variation. White wants to play h5 and g4 to trap your bishop on the edge. [%cal Rh4h5]}
(4. g4 {The Bayonet. White attacks your bishop right away with a pawn.}
4... Bg6 {Retreat. The bishop is safe here, and White has weakened the kingside by pushing the g-pawn. [%cal Gf5g6]}
5. h4 {White threatens h5, which would trap the bishop.}
(5. Ne2 {White develops the knight. It heads for f4 to chase the bishop.}
5... e6 {Close the door behind the bishop and support d5. [%cal Ge6d5]}
6. Nbc3 c5 {Strike at the base of White's pawn chain. [%cal Gc5d4]}
7. h4 cxd4 {Take on d4. White's knight must retake.}
8. Nxd4 h5 {Hit the g4-pawn. If it takes, your h-file opens. This is the same position as in the Nc3 chapter, so look there for the details. [%cal Gh5g4]}
9. Bb5+ {White gives a check. You block with ...Nd7, as in the Nc3 chapter.}
)
5... h5 {Stop the h-pawn. Now h5 is impossible, and you can capture on g4 if White opens the file. [%cal Gh5g4]}
6. gxh5 {White takes the pawn.}
6... Bxh5 {Take back with the bishop. It is safe on h5 and looks at the white kingside. [%cal Gg6h5]}
7. Be2 {White offers to swap bishops.}
7... Bxe2 {Take it. Swapping your bishop for White's helps you here.}
8. Qxe2 e6 {Close the door and support d5. All your pieces will get out easily.}
9. Nf3 {White develops. You continue with ...Ne7 and ...Nf5, where the knight is very strong. A comfortable game.}
)
(4. Ne2 {The Bronstein Variation. White wants Ng3 to attack the bishop.}
4... e6 {Close the door behind the bishop and support d5. [%cal Ge6d5]}
5. Ng3 {The knight attacks your bishop.}
5... Bg6 {Retreat to a safe square. [%cal Gf5g6]}
6. h4 {White threatens h5, trapping the bishop.}
6... h5 {Stop the pawn. The bishop stays safe and White's kingside is full of holes. [%cal Gh5g4]}
7. Bd3 {White offers to swap bishops.}
7... Bxd3 {Take it. Swapping bishops helps you.}
8. cxd3 {White retakes with the pawn.}
8... Qb6 {Attack b2 and d4 together. [%cal Gb6b2,Gb6d4]}
9. Ne2 Nh6 {The knight heads for f5, a very good square. It also asks White whether to swap bishops on h6. [%cal Gh6f5]}
10. Bxh6 Rxh6 {Take back with the rook. You still have a healthy structure.}
11. Nd2 {White develops. You continue with ...Nd7, ...Be7 and castling. A balanced game.}
)
4... h5 {Stop the pawn. Now White cannot push h5 and trap your bishop. [%cal Gh5h4]}
5. Bd3 {White offers to swap bishops.}
(5. c4 {White hits d5.}
5... e6 {Support d5 and close the door behind the bishop. [%cal Ge6d5]}
6. Nc3 Be7 {Develop the bishop. It prepares castling and gets out of the way.}
7. Nh3 {White heads for f4.}
7... Nh6 {The knight goes to h6, where it protects the bishop on f5 and stops Ng5. [%cal Gg8h6]}
8. Nf4 g6 {Take the f5 and h5 squares away from the knight.}
9. Qb3 {White hits b7. You answer with ...Qb6 and swap queens if White wants. A balanced game.}
)
(5. Nf3 {White develops the knight.}
5... e6 {Close the door behind the bishop. [%cal Ge6d5]}
6. c4 Be7 {Develop the bishop. It prepares castling.}
7. Bd3 Bxd3 {Swap the bishops.}
8. Qxd3 dxc4 {Take on c4. White's centre is breaking up and you give back nothing.}
9. Qxc4 Nd7 {Develop the knight. The knight can go to b6 to hit the queen, or to h6 and f5.}
10. Qe2 {White steps back. You continue with ...Nb6, ...Nh6 and ...Nf5. A solid game.}
)
5... Bxd3 {Take it. Swapping bishops helps you.}
6. Qxd3 e6 {Now close the door and support d5. [%cal Ge6d5]}
7. Nf3 Qa5+ {Check! This drags a piece away from its natural square. If White blocks with c3 you play ...Qa6 and swap queens. [%cal Ga5e1]}
8. Nbd2 {White blocks with the knight.}
8... Nh6 {The knight heads for f5, where it is very strong. It also stops Ng5. [%cal Gh6f5]}
9. O-O Nf5 {The knight lands on f5. It hits d4 and e3, and White cannot chase it away easily. [%cal Gf5d4]}
10. Re1 Be7 {Develop the bishop. You are about to castle, with a solid and comfortable position.}
11. a4 {White grabs space on the queenside. You can answer with ...a5, or swap queens with ...Qa6. A balanced game.}
`,
    },
    {
      id: 'classical-h4',
      title: 'Classical Variation: White attacks with h4',
      summary: 'After 3.Nc3 (or 3.Nd2) dxe4 4.Nxe4 Bf5 5.Ng3 Bg6, White pushes the h-pawn to chase your bishop. Answer with ...h6 and ...Bh7 and your bishop is safe. This is the most common main line.',
      difficulty: 3,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5. [%cal Gc6d5]}
2. d4 {White builds a big centre.}
2... d5 {You challenge the centre. [%cal Gd5e4]}
3. Nc3 {White defends the e4-pawn with a knight. This is the Classical Variation.}
(3. Nd2 {Same idea, but the knight comes from d2. After the exchange on e4 the position is the same.}
3... dxe4 {Take the pawn.}
4. Nxe4 Bf5 {Same plan as ever: bishop out first, hitting the knight. [%cal Gc8f5]}
5. Ng3 Bg6 {Retreat to g6, where the bishop stays active and safe.}
6. h4 {White threatens h5 to chase your bishop. This is the main line, which is explained in full below.}
)
3... dxe4 {Take the pawn. White has to recapture with the knight, and then your bishop can come out with tempo. [%cal Gd5e4]}
4. Nxe4 Bf5 {Bring the bishop out BEFORE ...e6. It also attacks the knight on e4. [%cal Gc8f5,Gf5e4]}
5. Ng3 {The knight retreats and attacks your bishop.}
5... Bg6 {Retreat to g6. The bishop stays on the long diagonal and is safe from the knight. [%cal Gf5g6]}
6. h4 {White threatens h5, which would trap your bishop. [%cal Rh4h5]}
6... h6 {The key move. Now after h5 the bishop can go to h7. Never play ...Nf6? here, because h5 would win your bishop. [%cal Gh7h6]}
7. Nf3 {White develops the knight.}
7... Nd7 {Develop the knight to d7. This way, if White ever plays Nxf6, you can retake with the other knight and keep your pawns healthy. [%cal Gb8d7]}
8. h5 {White chases the bishop.}
(8. Bd3 {White swaps bishops before pushing the pawn.}
8... Bxd3 {Take it. Your bishop would be hit anyway, so swap it.}
9. Qxd3 e6 {Close the centre and free your dark-squared bishop. [%cal Ge6d5,Gf8d6]}
10. Bf4 Qa5+ {A check that gains time. The queen leaves the d-file and White has to react. [%cal Ga5e1]}
11. Bd2 {White blocks with the bishop. You continue with ...Qc7, ...Ngf6 and castle long.}
)
(8. Bf4 {White develops the bishop first.}
8... Qa5+ {Check! The queen jumps out with tempo.}
9. c3 Ngf6 {Develop the knight. It hits the e4 and d5 squares.}
10. Bd3 Bxd3 {Swap the bishops.}
11. Qxd3 e6 {Close the centre and free your dark-squared bishop.}
12. O-O {White castles. You play ...Be7 and ...O-O. Nice and easy.}
)
(8. Ne5? {The knight jumps into the middle. This is a classic mistake.}
8... Nxe5 {Take the knight. White has to retake with the d-pawn, which weakens the centre.}
9. dxe5 Qa5+ {Check! This wins the e5-pawn. The queen hits the king and the pawn at once. [%cal Ga5e1,Ga5e5]}
10. c3 Qxe5+ {Take the pawn with check.}
11. Be2 e6 {Close the centre and get ready to castle long. You are a pawn up.}
12. Qb3 {White hits b7, but you are fine. Castle with ...O-O-O or play ...Bd6. You are a pawn up.}
)
8... Bh7 {The bishop is safe on h7 and still points at White's pieces. [%cal Gg6h7]}
9. Bd3 {White offers to swap the light-squared bishops.}
(9. c4 {White grabs space and stops ...Nb6 and ...c5 ideas.}
9... e6 {Free the dark-squared bishop and support d5. [%cal Ge6d5]}
10. Bd3 Bb4+ {Check! White has to block it. [%cal Gb4e1]}
11. Kf1 Bxd3+ {Swap the bishops with another check.}
12. Qxd3 Ngf6 {Develop the knight. White can no longer castle, so you are comfortable.}
13. Bf4 {White develops. You can play ...b5 or ...O-O. A comfortable game.}
)
(9. Bf4 {White develops the bishop.}
9... Qa5+ {Check! The queen jumps out with tempo.}
10. c3 Ngf6 {Develop the knight.}
11. Ne5 Nxe5 {Swap off the dangerous knight.}
12. Bxe5 e6 {Close the centre and free your bishop.}
13. Bd3 {White offers a trade of the light-squared bishops. Take it with ...Bxd3 and castle long or short. Equal.}
)
9... Bxd3 {Take it. The swap helps you because White's bishop was the more dangerous piece.}
10. Qxd3 e6 {Close the centre and free your dark-squared bishop. [%cal Ge6d5,Gf8d6]}
11. Bf4 {White develops the bishop and eyes the b8-h2 diagonal.}
(11. Bd2 {White develops the bishop to d2.}
11... Ngf6 {Develop the second knight.}
12. O-O-O Be7 {Develop the bishop and get ready to castle.}
13. Ne4 O-O {Castle. Your king looks safe because White cannot easily open lines.}
14. Nxf6+ Nxf6 {Retake with the knight.}
15. Qe2 {White lines up the queen. You answer with ...Qd5 and you have a very comfortable game.}
)
(11. Ne4 {The knight jumps into the centre.}
11... Ngf6 {Develop the knight and challenge the e4-knight.}
12. Nxf6+ Nxf6 {Take back with the knight. You are well developed.}
13. Bd2 Be7 {Develop the bishop and get ready to castle.}
14. O-O-O c5 {A well-timed central break. You hit d4 and open the position when you are better developed. [%cal Gc6c5,Gc5d4]}
15. Qb5+ Qd7 {Block with the queen and offer a trade. Black is happy to swap queens.}
16. Qxd7+ Nxd7 {Take back with the knight. You have a healthy endgame.}
17. Be3 {White protects d4. You continue with ...cxd4 and equalise easily.}
)
11... Ngf6 {Develop the knight. It hits the h5-pawn, which keeps White busy. [%cal Gf6h5]}
12. O-O-O {White castles long and will aim at your king.}
12... Be7 {Develop the bishop and get ready to castle. [%cal Gf8e7]}
13. Kb1 {White tucks the king away.}
13... O-O {Castle. White has pushed the h-pawn forward, so there is not much attack against your king.}
14. Ne4 {White trades off your defenders.}
14... Nxe4 {Take it.}
15. Qxe4 Nf6 {Hit the queen and develop. The queen has to move.}
16. Qe2 {White retreats the queen. You play ...Qd5 and ...Rfd8 and have a very comfortable game.}
`,
    },
    {
      id: 'classical-quiet',
      title: 'Classical Variation: quieter sixth moves',
      summary: 'The same Classical opening (3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng3 Bg6), but White does not play h4. Instead White develops with Nf3, Bc4 or Bd3, or tries a pawn move like f4. Some of these moves are mistakes you can punish.',
      difficulty: 2,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5. [%cal Gc6d5]}
2. d4 {White builds a big centre.}
2... d5 {You challenge the centre. [%cal Gd5e4]}
3. Nc3 {White defends the e4-pawn with a knight.}
3... dxe4 {Take the pawn. White has to retake with a knight.}
4. Nxe4 Bf5 {Bring the bishop out BEFORE ...e6. It also attacks the knight on e4. [%cal Gc8f5]}
5. Ng3 {The knight retreats and attacks your bishop.}
5... Bg6 {Retreat to g6. The bishop stays on the long diagonal and is safe. [%cal Gf5g6]}
6. Nf3 {White develops the knight.}
(6. Bc4 {White develops the bishop to a strong diagonal, aiming at f7.}
6... e6 {Close the diagonal in front of the f7-pawn and free your dark-squared bishop. [%cal Ge6f7]}
7. Nf3 {White develops.}
(7. N1e2 {White develops the other knight to e2, heading for f4.}
7... Nf6 {Develop the knight. It hits e4 and d5.}
8. O-O Nbd7 {Develop the last knight.}
9. Nf4 Bd6 {Develop the bishop, aiming at the knight.}
10. Nxg6 hxg6 {Take back. You get a half-open h-file and the two bishops are gone.}
11. c3 Qc7 {The queen heads for the kingside, and you can castle long.}
12. Qe2 {White protects the bishop and lines up. You castle long (...O-O-O) and have a comfortable game.}
)
7... Nd7 {Develop the knight. It prepares ...Ngf6 and does not block the dark-squared bishop.}
8. O-O Ngf6 {Develop the second knight.}
9. Re1 Be7 {Develop the bishop and get ready to castle.}
10. Nh4 O-O {Castle. If White takes on g6, you retake with the h-pawn and the h-file belongs to your rook.}
11. Nxg6 hxg6 {Take back. Your king is safe and you have a half-open h-file.}
12. c3 {White supports the centre. You answer with ...c5 and the game is level.}
)
(6. Bd3?! {This blocks the queen, so the d4-pawn is no longer protected.}
6... Qxd4 {Take the free pawn. The white queen is blocked by her own bishop, so she cannot take back. [%cal Gd8d4]}
7. N1e2 {White attacks the queen.}
(7. Bxg6?! {White takes the bishop first. This loses a pawn without a fight, but it is White's most natural try.}
7... Qxd1+ {Swap queens. This keeps your extra pawn.}
8. Kxd1 hxg6 {Take back. You are a clean pawn up with a healthy structure.}
9. Nf3 {White develops. You play ...Nf6 and ...Nbd7, and use your extra pawn.}
)
7... Qd8 {Retreat the queen. The pawn is yours.}
8. Nf4 {The knight eyes your bishop.}
8... Nd7 {Develop the knight.}
9. O-O e6 {Close the diagonal and free your dark-squared bishop. You are a pawn up.}
10. Qe2 {White develops the queen. You continue with ...Ngf6 and ...Bd6. You are a clean pawn up.}
)
(6. f4 {White tries a quick attack with the f-pawn.}
6... e6 {Solid. Support d5 and free your bishop. Do not play ...h6? here: it only helps White, because f5 would then hit your bishop with tempo. [%cal Ge6d5]}
7. Nf3 Nf6 {Develop the knight. It eyes e4 and d5.}
8. Bc4 Be7 {Develop the bishop and get ready to castle.}
9. O-O Nbd7 {Develop the last knight. You are comfortable.}
10. Qe2 {White develops the queen. You can castle and then play ...c5 or ...b5. A level game.}
)
(6. Nh3 {The knight on h3 heads for f4, attacking your bishop.}
6... Nd7 {Develop the knight. The h3-knight would like to go to f4.}
7. Bd3 Bxd3 {Swap the bishops before White can use the knight on f4.}
8. Qxd3 e6 {Close the centre and free your dark-squared bishop.}
9. O-O Ngf6 {Develop the second knight.}
10. c4 {White grabs space. You play ...Bd6 and castle. A level game.}
)
(6. Bf4 {White develops the bishop with the idea Nf3 and h4.}
6... e6 {Close the centre and free your bishop. [%cal Ge6d5]}
7. Nf3 Nf6 {Develop the knight and aim at e4 and d5.}
8. h4 h6 {Stop h5 from trapping the bishop. This is the same trick as in the main line.}
9. h5 Bh7 {The bishop is safe on h7.}
10. Bd3 {White offers to swap bishops. Take it with ...Bxd3 and the position is level.}
)
6... Nd7 {Develop the knight. It prepares ...Ngf6 and keeps your pawns healthy if White ever plays Nxf6+. [%cal Gb8d7]}
7. Bd3 {White offers to swap bishops.}
(7. Ne5? {This knight jump is a classic mistake at club level. You can take it and win a pawn.}
7... Nxe5 {Take it. White can only retake with the pawn.}
8. dxe5 Qa5+ {Check! The queen attacks the king and the e5-pawn at the same time. [%cal Ga5e1,Ga5e5]}
9. c3 Qxe5+ {Take the pawn with check.}
10. Be2 e6 {Close the centre and develop. You are a pawn up.}
11. O-O {White castles. You continue with ...Bd6 and ...Ne7 and keep your extra pawn.}
)
(7. Bf4 {White develops the bishop first.}
7... e6 {Close the centre and free your bishop. [%cal Ge6d5]}
8. h4 h6 {Stop h5 from trapping the bishop.}
9. h5 Bh7 {The bishop is safe on h7.}
10. Bd3 Bxd3 {Swap the bishops.}
11. Qxd3 {White retakes. You continue with ...Ngf6 and ...Be7. A level game.}
)
7... e6 {Close the centre and free your dark-squared bishop. [%cal Ge6d5,Gf8d6]}
8. O-O Ngf6 {Develop the second knight.}
9. Re1 Be7 {Develop the bishop and get ready to castle.}
10. Bxg6 hxg6 {Take back. You get a half-open h-file and keep a solid position.}
11. c4 {White grabs space. You castle, then play ...Qc7 and ...c5 or ...Rfd8. A level game.}
`,
    },
    {
      id: 'fantasy',
      title: 'Fantasy Variation: 3.f3',
      summary: 'White supports the e4-pawn with 3.f3 instead of the usual knight moves. This weakens White\'s king and takes a good square from the knight. You take on e4 and hit the centre with ...e5.',
      difficulty: 2,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5. [%cal Gc6d5]}
2. d4 {White builds a big centre.}
2... d5 {You challenge the centre. [%cal Gd5e4]}
3. f3 {The Fantasy Variation. White protects the e4-pawn with a pawn, but this opens the diagonal e1-h4 next to the white king and takes the f3-square away from the knight.}
3... dxe4 {Take the pawn. (The move ...e6 is also fine, but this is the most direct.) White has to open the f-file by retaking. [%cal Gd5e4]}
4. fxe4 {White retakes. The pawn centre is strong, but the king is a bit exposed.}
4... e5 {Strike at the centre right away. You attack the d4-pawn and open the way for your bishop and queen. [%cal Ge7e5,Ge5d4]}
5. Nf3 {White develops the knight and protects d4.}
(5. dxe5?! {White takes the pawn, but this opens the diagonal for your queen.}
5... Qh4+ {Check! The e1-h4 diagonal is open because of 3.f3. The queen also attacks the e4-pawn. [%cal Gd8h4]}
6. Kd2 {The king has to walk into the middle of the board. White avoids losing a rook, but the king is exposed.}
(6. g3? {Blocking with the pawn loses material.}
6... Qxe4+ {Take the pawn with check.}
7. Qe2 Qxh1 {Now take the rook on h1. The diagonal is open because the g-pawn has left g2. [%cal Ge4h1]}
8. Be3 {White tries to trap the queen, but White is a whole rook down. You are winning.}
)
6... Bg4 {Bring the bishop out. It makes it hard for White to develop the knight to f3. [%cal Gc8g4]}
7. Nf3 {White blocks the queen's diagonal.}
7... Qh5 {Keep the pin on the knight and avoid the trade.}
8. h3 {White asks the bishop what it wants to do.}
8... Nd7 {Develop the knight. It will win back the e5-pawn soon. [%cal Gd7e5]}
9. Bd3 {White develops. You castle long or short after ...Bxf3 and you are better, because the white king is stuck in the middle.}
)
(5. Nc3? {This gives up the d4-pawn.}
5... exd4 {Take the pawn. The knight on c3 is attacked by it, and the knight cannot go to b5 because of ...cxb5. [%cal Ge5d4,Gd4c3]}
6. Nce2 c5 {Defend the d4-pawn. You are a pawn up.}
7. Ng3 Nc6 {Develop. Your pawn on d4 is protected by the c5-pawn and the knight.}
8. Bc4 Nf6 {Develop the second knight. It also attacks the e4-pawn.}
9. Nf3 {White develops. You castle soon and keep the extra pawn.}
)
(5. Bd3?! {White develops the bishop, but now the d4-pawn can be taken.}
5... exd4 {Take the pawn with the pawn. (Taking with the queen also works, but ...exd4 is simpler and safer.)}
6. Nf3 Nf6 {Develop the knight. It attacks the e4-pawn.}
7. O-O Be7 {Develop the bishop and get ready to castle.}
8. e5 {White pushes the pawn to attack your knight.}
8... Ng4 {Jump forward. The knight attacks e5 and h2. [%cal Gg4e5]}
9. Qe2 Be6 {Develop with a purpose: the bishop eyes the a2-g8 diagonal.}
10. Kh1 {White tucks the king away. You continue with ...Nc6 and ...O-O. A level game with an extra d-pawn.}
)
(5. Bc4?! {White develops the bishop and aims at f7.}
5... Qh4+ {Check! The e1-h4 diagonal is open. [%cal Gd8h4]}
6. Kf1 {White blocks with the king, which can no longer castle.}
6... Bg4 {Develop with a pin on the knight. [%cal Gg4d1]}
7. Nf3 {White blocks the queen.}
7... Qh5 {Retreat to h5, keeping the pin.}
8. c3 {White supports d4.}
8... Nd7 {Develop the knight.}
9. h3 Ngf6 {Develop the second knight. White is stuck, and you are better.}
10. Nbd2 {White develops. You continue with ...Bd6 and ...Bxf3. The white king is stuck on f1, so you have the better game.}
)
(5. Be3?! {White develops the bishop to protect d4.}
5... Qh4+ {Check!}
6. Bf2 {The bishop blocks the check.}
6... Qxe4+ {Take the pawn with check.}
7. Qe2 Qxe2+ {Swap queens. You are a pawn up.}
8. Nxe2 Nf6 {Develop with threats on e4 and d5. You are a pawn up.}
9. dxe5 {White takes back a pawn. You play ...Ng4 to hit the bishop, and you get your pawn back.}
)
(5. c3? {This looks solid but it leaves the king open on the e1-h4 diagonal.}
5... Qh4+ {Check! If White blocks with g3, you take on e4 with check and attack the rook on h1. [%cal Gd8h4]}
6. Kd2 {The king walks forward.}
(6. Ke2?! {The king steps forward.}
6... Qxe4+ {Take the pawn with check.}
7. Kf2 Qf5+ {Another check.}
8. Ke1 Nf6 {Develop with a huge advantage. The white king is stuck in the middle.}
9. Bd3 {White develops, but White has lost a pawn and the king cannot hide. You play ...Bd6 and soon win more.}
)
6... Nf6 {Develop and attack the e4-pawn. [%cal Gf6e4]}
7. Nf3 {White attacks your queen.}
7... Qf2+ {Check! The queen is safe on f2 and wins time. [%cal Gh4f2]}
8. Qe2 {White offers a trade.}
8... Nxe4+ {Take the pawn with check.}
9. Kd1 Qxe2+ {Swap queens.}
10. Kxe2 {White retakes. You are a pawn up with a better position. Continue with ...Nd6 or ...exd4 and use your extra pawn.}
)
5... Bg4 {Bring the bishop out now. It pins the knight on f3 to the queen on d1, so the knight cannot move freely. [%cal Gc8g4,Gg4f3]}
6. Bc4 {White develops the bishop and aims at f7.}
(6. Nbd2 {White develops a knight to keep a solid structure.}
6... exd4 {Take the pawn. Your pawn on d4 gains space.}
7. Bd3 Ne7 {Develop the knight and defend the pawn on d4.}
8. h3 Bxf3 {Swap the bishop for the knight, which removes a defender.}
9. Nxf3 Ng6 {Develop the knight to a strong square.}
10. O-O {White castles. You play ...Be7 or ...Nd7 and have a comfortable game, with an extra pawn on d4.}
)
6... Nd7 {Develop the knight. It protects the e5-pawn and keeps the c-pawn free. [%cal Gb8d7]}
7. O-O {White castles.}
7... Ngf6 {Develop the second knight. It attacks the e4-pawn.}
8. h3 {White asks the bishop what it wants to do.}
8... Bxf3 {Take the knight. This removes a defender of the centre and forces the queen to retake.}
9. Qxf3 exd4 {Take the pawn on d4. Now White's e4 pawn is attacked.}
10. Bf4 {White develops and protects the e4-pawn. You play ...Qe7 and ...Ne5, a comfortable game.}
`,
    },
    {
      id: 'two-knights',
      title: 'Two Knights Attack: 2.Nf3 and 2.Nc3',
      summary: 'White develops a knight on move 2 instead of playing d4. You still play ...d5. Then you pin the f3-knight with ...Bg4, or meet 3.e5 with ...Bf5 and 3.exd5 with ...cxd5.',
      difficulty: 1,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5. [%cal Gc6d5]}
2. Nf3 {White develops a knight and waits with d4. (The move order 2.Nc3 d5 3.Nf3 is the same thing.)}
(2. Nc3 {White develops the other knight first.}
2... d5 {Strike at the centre. [%cal Gd5e4]}
3. Nf3 Bg4 {Pin the knight on f3 against the queen. [%cal Gg4f3]}
4. h3 Bxf3 {Take the knight. If the bishop goes back, g4 would chase it.}
5. Qxf3 e6 {Support d5 and free your other bishop. The position is the same as in the main line below.}
6. d4 {White takes the centre. You play ...dxe4 and ...Nf6, as shown below. A comfortable game.}
)
2... d5 {Strike at the centre right away. [%cal Gd5e4]}
3. Nc3 {White develops again and defends e4.}
(3. e5 {White pushes the pawn, as in the Advance Variation.}
3... Bf5 {The same idea as always: bring the bishop out BEFORE ...e6. [%cal Gc8f5]}
4. d4 {White builds the pawn chain. If it continues like this you reach the Advance Short Variation.}
(4. Nh4 {White attacks the bishop with the knight.}
4... Bg6 {Retreat to a safe square. If the knight takes the bishop you take back with the h-pawn and open the h-file. [%cal Gf5g6]}
5. c3 e6 {Close the door and support d5. [%cal Ge6d5]}
6. Nxg6 hxg6 {Take back with the h-pawn. You get a half-open h-file and a solid position.}
7. d4 c5 {Strike at the base of the pawn chain. [%cal Gc5d4]}
8. Bb5+ {White gives a check to gain time. You can block it with ...Nc6 or ...Nd7.}
)
4... e6 {Close the door behind the bishop and support d5. [%cal Ge6d5]}
5. Be2 c5 {The key break against the pawn chain. [%cal Gc5d4]}
6. Be3 {White protects d4. You play ...cxd4 and ...Ne7, as in the Advance Variation chapter.}
)
(3. exd5 {White takes the pawn.}
3... cxd5 {Take back with the c-pawn, as in the Exchange Variation.}
4. d4 {White takes the centre and has a normal Exchange set-up.}
(4. Ne5 {The Apocalypse Attack: the knight jumps to the middle at once.}
4... e6 {A simple, solid answer. It supports d5 and opens the diagonal for your dark-squared bishop. [%cal Ge6d5]}
5. d4 Bd6 {Offer a swap that hits the knight. [%cal Gd6e5]}
6. Bb5+ Bd7 {Block with the bishop.}
7. Nxd7 Nxd7 {Swap the pieces. Take back with the knight.}
8. c3 {White supports d4. You continue with ...a6 and ...Ngf6, a level game.}
)
4... Nc6 {Develop a knight and hit d4. [%cal Gc6d4]}
5. c4 {White hits d5. This is like the Panov Attack.}
5... Nf6 {Defend d5 and develop. [%cal Gf6d5]}
6. Nc3 e6 {Support d5. The position is symmetrical and solid.}
7. cxd5 exd5 {Take back with the pawn. Your structure is simple and your pieces have good squares.}
8. Bb5 Bd6 {Develop the bishop and challenge the pin. [%cal Gf8d6]}
9. O-O O-O {Castle. A balanced game.}
10. Bg5 {White pins your knight. You answer with ...Bg4 and ...Be7 and the game is level.}
)
(3. d3 {White plays a slow, quiet move.}
3... dxe4 {Take the pawn. White has to retake, and the queens may come off.}
4. dxe4 Qxd1+ {Swap queens. You get an easy endgame without weaknesses.}
5. Kxd1 Nf6 {Develop and hit e4.}
6. Nfd2 g6 {Build a fianchetto, where the bishop will aim at the long diagonal.}
7. f3 {White supports e4. You play ...Bg7 and ...O-O or ...Nbd7. A comfortable, equal endgame.}
)
3... Bg4 {Pin the knight on f3 against the queen. Remember: bishop out before ...e6. [%cal Gg4f3]}
4. h3 {White asks the bishop what it wants to do.}
(4. d4 {White takes the centre.}
4... e6 {Support d5 and free your other bishop. [%cal Ge6d5]}
5. h3 Bxf3 {Take the knight before it takes your bishop.}
6. Qxf3 dxe4 {Take the pawn and open the d-file.}
7. Qxe4 Nf6 {Develop and kick the queen away. [%cal Gf6e4]}
8. Qh4 Nbd7 {Develop the last knight. You are comfortable.}
9. Bd3 {White develops. You continue with ...Bd6 and ...O-O. A level game.}
)
(4. d3 {White plays a slow move.}
4... Nf6 {Develop the knight. It guards d5 and eyes e4.}
5. Be2 e6 {Support d5 and free your other bishop.}
6. O-O Be7 {Develop the bishop and get ready to castle.}
7. h3 Bh5 {Keep the bishop. If White plays g4, you go to g6.}
8. Ne5 Bxe2 {Swap the bishops before White can use the knight on e5.}
9. Qxe2 {White retakes. You castle and play ...Nbd7. An equal game.}
)
(4. Ne5? {The knight leaves the f3-square and unblocks your bishop. A big mistake!}
4... Bxd1 {Take the queen! The bishop now attacks d1 directly because the knight no longer blocks the way. [%cal Gg4d1]}
5. Kxd1 e6 {You are a queen for a bishop up. Do not hurry. Develop your pieces and trade.}
6. d4 {White takes the centre, but White has lost the queen. You play ...Nf6 and ...Bd6 and win easily.}
)
4... Bxf3 {Take it. If the bishop goes back, g4 would chase it again, so trade it for the knight. [%cal Gg4f3]}
5. Qxf3 e6 {Support d5 and free your dark-squared bishop. [%cal Ge6d5]}
6. d4 {White takes the centre.}
6... dxe4 {Take the pawn and open the d-file.}
7. Nxe4 {White retakes with the knight.}
(7. Qxe4 {White retakes with the queen.}
7... Nf6 {Develop and kick the queen away. [%cal Gf6e4]}
8. Qh4 Nbd7 {Develop the last knight.}
9. Bd3 {White develops. You play ...Bd6 and ...O-O. A level game.}
)
7... Qxd4 {Take the pawn on d4. You are a pawn up, but be careful: White has a lead in development. [%cal Gd8d4]}
8. c3 {White hits the queen.}
8... Qd5 {Retreat to the centre. The queen hits the e4-knight and the g2-pawn. [%cal Gd5e4]}
9. Bg5 Nd7 {Develop the knight and keep your pieces together. You keep the extra pawn.}
10. Rd1 {White attacks the queen again. Move her away with ...Qf5 and trade queens if you can. You keep the extra pawn.}
`,
    },
  ],
}
