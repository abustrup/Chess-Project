# AsPredicted: paste-ready answers

Made 2026-10-16 by task D1 from `preregistration.md` section 2 (version 2); made again the same day after the final
critique, when answers 2, 5, 7 and 8 changed (the matched-newcomer file binds, and the chances include it). Every
answer below is copied from that section by `make_aspredicted.py`, word for word, so what you time-stamp is exactly
what the repo holds. The only blank is `<COMMIT>` in answer 8, which the lead fills in with the commit that contains
the pre-registration.
Checked again 2026-10-17 by task D1 [verified]: `make_aspredicted.py --check` finds no difference, and a separate
comparison written for this check (whitespace-normalised, answer by answer) finds all 12 blocks equal to section 2,
with every character count right. The 6 pre-registered scripts still match their hashes in 3.9.

## Before you paste (lead)

1. Commit `research/2026-10-16-diagnosis/` (pre-registration, prereg scripts, **and
   `newcomers/newcomers.json` in the same commit**) and push it to `main`. Answer 5 and preregistration.md 3.6 say
   the newcomer file is committed together with the pre-registration and binds; that is only true if it is.
   Check: `git show --stat <that commit>` lists both files, and `shasum -a 256
   research/2026-10-16-diagnosis/newcomers/newcomers.json` starts with c3ca7bbe73779d10. The daily job dates the
   newcomer file by its commit time on `main`, so bring it to `main` through a pull-request merge, or push it the day
   it is committed (a fast-forward keeps the older commit time; `scripts/measure/README.md`, "Known limits").
2. Fill in `<COMMIT>` here with that commit's full hash, from the pre-registration itself:
   `python3 research/2026-10-16-diagnosis/make_aspredicted.py --commit <full hash>`. Check that the six SHA-256 hashes
   in preregistration.md 3.9 still match the files at that commit (`.venv/bin/python -I scripts/measure/verify_prereg.py`).
