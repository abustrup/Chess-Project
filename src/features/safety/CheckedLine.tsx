import { useEffect, useRef } from 'react'
import { MAX_LINE } from './useSafetyRun'

interface Props {
  value: string
  error: string | null
  /** The move on the board, e.g. "Nxe5". */
  moveSan: string
  onChange: (text: string) => void
  onConfirm: () => void
  onChangeMove: () => void
  busy?: boolean
}

/** The one-line box: what did you check before this move? It takes focus as soon as the move is made. */
export default function CheckedLine({ value, error, moveSan, onChange, onConfirm, onChangeMove, busy = false }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    input.current?.focus({ preventScroll: true })
    // On a phone the box opens below the board, often under the bottom menu or off the screen: scroll just enough
    // to show it with its buttons (safety.css keeps it clear of both bars). Nothing moves when it is already in view.
    form.current?.scrollIntoView({ block: 'nearest' })
  }, [])

  return (
    <form
      ref={form}
      className="safety-line"
      onSubmit={(e) => {
        e.preventDefault()
        onConfirm()
      }}
    >
      <label htmlFor="safety-checked" className="safety-line-label">
        Before you see the answer: what did you check?
      </label>
      <input
        id="safety-checked"
        ref={input}
        className="input safety-line-input"
        type="text"
        autoComplete="off"
        enterKeyHint="done"
        maxLength={MAX_LINE}
        placeholder="e.g. his Bc4 hits f7"
        value={value}
        aria-invalid={!!error}
        aria-describedby="safety-line-help"
        onChange={(e) => onChange(e.target.value)}
        disabled={busy}
      />
      <div id="safety-line-help" className={`safety-line-help ${error ? 'is-error' : ''}`} role={error ? 'alert' : undefined}>
        {error ?? `${value.length} of ${MAX_LINE} characters. "nothing" is a fine answer.`}
      </div>
      <div className="safety-buttons">
        <button type="submit" className="btn primary" disabled={busy}>
          Confirm {moveSan}
        </button>
        <button type="button" className="btn" onClick={onChangeMove} disabled={busy}>
          Change move
        </button>
      </div>
    </form>
  )
}
