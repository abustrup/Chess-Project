// Claim checker: reads every opening comment and tactics text in the app, finds sentences that say something
// a program can test on the board ("the knight attacks the queen", "the bishop is pinned", "you are a pawn up",
// "Rf1 is checkmate", ...), and tests them against the position the text belongs to.
//
// Run:   npx tsx scripts/check-claims.ts                 (or: npm run check:claims)
// Flags: --out <dir>        where to write report.json and summary.txt
//                           (default research/2026-10-16-diagnosis/claims)
//        --no-engine        skip Stockfish (claims that need it become "could-not-parse")
//        --only <text>      only units whose location contains <text>
//        --strict           exit 1 when any claim is judged false, and refuse to run without Stockfish (or with
//                           --no-engine)
//                           (used by .github/workflows/content-checks.yml)
//        --misparses <file> sentences a person checked on a board and found the checker misread
//                           (default research/2026-10-16-diagnosis/claims/misparses.json); --strict does not fail
//                           on them but still lists them
//
// Verdicts: true / false / could-not-parse. The checker is built to be conservative: a sentence it is
// unsure how to read is "could-not-parse", never "false". Self-test: npx tsx scripts/check-claims.check.ts
import fs from 'node:fs'
import path from 'node:path'
import { OPENING_COURSES } from '../src/data/openings'
import { TACTIC_LESSONS } from '../src/data/tactics'
import { openingUnits, tacticUnits, sentences, type TextUnit } from './lib/claims/units'
import { parseSentence, type MoveTok, type Discourse } from './lib/claims/parse'
import { evaluateClaim, type EvalContext, type ClaimResult } from './lib/claims/evaluate'
import { UciEngine } from './lib/claims/engine'

export interface ReportRow {
  id: number
  file: string
  /** line in `file` where the sentence starts (best effort; absent when not found) */
  line?: number
  location: string
  unitKind: TextUnit['kind']
  sentence: string
  claim: string
  verdict: ClaimResult['verdict']
  reason: string
  position?: string
  fen?: string
  confidence?: 'high' | 'medium'
}

