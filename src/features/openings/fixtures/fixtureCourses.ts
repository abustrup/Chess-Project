import type { OpeningCourse } from '../../../types'

// A tiny pretend course for each colour, used to test the openings trainer while the real lessons are
// still being written. Switch it on by adding ?fixture=1 to any /openings address (and ?fixture=0 to
// switch it off again). It is never shown to normal visitors.

const WHITE_MAIN_LINE = `
{Welcome! In this lesson you play White and set up a calm, solid position. [%cal Gd2d4]}
1. d4 {You open with the queen's pawn. It grabs space in the middle and frees your queen and bishop. [%cal Gd2d4] [%csl Gd4]}
1... d5 {Black copies you and fights for the centre too.}
2. Bf4 $1 {This is the big idea of the opening: get your dark-squared bishop out BEFORE you close it in with pawns. [%cal Gc1f4,Yf4b8]}
(2. Nf3 {This also works. The knight comes out first and keeps your options open. [%cal Gg1f3]})
2... Nf6 {Black brings a knight out to guard the centre.}
(2... c5 {Black hits your centre straight away. [%cal Rc7c5,Gd4c5]} 3. e3 {Calmly support the bishop and keep your pawn chain solid.} cxd4 4. exd4 {Take back with the pawn. Now your bishop on f4 is safe and your centre is strong. [%cal Ge3d4]})
3. e3 {This opens a path for the other bishop and protects your bishop on f4. [%cal Ge3f4,Ge3d4] [%csl Gf4]}
3... e6 {Black solidly protects the centre.}
(3... c5 {Black attacks your centre with a pawn. [%cal Rc5d4]} 4. c3 {A small pawn move that keeps your pawn on d4 well protected.})
(3... Bf5 {Black puts a bishop outside the pawn chain too.} 4. Nf3 {Develop the knight and keep everything protected.})
4. Nf3 {The knight comes out. Now your pieces protect each other.} Bd6 {Black offers a bishop trade.}
5. Bg3 $1 {Good! Do not give up your bishop for free. Slide it back to g3 where it still watches the long diagonal. [%cal Gf4g3]} O-O 6. Bd3 {Develop the last bishop. You are ready to castle.}
`

const WHITE_QB6 = `
{In this lesson Black attacks your pawn on b2 with the queen. Stay calm.}
1. d4 d5 2. Bf4 Nf6 3. e3 c5 4. c3 {A modest move that stops Black's pawn from jumping to d4. [%cal Gc2c3]} Qb6 {Black's queen eyes the b2 pawn. [%cal Rb6b2]}
5. Qb3 $1 {Offer a queen trade. It defends b2 and gets your queen off the attack. [%cal Gd1b3,Gb3b6]}
5... c4 {Black attacks your queen.} (5... Nc6 {Black adds a piece.} 6. Nf3 {Develop and let Black decide about the queens.})
6. Qxb6 {Take the queen before it is taken. [%cal Gb3b6]} axb6 {Black's pawns are a little bit scattered, which is good for you.} 7. Nd2 {Your knight hurries to the middle.}
`

const BLACK_ADVANCE = `
{Welcome! In this lesson you play Black against 1.e4. You will build a solid fortress.}
1. e4 {White grabs the centre.}
1... c6 $1 {The Caro-Kann! A quiet pawn move that prepares ...d5 without blocking your bishop. [%cal Gc7c6,Gd7d5]}
2. d4 {White builds a big centre.}
(2. Nc3 {White prepares d4 and keeps it simple.} d5 3. Nf3 {A calm move.} Bg4 {Pin down the knight.})
2... d5 {Now you hit the e4 pawn and fight for the centre. [%cal Gd5e4]}
3. e5 {White pushes the pawn forward. This is called the Advance Variation. [%cal Re4e5]}
3... Bf5 $1 {Here is the point of your first move. Your bishop gets out before you play ...e6. [%cal Gc8f5]}
(3... c5 {A bit hasty.})
4. Nf3 {White develops a knight.}
(4. h4 {White attacks with the h-pawn. [%cal Rh2h4]} h5 {Stop the pawn from going any further.})
4... e6 {Now your pawn chain is solid and the bishop is outside it. [%cal Ge7e6] [%csl Gf5]}
5. Be2 c5 {Now you attack White's centre. [%cal Gc6c5,Gc5d4]} 6. Be3 Nc6 {Another piece joins in.}
`

