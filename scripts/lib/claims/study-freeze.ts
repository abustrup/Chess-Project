// Study freeze guard (the "study-freeze" job of .github/workflows/content-checks.yml).
//
// The pre-registration (research/2026-10-16-diagnosis/preregistration.md, answer 4) holds the app fixed from his 11th
// rated 10+0 game until the deciding look (game 160, later if the trainer opened after game 40, earlier if look 1
// decides): only error fixes and the trainer may change what it teaches. This guard makes that rule visible to
// whoever merges: a pull request (or a push to the main branch) that touches teaching files fails while the daily
// job's status.json shows the study running, unless it carries the label "error-fix" (on a push: "error-fix" in a
// commit message, or a merged pull request with the label).
// The judge's own files (INSTRUMENT: the daily job, its workflow, the pre-registered scripts and inputs, the newcomer
// file, this rule) have their own label, "instrument-deviation", and such a change must also write the deviation into
// preregistration.md section 3.8 in the same change: nobody can re-check the judge by hand, so it must not move quietly.
// The game count is the larger of status.json's (written once a day, so up to a day old) and a live count of his
// rated 10+0 games on Lichess with the pre-registered rule (the workflow passes it as --live-games; "unknown" when
// Lichess could not be asked, which blocks a change to frozen files until it can).
//
// Run:   node scripts/lib/claims/study-freeze.ts --status <status.json> --changed <file: one path per line>
//                                                [--labels "a,b"] [--daily-job-exists] [--push] [--live-games N|unknown]
//        node scripts/lib/claims/study-freeze.ts --self-test
// Exit:  0 may merge, 1 frozen (or the game count cannot be read). Plain Node 24, no packages, so the job needs no
//        npm install.
import fs from 'node:fs'

/**
 * Files and folders (matched as path prefixes) that change what the app teaches, or that could open the trainer early:
 * - the five folders of build-plan.md Q1, plus the opening course pages and the tactic lesson text;
 * - the pages that put them on screen (src/pages: Home's plan, Play, Openings, Tactics, Puzzles, Review) and the
 *   puzzle sets themselves (public/puzzles: which puzzles he gets);
 * - the study gate and the menu (src/lib/studyGate.ts, src/App.tsx): a wrong threshold opens the trainer before 30
 *   baseline games, which makes the study invalid (preregistration.md 3.7);
 * - what Play and Review tell him: the Lichess rules and labels (src/lib/lichessRules.ts, src/lib/evaluation.ts), the
 *   engine (src/engine, public/engine), opening names (src/data/eco.json, src/lib/openingName.ts), the coach messages
 *   (src/features/play);
 * - the shared code that turns course text and puzzle files into what he drills (src/lib/pgnTree.ts,
 *   src/lib/puzzleData.ts);
 * - the advice on the rating page (src/features/rating WorkOnPanel.tsx, insights.ts).
 * Not here: the trainer itself (EXEMPT), the rest of the rating page, settings and looks.
 * Keep this a plain list of quoted strings: workflow-dryrun.py reads it as text.
 */
export const FROZEN = [
  'src/data/openings/',
  'src/data/tactics/',
  'src/data/eco.json',
  'src/features/openings/',
  'src/features/home/',
  'src/features/review/',
  'src/features/puzzles/',
  'src/features/tactics/',
  'src/features/play/',
  'src/features/rating/WorkOnPanel.tsx',
  'src/features/rating/insights.ts',
  'src/pages/Home.tsx',
  'src/pages/Play.tsx',
  'src/pages/Openings.tsx',
  'src/pages/Tactics.tsx',
  'src/pages/Puzzles.tsx',
  'src/pages/Review.tsx',
  'src/App.tsx',
  'src/lib/studyGate.ts',
  'src/lib/lichessRules.ts',
  'src/lib/evaluation.ts',
  'src/lib/openingName.ts',
  'src/lib/pgnTree.ts',
  'src/lib/puzzleData.ts',
  'src/engine/',
  'public/engine/',
  'public/puzzles/',
]
/** The Safety-check trainer may be improved after it opens (preregistration.md answer 4), so it is never frozen, even
 * if a frozen prefix above is widened one day. */
