export interface TimeControl {
  id: string
  label: string
  /** Time each player starts with, in ms. 0 = no clock. */
  baseMs: number
  /** Time added after each move, in ms. */
  incrementMs: number
  /** PGN "TimeControl" tag value (seconds), '-' for none. */
  pgn: string
}

const MIN = 60_000

export const TIME_CONTROLS: TimeControl[] = [
  { id: 'none', label: 'No clock', baseMs: 0, incrementMs: 0, pgn: '-' },
  { id: '5', label: '5 min', baseMs: 5 * MIN, incrementMs: 0, pgn: '300' },
  { id: '10', label: '10 min', baseMs: 10 * MIN, incrementMs: 0, pgn: '600' },
  { id: '15+10', label: '15 + 10', baseMs: 15 * MIN, incrementMs: 10_000, pgn: '900+10' },
  { id: '30', label: '30 min', baseMs: 30 * MIN, incrementMs: 0, pgn: '1800' },
]

export function getTimeControl(id: string): TimeControl {
  return TIME_CONTROLS.find((t) => t.id === id) ?? TIME_CONTROLS[0]
}

/** 12:05 style, or 0:07.4 when there are only a few seconds left. */
export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms)
  if (clamped < 10_000) {
    const tenths = Math.floor((clamped % 1000) / 100)
    return `0:${String(Math.floor(clamped / 1000)).padStart(2, '0')}.${tenths}`
  }
  const total = Math.ceil(clamped / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}
