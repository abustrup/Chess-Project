// Narrows the opening courses (task O1, 2026-10-16) from a fixed recipe in spec.ts.
//
//   npx tsx narrow.ts paths SRC_DIR OUT.json            every line of the merged (not yet pruned) chapters,
//                                                       in export_courses.ts's format, for reach.py
//   npx tsx narrow.ts write SRC_DIR REACH.json OUT_DIR  prune, write the course files and report.json
//
// SRC_DIR holds the course files as they were after O1's first commit (the 3 sentence fixes).
// The rule, in plain words:
//  - each kept chapter starts from its old tree; the chapters listed under `merge` are folded in
//    (the host's move wins wherever both teach a move);
//  - at your turn only the first listed move stays (one taught move per position);
//  - at the opponent's turn the first listed reply always stays; another reply stays if it comes no later
//    than `keepAllPly` (the opponent's 3rd move; so today's coverage of the first moves is not lost) or if
//    1000-1300 players reach it in at least `minReach` of the owner's games (September 2026 sample);
//    a reply kept only for the first rule is cut `stubPlies` plies after it;
//  - no line goes past `maxPly` (London 16 = Black's 8th move, Caro-Kann and Slav 15 = White's 8th move),
//    so every line ends with the opponent's move, as the course files always did;
//  - explicit edits in spec.ts (new moves, changed moves, dropped lines, comments) come on top and are kept.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { OpeningCourse } from '../../../../src/types.ts'
import { parse, clone, find, kidsAt, mergeInto, walk, fragment, toPgn, roundTrip, posKey, type TNode, type TRoot } from './tree.ts'
import { SPEC, PARAMS, type ChapterSpec, type CourseSpec, type Op } from './spec.ts'

type Mark = TNode & { keep?: boolean; keepDepth?: number; longOk?: boolean }

const [mode, srcDir, a3, a4] = process.argv.slice(2)

async function loadCourses(dir: string): Promise<OpeningCourse[]> {
  const mod = (await import(pathToFileURL(path.resolve(dir, 'index.ts')).href)) as { OPENING_COURSES: OpeningCourse[] }
  return mod.OPENING_COURSES
}

function oldTree(courses: OpeningCourse[], course: string, chapter: string): TRoot {
  const c = courses.find((x) => x.id === course)!
  const ch = c.chapters.find((x) => x.id === chapter)
  if (!ch) throw new Error(`no chapter ${course}/${chapter}`)
  return parse(ch.pgn)
}

const startsWith = (p: string[], prefix: string[]) => prefix.every((s, i) => p[i] === s)

/** Copy of `t` without the lines that start with one of `exclude`, or (if `only` is set) outside `only`. */
function filtered(t: TRoot, only?: string[][], exclude?: string[][]): TRoot {
  const out = clone(t)
  const rec = (kids: TNode[], p: string[]) => {
    for (let i = kids.length - 1; i >= 0; i--) {
      const q = [...p, kids[i].san]
      const ex = exclude?.some((e) => startsWith(q, e) && q.length >= e.length)
      const inOnly = !only || only.some((o) => startsWith(q, o.slice(0, q.length)) || startsWith(q, o))
      if (ex || !inOnly) kids.splice(i, 1)
      else rec(kids[i].children, q)
    }
  }
  rec(out.children, [])
  return out
}

function markKeep(n: Mark, depth?: number) {
  n.keep = true
  if (depth !== undefined) n.keepDepth = depth
  n.children.forEach((c) => markKeep(c as Mark, depth))
}

