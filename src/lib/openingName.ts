// Recognise which named opening a game is in (e.g. "Caro-Kann Defense: Advance Variation").
//
// The names come from the Lichess openings database (CC0 / public domain), turned into a compact table
// by `npx tsx scripts/build-eco.ts` (see docs/eco-data.md). We match the POSITION on the board, not the
// move text, so a transposition (the same position reached by a different move order) is still recognised.
import { Chess } from 'chess.js'
import ecoData from '../data/eco.json'

export interface OpeningInfo {
  eco: string // 'B12'
  name: string // 'Caro-Kann Defense: Advance Variation'
  /** How many half-moves of the game belong to this opening (the length of the matching line). */
  plies: number
}

/** The three openings the app teaches. Same ids as OpeningCourse.id in src/types.ts. */
export type CourseId = 'london' | 'caro-kann' | 'slav'

/* ------------------------------------------------------------------ */
/* Position keys                                                      */
/* ------------------------------------------------------------------ */

/**
 * A short, fixed-size fingerprint of a position. We use it instead of the full FEN text so the table
 * stays small enough to ship to the browser. It is a 53-bit hash of the "EPD" (the FEN without the
 * move counters: pieces, side to move, castling rights, en-passant square). The build script checks
 * that no two book positions share a key, and the chance that some other position matches by accident
 * is about 1 in 10^12.
 * Exported because scripts/build-eco.ts must produce exactly the same keys.
 */
export function positionKey(fen: string): string {
  const epd = fen.split(' ').slice(0, 4).join(' ')
  // cyrb53: a well-known small, fast, well-mixed string hash.
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < epd.length; i++) {
    const ch = epd.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

/* ------------------------------------------------------------------ */
/* The table (loaded once, synchronously, from the bundled JSON)        */
/* ------------------------------------------------------------------ */

interface EcoFile {
  /** Positions that have a name: [key, eco, name]. */
  named: [string, string, string][]
  /** Positions that are only on the way to a named one (no name of their own): [key]. */
  path: string[]
}

const file = ecoData as unknown as EcoFile
const NAMED = new Map<string, [eco: string, name: string]>(file.named.map(([key, eco, name]) => [key, [eco, name]]))
const ON_THE_WAY = new Set<string>(file.path)

/** The key of the position after each move of `sans`; stops early at the first move that is not legal. */
function keysAlong(sans: string[]): string[] {
  const game = new Chess()
  const keys: string[] = []
  for (const san of sans) {
    try {
      game.move(san)
    } catch {
      break
    }
    keys.push(positionKey(game.fen()))
  }
  return keys
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/** `sans` = the game's moves in SAN from the start position. Returns the LONGEST known opening the game follows
 *  (transpositions count), or null if the moves are not a known opening. */
export function identifyOpening(sans: string[]): OpeningInfo | null {
  const keys = keysAlong(sans)
  // Walk from the end, so the first hit is the deepest (latest) named position of the game.
  for (let i = keys.length - 1; i >= 0; i--) {
    const hit = NAMED.get(keys[i])
    if (hit) return { eco: hit[0], name: hit[1], plies: i + 1 }
  }
  return null
}

/** Is the game still "in book" after this many half-moves? (used to label moves as 'book' in reviews)
 *  True when the position after the LAST move is a known opening position: a named one, or one on the way
 *  to a named one. Transpositions count. The starting position (no moves yet) counts as book too. */
export function isBookPosition(sans: string[]): boolean {
  const keys = keysAlong(sans)
  if (keys.length !== sans.length) return false // an illegal move: we cannot say anything
  if (keys.length === 0) return true
  const last = keys[keys.length - 1]
  return NAMED.has(last) || ON_THE_WAY.has(last)
}

/** The part of an opening name before the first ":" - e.g. "Caro-Kann Defense: Advance Variation" -> "Caro-Kann Defense". */
export function openingFamily(name: string): string {
  const colon = name.indexOf(':')
  return (colon === -1 ? name : name.slice(0, colon)).trim()
}

/** Which of the app's three courses (if any) teaches the opening with this name?
 *  Whole-word matches only, so e.g. the Sicilian "Yugoslav Attack" is not mistaken for the Slav,
 *  and the White-side "Anglo-Slav" or "Slav Indian" setups are not linked to the Slav course. */
export function courseIdForOpening(name: string): CourseId | null {
  if (/\blondon system\b/i.test(name)) return 'london'
  if (/\bcaro-kann\b/i.test(name)) return 'caro-kann'
  if (/\bslav defense\b/i.test(name) || /\bsemi-slav\b/i.test(name)) return 'slav'
  return null
}
