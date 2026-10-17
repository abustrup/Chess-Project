// Self-check of the study gate:   npx tsx src/lib/studyGate.check.ts
// Also used by scripts/check-gate-parity.py:   npx tsx src/lib/studyGate.check.ts --ids FILE.ndjson [--tc 600+0]
// (prints the ids of the games that count, in study order) and --constants (the filter the gate asks Lichess for).
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  CHECK_EVERY_MS,
  GATE_CACHE_KEY,
  LICHESS_EXPORT_URL,
  STATUS_URL,
  STUDY_SINCE_MS,
  STUDY_TC,
  STUDY_USER,
  UNLOCK_AFTER_GAME,
  checkStudyGate,
  gateFor,
  isEligible,
  parseExport,
  statusRecord,
  readGateSync,
  studyGames,
  type ExportGame,
  type GateCache,
  type GateIo,
} from './studyGate'

const FIXTURE = fileURLToPath(new URL('./fixtures/study-gate-cases.ndjson', import.meta.url))
const args = process.argv.slice(2)
const argAfter = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined)

function readGames(path: string): ExportGame[] {
  const games = parseExport(readFileSync(path, 'utf8'))
  if (!games) throw new Error(`${path}: a line is not a JSON object`)
  return games
}

if (args.includes('--ids')) {
  const games = readGames(argAfter('--ids')!)
  console.log(JSON.stringify(studyGames(games, argAfter('--tc') ?? STUDY_TC).map((g) => g.id)))
} else if (args.includes('--constants')) {
  console.log(JSON.stringify({ user: STUDY_USER, sinceMs: STUDY_SINCE_MS, tc: STUDY_TC, url: LICHESS_EXPORT_URL }))
} else {
  void runChecks()
}