const BLACK_EXCHANGE = `
{White exchanges the centre pawns. Do not worry: it is an easy position to play.}
1. e4 c6 2. d4 d5 3. exd5 {White takes the pawn. [%cal Re4d5]} cxd5 {Take back with the pawn. Your centre is just fine.}
4. Bd3 {White develops.} Nc6 {Pressure the d4 pawn.} 5. c3 Nf6 {Develop with a purpose.} 6. Bf4 Bg4 {Pin the knight to the queen. [%cal Gg4f3]}
`

const FIXTURE_IDEA_FEN = 'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2'

export const FIXTURE_COURSES: OpeningCourse[] = [
  {
    id: 'demo-white',
    name: 'Demo: London-style (test)',
    side: 'white',
    tagline: 'A pretend White course used to test the trainer.',
    signatureMoves: ['d4', 'd5', 'Bf4'],
    ecoNames: ['London System'],
    overview: [
      'This is a small test course. It is not real chess advice, it only shows how the trainer looks.',
      'You play White. Study each chapter, then drill it from memory.',
    ],
    keyIdeas: [
      {
        title: 'Bishop out first',
        text: 'Bring the dark-squared bishop out before you close the diagonal with the pawn on e3.',
        fen: FIXTURE_IDEA_FEN,
        arrows: [{ from: 'c1', to: 'f4', color: 'green' }],
        orientation: 'white',
      },
      { title: 'A text-only idea', text: 'Not every idea needs a diagram. This one has none.' },
    ],
    commonMistakes: [
      {
        title: 'Forgetting the b2 pawn',
        text: 'After ...Qb6, remember that your b2 pawn needs protection.',
        fen: 'rnb1kb1r/pp2pppp/1q3n2/2pp4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq - 1 5',
        highlights: [{ square: 'b2', color: 'red' }],
      },
    ],
    chapters: [
      {
        id: 'main-line',
        title: 'Main line: Black plays ...Nf6',
        summary: 'The most common way Black answers. Learn this one first.',
        difficulty: 1,
        pgn: WHITE_MAIN_LINE,
      },
      {
        id: 'queen-b6',
        title: 'Black attacks b2 with the queen',
        summary: 'Black plays ...c5 and ...Qb6 to hit your pawn.',
        difficulty: 2,
        pgn: WHITE_QB6,
      },
    ],
  },
  {
    id: 'demo-black',
    name: 'Demo: Caro-Kann-style (test)',
    side: 'black',
    tagline: 'A pretend Black course used to test the trainer.',
    signatureMoves: ['e4', 'c6', 'd4', 'd5'],
    ecoNames: ['Caro-Kann Defense'],
    overview: ['This is a small test course for the Black side. The board is shown from Black’s point of view.'],
    keyIdeas: [
      {
        title: 'Pawn first, bishop next',
        text: 'Play ...c6 and ...d5, and bring your light-squared bishop out before ...e6.',
        fen: 'rn1qkbnr/pp2pppp/2p5/3pPb2/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 1 4',
        orientation: 'black',
      },
    ],
    commonMistakes: [],
    chapters: [
      {
        id: 'advance',
        title: 'Advance Variation: 3.e5',
        summary: 'White pushes the e-pawn forward. Get the bishop out.',
        difficulty: 2,
        pgn: BLACK_ADVANCE,
      },
      {
        id: 'exchange',
        title: 'Exchange Variation: 3.exd5',
        summary: 'White swaps the centre pawns. A calm game.',
        difficulty: 1,
        pgn: BLACK_EXCHANGE,
      },
    ],
  },
]
