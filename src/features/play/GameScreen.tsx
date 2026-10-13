import { useCallback, useEffect, useMemo, useState } from 'react'
import Board from '../../components/Board'
import EvalBar from '../../components/EvalBar'
import { DEFAULT_PROFILE } from '../../types'
import { KEYS, useStored } from '../../lib/storage'
import { EssentialActions, MoreActions } from './ActionPanels'
import CoachMessages from './CoachMessages'
import { ResultCard, ResultModal } from './GameOver'
import { botDisplayName, buildRecord } from './gameRecord'
import { materialOf } from './position'
import PlayerStrip from './PlayerStrip'
import { EVAL_BAR_KEY, SETUP_KEY, DEFAULT_SETUP } from './session'
import { MovesCard, OpeningCard } from './SidePanels'
import type { SavedGame } from './types'
import { useGame } from './useGame'

interface Props {
  initial: SavedGame
  onNewGame: () => void
  onRematch: () => void
}

/** Is the keyboard focus somewhere you type text? Then arrow keys must not move through the game. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

export default function GameScreen({ initial, onNewGame, onRematch }: Props) {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const [setup, setSetup] = useStored(SETUP_KEY, DEFAULT_SETUP)
  const [evalOn, setEvalOn] = useStored(EVAL_BAR_KEY, false)
  const game = useGame(initial, setup.coach, evalOn)
  const [modalOpen, setModalOpen] = useState(true)

  // ← → Home End move through the game
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'ArrowLeft') game.step(-1)
      else if (e.key === 'ArrowRight') game.step(1)
      else if (e.key === 'Home') game.goTo(0)
      else if (e.key === 'End') game.goTo(game.plyCount)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [game])

  const material = useMemo(() => materialOf(game.viewFen, game.config.startFen), [game.viewFen, game.config.startFen])
  const lastMove = useMemo<[string, string] | null>(() => {
    const m = game.derived.moves[game.viewPly - 1]
    return m ? [m.from, m.to] : null
  }, [game.derived.moves, game.viewPly])

  const showingHint = game.hint && game.hint.ply === game.plyCount && game.isLive
  const arrows = useMemo(
    () =>
      showingHint && game.hint!.stage === 2
        ? [{ from: game.hint!.uci.slice(0, 2), to: game.hint!.uci.slice(2, 4), color: 'blue' }]
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showingHint, game.hint?.stage, game.hint?.uci],
  )
  const hintSquares = useMemo(
    () => (showingHint ? [game.hint!.uci.slice(0, 2)] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showingHint, game.hint?.uci],
  )

  const getPgn = useCallback(() => {
    const result = game.outcome ?? { result: '*' as const, reason: 'resign' as const }
    return buildRecord(game.config, game.ucis, result, profile).pgn
  }, [game.config, game.ucis, game.outcome, profile])

  const userName = profile.name.trim() && profile.name.trim() !== 'Player' ? profile.name.trim() : 'You'
  const leadOf = (side: 'white' | 'black') => (side === 'white' ? material.diff : -material.diff)
  const stripFor = (side: 'white' | 'black') => {
    const isBot = side === game.botSide
    return (
      <PlayerStrip
        name={isBot ? botDisplayName(game.config.levelId) : userName}
        detail={isBot && game.level.id !== 'max' ? `${game.level.name} level` : undefined}
        isBot={isBot}
        side={side}
        captured={material.captured[side]}
        lead={leadOf(side)}
        showCaptured={material.showCaptured}
        clock={game.clock}
        thinking={isBot && game.thinking}
        tickSound={!isBot}
      />
    )
  }
  const top = game.orientation === 'white' ? 'black' : 'white'
  const bottom = game.orientation

  const finished = !!game.outcome
  const boardFrame = (
    <Board
      fen={game.viewFen}
      orientation={game.orientation}
      interactive={game.canInteract ? game.userSide : false}
      onMove={game.onBoardMove}
      lastMove={lastMove}
      arrows={arrows}
      hintSquares={hintSquares}
      allowUserArrows
    />
  )
  const evalShown = evalOn && !profile.zenMode

  return (
    <div className="page play-page">
      <div className="board-layout">
        <div className={`board-col play-board-col ${evalShown ? 'with-eval' : ''}`}>
          {stripFor(top)}
          {evalShown ? (
            <div className="board-with-eval">
              <EvalBar cpWhite={game.evalWhite} orientation={game.orientation} />
              {boardFrame}
            </div>
          ) : (
            boardFrame
          )}
          {stripFor(bottom)}
          {game.engineStatus === 'loading' && game.plyCount === 0 && (
            <div className="faint small pl-loading zen-hide">Waking up the bot…</div>
          )}
        </div>

        <div className="side-col">
          <CoachMessages game={game} />
          {finished ? (
            <ResultCard game={game} onRematch={onRematch} onNewGame={onNewGame} getPgn={getPgn} />
          ) : (
            <EssentialActions game={game} />
          )}
          <OpeningCard game={game} />
          <MovesCard game={game} />
          <MoreActions
            game={game}
            coachOn={setup.coach}
            setCoachOn={(on) => setSetup((s) => ({ ...s, coach: on }))}
            evalOn={evalOn}
            setEvalOn={setEvalOn}
            onNewGame={onNewGame}
            getPgn={getPgn}
          />
        </div>
      </div>

      {finished && modalOpen && (
        <ResultModal game={game} onRematch={onRematch} onNewGame={onNewGame} getPgn={getPgn} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
