import { Fragment } from 'react'

/** A paragraph where **double stars** make words bold. Everything else is plain text. */
export default function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <p className={className}>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </p>
  )
}
