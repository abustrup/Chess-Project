# Openings: what 1000-1300 players really meet, and what to keep (2026-10-16)

Status labels: **verified** = counted directly from the data by a script in `scripts/`; **inferred** = follows from the data plus a stated assumption; **assumed** = not checked.

## The short answer

1. **The courses are far wider than the games.** In most games the 1000-1300 opponent has left the course by his 2nd to 5th move (London earliest: 47% of White games by Black's 2nd move). Of 1,425 own-move decisions in the three courses, about 150 (roughly 1 in 10) come up in at least 1 of every 200 games. (verified, with the caveat in "Limits")
2. **As White the opening is not where he loses points.** As Black it might be, but mostly through tactical slips around moves 7 to 11, usually after he has already left the course himself. Only 1 of his 9 Black games that were lost by move 12 went wrong on the move that left a course line. (inferred, 31 games)
3. **The Slav is rare.** A real Slav position (pawns c4+d4 against c6+d5) comes up in about 24-32% of his games against 1.d4, which is about 5-7% of all his Black games (4-6% at rapid). He also answers 1.d4 with 1...c6, not the course's 1...d5 (2 of his 3 games against 1.d4; he met 1.Nf3 and 1.c4 with 1...c6 too). (verified)
4. **Proposal: cut 14 of the 40 chapters, fold 6 more into others (40 become 21), shorten the rest to about move 6-8, and add only 4 short pieces** that real games demand: the Englund Gambit (1.d4 e5, 8.4% of his White games), the "quiet first move" London set-up card, 2.Bc4 in the Caro-Kann (with 4.Bb3, the biggest Caro-Kann gap at 5.7%), and the Jobava set-up against the Slav (7.7% of 1.d4 games). Fix 3 places where two chapters teach different moves in the same position.

## Data (all free, no login)

- **Database sample** (verified): 64 byte-range slices of 20 MiB, evenly spread over `lichess_db_standard_rated_2026-09.pgn.zst` (29.2 GB), 2026-09-01 to 2026-09-30, slice start times covering every UTC hour except 04. About 3.62 million games seen; kept rated blitz and rapid games where **both players were rated 1000-1300**: **316,537 games** (212,837 blitz, 103,700 rapid; 77,241 of them 10+0). First 12 moves of each.
- **His games** (verified): Lichess API, user `abustrup`, fetched 2026-10-16: 31 rated blitz games, 2026-10-10 to 2026-10-15 (23 at 5+3, 7 at 3+2, 1 at 3+0); 15 as White, 16 as Black; score 9 wins, 22 losses. Only 6 had Lichess analysis, so I ran Stockfish 19 (depth 14, 2 threads) on moves 1-15.
- **Population check** (verified): 4,756 games from 8 of the slices that Lichess had analysed (both players 1000-1300), to see how often a side is already lost by move 12. Analysed games are a selected subset (someone asked for analysis).
- **Engine check** (verified): Stockfish 19 depth 20, 2 threads, on every course move the owner would play in at least 1 of 200 games, and on the biggest gaps.

Method in one paragraph: I "walk" each course like an opening explorer. On his turn I play the course's move. On the opponent's turn I branch into every move 1000-1300 players actually made from that exact position (transpositions merged), weighted by how often they made it. An opponent move the course does not answer is a **gap**. A position that fewer than 30 sample games reached is **too rare to say**. A second method (Kaplan-Meier over real games, `km.py`) pools positions by move number; it agrees within 3 points for the London and Caro-Kann up to the opponent's 4th move, and comes out higher for the Slav at move 4 (61% against 50-53%, on only 344 games).

## 1. His own games (31 blitz games, 2026-10-10 to 2026-10-15)

| | As White (15) | As Black (16) |
|---|---|---|
| Score | 7 / 15 | 2 / 16 |
| Win chance below 30% after move 12 | 2 / 15 (13%) | **9 / 16 (56%, 95% interval 33-77%)** |
| Same, 1000-1300 population (4,756 analysed games) | 17% of White sides | 31% of Black sides |
| Games with a blunder (Lichess rule, 15+ points) in moves 1-12 | 6 / 15 | 11 / 16 |
| Blunders per 100 of his moves, moves 1-12 (my Stockfish, not Lichess's) | 5.0 (9 in 180) | 8.5 (16 in 188) |
| Who left the course first | opponent 8, him 7 (median: Black's 1st move vs his 4th) | **him 13**, opponent 1, not covered 2 |

What this says (inferred, small sample):
- **White is fine.** Both White games that were lost by move 12 came from one move that left a piece hanging at move 11, long after the opponent had left the course at move 1. The London course cannot fix that; the safety habit can.
- **Black is where early losses pile up.** 9 of 16 Black games were below 30% by move 12 and he lost all 9. If his true rate were the population's 31%, 9 or more of 16 would happen about 3% of the time. But the cause is mostly not theory: in 7 of the 9, the first drop of 15+ points came at moves 7-11, **after the game had already left the course** (6 times by his own move, usually his 3rd or 4th; once by the opponent's). In 1 game there was no single drop, just a slide. In 1 game the move that left the course was itself the mistake (1.e4 c6 2.d4 d5 3.e5 Bf5 4.h4 e6, a 30-point drop; the course says 4...h5). Only 2 of the first drops left a piece capturable by a simple exchange; the rest allowed a tactic one or two moves deep (inferred from the engine drops, not classified move by move). The other investigator's full classification should be preferred over mine.
- His games are blitz; he will train at 10+0. The opening frequencies at rapid and at 10+0 differ by a few points at most from blitz plus rapid (sections 2 and 3).
- The Caro-Kann course was finished on 2026-10-13, after most of these games. Leaving it at move 3-4 says he had not learned it yet, not that it is wrong.

Conclusion for "does the opening matter?": **a little, and mainly as Black, and mainly as "the first 6-10 moves are where his tactical slips happen"**. That argues for short opening lines plus safety drills built from his own early-middlegame positions as Black, not for more theory.

## 2. How long games stay inside the courses (database, both players 1000-1300)

Share of his games still inside the course after the opponent's Nth move. Walk method, with a low-high range where the sample ran out (positions seen in fewer than 30 games); Kaplan-Meier on real games in brackets.

| After opponent's move | London (all White games) | Caro-Kann (after 1.e4) | Slav (after 1.d4, course's 1...d5) | 1.d4 c6 (his move order) |
|---|---|---|---|---|
| 1 | 73% [73%] | 100% | 100% | 100% |
| 2 | 53% [54%] | 91% [91%] | 94% [94%] | 94% [94%] |
| 3 | 40-41% [41%] | 84% [85%] | 71-72% [71%] | 77-78% [76%] |
| 4 | 23-26% [25%] | 60-61% [59%] | 50-53% [61%, 344 games] | 58-60% [59%] |
| 5 | 3-22% [11%, 237 games] | 36-43% [40%] | 21-41% [38%, 65 games] | 27-44% [37%] |
| 6 | 1-22% [6%, 39 games] | 13-26% [20%] | 1-40% [18%, 15 games] | 5-40% [22%] |
| 8 | 0-22% | 1-23% [5%] | 0-39% | 0-38% |

(verified; files `coverage_all.json`, `depth_in_course_km.json`). Rapid-only (103,700 games) gives the same picture: the Kaplan-Meier figures are within 5 points at every move up to the 6th; the walk's ranges get wider because the sample is smaller (`coverage_rapid.json`, `depth_in_course_km.json`).

So **no course line is followed to move 12 in a measurable share of games**, and the London is left early: 27% of White games leave at Black's first move, 47% by his second.

The courses already mostly stop by move 12 (only 14 of 449 London, 23 of 552 Caro-Kann and 7 of 424 Slav own-move decisions are after move 12). The problem is **breadth**, not depth:

| Course | Chapters | Own-move decisions | Used in at least 1 of 100 games | 1 of 200 | 1 of 500 |
|---|---|---|---|---|---|
| London | 14 | 449 | 30 | 41 | 59 |
| Caro-Kann | 14 | 552 | 41 | 65 | 85 |
| Slav | 12 | 424 | 37 | 44 | 56 |

("Games" = his games with that colour and first move. Lower bounds: decisions behind a too-rare position count as unused.)

## 3. Frequency trees (what 1000-1300 opponents actually play)

Full trees to move 12, every branch reached in at least 1 of 500 games, with each move's frequency, sample size and his score with a 95% interval: `tree_london_all.json`, `tree_caro-kann_all.json`, `tree_slav_all.json`, `tree_black-vs-d4-with-1c6_all.json` (and `_rapid` versions). Highlights (verified):

**As White after 1.d4** (71,678 games): 1...d5 54.4%, 1...Nf6 9.6%, **1...e6 9.1%, 1...e5 (Englund) 8.4%**, 1...c6 3.5%, 1...g6 3.4%, 1...d6 3.4%, 1...c5 2.2%, 1...b6 1.7%, 1...f5 1.5%, 1...Nc6 1.4%.
After 1...d5 2.Bf4 (10,505 games): **2...Nc6 36%**, 2...Nf6 20%, **2...e6 16%**, 2...Bf5 14%, 2...c5 3%, 2...f6 3%, 2...c6 2%, 2...h6 1%.
His own 15 White games match: 1...d5 7 times (then 2...Nc6 4 of 7), 1...e5 twice.
White's score barely depends on Black's reply: 49-56% after each of the 11 most common first moves.

**As Black after 1.e4** (1...c6 in 14,365 games): 2.d4 35.5%, **2.Nf3 32.6%**, **2.Bc4 11.3%**, 2.Nc3 7.3%, 2.d3 2.3%, 2.Qf3 2.3%, 2.e5 2.1%, 2.f4 2.0%, 2.c4 1.2%. After 2.d4 d5: 3.e5 52%, 3.exd5 22%, 3.Nc3 18%, 3.f3 2.5%. So the classical main line (3.Nc3/3.Nd2 dxe4 4.Nxe4) is about 7% of his 1.e4 games, and **only a third of 1...c6 games reach 2.d4 d5 at all**. His 11 games: 2.d4 5, 2.Nf3 2, 2.Bc4 2, 2.Nc3 2.

**As Black after 1.d4** (`systems_black.json`, 38,679 games with 1.d4 d5): London (Bf4 by move 3) 28.5%, Queen's Gambit family (c4 by move 3) 28.2%, Colle/Stonewall (e3) 14.9%, Nc3 without Bf4 9.0%, **Jobava (Nc3 + Bf4) 8.2%**, Nf3 other 3.6%, 2.e4 gambit 2.6%, Bg5 systems 2.1%, other 3.0%. At 10+0 only: London 29.0%, c4 24.6%.
After 1.d4 c6 (his move; 2,526 games): 2.Bf4 25%, **2.e4 21% (becomes a Caro-Kann)**, 2.c4 18%, 2.Nf3 13%, 2.e3 8%, 2.Nc3 7%, 2.d5 2%.
**Real Slav share** (verified for the database, inferred for him): the walk reaches the Slav structure in 32% of 1.d4 games with 1...d5 (26% in rapid) and 24% with 1...c6 (18% in rapid). 1.d4 is 22.6% of all games at this level, so a real Slav is **about 5-7% of his Black games**. The hypothesis "under 10%" holds.

## 4. Lines met at least once per 50-100 games with no answer in the course

Share = of his games with that colour and first move; score = his side's score at 1000-1300 with that line. "Rejoins" = share that lands back on a course position if he just keeps playing his set-up for 2 more moves (inferred).

**London** (gaps total 78% of White games before move 6):
| Line | Share | His score | Rejoins |
|---|---|---|---|
| 1.d4 e6 | 9.1% | 52% (n=6,500) | 16% |
| 1.d4 d5 2.Bf4 e6 | 8.6% | 55% (n=1,658) | 20% |
| 1.d4 e5 (Englund) | 8.4% | 51% (n=6,009) | 24% |
| 1.d4 c6 | 3.5% | 52% | 27% |
| 1.d4 g6 | 3.4% | 50% | 6% |
| 1.d4 d5 2.Bf4 Nc6 3.e3 e6 | 2.2% | 57% | 0% |
| 1.d4 d5 2.Bf4 f6 | 1.6% | 52% | 0% |
| 1.d4 d5 2.Bf4 Nc6 3.e3 Bf5 4.c4 dxc4 | 1.6% | 44% (n=17) | unknown |
| 1.d4 d5 2.Bf4 Nc6 3.e3 f6 | 1.5% | 59% | 0% |
| 1.d4 Nc6 | 1.4% | 56% | 0% |
| 1.d4 d5 2.Bf4 c6 | 1.3% | 53% | 39% |
| 1.d4 d5 2.Bf4 Nc6 3.e3 a6 | 1.2% | 53% | 0% |

**Caro-Kann** (after 1.e4):
| Line | Share | His score | Rejoins |
|---|---|---|---|
| 2.Bc4 d5 3.exd5 cxd5 4.Bb3 | **5.7%** | 55% (n=733) | 0% |
| 2.Nf3 d5 3.exd5 cxd5 4.Nc3 | 2.7% | 53% | 0% |
| 2.Qf3 | 2.3% | 52% | 3% |
| 2.Nf3 d5 3.exd5 cxd5 4.Bb5+ | 2.2% | 52% | 8% |
| 2.e5 | 2.1% | 48% | 61% (2...d5 3.d4 is the Advance) |
| 2.f4 | 2.0% | 50% | 0% |
| 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Bd3 | 1.6% | 49% | 4% |
| 2.Nf3 d5 3.exd5 cxd5 4.d4 Nc6 5.Nc3 Bg4 6.Be2 | 1.3% | 64% | 3% |
| 2.Nf3 d5 3.exd5 cxd5 4.d4 Nc6 5.Bb5 Bd7 6.O-O | 1.2% | 46% (n=14) | unknown |
| 2.d4 d5 3.e5 Bf5 4.f4 | 1.1% | 49% | 0% |
| 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng5 | 1.0% | 44% | unknown |
| 2.Bc4 d5 3.exd5 cxd5 4.Bb5+ Bd7 5.Bxd7+ Nxd7 6.Nf3 | 1.0% | 60% | unknown |

**Slav** (after 1.d4, course's 1...d5):
| Line | Share | His score | Rejoins |
|---|---|---|---|
| 2.Nc3 c6 3.Bf4 (Jobava) | **5.1%** | 44% (n=223) | 32% |
| 2.Bf4 c6 3.e3 Bf5 4.Bd3 | 2.9% | 37% (n=34) | unknown |
| 2.Bf4 c6 3.Nc3 (Jobava) | 2.6% | 66% (n=71) | 32% |
| 2.e3 c6 3.Bd3 | 2.0% | 49% | 0% |
| 2.c3 | 1.8% | 52% | 0% |
| 2.Bf4 c6 3.e3 Bf5 4.c3 | 1.6% | 40% (n=19) | 0% |
| 2.Bf4 c6 3.e3 Bf5 4.c4 | 1.4% | 41% (n=16) | 18% |
| 2.Bf4 c6 3.e3 Bf5 4.Nf3 e6 5.c3 | 1.3% | 44% (n=17) | unknown |
| 2.c4 c6 3.c5 | 1.3% | 61% | 0% |
| 2.c4 c6 3.Nc3 Nf6 4.Bf4 | 1.1% | 46% | 0% |
| 2.e3 c6 3.Nc3 | 1.1% | 30% (n=38) | 0% |
| 2.e3 c6 3.c3 | 1.0% | 32% (n=36) | unknown |

Many London and Slav "gaps" are the same set-up reached by a different move order. The strict position test undercounts how much the set-up ideas still apply (inferred), but even with 2 extra moves of set-up play, most gaps do not land back on a course position.

## 5. Proposal per chapter

Reach = share of his games (that colour and first move) that reach the point where this chapter's main line parts from every other chapter; in brackets, the share that touches any position found only in this chapter, side lines included. "Followed to move" = average move number at which those games leave the course or the sample runs out (a lower bound). "Used" = own-move decisions in the chapter met in at least 1 of 200 games. Proposed cuts follow "cut before adding": every addition below is smaller than the cuts in the same course.

### London (White, all White games)

| # | Chapter | Reach | Followed to move (avg) | Own moves / used | Proposal |
|---|---|---|---|---|---|
| 7 | Against ...Nc6 and ...e5 | **19.4%** | 3.6 | 19 / 7 | **Keep.** The most-met chapter. Add one move each against 3...e6 (2.2%), 3...f6 (1.5%), 3...a6 (1.2%). Fix the conflict: this chapter plays 4.Nf3 after 2...Nc6 3.e3 Nf6, "pins and pokes" plays 4.c3; and 4.Bxe5 vs 4.dxe5 after 3...e5. Pick one each. |
| 3 | Black copies with ...Bf5 | 3.5% (9.6% any) | 4.2 | 43 / 8 | **Keep, shorten to move 7.** |
| 1 | Classic pyramid | 1.3% | 5.0 | 60 / 6 | **Merge** with 2, 4, 6, 9, 10 into one chapter "Black plays ...d5 with ...Nf6 or ...e6", to move 7. Its 10 moves after move 12 go. |
| 13 | Keep calm, weird moves (1...d6) | 3.4% (7.8% any) | 2.8 | 21 / 7 | **Keep.** Fold in 1...Nc6 (1.4%). |
| 8 | King's Indian set-up | 3.0% | 4.4 | 22 / 6 | **Keep, short.** Fold in 1...g6 (3.4% gap, same set-up). |
| 5 | Early ...c5 | 1.9% | 3.6 | 57 / 6 | **Shorten** to move 6 (57 moves for 1 in 50 games). |
| 11 | Dutch 1...f5 | 1.5% | 2.5 | 23 / 3 | **Shorten** to move 5. |
| 10 | Knight-first move orders | 1.3% | 3.4 | 37 / 8 | **Merge** into the merged ...d5/...Nf6 chapter. |
| 12 | ...c5 Benoni style | 0.4% (2.7% any) | 2.1 | 19 / 6 | **Merge** with 5. |
| 2 | Slav-style ...c6 | 0.3% | 4.9 | 70 / 3 | **Cut** (keep its 1-2 frequent moves inside the merged chapter). |
| 4 | Bishop harassment (...Ne4) | 0.3% | 4.2 | 61 / 5 | **Cut**; one idea card. |
| 6 | Pins and pokes (...Bg4) | 0.5% | 4.2 | 53 / 8 | **Cut**; its ...Nc6 parts move to chapter 7. |
| 9 | Grünfeld ...g6 with ...d5 | 0.6% | 4.3 | 18 / 9 | **Cut** (one line into 8). |
| 14 | Middlegame plans (...Bxf4) | **0.0%** | not reached | 10 / 5 | **Cut.** It plays 5.Bd3 where chapter 1 plays 5.Bg3 in the same position, so the two teach opposite moves. Keep the plan as an idea card if wanted. |
| new | **Englund 1...e5** | 8.4% | n/a | about 8 | **Add, short (to move 5).** After 2.dxe5 Nc6 3.Nf3 Qe7, 45% of 1000-1300 White players play 4.Bf4 and score **38%** (n=253, 95% interval 32-44%) because of 4...Qb4+ hitting b2; 4.Nc3 scores 52% (n=103), 4.e3 61% (n=54). His own Englund game went 2.dxe5 Bc5 3.Bf4 and was lost. Engine: 2.dxe5 is +1.4 for White. |
| new | **Quiet first moves** card (1...e6, 1...c6, 1...g6; 2...e6) | 9.1% + 3.5% + 3.4% + 8.6% | n/a | 0 new lines | **Add one idea card, no tree**: same set-up (Bf4, e3, Nf3, c3, Bd3, Nbd2, h3); watch for ...Qb6 and ...Bd6. Stockfish's first choice against 1...e6, 1...c6 and 1...g6 is 2.e4 (+0.4 to +0.6 for White) and 2.Bf4 is not in its top three; at this level such a gap is far smaller than one blunder. |

Net: 14 chapters become 8 (5 cut, 2 folded into others, 1 short new chapter), plus 1 idea card.

### Caro-Kann (Black after 1.e4)

| # | Chapter | Reach | Followed to move (avg) | Own moves / used | Proposal |
|---|---|---|---|---|---|
| 3 | Two Knights 2.Nf3 / 2.Nc3 | **32.6%** | 4.2 | 42 / 18 | **Keep.** The most efficient chapter. Review 2.Nf3 d5 3.e5: course plays 3...Bf5, but 3...Bg4 scores 56% (n=447, 51-60%) against 49% (n=383, 44-54%) at 1000-1300, and Stockfish prefers 3...Bg4 by 0.29 pawns. Add 4.Nc3 (2.7%) and 4.Bb5+ (2.2%) after 3.exd5 cxd5. |
| 4 | Quiet and odd moves (c3, d3, Bc4, Qe2, g3, Nc3) | 0.8% (15.2% any) | 3.4 | 52 / 11 | **Keep, rebuild around what is met:** **2.Bc4 d5 3.exd5 cxd5 4.Bb3 (5.7%, the biggest gap)** and 4.Bb5+; 2.Qf3 (2.3%), 2.e5 (2.1%, transposes to the Advance), 2.f4 (2.0%). Cut the rest. |
| 7 | Advance with Nf3 (Short) | 13.9% | 5.3 | 63 / 10 | **Keep, shorten to move 8** (6 own moves after move 12 go). |
| 2 | Exchange: Nf3, Nc3, Bf4, Bb5+ | 11.9% (17.9% any) | 5.0 | 55 / 12 | **Keep, shorten to move 7**; merge chapter 1 in. |
| 8 | Advance with Bd3, c3, Be3 | 3.9% | 6.4 | 42 / 12 | **Keep, short.** |
| 13 | Advance with Nc3 (and g4) | 2.0% (5.8% any) | 5.0 | 57 / 5 | **Shorten to move 7** (7 own moves after move 12 go). |
| 9 | Classical, quieter 6th moves | 1.0% | 6.0 | 47 / 6 | **Merge** with 12 into one Classical chapter to move 8 (the whole 3.Nc3 dxe4 4.Nxe4 complex is about 7%). |
| 12 | Classical with h4 | 0.4% | 5.1 | 45 / 6 | **Merge** into 9; its 9 own moves after move 12 go. |
| 6 | Rare 3rd/4th moves and gambits | 1.7% | 3.9 | 31 / 8 | **Shorten** to move 5. |
| 1 | Exchange with Bd3 and Bf4 | 0.5% | 5.0 | 46 / 5 | **Merge** into 2 (same structure). |
| 5 | Fantasy 3.f3 | 0.9% | 4.0 | 45 / 4 | **Cut**; keep one line as a card (3...dxe4 4.fxe4 e5). |
| 14 | Advance h4/g4 pushes | 0.4% (1.4% any) | 4.3 | 36 / 4 | **Cut the chapter, keep one card**: "if White pushes h4 against ...Bf5, answer ...h5". His one game in this line (4.h4 e6?) dropped 30 points at once. |
| 10 | Accelerated Panov 2.c4 | 1.2% | 3.9 | 28 / 5 | **Cut** (card). |
| 11 | Panov 4.c4 | 0.6% | 4.7 | 31 / 4 | **Cut.** |

Net: 14 chapters become 8 (4 cut, 2 folded into others), no new chapter (2.Bc4 goes into chapter 4).

### Slav (Black after 1.d4)

First decision for the owner: **he plays 1...c6, not 1...d5** (2 of 3 games against 1.d4, plus 1.Nf3 c6 and 1.c4 c6). With the existing chapters, 1...c6 is covered as well as 1...d5 (94% / 77% / 58% still in course after White's 2nd/3rd/4th move, against 94% / 71% / 50%), because 2.e4 d5 becomes a Caro-Kann and 2.c4/2.Bf4/2.Nf3/2.e3/2.Nc3 d5 transposes. **Recommend making 1...c6 the entry move** of the Black repertoire against 1.d4 (new gaps: 2.d5 2.0%, 2.c3 1.6%). That unifies the Black repertoire as "...c6 and ...d5 against everything".

| # | Chapter | Reach | Followed to move (avg) | Own moves / used | Proposal |
|---|---|---|---|---|---|
| 3 | Against the London | 10.7% (30.9% any) | 3.8 | 33 / 9 | **Keep**, shorten to move 7. **Add the Jobava** (2.Nc3 + Bf4: 5.1% + 2.6% gaps; Black scores 44% after 2.Nc3 c6 3.Bf4, n=223). His one Jobava game (rated 1444 opponent) was lost. |
| 5 | Colle and Catalan set-ups | 8.4% (19.4% any) | 3.2 | 40 / 8 | **Keep, shorten**; add 3.Bd3 (2.0%) and 2.c3 (1.8%). |
| 7 | Quiet and sharp 3rd moves (3.e3, 3.Nc3) | 5.1% (17.4% any) | 4.0 | 43 / 9 | **Keep, shorten to move 6.** |
| 10 | Other 2nd moves (2.e4, 2.Bg5, 2.Nc3) | 2.6% (18.3% any) | 3.0 | 35 / 14 | **Keep, shorten.** With 1...c6, 2.e4 is a Caro-Kann and this chapter shrinks further. |
| 1 | Slow Slav 4.e3 | 0.9% | 5.3 | 58 / 5 | **Merge** with 2 and 8 into one "real Slav" chapter (2.c4 c6 3.Nf3/3.Nc3/3.cxd5) to move 6. |
| 2 | Exchange Slav | 0.4% | 5.0 | 49 / 5 | **Merge** (above). |
| 8 | Exchange: Bg5 and Qb3 tricks | 0.8% | 4.5 | 41 / 7 | **Merge** (above), keep the trick lines only. |
| 4 | Main Slav 4...dxc4 5.a4 Bf5 | 0.0% measurable (at most 4.3%) | 6.0 | 35 / 4 | **Cut.** The course's 4...dxc4 is rare at this level: the position after it was reached by 27 of 316,537 sample games, so White's replies cannot even be measured. |
| 9 | Krause 6.Ne5 | 0.0% | not reached | 25 / 4 | **Cut.** |
| 11 | Slav accepted ...b5 | 0.0% | not reached | 42 / 4 | **Cut.** |
| 12 | Semi-Slav bridge | 0.0% (never reached) | not reached | 24 / 4 | **Cut.** It plays 4...e6 where chapters 4, 9 and 11 play 4...dxc4. |
| 6 | Other 4th moves (Qc2, Qb3, Bg5...) | 0.0% (1.9% any) | 4.0 | 41 / 5 | **Cut.** |

Net: 12 chapters become 5 (5 cut, 2 folded into chapter 1), one addition (Jobava, inside chapter 3).

### Three places where chapters teach different moves in the same position (verified)

- London: after 1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3 Bd6, "classic pyramid" and "bishop harassment" play 5.Bg3, "middlegame plans" plays 5.Bd3 (reached in 1.3% of White games).
- London: after 1.d4 d5 2.Bf4 Nc6 3.e3 Nf6, "pins and pokes" plays 4.c3, "against ...Nc6" plays 4.Nf3 (reached in **11.9%** of White games, the most important one). At 1000-1300, 4.c3 scores 59% (n=205), 4.Nf3 55% (n=564); Stockfish prefers 4.Nd2/4.Nf3 by 0.2 pawns.
- Slav: after 2.c4 c6 3.Nf3 Nf6 4.Nc3, three chapters play 4...dxc4 and one plays 4...e6.
(All conflicts: `coverage_all.json`, key `conflicting_first_moves`: 8 London, 5 Caro-Kann, 6 Slav.)

## 6. Engine check of the moves he would actually use

Stockfish 19, depth 20, 2 threads; every course move used in at least 1 of 200 games (London 41, Caro-Kann 65, Slav 44 positions). `engine_check.json`. **Result (verified): the course moves he would actually meet are sound.** Of 150 frequently used course moves, 149 are within half a pawn of Stockfish's first choice, and the one exception (2.Nf3 against 1...b6) is a choice of set-up, not an error. Differences this small do not decide games at 1000-1300 (inferred). Two moves are worth changing or noting: 3...Bg4 instead of 3...Bf5 after 1.e4 c6 2.Nf3 d5 3.e5 (engine and human results agree), and 5...Qxd4 against the rare 5.Bd3 in the Classical (it wins a pawn).

Depth 20, Stockfish 19, Threads 2. Losses are in hundredths of a pawn, from his side.

| Course | Positions checked | Course move = engine first choice | Within 0.25 pawn | 0.25-0.50 | Over 0.50 |
|---|---|---|---|---|---|
| london | 41 | 17 | 39 | 1 | 1 |
| caro-kann | 65 | 48 | 63 | 2 | 0 |
| slav | 44 | 22 | 41 | 3 | 0 |

Largest differences (course move vs Stockfish first choice), with what 1000-1300 players score with each:

- london, after d4 b6: course Nf3 vs engine e4, 57 worse, used in 1.7% of games. Human score: course move 55% (n=177), engine move 46% (n=244).
- london, after d4 d6: course Bf4 vs engine Nf3, 29 worse, used in 3.4% of games. Human score: course move 49% (n=581), engine move 54% (n=317).
- london, after d4 d5 Bf4 Nc6 e3 Nf6: course c3 vs engine Nd2, 23 worse, used in 11.9% of games. Human score: course move 59% (n=205), engine move not among the 5 most played.
- london, after d4 b6 Nf3 Bb7: course Bf4 vs engine c4, 22 worse, used in 1.5% of games. Human score: course move 54% (n=42), engine move 55% (n=20).
- caro-kann, after e4 c6 d4 d5 exd5 cxd5 Nf3 Nc6 Bb5: course Bd7 vs engine Qa5+, 38 worse, used in 4.1% of games. Human score: course move 62% (n=39), engine move not among the 5 most played.
- caro-kann, after e4 c6 Nf3 d5 e5: course Bf5 vs engine Bg4, 29 worse, used in 8.3% of games. Human score: course move 49% (n=383), engine move 56% (n=447).
- slav, after d4 d5 e4 dxe4 Nc3 Nf6 f3 exf3 Nxf3: course Bf5 vs engine c6, 32 worse, used in 0.5% of games. Human score: course move 43% (n=7), engine move not among the 5 most played.
- slav, after d4 d5 Bf4: course c6 vs engine c5, 29 worse, used in 27.0% of games. Human score: course move not among the 5 most played, engine move 46% (n=361).
- slav, after d4 d5 Nc3: course c6 vs engine Nf6, 28 worse, used in 11.5% of games. Human score: course move 48% (n=333), engine move 45% (n=2148).
- slav, after d4 d5 Bg5: course c6 vs engine c5, 24 worse, used in 1.0% of games. Human score: course move not among the 5 most played, engine move not among the 5 most played.

Engine first choice at each gap (1 in 100 games or more):

- london, d4 e6 (9.1%): e4 (+40), Nc3 (+36), c4 (+20)
- london, d4 d5 Bf4 e6 (8.6%): Nd2 (+7), e3 (+7), Nf3 (+7)
- london, d4 e5 (8.4%): dxe5 (+140), Nc3 (+32), e3 (+8)
- london, d4 c6 (3.5%): e4 (+39), Nf3 (+26), c4 (+26)
- london, d4 g6 (3.4%): e4 (+63), Nc3 (+48), c4 (+39)
- london, d4 d5 Bf4 Nc6 e3 e6 (2.2%): c4 (+45), Nf3 (+43), c3 (+29)
- london, d4 d5 Bf4 f6 (1.6%): e3 (+78), e4 (+75), Nf3 (+71)
- london, d4 d5 Bf4 Nc6 e3 Bf5 c4 dxc4 (1.6%): Nc3 (+56), Bxc4 (+55), Nf3 (+45)
- london, d4 d5 Bf4 Nc6 e3 f6 (1.5%): Nf3 (+77), Bd3 (+74), Bg3 (+64)
- london, d4 Nc6 (1.4%): d5 (+89), Nf3 (+50), c4 (+50)
- london, d4 d5 Bf4 c6 (1.3%): Nf3 (+34), e3 (+33), Nd2 (+27)
- london, d4 d5 Bf4 Nc6 e3 a6 (1.2%): c4 (+45), Nf3 (+44), a3 (+41)
- caro-kann, e4 c6 Bc4 d5 exd5 cxd5 Bb3 (5.7%): Bf5 (+33), Nc6 (+30), Nf6 (+26)
- caro-kann, e4 c6 Nf3 d5 exd5 cxd5 Nc3 (2.7%): Nc6 (+14), Bg4 (+14), a6 (+6)
- caro-kann, e4 c6 Qf3 (2.3%): c5 (+14), d5 (+5), e5 (+2)
- caro-kann, e4 c6 Nf3 d5 exd5 cxd5 Bb5+ (2.2%): Bd7 (-5), Nc6 (-6), Nd7 (-40)
- caro-kann, e4 c6 e5 (2.1%): d6 (+2), c5 (-6), e6 (-30)
- caro-kann, e4 c6 f4 (2.0%): d5 (+4), e5 (-10), g6 (-32)
- caro-kann, e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Bd3 (1.6%): Qxd4 (+21), Bxe4 (-20), e6 (-26)
- caro-kann, e4 c6 Nf3 d5 exd5 cxd5 d4 Nc6 Nc3 Bg4 Be2 (1.3%): e6 (+20), Nf6 (+7), Rc8 (+6)
- caro-kann, e4 c6 Nf3 d5 exd5 cxd5 d4 Nc6 Bb5 Bd7 O-O (1.2%): a6 (-20), e6 (-40), Nf6 (-43)
- caro-kann, e4 c6 d4 d5 e5 Bf5 f4 (1.1%): e6 (+13), h5 (-4), Nd7 (-24)
- slav, d4 d5 Nc3 c6 Bf4 (5.1%): Nf6 (-11), Nd7 (-27), b5 (-31)
- slav, d4 d5 Bf4 c6 e3 Bf5 Bd3 (2.9%): Bxd3 (-12), Bg6 (-25), e6 (-34)
- slav, d4 d5 Bf4 c6 Nc3 (2.6%): Nf6 (+0), Nd7 (-24), Qb6 (-29)
- slav, d4 d5 e3 c6 Bd3 (2.0%): Nf6 (-10), Nd7 (-17), a6 (-22)
- slav, d4 d5 c3 (1.8%): c5 (+1), Nf6 (-1), e6 (-6)
- slav, d4 d5 Bf4 c6 e3 Bf5 c3 (1.6%): Nd7 (-4), Nf6 (-7), Qb6 (-11)
- slav, d4 d5 Bf4 c6 e3 Bf5 c4 (1.4%): e6 (-37), Nf6 (-37), Qb6 (-39)
- slav, d4 d5 Bf4 c6 e3 Bf5 Nf3 e6 c3 (1.3%): Qb6 (+4), Nd7 (-1), a5 (-8)
- slav, d4 d5 c4 c6 c5 (1.3%): e5 (+72), Nd7 (+65), Nf6 (+34)
- slav, d4 d5 c4 c6 Nc3 Nf6 Bf4 (1.1%): dxc4 (+24), g6 (-29), e6 (-40)
- slav, d4 d5 e3 c6 Nc3 (1.1%): Nf6 (+1), Bf5 (-5), g6 (-7)
- slav, d4 d5 e3 c6 c3 (1.0%): Bf5 (+9), Nf6 (+8), Nd7 (+2)

## 7. Limits (read before acting)

- **Rating band**: both players 1000-1300 by Lichess rating at the time of the game. He is 1017 blitz (2026-10-16, 31 games, provisional-ish). Opponents above 1300 will play more main lines.
- **Too-rare positions**: by move 5-6 most positions have been reached by fewer than 30 of 316,537 games; there the walk cannot say what opponents play, hence the low-high ranges. The Kaplan-Meier method fills this in by pooling positions by move number but assumes opponents behave the same whether or not the other player follows the course.
- **Scores** are what 1000-1300 players score from those positions, not what he would score. Differences under about 5 points are noise at these sample sizes.
- **His games**: 31 blitz games over 6 days, before he had studied the Caro-Kann course. My engine check of his games uses Stockfish depth 14 on a busy machine; Lichess's own analysis would be the measure for the study.
- **"Rejoins"** uses a simple stand-in for "keep playing your set-up" (an own move the course plays somewhere, most common first); it is an estimate.
- **Not done here**: checking the course text claims (other investigator), and a 1300-1600 band for comparison.

## Files

- `scripts/fetch_sample.py` byte-range sampler (writes no usernames); `scripts/build_positions.py` position statistics; `scripts/export_courses.ts` course trees to JSON; `scripts/analyse_courses.py` walk, gaps, chapter coverage, trees, rejoin test; `scripts/km.py` Kaplan-Meier depth; `scripts/systems.py` White systems and the Slav share; `scripts/my_openings.py` his games; `scripts/eval_at_move12.py` population check; `scripts/engine_check.py` engine check.
- Results: `coverage_all.json`, `coverage_rapid.json`, `depth_in_course_km.json`, `systems_black.json`, `tree_*_all.json`, `tree_*_rapid.json`, `my_games_openings.json` (no opponent names or game links), `population_eval_after_move12.json`, `engine_check.json`.
- Re-run: see `scripts/README.txt`.
