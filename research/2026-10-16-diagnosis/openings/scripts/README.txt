Openings investigation, 2026-10-16. Re-run from the repo root (/Users/alexanderbustrup/Chess-Project).
Needs: .venv with python-chess + zstandard, npx tsx, Stockfish at /opt/homebrew/bin/stockfish, curl. All free, no login.
Raw data stays outside the repo (public): put it in a scratch folder, here called $S.

1. Database sample (about 1.3 GB downloaded in 64 x 20 MiB ranges, ~10 min; writes no usernames):
   .venv/bin/python -I research/2026-10-16-diagnosis/openings/scripts/fetch_sample.py $S/db_a.jsonl 0 32 64 20
   .venv/bin/python -I research/2026-10-16-diagnosis/openings/scripts/fetch_sample.py $S/db_b.jsonl 32 64 64 20
   (a slice that fails prints "no frame found"; re-run just those: ... fetch_sample.py $S/db_c.jsonl 0 0 64 20 15,16,17)
2. Course trees: npx tsx research/2026-10-16-diagnosis/openings/scripts/export_courses.ts $S/courses.json
3. Position statistics (~6 min): .venv/bin/python -I .../build_positions.py $S/pos.pkl $S/db_*.jsonl
4. Walk, gaps, chapters, trees (seconds): cd research/2026-10-16-diagnosis/openings &&
   ../../../.venv/bin/python -I scripts/analyse_courses.py $S/pos.pkl $S/courses.json . all
   ../../../.venv/bin/python -I scripts/analyse_courses.py $S/pos.pkl $S/courses.json . rapid
   (optional 5th argument = minimum games per position, default 30; 10 was used as a sensitivity check)
5. Kaplan-Meier depth (~1 min): .../km.py $S/courses.json depth_in_course_km.json $S/db_*.jsonl
6. White systems and Slav share: .../systems.py systems_black.json $S/db_*.jsonl
7. His games: curl -A "<browser user agent>" "https://lichess.org/api/games/user/abustrup?clocks=true&evals=true&opening=true" -o $S/my_games.pgn
   .../my_openings.py $S/my_games.pgn $S/courses.json $S/my_openings.json 14   (then strip opponent names / game links)
8. Population check: .../eval_at_move12.py population_eval_after_move12.json 3,11,19,27,35,43,51,59
9. Engine check (~1 h on a busy machine): .../engine_check.py coverage_all.json engine_check.json 20 0.005
Lichess endpoints return 404 to bare curl: always send a browser-like User-Agent.
