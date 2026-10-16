# Deeper version prompt (v2, 2026-10-16)

Supersedes deeper-prompt-2026-10-16-v1.md, which repeated unverified claims. Evidence: ../research/2026-10-16/.

My chess app (github.com/abustrup/Chess-Project) works, but most of its teaching was written by AI from general knowledge, and nothing checks whether I improve. I want it deeper, not bigger: find where I really lose points, train exactly that, and let something other than you or me judge whether it worked.

Start from raw material: my full Lichess history with clock times and Lichess's own analysis, the monthly Lichess database at my level, the puzzle file and deep engine evaluations. Treat the AI-written courses and the app's rating guess as things to check.

Research from 2026-10-16 (research/2026-10-16, a few hours of Lichess games) gives a starting hypothesis. At 950-1250, roughly 40-50% of big mistakes are one-move safety errors. 17-27% of them, and many lost games, start in the first 12 moves, much of it simple safety rather than theory. Won games get thrown away surprisingly often. The Slav comes up in under 10% of Black games at my level. Test it on my own games before choosing what I train.

At my level the problem looks like a habit more than knowledge: I move without checking what my opponent threatens and what his last move allowed. Train that habit, including positions with nothing to win and something to defend. Turn my real mistakes into positions I try first, writing one line on what I checked before you show me, and bring them back over days and weeks.

If my games show the opening matters, narrow my courses to the lines 1000-1300 opponents actually reach, to about move 12, and cut before adding. Check what survives against deep engines and human results at my level, test every claim in the text an engine can test, and keep the checks in the repo. For Lichess games my Lichess rating is the rating; estimate one only for unrated games, after testing it on unseen players.

Before building, write down what "working" means; I will time-stamp it on AsPredicted or OSF. One main measure: Lichess's own blunders per 100 of my moves at one slow time control. Rating is the slow check: my results against opponents' ratings, compared with similar players over the same number of games. Use past games as the "before" if there are enough. Count in games, not weeks.

Only I can give you: my Lichess username, my time control, how many games and minutes a week I have, a click on "Request computer analysis" after every rated game, win or lose, and "Log in with Lichess" if you really need it. Keep it free to run. If one paid outside check is worth it, like a titled coach blind-reviewing samples of the course text and my games, propose it with the price.
