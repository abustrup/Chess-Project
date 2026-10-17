// The locked Home as the browser draws it, for home.e2e.ts: the HTML of each part that H2 could touch, on a fixed
// clock, compared with locked-home.e2e-snapshot.json (written from H1's code on the dev server before H2 changed
// anything). The opening courses and the rating card are left out: other tasks change them, H2 does not.
import type { Page } from 'playwright-core'

/** 2026-10-20 19:00 in Copenhagen: a weekday evening, after the study started. */
export const LOCKED_CLOCK = '2026-10-20T17:00:00Z'

/** Situations the snapshot covers: the study count, and what is saved in the browser. */
export const LOCKED_SITUATIONS = {
  'new player, 12 games': { games: 12 },
  'puzzles and a synced game today, 39 games': { games: 39, synced: true, puzzles: 3 },
  'zen, 39 games': { games: 39, zen: true },
} as const

type Situation = { games: number; synced?: boolean; puzzles?: number; zen?: boolean }

/** localStorage for a situation (key -> value), exactly as the snapshot was taken. */
export function lockedSeed(situation: Situation): Record<string, unknown> {
  const seed: Record<string, unknown> = { 'cc.profile': situation.zen ? { zenMode: true } : {} }
  if (situation.synced) {
    seed['cc.games'] = [
      {
        id: 'syncedtoday1',
        date: '2026-10-20T15:00:00.000Z',
        source: 'lichess',
        pgn: '[Event "Rated Rapid game"]\n[White "abustrup"]\n[Black "Opponent"]\n[Result "1-0"]\n[Variant "Standard"]\n[TimeControl "600+0"]\n[WhiteRatingDiff "+6"]\n[BlackRatingDiff "-6"]\n\n1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0\n',
        white: 'abustrup',
        black: 'Opponent',
        whiteElo: 1500,
        blackElo: 1500,
        userSide: 'white',
        result: '1-0',
      },
    ]
  }
  if (situation.puzzles) {
    seed['cc.puzzleStats'] = {
      rating: 1000,
      solved: 3,
      failed: 0,
      streak: 3,
      bestStreak: 3,
      byTheme: {},
      history: ['fork', 'fork', 'hangingPiece'].map((theme, i) => ({
        date: '2026-10-20T14:00:00.000Z',
        puzzleId: `p${i}`,
        solved: true,
        puzzleRating: 1000,
        ratingAfter: 1000 + i,
        theme,
      })),
    }
  }
  return seed
}

const PARTS: Record<string, string> = {
  hero: '.home > .home-hero',
  continue: '.home > .home-continue',
  plan: '.home > section[aria-labelledby="plan-title"]',
  study: '.home > .study-card',
  puzzles: '.home section[aria-labelledby="puzzle-title"]',
  games: '.home > section[aria-labelledby="games-title"]',
}

/** part name -> its outer HTML (or "missing"), plus the order of the page's top-level parts. */
export async function captureLocked(page: Page): Promise<Record<string, string>> {
  return page.evaluate((parts) => {
    const out: Record<string, string> = {}
    for (const [name, selector] of Object.entries(parts)) out[name] = document.querySelector(selector)?.outerHTML ?? 'missing'
    const home = document.querySelector('.home')
    out.order = home
      ? [...home.children].map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`).join(' > ')
      : 'missing'
    return out
  }, PARTS)
}
