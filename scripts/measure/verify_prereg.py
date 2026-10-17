# Refuses (exit code 1, every differing file named) when a pre-registered file differs from its SHA-256 in
# research/2026-10-16-diagnosis/preregistration.md section 3.9, or when that table and scripts/measure/config.json
# disagree. The daily job runs this first, and daily.py runs it again before it imports anything from prereg/.
# Usage, from the repo root:  .venv/bin/python -I scripts/measure/verify_prereg.py [--root DIR]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import REPO, load_config, verify_prereg   # noqa: E402


def main():
    args = sys.argv[1:]
    root = os.path.abspath(args[args.index('--root') + 1]) if '--root' in args else REPO
    cfg = load_config(REPO)   # the pins come from this checkout, the files from --root
    problems = verify_prereg(root, cfg)
    if problems:
        print('REFUSED: the pre-registered instrument does not match its hashes, so nothing is measured.', file=sys.stderr)
        for p in problems:
            print(f'  {p}', file=sys.stderr)
        sys.exit(1)
    n = len(cfg['prereg']['hashes']) + len(cfg.get('instrumentInputs', {}).get('hashes', {}))
    print(f'pre-registered files match their hashes ({n} of {n})')


if __name__ == '__main__':
    main()
