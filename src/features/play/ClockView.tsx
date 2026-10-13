import { useEffect, useRef, useState } from 'react'
import { playSound } from '../../lib/sound'
import type { Side } from '../../types'
import type { GameClock } from './GameClock'
import { formatClock } from './timeControls'

/**
 * One side's clock. It redraws itself ten times a second, so the rest of the screen does not have to.
 * When the player's own clock is nearly out, it ticks once per second.
 */
export default function ClockView({ clock, side, ticks }: { clock: GameClock; side: Side; ticks: boolean }) {
  const [, redraw] = useState(0)
  const lastSecond = useRef(-1)

  useEffect(() => {
    const timer = setInterval(() => redraw((n) => n + 1), 100)
    return () => clearInterval(timer)
  }, [])

  const ms = clock.remaining(side)
  const running = clock.isRunning(side)
  const second = Math.ceil(ms / 1000)
  useEffect(() => {
    if (ticks && running && ms < 10_000 && ms > 0 && second !== lastSecond.current) playSound('tick')
    lastSecond.current = second
  }, [ticks, running, ms, second])

  const low = ms < 20_000
  return (
    <div
      className={`clock ${running ? 'active' : ''} ${low ? 'low' : ''}`}
      role="timer"
      aria-label={`${side === 'white' ? 'White' : 'Black'} clock`}
    >
      {formatClock(ms)}
    </div>
  )
}
