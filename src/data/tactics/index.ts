import type { TacticLesson } from '../../types'

// Lesson files are added here by the tactics content agents (one file per lesson, e.g. ./fork.ts)
export const TACTIC_LESSONS: TacticLesson[] = []

export function getLesson(id: string): TacticLesson | undefined {
  return TACTIC_LESSONS.find((l) => l.id === id)
}
