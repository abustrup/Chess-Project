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
5. Nc3 {White develops a knight and adds a second attacker against d5.}
(5. cxd5 {White swaps pawns to open the c-file.}
5... cxd5 {Recapture with the c-pawn. Now you have a pawn on d5 that is protected by your knight, and your bishop is already outside the pawn chain.}
6. Nc3 {Another attacker on d5 and a developing move.}
6... e6 {Now you close the door. The d5-pawn is solid and your bishop is already out. Next come ...Nc6 and ...Be7.}
7. Qb3 {The queen hits your b7-pawn and your d5-pawn at the same time.}
7... Qc7 {The queen guards b7 and also eyes the open c-file. Always check your b7-pawn when a white queen lands on b3. [%cal Gc7b7,Rb3b7]}
8. Nh4 {White attacks your bishop. White hopes to swap the knight for your bishop or to chase it away.}
8... Bg6 {Retreat to g6, where the bishop stays active on the same diagonal. If White takes it, you retake with the h-pawn and your rook gets the h-file. [%cal Gg6b1,Rh4g6]}
9. Bd2 {White develops and prepares to castle queenside.}
9... Nc6 {Another piece joins the fight for the centre. Now d4 is under pressure from the knight. [%cal Gc6d4]}
10. Rc1 {The rook looks at your queen on the c-file.}
10... Be7 {Develop the bishop and get ready to castle.}
11. Nxg6 {White swaps the knight for your bishop.}
11... hxg6 {Retake with the h-pawn. Your rook gets the open h-file, and your centre is solid. [%cal Gh8h2]}
12. Bd3 {White develops.}
12... Rc8 {Put the rook on the c-file, opposite the white rook. Your pieces are well placed and the position is equal.}
13. Na4 {White heads for c5 with the knight. You are fine: if the knight lands on c5, trade it off with ...Bxc5.}
)
(5. Qb3 {White attacks your b7-pawn straight away. This is a common trap for players who forget about b7!}
5... Qb6 {Defend b7 and offer a queen swap. The swap is good for you: it leads to a safe, equal position. [%cal Gb6b7,Rb3b7]}
6. cxd5 {White takes on d5 first.}
6... Qxb3 {Swap the queens before White can do anything with that open c-file.}
7. axb3 {White recaptures with the a-pawn, which leaves White with two pawns on the b-file (doubled pawns). That is a small weakness.}
7... Nxd5 {Now you simply win back the pawn with a centralised knight. Your pieces are active and White has a damaged pawn structure. [%csl Rb2,Rb3]}
8. Bd2 {White develops.}
8... e6 {Your bishop is outside the pawn chain, so closing it with ...e6 is fine now. You will play ...Nd7 and ...Be7 next. Equal and comfortable.}
9. Na3 {White develops the knight to the edge of the board. You are fine: play ...Be7, ...Nd7 and castle.}
)
(5. Nh4 {White attacks the bishop and hopes you will retreat it to c8. The knight on the edge is risky for White though.}
5... Be6 {Keep the bishop outside and out of the knight's reach. Be careful: ...Bg4?! runs into Qb3 and your b7-pawn is in trouble. [%cal Rd1b3]}
6. Qb3 {Hits b7 and d5 again.}
6... Qb6 {Defend b7 and offer a queen swap. [%cal Gb6b7]}
7. Nc3 {White develops and adds pressure to d5.}
7... dxc4 {The d5-pawn is under pressure, so you grab the c4-pawn and open the bishop's diagonal. Now White must recapture, which drags a piece to c4 where you can swap it. [%cal Ge6c4]}
8. Bxc4 {White takes the pawn back.}
8... Bxc4 {Swap off the bishop. With fewer pieces on the board, White's early knight on h4 looks out of place.}
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
8... Bd6 {Develop the bishop to a great diagonal. It aims at h2, and your rook on the h-file backs it up. White must be careful now! [%cal Rd6h2]}
9. h3 {The safe reply: the pawn steps to h3, out of the bishop's sight.}
(9. Bd2 {White develops but leaves h2 a little loose.}
9... Nbd7 {Develop and keep an eye on the centre.}
10. h4 {White pushes the h-pawn forward, which also blocks the h-file for your rook.}
10... Qe7 {The queen steps to a safe square, supports ...e5 and keeps everything protected.}
11. Qb3 {Hitting b7.}
11... dxc4 {Capture first. White's bishop has to recapture, and then you can kick it away with ...b5.}
12. Bxc4 {White takes the pawn back.}
12... b5 {Kick the bishop away. Your b5-pawn is guarded by the c6-pawn. [%cal Rb5c4]}
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
13. Qc2 {White keeps an eye on your pawn. You are fully developed with an equal game: keep your king safe and use the open h-file when the chance comes.}
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
11. Na4 {White attacks your queen with the knight. You are comfortable: your pieces are developed and your pawns are solid. Trade queens or step aside, either is fine.}
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
3. cxd5 {The Exchange Slav. White trades pawns to get a calm, symmetrical position with few risks. It is a safe line, but you can still play for a win if you stay active.}
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
8... Bb4 {Pin the knight on c3. It cannot move freely now, and you are ready to castle. [%cal Rb4c3,Gb4e1]}
9. O-O {White castles.}
9... O-O {You castle too. Both kings are safe.}
10. Na4 {The knight steps out of the pin and heads for the c5-square.}
10... Ne4 {Put a knight on e4, a great central square. It is protected by the d5-pawn and cannot be easily kicked away. [%cal Ge4c3,Ge4f2]}
11. a3 {White attacks your bishop.}
11... Bd6 {Retreat to d6. Nothing is lost, and the bishop challenges White's bishop on f4. [%cal Gd6f4]}
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
8... Bd7 {Block the check with the bishop. Do not block with a knight (...Nc6 or ...Nd7): that loses material. [%cal Gd7b5]}
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
9... Rc8 {Put your rook on the open c-file, facing White's queen. Only the knight on c3 stands between them, so White must be careful whenever that knight moves. [%cal Rc8c2]}
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
10... O-O {Castle. Your king has left e8, so the knight on c6 is no longer pinned.}
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
12. h3 {White makes room for his king.}
)
8... Bxd3 {Trade bishops. You do not need to avoid trades: it makes the position simpler and White's pieces have less to aim at.}
9. Qxd3 {White recaptures with the queen.}
9... Bb4 {Pin the knight on c3 and get ready to castle. [%cal Rb4c3]}
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
6... Bf5 {The same set-up as always: bishop out first, then ...e6. See the Exchange Slav chapter for the full plan. [%cal Gf5b1]}
7. Nf3 {White develops. You continue with ...e6 and ...Bb4 or ...Be7.}
)
(4. Nf3 {White develops the knight first.}
4... Nf6 {Develop and protect d5. [%cal Gf6d5]}
5. Nc3 {White adds pressure on d5.}
5... Nc6 {Develop the second knight. [%cal Gc6d4]}
6. Bg5 {White's bishop attacks your knight on f6. If it takes the knight, your pawns get damaged.}
6... Ne4 {Jump to e4! The knight is protected by the d5-pawn, it gets away from the bishop, and it attacks both the bishop on g5 and the knight on c3. [%cal Ge4g5,Ge4c3]}
7. Bd2 {White retreats the bishop.}
7... e6 {Close the pawn chain. All your pieces can develop now. [%csl Gd5,Ge6]}
8. e3 {White prepares to develop the bishop.}
8... Bd6 {The bishop heads for its best diagonal, eyeing White's king-side. [%cal Gd6h2]}
9. Bb5 {White pins the knight on c6 to your king.}
9... O-O {Castle! Your king is safe and the pin is gone. The knight on c6 is protected by the b7-pawn.}
10. O-O {White castles as well.}
10... Bd7 {Develop the last piece and back up the knight on c6: if White ever takes on c6, you take back with the bishop and keep your pawns healthy. Next comes ...Rc8. [%cal Gd7c6]}
11. Rc1 {White takes the open c-file. The position is balanced.}
)
4... Nf6 {Develop the knight and defend d5 again. [%cal Gf6d5]}
5. Bg5 {White's bishop attacks your knight on f6. It looks annoying, but you have a neat answer.}
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
5... Ne4 {Jump into the centre! Your knight is protected by the d5-pawn, and it attacks both the bishop on g5 and the knight on c3. [%cal Ge4g5,Ge4c3]}
6. Nxe4 {White takes the knight.}
(6. Bf4 {The bishop retreats and keeps its diagonal.}
6... Nc6 {Develop and attack d4. [%cal Gc6d4]}
7. Nf3 {White develops.}
7... Qb6 {The queen attacks b2 and presses on d4. Your knight on e4 is protected by the d5-pawn. [%cal Gb6b2,Gb6d4]}
8. Bd2 {The bishop steps back to d2, where it guards the knight on c3.}
8... Nxd2 {Swap your knight for the bishop. Now you keep both of your bishops, which is a small long-term plus.}
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

const vsLondon = `
1. d4 {White starts with the queen's pawn.}
1... d5 {You take your share of the centre. [%cal Gd5e4]}
2. Nf3 {A flexible developing move. White does not play c4 yet, so this is not a real Slav position. But you can still use your Slav set-up.}
(2. Bf4 {White brings the bishop out at once. This is the same London plan with a different move order.}
2... c6 {Your usual Slav move. It protects d5 and keeps the road open for your bishop. [%cal Gc6d5,Gc8f5]}
3. e3 {White protects the bishop and opens the road for the bishop on f1.}
3... Bf5 {Bishop out before ...e6! Now the dark bishop on f4 and your light bishop face each other. [%cal Gf5b1]}
4. Nf3 {White develops.}
4... e6 {Now the gate can close. You are in the main line below.}
5. Nbd2 {We have arrived in the main line of this chapter. Carry on there.}
)
2... c6 {The Slav move: the c-pawn guards d5 and the bishop can come to f5 next. [%cal Gc6d5,Gc8f5]}
3. Bf4 {The London System. White develops the dark bishop outside the pawn chain, a typical plan for a calm game.}
3... Bf5 {Do the same on your side. Bring your light bishop out before you play ...e6. Now both sides have a bishop outside the pawn chain. [%cal Gf5b1]}
4. e3 {White protects the bishop and opens the road for the bishop on f1.}
(4. Nh4 {White attacks your bishop with the knight. The knight on the rim has few friends, so you can answer with a counter-attack.}
4... Bg4 {Step aside to g4. The bishop stays active and out of the knight's reach, and the knight on h4 now has nothing to do there. If White chases the bishop with h3 and g4, you have a neat answer (see the side line). [%cal Gf5g4]}
5. Nf3 {The knight goes back to f3. It used two moves to go to h4 and back, while your bishop used only one. You gained time.}
(5. h3 {White asks the bishop what it wants to do.}
5... Bh5 {Keep the bishop on the same diagonal. It is safe, because the knight on h4 cannot do much.}
6. g4 {White tries to win the bishop.}
6... e6 {The only move! Now if White takes your bishop, your queen takes the knight on h4. Do not play ...Bg6?, because Nxg6 hxg6 leaves you worse. [%cal Gd8h4]}
7. Nf3 {White's knight runs back.}
7... Bg6 {Now the bishop can retreat safely.}
8. Nbd2 {White develops.}
8... Nd7 {Develop a knight. You are fine: your pieces are developed and your pawn structure is solid.}
9. e3 {White finishes the development of the centre.}
)
5... e6 {Close the gate and prepare to develop. [%csl Gc6,Gd5,Ge6]}
6. Nbd2 {White develops.}
6... Nf6 {Develop the knight. It guards d5 and eyes e4. [%cal Gf6d5,Gf6e4]}
7. e3 {White opens the road for the bishop.}
7... Bd6 {Challenge White's best bishop. [%cal Gd6f4]}
8. h3 {White asks your bishop a question.}
8... Bxf3 {Trade your bishop for the knight. It removes a defender of White's centre and keeps your structure healthy.}
9. Nxf3 {White recaptures.}
9... Bxf4 {Take White's bishop too.}
10. exf4 {White recaptures. White has doubled pawns on the f-file, and you have an easy, solid position.}
)
4... e6 {Now you close the gate. The bishop is safely outside. Next you develop ...Nd7, ...Ngf6 and ...Be7. [%csl Gc6,Gd5,Ge6]}
5. Nbd2 {White develops the last knight.}
(5. Bd3 {White offers to swap the light-squared bishops.}
5... Bxd3 {Take it. Swapping these bishops is fine for you: White's bishop was aiming at your king-side, and now it is gone.}
6. Qxd3 {White recaptures with the queen.}
6... Nf6 {Develop with a purpose. The knight guards d5 and heads for the centre. [%cal Gf6d5]}
7. c4 {White attacks d5.}
7... Bd6 {Offer to swap White's dark-squared bishop. That bishop is White's best piece in the London. [%cal Gd6f4]}
8. Bxd6 {White takes.}
8... Qxd6 {Recapture with the queen. Your queen eyes the kingside.}
9. O-O {White castles.}
9... O-O {You castle too. The position is equal.}
10. Rc1 {A natural developing move.}
)
(5. c4 {White attacks d5 right away.}
5... Bd6 {Challenge White's best bishop. If White takes, you recapture with the queen. [%cal Gd6f4]}
6. Bxd6 {White takes.}
6... Qxd6 {Recapture. Your queen now eyes the white king-side.}
7. Nc3 {White develops and adds pressure to d5.}
7... Nf6 {Develop and protect d5. [%cal Gf6d5]}
8. Nh4 {White attacks your bishop.}
8... O-O {Castle first. If White takes on f5, you recapture with the e-pawn and get a nice centre.}
9. cxd5 {White takes.}
9... cxd5 {Recapture. Your centre pawns are strong, and the c-file is open.}
10. Nxf5 {White swaps the knight for your bishop.}
10... exf5 {Recapture. You have a strong pawn centre and nothing to fear.}
11. g3 {White prepares to develop the bishop to g2.}
)
5... Nd7 {Develop the knight to d7. It keeps the e5 and f6 squares under control, and the other knight will come to f6. [%cal Gd7f6]}
6. Be2 {White develops.}
6... Ngf6 {Develop the second knight. Both knights now guard the centre. [%cal Gf6e4]}
7. O-O {White castles.}
7... Be7 {Develop the bishop and prepare to castle. [%cal Ge7h4]}
8. c4 {White pushes the c-pawn to attack d5.}
8... O-O {Castle! Your king is safe, and your pieces are ready.}
9. Qb3 {The queen eyes your b7-pawn.}
9... Qc8 {Defend b7 with the queen and keep your game flexible. [%cal Gc8b7]}
10. Rac1 {White puts a rook on the c-file.}
10... a5 {Take space on the queenside and stop White from playing b4. [%cal Ga5b4]}
11. a3 {White prepares a queenside advance.}
`

const vsColle = `
1. d4 {White opens with the queen's pawn.}
1... d5 {You take your share of the centre. [%cal Gd5e4]}
2. Nf3 {A flexible developing move. White has not played c4, so this is not yet a Slav, but you can still use the Slav set-up.}
(2. e3 {A quiet move. White opens the road for the bishop on f1.}
2... c6 {The Slav pawn move. It protects d5 and keeps the road open for your light-squared bishop. [%cal Gc6d5,Gc8f5]}
3. Nf3 {White develops the knight. This is the same position as the main line of this chapter.}
3... Bf5 {Bishop out before ...e6! You are in the main line below.}
4. c4 {Carry on with the main line: continue with ...e6.}
)
2... c6 {The Slav move. It protects d5 and prepares to bring the bishop out. [%cal Gc6d5,Gc8f5]}
3. e3 {White builds a quiet set-up with e3, Bd3 and c3 or c4. This is sometimes called the Colle System.}
(3. g3 {White plans to put a bishop on g2. This is a Catalan-style set-up.}
3... Bf5 {Again, bishop out first. It keeps an eye on the c2 and b1 squares. [%cal Gf5c2]}
4. Bg2 {White develops.}
4... e6 {Close the pawn chain. Your pieces can now develop easily. [%csl Gc6,Gd5,Ge6]}
5. O-O {White castles.}
5... h6 {A useful little move. It gives your bishop a retreat square on h7 and stops Ng5 or Bg5 ideas. [%cal Gf5h7]}
6. c4 {White attacks d5.}
6... Nf6 {Develop and protect d5. [%cal Gf6d5]}
7. Nfd2 {White gets ready to play Nc3 and e4.}
7... Be7 {Develop the bishop and prepare to castle. [%cal Ge7h4]}
8. Nc3 {White develops.}
8... O-O {Castle! Your king is safe.}
9. e4 {White grabs the centre.}
)
3... Bf5 {Bishop out before ...e6, as always. It also stops White from playing e4 for free. [%cal Gf5e4,Gf5b1]}
4. c4 {White attacks d5 with a pawn.}
(4. Nh4 {White attacks your bishop.}
4... Be4 {Move to e4, a great central square. The bishop is protected by your d5-pawn, and it eyes the g2-pawn. [%cal Ge4g2]}
5. Nd2 {White attacks the bishop with a second piece.}
(5. f3 {White attacks the bishop with a pawn.}
5... e6 {Close the pawn chain and open the road from d8 to h4 for your queen. Now if White takes your bishop with fxe4, you play ...Qxh4+ and win the knight back with check. [%cal Gd8h4]}
6. g3 {White gives the bishop a hard time.}
6... Bg6 {Retreat to g6. The knight on h4 is awkward and White has weakened the king-side with f3 and g3.}
7. Nxg6 {White trades the knight for the bishop.}
7... hxg6 {Recapture. Your rook looks down the open h-file and you can follow up with ...Bd6.}
8. c4 {White grabs space.}
)
5... e6 {Close the pawn chain. This also opens the road from d8 to h4: if White takes on e4, you recapture with the d-pawn and your queen attacks the loose knight on h4. [%cal Gd8h4]}
6. Nhf3 {The knight returns to a safe square.}
(6. Ndf3? {A mistake! This leaves the knight on h4 without any good squares.}
6... g5! {The knight on h4 is trapped. It has no safe square: f5 and g6 are covered by your bishop, and g2 and f3 are blocked or guarded. You win a whole piece. [%cal Gg5h4,Ge4f5,Ge4g6]}
7. Nfd2 {White attacks your bishop and ignores the problem on h4.}
7... gxh4 {Take the knight! The pawn on h4 is a bit ugly, but you are a whole piece up.}
8. Nxe4 {White takes your bishop.}
8... dxe4 {Recapture. You have won two knights for one bishop.}
9. f3 {White tries to open lines against your extra piece. Stay calm, develop and trade pieces to win.}
)
6... Bf5 {Go back to f5. White has wasted time moving the knight twice.}
7. Bd3 {White offers to trade bishops.}
7... Bxd3 {Trade it off. Your pieces get easy squares.}
8. cxd3 {White recaptures.}
)
(4. Bd3 {White offers to swap your good bishop.}
4... Bg6 {Keep the bishop. If White trades on g6, you recapture with the h-pawn and your rook gets the h-file. [%cal Gg6d3]}
5. c4 {White attacks d5.}
5... e6 {Close the pawn chain. All your pieces can develop now. [%csl Gc6,Gd5,Ge6]}
6. O-O {White castles.}
6... Nf6 {Develop and protect d5. [%cal Gf6d5]}
7. Qc2 {White lines up against your bishop on g6.}
7... Bxd3 {Trade bishops. White's bishop was the more dangerous one.}
8. Qxd3 {White recaptures.}
8... Be7 {Develop the bishop and prepare to castle. [%cal Ge7h4]}
9. Nc3 {White develops.}
9... O-O {Castle. Both sides are fine and you have an easy game.}
10. b3 {White prepares to put the bishop on b2.}
)
4... e6 {Close the pawn chain. All your pieces can develop easily. [%csl Gc6,Gd5,Ge6]}
5. Nc3 {White develops and adds pressure on d5.}
(5. Qb3 {White attacks your b7-pawn. (Your d5-pawn is safe: White's own c4-pawn blocks the queen.)}
5... Qc7 {Protect b7 with the queen and keep the pawn chain intact. Do not forget the b7-pawn when a white queen reaches b3! [%cal Gc7b7]}
6. Bd3 {White offers a bishop trade.}
6... Bg6 {Keep the bishop. If White trades, you recapture with the h-pawn. [%cal Gg6d3]}
7. Qc2 {White retreats the queen.}
7... Nf6 {Develop and protect d5. [%cal Gf6d5]}
8. O-O {White castles.}
8... Nbd7 {Another piece in the game. You are ready for ...Bd6 and ...O-O.}
9. Nbd2 {White develops.}
)
(5. Bd3 {White offers to swap bishops right away.}
5... Bxd3 {Trade. It is easy and safe.}
6. Qxd3 {White recaptures with the queen.}
6... Be7 {Develop the bishop. [%cal Ge7h4]}
7. O-O {White castles.}
7... Nf6 {Develop and guard d5. [%cal Gf6d5]}
8. Nc3 {White develops.}
8... O-O {Castle! Your position is equal and very easy to play.}
9. b3 {White prepares to develop the bishop on b2.}
)
5... Nd7 {Develop the knight to d7. It keeps the f6 square free for the other knight, and it covers e5. [%cal Gd7e5]}
6. Bd3 {White offers to swap bishops.}
6... Bxd3 {Trade bishops. Your good bishop did its job and White's was the more dangerous.}
7. Qxd3 {White recaptures.}
7... Ngf6 {Develop the second knight. [%cal Gf6d5]}
8. O-O {White castles.}
8... Be7 {Develop the bishop and get ready to castle. [%cal Ge7h4]}
9. b3 {White prepares to put the bishop on b2.}
9... O-O {Castle! Your king is safe and you are fully developed.}
10. e4 {White grabs the centre.}
10... dxe4 {Take the pawn so White does not get a big centre. After White takes back, you can hit the d4-pawn with ...c5. [%cal Gd5e4]}
11. Nxe4 {White recaptures with the knight.}
`

const mainSlav = `
1. d4 {White opens with the queen's pawn.}
1... d5 {You take your share of the centre. [%cal Gd5e4]}
2. c4 {The Queen's Gambit. White attacks the d5-pawn from the side.}
2... c6 {The Slav. Your c6-pawn protects d5, and your light-squared bishop keeps its road open. [%cal Gc6d5,Gc8f5]}
3. Nf3 {White develops. This is the most popular move.}
3... Nf6 {You develop with a purpose: the knight also guards d5. [%cal Gf6d5]}
4. Nc3 {White adds a second attacker on d5 and gets ready to push e4 one day.}
4... dxc4 {The main line of the Slav. You take the pawn on c4, which frees your queen's bishop and your position. White will win the pawn back, but you get time to develop. [%cal Gd5c4]}
5. a4 {White stops you from defending the pawn with ...b5. Now White will win the c4-pawn back soon.}
5... Bf5 {The key Slav move. Your bishop gets out before you close the chain with ...e6. On f5 it controls e4, so White cannot easily play e4. [%cal Gf5e4,Gf5b1]}
6. e3 {White prepares to take back the pawn on c4 with the bishop.}
(6. Nh4 {White attacks your bishop, hoping for the bishop pair.}
6... Bg6 {Retreat to g6. If White takes, you recapture with the h-pawn, not the f-pawn. [%cal Rh4g6]}
7. Nxg6 {White takes the bishop.}
7... hxg6 {Recapture with the h-pawn! The open h-file helps your rook. Do not play ...fxg6?, because it leaves the e6-square weak and White gets an easy plan.}
8. e3 {White prepares to win back the pawn.}
8... e6 {Close the pawn chain. Your light-squared bishop is already outside, and the pawns on c6 and e6 form a solid shell. [%csl Gc6,Ge6]}
9. Bxc4 {White regains the pawn.}
9... Bb4 {Pin the knight on c3 and prepare to castle. [%cal Rb4c3]}
10. O-O {White castles.}
10... Qc7 {The queen steps to a strong square. Together with your rook on h8 it eyes the h2-pawn, and White must watch out. [%cal Gc7h2,Gh8h2]}
11. h3 {White stops your threat of ...Qxh2 mate. Pushing the pawn takes it off h2. (g3 also does the job.)}
(11. Qb3? {A blunder! White hits b7 but forgets about h2.}
11... Qxh2# {Checkmate! The queen takes h2 with check, and the rook on h8 protects her. The white king has nowhere to go. [%cal Gh8h2]}
)
11... O-O {Castle! Your king is safe, and your pieces are ready. The bishop on b4 and the queen are well placed.}
12. Qb3 {White hits b7 and prepares to bring the bishop back.}
12... c5 {Strike in the centre. The pin on c3 makes this break strong.}
13. Bd2 {White unpins the knight.}
13... Nc6 {Develop the knight with pressure on d4. [%cal Gc6d4]}
14. dxc5 {White takes the pawn.}
)
6... e6 {Now close the gate. The bishop is already outside, so it is not a prisoner. Your pawns c6 and e6 give you a solid centre. [%csl Gc6,Ge6]}
7. Bxc4 {White regains the pawn. The game is balanced.}
(7. Qb3? {A blunder! White forgets that your pawn on c4 attacks b3.}
7... cxb3 {The pawn takes the queen. White has no pawn on a2 or c2 to recapture, so you simply win the queen.}
8. Bd2 {White has no way to take back. You are a whole queen up.}
)
7... Bb4 {Pin the knight on c3 and prepare to castle. While it is pinned, the knight cannot move without exposing White's king. [%cal Rb4c3,Gb4e1]}
8. O-O {White castles.}
(8. Nh4 {White attacks your bishop on f5.}
8... O-O {Castle first. If White takes on f5, you recapture with the e-pawn and have a strong pawn centre.}
9. Nxf5 {White takes your bishop.}
9... exf5 {Recapture. The pawn on f5 is not a weakness here, and your pieces get active squares.}
10. O-O {White castles.}
10... Nbd7 {Develop the last minor piece. [%cal Gd7b6]}
11. Qd3 {White develops the queen.}
11... g6 {Support the f5-pawn and prepare ...Nb6 or ...Re8. [%cal Gg6f5]}
12. f3 {White controls the e4-square and prepares to push e4 later.}
)
8... Nbd7 {Develop the last minor piece. The knight covers e5 and prepares ...Nb6, ...c5 or ...e5 ideas. [%cal Gd7e5,Gd7b6]}
9. Qe2 {White prepares to push e4 and grab the centre.}
(9. Nh4 {White attacks the bishop on f5 once more.}
9... Bg6 {Keep the bishop. The knight on h4 will have to trade or go back. [%cal Gg6b1]}
10. Nxg6 {White takes the bishop.}
10... hxg6 {Recapture with the h-pawn. Your rook gets the open h-file.}
11. Qb3 {White hits b7.}
11... a5 {Protect the b4-bishop and take space. The a5-pawn guards your bishop on b4, so no trick works. [%cal Ga5b4]}
12. Rd1 {White takes the d-file.}
12... Qe7 {The queen protects the bishop and prepares ...O-O. [%cal Ge7b4]}
13. e4 {White takes the centre.}
)
(9. Bd2 {White unpins the knight.}
9... a5 {Protect the bishop on b4 with the a-pawn. Now you are not worried about trades. [%cal Ga5b4]}
10. Ne2 {White reroutes the knight.}
10... Bd6 {Retreat the bishop to a good diagonal. It eyes White's king-side. [%cal Gd6h2]}
11. Ng3 {White attacks your bishop on f5.}
11... Bg6 {Keep the bishop. It is safe on g6 and still helps your king-side. [%cal Gg6b1]}
12. Qe2 {White develops.}
12... O-O {Castle! Your king is safe, and your position is solid.}
13. Bc3 {White develops the dark bishop.}
)
9... Bg6 {Retreat the bishop to g6 before White plays e4. This way it can never be trapped, and it still eyes the long diagonal. [%cal Gg6b1]}
10. e4 {White takes the centre. White now has a lot of space, but you will attack the centre.}
10... O-O {Castle! Your king is safe, and your pieces are all developed.}
11. Bd3 {The bishop goes back to d3, where it supports the e4-pawn and gets ready for e5.}
11... Bh5 {Keep the bishop! Now it pins the knight on f3 to the queen on e2, so White cannot easily play e5 without losing time. [%cal Gh5f3,Gf3e2]}
12. e5 {White pushes with a threat: the pawn attacks your knight on f6.}
12... Nd5 {Jump to the central square d5! You offer to trade pieces, which helps you because White has more space. [%cal Gd5c3]}
13. Nxd5 {White trades.}
13... cxd5 {Recapture with the c-pawn. The pawn on d5 is a strong centre pawn. The c-file is open for your rook.}
14. Qe3 {White steps out of the pin. The game is balanced. You can follow with ...Be7 and ...Rc8 and have a calm game.}
`

const krause = `
1. d4 {White opens with the queen's pawn.}
1... d5 {You take your share of the centre. [%cal Gd5e4]}
2. c4 {The Queen's Gambit.}
2... c6 {The Slav. Your c6-pawn protects d5 and keeps the bishop's road open. [%cal Gc6d5,Gc8f5]}
3. Nf3 {White develops.}
3... Nf6 {You develop with a purpose: the knight guards d5. [%cal Gf6d5]}
4. Nc3 {White adds another attacker on d5.}
4... dxc4 {You take the c4-pawn and free your game. White will win it back, but you gain time to develop. [%cal Gd5c4]}
5. a4 {White stops ...b5, so the c4-pawn cannot be kept.}
5... Bf5 {Bring the bishop out before closing the pawn chain. On f5 it controls e4. [%cal Gf5e4,Gf5b1]}
6. Ne5 {The Krause Attack. The knight jumps into the centre. It attacks your c4-pawn and gets ready for f3 and e4, to build a big centre.}
6... Nbd7 {Challenge the knight at once and develop your last knight. White usually takes back the c4-pawn with the knight. [%cal Gd7e5]}
7. Nxc4 {White takes back the pawn.}
(7. Nxd7?! {White trades off the knight, which helps you.}
7... Qxd7 {Recapture with the queen! Now the pawn on c4 is still yours, and you will play ...e5 next with a strong centre. Do not play ...Nxd7, because then e4 gives White a big centre. [%cal Gd7d4]}
8. e3 {White prepares to take back the pawn on c4.}
8... e5 {Hit the centre at once! You have a free development and the pawn on c4 is still extra. [%cal Ge5d4]}
9. Bxc4 {White takes back the pawn.}
9... O-O-O {Castle on the queenside. Your king is safe, and your rook comes to d8, behind your queen, to put pressure on d4. [%cal Gd8d4]}
10. O-O {White castles.}
10... exd4 {Trade pawns. The d-file opens for your rook.}
11. Qxd4 {White recaptures with the queen and offers a queen trade. Your pieces are active and the position is pleasant for you.}
)
7... Nb6 {Kick the knight at once! Your knight attacks both the knight on c4 and the pawn on a4. White must decide what to do. [%cal Gb6c4,Gb6a4]}
8. Ne5 {The knight goes back to its post.}
(8. Ne3 {White attacks your bishop on f5.}
8... e6 {Defend the bishop with the pawn and close the pawn chain. Now if the knight takes f5, you recapture with the e-pawn. [%csl Gc6,Ge6]}
9. a5 {White chases your knight.}
9... Nbd5 {Jump to d5! The knight is happy there, and you are ready to trade pieces. [%cal Gb6d5]}
10. Ncxd5 {White trades knights.}
10... Nxd5 {Recapture with the other knight.}
11. Nxf5 {White swaps the knight for your bishop.}
11... exf5 {Recapture. Your f-pawns are doubled, but the f5-pawn controls e4 and your knight on d5 is excellent.}
12. Bd2 {White develops and keeps an eye on the b4-square. The game is balanced: you are ready for ...Be7, ...O-O and ...Re8.}
)
(8. Nxb6 {White trades off the knight.}
8... axb6 {Recapture with the a-pawn. Your rook now looks at the a4-pawn on the open a-file, and you can play ...e5.}
9. e3 {White prepares to develop.}
9... e5 {Strike in the centre. Your position is active and the open a-file helps you. [%cal Ge5d4]}
10. Bd3 {White hits your bishop.}
10... Bg4 {Attack the queen! The bishop is protected by your knight on f6, so White must spend a move to deal with it. [%cal Gg4d1]}
11. Be2 {White offers a swap.}
11... Bxe2 {Trade bishops.}
12. Qxe2 {White recaptures with the queen.}
)
8... a5 {A useful move: it stops a4-a5, which would kick your knight away. Now the knight on b6 is stable and attacks a4. [%cal Gb6a4]}
9. e3 {White develops and opens the bishop.}
9... g6 {Fianchetto the bishop! It will sit on g7 and add pressure on the long diagonal, and on d4. [%cal Gg7d4]}
10. Be2 {White develops.}
10... Bg7 {Develop the bishop to its long diagonal.}
11. O-O {White castles.}
11... O-O {Castle! Your king is safe.}
12. f4 {White grabs space in the centre.}
12... Nfd5 {Jump to the great square d5. Your other knight also covers d5, so you can trade some pieces. [%cal Gf6d5,Gb6d5]}
13. Nxd5 {White trades.}
`

const slavAccepted = `
1. d4 {White opens with the queen's pawn.}
1... d5 {You take your share of the centre. [%cal Gd5e4]}
2. c4 {The Queen's Gambit.}
2... c6 {The Slav. Your c6-pawn protects d5 and keeps the bishop's road open. [%cal Gc6d5,Gc8f5]}
3. Nf3 {White develops.}
3... Nf6 {You develop with a purpose: the knight guards d5. [%cal Gf6d5]}
4. Nc3 {White adds a second attacker on d5.}
4... dxc4 {You take the pawn on c4. Here White does not play 5.a4, so you have a new idea: try to KEEP the pawn with ...b5. [%cal Gd5c4]}
5. e3 {White plans to win the pawn back with Bxc4.}
(5. e4 {White grabs the centre at once and offers a pawn.}
5... b5 {Hold on to the pawn. The b5-pawn supports c4. White now has a big centre, but you have an extra pawn and a solid position. [%cal Gb5c4]}
6. e5 {White pushes the pawn and attacks your knight.}
6... Nd5 {The knight jumps to a strong square. It is protected by the c6-pawn and it attacks the knight on c3. [%cal Gd5c3]}
7. a4 {White attacks your pawn chain.}
7... e6 {Close the pawn chain and open the diagonal for your bishop. The knight on d5 is also protected once more. [%csl Gc6,Gd5,Ge6]}
8. Be2 {White develops.}
8... a5 {Support the b4-square and keep the queenside pawns together. Your extra pawn is hard to attack now. [%cal Ga5b4]}
9. O-O {White castles.}
9... Be7 {Develop the bishop and get ready to castle. [%cal Ge7h4]}
10. axb5 {White trades pawns to open the a-file.}
(10. Ng5? {A mistake! White hopes to attack h7 but this loses a piece.}
10... Nxc3 {Take the knight first! You remove the defender of the g5-knight.}
11. bxc3 {White recaptures.}
11... Bxg5 {Now the knight on g5 is yours.}
12. Bxg5 {White takes your bishop.}
12... Qxg5 {You take the bishop. You have won a whole piece. [%cal Gd8g5]}
13. Qb1 {White gets some threats against b5, but you are far ahead in material.}
)
10... Nxc3 {Trade knights first. If you take back on b5 at once, White's knight on c3 can grab the b5-pawn.}
11. bxc3 {White recaptures.}
11... cxb5 {Recapture with the c-pawn. You are a pawn up, with three connected pawns on a5, b5 and c4. [%csl Ga5,Gb5,Gc4]}
12. Rb1 {White attacks the b5-pawn.}
12... Ba6 {Protect the b5-pawn with the bishop. Your three queenside pawns stay together. [%cal Ga6b5]}
13. d5 {White opens the position to get play.}
13... Qxd5 {Take the pawn! Your queen is protected by the e6-pawn and lands in the centre.}
14. Nd4 {White attacks the b5-pawn and the e6-pawn, and prepares Bf3 against your queen.}
14... Qd7 {Step back to a safe square. From d7 the queen guards both b5 and e6. [%cal Gd7b5,Gd7e6]}
15. Bf3 {White develops. You are a pawn up and your king is safe: trade pieces and win.}
)
5... b5 {The key move: keep the pawn! Your pawn on b5 protects the c4-pawn. The c4-pawn also cramps White: it controls b3 and d3. [%cal Gb5c4]}
6. a4 {White attacks your b5-pawn.}
(6. Be2 {White develops first and plans to take on c4 next.}
6... Bb7 {Develop the bishop. Later, when your c-pawn moves, it will look down the long diagonal towards g2.}
7. O-O {White castles.}
7... e6 {Close the centre. Your pieces are well coordinated.}
8. a4 {White attacks b5 again.}
8... a6 {Support the b5-pawn with the a-pawn. Now your pawn chain stays solid and the c4-pawn stays protected. [%cal Ga6b5]}
9. Na2 {White heads for b4 with the knight.}
9... Nbd7 {Develop the last minor piece. It supports ...Nb6 and ...Nd5. [%cal Gd7b6]}
10. b3 {White attacks your c4-pawn.}
10... cxb3 {Take the pawn first. Do not let White capture on c4 for free.}
11. Qxb3 {White recaptures.}
11... Rb8 {Bring the rook to the b-file. When your bishop moves, the rook will help to guard the b5-pawn.}
12. Bd2 {White develops.}
12... Be7 {Develop the bishop and prepare to castle. [%cal Ge7h4]}
13. Rfc1 {White takes the c-file. You have a solid, healthy position.}
)
(6. b3 {White sacrifices a pawn for lines. Take it!}
6... cxb3 {Take the pawn with your c-pawn. You are now two pawns up for the moment. White gets some open lines, so be careful. [%cal Gc4b3]}
7. axb3 {White recaptures.}
7... e6 {Close the centre and open your bishop. Now you will develop calmly with ...Bb7 and ...Be7.}
8. Bd3 {White develops.}
8... Bb7 {Develop the bishop. Later, when your c-pawn moves, it will look down the long diagonal.}
9. O-O {White castles.}
9... a6 {A useful move. It protects the b5-pawn. [%cal Ga6b5]}
10. Bb2 {White develops.}
)
6... b4 {Push the pawn! It attacks the knight on c3. [%cal Gb4c3]}
7. Na2 {The knight goes to a2, where it eyes the b4 pawn.}
(7. Bxc4? {A mistake! White forgets that the knight on c3 is attacked.}
7... bxc3 {Take the knight! You win a whole piece.}
8. bxc3 {White recaptures a pawn, but is a piece down.}
8... e6 {Close the centre and develop. You are a full piece ahead.}
9. O-O {White castles.}
9... Be7 {Develop the bishop and get ready to castle.}
10. Qe2 {White develops the queen. You are winning: just castle and trade pieces.}
)
(7. Nb1 {The knight retreats. It is passive, but it can come out again via d2.}
7... Bb7 {Develop the bishop. Later, ...c5 will open the long diagonal for it.}
8. Bxc4 {White takes the pawn back.}
8... e6 {Close the centre. Your pieces are well placed.}
9. Nbd2 {White develops.}
9... Nbd7 {Develop the last minor piece.}
10. Qe2 {White develops the queen.}
10... c5 {Strike in the centre. Now your bishop on b7 looks down the long diagonal, and White's d4-pawn is under attack. [%cal Gc5d4,Gb7g2]}
11. a5 {White takes space.}
)
7... e6 {Protect the b4-pawn with the bishop (the f8-b4 diagonal is now open), and free your bishop. [%cal Gf8b4]}
8. Bxc4 {White takes the pawn back. Material is equal again.}
8... Bb7 {Develop the bishop. Later, ...c5 will open the long diagonal for it.}
9. O-O {White castles.}
9... Nbd7 {Develop the last minor piece. [%cal Gd7b6]}
10. Qe2 {White develops the queen.}
10... Be7 {Develop the bishop and prepare to castle. [%cal Ge7h4]}
11. Rd1 {White takes the d-file.}
11... O-O {Castle! Your king is safe, and you are fully developed.}
12. b3 {White prepares to develop the bishop. The position is balanced.}
`

const moveFourSidelines = `
1. d4 {White opens with the queen's pawn.}
1... d5 {You take your share of the centre. [%cal Gd5e4]}
2. c4 {The Queen's Gambit.}
2... c6 {The Slav. Your c6-pawn protects d5 and keeps the bishop's road open. [%cal Gc6d5,Gc8f5]}
3. Nf3 {White develops.}
3... Nf6 {You develop with a purpose: the knight guards d5. [%cal Gf6d5]}
4. Qc2 {The queen protects the c4-pawn and watches the f5-square, so ...Bf5 right now would just lose the bishop. [%cal Gc2f5]}
(4. Qb3 {The queen attacks your b7-pawn and protects the c4-pawn.}
4... dxc4 {Take the pawn! The queen has to take back on c4, and your bishop can then come out to f5. [%cal Gd5c4]}
5. Qxc4 {White takes the pawn back with the queen.}
5... Bf5 {Bring the bishop out to its best diagonal, before ...e6. [%cal Gf5c2]}
6. g3 {The usual plan: put the bishop on g2 and castle.}
)
(4. Bg5 {The Bonet Gambit. White attacks your knight on f6, but the bishop does nothing to protect the c4-pawn.}
4... dxc4 {Take the pawn! The bishop on g5 cannot help White to win it back quickly. [%cal Gd5c4]}
5. e3 {White wants to take back on c4 with the bishop.}
5... b5 {Keep the pawn! The b5-pawn supports c4. White's bishop on g5 is only in the way. [%cal Gb5c4]}
6. a4 {White attacks your pawn chain.}
6... e6 {Close the pawn chain. Your pieces can develop calmly. [%csl Gc6,Ge6]}
7. Nc3 {White develops.}
7... Bb4 {Pin the knight on c3. You develop with a threat, and the pin makes it hard for White to attack b5. [%cal Rb4c3]}
8. Be2 {White develops.}
8... Nbd7 {Develop the last minor piece.}
9. O-O {White castles.}
9... Qb6 {Hit the d4-pawn and guard b5. Your queen is active, and you are a pawn up. [%cal Gb6d4,Gb6b5]}
10. Na2 {White tries to trade your bishop.}
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
8... Nbd7 {Develop the last piece. You are ready to castle and meet e4 with ...dxe4.}
9. e4 {White grabs the centre. You can trade pawns and pieces, and your game is solid.}
)
(4. Nbd2 {The Breyer move order. White keeps the c-pawn flexible.}
4... Bf5 {Bishop out before ...e6. [%cal Gf5b1]}
5. g3 {White prepares the bishop on g2.}
5... e6 {Close the pawn chain.}
6. Bg2 {White develops.}
6... h6 {Give the bishop a retreat on h7.}
7. O-O {White castles.}
7... Nbd7 {Develop the knight. All your pieces are now ready.}
8. b3 {White prepares to play Bb2.}
8... Bd6 {Develop the bishop. It eyes the g3 pawn and White's king-side. [%cal Gd6g3]}
9. Bb2 {White develops.}
9... Qc7 {The queen supports the e5 break and the bishop. [%cal Gc7e5]}
10. e3 {White protects the centre.}
10... O-O {Castle! Your king is safe, and your pieces are ready.}
11. Qe2 {White develops the queen. The position is equal.}
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
8... a5 {Gain space on the queenside. Now ...b4 is ready, which can chase a white knight away from c3. You are a healthy pawn up. [%cal Ga5b4]}
9. Nc3 {White develops.}
9... Nbd7 {Develop the last minor piece.}
10. Nd2 {White heads for the c4-pawn.}
10... Nd5 {Jump into the centre and offer to trade White's best piece. The knight is protected by the c6-pawn and the e6-pawn. [%cal Gd5f4,Gd5c3]}
11. Bg3 {The bishop steps back.}
11... O-O {Castle! Your king is safe and you keep your extra pawn.}
12. a4 {White tries to open the a-file. Stay calm: you are a pawn up and your position is solid.}
)
(4. cxd5 {White swaps the pawns, which transposes to the Exchange Slav.}
4... cxd5 {Recapture with the c-pawn.}
5. Nc3 {White develops.}
5... Nc6 {Develop the second knight and pressure d4. [%cal Gc6d4]}
6. Bf4 {White develops the bishop outside the chain.}
6... Bf5 {Bishop out before ...e6. See the Exchange Slav chapters for the full plan. [%cal Gf5b1]}
7. e3 {White prepares to develop. You continue with ...e6 and ...Bb4 or ...Be7.}
)
4... dxc4 {Take the pawn! The queen has to spend a move taking it back, and then the f5-square is safe for your bishop. [%cal Gd5c4]}
5. Qxc4 {White takes the pawn back with the queen.}
5... Bf5 {Now the queen has left the c2-f5 diagonal, so the bishop can come out to its best square, before ...e6. [%cal Gf5c2]}
6. g3 {The usual plan: put the bishop on g2 and castle.}
6... e6 {Close the pawn chain. The bishop is already outside.}
7. Bg2 {White develops.}
7... Be7 {Develop the bishop and get ready to castle.}
8. O-O {White castles.}
8... O-O {Castle! Your king is safe and your pieces are ready.}
9. Nc3 {White develops.}
9... Nbd7 {Develop the last minor piece.}
10. Re1 {White puts a rook on the e-file.}
10... Bg6 {Retreat the bishop before White plays e4. It stays safe on the diagonal. [%cal Gg6b1]}
11. a3 {A calm waiting move. The position is balanced and both sides have simple plans.}
`

const thirdMoveSidelines = `
1. d4 {White opens with the queen's pawn.}
1... d5 {You take your share of the centre. [%cal Gd5e4]}
2. c4 {The Queen's Gambit.}
2... c6 {The Slav. Your c6-pawn protects d5 and keeps the bishop's road open. [%cal Gc6d5,Gc8f5]}
3. e3 {A quiet move. White opens the road for the f1-bishop but blocks the c1-bishop behind the e3-pawn.}
(3. Nc3 {White develops and adds a second attacker on d5.}
3... Nf6 {You develop with a purpose: the knight guards d5. [%cal Gf6d5]}
4. e3 {A quiet move. White wants to build a Semi-Slav or Slow Slav set-up.}
(4. e4?! {A gambit! White offers a pawn to take the centre quickly, but it does not work well.}
4... dxe4 {Take it! The pawn is free, and you will return it only if it helps you. [%cal Gd5e4]}
5. f3 {White tries to win the pawn back by force.}
5... exf3 {Take another pawn! You are two pawns up for the moment.}
6. Nxf3 {White recaptures and develops.}
6... Bf5 {Develop the bishop. If White puts a bishop on d3, you can trade it off. [%cal Gf5b1]}
7. Bd3 {White offers a trade.}
7... Bxd3 {Take it. Trading pieces helps the side with the extra pawns.}
8. Qxd3 {White recaptures with the queen.}
8... e6 {Close the pawn chain and open the way for your king's bishop. [%csl Gc6,Ge6]}
9. O-O {White castles.}
9... Be7 {Develop the bishop and get ready to castle. You are a pawn up.}
10. Bf4 {White develops the last bishop. Castle and trade pieces: the extra pawn will tell.}
)
(4. Bg5?! {White's bishop attacks your knight on f6, but it does not help White win back the c4-pawn after you take it.}
4... dxc4 {Take the pawn! White's bishop on g5 does not help to win it back. [%cal Gd5c4]}
5. Nf3 {White develops.}
5... b5 {Keep the pawn! The b5-pawn supports c4. [%cal Gb5c4]}
6. g3 {White prepares to play Bg2 and attack the queenside.}
6... h6 {Ask the bishop a question: take on f6 or step back. Either way you keep your extra pawn.}
7. Be3 {The bishop retreats.}
7... e6 {Close the pawn chain and open your bishop. Your pieces are developing smoothly.}
8. Ne5 {White's knight jumps into the centre.}
)
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
8... Nc6 {Develop the second knight with pressure on d4. [%cal Gc6d4]}
9. O-O {White castles.}
9... Be7 {Develop the bishop and prepare to castle.}
10. e4 {White takes the centre. You can trade and play ...dxe4.}
)
(3. e4?! {The Diemer Gambit. White offers a pawn to take the centre.}
3... dxe4 {Take it! The pawn is free and White needs to show real compensation. [%cal Gd5e4]}
4. Nc3 {White develops and prepares to win the pawn back.}
4... Nf6 {Develop and defend e4. [%cal Gf6e4]}
5. f3 {White offers a second pawn to open the f-file.}
5... exf3 {Take it too! You will return material at the right moment.}
6. Nxf3 {White recaptures and develops.}
6... Bf5 {Bring the bishop out with a plan to trade White's attacking bishop. [%cal Gf5b1]}
7. Bd3 {White offers a trade.}
7... Bxd3 {Take it! Trading the attacking bishop helps the side with extra material.}
8. Qxd3 {White recaptures with the queen.}
8... e6 {Close the pawn chain and open the diagonal for your king's bishop. [%csl Gc6,Ge6]}
9. Bg5 {White pins the knight.}
9... Be7 {Break the pin by developing. You are a pawn up and everything is protected.}
10. O-O-O {White castles queenside.}
)
3... Bf5 {Bring the bishop out right away, before ...e6 locks it in. [%cal Gf5b1]}
4. Nc3 {White develops and adds pressure to d5.}
(4. Bd3 {White offers a bishop swap right away.}
4... Bxd3 {Take it! The swap helps you, because White's c1-bishop is stuck behind the e3-pawn.}
5. Qxd3 {White recaptures with the queen.}
5... e6 {Close the pawn chain. Your pieces are free to develop.}
6. Nf3 {White develops.}
6... Nf6 {Develop and guard d5. [%cal Gf6d5]}
7. Nbd2 {White develops.}
7... Nbd7 {Develop the last minor piece.}
8. O-O {White castles.}
8... Be7 {Develop the bishop and prepare to castle.}
9. b3 {White prepares to put the bishop on b2. The position is equal and you will castle next.}
)
(4. cxd5 {White swaps pawns and plans Qb3.}
4... cxd5 {Recapture with the c-pawn. Your bishop is outside the chain, and d5 is solid.}
5. Qb3 {The queen hits b7 and d5 together.}
5... Qc7 {Protect b7 with the queen. The d5-pawn is still safe. [%cal Gc7b7]}
6. Bb5+ {White checks to disturb your pieces.}
6... Nd7 {Block with the knight. The knight can later go to f6.}
7. Nc3 {White develops.}
7... e6 {Close the pawn chain. All your pieces are well placed.}
8. Nf3 {White develops.}
8... Nf6 {Develop and guard d5. [%cal Gf6d5]}
9. Bd2 {White prepares to castle.}
)
4... e6 {Close the pawn chain, with your bishop already outside. [%csl Gc6,Gd5,Ge6]}
5. Nf3 {White develops.}
5... Be7 {Develop the bishop and prepare to castle.}
6. Bd3 {White offers to swap bishops.}
6... Bxd3 {Take it. Trading the bishop is easy and your game stays solid.}
7. Qxd3 {White recaptures with the queen.}
7... Nf6 {Develop and guard d5. [%cal Gf6d5]}
8. O-O {White castles.}
8... O-O {Castle! Your king is safe and your pieces are ready.}
9. b3 {White prepares to put the bishop on b2.}
9... Nbd7 {Develop the last minor piece. The position is equal and easy to play.}
10. Bb2 {White develops. You can follow with ...Rc8 and ...Qa5, or with ...dxc4 and ...c5, to free your game.}
`

const semiSlavBridge = `
1. d4 {White opens with the queen's pawn.}
1... d5 {You take your share of the centre. [%cal Gd5e4]}
2. c4 {The Queen's Gambit.}
2... c6 {The Slav. Your c6-pawn protects d5. [%cal Gc6d5]}
3. Nf3 {White develops.}
3... Nf6 {You develop with a purpose: the knight guards d5. [%cal Gf6d5]}
4. Nc3 {White adds a second attacker on d5.}
4... e6 {This is the Semi-Slav. You close the pawn chain with ...e6 before your c8-bishop is out. That bishop then needs a plan: ...dxc4, ...b5 and ...Bb7. Only play this if you know that plan! [%csl Gc6,Gd5,Ge6]}
5. e3 {White blocks his own c1-bishop for the moment, but plans Bd3 and castling.}
(5. Bg5 {White pins the knight on f6.}
5... Nbd7 {Develop the other knight. It protects the pinned knight and prepares ...Qa5.}
(5... h6 {Ask the bishop a question at once. It must decide now, and you stay flexible.}
6. Bh4 {The bishop keeps the pin.}
6... Be7 {Break the pin by developing. If White takes on f6, you recapture with the bishop. [%cal Ge7f6]}
7. e3 {White protects d4.}
7... O-O {Castle! Your king is safe, and the pin on f6 is harmless.}
8. Qc2 {White develops the queen.}
8... Nbd7 {Develop the last minor piece. You are solid and ready for ...a6, ...b6 or ...c5.}
9. h3 {A quiet, useful move. The position is balanced.}
)
6. e3 {White protects d4.}
6... Qa5 {The Cambridge Springs idea. The queen pins the knight on c3 to the white king. If your d5-pawn moves away, the queen also hits the bishop on g5. White has to be careful! [%cal Ga5c3]}
7. Nd2 {White protects the knight on c3 and unpins.}
7... dxc4 {Take the pawn. Now the fifth rank is open, so your queen attacks the bishop on g5. [%cal Ga5g5]}
8. Bxf6 {White trades the bishop for the knight.}
8... Nxf6 {Recapture with the knight.}
9. Nxc4 {White takes the pawn back and hits your queen.}
9... Qc7 {The queen steps to a safe square. From c7 it looks along the diagonal at h2. [%cal Gc7h2]}
10. g3 {White prepares to put the bishop on g2.}
)
5... Nbd7 {Develop the knight. It supports the ...b5 plan and ...c5 later. [%cal Gd7b6]}
6. Bd3 {White develops and takes aim at h7.}
(6. Qc2 {White develops the queen and prepares e4.}
6... Bd6 {Develop the bishop and aim at h2. It also protects the e5 square. [%cal Gd6h2]}
7. Bd3 {White develops.}
7... O-O {Castle! Your king is safe.}
8. O-O {White castles.}
8... e5 {Strike in the centre! The e5 break is the right way to solve your problems in this set-up. [%cal Ge6e5]}
9. cxd5 {White opens the position.}
)
6... dxc4 {Take the pawn! White's bishop has to spend a move to recapture.}
7. Bxc4 {White regains the pawn.}
7... b5 {Kick the bishop away and win space. This is the Meran idea: you take space on the queenside and prepare ...Bb7. [%cal Gb5c4]}
8. Bd3 {White retreats the bishop, which is now aimed at b5 and h7.}
8... Bb7 {Develop the last bishop. When you play ...c5 later, it will look down the long diagonal at White's kingside.}
9. O-O {White castles.}
9... a6 {Protect the b5-pawn so that your pawns stay together. [%cal Ga6b5]}
10. e4 {White takes the centre.}
10... c5 {Strike back at once! This is the idea of the whole variation: undermine the white centre. [%cal Gc5d4]}
11. d5 {White pushes the pawn and tries to cramp you.}
11... c4 {Attack the bishop and gain space.}
12. Bc2 {The bishop retreats.}
12... Qc7 {Protect the c-pawn and get ready for ...exd5 or ...Nc5.}
13. dxe6 {White captures.}
13... fxe6 {Recapture. Your centre is healthy and your queenside majority is strong.}
14. Qe2 {White develops.}
`

const otherSecondMoves = `
1. d4 {White opens with the queen's pawn.}
1... d5 {You take your share of the centre. [%cal Gd5e4]}
2. e4?! {A gambit! White offers a pawn to open the position fast. This is related to the Blackmar-Diemer Gambit, and it is not sound against good play.}
(2. Bg5 {The Levitsky Attack. White develops the bishop outside the pawn chain, hoping to pin your knight later.}
2... c6 {The Slav move. It protects d5 and keeps the road open for your light-squared bishop. [%cal Gc6d5,Gc8f5]}
3. Nf3 {White develops.}
3... Bf5 {Bishop out before ...e6. [%cal Gf5b1]}
4. e3 {White opens the road for the f1-bishop.}
4... Nd7 {Develop the knight to d7. It keeps f6 free for the other knight and protects the e5 square.}
5. Bd3 {White offers to swap your bishop.}
5... Bxd3 {Take it. Trading bishops is simple and leaves you with a solid position.}
6. Qxd3 {White recaptures with the queen. Do not worry about the e7-pawn: the bishop on g5 would only win a pawn at the cost of a bishop.}
6... h6 {Ask the bishop a question. If it takes e7, you take back and are a piece up.}
7. Bf4 {The bishop retreats.}
7... e6 {Close the pawn chain and open your king's bishop.}
8. c4 {White attacks d5.}
8... Ngf6 {Develop the second knight and protect d5. [%cal Gf6d5]}
9. O-O {White castles. The position is equal, and you will castle next.}
)
(2. Nc3 {White develops the knight first. It stands in front of the c-pawn, so White cannot play c4 for now.}
2... c6 {Your usual Slav move.}
3. Nf3 {White develops.}
(3. e4 {White pushes e4. This is now a Caro-Kann Defence, your other opening!}
3... dxe4 {Take the pawn. White will take back on e4, just like in the Caro-Kann main line.}
4. Nxe4 {White recaptures. Material is equal.}
4... Nf6 {Develop and challenge the knight. [%cal Gf6e4]}
5. Nxf6+ {White trades knights.}
5... exf6 {Recapture with the e-pawn. This opens the way for your f8-bishop, and the f6-pawn controls e5.}
6. Nf3 {White develops.}
6... Bd6 {Develop the bishop to a fine diagonal. [%cal Gd6h2]}
7. Bd3 {White develops.}
7... O-O {Castle! Your king is safe, and your pieces are ready.}
8. O-O {White castles. The position is balanced.}
)
3... Bf5 {Bishop out before ...e6. [%cal Gf5b1]}
4. Bf4 {White develops the bishop outside the chain.}
4... e6 {Close the pawn chain.}
5. e3 {White protects the bishop.}
5... Nd7 {Develop the knight to d7. It is a flexible square.}
6. Bd3 {White offers to swap bishops.}
6... Ngf6 {Develop the second knight. You are happy to trade bishops.}
7. h3 {White gives the bishop on f4 a retreat on h2.}
)
2... dxe4 {Take the pawn! It is free. The game is about whether White has real compensation, and mostly he does not. [%cal Gd5e4]}
3. Nc3 {White develops and prepares to win the pawn back with f3.}
3... Nf6 {Develop and defend the e4-pawn. [%cal Gf6e4]}
4. f3 {The Blackmar-Diemer Gambit! White offers a second pawn to open the f-file.}
(4. Bg5 {White attacks your knight on f6, the piece that defends e4.}
4... Bf5 {Bring the bishop out and defend the e4-pawn a second time. [%cal Gf5e4]}
5. Nge2 {White develops and prepares Ng3.}
5... Nbd7 {Develop the other knight. It protects your knight on f6.}
6. Ng3 {White hits the bishop on f5.}
6... Bg6 {Retreat the bishop. It stays on the b1-h7 diagonal and protects e4.}
7. Qe2 {White develops the queen and attacks e4.}
7... e6 {This opens the way for your f8-bishop, so you can develop it and castle. [%csl Ge6]}
8. O-O-O {White castles queenside and stays flexible.}
)
(4. Nge2 {White develops the knight, planning Ng3.}
4... Bf5 {Bring the bishop out and defend e4. [%cal Gf5e4]}
5. Ng3 {White hits the bishop.}
5... Bg6 {Retreat the bishop, protecting e4.}
6. Bg5 {White attacks your knight on f6, a defender of e4.}
6... Nbd7 {Develop the other knight. It protects your knight on f6.}
7. Qe2 {White attacks e4.}
7... h6 {Ask the bishop what it wants to do. If it takes f6, you recapture with a knight and are comfortable.}
8. Bxf6 {White trades.}
8... Nxf6 {Recapture with the knight.}
9. O-O-O {White castles queenside. You are a pawn up with a solid position.}
)
4... exf3 {Take the second pawn! You can give back material later.}
5. Nxf3 {White recaptures and develops.}
5... Bf5 {Bring the bishop out with a plan to trade White's attacking bishop. [%cal Gf5b1]}
6. Bd3 {White offers to trade.}
6... Bxd3 {Take it! Trading the attacking bishop helps you.}
7. Qxd3 {White recaptures with the queen.}
7... e6 {Close the pawn chain and open the diagonal for your king's bishop. [%csl Ge6]}
8. Bg5 {White pins the knight.}
8... c6 {Your Slav pawn! It controls the b5 and d5 squares, so White's knight cannot jump there. [%cal Gc6d5,Gc6b5]}
9. O-O-O {White castles queenside.}
9... Nbd7 {Develop the last knight.}
10. Kb1 {White tucks the king away.}
10... Be7 {Develop the bishop and get ready to castle. You are a pawn up and everything is protected.}
11. Rhg1 {White moves the rook to the g-file. The position is sharp, but your extra pawn and solid structure count for a lot.}
`

// Exact names from the Lichess openings database (lichess-org/chess-openings), used to recognise the Slav in games.
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
  signatureMoves: ['d4', 'd5', 'c4', 'c6'],
  ecoNames: slavEcoNames,
  overview: [
    "The Slav Defence starts with 1.d4 d5 2.c4 c6. White offers a pawn with c4, and you simply protect your d5-pawn with the c-pawn. It looks quiet, but it is one of the most solid answers to 1.d4. Players at every level use it, from beginners to the best players in the world.",
    "It is a great choice for you because the same few ideas come back in almost every line. You do not need to memorise a long list of moves. If you understand the plan and the typical mistakes, you can find good moves even when the opponent leaves the book.",
    "The plan in three sentences: Play ...d5 and ...c6. Bring your light-squared bishop out to f5 or g4 BEFORE you close the pawn chain with ...e6. Then develop your knights, castle, and open the centre with ...c5 or ...e5 when your pieces are ready.",
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
      text: 'Once your bishop has left c8, nothing protects the b7-pawn. If White\'s queen jumps to b3, she attacks b7 and d5 together. Answer with ...Qb6 (which offers a queen trade) or ...Qc7, and stay calm.',
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
      text: 'In the main line, after ...e6 and White\'s Bxc4, you play ...Bb4. It develops your bishop with a threat: the knight on c3 is pinned to the white king, so it cannot move and it is less useful for supporting the centre. It also gets you ready to castle.',
      fen: 'rn1qk2r/pp3ppp/2p1pn2/5b2/PbBP4/2N1PN2/1P3PPP/R1BQK2R w KQkq - 1 8',
      arrows: [
        { from: 'b4', to: 'c3', color: 'red' },
        { from: 'b4', to: 'e1', color: 'green' },
      ],
      orientation: 'black',
    },
    {
      title: 'When a knight attacks your bishop',
      text: 'White often jumps a knight to h4 to hit your bishop on f5. Retreat the bishop (to g6 or e6, the chapters tell you which). If White takes on g6, recapture with the h-pawn: your rook gets the open h-file. Never retake with the f-pawn.',
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
      text: 'If you play ...e6 before your light-squared bishop is out, that bishop is locked inside your own pawns. It becomes the "bad bishop" for the rest of the game. Bring it out first with ...Bf5 or ...Bg4. (The Semi-Slav chapter is the exception: it has its own plan.)',
      fen: 'rnbqkb1r/pp3ppp/2p1pn2/3p4/2PP4/4PN2/PP3PPP/RNBQKB1R w KQkq - 0 5',
      highlights: [{ square: 'c8', color: 'red' }],
      orientation: 'black',
    },
    {
      title: 'Forgetting about b7',
      text: 'After the bishop leaves c8, the b7-pawn has no defender. If White\'s queen goes to b3, she attacks b7 and d5 at the same time. Always look at the b3-square before you move. The easy answers are ...Qb6 (offer a trade) or ...Qc7.',
      fen: 'rn1qkb1r/pp2pppp/2p2n2/3p1b2/2PP4/1Q2PN2/PP3PPP/RNB1KB1R b KQkq - 2 5',
      arrows: [
        { from: 'b3', to: 'b7', color: 'red' },
        { from: 'b3', to: 'd5', color: 'red' },
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
      title: 'Running to g4 when a knight attacks your bishop',
      text: 'When White plays Nh4 against your bishop on f5, ...Bg4? looks active, but White answers Qb3 and your b7-pawn is in trouble. In this position go back to e6. Know your retreat squares before the knight jumps.',
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
      text: 'After 4.Nc3 dxc4 5.a4, you can no longer keep the pawn. ...b5? is answered by axb5 cxb5 Nxb5, and White wins a pawn with an easy game. Play 5...Bf5 and develop instead. The ...b5 idea only works when White allows it, for example after 5.e3.',
      fen: 'rnbqkb1r/p3pppp/2p2n2/1p6/P1pP4/2N2N2/1P2PPPP/R1BQKB1R w KQkq - 0 6',
      arrows: [{ from: 'a4', to: 'b5', color: 'red' }],
      orientation: 'black',
    },
    {
      title: 'Recapturing with the wrong pawn',
      text: 'When White takes your bishop on g6, retake with the h-pawn. Retaking with the f-pawn weakens your king and the e6-square, and White gets a big edge. ...hxg6 is solid, and it puts your rook on the open h-file.',
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
      id: 'vs-london',
      title: 'Against the London System',
      summary:
        'White plays 2.Nf3 and 3.Bf4 (or 2.Bf4) instead of c4. You keep your Slav set-up: ...c6, ...Bf5 first, then ...e6.',
      difficulty: 1,
      pgn: vsLondon,
    },
    {
      id: 'main-slav',
      title: 'The main Slav: 4.Nc3 dxc4 5.a4 Bf5',
      summary:
        'White develops with Nf3 and Nc3. You take on c4, bring the bishop out to f5 and then play ...e6 and ...Bb4. This is the heart of the Slav.',
      difficulty: 2,
      pgn: mainSlav,
    },
    {
      id: 'vs-colle-catalan',
      title: 'Against the Colle and Catalan-style set-ups',
      summary:
        'White plays 2.Nf3 and then 3.e3 (or 3.g3) instead of c4. Your plan stays the same: ...c6, ...Bf5 first, then ...e6.',
      difficulty: 2,
      pgn: vsColle,
    },
    {
      id: 'move-four-sidelines',
      title: 'Other fourth moves: Qc2, Qb3, Bg5, g3, Nbd2, Bf4',
      summary:
        'After 3.Nf3 Nf6 White may skip 4.Nc3 or 4.e3. Here are the answers to the queen moves, the bishop moves and the fianchetto.',
      difficulty: 2,
      pgn: moveFourSidelines,
    },
    {
      id: 'third-move-sidelines',
      title: 'Quiet and sharp third moves: 3.e3, 3.Nc3 and the pawn offers on e4',
      summary:
        'White skips 3.Nf3 and plays 3.e3 or 3.Nc3 (sometimes with a pawn offer on e4). Get your bishop out and watch out for the queen trick Qb3.',
      difficulty: 2,
      pgn: thirdMoveSidelines,
    },
    {
      id: 'exchange-tricks',
      title: 'Exchange Slav: tricks with Bg5 and Qb3',
      summary:
        'After 3.cxd5 cxd5 White may try 5.Bg5, a queen sortie to b3, or another move order. Here are the safe answers and one or two traps to avoid.',
      difficulty: 2,
      pgn: exchangeTricks,
    },
    {
      id: 'krause-ne5',
      title: 'The sharp 6.Ne5: kick the knight with ...Nbd7',
      summary:
        'In the main Slav White can jump 6.Ne5 instead of 6.e3. Meet it with ...Nbd7 and ...Nb6, a simple way to keep the pawn count equal.',
      difficulty: 2,
      pgn: krause,
    },
    {
      id: 'other-second-moves',
      title: 'Other second moves: 2.e4, 2.Bg5 and 2.Nc3',
      summary:
        'White does not play c4 at all. You still answer with ...c6 and ...Bf5, or take the pawn if White offers one with 2.e4.',
      difficulty: 2,
      pgn: otherSecondMoves,
    },
    {
      id: 'slav-accepted',
      title: 'Slav accepted: keep the pawn with ...b5',
      summary:
        'After 4...dxc4 White does not play 5.a4 but 5.e3 or 5.e4. You try to hold the extra pawn with ...b5 and hand it back only when it helps you.',
      difficulty: 3,
      pgn: slavAccepted,
    },
    {
      id: 'semi-slav-bridge',
      title: 'Semi-Slav bridge: when you meet ...e6 early (advanced)',
      summary:
        'An optional chapter. If you play ...e6 on move 4, you enter the Semi-Slav. Here are the main plans: the Meran, the Cambridge Springs and a solid set-up with ...Bd6.',
      difficulty: 3,
      pgn: semiSlavBridge,
    },
  ] satisfies OpeningChapter[],
}