3. Settled 2026-10-16 (task N1's open decision): the rule stays as written and the newcomer file binds; its drift SD is
   2.35 rather than the 1.6 the version-2 chances assumed, so section 1, answers 5 and 7, and 3.3 now give the chances
   with the committed file (false "worked" 1.6-2.5%, a one-third drop 24-37%, a halving 57-76%). If the lead decides
   instead to leave the file out (non-binding, S6 reported only), section 1, answers 2, 5, 7 and 8, 3.3, 3.6 and 3.7
   must go back to the main-rule numbers first; then make this file again. Whenever section 2 changes, run
   `python3 research/2026-10-16-diagnosis/make_aspredicted.py` (and `--check` to confirm), so the two stay identical.
4. Send Alexander the link to this file on GitHub.

## For Alexander: how to time-stamp (about 10 minutes, before your 11th rated 10+0 game)

1. Open https://aspredicted.org and click **Create** (it signs you in with a link sent to your e-mail address).
2. For each box below, click **Copy** on the grey block (on GitHub it is the small icon at the block's top right)
   and paste it into the box with the same name.
3. Answer 1 has two versions. Use the first if you have played **no** rated 10+0 game yet. If you have played 1 to 10,
   use the second and put the number in place of N. If the form offers only the choice and no text box for question
   1, put that text at the start of answer 8 instead.
4. Submit, then approve it from the e-mail AsPredicted sends you. It stays private until you make it public.
5. Send the link (or the PDF) to Claude, so it can be added to the repo.

Success looks like: an e-mail from AsPredicted confirming the pre-registration, with a number and a link.
[assumed: these steps follow AsPredicted's public description and were not clicked through. Read on its home page on
2026-10-17: a pre-registration "remains private until an author makes it public", coauthors get an e-mail asking for
approval, and the page shows a "Sign in" link; it names no character limit per box. If you do not see **Create**,
click **Sign in** first. The answers below total about 8,700 characters; if a box refuses its text, keep its first
paragraph and leave the reference to the repo in answer 8.]

## Title.

(149 characters)

```text
Does adding a threat-check trainer lower one amateur's Lichess blunder rate at 10+0? A one-player before/after study with external comparison groups.
```

## Author.

(18 characters)

```text
Alexander Bustrup.
```

## Type of study.

(91 characters)

```text
Other: one player, before/after, not randomized, judged against external comparison groups.
```

## 1) Have any data been collected for this study already?

Version A, no rated 10+0 game played yet: tick **No**, then paste (402 characters):

```text
The outcome is measured only on rated 10+0 Lichess games of the account abustrup, and that account had 0 such games when this was written (checked 2026-10-16 at 13:38, 16:10 and 17:01 CEST). His 31 earlier rated blitz games (2026-10-10 to 2026-10-15) and samples of the public Lichess database (September 2026) were analysed to form the hypothesis and set the parameters. They are not part of the test.
```

Version B, 1 to 10 rated 10+0 games played before the time-stamp: tick **It's complicated**, put the number in
place of N, then paste (492 characters). This is only clean while N is 10 or fewer, because games 1-10
are not analysed.

```text
The outcome is measured only on rated 10+0 Lichess games of the account abustrup, and that account had 0 such games when this was written (checked 2026-10-16 at 13:38, 16:10 and 17:01 CEST). His 31 earlier rated blitz games (2026-10-10 to 2026-10-15) and samples of the public Lichess database (September 2026) were analysed to form the hypothesis and set the parameters. They are not part of the test.

N rated 10+0 games were played before this time-stamp. Their results were not looked at.
```

## 2) What's the main question being asked or hypothesis being tested?

(826 characters)

```text
Adding the app's Safety-check trainer to his daily plan lowers his blunders per 100 of his own moves in rated 10+0 Lichess games. The trainer shows his own past mistakes and positions where something must be defended; he picks a move, writes one line on what he checked, may change the move, then sees the verdict; positions return over days and weeks. Compared with his own pre-training baseline, the drop will be larger than game-to-game noise plus the natural change of untrained 950-1250 players and of matched newcomers. Everything else in the app is held fixed from before the baseline to the end of the study, so the contrast is "app with the trainer" versus "the same app without it". Mechanism (key secondary, pre-set test): blunders made while facing a concrete threat fall by a larger share than his other blunders.
```

## 3) Describe the key dependent variable(s) specifying how they will be measured.

(1,224 characters)

```text
Main: Lichess blunders per 100 of his moves = 100 x (his moves judged Blunder) / (all his moves), pooled over the games of a phase. A move is a Blunder by Lichess's game-page rule: the mover's winning chances, 50 + 50 x (2 / (1 + exp(-0.00368208 x cp)) - 1), fall by 15 points or more; Lichess's mate rules apply when a forced mate appears or disappears; no judgement when the move played is the engine's first choice; no centipawn cap. The evaluations come from a frozen engine setting, so no analysis request is needed: Stockfish 19, 250,000 nodes per position, 1 thread, 64 MB hash emptied before every search. On his 6 Lichess-analysed games this matched Lichess's own Blunder labels with precision 0.92 and recall 0.91 (429 moves). This is the game-page count, not the database "??" count (about 20% lower at 10+0). At each look the count is recomputed from an empty cache. Script: research/2026-10-16-diagnosis/prereg/measure.py.

Key secondary: M = log(S2 after / S2 before) - log(S1 after / S1 before), where S1 = blunders per 100 moves made while facing a concrete threat and S2 = blunders per 100 of his other tested moves.

Slow check: his Lichess 10+0 rating change from after game 40 to after games 110 and 160.
```

## 4) How many and which conditions will participants be assigned to?

(1,064 characters)

```text
One player, two phases in time, not randomized. Games are numbered 1, 2, 3 ... in the order played (rated, standard chess, 10+0, account abustrup; games against BOT accounts excluded). Games 1-10: warm-up, not analysed. Games 11-40: baseline (A). Before game 11 the app is put in its study version (narrowed opening courses, a daily plan of a short puzzle block and a rated 10+0 game, Lichess thresholds on the Review page); from then until the deciding look only error fixes and the trainer change it. The trainer becomes available after game 40: the app opens it by itself once Lichess lists his 40th game that meets the filter above (the same filter as measure.py), so U = 40 unless the trainer is deployed later, in which case U = the number of his eligible games started before it was deployed. Games 41-60: wash-in, not analysed. Training phase (B): games 61-110 at look 1 and 61-160 at look 2 (final). If U > 40, games 41 to U are dropped and every later window moves by U - 40. The trainer may be improved during phase B; the measure and this rule may not.
```

## 5) Specify exactly which analyses you will conduct to examine the main question/hypothesis.

(2,344 characters)

```text
R_A, R_B = pooled blunders per 100 moves in the baseline and in the look's training window; D = R_A - R_B (positive = fewer blunders). Sampling variance by the ratio method with games as units: Var(R) = (100/M)^2 x n/(n-1) x sum over games of (b_i - R/100 x m_i)^2, where b_i = blunders, m_i = moves, M = total moves, n = games. Natural ups and downs enter as a fixed tau = 1.6 blunders per 100 moves (SD of an untrained player's change between two periods; block method on 98-145 untrained 950-1250 players). SE = sqrt(Var(R_A) + Var(R_B) + tau^2); Z = D / SE. The mean natural change is taken as 0 (observed +0.0 to +0.34, i.e. no improvement).

Matched newcomers (binding): 100 players built by the fixed rule in the protocol and committed to the public repository together with this pre-registration (research/2026-10-16-diagnosis/newcomers/newcomers.json, SHA-256 c3ca7bbe73779d10fdc23f7533db495c6233f83311cee0d02201ac964516ae8a; c = +0.16, s = 0.37, d = 2.35): Z_N = (D + c) / sqrt(Var(R_A) + Var(R_B) + d^2 + s^2), where c = the newcomers' mean change (training window minus baseline window, negative = they improve by themselves), s = its standard error and d = their drift SD.

Look 1, after game 110: "worked" if Z >= 2.33 (and Z_N >= 2.33 when binding); "no big effect" if D + 2.33 x SE < R_A / 3; otherwise continue.

Look 2, after game 160: "worked" if Z >= 1.70 (and Z_N >= 1.70 when binding); "no big effect" if D + 1.70 x SE < R_A / 3; otherwise "cannot tell".

Simulated chance of a false "worked" across both looks: 1.6-2.5% when tau is right (3.5-4.3% under the main rule alone). Every look also reports D with a 90% range (D +/- 1.645 x SE).

Key secondary, reported with the verdict and never changing it: at the deciding look, "mechanism supported" if M / SE(M) >= 1.645 and S1 fell; SE(M) by the delta method with games as units, including the within-game covariance of the two rates; otherwise "mechanism not supported".

Rating check (reported, does not change the verdict): rating change since game 40 against untrained 950-1250 players over the same number of games (70 games: mean +11, 95th percentile +86; 120 games: +21, +109). Above the 95th percentile = "rating supports"; otherwise "rating does not stand out".

Script: research/2026-10-16-diagnosis/prereg/verdict.py (standard library only, no random numbers).
```

## 6) Describe exactly how outliers will be defined and handled, and your precise rule(s) for excluding observations.

(602 characters)

```text
No game is excluded for its result, length or number of blunders, and no move is dropped. Excluded by definition only: unrated, non-10+0, non-standard or from-position games, games against BOT accounts, aborted or unstarted games, and games in which no move was made at all. A game in which only his opponent moved keeps its number but adds no moves to his rate. Games 1-10 and the wash-in are not analysed. Games Lichess did not analyse are kept (the measure does not need Lichess's analysis). If the engine cannot evaluate a game, it is re-run; if that still fails, the game is excluded and reported.
```

## 7) How many observations will be collected or what will determine sample size?

(690 characters)

```text
Counted in games, not weeks: at most 160 rated 10+0 games (10 warm-up, 30 baseline, 20 wash-in, 100 measured), with one interim look after game 110. If he stops before game 110, the result is "cannot tell (incomplete)". Games after the deciding look are not part of this study. A 30-game baseline was chosen over 50 because the natural ups and downs (tau = 1.6) dominate the error: the total error is about 2.2 blunders per 100 moves with 30 baseline games, 2.1 with 50 and 1.9 with 100; under the main rule alone the simulated chance of "worked" for a one-third drop is 40-52% against 47-60% with 50 (24-37% with 30 games and the newcomer condition); and the trainer opens 20 games sooner.
```

## 8) Anything else you would like to pre-register?

(1,332 characters)

```text
Secondary (reported; they do not change the verdict): K the mechanism test above; S1 blunders per 100 moves made while facing a concrete threat (if he passed, the opponent could gain 15+ winning-chance points and win 2+ points of material or mate); S2 the same rate on his other tested moves; S3 Lichess's own count, if Lichess analysed 20+ games in each phase; S4 his opponents' blunders per 100 of their moves, a negative control expected not to change; S5 the rating check; S6 the matched-newcomer comparison (binding, as in answer 5); S7 blunders per 100 tested moves made while winning (above 75%) with no threat. Descriptive only: training dose (cards attempted per 10 games) and the share of his written lines that name the real threat, from his app backup if he sends it. Sensitivity: tau = 0 and tau = 2.6; per-game medians; adjustment for opponent rating; the main rule without the newcomer condition; the newcomer condition with the drift of the newcomers who began 10+0 in 2025-2026 (d = 1.83). Full protocol, evidence and code: github.com/abustrup/Chess-Project, file research/2026-10-16-diagnosis/preregistration.md at commit <COMMIT>, with SHA-256 hashes of the scripts. All counts and code are public. Opponents' names are not stored; game ids are, so each game can be checked on Lichess, where it is already public.
```

---

Source: `preregistration.md` section 2, SHA-256 of that section's text (from its "## 2." line up to the line before
the next "---") 855aa2cb5d9b294c... (generator: `make_aspredicted.py`, run 2026-10-16 after the final critique; D1's
first version had 2ad980f820e26cc1... with a slice that is not recorded; the same 855aa2cb5d9b294c... on D1's re-check,
2026-10-17). Nothing in this file decides anything; the pre-registration does.
