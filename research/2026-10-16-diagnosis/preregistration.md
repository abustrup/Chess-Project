# Pre-registration: does adding a threat-check trainer cut my blunders at 10+0?

Written 2026-10-16 for Alexander Bustrup (Lichess account abustrup). Version 2, revised by the lead on 2026-10-16
after two independent critiques: the "before" is 30 games (11-40) and the trainer opens after game 40; everything
else that changes what the app teaches ships before game 11, so the trainer is the only difference between the two
phases; "did not work" is renamed "no big effect"; matched newcomers become a binding second condition; the
mechanism gets its own pre-set test; the scripts were updated, re-tested and re-hashed (section 3.9).
Status: final text. Ready to time-stamp once the lead has committed it and filled in `<COMMIT>` in answer 8.
Updated 2026-10-16 after task N1 and the final critique: the matched-newcomer file is built (100 players) and is
committed together with this document, so the newcomer condition binds from the start; the chances in section 1,
answers 5 and 7, 3.3, 3.6 and 3.7 now include it. The rule and the scripts did not change (3.9 is unchanged).
Anything here may still change before the time-stamp. After it, nothing that decides the verdict may change.

Labels: **[verified]** = computed or re-checked on 2026-10-16; **[inferred]** = follows from the evidence, with the
uncertainty given; **[assumed]** = taken as given, not checked.

---

## 1. For Alexander, in plain English

**What "working" means.** After the Safety-check trainer is added to your daily plan, you blunder less often in
rated 10+0 games on Lichess than you did before it, by more than luck and the normal ups and downs of untrained
players at your level can explain. "Blunder" means Lichess's own rule: a move that drops your winning chances by
15 points or more. The count is per 100 of your moves.

**What you do.**
1. Time-stamp this document before your 11th rated 10+0 game (best: before your first). Steps are in section 4.
2. Play rated 10+0 games on Lichess as you normally would. Only rated 10+0 games count. Blitz, casual games and
   other time controls do not.
3. That is all. No "Request computer analysis" clicks and no "Log in with Lichess" are needed. If you do request
   analysis after a game, Lichess's own count is shown next to ours.

**How it runs, counted in games.**

| Your rated 10+0 games | What happens |
|---|---|
| 1-10 | Warm-up, not counted. A new Lichess rating starts at 1500 and needs time to reach your level. |
| 11-40 | Your "before". The app is in its study version, without the trainer. |
| after game 40 | The trainer opens by itself (the app counts your rated 10+0 games on Lichess) and goes first in your daily plan. |
| 41-60 | Training has started but is not measured yet. |
| 61-110 | First check. |
| 61-160 | Final check. |

**The app stays the same apart from the trainer.** Before your 11th rated 10+0 game the app gets its study
version: narrowed opening courses, a daily plan of a short puzzle block plus "play a rated 10+0 game", and
Lichess's blunder thresholds on the Review page. It then stays as it is until the final check, except for two
things: the trainer, which appears after game 40, and error fixes (wrong sentences, crashes). Anything that is not
ready before game 11 waits until the study is over. Pages that do not teach, such as the rating page, may change at
any time. So the before and after differ only by the trainer.

**The three possible answers, and the earliest point for each.**

| Answer | What it means | Earliest | Latest |
|---|---|---|---|
| Worked | Your drop is bigger than luck plus the natural ups and downs of untrained players | after game 110 | after game 160 |
| No big effect | A drop of a third or more is ruled out. A smaller real drop is still possible. | after game 110 | after game 160 |
| Cannot tell | Anything in between | after game 160 | after game 160 |

"No big effect" does not mean "no effect": a real drop of about 15% gets this answer about 1 time in 6.

At 2 games a day the trainer opens in about 3 weeks, game 110 is about 8 weeks away and game 160 about 11.5 weeks.
At 4 a day: about 1.5, 4 and 6 weeks. [inferred from an assumed pace; you have not said how many games a week you
play]

**How strict it is.** From 4,000 simulated players per case, using the exact rule below with the matched
newcomers included [inferred: model results]:
- If the trainer does nothing, it says "worked" about 2 times in 100.
- If the trainer halves your blunders, it says "worked" 57-76 times in 100.
- A one-third cut: 24-37 times in 100. A one-quarter cut: 13-20 times in 100. Smaller cuts mostly end as
  "cannot tell".

The bar is high for a reason. One game tells little (blunders per 100 moves jump around by about 7.5 from game to
game), and even untrained players at your level drift up or down by about 1.6 per 100 moves from one period to the
next; players new to Lichess, like you, by about 2.3. More games cannot remove that drift. A realistic effect of the
trainer may be around a fifth fewer blunders, so "cannot tell" is a likely result even if it helps. Every answer
comes with the size of the drop and its range, so you still learn how big it probably was.

**A second, sharper check: where the drop comes from.** The trainer targets positions where your opponent has a
concrete threat. If it works the way it should, your blunders in those positions fall by a larger share than your
other blunders. This is tested separately with its own pre-set rule (the "mechanism" check). It never changes the
main answer, but it is much more sensitive: if the trainer halves only your blunders under threat, the main measure
says "worked" 8-11 times in 100, while the mechanism check catches it 76-86 times in 100. With no effect it gives a
false alarm about 5 times in 100 [inferred: model results].

