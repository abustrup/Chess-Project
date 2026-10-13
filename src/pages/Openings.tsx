import { Route, Routes } from 'react-router-dom'
import { CoursesProvider } from '../features/openings/courses'
import OverviewPage from '../features/openings/OverviewPage'
import CoursePage from '../features/openings/CoursePage'
import StudyPage from '../features/openings/StudyPage'
import DrillPage, { QuizPage } from '../features/openings/DrillPage'
import { Notice } from '../features/openings/components/shared'
import '../features/openings/openings.css'

// Openings trainer. The pages live in src/features/openings; this file only decides which one to show:
//   /openings                                   overview of the three courses
//   /openings/<course>                          one course: ideas, mistakes, chapters
//   /openings/<course>/quiz                     mixed drill over the whole course
//   /openings/<course>/<chapter>/study          guided lesson
//   /openings/<course>/<chapter>/drill          play the moves from memory
export default function Openings() {
  return (
    <CoursesProvider>
      <Routes>
        <Route index element={<OverviewPage />} />
        <Route path=":courseId" element={<CoursePage />} />
        <Route path=":courseId/quiz" element={<QuizPage />} />
        <Route path=":courseId/:chapterId/study" element={<StudyPage />} />
        <Route path=":courseId/:chapterId/drill" element={<DrillPage />} />
        <Route
          path="*"
          element={
            <Notice title="That page does not exist" back={{ to: '/openings', label: 'See all openings' }}>
              Let us take you back to your openings.
            </Notice>
          }
        />
      </Routes>
    </CoursesProvider>
  )
}
