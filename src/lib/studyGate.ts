import { useEffect, useSyncExternalStore } from 'react'
import { readStored, writeStored } from './storage'

// The study gate: how many of Alexander's games count for the pre-registered study
// (research/2026-10-16-diagnosis/preregistration.md), which phase that puts him in, and whether the Safety-check
// trainer is open. It opens by itself after his 40th rated 10+0 game on Lichess.
//
// The count must equal the measuring instrument's, so `isEligible` mirrors `eligible()` in
// research/2026-10-16-diagnosis/prereg/measure.py rule for rule (Python truthiness and whitespace included), and
// scripts/check-gate-parity.py runs both on src/lib/fixtures/study-gate-cases.ndjson.
//
// Where the number comes from, best first: Lichess's public game export (live), the daily job's
// data/study/status.json, the last value saved in this browser (cc.study.gate), otherwise "locked".
// At most one check every 10 minutes, always in the background: the saved value renders at once.
// There is deliberately no way to unlock it by hand (no URL flag, no setting): an early unlock spoils the study.

export const STUDY_USER = 'abustrup'
/** 2026-10-16 00:00 UTC, the same `since` as measure.py (SINCE_MS). */
export const STUDY_SINCE_MS = 1792108800000
export const STUDY_TC = '600+0'
/** verdict.py DESIGN: games 1-10 warm-up, 11-40 baseline, unlock after 40, 20 wash-in, then 50 and 100 measured. */
export const UNLOCK_AFTER_GAME = 40
const WARM_UP_GAMES = 10
const BASELINE_LAST_GAME = 40
const WASH_IN_GAMES = 20
const FIRST_LOOK_GAMES = 50
const FINAL_LOOK_GAMES = 100
const LAST_STUDY_GAME = 160

/** Saved under 'cc.' + this key by storage.ts, so it is cc.study.gate (and Settings backup covers it). */
export const GATE_CACHE_KEY = 'study.gate'
export const CHECK_EVERY_MS = 10 * 60 * 1000
const TIMEOUT_MS = 20_000

/** The same filter query as measure.py's fetch (rated, rapid, since the study start); fields beyond the defaults are not needed. */
export const LICHESS_EXPORT_URL =
  `https://lichess.org/api/games/user/${STUDY_USER}?rated=true&perfType=rapid&sort=dateAsc&since=${STUDY_SINCE_MS}`
export const STATUS_URL = `${import.meta.env?.BASE_URL ?? '/'}data/study/status.json`

export type StudyPhase = 'warm-up' | 'baseline' | 'waiting' | 'wash-in' | 'measured' | 'finished'
/** 'lichess' = counted live just now, 'daily job' = status.json, 'cache' = saved earlier in this browser, 'none' = unknown. */
export type GateSource = 'lichess' | 'daily job' | 'cache' | 'none'

export interface StudyGate {
  /** Rated 10+0 games that count, by measure.py's rule. 0 when `source` is 'none' (unknown, not "no games"). */
  eligibleGames: number
  /** The trainer opens once eligibleGames reaches this (40; never lower). */
  unlockAfterGame: number
  phase: StudyPhase
  unlocked: boolean
  /** When the count was true (ISO time), or null when unknown. */
  asOf: string | null
  source: GateSource
  /** The next step in the study, e.g. { game: 40, label: 'the Safety-check trainer opens' }; null after game 160. */
  nextMilestone: { game: number; label: string } | null
}

export const PHASE_LABELS: Record<StudyPhase, string> = {
  'warm-up': 'Warm-up (not counted)',
  baseline: 'Before the trainer',
  waiting: 'Waiting for the trainer (not counted)',
  'wash-in': 'Trainer started (not measured yet)',
  measured: 'Trainer, measured',
  finished: 'Study finished',
}

/* ---------------- measure.py's eligible(), rule for rule ---------------- */

/** One game from Lichess's NDJSON export. Only the fields the rule reads are named; anything may be missing. */
export type ExportGame = Record<string, unknown>

