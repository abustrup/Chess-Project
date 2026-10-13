import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, Search, Shuffle, X } from 'lucide-react'
import type { PuzzleIndex, PuzzleIndexEntry } from '../../types'
import { groupEntries } from '../../lib/puzzleData'
import { plainBlurb, type Choice } from './choice'

interface Props {
  index: PuzzleIndex
  current: Choice
  onPick: (choice: Choice) => void
  onClose: () => void
}

interface Option {
  choice: Choice
  title: string
  blurb: string
  count: number
}
interface Section {
  title: string
  options: Option[]
}

function buildSections(index: PuzzleIndex): Section[] {
  const themeTotal = index.entries.filter((e) => e.kind === 'theme').reduce((sum, e) => sum + e.count, 0)
  const openingTotal = index.entries.filter((e) => e.kind === 'opening').reduce((sum, e) => sum + e.count, 0)
  const groups = groupEntries(index)
  const openingGroup = groups.find((g) => g.entries.every((e) => e.kind === 'opening'))
  const optionFor = (e: PuzzleIndexEntry): Option => ({
    choice: `${e.kind}:${e.key}`,
    title: e.label,
    blurb: plainBlurb(e.description),
    count: e.count,
  })

  const quick: Option[] = [
    { choice: 'mixed', title: 'Mixed', blurb: 'A bit of everything. You will not know the theme until you have solved it, just like in a real game.', count: themeTotal },
  ]
  if (openingGroup) {
    quick.push({
      choice: 'openings',
      title: 'Puzzles from your openings',
      blurb: 'London, Caro-Kann and Slav together. Great for spotting tactics in positions you really get.',
      count: openingTotal,
    })
  }

  const sections: Section[] = [{ title: 'Quick start', options: quick }]
  if (openingGroup) sections.push({ title: 'One of your openings', options: openingGroup.entries.map(optionFor) })
  for (const group of groups) {
    if (group !== openingGroup) sections.push({ title: group.title, options: group.entries.map(optionFor) })
  }
  return sections
}

/** The "What do you want to train?" window: Mixed, your openings, or one theme. Searchable. */
export default function TopicPicker({ index, current, onPick, onClose }: Props) {
  const [query, setQuery] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const sections = useMemo(() => buildSections(index), [index])

  // The parent may hand over a new onClose on every render; keeping it in a ref lets the effect below run only
  // once, so the window does not grab the keyboard focus back from the search box while the player types.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  // Close with Escape; keep Tab inside the window; keep the page behind from scrolling;
  // start with focus inside the window and give it back to the button that opened it.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const items = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const focused = document.activeElement
      if (!dialog.contains(focused) || focused === dialog) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      } else if (e.shiftKey && focused === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && focused === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // With a mouse, start in the search box so you can just type (and a "z" does not switch zen mode on).
    // On a phone, focus the window itself so the on-screen keyboard does not pop up and cover the list.
    const search = dialogRef.current?.querySelector<HTMLInputElement>('input[type="search"]')
    if (search && window.matchMedia?.('(pointer: fine)').matches) search.focus()
    else dialogRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const visible = sections
    .map((section) => ({
      ...section,
      options: section.options.filter((o) => {
        const text = `${o.title} ${o.blurb} ${section.title} ${o.choice}`.toLowerCase()
        return words.every((w) => text.includes(w))
      }),
    }))
    .filter((section) => section.options.length > 0)

  return (
    <div className="picker-backdrop" onMouseDown={onClose}>
      <div
        className="picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        tabIndex={-1}
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="picker-head">
          <div>
            <h2 id="picker-title">What do you want to train?</h2>
            <p className="muted small">Pick a theme and every puzzle will be about it. Or pick Mixed for a surprise.</p>
          </div>
          <button className="btn icon ghost" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>

        <label className="picker-search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            className="input"
            placeholder="Search, e.g. fork, mate, endgame…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search themes"
          />
        </label>

        <div className="picker-scroll">
          {visible.length === 0 && (
            <p className="muted">
              Nothing matches "{query}". Try a shorter word, like "mate" or "pin".
            </p>
          )}
          {visible.map((section) => (
            <section key={section.title}>
              <h3 className="picker-section">{section.title}</h3>
              <div className="topic-grid">
                {section.options.map((o) => (
                  <button
                    key={o.choice}
                    className={`topic-card ${o.choice === current ? 'selected' : ''}`}
                    aria-pressed={o.choice === current}
                    onClick={() => onPick(o.choice)}
                  >
                    <span className="topic-card-top">
                      {o.choice === 'mixed' && <Shuffle size={16} className="topic-card-icon" aria-hidden />}
                      {o.choice.startsWith('opening') && <BookOpen size={16} className="topic-card-icon" aria-hidden />}
                      <strong>{o.title}</strong>
                      {o.choice === current && <Check size={16} className="topic-card-check" aria-label="Selected" />}
                    </span>
                    <span className="topic-card-text">{o.blurb}</span>
                    <span className="chip topic-card-count">{o.count.toLocaleString('en-US')} puzzles</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
