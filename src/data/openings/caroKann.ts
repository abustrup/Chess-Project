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
      text: 'In the Advance Variation your knight belongs on e7. From there it protects the bishop on f5 and can jump to f5 or g6 later. On f5 it presses on the d4-square and on White\'s bishop on e3.',
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
      text: 'In the Classical line, after 6.h4 do NOT play 6...Nf6?, because after 7.h5 your bishop has no good square (your own pawn blocks h7) and you end up clearly worse. First play 6...h6. Then after h5 your bishop retreats to h7 and is perfectly safe.',
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
      text: 'Once your light-squared bishop leaves c8, nothing protects the b7-pawn any more. White\'s queen often goes to b3 to attack it. Answer with ...Qc8, which guards b7 and the bishop on g4 (do not just ignore it). Here ...Qd7 is fine too, but when White has a knight on f3, ...Qd7? lets it jump to e5 and hit your queen.',
      fen: 'r2qkb1r/pp2pppp/2n2n2/3p4/3P1Bb1/1QPB4/PP3PPP/RN2K1NR b KQkq - 4 7',
      arrows: [
        { from: 'b3', to: 'b7', color: 'red' },
        { from: 'd8', to: 'c8', color: 'green' },
      ],
      orientation: 'black',
    },
  ],
  chapters: [
    {
      id: 'exchange-others',
      title: 'Exchange Variation: 3.exd5 cxd5',
      summary:
        'White swaps pawns on d5 and develops with Nf3, Nc3, Bd3, Bf4 or a check on b5, or hits d5 at once with c4 (the Panov). The plan stays the same: knights out, bishop to g4 or f5, then ...e6.',
      difficulty: 1,
      pgn: `
1. e4 {White starts with the king's pawn, the most popular first move.}
1... c6 {You start the Caro-Kann. The c-pawn supports a future ...d5. [%cal Gc6d5]}
2. d4 {White takes the centre with a second pawn.}
2... d5 {Hit the e4-pawn. Your d5-pawn is protected by the c6-pawn. [%cal Gd5e4]}
3. exd5 {White takes. This is the Exchange Variation: White is happy with a quiet game and a simple pawn structure.}
3... cxd5 {White swapped pawns. Take back with the c-pawn so you keep a pawn in the centre.}
4. Nf3 {White develops the knight first and keeps the bishops flexible.}
(4. Nc3 {White develops the knight and puts pressure on your d5-pawn.}
4... Nc6 {Develop and hit d4. [%cal Gc6d4]}
5. Nf3 {White develops again.}
5... Bg4 {Bishop out before ...e6. It attacks the knight on f3. [%cal Gg4f3]}
6. h3 {White asks the bishop what it wants to do.}
6... Bxf3 {Take it. If the bishop goes back, White plays g4 and takes space with tempo. So trade it for the knight. [%cal Gg4f3]}
7. Qxf3
7... e6 {Support d5. Your pawn on d5 is attacked twice (by the knight and the queen), and now it is guarded enough.}
8. Be3
)
(4. Bb5+ {White gives a check to gain a move.}
4... Bd7 {Block with the bishop. Never block with the queen: ...Qd7? loses her for a bishop after Bxd7+. [%cal Gc8d7]}
5. Bxd7+ {White swaps off bishops.}
5... Qxd7 {Take back with the queen. She is safe on d7 and the knights stay free to choose their best squares.}
6. Nf3
6... Nc6 {Develop a knight and hit d4. [%cal Gc6d4]}
7. O-O
7... Nf6 {The second knight guards d5. [%cal Gf6d5]}
8. c3
)
(4. Bd3 {White develops the bishop. It looks at your kingside and helps White to castle soon.}
4... Nc6 {Develop a knight and put pressure on the d4-pawn. Knights usually come out before bishops. [%cal Gc6d4]}
5. c3 {White protects d4 with a pawn, so the centre stays strong.}
5... Nf6 {Develop the second knight. It guards d5 and also watches e4. [%cal Gf6d5]}
6. Bf4 {White's bishop jumps outside the pawn chain. It also prepares ideas with the queen.}
6... Bg4 {This is the key move of the chapter. Your light-squared bishop comes out BEFORE you play ...e6. Right now it attacks White's queen, so White has to react. [%cal Rg4d1]}
7. Qb3 {The queen steps away and attacks the b7-pawn. [%cal Rb3b7]}
7... Qd7 {Guard the b7-pawn with the queen. The queen also protects your bishop on g4. [%cal Gd7b7,Gd7g4]}
8. Nd2 {White develops and prepares Ngf3.}
)
(4. c4 {The Panov Attack. White hits the d5-pawn right away. White wants an open, active game. [%cal Rc4d5]}
4... Nf6 {Develop and defend d5. The knight also eyes the e4-square. [%cal Gf6d5]}
5. Nc3 {White adds one more attacker on d5.}
5... e6 {Support d5 with a pawn and free your dark-squared bishop. This is the solid way to meet the Panov. [%cal Ge6d5]}
6. Nf3 {White develops.}
6... Be7 {Develop the bishop and get ready to castle. The bishop is happy on e7, behind the pawns. [%cal Gf8e7]}
7. cxd5 {White takes on d5. The position will have an isolated queen pawn for White: the d4-pawn will have no neighbours.}
7... Nxd5 {Take back with the knight. It is a great square, and the knight cannot be chased away easily. [%cal Gf6d5]}
8. Bd3 {White develops the bishop.}
)
4... Nc6 {Develop a knight and hit d4. [%cal Gc6d4]}
5. c3 {White protects d4 with a pawn.}
(5. Bb5 {The bishop pins your knight against the king. That knight was the piece putting pressure on d4.}
5... Bd7 {Unpin by blocking with the bishop. [%cal Gc8d7]}
6. Bxc6
6... Bxc6 {Take back with the bishop. You keep both bishops pointing at the centre.}
7. O-O
7... e6 {Support d5 and open the way for your dark-squared bishop.}
8. Ne5
)
5... Nf6 {Develop the second knight. It guards d5 and eyes e4. [%cal Gf6d5]}
6. Bd3 {The bishop develops and points at your kingside.}
6... Bg4 {Bishop out before ...e6. It attacks the knight on f3. [%cal Gg4f3]}
7. O-O
7... e6 {Support d5 and open the road for your dark-squared bishop. [%cal Ge6d5,Gf8d6]}
8. Bf4
`,
    },
    {
      id: 'two-knights',
      title: 'Two Knights Attack: 2.Nf3 and 2.Nc3',
      summary:
        'White develops a knight on move 2 instead of playing d4. You still play ...d5. Then you pin the f3-knight with ...Bg4: after 3.Nc3, and also after 3.e5. Against 3.exd5 you take back with the c-pawn.',
      difficulty: 1,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5. [%cal Gc6d5]}
2. Nf3 {White develops a knight and waits with d4. (The move order 2.Nc3 d5 3.Nf3 is the same thing.)}
(2. Nc3 {White develops the other knight first.}
2... d5 {Strike at the centre. [%cal Gd5e4]}
3. Nf3 {White develops the second knight.}
(3. d4 {White plays d4 after all. This is the normal Caro-Kann with Nc3.}
3... dxe4 {Take the pawn. White takes back with the knight.}
4. Nxe4
4... Bf5 {Bishop out, with tempo on the knight. You are now in the Classical Variation. [%cal Gf5e4]}
5. Ng3 {White chases your bishop. Retreat with ...Bg6 and follow the plan from the Classical chapter.}
)
(3. exd5 {White swaps pawns.}
3... cxd5 {Take back with the c-pawn and keep a pawn in the centre.}
4. d4 {White takes the centre. Now use the Exchange Variation plan: ...Nc6, ...Nf6 and ...Bg4 before ...e6.}
)
3... Bg4 {Pin the knight on f3 against the queen. [%cal Gg4f3]}
4. h3
4... Bxf3 {Take the knight. If the bishop goes back, g4 would chase it.}
5. Qxf3
5... e6 {Support d5 and free your other bishop. The position is the same as in the main line below.}
6. d4 {White takes the centre. This is the same position as in the main line below, so continue with ...dxe4. A comfortable game.}
)
2... d5 {Strike at the centre right away. [%cal Gd5e4]}
3. Nc3 {White develops again and defends e4.}
(3. e5 {White pushes the pawn, as in the Advance Variation.}
3... Bg4 {Against this move order the bishop goes to g4, not f5. It pins the knight on f3 to the queen, and that knight is the piece that will support d4 and e5. At 1000-1300 this scores better than ...Bf5 (56% against 49% in about 830 games, September 2026). [%cal Gc8g4,Rg4d1]}
4. d4 {White builds the pawn chain.}
(4. h3 {White asks the bishop at once.}
4... Bxf3 {Take the knight.}
5. Qxf3
5... e6 {Support d5. Next comes ...c5.}
6. d4 {This is the same position as after 4.d4 e6 5.h3 Bxf3 6.Qxf3 in this chapter. Play ...c5.}
)
(4. Be2 {White develops and breaks the pin before it hurts.}
4... e6 {Support d5 and free your other bishop.}
5. d4 {This is the same position as after 4.d4 e6 5.Be2 in this chapter. Play ...c5.}
)
4... e6 {Close the door behind the bishop and support d5.}
5. h3 {White asks the bishop what it wants to do.}
(5. Be2 {White develops the bishop and breaks the pin.}
5... c5 {The same break as always: hit d4. [%cal Gc7c5,Rc5d4]}
6. c3 {White supports d4. Develop with ...Nc6 next: it adds a second attacker on d4.}
)
5... Bxf3 {Take the knight. White nearly always takes back with the queen, so the queen comes out early.}
6. Qxf3
6... c5 {The key break: attack d4, the base of White's pawn chain. [%cal Gc7c5,Rc5d4]}
7. Bb5+ {White gives a check.}
7... Nc6 {Block with the knight. It also adds a second attacker on d4. [%cal Gc6d4]}
8. c3 {White supports d4. Your plan: ...Qb6, ...Nge7 and ...cxd4, with pressure on the pawn chain.}
)
(3. exd5 {White takes the pawn.}
3... cxd5 {Take back with the c-pawn, as in the Exchange Variation.}
4. d4 {White takes the centre and has a normal Exchange set-up.}
(4. Ne5 {The Apocalypse Attack: the knight jumps to the middle at once.}
4... e6 {A simple, solid answer. It supports d5 and opens the diagonal for your dark-squared bishop. [%cal Ge6d5]}
5. d4
5... Bd6 {Offer a swap that hits the knight. [%cal Gd6e5]}
6. Bb5+
6... Bd7 {Block with the bishop.}
7. Nxd7
7... Nxd7 {Swap the pieces. Take back with the knight.}
8. c3 {White supports d4. You continue with ...a6 and ...Ngf6, a level game.}
)
(4. Nc3 {White develops and puts pressure on d5.}
4... Nc6 {Develop the knight. It eyes d4 and e5.}
5. d4 {White takes the centre. This is the same position as 1.e4 c6 2.d4 d5 3.exd5 cxd5 4.Nc3 Nc6 5.Nf3 in the Exchange Variation chapter. Play ...Bg4 next.}
(5. Bb5 {White pins your knight to the king.}
5... e6 {Stay calm: support d5 and get ready to develop the f8-bishop. If White takes on c6, take back with the b-pawn.}
6. d4 {White takes the centre. Continue with ...Bd6 and ...Nge7, then castle.}
)
)
(4. Bb5+ {White gives a check.}
4... Bd7 {Block with the bishop. Never block with the queen.}
5. Bxd7+ {White swaps bishops.}
5... Qxd7 {Take back with the queen. Your knights stay free to develop.}
6. d4 {This is the same position as in the Exchange Variation chapter after 4.Bb5+ Bd7 5.Bxd7+ Qxd7 6.Nf3. Continue with ...Nc6.}
)
4... Nc6 {Develop a knight and hit d4. [%cal Gc6d4]}
5. c4 {White hits d5. This is like the Panov Attack.}
5... Nf6 {Defend d5 and develop. [%cal Gf6d5]}
6. Nc3
6... e6 {Support d5. Your position is solid. Your bishop on c8 is not shut in for long: if White takes on d5 and you take back with the e-pawn, its diagonal opens again.}
7. cxd5
7... exd5 {Take back with the pawn. Now the pawns are the same on both sides, and your c8-bishop is free again. Your structure is simple and your pieces have good squares.}
8. Bb5
)
(3. d3 {White plays a slow, quiet move.}
3... dxe4 {Take the pawn. White has to retake, and the queens may come off.}
4. dxe4
4... Qxd1+ {Swap queens. You get an easy endgame without weaknesses.}
5. Kxd1
5... Nf6 {Develop and hit e4.}
6. Nfd2
6... g6 {Build a fianchetto, where the bishop will aim at the long diagonal.}
7. f3 {White supports e4. You play ...Bg7 and ...O-O or ...Nbd7. A comfortable, equal endgame.}
)
3... Bg4 {Pin the knight on f3 against the queen. Remember: bishop out before ...e6. [%cal Gg4f3]}
4. h3 {White asks the bishop what it wants to do.}
(4. d4 {White takes the centre.}
4... e6 {Support d5 and free your other bishop. [%cal Ge6d5]}
5. h3
5... Bxf3 {Take the knight before it takes your bishop.}
6. Qxf3
6... dxe4 {Take the pawn and open the d-file.}
7. Qxe4
7... Nf6 {Develop and kick the queen away. [%cal Gf6e4]}
8. Qh4
)
4... Bxf3 {Take it. If the bishop goes back, g4 would chase it again, so trade it for the knight. [%cal Gg4f3]}
5. Qxf3
5... e6 {Support d5 and free your dark-squared bishop. [%cal Ge6d5]}
6. d4 {White takes the centre.}
6... dxe4 {Take the pawn and open the d-file.}
7. Nxe4 {White retakes with the knight.}
7... Qxd4 {Take the pawn on d4. You are a pawn up, but be careful: White has a lead in development. [%cal Gd8d4]}
8. c3 {White hits the queen. Step back with ...Qd5: from there she still attacks the knight on e4, and you stay a pawn up.}
`,
    },
    {
      id: 'sidelines',
      title: 'Odd second moves: Bc4, Qf3, e5, f4, c4 and more',
      summary:
        'Your opponent does not play 2.d4. Play ...d5 anyway, take the centre and develop naturally. 2.Bc4 is the most common of these moves at your level, so you learn its main lines after 3.exd5 cxd5: 4.Bb3 and 4.Bb5+.',
      difficulty: 1,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5, whatever White plays next. [%cal Gc6d5]}
2. c3 {White prepares d4 and keeps a solid pawn centre.}
(2. d3 {White plays a quiet, slow move and keeps the pawns flexible.}
2... d5 {Take the centre right away. [%cal Gd5e4]}
3. Nd2 {White develops the knight and keeps a solid set-up.}
3... e5 {Build your own centre. With White's pawn on d3, you can take space on e5 safely. [%cal Ge7e5]}
4. Ngf3 {White develops the other knight.}
4... Bd6 {Develop the bishop to a strong square. It supports the e5-pawn. [%cal Gf8d6]}
5. d4 {White finally strikes at the centre.}
5... exd4 {Take the pawn. This opens the position, and your pieces are ready to use the open lines.}
6. Bd3 {White develops.}
6... Bg4 {Bring the bishop out and pin the knight on f3. [%cal Gc8g4]}
7. O-O
7... Ne7 {Develop the knight. It protects d5, and it can go to g6 later.}
8. h3 {White asks the bishop what it wants to do. You can answer ...Bh5 and continue with ...Nd7 and ...O-O. A level game.}
)
(2. Bc4?! {White puts the bishop on an active square. But it is not so safe there, because you can attack it with ...d5 and gain time.}
2... d5 {Attack the bishop and take the centre. [%cal Gd5c4]}
3. exd5 {White takes the pawn.}
3... cxd5 {Take back with the pawn. You keep a pawn in the centre.}
4. Bb3 {White keeps the bishop on the a2-g8 diagonal, where it eyes d5 and f7. This is the most common move here.}
(4. Bb5+ {White gives a check.}
4... Bd7 {Block with the bishop. (Not the queen!) [%cal Gc8d7]}
5. Bxd7+
(5. Qe2 {White guards the bishop on b5 with the queen.}
5... Nc6 {Develop the knight. If White takes on c6, take back with the bishop.}
6. Nf3 {White develops.}
6... e6 {Support d5 and free your f8-bishop.}
7. d4 {White takes the centre. Continue with ...Bd6 and ...Nge7, then castle.}
)
5... Nxd7 {Swap the bishops and take back with the knight, which develops it as well.}
6. Nf3 {White develops.}
(6. d4
6... Ngf6 {Develop the second knight. It guards d5.}
7. c3 {White supports the pawn. You play ...e6 and ...Bd6, with a comfortable game.}
)
6... Ngf6 {Develop the second knight. It guards d5.}
7. O-O {White castles. Continue with ...e6, ...Bd6 and castle.}
)
4... Nf6 {Develop and guard d5 a second time. [%cal Gf6d5]}
5. Nf3 {White develops.}
(5. d4 {White takes the centre.}
5... Nc6 {Develop and put pressure on d4. [%cal Gc6d4]}
6. c3 {White guards d4. Bring your bishop out to g4 or f5, then play ...e6.}
)
(5. Nc3 {White adds a second attacker on d5.}
5... Nc6 {Develop. Your d5-pawn is guarded by the knight on f6 and by your queen.}
6. d4 {White takes the centre. Bring the bishop out to f5 or g4, then play ...e6.}
)
5... Nc6 {Develop the other knight. Next you bring the c8-bishop out to g4 or f5 and play ...e6.}
6. d4 {White takes the centre. Now ...Bg4 pins the knight on f3, and after ...e6 your position is easy to play.}
)
(2. Qe2 {White develops the queen early. This blocks the f1-bishop and the queen can become a target.}
2... d5 {Take the centre right away. [%cal Gd5e4]}
3. exd5
3... cxd5 {Take back with the c-pawn.}
4. d4 {White takes the centre.}
)
(2. g3 {White plans to fianchetto the bishop.}
2... d5 {Take the centre right away. [%cal Gd5e4]}
3. Bg2
3... dxe4 {Take the pawn. White has to take back with the bishop.}
4. Bxe4
4... Nf6 {Hit the bishop and develop. [%cal Gf6e4]}
5. Bg2
5... e5 {Take space in the centre. Your pieces will come out easily.}
6. d3
6... Bd6 {Develop the bishop and support e5.}
7. Nf3 {White develops. You castle and play ...Re8 and ...Nbd7. A comfortable game.}
)
(2. Nc3 {White develops the knight first.}
2... d5 {Take the centre right away. [%cal Gd5e4]}
3. g3 {White plans to fianchetto the bishop, but gives up the fight for the centre.}
(3. Qf3 {White protects the e4-pawn with the queen. This is a slow, awkward move.}
3... dxe4 {Take the pawn.}
4. Nxe4
4... Nd7 {Develop the knight. Next it can go to f6 to challenge the knight on e4.}
5. Qe2 {Careful, this is a trap! The queen now stands behind the e4-knight, on the same file as your king. If you play 5...Ngf6??, then 6.Nd6 is checkmate: your e7-pawn cannot take the knight, because that would expose your king to the queen. The safe move is 5...Ndf6.}
)
3... dxe4 {Take the pawn. White has to retake with the knight.}
4. Nxe4
4... Nf6 {Develop and challenge the knight.}
5. Nxf6+
5... exf6 {Take back with the pawn. This opens the bishop's diagonal, and the doubled pawns are not a problem here.}
6. d4
6... Bd6 {Develop the bishop to a good square.}
7. Bg2 {White develops. You castle and play ...Re8. A comfortable position.}
)
(2. c4 {The Accelerated Panov. White plans to attack d5 right away.}
2... d5 {Take the centre anyway. The pawn on d5 is protected by the pawn on c6, and your d5-pawn now attacks both white pawns. [%cal Gd5c4,Gd5e4]}
3. exd5 {White takes the pawn.}
(3. cxd5 {White takes with the c-pawn.}
3... cxd5 {Take back with the c-pawn. You keep a pawn in the centre.}
4. exd5 {White takes the d5-pawn.}
4... Nf6 {Develop with a hit on the d5-pawn. [%cal Gf6d5]}
5. Nc3
5... Nxd5 {Take the pawn with the knight. It is a strong piece on d5.}
6. Nf3
6... Nc6 {Develop the second knight.}
7. d4 {This is the same position as after 3.exd5 cxd5 4.cxd5 Nf6 5.Nc3 Nxd5 6.Nf3 Nc6 7.d4 in this chapter. Play ...Bg4.}
)
3... cxd5 {Take back with the c-pawn.}
4. cxd5 {White takes the pawn.}
4... Nf6 {Hit the pawn right away. White cannot hold it for long. [%cal Gf6d5]}
5. Nc3 {White defends with the knight.}
5... Nxd5 {Take the pawn with the knight. It stands very well on d5.}
6. Nf3 {White develops.}
6... Nc6 {Develop the second knight and hit d4. [%cal Gc6d4]}
7. d4 {White takes the centre.}
7... Bg4 {Bishop out before ...e6. It pins the knight on f3. [%cal Gg4f3]}
8. Bb5 {White pins your knight on c6.}
)
(2. Qf3 {White brings the queen out early to support e4.}
2... d5 {Hit the centre anyway. [%cal Gd7d5]}
3. exd5 {White takes.}
3... cxd5 {Take back with the c-pawn and keep a pawn in the centre.}
4. d4 {White takes the centre. Develop with ...Nf6 and ...Nc6; later ...Bg4 can hit the queen on f3.}
)
(2. e5 {White pushes the e-pawn at once.}
2... d5 {Play ...d5 anyway. [%cal Gd7d5]}
3. d4 {This is the Advance Variation (1.e4 c6 2.d4 d5 3.e5) by another move order. Play ...Bf5, as in the Advance chapters.}
(3. exd6 {White takes your pawn en passant.}
3... exd6 {Take back with the e-pawn and develop quickly.}
4. d4 {White takes the centre. Develop with ...Nf6 and ...Bd6, and castle.}
)
)
(2. f4 {White supports e5 with the f-pawn before pushing it.}
2... d5 {Hit the centre as always.}
3. e5 {White pushes.}
(3. exd5 {White takes.}
3... cxd5 {Take back with the c-pawn.}
4. Nf3 {White develops. Continue with ...Nc6 and ...Bf5 or ...Bg4, then ...e6.}
)
3... Bf5 {Bishop out before ...e6, as in the Advance Variation. [%cal Gc8f5]}
4. d4 {White builds a big pawn chain.}
4... e6 {Close the door behind the bishop and support d5.}
5. Nf3 {White develops. Your plan: ...c5, ...Nc6 and ...Qb6 against d4.}
)
2... d5 {Take the centre right away. [%cal Gd5e4]}
3. exd5 {White takes the pawn.}
(3. e5 {White pushes the pawn, as in the Advance Variation.}
3... Bf5 {Bring the bishop out BEFORE ...e6. [%cal Gc8f5]}
4. d4
4... e6 {Close the door behind the bishop and support d5. [%cal Ge6d5]}
5. Be2
5... c5 {The usual break against the pawn chain. [%cal Gc5d4]}
6. Nf3
6... Nc6 {Another attacker on d4. [%cal Gc6d4]}
7. O-O
7... cxd4 {Take on d4.}
8. cxd4
)
(3. d4 {White builds a big centre, but nothing protects the e4-pawn any more.}
3... dxe4 {Take it. You are a pawn up for now. [%cal Gd5e4]}
4. Nd2 {White attacks the pawn and wants to win it back.}
4... Nf6 {Develop and guard the extra pawn. [%cal Gf6e4]}
5. Ne2 {White wants to play Ng3 and win the pawn back. Answer with ...Bf5, which guards it once more (bishop out before ...e6). You are comfortable.}
)
3... cxd5 {Take back with the c-pawn. You keep a pawn in the centre.}
4. d4 {White takes the centre.}
4... Nc6 {Develop a knight and hit d4. [%cal Gc6d4]}
5. Nf3 {White develops.}
5... Nf6 {Develop the second knight. It guards d5. Do not rush ...e6: your light-squared bishop wants to come out first. [%cal Gf6d5]}
6. Bd3 {The bishop develops and points at your kingside.}
6... Bg4 {Bishop out before ...e6. It attacks the knight on f3. This is now the same position as in the Exchange Variation chapter. [%cal Gg4f3]}
7. O-O
7... e6 {Support d5 and open the road for your dark-squared bishop. [%cal Ge6d5,Gf8d6]}
8. Bf4
`,
    },
    {
      id: 'gambits',
      title: 'Rare third moves and gambits, including 3.f3',
      summary:
        'After 2.d4 d5, White plays something unusual: 3.f3 (the Fantasy), 3.Nf3, 3.Bd3, 3.Qf3, or a pawn sacrifice like 4.f3 or 4.Bc4. Take on e4, keep your pieces safe, and give the pawn back only if you get something good.',
      difficulty: 2,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5. [%cal Gc6d5]}
2. d4 {White builds a big centre.}
2... d5 {You challenge the centre. [%cal Gd5e4]}
3. Nf3?! {White develops the knight, but this lets you take on e4 with a good game.}
(3. Bd3 {White develops the bishop, aiming at your kingside.}
3... dxe4 {Take the pawn. White has to take back with the bishop.}
4. Bxe4
4... Nf6 {Hit the bishop and develop.}
5. Bf3 {The bishop retreats and stays on the long diagonal.}
5... Bf5 {Bring the bishop out before ...e6. [%cal Gc8f5]}
6. Ne2
6... e6 {Open the way for your dark-squared bishop so you can castle soon.}
7. O-O
7... Be7 {Develop the bishop and get ready to castle.}
8. c4 {White grabs space. You castle, then play ...Nbd7 and ...Re8. A balanced game.}
)
(3. Qf3 {White protects the e4-pawn with the queen, which is not so safe.}
3... dxe4 {Take the pawn.}
4. Qxe4
4... g6 {Set up a fianchetto. The queen on e4 is exposed, and ...Bf5 will gain time. [%cal Gf8g7]}
5. Bd3
)
(3. Nc3 {White defends e4 with the knight. This is the normal move, but White can choose an odd 4th move.}
3... dxe4 {Take the pawn. White has to take back with the knight or give a pawn.}
4. f3?! {The Rasa-Studier Gambit. White gives up a pawn for quick development and attacks.}
(4. Bc4?! {The von Hennig Gambit. White develops the bishop first, aiming at f7.}
4... Nf6 {Develop and defend the e4-pawn. [%cal Gf6e4]}
5. Nge2
5... Bf5 {Bring the bishop out and protect the e4-pawn.}
6. Ng3
6... Bg6 {Retreat to a safe square.}
7. O-O
7... e6 {Close the diagonal in front of the f7-pawn and free your dark-squared bishop. [%cal Ge6f7]}
8. Re1 {White develops the rook. You play ...Bb4 and ...O-O, keeping the extra pawn.}
)
4... exf3 {Take the pawn. This is the simple way to accept the gambit. [%cal Ge4f3]}
5. Nxf3
5... Bf5 {Bring the bishop out and aim at the d3-square. [%cal Gc8f5]}
6. Bd3
6... Bxd3 {Swap the bishops.}
7. Qxd3
7... Nf6 {Develop the knight and take control of the centre.}
8. Bg5
)
(3. f3 {The Fantasy Variation (opening databases call it the Maróczy Variation). White protects the e4-pawn with a pawn, but this opens the diagonal e1-h4 next to the white king and takes the f3-square away from the knight.}
3... dxe4 {Take the pawn. (The move ...e6 is also fine, but this is the most direct.) White has to open the f-file by retaking. [%cal Gd5e4]}
4. fxe4 {White retakes. The pawn centre is strong, but the king is a bit exposed.}
4... e5 {Strike at the centre right away. You attack the d4-pawn and open the way for your bishop and queen. [%cal Ge7e5,Ge5d4]}
5. Nf3 {White develops the knight and protects d4.}
5... Bg4 {Bring the bishop out now. It pins the knight on f3 to the queen on d1, so the knight cannot move freely. [%cal Gc8g4,Gg4f3]}
6. Bc4 {White develops the bishop and aims at f7.}
6... Nd7 {Develop the knight. It protects the e5-pawn and keeps the c-pawn free. [%cal Gb8d7]}
7. O-O {White castles.}
7... Ngf6 {Develop the second knight. It attacks the e4-pawn.}
8. h3 {White asks the bishop what it wants to do. Take the knight with ...Bxf3.}
)
3... dxe4 {Take the pawn. White now has to prove that a knight move is better than a pawn. [%cal Gd5e4]}
4. Ne5 {White goes after the pawn at once.}
4... Nd7 {Attack the knight on e5. It cannot stay there for long, and the move also prepares ...Ngf6. [%cal Gd7e5]}
5. Nc3 {White develops and attacks the e4-pawn.}
5... Nxe5 {Take the knight. It was strong in the centre.}
6. dxe5
6... Qxd1+ {Offer a swap of queens. White must take back.}
7. Kxd1
7... Bf5 {Develop with the bishop and protect e4. You are a pawn up and White's king is stuck in the middle. [%cal Gc8f5]}
8. g3 {White gets ready to develop the bishop. You play ...e6 and ...O-O-O+, and your extra pawn gives you a good endgame.}
`,
    },
    {
      id: 'advance-short',
      title: 'Advance Variation: White plays Nf3 (the "Short" line)',
      summary:
        "White pushes the pawn to e5 and develops with Nf3 and Be2. You develop your bishop first, close the door with ...e6, and attack White's centre with ...c5.",
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
6... Bxd3 {Take it. Trading White's good bishop makes your game easier.}
7. Qxd3
7... Nc6 {Another attacker on d4. [%cal Gc6d4]}
8. O-O
)
(5. Bd3 {White offers to swap bishops.}
5... Bxd3 {Take it. Swapping White's good bishop makes your game easier.}
6. Qxd3
6... c5 {Now hit d4 as usual. [%cal Gc5d4]}
7. c3 {White protects d4.}
7... Nc6 {Pile up on d4. [%cal Gc6d4]}
8. O-O
)
5... c5 {The key break. White's chain is e5 and d4, and its base is the d4-pawn. Strike at the base with ...c5. [%cal Gc6c5,Gc5d4]}
6. Be3 {White protects d4 and develops.}
(6. c3 {White protects d4 with a pawn.}
6... Nc6 {Another attacker on d4. [%cal Gc6d4]}
7. O-O
7... cxd4 {Take on d4.}
8. cxd4
)
6... cxd4 {Take on d4. After White retakes, the knight leaves f3 and the e5-pawn has no friends left. [%cal Gc5d4]}
7. Nxd4 {White retakes and attacks your bishop. [%cal Rd4f5]}
7... Ne7 {The main move. The knight protects the bishop, so Nxf5 is no problem. It also stays flexible. [%cal Ge7f5]}
8. O-O {White castles. Bring your last knight out with ...Nbc6 now: White is ready to hit d5 with c4, and you want your pieces out before the centre opens.}
`,
    },
    {
      id: 'advance-others',
      title: 'Advance Variation: Bd3, c3, h4 and g4 on move 4',
      summary:
        'White pushes e5 and then plays something else than Nf3: a bishop swap with Bd3, support with c3, or pawn pushes with h4 and g4 to chase your bishop. Against h4 answer ...h5; against g4 step back to g6. The plan stays ...e6 and ...c5.',
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
5. Nf3
5... c5 {The usual break. You attack the pawn that holds White's centre together. [%cal Gc5d4]}
6. Be2
6... Nc6 {Another attacker on d4. [%cal Gc6d4]}
7. O-O
7... cxd4 {Take on d4 and open the position for your pieces.}
8. cxd4
)
(4. h4 {The Tal Variation. White wants to play h5 and g4 to trap your bishop on the edge. [%cal Rh4h5]}
4... h5 {Stop the pawn. Now White cannot push h5 and trap your bishop. [%cal Gh5h4]}
5. Bd3 {White offers to swap bishops.}
5... Bxd3 {Take it. Swapping bishops helps you.}
6. Qxd3
6... e6 {Now close the door and support d5. [%cal Ge6d5]}
7. Nf3
7... Qa5+ {Check! This forces White to react. If White blocks with c3 you play ...Qa6 and swap queens. [%cal Ga5e1]}
8. Nbd2 {White blocks with the knight.}
)
(4. g4 {The Bayonet. White attacks your bishop right away with a pawn.}
4... Bg6 {Retreat. The bishop is safe here, and White has weakened the kingside by pushing the g-pawn. [%cal Gf5g6]}
5. h4 {White threatens h5, which would trap the bishop.}
5... h5 {Stop the h-pawn. Now h5 is impossible, and you can capture on g4 if White opens the file. [%cal Gh5g4]}
6. gxh5 {White takes the pawn.}
6... Bxh5 {Take back with the bishop. It is safe on h5 and looks at the white kingside. [%cal Gg6h5]}
7. Be2 {White offers to swap bishops.}
7... Bxe2 {Take it. Swapping your bishop for White's helps you here.}
8. Qxe2 {White takes back with the queen. Play ...e6 now: it supports d5 and stops White from pushing the pawn to e6, where it would hit f7. Then follow with ...c5, as always.}
)
4... Bxd3 {Take it. White's good bishop disappears and your game becomes easier.}
5. Qxd3
5... e6 {Now close the bishop's door and support d5. [%cal Ge6d5]}
6. Nf3
6... c5 {The standard break. Attack the base of White's pawn chain. [%cal Gc5d4]}
7. dxc5 {White takes the pawn at once.}
(7. O-O {White castles.}
7... cxd4 {Take on d4.}
8. Nxd4
)
(7. c3
7... Nc6 {Another attacker on d4. [%cal Gc6d4]}
8. O-O
)
7... Bxc5 {Take back with the bishop. It is strong on c5, and the e5-pawn has lost its support. [%cal Gf8c5]}
8. c4 {White hits the d5-pawn.}
`,
    },
    {
      id: 'classical-quiet',
      title: 'Classical Variation: 3.Nc3 dxe4 4.Nxe4 Bf5',
      summary:
        'White plays 3.Nc3 (or 3.Nd2) and takes back on e4 with the knight. Your bishop comes out with a hit on the knight and steps back to g6. If White pushes h4, answer ...h6 and keep the bishop safe.',
      difficulty: 2,
      pgn: `
1. e4 {White starts with the king's pawn.}
1... c6 {The Caro-Kann. The c6-pawn prepares ...d5. [%cal Gc6d5]}
2. d4 {White builds a big centre.}
2... d5 {You challenge the centre. [%cal Gd5e4]}
3. Nc3 {White defends the e4-pawn with a knight.}
(3. Nd2 {Same idea, but the knight comes from d2. After the exchange on e4 the position is the same.}
3... dxe4 {Take the pawn.}
4. Nxe4
4... Bf5 {Same plan as ever: bishop out first, hitting the knight. [%cal Gc8f5]}
5. Ng3
5... Bg6 {Retreat to g6, where the bishop stays active and safe.}
6. h4 {White threatens h5 to chase your bishop. This is the main line, which is explained in full below.}
)
3... dxe4 {Take the pawn. White has to retake with a knight.}
4. Nxe4
4... Bf5 {Bring the bishop out BEFORE ...e6. It also attacks the knight on e4. [%cal Gc8f5]}
5. Ng3 {The knight retreats and attacks your bishop.}
5... Bg6 {Retreat to g6. The bishop stays on the long diagonal and is safe. [%cal Gf5g6]}
6. Nf3 {White develops the knight.}
(6. h4 {White threatens h5, which would trap your bishop. [%cal Rh4h5]}
6... h6 {The key move. Now after h5 the bishop can go to h7. Never play ...Nf6? here, because after h5 your bishop would have no safe square. [%cal Gh7h6]}
7. Nf3 {White develops the knight.}
7... Nd7 {Develop the knight to d7. Later, when you play ...Ngf6 and White takes on f6, you can retake with the d7-knight and keep your pawns healthy. [%cal Gb8d7]}
8. h5 {White chases the bishop. Step back to h7, where it is safe.}
)
6... Nd7 {Develop the knight. It prepares ...Ngf6 and keeps your pawns healthy if White ever plays Nxf6+. [%cal Gb8d7]}
7. Bd3 {White offers to swap bishops.}
7... e6 {Close the centre and free your dark-squared bishop. [%cal Ge6d5,Gf8d6]}
8. O-O
`,
    },
    {
      id: 'advance-nc3',
      title: 'Advance Variation: White plays Nc3 (and the g4 pawn push)',
      summary:
        "White pushes e5 and develops the knight to c3. If White follows up with g4 the game becomes sharp. You keep the bishop safe on g6, strike with ...c5 and use ...h5 to break up White's kingside pawns.",
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
6. Be2
6... Nc6 {Another attacker on d4. [%cal Gc6d4]}
7. O-O
7... a6 {A useful waiting move. It stops Nb5 and Bb5, and prepares ...b5 or ...c4 later.}
8. Be3 {White's bishop now stands behind the d4-pawn. If White takes on c5, you cannot take back with your bishop, because Bxc5 would win it. So take on d4 first: ...cxd4.}
)
(5. Bd3 {White offers to swap bishops.}
5... Bxd3 {Take it. The swap helps you.}
6. Qxd3
6... c5 {The usual break. Attack the base of White's pawn chain. [%cal Gc5d4]}
7. Nce2
7... cxd4 {Take on d4.}
8. Nxd4
)
5... Bg6 {Retreat the bishop to its safe square. White has weakened the kingside by pushing the g-pawn. [%cal Gf5g6]}
6. Nge2 {White develops the knight. It supports the knight on c3 and prepares Nf4.}
6... c5 {Strike at the base of White's chain. [%cal Gc5d4]}
7. h4 {White threatens h5, trapping your bishop.}
7... h5 {The key move, and play it now: hit the g4-pawn and keep a retreat square for your bishop on h7. [%cal Gh7h5,Rh5g4]}
8. Nf4 {White attacks your bishop and the h5-pawn. Step back with ...Bh7 and bring your queen's knight to c6.}
`,
    },
  ],
}
