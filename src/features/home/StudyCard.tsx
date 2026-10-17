import { Download, FlaskConical } from 'lucide-react'
import { downloadBackup } from './settings/backup'
import { STUDY_STRETCHES, STUDY_TICKS, FINAL_CHECK_GAME, verdictNumbers, whenText, type StudyCardModel } from './study'

// The study at a glance: games counted, the phase and what comes next. Blunder numbers appear only once the
// daily job has written a verdict (see study.ts for the rules).

const at = (game: number) => `${(game / FINAL_CHECK_GAME) * 100}%`

/** The 160 games of the study as one bar: warm-up, before, trainer starts, measured, with a dot where he is. */
function StudyTrack({ position }: { position: number | null }) {
  return (
    <div className="study-track zen-hide" aria-hidden>
      <div className="study-bar">
        {STUDY_STRETCHES.map((s) => (
          <span
            key={s.key}
            className={`study-stretch ${s.key}`}
            style={{ left: at(s.from - 1), width: `calc(${at(s.to)} - ${at(s.from - 1)})` }}
          />
        ))}
        {position !== null && <span className="study-dot" style={{ left: `${position * 100}%` }} />}
      </div>
      <div className="study-ticks faint">
        {STUDY_TICKS.map((game) => (
          <span key={game} style={{ left: at(game) }}>
            {game}
          </span>
        ))}
      </div>
      <ul className="study-legend faint small">
        {STUDY_STRETCHES.map((s) => (
          <li key={s.key}>
            <span className={`study-swatch ${s.key}`} /> {s.label} {s.from}-{s.to}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function StudyCard({
  model,
  now,
  onBackupDownloaded,
}: {
  model: StudyCardModel
  now: Date
  onBackupDownloaded: (game: number, at: string) => void
}) {
  const { verdict, backup } = model
  // Zen Home is only the greeting and Continue; the card still shows there when it needs him (a backup to send, a verdict)
  const needsHim = (backup !== null && backup.downloadedAt === null) || verdict?.decided === true
  function download() {
    if (!backup) return
    const time = new Date()
    onBackupDownloaded(backup.game, time.toISOString()) // first, so the file itself records the download
    downloadBackup(time)
  }

  return (
    <section className={`card study-card ${needsHim ? '' : 'zen-hide'}`} aria-labelledby="study-title">
      <div className="study-head">
        <div className="card-title" id="study-title">
          <FlaskConical size={16} aria-hidden /> Your study
        </div>
        {model.phase && <span className="chip blue study-phase">{model.phase}</span>}
      </div>

      <p className="study-count">
        {model.known ? (
          <>
            <span className="study-number">{model.games}</span>{' '}
            <span className="muted">{model.games === 1 ? 'rated 10+0 game' : 'rated 10+0 games'} on Lichess since 16 October 2026</span>
          </>
        ) : (
          <span className="muted">Your rated 10+0 games on Lichess will be counted here.</span>
        )}
      </p>

      <StudyTrack position={model.position} />

      {model.next && (
        <p className="study-next">
          Next: {model.next.text} <span className="faint">({model.next.toGo})</span>
        </p>
      )}

      {verdict?.decided && (
        <div className="callout study-verdict" role="status">
          <div>
            <p>
              <strong>
                Verdict after game {verdict.decidedAtGame}: {verdict.answer}.
              </strong>{' '}
              {verdict.meaning}
            </p>
            {verdictNumbers(verdict) && <p className="small">{verdictNumbers(verdict)}</p>}
            {verdict.mechanism && (
              <p className="small muted">
                Second test:{' '}
                {verdict.mechanism === 'supported'
                  ? 'your blunders while facing a threat fell by a clearly larger share than your other blunders.'
                  : 'your blunders while facing a threat did not fall by a clearly larger share than your other blunders.'}
              </p>
            )}
          </div>
        </div>
      )}
      {model.checkNote && <p className="muted small">{model.checkNote}</p>}

      {backup && (
        <div className={`callout ${backup.downloadedAt ? '' : 'warn'} study-backup`}>
          <div>
            {backup.downloadedAt ? (
              <p className="small">
                Backup for game {backup.game} downloaded {whenText(backup.downloadedAt, now)}. Send the file to Claude if you have
                not yet.
              </p>
            ) : (
              <p className="small">
                <strong>You reached game {backup.game}.</strong> Please download your backup and send the file to Claude. It shows
                how much you trained; it never changes the verdict.
              </p>
            )}
            <button className={`btn ${backup.downloadedAt ? 'ghost' : 'primary'}`} onClick={download}>
              <Download size={17} aria-hidden /> {backup.downloadedAt ? 'Download again' : 'Download backup'}
            </button>
          </div>
        </div>
      )}

      <p className="faint small study-source">
        {model.source}
        {model.hiddenNote && <> {model.hiddenNote}</>}
      </p>
    </section>
  )
}
