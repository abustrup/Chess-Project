import type { OpeningChapter } from '../../types'

// More London System chapters (part B). They are added to the end of the course in london.ts.
export const londonChaptersB: OpeningChapter[] = [
  {
    id: 'vs-dutch',
    title: 'Against the Dutch: 1.d4 f5',
    summary:
      'Black answers 1.d4 with 1...f5 to control the e4 square. You keep your calm London set-up, use the holes Black leaves behind, and prepare the e4 push to open the centre.',
    difficulty: 2,
    pgn: `
1. d4 { Your normal first move. It takes space in the centre and opens the road for your bishop on c1. [%cal Gd2d4] }
1... f5 { The Dutch Defence. Black puts a pawn on f5 to control the e4 square. It is a fighting choice, but it also loosens Black's own king a little. [%csl Ge4] }
2. Bf4 { Same London plan as always: the bishop comes out first, before e3 can lock it in. [%cal Gc1f4] }
2... Nf6 { Black develops and adds a second guard on e4. }
( 2... g5? { Black lunges forward to chase your bishop, but this just drops a pawn. } 3. Bxg5 { Take it. The pawn on g5 had no protection, and your bishop is perfectly safe on g5. [%cal Gf4g5] } 3... Nf6 4. Bxf6 { Swap your bishop for the knight. Black must take back with the e-pawn, so you stay a clean pawn up and Black's king side is full of holes. [%cal Gg5f6] } 4... exf6 5. e3 { Now just develop calmly: e3, then Bd3, Nf3 and castle. Black's loose king side will be a target for the whole game. [%cal Ge2e3,Gf1d3] } 5... d5 )
3. e3 { Your pawn guards d4 and opens the way for your light-squared bishop. [%cal Ge2e3,Gf1d3] }
3... e6 { The most common set-up. Black opens a road for the dark-squared bishop and plans ...Be7 and castling. }
( 3... g6 { The Leningrad set-up: Black's bishop goes to g7 to look along the long diagonal. } 4. Nf3 { Develop the knight. It guards d4 and looks at e5. [%cal Gg1f3] } 4... Bg7 5. Be2 { Against ...g6 the bishop is fine on e2: it is safe there and lets you castle quickly. [%cal Gf1e2] } 5... O-O 6. O-O { King to safety first. Nothing is happening in the centre yet. [%cal Ge1g1] } 6... d6 7. h3 { A small useful move: it gives your bishop a hiding square on h2, so Black's ...Nh5 can never trade it off by force. [%cal Gh2h3,Gf4h2] } 7... Nc6 )
4. Nf3 { The knight goes to its best square. From f3 it guards d4 and eyes the e5 square. [%cal Gg1f3,Gf3e5] }
4... Be7 { Black prepares to castle. }
( 4... d5 { The Stonewall. Black builds a wall with pawns on d5, e6 and f5. The wall leaves a big hole on e5 that no black pawn can ever attack. [%csl Re5] } 5. Bd3 { Develop the bishop. It aims at the f5 pawn and the king side. [%cal Gf1d3] } 5... Bd6 { Black offers to trade the dark-squared bishops. This is Black's good bishop, so Black wants to swap yours off. } 6. O-O { Castle first. If Black takes on f4, you take back with the e-pawn and the e5 square becomes even stronger for you. [%cal Ge1g1] } 6... Bxf4 ( 6... O-O 7. c4 { Now hit the centre from the side. The c4 push puts pressure on d5 and gives your pieces more room. [%cal Gc2c4,Gc4d5] } 7... c6 ) 7. exf4 { Take back toward the centre. Your new pawn on f4 controls e5, so the hole on e5 becomes a home for your knight. [%cal Ge3f4,Gf4e5] } 7... O-O 8. Ne5 { The knight lands on the hole. No black pawn can ever chase it away from e5. [%cal Gf3e5] [%csl Ge5] } 8... Nbd7 )
5. Bd3 { The bishop goes to a strong diagonal and looks at the king side. [%cal Gf1d3] }
5... O-O { Black castles. }
6. Nbd2 { The second knight comes out to d2 so that it can support the e4 push later. [%cal Gb1d2,Gd2e4] }
6... b6 { Black prepares ...Bb7 to fight for e4. }
( 6... Nh5 { Black wants to trade the knight for your London bishop. } 7. Bg3 { Step back to g3. If Black takes the bishop, you take back with the h-pawn and your rook on h1 gets an open file towards Black's king. [%cal Gf4g3,Gh1h7] } 7... Nxg3?! { Taking the bishop actually helps you. } 8. hxg3 { Take back with the h-pawn. The open h-file is a gift for your rook, and your pawns still control e5 and f4. [%cal Gh2g3,Gh1h7] } 8... Nc6 )
7. h3 { A useful little move. Your bishop now has a safe square on h2 if Black plays ...Nh5 to chase it. [%cal Gh2h3,Gf4h2] }
7... Bb7 { The bishop joins the fight for the e4 square. }
8. O-O { King to safety before you open the centre. [%cal Ge1g1] }
8... d6 { Black stops your knight from coming to e5. }
9. Qe2 { Your queen gets ready to support the e4 push, your main plan against the Dutch. But first check one thing: once e4 is played and Black takes with ...fxe4, the f-file opens and Black's rook on f8 looks straight at your bishop on f4. Push e4 only when that bishop is safe or has stepped back to h2. [%cal Gd1e2,Ge3e4,Rf8f4] }
9... Qe8 { Black's queen heads for g6 or h5 to join an attack on your king. Keep your pieces near your king, tuck the bishop on h2 when needed, and prepare e4 slowly. }
`,
  },
  {
    id: 'vs-c5-benoni-style',
    title: 'Black hits d4 with an early ...c5',
    summary:
      'Black plays ...c5 before you have built your pyramid, either on move one (1...c5) or after 1...Nf6 2.Bf4 c5. You learn when to push past with d5 and when to stay calm with e3 and c3.',
    difficulty: 2,
    pgn: `
1. d4 { Your usual first move. [%cal Gd2d4] }
1... Nf6 { The most common reply. }
( 1... c5 { Black hits your d4 pawn at once, before any knight is out. } 2. d5 { When Black plays ...c5 this early, you can simply push past. Your pawn grabs space and nothing can easily attack it. [%cal Gd4d5] } 2... e5 { Black blocks the centre with pawns. } ( 2... Nf6 3. Nc3 { Develop, and guard d5 once more. [%cal Gb1c3,Gc3d5] } 3... d6 4. e4 { Now you have a big pawn centre. The pawns on d5 and e4 give you lots of space. [%cal Ge2e4] } 4... g6 ) 3. e4 { Build a big centre. Your e4 pawn supports d5, so it can stay there for the whole game. [%cal Ge2e4,Ge4d5] } 3... d6 4. Nc3 { The knight guards e4 and d5. [%cal Gb1c3] } 4... Be7 )
2. Bf4 { The London bishop comes out first, as always. [%cal Gc1f4] }
2... c5 { Black attacks d4 from the side. This is a good, active move. }
3. e3 { Keep it calm: the pawn on e3 guards d4 and opens a road for your other bishop. [%cal Ge2e3,Ge3d4] }
3... cxd4 { Black swaps pawns in the centre. }
( 3... d5 { Black adds ...d5 and the game looks like the normal London again. } 4. c3 { Build your pyramid. The pawn on c3 guards d4 a second time. [%cal Gc2c3] [%csl Gc3,Gd4,Ge3] } 4... Nc6 5. Nd2 { The knight goes to d2 so it can guard b3 and c4 if Black's queen comes to b6. It can go to f3 later. [%cal Gb1d2] } 5... e6 6. Ngf3 { The other knight comes out. You now have the classic London set-up. [%cal Gg1f3] } 6... Bd6 7. Bg3 { Keep your bishop. From g3 it still stares at d6, and if Black takes, you take back with the h-pawn. [%cal Gf4g3] } 7... O-O )
( 3... e6 { A quiet move. Black will probably play ...d5 next. } 4. Nf3 { Develop the knight. [%cal Gg1f3] } 4... d5 5. c3 { Same pyramid as always. You are back in the main London. [%cal Gc2c3] } 5... Nc6 )
4. exd4 { Take back with the e-pawn. Your bishop on f4 stays free, and the open e-file can be useful for a rook later. [%cal Ge3d4] }
4... d5 { Black puts a pawn in the centre too. }
5. c3 { Guard d4 with a pawn so your pieces are free to move. [%cal Gc2c3,Gc3d4] }
5... Nc6
6. Nf3 { The knight comes out and guards d4 again. [%cal Gg1f3] }
6... Bg4 { Black pins your knight to the queen. }
7. Nbd2 { Develop calmly. The knight on d2 gives the knight on f3 a second guard, so the pin is no longer a worry, and your queen is now free to move. [%cal Gb1d2,Gd2f3] }
7... e6
8. Qb3 { Now the bishop on g4 has left b7 without protection. Your queen hits b7 and also prepares to put more pressure on d5. [%cal Gd1b3,Gb3b7] }
8... Qc8
`,
  },
  {
    id: 'keep-calm-weird-moves',
    title: 'Black plays something weird: keep calm and develop',
    summary:
      'Black starts with an unusual move like 1...d6, 1...b6 or 1...h6. You do not need special theory: play your normal London, develop a piece every move, and punish only real mistakes.',
    difficulty: 1,
    pgn: `
1. d4 { Your usual first move. When Black does something strange, remember three rules: put a pawn in the centre, bring out a new piece every move, and castle early. Only look for a punishment when Black leaves something hanging. [%cal Gd2d4] }
1... d6 { An unusual first move. Black keeps the pawn on d6 and may try ...e5 next. }
( 1... b6 { Black wants to put a bishop on b7 to look along the long diagonal. } 2. Nf3 { Develop. The knight also blocks the long diagonal where Black's bishop wants to go. Grabbing the centre with 2.e4 is a bit more ambitious, but staying with your London set-up is simple and good. [%cal Gg1f3] } 2... Bb7 3. Bf4 { The normal London bishop. You do not need to change your plan. [%cal Gc1f4] } 3... e6 4. e3 { Guard d4 and open the way for your other bishop. [%cal Ge2e3] } 4... Nf6 5. Bd3 { The bishop goes to its best square and will be ready to support e4 later. [%cal Gf1d3] } 5... c5 6. c3 { Your usual pyramid. Calm and solid. [%cal Gc2c3] [%csl Gc3,Gd4,Ge3] } 6... Be7 7. Nbd2 { The last knight comes out and supports the e4 push. Next you castle. [%cal Gb1d2,Gd2e4] } 7... O-O )
( 1... h6 { A waiting move that does nothing for Black's development. } 2. Bf4 { Just play your London. Black wasted a move, so you will be a little ahead in development. Grabbing the centre with 2.e4 is also very good. [%cal Gc1f4] } 2... d5 3. e3 { Guard d4. [%cal Ge2e3] } 3... Nf6 4. Nf3 { Develop. [%cal Gg1f3] } 4... e6 5. c4 { With an extra move in your pocket you can also be more active. The c4 push attacks Black's centre. [%cal Gc2c4,Gc4d5] } 5... Be7 )
2. Bf4 { Same London set-up. Your bishop also looks at the d6 pawn. [%cal Gc1f4,Gf4d6] }
2... e5?! { Black tries to hit back in the centre, but this simply gives you a pawn. }
( 2... Nf6 3. e3 { Calm development. [%cal Ge2e3] } 3... g6 4. Nf3 { Develop the knight. Next you play Be2, h3 and castle. [%cal Gg1f3] } 4... Bg7 )
3. dxe5 { Take the pawn. Now look carefully at what happens if Black takes back. [%cal Gd4e5] }
3... Nc6 { Black gives up the pawn to develop quickly and attack your e5 pawn. }
( 3... dxe5 { Black takes back, but now the queens come off and the e5 pawn falls. } 4. Qxd8+ { Trade queens with check first. [%cal Gd1d8] } 4... Kxd8 5. Bxe5 { Now the bishop takes the pawn on e5. You are a pawn up and Black's king has lost the right to castle. [%cal Gf4e5] } 5... Nc6 { Black attacks your bishop. Step back to a safe square such as g3, and watch out for ...Nb4 hitting your c2 pawn. } )
4. Nf3 { Develop and protect your extra pawn on e5. [%cal Gg1f3,Gf3e5] }
4... dxe5? { Black wins the pawn back, or so it seems. }
( 4... Bg4 { The best try. Black develops and hopes to win the pawn back later. You are still a pawn up: carry on with e3, Be2 and castling, and do not grab more. } )
5. Qxd8+ { Trade queens first, so Black's king has to take back. [%cal Gd1d8] }
5... Kxd8
6. Nxe5 { Now take on e5 with the knight. If Black takes it, your bishop takes back and you are a clean pawn up. [%cal Gf3e5] }
6... Nxe5
7. Bxe5 { Your bishop is safe on e5 and you have an extra pawn. Black's king is stuck in the middle and cannot castle. [%cal Gf4e5] }
7... f6
`,
  },
]
