# Marks a problem in public/data/study/status.json after the measurement was saved (for instance the Safety-check
# cards could not be rebuilt): lastRunOk becomes false and the problem is listed. The measurement is left alone.
# Usage, from the repo root:  python -I scripts/measure/status_note.py --problem "text" [--public DIR]
import argparse, json, os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import REPO, load_config, write_text   # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--problem', required=True)
    ap.add_argument('--public')
    a = ap.parse_args()
    public = a.public or os.path.join(REPO, load_config(REPO)['paths']['public'])
    path = os.path.join(public, 'status.json')
    status = json.load(open(path, encoding='utf-8'))
    status['lastRunOk'] = False
    status['problems'] = list(status.get('problems') or []) + [a.problem]
    write_text(path, json.dumps(status, indent=1, ensure_ascii=False) + '\n')
    print(f'status.json: lastRunOk false; problem noted: {a.problem}')


if __name__ == '__main__':
    main()
