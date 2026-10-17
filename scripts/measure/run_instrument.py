# Runs the pre-registered fixture check (prereg/check_instrument.py, with --engine) on the Stockfish binary the job
# will measure with, and writes the result as JSON for status.json's `instrumentCheck`. daily.py refuses to measure
# unless this file says the check passed on exactly that binary (same SHA-256).
# Usage, from the repo root:
#   .venv/bin/python -I scripts/measure/run_instrument.py --stockfish PATH --out instrument.json [--no-engine]
# --no-engine runs only the 1-second part (saved evals); the job always runs the full check.
import argparse, json, os, platform, subprocess, sys, time
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import REPO, load_config, sha256_file, utc_iso, verify_prereg   # noqa: E402


def engine_name(path):
    try:
        r = subprocess.run([path], input='uci\nquit\n', capture_output=True, text=True, timeout=60)
    except (OSError, subprocess.TimeoutExpired) as e:
        return None, str(e)
    for line in r.stdout.splitlines():
        if line.startswith('id name '):
            return line[len('id name '):].strip(), None
    return None, 'no "id name" line'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stockfish', default=os.environ.get('STOCKFISH', '/opt/homebrew/bin/stockfish'))
    ap.add_argument('--out', required=True)
    ap.add_argument('--root', default=REPO)
    ap.add_argument('--no-engine', action='store_true')
    ap.add_argument('--summary', help='append a Markdown table here (GitHub: $GITHUB_STEP_SUMMARY)')
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    cfg = load_config(root)
    sf = os.path.abspath(a.stockfish)
    res = {'passed': False, 'at': utc_iso(), 'engineCheckRun': not a.no_engine, 'stockfish': None,
           'binarySha256': None, 'platform': f'{platform.system()} {platform.machine()}',
           'python': platform.python_version(), 'pythonChess': None, 'fixture': None, 'engineCheck': None,
           'seconds': None, 'problem': None}
    t0 = time.time()
    problems = verify_prereg(root, cfg)
    name, err = engine_name(sf)
    try:
        import chess
        res['pythonChess'] = chess.__version__
    except ImportError:
        problems.append('python-chess is not installed')
    if problems:
        res['problem'] = '; '.join(problems)
    elif name is None:
        res['problem'] = f'{sf} does not answer as a UCI engine ({err})'
    else:
        res['stockfish'] = name
        res['binarySha256'] = sha256_file(sf)
        cmd = [sys.executable, '-I', '-B', os.path.join(root, cfg['prereg']['dir'], 'check_instrument.py')]
        if not a.no_engine:
            cmd.append('--engine')
        r = subprocess.run(cmd, capture_output=True, text=True, env={**os.environ, 'STOCKFISH': sf}, cwd=root)
        lines = r.stdout.splitlines()
        res['fixture'] = next((l for l in lines if l.startswith('fixture check passed')), None)
        res['engineCheck'] = next((l for l in lines if l.startswith('engine check passed')), None)
        ok = r.returncode == 0 and res['fixture'] and (a.no_engine or res['engineCheck'])
        res['passed'] = bool(ok)
        if not ok:
            tail = (r.stderr.strip().splitlines() or ['no message'])[-1]
            res['problem'] = f'check_instrument.py failed (exit {r.returncode}): {tail[:300]}'
    res['seconds'] = round(time.time() - t0, 1)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(res, f, indent=1)
        f.write('\n')
    print(json.dumps(res, indent=1))
    if a.summary:
        rows = [('Result', 'PASSED' if res['passed'] else f'FAILED: {res["problem"]}'), ('Stockfish', res['stockfish']),
                ('Binary SHA-256', f'`{res["binarySha256"]}`'), ('Machine', f'{res["platform"]}, Python {res["python"]}, '
                f'python-chess {res["pythonChess"]}'), ('Fixture check', res['fixture']), ('Engine re-search', res['engineCheck']),
                ('Time', f'{res["seconds"]} s'), ('At', res['at'])]
        with open(a.summary, 'a') as f:
            f.write('### Instrument check (prereg check_instrument.py --engine)\n\n| | |\n|---|---|\n'
                    + ''.join(f'| {k} | {v} |\n' for k, v in rows) + '\n')
    sys.exit(0 if res['passed'] else 1)


if __name__ == '__main__':
    main()
