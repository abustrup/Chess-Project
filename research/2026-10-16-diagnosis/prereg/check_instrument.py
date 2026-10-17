# Fixture check for the pre-registered instrument (measure.py). Run it whenever the engine binary, python-chess,
# the machine or measure.py changes; the measure counts only if this passes.
#   .venv/bin/python -I research/2026-10-16-diagnosis/prereg/check_instrument.py            (about 1 s, uses saved evals)
#   .venv/bin/python -I research/2026-10-16-diagnosis/prereg/check_instrument.py --engine   (+ about 75 s: re-searches
#        2 games with Stockfish and requires every score and best move to equal the saved 2026-10-16 evals)
# Expected (his 31 blitz games, 2026-10-10 to 2026-10-15, Stockfish 19 at 250,000 nodes, saved by the my-games agent):
#   his blunders 111 of 891 moves; threat test 39 of 126 threatened moves, 63 of 622 other tested moves (of these,
#   19 of 88 with his win chance above 75%); opponents 86 of 897; every game equal to my-games/out/games.json.
import sys, os, json, csv, subprocess, tempfile, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, '..', 'my-games')
PY = sys.executable


def run(args):
    subprocess.run([PY, '-I', os.path.join(HERE, 'measure.py')] + args, check=True, stderr=subprocess.DEVNULL)


tmp = tempfile.mkdtemp()
try:
    cache = os.path.join(tmp, 'cache.jsonl'); shutil.copy(os.path.join(D, 'engine', 'sf_250k_bothnull.jsonl'), cache)
    out = os.path.join(tmp, 'g.csv')
    run(['--input', os.path.join(D, 'lichess_abustrup.ndjson'), '--tc', 'any', '--perf', 'blitz', '--cache', cache, '--out', out])
    rows = list(csv.DictReader(open(out)))
    t = lambda k: sum(int(r[k]) for r in rows)
    got = (len(rows), t('my_blunders'), t('my_moves'), t('threat_blunders'), t('threat_moves'), t('nothreat_blunders'),
           t('nothreat_moves'), t('opp_blunders'), t('opp_moves'), t('win_nothreat_blunders'), t('win_nothreat_moves'))
    want = (31, 111, 891, 39, 126, 63, 622, 86, 897, 19, 88)
    assert got == want, f'totals {got} != {want}'
    ref = {g['id']: g for g in json.load(open(os.path.join(D, 'out', 'games.json')))}
    for r in rows:
        g = ref[r['game_id']]
        assert (int(r['my_blunders']), int(r['my_moves']), int(r['opp_blunders'])) == (g['my_blunders'], g['my_moves'], g['opp_blunders']), r['game_id']
    print('fixture check passed: 31 games, 111/891 blunders, threat 39/126 and 63/622, winning with no threat 19/88, '
          'opponents 86/897, all games match')
    if '--engine' in sys.argv:
        fresh = os.path.join(tmp, 'fresh.jsonl')
        run(['--input', os.path.join(D, 'lichess_abustrup.ndjson'), '--tc', 'any', '--perf', 'blitz', '--max-games', '2',
             '--cache', fresh, '--out', os.path.join(tmp, 'f.csv')])
        old = {}
        for l in open(cache):
            x = json.loads(l); old[x['id']] = x['positions']
        n = same = 0
        for l in open(fresh):
            x = json.loads(l)
            for a, b in zip(x['positions'], old[x['id']]):
                n += 1
                same += a['score'] == b['score'] and a.get('best') == b.get('best') and \
                    (a.get('null') or {}).get('score') == ((b.get('null') or {}).get('score') if 'null' in a else None)
        assert n > 0 and same == n, f'engine check: {same} of {n} positions identical'
        print(f'engine check passed: {n} of {n} positions re-searched identically (scores, best moves, threat probes)')
finally:
    shutil.rmtree(tmp)