**If you are simply still learning.** You are new to Lichess and to 10+0, so you may improve by yourself. If you
improved by 2 blunders per 100 moves on your own, the main rule alone would say "worked" 12-20 times in 100 with no
help from the trainer. So 100 matched Lichess newcomers were built from public games: players who, like you, started
10+0 soon after opening their account. From their games 11-40 to their games 61-160 they did not improve on average
(+0.16 per 100 moves, standard error 0.37), but each of them wandered more than established players (about 2.3
instead of 1.6). Their file is committed together with this document, so "worked" also has to survive subtracting
their change and their larger wander. That is already in the chances above. If you still improved by 2 per 100 by
yourself (they did not), the rule would say "worked" 4-11 times in 100 [inferred: model results].

**The slow check: your rating.** Your Lichess 10+0 rating gain after game 40 is compared with 950-1250 players who
did not train, over the same number of games. They gain about +11 by your game 110 and +21 by your game 160. Your
rating "supports" the result only if you gain more than 95 in 100 of them: +86 by game 110, +109 by game 160. Your
chess.com rating is not used: the account has 3 games from March 2020 and no current rating [verified].

**Who judges, if not you or me.**
1. The rule is time-stamped before the data exist.
2. The count follows Lichess's published rule on a frozen engine setting (it matched Lichess's own blunder labels
   on 91-92% of blunders in your 6 analysed games), so anyone can re-run it from the repo and your public games.
3. At each check the whole count is redone from scratch, so nothing saved along the way can tilt it.
4. The bar comes from how similar players' blunder rates moved without training (two groups, 187 players), plus
   100 matched newcomers, committed with this document.
5. Lichess's own count (where it exists) and your rating against similar players are reported next to it.

---

## 2. AsPredicted answers (copy into the matching boxes)

**Title.** Does adding a threat-check trainer lower one amateur's Lichess blunder rate at 10+0? A one-player
before/after study with external comparison groups.

**Author.** Alexander Bustrup.

**Type of study.** Other: one player, before/after, not randomized, judged against external comparison groups.

**1) Have any data been collected for this study already?**
No. The outcome is measured only on rated 10+0 Lichess games of the account abustrup, and that account had 0 such
games when this was written (checked 2026-10-16 at 13:38, 16:10 and 17:01 CEST). His 31 earlier rated blitz games
(2026-10-10 to 2026-10-15) and samples of the public Lichess database (September 2026) were analysed to form the
hypothesis and set the parameters. They are not part of the test.
*(If you have played rated 10+0 games before time-stamping, pick "It's complicated" instead and add: "N rated
10+0 games were played before this time-stamp. Their results were not looked at." This is only clean while N is
10 or fewer, because games 1-10 are not analysed.)*

**2) What's the main question being asked or hypothesis being tested?**
Adding the app's Safety-check trainer to his daily plan lowers his blunders per 100 of his own moves in rated 10+0
Lichess games. The trainer shows his own past mistakes and positions where something must be defended; he picks a
move, writes one line on what he checked, may change the move, then sees the verdict; positions return over days
and weeks. Compared with his own pre-training baseline, the drop will be larger than game-to-game noise plus the
natural change of untrained 950-1250 players and of matched newcomers. Everything else in
the app is held fixed from before the baseline to the end of the study, so the contrast is "app with the trainer"
versus "the same app without it". Mechanism (key secondary, pre-set test): blunders made while facing a concrete
threat fall by a larger share than his other blunders.

**3) Describe the key dependent variable(s) specifying how they will be measured.**
Main: Lichess blunders per 100 of his moves = 100 x (his moves judged Blunder) / (all his moves), pooled over the
games of a phase. A move is a Blunder by Lichess's game-page rule: the mover's winning chances,
50 + 50 x (2 / (1 + exp(-0.00368208 x cp)) - 1), fall by 15 points or more; Lichess's mate rules apply when a
forced mate appears or disappears; no judgement when the move played is the engine's first choice; no centipawn cap.
The evaluations come from a frozen engine setting, so no analysis request is needed: Stockfish 19, 250,000 nodes per
position, 1 thread, 64 MB hash emptied before every search. On his 6 Lichess-analysed games this matched Lichess's
own Blunder labels with precision 0.92 and recall 0.91 (429 moves). This is the game-page count, not the database
"??" count (about 20% lower at 10+0). At each look the count is recomputed from an empty cache. Script:
research/2026-10-16-diagnosis/prereg/measure.py.
Key secondary: M = log(S2 after / S2 before) - log(S1 after / S1 before), where S1 = blunders per 100 moves made
while facing a concrete threat and S2 = blunders per 100 of his other tested moves.
Slow check: his Lichess 10+0 rating change from after game 40 to after games 110 and 160.

