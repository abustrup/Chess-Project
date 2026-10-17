import { useEffect, useMemo, useState } from 'react'
import type { SafetyCard } from '../../types'
import { KEYS, useStored } from '../../lib/storage'
import { localDay, safetyDueToday } from '../safety/queue'
import { readDay } from '../safety/stored'
import type { SafetyToday } from './progress'

// Today's Safety-check numbers for Home's plan (build plan H2). Only once the study gate is open: while it is locked
// Home must stay exactly as H1 left it and must not download the positions, so the card file (and the code that
// checks it) is fetched here on demand, never before the unlock. The count is the trainer's own (safetyDueToday in
// queue.ts), so Home and /safety always agree.

/**
 * Today's numbers. With the card file, the trainer's full plan for today; without it (still loading), what today's
 * saved queue says, or "not counted yet" when the trainer has not planned today. Call it only with the gate open.
 */
export function safetyTodayFrom(cards: readonly SafetyCard[] | null, now: Date): SafetyToday {
  const saved = readDay()
  const today = saved && saved.date === localDay(now) ? saved : null
  return {
    left: safetyDueToday(cards, now),
    answered: today ? today.done.length + today.repeatsDone.length : 0,
    positions: cards ? cards.length : null,
  }
}

type Cards = { status: 'loading' } | { status: 'ready'; cards: readonly SafetyCard[] } | { status: 'failed' }

/** React: today's Safety-check numbers, or null while the trainer is locked (then Home shows H1's plan unchanged). */
export function useSafetyToday(unlocked: boolean, now: Date): SafetyToday | null {
  const [file, setFile] = useState<Cards>({ status: 'loading' })
  // the trainer saves to these keys; listening to them re-counts after every answer (also from another tab)
  const [day] = useStored<unknown>(KEYS.safetyDay, null)
  const [state] = useStored<unknown>(KEYS.safetyState, null)
  const [settings] = useStored<unknown>(KEYS.safetySettings, null)

  useEffect(() => {
    if (!unlocked) return
    let live = true
    import('../safety/cards')
      .then(({ loadSafetyCards }) => loadSafetyCards())
      .then(
        (loaded) => live && setFile({ status: 'ready', cards: loaded.cards }),
        () => live && setFile({ status: 'failed' }),
      )
    return () => {
      live = false
    }
  }, [unlocked])

  return useMemo(() => {
    if (!unlocked) return null
    if (file.status === 'failed') return { left: null, answered: 0, positions: null, failed: true }
    return safetyTodayFrom(file.status === 'ready' ? file.cards : null, now)
    // day, state and settings are read inside (through storage); they are listed so a save re-counts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, file, now, day, state, settings])
}
