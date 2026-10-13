import { useSearchParams } from 'react-router-dom'
import type { TacticLesson } from '../../types'
import { TACTIC_LESSONS } from '../../data/tactics'
import { FIXTURE_LESSONS } from './fixtures'

export type StepId = 'learn' | 'watch' | 'practice' | 'more'

/**
 * Which lessons to show, plus link helpers.
 * Opening /tactics?fixture=1 swaps in our small test lessons (handy while building or testing);
 * the flag is carried along in every link so it survives clicking around.
 */
export function useTacticsData() {
  const [params] = useSearchParams()
  const fixture = params.get('fixture') === '1'
  const lessons: TacticLesson[] = fixture ? FIXTURE_LESSONS : TACTIC_LESSONS

  const withFlag = (query: string[]) => {
    const all = fixture ? [...query, 'fixture=1'] : query
    return all.length ? `?${all.join('&')}` : ''
  }

  return {
    fixture,
    lessons,
    overviewPath: `/tactics${withFlag([])}`,
    lessonPath: (lessonId: string, step?: StepId) => `/tactics/${lessonId}${withFlag(step ? [`step=${step}`] : [])}`,
  }
}
