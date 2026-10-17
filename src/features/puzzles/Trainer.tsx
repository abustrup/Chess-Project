import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Shuffle, Timer } from 'lucide-react'
import type { PuzzleIndex } from '../../types'
import { KEYS, useStored, writeStored } from '../../lib/storage'
import type { BoardMove } from '../../components/Board'
import PuzzleBoard from './PuzzleBoard'
import PromptCard, { type ThemeNote } from './PromptCard'
import StatsPanel from './StatsPanel'
import TopicPicker from './TopicPicker'
import { DEFAULT_CHOICE, EASY_BELOW, choiceFromParams, describeChoice, easyFromParams, entriesFor, isValidChoice, type Choice } from './choice'
import { applyAttempt } from './rating'
import { markSeen, pickNext, readSeen } from './selection'
import { readPuzzleStats, useRushBest, useStatsOpen, usePuzzleStats } from './stored'
import { isLastUserMove, judgeMove, prepare, usePuzzleRun, type RunState } from './useRun'
import { errorMessage } from './errors'

interface Props {
  index: PuzzleIndex
  onStartRush: () => void
}

type Status = 'loading' | 'ready' | 'error'

/** How many puzzles in a row may turn out damaged before we give up (very unlikely). */
const MAX_DAMAGED = 5

/** The main experience: one puzzle at a time, near your rating, from the topic you chose. */
export default function Trainer({ index, onStartRush }: Props) {
  const [params, setParams] = useSearchParams()
  const [storedChoice, setStoredChoice] = useStored<unknown>('puzzles.choice', DEFAULT_CHOICE)
  const [statsOpen, setStatsOpen] = useStatsOpen()
  const [rushBest] = useRushBest()
  const stats = usePuzzleStats()
  const { run, dispatch } = usePuzzleRun()

  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [delta, setDelta] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  /* ---- what are we training? (a link such as /puzzles?theme=fork wins over the last choice) ---- */
  const linkChoice = choiceFromParams(params)
  const linkIsValid = linkChoice !== null && isValidChoice(linkChoice, index)
  const choice: Choice = linkChoice && linkIsValid ? linkChoice : isValidChoice(storedChoice, index) ? (storedChoice as Choice) : DEFAULT_CHOICE
  const info = describeChoice(choice, index)
  // Home's daily block links here with level=easy: puzzles about 300 below his rating while he stays on that link.
  const easy = linkChoice !== null && linkIsValid && easyFromParams(params)

  // Remember a choice that came from a link, so /puzzles on its own continues with it next time.
  useEffect(() => {
    if (linkChoice && linkIsValid) setStoredChoice(linkChoice)
  }, [linkChoice, linkIsValid, setStoredChoice])

  const themeNames = useMemo(
    () => new Map(index.entries.filter((e) => e.kind === 'theme').map((e) => [e.key, e.label])),
    [index],
  )
  const themeDescriptions = useMemo(
    () => new Map(index.entries.filter((e) => e.kind === 'theme').map((e) => [e.key, e.description ?? e.label])),
    [index],
  )

  /* ---- getting the next puzzle ---- */
  const latestRequest = useRef(0)
  const recordedFor = useRef<string | null>(null)

  const loadNext = useCallback(async () => {
    const request = ++latestRequest.current
    setStatus('loading')
    try {
      const entries = entriesFor(choice, index)
      for (let tries = 0; tries < MAX_DAMAGED; tries++) {
        const targetRating = readPuzzleStats().rating - (easy ? EASY_BELOW : 0)
        const pick = await pickNext(entries, { targetRating, exclude: readSeen(), startOverWhenEmpty: true })
        if (request !== latestRequest.current) return // the player chose something else meanwhile
        if (!pick) throw new Error('There are no puzzles in this topic yet.')
        markSeen(pick.puzzle.id)
        const prepared = prepare(pick.puzzle)
        if (!prepared) continue // a damaged puzzle: skip it quietly
        setNotice(pick.startedOver ? 'You have seen every puzzle in this topic, so we are starting again from the beginning.' : '')
        setDelta(null)
        recordedFor.current = null
        dispatch({ type: 'load', ...prepared })
        setStatus('ready')
        return
      }
      throw new Error('We could not find a working puzzle. Please try another topic.')
    } catch (e) {
      if (request !== latestRequest.current) return
      setError(errorMessage(e))
      setStatus('error')
    }
  }, [choice, index, dispatch, easy])

  // Load a puzzle when the page opens and whenever the topic changes.
  useEffect(() => {
    void loadNext()
    return () => {
      latestRequest.current++
    }
  }, [loadNext])

  /* ---- recording the result (once per puzzle) ---- */
  function record(current: RunState, solved: boolean) {
    if (recordedFor.current === current.puzzle.id) return
    recordedFor.current = current.puzzle.id
    const result = applyAttempt(readPuzzleStats(), {
      puzzleId: current.puzzle.id,
      puzzleRating: current.puzzle.rating,
      themes: current.puzzle.themes,
      focusTheme: info.theme,
      solved,
      usedHint: current.usedHint,
      date: new Date().toISOString(),
    })
    writeStored(KEYS.puzzleStats, result.stats)
    setDelta(result.delta)
  }

  function handleMove(move: BoardMove): boolean {
    // Only when it is really your turn (a promotion menu left open can still send a move after the puzzle moved on).
    if (!run || status !== 'ready' || (run.phase !== 'solving' && run.phase !== 'wrong')) return false
    const verdict = judgeMove(run, move)
    if (verdict === 'wrong') {
      dispatch({ type: 'wrong' })
      record(run, false)
      return false // the piece goes back to where it came from
    }
    const finished = isLastUserMove(run, verdict)
    dispatch({ type: 'userMoved', move, verdict, finished })
    if (finished && !run.failed) record(run, true)
    return true
  }

  function showSolution() {
    if (!run) return
    record(run, false) // looking at the answer counts as a miss (only the first time)
    dispatch({ type: 'showSolution' })
  }

  /* ---- keyboard: H = hint, N = next ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (e.ctrlKey || e.metaKey || e.altKey || pickerOpen || !run) return
      const key = e.key.toLowerCase()
      if (key === 'h') dispatch({ type: 'hint' })
      if (key === 'n' && (run.phase === 'solved' || run.phase === 'shown') && status === 'ready') void loadNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run, status, pickerOpen, loadNext, dispatch])

  /* ---- choosing another topic ---- */
  function choose(next: Choice) {
    setPickerOpen(false)
    setStoredChoice(next)
    if (params.size > 0) setParams({}, { replace: true }) // forget ?theme= so the new choice is the one that counts
  }

  const themeNotes: ThemeNote[] = run
    ? run.puzzle.themes
        .filter((key) => themeDescriptions.has(key))
        .map((key) => ({ key, label: themeNames.get(key) ?? key, description: themeDescriptions.get(key) ?? '' }))
    : []

  return (
    <>
      {linkChoice && !linkIsValid && (
        <div className="callout warn puzzle-notice" role="status">
          <span>We do not have puzzles for “{linkChoice.split(':')[1]}”, so here is your last topic instead.</span>
        </div>
      )}
      {notice && (
        <div className="callout puzzle-notice zen-hide" role="status">
          <span>{notice}</span>
        </div>
      )}

      <div className="board-layout">
        <div className="board-col">
          {/* While the next puzzle is on its way (or failed to load), the puzzle still on the board is not playable. */}
          <PuzzleBoard run={run} onMove={handleMove} locked={status !== 'ready'} />
        </div>

        <div className="side-col">
          {status === 'error' ? (
            <section className="card prompt-card tone-bad zen-keep">
              <h2>We could not get a puzzle</h2>
              <p>{error}</p>
              <div className="prompt-buttons">
                <button className="btn primary" onClick={() => void loadNext()}>
                  Try again
                </button>
                <button className="btn" onClick={() => setPickerOpen(true)}>
                  Pick another topic
                </button>
              </div>
            </section>
          ) : !run ? (
            <section className="card prompt-card zen-keep" aria-busy="true">
              <h2>Finding a puzzle for you…</h2>
              <p>One that fits your level.</p>
            </section>
          ) : (
            <PromptCard
              run={run}
              topic={{ title: info.title, isTheme: info.theme !== undefined }}
              delta={delta}
              rating={stats.rating}
              busy={status === 'loading'}
              themes={themeNotes}
              onHint={() => dispatch({ type: 'hint' })}
              onTryAgain={() => dispatch({ type: 'tryAgain' })}
              onShowSolution={showSolution}
              onSkip={() => void loadNext()}
              onNext={() => void loadNext()}
            />
          )}

          <section className="card training-card zen-hide" aria-labelledby="training-title">
            <div className="card-title" id="training-title">
              Training
            </div>
            <div className="training-now">
              <div>
                <strong>{info.title}</strong>
                <div className="small muted">{info.blurb}</div>
                {easy && <div className="small muted">Easier puzzles, about {EASY_BELOW} below your puzzle rating.</div>}
              </div>
              <button className="btn small" onClick={() => setPickerOpen(true)}>
                <Shuffle size={15} aria-hidden /> Change
              </button>
            </div>
            <button className="btn rush-start" onClick={onStartRush}>
              <Timer size={17} aria-hidden /> Puzzle Rush · 3 minutes
            </button>
          </section>

          <StatsPanel
            stats={stats}
            themeNames={themeNames}
            open={statsOpen}
            onToggle={() => setStatsOpen(!statsOpen)}
            onTrain={(key) => choose(`theme:${key}`)}
            rushBest={rushBest}
          />
        </div>
      </div>

      {pickerOpen && <TopicPicker index={index} current={choice} onPick={choose} onClose={() => setPickerOpen(false)} />}
    </>
  )
}
