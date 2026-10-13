import type { OpeningCourse } from '../../types'

// Caro-Kann Defence course (work in progress)
export const caroKannCourse: OpeningCourse = {
  id: 'caro-kann',
  name: 'Caro-Kann Defence',
  side: 'black',
  tagline: '',
  signatureMoves: ['e4', 'c6'],
  ecoNames: [],
  overview: [],
  keyIdeas: [],
  commonMistakes: [],
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
5... c5 {The key break. White's chain is e5 and d4, and its base is the d4-pawn. Strike at the base with ...c5. [%cal Gc6c5,Gc5d4]}
6. Be3 {White protects d4 and develops.}
(6. O-O {White castles first.}
6... Nc6 {Another attacker on d4. [%cal Gc6d4]}
7. Be3 cxd4 {Take on d4. White's knight must retake, and then the pawn on e5 has lost a defender.}
8. Nxd4 Nge7 {Protect the bishop on f5 and get the knight to a useful square.}
9. Nxc6?! {This gives away the best knight for nothing. It lets you win a pawn.}
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
(6. dxc5 {White takes first. But this gives up the centre pawn that was holding e5.}
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
14. Re1 {White looks for play on the e-file, but you can play ...O-O and ...Qd7. You are better.}
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
  ],
}