const fileCache = new Map<string, string[]>()
/** Line number of a sentence in its source file: searched by its longest stretch without quote marks. */
function findLine(file: string, sentence: string): number | undefined {
  if (!fs.existsSync(file)) return undefined
  if (!fileCache.has(file)) fileCache.set(file, fs.readFileSync(file, 'utf8').split('\n'))
  const lines = fileCache.get(file)!
  const chunk = sentence
    .split(/['’‘"“”\\]/)
    .map((x) => x.trim())
    .sort((a, b) => b.length - a.length)[0]
  if (!chunk || chunk.length < 8) return undefined
  const i = lines.findIndex((l) => l.includes(chunk))
  return i >= 0 ? i + 1 : undefined
}

/** Check every sentence of the given units. Exported so the self-test can reuse it. */
export async function checkUnits(units: TextUnit[], engine: UciEngine | null): Promise<ReportRow[]> {
  const rows: ReportRow[] = []
  let id = 0
  let prevUnit: TextUnit | null = null
  let lastDiscourse: Discourse = { topic: [], mentions: [] }
  for (const unit of units) {
    const history: EvalContext['history'] = []
    const ss = sentences(unit.text)
    let prevHypothetical = false
    let prevMoves: MoveTok[] = []
    let priorStory = false
    // the steps of one worked example are one story: "it" in step 2 can point back to step 1
    const sameStory = prevUnit && unit.kind === 'example-step' && prevUnit.kind === 'example-step' && prevUnit.location.split(' / move ')[0] === unit.location.split(' / move ')[0]
    let discourse: Discourse = sameStory ? lastDiscourse : { topic: [], mentions: [] }
    const narrative = unit.kind === 'exercise-explanation' || unit.kind === 'example-step'
    for (let si = 0; si < ss.length; si++) {
      const sp = parseSentence(ss[si], { afterHypothetical: prevHypothetical, narrative, discourse })
      discourse = sp.discourse
      sp.order.forEach((rid, pos) => history.push({ ref: sp.refs[rid], sentence: si, pos }))
      // "Now ..." / "Then ..." continues from the moves of the sentence before
      // (a worked line already offers every position on it, so there "Now ..." needs no carrying)
      const carry = !narrative && /^(now|then|after that|and then)\b/i.test(ss[si].trim()) ? prevMoves : []
      const ctx: EvalContext = { unit, engine, history, sentenceIndex: si, currentOrder: sp.order, carry, priorStory }
      const anchored = sp.refs.filter((r) => r.kind === 'move' && r.move?.anchor).map((r) => r.move!)
      prevHypothetical = sp.hypotheticalUnspecified
      if (anchored.length) prevMoves = [...carry, ...anchored]
      if (anchored.length || sp.hypotheticalUnspecified) priorStory = true
      for (const pc of sp.claims) {
        // one row per named target, so a false half of "attacks X and Y" is reported on its own
        const split =
          (pc.body.kind === 'attacks' || pc.body.kind === 'defends' || pc.body.kind === 'aims' || pc.body.kind === 'covers') && pc.body.objs.length > 1
            ? pc.body.objs.map((o) => ({ ...pc, body: { ...pc.body, objs: [o] } as typeof pc.body }))
            : [pc]
        for (const one of split) {
          let results: ClaimResult[]
          try {
            results = await evaluateClaim(one, ctx)
          } catch (e) {
            results = [{ verdict: 'could-not-parse', claim: one.body.kind, reason: `checker error: ${(e as Error).message}` }]
          }
          for (const r of results)
            rows.push({
              id: id++,
              file: unit.file,
              line: findLine(unit.file, ss[si]),
              location: unit.location,
              unitKind: unit.kind,
              sentence: ss[si],
              claim: r.claim,
              verdict: r.verdict,
              reason: r.reason,
              position: r.position,
              fen: r.fen,
              confidence: r.verdict === 'false' ? (r.confidence ?? 'high') : undefined,
            })
        }
      }
      for (const u of sp.unparsed)
        rows.push({
          id: id++,
          file: unit.file,
          location: unit.location,
          unitKind: unit.kind,
          sentence: ss[si],
          claim: `(unread: "${u.keyword}")`,
          verdict: 'could-not-parse',
          reason: unit.line.length ? u.reason : 'this text has no board position',
        })
    }
    prevUnit = unit
    lastDiscourse = discourse
  }
  return rows
}

function summarise(rows: ReportRow[], units: TextUnit[], meta: Record<string, string | number>): string {
  const isUnread = (r: ReportRow) => r.claim.startsWith('(unread')
  const parsed = rows.filter((r) => !isUnread(r))
  const n = (f: (r: ReportRow) => boolean, rs: ReportRow[] = rows) => rs.filter(f).length
  const L: string[] = []
  L.push(`CLAIM CHECK OF THE APP'S TEACHING TEXT (run ${meta.date})`)
  L.push('')
  L.push('What this is: a program read every opening comment and every tactics text in the app, picked out')
  L.push('sentences that state something about the board that a program can test ("the knight attacks the')
  L.push('queen", "the bishop is pinned", "you are a pawn up", "Rf1 is checkmate"), and tested each one on the')
  L.push('position the text belongs to. Rerun it any time with: npm run check:claims')
  L.push('')
  L.push('How to read the verdicts:')
  L.push('  true             the board agrees with the sentence (under at least one reasonable reading of it)')
  L.push('  false            the board disagrees under every reasonable reading the program could find')
  L.push('  could-not-parse  the program was not sure what the sentence means, or which position it is about')
  L.push('                   (a plan, an "if", a question, a hedge); it never calls those false')
  L.push('')
  L.push(`Text checked: ${units.length} pieces of text, ${meta.sentences} sentences.`)
  L.push(`Board claims read: ${parsed.length}. True: ${n((r) => r.verdict === 'true')}. False: ${n((r) => r.verdict === 'false')}. Read but not judged: ${n((r) => r.verdict === 'could-not-parse' && !isUnread(r))}.`)
  L.push(`Clauses with a claim word ("attacks", "safe", "check", ...) that matched no pattern: ${n(isUnread)} (most are not board claims: "safety check", "your king is safe").`)
  L.push(`Stockfish: ${meta.engine}. Run time: ${meta.seconds} s.`)
  L.push('')
  const key = (r: ReportRow) => `${r.location}|${r.sentence}`
  const claimLike = new Set(rows.map(key))
  const judged = new Set(rows.filter((r) => r.verdict !== 'could-not-parse').map(key))
  L.push(`Coverage: ${judged.size} of ${claimLike.size} sentences with a claim word got at least one claim judged true or false.`)
  L.push('Limits: the program understands a small, fixed set of sentence patterns. Plans, ideas, comparisons')
  L.push('("better", "active", "weak") and stories it cannot replay move by move are not checked at all. A "true"')
  L.push('here is a board fact, not a judgement that the move or the advice is good (that is the engine audit\'s job).')
  L.push('')
  L.push('By content area (true / false / not judged / unread):')
  const areas = new Map<string, ReportRow[]>()
  for (const r of rows) areas.set(r.location.split(' / ')[0], [...(areas.get(r.location.split(' / ')[0]) ?? []), r])
  for (const [k, rs] of areas)
    L.push(`  ${k.padEnd(24)} ${String(n((r) => r.verdict === 'true', rs)).padStart(4)} / ${String(n((r) => r.verdict === 'false', rs)).padStart(3)} / ${String(n((r) => r.verdict === 'could-not-parse' && !isUnread(r), rs)).padStart(4)} / ${String(n(isUnread, rs)).padStart(4)}`)
  L.push('')
  L.push('By claim type (true / false / not judged):')
  const types = new Map<string, ReportRow[]>()
  for (const r of parsed) {
    const key = r.claim.replace(/\(.*$/, '').replace(/ \d+x$/, ' Nx')
    types.set(key, [...(types.get(key) ?? []), r])
  }
  for (const [k, rs] of [...types].sort((a, b) => b[1].length - a[1].length))
    L.push(`  ${k.padEnd(24)} ${String(n((r) => r.verdict === 'true', rs)).padStart(4)} / ${String(n((r) => r.verdict === 'false', rs)).padStart(3)} / ${String(n((r) => r.verdict === 'could-not-parse', rs)).padStart(4)}`)
  L.push('')
  L.push('Why claims were read but not judged:')
  const why = new Map<string, number>()
  for (const r of parsed.filter((r) => r.verdict === 'could-not-parse')) {
    const k = r.reason.replace(/\(.*$/, '').replace(/:.*$/, '').replace(/ the moves .*/, ' the written moves cannot be replayed').trim()
    why.set(k, (why.get(k) ?? 0) + 1)
  }
  for (const [k, v] of [...why].sort((a, b) => b[1] - a[1]).slice(0, 12)) L.push(`  ${String(v).padStart(4)}  ${k}`)
  L.push('')
  const falses = rows.filter((r) => r.verdict === 'false')
  L.push(`FALSE CLAIMS (${falses.length}). Look at each on a board before editing the text: "medium confidence" ones rest on a rule of thumb or a short engine line.`)
  for (const r of falses) {
    L.push('')
    L.push(`- ${r.file}${r.line ? ` line ${r.line}` : ''}`)
    L.push(`  where: ${r.location}`)
    L.push(`  text:  "${r.sentence}"`)
    L.push(`  claim: ${r.claim}   (${r.confidence} confidence)`)
    L.push(`  board: ${r.reason}`)
    if (r.fen) L.push(`  FEN:   ${r.fen}`)
  }
  return L.join('\n') + '\n'
}

async function main() {
  const args = process.argv.slice(2)
  const arg = (name: string) => {
    const i = args.indexOf(name)
    return i >= 0 ? args[i + 1] : undefined
  }
  const outDir = arg('--out') ?? 'research/2026-10-16-diagnosis/claims'
  const only = arg('--only')
  const useEngine = !args.includes('--no-engine')
  let units = [...openingUnits(OPENING_COURSES), ...tacticUnits(TACTIC_LESSONS)]
  if (only) units = units.filter((u) => u.location.includes(only))
  const strict = args.includes('--strict')
  if (strict && !useEngine) {
    // --strict is the gate: claims that need a search must be judged, so it never runs without the engine
    console.log('--strict needs Stockfish: drop --no-engine.')
    process.exit(2)
  }
  const engine = useEngine ? await UciEngine.create({ threads: 1, hashMb: 64 }) : null
  if (useEngine && !engine) {
    // without Stockfish the claims that need search silently become "could-not-parse": never let that pass as a check
    console.log('Stockfish was not found (set STOCKFISH=/path/to/stockfish). Claims that need a search would not be judged.')
    if (strict) process.exit(2)
  }
  const t0 = Date.now()
  let rows: ReportRow[]
  try {
    rows = await checkUnits(units, engine)
  } finally {
    engine?.close()
  }
  const nSentences = units.reduce((s, u) => s + sentences(u.text).length, 0)
  const meta = {
    date: new Date().toISOString().slice(0, 10),
    engine: engine ? `${engine.name ?? 'Stockfish'} (${engine.path}), 1 thread (so runs repeat exactly), depth 14 for material and safety look-ahead` : 'not used',
    sentences: nSentences,
    seconds: Math.round((Date.now() - t0) / 1000),
  }
  fs.mkdirSync(outDir, { recursive: true })
  const report = {
    tool: 'scripts/check-claims.ts',
    generated: new Date().toISOString(),
    engine: meta.engine,
    units: units.length,
    sentences: nSentences,
    counts: {
      claimsRead: rows.filter((r) => !r.claim.startsWith('(unread')).length,
      true: rows.filter((r) => r.verdict === 'true').length,
      false: rows.filter((r) => r.verdict === 'false').length,
      couldNotParse: rows.filter((r) => r.verdict === 'could-not-parse').length,
      unreadClauses: rows.filter((r) => r.claim.startsWith('(unread')).length,
    },
    claims: rows,
  }
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1))
  const summary = summarise(rows, units, meta)
  fs.writeFileSync(path.join(outDir, 'summary.txt'), summary)
  console.log(summary.split('\nFalse claims')[0])
  console.log(`False claims: ${report.counts.false} (details in ${path.join(outDir, 'summary.txt')})`)
  console.log(`Took ${meta.seconds} s.`)
  const misparses = loadMisparses(arg('--misparses') ?? 'research/2026-10-16-diagnosis/claims/misparses.json')
  const isMisparse = (r: ReportRow) => misparses.some((m) => m.sentence === r.sentence && (!m.claim || m.claim === r.claim) && (!m.file || m.file === r.file))
  const falses = rows.filter((r) => r.verdict === 'false' && !isMisparse(r))
  const excused = rows.filter((r) => r.verdict === 'false' && isMisparse(r))
  if (strict) reportForCi(falses, excused, meta.engine)
  if (strict && falses.length > 0) process.exit(1)
}

/** A false verdict that a person checked on a board and found to be the checker's misreading, not a wrong sentence. */
interface Misparse {
  sentence: string
  /** the claim label from report.json; omit to excuse every false claim read from the sentence */
  claim?: string
  file?: string
  /** why the sentence is right after all (who checked it, on which position) */
  reason: string
}

function loadMisparses(file: string): Misparse[] {
  if (!fs.existsSync(file)) return []
  const doc = JSON.parse(fs.readFileSync(file, 'utf8')) as { entries?: Misparse[] }
  for (const m of doc.entries ?? []) if (!m.sentence || !m.reason) throw new Error(`${file}: every entry needs "sentence" and "reason"`)
  return doc.entries ?? []
}

/** GitHub's workflow-command escaping for annotation text. */
const ghEscape = (t: string) => t.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')

/**
 * Strict mode: one line per false sentence (file, line, sentence, what the board says), plus, on GitHub Actions,
 * an annotation on the line in the pull request and a short table on the run's summary page.
 */
function reportForCi(falses: ReportRow[], excused: ReportRow[], engine: string) {
  console.log('')
  for (const r of excused) console.log(`  misparse (recorded, not counted)  ${r.file}${r.line ? `:${r.line}` : ''}  "${r.sentence}"`)
  console.log(falses.length ? `STRICT: ${falses.length} false sentence(s):` : 'STRICT: 0 false sentences.')
  for (const r of falses) {
    console.log(`  FALSE  ${r.file}${r.line ? `:${r.line}` : ''}  "${r.sentence}"  (${r.reason})`)
    if (process.env.GITHUB_ACTIONS === 'true')
      console.log(`::error file=${r.file}${r.line ? `,line=${r.line}` : ''},title=False sentence in the course text::${ghEscape(`"${r.sentence}" The board says: ${r.reason}`)}`)
  }
  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (summaryFile) {
    const L = ['### Claim check of the teaching text', '', `Engine: ${engine}.`, '']
    if (excused.length) L.push(`${excused.length} recorded misparse(s) not counted (research/2026-10-16-diagnosis/claims/misparses.json).`, '')
    if (!falses.length) L.push('0 false sentences.')
    else {
      L.push(`**${falses.length} false sentence(s).** Fix the text or, if the checker misread it, record it as a misparse.`, '')
      L.push('| File | Sentence | What the board says |', '|---|---|---|')
      for (const r of falses) L.push(`| ${r.file}${r.line ? `:${r.line}` : ''} | ${r.sentence.replace(/\|/g, '\\|')} | ${r.reason.replace(/\|/g, '\\|')} |`)
    }
    fs.appendFileSync(summaryFile, L.join('\n') + '\n\n')
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('check-claims.ts')
if (isMain) main().catch((e) => {
  console.error(e)
  process.exit(2)
})