export const EXEMPT = ['src/features/safety/', 'src/pages/Safety.tsx', 'public/data/safety/']
/**
 * The judge (preregistration.md, build plan M1 and N1): the daily job that measures and decides U, its workflow, the
 * pre-registered scripts (also pinned by SHA-256 in the daily job), the inputs check_instrument.py compares against,
 * the matched-newcomer file, and this rule itself. A change here needs the label INSTRUMENT_LABEL and an entry in
 * PREREG_DOC (section 3.8, deviations) in the same change. Not here: data/measure and status.json (the job's own output).
 */
export const INSTRUMENT = [
  'scripts/measure/',
  '.github/workflows/measure.yml',
  'research/2026-10-16-diagnosis/prereg/',
  'research/2026-10-16-diagnosis/newcomers/newcomers.json',
  'research/2026-10-16-diagnosis/my-games/lichess_abustrup.ndjson',
  'research/2026-10-16-diagnosis/my-games/engine/sf_250k_bothnull.jsonl',
  'research/2026-10-16-diagnosis/my-games/out/games.json',
  'scripts/lib/claims/study-freeze.ts',
]
export const INSTRUMENT_LABEL = 'instrument-deviation'
export const PREREG_DOC = 'research/2026-10-16-diagnosis/preregistration.md'
export const FREEZE_FROM = 11
/** The last game of the final look when the trainer opens after game 40 (U = 40); never frozen for less than this. */
export const FREEZE_TO = 160
export const OVERRIDE_LABEL = 'error-fix'

export interface FreezeInput {
  /** text of status.json from the base branch, or null when the file does not exist there */
  statusText: string | null
  changed: string[]
  labels: string[]
  /** the daily job (.github/workflows/measure.yml) exists on the base branch, so status.json should too */
  dailyJobExists: boolean
  /** judging a push to the main branch rather than a pull request (only the wording changes) */
  push?: boolean
  /** his rated 10+0 games counted on Lichess just now with measure.py's rule; 'unknown' when Lichess could not be asked;
   *  undefined when the caller did not ask (then status.json alone counts) */
  live?: number | 'unknown'
  /** for the staleness note; defaults to now */
  now?: Date
}

/**
 * The study's last game as status.json describes it: the end of the final look's window (it moves later when the
 * trainer opened after game 40), never earlier than FREEZE_TO. `decided` is the game at which a verdict was reached
 * (look 1 can decide early), after which the study is over.
 */
export function studyEnd(st: { windows?: unknown; verdict?: unknown }): { end: number; decided: number | null } {
  let end = FREEZE_TO
  const looks = (st.windows as { looks?: unknown } | undefined)?.looks
  if (Array.isArray(looks))
    for (const w of looks) if (Array.isArray(w) && Number.isInteger(w[1]) && (w[1] as number) > end) end = w[1] as number
  const d = (st.verdict as { decidedAtGame?: unknown } | null | undefined)?.decidedAtGame
  return { end, decided: typeof d === 'number' && Number.isInteger(d) && d >= FREEZE_FROM ? d : null }
}

export interface FreezeResult {
  ok: boolean
  /** plain-English lines for the log and the run's summary page */
  lines: string[]
  /** short notes worth a yellow annotation (stale status, missing file) */
  warnings: string[]
}

