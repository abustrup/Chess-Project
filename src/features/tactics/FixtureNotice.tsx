import { FlaskConical } from 'lucide-react'
import { useTacticsData } from './useTacticsData'

/** Small badge shown only in test mode (?fixture=1), so test lessons are never mistaken for the real course. */
export default function FixtureNotice() {
  const { fixture } = useTacticsData()
  if (!fixture) return null
  return (
    <span className="chip gold zen-hide" title="You opened this page with ?fixture=1: these lessons are only for checking the page.">
      <FlaskConical size={14} aria-hidden /> Test lessons
    </span>
  )
}