function applyOp(t: TRoot, op: Op, courses: OpeningCourse[], course: string) {
  switch (op.op) {
    case 'drop': {
      const kids = kidsAt(t, op.path.slice(0, -1))
      const i = kids.findIndex((k) => k.san === op.path[op.path.length - 1])
      if (i < 0) throw new Error(`drop: not found ${op.path.join(' ')}`)
      kids.splice(i, 1)
      break
    }
    case 'cut': {
      // keep the node, remove everything after it
      const n = find(t, op.path)
      if (!n) throw new Error(`cut: not found ${op.path.join(' ')}`)
      n.children = []
      break
    }
    case 'graft': {
      const kids = kidsAt(t, op.path)
      const add = fragment(t, op.path, op.pgn) as Mark[]
      add.forEach((a) => markKeep(a))
      if (op.long) {
        const mark = (n: Mark) => {
          n.longOk = true
          n.children.forEach((c) => mark(c as Mark))
        }
        add.forEach(mark)
      }
      for (const a of add) {
        const same = kids.findIndex((k) => k.san === a.san)
        if (same >= 0) {
          if (op.replace) kids.splice(same, 1)
          else throw new Error(`graft: ${a.san} already at ${op.path.join(' ')} (use replace)`)
        }
      }
      if (op.first) kids.unshift(...add)
      else kids.push(...add)
      break
    }
    case 'adopt': {
      // take the moves that follow the same position in an old chapter and hang them here
      const here = op.path.length ? find(t, op.path)! : null
      const fen = here ? here.fen : t.fen
      const src = oldTree(courses, course, op.from)
      let found: TNode[] | null = null
      if (posKey(src.fen) === posKey(fen)) found = src.children
      walk(src, (n) => {
        if (!found && posKey(n.fen) === posKey(fen)) found = n.children
      })
      if (!found) throw new Error(`adopt: position after ${op.path.join(' ')} not in ${op.from}`)
      const shiftTo = here ? here.ply : 0
      const moved = clone(found as TNode[])
      const delta = shiftTo + 1 - (moved[0]?.ply ?? shiftTo + 1)
      const shift = (n: TNode) => {
        n.ply += delta
        n.children.forEach(shift)
      }
      moved.forEach(shift)
      mergeInto(here ? here.children : t.children, moved)
      break
    }
    case 'comment': {
      const n = find(t, op.path)
      if (!n) throw new Error(`comment: not found ${op.path.join(' ')}`)
      n.comment = op.text
      if (op.draw !== undefined) n.draw = op.draw
      break
    }
    case 'nags': {
      const n = find(t, op.path)
      if (!n) throw new Error(`nags: not found ${op.path.join(' ')}`)
      n.nags = op.nags
      break
    }
    case 'first': {
      const kids = kidsAt(t, op.path.slice(0, -1))
      const i = kids.findIndex((k) => k.san === op.path[op.path.length - 1])
      if (i < 0) throw new Error(`first: not found ${op.path.join(' ')}`)
      kids.unshift(...kids.splice(i, 1))
      break
    }
    case 'keep': {
      const n = find(t, op.path) as Mark | undefined
      if (!n) throw new Error(`keep: not found ${op.path.join(' ')}`)
      markKeep(n, op.depth)
      break
    }
  }
}

