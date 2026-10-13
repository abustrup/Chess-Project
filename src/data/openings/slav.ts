import type { OpeningChapter, OpeningCourse } from '../../types'

// Slav Defence course (you play Black). Pure data: the PGN strings are the lessons.
// Reading guide for the PGN: the FIRST move at each of your turns is the one to learn;
// at White's turns every move listed is a reply we prepared for.

const slowSlav = `
1. d4 {White starts with the queen's pawn. It takes space in the centre and opens a road for the dark-squared bishop.}
1... d5 {You answer in the same way. Your pawn fights for the centre and makes it hard for White to build a big pawn wall with e4. [%cal Gd5e4]}
2. c4 {The Queen's Gambit. White offers a pawn but it is not a real sacrifice: if you take it, White wins it back easily. White really wants to pressure your d5-pawn.}
2... c6 {This is the Slav. The c6-pawn guards d5, so you do not need ...e6 yet. That keeps the road open for your light-squared bishop, the piece that other defences lock in behind their pawns. [%cal Gc6d5,Gc8f5]}
3. Nf3 {A natural developing move. The knight also watches the e5 and d4 squares.}
3... Nf6 {You develop a knight to a good square. It guards d5 a second time and stops White from playing e4 for free. [%cal Gf6d5,Gf6e4]}
4. e3 {A calm move that opens the way for White's bishop on f1. This set-up is called the Slow Slav (or Quiet Variation). White is not in a hurry.}
4... Bf5 {The key Slav idea: bring the light-squared bishop out BEFORE you close the pawn chain with ...e6. On f5 it controls the e4-square, eyes White's queenside, and is not a prisoner behind your own pawns. [%cal Gf5e4,Gf5b1]}
5. Nc3 {White adds a second attacker against d5 and prepares to bring the bishop out too.}
(5. cxd5 {White swaps pawns to open the c-file.}
5... cxd5 {Recapture with the c-pawn. Now you have a pawn on d5 that is protected by your knight, and your bishop is already outside the pawn chain.}
6. Nc3 {Another attacker on d5 and a developing move.}
6... e6 {Now you close the door. The d5-pawn is solid and your bishop is already out. Next come ...Nc6 and ...Be7.}
7. Qb3 {The queen hits your b7-pawn and your d5-pawn at the same time.}
7... Qc7 {The queen guards b7 and also looks at White's pieces on the c-file. Always check your b7-pawn when a white queen lands on b3. [%cal Gc7b7,Rb3b7]}
8. Nh4 {White attacks your bishop. White hopes to swap the knight for your bishop or to chase it away.}
8... Bg6 {Retreat to g6, where the bishop stays active on the long diagonal. If White takes it, you retake with the h-pawn and your rook gets the h-file. [%cal Gg6b1,Rh4g6]}
9. Bd2 {White develops and prepares to castle queenside.}
9... Nc6 {Another piece joins the fight for the centre. Now d4 is under pressure from the knight. [%cal Gc6d4]}
10. Rc1 {The rook looks at your queen on the c-file.}
10... Be7 {Develop the bishop and get ready to castle.}
11. Nxg6 {White swaps the knight for your bishop.}
11... hxg6 {Retake with the h-pawn. Your rook gets the open h-file, and your centre is solid. [%cal Gh8h2]}
12. Bd3 {White develops.}
12... Rc8 {Put the rook on the c-file, opposite the white rook. Your pieces are well placed and the position is equal.}
13. Na4 {White heads for c5 with the knight. Your plan: castle and answer ...Nd7 or ...Qd7 so you can meet the knight with a calm head.}
)
(5. Qb3 {White attacks your b7-pawn straight away. This is a common trap for players who forget about b7!}
5... Qb6 {Defend b7 and offer a queen swap. The swap is good for you: it leads to a safe, equal position. [%cal Gb6b7,Rb3b7]}
6. cxd5 {White takes on d5 first.}
6... Qxb3 {Swap the queens before White can do anything with that open c-file.}
7. axb3 {White recaptures with the a-pawn, which leaves White with a doubled pawn on b2 and b3.}
7... Nxd5 {Now you simply win back the pawn with a centralised knight. Your pieces are active and White has a damaged pawn structure. [%csl Rb2,Rb3]}
8. Bd2 {White develops.}
8... e6 {Now the bishop on c8 is outside, so closing the e-pawn is fine. You will play ...Nd7 and ...Be7 next. Equal and comfortable.}
9. Na3 {White develops the knight to the rim. You are fine: play ...Be7, ...Nd7 and castle.}
)
(5. Nh4 {White attacks the bishop and hopes you will retreat it to c8. The knight on the edge is risky for White though.}
5... Be6 {Keep the bishop outside and out of the knight's reach. Be careful: ...Bg4?! runs into Qb3 and your b7-pawn is in trouble. [%cal Rd1b3]}
6. Qb3 {Hits b7 and d5 again.}
6... Qb6 {Defend b7 and offer a queen swap. [%cal Gb6b7]}
7. Nc3 {White develops and adds pressure to d5.}
7... dxc4 {The d5-pawn is under pressure, so you grab the c4-pawn and open the bishop's diagonal. Now White must recapture, which drags a piece to c4 where you can swap it. [%cal Ge6c4]}
8. Bxc4 {White takes the pawn back.}
8... Bxc4 {Swap off the bishop. With fewer pieces, White's early knight on h4 looks silly.}
9. Qxc4 {A balanced position. You will play ...e6, ...Nbd7 and ...Be7, and castle.}
9... e6 {Solid. Your pawns c6-e6 shield the centre and all your pieces can develop easily.}
10. O-O {White castles. You have a healthy game: develop with ...Be7, ...Nbd7 and ...O-O.}
)
(5. Bd3 {White offers to swap off your bishop.}
5... Bg6 {Keep the bishop. If White swaps on g6 you will retake with the h-pawn, and your rook gets the open h-file. [%cal Gg6d3]}
6. O-O {White castles to safety.}
6... e6 {Now it is safe to close the door: your bishop is outside the pawn chain. [%csl Gc6,Gd5,Ge6]}
7. Qc2 {White lines up the queen against your bishop on g6.}
7... Nbd7 {Develop another piece and cover the e5 square. [%cal Gd7e5]}
8. Nbd2 {White develops the last minor piece.}
8... Bxd3 {You may swap now: White's bishop is a strong attacker, and trading it takes the sting out of White's play.}
9. Qxd3 {White recaptures with the queen.}
9... Be7 {Calm development. You will castle next and then think about ...dxc4 and ...e5.}
10. Rd1 {A natural rook move to back up the d4-pawn.}
10... O-O {Castle! Your king is safe and your pieces are all developed.}
11. e4 {White takes space in the centre. You are happy to trade with ...dxe4 and play ...c5 or ...e5 to hit back.}
)
5... e6 {NOW you close the gate. The pawns on c6, d5 and e6 form the Slav triangle: a rock-solid centre. Your bishop is already outside, so it is not locked in. [%csl Gc6,Gd5,Ge6]}
6. Bd3 {White offers to swap bishops.}
(6. Nh4 {White attacks your bishop. White wants the bishop pair or hopes to drive you back.}
6... Bg6 {Retreat to g6. If White takes it, you retake with the h-pawn and your rook gets the open h-file. That is good for you. [%cal Rh4g6]}
7. Nxg6 {White swaps the knight for your bishop.}
7... hxg6 {Recapture with the h-pawn. Your rook now looks down the h-file at White's king-side, and your pawn structure is still solid. [%cal Gh8h2]}
8. Bd3 {Natural development, aiming at your g6-pawn.}
8... Bd6 {Develop the bishop to a great diagonal. It aims at h2, and your rook on h8 stands behind it. White must be careful now! [%cal Rd6h2]}
9. h3 {The safe reply: White guards h2 with the pawn.}
(9. Bd2 {White develops but leaves h2 a little loose.}
9... Nbd7 {Develop and keep an eye on the centre.}
10. h4 {White gives the h-pawn some air and stops your rook from using the h-file.}
10... Qe7 {The queen steps to a safe square, supports ...e5 and keeps everything protected.}
11. Qb3 {Hitting b7.}
11... dxc4 {Capture first, so that White's bishop has to recapture and you gain a tempo for the ...b5 push.}
12. Bxc4 {White takes the pawn back.}
12... b5 {Kick the bishop away with gain of time. Your b5-pawn is guarded by the c6-pawn. [%cal Rb5c4]}
13. Bd3 {The bishop retreats. You gained space on the queenside and the position is healthy. Castle and bring your rooks to the centre.}
)
(9. O-O? {A natural but losing move! White forgets about h2.}
9... Bxh2+ {Capture with check! White cannot take the bishop with the king because your rook on h8 guards h2. [%cal Gh8h2]}
10. Kh1 {The king steps aside.}
10... Bd6+ {Discovered check! The bishop moves away and your rook on h8 gives check down the open h-file. You are a clean pawn up.}
11. Kg1 {White must step aside. You won a pawn for nothing. Remember this idea: bishop on d6 plus rook on the open h-file makes h2 a target.}
)
9... O-O {Castle. Your king is safe on g8 and your rook lands on f8.}
10. Qb3 {Hitting b7 and d5.}
10... dxc4 {Take the pawn so the queen's pressure on d5 disappears. White has to spend a move to get it back.}
11. Bxc4 {White takes the pawn back.}
11... Qe7 {The queen steps to a safe square, protects b7 and prepares the ...e5 break. [%cal Ge7b7]}
12. O-O {White castles.}
12... e5 {Time to strike in the centre! Your pieces are all developed, and the e5 break equalises.}
13. Qc2 {White keeps an eye on your pawn. You are fully developed with an equal game: keep your king safe and use your rook on the open h-file when the chance comes.}
)
(6. Qb3 {White hits b7 and d5 once more.}
6... Qb6 {Defend b7 and offer a queen swap. Your h-pawn can go to h6 later to give the bishop a retreat. [%cal Gb6b7]}
7. Be2 {White calmly develops the bishop.}
7... h6 {A smart little move. It makes a safe retreat square on h7 for your bishop, so knight jumps like Nh4 can never trap it. [%cal Gf5h7]}
8. O-O {White castles.}
8... Be7 {Develop the bishop and get ready to castle.}
9. Bd2 {White develops.}
9... Nbd7 {The last minor piece enters the game. You are almost fully developed.}
10. Rfc1 {The rook takes the c-file.}
10... O-O {Castle. Your king is safe, and the position is balanced with chances for both sides.}
11. Na4 {White offers a queen swap. You are comfortable: your pieces are developed and your pawns are solid. Trade queens or avoid it, either is fine.}
)
(6. cxd5 {White swaps pawns to open the position.}
6... exd5 {Recapture with the e-pawn. Your c6 and d5 pawns stay solid, and the bishop on f5 is perfectly placed outside the chain.}
7. Nh4 {White attacks your bishop again.}
7... Be6 {Keep the bishop in play and out of the knight's way.}
8. Bd3 {White develops.}
8... Bd6 {Develop the bishop. It eyes White's king-side, and you will castle next. [%cal Gd6h2]}
9. Nf5 {White tries to swap off your good bishop.}
9... Bxf5 {Take the knight before it can do any harm.}
10. Bxf5 {White recaptures.}
10... O-O {Castle! Your position is equal and very easy to play: finish developing with ...Nbd7, ...Re8 and ...Qe7.}
11. O-O {White castles too. The opening is over and you have a healthy, equal game.}
)
6... Bg6 {Keep the bishop. If White swaps on g6 you retake with the h-pawn and open the h-file for your rook. [%cal Gg6d3]}
7. O-O {White castles.}
7... Nbd7 {Develop and cover e5. [%cal Gd7e5]}
8. b3 {White prepares to put the bishop on b2.}
8... Bd6 {Develop the bishop to the best diagonal, aiming at White's king-side. [%cal Gd6h2]}
9. Bb2 {White develops.}
9... O-O {Castle! Your king is safe and all your pieces are developed.}
10. Qc2 {White puts the queen behind the bishop.}
10... Re8 {Put the rook on the e-file to support the ...e5 break. [%cal Ge8e6]}
11. Bxg6 {White takes your bishop.}
11... hxg6 {Retake with the h-pawn. The open h-file is a bonus for your rook.}
12. e4 {White seizes space in the centre.}
12... e5 {Strike back in the centre. Your pieces are all placed to fight for the middle.}
13. cxd5 {White opens the c-file. The opening is over and the game is equal. Recapture with ...cxd5, put a rook on c8 and play on the queenside and in the centre. You do not need any more theory here, just good pieces.}
`