**4) How many and which conditions will participants be assigned to?**
One player, two phases in time, not randomized. Games are numbered 1, 2, 3 ... in the order played (rated, standard
chess, 10+0, account abustrup; games against BOT accounts excluded). Games 1-10: warm-up, not analysed. Games
11-40: baseline (A). Before game 11 the app is put in its study version (narrowed opening courses, a daily plan of a
short puzzle block and a rated 10+0 game, Lichess thresholds on the Review page); from then until the deciding look
only error fixes and the trainer change it. The trainer becomes available after game 40: the app opens it by itself
once Lichess lists his 40th game that meets the filter above (the same filter as measure.py), so U = 40 unless the
trainer is deployed later, in which case U = the number of his eligible games started before it was deployed.
Games 41-60: wash-in, not analysed. Training phase (B): games 61-110 at look 1 and 61-160 at look 2 (final). If
U > 40, games 41 to U are dropped and every later window moves by U - 40. The trainer may be improved during phase
B; the measure and this rule may not.

**5) Specify exactly which analyses you will conduct to examine the main question/hypothesis.**
R_A, R_B = pooled blunders per 100 moves in the baseline and in the look's training window; D = R_A - R_B
(positive = fewer blunders). Sampling variance by the ratio method with games as units:
Var(R) = (100/M)^2 x n/(n-1) x sum over games of (b_i - R/100 x m_i)^2, where b_i = blunders, m_i = moves,
M = total moves, n = games. Natural ups and downs enter as a fixed tau = 1.6 blunders per 100 moves (SD of an
untrained player's change between two periods; block method on 98-145 untrained 950-1250 players). SE = sqrt(Var(R_A) +
Var(R_B) + tau^2); Z = D / SE. The mean natural change is taken as 0 (observed +0.0 to +0.34, i.e. no improvement).
Matched newcomers (binding): 100 players built by the fixed rule in the protocol and committed to the public
repository together with this pre-registration (research/2026-10-16-diagnosis/newcomers/newcomers.json, SHA-256
c3ca7bbe73779d10fdc23f7533db495c6233f83311cee0d02201ac964516ae8a; c = +0.16, s = 0.37, d = 2.35):
Z_N = (D + c) / sqrt(Var(R_A) + Var(R_B) + d^2 + s^2), where c = the newcomers' mean change (training window minus
baseline window, negative = they improve by themselves), s = its standard error and d = their drift SD.
Look 1, after game 110: "worked" if Z >= 2.33 (and Z_N >= 2.33 when binding); "no big effect" if
D + 2.33 x SE < R_A / 3; otherwise continue.
Look 2, after game 160: "worked" if Z >= 1.70 (and Z_N >= 1.70 when binding); "no big effect" if
D + 1.70 x SE < R_A / 3; otherwise "cannot tell".
Simulated chance of a false "worked" across both looks: 1.6-2.5% when tau is right (3.5-4.3% under the main rule
alone). Every look also reports D with a 90% range (D +/- 1.645 x SE).
Key secondary, reported with the verdict and never changing it: at the deciding look, "mechanism supported" if
M / SE(M) >= 1.645 and S1 fell; SE(M) by the delta method with games as units, including the within-game covariance
of the two rates; otherwise "mechanism not supported".
Rating check (reported, does not change the verdict): rating change since game 40 against untrained 950-1250
players over the same number of games (70 games: mean +11, 95th percentile +86; 120 games: +21, +109). Above the
95th percentile = "rating supports"; otherwise "rating does not stand out".
Script: research/2026-10-16-diagnosis/prereg/verdict.py (standard library only, no random numbers).

**6) Describe exactly how outliers will be defined and handled, and your precise rule(s) for excluding observations.**
No game is excluded for its result, length or number of blunders, and no move is dropped. Excluded by definition
only: unrated, non-10+0, non-standard or from-position games, games against BOT accounts, aborted or unstarted
games, and games in which no move was made at all. A game in which only his opponent moved keeps its number but adds
no moves to his rate. Games 1-10 and the wash-in are not analysed. Games Lichess did not analyse are kept (the
measure does not need Lichess's analysis). If the engine cannot evaluate a game, it is re-run; if that still fails,
the game is excluded and reported.

**7) How many observations will be collected or what will determine sample size?**
Counted in games, not weeks: at most 160 rated 10+0 games (10 warm-up, 30 baseline, 20 wash-in, 100 measured),
with one interim look after game 110. If he stops before game 110, the result is "cannot tell (incomplete)". Games
after the deciding look are not part of this study. A 30-game baseline was chosen over 50 because the natural ups
and downs (tau = 1.6) dominate the error: the total error is about 2.2 blunders per 100 moves with 30 baseline
games, 2.1 with 50 and 1.9 with 100; under the main rule alone the simulated chance of "worked" for a one-third drop
is 40-52% against 47-60% with 50 (24-37% with 30 games and the newcomer condition); and the trainer opens 20 games
sooner.

