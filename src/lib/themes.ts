// Board colour themes. Blue and warm families only (the user's preference).
// The Settings page shows these as swatches; App.tsx applies the chosen one as CSS variables.
//
// Every pair was checked against the piece sets: a black piece must still be easy to see on the
// dark squares (contrast at least 3:1) and the two square colours must be clearly different.

export interface BoardTheme {
  id: string
  name: string
  family: 'blue' | 'warm'
  light: string
  dark: string
  /**
   * Optional tint for the two squares of the last move (use it for --sq-last).
   * The default pale yellow is faint on cream squares and turns olive-green on blue ones,
   * so blue boards get amber and warm boards get a stronger gold.
   */
  highlight?: string
  /** Optional stronger version of `highlight` for the square of the piece you picked up (--sq-select). */
  select?: string
  /** Optional colour for the a-h / 1-8 letters on light squares (at least 4.5:1 against `light`). */
  coordOnLight?: string
  /** Optional colour for the a-h / 1-8 letters on dark squares (at least 4.5:1 against `dark`). */
  coordOnDark?: string
}

const BLUE_HIGHLIGHT = { highlight: 'rgba(255, 176, 64, 0.5)', select: 'rgba(255, 176, 64, 0.72)' }
const WARM_HIGHLIGHT = { highlight: 'rgba(255, 206, 50, 0.6)', select: 'rgba(255, 206, 50, 0.85)' }

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'ocean', name: 'Ocean', family: 'blue', light: '#dfe8f1', dark: '#7d9cb8', ...BLUE_HIGHLIGHT, coordOnLight: '#556a7d', coordOnDark: '#243243' },
  { id: 'deep', name: 'Deep blue', family: 'blue', light: '#c9d6e6', dark: '#4f6d95', ...BLUE_HIGHLIGHT, coordOnLight: '#445e80', coordOnDark: '#e7edf4' },
  { id: 'ice', name: 'Ice', family: 'blue', light: '#eef3f8', dark: '#8ea9c3', ...BLUE_HIGHLIGHT, coordOnLight: '#5e7081', coordOnDark: '#2f3c4e' },
  // Midnight used to be darker, which made black pieces vanish on its dark squares. Lightened a little.
  { id: 'midnight', name: 'Midnight', family: 'blue', light: '#9aabcb', dark: '#485c8f', ...BLUE_HIGHLIGHT, coordOnLight: '#313f61', coordOnDark: '#cfd7e6' },
  { id: 'walnut', name: 'Walnut', family: 'warm', light: '#f0d9b5', dark: '#b58863', ...WARM_HIGHLIGHT, coordOnLight: '#795b42', coordOnDark: '#2c2a2d' },
  { id: 'sand', name: 'Sand', family: 'warm', light: '#f4e8cf', dark: '#c29b62', ...WARM_HIGHLIGHT, coordOnLight: '#7e6540', coordOnDark: '#3c3732' },
  { id: 'terracotta', name: 'Terracotta', family: 'warm', light: '#f3e0d2', dark: '#c0805f', ...WARM_HIGHLIGHT, coordOnLight: '#885b43', coordOnDark: '#2d272c' },
  { id: 'coffee', name: 'Coffee', family: 'warm', light: '#e7d3b9', dark: '#8a5d3d', ...WARM_HIGHLIGHT, coordOnLight: '#7c5437', coordOnDark: '#f0e4d4' },
]

export function getBoardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0]
}

export const APP_THEMES = [
  { id: 'ocean', name: 'Ocean', blurb: 'Cool dark blue' },
  { id: 'ember', name: 'Ember', blurb: 'Warm dark brown and amber' },
] as const
