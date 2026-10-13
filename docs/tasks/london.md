# Task: LONDON SYSTEM course (user plays WHITE)

Read `docs/tasks/opening-content-common.md` first. File: `src/data/openings/london.ts`, export `londonCourse` (`id: 'london'`, `side: 'white'`, name `London System`).

The London System is the setup with d4, Nf3, **Bf4**, e3, c3, Bd3, Nbd2, h3 (and Qb3/Qc2 ideas), played against almost anything. Cover (adapt as the engine/database tells you):
1. The **"pyramid" setup** vs the most common Black set-up: 1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3 Bd6 5.Bg3 O-O 6.Nbd2 c5 7.c3 Nc6 8.Bd3 b6 … (several plans: Ne5 and Nxe5/h4 attacks, e4 break, queenside minority ideas), and the move-order versions (1.d4 Nf6 2.Bf4 …, 1.Nf3 d5 2.d4 …, 2.Bf4 vs 2…c5 etc.).
2. Black's **early ...c5** (c5 / Nc6 / Qb6 hitting b2 — how to respond: Qb3, Nbd2 Qxb2?, c3 …), **...Bf5** set-ups (Qb3 and Nh4), **...c6/...Qb6 / ...Bg4** set-ups, **...g6 (King's Indian/Grünfeld-ish)**, **...e6 + ...Bd6 (offering the bishop trade)**, **...Nc6 + ...e5** counter-strikes, **...Bxf4 early trade**, **...Ne4 / ...Nh5 harassing the bishop**, **...Qd6 / ...Nbd7 / ...a6** slower set-ups, and the **anti-London tries** (1…f5, 1…e6/…c5 Benoni-style, 1…d6/…Nf6/…g6, 1…Nf6 2…b6, 1…c5 and 1...Nf6 2...c5, 1…d5 2…Bg4 / early …Nh5).
3. **Plans and middlegame**: where the pieces go, when to castle, the e4 break, attacking the king with h4/Bxh7 patterns where valid, what to do when Black plays …Bxf4 or …Ne4, the Bd3 trap vs the …Bf5 setup and typical mistakes at 1100.
4. Include at least one chapter on **"Black plays something weird — keep calm and develop"** (principles + a few model lines) and one on **typical middlegame plans** (a model game-like line).
The `ecoNames`: use the actual Lichess names such as "Queen's Pawn Game: London System", "Indian Defense: London System"… (verify in the TSV).
