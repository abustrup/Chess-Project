import { useEffect, useRef } from 'react'

/**
 * Keyboard shortcuts for a page. `handlers` maps a key ('ArrowRight', 'h' ...) to what it does.
 * Letters are matched without caring about Shift / Caps Lock. Typing in a text box never triggers them.
 */
export function useShortcuts(handlers: Record<string, (() => void) | undefined>) {
  // keep the newest handlers in a ref so the listener below is only added once
  const latest = useRef(handlers)
  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const action = latest.current[key]
      if (action) {
        e.preventDefault()
        action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
