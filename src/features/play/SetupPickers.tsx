import { useMemo, type ReactNode } from 'react'
import { BookOpen, Dices, Shuffle, Swords, Target } from 'lucide-react'
import { piecesFor } from '../../lib/pieceSets'
import { DEFAULT_PROFILE, type OpeningCourse, type Side } from '../../types'
import { KEYS, useStored } from '../../lib/storage'
import { previewMoves } from './book'
import { BOT_LEVELS } from './botLevels'
import { TIME_CONTROLS } from './timeControls'
import { ANY_CHAPTER, type ColourChoice, type PlayMode, type SetupChoices } from './types'

type Patch = (p: Partial<SetupChoices>) => void

/** A big, clearly selectable option. Behaves like a radio button for keyboard and screen-reader users. */
function Choice({
  selected,
  onSelect,
  disabled,
  className = '',
  children,
}: {
  selected: boolean
  onSelect: () => void
  disabled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      className={`pl-choice ${selected ? 'selected' : ''} ${className}`}
      onClick={onSelect}
    >
      {children}
    </button>
  )
}

/* ----------------------------------------------------------------- colour */

export function ColourPicker({
  value,
  patch,
  lockedTo,
}: {
  value: ColourChoice
  patch: Patch
  /** The opening decides the colour, so the choice is shown but cannot be changed. */
  lockedTo: Side | null
}) {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const pieces = useMemo(() => piecesFor(profile.pieceSet), [profile.pieceSet])
  const icon = (key: string) => pieces[key]?.({ svgStyle: { width: '100%', height: '100%' } })
  const shown: ColourChoice = lockedTo ?? value
  const options: { id: ColourChoice; label: string; visual: ReactNode }[] = [
    { id: 'white', label: 'White', visual: <span className="pl-king">{icon('wK')}</span> },
    { id: 'black', label: 'Black', visual: <span className="pl-king">{icon('bK')}</span> },
    {
      id: 'random',
      label: 'Random',
      visual: (
        <span className="pl-king pl-king-pair">
          <span>{icon('wK')}</span>
          <span>{icon('bK')}</span>
        </span>
      ),
    },
  ]
  return (
    <>
      <div className="pl-choices three" role="radiogroup" aria-label="Your colour">
        {options.map((o) => (
          <Choice key={o.id} selected={shown === o.id} disabled={lockedTo !== null} onSelect={() => patch({ colour: o.id })}>
            {o.visual}
            <span className="pl-choice-text">
              <strong>{o.label}</strong>
              <span className="faint small">{o.id === 'white' ? 'You move first' : o.id === 'black' ? 'The bot moves first' : 'A surprise'}</span>
            </span>
          </Choice>
        ))}
      </div>
      {lockedTo && (
        <p className="small muted" style={{ margin: '10px 0 0' }}>
          The opening you picked decides your colour: you play {lockedTo === 'white' ? 'White' : 'Black'}.
        </p>
      )}
    </>
  )
}

/* ----------------------------------------------------------------- level */

export function LevelPicker({ levelId, patch }: { levelId: string; patch: Patch }) {
  return (
    <>
      <div className="pl-choices levels" role="radiogroup" aria-label="Opponent strength">
        {BOT_LEVELS.map((l, i) => (
          <Choice key={l.id} selected={levelId === l.id} onSelect={() => patch({ levelId: l.id })} className="level">
            <span className="row between" style={{ width: '100%' }}>
              <strong>{l.name}</strong>
              <span className="pl-elo">{l.id === 'max' ? 'No limit' : `~${l.elo}`}</span>
            </span>
            <span className="pl-meter" aria-hidden>
              {BOT_LEVELS.map((_, k) => (
                <i key={k} className={k <= i ? 'on' : ''} />
              ))}
            </span>
            <span className="small muted">{l.blurb}</span>
          </Choice>
        ))}
      </div>
      <p className="faint small" style={{ margin: '10px 0 0' }}>
        The numbers are only rough guides. The bot plays like a person: it can miss things, so even strong levels make mistakes.
      </p>
    </>
  )
}

/* --------------------------------------------------------------- opening */

const MODES: { id: PlayMode; title: string; text: string; icon: ReactNode }[] = [
  { id: 'free', title: 'Free play', text: 'No set opening. Just play.', icon: <Swords size={22} /> },
  {
    id: 'practice',
    title: 'Practise my opening',
    text: 'You play your opening. The bot answers with the moves you have studied.',
    icon: <BookOpen size={22} />,
  },
  {
    id: 'face',
    title: 'Face an opening',
    text: 'The bot plays the opening, so you learn how to play against it.',
    icon: <Target size={22} />,
  },
]

