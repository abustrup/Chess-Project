// Prints the course and chapter ids and titles as JSON, for browser_check.mjs.
// Run from the repo root: npx tsx research/2026-10-16-diagnosis/openings-v2/scripts/titles.ts > titles.json
import { OPENING_COURSES } from '../../../../src/data/openings/index.ts'

console.log(JSON.stringify(OPENING_COURSES.map((c) => ({ id: c.id, side: c.side, chapters: c.chapters.map((ch) => ({ id: ch.id, title: ch.title })) }))))
