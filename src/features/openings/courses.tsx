import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { OPENING_COURSES } from '../../data/openings'
import type { OpeningChapter, OpeningCourse } from '../../types'
import { FIXTURE_COURSES } from './fixtures/fixtureCourses'

// Gives every openings page the list of courses. Normally that is the real content.
// Adding ?fixture=1 to the address adds the two pretend test courses (and remembers it for this
// browser tab); ?fixture=0 removes them again.

const FLAG = 'cc.openings.fixture'

const CoursesContext = createContext<OpeningCourse[]>(OPENING_COURSES)

function readFlag(): boolean {
  try {
    return sessionStorage.getItem(FLAG) === '1'
  } catch {
    return false
  }
}

export function CoursesProvider({ children }: { children: ReactNode }) {
  const { search } = useLocation()
  const param = new URLSearchParams(search).get('fixture')
  const on = param === '1' ? true : param === '0' ? false : readFlag()

  useEffect(() => {
    try {
      if (on) sessionStorage.setItem(FLAG, '1')
      else sessionStorage.removeItem(FLAG)
    } catch {
      /* private mode: the flag then only lives as long as the address does */
    }
  }, [on])

  const courses = useMemo(() => (on ? [...OPENING_COURSES, ...FIXTURE_COURSES] : OPENING_COURSES), [on])
  return <CoursesContext.Provider value={courses}>{children}</CoursesContext.Provider>
}

export const useCourses = (): OpeningCourse[] => useContext(CoursesContext)

export function useCourse(courseId: string | undefined): OpeningCourse | undefined {
  return useCourses().find((c) => c.id === courseId)
}

export function findChapter(course: OpeningCourse, chapterId: string | undefined): OpeningChapter | undefined {
  return course.chapters.find((c) => c.id === chapterId)
}
