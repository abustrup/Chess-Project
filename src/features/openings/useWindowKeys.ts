import { useEffect, useRef } from 'react'

/**
 * Listens for keys on the whole page. The handler returns true when it used the key
 * (then we stop the browser from also scrolling). Typing in a text box is never hijacked.
 */
export function useWindowKeys(handler: (e: KeyboardEvent) => boolean) {
  const latest = useRef(handler)
  useEffect(() => {
    latest.current = handler
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (latest.current(e)) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
