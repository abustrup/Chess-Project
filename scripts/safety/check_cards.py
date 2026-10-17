#!/usr/bin/env python3
# Checks for the Safety-check card file. Usage and what each check means: README.md in this folder.
#   always      : Lichess rule vectors (trainer-spec A1-A5, in Python); material-claim and win% rounding vectors;
#                 schema (cards.schema.json); trainer-spec B1-B3,
#                 B6, B8 on every card; the two new checks (a quiet fact never sits on a failing game move; no fact
#                 claims material unless its line wins 2+); held/quiet game moves pass when within 4 points or safe; own game
#                 moves fail; no URL and no opponent username in the file.
#   --diagnosis : the 31 blitz games of 2026-10-16: the classifier port reproduces moves.jsonl on all 891 moves; own cards
#                 = the 99 mistakes.json records minus the listed exclusions; held = the 82 threatened positions with no
#                 Blunder or Mistake minus the listed exclusions; all 16 nothing_to_win Blunders are cards.
#   --engine N  : trainer-spec B10 on N random cards: every legal move searched on its own at the card setting; the stage
#                 rule must agree on at least 98% of the moves it decides without the engine. On held and quiet cards the
#                 full check is the 4-point rule or the safety rule with the fresh eval (the material part comes from
#                 the stored line, which the fast checks recompute).
#   --rebuild warm|cold : trainer-spec B11: rebuild into a scratch folder (warm = from the caches, cold = empty caches,
#                 every search repeated) and compare the bytes with the file.
import argparse, json, os, random, subprocess, sys, tempfile, time, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import chess
import retro_rule as R
import card_checks as K
import facts as F
import classify as C
import build_cards as B

ROOT = B.ROOT
DIAG = os.path.join(ROOT, 'research', '2026-10-16-diagnosis', 'my-games')


def say(ok, name, detail):
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {detail}", flush=True)
    return ok


def diagnosis(doc, report, cfg):
    ok = True
    games = [g for g in B.load_games(cfg['base']['games']) if B.eligible(g, cfg['user'], cfg['speeds'])]
    evals = B.load_evals(cfg['base']['evals'], cfg['measurement']['nodes'], cfg['measurement']['nullNodes'])
    lines = B.load_lines(cfg['base']['lines'])
    ref = {}
    for l in open(os.path.join(DIAG, 'out', 'moves.jsonl')):
        r = json.loads(l); ref[(r['game_id'], r['ply'])] = r
    keys = ('judgment', 'lichess_judgment', 'category', 'research_category', 'material', 'threat_before', 'threat_was_real',
            'threat_executed_next', 'win_pct_before', 'win_pct_after', 'win_pct_drop', 'fen_before', 'move_uci',
            'opponent_mate_in', 'time_spent_s', 'clock_left_s', 'phase_research')
    n = diffs = 0
    for g in games:
        gl = {ply: v for (gid, ply), v in lines.items() if gid == g['id']}
        for m in C.classify_game(g, evals[g['id']]['positions'], gl, cfg['user']):
            n += 1; o = ref.get((m['game_id'], m['ply']))
            if o is None or any(m[k] != o[k] for k in keys) or any(o['flags'][k] != v for k, v in m['flags'].items()):
                diffs += 1
    ok &= say(n == len(ref) == 891 and diffs == 0, 'classifier reproduces moves.jsonl', f'{n} moves, {diffs} differ (reference {len(ref)})')

    mis = json.load(open(os.path.join(DIAG, 'mistakes.json')))['mistakes']
    uni = {(r['game_id'], r['ply']): r for r in mis if r['category'] in C.OWN_CATEGORIES or r['flags']['something_to_defend']}
    jb = sum(1 for r in uni.values() if r['judgment'] == 'Blunder'); jm = sum(1 for r in uni.values() if r['judgment'] == 'Mistake')
    lo = sum(1 for r in uni.values() if r['judgment'] not in ('Blunder', 'Mistake') and r['lichess_judgment'] in ('Blunder', 'Mistake'))
    ok &= say((len(uni), jb, jm, lo) == (99, 74, 23, 2), 'own-card universe in mistakes.json',
              f'{len(uni)} records: {jb} Blunders, {jm} Mistakes, {lo} Lichess-only Mistakes (expected 99: 74, 23, 2)')
    cards = doc['cards']
    key = lambda cid: (cid.split(':')[1], int(cid.split(':')[2]))
    own = {key(c['id']) for c in cards if c['kind'] == 'own'}
    held = {key(c['id']) for c in cards if c['kind'] == 'held'}
    x_own = {key(x['id']): x for x in report['excluded'] if x['kind'] == 'own'}
    x_held = {key(x['id']): x for x in report['excluded'] if x['kind'] == 'held'}
    ok &= say(own | set(x_own) == set(uni) and not (own & set(x_own)) and all(x['reasons'] for x in x_own.values()),
              'own cards = the 99 records minus listed exclusions',
              f'{len(own)} cards + {len(x_own)} listed exclusions = {len(own | set(x_own))}; '
              f'extra cards {sorted(own - set(uni))}, missing {sorted(set(uni) - own - set(x_own))}')
    thr = {k: r for k, r in ref.items() if r['threat_was_real']}
    hu = {k for k, r in thr.items() if r['judgment'] not in ('Blunder', 'Mistake') and r['lichess_judgment'] not in ('Blunder', 'Mistake')}
    bm = len(thr) - len({k for k, r in thr.items() if r['judgment'] not in ('Blunder', 'Mistake')})
    ok &= say(len(thr) == 126 and bm == 44 and len(hu) == 82, 'held universe',
              f'{len(thr)} threatened positions, {bm} with a Blunder or Mistake, {len(hu)} held (expected 126, 44, 82)')
    ok &= say(held | set(x_held) == hu and not (held & set(x_held)) and all(x['reasons'] for x in x_held.values()),
              'held cards = the 82 threatened positions minus listed exclusions',
              f'{len(held)} cards + {len(x_held)} listed exclusions; extra {sorted(held - hu)}, missing {sorted(hu - held - set(x_held))}')
    ntw = {(r['game_id'], r['ply']) for r in mis if r['flags']['nothing_to_win'] and r['judgment'] == 'Blunder'}
    flagged = {key(c['id']) for c in cards if c['nothingToWin']}
    ok &= say(len(ntw) == 16 and ntw <= own, 'all 16 nothing_to_win Blunders are own cards',
              f'{len(ntw & own)} of {len(ntw)} present; {len(ntw & flagged)} of them keep the card flag under the stricter '
              f'card rule (best move at 65% or less, no winning capture)')
    for x in sorted(list(x_own.values()) + list(x_held.values()), key=lambda x: key(x['id'])):
        print(f"      excluded {x['id']} ({x['judgment'] or '-'} / Lichess {x['lichessJudgment'] or '-'}, {x['category']}): "
              + '; '.join(x['reasons']))
    return ok


