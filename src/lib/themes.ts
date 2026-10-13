// Board colour themes. Blue and warm families only (the user's preference).
// The Settings page shows these as swatches; App.tsx applies the chosen one as CSS variables.

export interface BoardTheme {
  id: string
  name: string
  family: 'blue' | 'warm'
  light: string
  dark: string
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'ocean', name: 'Ocean', family: 'blue', light: '#dfe8f1', dark: '#7d9cb8' },
  { id: 'deep', name: 'Deep blue', family: 'blue', light: '#c9d6e6', dark: '#4f6d95' },
  { id: 'ice', name: 'Ice', family: 'blue', light: '#eef3f8', dark: '#9db4c9' },
  { id: 'midnight', name: 'Midnight', family: 'blue', light: '#8fa2bd', dark: '#36476a' },
  { id: 'walnut', name: 'Walnut', family: 'warm', light: '#f0d9b5', dark: '#b58863' },
  { id: 'sand', name: 'Sand', family: 'warm', light: '#f4e8cf', dark: '#c9a674' },
  { id: 'terracotta', name: 'Terracotta', family: 'warm', light: '#f3e0d2', dark: '#c0805f' },
  { id: 'coffee', name: 'Coffee', family: 'warm', light: '#e7d3b9', dark: '#8a5d3d' },
]

export function getBoardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0]
}

export const APP_THEMES = [
  { id: 'ocean', name: 'Ocean', blurb: 'Cool dark blue' },
  { id: 'ember', name: 'Ember', blurb: 'Warm dark brown and amber' },
] as const
