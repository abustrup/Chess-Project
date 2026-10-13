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
  // more sets are registered here by the assets step
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
