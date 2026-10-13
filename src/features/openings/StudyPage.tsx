import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, ChevronLeft, ChevronRight, Dumbbell, Pause, Play, RotateCcw, Shuffle, Swords } from 'lucide-react'
import Board from '../../components/Board'
import { pathTo, type PgnNode, type PgnTree } from '../../lib/pgnTree'
import ChapterGate, { type ChapterContext } from './ChapterGate'
import { playSound } from '../../lib/sound'
import { markStudied, sortedChapters } from './progress'
import { colourName, isUserTurn, leavesUnder, lineCount, moveLabel, soundFor, turnAfter, userColour } from './treeUtils'
import { ModeHeader } from './components/ModeHeader'
import { GlyphBadge } from './components/shared'
import { LineSoFar } from './components/LineSoFar'
import { useWindowKeys } from './useWindowKeys'

// Study mode: a guided walk through the chapter. The coach explains every move; you step with the
// buttons or the arrow keys, and pick which reply to explore when the opponent has several.

export default function StudyPage() {
  return <ChapterGate>{(ctx) => <StudySession key={`${ctx.course.id}/${ctx.chapter.id}`} {...ctx} />}</ChapterGate>
}

function StudySession({ course, chapter, tree }: ChapterContext) {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const startId = search.get('node')
  const [nodeId, setNodeId] = useState(() => (startId && tree.nodes.has(startId) ? startId : ''))
  const [autoplay, setAutoplay] = useState(false)
  const [seenLeaves, setSeenLeaves] = useState<ReadonlySet<string>>(() => new Set())

  const node = tree.nodes.get(nodeId) ?? tree.root
  const me = userColour(course)
  const children = node.children
  const atEnd = children.length === 0
  const totalLines = useMemo(() => lineCount(tree), [tree])
  const path = useMemo(() => pathTo(tree, node.id), [tree, node.id])

  const next = useCallback(() => {
    if (node.children.length) setNodeId(node.children[0].id)
  }, [node])
  const previous = useCallback(() => {
    if (node.parentId !== null) setNodeId(node.parentId)
  }, [node])
  const restart = useCallback(() => {
    setNodeId('')
    setAutoplay(false)
  }, [])
  const choose = useCallback(
    (index: number) => {
      const child = node.children[index]
      if (child) setNodeId(child.id)
    },
    [node],
  )

  // A little click when a move is shown (not when the page first opens).
  const shownBefore = useRef(false)
  useEffect(() => {
    if (shownBefore.current && node.san) playSound(soundFor(node.san))
    shownBefore.current = true
  }, [node])

  // Reaching the end of any line counts as having studied the chapter.
  useEffect(() => {
    if (!atEnd || node.id === '') return
    setSeenLeaves((seen) => (seen.has(node.id) ? seen : new Set(seen).add(node.id)))
    markStudied(course.id, chapter.id)
  }, [atEnd, node.id, course.id, chapter.id])

  // Autoplay: wait long enough to read the comment, then step on.
  useEffect(() => {
    if (!autoplay) return
    if (atEnd) {
      setAutoplay(false)
      return
    }
    const wait = Math.min(8000, 1800 + node.comment.length * 40)
    const timer = window.setTimeout(next, wait)
    return () => window.clearTimeout(timer)
  }, [autoplay, atEnd, node, next])

  useWindowKeys((e) => {
    if (e.key === 'ArrowRight') next()
    else if (e.key === 'ArrowLeft') previous()
    else if (e.key === 'Home') restart()
    else if (e.key === ' ' && !isButtonLike(e.target)) setAutoplay((a) => !a)
    else if (/^[1-9]$/.test(e.key) && children.length > 1) choose(Number(e.key) - 1)
    else return false
    return true
  })

  function tryFromHere() {
    navigate(`/openings/${course.id}/${chapter.id}/drill${node.id ? `?from=${encodeURIComponent(node.id)}` : ''}`)
  }

  /** Jump to the first move of a branch you have not seen yet. */
  function jumpToUnseen() {
    setNodeId(findUnseenBranch(tree, seenLeaves, node) ?? '')
    setAutoplay(false)
  }

  const lastMove: [string, string] | null = node.uci ? [node.uci.slice(0, 2), node.uci.slice(2, 4)] : null
  const allSeen = seenLeaves.size >= totalLines
  const chapters = sortedChapters(course)
  const nextChapter = chapters[chapters.findIndex((c) => c.id === chapter.id) + 1]

  return (
    <div className="page op-page">
      <ModeHeader course={course} chapter={chapter} mode="study" />
      <div className="board-layout">
        <div className="board-col op-board-col">
          <Board
            fen={node.fen}
            orientation={course.side}
            interactive={false}
            lastMove={lastMove}
            arrows={node.arrows}
            highlights={node.highlights}
          />
          <div className="op-controls" role="group" aria-label="Move through the lesson">
            <button className="btn icon" onClick={restart} disabled={node.id === ''} aria-label="Back to the start (Home)" title="Back to the start (Home)">
              <RotateCcw size={18} />
            </button>
            <button className="btn icon" onClick={previous} disabled={node.parentId === null} aria-label="Previous move (left arrow)" title="Previous move (left arrow)">
              <ChevronLeft size={20} />
            </button>
            <button className="btn primary op-next-btn" onClick={next} disabled={atEnd} aria-label="Next move (right arrow)" title="Next move (right arrow)">
              Next <ChevronRight size={20} />
            </button>
            <button
              className="btn icon"
              onClick={() => setAutoplay((a) => !a)}
              disabled={atEnd}
              aria-pressed={autoplay}
              aria-label={autoplay ? 'Pause autoplay (space)' : 'Autoplay the lesson (space)'}
              title={autoplay ? 'Pause autoplay (space)' : 'Autoplay the lesson (space)'}
            >
              {autoplay ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </div>

        <div className="side-col">
          <CoachCard node={node} meColour={me} course={course} onTry={tryFromHere} />

          {children.length > 1 && <Choices node={node} course={course} seenLeaves={seenLeaves} onPick={choose} />}

          {atEnd && node.id !== '' && (
            <section className="card op-end zen-keep">
              <h2>{allSeen ? 'You have seen every line!' : 'End of this line'}</h2>
              <p className="muted">
                {allSeen
                  ? 'Now try it from memory. That is where it really sticks.'
                  : `You have seen ${seenLeaves.size} of ${totalLines} lines in this chapter. There is more to explore.`}
              </p>
              <div className="row wrap">
                {!allSeen && (
                  <button className="btn primary" onClick={jumpToUnseen}>
                    <Shuffle size={16} aria-hidden /> See another variation
                  </button>
                )}
                <Link className={`btn ${allSeen ? 'primary' : ''}`} to={`/openings/${course.id}/${chapter.id}/drill`}>
                  <Dumbbell size={16} aria-hidden /> Drill this chapter
                </Link>
                <Link className="btn" to={`/play?course=${course.id}&chapter=${chapter.id}&mode=practice`}>
                  <Swords size={16} aria-hidden /> Play it against the computer
                </Link>
                {nextChapter && (
                  <Link className="btn" to={`/openings/${course.id}/${nextChapter.id}/study`}>
                    Next chapter <ArrowRight size={16} aria-hidden />
                  </Link>
                )}
              </div>
            </section>
          )}

          <section className="card zen-hide">
            <div className="card-title">The line so far</div>
            <LineSoFar path={path} me={me} currentId={node.id} onJump={setNodeId} />
          </section>

          <section className="card op-study-stats zen-hide">
            <div className="row between">
              <span className="card-title">Lines seen</span>
              <span className="small muted">
                {seenLeaves.size} of {totalLines}
              </span>
            </div>
            <div className="progress" aria-hidden>
              <span style={{ width: `${Math.min(100, (seenLeaves.size / Math.max(1, totalLines)) * 100)}%` }} />
            </div>
            <p className="small faint op-keys">
              Keys: <kbd>←</kbd> <kbd>→</kbd> step · <kbd>Home</kbd> start · <kbd>Space</kbd> autoplay
              {children.length > 1 && (
                <>
                  {' '}
                  · <kbd>1</kbd>–<kbd>{Math.min(9, children.length)}</kbd> pick a move
                </>
              )}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

function isButtonLike(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && ['BUTTON', 'A', 'SUMMARY'].includes(target.tagName)
}

/** The first move of a branch you have not seen yet, as close to where you are as possible (null = all seen). */
function findUnseenBranch(tree: PgnTree, seen: ReadonlySet<string>, current: PgnNode): string | null {
  const unseenChild = (n: PgnNode) => n.children.find((c) => leavesUnder(c).some((l) => !seen.has(l.id)))
  // Look close to where the user is first: walk up from the current move ...
  for (let n: PgnNode | undefined = current; n; n = n.parentId === null ? undefined : tree.nodes.get(n.parentId)) {
    const child = n.children.length > 1 ? unseenChild(n) : undefined
    if (child) return child.id
  }
  // ... then anywhere in the chapter.
  for (const n of tree.nodes.values()) {
    const child = n.children.length > 1 ? unseenChild(n) : undefined
    if (child) return child.id
  }
  return null
}

/* ------------------------------------------------------------------ */

function CoachCard({
  node,
  meColour,
  course,
  onTry,
}: {
  node: PgnNode
  meColour: 'w' | 'b'
  course: ChapterContext['course']
  onTry: () => void
}) {
  const mine = node.mover === meColour
  const isStart = node.id === ''
  return (
    <section className="card op-coach zen-keep" aria-live="polite">
      <div className="op-coach-head">
        {isStart ? (
          <span className="op-tag">Start</span>
        ) : (
          <span className={`op-tag ${mine ? 'you' : 'them'}`}>{mine ? 'Your move' : `${colourName(node.mover!)}'s move`}</span>
        )}
        {!isStart && (
          <span className="op-move-big">
            {moveLabel(node)} <GlyphBadge nags={node.nags} />
          </span>
        )}
      </div>
      {node.comment ? (
        <p className="op-coach-text">{node.comment}</p>
      ) : (
        <p className="op-coach-text muted">
          {isStart
            ? `Let's begin! You play ${course.side === 'white' ? 'White' : 'Black'} in this chapter. Press Next to see the first move.`
            : 'No extra note for this move. Keep going.'}
        </p>
      )}
      <div className="op-coach-foot">
        <button className="btn small" onClick={onTry}>
          <Dumbbell size={15} aria-hidden /> Try it yourself from here
        </button>
      </div>
    </section>
  )
}

function Choices({
  node,
  course,
  seenLeaves,
  onPick,
}: {
  node: PgnNode
  course: ChapterContext['course']
  seenLeaves: ReadonlySet<string>
  onPick: (index: number) => void
}) {
  const yourTurn = isUserTurn(node, course)
  const mover = turnAfter(node)
  return (
    <section className="card op-choices zen-keep" aria-label="Choose a move to explore">
      <h3>{yourTurn ? 'You could also play' : `${colourName(mover)} can also play`}</h3>
      <p className="small muted">
        {yourTurn
          ? 'The first one is the move to learn. The others are fine too.'
          : 'Pick a reply to see how you answer it. "Next" follows the first one.'}
      </p>
      <div className="row wrap">
        {node.children.map((child, i) => {
          const done = leavesUnder(child).every((l) => seenLeaves.has(l.id))
          return (
            <button key={child.id} className="btn op-choice" onClick={() => onPick(i)} title={`Show ${child.san} (key ${i + 1})`}>
              <kbd>{i + 1}</kbd>
              <span className="op-choice-san">{child.san}</span>
              <GlyphBadge nags={child.nags} />
              {i === 0 && <span className="op-choice-note">{yourTurn ? 'learn' : 'main'}</span>}
              {done && <Check size={14} aria-label="already seen" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
