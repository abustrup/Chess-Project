import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  FlipVertical2,
  Microscope,
  Sparkles,
} from 'lucide-react'
import type { BoardArrow, GameRecord, Side } from '../../types'
import Board from '../../components/Board'
import EvalBar from '../../components/EvalBar'
import MoveList from '../../components/MoveList'
import { identifyOpening } from '../../lib/openingName'
import AccuracyCards from './AccuracyCards'
import AnalysisGate from './AnalysisGate'
import AnalysisProgress from './AnalysisProgress'
import CoachBox from './CoachBox'
import EvalGraph from './EvalGraph'
import KeyMoments from './KeyMoments'
import { DEEP_DEPTH } from './analyse'
import { useGames } from './gameStore'
import { symbolFor } from './moveFacts'
import { replayPgn, sansOf, type ReplayedGame } from './pgnGame'
import { useAnalysisRun } from './useAnalysisRun'
import { useTryIt } from './useTryIt'
import './review.css'

// /review/<gameId> — the game review page (chess.com style): board, evaluation bar and graph,
// coloured move list, accuracy cards, key moments and a coach box that explains the current move.

function describeResult(game: GameRecord): string {
  if (game.result === '1/2-1/2') return 'Draw'
  if (game.result === '*') return 'Unfinished game'
  const whiteWon = game.result === '1-0'
  return (whiteWon ? 'white' : 'black') === game.userSide ? 'You won' : 'You lost'
}

