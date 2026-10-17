"""Lichess -> chess.com translation table for the app's rating page, rebuilt on BOTH identity-checked samples (R2, 2026-10-16).

Why this exists: the first table (results/chesscom_map.json, one straight line over 79 September pairs) put Lichess blitz
1017 at chess.com blitz 483 with an 8-in-10 band of 254 to 676. The independent check (../../verify-rating/README.md,
claim 1) drew a second sample from the August 2026 database and found the middle a little higher and the band near 1017
narrower: pooled, about 505 with 8 in 10 between 368 and 666. This script turns the pooled pairs into the table the app
reads, so the page shows the better-supported numbers.

Inputs (raw, kept out of the repo because they hold other players' usernames):
  sept  = the investigation's enriched pairs (scripts/enrich_pairs.py output; records with 'lichess' and 'chesscom')
  aug   = the checker's August re-sample (verify-rating/v_fetch_pairs.py output; records with 'li' and 'cc_profile')

Rules, the same as verify-rating/v_pairs.py, plus one: each player counts once.
  - Lichess side established: not provisional, RD < 110, at least 20 games.
  - chess.com side established: RD < 150, at least 20 games, last game within 365 days of AS_OF.
  - No titled players on either site.
  - Identity: the Lichess profile links that chess.com account, or the real names match, or the country flags match.
  - Lichess rating 700 to 1700 (the range both earlier fits used).
  - One record per username, the first one: the September file lists 22 usernames twice (identical ratings), and a
    username in both samples would count once with the September record winning (there are none). Both counts are
    reported. Without this rule the blitz table has the 140 pairs the independent check reported; one of them is
    a September player listed twice (Lichess 985, chess.com 417, so also one of the 48 "within 100 of 1017"), which
    makes 139 players. The same repeat is in the investigation's 79 September pairs (78 players). Rapid: 139 pairs,
    136 players. Found by the R2 verification on 2026-10-16; the page says "players", so it uses the players.

Table, per Lichess grid value x (steps of 10, so reading between two rows changes almost nothing):
  - centre: local straight-line fit at x (tricube weights, half-width 200 Lichess points), so the slope inside the
    window does not drag the middle towards where most players happen to sit. At 1017 this is the checker's
    'loclin_h200' (504 with the repeated player, 505 without).
  - p10 / p90: the 10th and 90th percentile of the chess.com ratings of the players within 100 Lichess points of x.
    This is the checker's definition ("spread of the 48 pooled players within 100 of 1017: 368 to 666"; 47 players
    and 367 to 669 once the repeated player counts once) and the plainest one to say on the page: "8 in 10 similar
    players". Two other readings are stored for the record under 'band_variants_at_1017' (players first moved along
    the local line to x; kernel-weighted residuals). They differ by up to about 40 points at the top end, which is
    the sampling noise of a 90th percentile of about 50 players.
    For the record: the band was chosen after all three had been computed. The moved reading came first and gave
    377 to 695 at 1017 (376 to 696 without the repeat; just above the build plan's 690 ceiling); the checker's
    definition was kept because the plan's numbers come from it and it says exactly what the page says.
  - near: how many players are within 100 points of x. A row is written only when near >= MIN_NEAR, so the app
    never translates a rating the data do not cover.
  - center_95ci: 1,000 bootstrap resamples over players (seed 2026).
  Values are whole numbers; the app interpolates between rows and rounds to 10.

Usage: .venv/bin/python -I build_pooled_map.py <sept.ndjson> <aug.ndjson> <out.json> [--as-of UNIX] [--app APP.json]
  out.json  the full result (results/chesscom_map_pooled.json)
  --app     also write the small copy the app reads (public/data/rating/chesscom-map.json): rows only, same numbers.
            src/features/rating/rating.check.ts fails if the two ever disagree.
Output holds counts and ratings only: no usernames, no profile data.
"""
import json
import random
import sys

SEPT, AUG, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
_opts = dict(zip(sys.argv[4::2], sys.argv[5::2]))
AS_OF = int(_opts.get('--as-of', 1792108800))  # 2026-10-16 00:00 UTC
APP_OUT = _opts.get('--app')
LI_MIN, LI_MAX = 700, 1700
GRID = list(range(LI_MIN, LI_MAX + 1, 10))
H = 200          # half-width of the tricube kernel for the centre
NEAR = 100       # "similar players": within this many Lichess points
MIN_NEAR = 20    # fewer similar players than this and the row is left out
BOOT = 1000
CHECK_AT = 1017  # his Lichess blitz rating on 2026-10-16, reported for the acceptance check


def norm_li_flag(f):
    f = (f or '').strip().upper()
    if not f or f.startswith('_'):
        return ''
    if f.startswith('GB'):
        return 'GB'  # GB-ENG, GB-SCT, GB-WLS, GB-NIR
    return f.split('-')[0][:2]


def norm_cc_country(c):
    c = (c or '').strip().upper()
    if c in ('XE', 'XS', 'XW', 'XN'):
        return 'GB'  # chess.com's England, Scotland, Wales, Northern Ireland codes
    if c in ('XX', ''):
        return ''    # 'International' or unknown
    return c


