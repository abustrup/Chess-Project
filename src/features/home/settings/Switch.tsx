// An on/off switch with a label and a short explanation. A real checkbox underneath, so it works with
// the keyboard (Space) and screen readers ("switch, on").

interface Props {
  label: string
  hint: string
  checked: boolean
  onChange: (next: boolean) => void
}

export default function Switch({ label, hint, checked, onChange }: Props) {
  return (
    <label className="switch-row">
      <span className="switch-text">
        <strong>{label}</strong>
        <span className="muted small">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        className="switch-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden />
    </label>
  )
}
