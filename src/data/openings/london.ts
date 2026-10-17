import type { OpeningCourse } from '../../types'

export const londonCourse: OpeningCourse = {
  id: 'london',
  name: 'London System',
  side: 'white',
  tagline: 'One calm set-up against almost anything: bishop to f4, build the pyramid, castle, then pick your plan.',
  signatureMoves: ['d4', 'd5', 'Bf4'],
  ecoNames: [
    'Queen\'s Pawn Game: Accelerated London System',
    'Queen\'s Pawn Game: Accelerated London System, Steinitz Countergambit',
    'Queen\'s Pawn Game: Accelerated London System, Steinitz Countergambit Accepted',
    'Queen\'s Pawn Game: London System',
    'Queen\'s Pawn Game: London System, with e6',
    'Queen\'s Pawn Game: London System, Pterodactyl Variation',
    'London System: Poisoned Pawn Variation',
    'Indian Defense: Accelerated London System',
    'Indian Defense: London System',
    'London System',
    'London System, with Bd3',
    'London System, with Be2',
  ],
  overview: [
    'The London System is a set-up for White, not a long line of moves to memorise. You play d4, bring your dark-squared bishop out to f4, and then add e3, Nf3, c3, Bd3 and Nbd2 before you castle. You can use almost the same set-up against nearly everything Black does.',
    'It suits you well at around 1100. Your king gets safe quickly, there are very few early traps for White, and you reach the same kind of position again and again. That means you save time on the clock and you slowly learn what the good plans look like. Many club players also feel unsure against it, so they make mistakes you can punish.',
    'The plan in short. Build a "pyramid" of pawns on c3, d4 and e3, put the bishop on d3 aiming at h7, and castle. Then choose a plan: jump a knight to e5 and attack Black\'s king, push e3-e4 to open the centre when your pieces are ready, or play c4 to open lines on the queenside. You do not need all three; pick the one that fits the position.',
    'The middlegames feel calm and safe. You rarely lose quickly, and your pieces have clear squares to go to. The danger is the opposite: playing so calmly that you never start a plan.',
    'What to be careful about: bring the bishop to f4 before you play e3, look after your b2 pawn when Black\'s queen comes to b6, take back with the h-pawn if Black swaps bishops on g3, and never play on autopilot. The set-up is always similar, but Black\'s threats are not.',
  ],
  keyIdeas: [
    {
      title: 'Bishop out first, then e3',
      text: 'Your dark-squared bishop goes to f4 BEFORE you play e3. Then it stands outside your pawn chain and stays active. After e3, your d4 pawn is guarded and your other bishop on f1 has a free road too.',
      fen: 'rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/4P3/PPP2PPP/RN1QKBNR b KQkq - 0 3',
      arrows: [{ from: 'f1', to: 'd3', color: 'green' }],
      highlights: [
        { square: 'f4', color: 'green' },
        { square: 'e3', color: 'yellow' },
      ],
      orientation: 'white',
    },
    {
      title: 'The pyramid: c3, d4 and e3',
      text: 'Your pawns on c3, d4 and e3 make a little triangle. Black attacks d4 with ...c5 and ...Nc6, but d4 is guarded by two pawns and the knight on f3. That makes your centre very hard to break, so you can calmly finish your development.',
      fen: 'r1bq1rk1/pp3ppp/2nbpn2/2pp4/3P4/2P1PNB1/PP1N1PPP/R2QKB1R w KQ - 1 8',
      highlights: [
        { square: 'c3', color: 'green' },
        { square: 'd4', color: 'green' },
        { square: 'e3', color: 'green' },
      ],
      arrows: [
        { from: 'c5', to: 'd4', color: 'red' },
        { from: 'c6', to: 'd4', color: 'red' },
      ],
      orientation: 'white',
    },
    {
      title: 'Bd3: aim at h7',
      text: 'From d3 your light-squared bishop points straight at h7, the pawn next to Black\'s castled king. Later your queen and a knight on e5 can join it. Many London attacks start with this bishop.',
      fen: 'r1bq1rk1/pp3ppp/2nbpn2/2pp4/3P4/2PBPNB1/PP1N1PPP/R2QK2R b KQ - 2 8',
      arrows: [{ from: 'd3', to: 'h7', color: 'green' }],
      orientation: 'white',
    },
    {
      title: 'The dream square e5',
      text: 'A knight on e5 is the heart of the London. It is guarded by the d4 pawn and by the bishop on g3, and it eyes c6 and f7. The only pawn that can chase it away is the f-pawn, and ...f6 weakens Black\'s own king.',
      fen: 'r1bq1rk1/p4ppp/1pnbpn2/2ppN3/3P4/2PBP1B1/PP1N1PPP/R2QK2R b KQ - 1 9',
      arrows: [
        { from: 'e5', to: 'c6', color: 'green' },
        { from: 'e5', to: 'f7', color: 'green' },
        { from: 'd4', to: 'e5', color: 'yellow' },
        { from: 'g3', to: 'e5', color: 'yellow' },
      ],
      orientation: 'white',
    },
    {
      title: 'Against ...Bd6: step back to g3',
      text: 'When Black offers a swap with ...Bd6, you usually keep your bishop by stepping back to g3. If Black takes it anyway, take back with the h-pawn. Now your rook on h1 looks down the open h-file towards h7, right next to Black\'s king.',
      fen: 'r1bq1rk1/pp3ppp/2n1pn2/2pp4/3P4/2PBPNP1/PP1N1PP1/R2QK2R b KQ - 0 9',
      arrows: [{ from: 'h1', to: 'h7', color: 'green' }],
      highlights: [{ square: 'g3', color: 'green' }],
      orientation: 'white',
    },
    {
      title: 'Against ...Bf5: offer a trade with Bd3',
      text: 'When Black puts the light-squared bishop on f5, it is often their best piece. Offer to swap it with Bd3. If Black takes, take back with the queen, which then looks along the same diagonal at h7.',
      fen: 'rn1qkb1r/pp2pppp/2p2n2/3p1b2/3P1B2/3BPN2/PPP2PPP/RN1QK2R b KQkq - 3 5',
      arrows: [{ from: 'd3', to: 'f5', color: 'green' }],
      orientation: 'white',
    },
    {
      title: 'The e4 break',
      text: 'Once your pieces are out and your king is castled, the push e3-e4 opens the centre while your pieces are ready and Black\'s are not. Get it ready with the queen on d3 or c2 and a knight on d2, so that e4 is guarded.',
      fen: 'r3k2r/pp1n1ppp/2pqpn2/3p4/3P4/3QPN2/PPPN1PPP/R4RK1 w kq - 2 10',
      arrows: [
        { from: 'e3', to: 'e4', color: 'green' },
        { from: 'd3', to: 'e4', color: 'yellow' },
        { from: 'd2', to: 'e4', color: 'yellow' },
      ],
      orientation: 'white',
    },
  ],
  commonMistakes: [
    {
      title: 'Playing e3 before Bf4',
      text: 'After 1.d4 d5 2.e3, your bishop on c1 is locked in behind the e3 pawn. That is a different and more passive opening. In the London the bishop comes out to f4 first, and only then you play e3.',
      fen: 'rnbqkbnr/ppp1pppp/8/3p4/3P4/4P3/PPP2PPP/RNBQKBNR b KQkq - 0 2',
      highlights: [
        { square: 'c1', color: 'red' },
        { square: 'e3', color: 'red' },
      ],
      orientation: 'white',
    },
    {
      title: 'Forgetting the b2 pawn',
      text: 'Once your bishop has left c1, nothing guards b2. When Black\'s queen comes to b6, it attacks that pawn. Do not ignore it. The simplest answer is Qb3: you offer a queen trade, and if Black takes, you take back with the a-pawn and your rook gets the open a-file.',
      fen: 'rnb1kb1r/pp2pppp/1q3n2/2pp4/3P1B2/2P1P3/PP3PPP/RN1QKBNR w KQkq - 1 5',
      arrows: [
        { from: 'b6', to: 'b2', color: 'red' },
        { from: 'd1', to: 'b3', color: 'green' },
      ],
      orientation: 'white',
    },
    {
      title: 'Taking back with the f-pawn on g3',
      text: 'When Black swaps bishops with ...Bxg3, take back with the h-pawn, not the f-pawn. hxg3 keeps your pawns healthy and opens the h-file for your rook. fxg3 leaves your e3 pawn weak and your king more open.',
      fen: 'r1bq1rk1/pp3ppp/2n1pn2/2pp4/3P4/2PBPNb1/PP1N1PPP/R2QK2R w KQ - 0 9',
      arrows: [
        { from: 'h2', to: 'g3', color: 'green' },
        { from: 'f2', to: 'g3', color: 'red' },
      ],
      orientation: 'white',
    },
    {
      title: 'Playing on autopilot',
      text: 'The London set-up is always similar, so it is easy to stop looking at the board. Before every move, ask what Black\'s last move attacks and what it left unguarded. Here Black just played ...Qb6, and the bishop on d6 has lost its guard: Bxd6 wins a piece.',
      fen: 'r1b2rk1/pp3ppp/1qnbpn2/2pp4/3P4/2PBPNB1/PP1N1PPP/R2QK2R w KQ - 3 9',
      arrows: [{ from: 'g3', to: 'd6', color: 'green' }],
      highlights: [{ square: 'd6', color: 'red' }],
      orientation: 'white',
    },
    {
      title: 'Leaving the king in the middle',
      text: 'The London is calm, but a king in the centre is still the easiest target on the board. Do not start an attack or grab pawns before you have castled. Develop, castle, and only then start your plan.',
    },
    {
      title: 'Never starting a plan',
      text: 'The London is solid, but it is not a waiting game. Once you have castled and your pieces are out, pick a plan: Ne5 and an attack on the king, the e3-e4 break to open the centre, or c4 to open lines on the queenside. If you only shuffle your pieces, Black gets to play their own plan for free.',
    },
  ],
  chapters: [
    {
      id: 'classic-pyramid',
      title: 'The classic set-up: the London pyramid',
      summary:
        'Black plays ...d5 with ...Nf6 and ...e6, or starts with 1...Nf6. You build the pyramid c3, d4, e3, keep your bishop with Bg3 and get ready for the knight jump to e5. Rarer tries on move 3 (...c6, ...Ne4, ...Bg4) are covered too.',
      difficulty: 1,
      pgn: `
1. d4 {Your first move takes space in the centre and opens the road for your bishop on c1. [%cal Gd2d4]}
1... d5 {Black copies you.}
(1... Nf6
2. Bf4 {The London bishop comes out at once. You play it the same way against almost every reply. [%cal Gc1f4]}
2... e6
(2... d5 {Black puts a pawn on d5.}
3. e3 {Your normal move. This is the classic London from the main line of this chapter. [%cal Ge2e3]}
3... e6
4. Nf3 {Develop and guard d4. Now play the classic pyramid set-up. [%cal Gg1f3]}
4... Bd6
)
(2... b6 {Black plans ...Bb7 to look at the long diagonal.}
3. e3 {The same calm move as always. [%cal Ge2e3]}
3... Bb7
4. Nf3 {Your knight blocks Black's bishop on the long diagonal and guards d4. [%cal Gg1f3,Rb7f3]}
4... e6
)
3. e3 {Your normal move. You protect d4 and free your light-squared bishop. [%cal Ge2e3,Gf1d3]}
3... c5
(3... b6
4. Nf3 {Develop and guard d4. [%cal Gg1f3]}
4... Bb7
5. Bd3 {Point your bishop towards Black's king side. [%cal Gf1d3]}
5... c5
)
(3... d5
4. Nf3 {You are back in the classic London pyramid from the main line of this chapter. [%cal Gg1f3]}
4... Bd6
)
4. Nf3 {Develop and guard d4 once more. [%cal Gg1f3]}
4... d5 {Black has reached the same position as 1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3 c5 by another move order. Answer with c3, as in that line of this chapter.}
)
2. Bf4 {The London bishop! You bring it out now, before you play e3, so it never gets locked in behind your own pawns. [%cal Gc1f4,Gf4b8]}
2... Nf6 {Black develops a knight.}
3. e3 {Now your d4 pawn is protected and your other bishop (on f1) has a free road. You will play this move in almost every London game. [%cal Ge2e3,Gf1d3]}
3... e6 {The most popular reply. It frees Black's own light-squared bishop and prepares ...Bd6.}
(3... c6 {Black builds a pawn wall on c6 and d5. It is a safe set-up, though a little passive.}
4. Nf3 {Develop a knight. It guards d4 and looks at e5. [%cal Gg1f3]}
4... e6 {The most common follow-up. Black's c8-bishop is now locked inside the pawn wall.}
5. Bd3 {The bishop goes to its best diagonal. It aims at h7 and gets ready for castling. [%cal Gf1d3,Gd3h7]}
5... Bd6 {Black offers to trade your London bishop.}
6. Bg3 {Keep the bishop alive on g3, where it aims at d6. [%cal Gf4g3,Gg3d6]}
6... O-O
7. Nbd2 {The last knight comes out. [%cal Gb1d2]}
7... b6 {Black prepares to develop the c8-bishop on a6 or b7.}
8. e4 {The e4 break! Your pieces are ready, so you open the centre. [%cal Ge3e4]}
8... dxe4 {Black takes. Take back with the knight: Nxe4.}
)
(3... Ne4 {Black jumps a knight into the middle straight away. It looks annoying, but it is easy to handle.}
4. Nd2 {Challenge the knight at once! If Black takes on d2, your queen recaptures and your development is easy. [%cal Gb1d2,Gd2e4]}
4... Nxd2 {Black trades.}
5. Qxd2 {Take back with the queen. Your development stays smooth, and later you can castle on either side. [%cal Gd1d2]}
5... e6 {Black builds a solid centre.}
6. Nf3 {Develop. [%cal Gg1f3]}
6... Nd7
7. Bd3 {The bishop aims at h7 and prepares to castle. [%cal Gf1d3,Gd3h7]}
7... Bd6 {Black offers to trade the London bishop again.}
8. h4 {A useful move: it prepares h5 and gives the bishop a retreat square on h2. [%cal Gh2h4]}
8... Qe7
)
(3... Bg4 {Black pins your future knight to the queen.}
4. Nf3 {Develop the knight. It is pinned to the queen for now, but that is no problem. [%cal Gg1f3]}
4... e6 {Black adds a pawn to the centre.}
5. Nbd2 {Bring the last knight out. [%cal Gb1d2]}
5... Bd6 {Black offers to trade the London bishop.}
6. h3 {Ask the bishop on g4 what it wants to do. [%cal Gh2h3,Rh3g4]}
6... Bh5
7. Be2 {Break the pin and get ready to castle. [%cal Gf1e2]}
7... O-O
8. Ne5 {Land on e5. This opens the line for your bishop on e2, so it now faces Black's bishop on h5 and offers a trade. [%cal Gf3e5]}
8... Bxe2 {Black takes your bishop. Take back with the queen: Qxe2. Your pieces are active.}
)
4. Nf3 {A knight to its natural square. It guards d4 and looks at the important e5 square. [%cal Gg1f3,Gf3e5]}
4... Bd6 {Black wants to swap off your London bishop.}
(4... c5 {Black hits your d4 pawn straight away. Stay calm, one pawn move solves it.}
5. c3 {The pawn on c3 guards d4 and later gives your queen the b3 square. [%cal Gc2c3,Gc3d4]}
5... Nc6 {More pressure on d4.}
6. Nbd2 {Your second knight comes out on d2, so the c-pawn can stay on c3. [%cal Gb1d2]}
6... Bd6
7. Bg3 {The same idea as in the main line: the bishop stays alive and stares at d6. [%cal Gf4g3,Gg3d6]}
7... O-O
8. Bd3 {You have reached the main position by a different road. Carry on with the main line below. [%cal Gf1d3,Gd3h7]}
8... b6
)
5. Bg3 {The bishop steps back but stays strong. From g3 it keeps an eye on Black's bishop on d6. If Black takes it, you simply recapture with the h-pawn. [%cal Gf4g3,Gg3d6]}
5... O-O {Black castles to safety.}
6. Nbd2 {Your last knight comes out on d2, not on c3. That leaves the c-pawn free to move, and from d2 the knight can go to f3 later. [%cal Gb1d2]}
6... c5 {Black attacks your centre from the side.}
7. c3 {Now your pawns on c3, d4 and e3 make a solid triangle, a little pyramid that is very hard to break. [%cal Gc2c3] [%csl Gc3,Gd4,Ge3]}
7... Nc6 {More pressure on d4.}
8. Bd3 {The bishop goes to its best diagonal and aims straight at the h7 pawn next to Black's king. It also clears the way for castling. [%cal Gf1d3,Gd3h7]}
8... b6 {Black prepares to put a bishop on b7. This is the most natural plan. Your set-up is complete, and your next idea is the knight jump to e5 (see the big ideas of the course).}
`,
    },
    {
      id: 'vs-nc6-e5',
      title: 'Against ...Nc6 and the ...e5 counter-strike',
      summary:
        'Black plays an early ...Nc6, often followed by ...e5 to attack your bishop and your centre. Stay calm: count the attackers and defenders, and you will often simply win a pawn.',
      difficulty: 1,
      pgn: `
1. d4 {Take space in the centre. [%cal Gd2d4]}
1... d5
2. Bf4 {The London bishop. [%cal Gc1f4]}
2... Nc6 {Black's knight comes out in front of the c-pawn and looks at e5 and d4. Black often wants to follow up with ...e5. [%cal Rc6e5]}
3. e3 {Your normal move. Now d4 is protected by a pawn, so ...Nxd4 would simply lose the knight. [%cal Ge2e3,Ge3d4]}
3... Nf6
(3... e5? {This looks active, but it simply loses a pawn. The e5 pawn is attacked twice (by your bishop and your d4 pawn) and only protected once, by the knight. [%cal Rf4e5,Rd4e5,Gc6e5]}
4. Bxe5 {Take it! Count before you capture: your bishop takes, Black's knight takes back, and your d-pawn takes again. [%cal Gf4e5]}
4... Nxe5
5. dxe5 {You are a clean pawn up. Now just develop your pieces and keep the extra pawn safe. [%cal Gd4e5]}
5... Bc5
6. Nf3 {Develop and protect your extra pawn on e5. The knight also stops ...Qh4. [%cal Gg1f3,Gf3e5]}
6... Ne7
7. Be2 {Get ready to castle. [%cal Gf1e2,Ge1g1]}
7... O-O
8. O-O {Your king is safe and you have an extra pawn. Very good for you. [%cal Ge1g1]}
)
(3... Bf5 {Black brings the bishop out first.}
4. c4 {Strike at d5! Black's knight on c6 blocks the c-pawn, so Black cannot support d5 with ...c6. [%cal Gc2c4,Rc4d5] [%csl Rc6]}
4... e6
5. Nc3 {Add more pressure on d5 and develop. [%cal Gb1c3,Gc3d5]}
5... Nf6
6. Nf3 {Develop the last minor piece on the king side. You have more space and easy play. [%cal Gg1f3]}
6... Bb4
)
(3... Bg4?? {Black forgets that the bishop is not protected.}
4. Qxg4 {A free bishop! [%cal Rd1g4]}
4... e5
5. Bxe5 {Take the pawn too. [%cal Gf4e5]}
5... h5
6. Qf3 {The queen escapes the attack and keeps eyeing d5. You are a whole piece up. [%cal Gg4f3]}
6... f6 {Black attacks your bishop. Step back to f4 or g3: you stay a whole piece up.}
)
(3... e6 {Black closes the c8-bishop in and gets ready for ...Bd6.}
4. Nf3 {Develop and guard e5, the same move as against 3...Nf6. [%cal Gg1f3,Gf3e5]}
4... Bd6 {Black offers to trade your London bishop.}
5. Bg3 {Keep your bishop. If Black takes on g3, you take back with the h-pawn. [%cal Gf4g3]}
5... Nf6
)
(3... f6 {Black prepares ...e5 with a pawn.}
4. Nf3 {Develop and add a guard to e5. [%cal Gg1f3,Gf3e5]}
4... e5 {Black pushes anyway.}
5. dxe5 {Take the pawn.}
5... fxe5
6. Nxe5 {Count before you capture: e5 was attacked by your knight and your bishop and guarded only by the knight on c6. You win a pawn. [%cal Gf3e5,Gf4e5]}
6... Bd6 {Black develops and attacks your knight on e5 a second time. Count again: it is attacked twice and guarded only by your bishop, so deal with it now. The simplest is Nxc6: after ...bxc6 you stay a clean pawn up. [%cal Rc6e5,Rd6e5]}
)
(3... a6 {A waiting move. It keeps your bishop away from b5.}
4. Nf3 {Your normal developing move. [%cal Gg1f3]}
4... Nf6 {You are back in a normal position. Carry on with Bd3 or c3, Nbd2 and castling.}
)
4. Nf3 {Develop and guard e5 so Black cannot play ...e5 for free. [%cal Gg1f3,Gf3e5]}
4... Bg4
(4... Bf5
5. Bb5 {Pin the knight on c6 to the king. Now that knight cannot help with ...e5, and you can castle soon. [%cal Gf1b5,Rb5e8]}
5... e6
6. Ne5 {The knight jumps to e5 and attacks the knight on c6 a second time. That knight is pinned to the king by your bishop, so it cannot move away. [%cal Gf3e5,Re5c6]}
6... Bd6?! {Natural, but it does nothing against the threat on c6.}
(6... a6 {Black asks your bishop what it wants.}
7. Ba4 {Keep the pin. The knight on c6 is still attacked twice and defended only once. [%cal Gb5a4,Ga4c6]}
7... Bd6 {Black hits your knight on e5. Now take on c6: Nxc6, and if ...bxc6, Bxc6+ hits the rook on a8.}
)
7. Nxc6 {Take the knight. [%cal Ge5c6]}
7... bxc6
8. Bxc6+ {Check, and your bishop also attacks the rook on a8. Next you take it. [%cal Rc6e8,Rc6a8]}
8... Ke7 {The king steps out of check. Now take the rook: Bxa8. You win a rook for your bishop and stay a pawn up.}
)
5. h3 {Ask the bishop a question: will it take your knight or step back? [%cal Gh2h3,Rh3g4]}
5... Bxf3
6. Qxf3 {Take back with the queen. You now have the two bishops, and your queen helps to watch e4 and d5. [%cal Gd1f3,Gf3d5]}
6... e6
7. Nd2 {Your last knight comes out. Next you play Bd3 or Bb5 and castle. Your pieces work well together. [%cal Gb1d2,Gf1d3]}
7... Bd6
`,
    },
    {
      id: 'mirror-bf5',
      title: 'Black copies you with ...Bf5',
      summary:
        'Black develops their own bishop to f5, the mirror image of your London bishop. You challenge it with Bd3 and keep the position healthy.',
      difficulty: 1,
      pgn: `
1. d4 {Your usual first move. [%cal Gd2d4]}
1... d5
2. Bf4 {The London bishop comes out first. [%cal Gc1f4]}
2... Nf6 {Black develops a knight.}
(2... Bf5 {Black copies your bishop move right away.}
3. e3 {The same solid move as always. [%cal Ge2e3]}
3... e6
4. Nf3 {Develop the knight. [%cal Gg1f3]}
4... Nf6
5. Bd3 {You are back in the main line of this chapter. Challenge the bishop on f5. [%cal Gf1d3,Gd3f5]}
5... Bxd3
6. Qxd3 {Take back with the queen. [%cal Gd1d3]}
6... c5
)
3. e3 {Support d4 and free the f1-bishop. [%cal Ge2e3,Gf1d3]}
3... Bf5 {Black puts their bishop on the same kind of diagonal as yours. This is a very popular reply.}
4. Nf3 {Develop. The knight guards d4 and looks at e5. [%cal Gg1f3]}
4... e6 {Black closes the diagonal for their own bishop but keeps it solid.}
5. Bd3 {Challenge Black's bishop. If it is traded, Black loses their best minor piece. [%cal Gf1d3,Gd3f5]}
5... Bxd3 {Black accepts the trade.}
6. Qxd3 {Take back with the queen. From d3 it looks along the diagonal towards h7. [%cal Gd1d3]}
6... Bd6 {Black offers to trade the other bishops too.}
7. Bxd6 {Swap the dark-squared bishops. Your London bishop has done its job. [%cal Gf4d6]}
7... Qxd6
8. c4 {Now go for the centre: you attack d5 and gain space. [%cal Gc2c4,Gc4d5]}
8... dxc4 {Black takes the pawn. Take it back with your queen: Qxc4. Your queen is active and the game is level.}
`,
    },
    {
      id: 'keep-calm-weird-moves',
      title: 'Black plays something weird: keep calm and develop',
      summary:
        'Black starts with an unusual move like 1...d6, 1...Nc6, 1...b6 or 1...h6. You do not need special theory: play your normal London, develop a piece every move, and punish only real mistakes.',
      difficulty: 1,
      pgn: `
1. d4 {Your usual first move. When Black does something strange, remember three rules: put a pawn in the centre, bring out a new piece every move, and castle early. Only look for a punishment when Black leaves something hanging. [%cal Gd2d4]}
1... d6 {An unusual first move. Black keeps the pawn on d6 and may try ...e5 next.}
(1... b6 {Black wants to put a bishop on b7 to look along the long diagonal.}
2. Nf3 {Develop. The knight also blocks the long diagonal where Black's bishop wants to go. Grabbing the centre with 2.e4 is a bit more ambitious, but staying with your London set-up is simple and good. [%cal Gg1f3]}
2... Bb7
3. Bf4 {The normal London bishop. You do not need to change your plan. [%cal Gc1f4]}
3... e6
4. e3 {Guard d4 and open the way for your other bishop. [%cal Ge2e3]}
4... Nf6
5. Bd3 {The bishop goes to its best square and will be ready to support e4 later. [%cal Gf1d3]}
5... c5
6. c3 {Your usual pyramid. Calm and solid. [%cal Gc2c3] [%csl Gc3,Gd4,Ge3]}
6... Be7
7. Nbd2 {The last knight comes out and supports the e4 push. Next you castle. [%cal Gb1d2,Gd2e4]}
7... O-O
)
(1... h6 {A waiting move that does nothing for Black's development.}
2. Bf4 {Just play your London. Black wasted a move, so you will be a little ahead in development. Grabbing the centre with 2.e4 is also very good. [%cal Gc1f4]}
2... d5
3. e3 {Guard d4. [%cal Ge2e3]}
3... Nf6
4. Nf3 {Develop. [%cal Gg1f3]}
4... e6
5. c4 {With an extra move in your pocket you can also be more active. The c4 push attacks Black's centre. [%cal Gc2c4,Gc4d5]}
5... Be7
)
(1... Nc6 {Black brings the knight out in front of the c-pawn.}
2. Bf4 {Play your London bishop as always. [%cal Gc1f4]}
2... d5 {This is the same position as 1.d4 d5 2.Bf4 Nc6. The chapter "Against ...Nc6 and the ...e5 counter-strike" shows what to do: e3 next.}
(2... Nf6 {Black develops the other knight.}
3. e3 {Guard d4 and free your other bishop. [%cal Ge2e3]}
3... d5 {Again the same position as in the chapter "Against ...Nc6 and the ...e5 counter-strike" (after 3...Nf6 there). Play Nf3 next.}
)
(2... d6 {Black keeps the pawn on d6 and may try ...e5.}
3. Nf3 {Develop and guard e5. [%cal Gg1f3,Gf3e5]}
3... Nf6
)
(2... e5?! {Black offers a pawn.}
3. dxe5 {Take it. Your bishop on f4 guards the new pawn on e5. [%cal Gd4e5,Gf4e5]}
3... d6 {Black wants to open lines. Develop with Nf3 and keep the extra pawn safe.}
)
)
2. Bf4 {Same London set-up. Your bishop also looks at the d6 pawn. [%cal Gc1f4,Gf4d6]}
2... e5?! {Black tries to hit back in the centre, but this simply gives you a pawn.}
(2... Nf6
3. e3 {Calm development. [%cal Ge2e3]}
3... g6
4. Nf3 {Develop the knight. Next you play Be2, h3 and castle. [%cal Gg1f3]}
4... Bg7
)
3. dxe5 {Take the pawn. Now look carefully at what happens if Black takes back. [%cal Gd4e5]}
3... Nc6 {Black gives up the pawn to develop quickly and attack your e5 pawn.}
(3... dxe5 {Black takes back, but now the queens come off and the e5 pawn falls.}
4. Qxd8+ {Trade queens with check first. [%cal Gd1d8]}
4... Kxd8
5. Bxe5 {Now the bishop takes the pawn on e5. You are a pawn up and Black's king has lost the right to castle. [%cal Gf4e5]}
5... Nc6 {Black attacks your bishop. Step back to a safe square such as g3, and watch out for ...Nb4 hitting your c2 pawn.}
)
4. Nf3 {Develop and protect your extra pawn on e5. [%cal Gg1f3,Gf3e5]}
4... dxe5? {Black wins the pawn back, or so it seems.}
5. Qxd8+ {Trade queens first. Black can take back with the king or with the knight on c6, but either way the e5 pawn falls next. [%cal Gd1d8]}
5... Kxd8
6. Nxe5 {Now take on e5 with the knight. If Black takes it, your bishop takes back and you are a clean pawn up. [%cal Gf3e5]}
6... Nxe5
7. Bxe5 {Your bishop is safe on e5 and you have an extra pawn. Black's king is stuck in the middle and cannot castle. [%cal Gf4e5]}
7... f6 {Black attacks your bishop. Step back to g3 or f4: you stay a clean pawn up.}
`,
    },
    {
      id: 'vs-kings-indian',
      title: "Against the King's Indian set-up: ...g6, ...Bg7, ...d6",
      summary:
        'Black does not play ...d5 at once. Instead the bishop goes to g7, the king castles and Black prepares ...e5 or ...Nh5. You keep the same calm London set-up, with one extra key move: h3.',
      difficulty: 2,
      pgn: `
1. d4 {Take space in the centre and open the road for your dark-squared bishop. [%cal Gd2d4]}
1... Nf6
(1... d5
2. Bf4 {The London bishop. [%cal Gc1f4]}
2... Nf6
3. e3 {Protect d4 and free your other bishop. [%cal Ge2e3]}
3... g6 {Black wants to put the bishop on g7, where it looks along the long diagonal towards your queen side. [%cal Rg7b2]}
4. Nf3 {Develop and guard d4 again. [%cal Gg1f3]}
4... Bg7
5. h3 {Give your bishop a safe square on h2, so ...Nh5 never wins it, and stop ...Bg4 pinning your knight. [%cal Gh2h3,Gf4h2] [%csl Gg4]}
5... O-O
6. Be2 {A quiet, safe square for the bishop. You will castle next. [%cal Gf1e2,Ge1g1]}
6... c5 {Black attacks your d4 pawn, as in most London games.}
7. c3 {Support d4 with the c-pawn. Your pyramid c3, d4, e3 is solid. [%cal Gc2c3,Gc3d4] [%csl Gc3,Gd4,Ge3]}
7... Nc6
8. Nbd2 {Your last knight comes out on d2, so c3 stays protected. From d2 it can later help with the pawn push e4. [%cal Gb1d2,Ge3e4]}
8... b6
)
(1... g6 {Black starts with the pawn move. The bishop will come to g7.}
2. Bf4 {Your London bishop, as always. [%cal Gc1f4]}
2... Bg7
3. Nf3 {Develop and guard d4. [%cal Gg1f3]}
3... Nf6 {Now the position is the same as in the main line of this chapter. After 4.e3 O-O play h3.}
(3... d6 {Black keeps the knight at home for one more move.}
4. e3 {Build your pyramid. [%cal Ge2e3]}
4... Nf6 {The same position as after 4...d6 in this chapter. Play h3 next.}
)
)
2. Bf4 {The London bishop comes out before e3, so it never gets locked in. [%cal Gc1f4]}
2... g6 {Black wants to put the bishop on g7. This is the King's Indian set-up.}
3. Nf3 {A natural square for the knight. It guards d4 and looks at e5, the square Black wants to fight for. [%cal Gg1f3,Gf3e5]}
3... Bg7
4. e3 {The base of your pyramid. It protects d4 and lets your other bishop come out. [%cal Ge2e3,Gf1e2]}
4... O-O
(4... d6 {Black plays ...d6 before castling.}
5. h3 {The same key move as in the main line: your bishop gets a safe home on h2. [%cal Gh2h3,Gf4h2]}
5... O-O
6. Be2 {Now you are back in the main line. Black can choose ...Nbd7, ...c5 or ...Nh5 from here. [%cal Gf1e2]}
)
5. h3 {The most important move against this set-up. It gives your bishop the h2 square to run to when Black plays ...e5 or ...Nh5. It also stops a black piece from jumping to g4. [%cal Gh2h3,Gf4h2] [%csl Gh2,Gg4]}
5... d6
6. Be2 {Your bishop goes to e2, not d3. On d3 it could be forked by a black pawn on e4 together with your knight on f3. On e2 it is safe, and you are ready to castle. [%cal Gf1e2] [%csl Rd3]}
6... Nbd7
7. O-O {Castle and get your king safe before the centre opens. [%cal Ge1g1]}
7... e5 {Black's main idea. The pawn attacks both your bishop on f4 and your d4 pawn. Watch out: if you ignore it, Black takes your bishop. [%cal Re5f4,Re5d4]}
8. dxe5 {Take the pawn. Your knight and your bishop both aim at e5, the square where the fight is. [%cal Gd4e5,Gf3e5,Gf4e5]}
8... dxe5 {Black takes back. Now the pawn on e5 is attacked by your knight and your bishop and guarded only by the knight on d7.}
9. Nxe5 {Take it. You are a clean pawn up. If Black takes back with 9...Nxe5, swap queens first with Qxd8 and only then take on e5 with the bishop. [%cal Gf3e5]}
`,
    },
    {
      id: 'early-c5',
      title: 'Black hits back early with ...c5',
      summary:
        'Black plays ...c5 at once, either after 1...d5 or after 1...Nf6 (sometimes even on move one), often followed by ...Nc6 and ...Qb6 against your b2 pawn. You answer with e3 and c3, and you know how to guard b2 safely.',
      difficulty: 2,
      pgn: `
1. d4 {Your usual first move. [%cal Gd2d4]}
1... d5
(1... Nf6 {The most common reply.}
2. Bf4 {The London bishop comes out first, as always. [%cal Gc1f4]}
2... c5 {Black attacks d4 from the side. This is a good, active move.}
3. e3 {Keep it calm: the pawn on e3 guards d4 and opens a road for your other bishop. [%cal Ge2e3,Ge3d4]}
3... cxd4 {Black swaps pawns in the centre.}
(3... d5 {Black adds ...d5 and the game looks like the normal London again.}
4. c3 {Build your pyramid. The pawn on c3 guards d4 a second time. [%cal Gc2c3] [%csl Gc3,Gd4,Ge3]}
4... Nc6
5. Nd2 {The knight goes to d2 so it can guard b3 and c4 if Black's queen comes to b6. It can go to f3 later. [%cal Gb1d2]}
5... e6
)
(3... e6 {A quiet move. Black will probably play ...d5 next.}
4. Nf3 {Develop the knight. [%cal Gg1f3]}
4... d5
5. c3 {Same pyramid as always. You are back in the main London. [%cal Gc2c3]}
5... Nc6
)
(3... Qb6 {The queen attacks your b2 pawn, which your bishop on f4 no longer protects. [%cal Rb6b2] [%csl Rb2]}
4. Nc3 {Develop the knight and lay a trap. If Black grabs b2 at the right moment, Nb5 makes the black queen and king very uncomfortable. [%cal Gb1c3,Gc3b5]}
4... cxd4
5. exd4 {Take back towards the centre. Now d4 is protected by your queen. [%cal Ge3d4]}
5... a6 {A good move. Black takes the b5 square away from your knight before thinking about b2.}
)
(3... Nc6
4. d5 {Kick the knight! Your pawn gains space with tempo, which means Black has to lose time moving the knight again. [%cal Gd4d5,Rd5c6]}
4... Nb4 {The knight and the f6 knight now both attack your d5 pawn.}
5. c4 {Protect d5 with another pawn. Now d5 is safe, and next you can kick the knight away with a3. Your queen guards c2, so ...Nxc2+ does not work. [%cal Gc2c4,Gc4d5,Ga2a3] [%csl Yc2]}
)
4. exd4 {Take back with the e-pawn. Your bishop on f4 stays free, and the open e-file can be useful for a rook later. [%cal Ge3d4]}
4... d5 {Black puts a pawn in the centre too.}
5. c3 {Guard d4 with a pawn so your pieces are free to move. [%cal Gc2c3,Gc3d4]}
5... Nc6
6. Nf3 {The knight comes out and guards d4 again. [%cal Gg1f3]}
6... Bg4 {Black pins your knight to the queen.}
7. Nbd2 {Develop calmly. The knight on d2 gives the knight on f3 an extra guard, so the pin is no longer a worry, and your queen is now free to move. [%cal Gb1d2,Gd2f3]}
7... e6
8. Qb3 {Now the bishop on g4 has left b7 without protection. Your queen hits b7 and also prepares to put more pressure on d5. [%cal Gd1b3,Gb3b7]}
8... Qc8
)
(1... c5 {Black hits your d4 pawn at once, before any knight is out.}
2. d5 {When Black plays ...c5 this early, you can simply push past. Your pawn grabs space and nothing can easily attack it. [%cal Gd4d5]}
2... e5 {Black blocks the centre with pawns.}
(2... Nf6
3. Nc3 {Develop, and guard d5 once more. [%cal Gb1c3,Gc3d5]}
3... d6
4. e4 {Now you have a big pawn centre. The pawns on d5 and e4 give you lots of space. [%cal Ge2e4]}
4... g6
)
3. e4 {Build a big centre. Your e4 pawn supports d5, so it can stay there for the whole game. [%cal Ge2e4,Ge4d5]}
3... d6
4. Nc3 {The knight guards e4 and d5. [%cal Gb1c3]}
4... Be7
)
2. Bf4 {The London bishop comes out first. [%cal Gc1f4]}
2... c5 {Black strikes at d4 immediately. This is a gambit-like idea: if you take on c5, Black gets quick play. Stay calm and simply defend your centre.}
(2... Nf6 {Black develops first and plays ...c5 next.}
3. e3 {Solid support for d4. [%cal Ge2e3]}
3... c5
4. c3 {The pawn on c3 guards d4 and gives your queen the b3 square. [%cal Gc2c3,Gc3d4]}
4... Qb6 {Black attacks the pawn on b2.}
5. Qb3 {Offer a queen trade. It protects b2 and keeps your pawn structure healthy. [%cal Gd1b3,Rb6b2]}
5... Qxb3?!
6. axb3 {Recapture with the a-pawn. It looks ugly, but you get an open a-file and your bishop on f4 attacks b8. [%cal Ga2b3,Ga1a7]}
6... e6
7. Bxb8 {Take the knight. [%cal Gf4b8]}
7... Rxb8
8. Rxa7 {Grab a pawn. The a-file is yours. [%cal Ga1a7]}
8... Bd6
)
3. e3 {Support d4 and free the f1-bishop. [%cal Ge2e3,Gf1d3]}
3... Nc6 {Black adds more pressure on d4.}
(3... cxd4 {Black takes the pawn.}
4. exd4 {Recapture. The e-file opens for your rooks and the f1-bishop is free. [%cal Ge3d4]}
4... Nc6
5. c3 {Protect d4 with the pawn. [%cal Gc2c3]}
5... Bf5
6. Qb3 {Attack the pawn on b7 and the pawn on d5. [%cal Gd1b3,Rb3b7]}
6... Qd7
7. Nf3 {Develop. [%cal Gg1f3]}
7... e6
8. Nbd2 {The last knight comes out. [%cal Gb1d2]}
8... Nge7
)
(3... Qb6?! {Black attacks b2 at once, before you can play c3. This is a bit too early.}
4. Nc3 {A tactical surprise: if Black grabs b2, the knight takes on d5 with a big attack. [%cal Gb1c3,Rb6b2]}
4... Nf6
(4... Qxb2? {Greedy!}
5. Nxd5 {Now the queen on b2 is cut off and Black's king is in trouble. [%cal Gc3d5]}
5... Bf5
6. Qb1 {Attack the queen on b2 and offer a trade. Black's king is stuck in the middle. [%cal Gd1b1,Rb1b2]}
6... Qxb1+ {Black swaps queens with check. Take back with the rook: Rxb1. Your rook is active and Nc7+ is coming.}
)
(4... e6
5. Nb5 {The knight jumps to b5 and threatens Nc7+. [%cal Gc3b5,Rb5c7]}
5... Na6
6. c3 {Support d4. [%cal Gc2c3]}
6... Nf6
)
5. dxc5 {Take the pawn. [%cal Gd4c5]}
5... Qxc5
6. Nb5 {Threaten Nc7+, which hits the king and the rook on a8 at the same time. [%cal Gc3b5,Rb5c7]}
6... Na6
)
4. c3 {Protect d4. The pyramid of pawns c3, d4, e3 is complete. [%cal Gc2c3]}
4... Nf6 {Black develops.}
5. Nd2 {Develop with the knight to d2, so that the c-pawn stays free and the g1-knight can come to f3. [%cal Gb1d2]}
5... e6
6. Ngf3 {Develop. [%cal Gg1f3]}
6... Bd6 {Black offers to trade bishops.}
7. Bg3 {The bishop retreats to g3. [%cal Gf4g3,Gg3d6]}
7... O-O
8. Bd3 {The bishop goes to its best diagonal, aimed at h7. [%cal Gf1d3,Gd3h7]}
8... b6
`,
    },
    {
      id: 'vs-dutch',
      title: 'Against the Dutch: 1.d4 f5',
      summary:
        'Black answers 1.d4 with 1...f5 to control the e4 square. You keep your calm London set-up, use the holes Black leaves behind, and prepare the e4 push to open the centre.',
      difficulty: 2,
      pgn: `
1. d4 {Your normal first move. It takes space in the centre and opens the road for your bishop on c1. [%cal Gd2d4]}
1... f5 {The Dutch Defence. Black puts a pawn on f5 to control the e4 square. It is a fighting choice, but it also loosens Black's own king a little. [%csl Ge4]}
2. Bf4 {Same London plan as always: the bishop comes out first, before e3 can lock it in. [%cal Gc1f4]}
2... Nf6 {Black develops and adds a second guard on e4.}
(2... g5? {Black lunges forward to chase your bishop, but this just drops a pawn.}
3. Bxg5 {Take it. The pawn on g5 had no protection, and your bishop is perfectly safe on g5. [%cal Gf4g5]}
3... Nf6
4. Bxf6 {Swap your bishop for the knight. Black must take back with the e-pawn, so you stay a clean pawn up and Black's king side is full of holes. [%cal Gg5f6]}
4... exf6 {Black takes back with the e-pawn. You are a clean pawn up and Black's king side is full of holes. Now just develop calmly: e3, then Bd3, Nf3 and castle.}
)
3. e3 {Your pawn guards d4 and opens the way for your light-squared bishop. [%cal Ge2e3,Gf1d3]}
3... e6 {The most common set-up. Black opens a road for the dark-squared bishop and plans ...Be7 and castling.}
(3... g6 {The Leningrad set-up: Black's bishop goes to g7 to look along the long diagonal.}
4. Nf3 {Develop the knight. It guards d4 and looks at e5. [%cal Gg1f3]}
4... Bg7
5. Be2 {Against ...g6 the bishop is fine on e2: it is safe there and lets you castle quickly. [%cal Gf1e2]}
5... O-O
6. O-O {King to safety first. Nothing is happening in the centre yet. [%cal Ge1g1]}
6... d6
7. h3 {A small useful move: it gives your bishop a hiding square on h2, so Black's ...Nh5 can never trade it off by force. [%cal Gh2h3,Gf4h2]}
7... Nc6
)
4. Nf3 {The knight goes to its best square. From f3 it guards d4 and eyes the e5 square. [%cal Gg1f3,Gf3e5]}
4... Be7 {Black prepares to castle.}
5. Bd3 {The bishop goes to a strong diagonal and looks at the king side. [%cal Gf1d3]}
5... O-O {Black castles.}
6. Nbd2 {The second knight comes out to d2 so that it can support the e4 push later. [%cal Gb1d2,Gd2e4]}
6... b6 {Black prepares ...Bb7 to fight for e4.}
7. h3 {A useful little move. Your bishop now has a safe square on h2 if Black plays ...Nh5 to chase it. [%cal Gh2h3,Gf4h2]}
7... Bb7 {The bishop joins the fight for the e4 square.}
8. O-O {King to safety before you open the centre. [%cal Ge1g1]}
8... d6 {Black stops your knight from coming to e5.}
`,
    },
  ],
}
