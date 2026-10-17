# Made 2026-10-16 by the fixer after the final critique (task N1 evidence, preregistration.md 3.3).
# Operating characteristics of the pre-registered rule WITH the committed newcomers.json binding.
# Reuses power_sim.py's simulation code unchanged (everything above its results section is exec'd as is) and
# verdict.py unchanged; only the scenario list differs. Usage: python power_with_newcomers.py REPO OUT.json SIMS
# Re-run from the repo root (about 1 minute):
#   .venv/bin/python -I -B research/2026-10-16-diagnosis/newcomers/power/power_with_newcomers.py "$PWD" \
#       research/2026-10-16-diagnosis/newcomers/power/power_with_newcomers.json 4000
import sys, os, json
repo, out, sims = sys.argv[1], sys.argv[2], int(sys.argv[3])
prereg = os.path.join(repo, 'research/2026-10-16-diagnosis/prereg')
src = open(os.path.join(prereg, 'power_sim.py')).read()
head = src.split("\nres = {'version': 2", 1)[0]
sys.argv = ['power_sim.py', os.devnull, str(sims)]
g = {'__file__': os.path.join(prereg, 'power_sim.py'), '__name__': 'power_sim_head'}
exec(compile(head, 'power_sim.py', 'exec'), g)
ncf = json.load(open(os.path.join(repo, 'research/2026-10-16-diagnosis/newcomers/newcomers.json')))
nc = {k: ncf[k] for k in ('mean_change', 'mean_change_se', 'drift_sd')}
nc['players'] = ncf['players']
rows = []
plan = []
for mu in (9.8, 12.5):
    for r in (0.0, 0.15, 0.25, 1 / 3, 0.5):
        plan.append((mu, r, 1.6, 'phase', 0.0))
for mu in (9.8, 12.5):
    for tau in (0.0, 2.6):
        for r in (0.0, 1 / 3, 0.5):
            plan.append((mu, r, tau, 'phase', 0.0))
for learn in (1.0, 2.0):
    for tau in (0.0, 1.6):
        plan.append((9.8, 0.0, tau, 'phase', learn))
for tau in (1.6,):
    for r in (0.0, 1 / 3, 0.5):
        plan.append((9.8, r, tau, 'ar1', 0.0))
for mu, r, tau, shape, learn in plan:
    o = g['run'](mu, r, tau, shape, sims, learn, nc)
    row = {'mu': mu, 'true_drop': round(r, 3), 'tau_true': tau, 'drift_shape': shape, 'natural_learning_drop': learn,
           'newcomers': nc, **o}
    rows.append(row)
    print(json.dumps(row), flush=True)
json.dump({'sims_per_scenario': sims, 'seed_note': 'power_sim.py seed 20261016, then this scenario order',
           'newcomers_file_sha256_prefix': 'c3ca7bbe', 'rows': rows}, open(out, 'w'), indent=1)
