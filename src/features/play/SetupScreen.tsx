import { Chess } from 'chess.js'
import { Play as PlayIcon, RotateCcw, Trash2 } from 'lucide-react'
import { OPENING_COURSES } from '../../data/openings'
import { KEYS, removeStored, useStored } from '../../lib/storage'
import { DEFAULT_PROFILE } from '../../types'
import { getLevel } from './botLevels'
import { derive, sideOf } from './position'
import { ColourPicker, LevelPicker, OpeningPicker, TimePicker } from './SetupPickers'
import {
  CURRENT_GAME_KEY,
  DEFAULT_SETUP,
  SETUP_KEY,
  courseById,
  levelIdFor,
  makeConfig,
  newSavedGame,
  playableCourses,
} from './session'
import { getTimeControl } from './timeControls'
import type { SavedGame, SetupChoices } from './types'

interface Props {
  onStart: (game: SavedGame) => void
  /** Shown when a link could not be used completely. */
  problem?: string
}

function isUsable(saved: SavedGame | null): saved is SavedGame {
  if (!saved || !saved.config || !Array.isArray(saved.ucis) || saved.ucis.length === 0) return false
  try {
    new Chess(saved.config.startFen) // a damaged save must not crash the page
    return true
  } catch {
    return false
  }
}

function ResumeCard({ saved, onResume }: { saved: SavedGame; onResume: () => void }) {
  const level = getLevel(saved.config.levelId)
  const d = derive(saved.config.startFen, saved.ucis)
  const moves = Math.ceil(d.moves.length / 2)
  const turn = sideOf(d.chess.turn())
  const course = saved.config.courseId ? courseById(saved.config.courseId) : undefined
  return (
    <section className="card pl-resume" aria-label="Game in progress">
      <div className="row between wrap" style={{ gap: 16 }}>
        <div>
          <div className="card-title" style={{ marginBottom: 4 }}>
            Game in progress
          </div>
          <div>
            <strong>
              You ({saved.config.userSide === 'white' ? 'White' : 'Black'}) against {level.name} ~{level.elo}
            </strong>
          </div>
          <div className="muted small">
            {moves} {moves === 1 ? 'move' : 'moves'} played · {turn === saved.config.userSide ? 'your turn' : "the bot's turn"}
            {course && ` · ${saved.config.mode === 'practice' ? 'practising' : 'facing'} the ${course.name}`}
          </div>
        </div>
        <div className="row">
          <button className="btn primary" onClick={onResume}>
            <RotateCcw size={18} /> Resume game
          </button>
          <button className="btn ghost" onClick={() => removeStored(CURRENT_GAME_KEY)} aria-label="Discard this game">
            <Trash2 size={18} /> Discard
          </button>
        </div>
      </div>
    </section>
  )
}

/** Section with a small numbered heading. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card pl-step">
      <h2 className="pl-step-title">
        <span className="pl-step-no">{n}</span> {title}
      </h2>
      {children}
    </section>
  )
}

export default function SetupScreen({ onStart, problem }: Props) {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const [setup, setSetup] = useStored<SetupChoices>(SETUP_KEY, DEFAULT_SETUP)
  const [saved] = useStored<SavedGame | null>(CURRENT_GAME_KEY, null)
  const patch = (p: Partial<SetupChoices>) => setSetup((s) => ({ ...s, ...p }))

  const courses = playableCourses()
  const course = courses.find((c) => c.id === setup.courseId)
  // an opening mode only counts when its course really has lessons
  const mode = setup.mode !== 'free' && course ? setup.mode : 'free'
  const lockedTo = course && mode === 'practice' ? course.side : course && mode === 'face' ? (course.side === 'white' ? 'black' : 'white') : null
  const levelId = levelIdFor(setup, profile.selfRating)
  const level = getLevel(levelId)
  const chapter = course?.chapters.find((c) => c.id === setup.chapterId)
  const time = getTimeControl(setup.timeId)
  const colourText = lockedTo ? (lockedTo === 'white' ? 'White' : 'Black') : setup.colour === 'random' ? 'Random colour' : setup.colour === 'white' ? 'White' : 'Black'

  const start = () => {
    removeStored(CURRENT_GAME_KEY)
    onStart(newSavedGame(makeConfig({ ...setup, levelId }, { selfRating: profile.selfRating })))
  }

  return (
    <div className="page play-setup-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Play</div>
          <h1>Play a game</h1>
          <p>Pick your side and an opponent. You can also practise an opening you are learning.</p>
        </div>
      </div>

      {problem && <p className="callout warn">{problem}</p>}
      {isUsable(saved) && <ResumeCard saved={saved} onResume={() => onStart(saved)} />}

      <div className="play-setup">
        <div className="stack">
          <Step n={1} title="Your colour">
            <ColourPicker value={setup.colour} patch={patch} lockedTo={lockedTo} />
          </Step>
          <Step n={2} title="Your opponent">
            <LevelPicker levelId={levelId} patch={patch} />
          </Step>
          <Step n={3} title="Opening">
            <OpeningPicker setup={{ ...setup, mode }} patch={patch} courses={courses} allCourses={OPENING_COURSES} />
          </Step>
          <Step n={4} title="Clock">
            <TimePicker timeId={time.id} patch={patch} />
          </Step>
        </div>

        <aside className="card play-summary">
          <div className="card-title">Your game</div>
          <dl className="pl-summary-list">
            <div>
              <dt>You</dt>
              <dd>{colourText}</dd>
            </div>
            <div>
              <dt>Opponent</dt>
              <dd>
                {level.name} {level.id === 'max' ? '' : `~${level.elo}`}
              </dd>
            </div>
            <div>
              <dt>Opening</dt>
              <dd>
                {mode === 'free' || !course
                  ? 'Free play'
                  : `${mode === 'practice' ? 'Practise' : 'Face'} the ${course.name}${chapter ? ` – ${chapter.title}` : ''}`}
              </dd>
            </div>
            <div>
              <dt>Clock</dt>
              <dd>{time.label}</dd>
            </div>
          </dl>
          <label className="pl-switch" style={{ margin: '14px 0 16px' }}>
            <input type="checkbox" role="switch" checked={setup.coach} onChange={(e) => patch({ coach: e.target.checked })} />
            <span className="pl-switch-track" aria-hidden />
            <span>
              Coach <span className="faint small">warns you about big blunders</span>
            </span>
          </label>
          <button className="btn primary big pl-start" onClick={start}>
            <PlayIcon size={20} /> Start game
          </button>
        </aside>
      </div>
    </div>
  )
}
