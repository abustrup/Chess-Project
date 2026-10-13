import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, Eye, Flame, Lightbulb, RotateCcw, Trophy } from 'lucide-react'
import Board from '../../components/Board'
import type { OpeningCourse } from '../../types'
import ChapterGate, { type ChapterContext } from './ChapterGate'
import { useCourse } from './courses'
import { chapterMastery, progressKey, useOpeningProgress } from './progress'
import { colourName, moveLabel, parseChapter, userColour } from './treeUtils'
import { useDrill, type DrillEntry, type Note } from './useDrill'
import { useWindowKeys } from './useWindowKeys'
import { ModeHeader } from './components/ModeHeader'
import { Crumbs, GlyphBadge, MasteryBar, Notice } from './components/shared'
import { LineSoFar } from './components/LineSoFar'

// Drill mode: YOU play your moves from memory, the app plays the opponent.

/** /openings/<course>/<chapter>/drill  (optionally ?from=<position> to carry on from the study position). */
export default function DrillPage() {
  const [search] = useSearchParams()
  const from = search.get('from') ?? undefined
  return (
    <ChapterGate>
      {({ course, chapter, tree }: ChapterContext) => (
        <DrillSession
          key={`${course.id}/${chapter.id}/${from ?? ''}`}
          course={course}
          entries={[{ chapter, tree }]}
          startNodeId={from}
          header={<ModeHeader course={course} chapter={chapter} mode="drill" />}
        />
      )}
    </ChapterGate>
  )
}

/** /openings/<course>/quiz: lines from every chapter of the course, mixed up. */
export function QuizPage() {
  const { courseId } = useParams()
  const course = useCourse(courseId)
  const entries = useMemo<DrillEntry[]>(() => {
    const list: DrillEntry[] = []
    for (const chapter of course?.chapters ?? []) {
      const parsed = parseChapter(chapter)
      if (parsed.ok) list.push({ chapter, tree: parsed.tree })
    }
    return list
  }, [course])

  if (!course) {
    return (
      <Notice title="We could not find that opening" back={{ to: '/openings', label: 'See all openings' }}>
        Maybe the link is old. Pick one of your openings from the list.
      </Notice>
    )
  }
  if (entries.length === 0) {
    return (
      <Notice title="Nothing to quiz yet" back={{ to: `/openings/${course.id}`, label: `Back to ${course.name}` }}>
        The lessons for this opening are still being written.
      </Notice>
    )
  }
  return (
    <DrillSession
      key={course.id}
      course={course}
      entries={entries}
      header={
        <div className="page-head op-mode-head">
          <div>
            <Crumbs items={[{ label: 'Openings', to: '/openings' }, { label: course.name, to: `/openings/${course.id}` }, { label: 'Quiz' }]} />
            <h1>Quiz: {course.name}</h1>
            <p>Lines from every variation, mixed up. The ones you know least come up more often.</p>
          </div>
        </div>
      }
    />
  )
}

/* ------------------------------------------------------------------ */

