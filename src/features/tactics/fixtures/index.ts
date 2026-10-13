import type { TacticLesson } from '../../../types'
import { forkFixture } from './forkFixture'
import { backRankFixture } from './backRankFixture'

/** Test lessons shown instead of the real ones when the page is opened with ?fixture=1 */
export const FIXTURE_LESSONS: TacticLesson[] = [forkFixture, backRankFixture]
