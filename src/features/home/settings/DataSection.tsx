import { useEffect, useRef, useState } from 'react'
import { Database, Download, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { DEFAULT_PROFILE } from '../../../types'
import { KEYS, useStored } from '../../../lib/storage'
import { plural } from '../format'
import { NO_OPENING_PROGRESS, NO_PUZZLE_STATS, NO_TACTICS_PROGRESS } from '../defaults'
import SettingsCard from './SettingsCard'
import {
  MAX_BACKUP_BYTES,
  clearAllData,
  downloadBackup,
  parseBackup,
  restoreBackup,
  summariseData,
  type Backup,
  type DataSummary,
} from './backup'

/** After a restore or a reset the page reloads so every part of the app reads the new data; this note survives the reload. */
const FLASH_KEY = 'cc-settings-note'

type Panel =
  | { kind: 'none' }
  | { kind: 'restore'; fileName: string; backup: Backup; summary: DataSummary }
  | { kind: 'reset' }
  | { kind: 'error'; message: string }

function describe(summary: DataSummary): string {
  const parts: string[] = []
  if (summary.games) parts.push(plural(summary.games, 'game'))
  if (summary.openingChapters) parts.push(`${plural(summary.openingChapters, 'opening chapter')} practised`)
  if (summary.tacticLessons) parts.push(`${plural(summary.tacticLessons, 'tactics lesson')} started`)
  if (summary.puzzlesTried) parts.push(`${plural(summary.puzzlesTried, 'puzzle')} tried`)
  return parts.length > 0 ? parts.join(', ') : 'no games or progress yet'
}

/** '13 October 2026', or '' when the backup has no readable date (an edited or very old file). */
function savedOn(iso: string): string {
  const date = new Date(iso)
  return iso && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
}

function readFlash(): string {
  try {
    return sessionStorage.getItem(FLASH_KEY) ?? ''
  } catch {
    return ''
  }
}

function reloadWithNote(note: string) {
  try {
    sessionStorage.setItem(FLASH_KEY, note)
  } catch {
    /* the reload still works, just without the note */
  }
  window.location.reload()
}

export default function DataSection() {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const [games] = useStored<unknown>(KEYS.games, [])
  const [openingProgress] = useStored(KEYS.openingProgress, NO_OPENING_PROGRESS)
  const [tacticsProgress] = useStored(KEYS.tacticsProgress, NO_TACTICS_PROGRESS)
  const [puzzleStats] = useStored(KEYS.puzzleStats, NO_PUZZLE_STATS)

  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [note, setNote] = useState(readFlash)
  const fileInput = useRef<HTMLInputElement>(null)
  const restoreButton = useRef<HTMLButtonElement>(null)
  const resetButton = useRef<HTMLButtonElement>(null)

  /** Closes the question box and puts keyboard focus back on the button that opened it, so nobody loses their place. */
  function close() {
    const back = panel.kind === 'reset' ? resetButton.current : restoreButton.current
    setPanel({ kind: 'none' })
    back?.focus()
  }

  useEffect(() => {
    try {
      sessionStorage.removeItem(FLASH_KEY)
    } catch {
      /* nothing to clean up */
    }
  }, [])

  const current = summariseData({
    'cc.profile': profile,
    'cc.games': games,
    'cc.openingProgress': openingProgress,
    'cc.tacticsProgress': tacticsProgress,
    'cc.puzzleStats': puzzleStats,
  })

  function download() {
    downloadBackup()
    setPanel({ kind: 'none' })
    setNote('Your backup is downloading. Keep the file somewhere safe, like a cloud folder or a USB stick.')
  }

  async function chooseFile(file: File | undefined) {
    if (!file) return
    setNote('')
    if (file.size > MAX_BACKUP_BYTES) {
      setPanel({ kind: 'error', message: 'This file is much too big to be a Chess Coach backup.' })
      return
    }
    const result = parseBackup(await file.text())
    setPanel(
      result.ok
        ? { kind: 'restore', fileName: file.name, backup: result.backup, summary: result.summary }
        : { kind: 'error', message: result.error },
    )
  }

  function restore(backup: Backup) {
    try {
      restoreBackup(backup)
    } catch {
      setPanel({
        kind: 'error',
        message: 'Your browser would not save the backup (its storage may be full or blocked). Your old data is still there.',
      })
      return
    }
    reloadWithNote('Backup restored. Welcome back!')
  }

  function reset() {
    clearAllData()
    reloadWithNote('Everything was reset. You are starting fresh.')
  }

  return (
    <SettingsCard icon={Database} title="Your data" className="zen-hide">
      <div className="callout data-callout">
        <ShieldCheck size={22} aria-hidden />
        <p>
          Everything you do here is saved in this browser, on this device only. Nothing is sent to a server, so it stays private. But if you
          clear your browser data or switch to another computer, it starts from zero.{' '}
          <strong>A backup file is your safety net,</strong> so download one every now and then.
        </p>
      </div>
      <p className="muted">Saved here right now: {describe(current)}.</p>

      <div className="row wrap">
        <button className="btn primary" onClick={download}>
          <Download size={17} aria-hidden /> Download backup
        </button>
        <button ref={restoreButton} className="btn" onClick={() => fileInput.current?.click()}>
          <Upload size={17} aria-hidden /> Restore from backup
        </button>
        <button ref={resetButton} className="btn danger" onClick={() => setPanel({ kind: 'reset' })}>
          <Trash2 size={17} aria-hidden /> Start over
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Choose a backup file"
          onChange={(e) => {
            void chooseFile(e.target.files?.[0])
            e.target.value = '' // so choosing the same file again works
          }}
        />
      </div>

      {note && (
        <p className="settings-note" role="status">
          {note}
        </p>
      )}

      {panel.kind === 'restore' && (
        <div className="callout warn data-panel" role="alertdialog" aria-labelledby="restore-title">
          <div>
            <h3 id="restore-title">Restore this backup?</h3>
            <p>
              <strong>{panel.fileName}</strong>
              {savedOn(panel.backup.exportedAt) && ` (saved ${savedOn(panel.backup.exportedAt)})`}{' '}
              holds {describe(panel.summary)}. Restoring replaces everything you have saved here now.
            </p>
            <div className="row wrap">
              <button className="btn primary" onClick={() => restore(panel.backup)}>
                Replace my data with this backup
              </button>
              <button className="btn ghost" onClick={close}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {panel.kind === 'reset' && (
        <div className="callout bad data-panel" role="alertdialog" aria-labelledby="reset-title">
          <div>
            <h3 id="reset-title">Delete everything and start over?</h3>
            <p>
              This removes your profile, games, lesson progress, puzzle rating and settings from this browser. It cannot be undone.
              Tip: download a backup first.
            </p>
            <div className="row wrap">
              <button className="btn" autoFocus onClick={close}>
                Keep my data
              </button>
              <button className="btn danger" onClick={reset}>
                Yes, delete everything
              </button>
            </div>
          </div>
        </div>
      )}

      {panel.kind === 'error' && (
        <div className="callout bad data-panel" role="alert">
          <div>
            <h3>That did not work</h3>
            <p>{panel.message}</p>
            <button className="btn" onClick={close}>
              OK
            </button>
          </div>
        </div>
      )}
    </SettingsCard>
  )
}
