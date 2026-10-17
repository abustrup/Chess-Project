// Verifier: dumps each chapter's raw PGN text (no parsing here; python-chess parses it in v_courses.py).
// Run from the repo root: npx tsx research/2026-10-16-diagnosis/verify-openings/scripts/v_dump_pgn.ts OUT.json
import fs from 'node:fs'
import { OPENING_COURSES } from '../../../../src/data/openings/index.ts'
const out = OPENING_COURSES.map((c) => ({ id: c.id, side: c.side, chapters: c.chapters.map((ch) => ({ id: ch.id, title: ch.title, pgn: ch.pgn })) }))
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
for (const c of out) console.log(c.id, c.side, c.chapters.length)
