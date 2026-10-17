import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_PROFILE } from '../../types'
import { KEYS, useStored } from '../../lib/storage'
import { useStudyGate } from '../../lib/studyGate'
import { useStudyVerdict } from '../home/useStudyVerdict'
import { removeGames, storedGamesSize, useGames } from '../review/gameStore'
import { useAnalysisRun } from '../review/useAnalysisRun'
import type { AddMode } from './AddGames'
import GamesPanel from './GamesPanel'
import HistoryCard from './HistoryCard'
import LiveRatingHero from './LiveRatingHero'
import WorkOnPanel from './WorkOnPanel'
import { loadChesscomMap, type ChesscomMap } from './chesscomMap'
import { computeInsights } from './insights'
import { cleanUsername } from './lichessImport'
import { useLichessRating } from './useLichessRating'
import './rating.css'

// /rating — his live Lichess rating (the rating for Lichess games), how it moved, his games, and what to work on.
// The app no longer estimates a rating of its own: see research/2026-10-16-diagnosis/rating/README.md.

const NOTHING_OFF: string[] = []
/** A saved answer younger than this is shown without asking Lichess again (so a quick back-and-forth sends nothing). */
const REFRESH_AFTER_MS = 60_000

export default function RatingPage() {
  const [games] = useGames()
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const username = cleanUsername(profile.lichessUsername ?? '') ?? ''
  const live = useLichessRating(username, REFRESH_AFTER_MS)
  const [map, setMap] = useState<ChesscomMap | null>(null)
  // ids of games the user switched OFF for "What to work on", so new games count by default
  const [offList, setOffList] = useStored<string[]>('rating.off', NOTHING_OFF)
  const off = useMemo(() => new Set(offList), [offList])
  const [addMode, setAddMode] = useState<AddMode>(null)
  const { state: run, run: startRun, cancel } = useAnalysisRun()

  useEffect(() => {
    let alive = true
    void loadChesscomMap().then((m) => alive && setMap(m))
    return () => {
      alive = false
    }
  }, [])

  // Blunder counts, accuracy and average loss only once the study has a verdict (none before game 110).
  const gate = useStudyGate()
  const showNumbers = useStudyVerdict(gate.eligibleGames)?.decided === true
  const counted = useMemo(() => games.filter((g) => !off.has(g.id)), [games, off])
  const insights = useMemo(() => computeInsights(counted, { showNumbers }), [counted, showNumbers])

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

  const openImport = () => {
    setAddMode('lichess')
    window.setTimeout(
      () => document.getElementById('rt-games')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      50,
    )
  }

  const analyseAll = () => void startRun(games.filter((g) => !g.analysis))

  return (
    <div className="page rating-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Your strength</div>
          <h1>My rating</h1>
          <p>Your rating is your Lichess rating, read live from lichess.org.</p>
        </div>
      </div>

      <div className="rt-stack">
        <LiveRatingHero username={username} live={live} map={map} onImport={openImport} />
        {live.ratings && <HistoryCard games={games} ratings={live.ratings} username={username} />}
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
        <WorkOnPanel insights={insights} showNumbers={showNumbers} />
      </div>
    </div>
  )
}