function DrillSession({
  course,
  entries,
  startNodeId,
  header,
}: {
  course: OpeningCourse
  entries: DrillEntry[]
  startNodeId?: string
  header: ReactNode
}) {
  const drill = useDrill(course, entries, startNodeId)
  const { state, node, chapter } = drill
  const me = userColour(course)
  const quiz = entries.length > 1
  const complete = state.phase === 'complete'
  const nextRef = useRef<HTMLButtonElement>(null)

  // When a line ends, put the keyboard focus on "Next line" so Enter carries on.
  useEffect(() => {
    if (complete) nextRef.current?.focus()
  }, [complete, state.lineNo])

  useWindowKeys((e) => {
    if (e.key === 'h' || e.key === 'H') drill.hint()
    else return false
    return true
  })

  return (
    <div className="page op-page">
      {header}
      <div className="board-layout">
        <div className="board-col op-board-col">
          <Board
            fen={node.fen}
            orientation={course.side}
            interactive={drill.interactive}
            onMove={(m) => drill.play(m.uci)}
            lastMove={drill.lastMove}
            arrows={drill.arrows}
            highlights={drill.highlights}
            hintSquares={drill.hintSquares}
          />
          <div className="op-controls" role="group" aria-label="Drill controls">
            {complete ? (
              <button ref={nextRef} className="btn primary big op-next-btn" onClick={drill.newLine}>
                Next line <ArrowRight size={18} aria-hidden />
              </button>
            ) : (
              <>
                <button className="btn" onClick={drill.hint} disabled={state.phase !== 'your-turn' || state.hint >= 2} title="Hint (H)">
                  <Lightbulb size={17} aria-hidden /> Hint
                </button>
                <button className="btn" onClick={drill.showAnswer} disabled={state.phase !== 'your-turn' || state.answerShown}>
                  <Eye size={17} aria-hidden /> Show answer
                </button>
                <button className="btn ghost" onClick={drill.newLine} title="Start this line again">
                  <RotateCcw size={16} aria-hidden /> Restart line
                </button>
              </>
            )}
          </div>
        </div>

        <div className="side-col">
          <PromptCard drill={drill} course={course} />
          {complete && (
            <CompleteCard
              course={course}
              chapterTitle={chapter.title}
              chapterId={chapter.id}
              quiz={quiz}
              slippedMoves={drill.slippedMoves}
              streak={state.streak}
            />
          )}

          <section className="card op-drill-stats zen-hide">
            <DrillStats course={course} chapterId={chapter.id} quiz={quiz} streak={state.streak} lineNo={state.lineNo} slips={drill.slips} />
          </section>

          <section className="card zen-hide">
            <div className="card-title">The line so far</div>
            <LineSoFar path={drill.path} me={me} currentId={node.id} />
            {quiz && (
              <p className="small faint op-from">
                From: <Link to={`/openings/${course.id}/${chapter.id}/study`}>{chapter.title}</Link>
              </p>
            )}
          </section>

          {drill.startedMidway && (
            <p className="small muted zen-hide">
              You started in the middle of the chapter.{' '}
              <Link to={`/openings/${course.id}/${chapter.id}/drill`}>Start from the beginning</Link>
            </p>
          )}
          <p className="small faint op-keys zen-hide">
            Keys: <kbd>H</kbd> hint · drag a piece or click it and then a square. Prefer typing? Use the box above.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function PromptCard({ drill, course }: { drill: ReturnType<typeof useDrill>; course: OpeningCourse }) {
  const { state, node, replyNode } = drill
  const yourTurn = state.phase === 'your-turn'
  const finished = state.phase === 'complete'
  const moveNo = Math.ceil((node.ply + 1) / 2)
  const youName = colourName(userColour(course))
  const opponentName = colourName(userColour(course) === 'w' ? 'b' : 'w')

  return (
    <section className={`card op-prompt zen-keep ${finished ? 'done' : ''}`} aria-live="polite">
      {!finished && (
        <div className="op-coach-head">
          <span className={`op-tag ${yourTurn ? 'you' : 'them'}`}>{yourTurn ? 'Your move' : `${opponentName} is replying`}</span>
          <span className="op-prompt-sub">{yourTurn ? `Move ${moveNo} · you are ${youName}` : 'One moment ...'}</span>
        </div>
      )}
      {yourTurn && !state.note && !replyNode && (
        <p className="op-coach-text">
          {node.id === '' || !drill.startedMidway ? 'Play your next move from memory.' : 'Carry on from here. Play your next move from memory.'}
        </p>
      )}

      {state.note && <NoteBox note={state.note} onDismiss={state.note.kind === 'wrong' ? drill.dismiss : undefined} />}

      {replyNode && (
        <div className="op-reply">
          <div className="op-reply-head">
            {colourName(replyNode.mover!)} played <strong>{moveLabel(replyNode)}</strong> <GlyphBadge nags={replyNode.nags} />
          </div>
          {replyNode.comment && <p>{replyNode.comment}</p>}
        </div>
      )}

      {yourTurn && <TypeMove onSubmit={drill.playTyped} />}
    </section>
  )
}

function NoteBox({ note, onDismiss }: { note: Note; onDismiss?: () => void }) {
  return (
    <div className={`op-note ${note.kind}`} role="status">
      <strong>{note.title}</strong>
      {note.text && (
        <p>
          {note.label && <span className="op-note-label">{note.label}: </span>}
          {note.text}
        </p>
      )}
      {onDismiss && (
        <button className="btn small" onClick={onDismiss}>
          Try again
        </button>
      )}
    </div>
  )
}

/** For people who prefer the keyboard: type the move ("Nf3") instead of moving the piece. */
function TypeMove({ onSubmit }: { onSubmit: (text: string) => 'ok' | 'illegal' }) {
  const [text, setText] = useState('')
  const [problem, setProblem] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const result = onSubmit(text)
    setProblem(result === 'illegal')
    if (result === 'ok') setText('')
  }

  return (
    <form className="op-type zen-hide" onSubmit={submit}>
      <label htmlFor="op-type-move" className="small muted">
        Or type your move
      </label>
      <div className="row">
        <input
          id="op-type-move"
          className="input"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setProblem(false)
          }}
          placeholder="for example Nf3"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={problem}
          aria-describedby={problem ? 'op-type-problem' : undefined}
        />
        <button className="btn small" type="submit">
          Play
        </button>
      </div>
      {problem && (
        <div id="op-type-problem" className="small op-type-problem" role="alert">
          That is not a legal move here. Check the letters and squares.
        </div>
      )}
    </form>
  )
}

