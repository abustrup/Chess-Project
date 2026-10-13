import type { OpeningCourse } from '../../types'
import { londonCourse } from './london'
import { caroKannCourse } from './caroKann'
import { slavCourse } from './slav'

/** Every opening course in the app, in the order shown to the user. */
export const OPENING_COURSES: OpeningCourse[] = [londonCourse, caroKannCourse, slavCourse]

export function getCourse(id: string): OpeningCourse | undefined {
  return OPENING_COURSES.find((c) => c.id === id)
}
