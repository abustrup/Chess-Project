#!/usr/bin/env python3
"""Lichess rule parity: the app's TypeScript rules (src/lib/lichessRules.ts) against the pre-registered Python rule.

The study's measure uses research/2026-10-16-diagnosis/prereg/lichess_rule.py (hashed in preregistration.md 3.9).
The app's Review page and Safety-check trainer use src/lib/lichessRules.ts. This script shows the two give the same
label on every move it can think of:

 1. Checks prereg/lichess_rule.py against its SHA-256 in preregistration.md 3.9 and imports it unchanged.
 2. Builds the vectors (an eval before and after a move, who moved, whether the move was the engine's first choice):
    the 428 moves of the 6 games Lichess analysed, with Lichess's own evals, plus generated ones: both sides of every
    label threshold, the whole-centipawn moves closest to each line, pairs beyond +-1000 where a clamp would matter,
    every forced-mate case, seeded random pairs.
 3. Labels each vector with the Python rule and with the TypeScript rule (run through tsx) and compares. The label must
    be identical and the win% drop equal to 1e-9. Lichess's two client rules (retroAccept, isRetroCandidate) and their
    raw povDiff are compared with the small Python mirror below, written from lila's source.
 4. Checks that src/lib/fixtures/lichess-rule-vectors.json holds exactly these games, vectors and labels, so
    lichessRules.check.ts can test the same thing without Python.

From the repo root (standard library only; tsx comes from `npm ci`):
  python3 -I scripts/check-rule-parity.py           # check; exit code 1 on any difference
  python3 -I scripts/check-rule-parity.py --write   # rebuild the fixture from the my-games export, then check
"""
import hashlib
import importlib.util
import json
import math
import random
import re
import subprocess
import sys
from pathlib import Path

# Importing the prereg rule must leave its folder as it was: no __pycache__ written next to the hashed files.
sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parent.parent
DIAG = ROOT / 'research' / '2026-10-16-diagnosis'
RULE = DIAG / 'prereg' / 'lichess_rule.py'
PREREG = DIAG / 'preregistration.md'
EXPORT = DIAG / 'my-games' / 'lichess_abustrup.ndjson'
FIXTURE = ROOT / 'src' / 'lib' / 'fixtures' / 'lichess-rule-vectors.json'
TS_CHECK = ROOT / 'src' / 'lib' / 'lichessRules.check.ts'
ME = 'abustrup'
SEED = 20261016
DROP_TOLERANCE = 1e-9
POV_TOLERANCE = 1e-12


def load_rule():
    """Import prereg/lichess_rule.py by path after checking its hash against preregistration.md 3.9."""
    m = re.search(r'\|\s*lichess_rule\.py\s*\|\s*([0-9a-f]{64})\s*\|', PREREG.read_text(encoding='utf-8'))
    if not m:
        sys.exit(f'FAIL: no SHA-256 for lichess_rule.py in {PREREG.relative_to(ROOT)}')
    actual = hashlib.sha256(RULE.read_bytes()).hexdigest()
    if actual != m.group(1):
        sys.exit(f'FAIL: {RULE.relative_to(ROOT)} has SHA-256 {actual}, preregistration.md says {m.group(1)}')
    spec = importlib.util.spec_from_file_location('prereg_lichess_rule', RULE)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    if mod.CLAMP is not None:
        sys.exit('FAIL: prereg lichess_rule.py has a clamp; lichessRules.ts has none')
    return mod, actual


# --- Python mirror of Lichess's client rules (lila ui/lib/src/ceval/winningChances.ts, ui/analyse/src/nodeFinder.ts) ---

def raw_wc(cp):
    return 2 / (1 + math.exp(-0.00368208 * cp)) - 1


def client_wc(e):
    if e.get('mate') is not None:
        m = e['mate']
        return raw_wc((21 - min(10, abs(m))) * 100 * (1 if m > 0 else -1))
    return raw_wc(min(max(-1000, e.get('cp', 0)), 1000))


def pov_diff(white, a, b):
    pa = client_wc(a) if white else -client_wc(a)
    pb = client_wc(b) if white else -client_wc(b)
    return (pa - pb) / 2


def retro_accept(white, after, before):
    return pov_diff(white, after, before) > -0.04


def is_retro_candidate(prev, cur, judged):
    if not judged:
        return False
    return abs(pov_diff(True, prev, cur)) > 0.1 or (bool(prev.get('mate')) and not cur.get('mate') and abs(prev['mate']) <= 3)


# --- Vectors ---

