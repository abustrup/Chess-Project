import { useEffect, useState } from 'react'
import { FIRST_CHECK_GAME, VERDICT_URL, parseVerdict, type StudyVerdict } from './study'

// verdict.json only exists from the first check on (game 110), so before that nothing is asked at all.

async function loadVerdict(signal: AbortSignal): Promise<StudyVerdict | null> {
  try {
    const res = await fetch(VERDICT_URL, { cache: 'no-cache', signal })
    return res.ok ? parseVerdict(await res.json()) : null
  } catch {
    return null // missing, offline, or not JSON: the card simply shows no verdict
  }
}

/** The verdict the daily job wrote, or null (none yet, or fewer than 110 games so it cannot exist). */
export function useStudyVerdict(games: number): StudyVerdict | null {
  const enabled = games >= FIRST_CHECK_GAME
  const [verdict, setVerdict] = useState<StudyVerdict | null>(null)
  useEffect(() => {
    if (!enabled) return
    const ctrl = new AbortController()
    void loadVerdict(ctrl.signal).then((v) => {
      if (!ctrl.signal.aborted) setVerdict(v)
    })
    return () => ctrl.abort()
  }, [enabled])
  return enabled ? verdict : null
}
