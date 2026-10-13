// Small date and text helpers for the dashboard.
// Days are always compared in the player's own local time, so "today" means the player's today.

/** Local calendar day as 'YYYY-MM-DD'. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Local calendar day of an ISO timestamp, or null when the text is not a date. */
export function isoToDayKey(iso: string | undefined): string | null {
  if (!iso) return null
  const time = new Date(iso)
  return Number.isNaN(time.getTime()) ? null : dayKey(time)
}

/** The day `offset` days away from `from` (negative = in the past). */
export function shiftDay(from: Date, offset: number): Date {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  next.setDate(next.getDate() + offset)
  return next
}

/** Whole calendar days between an ISO timestamp and now (0 = today). Null when the text is not a date. */
export function daysAgo(iso: string | undefined, now: Date): number | null {
  const key = isoToDayKey(iso)
  if (!key) return null
  const [y, m, d] = key.split('-').map(Number)
  const then = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today.getTime() - then.getTime()) / 86_400_000)
}

/** "Today", "Yesterday", "3 days ago", or a short date like "12 Oct". */
export function relativeDay(iso: string | undefined, now: Date): string {
  const days = daysAgo(iso, now)
  if (days === null) return ''
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function greetingFor(now: Date): string {
  const hour = now.getHours()
  if (hour < 5) return 'Hello'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function longDate(now: Date): string {
  return now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`
}

/** 'discoveredAttack' -> 'Discovered attack', 'mateIn2' -> 'Mate in 2' (Lichess theme keys made readable). */
export function prettyTheme(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/_/g, ' ').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** 'Caro-Kann Defence' -> 'Caro-Kann', 'London System' -> 'London' (short name for headlines). */
export function shortCourseName(name: string): string {
  return name.replace(/\s+(System|Defen[cs]e)$/i, '')
}