def games_from_export():
    """The analysed games from the my-games export: Lichess's evals and labels, his side, no opponent names."""
    out = []
    for line in EXPORT.read_text(encoding='utf-8').splitlines():
        g = json.loads(line)
        if 'analysis' not in g:
            continue
        side = 'white' if g['players']['white'].get('user', {}).get('id') == ME else 'black'
        analysis = []
        for a in g['analysis']:
            e = {k: a[k] for k in ('eval', 'mate', 'best') if k in a}
            if 'judgment' in a:
                e['judgment'] = a['judgment']['name']
            analysis.append(e)
        out.append({'id': g['id'], 'speed': g['speed'], 'side': side, 'moves': g['moves'], 'analysis': analysis})
    return out


def game_vectors(rule, games):
    """One vector per analysis entry, exactly as my-games/scripts/calib_compare.py walks them (428 in the 6 games)."""
    vecs = []
    for g in games:
        prev = rule.START
        for i, a in enumerate(g['analysis']):
            cur = rule.lichess_api_score(a)
            if cur is None:
                break
            vecs.append((prev, cur, i % 2 == 0, 'best' not in a, a.get('judgment')))
            prev = cur
    return vecs


def closest_moves(loss, line, per_group=3):
    """The whole-centipawn moves that come closest to `line` from either side, from every eval before the move between
    -15.00 and +15.00, for each side to move. loss(prev_cp, cur_cp, white) is the mover's loss in win% points. Only
    margins of at least 1e-9 points are kept, far above any rounding difference between maths libraries."""
    found = {}
    for prev_cp in range(-1500, 1501):
        for white in (True, False):
            worse = (lambda k: prev_cp - k) if white else (lambda k: prev_cp + k)
            if loss(prev_cp, worse(40000), white) < line:
                continue
            lo, hi = 0, 40000  # smallest k with loss >= line
            while lo < hi:
                mid = (lo + hi) // 2
                if loss(prev_cp, worse(mid), white) >= line:
                    hi = mid
                else:
                    lo = mid + 1
            for side_of_line, k in (('above', lo), ('below', lo - 1)):
                margin = abs(loss(prev_cp, worse(k), white) - line)
                if margin >= 1e-9:
                    found.setdefault((side_of_line, white), []).append((margin, prev_cp, worse(k)))
    return [(p, c, white) for (_, white), group in sorted(found.items()) for _, p, c in sorted(group)[:per_group]]


def generated_vectors(rule):
    """Deterministic vectors that probe every branch and edge of the rule."""
    vecs = []
    # a) both sides of each label threshold: for each eval before the move, the integer eval after it where the
    #    mover's drop first reaches 5, 10 and 15 points, and one centipawn either side
    for prev_cp in range(-1500, 1501, 50):
        for white in (True, False):
            prev = {'cp': prev_cp}
            for t in (5, 10, 15):
                worse = (lambda k: prev_cp - k) if white else (lambda k: prev_cp + k)
                drop = lambda k: rule.wp_mover(prev, white) - rule.wp_mover({'cp': worse(k)}, white)
                if drop(40000) < t:
                    continue
                lo, hi = 0, 40000  # smallest k with drop >= t
                while lo < hi:
                    mid = (lo + hi) // 2
                    if drop(mid) >= t:
                        hi = mid
                    else:
                        lo = mid + 1
                for k in (lo - 1, lo, lo + 1):
                    vecs.append((prev, {'cp': worse(k)}, white, False))
    # b) centipawn grid, including pairs beyond +-1000 that a clamp would flatten and Lichess's mate-rule edges
    cps = [-3000, -1500, -1001, -1000, -999, -701, -700, -300, 0, 300, 700, 701, 999, 1000, 1001, 1500, 3000]
    for p in cps:
        for c in cps:
            for white in (True, False):
                vecs.append(({'cp': p}, {'cp': c}, white, False))
    # c) every forced-mate case: mate before and/or after the move, either sign, near Lichess's 700 / 999 edges
    mate_cps = [-1500, -1000, -999, -701, -700, 0, 700, 701, 999, 1000, 1500]
    mates = [1, 2, 3, 4, 10, 11]
    befores = [{'cp': c} for c in mate_cps] + [{'mate': s * m} for m in mates for s in (1, -1)]
    afters = befores + [{'mate': 0}, {'mate': 0, 'mated': 'white'}, {'mate': 0, 'mated': 'black'}]
    n = 0
    for p in befores:
        for c in afters:
            if 'cp' in p and 'cp' in c:
                continue
            for white in (True, False):
                vecs.append((p, c, white, False))
                n += 1
                if n % 11 == 0:  # some with the engine's first choice played: never a label
                    vecs.append((p, c, white, True))
    # d) the whole-centipawn moves that come closest to each label line and to the 4-point line of "Learn from your
    #    mistakes", so a line moved by 0.001 points is caught
    server_loss = lambda p, c, white: rule.wp_mover({'cp': p}, white) - rule.wp_mover({'cp': c}, white)
    retro_loss = lambda p, c, white: -pov_diff(white, {'cp': c}, {'cp': p}) * 100
    for loss, line in ((server_loss, 5), (server_loss, 10), (server_loss, 15), (retro_loss, 4)):
        for p, c, white in closest_moves(loss, line):
            vecs.append(({'cp': p}, {'cp': c}, white, False))
    # e) seeded random pairs, mostly ordinary middlegame swings, some mates
    rng = random.Random(SEED)

    def rand_eval():
        r = rng.random()
        if r < 0.1:
            return {'mate': rng.choice([1, 2, 3, 4, 5, 7, 12]) * rng.choice([1, -1])}
        if r < 0.2:
            return {'cp': rng.randint(-4000, 4000)}
        return {'cp': round(rng.gauss(0, 350))}
    for _ in range(400):
        p = rand_eval()
        c = {'cp': p['cp'] + round(rng.gauss(0, 250))} if 'cp' in p and rng.random() < 0.7 else rand_eval()
        vecs.append((p, c, rng.random() < 0.5, rng.random() < 0.1))
    return vecs