export function decide(inp: FreezeInput): FreezeResult {
  const lines: string[] = []
  const warnings: string[] = []
  const touched = inp.changed.filter((f) => FROZEN.some((d) => f.startsWith(d)) && !EXEMPT.some((d) => f.startsWith(d)))
  const judge = inp.changed.filter((f) => INSTRUMENT.some((d) => f.startsWith(d)))
  const labels = inp.labels.map((l) => l.trim().toLowerCase())
  const hasLabel = labels.includes(OVERRIDE_LABEL)
  const hasDeviation = labels.includes(INSTRUMENT_LABEL)
  const what = inp.push ? 'This push to the main branch' : 'This pull request'

  if (!touched.length && !judge.length) {
    lines.push(`${what} touches no teaching files and none of the judge's files, so the study freeze does not apply.`)
    return { ok: true, lines, warnings }
  }
  if (touched.length) lines.push(`Teaching files in ${what.toLowerCase()} (${touched.length}): ${touched.join(', ')}`)
  if (judge.length) lines.push(`The judge's files in ${what.toLowerCase()} (${judge.length}): ${judge.join(', ')}`)

  let eligible: number | null = null
  let asOf: string | null = null
  let end = FREEZE_TO
  let decided: number | null = null
  let noStatusYet = false
  if (inp.statusText === null) {
    if (!inp.dailyJobExists) noStatusYet = true
    else lines.push('public/data/study/status.json is missing although the daily job exists, so the number of study games cannot be read.')
  } else {
    try {
      const st = JSON.parse(inp.statusText) as { eligibleGames?: unknown; asOf?: unknown; windows?: unknown; verdict?: unknown }
      if (typeof st.eligibleGames === 'number' && Number.isInteger(st.eligibleGames) && st.eligibleGames >= 0) eligible = st.eligibleGames
      if (typeof st.asOf === 'string') asOf = st.asOf
      ;({ end, decided } = studyEnd(st))
      if (eligible === null) lines.push('status.json has no whole-number "eligibleGames", so the number of study games cannot be read.')
    } catch {
      lines.push('status.json is not valid JSON, so the number of study games cannot be read.')
    }
  }
  if (eligible !== null) {
    lines.push(`status.json: ${eligible} eligible rated 10+0 games${asOf ? ` (as of ${asOf})` : ''}; the study runs to game ${end}${decided !== null ? `, and a verdict was reached at game ${decided}` : ''}.`)
    if (asOf) {
      const ageDays = ((inp.now ?? new Date()).getTime() - Date.parse(asOf)) / 86_400_000
      if (Number.isFinite(ageDays) && ageDays > 3) warnings.push(`status.json is ${Math.floor(ageDays)} days old: the daily job may have stopped, so the real count can be higher.`)
    }
  }
  // the live count from Lichess: status.json is written once a day, so on its own it can miss his 11th game
  let count: number | null = eligible
  if (typeof inp.live === 'number') {
    lines.push(`Lichess now: ${inp.live} rated 10+0 games by the pre-registered rule.`)
    if (count === null || inp.live > count) {
      if (eligible !== null) warnings.push(`Lichess shows ${inp.live} games, more than status.json's ${eligible}: judged by ${inp.live}.`)
      count = inp.live
    }
  } else if (inp.live === 'unknown') {
    lines.push('Lichess could not be asked for his games just now, so a game played since the daily run cannot be ruled out.')
  }
  const over = count !== null && (count > end || (decided !== null && count >= decided))
  const before = count !== null && count < FREEZE_FROM && inp.live !== 'unknown'
  if (noStatusYet && count === null && inp.live === undefined) {
    warnings.push('No public/data/study/status.json on the base branch yet: the daily job has not counted any games, so nothing is frozen.')
    lines.push(...warnings)
    return { ok: true, lines, warnings }
  }
  if (over || before) {
    lines.push(
      before
        ? `Fewer than ${FREEZE_FROM} games: the study version may still change. OK to merge.`
        : decided !== null && count !== null && count >= decided
          ? `The verdict was reached at game ${decided}: the study is over. OK to merge.`
          : `More than ${end} games: the study is over. OK to merge.`,
    )
    return { ok: true, lines: [...lines, ...warnings], warnings }
  }

  const unknown = count === null || inp.live === 'unknown'
  const blocked: string[] = []
  if (touched.length) {
    if (hasLabel) {
      const how = inp.push ? `says "${OVERRIDE_LABEL}"` : `carries "${OVERRIDE_LABEL}"`
      lines.push(`Frozen period${unknown ? ' (or unknown count)' : ''}, but ${what.toLowerCase()} ${how}: the teaching files are allowed as an error fix (wrong sentence, crash). Say what was wrong.`)
    } else {
      blocked.push(`Teaching files (${FROZEN.map((d) => (d.endsWith('/') ? d + '**' : d)).join(', ')}) stay as they are while he plays rated 10+0 games ${FREEZE_FROM}-${end}; only error fixes (label "${OVERRIDE_LABEL}") and the trainer may change.`)
    }
  }
  if (judge.length) {
    if (!hasDeviation) {
      blocked.push(`The judge's files (${INSTRUMENT.map((d) => (d.endsWith('/') ? d + '**' : d)).join(', ')}) stay as they are during the study. A change that must happen anyway needs the label "${INSTRUMENT_LABEL}" and an entry in ${PREREG_DOC} section 3.8 (deviations) in the same change.`)
    } else if (!inp.changed.includes(PREREG_DOC)) {
      blocked.push(`Labelled "${INSTRUMENT_LABEL}", but ${PREREG_DOC} is not changed: write the deviation (what, why, the date) into its section 3.8 in the same change.`)
    } else {
      lines.push(`The judge's files change with "${INSTRUMENT_LABEL}" and a new entry in ${PREREG_DOC}: allowed, and the final report must name it (section 3.8).`)
    }
  }
  if (!blocked.length) return { ok: true, lines: [...lines, ...warnings], warnings }
  lines.push(unknown ? 'Blocked until the count can be read.' : `Blocked: games ${FREEZE_FROM}-${end} are the study period.`)
  lines.push(...blocked)
  const labelHint = touched.length && !hasLabel ? `"${OVERRIDE_LABEL}"` : `"${INSTRUMENT_LABEL}"`
  lines.push(
    inp.push
      ? `This change is already on the main branch. If it was meant, write ${labelHint} in the commit message next time (and the 3.8 entry for the judge's files); otherwise revert it (git revert) and hold it until the study ends (game ${end}).`
      : `To merge anyway it needs the label ${labelHint}${judge.length && !touched.length ? ' and the 3.8 entry' : ''}. Otherwise hold it until the study ends (game ${end}).`,
  )
  return { ok: false, lines: [...lines, ...warnings], warnings }
}

