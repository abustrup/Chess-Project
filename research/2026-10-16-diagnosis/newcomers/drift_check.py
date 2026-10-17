# Descriptive check of newcomers.json's drift_sd (does not change newcomers.json or the verdict).
# Question: is the estimated drift real, or could the estimator report it from noise alone, given that each player
# has only about 9 analysed games in games 11-40 and 14 in games 61-160?
# Method: for each kept player, pool his analysed games from both windows and deal them back at random into windows
# of the same sizes, so his true rate is the same in both by construction (no drift). Run the same estimator
# (newcomers.summary) 1,000 times. If the shuffled drift is usually near 0 and the real one is not, the real drift is
# not an artifact of the estimator. Fixed seed, so the output is the same on every run. Also reports the same
# numbers for the players who began 10+0 in 2025 or 2026 (the only split reported).
# usage: .venv/bin/python -I research/2026-10-16-diagnosis/newcomers/drift_check.py [--work DIR] [--out FILE]
import os, sys, json, random, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True
import newcomers as nc   # noqa: E402

SHUFFLES, SEED = 1000, 20261017
RECENT_MS = 1735689600000   # 2025-01-01 00:00 UTC: the one split reported, players who began 10+0 in 2025-2026


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--work', default=nc.default_work())
    ap.add_argument('--out', default=os.path.join(HERE, 'drift_check.json'))
    a = ap.parse_args()
    nc.check_prereg_hashes()
    kept, _, st = nc.walk(a.work)
    if st['state'] != 'complete':
        raise SystemExit(f"the saved answers are not complete ({st['state']}); finish the fetch first")
    per = []; recent = []
    for p in kept:
        base = nc.analysed_rows(p['rows'], nc.BASE); train = nc.analysed_rows(p['rows'], nc.TRAIN)
        per.append((base, train))
        if p['rows'][0]['t'] >= RECENT_MS:
            recent.append((base, train))
    def estimate(pairs):
        ch, sv = [], []
        for b, t in pairs:
            rb, rt = nc.ratio(b), nc.ratio(t)
            ch.append(rt['rate'] - rb['rate']); sv.append(rb['var'] + rt['var'])
        return nc.summary(ch, sv)
    real = estimate(per)
    rng = random.Random(SEED); drift = []; raw = []
    for _ in range(SHUFFLES):
        pairs = []
        for b, t in per:
            g = b + t; ix = list(range(len(g))); rng.shuffle(ix)
            pairs.append(([g[i] for i in ix[:len(b)]], [g[i] for i in ix[len(b):]]))
        ch, sv = [], []
        for b, t in pairs:
            rb, rt = nc.ratio(b), nc.ratio(t)
            ch.append(rt['rate'] - rb['rate']); sv.append(rb['var'] + rt['var'])
        d2 = nc.svar(ch) - nc.mean(sv)
        raw.append(d2); drift.append(max(0.0, d2) ** 0.5)
    drift.sort(); raw.sort()
    out = {'what': 'drift_sd from newcomers.json against the same estimator on shuffled games (no drift by construction)',
           'players': len(per), 'shuffles': SHUFFLES, 'seed': SEED,
           'real': {'drift_sd': nc.r4(real['drift_sd']), 'drift_variance_before_floor': nc.r4(real['drift_variance_raw'])},
           'shuffled': {'drift_sd_median': nc.r4(drift[SHUFFLES // 2]), 'drift_sd_95th_percentile': nc.r4(drift[int(.95 * SHUFFLES) - 1]),
                        'share_floored_at_0': round(sum(1 for x in raw if x <= 0) / SHUFFLES, 3),
                        'drift_variance_mean': nc.r4(sum(raw) / SHUFFLES)},
           'share_of_shuffles_at_or_above_real': round(sum(1 for x in drift if x >= real['drift_sd']) / SHUFFLES, 4)}
    if len(recent) >= 2:
        r = estimate(recent)
        out['began_10_0_in_2025_or_2026'] = {'players': len(recent), 'mean_change': nc.r4(r['mean_change']),
                                             'mean_change_se': nc.r4(r['mean_change_se']), 'drift_sd': nc.r4(r['drift_sd'])}
    with open(a.out, 'w') as f:
        f.write(json.dumps(out, indent=1) + '\n')
    print(json.dumps(out, indent=1))


if __name__ == '__main__':
    main()
