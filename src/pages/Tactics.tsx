import { Navigate, Route, Routes } from 'react-router-dom'
import TacticsOverview from '../features/tactics/TacticsOverview'
import LessonPage from '../features/tactics/LessonPage'
import '../features/tactics/tactics.css'

// /tactics            -> all lessons
// /tactics/<lessonId> -> one lesson (Learn, Watch, Practice, More puzzles)
export default function Tactics() {
  return (
    <Routes>
      <Route index element={<TacticsOverview />} />
      <Route path=":lessonId" element={<LessonPage />} />
      <Route path="*" element={<Navigate to="/tactics" replace />} />
    </Routes>
  )
}
