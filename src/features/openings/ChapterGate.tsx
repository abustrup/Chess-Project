import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import type { OpeningChapter, OpeningCourse } from '../../types'
import type { PgnTree } from '../../lib/pgnTree'
import { findChapter, useCourse } from './courses'
import { parseChapter } from './treeUtils'
import { Notice } from './components/shared'

// Study and drill both need "the course, the chapter and its parsed moves". This looks them up from the
// address and shows a friendly page instead when something is missing or broken.

export interface ChapterContext {
  course: OpeningCourse
  chapter: OpeningChapter
  tree: PgnTree
}

export default function ChapterGate({ children }: { children: (ctx: ChapterContext) => ReactNode }) {
  const { courseId, chapterId } = useParams()
  const course = useCourse(courseId)
  if (!course) {
    return (
      <Notice title="We could not find that opening" back={{ to: '/openings', label: 'See all openings' }}>
        Maybe the link is old. Pick one of your openings from the list.
      </Notice>
    )
  }
  const chapter = findChapter(course, chapterId)
  if (!chapter) {
    return (
      <Notice title="We could not find that chapter" back={{ to: `/openings/${course.id}`, label: `Back to ${course.name}` }}>
        It may have been renamed. Choose a variation from the course page.
      </Notice>
    )
  }
  const parsed = parseChapter(chapter)
  if (!parsed.ok) {
    return (
      <Notice title="This chapter is not ready" back={{ to: `/openings/${course.id}`, label: `Back to ${course.name}` }}>
        <p>{parsed.error}</p>
        <p className="small faint">Please tell whoever looks after the lessons, so they can fix it.</p>
      </Notice>
    )
  }
  return <>{children({ course, chapter, tree: parsed.tree })}</>
}
