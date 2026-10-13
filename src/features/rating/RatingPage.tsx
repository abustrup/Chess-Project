import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RatingEstimate } from '../../types'
import { DEFAULT_PROFILE } from '../../types'
import { KEYS, readStored, useStored, writeStored } from '../../lib/storage'
import { removeGames, storedGamesSize, useGames } from '../review/gameStore'
import { useAnalysisRun } from '../review/useAnalysisRun'
import type { AddMode } from './AddGames'
import EstimateBreakdown from './EstimateBreakdown'
import EstimateHero from './EstimateHero'
import GamesPanel from './GamesPanel'
import WorkOnPanel from './WorkOnPanel'
import { evidenceFromGame } from './evidence'
import { estimateRating, type EstimateDetail } from './estimate'
import { computeInsights } from './insights'
import './rating.css'

// /rating — your games, the estimated rating, how it was worked out, and what to work on.

const NOTHING_OFF: string[] = []

/** The part of the detailed estimate that is saved for other pages (Home shows it). */
function toStored(d: EstimateDetail): RatingEstimate {
  return {
    elo: d.elo,
    low: d.low,
    high: d.high,
    gamesUsed: d.gamesUsed,
    notes: d.notes,
    parts: d.parts.map((p) => ({ label: p.label, elo: p.elo, weight: p.weight })),
    computedAt: d.computedAt,
  }
}

function sameEstimate(a: RatingEstimate | null, b: RatingEstimate | null): boolean {
  if (!a || !b) return a === b
  return (
    a.elo === b.elo &&
    a.low === b.low &&
    a.high === b.high &&
    a.gamesUsed === b.gamesUsed &&
    a.parts.length === b.parts.length &&
    a.parts.every((p, i) => p.elo === b.parts[i].elo && Math.abs(p.weight - b.parts[i].weight) < 0.005)
  )
}

export default function RatingPage() {
  const [games] = useGames()
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  // ids of games the user switched OFF, so new games count by default
  const [offList, setOffList] = useStored<string[]>('rating.off', NOTHING_OFF)
  const off = useMemo(() => new Set(offList), [offList])
  const [addMode, setAddMode] = useState<AddMode>(null)
  const { state: run, run: startRun, cancel } = useAnalysisRun()

  const counted = useMemo(() => games.filter((g) => !off.has(g.id)), [games, off])
  const detail = useMemo(
    () => estimateRating(counted.map(evidenceFromGame), profile.selfRating),
    [counted, profile.selfRating],
  )
  const insights = useMemo(() => computeInsights(counted), [counted])

  // keep the saved estimate (used by the Home page) in step with what is shown here
  useEffect(() => {
    const next = detail.gamesUsed > 0 ? toStored(detail) : null
    if (!sameEstimate(readStored<RatingEstimate | null>(KEYS.ratingEstimate, null), next)) writeStored(KEYS.ratingEstimate, next)
  }, [detail])

  const toggle = useCallback(
    (id: string) => setOffList((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])),
    [setOffList],
  )
  const setAll = useCallback((on: boolean) => setOffList(on ? [] : games.map((g) => g.id)), [games, setOffList])
  const remove = useCallback(
    (id: string) => {
      removeGames([id])
      setOffList((cur) => cur.filter((x) => x !== id))
    },
    [setOffList],
  )

  const openAdd = (mode: 'lichess' | 'paste') => {
    setAddMode(mode)
    window.setTimeout(() => document.getElementById('rt-games')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const analyseAll = () => void startRun(games.filter((g) => !g.analysis))

  return (
    <div className="page rating-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Your strength</div>
          <h1>My rating</h1>
          <p>An estimate of how strong you really play, worked out from your games.</p>
        </div>
      </div>

      <div className="rt-stack">
        <EstimateHero detail={detail} onAdd={openAdd} />
        <GamesPanel
          games={games}
          off={off}
          onToggle={toggle}
          onSetAll={setAll}
          onDelete={remove}
          addMode={addMode}
          onAddMode={setAddMode}
          run={run}
          onAnalyseAll={analyseAll}
          onCancel={cancel}
          storedSize={storedGamesSize(games)}
        />
        {detail.gamesUsed > 0 && <EstimateBreakdown detail={detail} />}
        <WorkOnPanel insights={insights} />
      </div>
    </div>
  )
}
