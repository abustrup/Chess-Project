// Turns one English sentence of teaching text into zero or more board claims a program can test.
// The grammar is deliberately small. Anything it is unsure about is marked so that the evaluator reports
// "could-not-parse", never a false claim.
import type { PieceType } from './board'

export type Owner = 'w' | 'b' | 'you' | 'opp' | 'poss' | 'own'

export interface MoveTok {
  raw: string
  /** SAN without move number, dots, check signs or !? marks */
  san: string
  num?: number
  /** written with "..." (a Black move) */
  black?: boolean
  /** the sentence says this move is (or would be) played, as opposed to naming it as a plan or a threat */
  anchor: boolean
}

export interface Ref {
  id: number
  raw: string
  kind: 'piece' | 'square' | 'pronoun' | 'color' | 'move' | 'nothing' | 'mover'
  type?: PieceType | 'any'
  owner?: Owner
  square?: string
  file?: string
  shade?: 'light' | 'dark'
  definite: boolean
  demonstrative?: boolean
  /** an explicit number ("two pawns", "both knights") */
  count?: number
  both?: boolean
  plural?: boolean
  adjs: string[]
  move?: MoveTok
  /** for pronouns: what "it" most likely points back to (nearest first); empty = the move just played */
  antecedents?: Ref[]
  pronounRole?: 'subject' | 'object'
}

/** what the text has been talking about so far (carried from sentence to sentence) */
export interface Discourse {
  /** the current topic: the last subject, already resolved */
  topic: Ref[]
  /** the topic before that one */
  oldTopic?: Ref[]
  /** pieces and moves named so far, in reading order */
  mentions: Ref[]
}

export type ClaimBody =
  | { kind: 'attacks'; subj: Ref; objs: Ref[]; neg: boolean }
  | { kind: 'aims'; subj: Ref; objs: Ref[] }
  | { kind: 'covers'; subj: Ref; objs: Ref[]; neg: boolean }
  | { kind: 'defends'; subj: Ref; objs: Ref[]; neg: boolean }
  | { kind: 'attack-count'; obj: Ref; n: number }
  | { kind: 'defend-count'; obj: Ref; n: number }
  | { kind: 'defended-only-by'; obj: Ref; by: Ref }
  | { kind: 'undefended'; obj: Ref }
  | { kind: 'defended'; obj: Ref }
  | { kind: 'attacked'; obj: Ref }
  | { kind: 'hanging'; obj: Ref }
  | { kind: 'safe'; obj: Ref }
  | { kind: 'pinned'; obj: Ref; by?: Ref; to?: Ref }
  | { kind: 'not-pinned'; obj: Ref }
  | { kind: 'trapped'; obj: Ref }
  | { kind: 'uncapturable'; obj: Ref; by?: Ref }
  | { kind: 'check'; by?: Ref; discovered?: boolean; double?: boolean }
  | { kind: 'mate'; named?: boolean }
  | { kind: 'mate-in'; n: number }
  | { kind: 'fork'; subj?: Ref; objs: Ref[] }
  | { kind: 'captures'; subj?: Ref; obj: Ref; free?: boolean; win?: boolean }
  | { kind: 'material-up'; side: Owner; amount: number; atLeast?: boolean }
  | { kind: 'material-won'; side: Owner; amount: number; subjMove?: MoveTok; back?: boolean }

export interface ClauseFlags {
  /** conditional, modal, future or plan: describes a position we do not have unless moves pin it down */
  hypothetical: boolean
  /** the clause depends on moves described in words ("if Black takes", "the knight would jump to e5") */
  unspecifiedMoves: boolean
  imperative: boolean
  question: boolean
  advice: boolean
  past: boolean
  hedged: boolean
}

export interface ParsedClaim {
  body: ClaimBody
  /** the clause the claim was read from (normalised text) */
  clause: string
  flags: ClauseFlags
  /** moves the sentence says are played, up to and including this clause, in order */
  moves: MoveTok[]
  /** a claim inferred from an adjective inside a noun phrase ("the loose knight") */
  embedded?: boolean
}

export interface SentenceParse {
  sentence: string
  /** every reference in the sentence, and their ids in reading order (for pronouns in later sentences) */
  refs: Ref[]
  order: number[]
  claims: ParsedClaim[]
  /** claim-like words were found but no claim could be read */
  unparsed: { clause: string; keyword: string; reason: string }[]
  /** some clause talks about a position after moves that are not written out */
  hypotheticalUnspecified: boolean
  /** topic and mentions after this sentence, to pass to the next one */
  discourse: Discourse
}

/** stands for "the move just played" in instructions such as "Pin the knight." written under that move */
export const MOVER: Ref = { id: -1, raw: '(the move)', kind: 'mover', definite: true, adjs: [] }

/* ------------------------------------------------------------------------------------------------ */
/* lexicon                                                                                           */

const PIECE_WORD: Record<string, PieceType | 'any'> = { king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p', piece: 'any' }
const PIECE_VALUE_WORD: Record<string, number> = {
  pawn: 1, pawns: 1, knight: 3, knights: 3, bishop: 3, bishops: 3, piece: 3, pieces: 3, rook: 5, rooks: 5, exchange: 2, queen: 9, queens: 9,
}
const NUM_WORD: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, both: 2 }
const COUNT_WORD: Record<string, number> = { once: 1, twice: 2, 'two times': 2, 'three times': 3, thrice: 3 }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const alt = (xs: string[]) => xs.slice().sort((a, b) => b.length - a.length).map(esc).join('|')
const DETS = ['the', 'a', 'an', 'that', 'this', 'both', 'another', 'no', 'one', 'two', 'three', 'each', 'any', 'every', 'either']
const OWNERS = [
  "white's own", "black's own", 'your own', 'its own', 'his own', 'her own', 'their own', 'your', 'my', 'his', 'her', 'its', 'their',
  "white's", "black's", 'white', 'black', 'enemy', "opponent's", 'opposing', 'own',
]
const ADJS = [
  'light-squared', 'dark-squared', 'loose', 'unprotected', 'undefended', 'unguarded', 'pinned', 'trapped', 'hanging', 'lone', 'last',
  'extra', 'new', 'whole', 'only', 'same', 'other', 'attacking', 'defending', 'advanced', 'central', 'isolated', 'passed', 'doubled',
  'backward', 'poor', 'bad', 'good', 'strong', 'active', 'forked', 'little', 'big', 'second', 'first', 'free', 'attacked',
  'protected', 'defended', 'guarded', 'queenside', 'kingside', 'useful', 'annoying', 'dangerous', 'powerful', 'proud', 'precious',
  'remaining', 'lonely', 'single', 'entire', 'clean', 'helpless', 'stuck', 'royal', 'black-squared', 'white-squared',
  'fianchettoed', 'developed', 'undeveloped', 'retreating', 'centralised', 'centralized', 'g7', 'h-', 'enemy', 'black', 'white',
]
const NOUN_COMPOUND =
  "(?!'s|s'|-side|\\s+side|\\s+(?:chain|chains|structure|structures|break|breaks|majority|storm|islands?|grab|grabs|sacrifice|sacrifices|centre|center|endgame|endgames|ending|endings|up|down|pair|race|shield|wall|formation|set-up|setup|lever|tension|trade|swap|exchange|march|walk|hunt|safety|position|positions|game|games|count|value|values|tour|route|manoeuvre|maneuver|outpost|jump|fork|trap|square|squares|file|files|play|cover|promotion|move|moves\\s+(?:are|is|that|like|such)|count|capture|captures\\s+(?:are|is))\\b)"

const NP_RE = new RegExp(
  `\\b((?:(?:${alt(DETS)})\\s+)?(?:(?:${alt(OWNERS)})\\s+)?(?:(?:${alt(ADJS)})\\s+)*)(?:([a-h][1-8])[- ](king|queen|rook|bishop|knight|pawn)(s?)\\b|([a-h])-(pawn)(s?)\\b|(king|queen|rook|bishop|knight|pawn|piece)(s?)\\b${NOUN_COMPOUND}(?:\\s+(?:on|from)\\s+([a-h][1-8])\\b)?)`,
  'g',
)