def engine_check(doc, cfg, n, workers, stockfish, cache):
    """B10. Every legal move of n random cards searched on its own (root_moves) at the card setting."""
    import engine as E
    rng = random.Random(20261016)
    sample = rng.sample(doc['cards'], min(n, len(doc['cards'])))
    eng = E.Engines(stockfish, cfg['engine']['name'], workers, cache, cfg['engine']['threads'], cfg['engine']['hashMb'])
    nodes = cfg['cards']['nodes']
    jobs = []
    for c in sample:
        b = K.card_board(c)
        for mv in sorted(m.uci() for m in b.legal_moves):
            jobs.append((c, b.fen(), mv))
    t0 = time.time()
    try:
        res = eng.map(lambda j: eng.search(j[1], nodes, 1, root_moves=[j[2]])[0]['score'], jobs)
    finally:
        eng.save(); eng.close()
    decided = agree = undecided = 0; bad = []
    by_step = {}
    for (c, fen, mv), ev in zip(jobs, res):
        full = R.retro_accept(c['side'] == 'white', ev, c['top'][0]['eval'])
        stored = next((e for e in c.get('moves', []) if e['uci'] == mv), None) if c['kind'] != 'own' else None
        if stored is not None and not full and 'line' in stored:
            full = K.safe_by_rule(c['side'] == 'white', ev, c['top'][0]['eval'], stored['gain'])
        stage, step = K.stage_verdict(c, mv)
        if stage is None:
            undecided += 1; continue
        decided += 1
        s = by_step.setdefault(step, [0, 0]); s[0] += 1
        if stage == full:
            agree += 1; s[1] += 1
        else:
            bad.append((c['id'], mv, step, stage, full))
    share = agree / decided if decided else 0
    ok = say(share >= 0.98, 'B10 stage rule against a full check',
             f'{agree} of {decided} decided moves agree ({share:.1%}) on {len(sample)} cards; {undecided} moves left to the '
             f'browser engine; by step {by_step}; {time.time() - t0:.0f} s')
    for x in bad[:25]:
        print('      disagree', x)
    return ok