const NOT_PLAYED = ['created', 'started', 'aborted', 'noStart', 'unknownFinish']
// Python's str.split() whitespace; a move list counts when it has one character outside this set
const PY_NOT_SPACE = /[^\t\n\x0b\x0c\r\x1c-\x1f \x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/

function asObject(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
}

/** Python's bool(): empty lists and objects are false too. */
function pyTruthy(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0
  if (v && typeof v === 'object') return Object.keys(v).length > 0
  return Boolean(v)
}

/** Python's == for the JSON values a clock can hold (True == 1 there). */
function pyEq(a: unknown, b: unknown): boolean {
  const n = (v: unknown) => (typeof v === 'boolean' ? Number(v) : v)
  return n(a) === n(b)
}

function parseTc(tc: string): [number, number] {
  const m = /^\s*(\d+)\s*\+\s*(\d+)\s*$/.exec(tc)
  if (!m) throw new Error(`time control must look like 600+0, got ${tc}`)
  return [Number(m[1]), Number(m[2])]
}

/**
 * measure.py `eligible(g, tc)`: rated, standard, not from a position, no BOT on either side, the exact clock,
 * actually played (not created, started, aborted, noStart or unknownFinish) and at least one move by anyone.
 * tc 'any' (tests only) accepts every clock. Where measure.py would crash on a malformed game, this says false.
 */
export function isEligible(g: ExportGame, tc: string = STUDY_TC): boolean {
  // measure.py raises on a clock that is not an object, a missing or non-object player, or a user that is not an
  // object; those games say false here (Lichess always sends both players)
  if (pyTruthy(g.clock) && !asObject(g.clock)) return false
  const clock = asObject(g.clock) ?? {}
  const [base, inc]: unknown[] = tc === 'any' ? [clock.initial, clock.increment] : parseTc(tc)
  const players = asObject(g.players)
  const sides = (['white', 'black'] as const).map((side) => asObject(players?.[side]))
  if (sides.some((s) => !s || (pyTruthy(s.user) && !asObject(s.user)))) return false
  const bot = sides.some((s) => asObject(s?.user)?.title === 'BOT')
  const moves = Object.hasOwn(g, 'moves') ? g.moves : ''
  return (
    pyTruthy(g.rated) &&
    g.variant === 'standard' &&
    !Object.hasOwn(g, 'initialFen') &&
    !bot &&
    pyEq(clock.initial, base) &&
    pyEq(clock.increment, inc) &&
    !NOT_PLAYED.includes(g.status as string) &&
    typeof moves === 'string' &&
    PY_NOT_SPACE.test(moves)
  )
}

/** The games measure.py numbers 1, 2, 3 ...: eligible ones in order of start time (a stable sort, like Python's). */
export function studyGames(games: ExportGame[], tc: string = STUDY_TC): ExportGame[] {
  return games.filter((g) => isEligible(g, tc)).sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
}

/** Lichess NDJSON to games. null when any line is not a JSON object, so a cut-off answer never under-counts. */
export function parseExport(text: string): ExportGame[] | null {
  const games: ExportGame[] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try {
      const g = asObject(JSON.parse(line))
      if (!g) return null
      games.push(g)
    } catch {
      return null
    }
  }
  return games
}

/* ---------------- phases ---------------- */

/**
 * The phase of the latest counted game. `windowsU` is the game after which the trainer actually became available
 * (status.json `U`, normally 40); a later U moves every window after the baseline, as in verdict.windows().
 */
export function phaseOf(games: number, windowsU: number = UNLOCK_AFTER_GAME): StudyPhase {
  if (games <= WARM_UP_GAMES) return 'warm-up'
  if (games <= Math.min(BASELINE_LAST_GAME, windowsU)) return 'baseline'
  if (games <= windowsU) return 'waiting'
  if (games <= windowsU + WASH_IN_GAMES) return 'wash-in'
  if (games <= windowsU + WASH_IN_GAMES + FINAL_LOOK_GAMES) return 'measured'
  return 'finished'
}

export function nextMilestoneOf(
  games: number,
  unlockAfterGame: number = UNLOCK_AFTER_GAME,
  windowsU: number = unlockAfterGame,
): StudyGate['nextMilestone'] {
  const steps = [
    { game: WARM_UP_GAMES, label: 'the warm-up ends and your "before" games start' },
    { game: unlockAfterGame, label: 'the Safety-check trainer opens' },
    { game: windowsU + WASH_IN_GAMES, label: 'training games start to count' },
    { game: windowsU + WASH_IN_GAMES + FIRST_LOOK_GAMES, label: 'the first check' },
    { game: windowsU + WASH_IN_GAMES + FINAL_LOOK_GAMES, label: 'the final check' },
  ]
  return steps.find((s) => s.game > games) ?? null
}

/** Never below 40 (an earlier unlock would leave fewer than 30 "before" games) and never past the study's end. */
function cleanUnlockAfter(v: unknown): number {
  return Number.isInteger(v) && (v as number) >= UNLOCK_AFTER_GAME && (v as number) <= LAST_STUDY_GAME
    ? (v as number)
    : UNLOCK_AFTER_GAME
}

