import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { PHASE_LABEL, type Insights } from './insights'

// "What to work on": the useful part. Habits found in the analysed games, and three things to do about them.

function Stat({ value, label, hint, tone }: { value: string; label: string; hint: string; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <div className={`rt-stat ${tone ?? ''}`} title={hint}>
      <div className="rt-stat-value">{value}</div>
      <div className="small muted">{label}</div>
    </div>
  )
}

function perGame(count: number, games: number): string {
  return games ? (count / games).toFixed(1) : '0'
}

export default function WorkOnPanel({ insights }: { insights: Insights }) {
  const n = insights.gamesAnalysed
  if (n === 0) {
    return (
      <section className="card zen-hide">
        <h2>What to work on</h2>
        <p className="muted">
          Once some of your games are analysed, I will show you your habits here: where you lose points, whether you leave pieces hanging, which
          chances you miss, and how you do in your openings. Then I suggest three things to practise.
        </p>
      </section>
    )
  }

  const { hungPieces, missedChances } = insights
  return (
    <section className="card zen-hide" aria-labelledby="rt-work">
      <h2 id="rt-work">What to work on</h2>
      <p className="muted small">Based on {n} analysed game{n === 1 ? '' : 's'} and {insights.userMoves} of your moves.</p>

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

      <h3 className="rt-chart-title">Your habits</h3>
      <div className="rt-stats">
        <Stat
          value={insights.blunderRate.toFixed(1)}
          label="blunders per 100 moves"
          hint="A blunder is a move that throws away a big part of your winning chances."
          tone={insights.blunderRate >= 4 ? 'bad' : insights.blunderRate >= 2 ? 'warn' : 'good'}
        />
        <Stat
          value={perGame(hungPieces.count, n)}
          label="pieces left hanging per game"
          hint="Moves after which your opponent could take a piece for free."
          tone={hungPieces.count / n >= 0.5 ? 'bad' : hungPieces.count / n >= 0.2 ? 'warn' : 'good'}
        />
        <Stat
          value={perGame(missedChances.count, n)}
          label="big chances missed per game"
          hint="Positions where a move would have won at least a pawn and a half, and you played something else."
          tone={missedChances.count / n >= 0.5 ? 'bad' : missedChances.count / n >= 0.2 ? 'warn' : 'good'}
        />
        <Stat
          value={`${insights.blunders} / ${insights.mistakes} / ${insights.inaccuracies}`}
          label="blunders / mistakes / inaccuracies"
          hint="Totals over all analysed games."
        />
      </div>

      {insights.phases.length > 0 && (
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
          <p className="faint small">Opening = the first 10 moves. Endgame = few pieces left. Accuracy says how close your moves were to the computer's choices.</p>
        </>
      )}

      {insights.openings.length > 0 && (
        <>
          <h3 className="rt-chart-title">Your openings</h3>
          <div className="rt-openings" role="table" aria-label="Openings report">
            <div className="rt-openings-head" role="row">
              <span role="columnheader">Opening</span>
              <span role="columnheader">Games</span>
              <span role="columnheader">Score</span>
              <span role="columnheader">Avg. loss</span>
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
                <span role="cell">{o.acpl === null ? '–' : Math.round(o.acpl)}</span>
              </div>
            ))}
          </div>
          <p className="faint small">
            <Lightbulb size={12} /> Score = points won out of games played (a win is 1, a draw is a half). Avg. loss = average centipawn loss per move, lower is better.
          </p>
        </>
      )}
    </section>
  )
}