const exchangeSlav = `
1. d4 {White opens with the queen's pawn.}
1... d5 {You mirror it. Your pawn claims a share of the centre and stops White from playing e4 easily. [%cal Gd5e4]}
2. c4 {The Queen's Gambit. White attacks your d5-pawn from the side.}
2... c6 {The Slav. The c6-pawn protects d5 and, unlike ...e6, it leaves your light-squared bishop free to come out. [%cal Gc6d5,Gc8f5]}
3. cxd5 {The Exchange Slav. White trades pawns to get a calm, symmetrical position with no risk. It is a safe line, but you can still play for a win if you stay active.}
3... cxd5 {Recapture with the c-pawn. Now the c-file is open for both sides, and both sides have a pawn on d4 and d5. This pawn structure is called "symmetrical". [%csl Gd4,Gd5]}
4. Nc3 {White develops a knight and adds pressure on d5.}
4... Nf6 {You develop a knight and guard d5 again. [%cal Gf6d5]}
5. Bf4 {White puts the bishop outside the pawn chain, the same idea you use with ...Bf5.}
(5. Nf3 {A very common move order. White develops the knight first.}
5... Nc6 {Develop the second knight. It adds pressure on d4 and keeps all your options open. [%cal Gc6d4]}
6. Bf4 {The same set-up as in the main line, just reached by another move order.}
6... Bf5 {Your bishop gets out before you close the pawn chain. [%cal Gf5b1]}
7. e3 {White protects d4 and opens the road for the bishop on f1.}
7... e6 {Now you close the pawn chain. All your pieces can develop easily. [%csl Gd5,Ge6]}
8. Be2 {White develops the bishop to a safe square.}
8... Bb4 {Pin the knight on c3. The knight now cannot move freely, and the pin adds pressure on d4. [%cal Rb4c3,Gb4e1]}
9. O-O {White castles.}
9... O-O {You castle too. Both kings are safe.}
10. Na4 {The knight jumps away from the pin and aims at the bishop.}
10... Ne4 {Put a knight on e4, a great central square. It is protected by the d5-pawn and cannot be easily kicked away. [%cal Ge4c3,Ge4f2]}
11. a3 {White asks your bishop a question.}
11... Bd6 {Retreat to d6. Nothing is lost, and the bishop eyes White's king-side. [%cal Gd6h2]}
12. Bxd6 {White trades bishops.}
12... Nxd6 {Recapture with the knight. Your pieces are well placed and the game is equal.}
13. Nc5 {White jumps into c5. You can swap it off or play ...b6 to kick it away. Equal chances.}
)
5... Nc6 {Develop the second knight. It pressures d4 and keeps your options open. [%cal Gc6d4]}
6. e3 {White protects d4 and opens the road for the bishop on f1.}
6... Bf5 {Your bishop gets out before you close the pawn chain, just like White's bishop on f4. The two bishops now face each other. [%cal Gf5b1]}
7. Nf3 {White develops the knight.}
(7. Qb3 {The queen attacks your b7-pawn and your d5-pawn. This is a favourite trick against the Exchange Slav.}
7... Na5 {The key reply. Your knight attacks the queen and also guards the b7-pawn, so White's double attack on b7 and d5 falls apart. [%cal Ga5b3,Ga5b7]}
8. Bb5+ {White checks to gain time.}
8... Bd7 {Block the check with the bishop. Do not block with ...Nc6 or ...Nd7: White would then win your d5-pawn. [%cal Gd7b5]}
9. Bxd7+ {White trades bishops.}
9... Qxd7 {Recapture with the queen. Everything is protected.}
10. Qb5 {The queen offers a trade and hits your knight.}
10... Nc6 {The knight escapes the queen and returns to the centre, where it pressures d4. [%cal Gc6d4]}
11. Nf3 {White develops.}
11... e6 {Now close the pawn chain. All your pieces can develop calmly. [%csl Gd5,Ge6]}
12. O-O {White castles.}
12... Be7 {Develop the bishop and get ready to castle. Your game is equal.}
13. Rfc1 {White takes the open c-file.}
)
(7. Qb3 Na5 8. Qa4+ {White checks instead.}
8... Bd7 {Block the check with the bishop, which also attacks the queen. Always block with the bishop here, never with the knight. [%cal Gd7a4]}
9. Qc2 {The queen retreats.}
9... Rc8 {Put the rook opposite the queen on the c-file. The rook develops with a threat, and White has to react. [%cal Rc8c2]}
10. Bd3 {White offers to trade bishops.}
10... e6 {Close the pawn chain. You are solid and every piece has a job.}
11. Nf3 {White develops.}
11... Bb4 {Pin the knight on c3 and add pressure to d4. [%cal Rb4c3]}
12. O-O {White castles.}
12... a6 {A quiet useful move. It stops Nb5 tricks and gives the bishop a safe retreat.}
13. Qe2 {A calm move. You have a comfortable game.}
)
(7. Bb5 {White pins your c6-knight against your king.}
7... e6 {Close the pawn chain. Next you will unpin with ...Nd7. [%csl Gd5,Ge6]}
8. Nf3 {White develops.}
8... Nd7 {Your second knight steps in front of the king, so the c6-knight is no longer pinned. [%cal Gd7b6]}
9. O-O {White castles.}
9... Be7 {Develop the bishop and get ready to castle.}
10. Rc1 {White takes the c-file.}
10... Rc8 {You take the c-file too. Both sides have a healthy position.}
11. Bxc6 {White trades its bishop for your knight. Recapture with ...bxc6 and you keep the two bishops, which is a real asset in the middlegame.}
)
7... e6 {Now you can close the gate: your bishop is already out. Your pawns d5 and e6 are solid and your pieces have room. [%csl Gd5,Ge6]}
8. Bd3 {White offers to swap the bishops.}
(8. Qb3 {The queen attacks b7 again.}
8... Bb4 {Pin the knight on c3. This adds pressure on d4 and prepares to castle. [%cal Rb4c3]}
9. Bb5 {White pins the c6-knight and adds pressure.}
9... Bxc3+ {Trade now! White's bishop pins your c6-knight, so that knight can no longer guard your bishop on b4, and the queen would simply win it.}
10. Qxc3 {White recaptures. White now has two bishops against your two knights, but you are fully solid.}
10... O-O {Castle. Your king is safe, and the pinned knight on c6 is defended.}
11. Bxc6 {White trades the bishop for the knight.}
11... Rc8 {Attack the bishop on c6 with the rook, so you win the piece back. [%cal Gc8c6]}
12. Ne5 {The knight guards the bishop on c6.}
12... Ng4 {A strong little move. Your knight attacks the e5-knight, so White has to resolve the tension. [%cal Gg4e5]}
13. Nxg4 {White trades.}
)
(8. Be2 {A quiet move. White prepares castling.}
8... Bb4 {Pin the knight on c3 and put pressure on d4. [%cal Rb4c3]}
9. O-O {White castles.}
9... O-O {You castle too.}
10. Nh4 {White goes after your bishop.}
10... Bg6 {Retreat the bishop. If White trades on g6 you will recapture with the h-pawn. [%cal Gg6b1]}
11. Nxg6 {White trades.}
11... hxg6 {Recapture. Your rook now looks down the h-file and your position is healthy. [%cal Gh8h2]}
12. Na4 {White heads for c5.}
)
(8. Nh4 {White attacks your bishop.}
8... Bg6 {Retreat to g6. If White takes, you recapture with the h-pawn. [%cal Gg6b1]}
9. Nxg6 {White trades.}
9... hxg6 {Recapture. Your rook looks down the open h-file.}
10. Qb3 {The queen hits b7.}
10... Bb4 {Pin the knight and protect against Qxb7 tricks with a counter-attack. [%cal Rb4c3]}
11. Bd3 {White develops.}
11... O-O {Castle. You are fine.}
12. h3 {White makes luft.}
)
8... Bxd3 {Trade bishops. You do not need to avoid trades: it makes the position simpler and White's pieces have less to aim at.}
9. Qxd3 {White recaptures with the queen.}
9... Bb4 {Pin the knight on c3. If it moves, d4 can come under attack. [%cal Rb4c3]}
10. O-O {White castles.}
(10. Bg5 {White pins your knight on f6.}
10... Rc8 {Take over the c-file. Your rook eyes the knight on c3. [%cal Gc8c3]}
11. Rc1 {White puts a rook on the c-file as well.}
11... h6 {Ask the bishop what it wants to do. This also gives your king a little room.}
12. Bxf6 {White trades.}
12... Qxf6 {Recapture with the queen. Your queen eyes d4 and b2.}
13. a3 {White asks the bishop to decide.}
)
10... O-O {Castle. Both kings are safe and the position is equal.}
11. Bg5 {White pins the knight on f6.}
11... Rc8 {Take the open c-file with the rook. It is the natural place for it. [%cal Gc8c3]}
12. Rac1 {White does the same.}
12... h6 {Ask the bishop what it wants to do. This also gives your king a little room.}
13. Bxf6 {White trades.}
13... Qxf6 {Recapture with the queen. Your pieces are well placed. The position is equal.}
14. a3 {White asks your bishop a question.}
`