/** status.json U: the windows move only when the trainer came later than the unlock, never earlier. */
function cleanWindowsU(v: unknown, unlockAfterGame: number): number {
  return Number.isInteger(v) && (v as number) >= unlockAfterGame ? (v as number) : unlockAfterGame
}

export interface GateInput {
  eligibleGames: number
  unlockAfterGame?: number
  windowsU?: number
  asOf?: string | null
  source?: GateSource
}

/** The gate for a known count (also how the checks inject counts). */
export function gateFor(input: GateInput): StudyGate {
  const unlockAfterGame = cleanUnlockAfter(input.unlockAfterGame)
  const windowsU = cleanWindowsU(input.windowsU, unlockAfterGame)
  const n = Number.isInteger(input.eligibleGames) && input.eligibleGames >= 0 ? input.eligibleGames : 0
  return {
    eligibleGames: n,
    unlockAfterGame,
    phase: phaseOf(n, windowsU),
    unlocked: n >= unlockAfterGame,
    asOf: input.asOf ?? null,
    source: input.source ?? 'none',
    nextMilestone: nextMilestoneOf(n, unlockAfterGame, windowsU),
  }
}

/* ---------------- sources: Lichess, status.json, the saved value ---------------- */

export interface GateRecord {
  eligibleGames: number
  unlockAfterGame: number
  windowsU: number
  asOf: string
  from: 'lichess' | 'daily job'
}
export interface GateCache {
  record: GateRecord | null
  /** When the last check started (ms), successful or not; checks are at least CHECK_EVERY_MS apart. */
  checkedAt: number
}

function cleanRecord(v: unknown, from?: GateRecord['from']): GateRecord | null {
  const o = asObject(v)
  if (!o) return null
  const n = o.eligibleGames
  const asOf = o.asOf
  const src = from ?? o.from
  if (!Number.isInteger(n) || (n as number) < 0) return null
  if (typeof asOf !== 'string' || Number.isNaN(Date.parse(asOf))) return null
  if (src !== 'lichess' && src !== 'daily job') return null
  const unlockAfterGame = cleanUnlockAfter(o.unlockAfterGame)
  return {
    eligibleGames: n as number,
    unlockAfterGame,
    windowsU: cleanWindowsU(from ? o.U : o.windowsU, unlockAfterGame), // status.json calls it U
    asOf,
    from: src,
  }
}

/** The daily job's public/data/study/status.json (fields asOf, eligibleGames, unlockAfterGame, U), checked. */
export function statusRecord(json: unknown): GateRecord | null {
  return cleanRecord(json, 'daily job')
}

export function cleanCache(v: unknown): GateCache {
  const o = asObject(v)
  const checkedAt = o && typeof o.checkedAt === 'number' && Number.isFinite(o.checkedAt) ? o.checkedAt : 0
  return { record: cleanRecord(o?.record), checkedAt }
}

const fresher = (a: GateRecord, b: GateRecord) => Date.parse(a.asOf) > Date.parse(b.asOf)

/**
 * Which value to trust after a check. The live Lichess count wins (its threshold comes from status.json, then the
 * saved value, then 40). Without it: status.json, unless the saved value is newer (a count from Lichess an hour ago
 * beats last night's job, so the trainer never locks again after it opened). Without either: nothing.
 */
export function pickRecord(
  live: number | null,
  status: GateRecord | null,
  saved: GateRecord | null,
  now: number,
): { record: GateRecord; source: GateSource } | null {
  if (live !== null) {
    const known = status ?? saved
    return {
      record: {
        eligibleGames: live,
        unlockAfterGame: known?.unlockAfterGame ?? UNLOCK_AFTER_GAME,
        windowsU: known?.windowsU ?? UNLOCK_AFTER_GAME,
        asOf: new Date(now).toISOString(),
        from: 'lichess',
      },
      source: 'lichess',
    }
  }
  // a saved value stamped in the future (a changed clock, an edited backup) never beats status.json
  const savedNewer = !!saved && !!status && fresher(saved, status) && Date.parse(saved.asOf) <= now
  if (status && !savedNewer) return { record: status, source: 'daily job' }
  if (saved) return { record: saved, source: 'cache' }
  return null
}