async function runChecks() {
  let failures = 0
  function check(name: string, ok: boolean, detail = '') {
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
    if (!ok) failures++
  }

  // --- the fixture: every case says whether it counts
  const games = readGames(FIXTURE)
  const wrong = games.filter((g) => isEligible(g) !== g._expect).map((g) => `${g.id} ${g._case}`)
  check('fixture has 15+ games', games.length >= 15, `${games.length}`)
  check('every fixture case is counted or left out as expected', wrong.length === 0, wrong.join('; '))
  const cases = games.map((g) => String(g._case)).join(' | ')
  for (const need of ['aborted', 'noStart', 'casual', '10+5', '15+10', '5+3', 'Chess960', 'from position', 'BOT',
    'no moves', 'only his opponent moved', 'him as White', 'him as Black', 'timeout', 'resignation after one move']) {
    check(`fixture covers "${need}"`, cases.includes(need))
  }
  const order = studyGames(games).map((g) => g.id)
  const expected = games
    .filter((g) => g._expect === true)
    .map((g, i) => ({ id: g.id, t: Number(g.createdAt), i }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((g) => g.id)
  check('games are numbered by start time, ties in file order', JSON.stringify(order) === JSON.stringify(expected),
    order.join(','))
  // shapes measure.py cannot read (it raises): never counted, at 10+0 or with any clock
  const good = games.find((g) => g.id === 'gate0001')!
  const broken: [string, ExportGame][] = [
    ['black player missing', { ...good, players: { white: (good.players as Record<string, unknown>).white } }],
    ['a player that is null', { ...good, players: { ...(good.players as object), black: null } }],
    ['a user that is text', { ...good, players: { ...(good.players as object), black: { user: 'x' } } }],
    ['a clock that is a number', { ...good, clock: 600 }],
  ]
  const counted = broken.filter(([, g]) => isEligible(g) || isEligible(g, 'any')).map(([name]) => name)
  check('a game measure.py cannot read is never counted', counted.length === 0, counted.join('; '))
  check('a cut-off line spoils the whole answer', parseExport('{"id":"a"}\n{"id":"b"') === null)
  check('blank lines are skipped', parseExport('\n{"id":"a"}\n\n')?.length === 1)

  // --- injected counts: unlock and phases
  const at = (n: number, extra: { unlockAfterGame?: number; windowsU?: number } = {}) =>
    gateFor({ eligibleGames: n, source: 'lichess', asOf: '2026-10-20T08:00:00.000Z', ...extra })
  check('locked at 39', !at(39).unlocked)
  check('unlocked at 40', at(40).unlocked)
  const phases = [0, 10, 11, 40, 41, 60, 61, 110, 160, 161].map((n) => `${n}:${at(n).phase}`).join(' ')
  check(
    'phases change at 10/11, 40/41, 60/61, 160/161',
    phases === '0:warm-up 10:warm-up 11:baseline 40:baseline 41:wash-in 60:wash-in 61:measured 110:measured 160:measured 161:finished',
    phases,
  )
  check('threshold below 40 is ignored (an early unlock would spoil the study)',
    at(39, { unlockAfterGame: 12 }).unlockAfterGame === 40 && !at(39, { unlockAfterGame: 12 }).unlocked)
  const late = [40, 41, 45, 46, 65, 66, 165, 166].map((n) => `${n}:${at(n, { windowsU: 45 }).phase}`).join(' ')
  check(
    'a late trainer (U = 45) moves the windows like verdict.windows()',
    late === '40:baseline 41:waiting 45:waiting 46:wash-in 65:wash-in 66:measured 165:measured 166:finished',
    late,
  )
  const ms = [0, 10, 39, 40, 60, 109, 110, 159, 160].map((n) => `${n}>${at(n).nextMilestone?.game ?? '-'}`).join(' ')
  check('next milestone', ms === '0>10 10>40 39>40 40>60 60>110 109>110 110>160 159>160 160>-', ms)
  const none = gateFor({ eligibleGames: 0 })
  check('nothing known: locked, source none', !none.unlocked && none.source === 'none' && none.asOf === null)
  check('outside a browser the sync read is locked', !readGateSync().unlocked && readGateSync().source === 'none')

  // --- sources and fallbacks, with a fake network and a fake clock
  const T = Date.parse('2026-10-20T08:00:00.000Z')
  const STATUS = { asOf: '2026-10-20T05:20:00Z', eligibleGames: 38, unlockAfterGame: 40, U: 40, phase: 'baseline' }
  const ndjson = readFileSync(FIXTURE, 'utf8')
  type Reply = string | number | object | 'throw'
  function fakeIo(lichess: Reply, status: Reply, cache?: unknown) {
    const io = {
      t: T,
      calls: [] as { url: string; init?: RequestInit }[],
      saved: cache as unknown,
      now: () => io.t,
      readCache: () => io.saved,
      writeCache: (c: GateCache) => {
        io.saved = JSON.parse(JSON.stringify(c))
      },
      fetch: async (url: string, init?: RequestInit) => {
        io.calls.push({ url, init })
        const reply = url === LICHESS_EXPORT_URL ? lichess : url === STATUS_URL ? status : 'throw'
        if (reply === 'throw') throw new TypeError('Failed to fetch')
        if (typeof reply === 'number') return new Response('', { status: reply })
        return new Response(typeof reply === 'string' ? reply : JSON.stringify(reply), { status: 200 })
      },
    }
    return io satisfies GateIo
  }
  const gateOf = (c: Awaited<ReturnType<typeof checkStudyGate>>) =>
    c.result ? gateFor({ ...c.result.record, source: c.result.source }) : gateFor({ eligibleGames: 0 })

  let io = fakeIo(ndjson, STATUS)
  let g = gateOf(await checkStudyGate(io))
  const labelled = games.filter((x) => x._expect === true).length
  check('both answer: the live Lichess count wins', g.source === 'lichess' && g.eligibleGames === labelled, JSON.stringify(g))
  check('live count is stamped with the check time', g.asOf === '2026-10-20T08:00:00.000Z')
  const li = io.calls.find((c) => c.url === LICHESS_EXPORT_URL)
  check('one request to Lichess, asking for NDJSON',
    io.calls.filter((c) => c.url === LICHESS_EXPORT_URL).length === 1 &&
      (li?.init?.headers as Record<string, string> | undefined)?.Accept === 'application/x-ndjson')
  check('Lichess query is the study filter', LICHESS_EXPORT_URL ===
    'https://lichess.org/api/games/user/abustrup?rated=true&perfType=rapid&sort=dateAsc&since=1792108800000')
  check('result saved for next time', (io.saved as GateCache).record?.eligibleGames === labelled)

  io = fakeIo('throw', STATUS)
  g = gateOf(await checkStudyGate(io))
  check('Lichess blocked: status.json values, source "daily job"',
    g.source === 'daily job' && g.eligibleGames === 38 && g.asOf === STATUS.asOf && !g.unlocked, JSON.stringify(g))
  io = fakeIo(429, STATUS)
  g = gateOf(await checkStudyGate(io))
  check('Lichess says 429: status.json values', g.source === 'daily job' && g.eligibleGames === 38)
  io = fakeIo('{"id":"cut', STATUS)
  g = gateOf(await checkStudyGate(io))
  check('cut-off Lichess answer: status.json values, not a partial count', g.source === 'daily job')
  // a 200 answer that is not the export (an error object, a page) would stop measure.py: unknown, never a live 0
  for (const [name, body] of [['an error object', '{"error":"Not found"}\n'], ['an empty object', '{}\n'],
    ['a game without players', '{"id":"x1","rated":true}\n'], ['a game list ending in an error', `${ndjson}{"error":"x"}\n`]]) {
    io = fakeIo(body, STATUS)
    g = gateOf(await checkStudyGate(io))
    check(`Lichess answers ${name}: status.json values, not a live count`, g.source === 'daily job' && g.eligibleGames === 38,
      `${g.source} ${g.eligibleGames}`)
  }
  io = fakeIo('', STATUS)
  g = gateOf(await checkStudyGate(io))
  check('Lichess answers with no games at all: a live count of 0', g.source === 'lichess' && g.eligibleGames === 0)

  const saved: GateCache = {
    record: { eligibleGames: 41, unlockAfterGame: 40, windowsU: 40, asOf: '2026-10-19T21:00:00.000Z', from: 'lichess' },
    checkedAt: T - CHECK_EVERY_MS - 1,
  }
  io = fakeIo('throw', 'throw', saved)
  g = gateOf(await checkStudyGate(io))
  check('both blocked: the saved value, source "cache"',
    g.source === 'cache' && g.eligibleGames === 41 && g.unlocked && g.asOf === saved.record!.asOf, JSON.stringify(g))
  io = fakeIo('throw', STATUS, { ...saved, record: { ...saved.record!, asOf: '2026-10-20T07:30:00.000Z' } })
  g = gateOf(await checkStudyGate(io))
  check('a newer saved count beats an older status.json (the trainer never locks again)',
    g.source === 'cache' && g.eligibleGames === 41)
  io = fakeIo('throw', { ...STATUS, asOf: '2026-10-20T05:20:00Z', eligibleGames: 43 },
    { ...saved, record: { ...saved.record!, asOf: '2026-10-18T10:00:00.000Z' } })
  g = gateOf(await checkStudyGate(io))
  check('a newer status.json beats an older saved count', g.source === 'daily job' && g.eligibleGames === 43)
  io = fakeIo('throw', STATUS, { ...saved, record: { ...saved.record!, asOf: '2031-01-01T00:00:00.000Z' } })
  g = gateOf(await checkStudyGate(io))
  check('a saved count stamped in the future does not beat status.json', g.source === 'daily job' && g.eligibleGames === 38)
  io = fakeIo('throw', 404)
  g = gateOf(await checkStudyGate(io))
  check('nothing at all: locked', !g.unlocked && g.source === 'none' && g.asOf === null)
  io = fakeIo('throw', { asOf: 'yesterday', eligibleGames: '41' })
  g = gateOf(await checkStudyGate(io))
  check('a broken status.json is ignored', g.source === 'none' && !g.unlocked)
  io = fakeIo('throw', { ...STATUS, eligibleGames: 39, unlockAfterGame: 30 })
  g = gateOf(await checkStudyGate(io))
  check('status.json cannot lower the threshold below 40', g.unlockAfterGame === 40 && !g.unlocked)
  io = fakeIo('throw', 'throw', { record: { ...saved.record!, unlockAfterGame: 5, eligibleGames: 20 }, checkedAt: 0 })
  g = gateOf(await checkStudyGate(io))
  check('an edited saved value cannot lower the threshold either', g.unlockAfterGame === 40 && !g.unlocked)

  // --- at most one check per 10 minutes, failed checks included
  io = fakeIo(ndjson, STATUS)
  await checkStudyGate(io)
  io.t = T + CHECK_EVERY_MS - 1
  const again = await checkStudyGate(io)
  check('a second check within 10 minutes asks nothing', !again.checked && io.calls.length === 2, `${io.calls.length}`)
  io.t = T + CHECK_EVERY_MS
  await checkStudyGate(io)
  check('after 10 minutes it asks again', io.calls.filter((c) => c.url === LICHESS_EXPORT_URL).length === 2)
  io = fakeIo('throw', 'throw')
  await checkStudyGate(io)
  io.t = T + 60_000
  await checkStudyGate(io)
  check('a failed check also waits 10 minutes', io.calls.length === 2, `${io.calls.length}`)
  io = fakeIo(ndjson, STATUS, { record: null, checkedAt: T + 3_600_000 })
  await checkStudyGate(io)
  check('a saved check time in the future (clock changed) does not block checks', io.calls.length === 2)

  // --- the daily job's real file, once it exists (M1 writes it)
  const real = fileURLToPath(new URL('../../public/data/study/status.json', import.meta.url))
  if (existsSync(real)) {
    const r = statusRecord(JSON.parse(readFileSync(real, 'utf8')))
    check('the gate can read public/data/study/status.json', r !== null, r ? `${r.eligibleGames} games, as of ${r.asOf}` : 'needs asOf, eligibleGames')
  } else {
    console.log('note public/data/study/status.json does not exist yet (the daily job writes it)')
  }

  // --- storage
  check('saved under cc.study.*', `cc.${GATE_CACHE_KEY}`.startsWith('cc.study.'))
  check('constants match measure.py (user, since, 10+0)',
    STUDY_USER === 'abustrup' && STUDY_SINCE_MS === 1792108800000 && STUDY_TC === '600+0' && UNLOCK_AFTER_GAME === 40)

  console.log(failures ? `\n${failures} check(s) FAILED` : '\nstudyGate.check: all ok')
  if (failures) process.exit(1)
}
