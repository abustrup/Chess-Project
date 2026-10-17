import type { PuzzleIndex, PuzzleIndexEntry } from '../../types'

// "What do you want to train?" — the player's choice, stored as a short piece of text:
//   'mixed'            every theme
//   'openings'         puzzles from all three of the player's openings
//   'theme:fork'       one theme
//   'opening:london'   one opening

export type Choice = 'mixed' | 'openings' | `theme:${string}` | `opening:${string}`

export const DEFAULT_CHOICE: Choice = 'mixed'

const themeEntries = (index: PuzzleIndex) => index.entries.filter((e) => e.kind === 'theme')
const openingEntries = (index: PuzzleIndex) => index.entries.filter((e) => e.kind === 'opening')

/** The puzzle files that belong to a choice. Empty when the choice names something that does not exist. */
export function entriesFor(choice: Choice, index: PuzzleIndex): PuzzleIndexEntry[] {
  if (choice === 'mixed') return themeEntries(index)
  if (choice === 'openings') return openingEntries(index)
  const [kind, key] = choice.split(':') as ['theme' | 'opening', string]
  return index.entries.filter((e) => e.kind === kind && e.key === key)
}

/** True when the choice (it may come from saved data, so it can be anything) names something the puzzle index really has. */
export function isValidChoice(choice: unknown, index: PuzzleIndex): boolean {
  if (typeof choice !== 'string') return false
  const looksRight = choice === 'mixed' || choice === 'openings' || /^(theme|opening):/.test(choice)
  return looksRight && entriesFor(choice as Choice, index).length > 0
}

/** The choice that a link such as /puzzles?theme=fork or /puzzles?opening=london asks for (null = the link asks for nothing). */
export function choiceFromParams(params: URLSearchParams): Choice | null {
  const theme = params.get('theme')
  if (theme) return `theme:${theme}`
  const opening = params.get('opening')
  if (opening) return `opening:${opening}`
  return null
}

/**
 * Easier puzzles: a link with level=easy (Home's daily block) aims this many points below the puzzle rating, like
 * Lichess's "Easier" difficulty. Only while the page is on that link; picking another topic drops it.
 */
export const EASY_BELOW = 300

/** True when the link asks for easier puzzles (/puzzles?theme=fork&level=easy). */
export function easyFromParams(params: URLSearchParams): boolean {
  return params.get('level') === 'easy'
}

/**
 * The index writes a theme as "Fork — one piece attacks two or more enemy pieces at once". Next to a title that already
 * says "Forks", the first word is repeated, so show only the explanation, starting with a capital letter.
 */
export function plainBlurb(description: string | undefined): string {
  if (!description) return ''
  const [, ...rest] = description.split(/ [—–:] /)
  const text = rest.length > 0 ? rest.join(' ') : description
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export interface ChoiceInfo {
  /** Short name, e.g. "Forks" or "Mixed". */
  title: string
  /** One friendly sentence. */
  blurb: string
  /** The theme key when the player picked exactly one theme (then it is no spoiler to show it). */
  theme?: string
}

export function describeChoice(choice: Choice, index: PuzzleIndex): ChoiceInfo {
  if (choice === 'mixed') return { title: 'Mixed', blurb: 'A bit of everything. The theme is a surprise.' }
  if (choice === 'openings') return { title: 'Your openings', blurb: 'Puzzles from games that began like your London, Caro-Kann and Slav.' }
  const entry = entriesFor(choice, index)[0]
  if (!entry) return { title: 'Mixed', blurb: 'A bit of everything. The theme is a surprise.' }
  return { title: entry.label, blurb: plainBlurb(entry.description), theme: entry.kind === 'theme' ? entry.key : undefined }
}