def unify(r, fmt):
    """One common record for both file formats, or None when the record has no profiles."""
    if fmt == 'sept':
        if 'lichess' not in r or 'chesscom' not in r:
            return None
        li, cc = r['lichess'], r['chesscom']
    else:
        if 'li' not in r or 'cc_profile' not in r:
            return None
        li, cc = r['li'], r['cc_profile']
    return {'u': r['u'].lower(), 'li_perfs': li.get('perfs') or {}, 'flag': li.get('flag'), 'li_name': li.get('realName'),
            'links': li.get('links'), 'bio': li.get('bio'), 'li_title': li.get('title'), 'cc_country': cc.get('country'),
            'cc_name': cc.get('name'), 'cc_title': cc.get('title'), 'chess_blitz': r.get('chess_blitz'),
            'chess_rapid': r.get('chess_rapid')}


def identity(x):
    blob = ' '.join(filter(None, [x.get('links') or '', x.get('bio') or ''])).lower()
    if ('chess.com/member/' + x['u']) in blob or ('chess.com/players/' + x['u']) in blob:
        return 'link'
    a, b = (x.get('li_name') or '').strip().lower(), (x.get('cc_name') or '').strip().lower()
    if a and b and a == b:
        return 'name'
    lf, cf = norm_li_flag(x.get('flag')), norm_cc_country(x.get('cc_country'))
    if lf and cf:
        return 'country' if lf == cf else 'mismatch'
    return 'unknown'


def li_ok(p):
    return bool(p) and not p.get('prov') and (p.get('rd') or 999) < 110 and (p.get('games') or 0) >= 20


def cc_ok(p):
    return bool(p) and (p.get('rd') or 999) < 150 and (p.get('games') or 0) >= 20 and bool(p.get('date')) \
        and AS_OF - p['date'] < 365 * 86400


def load(path, fmt):
    out = []
    with open(path) as f:
        for line in f:
            if line.strip():
                y = unify(json.loads(line), fmt)
                if y:
                    y['sample'] = fmt
                    out.append(y)
    return out


def once_per_player(rows):
    """The first record of each username, and how many repeats were dropped."""
    out, seen = [], set()
    for y in rows:
        if y['u'] not in seen:
            seen.add(y['u'])
            out.append(y)
    return out, len(rows) - len(out)


records, sept_repeats = once_per_player(load(SEPT, 'sept'))
seen = {y['u'] for y in records}
aug = load(AUG, 'aug')
overlap = sum(1 for y in aug if y['u'] in seen)
aug, aug_repeats = once_per_player([y for y in aug if y['u'] not in seen])
records += aug
for y in records:
    y['ev'] = identity(y)


def pairs(li_perf, cc_perf):
    d = []
    for y in records:
        if y['li_title'] or y['cc_title'] or y['ev'] not in ('link', 'name', 'country'):
            continue
        a, b = y['li_perfs'].get(li_perf), y.get(cc_perf)
        if li_ok(a) and cc_ok(b) and LI_MIN <= a['rating'] <= LI_MAX:
            d.append((a['rating'], b['rating'], y['sample']))
    d.sort()
    return d