function Difficulty({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="pl-dots" role="img" aria-label={['Easy', 'Medium', 'Harder'][level - 1]}>
      {[1, 2, 3].map((n) => (
        <i key={n} className={n <= level ? 'on' : ''} />
      ))}
    </span>
  )
}

export function OpeningPicker({
  setup,
  patch,
  courses,
  allCourses,
}: {
  setup: SetupChoices
  patch: Patch
  /** Courses that have lessons. */
  courses: OpeningCourse[]
  allCourses: OpeningCourse[]
}) {
  const none = courses.length === 0
  const course = courses.find((c) => c.id === setup.courseId)
  const chapter = course?.chapters.find((c) => c.id === setup.chapterId)
  const practising = setup.mode === 'practice'

  return (
    <>
      <div className="pl-choices three" role="radiogroup" aria-label="Opening to play">
        {MODES.map((m) => (
          <Choice
            key={m.id}
            selected={setup.mode === m.id}
            disabled={m.id !== 'free' && none}
            onSelect={() => {
              // jump to a course that has lessons if the remembered one has none
              const fallback = course ?? courses[0]
              patch(m.id === 'free' || !fallback ? { mode: m.id } : { mode: m.id, courseId: fallback.id })
            }}
          >
            <span className="pl-mode-icon">{m.icon}</span>
            <span className="pl-choice-text">
              <strong>{m.title}</strong>
              <span className="small muted">{m.text}</span>
            </span>
          </Choice>
        ))}
      </div>

      {none && (
        <p className="callout warn small" style={{ marginTop: 12 }}>
          Lessons are coming. For now, play a free game.
        </p>
      )}

      {setup.mode !== 'free' && !none && (
        <div className="stack pl-opening-detail">
          <div className="field">
            <label id="pl-course-label">Which opening?</label>
            <div className="row wrap" role="radiogroup" aria-labelledby="pl-course-label">
              {allCourses.map((c) => {
                const ready = c.chapters.length > 0
                const mine = setup.mode === 'practice' ? c.side : c.side === 'white' ? 'black' : 'white'
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={setup.courseId === c.id}
                    disabled={!ready}
                    className={`pl-chip ${setup.courseId === c.id ? 'selected' : ''}`}
                    onClick={() => patch({ courseId: c.id, chapterId: ANY_CHAPTER })}
                  >
                    {c.name}
                    <span className="pl-chip-sub">{ready ? `you play ${mine}` : 'coming soon'}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {course && (
            <div className="field">
              <label id="pl-chapter-label">{practising ? 'Which variation?' : 'Which variation should the bot play?'}</label>
              <div className="pl-chapters" role="radiogroup" aria-labelledby="pl-chapter-label">
                <Choice selected={setup.chapterId === ANY_CHAPTER} onSelect={() => patch({ chapterId: ANY_CHAPTER })} className="chapter">
                  <span className="row" style={{ gap: 12 }}>
                    <span className="pl-mode-icon small">
                      <Shuffle size={18} />
                    </span>
                    <span>
                      <strong>Surprise me</strong>
                      <span className="small muted"> – any variation</span>
                    </span>
                  </span>
                </Choice>
                {course.chapters.map((c) => (
                  <Choice key={c.id} selected={setup.chapterId === c.id} onSelect={() => patch({ chapterId: c.id })} className="chapter">
                    <span className="pl-chapter-title">{c.title}</span>
                    <Difficulty level={c.difficulty} />
                  </Choice>
                ))}
              </div>
              <div className="pl-chapter-info">
                {chapter ? (
                  <>
                    <p>{chapter.summary}</p>
                    <p className="small muted" style={{ margin: 0 }}>
                      First moves: <span className="pl-moves">{previewMoves(course, chapter)}</span>
                    </p>
                  </>
                ) : (
                  <p style={{ margin: 0 }}>
                    <Dices size={16} style={{ verticalAlign: '-3px' }} /> The bot picks from all the variations of the {course.name}.
                    You find out which one you face as you play.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ time */

export function TimePicker({ timeId, patch }: { timeId: string; patch: Patch }) {
  return (
    <div className="row wrap" role="radiogroup" aria-label="Time control">
      {TIME_CONTROLS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={timeId === t.id}
          className={`pl-chip big ${timeId === t.id ? 'selected' : ''}`}
          onClick={() => patch({ timeId: t.id })}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