**8) Anything else you would like to pre-register?**
Secondary (reported; they do not change the verdict): K the mechanism test above; S1 blunders per 100 moves made
while facing a concrete threat (if he passed, the opponent could gain 15+ winning-chance points and win 2+ points of
material or mate); S2 the same rate on his other tested moves; S3 Lichess's own count, if Lichess analysed 20+
games in each phase; S4 his opponents' blunders per 100 of their moves, a negative control expected not to change;
S5 the rating check; S6 the matched-newcomer comparison (binding, as in answer 5); S7 blunders per 100 tested
moves made while winning (above 75%) with no threat.
Descriptive only: training dose (cards attempted per 10 games) and the share of his written lines that name the
real threat, from his app backup if he sends it. Sensitivity: tau = 0 and tau = 2.6; per-game medians; adjustment
for opponent rating; the main rule without the newcomer condition; the newcomer condition with the drift of the
newcomers who began 10+0 in 2025-2026 (d = 1.83). Full protocol, evidence and code:
github.com/abustrup/Chess-Project, file research/2026-10-16-diagnosis/preregistration.md at commit <COMMIT>, with
SHA-256 hashes of the scripts. All counts and code are public. Opponents' names are not stored; game ids are, so
each game can be checked on Lichess, where it is already public.

---

## 3. Protocol details, for anyone checking the result

### 3.1 The measuring instrument

| Part | What | Status |
|---|---|---|
| Rule | Lichess game-page rule (lila Advice): winning-chance drop of 0.3 (15 points) = Blunder, 0.2 Mistake, 0.1 Inaccuracy; mate rules for forced mates; no judgement for the engine's first choice; first position counted as +0.15. File `prereg/lichess_rule.py`, an identical copy of `my-games/scripts/lichess_rule.py`. | [verified] reproduces 428 of 428 Lichess labels on his 6 analysed games from Lichess's own evaluations; an independent re-implementation got 422 of 422. A +-1000 centipawn cap gets 420 of 422, so no cap is used. The population study's cap-at-1000 replication matched 99.4% of 22,034 player-games; the two versions differ on about 1 move label in 400 [inferred]. |
| Engine | Stockfish 19, 250,000 nodes per position, Threads 1, Hash 64 MB, new game (empty hash) before every search; the same setting for the threat probe. | [verified] precision 0.92 / recall 0.91 against Lichess's own Blunder labels on 429 moves (6 games); 1,000,000 nodes was no better within noise. On his own moves: 34 ours vs 32 Lichess, 31 shared. On his opponents' moves this setting finds slightly fewer blunders than Lichess (29 vs 32 in the same 6 games), which matters only for S4. |
| Reproducibility | Same position + same setting = same result. | [verified] on this Mac: 117 of 117 positions and 45 of 45 threat probes identical on a fresh re-search (2026-10-16), and `check_instrument.py --engine` passed again after the version-2 edit. A Linux GitHub runner is [assumed] identical; `check_instrument.py --engine` tests it before the first measurement. |
| Pipeline | `prereg/measure.py`: public Lichess export (no login, honest User-Agent), filter, engine pass with a cache, one CSV row per game. Version 2 adds two descriptive columns (S7) and changes nothing else. | [verified] reproduces the my-games diagnosis exactly on his 31 blitz games: 111 of 891 blunders, threat test 39 of 126 and 63 of 622, winning with no threat 19 of 88, opponents 86 of 897, every game equal. The live export answered (0 rapid games) on 2026-10-16 17:01 CEST. |
| Fixture check | `prereg/check_instrument.py` re-checks the numbers above (1 s), and with `--engine` re-searches 2 games (about 75 s). | [verified] passes. Must pass before every measurement run. |
| Verdict | `prereg/verdict.py`, standard library only, deterministic; `--selftest` covers the rule, the windows, the newcomer condition and the mechanism test. | [verified] self-test passes; dry runs on his blitz rows (31 games, and the same rows repeated to 160 games) work end to end. |

The count is our replication of Lichess's rule, not Lichess's own count, because Lichess analyses a game only when
someone clicks for it (6 of his 31 games so far) and no public API can request it [verified by the trainer-design
investigation, Lichess OpenAPI v2.0.176]. Lichess's own count is reported as S3 wherever it exists. If Lichess
changes its rule or engine later, the frozen replication stays the measure, so the before and after are judged by
the same instrument.

### 3.2 Why these numbers (evidence the design rests on)

