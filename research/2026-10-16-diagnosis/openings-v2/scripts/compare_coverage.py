"""O1 acceptance check (2026-10-16): per course, the share of the owner's games still inside the course after the
opponent's 2nd and 3rd move must be no more than 2 points below the share before narrowing.

Before = research/2026-10-16-diagnosis/openings/{coverage_all,depth_in_course_km}.json (40 chapters, 2026-10-16).
After  = research/2026-10-16-diagnosis/openings-v2/coverage/ (20 chapters), made by the same scripts on the same
September 2026 sample (analyse_courses.py walk, low end of its range; km.py Kaplan-Meier).
London: the opponent's 2nd and 3rd moves are plies 4 and 6. Caro-Kann and Slav (counted after 1.e4 / 1.d4): plies 3 and 5.
Usage, from the repo root: python3 -I research/2026-10-16-diagnosis/openings-v2/scripts/compare_coverage.py
Writes research/2026-10-16-diagnosis/openings-v2/coverage/before_after.json and exits 1 if a course fails.
"""
import json, sys
from pathlib import Path

R = Path('research/2026-10-16-diagnosis')
b = json.load(open(R / 'openings/coverage_all.json'))['courses']
a = json.load(open(R / 'openings-v2/coverage/coverage_all.json'))['courses']
kb = json.load(open(R / 'openings/depth_in_course_km.json'))['courses']
ka = json.load(open(R / 'openings-v2/coverage/depth_in_course_km.json'))['courses']
PLIES = {'london': (4, 6), 'caro-kann': (3, 5), 'slav': (3, 5), 'black-vs-d4-with-1c6': (3, 5)}

out = {'what': "Share of the owner's games still inside the course after the opponent's 2nd and 3rd move, "
               'September 2026 Lichess sample (both players 1000-1300), before narrowing (40 chapters) and after (20). '
               'walk = analyse_courses.py (low-high range), km = km.py (Kaplan-Meier). Pass: after >= before - 0.02 by both methods.',
       'note': "slav before = the old course with 1...d5. black-vs-d4-with-1c6 = Slav plus Caro-Kann chapters after 1.d4 c6 "
               "(his move order); the narrowed Slav course itself starts 1.d4 c6. km.py's slav row counts games that start "
               "1.d4 d5 and reach the course by transposition.",
       'courses': {}}
ok = True
for cid, (p2, p3) in PLIES.items():
    row = {}
    for label, ply in (('after_opponent_move_2', p2), ('after_opponent_move_3', p3)):
        wb = {x['ply']: x for x in b[cid]['still_in_course_after_ply']}[ply]
        wa = {x['ply']: x for x in a[cid]['still_in_course_after_ply']}[ply]
        mb = {x['ply']: x for x in kb[cid]['survival']}[ply]['still_in_course']
        ma = {x['ply']: x for x in ka[cid]['survival']}[ply]['still_in_course']
        r = {'ply': ply,
             'walk_before': [wb['still_in_course_low'], wb['still_in_course_high']],
             'walk_after': [wa['still_in_course_low'], wa['still_in_course_high']],
             'km_before': mb, 'km_after': ma}
        r['pass'] = wa['still_in_course_low'] >= wb['still_in_course_low'] - 0.02 and ma >= mb - 0.02
        ok = ok and r['pass']
        row[label] = r
        print(f"{cid:22s} {label}: walk {100 * wb['still_in_course_low']:.1f}% -> {100 * wa['still_in_course_low']:.1f}%, "
              f"km {100 * mb:.1f}% -> {100 * ma:.1f}%  {'pass' if r['pass'] else 'FAIL'}")
    out['courses'][cid] = row
out['all_pass'] = ok
json.dump(out, open(R / 'openings-v2/coverage/before_after.json', 'w'), indent=1)
print('all pass' if ok else 'FAIL')
sys.exit(0 if ok else 1)
