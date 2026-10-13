import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Board from '../../../components/Board'
import { DEFAULT_PROFILE, type IdeaCard, type Side } from '../../../types'
import { KEYS, useStored } from '../../../lib/storage'
import { piecesFor } from '../../../lib/pieceSets'
import { glyphOf } from '../treeUtils'

// Small building blocks shared by all the openings pages.

/** A king in the colour the user plays, drawn with the user's own piece set. */
export function SideIcon({ side, size = 56 }: { side: Side; size?: number }) {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const King = piecesFor(profile.pieceSet)[side === 'white' ? 'wK' : 'bK']
  return (
    <span className={`op-side-icon ${side}`} style={{ width: size, height: size, padding: Math.round(size * 0.09) }} aria-hidden>
      {King ? King() : null}
    </span>
  )
}

/** Progress bar with a plain percentage next to it. */
export function MasteryBar({ value, label = 'Learned', showLabel = true }: { value: number; label?: string; showLabel?: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="op-mastery" title={`${label}: ${pct}%`}>
      {showLabel && <span className="op-mastery-label small muted">{label}</span>}
      <div
        className="progress"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="op-mastery-pct">{pct}%</span>
    </div>
  )
}

const DIFFICULTY_WORDS = ['', 'Easy', 'Medium', 'Tricky']

/** Three dots plus a word, so difficulty never depends on colour alone. */
export function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="op-difficulty" title={`Difficulty: ${DIFFICULTY_WORDS[level]}`}>
      <span className="op-dots" aria-hidden>
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= level ? 'on' : ''} />
        ))}
      </span>
      <span>{DIFFICULTY_WORDS[level]}</span>
    </span>
  )
}

/** The "!" or "?" mark of a move, with its meaning in words for screen readers and tooltips. */
export function GlyphBadge({ nags }: { nags: number[] }) {
  const g = glyphOf(nags)
  if (!g) return null
  return (
    <span className={`op-glyph ${g.tone}`} title={g.label} aria-label={g.label}>
      {g.text}
    </span>
  )
}

export function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="op-crumbs" aria-label="You are here">
      {items.map((item, i) => (
        <span key={item.label + i} className="op-crumb">
          {i > 0 && <ChevronRight size={14} aria-hidden />}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}

/** A small look-only board for the idea cards. */
export function MiniBoard({ card, fallbackSide }: { card: IdeaCard; fallbackSide: Side }) {
  if (!card.fen) return null
  return (
    <div className="op-mini-board" role="img" aria-label={`Diagram for: ${card.title}`}>
      <Board
        fen={card.fen}
        orientation={card.orientation ?? fallbackSide}
        interactive={false}
        arrows={card.arrows}
        highlights={card.highlights}
        showCoordinates={false}
        animationMs={0}
      />
    </div>
  )
}

/** Friendly page for a wrong address or a broken chapter. */
export function Notice({ title, children, back }: { title: string; children: ReactNode; back?: { to: string; label: string } }) {
  return (
    <div className="page op-page">
      <div className="card op-notice">
        <h1>{title}</h1>
        <div className="muted">{children}</div>
        {back && (
          <p>
            <Link className="btn primary" to={back.to}>
              {back.label}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
