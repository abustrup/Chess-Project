import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { PHASE_LABEL, type Insights } from './insights'

// "What to work on": the useful part. Habits found in the analysed games, and three things to do about them.

function Stat({
  value,
  label,
  hint,
  tone,
  compact,
}: {
  value: string
  label: string
  hint: string
  tone?: 'good' | 'warn' | 'bad'
  compact?: boolean
}) {
  return (
    <div className={`rt-stat ${tone ?? ''}`} title={hint}>
      <div className={`rt-stat-value ${compact ? 'small-text' : ''}`}>{value}</div>
      <div className="small muted">{label}</div>
    </div>
  )
}

/**
 * `showNumbers` is true only once the study has a verdict (verdict.json, after game 110 at the earliest). Until then the
 * panel shows no blunder totals, no accuracy percentages, no average loss and no move count: with those on screen his
 * blunder rate, which the study measures, would be one division away (preregistration.md answer 4).
 */
export default function WorkOnPanel({ insights, showNumbers = false }: { insights: Insights; showNumbers?: boolean }) {
  const n = insights.gamesAnalysed
  if (n === 0) {
    return (
      <section className="card zen-hide">
        <h2>What to work on</h2>
        <p className="muted">
          Once some of your games are analysed, I will show you your habits here: where you lose points, whether you
          leave pieces hanging, which chances you miss, and how you do in your openings. Then I suggest three things to
          practise.
        </p>
      </section>
    )
  }

  const { hungPieces, missedChances } = insights
  return (
    <section className="card zen-hide" aria-labelledby="rt-work">
      <h2 id="rt-work">What to work on</h2>
      <p className="muted small">
        Based on {n} analysed game{n === 1 ? '' : 's'}
        {showNumbers ? ` and ${insights.userMoves} of your moves` : ''}.
      </p>

      <div className="rt-suggestions">
        {insights.suggestions.map((s, i) => (
          <div className="rt-suggestion" key={s.id}>
            <div className="rt-suggestion-no">{i + 1}</div>
            <div>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
              <div className="row wrap">
                {s.links.map((l) => (
                  <Link key={l.to} className="btn small" to={l.to}>
                    {l.label} <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!showNumbers && (
        <p className="faint small rt-hidden-note">
          Your blunder counts and accuracy stay hidden until your study has a verdict (after your 110th rated 10+0 game
          at the earliest), so a running number cannot change how you play. The suggestions above still come from them.
        </p>
      )}

      {showNumbers && (
        <>
          <h3 className="rt-chart-title">Your habits</h3>
          {/* Counts only, no rates (no "per 100 moves", no "per game"), and only after the verdict (see above). */}
          <div className="rt-stats">
            <Stat
              compact
              value={`${insights.blunders} / ${insights.mistakes} / ${insights.inaccuracies}`}
              label="blunders / mistakes / inaccuracies"
              hint="Totals over all analysed games. A blunder is a move that throws away a big part of your winning chances."
            />
            <Stat
              value={String(hungPieces.count)}
              label={`pieces left hanging, in ${hungPieces.games} of ${n} games`}
              hint="Moves after which your opponent could take a piece for free. Totals over all analysed games."
            />
            <Stat
              value={String(missedChances.count)}
              label={`big chances missed, in ${missedChances.games} of ${n} games`}
              hint="Positions where a move would have won at least a pawn and a half, and you played something else. Totals over all analysed games."
            />
          </div>
        </>
      )}

      {showNumbers && insights.phases.length > 0 && (
        <>
          <h3 className="rt-chart-title">Accuracy in each part of the game</h3>
          <div className="rt-phases">
            {insights.phases.map((p) => (
              <div className="rt-phase" key={p.phase}>
                <span className="rt-phase-name">{PHASE_LABEL[p.phase]}</span>
                <div className="progress" aria-hidden>
                  <span style={{ width: `${Math.max(2, p.accuracy)}%` }} />
                </div>
                <span className="rt-phase-value">{Math.round(p.accuracy)}%</span>
                <span className="faint small rt-phase-moves">{p.moves} moves</span>
              </div>
            ))}
          </div>
          <p className="faint small">
            Opening = the first 10 moves. Endgame = few pieces left. Accuracy says how close your moves were to the
            computer's choices.
          </p>
        </>
      )}

      {insights.openings.length > 0 && (
        <>
          <h3 className="rt-chart-title">Your openings</h3>
          <div className={`rt-openings ${showNumbers ? '' : 'no-loss'}`} role="table" aria-label="Openings report">
            <div className="rt-openings-head" role="row">
              <span role="columnheader">Opening</span>
              <span role="columnheader">Games</span>
              <span role="columnheader">Score</span>
              {showNumbers && <span role="columnheader">Avg. loss</span>}
            </div>
            {insights.openings.slice(0, 8).map((o) => (
              <div className={`rt-opening-row ${o.course?.yours ? 'yours' : ''}`} role="row" key={o.name}>
                <span role="cell" className="rt-opening-name">
                  {o.name}
                  {o.course && (
                    <Link className="chip blue" to={`/openings/${o.course.id}`}>
                      {o.course.yours ? `Your ${o.course.name} course` : `How to face it`}
                    </Link>
                  )}
                </span>
                <span role="cell">{o.games}</span>
                <span role="cell" title={`${o.wins} won, ${o.draws} drawn, ${o.losses} lost`}>
                  {o.scorePct === null ? '–' : `${Math.round(o.scorePct)}%`}
                </span>
                {showNumbers && <span role="cell">{o.acpl === null ? '–' : Math.round(o.acpl)}</span>}
              </div>
            ))}
          </div>
          <p className="faint small">
            <Lightbulb size={12} /> Score = points won out of games played (a win is 1, a draw is a half).
            {showNumbers && ' Avg. loss = average centipawn loss per move, lower is better.'}
          </p>
        </>
      )}
    </section>
  )
}
