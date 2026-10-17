import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Minus, Plus, ShieldCheck } from 'lucide-react'
import {
  DEFAULT_SAFETY_SETTINGS,
  type SafetyAttempt,
  type SafetyCard,
  type SafetyCardFile,
  type SafetyDay,
  type StoredSafetyCard,
} from '../../types'
import { KEYS, useStored, writeStored } from '../../lib/storage'
import { useStudyGate, type StudyGate } from '../../lib/studyGate'
import Board from '../../components/Board'
import { useSafetyCards } from './cards'
import { addMoreNew, currentDay, localDay, remainingIds } from './queue'
import {
  SETTING_LIMITS,
  cleanDay,
  cleanLog,
  cleanSettings,
  cleanState,
  lastWrittenLine,
  readDay,
  readLog,
  readSettings,
  readState,
  writeDay,
  writeSettings,
} from './stored'
import { applyAnswer } from './record'
import { useSafetyRun, type Answer } from './useSafetyRun'
import CheckedLine from './CheckedLine'
import Verdict, { type BoardMode } from './Verdict'
import { playLine } from './positions'
import './safety.css'

// /safety: the Safety-check trainer (build plan S1). Locked until the study gate opens after his 40th rated 10+0
// game on Lichess; until then the page only says so and never downloads the positions. Once open: today's queue
// of his own positions, one at a time, with a written line before every verdict.

const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return `${n}${s}`
}