function dateText(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function uciArrow(uci: string | undefined, color: string): BoardArrow[] {
  return uci ? [{ from: uci.slice(0, 2), to: uci.slice(2, 4), color }] : []
}

/* ------------------------------------------------------------------------------------------ */

export default function ReviewPage() {
  const { gameId } = useParams()
  const [search] = useSearchParams()
  const [games] = useGames()
  const game = games.find((g) => g.id === gameId)

  if (!game) {
    return (
      <div className="page">
        <div className="card review-missing">
          <h1>I can't find that game</h1>
          <p className="muted">
            It may have been deleted, or it was saved in another browser. Games are stored only on this device.
          </p>
          <div className="row wrap">
            <Link className="btn primary" to="/rating">
              See my games
            </Link>
            <Link className="btn" to="/play">
              Play a new game
            </Link>
          </div>
        </div>
      </div>
    )
  }
  return <ReviewGame key={game.id} game={game} autoStart={search.get('auto') === '1'} />
}

/* ------------------------------------------------------------------------------------------ */

function ReviewGame({ game, autoStart }: { game: GameRecord; autoStart: boolean }) {
  const { state: runState, run, cancel } = useAnalysisRun()
  const [ply, setPly] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [copied, setCopied] = useState(false)

  // The moves come from the PGN, so the board works even before the game has been analysed.
  const replayed = useMemo<ReplayedGame | Error>(() => {
    try {
      return replayPgn(game.pgn)
    } catch (e) {
      return e instanceof Error ? e : new Error('This game cannot be read.')
    }
  }, [game.pgn])
  const plies = replayed instanceof Error ? [] : replayed.plies
  const lastPly = plies.length
  // A saved analysis that does not fit these moves (old or damaged data) is ignored, so the page cannot
  // crash on it and the game can simply be analysed again.
  const analysis = game.analysis && game.analysis.moves.length === lastPly ? game.analysis : undefined

  const tryIt = useTryIt(analysis?.moves ?? [])

  // started right after a finished game: /review/<id>?auto=1
  useEffect(() => {
    if (autoStart && !analysis && !(replayed instanceof Error)) void run([game])
    // only on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goTo = useCallback(
    (next: number) => {
      tryIt.exit()
      setPly(Math.max(0, Math.min(lastPly, next)))
    },
    [lastPly, tryIt],
  )

  // keyboard: left / right step, up / down jump to the start / end
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable))
        return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'ArrowLeft') goTo(ply - 1)
      else if (e.key === 'ArrowRight') goTo(ply + 1)
      else if (e.key === 'ArrowUp' || e.key === 'Home') goTo(0)
      else if (e.key === 'ArrowDown' || e.key === 'End') goTo(lastPly)
      else if (e.key === 'f' || e.key === 'F') setFlipped((v) => !v)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, ply, lastPly])

  if (replayed instanceof Error) {
    return (
      <div className="page">
        <div className="card review-missing">
          <h1>I can't read this game</h1>
          <p className="muted">{replayed.message}</p>
          <Link className="btn primary" to="/rating">
            Back to my games
          </Link>
        </div>
      </div>
    )
  }

  const orientation: Side = flipped ? (game.userSide === 'white' ? 'black' : 'white') : game.userSide
  const moves = analysis?.moves ?? []
  const current = ply > 0 ? moves[ply - 1] : undefined
  const tryMove = tryIt.state ? moves[tryIt.state.ply - 1] : undefined

  /* --- what the board shows ------------------------------------------------------------- */
  let fen = ply === 0 ? replayed.startFen : plies[ply - 1].fenAfter
  let lastMove: [string, string] | null =
    ply > 0 ? [plies[ply - 1].uci.slice(0, 2), plies[ply - 1].uci.slice(2, 4)] : null
  let arrows: BoardArrow[] = []
  let hintSquares: string[] = []
  let interactive: Side | false = false

  if (tryIt.state && tryMove) {
    const { status, acceptedFen, hint } = tryIt.state
    const before = plies[tryMove.ply - 1].fenBefore
    const prev = plies[tryMove.ply - 2]
    lastMove = prev ? [prev.uci.slice(0, 2), prev.uci.slice(2, 4)] : null
    if (status === 'right' || status === 'alternative') {
      fen = acceptedFen ?? before
    } else if (status === 'revealed') {
      const g = new Chess(before)
      if (tryMove.bestUci)
        g.move({ from: tryMove.bestUci.slice(0, 2), to: tryMove.bestUci.slice(2, 4), promotion: tryMove.bestUci[4] })
      fen = g.fen()
      arrows = uciArrow(tryMove.bestUci, 'green')
    } else {
      fen = before
      interactive = game.userSide
      if (hint && tryMove.bestUci) hintSquares = [tryMove.bestUci.slice(0, 2)]
    }
  } else if (
    current &&
    current.bestUci &&
    current.classification !== 'best' &&
    current.classification !== 'good' &&
    current.classification !== 'book'
  ) {
    arrows = uciArrow(current.bestUci, 'green')
  }

  const evalAtPly = analysis ? (ply === 0 ? moves[0].evalBefore : moves[ply - 1].evalAfter) : null

  /* --- move list ---------------------------------------------------------------------------- */
  const listSans = plies.map((p, i) => p.san + (moves[i] ? symbolFor(moves[i].classification) : ''))
  const listClasses: Record<number, string> = {}
  moves.forEach((m, i) => {
    // only the moves worth a look get a colour, so the list stays calm
    if (m.classification !== 'best' && m.classification !== 'good') listClasses[i + 1] = `q-${m.classification}`
  })

  const openingName = game.openingName ?? identifyOpening(sansOf(replayed))?.name

  async function copyPgn() {
    try {
      await navigator.clipboard.writeText(game.pgn)
    } catch {
      const area = document.createElement('textarea')
      area.value = game.pgn
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const names: Record<Side, string> = { white: game.white, black: game.black }
  const elos: Record<Side, number | undefined> = { white: game.whiteElo, black: game.blackElo }
  const topSide: Side = orientation === 'white' ? 'black' : 'white'
  const strip = (side: Side) => (
    <div className="player-strip zen-hide">
      <div className="avatar" aria-hidden>
        {names[side].slice(0, 1).toUpperCase()}
      </div>
      <div>
        <strong>{game.userSide === side ? `${names[side]} (you)` : names[side]}</strong>
        {elos[side] ? <span className="faint"> · {elos[side]}</span> : null}
      </div>
      {analysis && <span className="chip">{Math.round(analysis.accuracy[side])}% accuracy</span>}
    </div>
  )

  const running = runState.running
  const canDeepen = !!analysis && analysis.depth < DEEP_DEPTH && !running

  return (
    <div className="page review-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Game review</div>
          <h1>
            {game.white} <span className="faint">vs</span> {game.black}
          </h1>
          <p>
            {describeResult(game)}
            {dateText(game.date) && ` · ${dateText(game.date)}`}
            {openingName && ` · ${openingName}`}
          </p>
        </div>
        <div className="row wrap">
          <button className="btn small" onClick={copyPgn}>
            <Copy size={14} /> {copied ? 'Copied!' : 'Copy PGN'}
          </button>
          {canDeepen && (
            <button
              className="btn small"
              onClick={() => void run([game], DEEP_DEPTH)}
              title="Look at every position more deeply. It takes a few times longer."
            >
              <Microscope size={14} /> Analyse deeper
            </button>
          )}
        </div>
      </div>

      <div className="board-layout">
        <div className="board-col">
          {strip(topSide)}
          <div className="board-with-eval">
            <EvalBar cpWhite={evalAtPly} orientation={orientation} />
            <Board
              fen={fen}
              orientation={orientation}
              interactive={interactive}
              onMove={tryIt.attempt}
              lastMove={lastMove}
              arrows={arrows}
              hintSquares={hintSquares}
            />
          </div>
          {strip(orientation)}
          <div className="board-nav" role="group" aria-label="Move navigation">
            <button
              className="btn icon"
              onClick={() => goTo(0)}
              disabled={ply === 0}
              aria-label="Go to the start (up arrow)"
            >
              <ChevronsLeft size={20} />
            </button>
            <button
              className="btn icon"
              onClick={() => goTo(ply - 1)}
              disabled={ply === 0}
              aria-label="Previous move (left arrow)"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="board-nav-count faint small">
              {ply} / {lastPly}
            </span>
            <button
              className="btn icon"
              onClick={() => goTo(ply + 1)}
              disabled={ply === lastPly}
              aria-label="Next move (right arrow)"
            >
              <ChevronRight size={20} />
            </button>
            <button
              className="btn icon"
              onClick={() => goTo(lastPly)}
              disabled={ply === lastPly}
              aria-label="Go to the end (down arrow)"
            >
              <ChevronsRight size={20} />
            </button>
            <button
              className="btn icon ghost zen-hide"
              onClick={() => setFlipped((v) => !v)}
              aria-label="Flip the board (F)"
              title="Flip the board (F)"
            >
              <FlipVertical2 size={18} />
            </button>
          </div>
          <p className="faint small review-keys zen-hide">
            Keys: ← → step through moves · ↑ ↓ start / end · F flip the board
          </p>
        </div>

        <div className="side-col">
          <div className="card coach zen-keep">
            {analysis ? (
              <CoachBox
                game={game}
                analysis={analysis}
                ply={ply}
                onJump={goTo}
                tryState={tryIt.state}
                onStartTry={(p) => {
                  setPly(p)
                  tryIt.start(p)
                }}
                onHint={tryIt.showHint}
                onReveal={tryIt.reveal}
                onExitTry={() => {
                  const target = tryIt.state?.ply
                  tryIt.exit()
                  if (target) setPly(target)
                }}
              />
            ) : (
              <AnalysisGate state={runState} onStart={() => void run([game])} onCancel={cancel} plyCount={lastPly} />
            )}
          </div>

          {analysis && running && (
            <div className="card zen-hide">
              <AnalysisProgress state={runState} onCancel={cancel} />
            </div>
          )}
          {runState.error && (
            <div className="callout bad zen-hide" role="alert">
              {runState.error}
            </div>
          )}

          {analysis && (
            <>
              <div className="card zen-hide">
                <div className="card-title">Who was winning</div>
                <EvalGraph moves={moves} ply={ply} onSelect={goTo} userSide={game.userSide} />
                <div className="faint small graph-legend">
                  Light area: White is better. Dark area: Black is better. Click to jump.
                </div>
              </div>
              <div className="zen-hide">
                <AccuracyCards game={game} analysis={analysis} />
              </div>
            </>
          )}

          <div className="card zen-hide">
            <div className="card-title">Moves</div>
            <MoveList
              sans={listSans}
              currentPly={ply}
              onSelect={goTo}
              classes={listClasses}
              startsWithBlack={plies[0]?.color === 'b'}
            />
            {openingName && <div className="faint small opening-line">{openingName}</div>}
          </div>

          {analysis && (
            <div className="card zen-hide">
              <div className="card-title">
                <Sparkles size={15} /> Key moments
              </div>
              <KeyMoments analysis={analysis} userSide={game.userSide} ply={ply} onSelect={goTo} />
              <p className="faint small analysis-meta">
                Checked by Stockfish at depth {analysis.depth} in your browser
                {runState.durationMs ? ` (${(runState.durationMs / 1000).toFixed(1)} s)` : ''}. The computer is very
                strong, but not perfect.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
