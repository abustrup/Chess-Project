import { useCallback, useMemo } from 'react'
import { DEFAULT_PROFILE, type Profile } from '../../../types'
import { KEYS, useStored } from '../../../lib/storage'
import { cleanProfile } from '../sanitize'

/**
 * The saved profile for the Settings page, always in the right shape (an old or damaged profile would
 * otherwise show "null" in a box or no ticked choice). Every change is saved on top of the cleaned
 * profile, so the first change also repairs it.
 */
export function useProfile(): [Profile, (patch: Partial<Profile>) => void] {
  const [stored, setStored] = useStored<unknown>(KEYS.profile, DEFAULT_PROFILE)
  const profile = useMemo(() => cleanProfile(stored), [stored])
  const change = useCallback(
    (patch: Partial<Profile>) => setStored((previous: unknown) => ({ ...cleanProfile(previous), ...patch })),
    [setStored],
  )
  return [profile, change]
}