| Parameter | Used | Evidence (2026-10-16 investigations, independently re-checked) | Label |
|---|---|---|---|
| His starting point | no baseline exists | 0 rated rapid games; 31 rated blitz games, blitz 1017 (RD 64); 12.46 blunders per 100 moves in blitz (111 of 891; game bootstrap 9.4-16.0) | [verified] |
| Population rate, 10+0, 950-1250 | context only | 9.31 (9.19-9.44), independent sample 9.48 (9.30-9.64); 950-1050: 9.84-9.95 | [verified] |
| Game-to-game spread within one player | planning value 7.46 | 174 players, 10,745 analysed 10+0 games: within-player SD 7.46 (7.27-7.63); consecutive games uncorrelated | [verified] |
| Natural mean change | 0 | untrained 950-1250 players, after minus before: +0.0 (-0.6 to +0.55) at 50 games, +0.03 at 100, +0.34 (-0.40 to +1.05) at 150 (n = 85, 75, 59 players) | [verified] |
| tau (natural ups and downs between periods) | 1.6 | block method, both comparison groups: 1.66, 1.60, 1.57 for blocks 50, 100, 150 games apart (upper 95% bounds 2.3-2.6). An earlier estimate of 2.45 did not replicate (fresh group 1.1) | [verified] numbers; [inferred] choice |
| Opponent strength | no adjustment in the main rule | at 10+0, 950-1250, a 100-point stronger opponent changes the blunder rate by a factor of 1.006 (95% 0.994-1.018); Poisson model with own rating, 17,278 analysed player-games with the opponent within 300 points, September 2026, 200 cluster-bootstrap draws over the 96 time slices; binned rates are flat at 9.3-9.5 from 300 below to 300 above. So his early, inflated rating (stronger opponents in the first baseline games) can bias the drop by about 0.1-0.4 per 100 moves at most | [verified] estimate; [inferred] consequence |
| Rating comparison | interpolated | untrained 10+0 players: +6 (SD 50, 95th percentile +74, n = 126) after 50 games; +17.5 (57, +104, n = 100) after 100; +25.8 (65, +115, n = 78) after 150 | [verified] |
| Analysed-only bias (matters for S3, S6) | none assumed | engine re-checks of analysed vs not-analysed 10+0 games: ratio 0.99 (0.84-1.17) and 0.92 (0.74-1.13); pooled about 0.96 (0.84-1.10) | [inferred] |
| Mechanism (K, S1) | prediction | in his blitz games he blundered on 31% of moves facing a concrete threat (39 of 126) vs his opponents' 15% (22 of 144); difference about +1.5 to +29 points depending on definition and engine; in balanced positions (25-75%) 35% (33 of 93) vs 16% (13 of 79); without a threat 10% vs 8% | [inferred] |
| S7 | description | winning (above 75%) with nothing threatened: 22% (19 of 88) vs his opponents' 9% (22 of 240), game bootstrap difference +0.5 to +31 points; 19 blunders spread over 12 games | [inferred, weak] |

Caveat on the comparison players [assumed]: they analyse often and play a lot, and "no training" is not verified.
They are established players, not newcomers (see 3.6).

### 3.3 How the rule behaves (operating characteristics)

`prereg/power_sim.py` (seed 20261016, 4,000 simulated players per row, Monte Carlo error under 1 point) calls
`verdict.py` unchanged. Simulated games: own moves per game with mean 30.5; blunders per game with the observed
spread (per-game SD 7.45 at a rate of 9.5, 9.07 at 12.5, close to his blitz 9.19); the training effect phased in over
the 20 wash-in games. Untrained rate 9.8 (population 950-1050) or 12.5 (his blitz rate). [inferred: model results]

**With the binding newcomer condition** (the committed `newcomers/newcomers.json`: 100 players, c = +0.16, s = 0.37,
d = 2.35), natural ups and downs as estimated (tau = 1.6), 4,000 simulated players per row. These rows run
power_sim.py's own simulation code and verdict.py unchanged, with the committed file passed as the newcomer input
(`newcomers/power/power_with_newcomers.py`, results in `power_with_newcomers.json`, made 2026-10-16) [inferred: model
results]:

| True drop | Rate 9.8: worked | no big effect | cannot tell | Rate 12.5: worked | no big effect | cannot tell |
|---|---|---|---|---|---|---|
| none | 1.6% | 40% | 59% | 2.5% | 53% | 45% |
| 15% | 5.8% | 14% | 81% | 8.5% | 18% | 73% |
| 25% | 13% | 4.3% | 83% | 20% | 5.4% | 74% |
| one third | 24% | 1.1% | 75% | 37% | 1.3% | 62% |
| half | 57% | 0% | 43% | 76% | 0% | 24% |

"Worked" already at game 110: 5.5-11 in 100 with a one-third drop, 22-40 in 100 with a halving. With tau = 0: false
"worked" 0.2-0.5%, a one-third drop 17-35%, a halving 58-81%. With tau = 2.6: 5.5-5.7%, 29-39% and 55-71%; false "no
big effect" with a one-third drop 3.7-4.2%. A slowly wandering rate (AR(1), rate 9.8): 1.7%, 24% and 55%.

**The main rule alone** (what the verdict would be without the newcomer file; reported as a sensitivity), natural
ups and downs as estimated (tau = 1.6):

| True drop | Rate 9.8: worked | no big effect | cannot tell | Rate 12.5: worked | no big effect | cannot tell |
|---|---|---|---|---|---|---|
| none | 4.3% | 40% | 56% | 3.5% | 52% | 45% |
| 15% | 13% | 14% | 73% | 15% | 19% | 66% |
| 25% | 26% | 4% | 70% | 32% | 6% | 62% |
| one third | 40% | 1.0% | 59% | 52% | 1.1% | 47% |
| half | 76% | 0% | 24% | 89% | 0% | 11% |

"Worked" already at game 110: 16-24 in 100 with a one-third drop, 45-64 in 100 with a halving.

If the natural ups and downs are smaller or larger than estimated:

| | tau = 0 | tau = 2.6 |
|---|---|---|
| false "worked" with no effect | 0.6-0.9% | 8.7-9.5% |
| "worked" with a one-third drop | 38-53% | 42-53% |
| "worked" with a halving | 83-94% | 70-83% |
| false "no big effect" with a one-third drop | 0-0.1% | 3.8-4.3% |

