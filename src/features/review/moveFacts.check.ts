// Quick self-check of the move facts used by the coach text:   npx tsx src/features/review/moveFacts.check.ts
import { Chess } from 'chess.js'
import type { AnalysedMove } from '../../types'
import { hungPiece } from './moveFacts'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures++
}

// The game ends with a blunder: 16... Qxa2+ and the king simply takes the queen. There is no reply after it.
const g = new Chess()
const moves = 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6 Bf4 Ngf6 O-O-O Be7 Ne4 Nxe4 Qxe4 Nf6 Qe2 Qd5 Kb1'
for (const m of moves.split(' ')) g.move(m)
const fenBefore = g.fen()
const last = g.move('Qxa2+')
const blunder = { ply: 32, san: 'Qxa2+', uci: 'd5a2', fenBefore, fenAfter: last.after, cpLoss: 600 } as unknown as AnalysedMove
const hung = hungPiece(blunder, undefined)
check('a queen left hanging on the very last move is found', hung?.piece === 'q', JSON.stringify(hung))
check('a small loss on the last move says nothing', hungPiece({ ...blunder, cpLoss: 50 }, undefined) === null)

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
