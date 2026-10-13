import type { OpeningCourse } from '../../types'

export const londonCourse: OpeningCourse = {
  id: 'london',
  name: 'London System',
  side: 'white',
  tagline: 'TODO',
  signatureMoves: ['d4', 'd5', 'Bf4'],
  ecoNames: [],
  overview: [],
  keyIdeas: [],
  commonMistakes: [],
  chapters: [
    {
      id: 'classic-pyramid',
      title: 'The classic set-up: the London pyramid',
      summary:
        'Black plays the most popular set-up: ...d5, ...Nf6, ...e6 and ...Bd6, then ...c5 and ...Nc6. This is the main road of the London, and everything else in the course builds on it.',
      difficulty: 1,
      pgn: `
1. d4 { Your first move takes space in the centre and opens the road for your bishop on c1. [%cal Gd2d4] }
1... d5 { Black copies you. }
2. Bf4 { The London bishop! You bring it out now, before you play e3, so it never gets locked in behind your own pawns. [%cal Gc1f4,Gf4b8] }
2... Nf6 { Black develops a knight. }
3. e3 { Now your d4 pawn is protected and your other bishop (on f1) has a free road. You will play this move in almost every London game. [%cal Ge2e3,Gf1d3] }
3... e6 { The most popular reply. It frees Black's own light-squared bishop and prepares ...Bd6. }
4. Nf3 { A knight to its natural square. It guards d4 and looks at the important e5 square. [%cal Gg1f3,Gf3e5] }
4... Bd6 { Black wants to swap off your London bishop. }
( 4... c5 { Black hits your d4 pawn straight away. Stay calm, one pawn move solves it. } 5. c3 { The pawn on c3 guards d4 and later gives your queen the b3 square. [%cal Gc2c3,Gc3d4] } 5... Nc6 { More pressure on d4. } 6. Nbd2 { Your second knight comes out on d2, so the c-pawn can stay on c3. [%cal Gb1d2] } 6... Bd6 7. Bg3 { The same idea as in the main line: the bishop stays alive and stares at d6. [%cal Gf4g3,Gg3d6] } 7... O-O 8. Bd3 { You have reached the main position by a different road. Carry on with the main line below. [%cal Gf1d3,Gd3h7] } 8... b6 )
5. Bg3 { The bishop steps back but stays strong. From g3 it keeps an eye on Black's bishop on d6. If Black takes it, you simply recapture with the h-pawn. [%cal Gf4g3,Gg3d6] }
5... O-O { Black castles to safety. }
6. Nbd2 { Your last knight comes out on d2, not on c3. That leaves the c-pawn free to move, and from d2 the knight can go to f3 later. [%cal Gb1d2] }
6... c5 { Black attacks your centre from the side. }
7. c3 { Now your pawns on c3, d4 and e3 make a solid triangle, a little pyramid that is very hard to break. [%cal Gc2c3] [%csl Gc3,Gd4,Ge3] }
7... Nc6 { More pressure on d4. }
( 7... Nbd7?? { This blocks the queen, so the bishop on d6 has no protection any more. } 8. Bxd6 { A free piece! Your bishop on g3 had been aiming at d6 all the time. [%cal Rg3d6] } 8... cxd4 9. cxd4 Re8 10. Bf4 { Your bishop goes home. You are a whole piece up, so just keep developing and avoid tricks. [%cal Gd6f4] } 10... e5 { Black throws a pawn forward to confuse you. Do not panic, you can simply take it. } )
8. Bd3 { The bishop goes to its best diagonal and aims straight at the h7 pawn next to Black's king. It also clears the way for castling. [%cal Gf1d3,Gd3h7] }
8... b6 { Black prepares to put a bishop on b7. This is the most natural plan. }
( 8... Qe7 { Black's queen steps aside and keeps an eye on e5. } 9. Ne5 { The jump you always look for. The knight is guarded by your d4 pawn and your bishop on g3. [%cal Gf3e5,Ge5c6] } 9... Nd7 { Black wants to trade your strong knight. } ( 9... Nxe5? { It looks natural, but it loses a piece! } 10. dxe5 { The pawn attacks the knight on f6 and the bishop on d6 at the same time. [%cal Rd4e5,Re5f6,Re5d6] } 10... Bxe5 11. Bxe5 { Black cannot take back: their own pawn on e6 blocks the queen. You are a piece up. [%cal Gg3e5] } 11... Rd8 ) 10. Ndf3 { Bring the second knight to f3. Now the knight on e5 is very well supported. [%cal Gd2f3] } 10... f5 { Black clamps down on e4 and builds a wall. } 11. Nxc6 { Trade off the knight on c6 so that Black has to recapture with a pawn and ruins their own structure. [%cal Ge5c6] } 11... bxc6 12. Bxd6 { Swap Black's good bishop for yours. Your remaining pieces work well together. [%cal Gg3d6] } 12... Qxd6 13. O-O { King to safety. Your structure is healthier than Black's: they have doubled pawns on the c-file. } 13... e5 { Black grabs the centre, but the game is balanced and you know exactly what to do next. } )
( 8... Bxg3 { Black swaps off your bishop. } 9. hxg3 { Take back with the h-pawn, never with the f-pawn! Your rook on h1 now looks down the open h-file at Black's king. [%cal Gh2g3,Gh1h7] } 9... Qe7 { Black brings the queen over and hopes to play ...Nd7. } ( 9... h6 { Black stops any trick on h7 straight away. } 10. Ne5 { Same jump. Your knight on e5 is strong and Black has weakened the king's side. [%cal Gf3e5] } 10... Nd7 11. Qh5 { Now your queen eyes the h6 pawn and the king-side. Black must be careful. [%cal Gd1h5] } 11... Ndxe5 12. dxe5 f5 ) 10. Ne5 { The knight jumps to the centre again, and now you have an extra threat on h7. [%cal Gf3e5,Gd3h7] } 10... g6 { Black blocks the h7 square with a pawn. This is the safe move. } ( 10... Nd7?? { Natural, but it is a blunder! Look at h7. } 11. Bxh7+ { The king cannot take this bishop, because your rook on h1 protects it. [%cal Rd3h7,Rh1h7] } 11... Kh8 12. Bc2+ { Discovered check from the rook on h1! The king is in a net. [%cal Rh1h8] } 12... Kg8 13. Rh8+ { A rook sacrifice to drag the king out. [%cal Gh1h8] } 13... Kxh8 14. Qh5+ Kg8 15. Qh7# ) 11. Qe2 { Your queen steps aside so that you can castle long later, and it guards the knight on e5. Your rook on h1 and the open h-file are your trumps. [%cal Gd1e2] } 11... Nxe5 12. dxe5 { Recapture with the pawn. It gains space and gives Black's knight less room. [%cal Gd4e5] } 12... Nd7 13. f4 { Support the e5 pawn with f4. Black's king side is full of holes and you have more space. [%cal Gf2f4] } 13... f6 )
( 8... Qc7 { Black puts the queen behind the bishop on d6. It looks solid, but it creates a hidden problem: the bishop on d6 and the queen on c7 now stand on the same line as your bishop on g3. } 9. dxc5 { Take the pawn! If the bishop on d6 moves away, your bishop takes the queen, so Black has to trade on g3. [%cal Gd4c5,Gg3c7] } 9... Bxg3 ( 9... Bxc5?? { This loses the queen! } 10. Bxc7 { The queen was hiding behind the bishop. [%cal Rg3c7] } 10... Re8 ) 10. hxg3 { Take back with the h-pawn. Black's knight on c6 blocks the queen, so Black cannot win the c5 pawn back at once. [%cal Gh2g3] } 10... h6 { Black stops any bishop trick on h7. } 11. O-O { King to safety. You have an extra pawn, and Black will need to work hard to win it back. [%cal Ge1g1] } 11... a5 )
( 8... Ne4? { Black puts a knight on e4 to grab space, but it is too early. } 9. Nxe4 { Take it. The knight on e4 is only guarded by the d5 pawn, so this wins a pawn by force. [%cal Gd2e4] } 9... dxe4 10. Bxe4 { You win a pawn: the bishop takes e4 and nothing recaptures. [%cal Gd3e4] } 10... cxd4 11. exd4 Ne7 12. O-O { Castle and keep it simple. You are a pawn up. [%cal Ge1g1] } 12... Rb8 )
( 8... Qb6?? { Black attacks b2, but forgets that the bishop on d6 is now unprotected! } 9. Bxd6 { A free bishop. Always check what a move leaves unprotected. [%cal Rg3d6] } 9... c4 10. Bxf8 { And the rook on f8 falls too. [%cal Gd6f8] } 10... Kxf8 11. Be2 { Your attacked bishop steps back. You are a whole rook up, even if Black now grabs a pawn. [%cal Gd3e2] } 11... Qxb2 12. Qc1 { Offer a queen trade. When you are far ahead, trading pieces makes the win simple. [%cal Gd1c1] } 12... Qxc1+ )
9. Ne5 { The key idea of the whole London! The knight lands on e5, where it is protected by your d4 pawn and your bishop on g3, and it attacks the knight on c6 and the pawn on f7. [%cal Gf3e5,Ge5c6,Ge5f7] }
9... Bb7 { Black develops the last bishop. }
( 9... Nxe5? { A natural-looking trade, but it loses a piece! } 10. dxe5 { The pawn attacks the knight on f6 and the bishop on d6 at the same time. Black can only save one. [%cal Rd4e5,Re5f6,Re5d6] } 10... Be7 11. exf6 { You win the knight. } 11... Bxf6 12. O-O { You are a piece up for a pawn. Castle and play on calmly. [%cal Ge1g1] } 12... Bb7 )
10. Ndf3 { Bring the second knight to f3. The knight on e5 is now very well supported, and you can trade on c6 whenever you like. [%cal Gd2f3] }
10... Ne4 { Black plants a knight on e4. }
( 10... Qc7 { Black adds a defender to the knight on c6. } 11. Nxc6 { Trade first. This removes the main defender of the dark squares. [%cal Ge5c6] } 11... Bxc6 12. Bxd6 { Swap your bishop for Black's dark bishop. [%cal Gg3d6] } 12... Qxd6 13. O-O { King to safety, and now you can plan Ne5 again. [%cal Ge1g1] } 13... Nd7 14. Re1 { The rook supports a future e4 break. [%cal Ga1e1] } 14... Rac8 )
11. Nxc6 { Trade your knight for the knight on c6. Black's bishop on d6 loses a friend. [%cal Ge5c6] }
11... Bxc6
12. Bxd6 { Swap bishops. You are happy to trade: Black's dark bishop was the piece that wanted to harass your London bishop. [%cal Gg3d6] }
12... Nxd6
13. O-O { King to safety. Black has no real way to attack you. }
13... Qe7
14. Ne5 { The knight goes back to its dream square. From e5 it eyes c6 and f7, and it can never be chased away by a pawn without a weakness. [%cal Gf3e5] }
14... Bb7 { Black avoids the trade. }
15. Bc2 { Keep your bishop alive. You will follow up with Nd3, f3 and e4, or with Qe2 and Rae1. The position is level, but you understand it better. [%cal Gd3c2] }
15... Rac8
`,
    },
    {
      id: 'slav-style-c6',
      title: 'Black builds a solid wall with ...c6',
      summary:
        'Black plays ...c6 (and often ...e6) to make a sturdy pawn wall. It is safe but a bit passive, so you answer with calm development and look out for a few loose pieces.',
      difficulty: 1,
      pgn: `
1. d4 { Your usual start: take space in the centre. [%cal Gd2d4] }
1... d5
2. Bf4 { The London bishop comes out before the e-pawn blocks it. [%cal Gc1f4] }
2... Nf6
3. e3 { This guards d4 and gives your f1-bishop a free road. [%cal Ge2e3,Gf1d3] }
3... c6 { Black builds a pawn wall on c6 and d5. It is a safe set-up, though a little passive. }
4. Nf3 { Develop a knight. It guards d4 and looks at e5. [%cal Gg1f3] }
4... e6 { The most common follow-up. Black's c8-bishop is now locked inside the pawn wall. }
( 4... Bf5 { Black brings the bishop out before playing e6, the classic Slav idea. } 5. Bd3 { Challenge the bishop at once. Trading it takes away Black's best minor piece. [%cal Gf1d3,Gd3f5] } 5... Bxd3 ( 5... e6 { Black gets ready to take back on f5 with a pawn. } 6. Bxf5 { Take the bishop first. The trade also removes the piece Black was proud of. [%cal Gd3f5] } 6... exf5 7. Nbd2 { Bring the last knight out. [%cal Gb1d2] } 7... Bd6 8. Bxd6 { Trade the dark-squared bishops. You are happy to simplify. [%cal Gf4d6] } 8... Qxd6 9. O-O { King to safety. [%cal Ge1g1] } 9... O-O 10. Qe2 { The queen eyes e-file and keeps everything protected. Do not play Ne5 here, because ...Nxe5 dxe5 ...Qxe5 would win a pawn for Black. [%cal Gd1e2] } 10... Nbd7 11. c4 { Grab space and open the c-file. Your position is healthy and easy to play. [%cal Gc2c4] } 11... a5 ) ( 5... Nbd7?? { Black forgets that the bishop on f5 is loose. } 6. Bxf5 { A free bishop! [%cal Rd3f5] } 6... e6 7. Bd3 { Safe and sound. You are a whole piece up. [%cal Gf1d3] } 7... Be7 ) 6. Qxd3 { Recapture with the queen. Now your queen watches the whole d3-h7 diagonal. [%cal Gd1d3] } 6... e6 7. O-O { King to safety before anything happens. [%cal Ge1g1] } 7... Bd6 8. Bxd6 Qxd6 9. Nbd2 { Last piece into play. Your position is solid and flexible. [%cal Gb1d2] } 9... Nbd7 10. e4 { The e4 break! You open the centre now that all your pieces are ready. [%cal Ge3e4] } 10... dxe4 ( 10... e5? { This opens the position at the wrong moment. } 11. dxe5 { Take it. Black's pawn on c6 and the knight on d7 get in each other's way. [%cal Gd4e5] } 11... Nxe5 12. Nxe5 Qxe5 13. exd5 ) 11. Nxe4 Nxe4 12. Qxe4 { Both queens are active. The position is balanced and simple to play. [%cal Gd3e4] } 12... O-O 13. c4 { Grab space on the queenside and open the c-file for your rooks. [%cal Gc2c4] } 13... h6 )
( 4... Bg4 { Black pins your knight to the queen. } 5. h3 { Ask the bishop what it wants to do. It has to decide right now. [%cal Gh2h3,Rh3g4] } 5... Bxf3 ( 5... Bh5 { Black keeps the pin. } 6. g4 { Push the bishop away. It looks brave, but it is safe here. [%cal Gg2g4] } 6... Bg6 7. Ne5 { Your knight lands on the strong square. If Black swaps it off, you get the open h-file. [%cal Gf3e5,Ge5g6] } 7... Nbd7 8. Nxg6 hxg6 9. Bg2 { The bishop on g2 looks along the long diagonal, and Black has doubled pawns on g6 and g7. [%cal Gf1g2] } 9... e6 10. Nd2 { Last piece into play. You have a healthy position and Black's pawns on g6 and g7 are a long-term weakness. [%cal Gb1d2] } 10... Nb6 ) 6. Qxf3 { Take back with the queen. You now own the two bishops, which is a long-term plus. [%cal Gd1f3] } 6... e6 7. Nd2 { The last knight comes out and gets ready for c3 or c4. [%cal Gb1d2] } 7... Bd6 8. Bxd6 { Swap the dark-squared bishops: after that Black has no easy way to attack your king. [%cal Gf4d6] } 8... Qxd6 9. c4 { Take space and fight for the centre. [%cal Gc2c4] } 9... Nbd7 10. Be2 { The bishop goes to e2, ready for castling. [%cal Gf1e2] } 10... O-O 11. a3 { A useful little move: it stops ...Qb4 and prepares b4 later. [%cal Ga2a3] } 11... e5 )
( 4... Qb6 { Black attacks your b2 pawn. } 5. Qc1 { The queen steps back to guard b2. Never defend with Nc3 here, because ...Qxb2 wins a pawn. [%cal Gd1c1,Rb6b2] } 5... Bf5 6. Bd3 { Challenge the bishop. [%cal Gf1d3,Gd3f5] } 6... Bxd3 ( 6... Nbd7?? { Black forgets that the bishop on f5 is loose. } 7. Bxf5 { A free bishop! [%cal Rd3f5] } 7... e6 8. Bd3 { Safe and sound. You are a whole piece up. [%cal Gf1d3] } 8... Be7 ) 7. cxd3 { Take back with the c-pawn, because your queen on c1 cannot reach d3. The doubled pawns are no problem, and you get the half-open c-file. [%cal Gc2d3] } 7... e6 8. Nc3 { Now that b2 is safe, the knight can come to c3. [%cal Gb1c3] } 8... Nbd7 9. h3 { Give the bishop a retreat square and stop any ...Ng4 or ...Bg4 ideas. [%cal Gh2h3] } 9... c5 )
( 4... Nbd7 { Black brings the queen's knight out. } 5. c3 { Your pyramid is ready, and the b2 pawn is safe from ...Qb6. [%cal Gc2c3] } 5... e6 6. Nbd2 { Bring the last knight out. [%cal Gb1d2] } 6... Bd6?? { Black forgets that the knight on d7 blocks the queen. } 7. Bxd6 { A free piece. Look: nothing guards the bishop on d6. [%cal Rf4d6] } 7... b6 8. Bg3 { The bishop goes home. You are a clean piece up. [%cal Gd6g3] } 8... c5 )
5. Bd3 { The bishop goes to its best diagonal. It aims at h7 and gets ready for castling. [%cal Gf1d3,Gd3h7] }
5... Bd6 { Black offers to trade your London bishop. }
( 5... Nh5 { Black attacks your bishop with the knight on the edge. } 6. Bg5 { Move the bishop with a threat: it now attacks the queen on d8! [%cal Gf4g5,Rg5d8] } 6... Be7 ( 6... h6?? { Black overlooks the threat on d8. } 7. Bxd8 { The queen falls for just a bishop. [%cal Rg5d8] } 7... Kxd8 ) 7. Bxe7 { Trade bishops. The knight on h5 is out of play, so this suits you. [%cal Gg5e7] } 7... Qxe7 8. Ne5 { The strong outpost square again. [%cal Gf3e5] } 8... Nf6 )
6. Bg3 { Keep the bishop alive on g3, where it aims at d6. [%cal Gf4g3,Gg3d6] }
6... O-O
7. Nbd2 { The last knight comes out. [%cal Gb1d2] }
7... b6 { Black prepares to develop the c8-bishop on a6 or b7. }
( 7... c5 { Black plays a second pawn move with the same pawn. } 8. c3 { The pawn pyramid is complete. [%cal Gc2c3] } 8... Nc6 9. Ne5 { You are a whole move ahead of the main London lines: the knight jumps in right away. [%cal Gf3e5] } 9... Nxe5? { This loses a piece. } 10. dxe5 { The pawn attacks the bishop on d6 and the knight on f6 at the same time. [%cal Rd4e5,Re5d6,Re5f6] } 10... Be7 11. exf6 Bxf6 12. O-O )
( 7... Nbd7?? { This blocks the queen, so the bishop on d6 loses its protection. } 8. Bxd6 { A free piece. [%cal Rg3d6] } 8... Re8 9. Bg3 { The bishop goes home. You are a clean piece up. [%cal Gd6g3] } 9... c5 )
8. e4 { The e4 break! Your pieces are ready, so you open the centre. [%cal Ge3e4] }
8... dxe4
( 8... Nxe4 9. Nxe4 dxe4 10. Bxe4 { You swapped a pair of knights and won back the pawn. Your bishop is strong on e4. [%cal Gd3e4] } 10... Ba6 11. c3 { A solid move: it gives the queen the a4 square and protects d4. [%cal Gc2c3] } 11... Bc4 )
9. Nxe4 Nxe4 10. Bxe4 { The bishop is centralised and your pieces are active. [%cal Gd3e4] }
10... Ba6
11. c3 { Protect d4 and prepare Qa4 or Qc2. [%cal Gc2c3] }
11... Qc7
12. Qa4 { Hit the bishop on a6 and keep the position under control. [%cal Gd1a4,Ga4a6] }
12... Bb7
13. Bxd6 { Trade the dark-squared bishops. [%cal Gg3d6] }
13... Qxd6
14. Ne5 { The knight lands on e5 again, with the better pieces behind it. [%cal Gf3e5] }
14... Nd7
`,
    },
    {
      id: 'mirror-bf5',
      title: 'Black copies you with ...Bf5',
      summary:
        'Black develops their own bishop to f5, the mirror image of your London bishop. You challenge it with Bd3 and keep the position healthy.',
      difficulty: 1,
      pgn: `
1. d4 { Your usual first move. [%cal Gd2d4] }
1... d5
2. Bf4 { The London bishop comes out first. [%cal Gc1f4] }
2... Nf6 { Black develops a knight. }
( 2... Bf5 { Black copies your bishop move right away. } 3. e3 { The same solid move as always. [%cal Ge2e3] } 3... e6 4. Nf3 { Develop the knight. [%cal Gg1f3] } 4... Nf6 5. Bd3 { You are back in the main line of this chapter. Challenge the bishop on f5. [%cal Gf1d3,Gd3f5] } 5... Bxd3 6. Qxd3 { Take back with the queen. [%cal Gd1d3] } 6... c5 )
3. e3 { Support d4 and free the f1-bishop. [%cal Ge2e3,Gf1d3] }
3... Bf5 { Black puts their bishop on the same kind of diagonal as yours. This is a very popular reply. }
4. Nf3 { Develop. The knight guards d4 and looks at e5. [%cal Gg1f3] }
4... e6 { Black closes the diagonal for their own bishop but keeps it solid. }
( 4... Nbd7 { Black adds another piece to the centre. } 5. Bd3 { Challenge the bishop. [%cal Gf1d3,Gd3f5] } 5... Bxd3 6. Qxd3 { Take back with the queen. It eyes the b5 and b3 squares. [%cal Gd1d3] } 6... e6 7. Qb3 { The queen attacks the pawn on b7 and the pawn on d5. Black has to react. [%cal Gd3b3,Rb3b7] } 7... Qc8 8. c4 { Increase the pressure on d5. [%cal Gc2c4] } 8... dxc4 9. Qxc4 { Take the pawn back. Your queen is active, and your position is healthy. [%cal Gb3c4] } 9... c5 )
( 4... Nh5 { Black hits your bishop with the knight. } 5. Be5 { The bishop jumps to the centre. If Black takes it, you recapture with a knight or pawn and you stay solid. [%cal Gf4e5] } 5... e6 6. c4 { Take space and attack d5. [%cal Gc2c4] } 6... Nd7 7. Nc3 { Bring another piece into play. Now Black must be careful about the knight on e5. [%cal Gb1c3] } 7... c6 8. Be2 { The bishop prepares to castle and protects the knight on f3. [%cal Gf1e2] } 8... Be7 )
5. Bd3 { Challenge Black's bishop. If it is traded, Black loses their best minor piece. [%cal Gf1d3,Gd3f5] }
5... Bxd3 { Black accepts the trade. }
( 5... Ne4 { Black puts a knight on e4. } 6. Bxe4 { Trade it off. [%cal Gd3e4] } 6... Bxe4 7. Nbd2 { Challenge the bishop on e4 with the second knight. [%cal Gb1d2,Gd2e4] } 7... Bd6 ( 7... Bxf3 8. Nxf3 { Take back with the knight. The bishop on f4 stays strong. [%cal Gd2f3] } 8... Bd6 9. Bxd6 Qxd6 10. O-O { King to safety. [%cal Ge1g1] } 10... O-O 11. Rc1 { Get the rook onto the open c-file before Black can play ...c5. [%cal Ga1c1] } 11... c6 ) 8. Bxd6 { Swap the dark-squared bishops. [%cal Gf4d6] } 8... cxd6 9. Nxe4 { Take the bishop. [%cal Gd2e4] } 9... dxe4 10. Nd2 { Attack the pawn on e4 from the side. [%cal Gf3d2,Gd2e4] } 10... f5 11. c4 { Take space on the queenside. Your pieces are safe and the game is balanced. [%cal Gc2c4] } 11... O-O )
( 5... Nc6 { Black attacks d4 a second time. } 6. Bxf5 { Trade your bishop for theirs first. [%cal Gd3f5] } 6... exf5 7. O-O { Castle. The pawn on f5 is a long-term weakness for Black. [%cal Ge1g1] } 7... Bd6 8. Bxd6 { Trade the dark-squared bishops too. [%cal Gf4d6] } 8... cxd6 9. Qd3 { The queen guards d4 and eyes the pawn on f5. [%cal Gd1d3] } 9... g6 10. b3 { A quiet move that prepares c4 so you can fight for d5. [%cal Gb2b3] } 10... O-O )
6. Qxd3 { Take back with the queen. It now eyes the b5 and b3 squares. [%cal Gd1d3] }
6... Bd6 { Black offers to trade the other bishops too. }
( 6... c5 { Black hits your d4 pawn. } 7. dxc5 { Take the pawn. Black will get it back, but you gain time. [%cal Gd4c5] } 7... Nc6 8. Nbd2 { Bring the last knight out and keep the king-side solid. [%cal Gb1d2] } 8... Bxc5 9. O-O { King to safety. [%cal Ge1g1] } 9... O-O 10. Rfd1 { The rook comes to the d-file where the pawn on d5 is. [%cal Gf1d1] } 10... Qe7 11. Bg5 { Pin the knight on f6 and add pressure on d5. [%cal Gf4g5,Rg5f6] } 11... Rfd8 )
7. Bxd6 { Swap the dark-squared bishops. Your London bishop has done its job. [%cal Gf4d6] }
7... Qxd6
8. c4 { Now go for the centre: you attack d5 and gain space. [%cal Gc2c4,Gc4d5] }
8... dxc4
9. Qxc4 { Take the pawn back. Your queen is active. [%cal Gd3c4] }
9... Nbd7
10. O-O { King to safety. [%cal Ge1g1] }
10... O-O
11. Nc3 { Develop the last piece and prepare to take the centre with e4. [%cal Gb1c3] }
11... Nb6
12. Qb3 { The queen moves out of the knight's attack and keeps an eye on b7. [%cal Gc4b3] }
12... Rfc8
`,
    },
    {
      id: 'bishop-harassment',
      title: 'Black goes after your bishop (...Ne4, ...Bxg3)',
      summary:
        'Black tries to chase or trade your London bishop with a knight jump or a bishop swap. You stay calm: develop, use the open h-file and watch for easy tricks.',
      difficulty: 2,
      pgn: `
1. d4 { Your usual first move. [%cal Gd2d4] }
1... d5
2. Bf4 { The London bishop comes out first. [%cal Gc1f4] }
2... Nf6
3. e3 { Solid support for d4. [%cal Ge2e3] }
3... Ne4 { Black jumps a knight into the middle straight away. It looks annoying, but it is easy to handle. }
( 3... e6 { Black plays the normal move first and waits to harass your bishop. } 4. Nf3 { Develop a knight. [%cal Gg1f3] } 4... Bd6 { Black offers to trade your bishop. } 5. Bg3 { Retreat to g3 so that you can recapture with the h-pawn. [%cal Gf4g3,Gg3d6] } 5... Ne4 { Now the knight attacks your bishop on g3. } 6. Bd3 { Develop with a little threat. If the knight takes on g3, you recapture with the h-pawn and your rook looks down the h-file. [%cal Gf1d3,Gd3e4] } 6... Nxg3 ( 6... f5 { Black defends the knight with a pawn. } 7. Nbd2 { Challenge the knight on e4. The bishop on g3 is protected by your h-pawn. [%cal Gb1d2,Gd2e4] } 7... O-O 8. c4 { Pressure on d5 and a threat to take on e4. [%cal Gc2c4] } 8... Nc6 ) 7. hxg3 { Take back with the h-pawn. Your rook on h1 now looks at h7, and your pawn structure is healthy. [%cal Gh2g3,Gh1h7] } 7... Qe7 ( 7... O-O?? { Castling into the open h-file is a blunder! } 8. Bxh7+ { The king cannot take the bishop, because your rook on h1 guards it. [%cal Rd3h7,Rh1h7] } 8... Kh8 9. Ne5 { Now you threaten Bg6+ with a discovered check from the rook, and Rh5 as well. [%cal Gf3e5,Rh1h8] } 9... Qg5 ) 8. Nbd2 { Bring the knight out. Next you will castle long or short. [%cal Gb1d2] } 8... c5 9. c4 { Hit d5 from the side and open the position while your pieces are ready. [%cal Gc2c4] } 9... Nc6 10. dxc5 { Take the pawn and open the diagonal for the d3-bishop. [%cal Gd4c5] } 10... Bxc5 11. a3 { A useful waiting move: it prevents ...Bb4 and ...Nb4. [%cal Ga2a3] } 11... g6 )
4. Nd2 { Challenge the knight at once! If Black takes on d2, your queen recaptures and your development is easy. [%cal Gb1d2,Gd2e4] }
4... Nxd2 { Black trades. }
( 4... Bf5 { Black defends the knight with a bishop. } 5. Nxe4 { Trade. [%cal Gd2e4] } 5... Bxe4 6. f3 { Attack the bishop on e4 with a pawn. [%cal Gf2f3,Rf3e4] } 6... Bg6 7. h4 { A famous London idea: the pawn heads for h5 and wants to trap the bishop on g6. [%cal Gh2h4,Gh4h5] } 7... h5 { Black stops the pawn from going further. } ( 7... e6? { This lets the bishop get chased around. } 8. h5 { The bishop on g6 is attacked and has to run. [%cal Gh4h5,Rh5g6] } 8... Bf5 9. g4 { Chase it again. The bishop has almost no safe squares left. [%cal Gg2g4] } 9... e5 10. Bxe5 { Take the pawn: Black cannot take back, because the knight on b8 is not guarding e5 and the f6 knight is gone. You are a solid pawn up with a big attack. [%cal Gf4e5] } 10... Be6 ) 8. c4 { Hit the centre. Black's bishop is stuck on g6 and the king-side is yours to attack. [%cal Gc2c4] } 8... c6 9. Qb3 { Attack b7 and offer a queen trade. [%cal Gd1b3,Rb3b7] } 9... Qb6 10. Qxb6 { Trade queens: you keep a small plus because your pieces are better. [%cal Gb3b6] } 10... axb6 11. cxd5 { Take the pawn. Black has doubled pawns on the b-file and you are slightly better. [%cal Gc4d5] } 11... cxd5 )
( 4... f5?! { Black defends the knight with a pawn, but it weakens the king-side. } 5. Nxe4 { Take it. [%cal Gd2e4] } 5... dxe4 ( 5... fxe4 { Black takes with the f-pawn. } 6. Qh5+ { Check! The queen also eyes c7. [%cal Gd1h5,Rh5c7] } 6... g6 7. Qe5 { A double attack on the rook on h8 and the pawn on c7. [%cal Gh5e5,Re5h8,Re5c7] } 7... Rg8 8. Qxc7 { Take the pawn and offer a queen swap. [%cal Ge5c7] } 8... Qxc7 9. Bxc7 { You won a pawn cleanly. [%cal Gf4c7] } 9... Nc6 10. h4 { Gain space on the king-side, with an extra pawn in your pocket. [%cal Gh2h4] } 10... Bf5 ) 6. Bc4 { Develop with a threat on the weak e6 and g8 squares. [%cal Gf1c4] } 6... Nc6 7. Nh3 { The knight goes to the rim, but it heads for f4 and g5. [%cal Gg1h3] } 7... e5 8. dxe5 { Take the pawn. [%cal Gd4e5] } 8... Qxd1+ 9. Rxd1 { Recapture with the rook. Black has weak pawns on e4 and f5. [%cal Ga1d1] } 9... h6 )
( 4... Nf6 { Black retreats the knight. You just gained a tempo. } 5. Ngf3 { The other knight comes to f3. [%cal Gg1f3] } 5... e6 6. Bd3 { Develop. [%cal Gf1d3] } 6... c5 7. c3 { Support d4. [%cal Gc2c3] } 7... Nc6 8. O-O { King to safety. [%cal Ge1g1] } 8... Be7 9. Ne5 { The knight lands on e5. [%cal Gf3e5] } 9... O-O )
5. Qxd2 { Take back with the queen. It eyes the long diagonal and the h6 square. [%cal Gd1d2] }
5... e6 { Black builds a solid centre. }
( 5... Bf5 6. Bd3 { Challenge the bishop. [%cal Gf1d3,Gd3f5] } 6... Bxd3 7. Qxd3 { Take back with the queen. [%cal Gd2d3] } 7... Nd7 8. Nf3 { Develop. [%cal Gg1f3] } 8... e6 9. O-O { King to safety. [%cal Ge1g1] } 9... c6 )
( 5... c5?! { Black hits d4, but leaves the d5 pawn without enough support. } 6. dxc5 { Take the pawn. [%cal Gd4c5] } 6... e6 7. O-O-O { Castle long. Your king is safe, and the d-file is yours. [%cal Ge1c1] } 7... Nc6 8. Bb5 { Pin the knight and attack the centre. [%cal Gf1b5,Rb5c6] } 8... Bxc5 ( 8... f6 { Black supports the e5 square, but it weakens the king. } 9. e4 { Open the centre while Black's king is still in the middle. [%cal Ge3e4] } 9... dxe4? 10. Qxd8+ { The queen takes with check. The knight on c6 is pinned, so nothing can take it back. [%cal Gd2d8,Rb5c6] } 10... Kf7 11. Bxc6 { Take the pinned knight. Black is lost. [%cal Gb5c6] } 11... bxc6 12. Qc7+ Be7 ) 9. Qc3 { Threaten the pinned knight and the bishop on c5. [%cal Gd2c3,Rc3c5] } 9... Bf8 10. Nf3 { Develop. [%cal Gg1f3] } 10... Qb6 11. Ba4 { Keep the pin and the bishop pair. [%cal Gb5a4] } 11... Qa6 )
6. Nf3 { Develop. [%cal Gg1f3] }
6... Nd7
7. Bd3 { The bishop aims at h7 and prepares to castle. [%cal Gf1d3,Gd3h7] }
7... Bd6 { Black offers to trade the London bishop again. }
8. h4 { A useful move: it prepares h5 and gives the bishop a retreat square on h2. [%cal Gh2h4] }
8... Qe7
9. h5 { Gain space on the king-side. [%cal Gh4h5] }
9... h6 { Black stops the pawn from going further. }
10. O-O-O { Castle long. Your king is safe, and your rooks are ready for action on the open files. [%cal Ge1c1] }
10... c5
`,
    },
    {
      id: 'early-c5',
      title: 'Black hits back early with ...c5 and ...Qb6',
      summary:
        'Black plays ...c5 at once, often followed by ...Nc6 and ...Qb6 to attack your b2 pawn. You answer with e3 and c3, and you know how to guard b2 safely.',
      difficulty: 2,
      pgn: `
1. d4 { Your usual first move. [%cal Gd2d4] }
1... d5
2. Bf4 { The London bishop comes out first. [%cal Gc1f4] }
2... c5 { Black strikes at d4 immediately. This is a gambit-like idea: if you take on c5, Black gets quick play. Stay calm and simply defend your centre. }
( 2... Nf6 { Black develops first and plays ...c5 next. } 3. e3 { Solid support for d4. [%cal Ge2e3] } 3... c5 4. c3 { The pawn on c3 guards d4 and gives your queen the b3 square. [%cal Gc2c3,Gc3d4] } 4... Qb6 { Black attacks the pawn on b2. } 5. Qb3 { Offer a queen trade. It protects b2 and keeps your pawn structure healthy. [%cal Gd1b3,Rb6b2] } 5... Qxb3?! ( 5... Nc6 6. Nd2 { Bring the knight out. It does not block the c-pawn. [%cal Gb1d2] } 6... e6 7. Be2 { A flexible square: the bishop can go to f3 or stay at home. [%cal Gf1e2] } 7... Be7 8. Ngf3 { Develop the last knight. [%cal Gg1f3] } 8... Bd7 ) 6. axb3 { Recapture with the a-pawn. It looks ugly, but you get an open a-file and your bishop on f4 attacks b8. [%cal Ga2b3,Ga1a7] } 6... e6 7. Bxb8 { Take the knight. [%cal Gf4b8] } 7... Rxb8 8. Rxa7 { Grab a pawn. The a-file is yours. [%cal Ga1a7] } 8... Bd6 )
3. e3 { Support d4 and free the f1-bishop. [%cal Ge2e3,Gf1d3] }
3... Nc6 { Black adds more pressure on d4. }
( 3... cxd4 { Black takes the pawn. } 4. exd4 { Recapture. The e-file opens for your rooks and the f1-bishop is free. [%cal Ge3d4] } 4... Nc6 5. c3 { Protect d4 with the pawn. [%cal Gc2c3] } 5... Bf5 6. Qb3 { Attack the pawn on b7 and the pawn on d5. [%cal Gd1b3,Rb3b7] } 6... Qd7 ( 6... Na5? { Black attacks the queen, but forgets about the check on b5. } 7. Qb5+ { A check that also attacks the knight on a5 and the pawn on d5. [%cal Gb3b5,Rb5a5] } 7... Bd7 8. Qxd5 { You won a pawn. [%cal Gb5d5] } 8... Nf6 9. Qf3 ) 7. Nf3 { Develop. [%cal Gg1f3] } 7... e6 8. Nbd2 { The last knight comes out. [%cal Gb1d2] } 8... Nge7 9. Nh4 { Hit the bishop on f5. [%cal Gf3h4,Rh4f5] } 9... Ng6 )
( 3... Qb6?! { Black attacks b2 at once, before you can play c3. This is a bit too early. } 4. Nc3 { A tactical surprise: if Black grabs b2, the knight takes on d5 with a big attack. [%cal Gb1c3,Rb6b2] } 4... Nf6 ( 4... Qxb2? { Greedy! } 5. Nxd5 { Now the queen on b2 is cut off and Black's king is in trouble. [%cal Gc3d5] } 5... Bf5 6. Qb1 { Attack the queen on b2 and offer a trade. Black's king is stuck in the middle. [%cal Gd1b1,Rb1b2] } 6... Qxb1+ 7. Rxb1 { Your rook is active and Nc7+ is coming. [%cal Ga1b1] } 7... Kd8 ) ( 4... e6 5. Nb5 { The knight jumps to b5 and threatens Nc7+. [%cal Gc3b5,Rb5c7] } 5... Na6 6. c3 { Support d4. [%cal Gc2c3] } 6... Nf6 7. Nf3 { Develop. [%cal Gg1f3] } 7... c4 ) 5. dxc5 { Take the pawn. [%cal Gd4c5] } 5... Qxc5 6. Nb5 { Threaten Nc7+ and Nxa7. [%cal Gc3b5,Rb5c7] } 6... Na6 7. a4 { Protect the knight on b5 and keep it there. [%cal Ga2a4] } 7... e6 8. Nf3 { Develop. [%cal Gg1f3] } 8... Bd7 9. Be2 { King-side castling is next. [%cal Gf1e2] } 9... Be7 10. Ne5 { The knight lands on e5 and attacks the bishop on d7. [%cal Gf3e5,Re5d7] } 10... O-O 11. Nxd7 { Trade your knight for the bishop. [%cal Ge5d7] } 11... Nxd7 12. O-O { King to safety. You have more space and a lead in development. [%cal Ge1g1] } 12... Nf6 )
4. c3 { Protect d4. The pyramid of pawns c3, d4, e3 is complete. [%cal Gc2c3] }
4... Nf6 { Black develops. }
( 4... Qb6 { Black attacks b2 again. } 5. Qc2 { The queen guards b2 and keeps an eye on the diagonal to g6. [%cal Gd1c2,Rb6b2] } 5... Nf6 6. Nf3 { Develop. [%cal Gg1f3] } 6... e6 7. Nbd2 { Another knight into play. [%cal Gb1d2] } 7... Bd6?? { Black forgets that the queen on b6 does not guard d6! } 8. Bxd6 { A free bishop. [%cal Rf4d6] } 8... Nxd4 9. cxd4 { Take the knight. [%cal Gc3d4] } 9... Qxd6 10. dxc5 { You are a piece up. The queen on d6 has to move away. [%cal Gd4c5,Rc5d6] } 10... Qe7 )
5. Nd2 { Develop with the knight to d2, so that the c-pawn stays free and the g1-knight can come to f3. [%cal Gb1d2] }
5... e6
( 5... Bf5 { Black develops the bishop outside the pawn chain. } 6. Ngf3 { Develop. [%cal Gg1f3] } 6... e6 7. Bb5 { Pin the knight on c6. [%cal Gf1b5,Rb5c6] } 7... Qb6 8. Qa4 { Keep the pin and protect b5. [%cal Gd1a4] } 8... a6 9. Bxc6+ { Take the knight. [%cal Gb5c6] } 9... bxc6 10. dxc5 { Win a pawn and hit the queen. [%cal Gd4c5,Rc5b6] } 10... Bxc5 )
( 5... Qb6 { Black attacks b2 once more. } 6. Qb3 { Offer a queen trade. [%cal Gd1b3] } 6... e6 7. Ngf3 { Develop. [%cal Gg1f3] } 7... Bd7 8. h3 { Prevent ...Ng4 and give the bishop a retreat. [%cal Gh2h3] } 8... Be7 9. g4 { A pawn storm on the king-side. [%cal Gg2g4] } 9... O-O 10. Qxb6 { Now trade queens: you keep a healthy position. [%cal Gb3b6] } 10... axb6 )
6. Ngf3 { Develop. [%cal Gg1f3] }
6... Bd6 { Black offers to trade bishops. }
7. Bg3 { The bishop retreats to g3. [%cal Gf4g3,Gg3d6] }
7... O-O
8. Bd3 { The bishop goes to its best diagonal, aimed at h7. [%cal Gf1d3,Gd3h7] }
8... b6
9. Ne5 { Land on e5, with the help of the pawn on d4. [%cal Gf3e5] }
9... Bb7
`,
    },
    {
      id: 'pins-and-pokes',
      title: 'Black pins your knight or pokes the centre (...Bg4, ...Nc6, ...e5)',
      summary:
        'Black develops a bishop to g4 to pin your knight, or plays ...Nc6 and ...e5 to fight for the centre. You keep your pieces safe and win a pawn if Black overreaches.',
      difficulty: 2,
      pgn: `
1. d4 { Your usual first move. [%cal Gd2d4] }
1... d5
2. Bf4 { The London bishop comes out first. [%cal Gc1f4] }
2... Nf6
( 2... Nc6 { Black develops the knight first. It eyes d4 and e5. } 3. e3 { Support d4 and free the f1-bishop. [%cal Ge2e3,Gf1d3] } 3... Nf6 ( 3... e5? { Black hits the centre at once, but it does not work yet. } 4. dxe5 { Take the pawn. Black has no strong follow-up. [%cal Gd4e5] } 4... Nge7 5. Nc3 { Bring a knight out. You are a pawn up and simply need to keep it. [%cal Gb1c3] } 5... Be6 6. Nf3 { The knight protects the pawn on e5 and gets ready for Bd3. [%cal Gg1f3,Gf3e5] } 6... Qd7 7. Bd3 { Develop with a bishop. Black has nothing to show for the pawn. [%cal Gf1d3] } 7... Ng6 8. Bg3 { Retreat to g3 so the knight on g6 cannot win your bishop. [%cal Gf4g3] } 8... O-O-O ) ( 3... Bg4?? { Black forgets that the bishop is not protected. } 4. Qxg4 { A free bishop! [%cal Rd1g4] } 4... e5 5. Bxe5 { Take the pawn too. [%cal Gf4e5] } 5... h5 6. Qf3 { The queen escapes the attack and keeps eyeing d5 and b7. You are a whole piece up. [%cal Gg4f3] } 6... f6 ) 4. c3 { Support d4 and prepare Qb3 ideas. [%cal Gc2c3] } 4... Bf5 { Black develops the bishop outside the pawn chain. } ( 4... e6 { Black builds a solid centre. } 5. Nd2 { Bring the knight out so that the c-pawn stays on c3. [%cal Gb1d2] } 5... Bd6 6. Ngf3 { The other knight comes to f3. [%cal Gg1f3] } 6... O-O 7. Bg3 { Keep the bishop alive on g3. [%cal Gf4g3,Gg3d6] } 7... Qe7 8. Bb5 { Pin the knight on c6 against the king's side. If it moves, you win a piece. [%cal Gf1b5,Rb5c6] } 8... a6 9. Bxc6 { Take the knight before it takes the bishop. [%cal Gb5c6] } 9... bxc6 10. Ne5 { Land on e5 where Black's pawns are broken. [%cal Gf3e5] } 10... c5 ) 5. Qb3 { Attack the pawn on b7 and the pawn on d5 at the same time. [%cal Gd1b3,Rb3b7,Rb3d5] } 5... Na5 ( 5... Rb8 { Black defends b7 with the rook, which is passive but safe. } 6. Nd2 { Bring the knight out. [%cal Gb1d2] } 6... e6 7. Ngf3 { Develop. [%cal Gg1f3] } 7... Bd6 8. Bxd6 { Swap the dark-squared bishops. [%cal Gf4d6] } 8... cxd6 9. Nh4 { Hit the bishop on f5. [%cal Gf3h4,Rh4f5] } 9... Be4 ) ( 5... e6? { Black forgets about b7! } 6. Qxb7 { Free pawn, and it is not easy for Black to trap your queen. [%cal Gb3b7] } 6... Na5 7. Qxc7 { And another pawn. Trade queens to stay safe. [%cal Gb7c7] } 7... Qxc7 8. Bxc7 Nc4 ) 6. Qa4+ { Check! The queen goes to a safe square and keeps Black busy. [%cal Gb3a4] } 6... c6 7. Nf3 { Develop. [%cal Gg1f3] } 7... b5 8. Qd1 { The queen steps back; Black's knight on a5 is now far from the game. [%cal Ga4d1] } 8... e6 9. Nbd2 { The last knight comes out. [%cal Gb1d2] } 9... Nd7 10. a4 { Hit the b5 pawn and open lines. [%cal Ga2a4] } 10... a6 )
3. e3 { Support d4 and free the f1-bishop. [%cal Ge2e3,Gf1d3] }
3... Bg4 { Black pins your future knight to the queen. }
4. Nf3 { Develop the knight. It is pinned to the queen for now, but that is no problem. [%cal Gg1f3] }
4... e6 { Black adds a pawn to the centre. }
( 4... Bxf3 { Black takes the knight and gives you the bishop pair. } 5. Qxf3 { Recapture with the queen. Now you own two bishops. [%cal Gd1f3] } 5... e6 6. Nd2 { Bring the last knight out. [%cal Gb1d2] } 6... Bd6 7. Bxd6 { Trade the dark-squared bishops to keep Black from attacking your king. [%cal Gf4d6] } 7... Qxd6 8. O-O-O { Castle long. Your king is safe and the rooks are ready. [%cal Ge1c1] } 8... O-O 9. g4 { A little pawn storm! Black has castled short, so your attack is real. [%cal Gg2g4] } 9... c5 10. g5 { Push the knight away. [%cal Gg4g5,Rg5f6] } 10... Ne8 11. e4 { Open the centre while your king is safe. [%cal Ge3e4] } 11... Nc6 )
5. Nbd2 { Bring the last knight out. [%cal Gb1d2] }
5... Bd6 { Black offers to trade the London bishop. }
6. h3 { Ask the bishop on g4 what it wants to do. [%cal Gh2h3,Rh3g4] }
6... Bh5
( 6... Bxf3 7. Nxf3 { Recapture with the knight. Your bishop pair is not important here, but your structure is perfect. [%cal Gd2f3] } 7... O-O 8. Bd3 { Develop. [%cal Gf1d3] } 8... Nbd7 9. O-O { King to safety. [%cal Ge1g1] } 9... Bxf4 10. exf4 { Take back with the pawn. Your structure is a bit changed, but you have an open e-file. [%cal Ge3f4] } 10... c5 11. c3 { Support the centre and get ready for Qe2. [%cal Gc2c3] } 11... Qb6 )
7. Be2 { Break the pin and get ready to castle. [%cal Gf1e2] }
7... O-O
8. Ne5 { Land on e5. The knight attacks the bishop on h5 indirectly, because the bishop on e2 has support. [%cal Gf3e5] }
8... Bxe2
9. Qxe2 { Recapture with the queen. Your pieces are active. [%cal Gd1e2] }
9... Nbd7
10. Nxd7 { Trade the knight for the one on d7. [%cal Ge5d7] }
10... Nxd7
11. O-O { King to safety. [%cal Ge1g1] }
11... Bxf4
12. exf4 { Take back with the pawn. The e-file is yours. [%cal Ge3f4] }
12... Qf6
`,
    },
  ],
}
