Make Chess Coach actually raise my Lichess rating. Start from my own games, not from generic content.

Who I am: about 1100 on Lichess, username [MY LICHESS USERNAME]. I play the London as White and the Caro-Kann and Slav as Black. The app is at ~/Chess-Project.

1. Diagnose me first. Pull all my games from the Lichess API with clock times, evals and opening tags. Analyse every game with Stockfish at depth 20 or more. Tell me where my points actually go: by game phase, by type of mistake (hung piece, missed tactic, missed threat against me, endgame, time trouble), by opening and by colour. If the evidence says openings are not where I lose, say so before you build, and put the effort where the rating points are.

2. Build my repertoire from what players at my level actually play. Use the Lichess opening explorer for 1000-1600 rated blitz and rapid games (I will make a free token if you need one), or a sample of the monthly Lichess database. Cover the replies I will meet most often, check every recommended move with Stockfish at high depth, and show where opponents at my level most often go wrong. Compare this with my own games: where do I leave my lines, and how is the position when I do?

3. Turn my own mistakes into training. Every blunder from my games becomes a puzzle in a personal set. Opening lines and personal puzzles get real spaced repetition (FSRS), so I review what I am about to forget. If it can run in the browser for free, give me a sparring bot that plays like a human at my level (Maia), not a weakened Stockfish.

4. Prove it with something other than you or me. Before building, write down what "working" means and a baseline from my real games: rating, blunders per game, the evaluation after move 15 in my openings, and puzzle rating. Test the rating estimate on real players with known ratings it has never seen, and report its average error and how often its ranges contain the true rating. Check opening content against the engine and the Lichess database, not against another agent's opinion. Then set up a weekly check that compares my real Lichess numbers with the baseline, so that after 6 to 8 weeks we can see whether it worked.

Depth beats breadth: fewer features, each one backed by evidence. Use a workflow with as many agents as helps. Give me a preview link before anything visual ships, and tell me what you verified, what you inferred and what you assumed.
