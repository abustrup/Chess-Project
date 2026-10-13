import type { ReactNode } from 'react'

interface Props {
  /** radio group name: all cards of one choice share it, which gives arrow-key movement for free */
  group: string
  checked: boolean
  onSelect: () => void
  className?: string
  children: ReactNode
}

/** A big clickable card that behaves like a radio button (keyboard, screen readers and all). */
export default function ChoiceCard({ group, checked, onSelect, className = '', children }: Props) {
  return (
    <label className={`choice ${className}`}>
      <input type="radio" name={group} checked={checked} onChange={onSelect} />
      <span className="choice-body">{children}</span>
    </label>
  )
}
