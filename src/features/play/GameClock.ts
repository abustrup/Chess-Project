// A chess clock that does not depend on timers: it remembers when the running side started, so the
// time left is always exact, even if the browser slows the tab down.

import type { Side } from '../../types'

export class GameClock {
  /** False for games without a clock: every method then does nothing and time left is "infinite". */
  readonly enabled: boolean
  private left: Record<Side, number>
  private running: Side | null = null
  private since = 0

  constructor(
    private readonly incrementMs: number,
    start: { w: number; b: number } | null,
  ) {
    this.enabled = start !== null
    this.left = { white: start?.w ?? Infinity, black: start?.b ?? Infinity }
  }

  /** Milliseconds left for a side, including the time it is using right now. */
  remaining(side: Side): number {
    if (!this.enabled) return Infinity
    const used = this.running === side ? Date.now() - this.since : 0
    return Math.max(0, this.left[side] - used)
  }

  isRunning(side: Side): boolean {
    return this.enabled && this.running === side
  }

  /**
   * Make `next` the side whose clock runs (null = stop both). The side that was running pays for the time
   * it used, and gets the increment if `addIncrement` is set (it just made a move).
   */
  runFor(next: Side | null, addIncrement = false) {
    if (!this.enabled) return
    const now = Date.now()
    if (this.running) {
      this.left[this.running] = this.remaining(this.running) + (addIncrement ? this.incrementMs : 0)
    }
    this.running = next
    this.since = now
  }

  /** The side whose time has run out, if any. */
  flagged(): Side | null {
    if (!this.enabled) return null
    if (this.running && this.remaining(this.running) <= 0) return this.running
    return null
  }

  /** Time left on both clocks, for saving the game. */
  snapshot(): { w: number; b: number } | null {
    if (!this.enabled) return null
    return { w: this.remaining('white'), b: this.remaining('black') }
  }
}
