import { useEffect } from 'react'
import { Leaf, LogOut } from 'lucide-react'
import { DEFAULT_PROFILE } from '../types'
import { KEYS, useStored } from '../lib/storage'

/** Floating button (always visible) + keyboard shortcut "Z" that switches zen mode on and off. */
export default function ZenToggle() {
  const [profile, setProfile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const zen = profile.zenMode

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'z' || e.key === 'Z') setProfile((p) => ({ ...p, zenMode: !p.zenMode }))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setProfile])

  return (
    <button
      className="zen-toggle"
      onClick={() => setProfile((p) => ({ ...p, zenMode: !p.zenMode }))}
      title={zen ? 'Leave zen mode (Z)' : 'Zen mode (Z): just the board'}
      aria-pressed={zen}
    >
      {zen ? <LogOut size={16} /> : <Leaf size={16} />}
      <span>{zen ? 'Leave zen' : 'Zen'}</span>
    </button>
  )
}
