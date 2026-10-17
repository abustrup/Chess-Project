// The recipe for the narrowed courses (task O1, 2026-10-16). Read by narrow.ts.
// Chapter choices follow research/2026-10-16-diagnosis/openings/PROPOSAL.md section 5 and build-plan.md O1.

export type Op =
  | { op: 'drop'; path: string[] } // remove this move and everything after it
  | { op: 'cut'; path: string[] } // keep this move, remove everything after it
  | { op: 'graft'; path: string[]; pgn: string; first?: boolean; replace?: boolean; long?: boolean } // add new moves here (long: a listed trap line that may go past move 8)
  | { op: 'adopt'; path: string[]; from: string } // hang an old chapter's moves from the same position here
  | { op: 'comment'; path: string[]; text: string; draw?: string }
  | { op: 'nags'; path: string[]; nags: number[] }
  | { op: 'first'; path: string[] } // make this the first listed move at its position
  | { op: 'keep'; path: string[]; depth?: number } // keep this reply even if it is rare (depth = plies after it)

export interface MergeSpec {
  from: string
  course?: string
  /** only lines that start with one of these */
  only?: string[][]
  /** leave out lines that start with one of these */
  exclude?: string[][]
}

export interface ChapterSpec {
  id: string
  title: string
  summary: string
  difficulty: 1 | 2 | 3
  /** old chapter whose tree is the starting point (the chapter id is kept) */
  base?: string
  baseOnly?: string[][]
  baseExclude?: string[][]
  before?: Op[]
  merge?: MergeSpec[]
  /** edits before pruning (new moves are always kept) */
  ops?: Op[]
  /** edits after pruning (comments on the new line ends) */
  after?: Op[]
}

export interface CourseSpec {
  course: 'london' | 'caro-kann' | 'slav'
  side: 'white' | 'black'
  /** last ply a line may reach: London 16 (Black's 8th move), Black courses 15 (White's 8th move) */
  maxPly: number
  /** every reply the courses already list up to this ply stays (the opponent's 3rd move) */
  keepAllPly: number
  signatureMoves?: string[]
  /** text changes in the course's overview, big ideas and common mistakes: [old, new] */
  meta?: [string, string][]
  chapters: ChapterSpec[]
}

export const PARAMS = {
  /** a deeper reply stays if 1000-1300 opponents reach it in at least this share of the owner's games */
  minReach: 0.002,
  /** a reply kept only because it is one of the opponent's first moves is cut this many plies after it */
  stubPlies: 4,
}

const L = (s: string) => s.split(' ')