def q(v, p):
    s = sorted(v)
    i = p * (len(s) - 1)
    lo = int(i)
    hi = min(lo + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (i - lo)


def local_line(d, x0):
    """Weighted straight line around x0 (tricube, half-width H). Returns (value at x0, slope) or None."""
    w = [max(0.0, 1 - (abs(x - x0) / H) ** 3) ** 3 for x, _ in d]
    sw = sum(w)
    if sw == 0:
        return None
    mx = sum(wi * x for wi, (x, _) in zip(w, d)) / sw
    my = sum(wi * y for wi, (_, y) in zip(w, d)) / sw
    sxx = sum(wi * (x - mx) ** 2 for wi, (x, _) in zip(w, d))
    b = sum(wi * (x - mx) * (y - my) for wi, (x, y) in zip(w, d)) / sxx if sxx else 0.0
    return my + b * (x0 - mx), b


def row(d, x0):
    """centre, p10, p90 and the number of similar players at x0 (unrounded), or None when too few players."""
    near = [y for x, y in d if abs(x - x0) <= NEAR]
    if len(near) < MIN_NEAR:
        return None
    fit = local_line(d, x0)
    if fit is None:
        return None
    return {'centre': fit[0], 'p10': q(near, 0.10), 'p90': q(near, 0.90), 'near': len(near)}


def band_variants(d, x0):
    """The two other ways to read the 8-in-10 band at x0, kept only for the record (not used by the app)."""
    centre, slope = local_line(d, x0)
    near = [(x, y) for x, y in d if abs(x - x0) <= NEAR]
    moved = [y + slope * (x0 - x) for x, y in near]
    w = [max(0.0, 1 - (abs(x - x0) / H) ** 3) ** 3 for x, _ in d]
    res = sorted((y - (centre + slope * (x - x0)), wi) for (x, y), wi in zip(d, w) if wi > 0)
    tot = sum(wi for _, wi in res)

    def wq(p):
        acc = 0.0
        for v, wi in res:
            acc += wi
            if acc >= p * tot:
                return v
        return res[-1][0]
    return {'within_100_as_is': [round(q([y for _, y in near], 0.1)), round(q([y for _, y in near], 0.9))],
            'within_100_moved_along_local_line': [round(q(moved, 0.1)), round(q(moved, 0.9))],
            'kernel_weighted_residuals_h200': [round(centre + wq(0.1)), round(centre + wq(0.9))]}


def build(li_perf, cc_perf):
    d3 = pairs(li_perf, cc_perf)
    d = [(x, y) for x, y, _ in d3]
    rnd = random.Random(2026)
    boots = [[rnd.choice(d) for _ in d] for _ in range(BOOT)]
    rows = []
    for x0 in GRID:
        r = row(d, x0)
        if not r:
            continue
        cs = [v[0] for v in (local_line(s, x0) for s in boots) if v]
        rows.append({'lichess': x0, 'center': round(r['centre']), 'p10': round(r['p10']), 'p90': round(r['p90']),
                     'near': r['near'], 'center_95ci': [round(q(cs, 0.025)), round(q(cs, 0.975))]})
    at = row(d, CHECK_AT)
    return {
        'pairs': len(d),
        'pairs_by_sample': {'september_2026': sum(1 for *_, s in d3 if s == 'sept'),
                            'august_2026': sum(1 for *_, s in d3 if s == 'aug')},
        'lichess_range': [rows[0]['lichess'], rows[-1]['lichess']] if rows else None,
        'rows': rows,
        'check_at_1017': None if not at else {
            'center': round(at['centre']), 'p10': round(at['p10']), 'p90': round(at['p90']), 'near': at['near']},
        'band_variants_at_1017': band_variants(d, CHECK_AT) if at else None,
    }


report = {
    'about': ('Lichess rating -> chess.com rating among players with accounts on both sites, checked to be the same '
              'person (profile link, matching real name or matching country flag). Pooled from two samples: the '
              'September 2026 and August 2026 Lichess databases, profiles looked up 2026-10-16. center = local '
              'straight-line fit at that Lichess rating (tricube, half-width 200); p10/p90 = 8 in 10 of the players '
              'within 100 Lichess points fall between them; near = how many such players. A translation, never a '
              "player's chess.com rating. Use only for an established (non-provisional) Lichess rating inside "
              'lichess_range; interpolate between rows.'),
    'built_by': 'research/2026-10-16-diagnosis/rating/scripts/build_pooled_map.py',
    'source_date': '2026-10-16',
    'as_of_unix': AS_OF,
    'rules': {'lichess': 'not provisional, RD < 110, 20+ games, rating 700-1700',
              'chesscom': 'RD < 150, 20+ games, last game within 365 days',
              'identity': 'profile link, same real name, or same country flag; no titled players',
              'min_similar_players_per_row': MIN_NEAR, 'similar_means_within': NEAR, 'kernel_half_width': H,
              'bootstrap': {'resamples': BOOT, 'seed': 2026}},
    'usernames_in_both_samples': overlap,
    'repeated_usernames_dropped': {'september_2026': sept_repeats, 'august_2026': aug_repeats},
    'maps': {
        'blitz_to_chesscom_blitz': build('blitz', 'chess_blitz'),
        'rapid_to_chesscom_rapid': build('rapid', 'chess_rapid'),
    },
}
with open(OUT, 'w') as f:
    json.dump(report, f, indent=1)
    f.write('\n')
if APP_OUT:
    # The app's copy: what the page needs and nothing else. Keys follow the Lichess perf names.
    app = {
        'about': ('Lichess -> chess.com translation for the rating page. A translation from players with accounts '
                  'on both sites, never anyone\'s chess.com rating. Built by ' + report['built_by'] + '; full '
                  'numbers in research/2026-10-16-diagnosis/rating/results/chesscom_map_pooled.json.'),
        'sourceDate': report['source_date'],
        'samples': 'Lichess database samples of August and September 2026, profiles looked up 2026-10-16',
        'similarWithin': NEAR,
        'maps': {
            'blitz': {'chesscom': 'blitz', **{k: report['maps']['blitz_to_chesscom_blitz'][k] for k in ('pairs',)},
                      'rows': [{k: r[k] for k in ('lichess', 'center', 'p10', 'p90', 'near')}
                               for r in report['maps']['blitz_to_chesscom_blitz']['rows']]},
            'rapid': {'chesscom': 'rapid', **{k: report['maps']['rapid_to_chesscom_rapid'][k] for k in ('pairs',)},
                      'rows': [{k: r[k] for k in ('lichess', 'center', 'p10', 'p90', 'near')}
                               for r in report['maps']['rapid_to_chesscom_rapid']['rows']]},
        },
    }
    with open(APP_OUT, 'w') as f:
        json.dump(app, f, separators=(',', ':'))
        f.write('\n')
for k, m in report['maps'].items():
    print(k, 'pairs', m['pairs'], m['pairs_by_sample'], 'range', m['lichess_range'], 'at 1017', m['check_at_1017'])
print('usernames in both samples:', overlap, '| repeated usernames dropped: september', sept_repeats, 'august', aug_repeats)