function CompleteCard({
  course,
  chapterTitle,
  chapterId,
  quiz,
  slippedMoves,
  streak,
}: {
  course: OpeningCourse
  chapterTitle: string
  chapterId: string
  quiz: boolean
  slippedMoves: string[]
  streak: number
}) {
  const slips = slippedMoves.length
  const clean = slips === 0
  return (
    <section className={`card op-complete zen-keep ${clean ? 'clean' : ''}`} aria-live="polite">
      <div className="op-complete-head">
        {clean ? <Trophy size={26} aria-hidden /> : <CheckCircle2 size={26} aria-hidden />}
        <h2>Line complete!</h2>
      </div>
      <p>
        {clean
          ? 'No mistakes. Well done!'
          : `You had ${slips} ${slips === 1 ? 'slip' : 'slips'} in this line. That is how you learn: it will come back soon so it sticks.`}
      </p>
      {!clean && (
        <p className="small muted">
          Worth another look: <strong className="op-revisit">{slippedMoves.join(', ')}</strong>
        </p>
      )}
      {streak > 0 && (
        <p className="op-streak">
          <Flame size={16} aria-hidden /> {streak} clean {streak === 1 ? 'line' : 'lines'} in a row
        </p>
      )}
      {quiz && <p className="small faint">From: {chapterTitle}</p>}
      <div className="row wrap zen-hide">
        <Link className="btn small" to={`/openings/${course.id}/${chapterId}/study`}>
          <BookOpen size={15} aria-hidden /> Study this chapter again
        </Link>
      </div>
    </section>
  )
}

function DrillStats({
  course,
  chapterId,
  quiz,
  streak,
  lineNo,
  slips,
}: {
  course: OpeningCourse
  chapterId: string
  quiz: boolean
  streak: number
  lineNo: number
  slips: number
}) {
  const progress = useOpeningProgress()
  const entry = progress[progressKey(course.id, chapterId)]
  const mastery = quiz
    ? course.chapters.reduce((t, c) => t + chapterMastery(progress, course.id, c.id), 0) / Math.max(1, course.chapters.length)
    : chapterMastery(progress, course.id, chapterId)
  const best = typeof entry?.bestStreak === 'number' && Number.isFinite(entry.bestStreak) ? entry.bestStreak : 0
  return (
    <>
      <div className="op-stat-grid">
        <div>
          <div className="op-stat-num">{lineNo}</div>
          <div className="small muted">Line</div>
        </div>
        <div>
          <div className="op-stat-num">{streak}</div>
          <div className="small muted">Clean in a row</div>
        </div>
        <div>
          <div className="op-stat-num">{slips}</div>
          <div className="small muted">Slips here</div>
        </div>
        <div>
          <div className="op-stat-num">{best}</div>
          <div className="small muted">Best streak</div>
        </div>
      </div>
      <MasteryBar value={mastery} label={quiz ? 'How well you know this opening' : 'How well you know this chapter'} />
    </>
  )
}
