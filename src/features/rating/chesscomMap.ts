import { readStored, writeStored } from '../../lib/storage'
import { isProvisional, type PerfKey, type PerfRating } from './lichessRating'

// Lichess -> chess.com, as a TRANSLATION, never as his chess.com rating (his chess.com account has 3 games from 2020).
// The table comes from players who have accounts on both sites and were checked to be the same person, pooled from
// two samples (140 blitz pairs, 139 rapid pairs). Built by research/2026-10-16-diagnosis/rating/scripts/
// build_pooled_map.py into public/data/rating/chesscom-map.json; rating.check.ts keeps the two copies equal.
// Same time control on both sites: Lichess blitz -> chess.com blitz, Lichess rapid -> chess.com rapid.

export interface MapRow {
  lichess: number
  /** the middle of the matched players at this Lichess rating */
  center: number
  /** 8 in 10 of the players within `similarWithin` Lichess points have a chess.com rating between p10 and p90 */
  p10: number
  p90: number
  /** how many matched players are within `similarWithin` points */
  near: number
}

export interface ChesscomMap {
  sourceDate: string
  samples: string
  similarWithin: number
  maps: Partial<Record<PerfKey, { chesscom: string; pairs: number; rows: MapRow[] }>>
}

export interface Translation {
  /** chess.com time control the number is on */
  chesscom: string
  center: number
  low: number
  high: number
  /** matched players within `similarWithin` points of this rating (at the nearest table row) */
  near: number
  /** all matched players in this table */
  pairs: number
  similarWithin: number
  sourceDate: string
}

const round10 = (v: number) => Math.round(v / 10) * 10

/**
 * The chess.com translation of an established Lichess rating, or null when there is none to give:
 * a provisional rating (Lichess itself is not sure yet), no games, no table for this time control,
 * or a rating outside the table (the data do not cover it). Between two rows the values are interpolated.
 */
export function translate(map: ChesscomMap | null, perf: PerfKey, p: PerfRating | undefined): Translation | null {
  if (!map || !p || p.games === 0 || isProvisional(p)) return null
  const table = map.maps[perf]
  const rows = table?.rows ?? []
  if (!table || rows.length === 0) return null
  const x = p.rating
  if (x < rows[0].lichess || x > rows[rows.length - 1].lichess) return null
  let i = 0
  while (i < rows.length - 2 && rows[i + 1].lichess < x) i++
  const a = rows[i]
  const b = rows[Math.min(i + 1, rows.length - 1)]
  const t = b.lichess === a.lichess ? 0 : (x - a.lichess) / (b.lichess - a.lichess)
  const at = (k: 'center' | 'p10' | 'p90') => a[k] + (b[k] - a[k]) * t
  return {
    chesscom: table.chesscom,
    center: round10(at('center')),
    low: round10(at('p10')),
    high: round10(at('p90')),
    near: t < 0.5 ? a.near : b.near,
    pairs: table.pairs,
    similarWithin: map.similarWithin,
    sourceDate: map.sourceDate,
  }
}

/** Keeps only well-formed rows, so a damaged file means "no translation", never a wrong one. */
export function cleanMap(value: unknown): ChesscomMap | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (typeof v.sourceDate !== 'string' || typeof v.similarWithin !== 'number' || !v.maps || typeof v.maps !== 'object')
    return null
  const maps: ChesscomMap['maps'] = {}
  for (const [key, raw] of Object.entries(v.maps as Record<string, unknown>)) {
    if (key !== 'blitz' && key !== 'rapid') continue
    const m = raw as { chesscom?: unknown; pairs?: unknown; rows?: unknown }
    if (typeof m?.chesscom !== 'string' || typeof m.pairs !== 'number' || !Array.isArray(m.rows)) continue
    const rows = (m.rows as Record<string, unknown>[]).filter(
      (r) => r && ['lichess', 'center', 'p10', 'p90', 'near'].every((k) => typeof r[k] === 'number'),
    ) as unknown as MapRow[]
    rows.sort((x, y) => x.lichess - y.lichess)
    if (rows.length) maps[key] = { chesscom: m.chesscom, pairs: m.pairs, rows }
  }
  return { sourceDate: v.sourceDate, samples: typeof v.samples === 'string' ? v.samples : '', similarWithin: v.similarWithin, maps }
}

const CACHE_KEY = 'rating.chesscomMap'
let loading: Promise<ChesscomMap | null> | null = null

/** The table, from the site (kept in the browser afterwards, so the page also works offline). Never throws. */
export function loadChesscomMap(): Promise<ChesscomMap | null> {
  loading ??= (async () => {
    try {
      const res = await fetch(`${import.meta.env?.BASE_URL ?? '/'}data/rating/chesscom-map.json`)
      const map = res.ok ? cleanMap(await res.json()) : null
      if (map) {
        writeStored(CACHE_KEY, map)
        return map
      }
    } catch {
      /* offline: fall back to the saved copy below */
    }
    loading = null // try again on the next visit
    return cleanMap(readStored<unknown>(CACHE_KEY, null))
  })()
  return loading
}
