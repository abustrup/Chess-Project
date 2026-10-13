import type { CSSProperties } from 'react'
import { defaultPieces } from 'react-chessboard'
import type { PieceRenderObject } from 'react-chessboard'

// Piece sets. 'classic' is built into the board library; every other set is a folder of SVG files in
// public/pieces/<dir>/ named wK.svg wQ.svg wR.svg wB.svg wN.svg wP.svg bK.svg ... bP.svg
// To add a set: drop the 12 SVGs in a new folder and add an entry to PIECE_SETS below
// (and credit the author in `credit`; the app shows it in Settings).

export interface PieceSetInfo {
  id: string
  name: string
  description: string
  /** Author + licence, shown in Settings. */
  credit: string
  /** folder under public/pieces — undefined for the built-in classic set */
  dir?: string
}

export const PIECE_SETS: PieceSetInfo[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'The familiar tournament look.',
    credit: 'react-chessboard built-in pieces (MIT)',
  },
  // The sets below are the pieces from the Lichess project (https://github.com/lichess-org/lila).
  // Full credits with links: docs/pieces-credits.md
  {
    id: 'merida',
    name: 'Book',
    description: 'Traditional Staunton pieces with soft shading, like the diagrams in chess books.',
    credit: 'Merida by Armando Hernandez Marroquin (GPL-2.0 or later)',
    dir: 'merida',
  },
  {
    id: 'fresca',
    name: 'Friendly',
    description: 'Soft, rounded pieces with a warm, easygoing look.',
    credit: 'Fresca by sadsnake1 (CC BY-NC-SA 4.0)',
    dir: 'fresca',
  },
  {
    id: 'mpchess',
    name: 'Modern',
    description: 'Clean, flat line drawings with nothing extra to distract you.',
    credit: 'MPChess by Maxime Chupin (GPL-3.0 or later)',
    dir: 'mpchess',
  },
  {
    id: 'icpieces',
    name: 'Bold',
    description: 'Thick outlines, pure black and white. The easiest to read at a glance, especially on blue boards.',
    credit: 'IC Pieces by sadsnake1 (CC BY-NC-SA 4.0)',
    dir: 'icpieces',
  },
  {
    id: 'letter',
    name: 'Letters',
    description: 'Just the letters K, Q, R, B, N and a dot for pawns. Handy while you learn the piece names.',
    credit: 'Letter by usolando (AGPL-3.0 or later), white outlines made thicker for this app',
    dir: 'letter',
  },
  {
    id: 'rhosgfx',
    name: 'Warm clay',
    description: 'Cream and dark clay pieces that look lovely on the warm boards.',
    // The dark pieces were made darker for this app: in their original terracotta they almost
    // disappeared on the warm dark squares.
    credit: 'Pieces by RhosGFX (CC0 1.0, public domain), dark pieces made darker for this app',
    dir: 'rhosgfx',
  },
]

export function getPieceSet(id: string): PieceSetInfo {
  return PIECE_SETS.find((s) => s.id === id) ?? PIECE_SETS[0]
}

/** URL of one piece image (for previews in Settings). Returns undefined for the built-in set. */
export function pieceUrl(setId: string, piece: string): string | undefined {
  const set = getPieceSet(setId)
  return set.dir ? `${import.meta.env.BASE_URL}pieces/${set.dir}/${piece}.svg` : undefined
}

const cache = new Map<string, PieceRenderObject>()

/** Piece renderers in the format react-chessboard wants. */
export function piecesFor(setId: string): PieceRenderObject {
  const set = getPieceSet(setId)
  if (!set.dir) return defaultPieces
  const hit = cache.get(set.id)
  if (hit) return hit
  const out: PieceRenderObject = {}
  for (const colour of ['w', 'b']) {
    for (const type of ['K', 'Q', 'R', 'B', 'N', 'P']) {
      const key = `${colour}${type}`
      const src = `${import.meta.env.BASE_URL}pieces/${set.dir}/${key}.svg`
      out[key] = (props) => {
        const style: CSSProperties = { width: '100%', height: '100%', display: 'block', ...props?.svgStyle }
        return <img src={src} alt="" draggable={false} style={style} />
      }
    }
  }
  cache.set(set.id, out)
  return out
}