def python_verdicts(rule, prev, cur, white, best):
    label, drop = rule.lichess_judgment(prev, cur, white, played_is_best=best)
    return label, drop, retro_accept(white, cur, prev), is_retro_candidate(prev, cur, not best)


# --- Fixture ---

def compact(x):
    return json.dumps(x, separators=(',', ':'), ensure_ascii=False)


def fixture_text(rule_hash, games, rows):
    head = {
        'about': ("Test data for src/lib/lichessRules.ts. 'games': the 6 rated Lichess games of abustrup that Lichess "
                  "analysed, with Lichess's own evaluations and labels; opponents' names are left out. 'vectors': "
                  "generated evals before and after a move with the verdicts of the pre-registered Python rule and of "
                  "the Python mirror of Lichess's client rules in scripts/check-rule-parity.py."),
        'builtBy': 'python3 -I scripts/check-rule-parity.py --write',
        'source': 'research/2026-10-16-diagnosis/my-games/lichess_abustrup.ndjson (Lichess export, 2026-10-16)',
        'rule': 'research/2026-10-16-diagnosis/prereg/lichess_rule.py',
        'ruleSha256': rule_hash,
        'gameFields': "side = his colour; analysis[i] = Lichess's eval after ply i+1, White's point of view",
        'vectorFields': ['before', 'after', 'moverWhite', 'playedIsBest', 'serverJudgment', 'drop', 'retroAccept',
                         'isRetroCandidate'],
    }
    lines = ['{']
    for k, v in head.items():
        lines.append(f'  {compact(k)}: {compact(v)},')
    lines.append('  "games": [')
    lines += [f'    {compact(g)}' + (',' if i < len(games) - 1 else '') for i, g in enumerate(games)]
    lines.append('  ],')
    lines.append('  "vectors": [')
    lines += [f'    {compact(r)}' + (',' if i < len(rows) - 1 else '') for i, r in enumerate(rows)]
    lines.append('  ]')
    lines.append('}')
    return '\n'.join(lines) + '\n'


def fixture_rows(rule, vecs):
    rows = []
    for prev, cur, white, best in vecs:
        label, drop, ra, rc = python_verdicts(rule, prev, cur, white, best)
        rows.append([prev, cur, int(white), int(best), label, round(drop, 6), int(ra), int(rc)])
    return rows


# --- TypeScript side ---

def ts_verdicts(vecs):
    tsx = ROOT / 'node_modules' / '.bin' / 'tsx'
    if not tsx.exists():
        sys.exit('FAIL: node_modules/.bin/tsx not found; run `npm ci` first')
    payload = json.dumps([[p, c, w, b] for p, c, w, b in vecs])
    res = subprocess.run([str(tsx), str(TS_CHECK), '--label'], input=payload, capture_output=True, text=True,
                         cwd=ROOT, timeout=300)
    if res.returncode != 0:
        sys.exit(f'FAIL: the TypeScript labeller exited with {res.returncode}\n{res.stderr}')
    out = json.loads(res.stdout)
    if len(out) != len(vecs):
        sys.exit(f'FAIL: the TypeScript labeller returned {len(out)} verdicts for {len(vecs)} vectors')
    return out


