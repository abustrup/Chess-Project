// A tiny made-up opening course, used only to test the "Practise" and "Face an opening" modes while the
// real lessons are being written (see docs/tasks/play.md). Nothing in the app imports this file.
// To try it in a browser, replace a course module with it, e.g. `export { fixtureLondon as londonCourse }`.

import type { OpeningCourse } from '../../types'

export const fixtureLondon: OpeningCourse = {
  id: 'london',
  name: 'London System (test)',
  side: 'white',
  tagline: 'Test course with two chapters.',
  signatureMoves: ['d4', 'd5', 'Bf4'],
  ecoNames: ['London System'],
  overview: [],
  keyIdeas: [],
  commonMistakes: [],
  chapters: [
    {
      id: 'main',
      title: 'Main line: Black plays ...Nf6',
      summary: 'Black develops the king knight early. You build your pawn chain with e3 and c3.',
      difficulty: 1,
      pgn: `1. d4 d5 2. Bf4 {Develop the bishop outside the pawn chain.} Nf6 (2... c5 3. e3 Nc6 4. c3) (2... e6 3. e3 Nf6) 3. e3 {Opens a path for the bishop on f1.} e6 4. Nf3 Bd6 5. Bg3 O-O 6. Nbd2 c5 7. c3 Nc6 *`,
    },
    {
      id: 'early-c5',
      title: 'Black hits the centre with ...c5',
      summary: 'Black attacks your d4 pawn right away. Keep it solid with e3 and c3.',
      difficulty: 2,
      pgn: `1. d4 d5 2. Bf4 c5 3. e3 Nc6 (3... Qb6 4. Nc3) 4. c3 Nf6 5. Nd2 e6 6. Ngf3 Bd6 7. Bg3 O-O *`,
    },
  ],
}

export const fixtureCaroKann: OpeningCourse = {
  id: 'caro-kann',
  name: 'Caro-Kann Defence (test)',
  side: 'black',
  tagline: 'Test course with two chapters.',
  signatureMoves: ['e4', 'c6', 'd4', 'd5'],
  ecoNames: ['Caro-Kann Defense'],
  overview: [],
  keyIdeas: [],
  commonMistakes: [],
  chapters: [
    {
      id: 'advance',
      title: 'Advance Variation: White plays e5',
      summary: 'White pushes the pawn to e5. You answer by developing the light bishop before closing the pawn chain.',
      difficulty: 1,
      pgn: `1. e4 c6 2. d4 d5 3. e5 {White gains space.} Bf5 {Get the bishop out before ...e6 locks it in.} (3... c5 4. dxc5) 4. Nf3 e6 5. Be2 c5 *`,
    },
    {
      id: 'exchange',
      title: 'Exchange Variation: White plays exd5',
      summary: 'White trades the centre pawns. The game becomes calm and symmetrical.',
      difficulty: 1,
      pgn: `1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Bd3 (4. c4 Nf6 5. Nc3 e6) 4... Nc6 5. c3 Nf6 6. Bf4 Bg4 *`,
    },
  ],
}