function buildChapter(courses: OpeningCourse[], cs: CourseSpec, ch: ChapterSpec): TRoot {
  let t: TRoot = ch.base ? oldTree(courses, cs.course, ch.base) : { comment: '', draw: '', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', children: [] }
  if (ch.baseOnly || ch.baseExclude) t = filtered(t, ch.baseOnly, ch.baseExclude)
  for (const op of ch.before ?? []) applyOp(t, op, courses, cs.course)
  for (const m of ch.merge ?? []) {
    const src = filtered(oldTree(courses, m.course ?? cs.course, m.from), m.only, m.exclude)
    mergeInto(t.children, src.children)
  }
  for (const op of ch.ops ?? []) applyOp(t, op, courses, cs.course)
  return t
}

/* ------------------------------------------------------------------ pruning */

interface Reach {
  [key: string]: { reach: number; nPos: number; nMove: number }
}

function prune(t: TRoot, cs: CourseSpec, reach: Reach, log: string[], chId: string) {
  const own = cs.side === 'white' ? 'w' : 'b'
  const rec = (kids: Mark[], p: string[], limit: number) => {
    // own turn: one taught move
    if (kids.length && kids[0].mover === own && kids.length > 1) {
      for (const k of kids.slice(1)) log.push(`${chId}: dropped alternative own move ${[...p, k.san].join(' ')}`)
      kids.splice(1)
    }
    for (let i = kids.length - 1; i >= 0; i--) {
      const k = kids[i]
      const q = [...p, k.san]
      let lim = k.longOk ? 99 : limit
      if (k.ply > cs.maxPly && !k.longOk) {
        kids.splice(i, 1)
        continue
      }
      if (k.mover !== own && i > 0) {
        const r = reach[`${cs.course}|${q.join(' ')}`]?.reach ?? 0
        const early = k.ply <= cs.keepAllPly
        if (k.keep) {
          if (k.keepDepth !== undefined) lim = Math.min(lim, k.ply + k.keepDepth)
        } else if (r >= PARAMS.minReach) {
          // stays in full
        } else if (early) {
          lim = Math.min(lim, k.ply + PARAMS.stubPlies)
        } else {
          log.push(`${chId}: dropped rare reply ${q.join(' ')} (reach ${(100 * r).toFixed(2)}%)`)
          kids.splice(i, 1)
          continue
        }
      }
      if (k.ply >= lim) {
        // a line may only end on the opponent's move
        if (k.mover === own) {
          kids.splice(i, 1)
          continue
        }
        k.children = []
        continue
      }
      const hadChildren = k.children.length > 0
      rec(k.children as Mark[], q, lim)
      // a line that now ends right after the owner's move gets cut back to the opponent's move before it
      if (k.mover === own && hadChildren && k.children.length === 0 && !k.keep) {
        kids.splice(i, 1)
      }
    }
  }
  rec(t.children as Mark[], [], cs.maxPly)
}

/* ------------------------------------------------------------------ main */

function exportFormat(courses: OpeningCourse[], built: Map<string, Map<string, TRoot>>) {
  const out = []
  for (const cs of SPEC) {
    const chapters = []
    for (const ch of cs.chapters) {
      const t = built.get(cs.course)!.get(ch.id)!
      const nodes: { ply: number; san: string; mover: string; first: boolean; main: boolean; path: string[]; comment: string; nags: number[] }[] = []
      const rec = (kids: TNode[], p: string[], main: boolean) =>
        kids.forEach((k, i) => {
          const q = [...p, k.san]
          nodes.push({ ply: k.ply, san: k.san, mover: k.mover, first: i === 0, main: main && i === 0, path: q, comment: k.comment, nags: k.nags })
          rec(k.children, q, main && i === 0)
        })
      rec(t.children, [], true)
      chapters.push({ id: ch.id, title: ch.title, difficulty: ch.difficulty, summary: ch.summary, nodes })
    }
    const old = courses.find((c) => c.id === cs.course)!
    out.push({ id: cs.course, name: old.name, side: cs.side, signatureMoves: cs.signatureMoves ?? old.signatureMoves, chapters })
  }
  return out
}

async function main() {
  const courses = await loadCourses(srcDir)
  const built = new Map<string, Map<string, TRoot>>()
  for (const cs of SPEC) {
    const m = new Map<string, TRoot>()
    for (const ch of cs.chapters) m.set(ch.id, buildChapter(courses, cs, ch))
    built.set(cs.course, m)
  }
  if (mode === 'paths') {
    fs.writeFileSync(a3, JSON.stringify(exportFormat(courses, built)))
    console.log(`wrote ${a3}`)
    return
  }
  if (mode !== 'write') throw new Error('mode must be paths or write')
  const reach = JSON.parse(fs.readFileSync(a3, 'utf8')) as Reach
  const outDir = a4
  const log: string[] = []
  const unpruned = new Map<string, TRoot>()
  for (const cs of SPEC) {
    for (const ch of cs.chapters) {
      const t = built.get(cs.course)!.get(ch.id)!
      unpruned.set(`${cs.course}/${ch.id}`, clone(t))
      prune(t, cs, reach, log, `${cs.course}/${ch.id}`)
      for (const op of ch.after ?? []) applyOp(t, op, courses, cs.course)
      roundTrip(t)
    }
  }
  // report: positions where two places teach different moves, and every line end (with what was cut after it)
  const taught = new Map<string, Map<string, string[]>>()
  const leaves: { chapter: string; line: string; ply: number; comment: string; truncated: boolean; cutNext?: string; cutComment?: string }[] = []
  for (const cs of SPEC) {
    const own = cs.side === 'white' ? 'w' : 'b'
    for (const ch of cs.chapters) {
      const ref = `${cs.course}/${ch.id}`
      const t = built.get(cs.course)!.get(ch.id)!
      const before = unpruned.get(ref)!
      walk(t, (n, p, sibs) => {
        if (n.mover === own && sibs[0] === n) {
          const k = posKey(n.fenBefore)
          if (!taught.has(k)) taught.set(k, new Map())
          const m = taught.get(k)!
          m.set(n.san, [...(m.get(n.san) ?? []), `${ref} (${p.join(' ')})`])
        }
        if (n.children.length === 0) {
          const old = find(before, p)
          const nxt = old?.children[0]
          leaves.push({ chapter: ref, line: p.join(' '), ply: n.ply, comment: n.comment, truncated: !!nxt, cutNext: nxt?.san, cutComment: nxt?.comment })
        }
      })
    }
  }
  const conflicts = [...taught.entries()].filter(([, m]) => m.size > 1).map(([fen, m]) => ({ fen, moves: Object.fromEntries(m) }))
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ conflicts, leaves }, null, 1))
  console.log(`conflicts: ${conflicts.length}; line ends: ${leaves.length} (${leaves.filter((l) => l.truncated).length} cut short)`)
  fs.mkdirSync(outDir, { recursive: true })
  const pgns: Record<string, Record<string, string>> = {}
  for (const cs of SPEC) {
    pgns[cs.course] = {}
    for (const ch of cs.chapters) pgns[cs.course][ch.id] = toPgn(built.get(cs.course)!.get(ch.id)!)
  }
  fs.writeFileSync(path.join(outDir, 'pgns.json'), JSON.stringify(pgns, null, 1))
  writeCourseFiles(srcDir, outDir, pgns)
  fs.writeFileSync(path.join(outDir, 'narrow-log.txt'), log.join('\n') + '\n')
  fs.writeFileSync(path.join(outDir, 'narrowed-courses.json'), JSON.stringify(exportFormat(courses, built)))
  console.log(`wrote ${outDir}/pgns.json, ${log.length} log lines`)
}