/** Everything a check touches, so the checks can run it without a browser or a network. */
export interface GateIo {
  now: () => number
  fetch: (url: string, init?: RequestInit) => Promise<Response>
  readCache: () => unknown
  writeCache: (cache: GateCache) => void
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    return await run(ctrl.signal)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * A line measure.py can read at all: a game id and both players. Anything else (an error object, a page that is not
 * the export) spoils the whole answer, as it would stop measure.py, so it never shows up as a live count of 0.
 */
export function isExportGame(g: ExportGame): boolean {
  const players = asObject(g.players)
  return typeof g.id === 'string' && !!asObject(players?.white) && !!asObject(players?.black)
}

/** One request to Lichess's public export; the number of games that count, or null on any failure (429 included). */
async function fetchLiveCount(io: GateIo): Promise<number | null> {
  try {
    return await withTimeout(async (signal) => {
      const res = await io.fetch(LICHESS_EXPORT_URL, {
        headers: { Accept: 'application/x-ndjson' },
        cache: 'no-store',
        signal,
      })
      if (!res.ok) return null
      const games = parseExport(await res.text())
      return games && games.every(isExportGame) ? studyGames(games).length : null
    })
  } catch {
    return null
  }
}

async function fetchStatus(io: GateIo): Promise<GateRecord | null> {
  try {
    return await withTimeout(async (signal) => {
      const res = await io.fetch(STATUS_URL, { cache: 'no-cache', signal })
      return res.ok ? statusRecord(await res.json()) : null
    })
  } catch {
    return null
  }
}

export interface GateCheck {
  /** false when the last check was under 10 minutes ago, so nothing was asked */
  checked: boolean
  result: { record: GateRecord; source: GateSource } | null
}

/** One background check: Lichess and status.json together, at most once per CHECK_EVERY_MS (across tabs too). */
export async function checkStudyGate(io: GateIo): Promise<GateCheck> {
  const now = io.now()
  const cache = cleanCache(io.readCache())
  if (cache.checkedAt && now >= cache.checkedAt && now - cache.checkedAt < CHECK_EVERY_MS) {
    return { checked: false, result: null }
  }
  // claim the slot before asking, so a failed check or a second tab also waits 10 minutes
  io.writeCache({ ...cache, checkedAt: now })
  const [live, status] = await Promise.all([fetchLiveCount(io), fetchStatus(io)])
  const result = pickRecord(live, status, cache.record, now)
  if (result && result.source !== 'cache') io.writeCache({ record: result.record, checkedAt: now })
  return { checked: true, result }
}

/* ---------------- the app's view: sync read, background refresh, React hook ---------------- */

let written: GateCache | null = null // kept in memory too, for browsers that refuse to save (private mode)
const browserIo: GateIo = {
  now: () => Date.now(),
  fetch: (url, init) => fetch(url, init),
  readCache: () => {
    const saved = readStored<unknown>(GATE_CACHE_KEY, null)
    return written && cleanCache(saved).checkedAt < written.checkedAt ? written : saved
  },
  writeCache: (cache) => {
    written = cache
    writeStored(GATE_CACHE_KEY, cache)
  },
}

let session: GateRecord | null = null // confirmed by a check in this page session
let inflight: Promise<StudyGate> | null = null
const listeners = new Set<() => void>()
let memo: { session: GateRecord | null; saved: unknown; gate: StudyGate } | null = null

/** The gate right now, without waiting: this session's check, else the saved value, else locked. */
export function readGateSync(): StudyGate {
  const saved = browserIo.readCache() // same object while the stored text is unchanged
  if (memo && memo.session === session && memo.saved === saved) return memo.gate
  const record = cleanCache(saved).record
  const useSaved = record && (!session || fresher(record, session))
  const chosen = useSaved ? record : session
  const gate = chosen
    ? gateFor({ ...chosen, source: useSaved ? 'cache' : chosen.from })
    : gateFor({ eligibleGames: 0, source: 'none' })
  memo = { session, saved, gate }
  return gate
}

/** Starts a check if none ran in the last 10 minutes; resolves with the gate afterwards. Never throws. */
export function refreshStudyGate(): Promise<StudyGate> {
  if (!inflight) {
    inflight = checkStudyGate(browserIo)
      .then((c) => {
        if (c.result && c.result.source !== 'cache') session = c.result.record
      })
      .catch(() => undefined)
      .then(() => {
        inflight = null
        listeners.forEach((l) => l())
        return readGateSync()
      })
  }
  return inflight
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === `cc.${GATE_CACHE_KEY}`) cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * React: `const gate = useStudyGate()`. Renders at once with the saved value, then checks in the background
 * (on mount and when the tab becomes visible again, e.g. back from a game on Lichess), at most every 10 minutes.
 */
export function useStudyGate(): StudyGate {
  const gate = useSyncExternalStore(subscribe, readGateSync, readGateSync)
  useEffect(() => {
    void refreshStudyGate()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshStudyGate()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
  return gate
}