const SAN_RE =
  /(?<![\w\-⟦])((\d+)\.(\.\.)?\s?|\.\.\.)?(O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h]x[a-h][1-8](?:=[QRBN])?|[a-h][1-8](?:=[QRBN])?)([+#]?)([!?]{0,2})(?![\w\-])/g

// "can't" / "cannot" describe the position as it is ("the knight can't move"), so they are not on this list
const MODAL = new Set(['would', 'could', 'might', 'can', 'will', "won't", 'should', 'shall', 'may', "wouldn't", "couldn't", "shouldn't", 'must', 'needs', 'need'])
const CONDITIONAL_OPENERS = ['if', 'when', 'whenever', 'once', 'after', 'before', 'unless', 'until', 'as soon as', 'in case', 'otherwise', 'even if', 'as long as']
const FUTURE_WORDS = new Set(['next', 'later', 'soon', 'eventually', 'tomorrow', 'then'])
const PLAN_VERBS =
  /\b(threaten|threatens|threatening|threat|threats|wants?|tries|try|trying|plans?|planning|prepares?|preparing|hopes?|hoping|aims? to|ready|going to|about to|threatens? to|threatening to|intends?|intending|means to|so that|in order|idea|allows?|allowing|lets?|letting|stops?|stopping|prevents?|preventing|avoids?|avoiding|helps? to|forces?|forcing|chasing|chases?|continues?|continuing|follows? up|following up|heads?|heading|on its way|en route|aims? for|looking to|keen to|free to)\b/
const MOTION =
  /\b(jumps?|jumping|goes|go|going|moves?|moving|comes?|coming|steps?|stepping|retreats?|retreating|lands?|landing|swings?|takes?|taking|captures?|capturing|recaptures?|recapturing|castles?|castling|pushes|push|plays?|playing|answers?|replies|reply|grabs?|grabbing|swaps?|trades?|exchanges?|blocks?|blocking|runs?|escapes?|drops?|lifts?|slides?|switches|transfers?)\b/
const HEDGE = /\b(almost|nearly|probably|usually|often|sometimes|typically|normally|seems?|appears?|looks? (?:loose|weak|safe|strong|like|dangerous)|kind of|sort of|mostly|maybe|perhaps|in effect|really|in a way|practically|basically|virtually|more or less|in many lines|in most lines)\b/
const ADVICE = /\b(do not|don't|never|avoid|instead of|rather than|make sure|remember|watch out|be careful|beware|look for|look at|find|always|check whether|check that|check if|ask yourself|count|notice|note that|think about|imagine|see if|try to|try)\b/
const QUESTION_START = /^(what|which|where|who|whom|how|why|is|are|can|could|does|do|did|was|were|will|would|should|has|have)\b/
const PAST = /\b(was|were|had|used to)\b/

const IMPERATIVE_VERBS = new Set([
  'attack', 'hit', 'pin', 'protect', 'defend', 'guard', 'support', 'fork', 'trap', 'take', 'capture', 'win', 'grab', 'develop', 'add',
  'kick', 'chase', 'challenge', 'keep', 'put', 'bring', 'move', 'play', 'castle', 'trade', 'swap', 'retreat', 'block', 'break', 'open',
  'push', 'prepare', 'finish', 'get', 'give', 'answer', 'meet', 'stop', 'use', 'start', 'strike', 'step', 'jump', 'go', 'offer',
  'cover', 'control', 'save', 'press', 'help', 'make', 'unpin', 'recapture', 'exchange', 'gain', 'hold', 'free', 'connect', 'complete',
  'claim', 'centralise', 'centralize', 'activate', 'lock', 'fix', 'secure', 'tuck', 're-route', 'reroute', 'double', 'aim', 'eye',
  'target', 'punish', 'simplify', 'deal', 'ignore', 'invite', 'provoke', 'reinforce', 'return', 'remove', 'build', 'clear', 'leave',
  'let', 'look', 'set', 'tempt', 'drop', 'lift', 'slide', 'swing', 'switch', 'transfer', 'run', 'escape', 'grab', 'calm', 'wait',
])

const MOVE_VERBS_BEFORE_WITH = /\b(blocks?|answers?|replies|reply|meets?|takes?|take|recaptures?|captures?|plays?|play|tries|try|defends?|covers?|interposes?|responds?)\b/
const PLAN_WORDS_BEFORE_MOVE =
  /\b(before|for|prepares?|preparing|prepare|ready|plan|plans|threatens?|threat|threats|threatening|stop|stops|stopping|prevent|prevents|against|like|than|of|idea|ideas|allow|allows|allowing|avoid|avoids|later|next|soon|push|break|such as|e\.g\.|or|example|instead|follow|follows|continue|continues|wants?|hoping|hope|hopes|intending|aiming|aim|aims|heading|heads|on|about)\s*$/

/* ------------------------------------------------------------------------------------------------ */

function ownerOf(prefix: string, plural: boolean) {
  const joined = ' ' + prefix.trim().split(/\s+/).filter(Boolean).join(' ') + ' '
  let owner: Owner | undefined
  if (/ (white's|white) /.test(joined)) owner = 'w'
  if (/ (black's|black) /.test(joined)) owner = 'b'
  if (/ (your|my) /.test(joined)) owner = 'you'
  if (/ (enemy|opponent's|opposing) /.test(joined)) owner = 'opp'
  if (!owner && / (his|her|its|their) /.test(joined)) owner = 'poss'
  if (/ own /.test(joined) && (!owner || owner === 'poss')) owner = 'own'
  const words = joined.trim().split(' ')
  const demonstrative = words.includes('that') || words.includes('this')
  const definite = words.some((w) => ['the', 'that', 'this', 'your', 'my', 'his', 'her', 'its', 'their', "white's", "black's"].includes(w))
  const neg = words[0] === 'no'
  let count: number | undefined
  for (const w of words) if (w in NUM_WORD && w !== 'a' && w !== 'an' && w !== 'both') count = NUM_WORD[w]
  const both = plural && words.includes('both')
  if (both) count = 2
  return { owner, demonstrative, definite, count: count && (plural || count > 1) ? count : undefined, both, neg, plural }
}

const ADJ_CLAIMS = ['loose', 'unprotected', 'undefended', 'unguarded', 'pinned', 'trapped', 'hanging']

export interface Prepared {
  text: string // lowercased text with ⟦k⟧ placeholders
  refs: Ref[]
  moves: MoveTok[]
  /** reference ids in reading order */
  order: number[]
}

/** Replace moves, material phrases, noun phrases, squares and pronouns by placeholders. */
export function prepare(sentence: string): Prepared {
  const refs: Ref[] = []
  const moves: MoveTok[] = []
  let id = 0
  const put = (r: Omit<Ref, 'id'>) => {
    const ref = { ...r, id: id++ } as Ref
    refs.push(ref)
    return `⟦${ref.id}⟧`
  }
  let s = sentence.replace(/\(/g, ', ').replace(/\)/g, ' ,').replace(/—|–/g, ', ').replace(/"/g, '')
  // opening names are names, not claims: "the Caro-Kann Two Knights Attack" says nothing about knights attacking
  // (capitalised words ending in Attack / Defence / Variation / Gambit / System, never at the start of the sentence)
  s = s.replace(/(?<=\S)(\s+)(?:[A-Z][\w'’-]*\s+)+(?:Attack|Defen[cs]e|Variation|Gambit|System)\b/g, '$1OPENINGNAME')
  // diagonals / ranges such as "a2-g8" or "d4-d5" are not squares on their own
  // "after d4-d5": a move in long notation; "the a2-g8 diagonal": a range, not squares
  s = s.replace(/\b([a-h][1-8])-([a-h][1-8])\b/g, (full: string, a: string, b2: string, offset: number, whole: string) =>
    /\b(after|plays?|push|pushes|with|then|by)\s+$/i.test(whole.slice(Math.max(0, offset - 10), offset)) ? `LONGMOVE_${a}${b2}` : 'RANGE',
  )
  let lastMoveEnd = -10
  let lastAnchor = false
  s = s.replace(SAN_RE, (full: string, pre: string | undefined, num: string | undefined, dots3: string | undefined, core: string, chk: string, ann: string, offset: number, whole: string) => {
    const hasPrefix = Boolean(pre)
    const isPieceMove = /^[KQRBNO]/.test(core)
    // a bare "e5" is a square unless something marks it as a move
    const namedAsMove = /\b(move|moves|push|pushes|pushing|playing|plays)\s+$/i.test(whole.slice(Math.max(0, offset - 12), offset))
    if (!hasPrefix && !isPieceMove && !core.includes('x') && !core.includes('=') && !chk && !ann && !namedAsMove) return full
    // is the move said to be played, or only named (as a plan, a threat, an idea)?
    const before = whole.slice(0, offset).toLowerCase()
    const clauseBefore = before.split(/[;:.!?]|,(?=\s*(?:and|but|so|while|because|which|then)\b)/).pop() ?? ''
    const sinceComma = before.split(/[,;:.!?]/).pop() ?? ''
    const gap = whole.slice(lastMoveEnd, offset)
    let anchor: boolean
    if (lastMoveEnd >= 0 && /^[\s,]*$/.test(gap) && offset - lastMoveEnd < 6) anchor = lastAnchor
    else if (/^\s*((and|but|so|then|now|here|also|after that|and then|this time|instead)\s+)*((the\s+)?(pawn\s+)?move\s+)?$/.test(sinceComma)) anchor = true
    else if (/\b(forces?|forcing)\s*$/.test(before)) anchor = true
    else if (PLAN_WORDS_BEFORE_MOVE.test(before.trimEnd())) anchor = false
    else if (/^[+#!?]*\s+(is|gives|wins|takes|checks|forks|pins|attacks|mates|captures|traps|hits|protects|guards|defends|uncovers|opens|leaves|lands|forces|drives|blocks)\b/.test(whole.slice(offset + full.length))) anchor = true
    else if (/\b(if|after|once|when|whenever|unless|as soon as)\b/.test(clauseBefore)) anchor = true
    else if (/\bwith\s*$/.test(before) && MOVE_VERBS_BEFORE_WITH.test(sinceComma)) anchor = true
    else if (/\b(plays?|answers?|replies|tries|meets it with|answer)\s*$/.test(before)) anchor = true
    else if (/\b(is|are|was)\s+(?:\w+\s+)?$/.test(sinceComma)) anchor = false
    else anchor = false
    const mv: MoveTok = { raw: full, san: core, num: num ? Number(num) : undefined, black: Boolean(dots3) || (pre ?? '').startsWith('...'), anchor }
    lastMoveEnd = offset + full.length
    lastAnchor = anchor
    moves.push(mv)
    return ` ${put({ raw: full, kind: 'move', move: mv, definite: true, adjs: [] })} `
  })
  s = s.replace(/LONGMOVE_([a-h][1-8][a-h][1-8])/g, (full: string, uci: string) => {
    const mv: MoveTok = { raw: `${uci.slice(0, 2)}-${uci.slice(2)}`, san: uci, anchor: true }
    moves.push(mv)
    return ` ${put({ raw: mv.raw, kind: 'move', move: mv, definite: true, adjs: [] })} `
  })
  s = s.toLowerCase()
  // material phrases first, so their piece words are not read as pieces on the board
  const UNIT = '(pawns?|pieces?|knights?|bishops?|rooks?|queens?|exchange)'
  const SUBJ = '(⟦\\d+⟧|\\bwhite\\b|\\bblack\\b|\\byou\\b)'
  const amountOf = (n: string | undefined, unit: string) => (NUM_WORD[n ?? 'a'] ?? 1) * (PIECE_VALUE_WORD[unit] ?? 0)
  s = s.replace(
    new RegExp(
      `${SUBJ}\\s+((?:(?:is|are|stay|stays|remain|remains|be|now|still|already|simply|keep|keeps|clearly|then)\\s+)*)(a|an|one|two|three|four)?\\s*(?:(?:clean|whole|solid|full|healthy|safe|good|sound|real)\\s+)?${UNIT}\\s+up(?:\\s+for\\s+(a|an|one|two|three)\\s+(?:clean\\s+)?${UNIT})?\\b`,
      'g',
    ),
    (_f: string, subj: string, _aux: string, n: string | undefined, unit: string, n2: string | undefined, unit2: string | undefined) =>
      `${subj} matup_${amountOf(n, unit) - (unit2 ? amountOf(n2, unit2) : 0)}`,
  )
  s = s.replace(new RegExp(`${SUBJ}\\s+(?:now\\s+|still\\s+)?(?:has|have|keep|keeps)\\s+(an|two)\\s+extra\\s+${UNIT}\\b`, 'g'), (_f: string, subj: string, n: string, unit: string) => `${subj} matextra_${amountOf(n, unit)}`)
  s = s.replace(
    new RegExp(
      `${SUBJ}\\s+((?:(?:has|have|now|already|simply|just|then|still|also)\\s+)*)(?:won|wins|win)\\s+(back\\s+)?(?:(?:a|an|the|one|two|whole|clean|your|his|her|its|their|black's|white's|that|this|another)\\s+)*${UNIT}(?:\\s+(?:and|plus)\\s+(?:a|an|the|one|two)\\s+${UNIT})?(?:\\s+for\\s+(a|an|one|two|your|his|her|the|its|black's|white's)\\s+${UNIT})?(?:\\s+for\\s+free)?`,
      'g',
    ),
    (full: string, subj: string, _aux: string, back: string | undefined, unit: string, unit2: string | undefined, n3: string | undefined, unit3: string | undefined, offset: number, whole: string) => {
      const a = amountOf('a', unit) + (unit2 ? amountOf('a', unit2) : 0) - (unit3 ? amountOf(n3 && n3 in NUM_WORD ? n3 : 'a', unit3) : 0)
      const isBack = Boolean(back) || /^\s+back\b/.test(whole.slice(offset + full.length))
      return `${subj} matwon${isBack ? 'back' : ''}_${a}`
    },
  )
  s = s.replace(/\b(the )?([a-h][1-8]) and ([a-h][1-8]) squares\b/g, '$2 and $3')
  s = s.replace(/\bthe ([a-h][1-8])[- ]square\b/g, '$1')
  s = s.replace(NP_RE, (full: string, prefix: string, sqA, pieceA, plA, fileB, pieceB, plB, pieceC, plC, sqC) => {
    const word = (pieceA ?? pieceB ?? pieceC) as string
    const plural = Boolean(plA || plB || plC)
    const info = ownerOf(prefix ?? '', plural)
    const adjs = (prefix ?? '').split(/\s+/).filter((w: string) => ADJ_CLAIMS.includes(w) || w === 'free')
    let shade: 'light' | 'dark' | undefined
    if (/\b(light-squared|white-squared)\b/.test(prefix ?? '')) shade = 'light'
    if (/\b(dark-squared|black-squared)\b/.test(prefix ?? '')) shade = 'dark'
    if (info.neg) return ` ${put({ raw: full.trim(), kind: 'nothing', type: PIECE_WORD[word], owner: info.owner, definite: false, adjs: [] })} `
    const lead = /^(both)\s+/.exec(prefix ?? '')
    return `${lead && !plural ? ' both' : ''} ${put({
      raw: full.trim(),
      kind: 'piece',
      type: PIECE_WORD[word],
      owner: info.owner,
      square: sqA ?? sqC,
      file: fileB,
      shade,
      definite: info.definite || Boolean(sqA ?? sqC),
      demonstrative: info.demonstrative,
      count: info.count,
      both: info.both,
      plural,
      adjs,
    })} `
  })
  s = s.replace(/\b(nothing|no piece|nobody|no one)\b/g, () => ` ${put({ raw: 'nothing', kind: 'nothing', type: 'any', definite: false, adjs: [] })} `)
  s = s.replace(/\b([a-h][1-8])\b/g, (full: string, sq: string) => ` ${put({ raw: full, kind: 'square', square: sq, definite: true, adjs: [] })} `)
  s = s.replace(/\b(it|she|her|him|itself)\b/g, (full: string) => ` ${put({ raw: full, kind: 'pronoun', definite: true, adjs: [] })} `)
  s = s.replace(/\b(white|black|you|your opponent|the opponent|your opponent's)\b(?!'s)/g, (full: string) => {
    const owner: Owner = full === 'white' ? 'w' : full === 'black' ? 'b' : full === 'you' ? 'you' : 'opp'
    return ` ${put({ raw: full, kind: 'color', owner, definite: true, adjs: [] })} `
  })
  s = s.replace(/\s+/g, ' ').trim()
  const order = Array.from(s.matchAll(/⟦(\d+)⟧/g)).map((m) => Number(m[1]))
  return { text: s, refs, moves, order }
}

/* ------------------------------------------------------------------------------------------------ */

interface Tok {
  w: string
  ref?: Ref
  move?: MoveTok
}

interface Clause {
  toks: Tok[]
  text: string
  connector: string
  conditional: boolean
}

function tokenize(text: string, refs: Ref[]): Tok[] {
  const out: Tok[] = []
  for (const raw of text.split(' ')) {
    if (!raw) continue
    const m = /^⟦(\d+)⟧$/.exec(raw)
    if (m) {
      const ref = refs[Number(m[1])]
      out.push({ w: raw, ref, move: ref.kind === 'move' ? ref.move : undefined })
      continue
    }
    const pm = /^(.*?)([.,;:!?]+)$/.exec(raw)
    if (pm && pm[1]) {
      out.push(...tokenize(pm[1], refs))
      out.push({ w: pm[2] })
    } else out.push({ w: raw })
  }
  return out
}

const SPLIT_AFTER_COMMA = new Set(['but', 'so', 'because', 'while', 'whereas', 'since', 'although', 'though', 'yet', 'and', 'or', 'which', 'where', 'as', 'then', 'unless', 'if', 'when', 'once', 'after', 'before', 'until'])
const SPLIT_WORDS = new Set(['but', 'so', 'because', 'while', 'unless', 'although', 'whereas', 'before', 'until', 'if', 'once', 'when', 'after'])
const startsConditional = (text: string) => {
  const first = text.replace(/^(and|but|so|then|now|here|even)\s+/, '')
  return CONDITIONAL_OPENERS.some((o) => first === o || first.startsWith(o + ' '))
}

const COORD_VERBS = new Set([
  'attacks', 'hits', 'protects', 'guards', 'defends', 'supports', 'pins', 'prepares', 'heads', 'gets', 'keeps', 'opens', 'frees',
  'develops', 'makes', 'stops', 'prevents', 'allows', 'eyes', 'looks', 'aims', 'hopes', 'wants', 'goes', 'comes', 'lands', 'steps',
  'retreats', 'plans', 'threatens', 'controls', 'covers', 'wins', 'takes', 'gives', 'checks', 'forks', 'traps', 'leaves', 'blocks',
  'unpins', 'removes', 'adds', 'brings', 'puts', 'cuts', 'holds', 'watches', 'challenges', 'kicks', 'chases', 'offers', 'is', 'has',
  'can', 'will', 'would', 'may', 'might', 'attack', 'hit', 'protect', 'guard', 'defend', 'support', 'pin', 'prepare', 'keep', 'open',
  'free', 'develop', 'make', 'stop', 'prevent', 'allow', 'aim', 'go', 'come', 'step', 'retreat', 'plan', 'threaten', 'control', 'cover',
  'win', 'take', 'give', 'fork', 'trap', 'leave', 'block', 'unpin', 'remove', 'add', 'bring', 'put', 'hold', 'watch', 'challenge',
  'kick', 'chase', 'offer', 'castle', 'get', 'gain', 'finish', 'start', 'trade', 'swap', 'push', 'grabs', 'grab', 'captures', 'capture',
  'loses', 'drops', 'falls', 'cannot', "can't", 'needs', 'must', 'should', 'ends', 'sits', 'stands', 'stays', 'uncovers', 'creates',
  'helps', 'joins', 'follows', 'reaches', 'moves', 'jumps', 'swings', 'slides', 'escapes', 'saves', 'secures', 'tucks', 'connects',
])

function splitClauses(toks: Tok[]): Clause[] {
  const clauses: Clause[] = []
  let cur: Tok[] = []
  let connector = ''
  const flush = (next: string) => {
    if (cur.length) {
      const text = cur.map((t) => t.w).join(' ')
      clauses.push({ toks: cur, text, connector, conditional: startsConditional(text) })
    }
    cur = []
    connector = next
  }
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]
    if (t.w === ';' || t.w === ':' || t.w === '.' || t.w === '!' || t.w === '?') {
      flush(t.w)
      continue
    }
    if (t.w === ',') {
      const nx = toks[i + 1]?.w
      if (nx && SPLIT_AFTER_COMMA.has(nx)) {
        flush(nx)
        // keep the word when it carries meaning for the next clause
        if (!['which', 'where', 'if', 'when', 'once', 'after', 'before', 'until', 'unless'].includes(nx)) i++
        continue
      }
      // ", the bishop on f4 covers b8": a new subject after a comma starts a new clause
      if (toks[i + 1]?.ref && toks[i + 1].ref!.kind !== 'square' && cur.length >= 2) {
        let n = i + 2
        while (n < toks.length && ADVERBS.has(toks[n].w)) n++
        if (COORD_VERBS.has(toks[n]?.w ?? '')) {
          flush(',')
          continue
        }
      }
      // a bare comma after a conditional opener ends the condition
      if (startsConditional(cur.map((x) => x.w).join(' '))) {
        flush(',')
        continue
      }
      cur.push(t)
      continue
    }
    const prevW = cur[cur.length - 1]?.w
    const nextW = toks[i + 1]?.w
    // "The knight guards d5 and heads for the centre": two predicates, each judged on its own
    if (t.w === 'and' && cur.length >= 2) {
      let k = i + 1
      while (k < toks.length && ADVERBS.has(toks[k].w)) k++
      if (COORD_VERBS.has(toks[k]?.w ?? '')) {
        flush('and')
        continue
      }
      // "... and it attacks the knight": a new subject starts a new clause
      if (toks[k]?.ref && toks[k].ref!.kind !== 'square') {
        let n = k + 1
        while (n < toks.length && ADVERBS.has(toks[n].w)) n++
        if (COORD_VERBS.has(toks[n]?.w ?? '')) {
          flush('and')
          continue
        }
      }
    }
    if (
      SPLIT_WORDS.has(t.w) &&
      cur.length &&
      !(t.w === 'so' && nextW === 'that') &&
      !(t.w === 'once' && (prevW === 'at' || nextW === 'more' || nextW === 'again')) &&
      !((t.w === 'after' || t.w === 'before') && (prevW === 'right' || prevW === 'soon' || prevW === 'just' || prevW === 'the' || nextW === ','))
    ) {
      const keep = ['before', 'until', 'if', 'once', 'when', 'after', 'unless'].includes(t.w)
      flush(t.w)
      if (keep) cur.push(t)
      continue
    }
    cur.push(t)
  }
  flush('')
  return clauses
}

/* ------------------------------------------------------------------------------------------------ */

const ADVERBS = new Set([
  'also', 'now', 'still', 'then', 'immediately', 'directly', 'already', 'simply', 'just', 'only', 'even', 'again', 'really', 'suddenly',
  'right', 'actually', 'clearly', 'here', 'there', 'too', 'first', 'finally', 'instantly', 'easily', 'well', 'quietly', 'nicely',
  'straight', 'all', 'at', 'once',
])
const isRef = (t: Tok | undefined) => Boolean(t?.ref)
const NONFINITE_BEFORE = new Set(['to', 'from', 'of', 'without', 'by', 'for', 'about', 'after', 'before', 'at', 'in', 'on', 'while', 'way', 'chance', 'stop', 'stops'])

const ATTACK_VERBS: Record<string, 'attack' | 'fork' | 'threaten'> = {
  attacks: 'attack', attack: 'attack', attacking: 'attack', hits: 'attack', hit: 'attack', hitting: 'attack', threatens: 'threaten',
  threaten: 'threaten', threatening: 'threaten', forks: 'fork', fork: 'fork', forking: 'fork', targets: 'attack', targeting: 'attack',
}
const CONTROL_VERBS = new Set(['covers', 'cover', 'covering', 'controls', 'control', 'controlling'])
const AIM_VERBS = new Set(['eyes', 'eyeing', 'x-rays'])
const DEFEND_VERBS = new Set(['protects', 'protect', 'protecting', 'defends', 'defend', 'defending', 'guards', 'guard', 'guarding', 'supports', 'support', 'supporting'])
const PIN_VERBS = new Set(['pins', 'pin', 'pinning'])
const TAKE_VERBS = new Set(['takes', 'take', 'taking', 'captures', 'capture', 'capturing', 'grabs', 'grab', 'grabbing', 'wins', 'win', 'winning'])
const PARTICIPLES: Record<string, string> = {
  attacked: 'attack', hit: 'attack', threatened: 'attack', forked: 'fork', protected: 'defend', defended: 'defend', guarded: 'defend',
  supported: 'defend', pinned: 'pin', trapped: 'trapped', covered: 'control',
}
const BE = new Set(['is', 'are', "isn't", "aren't", 'gets', 'get', 'stays', 'stay', 'remains', 'remain', 'becomes', 'become'])
const BASE_FORMS = new Set(['attack', 'hit', 'threaten', 'fork', 'target', 'cover', 'control', 'protect', 'defend', 'guard', 'support', 'pin', 'take', 'capture', 'grab', 'win', 'check'])

const PREDICATE_START = new Set([
  'covers', 'controls', 'attacks', 'guards', 'protects', 'defends', 'is', 'are', 'has', 'have', 'gives', 'takes', 'can', 'cannot',
  "can't", 'must', 'blocks', 'stands', 'sits', 'goes', 'moves', 'jumps', 'checks', 'pins', 'wins', 'hits', 'comes', 'steps', 'would',
  'will', 'lands', 'looks', 'points', 'aims', 'eyes', 'supports', 'stays', 'keeps', 'needs', 'should', 'may', 'might', 'could',
  'cuts', 'takes', 'traps', 'forks', 'threatens', 'leaves', 'does', "doesn't", 'still', 'also', 'now', 'then', 'only', 'was',
])

/** Collect a list of references starting at index i: "X, Y and Z", "both X and Y", "X as well as Y". */
function refList(toks: Tok[], i: number): { refs: Ref[]; end: number } {
  const refs: Ref[] = []
  let j = i
  const skippable = (w: string) => ['both', 'also', 'and', ',', 'as', 'well', 'plus', 'either', 'directly', 'again', 'now', 'too'].includes(w)
  while (j < toks.length) {
    const t = toks[j]
    if (t.ref && t.ref.kind !== 'color') {
      // "attacks the king and the queen covers g7": a new subject, not a second target
      if (refs.length && (PREDICATE_START.has(toks[j + 1]?.w ?? '') || COORD_VERBS.has(toks[j + 1]?.w ?? ''))) break
      if (refs.length && t.ref.kind === 'pronoun' && toks[j - 1]?.w === ',') break
      refs.push(t.ref)
      j++
      continue
    }
    if (skippable(t.w)) {
      if ((t.w === 'and' || t.w === ',') && toks[j + 1] && !isRef(toks[j + 1]) && !['also', 'both', 'as'].includes(toks[j + 1].w)) break
      j++
      continue
    }
    break
  }
  return { refs, end: j }
}

/** Subject of the predicate whose verb is at index v. */
function subjectBefore(toks: Tok[], v: number, clauseSubject: Ref | undefined): Ref | undefined {
  let j = v - 1
  while (j >= 0 && (ADVERBS.has(toks[j].w) || ['does', 'do', 'not', "doesn't", 'no', 'longer', 'never', 'is', 'are', 'was', 'were', "isn't", "aren't"].includes(toks[j].w))) j--
  if (j >= 0 && toks[j].ref) return toks[j].ref
  if (j >= 0 && (toks[j].w === 'that' || toks[j].w === 'which' || toks[j].w === 'who')) {
    let k = j - 1
    while (k >= 0 && toks[k].w === ',') k--
    if (k >= 0 && toks[k].ref) return toks[k].ref
  }
  return clauseSubject
}

function negatedBefore(toks: Tok[], v: number): boolean {
  const win = toks.slice(Math.max(0, v - 4), v).map((t) => t.w).join(' ')
  return /(\bnot\b|n't\b|\bno longer\b|\bnever\b)/.test(win)
}

/** true when the verb at index v is not a finite claim ("to attack", "from guarding", "a way to hit") */
function nonFinite(toks: Tok[], v: number): boolean {
  let j = v - 1
  while (j >= 0 && ADVERBS.has(toks[j].w)) j--
  // a gerund opening the clause is a noun ("taking the rook allows ...")
  if (j < 0 && /ing$/.test(toks[v].w)) return true
  const prev = toks[j]?.w ?? ''
  if (NONFINITE_BEFORE.has(prev)) return true
  // base form after a plural or "you" subject is fine; after a modal it is caught as hypothetical
  if (BASE_FORMS.has(toks[v].w) && j >= 0 && toks[j].ref && toks[j].ref!.kind !== 'color' && !(toks[j].ref!.count && toks[j].ref!.count! > 1)) return true
  return false
}

/** "X is attacked twice, by Y and Z", "X is protected only by Y", "X is pinned to Y by Z": participle at index j */
function passive(toks: Tok[], j: number, subj: Ref, neg: boolean, v: number, add: (b: ClaimBody) => void) {
  if (subj.kind !== 'piece' && subj.kind !== 'pronoun' && subj.kind !== 'square') return
  const what = PARTICIPLES[toks[j].w]
  let k = j + 1
  let count: number | undefined
  const w1 = toks[k]?.w ?? ''
  const two = `${w1} ${toks[k + 1]?.w ?? ''}`
  if (w1 in COUNT_WORD && !['more', 'again'].includes(toks[k + 1]?.w ?? '')) {
    count = COUNT_WORD[w1]
    k++
  } else if (two in COUNT_WORD && !['more', 'again'].includes(toks[k + 2]?.w ?? '')) {
    count = COUNT_WORD[two]
    k += 2
  }
  while (toks[k]?.w === ',') k++
  let only = false
  if (toks[k]?.w === 'only') {
    only = true
    k++
  }
  if (toks.slice(Math.max(0, v - 2), j).some((t) => t.w === 'only')) only = true
  let agents: Ref[] = []
  let to: Ref | undefined
  if (toks[k]?.w === 'by') {
    const rl = refList(toks, k + 1)
    agents = rl.refs.filter((r) => r.kind !== 'move' && r.kind !== 'square' && r.kind !== 'nothing')
    k = rl.end
  }
  if ((toks[k]?.w === 'to' || toks[k]?.w === 'against') && toks[k + 1]?.ref) {
    to = toks[k + 1].ref
    k += 2
    if (toks[k]?.w === 'by' && toks[k + 1]?.ref) agents = [toks[k + 1].ref!]
  }
  if (what === 'attack') {
    if (neg) return
    if (count !== undefined) add({ kind: 'attack-count', obj: subj, n: count })
    for (const a of agents) add({ kind: 'attacks', subj: a, objs: [subj], neg: false })
    if (count === undefined && !agents.length) add({ kind: 'attacked', obj: subj })
  } else if (what === 'defend') {
    if (neg && !agents.length) {
      add({ kind: 'undefended', obj: subj })
      return
    }
    if (count !== undefined) add({ kind: 'defend-count', obj: subj, n: count })
    if (only && agents.length === 1) add({ kind: 'defended-only-by', obj: subj, by: agents[0] })
    else for (const a of agents) add({ kind: 'defends', subj: a, objs: [subj], neg })
    if (count === undefined && !agents.length && !neg) add({ kind: 'defended', obj: subj })
  } else if (what === 'pin') {
    if (neg) add({ kind: 'not-pinned', obj: subj })
    else add({ kind: 'pinned', obj: subj, by: agents[0], to })
  } else if (what === 'trapped') {
    if (neg) return
    add({ kind: 'trapped', obj: subj })
  }
}

const KEYWORDS =
  /\b(attack\w*|hits?|threat\w*|pin|pins|pinned|pinning|hang\w*|undefended|unprotected|unguarded|loose|free|checks?|checkmate|mate|protect\w*|defend\w*|guard\w*|trapped|forks?|wins?|won|supports?|covers?|controls?|safe|en prise)\b/

/* ------------------------------------------------------------------------------------------------ */

export function parseSentence(sentence: string, opts: { afterHypothetical?: boolean; narrative?: boolean; discourse?: Discourse } = {}): SentenceParse {
  const disc: Discourse = opts.discourse ?? { topic: [], mentions: [] }
  const concrete = (r: Ref) => r.kind === 'piece' || r.kind === 'move'
  const resolvePronoun = (r: Ref): Ref[] => (r.kind === 'pronoun' ? (r.antecedents ?? []) : concrete(r) ? [r] : [])
  const prep = prepare(sentence)
  const toks = tokenize(prep.text, prep.refs)
  const clauses = splitClauses(toks)
  const out: SentenceParse = { sentence, refs: prep.refs, order: prep.order, claims: [], unparsed: [], hypotheticalUnspecified: false, discourse: disc }
  // "If the knight jumps away, the rook gives check. That is a discovered check.": the label inherits the "if"
  const labelOfPrevious =
    Boolean(opts.afterHypothetical) &&
    !opts.narrative &&
    (/^(that|this)('s| is| was| would be| will be)\b/i.test(sentence.trim()) || /^it('s| is| would be) (check|checkmate|mate|a fork|a pin|a skewer|a discovered)/i.test(sentence.trim()))
  const isQuestion = /\?\s*$/.test(sentence.trim()) || QUESTION_START.test(sentence.trim().toLowerCase())
  let prevSubject: Ref | undefined
  let movesSoFar: MoveTok[] = []
  let conditionalPending = false
  let conditionalUnspecified = false
  let prevClauseHyp = false
  let prevClauseUnspecified = false
  let prevClauseModal = false
  for (let ci = 0; ci < clauses.length; ci++) {
    const c = clauses[ci]
    const clauseMoves = c.toks.filter((t) => t.move).map((t) => t.move!)
    movesSoFar = [...movesSoFar, ...clauseMoves.filter((m) => m.anchor)]
    const words = c.toks.map((t) => t.w)
    const textNoRefs = words.filter((w) => !w.startsWith('⟦')).join(' ')
    // ---- flags
    // in a worked line "Black has to take" describes the line itself, not a possibility
    const modal = words.some((w) => MODAL.has(w) && !(opts.narrative && (w === 'must' || w === 'needs' || w === 'need'))) || (/\b(has to|have to|had to|going to|about to|able to)\b/.test(textNoRefs) && !(opts.narrative && /\b(has to|have to)\b/.test(textNoRefs)))
    // in a worked line ("then the king takes the knight") "then" narrates the line; elsewhere it points to the future
    const future = words.some((w) => FUTURE_WORDS.has(w) && !(opts.narrative && (w === 'then' || w === 'next'))) && !clauseMoves.some((m) => m.anchor)
    const plan = PLAN_VERBS.test(textNoRefs)
    // ", where it ..." describes the square just named: as hypothetical as the clause before it
    const whereClause = c.connector === 'where' || words[0] === 'where'
    const hedged = HEDGE.test(textNoRefs) || /\b(or so it seems|so it seems|it seems|apparently|seemingly)\b/i.test(sentence)
    const advice = ADVICE.test(textNoRefs)
    const past = PAST.test(textNoRefs)
    // a move described in words, not written as a move ("the knight would jump to e5", "if Black takes")
    const wordMove = MOTION.test(textNoRefs) && !clauseMoves.some((m) => m.anchor)
    let hypothetical: boolean = modal || plan || future || (whereClause && prevClauseHyp)
    let unspecifiedMoves = false
    if (c.conditional) {
      hypothetical = true
      conditionalPending = true
      // "before White plays e4": a position where our move has not been played; we never rebuild those
      const counterfactual = /^(and |but |so |then |even )*(before|until|unless|otherwise)\b/.test(c.text)
      conditionalUnspecified = counterfactual || wordMove || !clauseMoves.some((m) => m.anchor)
      unspecifiedMoves = conditionalUnspecified
    }
    const inConsequence = !c.conditional && conditionalPending
    if (inConsequence) {
      hypothetical = true
      unspecifiedMoves = conditionalUnspecified
      if (c.connector !== ',' && c.connector !== '' && c.connector !== ':') conditionalPending = false
    }
    if (hypothetical && wordMove) unspecifiedMoves = true
    // "Next you can bring the queen out and the queen attacks h7": a coordinated clause shares the "can"
    const firstNonAdverb = c.toks.find((t) => !ADVERBS.has(t.w) && t.w !== 'and')
    const sharesSubject = Boolean(firstNonAdverb && !firstNonAdverb.ref && COORD_VERBS.has(firstNonAdverb.w))
    if (c.connector === 'and' && sharesSubject && prevClauseModal && prevClauseUnspecified && !clauseMoves.some((m) => m.anchor)) {
      hypothetical = true
      unspecifiedMoves = true
    }
    // a modal or plan clause is only testable when it names its own moves ("Qxe5 would leave the rook loose")
    if (hypothetical && !c.conditional && !inConsequence && !clauseMoves.some((m) => m.anchor)) unspecifiedMoves = true
    if (labelOfPrevious) {
      hypothetical = true
      unspecifiedMoves = true
    }
    if (hypothetical && unspecifiedMoves) out.hypotheticalUnspecified = true
    // ---- imperative: clause starts with a base-form verb
    const firstWord = words.find((w) => !['and', 'then', 'now', 'first', 'simply', 'just', 'so', 'also', 'but'].includes(w))
    const imperative = Boolean(firstWord && IMPERATIVE_VERBS.has(firstWord)) && !isRef(c.toks[0])
    const flags: ClauseFlags = { hypothetical, unspecifiedMoves, imperative, question: isQuestion, advice, past, hedged }

    // ---- clause subject
    let k0 = 0
    while (k0 < c.toks.length && (ADVERBS.has(c.toks[k0].w) || ['and', 'but', 'so', 'then', 'which', 'where', 'that', 'after', 'here'].includes(c.toks[k0].w))) k0++
    let clauseSubject: Ref | undefined = c.toks[k0]?.ref
    // "On e5 it is guarded ...", "Here the knight ...": skip a leading place phrase
    const startsWithVerb = COORD_VERBS.has(c.toks[k0]?.w ?? '') || IMPERATIVE_VERBS.has(c.toks[k0]?.w ?? '')
    const leadsWithPlace =
      ['on', 'in', 'at', 'from', 'with', 'there', 'after'].includes(c.toks[k0]?.w ?? '') || clauseSubject?.kind === 'square' || (!clauseSubject && !startsWithVerb)
    if (leadsWithPlace) {
      for (let k = k0; k < Math.min(c.toks.length - 1, k0 + 5); k++) {
        const r = c.toks[k].ref
        let n = k + 1
        while (n < c.toks.length && ADVERBS.has(c.toks[n].w)) n++
        const nw = c.toks[n]?.w ?? ''
        if (r && r.kind !== 'square' && (COORD_VERBS.has(nw) || BE.has(nw) || nw in ATTACK_VERBS || DEFEND_VERBS.has(nw) || PIN_VERBS.has(nw) || ['has', 'does', "doesn't", 'gives', 'checks'].includes(nw))) {
          clauseSubject = r
          break
        }
      }
    }
    if (c.toks[0]?.w === 'which' && ci > 0) {
      // ", which hits ...": the antecedent is the last thing named before, a move included ("You play ...Ng4, which hits")
      const prevRefs = clauses[ci - 1].toks.filter((t) => t.ref && t.ref.kind !== 'color')
      clauseSubject = prevRefs[prevRefs.length - 1]?.ref
    }
    if (!clauseSubject && !imperative && (c.connector === 'and' || c.connector === ',') && prevSubject) clauseSubject = prevSubject
    // ---- pronouns: a pronoun subject continues the topic; a pronoun object points to the nearest other piece named
    for (let ti = 0; ti < c.toks.length; ti++) {
      const r = c.toks[ti].ref
      if (!r || r.kind !== 'pronoun' || r.antecedents) continue
      const before = c.toks.slice(0, ti).map((t) => t.ref).filter((x): x is Ref => Boolean(x && concrete(x)))
      let n = ti + 1
      while (n < c.toks.length && ADVERBS.has(c.toks[n].w)) n++
      const nw = c.toks[n]?.w ?? ''
      const prevTok = c.toks[ti - 1]
      // "keeps it guarding the knight": "it" is the object of "keeps"
      const afterVerb = Boolean(prevTok && !prevTok.ref && (COORD_VERBS.has(prevTok.w) || TAKE_VERBS.has(prevTok.w) || prevTok.w in ATTACK_VERBS || DEFEND_VERBS.has(prevTok.w) || PIN_VERBS.has(prevTok.w) || ['by', 'of', 'to', 'on', 'with', 'from', 'behind', 'past', 'than'].includes(prevTok.w)))
      const isSubject = r === clauseSubject || (!afterVerb && (COORD_VERBS.has(nw) || BE.has(nw) || nw in ATTACK_VERBS || DEFEND_VERBS.has(nw)))
      r.pronounRole = isSubject ? 'subject' : 'object'
      if (isSubject) {
        // the topic, or else the last thing named
        r.antecedents = Array.from(new Set([...disc.topic, ...disc.mentions.slice(-1)])).slice(0, 3)
      } else {
        // the nearest pieces named before it (not the subject of its own clause), and the topic
        const subjAnts = clauseSubject ? resolvePronoun(clauseSubject) : []
        const pool = [...disc.mentions, ...before].filter((x) => !subjAnts.includes(x) && x !== clauseSubject)
        const topics = [...disc.topic, ...(disc.oldTopic ?? [])].filter((x) => !subjAnts.includes(x) && x !== clauseSubject)
        r.antecedents = Array.from(new Set([...pool.slice(-2).reverse(), ...topics])).slice(0, 4)
      }
    }
    const before = out.claims.length
    const add = (body: ClaimBody, extra: Partial<ParsedClaim> = {}) => {
      const subjMove = 'subj' in body && body.subj?.kind === 'move' ? body.subj.move : undefined
      const moves = subjMove && !movesSoFar.includes(subjMove) ? [...movesSoFar, subjMove] : movesSoFar.slice()
      out.claims.push({ body, clause: c.text, flags, moves, ...extra })
    }

    // ---- material
    const up = /(⟦\d+⟧)\s+matup_(-?\d+)/.exec(c.text) ?? /(⟦\d+⟧)\s+matextra_(\d+)/.exec(c.text)
    if (up) {
      const ref = prep.refs[Number(/\d+/.exec(up[1])![0])]
      if (ref.kind === 'color' && ref.owner) add({ kind: 'material-up', side: ref.owner, amount: Number(up[2]), atLeast: up[0].includes('matextra') })
    }
    const won = /(⟦\d+⟧)\s+matwon(back)?_(-?\d+)/.exec(c.text)
    if (won) {
      const ref = prep.refs[Number(/\d+/.exec(won[1])![0])]
      const amount = Number(won[3])
      const back = Boolean(won[2])
      if (ref.kind === 'color' && ref.owner) add({ kind: 'material-won', side: ref.owner, amount, back })
      if (ref.kind === 'move' && ref.move) {
        const mv = ref.move
        out.claims.push({ body: { kind: 'material-won', side: 'own', amount, subjMove: mv, back }, clause: c.text, flags, moves: movesSoFar.includes(mv) ? movesSoFar.slice() : [...movesSoFar, mv] })
      }
    }

    // ---- "nothing can take the knight", "the king can't take it", "the rook cannot be captured"
    const unc =
      /(⟦\d+⟧)\s+(?:can|could)\s+(?:take|capture)\s+(⟦\d+⟧)/.exec(c.text) ??
      /(⟦\d+⟧)\s+(?:can't|cannot|can not)\s+(?:take|capture)\s+(⟦\d+⟧)/.exec(c.text) ??
      /()(⟦\d+⟧)\s+(?:can't|cannot|can not)\s+be\s+(?:taken|captured)\b/.exec(c.text)
    if (unc && !c.conditional && !inConsequence && !/\b(if|when|would|could|might|will)\b/.test(textNoRefs)) {
      const byRef = unc[1] ? prep.refs[Number(/\d+/.exec(unc[1])![0])] : undefined
      const objRef = prep.refs[Number(/\d+/.exec(unc[2])![0])]
      const positive = /\s(can|could)\s/.test(unc[0]) && !/can't|cannot|can not/.test(unc[0])
      // "nothing can take X" or "<piece> can't take X"
      if ((positive && byRef?.kind === 'nothing') || (!positive && (!byRef || byRef.kind === 'piece' || byRef.kind === 'pronoun' || byRef.kind === 'nothing'))) {
        if (objRef.kind === 'piece' || objRef.kind === 'pronoun') {
          const f2: ClauseFlags = { ...flags, hypothetical: false, unspecifiedMoves: false }
          out.claims.push({ body: { kind: 'uncapturable', obj: objRef, by: byRef && byRef.kind !== 'nothing' ? byRef : undefined }, clause: c.text, flags: f2, moves: movesSoFar.slice() })
        }
      }
    }

    // ---- walk the tokens looking for claim verbs
    for (let v = 0; v < c.toks.length; v++) {
      const w = c.toks[v].w
      const next = c.toks[v + 1]
      if (w in ATTACK_VERBS) {
        if (nonFinite(c.toks, v)) continue
        const kind = ATTACK_VERBS[w]
        const subj = subjectBefore(c.toks, v, clauseSubject)
        const { refs } = refList(c.toks, v + 1)
        if (kind === 'threaten' && (refs.length === 0 || refs.some((r) => r.kind === 'move'))) continue
        const objs = refs.filter((r) => r.kind !== 'move' && r.kind !== 'nothing')
        if (!objs.length) continue
        if (!subj && !imperative) continue
        const s = subj ?? MOVER
        if (kind === 'fork') add({ kind: 'fork', subj: s, objs })
        else add({ kind: 'attacks', subj: s, objs, neg: negatedBefore(c.toks, v) })
        continue
      }
      if (CONTROL_VERBS.has(w) || AIM_VERBS.has(w) || (['aims', 'points', 'aiming', 'pointing', 'looks', 'looking'].includes(w) && next?.w === 'at')) {
        if (nonFinite(c.toks, v)) continue
        const start = next?.w === 'at' ? v + 2 : v + 1
        const subj = subjectBefore(c.toks, v, clauseSubject)
        const { refs } = refList(c.toks, start)
        if (!subj || !refs.length) continue
        if (CONTROL_VERBS.has(w)) {
          const sq = refs.filter((o) => o.kind === 'square')
          if (sq.length) add({ kind: 'covers', subj, objs: sq, neg: negatedBefore(c.toks, v) })
        } else {
          const objs = refs.filter((r) => (r.kind === 'square' || (r.kind === 'piece' && r.definite)) && !r.count && !r.plural)
          if (objs.length) add({ kind: 'aims', subj, objs })
        }
        continue
      }
      if (DEFEND_VERBS.has(w)) {
        if (nonFinite(c.toks, v)) continue
        const subj = subjectBefore(c.toks, v, clauseSubject)
        const { refs } = refList(c.toks, v + 1)
        const objs = refs.filter((r) => r.kind === 'piece' || r.kind === 'square' || r.kind === 'pronoun')
        if (!objs.length) continue
        if (subj?.kind === 'nothing') {
          for (const o of objs) {
            if (subj.type && subj.type !== 'any') add({ kind: 'defends', subj, objs: [o], neg: true })
            else add({ kind: 'undefended', obj: o })
          }
          continue
        }
        if (!subj && !imperative) continue
        const s = subj ?? MOVER
        const onlyBefore = c.toks.slice(Math.max(0, v - 3), v).some((t) => t.w === 'only')
        if (onlyBefore && subj && objs.length === 1) add({ kind: 'defended-only-by', obj: objs[0], by: subj })
        else add({ kind: 'defends', subj: s, objs, neg: negatedBefore(c.toks, v) })
        continue
      }
      if (PIN_VERBS.has(w)) {
        if (nonFinite(c.toks, v)) continue
        const subj = subjectBefore(c.toks, v, clauseSubject)
        const obj = c.toks[v + 1]?.ref
        if (!obj || (obj.kind !== 'piece' && obj.kind !== 'pronoun')) continue
        let to: Ref | undefined
        if ((c.toks[v + 2]?.w === 'to' || c.toks[v + 2]?.w === 'against') && c.toks[v + 3]?.ref) to = c.toks[v + 3].ref
        if (!subj && !imperative) continue
        add({ kind: 'pinned', obj, by: subj ?? MOVER, to })
        continue
      }
      // passive / adjective: "X is attacked twice", "X is pinned to Y", "X is loose", "X has no defender"
      if (BE.has(w) || w === 'has' || w === 'have') {
        const subj = subjectBefore(c.toks, v, clauseSubject)
        let j = v + 1
        let neg = /n't$/.test(w)
        while (j < c.toks.length && (ADVERBS.has(c.toks[j].w) || ['not', 'no', 'longer', 'completely', 'totally', 'very', 'quite', 'left'].includes(c.toks[j].w))) {
          if (['not', 'no'].includes(c.toks[j].w)) neg = true
          j++
        }
        const word = c.toks[j]?.w
        if (!subj || subj.kind === 'color' || subj.kind === 'move' || subj.kind === 'nothing') continue
        if (w === 'has' || w === 'have') {
          const rest = c.toks.slice(v + 1, v + 6).map((t) => t.w).join(' ')
          if (
            /^(no|not a single|not one) (defenders?|protectors?|protection|guards?|defence|defense)\b/.test(rest) ||
            /^(now )?lost (its|her|his|all its|all|both its) (defenders?|protectors?|protection|guards?|defence|defense|only defender|only protector|only guard)\b/.test(rest)
          )
            add({ kind: 'undefended', obj: subj })
          const cnt = /^(one|two|three|four) (defenders|protectors|defender|protector|attackers|attacker)\b/.exec(rest)
          if (cnt) {
            const n = NUM_WORD[cnt[1]]
            if (/attack/.test(cnt[2])) add({ kind: 'attack-count', obj: subj, n })
            else add({ kind: 'defend-count', obj: subj, n })
          }
          continue
        }
        if (!word) continue
        if (word in PARTICIPLES) {
          passive(c.toks, j, subj, neg, v, add)
          continue
        }
        if (['loose', 'unprotected', 'undefended', 'unguarded'].includes(word)) {
          if (!neg) add({ kind: 'undefended', obj: subj })
          continue
        }
        // "your pieces are safe" is too vague to test
        if (subj.kind === 'piece' && (subj.plural || subj.count)) continue
        if (word === 'hanging' || (word === 'en' && c.toks[j + 1]?.w === 'prise')) {
          add({ kind: neg ? 'safe' : 'hanging', obj: subj })
          continue
        }
        if (word === 'safe' && subj.kind !== 'square' && !(subj.kind === 'piece' && subj.type === 'k') && c.toks[j + 1]?.w !== 'square') {
          add({ kind: neg ? 'hanging' : 'safe', obj: subj })
          continue
        }
        if (word === 'the' && c.toks[j + 1]?.w === 'only' && /^(protector|defender|guard)$/.test(c.toks[j + 2]?.w ?? '') && c.toks[j + 3]?.w === 'of' && c.toks[j + 4]?.ref) {
          add({ kind: 'defended-only-by', obj: c.toks[j + 4].ref!, by: subj })
          continue
        }
        continue
      }
      // coordinated passive without "is": "X is attacked twice and only protected once"
      if (w in PARTICIPLES && clauseSubject && w !== 'hit') {
        let j = v - 1
        while (j >= 0 && (ADVERBS.has(c.toks[j].w) || c.toks[j].w === 'only')) j--
        if (j < 0 || c.toks[j].w === 'and') passive(c.toks, v, clauseSubject, false, v, add)
        continue
      }
      // "the bishop on d6 loses its protection"
      if ((w === 'loses' || w === 'lost') && /^(its|her|his|all its|its only) (defenders?|protectors?|protection|guards?|defence|defense)\b/.test(c.toks.slice(v + 1, v + 4).map((t) => t.w).join(' '))) {
        const subj = subjectBefore(c.toks, v, clauseSubject)
        if (subj && (subj.kind === 'piece' || subj.kind === 'pronoun')) add({ kind: 'undefended', obj: subj })
        continue
      }
      if (w === 'hangs' || w === 'hang') {
        if (nonFinite(c.toks, v)) continue
        const subj = subjectBefore(c.toks, v, clauseSubject)
        if (subj && (subj.kind === 'piece' || subj.kind === 'pronoun')) add({ kind: 'hanging', obj: subj })
        continue
      }
      // "X checks the king"
      if (w === 'checks') {
        let j = v - 1
        while (j >= 0 && ADVERBS.has(c.toks[j].w)) j--
        const direct = j >= 0 && (c.toks[j].ref || ['and', 'that', 'which'].includes(c.toks[j].w))
        if (!direct && !(j < 0 && clauseSubject)) continue
        const subj = subjectBefore(c.toks, v, clauseSubject)
        if (!subj) continue
        add({ kind: 'check', by: subj.kind !== 'color' && subj.kind !== 'nothing' ? subj : undefined })
        continue
      }
      if (w === 'check' || w === 'checkmate' || w === 'mate') {
        const prev = c.toks[v - 1]?.w
        const prev2 = c.toks[v - 2]?.w
        const isMate = w === 'checkmate' || w === 'mate'
        if (isMate && next?.w === 'in') {
          const n = NUM_WORD[c.toks[v + 2]?.w ?? ''] ?? Number(c.toks[v + 2]?.w)
          if (n > 0 && n < 10) add({ kind: 'mate-in', n })
          continue
        }
        if (['threat', 'threatens', 'threatening', 'threats', 'stop', 'stops', 'prevent', 'prevents', 'avoid'].some((x) => words.includes(x))) continue
        const NAMED = ["boden's", 'arabian', "anastasia's", 'smothered', 'back-rank', "legal's", "scholar's", 'corridor', 'epaulette', "fool's", 'hook', "damiano's", "greco's", "lolli's", "morphy's", "opera", "blackburne's", "pillsbury's", 'dovetail', 'swallow', "réti's", "reti's"]
        if (isMate && prev && NAMED.includes(prev)) {
          // "Smothered mate." alone is a label for the diagram; "this is a smothered mate" is a claim
          if (words.some((x) => ['is', 'was', "it's", 'gives', 'delivers'].includes(x))) add({ kind: 'mate', named: true })
          continue
        }
        // which word carries the verb: "gives check", "gives a check", "is check", "with check", "check!" alone
        let verbIdx = -1
        if (prev === 'with' || prev === 'is' || prev === 'gives' || prev === 'giving' || prev === 'delivers' || prev === 'delivering') verbIdx = v - 1
        else if ((prev === 'a' || prev === 'discovered' || prev === 'double') && ['gives', 'is', 'with', 'giving', 'a'].includes(prev2 ?? '')) verbIdx = prev2 === 'a' ? v - 3 : v - 2
        else if (c.toks.length <= 2 && v === 0) verbIdx = v
        else if (prev === 'and' && isMate) verbIdx = v - 1
        else if (prev === ',' && isMate && c.toks.slice(0, v).some((t) => t.move)) verbIdx = v - 1
        if (verbIdx < 0) continue
        const verbWord = c.toks[verbIdx]?.w
        const discovered = prev === 'discovered'
        const double = prev === 'double'
        if (isMate) {
          add({ kind: 'mate' })
          continue
        }
        const subj = verbWord === 'is' || verbWord === 'with' || verbIdx === v ? undefined : subjectBefore(c.toks, verbIdx, clauseSubject)
        add({ kind: 'check', by: subj && subj.kind !== 'color' && subj.kind !== 'nothing' && subj.kind !== 'mover' ? subj : undefined, discovered, double })
        continue
      }
      // "uncovers a check from the queen on h3"
      if (['uncovers', 'reveals', 'discovers', 'opens'].includes(w) && c.toks[v + 1]?.w === 'a' && (c.toks[v + 2]?.w === 'check' || c.toks[v + 2]?.w === 'discovered')) {
        const k = c.toks[v + 2]?.w === 'discovered' ? v + 4 : v + 3
        if (c.toks[k]?.w === 'from' && c.toks[k + 1]?.ref) add({ kind: 'check', by: c.toks[k + 1].ref, discovered: true })
        else add({ kind: 'check', discovered: true })
        continue
      }
      // captures: "the knight takes the rook (for free)", "take the free pawn"
      if (TAKE_VERBS.has(w)) {
        if (nonFinite(c.toks, v)) continue
        const subj = subjectBefore(c.toks, v, clauseSubject)
        const obj = c.toks[v + 1]?.ref
        if (!obj || (obj.kind !== 'piece' && obj.kind !== 'pronoun')) continue
        if (obj.kind === 'piece' && obj.count && obj.count > 1) continue
        if (obj.kind === 'piece' && obj.type === 'k') continue
        if (w.endsWith('ing')) continue
        // "the king cannot take the pawn" is read as a "cannot be taken" claim above
        if (negatedBefore(c.toks, v) || ['cannot', "can't"].includes(c.toks[v - 1]?.w ?? '')) continue
        // "wins X" can happen several moves later: only read here for a written move ("Qxf4 wins it") or an instruction
        const isWin = w.startsWith('win')
        if (isWin && !(subj?.kind === 'move' || (imperative && !subj))) continue
        const rest = c.toks.slice(v + 2, v + 6).map((t) => t.w).join(' ')
        if (/^back\b/.test(rest)) continue
        const free = /\bfor free\b/.test(rest) || obj.adjs.includes('free')
        if (!subj && !imperative) continue
        add({ kind: 'captures', subj, obj, free, win: isWin })
        continue
      }
    }

    // ---- embedded adjective claims ("the unprotected knight on f4") in definite noun phrases
    for (const t of c.toks) {
      const r = t.ref
      if (!r || r.kind !== 'piece' || !r.definite || r.count) continue
      for (const a of r.adjs) {
        if (a === 'loose' || a === 'unprotected' || a === 'undefended' || a === 'unguarded') add({ kind: 'undefended', obj: r }, { embedded: true })
        if (a === 'pinned') add({ kind: 'pinned', obj: r }, { embedded: true })
        if (a === 'trapped') add({ kind: 'trapped', obj: r }, { embedded: true })
        if (a === 'hanging') add({ kind: 'hanging', obj: r }, { embedded: true })
      }
    }

    // ---- "That is a fork" / "Nd6+ is a fork"
    if (/\b(is|was)\s+(a|the)\s+(royal\s+|double\s+|knight\s+|family\s+|pawn\s+|queen\s+)?fork\b/.test(c.text) || /^(the|a|that is the|that is a) fork$/.test(c.text.trim())) {
      const sm = c.toks.find((t) => t.move && t.move.anchor)?.move
      add({ kind: 'fork', subj: sm ? { id: -3, raw: sm.raw, kind: 'move', move: sm, definite: true, adjs: [] } : undefined, objs: [] })
    }

    prevClauseHyp = hypothetical || imperative || advice || flags.question
    prevClauseUnspecified = (hypothetical && unspecifiedMoves) || flags.question
    prevClauseModal = modal || c.conditional || inConsequence || flags.question
    if (clauseSubject) prevSubject = clauseSubject
    if (clauseSubject) {
      const t = resolvePronoun(clauseSubject)
      if (t.length && !(t.length === disc.topic.length && t.every((x, i) => x === disc.topic[i]))) {
        disc.oldTopic = disc.topic
        disc.topic = t
      }
    }
    for (const t of c.toks) if (t.ref && concrete(t.ref)) disc.mentions.push(t.ref)
    if (out.claims.length === before) {
      const kw = KEYWORDS.exec(textNoRefs)
      if (kw) out.unparsed.push({ clause: c.text, keyword: kw[1], reason: 'claim word found but no claim pattern matched' })
    }
  }
  return out
}
