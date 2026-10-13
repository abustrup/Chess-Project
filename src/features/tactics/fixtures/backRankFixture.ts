import type { TacticLesson } from '../../../types'

// A second, tiny test lesson (open /tactics?fixture=1). It has an exercise with two correct
// answers (both rooks mate) and one that needs a pawn promotion.
export const backRankFixture: TacticLesson = {
  id: 'fixture-back-rank',
  name: 'Back-rank mate (test lesson)',
  tagline: 'The king is trapped behind its own pawns.',
  puzzleTheme: 'backRankMate',
  intro: [
    {
      type: 'text',
      text: 'When a king stays on its back row with its pawns in front, it has no escape squares. A rook or queen that checks it on that row can be checkmate.',
    },
    {
      type: 'board',
      fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
      caption: 'The black king is boxed in by its own pawns. The rook moves to d8 and it is checkmate.',
      arrows: [{ from: 'd1', to: 'd8', color: 'green' }],
      highlights: [
        { square: 'f7', color: 'yellow' },
        { square: 'g7', color: 'yellow' },
        { square: 'h7', color: 'yellow' },
      ],
    },
    {
      type: 'tip',
      text: 'Protect yourself: give your king an escape square by moving one pawn in front of it, for example h3 or h6.',
    },
  ],
  examples: [
    {
      title: 'Rook to the back row',
      fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
      moves: ['d1d8'],
      explanations: [
        'The rook moves to d8 and gives check. The king cannot step away because its own pawns block f7, g7 and h7. Checkmate!',
      ],
    },
  ],
  exercises: [
    {
      id: 'fixture-back-rank-1',
      fen: '6k1/5ppp/8/8/8/8/8/3RR1K1 w - - 0 1',
      solution: ['d1d8'],
      hint: 'The king is boxed in by its own pawns. Which rook can check it on the back row?',
      explanation: 'Rd8 is checkmate because the black pawns block the king. Re8 would be checkmate too.',
      difficulty: 1,
    },
    {
      id: 'fixture-back-rank-2',
      fen: '3q3k/p1P3pp/8/5b2/8/P7/5PPP/6K1 w - - 0 36',
      solution: ['c7d8q'],
      hint: 'Your pawn is one step from the last row. Can it capture something on the way?',
      explanation: 'The pawn takes the queen on d8 and becomes a new queen, with check. The king is trapped behind its pawns, so it is checkmate.',
      difficulty: 2,
    },
  ],
}
