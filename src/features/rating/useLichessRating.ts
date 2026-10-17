import { useCallback, useEffect, useMemo, useState } from 'react'
import { readStored, useStored, writeStored } from '../../lib/storage'
import { LichessRatingError, fetchLichessRatings, parseLichessUser, type LichessRatings } from './lichessRating'

// Keeps the live Lichess ratings in step for any page that shows them (My rating, the Home card).
// The last answer is saved with its time, so the page works offline and says "as of <date>".
// Etiquette: one request at a time (a second page asking at once shares the first request), no request when a
// recent answer is saved, and a one-minute pause after Lichess says "slow down" (shared with the game import).

const CACHE_KEY = 'rating.lichessLive'
/** Same key as the game import's pause: a "slow down" from Lichess counts for both. */
const WAIT_KEY = 'rating.lichessWaitUntil'
const WAIT_MS = 60_000

export type LiveStatus = 'no-user' | 'loading' | 'live' | 'cached' | 'error'

export interface LiveRating {
  /** the saved answer for this username (fresh or older), or null */
  ratings: LichessRatings | null
  status: LiveStatus
  busy: boolean
  error: LichessRatingError | null
  refresh: () => void
}

const inFlight = new Map<string, Promise<LichessRatings>>()

/** The saved answer, if it belongs to this username and still looks right. */
function savedFor(value: unknown, username: string): LichessRatings | null {
  if (!value || typeof value !== 'object' || !username) return null
  const v = value as Partial<LichessRatings>
  if (typeof v.username !== 'string' || typeof v.fetchedAt !== 'string') return null
  if (v.username.toLowerCase() !== username.toLowerCase()) return null
  return parseLichessUser(v, v.username, v.fetchedAt)
}

function ageMs(r: LichessRatings): number {
  const t = Date.parse(r.fetchedAt)
  return Number.isNaN(t) ? Infinity : Date.now() - t
}

/**
 * `username` should already be cleaned (empty when there is none).
 * `maxAgeMs`: a saved answer younger than this is used as it is, without asking Lichess again.
 */
export function useLichessRating(username: string, maxAgeMs: number): LiveRating {
  const [saved] = useStored<unknown>(CACHE_KEY, null)
  const ratings = useMemo(() => savedFor(saved, username), [saved, username])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<LichessRatingError | null>(null)
  const [asked, setAsked] = useState(0) // "Check again" presses

  useEffect(() => {
    setError(null)
    if (!username) return
    const current = savedFor(readStored<unknown>(CACHE_KEY, null), username)
    if (asked === 0 && current && ageMs(current) < maxAgeMs) return
    if (Date.now() < readStored<number>(WAIT_KEY, 0)) {
      setError(new LichessRatingError('rate-limit', 'Lichess asked the app to slow down for a minute.'))
      return
    }
    let alive = true
    const key = username.toLowerCase()
    // Not aborted when the page closes: the answer is still worth saving, and one request is cheap.
    let request = inFlight.get(key)
    if (!request) {
      request = fetchLichessRatings(username).finally(() => inFlight.delete(key))
      inFlight.set(key, request)
    }
    setBusy(true)
    request.then(
      (fresh) => {
        writeStored(CACHE_KEY, fresh)
        if (alive) setBusy(false)
      },
      (e: unknown) => {
        const err = e instanceof LichessRatingError ? e : new LichessRatingError('network', 'I could not reach Lichess.')
        if (err.kind === 'rate-limit') writeStored(WAIT_KEY, Date.now() + WAIT_MS)
        if (alive) {
          setBusy(false)
          setError(err)
        }
      },
    )
    return () => {
      alive = false
    }
  }, [username, maxAgeMs, asked])

  const refresh = useCallback(() => setAsked((n) => n + 1), [])

  const status: LiveStatus = !username
    ? 'no-user'
    : ratings
      ? error
        ? 'cached'
        : 'live'
      : error
        ? 'error'
        : 'loading'
  return { ratings, status, busy, error, refresh }
}