def main():
    write = '--write' in sys.argv[1:]
    rule, rule_hash = load_rule()
    print(f'prereg lichess_rule.py: SHA-256 matches preregistration.md 3.9 ({rule_hash[:12]}...), imported unchanged')

    if write:
        games = games_from_export()
    else:
        games = json.loads(FIXTURE.read_text(encoding='utf-8'))['games']
    gvecs = game_vectors(rule, games)
    vecs = generated_vectors(rule)
    rows = fixture_rows(rule, vecs)
    text = fixture_text(rule_hash, games, rows)
    if write:
        FIXTURE.parent.mkdir(parents=True, exist_ok=True)
        FIXTURE.write_text(text, encoding='utf-8')
        print(f'wrote {FIXTURE.relative_to(ROOT)} ({len(games)} games, {len(rows)} vectors, {len(text.encode())} bytes)')

    failures = 0

    def check(name, ok, detail=''):
        nonlocal failures
        print(f"{'ok  ' if ok else 'FAIL'} {name}{f' ({detail})' if detail else ''}")
        failures += 0 if ok else 1

    # The fixture must hold exactly what this script builds, so the TS-only check tests the same thing.
    on_disk = FIXTURE.read_text(encoding='utf-8') if FIXTURE.exists() else ''
    check('fixture is current (byte-identical rebuild)', on_disk == text,
          '' if on_disk == text else 'run: python3 -I scripts/check-rule-parity.py --write')

    # Python rule on Lichess's evals against Lichess's labels: the instrument's own check, repeated here.
    py_game = [rule.lichess_judgment(p, c, w, played_is_best=b)[0] for p, c, w, b, _ in gvecs]
    same = sum(1 for (_, _, _, _, lab), j in zip(gvecs, py_game) if lab == j)
    check("Python rule on Lichess's evals reproduces Lichess's labels", same == len(gvecs), f'{same} of {len(gvecs)}')

    # Python against TypeScript on every vector: games first, then the generated ones.
    feed = [(p, c, w, b) for p, c, w, b, _ in gvecs] + vecs
    ts = ts_verdicts(feed)
    label_diff, drop_diff, retro_diff, cand_diff, pov_diffs = [], [], [], [], []
    mates = 0
    # how close any vector comes to a line: label lines (cp before and after), the 4-point line, the 10-point swing
    near_label = near_retro = near_cand = math.inf
    for (p, c, w, b), (tl, td, tra, trc, tpov) in zip(feed, ts):
        pl, pd, pra, prc = python_verdicts(rule, p, c, w, b)
        ppov = pov_diff(w, c, p)
        mates += 'mate' in p or 'mate' in c
        if pl != tl:
            label_diff.append((p, c, w, b, pl, tl))
        if abs(pd - td) > DROP_TOLERANCE:
            drop_diff.append((p, c, w, pd, td))
        if pra != tra:
            retro_diff.append((p, c, w, pra, tra))
        if prc != trc:
            cand_diff.append((p, c, b, prc, trc))
        if abs(ppov - tpov) > POV_TOLERANCE:
            pov_diffs.append((p, c, w, ppov, tpov))
        if 'cp' in p and 'cp' in c:
            near_label = min(near_label, *(abs(pd - t) for t in (5, 10, 15)))
        near_retro = min(near_retro, abs(ppov + 0.04) * 100)
        near_cand = min(near_cand, abs(abs(pov_diff(True, p, c)) - 0.1) * 100)
    labelled = sum(1 for v in ts if v[0])
    print(f'vectors fed to both rules: {len(feed)} ({len(gvecs)} from the 6 games, {len(vecs)} generated; '
          f'{mates} with a forced mate; {labelled} labelled)')
    print(f'closest any vector comes to a line, in win% points: labels {near_label:.2g}, 4-point rule {near_retro:.2g}, '
          f'10-point swing {near_cand:.2g}')
    check('serverJudgment = prereg lichess_judgment, same label', not label_diff,
          f'{len(feed) - len(label_diff)} of {len(feed)}')
    check(f'serverDrop = prereg drop within {DROP_TOLERANCE:g}', not drop_diff, f'{len(feed) - len(drop_diff)} of {len(feed)}')
    check('retroAccept = Python mirror of lila retroCtrl', not retro_diff, f'{len(feed) - len(retro_diff)} of {len(feed)}')
    check('isRetroCandidate = Python mirror of lila evalSwings', not cand_diff, f'{len(feed) - len(cand_diff)} of {len(feed)}')
    check(f'povDiff = Python mirror of lila winningChances within {POV_TOLERANCE:g}', not pov_diffs,
          f'{len(feed) - len(pov_diffs)} of {len(feed)}')
    for d in (label_diff + drop_diff + retro_diff + cand_diff + pov_diffs)[:20]:
        print('     differs:', d)

    print(f"\n{failures} check(s) FAILED" if failures else '\nAll checks passed')
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
