import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DEFAULT_PROFILE } from '../types'
import GameScreen from '../features/play/GameScreen'
import SetupScreen from '../features/play/SetupScreen'
import {
  CURRENT_GAME_KEY,
  DEFAULT_SETUP,
  SETUP_KEY,
  cleanSetup,
  makeConfig,
  newSavedGame,
  parseLaunch,
  rematchConfig,
} from '../features/play/session'
import type { SavedGame, SetupChoices } from '../features/play/types'
import { KEYS, readStored, removeStored, writeStored } from '../lib/storage'
import '../features/play/play.css'

// Play against the computer. Shows the setup screen, then the game.
// Links such as /play?course=london&chapter=main&mode=practice or /play?fen=...&side=white start a game straight away.

export default function Play() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const search = params.toString()
  const [game, setGame] = useState<SavedGame | null>(null)
  const [problem, setProblem] = useState<string | undefined>()
  const handled = useRef<string | null>(null)

  // A link with a game request: start it, then tidy the address bar so a reload resumes instead of restarting.
  useEffect(() => {
    if (!search) {
      handled.current = null
      return
    }
    if (handled.current === search) return
    handled.current = search
    const launch = parseLaunch(params)
    const profile = readStored(KEYS.profile, DEFAULT_PROFILE)
    const choices: SetupChoices = { ...cleanSetup(readStored(SETUP_KEY, DEFAULT_SETUP)), ...launch.prefill }
    if (launch.autoStart) {
      removeStored(CURRENT_GAME_KEY)
      setGame(newSavedGame(makeConfig(choices, { selfRating: profile.selfRating, fen: launch.fen, side: launch.side })))
    } else {
      writeStored(SETUP_KEY, choices)
      setProblem(launch.problem)
    }
    navigate('/play', { replace: true })
  }, [navigate, params, search])

  // "Start game" sits at the bottom of a long setup page on a phone: begin each screen at the top,
  // otherwise the new game opens scrolled down with the board out of sight
  const screenId = game ? game.config.id : 'setup'
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screenId])

  // while a link is being turned into a game, show nothing instead of flashing the setup screen
  if (search) return null

  if (game) {
    return (
      <GameScreen
        key={game.config.id}
        initial={game}
        onNewGame={() => {
          setProblem(undefined)
          setGame(null)
        }}
        onRematch={() => setGame(newSavedGame(rematchConfig(game.config)))}
      />
    )
  }
  return <SetupScreen onStart={setGame} problem={problem} />
}