A slowly wandering rate (AR(1) per game) instead of a one-time shift gives the same picture: 4.0% false "worked",
41% at a one-third drop, 75% at a halving.

Newcomer learning (rate 9.8, no training): if he would improve by himself by 1 blunder per 100 moves between the
periods, the main rule alone says "worked" 2.8% (tau 0) to 9.5% (tau 1.6) of the time; with 2 per 100, 12-19.5%.
The committed newcomers did not improve on average (+0.16), so their condition subtracts no learning; only their
larger drift guards against it: with the committed file, 0.9-4.9% for 1 per 100 and 3.8-10.7% for 2 per 100. Had the
newcomers measured such learning (planning case of version 2: mean change -2, SE 0.5, drift SD 1.6, 60 players), false
"worked" would fall to 3.5-3.9%. The condition's cost depends on the newcomers' drift: a one-third drop gives
"worked" 39-51% with drift SD 1.6 (against 40-52% without the condition), 24-37% with the committed 2.35, and 16-28%
with 2.6.

Mechanism test (2,000 simulated players per row; his blitz shares: 84% of moves tested, 16.8% of tested moves face a
threat, blunder chance 31% on those and 10.1% on other tested moves):

| Scenario | "mechanism supported" | main rule "worked", alone | with the newcomer condition |
|---|---|---|---|
| no effect | 5.3-5.6% | 3.6-4.2% | 1.8-2.2% |
| all blunders fall by the same 20% | 5.1-5.2% | 18-25% | 8.3-13% |
| threat blunders -30%, others unchanged | 38-43% | 9-11% | 3.3-5.3% |
| threat blunders halved (closes his blitz gap), others unchanged | 76-86% | 14-19% | 8.4-11% |
| threat blunders halved, others -15% | 57-67% | 28-37% | 16-24% |

(The last column: `newcomers/power/mechanism_with_newcomers.py`, 2,000 simulated players per row, 2026-10-16; its
own "mechanism supported" shares differ from the first column by at most 2.5 points, about the simulation error of
2,000 players per row.)

What the numbers mean in practice [inferred]: with the newcomer condition, even halving his blunders gives
"worked" only 57-76 times in 100 (an 80% chance needs a drop of more than half). A realistic effect of the trainer
may be smaller: closing his blitz gap on threatened moves (31% down to his opponents'
15%, on 126 of his 891 moves) would remove about 2.2 blunders per 100 moves, about a fifth (18%) of his blitz rate.
So "cannot tell" is a likely main outcome even if the trainer helps, and the mechanism test is where a targeted
effect is most likely to show. The 90% range on the drop is reported in every case.

### 3.4 Designs considered and why this one

| Design | Verdict | Reason |
|---|---|---|
| Baseline only, ignoring natural ups and downs | rejected | treats period-to-period drift as training: false "worked" about 14% instead of 5% [inferred, normal approximation] |
| Comparison group only (train from game 11, compare with the 950-1050 population rate 9.84) | rejected | its errors depend on his unknown untrained level (between-player SD 1.32): a one-third drop is detected 93% of the time if his untrained rate is 9.8 but 9% if it is 12.5, as his blitz suggests; if his natural rate were 8.0 it would say "worked" 19% of the time with no effect [inferred, normal approximation, 100 games] |
| **Baseline plus comparison groups (chosen)** | chosen | his own before measures his level; untrained players supply the drift (tau) and the natural change; matched newcomers guard against his own learning |
| Unlock everything new at once after the baseline (trainer, courses, plan, Review labels) | rejected | a "worked" could not be pinned on the trainer, and taking puzzles out of the plan at the same moment could hide its effect; so all other changes ship before game 11 |
| 50-game baseline (version 1 of this plan) | rejected | "worked" at a one-third drop 47-60% against 40-52% now, but the trainer opens 20 games later and the study ends at game 180, not 160 [inferred, version-1 and version-2 simulations] |
| His 31 blitz games as the "before" | context only | different time control, provisional rating, first week on Lichess, 31 games |
| Randomized unlock (a random game between 41 and 80, randomization test) | rejected | valid without assumptions about drift, but simulated power only 8-12% for drops of a third to a half (version-1 simulation, 2,000 players each) |
| A coin flip before each game deciding on a 5-minute warm-up | rejected | free of drift, but measures a different short-term effect, needs his clicks before every game, and detects only about 3.7 per 100 moves (about 40%) with 100 linked games [inferred] |
| Lichess's own count as the main measure | rejected | needs a click after every game (6 of 31 so far); partial clicking could be selective. Kept as S3 |
| Rating as the main measure | rejected | noise SD about 60 points over 120 games; needs +109 to stand out. Kept as the slow check |
| chess.com rating | not possible | 3 games from March 2020, RD above 300, no current rating [verified] |

### 3.5 Secondary and sensitivity analyses (all reported, none changes the verdict)

All use the baseline and the training window of the deciding look. Ranges are 90%, sampling error only, unless said.
- **K Mechanism (pre-set test).** M = log(S2_B / S2_A) - log(S1_B / S1_A). "Mechanism supported" if M / SE(M) >=
  1.645 and S1 fell. SE by the delta method with games as units, including the covariance of S1 and S2 within a
  game. On the relative scale, a drop of the same share in all his blunders gives M near 0, so a general
  improvement is not mistaken for a targeted one (simulated 5.1-5.2% "supported"). Changes in the opponent pool or
  a common drift cancel.