export const SPEC: CourseSpec[] = [
  {
    course: 'london',
    side: 'white',
    maxPly: 16,
    keepAllPly: 6,
    chapters: [
      {
        id: 'classic-pyramid',
        title: 'The classic set-up: the London pyramid',
        summary:
          'Black plays ...d5 with ...Nf6 and ...e6, or starts with 1...Nf6. You build the pyramid c3, d4, e3, keep your bishop with Bg3 and get ready for the knight jump to e5. Rarer tries on move 3 (...c6, ...Ne4, ...Bg4) are covered too.',
        difficulty: 1,
        base: 'classic-pyramid',
        merge: [
          { from: 'knight-first-move-orders', exclude: [L('d4 Nf6 Bf4 c5'), L('d4 Nf6 Bf4 g6')] },
          { from: 'slav-style-c6' },
          { from: 'bishop-harassment' },
          { from: 'pins-and-pokes', exclude: [L('d4 d5 Bf4 Nc6')] },
          { from: 'middlegame-plans' },
        ],
        ops: [
          // one taught move per position: this move order reaches the 4...c5 line of the main line
          { op: 'cut', path: L('d4 Nf6 Bf4 e6 e3 c5 Nf3 d5') },
          {
            op: 'comment',
            path: L('d4 Nf6 Bf4 e6 e3 c5 Nf3 d5'),
            text: 'Black has reached the same position as 1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3 c5 by another move order. Answer with c3, as in that line of this chapter.',
          },
        ],
        after: [
          {
            op: 'comment',
            path: L('d4 Nf6 Bf4 d5 e3'),
            text: 'Your normal move. This is the classic London from the main line of this chapter.',
          },
          {
            op: 'comment',
            path: L('d4 Nf6 Bf4 e6 e3 d5 Nf3'),
            text: 'You are back in the classic London pyramid from the main line of this chapter.',
          },
          {
            op: 'comment',
            path: L('d4 d5 Bf4 Nf6 e3 c6 Nf3 e6 Bd3 Bd6 Bg3 O-O Nbd2 b6 e4 dxe4'),
            text: 'Black takes. Take back with the knight: Nxe4.',
          },
          {
            op: 'comment',
            path: L('d4 d5 Bf4 Nf6 e3 Bg4 Nf3 e6 Nbd2 Bd6 h3 Bh5 Be2 O-O Ne5 Bxe2'),
            text: 'Black takes your bishop. Take back with the queen: Qxe2. Your pieces are active.',
          },
          {
            op: 'comment',
            path: L('d4 d5 Bf4 Nf6 e3 e6 Nf3 Bd6 Bg3 O-O Nbd2 c5 c3 Nc6 Bd3 b6'),
            text: 'Black prepares to put a bishop on b7. This is the most natural plan. Your set-up is complete, and your next idea is the knight jump to e5 (see the big ideas of the course).',
          },
        ],
      },
      {
        id: 'vs-nc6-e5',
        title: 'Against ...Nc6 and the ...e5 counter-strike',
        summary:
          'Black plays an early ...Nc6, often followed by ...e5 to attack your bishop and your centre. Stay calm: count the attackers and defenders, and you will often simply win a pawn.',
        difficulty: 1,
        base: 'vs-nc6-e5',
        merge: [{ from: 'pins-and-pokes', only: [L('d4 d5 Bf4 Nc6')] }],
        ops: [
          { op: 'drop', path: L('d4 d5 Bf4 Nc6 e3 Nf6 Nf3 Bf5 Bb5 e6 O-O') },
          {
            op: 'graft',
            path: L('d4 d5 Bf4 Nc6 e3 Nf6 Nf3 Bf5 Bb5 e6'),
            pgn: `6. Ne5 {The knight jumps to e5 and attacks the knight on c6 a second time. That knight is pinned to the king by your bishop, so it cannot move away. [%cal Gf3e5,Re5c6]}
6... Bd6?! {Natural, but it does nothing against the threat on c6.}
(6... a6 {Black asks your bishop what it wants.}
7. Ba4 {Keep the pin. The knight on c6 is still attacked twice and defended only once. [%cal Gb5a4,Ga4c6]}
7... Bd6 {Black hits your knight on e5. Now take on c6: Nxc6, and if ...bxc6, Bxc6+ hits the rook on a8.}
)
7. Nxc6 {Take the knight. [%cal Ge5c6]}
7... bxc6
8. Bxc6+ {Check, and your bishop also attacks the rook on a8. Next you take it. [%cal Rc6e8,Rc6a8]}
8... Ke7`,
          },
          {
            op: 'graft',
            path: L('d4 d5 Bf4 Nc6 e3'),
            pgn: `3... e6 {Black closes the c8-bishop in and gets ready for ...Bd6.}
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
4. Nf3 {Develop and guard e5, the same move as against 3...Nf6. [%cal Gg1f3,Gf3e5]}
4... Bd6 {Black offers to trade your London bishop.}
5. Bg3 {Keep your bishop. If Black takes on g3, you take back with the h-pawn. [%cal Gf4g3]}
5... Nf6`,
          },
          // the 3...Bg4?? trap keeps its last move (the queen escapes)
          { op: 'keep', path: L('d4 d5 Bf4 Nc6 e3 Bg4'), depth: 6 },
        ],
        after: [
          // added by the O1 verifier (2026-10-16): this line ended with your bishop attacked and no word on it
          {
            op: 'comment',
            path: L('d4 d5 Bf4 Nc6 e3 Bg4 Qxg4 e5 Bxe5 h5 Qf3 f6'),
            text: 'Black attacks your bishop. Step back to f4 or g3: you stay a whole piece up.',
          },
          // added by the O1 verifier (2026-10-16, second pass): the line ended on ...Ke7 with no comment
          {
            op: 'comment',
            path: L('d4 d5 Bf4 Nc6 e3 Nf6 Nf3 Bf5 Bb5 e6 Ne5 Bd6 Nxc6 bxc6 Bxc6+ Ke7'),
            text: 'The king steps out of check. Now take the rook: Bxa8. You win a rook for your bishop and stay a pawn up.',
          },
        ],
      },
      {
        id: 'mirror-bf5',
        title: 'Black copies you with ...Bf5',
        summary:
          'Black develops their own bishop to f5, the mirror image of your London bishop. You challenge it with Bd3 and keep the position healthy.',
        difficulty: 1,
        base: 'mirror-bf5',
        after: [
          {
            op: 'comment',
            path: L('d4 d5 Bf4 Nf6 e3 Bf5 Nf3 e6 Bd3 Bxd3 Qxd3 Bd6 Bxd6 Qxd6 c4 dxc4'),
            text: 'Black takes the pawn. Take it back with your queen: Qxc4. Your queen is active and the game is level.',
          },
        ],
      },
      {
        id: 'keep-calm-weird-moves',
        title: 'Black plays something weird: keep calm and develop',
        summary:
          'Black starts with an unusual move like 1...d6, 1...Nc6, 1...b6 or 1...h6. You do not need special theory: play your normal London, develop a piece every move, and punish only real mistakes.',
        difficulty: 1,
        base: 'keep-calm-weird-moves',
        ops: [
          {
            op: 'graft',
            path: L('d4'),
            pgn: `1... Nc6 {Black brings the knight out in front of the c-pawn.}
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
)`,
          },
        ],
        after: [
          // added by the O1 verifier (2026-10-16): this line ended with your bishop attacked and no word on it
          {
            op: 'comment',
            path: L('d4 d6 Bf4 e5 dxe5 Nc6 Nf3 dxe5 Qxd8+ Kxd8 Nxe5 Nxe5 Bxe5 f6'),
            text: 'Black attacks your bishop. Step back to g3 or f4: you stay a clean pawn up.',
          },
        ],
      },
      {
        id: 'vs-kings-indian',
        title: "Against the King's Indian set-up: ...g6, ...Bg7, ...d6",
        summary:
          "Black does not play ...d5 at once. Instead the bishop goes to g7, the king castles and Black prepares ...e5 or ...Nh5. You keep the same calm London set-up, with one extra key move: h3.",
        difficulty: 2,
        base: 'vs-kings-indian',
        merge: [{ from: 'vs-grunfeld-g6-d5' }],
        ops: [
          { op: 'drop', path: L('d4 Nf6 Bf4 g6 Nf3 Bg7 e3 O-O h3 d6 Be2 Nbd7 O-O e5 Bh2') },
          {
            op: 'graft',
            path: L('d4 Nf6 Bf4 g6 Nf3 Bg7 e3 O-O h3 d6 Be2 Nbd7 O-O e5'),
            first: true,
            long: true,
            pgn: `8. dxe5 {Take the pawn. Your knight and your bishop both aim at e5, the square where the fight is. [%cal Gd4e5,Gf3e5,Gf4e5]}
8... dxe5 {Black takes back. Now the pawn on e5 is attacked by your knight and your bishop and guarded only by the knight on d7.}
9. Nxe5 {Take it. You are a clean pawn up. If Black takes back with 9...Nxe5, swap queens first with Qxd8 and only then take on e5 with the bishop. [%cal Gf3e5]}`,
          },
          {
            op: 'graft',
            path: L('d4'),
            pgn: `1... g6 {Black starts with the pawn move. The bishop will come to g7.}
2. Bf4 {Your London bishop, as always. [%cal Gc1f4]}
2... Bg7
3. Nf3 {Develop and guard d4. [%cal Gg1f3]}
3... Nf6 {Now the position is the same as in the main line of this chapter. After 4.e3 O-O play h3.}
(3... d6 {Black keeps the knight at home for one more move.}
4. e3 {Build your pyramid. [%cal Ge2e3]}
4... Nf6 {The same position as after 4...d6 in this chapter. Play h3 next.}
)`,
          },
        ],
      },
      {
        id: 'early-c5',
        title: 'Black hits back early with ...c5',
        summary:
          'Black plays ...c5 at once, either after 1...d5 or after 1...Nf6 (sometimes even on move one), often followed by ...Nc6 and ...Qb6 against your b2 pawn. You answer with e3 and c3, and you know how to guard b2 safely.',
        difficulty: 2,
        base: 'early-c5',
        merge: [{ from: 'vs-c5-benoni-style' }, { from: 'knight-first-move-orders', only: [L('d4 Nf6 Bf4 c5')] }],
        ops: [
          // the trap after 3...Qb6?! keeps its point (Nb5 and the threat Nc7+)
          { op: 'keep', path: L('d4 d5 Bf4 c5 e3 Qb6'), depth: 6 },
        ],
        after: [
          {
            op: 'comment',
            path: L('d4 d5 Bf4 c5 e3 Qb6 Nc3 Qxb2 Nxd5 Bf5 Qb1 Qxb1+'),
            text: 'Black swaps queens with check. Take back with the rook: Rxb1. Your rook is active and Nc7+ is coming.',
          },
        ],
      },
      {
        id: 'vs-dutch',
        title: 'Against the Dutch: 1.d4 f5',
        summary:
          'Black answers 1.d4 with 1...f5 to control the e4 square. You keep your calm London set-up, use the holes Black leaves behind, and prepare the e4 push to open the centre.',
        difficulty: 2,
        base: 'vs-dutch',
        after: [
          {
            op: 'comment',
            path: L('d4 f5 Bf4 g5 Bxg5 Nf6 Bxf6 exf6'),
            text: 'Black takes back with the e-pawn. You are a clean pawn up and Black\'s king side is full of holes. Now just develop calmly: e3, then Bd3, Nf3 and castle.',
          },
        ],
      },
    ],
  },
  {
    course: 'caro-kann',
    side: 'black',
    maxPly: 15,
    keepAllPly: 5,
    chapters: [
      {
        id: 'exchange-others',
        title: 'Exchange Variation: 3.exd5 cxd5',
        summary:
          'White swaps pawns on d5 and develops with Nf3, Nc3, Bd3, Bf4 or a check on b5, or hits d5 at once with c4 (the Panov). The plan stays the same: knights out, bishop to g4 or f5, then ...e6.',
        difficulty: 1,
        base: 'exchange-others',
        merge: [{ from: 'exchange-bd3' }, { from: 'panov' }],
      },
      {
        id: 'two-knights',
        title: 'Two Knights Attack: 2.Nf3 and 2.Nc3',
        summary:
          'White develops a knight on move 2 instead of playing d4. You still play ...d5. Then you pin the f3-knight with ...Bg4: after 3.Nc3, and also after 3.e5. Against 3.exd5 you take back with the c-pawn.',
        difficulty: 1,
        base: 'two-knights',
        ops: [
          { op: 'drop', path: L('e4 c6 Nf3 d5 e5 Bf5') },
          {
            op: 'graft',
            path: L('e4 c6 Nf3 d5 e5'),
            first: true,
            pgn: `3... Bg4 {Against this move order the bishop goes to g4, not f5. It pins the knight on f3 to the queen, and that knight is the piece that will support d4 and e5. At 1000-1300 this scores better than ...Bf5 (56% against 49% in about 830 games, September 2026). [%cal Gc8g4,Rg4d1]}
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
8. c3 {White supports d4. Your plan: ...Qb6, ...Nge7 and ...cxd4, with pressure on the pawn chain.}`,
          },
          {
            op: 'graft',
            path: L('e4 c6 Nf3 d5 exd5 cxd5'),
            pgn: `4. Nc3 {White develops and puts pressure on d5.}
(4. Bb5+ {White gives a check.}
4... Bd7 {Block with the bishop. Never block with the queen.}
5. Bxd7+ {White swaps bishops.}
5... Qxd7 {Take back with the queen. Your knights stay free to develop.}
6. d4 {This is the same position as in the Exchange Variation chapter after 4.Bb5+ Bd7 5.Bxd7+ Qxd7 6.Nf3. Continue with ...Nc6.}
)
4... Nc6 {Develop the knight. It eyes d4 and e5.}
5. d4 {White takes the centre. This is the same position as 1.e4 c6 2.d4 d5 3.exd5 cxd5 4.Nc3 Nc6 5.Nf3 in the Exchange Variation chapter. Play ...Bg4 next.}
(5. Bb5 {White pins your knight to the king.}
5... e6 {Stay calm: support d5 and get ready to develop the f8-bishop. If White takes on c6, take back with the b-pawn.}
6. d4 {White takes the centre. Continue with ...Bd6 and ...Nge7, then castle.}
)`,
          },
        ],
        after: [
          {
            op: 'comment',
            path: L('e4 c6 Nc3 d5 d4 dxe4 Nxe4 Bf5 Ng3'),
            text: 'White chases your bishop. Retreat with ...Bg6 and follow the plan from the Classical chapter.',
          },
          {
            op: 'comment',
            path: L('e4 c6 Nf3 d5 Nc3 Bg4 h3 Bxf3 Qxf3 e6 d4 dxe4 Nxe4 Qxd4 c3'),
            text: 'White hits the queen. Step back with ...Qd5: from there she still attacks the knight on e4, and you stay a pawn up.',
          },
        ],
      },
      {
        id: 'sidelines',
        title: 'Odd second moves: Bc4, Qf3, e5, f4, c4 and more',
        summary:
          'Your opponent does not play 2.d4. Play ...d5 anyway, take the centre and develop naturally. 2.Bc4 is the most common of these moves at your level, so you learn its main lines after 3.exd5 cxd5: 4.Bb3 and 4.Bb5+.',
        difficulty: 1,
        base: 'sidelines',
        merge: [{ from: 'accelerated-panov' }],
        ops: [
          {
            op: 'graft',
            path: L('e4 c6 Bc4 d5 exd5 cxd5'),
            first: true,
            pgn: `4. Bb3 {White keeps the bishop on the a2-g8 diagonal, where it eyes d5 and f7. This is the most common move here.}
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
6. d4 {White takes the centre. Now ...Bg4 pins the knight on f3, and after ...e6 your position is easy to play.}`,
          },
          {
            op: 'graft',
            path: L('e4 c6 Bc4 d5 exd5 cxd5 Bb5+ Bd7 Bxd7+ Nxd7'),
            first: true,
            pgn: `6. Nf3 {White develops.}
6... Ngf6 {Develop the second knight. It guards d5.}
7. O-O {White castles. Continue with ...e6, ...Bd6 and castle.}`,
          },
          {
            op: 'graft',
            path: L('e4 c6 Bc4 d5 exd5 cxd5 Bb5+ Bd7'),
            pgn: `5. Qe2 {White guards the bishop on b5 with the queen.}
5... Nc6 {Develop the knight. If White takes on c6, take back with the bishop.}
6. Nf3 {White develops.}
6... e6 {Support d5 and free your f8-bishop.}
7. d4 {White takes the centre. Continue with ...Bd6 and ...Nge7, then castle.}`,
          },
          {
            op: 'graft',
            path: L('e4 c6'),
            pgn: `2. Qf3 {White brings the queen out early to support e4.}
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
2... d5 {Hit the centre anyway. [%cal Gd7d5]}
3. exd5 {White takes.}
3... cxd5 {Take back with the c-pawn and keep a pawn in the centre.}
4. d4 {White takes the centre. Develop with ...Nf6 and ...Nc6; later ...Bg4 can hit the queen on f3.}`,
          },
          // one taught move per position: this move order reaches the 3.exd5 line of the accelerated Panov
          { op: 'cut', path: L('e4 c6 c4 d5 cxd5 cxd5 exd5 Nf6 Nc3 Nxd5 Nf3 Nc6 d4') },
          {
            op: 'comment',
            path: L('e4 c6 c4 d5 cxd5 cxd5 exd5 Nf6 Nc3 Nxd5 Nf3 Nc6 d4'),
            text: 'This is the same position as after 3.exd5 cxd5 4.cxd5 Nf6 5.Nc3 Nxd5 6.Nf3 Nc6 7.d4 in this chapter. Play ...Bg4.',
          },
        ],
        after: [
          {
            op: 'comment',
            path: L('e4 c6 Nc3 d5 Qf3 dxe4 Nxe4 Nd7 Qe2'),
            text: 'Careful, this is a trap! The queen now stands behind the e4-knight, on the same file as your king. If you play 5...Ngf6??, then 6.Nd6 is checkmate: your e7-pawn cannot take the knight, because that would expose your king to the queen. The safe move is 5...Ndf6.',
          },
        ],
      },
      {
        id: 'gambits',
        title: 'Rare third moves and gambits, including 3.f3',
        summary:
          'After 2.d4 d5, White plays something unusual: 3.f3 (the Fantasy), 3.Nf3, 3.Bd3, 3.Qf3, or a pawn sacrifice like 4.f3 or 4.Bc4. Take on e4, keep your pieces safe, and give the pawn back only if you get something good.',
        difficulty: 2,
        base: 'gambits',
        merge: [{ from: 'fantasy' }],
        after: [
          {
            op: 'comment',
            path: L('e4 c6 d4 d5 f3 dxe4 fxe4 e5 Nf3 Bg4 Bc4 Nd7 O-O Ngf6 h3'),
            text: 'White asks the bishop what it wants to do. Take the knight with ...Bxf3.',
          },
        ],
      },
      {
        id: 'advance-short',
        title: 'Advance Variation: White plays Nf3 (the "Short" line)',
        summary:
          'White pushes the pawn to e5 and develops with Nf3 and Be2. You develop your bishop first, close the door with ...e6, and attack White\'s centre with ...c5.',
        difficulty: 2,
        base: 'advance-short',
        after: [
          // added by the O1 verifier (2026-10-16, second pass): this line ended with a quiet 'White castles.' although
          // most natural moves here leave Black clearly worse (Stockfish 19: ...Nbc6 -39 cp, ...Bg6 -130, ...Qd7 -174)
          {
            op: 'comment',
            path: L('e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 Be3 cxd4 Nxd4 Ne7 O-O'),
            text: 'White castles. Bring your last knight out with ...Nbc6 now: White is ready to hit d5 with c4, and you want your pieces out before the centre opens.',
          },
        ],
      },
      {
        id: 'advance-others',
        title: 'Advance Variation: Bd3, c3, h4 and g4 on move 4',
        summary:
          'White pushes e5 and then plays something else than Nf3: a bishop swap with Bd3, support with c3, or pawn pushes with h4 and g4 to chase your bishop. Against h4 answer ...h5; against g4 step back to g6. The plan stays ...e6 and ...c5.',
        difficulty: 2,
        base: 'advance-others',
        merge: [{ from: 'advance-pawn-storms' }],
        after: [
          // added by the O1 verifier (2026-10-16, second pass): the line ended on 8.Qxe2 with no comment although
          // White threatens e6 (Stockfish 19: ...e6 +17 cp; ignored, e6 costs you about 1.4 pawns)
          {
            op: 'comment',
            path: L('e4 c6 d4 d5 e5 Bf5 g4 Bg6 h4 h5 gxh5 Bxh5 Be2 Bxe2 Qxe2'),
            text: 'White takes back with the queen. Play ...e6 now: it supports d5 and stops White from pushing the pawn to e6, where it would hit f7. Then follow with ...c5, as always.',
          },
        ],
      },
      {
        id: 'classical-quiet',
        title: 'Classical Variation: 3.Nc3 dxe4 4.Nxe4 Bf5',
        summary:
          'White plays 3.Nc3 (or 3.Nd2) and takes back on e4 with the knight. Your bishop comes out with a hit on the knight and steps back to g6. If White pushes h4, answer ...h6 and keep the bishop safe.',
        difficulty: 2,
        base: 'classical-quiet',
        merge: [{ from: 'classical-h4' }],
        after: [
          {
            op: 'comment',
            path: L('e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5'),
            text: 'White chases the bishop. Step back to h7, where it is safe.',
          },
        ],
      },
      {
        id: 'advance-nc3',
        title: 'Advance Variation: White plays Nc3 (and the g4 pawn push)',
        summary:
          'White pushes e5 and develops the knight to c3. If White follows up with g4 the game becomes sharp. You keep the bishop safe on g6, strike with ...c5 and use ...h5 to break up White\'s kingside pawns.',
        difficulty: 3,
        base: 'advance-nc3',
        ops: [
          // the deep check (2026-10-16): 7...cxd4 lets White keep an edge of about a pawn; 7...h5 at once is equal
          { op: 'drop', path: L('e4 c6 d4 d5 e5 Bf5 Nc3 e6 g4 Bg6 Nge2 c5 h4 cxd4') },
          {
            op: 'graft',
            path: L('e4 c6 d4 d5 e5 Bf5 Nc3 e6 g4 Bg6 Nge2 c5 h4'),
            pgn: `7... h5 {The key move, and play it now: hit the g4-pawn and keep a retreat square for your bishop on h7. [%cal Gh7h5,Rh5g4]}
8. Nf4 {White attacks your bishop and the h5-pawn. Step back with ...Bh7 and bring your queen's knight to c6.}`,
          },
        ],
        after: [
          // added by the O1 verifier (2026-10-16, second pass): this line ended with no comment although White now
          // threatens dxc5 (Stockfish 19: ...cxd4 +10 cp; a quiet move such as ...Qc7 -83)
          {
            op: 'comment',
            path: L('e4 c6 d4 d5 e5 Bf5 Nc3 e6 Nf3 c5 Be2 Nc6 O-O a6 Be3'),
            text: 'White\'s bishop now stands behind the d4-pawn. If White takes on c5, you cannot take back with your bishop, because Bxc5 would win it. So take on d4 first: ...cxd4.',
          },
        ],
      },
    ],
  },
  {
    course: 'slav',
    side: 'black',
    maxPly: 15,
    keepAllPly: 5,
    signatureMoves: ['d4', 'c6', 'c4', 'd5'],
    meta: [
      [
        'The Slav Defence starts with 1.d4 d5 2.c4 c6. White offers a pawn with c4, and you simply protect your d5-pawn with the c-pawn.',
        'You answer 1.d4 with 1...c6 and follow up with ...d5, the same pawn pair as in your Caro-Kann. When White plays c4, this is the Slav Defence (1.d4 c6 2.c4 d5, more often reached by 1.d4 d5 2.c4 c6). White\'s c-pawn attacks d5, and you simply protect it with your c-pawn.',
      ],
      ['The plan in three sentences: Play ...d5 and ...c6.', 'The plan in three sentences: Play ...c6 and ...d5.'],
      [' (The Semi-Slav chapter is the exception: it has its own plan.)', ''],
    ],
    chapters: [
      {
        id: 'slow-slav',
        title: 'The Slow Slav and the Exchange Slav: 2.c4 d5 3.Nf3 or 3.cxd5',
        summary:
          'White plays 2.c4 and you answer ...d5: the Slav Defence. After 3.Nf3 Nf6 you bring the light-squared bishop out before ...e6; after 3.cxd5 cxd5 you develop with ...Nf6, ...Nc6 and ...Bf5.',
        difficulty: 1,
        ops: [
          {
            op: 'graft',
            path: [],
            pgn: `1. d4 {White starts with the queen's pawn.}
1... c6 {Your answer to 1.d4: the same first move as in your Caro-Kann. Next comes ...d5, and the c6-pawn will guard it. [%cal Gc7c6,Gd7d5]}
2. c4 {White plays c4, the Queen's Gambit idea: the pawn attacks the d5-square.}
2... d5 {Now you have the Slav Defence. The c6-pawn guards d5, so you do not need ...e6 yet, and the road stays open for your light-squared bishop. [%cal Gc6d5,Gc8f5]}`,
          },
          { op: 'adopt', path: L('d4 c6 c4 d5'), from: 'slow-slav' },
          { op: 'adopt', path: L('d4 c6 c4 d5'), from: 'exchange-slav' },
          { op: 'adopt', path: L('d4 c6 c4 d5'), from: 'exchange-tricks' },
          { op: 'adopt', path: L('d4 c6 c4 d5'), from: 'main-slav' },
          { op: 'adopt', path: L('d4 c6 c4 d5'), from: 'krause-ne5' },
          { op: 'adopt', path: L('d4 c6 c4 d5'), from: 'slav-accepted' },
          { op: 'adopt', path: L('d4 c6 c4 d5'), from: 'semi-slav-bridge' },
          { op: 'adopt', path: L('d4 c6 c4 d5'), from: 'move-four-sidelines' },
        ],
        after: [
          {
            op: 'comment',
            path: L('d4 c6 c4 d5 Nf3 Nf6 cxd5 cxd5 Nc3 Nc6 Bf4 Bf5'),
            text: 'Bishop out before ...e6. See the Exchange Slav line (3.cxd5 cxd5) in this chapter for the full plan.',
          },
        ],
      },
      {
        id: 'vs-london',
        title: 'Against the London System: 2.Bf4',
        summary:
          'White plays 2.Bf4 (or 2.Nf3 and 3.Bf4) instead of c4. You keep your Slav set-up: ...d5, ...Bf5 first, then ...e6.',
        difficulty: 1,
        ops: [
          {
            op: 'graft',
            path: [],
            pgn: `1. d4 {White starts with the queen's pawn.}
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
4... e6 {Now you can close the pawn chain: your bishop is already outside. [%cal Ge7e6]}`,
          },
          { op: 'adopt', path: L('d4 c6 Bf4 d5 e3 Bf5 Nf3 e6'), from: 'vs-london' },
        ],
        after: [
          {
            op: 'comment',
            path: L('d4 c6 Bf4 d5 e3 Bf5 Nf3 e6 Bd3 Bxd3 Qxd3 Nf6 c4 Bd6 Bxd6'),
            text: 'White takes. Take back with the queen: ...Qxd6.',
          },
          {
            op: 'comment',
            path: L('d4 c6 Bf4 d5 e3 Bf5 Nf3 e6 c4 Bd6 Bxd6 Qxd6 Nc3 Nf6 Nh4'),
            text: 'White attacks your bishop. You can castle first: if White takes on f5, take back with the e-pawn.',
          },
        ],
      },
      {
        id: 'vs-colle-catalan',
        title: 'Against 2.Nf3 and 2.e3: Colle and Catalan set-ups',
        summary:
          'White plays 2.Nf3 or 2.e3 and builds a quiet set-up with e3 (or g3) instead of c4. Your plan stays the same: ...d5, ...Bf5 first, then ...e6.',
        difficulty: 2,
        ops: [
          {
            op: 'graft',
            path: [],
            pgn: `1. d4 {White starts with the queen's pawn.}
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
)
3... Bf5 {Bishop out before ...e6, as always. It also stops White from playing e4 easily. [%cal Gc8f5]}`,
          },
          { op: 'adopt', path: L('d4 c6 Nf3 d5 e3 Bf5'), from: 'vs-colle-catalan' },
          { op: 'adopt', path: L('d4 c6 Nf3 d5 g3'), from: 'vs-colle-catalan' },
          // one taught move per position: this position is taught in the chapter on 3.Nc3 and 3.e3
          { op: 'cut', path: L('d4 c6 Nf3 d5 e3 Bf5 c4 e6 Nc3') },
          {
            op: 'comment',
            path: L('d4 c6 Nf3 d5 e3 Bf5 c4 e6 Nc3'),
            text: 'This is the same position as after 2.c4 d5 3.e3 Bf5 4.Nc3 e6 5.Nf3 in the chapter on 3.Nc3 and 3.e3. Play ...Be7 and ...Nf6, as you learned there.',
          },
        ],
      },
      {
        id: 'third-move-sidelines',
        title: 'The Slav with 3.Nc3 or 3.e3 (and the pawn offers on e4)',
        summary:
          'After 2.c4 d5 White plays 3.Nc3 or 3.e3 instead of 3.Nf3, sometimes with a pawn offer on e4. Get your bishop out and watch out for the queen trick Qb3.',
        difficulty: 2,
        ops: [
          {
            op: 'graft',
            path: [],
            pgn: `1. d4 {White starts with the queen's pawn.}
1... c6 {Your answer to 1.d4: the same first move as in your Caro-Kann. Next comes ...d5, and the c6-pawn will guard it. [%cal Gc7c6,Gd7d5]}
2. c4 {White plays c4, the Queen's Gambit idea.}
2... d5 {The Slav Defence. Your c6-pawn protects d5 and keeps the bishop's road open. [%cal Gc6d5]}`,
          },
          { op: 'adopt', path: L('d4 c6 c4 d5'), from: 'third-move-sidelines' },
          { op: 'first', path: L('d4 c6 c4 d5 Nc3') },
          // the deep check (2026-10-16) finds 4.Bg5 costs White less than 40 cp: no ?! mark
          { op: 'nags', path: L('d4 c6 c4 d5 Nc3 Nf6 Bg5'), nags: [] },
          {
            op: 'graft',
            path: L('d4 c6 c4 d5 Nc3 Nf6'),
            first: true,
            pgn: `4. Nf3 {This is the same position as 1.d4 c6 2.c4 d5 3.Nf3 Nf6 4.Nc3 in the chapter on the Slow Slav. Play ...dxc4, as you learned there.}`,
          },
        ],
        after: [
          {
            op: 'comment',
            path: L('d4 c6 c4 d5 e4 dxe4 Nc3 Nf6 f3'),
            text: 'White offers a second pawn to open the f-file. Take it too with ...exf3: you can give material back later, at the right moment.',
          },
          // added by the O1 verifier (2026-10-16, second pass): this line ended with 'White develops.' although your
          // pinned knight on d7 needs help now (Stockfish 19: ...Nf6 -23 cp; ...a6 -230 after Bxd7+ and Ne5)
          {
            op: 'comment',
            path: L('d4 c6 c4 d5 e3 Bf5 cxd5 cxd5 Qb3 Qc7 Bb5+ Nd7 Nc3 e6 Nf3'),
            text: 'White develops. Bring your other knight out with ...Nf6 now. Your knight on d7 is pinned, and after a slow move such as ...a6, White takes on d7 and jumps into e5 with the knight.',
          },
        ],
      },
      {
        id: 'other-second-moves',
        title: 'Other White moves: 2.e4, 2.Nc3, 2.Bg5, and 1.c4 or 1.Nf3',
        summary:
          'White plays 2.e4 (now you are in the Caro-Kann), 2.Nc3 or 2.Bg5, or starts with 1.c4 or 1.Nf3. You still answer with ...c6 and ...d5.',
        difficulty: 2,
        ops: [
          {
            op: 'graft',
            path: [],
            pgn: `1. d4 {White starts with the queen's pawn.}
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
)
(2. Bg5 {White develops the bishop outside the pawn chain and eyes your e7-pawn.}
2... d5 {Take your share of the centre.}
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
)`,
          },
          { op: 'adopt', path: L('d4 c6 Nc3 d5'), from: 'other-second-moves' },
          // after 3.e4 the Caro-Kann course teaches the moves (one taught move per position)
          { op: 'cut', path: L('d4 c6 Nc3 d5 e4') },
          { op: 'adopt', path: L('d4 c6 Bg5 d5'), from: 'other-second-moves' },
        ],
      },
    ],
  },
]
