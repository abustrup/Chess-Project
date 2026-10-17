# Rebuild: .venv/bin/python -I src/features/home/fixtures/make-verdict-fixtures.py . src/features/home/fixtures
# Builds verdict.json fixtures for the Home study card by calling the pre-registered verdict.py (unchanged) on
# constructed series, the same construction as verdict.py's own selftest.
import importlib.util, json, sys
root = sys.argv[1]; out = sys.argv[2]
spec = importlib.util.spec_from_file_location('verdict', f'{root}/research/2026-10-16-diagnosis/prereg/verdict.py')
v = importlib.util.module_from_spec(spec); spec.loader.exec_module(v)

def series(rate_a, rate_b, n=160, moves=30, unlock=40, threat_b=None):
    rows = []
    for i in range(1, n + 1):
        rate = rate_a if i <= unlock + 20 else rate_b
        b = round(rate * moves / 100 + (0.9 if i % 2 else -0.9))
        tb = (i % 3) if (threat_b is None or i <= unlock + 20) else threat_b(i)
        rows.append({'seq': i, 'my_moves': moves, 'my_blunders': max(b, 0), 'opp_rating': 1100 + (i % 7) * 10,
                     'my_rating': 1100, 'my_rating_diff': 1, 'score': 1.0 * (i % 2), 'threat_moves': 5, 'threat_blunders': tb,
                     'nothreat_moves': 20, 'nothreat_blunders': i % 2, 'win_nothreat_moves': 4, 'win_nothreat_blunders': i % 4 == 0,
                     'opp_moves': 30, 'opp_blunders': 3, 'my_provisional': 'False'})
    return rows

# matched newcomers who improve by 2.5 per 100 on their own: the main rule passes at game 160, the newcomer condition does not
LEARNING_NEWCOMERS = {'players': 100, 'mean_change': -2.5, 'mean_change_se': 0.37, 'drift_sd': 2.35}
cases = {
    'verdict-worked-110': v.report(series(12, 5)[:110]),
    'verdict-pending-110': v.report(series(10, 8)[:110]),
    'verdict-cannot-tell-160': v.report(series(10, 8)),
    'verdict-newcomers-cannot-tell-160': v.report(series(12, 8.6), nc=LEARNING_NEWCOMERS),
    'verdict-rise-110': v.report(series(8, 14)[:110]),
}
for name, rep in cases.items():
    p = rep['primary']
    print(name, p['verdict'], p['decided_at_game'])
    with open(f'{out}/{name}.json', 'w') as f:
        json.dump(rep, f, indent=1, default=str)
        f.write('\n')