- **S1 Threat moves.** Blunders per 100 of his moves made while facing a concrete threat. Threat test (same as the
  diagnosis): before his move, if he were to pass, the engine's best line for the opponent (250,000 nodes) gains 15+
  winning-chance points and wins 2+ points of material (median of the last three plies of a 6-ply line) or mates.
  Moves in check and the game's first move are not tested.
- **S2 Other tested moves.** Blunders per 100 tested moves without such a threat.
- **S3 Lichess's own count**, on games Lichess analysed, if there are 20+ such games in each phase. Plus an agreement
  table (Lichess's count vs ours) over all analysed games.
- **S4 Negative control.** His opponents' blunders per 100 of their moves. Expected: no change. A fall similar to his
  would point to something other than his play (pairing pool, instrument).
- **S5 Rating.** As in answer 5, plus score minus Elo-expected score per phase.
- **S6 Matched newcomers.** See 3.6.
- **S7 Winning, no threat.** Blunders per 100 tested moves made with his win chance above 75% and nothing
  threatened (in his blitz games 22% against his opponents' 9%).
- **Baseline trend.** Slope of his per-game rate over games 11-40; flagged if its 90% range lies wholly below 0
  (he was still improving by himself).
- **Sensitivity.** Verdict with tau = 0 and tau = 2.6; the main rule without the newcomer condition; the newcomer
  condition with d = 1.83 (the 70 committed newcomers who began 10+0 in 2025-2026, `newcomers/drift_check.json`);
  per-game median rates; a Poisson model of blunders with log(moves) offset, phase and opponent rating (robust
  standard errors).
- **Descriptive.** Mistake categories, clock use, training dose (cards attempted per 10 rated 10+0 games) and the
  share of his written lines that name the real threat (a line counts if it names the threatening piece, its square
  or the threatened piece), from his app backup if he sends it at games 110 and 160. Not tested.

### 3.6 S6: matched newcomers (built from public data by a fixed rule)

He is new to Lichess (account created 2026-10-10) and to 10+0, so he may improve by himself faster than the
established comparison players. A newcomer group answers that without his clicks:
1. Candidates: players rated 900-1300 in rated 10+0 games of a sample of the September 2026 Lichess database (use
   older months if fewer than 30 qualify).
2. Keep players whose Lichess account was created at most 60 days before their first rated 10+0 game and who have at
   least 160 rated 10+0 games.
3. For each, number their rated 10+0 games as for him and take Lichess's own blunder count on the games Lichess
   analysed. Keep players with 5+ analysed games in games 11-40 and 10+ in games 61-160. Target 60 players, stop at
   100.
4. c = mean change (rate in games 61-160 minus rate in games 11-40) with a player bootstrap standard error s;
   d = drift SD by the block method (variance of the change minus sampling variance, floored at 0).
5. Write `newcomers/newcomers.json` with players, mean_change, mean_change_se and drift_sd, and commit it.
6. Binding rule: if that commit is in the public repository before the start time of his game U+1 (game 41 when U =
   40) and holds 30+ players, the daily job passes it to `verdict.py --newcomers`, and "worked" also needs Z_N to
   clear the same threshold (answer 5). Otherwise the main rule alone decides and S6 is reported with the caveat
   "matched newcomers were not ready in time". The file may not change after that time.
It uses only other players' public games, so it can be built without seeing his training data. Usernames and game
ids stay out of the repo.

**Built 2026-10-16 (task N1), before any of his rated 10+0 games:** 100 players (the stop of step 3), c = +0.16
(s = 0.37; 90% range -0.45 to +0.78), d = 2.35 (bootstrap upper 95% bound 2.95). The file is committed together with
this pre-registration, at the same commit (`<COMMIT>` in answer 8), SHA-256
c3ca7bbe73779d10fdc23f7533db495c6233f83311cee0d02201ac964516ae8a. So the condition binds from the time-stamp on,
whatever happens later: that version, and no other, is the one that binds. Changing or removing the file afterwards
is not allowed; if it happens anyway, the daily job's record (`newcomers` in status.json: commit, time, players) and
the final report name it as a deviation (3.8), and the verdict is reported both with this version and as the job
computed it. Evidence, recomputation and a privacy scan: `newcomers/README.md`.

Known limits of this group [inferred]: (a) its blunders are Lichess's own count on the games its players asked
Lichess to analyse (median 10 of 30 games in 11-40 and 14 of 100 in 61-160), not our engine count of every game;
which games get analysed is chosen by the players, and that selection can add variance between the two windows that
the ratio-method sampling variance does not remove, so d = 2.35 may overstate the true drift. A larger d makes
"worked" harder, never easier, so this errs on the side of a false "no". The 70 players who began 10+0 in 2025-2026
give d = 1.83 (reported as a sensitivity, 3.5). (b) Shuffling each player's games removes the drift entirely: then
the same estimator gives d of at most 1.76 in 95 of 100 shuffles against 2.35 here (`newcomers/drift_check.json`), so
the drift is not only noise. (c) They are not trained and not him; if he learns faster than they do, his own learning
can still read as a drop (3.3: 4-11% false "worked" with 2 per 100 of learning).

### 3.7 Threats to validity

| Threat | How it is handled | What remains |
|---|---|---|
| He is still learning as a newcomer | binding newcomer condition (committed with this document), baseline trend flag, mechanism test (K) | the newcomers did not improve on average, so the condition guards only through their larger drift: 4-11% false "worked" if he improves by 2 per 100 by himself; see 3.3 |
| Early rating overshoot: his blitz rating went 1500, 1215 after one game, 1234 before game 11, 1017 after game 31 | 10-game warm-up; opponent strength barely moves the blunder rate at this level (factor 1.006 per 100 points); opponent-adjusted sensitivity; rating check starts at game 40 | about 0.1-0.4 per 100 moves of bias toward "worked" at most [inferred] |
| Several app changes at once | every change except the trainer ships before game 11 or after the deciding look; error fixes allowed | small |
| He knows when training starts (effort, expectations) | cannot be blinded; S4 and K | real, unmeasured |
| When he chooses to play | "play as normal"; every rated 10+0 game counts | cannot be enforced |
| Instrument drift (engine, code, machine, Lichess rule changes) | frozen setting, file hashes, fixture check before every run, full fresh recount at each look | none if the checks pass |
| An edited or corrupted saved row or cache | the verdict uses only the fresh recount at each look; differences from the daily rows are reported | none |
| The trainer reaches him early | the trainer is locked until game 40; an unlock before 30 baseline games makes the study invalid | small |
| He trains little | intention to treat: every game after the unlock counts; dose reported if he sends his backup | the verdict is about the trainer as he uses it |
| Many outcomes | only the main measure decides; the mechanism test is labelled key secondary with its own pre-set rule; the rest are secondary or descriptive | none |

### 3.8 Deviations

The decision rule and every value in `DESIGN` (verdict.py) are fixed at the time-stamp. Anything else that goes
differently is reported with its reason in the final report: a late unlock (handled by `--unlock-after`), a gap in
the daily job (games stay on Lichess, so they are measured later), a Lichess API change, a study-version change that
missed the game-11 deadline and was held back, or a different Stockfish 19 build (allowed only after
`check_instrument.py --engine` passes on it).

### 3.9 Files and how to re-run

| File (research/2026-10-16-diagnosis/prereg/) | SHA-256 |
|---|---|
| lichess_rule.py | dee1754b2db1cfee08be8ae017edd969e2b8f56c937e91eac7b5de5a651a871b |
| measure.py | 8e6c1c25f5878bc4ca1b3ffc23c0bcc1bedfd2988e387117b0dae8386a6dcb99 |
| verdict.py | 916f3d67d278d88a1f2f958bc75a52c9f2171ac75b7cec5b1bf67543d3d17140 |
| check_instrument.py | 4b5e000136eb61fa99c7723f2191227e08a9c85fded2c03d4f1dda4ad8fca797 |
| power_sim.py | 8bf157002bc28697fc3b18279f76522fcf53207a692e8ba9b4a403dd3fdc865d |
| power_results.json | cb45ec0a5fc5990a83cc35b7365f1f2693ce1642da4a5ba7074a5ade64047876 |

From the repo root (Python venv with python-chess 1.11, Stockfish 19):
```
.venv/bin/python -I research/2026-10-16-diagnosis/prereg/check_instrument.py --engine
.venv/bin/python -I research/2026-10-16-diagnosis/prereg/measure.py --out games.csv --cache evals.jsonl
.venv/bin/python -I research/2026-10-16-diagnosis/prereg/verdict.py games.csv --json verdict.json [--newcomers newcomers.json]
.venv/bin/python -I research/2026-10-16-diagnosis/prereg/power_sim.py power.json 4000     # several minutes on a shared Mac
```
A daily GitHub Actions job (free on this public repository) checks the SHA-256 hashes above, runs the first three
commands and commits the per-game rows, so nobody has to run anything by hand. At games 110 and 160 it reruns
`measure.py` on every eligible game with an empty cache; the verdict is computed from those fresh rows, and any
difference from the daily rows is reported next to it. Every game also stays on Lichess, so the verdict can be
recomputed from public data at any time. If the job's Linux Stockfish 19 build fails `check_instrument.py --engine`,
the verdict is computed on a build that passes it (3.8). Opponents' usernames are removed from every committed file.

---

## 4. Time-stamping (for Alexander)

Do this once the lead has committed this file and filled in `<COMMIT>` in answer 8.
1. Open https://aspredicted.org and start a new pre-registration (it signs you in with your email address).
2. Paste the answers from section 2 into the matching boxes. If a box is too short, keep its first paragraph and
   leave the reference to this file in answer 8.
3. Submit, then approve it from the email AsPredicted sends you.
4. Send the link or PDF to Claude so it can be added to the repo.

[assumed: these steps follow AsPredicted's public description and were not clicked through]

Before your 11th rated 10+0 game. Nothing else is needed from you.
