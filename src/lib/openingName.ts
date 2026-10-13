// Recognise which named opening a game is in (e.g. "Caro-Kann Defense: Advance Variation").
// PLACEHOLDER — the data agent replaces this file with a real lookup built from the Lichess openings
// database (public domain). The function signature below is the contract; keep it.

export interface OpeningInfo {
  eco: string // 'B12'
  name: string // 'Caro-Kann Defense: Advance Variation'
  /** How many half-moves of the game belong to this opening (the length of the matching line). */
  plies: number
}

/** `sans` = the game's moves in SAN from the start position. Returns the LONGEST known opening the game follows
 *  (transpositions count), or null if the moves are not a known opening. */
export function identifyOpening(sans: string[]): OpeningInfo | null {
  void sans
  return null
}

/** Is the game still "in book" after this many half-moves? (used to label moves as 'book' in reviews) */
export function isBookPosition(sans: string[]): boolean {
  return identifyOpening(sans) !== null
}
