# Made 2026-10-16 by the fixer after the final critique (task N1 evidence, preregistration.md 3.3).
# Mechanism scenarios of power_sim.py, with the committed newcomers.json binding in the main rule.
# Re-run from the repo root (about 1 minute):
#   .venv/bin/python -I -B research/2026-10-16-diagnosis/newcomers/power/mechanism_with_newcomers.py "$PWD" \
#       research/2026-10-16-diagnosis/newcomers/power/mechanism_with_newcomers.json 2000
import sys, os, json
repo, out, sims = sys.argv[1], sys.argv[2], int(sys.argv[3])
prereg = os.path.join(repo, 'research/2026-10-16-diagnosis/prereg')
src = open(os.path.join(prereg, 'power_sim.py')).read()
head = src.split("\nres = {'version': 2", 1)[0]
sys.argv = ['power_sim.py', os.devnull, str(sims)]
g = {'__file__': os.path.join(prereg, 'power_sim.py'), '__name__': 'power_sim_head'}
exec(compile(head, 'power_sim.py', 'exec'), g)
V = g['V']; W = g['W']
ncf = json.load(open(os.path.join(repo, 'research/2026-10-16-diagnosis/newcomers/newcomers.json')))
nc = {k: ncf[k] for k in ('players', 'mean_change', 'mean_change_se', 'drift_sd')}
rows = []
for mu in (9.8, 12.5):
    for rt, ro, label in ((0.0, 0.0, 'no effect'), (0.2, 0.2, 'same 20%'), (0.3, 0.0, 'threat -30%'),
                          (0.5, 0.0, 'threat halved'), (0.5, 0.15, 'threat halved, others -15%')):
        sup = worked = 0
        A_lo, A_hi = W['baseline']; B_lo, B_hi = W['looks'][-1]['window']
        for _ in range(sims):
            r = g['mech_series'](mu, rt, ro, 1.6)
            k = V.mechanism([x for x in r if A_lo <= x['seq'] <= A_hi], [x for x in r if B_lo <= x['seq'] <= B_hi])
            sup += k['reading'] == 'mechanism supported'
            worked += V.primary(r, nc=nc)['verdict'].startswith(V.LABEL_WORKED)
        row = {'mu': mu, 'scenario': label, 'mechanism_supported': round(sup / sims, 3), 'main_worked_with_newcomers': round(worked / sims, 3)}
        rows.append(row); print(json.dumps(row), flush=True)
json.dump(rows, open(out, 'w'), indent=1)