/* ------------------------------------------------------------------ writing the course files */

const FILES: Record<CourseSpec['course'], { file: string; exportName: string }> = {
  london: { file: 'london.ts', exportName: 'londonCourse' },
  'caro-kann': { file: 'caroKann.ts', exportName: 'caroKannCourse' },
  slav: { file: 'slav.ts', exportName: 'slavCourse' },
}

/** A TypeScript string literal in the style of the course files (single quotes unless the text has one). */
function lit(text: string): string {
  if (!text.includes("'")) return `'${text}'`
  if (!text.includes('"')) return `"${text}"`
  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function writeCourseFiles(src: string, outDir: string, pgns: Record<string, Record<string, string>>) {
  for (const cs of SPEC) {
    const { file, exportName } = FILES[cs.course]
    const old = fs.readFileSync(path.join(src, file), 'utf8')
    const start = old.indexOf(`export const ${exportName}: OpeningCourse = {`)
    const metaStart = old.indexOf('\n', start) + 1
    const metaEnd = old.indexOf('  chapters: [', metaStart)
    if (start < 0 || metaEnd < 0) throw new Error(`cannot find the course object in ${file}`)
    let meta = old.slice(metaStart, metaEnd)
    for (const [from, to] of cs.meta ?? []) {
      if (!meta.includes(from)) throw new Error(`${file}: meta text not found: ${from.slice(0, 60)}`)
      meta = meta.replace(from, to)
    }
    if (cs.signatureMoves) meta = meta.replace(/signatureMoves: \[[^\]]*\],/, `signatureMoves: [${cs.signatureMoves.map((m) => `'${m}'`).join(', ')}],`)
    // everything before the course object (imports, comments, shared constants) except the old chapter PGN constants
    let before = old.slice(0, start)
    if (cs.course === 'london') before = "import type { OpeningCourse } from '../../types'\n\n"
    if (cs.course === 'slav') {
      const eco = old.indexOf('const slavEcoNames = [')
      before = "import type { OpeningCourse } from '../../types'\n\n" + SLAV_HEADER + '\n' + old.slice(eco, start)
    }
    const chapters = cs.chapters
      .map((ch) => {
        const pgn = pgns[cs.course][ch.id].replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
        return [
          '    {',
          `      id: '${ch.id}',`,
          `      title: ${lit(ch.title)},`,
          '      summary:',
          `        ${lit(ch.summary)},`,
          `      difficulty: ${ch.difficulty},`,
          `      pgn: \`${pgn}\`,`,
          '    },',
        ].join('\n')
      })
      .join('\n')
    const text = `${before}${old.slice(start, metaStart)}${meta}  chapters: [\n${chapters}\n  ],\n}\n`
    fs.writeFileSync(path.join(outDir, file), text)
  }
}

const SLAV_HEADER = `// Slav Defence course (you play Black). Pure data: the PGN strings are the lessons.
// You answer 1.d4 with 1...c6 and then ...d5 (the Slav is 1.d4 c6 2.c4 d5). Narrowed on 2026-10-16 (task O1):
// lines end by about move 8, one taught move per position. Reading guide for the PGN: the FIRST move at each
// of your turns is the one to learn; at White's turns every move listed is a reply we prepared for.
`

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
