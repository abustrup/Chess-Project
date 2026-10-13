import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameRecord } from '../../types'
import { analyseGames, isAbortError } from './analyse'

// React glue for the analysis engine: start a run, show progress, cancel it, and make sure the
// Stockfish worker is switched off when the page goes away.

export interface RunState {
  running: boolean
  /** 0-based index of the game being analysed and how many games are in this run */
  gameIndex: number
  gameCount: number
  /** positions done / total inside the current game */
  done: number
  total: number
  error: string | null
  /** results of the last finished run */
  analysed: number
  failed: number
  durationMs: number | null
}

const IDLE: RunState = {
  running: false,
  gameIndex: 0,
  gameCount: 0,
  done: 0,
  total: 0,
  error: null,
  analysed: 0,
  failed: 0,
  durationMs: null,
}

/** 0..1 progress over the whole run (all games). */
export function runFraction(s: RunState): number {
  if (!s.running || s.gameCount === 0) return 0
  const inGame = s.total ? s.done / s.total : 0
  return (s.gameIndex + inGame) / s.gameCount
}

export function useAnalysisRun() {
  const [state, setState] = useState<RunState>(IDLE)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  const run = useCallback(async (games: GameRecord[], depth?: number) => {
    controller.current?.abort()
    const mine = new AbortController()
    controller.current = mine
    const started = performance.now()
    setState({ ...IDLE, running: true, gameCount: games.length })
    try {
      const result = await analyseGames(games, {
        depth,
        signal: mine.signal,
        onProgress: (p) => setState((s) => (controller.current === mine ? { ...s, ...p } : s)),
      })
      if (controller.current !== mine) return
      setState({
        ...IDLE,
        gameCount: games.length,
        analysed: result.analysed,
        failed: result.failed.length,
        durationMs: performance.now() - started,
        error: result.failed[0]?.message ?? null,
      })
    } catch (e) {
      if (controller.current !== mine) return // a newer run took over
      setState(
        isAbortError(e)
          ? IDLE
          : { ...IDLE, error: e instanceof Error ? e.message : 'The analysis stopped unexpectedly.' },
      )
    }
  }, [])

  const cancel = useCallback(() => controller.current?.abort(), [])

  return { state, run, cancel }
}