const exchangeTricks = `
1. d4 {White opens with the queen's pawn.}
1... d5 {You take a share of the centre.}
2. c4 {The Queen's Gambit.}
2... c6 {The Slav. Your c6-pawn protects d5 and keeps the bishop's road open. [%cal Gc6d5,Gc8f5]}
3. cxd5 {The Exchange Slav.}
3... cxd5 {Recapture with the c-pawn. The position is symmetrical, so White often tries small tricks to get an edge. This chapter shows you how to meet them.}
4. Nc3 {White develops and presses on d5.}
(4. Qb3 {The queen hits your d5-pawn at once. It looks scary, but d5 is well protected.}
4... Nc6 {Develop a piece. Your knight eyes d4, and your queen guards d5, so White cannot take there: Qxd5?? would lose the queen. [%cal Gc6d4,Gd8d5]}
5. Nf3 {White develops.}
5... Nf6 {Develop the second knight; it guards d5 again. [%cal Gf6d5]}
6. Nc3 {White adds a second attacker on d5.}
6... e6 {Now d5 is protected three times (queen, knight, pawn) and your position is solid. [%csl Gd5,Ge6]}
7. e3 {White opens the road for the bishop.}
7... Bd6 {Develop the bishop to its best diagonal, where it eyes White's king-side. [%cal Gd6h2]}
8. Bd3 {White develops.}
8... O-O {Castle! Your king is safe.}
9. O-O {White castles too. The position is balanced and you have a comfortable game.}
)
(4. Bf4 {White develops the bishop first.}
4... Nc6 {Develop a piece and press on d4. [%cal Gc6d4]}
5. e3 {White protects d4.}
5... Nf6 {Your second knight also guards d5.}
6. Nc3 {Now we have exactly the main line of the Exchange Slav.}
6... Bf5 {The same set-up as always: bishop out first, then ...e6. See the previous chapter for the full plan. [%cal Gf5b1]}
7. Nf3 {White develops. You continue with ...e6 and ...Bb4 or ...Be7.}
)
(4. Nf3 {White develops the knight first.}
4... Nf6 {Develop and protect d5. [%cal Gf6d5]}
5. Nc3 {White adds pressure on d5.}
5... Nc6 {Develop the second knight. [%cal Gc6d4]}
6. Bg5 {White pins your knight on f6.}
6... Ne4 {Break the pin by jumping to e4! The knight is protected by the d5-pawn, and now the bishop on g5 has nothing to pin. [%cal Ge4g5,Ge4c3]}
7. Bd2 {White retreats the bishop.}
7... e6 {Close the pawn chain. All your pieces can develop now. [%csl Gd5,Ge6]}
8. e3 {White prepares to develop the bishop.}
8... Bd6 {The bishop heads for its best diagonal, eyeing White's king-side. [%cal Gd6h2]}
9. Bb5 {White pins the knight on c6.}
9... O-O {Castle! Your king is safe. The pinned knight is protected by the b7-pawn.}
10. O-O {White castles as well.}
10... Bd7 {Unpin the knight and get ready for ...Rc8. Your pieces are active and your game is comfortable. [%cal Gd7b5]}
11. Rc1 {White takes the open c-file. The position is balanced.}
)
4... Nf6 {Develop the knight and defend d5 again. [%cal Gf6d5]}
5. Bg5 {White pins your knight on f6. It looks annoying, but you have a neat answer.}
(5. Qb3 {White hits d5 and b7 with the queen.}
5... Nc6 {Develop with a threat on d4. Your d5-pawn is protected twice, and the bishop on c8 guards b7. [%cal Gc6d4]}
6. e3 {White protects d4.}
6... e6 {Now close the gate. The d5-pawn has plenty of defenders. [%csl Gd5,Ge6]}
7. Bd3 {White develops.}
7... a6 {Prepare ...b5. This also stops Nb5 and takes space on the queenside. [%cal Gb7b5]}
8. Nf3 {White develops.}
8... b5 {Gain space. Your queenside pawns are well protected, and White's pieces have less room. [%cal Gb5a4]}
9. O-O {White castles.}
9... Bb7 {Develop the last piece to a good diagonal. Your position is solid and comfortable.}
10. Bd2 {A natural developing move. Both sides have easy plans.}
)
5... Ne4 {Break the pin by jumping into the centre. Your knight is protected by the d5-pawn, and it attacks both the bishop on g5 and the knight on c3. [%cal Ge4g5,Ge4c3]}
6. Nxe4 {White takes the knight.}
(6. Bf4 {The bishop retreats and keeps its diagonal.}
6... Nc6 {Develop and attack d4. [%cal Gc6d4]}
7. Nf3 {White develops.}
7... Qb6 {The queen attacks b2 and presses on d4. Your knight on e4 is protected by the d5-pawn. [%cal Gb6b2,Gb6d4]}
8. Bd2 {White attacks your knight.}
8... Nxd2 {Take the bishop before it takes your knight.}
9. Qxd2 {White recaptures.}
9... e6 {Close the pawn chain. All your pieces are ready to develop.}
10. Rc1 {White takes the c-file.}
10... Bd6 {Develop the bishop to a great diagonal. [%cal Gd6h2]}
11. e3 {White develops.}
11... O-O {Castle! Your king is safe and you have a comfortable position.}
12. Bd3 {White develops the last piece. The game is equal and both sides have easy plans.}
)
(6. Qb3? {White attacks d5 and b7 but forgets about the bishop on g5.}
6... Nxg5 {Take the bishop! You win a whole piece.}
7. Qxd5 {White takes a pawn but is a bishop down. Stay calm: trade queens with ...Qxd5 and develop. You are comfortably ahead.}
)
6... dxe4 {Recapture with the d-pawn. The pawn on e4 cramps White: it controls d3 and f3, so White cannot develop easily. The bishop on g5 is now loose, which gives you ...Qa5+ tricks. [%cal Ge4f3,Ge4d3]}
7. Rc1 {White takes the open c-file.}
7... Bd7 {Develop the bishop. It heads for c6, where it supports your e4-pawn. [%cal Gd7c6]}
8. Bd2 {White retreats the loose bishop.}
(8. Qc2 {White attacks your e4-pawn.}
8... Bc6 {Protect the pawn and keep the bishop on a good diagonal. [%cal Gc6e4]}
9. Bd2 {White retreats the bishop.}
9... e6 {Close the pawn chain and open the road for your king's bishop. [%csl Gd5,Ge6]}
10. e3 {White develops.}
10... Nd7 {Develop the last knight. You are comfortable, and your e4-pawn is a thorn in White's position. [%cal Gd7f6]}
11. Be2 {White develops.}
)
(8. e3? {A natural developing move, but it drops the bishop!}
8... Qa5+ {Check! The queen attacks the king and the bishop on g5 at the same time. [%cal Ga5g5]}
9. Qd2 {White blocks the check, but the e3-pawn blocks White's own queen from guarding the bishop.}
9... Qxg5 {Take the bishop. You are a clean piece up.}
10. h4 {White attacks the queen, but it is too late.}
)
8... Bc6 {Support the e4-pawn. The bishop sits on a fine diagonal right behind it. [%cal Gc6e4]}
9. e3 {White develops.}
9... e6 {Close the pawn chain and open the road for your king's bishop. [%csl Gd5,Ge6]}
10. Qb3 {The queen eyes b7 and pushes on the queenside.}
`

