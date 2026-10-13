import type { OpeningChapter } from '../../types'

// More London System chapters (part A). They are added to the end of the course in london.ts.
export const londonChaptersA: OpeningChapter[] = [
  {
    id: 'vs-kings-indian',
    title: "Against the King's Indian set-up: ...g6, ...Bg7, ...d6",
    summary:
      "Black does not play ...d5. Instead the bishop goes to g7, the king castles and Black prepares ...e5 or ...Nh5. You keep the same calm London set-up, with one extra key move: h3.",
    difficulty: 2,
    pgn: `
1. d4 { Take space in the centre and open the road for your dark-squared bishop. [%cal Gd2d4] }
1... Nf6 2. Bf4 { The London bishop comes out before e3, so it never gets locked in. [%cal Gc1f4] }
2... g6 { Black wants to put the bishop on g7. This is the King's Indian set-up. }
3. Nf3 { A natural square for the knight. It guards d4 and looks at e5, the square Black wants to fight for. [%cal Gg1f3,Gf3e5] }
3... Bg7 4. e3 { The base of your pyramid. It protects d4 and lets your other bishop come out. [%cal Ge2e3,Gf1e2] }
4... O-O
( 4... d6 { Black plays ...d6 before castling. } 5. h3 { The same key move as in the main line: your bishop gets a safe home on h2. [%cal Gh2h3,Gf4h2] } 5... O-O 6. Be2 { Now you are back in the main line. Black can choose ...Nbd7, ...c5 or ...Nh5 from here. [%cal Gf1e2] } )
5. h3 { The most important move against this set-up. It gives your bishop the h2 square to run to when Black plays ...e5 or ...Nh5. It also stops a black piece from jumping to g4. [%cal Gh2h3,Gf4h2] [%csl Gh2,Gg4] }
5... d6 6. Be2 { Your bishop goes to e2, not d3. On d3 it could be forked by a black pawn on e4 together with your knight on f3. On e2 it is safe, and you are ready to castle. [%cal Gf1e2] [%csl Rd3] }
6... Nbd7
( 6... c5 { Black hits d4 from the side, like in many London games. } 7. c3 { Your normal answer: the c3 pawn supports d4, and your pyramid stays solid. [%cal Gc2c3,Gc3d4] [%csl Gc3,Gd4,Ge3] } 7... Nc6 { More pressure on d4. } 8. O-O { Castle first. Your centre is well protected, so there is no need to hurry. [%cal Ge1g1] } 8... Qb6 { The queen looks at your b2 pawn. } 9. Qb3 { Put your queen opposite Black's queen. Now b2 is protected, and if Black swaps queens you take back with the a-pawn. [%cal Gd1b3,Gb3b2] } )
( 6... Nh5 { Black chases your bishop with the knight. } 7. Bh2 { This is exactly why you played h3. The bishop is safe on h2 and keeps looking at the centre. The knight on h5 now stands on the edge of the board. [%cal Gf4h2,Gh2b8] } 7... c5
( 7... e5? { A mistake. Black pushes ...e5 before the pieces are ready to support it. } 8. dxe5 { Take the pawn. If Black takes back, the queens come off and the e5 pawn falls, because your knight and your bishop on h2 both attack it. [%cal Gd4e5] } 8... dxe5 9. Qxd8 { Swap queens first. } 9... Rxd8 10. Nxe5 { You win a clean pawn. Black's pieces on h5 and g7 cannot win it back. [%cal Gf3e5] } )
8. O-O { Castle before you open the centre. [%cal Ge1g1] } 8... cxd4 9. exd4 { Take back towards the centre. Your bishop on h2 and your d4 pawn now both control e5. [%cal Ge3d4,Gh2e5] } 9... Nc6 10. c3 { Your pawn chain c3 and d4 is strong, and the knight on b1 can come to d2. [%cal Gc2c3,Gb1d2] } )
7. O-O { Castle and get your king safe before the centre opens. [%cal Ge1g1] }
7... e5 { Black's main idea. The pawn attacks both your bishop on f4 and your d4 pawn. Watch out: if you ignore it, Black takes your bishop. [%cal Re5f4,Re5d4] }
8. Bh2 { Thanks to h3, the bishop has a safe square. From h2 it still presses on e5. Taking with 8.dxe5 is also good, but it leads to sharp tactics, so the calm retreat is easier to play. [%cal Gf4h2,Gh2e5] }
8... exd4 9. exd4 { Take back with the pawn. Now the e-file is open for your rook, and your bishop on h2 looks at the d6 pawn. [%cal Ge3d4,Gh2d6] }
9... Re8 10. Nc3 { Bring your last knight out. The position is balanced and your pieces have good squares. Next comes Re1 and a calm game. [%cal Gb1c3,Gf1e1] }
`,
  },
  {
    id: 'vs-nc6-e5',
    title: 'Against ...Nc6 and the ...e5 counter-strike',
    summary:
      'Black plays an early ...Nc6, often followed by ...e5 to attack your bishop and your centre. Stay calm: count the attackers and defenders, and you will often simply win a pawn.',
    difficulty: 1,
    pgn: `
1. d4 { Take space in the centre. [%cal Gd2d4] }
1... d5 2. Bf4 { The London bishop. [%cal Gc1f4] }
2... Nc6 { Black's knight comes out in front of the c-pawn and looks at e5 and d4. Black often wants to follow up with ...e5. [%cal Rc6e5] }
3. e3 { Your normal move. Now d4 is protected by a pawn, so ...Nxd4 is impossible. [%cal Ge2e3,Ge3d4] }
3... Nf6
( 3... e5? { This looks active, but it simply loses a pawn. The e5 pawn is attacked twice (by your bishop and your d4 pawn) and only protected once, by the knight. [%cal Rf4e5,Rd4e5,Gc6e5] }
  4. Bxe5 { Take it! Count before you capture: your bishop takes, Black's knight takes back, and your d-pawn takes again. [%cal Gf4e5] }
  4... Nxe5 5. dxe5 { You are a clean pawn up. Now just develop your pieces and keep the extra pawn safe. [%cal Gd4e5] }
  5... Bc5 6. Nf3 { Develop and protect the pawn on e5 once more. [%cal Gg1f3,Gf3e5] } 6... Ne7 7. Be2 { Get ready to castle. [%cal Gf1e2,Ge1g1] } 7... O-O 8. O-O { Your king is safe and you have an extra pawn. Very good for you. [%cal Ge1g1] } )
( 3... Bf5 { Black brings the bishop out first. } 4. c4 { Strike at d5! Black's knight on c6 blocks the c-pawn, so Black cannot support d5 with ...c6. [%cal Gc2c4,Rc4d5] [%csl Rc6] }
  4... e6 5. Nc3 { Add more pressure on d5 and develop. [%cal Gb1c3,Gc3d5] } 5... Nf6 6. Nf3 { Develop the last minor piece on the king side. You have more space and easy play. [%cal Gg1f3] } 6... Bb4 )
4. Nf3 { Develop and guard e5 so Black cannot play ...e5 for free. [%cal Gg1f3,Gf3e5] }
4... Bg4
( 4... Bf5 5. Bb5 { Pin the knight on c6 to the king. Now that knight cannot help with ...e5, and you can castle soon. [%cal Gf1b5,Rb5e8] } 5... e6 6. O-O { Castle. Next you can play Ne5 or c4. [%cal Ge1g1,Gf3e5] } 6... Bd6 )
( 4... Nh5 { Black chases your bishop with the knight. } 5. Bg3 { Step back. If Black takes, you take back with the h-pawn. [%cal Gf4g3] } 5... Nxg3 6. hxg3 { Your h-pawn now opens the h-file for your rook on h1, and your pawns still cover e5 and f4. [%cal Gh2g3,Gh1h7] } 6... Bg4 )
5. h3 { Ask the bishop a question: will it take your knight or step back? [%cal Gh2h3,Rh3g4] }
5... Bxf3 6. Qxf3 { Take back with the queen. You now have the two bishops, and your queen helps to watch e4 and d5. [%cal Gd1f3,Gf3d5] }
6... e6 7. Nd2 { Your last knight comes out. Next you play Bd3 or Bb5 and castle. Your pieces work well together. [%cal Gb1d2,Gf1d3] }
7... Bd6
`,
  },
  {
    id: 'vs-grunfeld-g6-d5',
    title: 'Against ...g6 with ...d5',
    summary:
      'Black fianchettoes the bishop on g7 but also puts a pawn on d5. You build the same pyramid with h3, Be2, c3 and Nbd2, and meet ...Qb6 with Qb3.',
    difficulty: 2,
    pgn: `
1. d4 { Take space in the centre. [%cal Gd2d4] }
1... d5
( 1... Nf6 2. Bf4 { The London bishop comes out. [%cal Gc1f4] } 2... g6 3. Nf3 { Develop and guard d4. [%cal Gg1f3] } 3... Bg7 4. e3 { Build the base of your pyramid. [%cal Ge2e3] } 4... O-O 5. h3 { The safe home on h2 for your bishop again. [%cal Gh2h3,Gf4h2] } 5... d5 6. Be2 { This is the same position as in the main line, just reached by a different road. [%cal Gf1e2] } 6... c5 )
2. Bf4 { The London bishop. [%cal Gc1f4] }
2... Nf6 3. e3 { Protect d4 and free your other bishop. [%cal Ge2e3] }
3... g6 { Black wants to put the bishop on g7, where it looks along the long diagonal towards your queen side. [%cal Rg7b2] }
4. Nf3 { Develop and guard d4 again. [%cal Gg1f3] }
4... Bg7 5. h3 { Give your bishop a safe square on h2, so ...Nh5 never wins it, and stop ...Bg4 pinning your knight. [%cal Gh2h3,Gf4h2] [%csl Gg4] }
5... O-O 6. Be2 { A quiet, safe square for the bishop. You will castle next. [%cal Gf1e2,Ge1g1] }
6... c5 { Black attacks your d4 pawn, as in most London games. }
7. c3 { Support d4 with the c-pawn. Your pyramid c3, d4, e3 is solid. [%cal Gc2c3,Gc3d4] [%csl Gc3,Gd4,Ge3] }
7... Nc6
( 7... Qb6 { The queen looks at your b2 pawn. [%cal Rb6b2] } 8. Qb3 { Meet the queen with your queen. Now b2 is protected, and if the queens are swapped your a-pawn takes back and your rook gets the a-file. [%cal Gd1b3,Gb3b2] } 8... c4 9. Qxb6 { Swap queens. Without queens there are no quick attacks, and your solid pawns make the ending comfortable. [%cal Gb3b6] } 9... axb6 10. O-O { Castle and bring your knight to d2 next. [%cal Ge1g1,Gb1d2] } 10... Nc6 )
8. Nbd2 { Your last knight comes out on d2, so c3 stays protected. From d2 it can later help with the pawn push e4. [%cal Gb1d2,Ge3e4] }
8... b6 9. O-O { Castle. Your plan from here: finish development, then think about pushing e4 to open the centre when your pieces are ready. [%cal Ge1g1,Ge3e4] }
9... Bb7
`,
  },
  {
    id: 'knight-first-move-orders',
    title: 'When Black starts with 1...Nf6: ...e6, ...c5, ...b6 and ...Qb6',
    summary:
      'After 1.d4 Nf6 2.Bf4 Black has many choices. Most of them lead back to your normal pyramid, but a few need care, especially an early ...Qb6 hitting your b2 pawn.',
    difficulty: 2,
    pgn: `
1. d4 { Take space in the centre. [%cal Gd2d4] }
1... Nf6 2. Bf4 { The London bishop comes out at once. You play it the same way against almost every reply. [%cal Gc1f4] }
2... e6
( 2... d5 { Black puts a pawn on d5. } 3. e3 { Your normal move. This is the classic London, which you know from the first chapter. [%cal Ge2e3] } 3... e6 4. Nf3 { Develop and guard d4. Now play the classic pyramid set-up. [%cal Gg1f3] } 4... Bd6 )
( 2... g6 { Black plans ...Bg7. } 3. Nf3 { Develop. From here you follow the chapter on the King's Indian set-up, with e3, h3 and Be2. [%cal Gg1f3] } 3... Bg7 4. e3 { The base of your pyramid. Next comes h3. [%cal Ge2e3,Gh2h3] } 4... O-O )
( 2... c5 { Black hits d4 straight away. } 3. e3 { Keep it simple and solid: the e3 pawn protects d4. The move 3.d5 is also good, but it leads to a different kind of game. [%cal Ge2e3,Ge3d4] }
  3... Qb6 { The queen attacks your b2 pawn, which your bishop on f4 no longer protects. [%cal Rb6b2] [%csl Rb2] }
  ( 3... cxd4 4. exd4 { Take back towards the centre. Your queen protects d4 and the e-file is open for your pieces later. [%cal Ge3d4] } 4... d5 5. Nf3 { Develop and guard d4 once more. [%cal Gg1f3] } 5... Nc6 6. c3 { Now d4 is rock solid and your queen can use the b3 square later. [%cal Gc2c3,Gd1b3] } 6... Bg4 7. Qb3 { Your queen hits b7 and d5 at the same time. Black has to spend a move to defend. [%cal Gd1b3,Rb3b7] } )
  ( 3... Nc6 4. d5 { Kick the knight! Your pawn gains space with tempo, which means Black has to lose time moving the knight again. [%cal Gd4d5,Rd5c6] } 4... Nb4 5. Nc3 { Develop and guard d5. Watch the knight on b4: it would love to jump to c2, so keep an eye on that square. [%cal Gb1c3,Gc3d5] [%csl Yc2] } )
  4. Nc3 { Develop the knight and lay a trap. If Black grabs b2 at the right moment, Nb5 makes the black queen and king very uncomfortable. [%cal Gb1c3,Gc3b5] }
  4... cxd4 5. exd4 { Take back towards the centre. Now d4 is protected by your queen. [%cal Ge3d4] }
  5... a6 { A good move. Black takes the b5 square away from your knight before thinking about b2. }
  ( 5... Qxb2? { Greedy! Black takes the pawn, but now your knight jumps in. } 6. Nb5 { Threat: Nc7+, forking the king and the rook on a8. You also threaten Rb1, chasing the queen. [%cal Gc3b5,Rb5c7,Rc7a8] } 6... Nc6 7. Rb1 { The queen must run, and your rook is now active. [%cal Ga1b1,Rb1b2] } 7... Qxa2 8. Nc7+ { The fork! Check to the king and an attack on the rook. [%cal Rc7e8,Rc7a8] } 8... Kd8 9. Nxa8 { You win a whole rook for a knight, and Black's king cannot castle any more. [%cal Gc7a8] } )
  6. a3 { A quiet, useful move. It stops ...Bb4, which would pin your knight on c3 to your king. [%cal Ga2a3] [%csl Gb4] }
  6... g6 7. Nf3 { Develop and guard d4. [%cal Gg1f3] } 7... Bg7 8. Be2 { Your bishop gets out and you are ready to castle. [%cal Gf1e2,Ge1g1] } 8... O-O 9. O-O { Your king is safe and your pieces are developed. A good, calm position. [%cal Ge1g1] } )
( 2... b6 { Black plans ...Bb7 to look at the long diagonal. } 3. e3 { The same calm move as always. [%cal Ge2e3] } 3... Bb7 4. Nf3 { Your knight blocks Black's bishop on the long diagonal and guards d4. [%cal Gg1f3,Rb7f3] } 4... e6 5. Bd3 { Your bishop goes to a good diagonal, aiming towards Black's king side. [%cal Gf1d3,Gd3h7] } 5... c5 6. c3 { Support d4 with your pawn. This is your pyramid again. [%cal Gc2c3] [%csl Gc3,Gd4,Ge3] } 6... Be7 7. Nbd2 { Your last knight comes out on d2, so c3 stays protected and the knight can go to e4 or c4 later. [%cal Gb1d2] } 7... O-O 8. O-O { Both kings are safe. A normal London position. [%cal Ge1g1] } )
3. e3 { Your normal move. You protect d4 and free your light-squared bishop. [%cal Ge2e3,Gf1d3] }
3... c5
( 3... b6 4. Nf3 { Develop and guard d4. [%cal Gg1f3] } 4... Bb7 5. Bd3 { Point your bishop towards Black's king side. [%cal Gf1d3] } 5... c5 6. O-O { Castle first, then build with c3 and Nbd2. [%cal Ge1g1,Gc2c3] } 6... Be7 7. c3 { The pyramid is complete. [%cal Gc2c3] [%csl Gc3,Gd4,Ge3] } 7... O-O )
( 3... d5 4. Nf3 { You are back in the classic London pyramid from the first chapter. [%cal Gg1f3] } 4... Bd6 )
4. Nf3 { Develop and guard d4 once more. [%cal Gg1f3] }
4... d5 5. Nbd2 { Bring out your other knight to d2, so the c-pawn can still move to c3. [%cal Gb1d2,Gc2c3] }
5... Nc6 6. c3 { Your pyramid on c3, d4 and e3 is complete, and the game is now the classic London. [%cal Gc2c3] [%csl Gc3,Gd4,Ge3] }
6... Bd6 7. Bg3 { Keep your bishop instead of letting Black swap it. If Black takes on g3, you take back with the h-pawn. [%cal Gf4g3] }
7... O-O 8. Bd3 { Your bishop aims at h7, next to Black's king. You will castle next. [%cal Gf1d3,Gd3h7] }
8... b6
`,
  },
]

