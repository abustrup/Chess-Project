import { useCallback, useEffect, useSyncExternalStore } from 'react'

// Tiny persistent store on top of localStorage. Everything the app remembers about the user
// (profile, played games, lesson progress, puzzle rating ...) goes through here.
//
// Each feature uses its OWN key (namespaced 'cc.<name>') so features never overwrite each other.

const PREFIX = 'cc.'
const listeners = new Map<string, Set<() => void>>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l())
}

export function readStored<T>(key: string, fallback: T): T {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(PREFIX + key)
  } catch {
    /* private mode etc. */
  }
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value: T = fallback
  if (raw != null) {
    try {
      const parsed = JSON.parse(raw)
      // shallow-merge defaults for plain objects so newly added fields get their default;
      // a damaged value of the wrong shape (e.g. null where an object belongs) falls back to the default
      const objectFallback = fallback && typeof fallback === 'object' && !Array.isArray(fallback)
      const objectParsed = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      value = objectFallback ? (objectParsed ? ({ ...fallback, ...parsed } as T) : fallback) : (parsed as T)
    } catch {
      value = fallback
    }
  }
  cache.set(key, { raw, value })
  return value
}

export function writeStored<T>(key: string, value: T) {
  const raw = JSON.stringify(value)
  try {
    localStorage.setItem(PREFIX + key, raw)
  } catch {
    /* quota or private mode: keep in memory only */
  }
  cache.set(key, { raw, value })
  emit(key)
}

export function removeStored(key: string) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
  cache.delete(key)
  emit(key)
}

function subscribe(key: string, cb: () => void) {
  let set = listeners.get(key)
  if (!set) listeners.set(key, (set = new Set()))
  set.add(cb)
  return () => set!.delete(cb)
}

/**
 * React hook: `const [profile, setProfile] = useStored('profile', DEFAULT_PROFILE)`.
 * `setProfile` accepts a new value or an updater function. Updates are shared between all
 * components (and other browser tabs) that use the same key.
 */
export function useStored<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    (cb) => subscribe(key, cb),
    () => readStored(key, fallback),
    () => fallback,
  )
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFIX + key) emit(key)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStored(key, fallback)
      writeStored(key, typeof next === 'function' ? (next as (p: T) => T)(prev) : next)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )
  return [value, set]
}

/* Well-known keys, so nobody mistypes them. */
export const KEYS = {
  profile: 'profile',
  games: 'games', // GameRecord[]
  openingProgress: 'openingProgress', // owned by the openings feature
  tacticsProgress: 'tacticsProgress', // owned by the tactics feature
  puzzleStats: 'puzzleStats', // owned by the puzzles feature
  ratingEstimate: 'ratingEstimate', // RatingEstimate | null
  // Safety check (src/features/safety/); all under cc.safety.*, so Settings backup covers them
  safetyState: 'safety.state', // SafetyState: review schedule per card
  safetyLog: 'safety.log', // SafetyAttempt[], newest last, capped
  safetySettings: 'safety.settings', // SafetySettings
  safetyDay: 'safety.day', // SafetyDay: today's queue
} as const
