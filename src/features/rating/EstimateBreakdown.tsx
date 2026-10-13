import { BarChart3, Brain, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { OPENING_MOVES_SKIPPED, PRIOR_GAMES, type EstimateDetail, type EstimatePart } from './estimate'
import { EvidenceChart, GameTrendChart } from './EstimateChart'

// "How I worked this out": the pieces of evidence in plain words, then two small charts and the honest small print.

function PartCard({
  icon,
  title,
  part,
  children,
  missing,
}: {
  icon: ReactNode
  title: string
  part?: EstimatePart
  children: ReactNode
  missing?: string
}) {
  return (
    <div className={`rt-part ${part ? '' : 'off'}`}>
      <div className="rt-part-head">
        <span className="rt-part-icon" aria-hidden>
          {icon}
        </span>
        <strong>{title}</strong>
        {part && <span className="rt-part-elo">{Math.round(part.elo)}</span>}
      </div>
      {part ? (
        <>
          <p className="muted">{children}</p>
          <div
            className="rt-weight"
            title={`This piece makes up ${Math.round(part.weight * 100)}% of the final number`}
          >
            <div className="progress" aria-hidden>
              <span style={{ width: `${Math.max(3, part.weight * 100)}%` }} />
            </div>
            <span className="small faint">{Math.round(part.weight * 100)}% of the estimate</span>
          </div>
        </>
      ) : (
        <p className="faint">{missing}</p>
      )}
    </div>
  )
}

export default function EstimateBreakdown({ detail }: { detail: EstimateDetail }) {
  const part = (key: EstimatePart['key']) => detail.parts.find((p) => p.key === key)
  const r = detail.results
  const m = detail.moves

  return (
    <section className="card zen-hide" aria-labelledby="rt-how">
      <h2 id="rt-how">How I worked this out</h2>
      <p className="muted">
        I used up to three pieces of evidence. Each one has its own "how sure am I" bar, and the surer pieces get a
        bigger say.
      </p>

      <div className="rt-parts">
        <PartCard
          icon={<Trophy size={18} />}
          title="A. Your results"
          part={part('results')}
          missing="Not used yet: none of your games has an opponent rating. Importing your games from Lichess fixes that."
        >
          {r && (
            <>
              You scored <strong>{Math.round(r.scorePct)}%</strong> in {r.games} game{r.games === 1 ? '' : 's'} against
              opponents rated <strong>{Math.round(r.avgOpp)}</strong> on average. A score like that usually means
              playing about {Math.abs(Math.round(r.shift))} points {r.shift >= 0 ? 'above' : 'below'} your opponents.
              {r.botGames > 0 && ' Games against the computer count a bit less.'}
            </>
          )}
        </PartCard>
        <PartCard
          icon={<BarChart3 size={18} />}
          title="B. Your moves"
          part={part('moves')}
          missing="Not used yet: analyse your games (button in 'Your games') and I will measure how good your moves were."
        >
          {m && (
            <>
              In {m.games} analysed game{m.games === 1 ? '' : 's'} your moves lost <strong>{Math.round(m.acpl)}</strong>{' '}
              centipawns on average. A centipawn is a hundredth of a pawn, so smaller is better. In my reference table,
              players who lose about this much per move are rated around{' '}
              <strong>{Math.round(part('moves')?.elo ?? 0)}</strong>. One awful game cannot pull this down much. Your first{' '}
              {OPENING_MOVES_SKIPPED} moves and known opening moves are left out, because they are usually memorised.
              {m.slowGames > 0 &&
                ' Games with lots of time on the clock are judged a little more strictly, because everybody plays better with more time.'}
            </>
          )}
        </PartCard>
        <PartCard icon={<Brain size={18} />} title="C. Your own guess" part={part('prior')} missing="">
          You told me you are around <strong>{detail.selfRating}</strong>. It counts like {PRIOR_GAMES} games, so a few
          lucky or unlucky games cannot throw the estimate around. The more games you add, the less it matters.
        </PartCard>
      </div>

      <h3 className="rt-chart-title">The pieces and the final answer</h3>
      <p className="faint small">
        Each dot is one piece of evidence and the bar shows how sure it is (shorter bar = surer). The shaded column is
        the final range.
      </p>
      <EvidenceChart detail={detail} />

      <h3 className="rt-chart-title">Game by game</h3>
      <p className="faint small">
        Each dot is one analysed game: the rating of a player whose moves are about this good. Filled green = you won,
        hollow red = you lost, grey = draw. The shaded band is your estimate.
      </p>
      <GameTrendChart detail={detail} />

      <div className="callout warn rt-fineprint">
        <div>
          <strong>Please take this with a grain of salt.</strong>
          <ul>
            <li>
              It is an estimate of how you played in <em>these games</em>. A different day, a different time limit or a
              calmer mood can easily change it by 100 points.
            </li>
            <li>
              Ratings from different places (Lichess, chess.com, a club) are not the same scale. Mine is closest to a
              Lichess rapid or blitz rating.
            </li>
            <li>
              Stockfish here looks only a few moves deep to stay fast, so it can misjudge some positions. That adds some
              noise to the "your moves" part.
            </li>
            <li>With fewer than about 20 games, treat the number as a fun guess, and look at the range instead.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
