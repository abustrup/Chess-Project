import { PuzzleLoadError } from '../../lib/puzzleData'

/** A message that is safe and friendly to show on the page. */
export function errorMessage(error: unknown): string {
  if (error instanceof PuzzleLoadError) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong while getting the puzzles. Please try again.'
}