function whereCounted(gate: StudyGate): string {
  if (gate.source === 'none' || !gate.asOf) return 'The count from Lichess has not arrived yet.'
  const when = new Date(gate.asOf)
  const time = `${when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at ${when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  if (gate.source === 'lichess') return `Counted from your Lichess games on ${time}.`
  if (gate.source === 'daily job') return `Counted by the daily check on ${time}.`
  return `Last counted on ${time}.`
}

/** The locked page: what it is and when it opens. No positions, no request for them. */
function SafetyLocked({ gate }: { gate: StudyGate }) {
  const n = gate.unlockAfterGame
  const have = gate.source === 'none' ? 'not counted yet' : `you have ${gate.eligibleGames}`
  return (
    <div className="page safety-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Your study</div>
          <h1>Safety check</h1>
        </div>
      </div>
      <section className="card safety-locked">
        <span className="safety-locked-icon">
          <Lock size={26} aria-hidden />
        </span>
        <div>
          <h2 data-testid="safety-locked-text">{`Opens after your ${ordinal(n)} rated 10+0 game on Lichess (${have})`}</h2>
          <p>
            Your study compares your rated 10+0 games before and after this trainer, so it stays closed until your{' '}
            {ordinal(n)} game is on Lichess. Then it opens here by itself; you do not need to do anything.
          </p>
          <p className="small muted">{whereCounted(gate)}</p>
          <Link className="btn" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ one position */

interface CardProps {
  card: SafetyCard
  how: 'first' | 'repeat'
  lastLine: SafetyAttempt | null
  position: { index: number; total: number }
  hasNext: boolean
  onAnswer: (card: SafetyCard, how: 'first' | 'repeat', a: Answer) => StoredSafetyCard | null
  onNext: () => void
  /** shown under the position's own panels (today's progress and settings) */
  aside?: ReactNode
}

const REPLY_STEP_MS = 800

function SafetyCardView({ card, how, lastLine, position, hasNext, onAnswer, onNext, aside }: CardProps) {
  const [scheduled, setScheduled] = useState<StoredSafetyCard | null>(null)
  const handle = useCallback(
    (a: Answer) => {
      const s = onAnswer(card, how, a)
      if (!a.retry) setScheduled(s)
    },
    [card, how, onAnswer],
  )
  const { run, onBoardMove, setLine, changeMove, confirm, showAnswer, tryAgain } = useSafetyRun(card, handle)
  const [mode, setMode] = useState<BoardMode>('mine')
  const [replyStep, setReplyStep] = useState(0)

  // a fresh verdict picks what the board shows: his answer to a wrong move, otherwise your move
  const current = run.retrying ? run.retryVerdict : run.verdict
  useEffect(() => {
    if (run.phase !== 'verdict') return
    setMode(run.shownAnswer && !run.retrying ? 'best' : current && !current.ok ? 'reply' : 'mine')
  }, [run.phase, run.shownAnswer, run.retrying, current])

  // his answer is played on the board one move at a time
  useEffect(() => {
    setReplyStep(0)
    if (mode !== 'reply' || !run.reply?.length) return
    const timers = run.reply.map((_, i) => window.setTimeout(() => setReplyStep(i + 1), REPLY_STEP_MS * (i + 1)))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [mode, run.reply])

  // Enter or N moves on from a verdict (not while typing)
  useEffect(() => {
    if (run.phase !== 'verdict') return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      // the Next button has focus after a verdict, so a key press on a button still counts; typing never does
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'n' || e.key === 'N') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run.phase, onNext])

  const start = run.start
  const board = useMemo(() => {
    const his: [string, string] | null = start ? [start.from, start.to] : null
    if (run.phase === 'intro' || !start) return { fen: card.fenBefore, lastMove: null, arrows: undefined }
    if (run.phase === 'moving') return { fen: start.fen, lastMove: his, arrows: undefined }
    const move = run.move
    if (run.phase !== 'verdict') return { fen: move?.fen ?? start.fen, lastMove: move ? ([move.from, move.to] as [string, string]) : his, arrows: undefined }
    const view = mode === 'reply' && !run.reply?.length ? 'mine' : mode
    if (view === 'best' || !move) {
      const best = card.top[0].uci
      return { fen: start.fen, lastMove: his, arrows: [{ from: best.slice(0, 2), to: best.slice(2, 4), color: 'green' }] }
    }
    if (view === 'reply' && run.reply) {
      const plies = playLine(move.fen, run.reply.slice(0, replyStep))
      const last = plies[plies.length - 1]
      return { fen: last?.fen ?? move.fen, lastMove: last ? ([last.from, last.to] as [string, string]) : ([move.from, move.to] as [string, string]), arrows: undefined }
    }
    return { fen: move.fen, lastMove: [move.from, move.to] as [string, string], arrows: undefined }
  }, [run.phase, run.move, run.reply, start, card, mode, replyStep])

  const sideName = card.side === 'white' ? 'White' : 'Black'

  // a card whose last move cannot be played (the card builder checks this, so it should never happen)
  if (!start) {
    return (
      <section className="card safety-done" role="alert">
        <div>
          <h2>This position could not be read</h2>
          <p>It is skipped. The next one is fine.</p>
          <button type="button" className="btn primary" onClick={onNext}>
            Next position
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="board-layout safety-layout">
      <div className="board-col">
        <ol className="safety-strip" aria-label="Before every move">
          <li>
            <b>1.</b> What does his move threaten or allow?
          </li>
          <li>
            <b>2.</b> What does my move allow?
          </li>
        </ol>
        <Board
          className="safety-board"
          fen={board.fen}
          orientation={card.side}
          interactive={run.phase === 'moving' ? card.side : false}
          onMove={onBoardMove}
          lastMove={board.lastMove}
          arrows={board.arrows}
          animationMs={220}
        />
      </div>

      <div className="side-col">
        <div className="safety-count zen-keep" aria-live="polite">
          Position {position.index} of {position.total} today
          {how === 'repeat' && <span className="chip gold">Second look</span>}
        </div>

        {run.engineError && (
          <div className="callout bad zen-keep" role="alert">
            {run.engineError}
          </div>
        )}

        {run.phase === 'intro' && (
          <section className="card safety-prompt zen-keep">
            <h2>His move is coming…</h2>
            <p>Watch what your opponent plays.</p>
          </section>
        )}

        {run.phase === 'moving' && (
          <section className="card safety-prompt zen-keep">
            <h2>{run.retrying ? 'Try again' : 'Your move'}</h2>
            <p>
              {run.retrying
                ? 'Find a safe move. This try does not change when the position comes back.'
                : `You play ${sideName}. His last move was ${start?.san ?? card.lastMoveSan}. Find a safe move; nothing counts until you confirm.`}
            </p>
            {!run.retrying && (
              <button type="button" className="btn ghost small safety-show" onClick={showAnswer}>
                Show answer (counts as a miss)
              </button>
            )}
          </section>
        )}

        {(run.phase === 'writing' || run.phase === 'checking') && run.move && (
          <section className="card safety-prompt zen-keep">
            {run.phase === 'checking' ? (
              <>
                <h2>Checking…</h2>
                <p>The engine in your browser is looking at {run.move.san}. This takes a few seconds.</p>
              </>
            ) : (
              <CheckedLine
                value={run.line}
                error={run.lineError}
                moveSan={run.move.san}
                onChange={setLine}
                onConfirm={confirm}
                onChangeMove={changeMove}
              />
            )}
          </section>
        )}

        {run.phase === 'verdict' && (
          <Verdict
            card={card}
            run={run}
            lastLine={lastLine}
            scheduled={scheduled}
            repeat={how === 'repeat'}
            mode={mode}
            onMode={setMode}
            onTryAgain={tryAgain}
            onNext={onNext}
            hasNext={hasNext}
          />
        )}
        {aside}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the session */

interface Pinned {
  id: string
  how: 'first' | 'repeat'
  key: number
  lastLine: SafetyAttempt | null
  /** its place in today's queue, counted when it was put on the board */
  index: number
}

function Stepper({ label, value, limits, onChange }: { label: string; value: number; limits: readonly [number, number]; onChange: (n: number) => void }) {
  return (
    <div className="safety-stepper">
      <span>{label}</span>
      <div className="safety-stepper-controls">
        <button type="button" className="btn icon small" aria-label={`Fewer: ${label}`} onClick={() => onChange(value - 1)} disabled={value <= limits[0]}>
          <Minus size={15} aria-hidden />
        </button>
        <strong aria-live="polite">{value}</strong>
        <button type="button" className="btn icon small" aria-label={`More: ${label}`} onClick={() => onChange(value + 1)} disabled={value >= limits[1]}>
          <Plus size={15} aria-hidden />
        </button>
      </div>
    </div>
  )
}

function SafetySession({ file }: { file: SafetyCardFile }) {
  const [rawState] = useStored<unknown>(KEYS.safetyState, {})
  const [rawLog] = useStored<unknown>(KEYS.safetyLog, [])
  const [rawSettings] = useStored<unknown>(KEYS.safetySettings, DEFAULT_SAFETY_SETTINGS)
  const [rawDay] = useStored<unknown>(KEYS.safetyDay, null)
  const state = useMemo(() => cleanState(rawState), [rawState])
  const log = useMemo(() => cleanLog(rawLog), [rawLog])
  const settings = useMemo(() => cleanSettings(rawSettings), [rawSettings])
  const savedDay = useMemo(() => cleanDay(rawDay), [rawDay])

  // the date is read again when the tab comes back, so a session left open overnight starts a new day
  const [today, setToday] = useState(() => localDay(new Date()))
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && setToday(localDay(new Date()))
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const byId = useMemo(() => new Map(file.cards.map((c) => [c.id, c])), [file])
  // `today` is in the list so the plan is made again on a new day
  const day = useMemo(() => currentDay(file.cards, state, settings, new Date(), savedDay), [file, state, settings, savedDay, today])
  const dayRef = useRef<SafetyDay>(day)
  dayRef.current = day
  useEffect(() => {
    if (JSON.stringify(day) !== JSON.stringify(savedDay)) writeDay(day)
  }, [day, savedDay])
  const remaining = useMemo(() => remainingIds(day), [day])

  const [pinned, setPinned] = useState<Pinned | null>(null)
  const keyRef = useRef(0)
  useEffect(() => {
    if (pinned || remaining.length === 0) return
    const id = remaining[0]
    const how = day.ids.includes(id) && !day.done.includes(id) ? 'first' : 'repeat'
    const index = day.done.length + day.repeatsDone.length + 1
    setPinned({ id, how, key: ++keyRef.current, lastLine: lastWrittenLine(log, id), index })
  }, [pinned, remaining, day, log])

  const onAnswer = useCallback((card: SafetyCard, how: 'first' | 'repeat', a: Answer): StoredSafetyCard | null => {
    const saved = readDay()
    const result = applyAnswer(
      {
        state: readState(),
        log: readLog(),
        day: saved && saved.date === dayRef.current.date ? saved : dayRef.current,
        settings: readSettings(),
      },
      card.id,
      how,
      a,
      new Date(),
    )
    writeStored(KEYS.safetyState, result.state)
    writeStored(KEYS.safetyLog, result.log)
    writeDay(result.day)
    return result.scheduled
  }, [])

  const next = useCallback(() => setPinned(null), [])
  const card = pinned ? byId.get(pinned.id) : undefined
  const doneCount = day.done.length + day.repeatsDone.length
  const total = day.ids.length + day.repeats.length
  const todayRows = log.filter((r) => r.how === 'first' && localDay(new Date(r.at)) === day.date)
  const rightToday = todayRows.filter((r) => r.ok && !r.shownAnswer).length
  const unseenLeft = file.cards.filter((c) => !state[c.id] && !day.ids.includes(c.id)).length

  const nextDue = useMemo(() => {
    const dates = Object.entries(state)
      .filter(([id, s]) => byId.has(id) && !s.retired)
      .map(([, s]) => localDay(new Date(s.due)))
      .filter((d) => d > day.date)
      .sort()
    return dates.length ? { date: dates[0], count: dates.filter((d) => d === dates[0]).length } : null
  }, [state, byId, day.date])

  const setCap = (field: 'newPerDay' | 'maxReviews', value: number) => writeSettings({ ...readSettings(), [field]: value })

  const todayCard = (
    <section className="card safety-today zen-hide" aria-labelledby="safety-today-title">
      <div className="card-title" id="safety-today-title">
        Today
      </div>
      <div className="progress" aria-hidden>
        <span style={{ width: `${total ? Math.round((100 * Math.min(doneCount, total)) / total) : 0}%` }} />
      </div>
      <p className="small muted">
        {doneCount} of {total} done · {day.ids.length - day.newIds.length} review{day.ids.length - day.newIds.length === 1 ? '' : 's'},{' '}
        {day.newIds.length} new{day.repeats.length ? `, ${day.repeats.length} second look${day.repeats.length === 1 ? '' : 's'}` : ''}
      </p>
      <Stepper label="New positions a day" value={settings.newPerDay} limits={SETTING_LIMITS.newPerDay} onChange={(n) => setCap('newPerDay', n)} />
      <Stepper label="Reviews a day (at most)" value={settings.maxReviews} limits={SETTING_LIMITS.maxReviews} onChange={(n) => setCap('maxReviews', n)} />
      <p className="small muted safety-rule">
        On your own mistakes a move counts as safe when it keeps your winning chances within 4 points of the best move: the
        rule Lichess uses in “Learn from your mistakes”. On the other positions any move is fine that leaves him nothing to
        win and no mate. Positions come back after days and weeks, and leave once you get them right after two weeks or
        more.
      </p>
    </section>
  )

  if (card && pinned) {
    return (
      <SafetyCardView
        key={pinned.key}
        card={card}
        how={pinned.how}
        lastLine={pinned.lastLine}
        position={{ index: Math.min(total, pinned.index), total }}
        hasNext={remaining.filter((id) => id !== pinned.id).length > 0}
        onAnswer={onAnswer}
        onNext={next}
        aside={todayCard}
      />
    )
  }
  return (
    <div className="safety-stack">
      <section className="card safety-done">
        <span className="safety-locked-icon is-good">
          <ShieldCheck size={26} aria-hidden />
        </span>
        <div>
          <h2>{file.cards.length === 0 ? 'No positions yet' : total === 0 ? 'Nothing to do today' : 'Done for today'}</h2>
          <p>
            {file.cards.length === 0
              ? 'The daily check adds positions from your rated Lichess games. Come back after your next game.'
              : todayRows.length
                ? `You answered ${todayRows.length} position${todayRows.length === 1 ? '' : 's'} today and ${rightToday} ${rightToday === 1 ? 'was' : 'were'} safe on the first try.`
                : 'No reviews are due and no new positions are planned for today.'}
          </p>
          {nextDue && (
            <p className="small muted">
              Next reviews: {nextDue.count} position{nextDue.count === 1 ? '' : 's'} on {nextDue.date}.
            </p>
          )}
          {unseenLeft > 0 && (
            <button type="button" className="btn" onClick={() => writeDay(addMoreNew(readDay() ?? day, file.cards, readState(), 5))}>
              <Plus size={16} aria-hidden /> 5 more new positions
            </button>
          )}
        </div>
      </section>
      {todayCard}
    </div>
  )
}

function SafetyTrainer() {
  const cards = useSafetyCards(true)
  return (
    <div className="page safety-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Your study</div>
          <h1>Safety check</h1>
        </div>
      </div>
      {cards.status === 'ready' ? (
        <SafetySession file={cards.file} />
      ) : cards.status === 'error' ? (
        <section className="card safety-done" role="alert">
          <div>
            <h2>The positions could not be loaded</h2>
            <p>{cards.message}</p>
            <button type="button" className="btn primary" onClick={cards.retry}>
              Try again
            </button>
          </div>
        </section>
      ) : (
        <div className="board-layout safety-layout" aria-busy="true">
          <div className="board-col">
            <div className="safety-skeleton" />
          </div>
          <div className="side-col">
            <section className="card safety-prompt">
              <h2>Loading your positions…</h2>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

/** The page: locked until the study gate opens. */
export default function SafetyPage() {
  const gate = useStudyGate()
  return gate.unlocked ? <SafetyTrainer /> : <SafetyLocked gate={gate} />
}