def rebuild(mode, cfg, workers, stockfish, out_file, report_file):
    tmp = tempfile.mkdtemp(prefix='safety-rebuild-', dir=os.environ.get('SAFETY_SCRATCH'))
    try:
        ec, vc = os.path.join(tmp, 'engine-cache.jsonl'), os.path.join(tmp, 'evals.jsonl')
        if mode == 'warm':
            for src, dst in ((cfg['paths']['engineCache'], ec), (cfg['paths']['evalsCache'], vc)):
                if os.path.exists(B.rp(src)):
                    shutil.copy(B.rp(src), dst)
        outs = []
        for k in (1, 2) if mode == 'warm' else (1,):
            o, r = os.path.join(tmp, f'cards{k}.json'), os.path.join(tmp, f'report{k}.json')
            t0 = time.time()
            cmd = [sys.executable, '-I', os.path.join(HERE, 'build_cards.py'), '--out', o, '--report', r, '--engine-cache', ec,
                   '--evals-cache', vc, '--workers', str(workers), '--stockfish', stockfish]
            subprocess.run(cmd, check=True)
            outs.append((open(o, 'rb').read(), open(r, 'rb').read(), time.time() - t0))
        ref = open(out_file, 'rb').read(); ref_r = open(report_file, 'rb').read()
        same = all(o == ref and r == ref_r for o, r, _ in outs)
        return say(same, f'B11 {mode} rebuild is byte-identical',
                   f'{len(outs)} rebuild(s) in ' + ', '.join(f'{t:.0f} s' for _, _, t in outs) + f'; cards.json {len(ref)} bytes; '
                   f'cards {"same" if all(o == ref for o, _, _ in outs) else "DIFFERENT"}, report '
                   f'{"same" if all(r == ref_r for _, r, _ in outs) else "DIFFERENT"}')
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--config', default=os.path.join(HERE, 'config.json'))
    ap.add_argument('--file'); ap.add_argument('--report')
    ap.add_argument('--games', action='append', default=[], help='extra exports whose usernames the privacy scan must not find')
    ap.add_argument('--diagnosis', action='store_true')
    ap.add_argument('--engine', type=int, nargs='?', const=50, default=0)
    ap.add_argument('--rebuild', choices=('warm', 'cold'))
    ap.add_argument('--workers', type=int, default=3)
    ap.add_argument('--stockfish', default=os.environ.get('STOCKFISH', '/opt/homebrew/bin/stockfish'))
    ap.add_argument('--check-cache', default=os.path.join(HERE, '.cache', 'check-cache.jsonl'))
    a = ap.parse_args()
    cfg = json.load(open(a.config))
    path = B.rp(a.file or cfg['paths']['out']); rpath = B.rp(a.report or cfg['paths']['report'])
    text = open(path).read(); doc = json.loads(text)
    ok = True
    got, total, bad = R.self_test()
    ok &= say(not bad, 'Lichess retro rule vectors (trainer-spec A1-A5)', f'{got} of {total}')
    got, total, bad = F.self_test()
    ok &= say(not bad, 'material-claim vectors (a line must end with no exchange open)', f'{got} of {total}'
              + (f'; failing {bad}' if bad else ''))
    # rounding (verifier, 2026-10-16): pairs whose 2-decimal win% would flip the 4-point decision keep more decimals
    cases = [(True, [{'cp': -295}, {'cp': -356}]), (True, [{'cp': -589}, {'cp': -735}]), (True, [{'cp': -574}, {'cp': -712}]),
             (False, [{'cp': 295}, {'cp': 356}]), (True, [{'cp': 40}, {'cp': 10}, {'cp': -100}])]
    flips = 0
    for side_white, evals in cases:
        top = [{'eval': e} for e in evals]
        B.round_wins(top, side_white)
        flips += any(R.retro_accept(side_white, e['eval'], top[0]['eval']) != (e['win'] > top[0]['win'] - 4)
                     or abs(R.win_pct(side_white, e['eval']) - e['win']) > 0.006 for e in top)
    ok &= say(not flips, 'stored win% never flips the 4-point decision (rounding vectors)', f'{len(cases) - flips} of {len(cases)}')
    games = B.load_games(cfg['base']['games'] + a.games)
    names = K.other_names(games, cfg['user'])
    problems = K.check_file(doc, names)
    ok &= say(not problems, 'schema, B1-B3, B6, B8, new checks, privacy',
              f"{len(doc['cards'])} cards ({doc['counts']}), {len(problems)} problems; scanned for {len(names)} opponent usernames"
              + (': ' + '; '.join(problems[:10]) if problems else ''))
    quiet = doc['counts']['quiet']
    ok &= say(quiet <= 0.15 * len(doc['cards']), 'quiet share at most 15%', f'{quiet} of {len(doc["cards"])} ({quiet / max(1, len(doc["cards"])):.1%})')
    pos = [' '.join(K.card_board(c).fen().split()[:4]) for c in doc['cards']]
    print(f'INFO  {len(pos) - len(set(pos))} positions occur on two cards (repetitions in different games are allowed)')
    report = json.load(open(rpath))
    if a.diagnosis:
        ok &= diagnosis(doc, report, cfg)
    if a.engine:
        os.makedirs(os.path.dirname(a.check_cache), exist_ok=True)
        ok &= engine_check(doc, cfg, a.engine, a.workers, a.stockfish, a.check_cache)
    if a.rebuild:
        ok &= rebuild(a.rebuild, cfg, a.workers, a.stockfish, path, rpath)
    print('ALL PASS' if ok else 'SOME CHECKS FAILED')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