function selfTest(): number {
  const status = (n: number, asOf = '2026-11-01T06:00:00Z') => JSON.stringify({ asOf, eligibleGames: n, phase: 'x' })
  // the fields the daily job writes (scripts/measure/daily.py): windows.looks and verdict.decidedAtGame
  const statusW = (n: number, looks: number[][], decidedAtGame?: number | null) =>
    JSON.stringify({ asOf: '2026-11-01T06:00:00Z', eligibleGames: n, windows: { baseline: [11, 40], looks }, verdict: decidedAtGame === undefined ? null : { look: 1, decidedAtGame } })
  const now = new Date('2026-11-01T12:00:00Z')
  const cases: { name: string; inp: FreezeInput; ok: boolean }[] = [
    { name: '10 games, Home changed', inp: { statusText: status(10), changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now }, ok: true },
    { name: '11 games, Home changed', inp: { statusText: status(11), changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '11 games, Home changed, label error-fix', inp: { statusText: status(11), changed: ['src/features/home/Plan.tsx'], labels: ['error-fix'], dailyJobExists: true, now }, ok: true },
    { name: '11 games, course changed, label Error-Fix', inp: { statusText: status(11), changed: ['src/data/openings/london.ts'], labels: ['docs', 'Error-Fix'], dailyJobExists: true, now }, ok: true },
    { name: '11 games, other label only', inp: { statusText: status(11), changed: ['src/data/openings/london.ts'], labels: ['enhancement'], dailyJobExists: true, now }, ok: false },
    { name: '160 games, Review changed', inp: { statusText: status(160), changed: ['src/features/review/labels.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '161 games, Review changed', inp: { statusText: status(161), changed: ['src/features/review/labels.ts'], labels: [], dailyJobExists: true, now }, ok: true },
    { name: '50 games, puzzles changed', inp: { statusText: status(50), changed: ['src/features/puzzles/x.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '50 games, tactics changed', inp: { statusText: status(50), changed: ['src/features/tactics/x.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '50 games, trainer and rating page only (not teaching files)', inp: { statusText: status(50), changed: ['src/features/safety/Card.tsx', 'src/pages/Rating.tsx', 'src/features/rating/x.ts'], labels: [], dailyJobExists: true, now }, ok: true },
    { name: '50 games, tactic lesson text changed', inp: { statusText: status(50), changed: ['src/data/tactics/fork.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '50 games, opening course page changed', inp: { statusText: status(50), changed: ['src/features/openings/useDrill.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    // the trainer opened after game 55, so the final look runs to game 175 (windows shift by U - 40)
    { name: 'late unlock (final look 76-175), 170 games', inp: { statusText: statusW(170, [[76, 125], [76, 175]]), changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: 'late unlock (final look 76-175), 176 games', inp: { statusText: statusW(176, [[76, 125], [76, 175]]), changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now }, ok: true },
    { name: 'a window ending before 160 never shortens the freeze, 155 games', inp: { statusText: statusW(155, [[61, 100]]), changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: 'look 1 decided at game 110, 112 games', inp: { statusText: statusW(112, [[61, 110], [61, 160]], 110), changed: ['src/features/review/labels.ts'], labels: [], dailyJobExists: true, now }, ok: true },
    { name: 'look 1 reached without a verdict, 112 games', inp: { statusText: statusW(112, [[61, 110], [61, 160]], null), changed: ['src/features/review/labels.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: 'push to main, 30 games, course changed', inp: { statusText: status(30), changed: ['src/data/openings/slav.ts'], labels: [], dailyJobExists: true, push: true, now }, ok: false },
    { name: 'push to main, 30 games, commit says error-fix', inp: { statusText: status(30), changed: ['src/data/openings/slav.ts'], labels: ['error-fix'], dailyJobExists: true, push: true, now }, ok: true },
    { name: '50 games, file moved out of Home (old path listed)', inp: { statusText: status(50), changed: ['src/features/home/Old.tsx', 'src/lib/Old.tsx'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: 'no status.json, no daily job yet', inp: { statusText: null, changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: false, now }, ok: true },
    { name: 'no status.json although the daily job exists', inp: { statusText: null, changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: 'no status.json, daily job exists, label error-fix', inp: { statusText: null, changed: ['src/features/home/Plan.tsx'], labels: ['error-fix'], dailyJobExists: true, now }, ok: true },
    { name: 'status.json broken', inp: { statusText: '{"eligibleGames": ', changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: 'status.json without a count', inp: { statusText: '{"asOf": "2026-11-01"}', changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '11 games, nothing frozen touched', inp: { statusText: status(11), changed: ['README.md', 'src/lib/studyGate.check.ts', 'src/features/rating/RatingPage.tsx', 'src/pages/Settings.tsx'], labels: [], dailyJobExists: true, now }, ok: true },
    // the gate and the menu decide when the trainer opens; an unlock before 30 baseline games spoils the study
    { name: '11 games, study gate changed', inp: { statusText: status(11), changed: ['src/lib/studyGate.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, menu and unlock (App.tsx) changed', inp: { statusText: status(30), changed: ['src/App.tsx'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, Review labels (lichessRules.ts, evaluation.ts) changed', inp: { statusText: status(30), changed: ['src/lib/lichessRules.ts', 'src/lib/evaluation.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, coach messages in Play changed', inp: { statusText: status(30), changed: ['src/features/play/coach.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, rating-page advice changed', inp: { statusText: status(30), changed: ['src/features/rating/WorkOnPanel.tsx'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, rating-page advice text changed', inp: { statusText: status(30), changed: ['src/features/rating/insights.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, Home page plan (src/pages/Home.tsx) changed', inp: { statusText: status(30), changed: ['src/pages/Home.tsx'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, engine files changed', inp: { statusText: status(30), changed: ['public/engine/stockfish-19-lite-single.js', 'src/engine/uci.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, puzzle sets changed', inp: { statusText: status(30), changed: ['public/puzzles/themes/fork.json'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, opening names (eco.json) changed', inp: { statusText: status(30), changed: ['src/data/eco.json'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, course reader and puzzle loader (pgnTree.ts, puzzleData.ts) changed', inp: { statusText: status(30), changed: ['src/lib/pgnTree.ts', 'src/lib/puzzleData.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, opening-name lookup (openingName.ts) changed', inp: { statusText: status(30), changed: ['src/lib/openingName.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '50 games, trainer page, its route file and its cards only', inp: { statusText: status(50), changed: ['src/features/safety/queue.ts', 'src/pages/Safety.tsx', 'public/data/safety/cards.json'], labels: [], dailyJobExists: true, now }, ok: true },
    // the live count from Lichess (fixer, 2026-10-17): status.json can be a day old
    { name: 'status says 10, Lichess says 11 now, Home changed', inp: { statusText: status(10), changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now, live: 11 }, ok: false },
    { name: 'status says 10, Lichess says 10 now, Home changed', inp: { statusText: status(10), changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now, live: 10 }, ok: true },
    { name: 'status says 12, Lichess says 9 (never lowers the count), Home changed', inp: { statusText: status(12), changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now, live: 9 }, ok: false },
    { name: 'status says 5, Lichess could not be asked, Home changed', inp: { statusText: status(5), changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now, live: 'unknown' }, ok: false },
    { name: 'status says 5, Lichess could not be asked, README only', inp: { statusText: status(5), changed: ['README.md'], labels: [], dailyJobExists: true, now, live: 'unknown' }, ok: true },
    { name: 'no status.json and no daily job yet, Lichess says 12, Home changed', inp: { statusText: null, changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: false, now, live: 12 }, ok: false },
    { name: 'no status.json and no daily job yet, Lichess says 3, Home changed', inp: { statusText: null, changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: false, now, live: 3 }, ok: true },
    { name: 'broken status.json, Lichess says 4, Home changed', inp: { statusText: '{"eligibleGames": ', changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now, live: 4 }, ok: true },
    { name: 'status says 170 (study over), Lichess could not be asked', inp: { statusText: status(170), changed: ['src/features/home/Plan.tsx'], labels: [], dailyJobExists: true, now, live: 'unknown' }, ok: true },
    // the judge's own files (INSTRUMENT)
    { name: '30 games, daily job script changed, no label', inp: { statusText: status(30), changed: ['scripts/measure/daily.py'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, measure.yml changed, label error-fix only', inp: { statusText: status(30), changed: ['.github/workflows/measure.yml'], labels: ['error-fix'], dailyJobExists: true, now }, ok: false },
    { name: '30 games, newcomers.json changed, instrument-deviation but no 3.8 entry', inp: { statusText: status(30), changed: ['research/2026-10-16-diagnosis/newcomers/newcomers.json'], labels: ['instrument-deviation'], dailyJobExists: true, now }, ok: false },
    { name: '30 games, prereg script changed, instrument-deviation and preregistration.md', inp: { statusText: status(30), changed: ['research/2026-10-16-diagnosis/prereg/verdict.py', 'research/2026-10-16-diagnosis/preregistration.md'], labels: ['Instrument-Deviation'], dailyJobExists: true, now }, ok: true },
    { name: '30 games, pinned my-games input changed, no label', inp: { statusText: status(30), changed: ['research/2026-10-16-diagnosis/my-games/lichess_abustrup.ndjson'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, this rule changed, no label', inp: { statusText: status(30), changed: ['scripts/lib/claims/study-freeze.ts'], labels: [], dailyJobExists: true, now }, ok: false },
    { name: '30 games, Home and the daily job, both labels and the 3.8 entry', inp: { statusText: status(30), changed: ['src/features/home/Plan.tsx', 'scripts/measure/common.py', 'research/2026-10-16-diagnosis/preregistration.md'], labels: ['error-fix', 'instrument-deviation'], dailyJobExists: true, now }, ok: true },
    { name: '30 games, Home and the daily job, error-fix only', inp: { statusText: status(30), changed: ['src/features/home/Plan.tsx', 'scripts/measure/common.py'], labels: ['error-fix'], dailyJobExists: true, now }, ok: false },
    { name: '30 games, the daily job\'s own output (data/measure, status.json) only', inp: { statusText: status(30), changed: ['data/measure/games.csv', 'public/data/study/status.json'], labels: [], dailyJobExists: true, now }, ok: true },
    { name: '8 games, daily job script changed, no label (before the study)', inp: { statusText: status(8), changed: ['scripts/measure/daily.py'], labels: [], dailyJobExists: true, now, live: 8 }, ok: true },
  ]
  let failed = 0
  for (const c of cases) {
    const got = decide(c.inp).ok
    if (got !== c.ok) failed++
    console.log(`${got === c.ok ? 'ok  ' : 'FAIL'} ${c.name}: ${got ? 'may merge' : 'frozen'}`)
  }
  const stale = decide({ statusText: status(20, '2026-10-20T06:00:00Z'), changed: ['src/features/home/a.ts'], labels: ['error-fix'], dailyJobExists: true, now })
  const staleOk = stale.warnings.some((w) => w.includes('days old'))
  if (!staleOk) failed++
  console.log(`${staleOk ? 'ok  ' : 'FAIL'} a 12-day-old status.json gets a warning`)
  console.log(`\n${cases.length + 1 - failed} of ${cases.length + 1} freeze cases passed`)
  return failed ? 1 : 0
}

function main() {
  const args = process.argv.slice(2)
  if (args.includes('--self-test')) process.exit(selfTest())
  const arg = (n: string) => {
    const i = args.indexOf(n)
    return i >= 0 ? args[i + 1] : undefined
  }
  const liveArg = arg('--live-games')
  const statusPath = arg('--status')
  const changedPath = arg('--changed')
  if (!statusPath || !changedPath) {
    console.log('usage: node scripts/lib/claims/study-freeze.ts --status <status.json> --changed <file> [--labels "a,b"] [--daily-job-exists] [--push] [--live-games N|unknown]')
    process.exit(2)
  }
  const res = decide({
    statusText: fs.existsSync(statusPath) ? fs.readFileSync(statusPath, 'utf8') : null,
    changed: fs.readFileSync(changedPath, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean),
    labels: (arg('--labels') ?? '').split(',').filter(Boolean),
    dailyJobExists: args.includes('--daily-job-exists'),
    push: args.includes('--push'),
    live: liveArg === undefined || liveArg === '' ? undefined : /^\d+$/.test(liveArg) ? Number(liveArg) : 'unknown',
  })
  for (const l of res.lines) console.log(l)
  const onGithub = process.env.GITHUB_ACTIONS === 'true'
  if (onGithub) {
    for (const w of res.warnings) console.log(`::warning title=Study freeze::${w}`)
    if (!res.ok) console.log(`::error title=Study freeze::${res.lines.filter((l) => !res.warnings.includes(l)).slice(-3).join(' ')}`)
  }
  const summary = process.env.GITHUB_STEP_SUMMARY
  if (summary) fs.appendFileSync(summary, ['### Study freeze', '', ...res.lines.map((l) => `- ${l}`), '', res.ok ? '**OK to merge.**' : args.includes('--push') ? '**Frozen: this push changed teaching or judge files during the study.**' : '**Frozen: do not merge.**', '', ''].join('\n'))
  process.exit(res.ok ? 0 : 1)
}

if (process.argv[1]?.endsWith('study-freeze.ts')) main()
