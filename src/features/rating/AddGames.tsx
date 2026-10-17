import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ClipboardPaste, Download, Loader2 } from 'lucide-react'
import { DEFAULT_PROFILE, type Side } from '../../types'
import { KEYS, useStored } from '../../lib/storage'
import { addGames } from '../review/gameStore'
import { LICHESS_WAIT_SECONDS, LichessImportError, cleanUsername, fetchLichessGames } from './lichessImport'
import { parsePgnText, toRecord, type ParsedGame } from './pgnImport'

// The two ways to bring games in: import them from Lichess, or paste PGN text.

export type AddMode = 'lichess' | 'paste' | null

function useCountdown(until: number): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (until <= Date.now()) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [until])
  return Math.max(0, Math.ceil((until - now) / 1000))
}

function LichessForm() {
  const [profile, setProfile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const [wait, setWait] = useStored<number>('rating.lichessWaitUntil', 0)
  const [name, setName] = useState(profile.lichessUsername)
  const [max, setMax] = useState(30)
  const [skipBullet, setSkipBullet] = useState(true)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null)
  const controller = useRef<AbortController | null>(null)
  const seconds = useCountdown(wait)

  useEffect(() => () => controller.current?.abort(), [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy || seconds > 0) return
    setBusy(true)
    setMessage(null)
    const mine = new AbortController()
    controller.current = mine
    try {
      const result = await fetchLichessGames(name, { max, skipBullet, signal: mine.signal })
      const { added, skipped } = addGames(result.games)
      const username = cleanUsername(name)
      if (username && remember && username !== profile.lichessUsername)
        setProfile((p) => ({ ...p, lichessUsername: username }))
      const left: string[] = []
      if (result.skipped.computer) left.push(`${result.skipped.computer} against the computer`)
      if (result.skipped.otherVariant) left.push(`${result.skipped.otherVariant} of other chess variants`)
      if (result.skipped.tooShort) left.push(`${result.skipped.tooShort} that ended almost at once`)
      const text =
        result.games.length === 0
          ? `I found no usable games for ${username}.${skipBullet ? ' Try switching off "Skip bullet games".' : ''}`
          : `Added ${added} new game${added === 1 ? '' : 's'}${skipped ? ` (${skipped} ${skipped === 1 ? 'was' : 'were'} already saved)` : ''}.` +
            (left.length ? ` Left out: ${left.join(', ')}.` : '')
      setMessage({ kind: result.games.length === 0 ? 'bad' : 'ok', text })
    } catch (err) {
      if (mine.signal.aborted) return
      if (err instanceof LichessImportError) {
        if (err.kind === 'rate-limit') setWait(Date.now() + LICHESS_WAIT_SECONDS * 1000)
        setMessage({ kind: 'bad', text: err.message })
      } else {
        setMessage({ kind: 'bad', text: 'Something went wrong while getting your games. Please try again.' })
      }
    } finally {
      if (controller.current === mine) setBusy(false)
    }
  }

  return (
    <form className="rt-add-form" onSubmit={submit}>
      <p className="muted">
        Type your Lichess username and I will fetch your latest games. It is free, needs no password, and only public
        information is used.
      </p>
      <div className="rt-add-fields">
        <div className="field">
          <label htmlFor="rt-li-name">Lichess username</label>
          <input
            id="rt-li-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your Lichess name"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
        <div className="field">
          <label htmlFor="rt-li-max">How many games</label>
          <select id="rt-li-max" className="select" value={max} onChange={(e) => setMax(Number(e.target.value))}>
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                Latest {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="rt-check">
        <input type="checkbox" checked={skipBullet} onChange={(e) => setSkipBullet(e.target.checked)} />
        Skip bullet games (they are played in a rush, so they say little about how you really play)
      </label>
      {name.trim() && cleanUsername(name) !== profile.lichessUsername && (
        <label className="rt-check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember this username in Settings
        </label>
      )}
      <div className="row wrap">
        <button className="btn primary" type="submit" disabled={busy || seconds > 0 || !name.trim()}>
          {busy ? <Loader2 size={16} className="rt-spin" /> : <Download size={16} />}
          {busy ? 'Getting your games…' : seconds > 0 ? `Please wait ${seconds} s` : 'Get my games'}
        </button>
        <span className="faint small">One request at a time, to be kind to Lichess.</span>
      </div>
      {message && (
        <div
          className={`callout ${message.kind === 'bad' ? 'warn' : ''}`}
          role={message.kind === 'bad' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      )}
    </form>
  )
}

/* ------------------------------------------------------------------------------------------ */

function PasteForm() {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<{ games: ParsedGame[]; errors: string[] } | null>(null)
  const [sides, setSides] = useState<Record<string, Side | undefined>>({})
  const [done, setDone] = useState<string | null>(null)

  const myNames = [profile.name === DEFAULT_PROFILE.name ? '' : profile.name, profile.lichessUsername]

  function read() {
    setDone(null)
    const result = parsePgnText(text, myNames)
    setParsed(result)
    setSides(Object.fromEntries(result.games.map((g) => [g.id, g.guessedSide ?? undefined])))
  }

  const ready = parsed?.games.filter((g) => sides[g.id]) ?? []
  const unsure = parsed ? parsed.games.length - ready.length : 0

  function save() {
    if (!parsed) return
    const records = ready.map((g) => toRecord(g, sides[g.id]!))
    const { added, skipped } = addGames(records)
    setDone(
      `Added ${added} game${added === 1 ? '' : 's'}${skipped ? ` (${skipped} ${skipped === 1 ? 'was' : 'were'} already saved)` : ''}.`,
    )
    setParsed(null)
    setText('')
  }

  function setAll(side: Side) {
    if (parsed) setSides(Object.fromEntries(parsed.games.map((g) => [g.id, side])))
  }

  return (
    <div className="rt-add-form">
      <p className="muted">
        Paste one game or many (PGN text, for example from Lichess "Share &amp; export" or chess.com "Download"). I will
        ask which side you played if I cannot tell.
      </p>
      <div className="field">
        <label htmlFor="rt-pgn">PGN text</label>
        <textarea
          id="rt-pgn"
          className="textarea"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setParsed(null)
          }}
          placeholder={'[White "Me"]\n[Black "Friend"]\n\n1. e4 e5 2. Nf3 Nc6 ...'}
          spellCheck={false}
        />
      </div>
      <div className="row wrap">
        <button className="btn primary" onClick={read} disabled={!text.trim()}>
          <ClipboardPaste size={16} /> Read the games
        </button>
      </div>
      {done && (
        <div className="callout" role="status">
          {done}
        </div>
      )}
      {parsed && parsed.errors.length > 0 && (
        <div className="callout warn" role="alert">
          <div>
            {parsed.errors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        </div>
      )}
      {parsed && parsed.games.length > 0 && (
        <>
          <div className="row wrap between">
            <strong>
              I found {parsed.games.length} game{parsed.games.length === 1 ? '' : 's'}. Which side were you?
            </strong>
            <span className="row">
              <button className="btn small" onClick={() => setAll('white')}>
                I was White in all
              </button>
              <button className="btn small" onClick={() => setAll('black')}>
                I was Black in all
              </button>
            </span>
          </div>
          <ul className="rt-paste-list">
            {parsed.games.map((g) => (
              <li key={g.id} className="rt-paste-row">
                <span className="rt-paste-title">
                  {g.white} <span className="faint">vs</span> {g.black}
                  <span className="faint small">
                    {' '}
                    · {g.result} · {Math.ceil(g.plies / 2)} moves
                  </span>
                </span>
                <span
                  className="rt-seg"
                  role="radiogroup"
                  aria-label={`Which side were you in ${g.white} versus ${g.black}?`}
                >
                  {(['white', 'black'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={sides[g.id] === s}
                      className={`rt-seg-btn ${sides[g.id] === s ? 'on' : ''}`}
                      onClick={() => setSides((cur) => ({ ...cur, [g.id]: s }))}
                    >
                      {s === 'white' ? 'White' : 'Black'}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <div className="row wrap">
            <button className="btn primary" onClick={save} disabled={ready.length === 0}>
              Add {ready.length} game{ready.length === 1 ? '' : 's'}
            </button>
            {unsure > 0 && <span className="faint small">{unsure} still need a side.</span>}
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------ */

export default function AddGames({ mode, onMode }: { mode: AddMode; onMode: (m: AddMode) => void }) {
  return (
    <div className="rt-add">
      <div className="row wrap">
        <button
          className={`btn ${mode === 'lichess' ? 'primary' : ''}`}
          aria-expanded={mode === 'lichess'}
          onClick={() => onMode(mode === 'lichess' ? null : 'lichess')}
        >
          <Download size={16} /> Import from Lichess
        </button>
        <button
          className={`btn ${mode === 'paste' ? 'primary' : ''}`}
          aria-expanded={mode === 'paste'}
          onClick={() => onMode(mode === 'paste' ? null : 'paste')}
        >
          <ClipboardPaste size={16} /> Paste games
        </button>
      </div>
      {mode === 'lichess' && <LichessForm />}
      {mode === 'paste' && <PasteForm />}
    </div>
  )
}
