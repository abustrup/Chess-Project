import type { AnalysedMove, GameRecord } from '../../types'
import { OPENING_COURSES } from '../../data/openings'
import { MAX_MOVE_LOSS, movesOfSide } from '../review/analyse'
import { hungPiece, isMissedChance, pieceMaterial } from '../review/moveFacts'

// "What to work on": turns the analysed games into habits we can name (hangs pieces, misses tactics ...)
// and into at most three concrete suggestions with links to the right part of the app.

export type Phase = 'opening' | 'middlegame' | 'endgame'
export const PHASE_LABEL: Record<Phase, string> = { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' }

/** The opening phase is the first ten moves of each side. */
const OPENING_PLIES = 20
/** Both sides together have no more than this many points of pieces (pawns not counted; at the start it is 62). */
const ENDGAME_MATERIAL = 24
/** A phase needs at least this many of the user's moves before we talk about it. */
const MIN_PHASE_MOVES = 10

export interface PhaseStat {
  phase: Phase
  moves: number
  /** average per-move accuracy 0..100 */
  accuracy: number
  acpl: number
}

export interface OpeningCourseLink {
  id: string
  name: string
  /** true when the user plays this opening themselves, false when they met it as the opponent's choice */
  yours: boolean
}

export interface OpeningRow {
  name: string
  games: number
  wins: number
  draws: number
  losses: number
  /** share of the points won, 0..100, or null when no game was finished */
  scorePct: number | null
  /** average centipawn loss over the analysed games, or null */
  acpl: number | null
  course?: OpeningCourseLink
}

export interface Suggestion {
  id: string
  title: string
  text: string
  links: { to: string; label: string }[]
}

export interface Insights {
  gamesAnalysed: number
  userMoves: number
  phases: PhaseStat[]
  blunders: number
  mistakes: number
  inaccuracies: number
  /** per 100 of the user's moves */
  blunderRate: number
  hungPieces: { count: number; games: number }
  missedChances: { count: number; games: number }
  openings: OpeningRow[]
  suggestions: Suggestion[]
}

/* ------------------------------------------------------------------------------------------ */

/** Which phase is each move in? Once the endgame has started it stays an endgame. */
export function phasesOfGame(moves: AnalysedMove[]): Phase[] {
  let endgame = false
  return moves.map((m) => {
    if (!endgame && pieceMaterial(m.fenBefore) <= ENDGAME_MATERIAL) endgame = true
    if (endgame) return 'endgame'
    return m.ply <= OPENING_PLIES ? 'opening' : 'middlegame'
  })
}

/** "Caro-Kann Defense: Advance Variation" -> "Caro-Kann Defense" so a few games already form a group. */
export function openingFamily(name: string): string {
  return name.split(':')[0].trim()
}

/** Which of the user's courses (London, Caro-Kann, Slav ...) is this opening name about? */
export function courseFor(openingName: string, userSide: 'white' | 'black'): OpeningCourseLink | undefined {
  const text = openingName.toLowerCase()
  for (const course of OPENING_COURSES) {
    // "Caro-Kann Defence" -> "caro-kann"; "Semi-Slav" must not count as "Slav"
    const key = course.name.toLowerCase().replace(/\s+(defence|defense|system)$/, '')
    if (new RegExp(`(^|[^a-z-])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text)) {
      return { id: course.id, name: course.name, yours: course.side === userSide }
    }
  }
  return undefined
}

function openingRows(games: GameRecord[]): OpeningRow[] {
  const groups = new Map<string, { rows: GameRecord[]; side: 'white' | 'black' }>()
  for (const g of games) {
    const family = g.openingName ? openingFamily(g.openingName) : 'Unknown opening'
    const key = `${family}|${g.userSide}`
    const group = groups.get(key) ?? { rows: [], side: g.userSide }
    group.rows.push(g)
    groups.set(key, group)
  }
  const out: OpeningRow[] = []
  for (const [key, { rows, side }] of groups) {
    const name = key.split('|')[0]
    let wins = 0
    let draws = 0
    let losses = 0
    for (const g of rows) {
      if (g.result === '1/2-1/2') draws++
      else if (g.result === '1-0' || g.result === '0-1') {
        const whiteWon = g.result === '1-0'
        if (whiteWon === (side === 'white')) wins++
        else losses++
      }
    }
    const finished = wins + draws + losses
    const analysed = rows.filter((g) => g.analysis)
    out.push({
      name: `${name} (as ${side === 'white' ? 'White' : 'Black'})`,
      games: rows.length,
      wins,
      draws,
      losses,
      scorePct: finished ? ((wins + draws / 2) / finished) * 100 : null,
      acpl: analysed.length ? analysed.reduce((s, g) => s + g.analysis!.acpl[side], 0) / analysed.length : null,
      course: name === 'Unknown opening' ? undefined : courseFor(name, side),
    })
  }
  // the user's own courses first, then the most played
  return out.sort((a, b) => Number(!!b.course?.yours) - Number(!!a.course?.yours) || b.games - a.games)
}

/* ------------------------------------------------------------------------------------------ */

/**
 * `showNumbers: false` (the default, and the setting during the study) words the advice without counts or accuracy
 * percentages: his blunder rate is what the study measures, so no running number of it, or one division away from it,
 * is on screen until the verdict (preregistration.md answer 4; build-plan.md, "Not built"). The same habits are found
 * and ranked either way; only the wording changes.
 */
export function computeInsights(games: GameRecord[], opts: { showNumbers?: boolean } = {}): Insights {
  const analysed = games.filter((g) => g.analysis)
  const phaseSums: Record<Phase, { moves: number; acc: number; loss: number }> = {
    opening: { moves: 0, acc: 0, loss: 0 },
    middlegame: { moves: 0, acc: 0, loss: 0 },
    endgame: { moves: 0, acc: 0, loss: 0 },
  }
  let userMoves = 0
  let blunders = 0
  let mistakes = 0
  let inaccuracies = 0
  const hung = { count: 0, games: 0 }
  const missed = { count: 0, games: 0 }

  for (const g of analysed) {
    const all = g.analysis!.moves
    const phases = phasesOfGame(all)
    let hungHere = 0
    let missedHere = 0
    all.forEach((m, i) => {
      if ((m.ply % 2 === 1) !== (g.userSide === 'white')) return
      userMoves++
      const ph = phaseSums[phases[i]]
      ph.moves++
      ph.acc += m.accuracy
      ph.loss += Math.min(MAX_MOVE_LOSS, m.cpLoss)
      if (m.classification === 'blunder') blunders++
      else if (m.classification === 'mistake') mistakes++
      else if (m.classification === 'inaccuracy') inaccuracies++
      const reply = all[i + 1]
      if (hungPiece(m, reply)) hungHere++
      else if (isMissedChance(m, reply)) missedHere++
    })
    hung.count += hungHere
    hung.games += hungHere ? 1 : 0
    missed.count += missedHere
    missed.games += missedHere ? 1 : 0
  }

  const phases: PhaseStat[] = (Object.keys(phaseSums) as Phase[])
    .filter((p) => phaseSums[p].moves >= MIN_PHASE_MOVES)
    .map((p) => ({
      phase: p,
      moves: phaseSums[p].moves,
      accuracy: phaseSums[p].acc / phaseSums[p].moves,
      acpl: phaseSums[p].loss / phaseSums[p].moves,
    }))

  const insights: Insights = {
    gamesAnalysed: analysed.length,
    userMoves,
    phases,
    blunders,
    mistakes,
    inaccuracies,
    blunderRate: userMoves ? (blunders / userMoves) * 100 : 0,
    hungPieces: hung,
    missedChances: missed,
    openings: openingRows(games),
    suggestions: [],
  }
  insights.suggestions = suggest(insights, opts.showNumbers ?? false)
  return insights
}

/* ------------------------------------------------------------------------------------------ */

function suggest(ins: Insights, showNumbers: boolean): Suggestion[] {
  if (!ins.gamesAnalysed) return []
  const n = ins.gamesAnalysed
  const found: (Suggestion & { priority: number })[] = []

  const hungPerGame = ins.hungPieces.count / n
  if (ins.hungPieces.count > 0 && hungPerGame >= 0.2) {
    found.push({
      id: 'hung',
      priority: 0.6 + Math.min(0.4, hungPerGame * 0.3),
      title: 'Check that nothing hangs before you move',
      text: `${showNumbers ? `In ${ins.hungPieces.games} of ${n} games you left a piece where it could be taken for free (${ins.hungPieces.count} time${ins.hungPieces.count === 1 ? '' : 's'}).` : 'In your analysed games you sometimes left a piece where it could be taken for free.'} Before each move, look at the square you move to and ask: "Can my opponent simply take something of mine?"`,
      links: [
        { to: '/tactics', label: 'Tactics lessons' },
        { to: '/puzzles?theme=hangingPiece', label: 'Hanging-piece puzzles' },
      ],
    })
  }

  if (ins.blunderRate >= 2.5) {
    found.push({
      id: 'blunders',
      priority: 0.55 + Math.min(0.35, ins.blunderRate / 20),
      title: 'Slow down on the moves that matter',
      // a count, not the rate: the study keeps his running blunder rate off the screen until its verdict
      text: `${showNumbers ? `You made ${ins.blunders} big blunder${ins.blunders === 1 ? '' : 's'} in ${n} analysed game${n === 1 ? '' : 's'}. Most of them are` : 'Big blunders show up in your analysed games, and most big blunders are'} one-move oversights. When the position gets sharp (captures, checks, threats), take an extra breath and look at what your opponent threatens.`,
      links: [{ to: '/puzzles?theme=defensiveMove', label: 'Defending puzzles' }],
    })
  }

  const missedPerGame = ins.missedChances.count / n
  if (ins.missedChances.count > 0 && missedPerGame >= 0.2) {
    found.push({
      id: 'missed',
      priority: 0.5 + Math.min(0.35, missedPerGame * 0.25),
      title: 'Spot your chances: checks, captures, threats',
      text: `${
        showNumbers
          ? `In ${ins.missedChances.games} of ${n} games there was a move that would have won a lot (at least a pawn and a half), and you played something else (${ins.missedChances.count} time${ins.missedChances.count === 1 ? '' : 's'}).`
          : 'In your analysed games there was sometimes a move that would have won a lot (at least a pawn and a half), and you played something else.'
      } Before a quiet move, always look at every check, capture and threat first.`,
      links: [
        { to: '/puzzles?theme=crushing', label: 'Winning-chance puzzles' },
        { to: '/tactics', label: 'Tactics lessons' },
      ],
    })
  }

  if (ins.phases.length >= 2) {
    const worst = [...ins.phases].sort((a, b) => a.accuracy - b.accuracy)[0]
    const others = ins.phases.filter((p) => p !== worst)
    const otherAvg = others.reduce((s, p) => s + p.accuracy, 0) / others.length
    const gap = otherAvg - worst.accuracy
    if (gap >= 5) {
      const text: Record<Phase, string> = {
        opening:
          'You lose the most in the first moves. Learning one opening well gives you safe, easy moves and a calm start.',
        middlegame:
          'The middle of the game is where you lose the most. Make a plan, keep your pieces protected, and look for your opponent’s threats.',
        endgame:
          'Endgames are where you lose the most. A few basic ideas (king activity, passed pawns, rook endings) are worth a lot of points.',
      }
      const links: Record<Phase, { to: string; label: string }[]> = {
        opening: [{ to: '/openings', label: 'Opening courses' }],
        middlegame: [{ to: '/puzzles?theme=middlegame', label: 'Middlegame puzzles' }],
        endgame: [{ to: '/puzzles?theme=endgame', label: 'Endgame puzzles' }],
      }
      found.push({
        id: `phase-${worst.phase}`,
        priority: 0.4 + Math.min(0.3, gap / 40),
        title: `Your ${PHASE_LABEL[worst.phase].toLowerCase()} needs love`,
        text: `${showNumbers ? `Your accuracy in the ${PHASE_LABEL[worst.phase].toLowerCase()} is ${Math.round(worst.accuracy)}%, compared with ${Math.round(otherAvg)}% in the rest of the game.` : `Your moves are least accurate in the ${PHASE_LABEL[worst.phase].toLowerCase()}.`} ${text[worst.phase]}`,
        links: links[worst.phase],
      })
    }
  }

  const weakRepertoire = ins.openings.find(
    (o) => o.course?.yours && o.games >= 2 && o.scorePct !== null && o.scorePct < 45,
  )
  if (weakRepertoire?.course) {
    found.push({
      id: 'repertoire',
      priority: 0.45,
      title: `Study your ${weakRepertoire.course.name}`,
      text: `You scored ${Math.round(weakRepertoire.scorePct ?? 0)}% in ${weakRepertoire.games} games with the ${weakRepertoire.course.name}. Going through the lessons again will make the first moves automatic.`,
      links: [
        { to: `/openings/${weakRepertoire.course.id}`, label: `${weakRepertoire.course.name} course` },
        { to: `/puzzles?opening=${weakRepertoire.course.id}`, label: 'Puzzles from this opening' },
      ],
    })
  }

  found.sort((a, b) => b.priority - a.priority)
  const top: Suggestion[] = found.slice(0, 3).map((s) => ({ id: s.id, title: s.title, text: s.text, links: s.links }))
  if (top.length === 0) {
    top.push({
      id: 'keep-going',
      title: 'Keep doing a little every day',
      text: 'Nothing stands out as a big problem in these games. A few puzzles a day and analysing your games here is the best way to keep improving.',
      links: [{ to: '/puzzles', label: 'Puzzles' }],
    })
  }
  return top
}
