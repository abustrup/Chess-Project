import { Link } from 'react-router-dom'
import { Download, Swords, ClipboardPaste } from 'lucide-react'
import { confidenceWord, type EstimateDetail } from './estimate'

// The headline: one big number with an honest range. This is the only part that stays visible in zen mode.

function levelText(elo: number): string {
  if (elo < 900) return 'Beginner range: most games are decided by a single big oversight, so every blunder you avoid is a win.'
  if (elo < 1300) return 'Improving player: you know the basics. Cutting down one-move blunders is the quickest way up.'
  if (elo < 1700) return 'Club-player range: you see tactics well. Plans, endgames and a solid opening start to matter more.'
  return 'Strong club player: small inaccuracies decide your games now.'
}

function comparison(detail: EstimateDetail): string {
  const diff = detail.elo - detail.selfRating
  if (Math.abs(diff) < 40) return `This matches what you told me (${detail.selfRating}).`
  return diff > 0
    ? `You said ${detail.selfRating}. The games suggest you play about ${Math.round(diff / 10) * 10} points stronger. Nice!`
    : `You said ${detail.selfRating}. The games suggest you play about ${Math.round(-diff / 10) * 10} points weaker. That is normal: it is easy to forget the bad games.`
}

/** A simple bar: the shaded part is the range, the dot is the estimate, the tick is your own guess. */
function RangeBar({ detail }: { detail: EstimateDetail }) {
  const min = Math.min(detail.low, detail.selfRating) - 80
  const max = Math.max(detail.high, detail.selfRating) + 80
  const at = (v: number) => `${((v - min) / (max - min)) * 100}%`
  return (
    <div className="rt-range" aria-hidden>
      <div className="rt-range-band" style={{ left: at(detail.low), width: `calc(${at(detail.high)} - ${at(detail.low)})` }} />
      <div className="rt-range-self" style={{ left: at(detail.selfRating) }} title={`Your own guess: ${detail.selfRating}`} />
      <div className="rt-range-dot" style={{ left: at(detail.elo) }} />
    </div>
  )
}

export default function EstimateHero({
  detail,
  onAdd,
}: {
  detail: EstimateDetail
  onAdd: (mode: 'lichess' | 'paste') => void
}) {
  if (detail.gamesUsed === 0) {
    return (
      <section className="card rt-hero">
        <div className="eyebrow">Estimated rating</div>
        <h2 className="rt-hero-title">Let's find out how strong you really are</h2>
        <p className="muted">
          Give me a few of your games and Stockfish (a very strong chess program that runs in your browser) will check them.
          I look at your results and at how good your moves were, and turn that into an estimate of your rating.
          It works best with 20 or more games, but even a few games already show something.
        </p>
        <div className="row wrap rt-hero-actions">
          <button className="btn primary big" onClick={() => onAdd('lichess')}>
            <Download size={18} /> Import from Lichess
          </button>
          <button className="btn big" onClick={() => onAdd('paste')}>
            <ClipboardPaste size={18} /> Paste a game
          </button>
          <Link className="btn big" to="/play">
            <Swords size={18} /> Play a game
          </Link>
        </div>
        <p className="faint small zen-hide">Everything stays on your device. Nothing is uploaded anywhere.</p>
      </section>
    )
  }

  return (
    <section className="card rt-hero" aria-labelledby="rt-estimate">
      <div className="row between wrap">
        <div className="eyebrow">Estimated rating</div>
        <span className="chip blue zen-hide">
          {confidenceWord(detail.gamesUsed)} · {detail.gamesUsed} game{detail.gamesUsed === 1 ? '' : 's'}
        </span>
      </div>
      <div className="rt-hero-number" id="rt-estimate">
        <span className="rt-about">about</span> <span className="big-number rt-elo">{detail.elo}</span>
      </div>
      <p className="rt-hero-range">
        probably between <strong>{detail.low}</strong> and <strong>{detail.high}</strong>
      </p>
      <div className="zen-hide">
        <RangeBar detail={detail} />
        <p className="rt-compare">{comparison(detail)}</p>
        <p className="muted">{levelText(detail.elo)}</p>
        {detail.avgListedRating !== undefined && (
          <p className="muted small">
            For comparison: your rating shown in these games was {Math.round(detail.avgListedRating)} on average.
          </p>
        )}
        {detail.notes.length > 0 && (
          <ul className="rt-notes">
            {detail.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