export const slavCourse: OpeningCourse = {
  id: 'slav',
  name: 'Slav Defence',
  side: 'black',
  tagline: '',
  signatureMoves: [],
  ecoNames: [],
  overview: [],
  keyIdeas: [],
  commonMistakes: [],
  chapters: [
    {
      id: 'slow-slav',
      title: 'The Slow Slav: 4.e3 and the active bishop',
      summary:
        'White plays a quiet 3.Nf3 and 4.e3. You bring your light-squared bishop out first, and only then close the pawn chain with ...e6.',
      difficulty: 1,
      pgn: slowSlav,
    },
    {
      id: 'exchange-slav',
      title: 'The Exchange Slav: 3.cxd5 cxd5',
      summary:
        'White swaps pawns on move 3 to get a calm, symmetrical game. You develop with ...Nf6, ...Nc6, ...Bf5 and ...e6 and keep things active.',
      difficulty: 1,
      pgn: exchangeSlav,
    },
    {
      id: 'exchange-tricks',
      title: 'Exchange Slav: tricks with Bg5 and Qb3',
      summary:
        'After 3.cxd5 cxd5 White may try 5.Bg5, a queen sortie to b3, or another move order. Here are the safe answers and one or two traps to avoid.',
      difficulty: 2,
      pgn: exchangeTricks,
    },
  ] satisfies OpeningChapter[],
}
