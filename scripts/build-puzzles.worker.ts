// One worker of the puzzle check (started by build-puzzles.ts, several run side by side).
//   npx tsx scripts/build-puzzles.worker.ts <todo.jsonl> <results.jsonl>
// Reads puzzles (one JSON per line) from <todo>, checks each one and APPENDS a verdict per line to <results>,
// so a stopped run can simply be started again and carries on where it left off.
import { appendFileSync, readFileSync, existsSync } from 'node:fs'
import { NodeEngine } from './lib/nodeEngine'
import { engineCheck, replay, type CachedPuzzle, type Verdict } from './build-puzzles.check'

const [todoPath, resultsPath] = process.argv.slice(2)
if (!todoPath || !resultsPath) {
  console.error('usage: build-puzzles.worker.ts <todo.jsonl> <results.jsonl>')
  process.exit(1)
}

const done = new Set<string>()
if (existsSync(resultsPath)) {
  for (const line of readFileSync(resultsPath, 'utf8').split('\n')) {
    if (line) done.add((JSON.parse(line) as Verdict).id)
  }
}
const todo = readFileSync(todoPath, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l) as CachedPuzzle)
  .filter((p) => !done.has(p.id))

const engine = await NodeEngine.create()
let checked = 0
for (const p of todo) {
  const played = replay(p)
  const verdict: Verdict = played.ok ? await engineCheck(engine, p, played) : { id: p.id, ok: false, reason: played.reason }
  appendFileSync(resultsPath, JSON.stringify(verdict) + '\n')
  checked++
  if (checked % 250 === 0) console.log(`${resultsPath}: ${checked}/${todo.length}`)
}
engine.close()
console.log(`${resultsPath}: finished ${checked} puzzles`)
