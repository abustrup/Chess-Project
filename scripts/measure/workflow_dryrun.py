#!/usr/bin/env python3
"""Runs the steps of .github/workflows/measure.yml on this Mac, without GitHub, to test the workflow's own logic.

Each scenario builds a throwaway copy of the repo (the files the job needs, committed on "main"), a bare "origin" to
push to, and a checkout of it, then runs every `run:` step with the env GitHub would give it, the step `if:`
conditions, continue-on-error and the outputs between steps. `uses:` steps are stood in for: checkout = the clone,
setup-python = .venv's python as `python`, cache and upload-artifact = nothing. The Stockfish step is fed a tar of
the Mac's own Stockfish 19 (its SHA-256 replaces the Linux file's), and `gh` is a stand-in that only records its
arguments, so nothing reaches GitHub. Lichess is asked for real in the "live" scenarios (one request each).

Scenarios (all by default; --only to pick):
  dry       dry run, live Lichess: the job measures and writes status.json, but commits and pushes nothing
  live      real run on the 12-game fixture with the real engine: the measurement is pushed (the first push is
            rejected once by the remote, and someone else pushes in between, so the retry and the rebase are used),
            deploy.yml is started; a second run adds a heartbeat commit and 0 rows; games.csv stays a prefix
  tamper    a pre-registered file differs: the job stops at the hash step and pushes nothing
  cardsfail scripts/safety/build_cards.py fails: the measurement is pushed, the cards are not, status.json says
            lastRunOk false, and the run ends red
  cardsok   scripts/safety/build_cards.py writes a card file: it is pushed in a second commit and deploy.yml started again
  pages     deploy.yml while GitHub Pages is off (404), on (publishes from Actions), set to a branch, or unreadable:
            its "Is GitHub Pages switched on?" step decides, and only "on" (or unreadable) reaches the publish steps,
            so a measurement that starts deploy.yml never meets a red deploy just because Pages is off
Usage (needs PyYAML, e.g. the Mac's python3; temp folders are removed afterwards):
    python3 scripts/measure/workflow_dryrun.py --work <scratch> [--only dry,live,...] [--keep]
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile, time
import yaml

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VENV_PY = os.path.join(REPO, '.venv', 'bin', 'python')
STOCKFISH = os.environ.get('STOCKFISH') or '/opt/homebrew/bin/stockfish'
WF = yaml.safe_load(open(os.path.join(REPO, '.github', 'workflows', 'measure.yml')))
CFG = json.load(open(os.path.join(REPO, 'scripts', 'measure', 'config.json')))
results = []


def check(name, ok, detail=''):
    results.append((name, bool(ok)))
    print(f'{"ok  " if ok else "FAIL"} {name}' + (f'  ({detail})' if detail and not ok else ''), flush=True)


def sh(cmd, cwd=None, env=None, check_=True):
    r = subprocess.run(['bash', '-c', cmd], cwd=cwd, env=env, capture_output=True, text=True)
    if check_ and r.returncode:
        raise RuntimeError(f'{cmd}\n{r.stdout}\n{r.stderr}')
    return r


def git(d, *a):
    return subprocess.run(['git', '-C', d] + list(a), check=True, capture_output=True, text=True).stdout


def setup(base, extra_files=None, tamper=False):
    """src repo -> bare origin -> runner checkout. Returns (origin, checkout)."""
    src = os.path.join(base, 'src')
    files = ['.github/workflows/measure.yml', CFG['prereg']['doc']] + \
        [f'{CFG["prereg"]["dir"]}/{f}' for f in CFG['prereg']['hashes']] + list(CFG['instrumentInputs']['hashes'])
    for dp, dn, fn in os.walk(os.path.join(REPO, 'scripts', 'measure')):
        dn[:] = [d for d in dn if d != '__pycache__']
        files += [os.path.relpath(os.path.join(dp, f), REPO) for f in fn]
    for f in files:
        os.makedirs(os.path.dirname(os.path.join(src, f)), exist_ok=True)
        shutil.copyfile(os.path.join(REPO, f), os.path.join(src, f))
    for f, text in (extra_files or {}).items():
        os.makedirs(os.path.dirname(os.path.join(src, f)), exist_ok=True)
        open(os.path.join(src, f), 'w').write(text)
    if tamper:
        p = os.path.join(src, CFG['prereg']['dir'], 'verdict.py')
        open(p, 'a').write('\n# edited\n')
    sh('git init -q -b main && git add -A && git -c user.name=t -c user.email=t@example.invalid commit -q -m base', cwd=src)
    origin = os.path.join(base, 'origin.git')
    sh(f'git clone -q --bare "{src}" "{origin}"')
    co = os.path.join(base, 'checkout')
    sh(f'git clone -q "{origin}" "{co}"')
    return origin, co


def tools(base):
    """bin folder: python (the venv), gh (records its arguments), and a Stockfish tar for the install step."""
    b = os.path.join(base, 'bin')
    os.makedirs(b)
    open(os.path.join(b, 'python'), 'w').write(f'#!/bin/sh\nexec "{VENV_PY}" "$@"\n')   # a symlink would lose the venv
    os.chmod(os.path.join(b, 'python'), 0o755)
    open(os.path.join(b, 'gh'), 'w').write(f'#!/bin/sh\necho "gh $*" >> "{base}/gh-calls.txt"\n')
    os.chmod(os.path.join(b, 'gh'), 0o755)
    home = os.path.join(base, 'home')
    os.makedirs(os.path.join(home, 'sf-download'))
    stage = os.path.join(base, 'sf-stage', 'stockfish')
    os.makedirs(stage)
    shutil.copy(STOCKFISH, os.path.join(stage, 'stockfish-macos-arm64'))
    tar = os.path.join(home, 'sf-download', 'sf.tar.gz')
    sh(f'tar -czf "{tar}" -C "{os.path.dirname(stage)}" stockfish')
    sha = sh(f'shasum -a 256 "{tar}"').stdout.split()[0]
    return b, home, sha


def expr(e, ctx):
    """The few expressions measure.yml uses; anything else raises, so a new expression is noticed here."""
    e = e.strip()
    known = {
        "github.event_name == 'workflow_dispatch' && inputs.dry_run": 'true' if ctx['dry_run'] else 'false',
        'github.token': 'test-token', 'github.ref_name': 'main', 'github.run_id': '1',
        'steps.measure.outputs.message': ctx['outputs'].get('measure', {}).get('message', ''),
        'env.SF_SHA256': ctx['env'].get('SF_SHA256', ''), 'runner.temp': ctx['runner_temp'],
        # no deploy key here: the throwaway origin takes plain pushes (as GitHub does while main is unprotected)
        "secrets.MEASURE_DEPLOY_KEY != '' && 'the deploy key MEASURE_DEPLOY_KEY' || 'the job token'": 'the job token',
    }
    if e in known:
        return known[e]
    raise KeyError(f'expression not handled by the dry run: {e}')


def subst(text, ctx):
    return re.sub(r'\$\{\{(.*?)\}\}', lambda m: str(expr(m.group(1), ctx)), str(text))


def cond(c, ctx):
    """GitHub `if:`: no status function means success() && ..."""
    if c is None:
        return not ctx['failed']
    c = str(c).strip()
    if c == 'always()':
        return True
    m = re.fullmatch(r"env\.(\w+) != '(\w+)'", c)
    if m:
        return not ctx['failed'] and ctx['env'].get(m.group(1)) != m.group(2)
    m = re.fullmatch(r"steps\.(\w+)\.outputs\.(\w+) == '(\w+)'", c)
    if m:
        return not ctx['failed'] and ctx['outputs'].get(m.group(1), {}).get(m.group(2)) == m.group(3)
    m = re.fullmatch(r"steps\.(\w+)\.outcome == '(\w+)'", c)
    if m:
        return not ctx['failed'] and ctx['outcome'].get(m.group(1)) == m.group(2)
    raise KeyError(f'condition not handled by the dry run: {c}')


def run_job(base, co, dry_run, step_env=None, edit_run=None):
    """Runs the job's steps in order. Returns ctx (outcomes, outputs, failed flag, logs)."""
    b, home, sha = tools(base) if not os.path.exists(os.path.join(base, 'bin')) else (
        os.path.join(base, 'bin'), os.path.join(base, 'home'),
        sh(f'shasum -a 256 "{base}/home/sf-download/sf.tar.gz"').stdout.split()[0])
    rt = os.path.join(base, 'runner-temp')
    shutil.rmtree(rt, ignore_errors=True)
    os.makedirs(rt)
    ctx = {'dry_run': dry_run, 'outputs': {}, 'outcome': {}, 'failed': False, 'env': {}, 'runner_temp': rt, 'log': []}
    wf_env = {k: v for k, v in WF['env'].items()}
    wf_env['SF_SHA256'] = sha   # the Mac tar instead of the Linux release file
    env_file = os.path.join(rt, 'github_env')
    summary = os.path.join(rt, 'summary.md')
    open(env_file, 'w').close(); open(summary, 'w').close()
    ctx['env'] = {k: subst(v, ctx) for k, v in wf_env.items()}
    for s in WF['jobs']['measure']['steps']:
        sid = s.get('id', s.get('name', s.get('uses', '')))
        name = s.get('name', s.get('uses', s.get('run', ''))[:50])
        if 'uses' in s:
            ctx['log'].append(f'(stand-in) {name}')
            ctx['outcome'][sid] = 'success'
            continue
        if not cond(s.get('if'), ctx):
            ctx['outcome'][sid] = 'skipped'
            ctx['log'].append(f'skipped    {name}')
            continue
        if 'pip install' in s['run']:
            ctx['log'].append(f'(stand-in) {name}: .venv has python-chess')
            ctx['outcome'][sid] = 'success'
            continue
        out_file = os.path.join(rt, f'out-{len(ctx["log"])}')
        open(out_file, 'w').close()
        env = {'PATH': f'{b}:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin', 'HOME': home, 'RUNNER_TEMP': rt,
               'GITHUB_OUTPUT': out_file, 'GITHUB_ENV': env_file, 'GITHUB_STEP_SUMMARY': summary,
               'GITHUB_REF_NAME': 'main', 'GITHUB_REPOSITORY': 'test/Chess-Project', 'GITHUB_RUN_ID': '1',
               'GITHUB_EVENT_NAME': 'workflow_dispatch', 'LANG': 'C.UTF-8'}
        env.update(ctx['env'])
        for line in open(env_file):
            if '=' in line:
                k, v = line.rstrip('\n').split('=', 1); env[k] = v
        env.update({k: subst(v, ctx) for k, v in (s.get('env') or {}).items()})
        env.update(step_env or {})
        text = subst(s['run'], ctx)
        if edit_run:
            text = edit_run(sid, text)
        t = time.time()
        r = subprocess.run(['bash', '--noprofile', '--norc', '-eo', 'pipefail', '-c', text], cwd=co, env=env,
                           capture_output=True, text=True)
        outs = {}
        for line in open(out_file):
            if '=' in line:
                k, v = line.rstrip('\n').split('=', 1); outs[k] = v
        ctx['outputs'][sid] = outs
        ok = r.returncode == 0
        ctx['outcome'][sid] = 'success' if ok else 'failure'
        ctx['log'].append(f'{"ran   " if ok else "FAILED"}     {name} ({time.time() - t:.0f} s)')
        ctx.setdefault('stdout', {})[sid] = r.stdout + r.stderr
        if not ok and not s.get('continue-on-error'):
            ctx['failed'] = True
    ctx['summary'] = open(summary).read()
    return ctx


def origin_log(origin):
    return git(origin, 'log', '--format=%s', 'main').splitlines()


def origin_file(origin, path):
    r = subprocess.run(['git', '-C', origin, 'show', f'main:{path}'], capture_output=True)
    return r.stdout if r.returncode == 0 else None


def scenario_dry(base):
    origin, co = setup(base)
    before = origin_log(origin)
    ctx = run_job(base, co, dry_run=True)
    st = json.load(open(os.path.join(co, 'public/data/study/status.json'))) if os.path.exists(
        os.path.join(co, 'public/data/study/status.json')) else {}
    check('dry: every measuring step ran and passed', not ctx['failed'] and ctx['outcome'].get('measure') == 'success',
          '\n'.join(ctx['log']) + '\n' + str(ctx.get('stdout', {}).get('measure', ''))[-800:])
    check('dry: status.json written with the instrument check (passed) and a fresh asOf',
          # asOf is UTC, so today's date must be UTC too (the Mac's local date runs ahead of it before 02:00 in summer)
          st.get('instrumentCheck', {}).get('passed') is True and st.get('asOf', '') >= time.strftime('%Y-%m-%d', time.gmtime()), st)
    check('dry: nothing committed or pushed, deploy not started',
          origin_log(origin) == before and ctx['outcome'].get('push') == 'skipped'
          and not os.path.exists(os.path.join(base, 'gh-calls.txt')))
    check('dry: the run summary shows the instrument check', 'Instrument check' in ctx['summary']
          and 'engine check passed' in ctx['summary'], ctx['summary'][:500])
    print('\n'.join('     ' + l for l in ctx['log']))
    return ctx


def scenario_live(base):
    origin, co = setup(base)
    # the remote rejects the first push (as if a push raced it), and someone else pushes before the job does
    hook = os.path.join(origin, 'hooks', 'pre-receive')
    open(hook, 'w').write(f'#!/bin/sh\nif [ ! -f "{base}/rejected-once" ]; then touch "{base}/rejected-once"; '
                          f'echo "rejected once for the test" >&2; exit 1; fi\nexit 0\n')
    os.chmod(hook, 0o755)
    other = os.path.join(base, 'other')
    sh(f'git clone -q "{origin}" "{other}" && echo hello > "{other}/README.md" && git -C "{other}" add README.md && '
       f'git -C "{other}" -c user.name=o -c user.email=o@example.invalid commit -q -m "someone else" && '
       f'touch "{base}/rejected-once" && git -C "{other}" push -q origin main && rm "{base}/rejected-once"')
    fixture = os.path.join(co, 'scripts/measure/fixtures/blitz12_as_600.ndjson')
    feed = lambda sid, text: (text.replace('--workers 4', f'--workers 3 --input {fixture} --as-of 2026-10-16T20:00:00Z')
                              if sid == 'measure' else text)
    t = time.time()
    ctx = run_job(base, co, dry_run=False, step_env={'PUSH_WAIT': '1'}, edit_run=feed)
    log = origin_log(origin)
    check('live: the measurement was pushed after one rejected push and a rebase over someone else\'s commit',
          not ctx['failed'] and log[:2] == ['Daily measurement 2026-10-16: 12 new rated 10+0 games (12 counted)', 'someone else']
          and 'Push attempt 1 failed' in ctx['stdout'].get('push', ''), '\n'.join(ctx['log']) + str(log)
          + ctx['stdout'].get('push', '') + ctx['stdout'].get('measure', '')[-600:])
    gh = open(os.path.join(base, 'gh-calls.txt')).read() if os.path.exists(os.path.join(base, 'gh-calls.txt')) else ''
    check('live: deploy.yml was started after the push', gh.strip() == 'gh workflow run deploy.yml --ref main', gh)
    g1 = origin_file(origin, 'data/measure/games.csv')
    direct = os.path.join(base, 'direct.csv')
    td = time.time()
    subprocess.run([VENV_PY, '-I', '-B', os.path.join(REPO, CFG['prereg']['dir'], 'measure.py'), '--input', fixture,
                    '--out', direct, '--stockfish', STOCKFISH], check=True, capture_output=True)
    print(f'     (job with 12 new games: {td - t:.0f} s; direct measure.py run: {time.time() - td:.0f} s)')
    check('live: 12 rows, byte-identical to running measure.py directly (real Stockfish 19)',
          g1 is not None and g1 == open(direct, 'rb').read() and g1.count(b'\r\n') == 13)
    pushed = set(git(origin, 'show', '--name-only', '--format=', 'main').split())
    check('live: the commit holds only data/measure and public/data/study',
          pushed and all(p.startswith(('data/measure/', 'public/data/study/')) for p in pushed), pushed)
    # second run, same games: 0 rows, a heartbeat commit, games.csv unchanged (a prefix of itself)
    ctx2 = run_job(base, co, dry_run=False, step_env={'PUSH_WAIT': '1'},
                   edit_run=lambda sid, text: feed(sid, text).replace('2026-10-16T20:00:00Z', '2026-10-17T04:23:00Z'))
    g2 = origin_file(origin, 'data/measure/games.csv')
    runs = origin_file(origin, 'data/measure/runs.csv').decode().strip().splitlines()
    check('live: a second run adds 0 rows; old games.csv is a byte-exact prefix; one more heartbeat commit',
          not ctx2['failed'] and g2 is not None and g2.startswith(g1) and g2 == g1 and len(runs) == 3
          and origin_log(origin)[0].startswith('Daily measurement 2026-10-17: 0 new'), '\n'.join(ctx2['log']))
    print('\n'.join('     ' + l for l in ctx['log']))


def scenario_tamper(base):
    origin, co = setup(base, tamper=True)
    before = origin_log(origin)
    ctx = run_job(base, co, dry_run=False)
    hashstep = [k for k in ctx['outcome'] if k.startswith('The pre-registered files')][0]
    check('tamper: the hash step fails and names the file', ctx['outcome'][hashstep] == 'failure'
          and 'prereg/verdict.py differs' in ctx['stdout'][hashstep], ctx['stdout'].get(hashstep, ''))
    check('tamper: no later step ran, nothing pushed', ctx['outcome'].get('measure') == 'skipped'
          and ctx['outcome'].get('push') == 'skipped' and origin_log(origin) == before)


FAKE_BUILDER_FAIL = '''import sys
open('public/data/safety/cards.json', 'w').write('half a file')
sys.exit(2)
'''
FAKE_BUILDER_OK = '''import json, os
os.makedirs('public/data/safety', exist_ok=True); os.makedirs('data/safety', exist_ok=True)
json.dump({'cards': [], 'generatedAt': 'test'}, open('public/data/safety/cards.json', 'w'))
open('data/safety/report.json', 'w').write('{}')
'''


def scenario_cards(base, ok):
    files = {'scripts/safety/build_cards.py': FAKE_BUILDER_OK if ok else FAKE_BUILDER_FAIL,
             'public/data/safety/cards.json': '{"cards": ["old"]}',
             # games saved on an earlier day, so cards.sh has an export to build from (Lichess has none since 2026-10-16)
             'data/measure/export.ndjson': open(os.path.join(REPO, 'scripts/measure/fixtures/blitz12_as_600.ndjson')).read()}
    origin, co = setup(base, extra_files=files)
    ctx = run_job(base, co, dry_run=False, step_env={'PUSH_WAIT': '1'})
    log = origin_log(origin) + ['', '']
    st = json.loads(origin_file(origin, 'public/data/study/status.json') or b'{}')
    if len(log) < 5:
        print('\n'.join('     ' + l for l in ctx['log']))
        for k, v in ctx.get('stdout', {}).items():
            print(f'     --- {k}\n' + v[-1500:])
    gh = open(os.path.join(base, 'gh-calls.txt')).read().strip().splitlines() if os.path.exists(
        os.path.join(base, 'gh-calls.txt')) else []
    if ok:
        check('cardsok: measurement commit, then a separate cards commit; deploy started after each',
              not ctx['failed'] and log[0] == 'Safety-check cards after the daily measurement' and log[1].startswith('Daily measurement')
              and json.loads(origin_file(origin, 'public/data/safety/cards.json'))['generatedAt'] == 'test' and len(gh) == 2
              and st.get('lastRunOk') is True, '\n'.join(ctx['log']) + str(log))
    else:
        check('cardsfail: the measurement is pushed, the old cards stay, status.json says lastRunOk false',
              log[1].startswith('Daily measurement') and log[0] == 'Safety-check cards after the daily measurement'
              and origin_file(origin, 'public/data/safety/cards.json') == b'{"cards": ["old"]}'
              and st.get('lastRunOk') is False and 'not rebuilt' in ' '.join(st.get('problems', [])), '\n'.join(ctx['log']) + str(log))
        check('cardsfail: the run ends red (so GitHub e-mails), after the measurement was saved',
              ctx['failed'] and ctx['outcome'].get('cards') == 'failure' and ctx['outcome'].get('push') == 'success')


def scenario_pages(base):
    """deploy.yml's Pages question with a stand-in `gh` that answers as GitHub would in each case."""
    wf = yaml.safe_load(open(os.path.join(REPO, '.github', 'workflows', 'deploy.yml')))
    build = wf['jobs']['build']
    step = next(s for s in build['steps'] if s.get('id') == 'pages')
    gated = [s.get('name', s.get('uses')) for s in build['steps'] if s.get('if') == "steps.pages.outputs.on == 'true'"]
    check('pages: the Pages setup and upload steps run only when the question says "on"',
          {s.get('uses', '').split('@')[0] for s in build['steps'] if s.get('if') == "steps.pages.outputs.on == 'true'"}
          == {'actions/configure-pages', 'actions/upload-pages-artifact'}, gated)
    check('pages: the publish job runs only when the build job says "on"',
          wf['jobs']['deploy'].get('if') == "needs.build.outputs.pages_on == 'true'"
          and build.get('outputs', {}).get('pages_on') == '${{ steps.pages.outputs.on }}', wf['jobs']['deploy'].get('if'))
    check('pages: the build itself (npm run build) is not skipped, so a broken site still shows red',
          any('npm run build' in str(s.get('run', '')) and not s.get('if') for s in build['steps']))
    # what `gh api repos/<repo>/pages --jq .build_type` prints and its exit code (gh's own message on an HTTP error)
    cases = {'off': ('', 'gh: Not Found (HTTP 404)', 1, 'false', 'GitHub Pages is off'),
             'actions': ('workflow', '', 0, 'true', 'publishes from GitHub Actions'),
             'branch': ('legacy', '', 0, 'false', 'publishes from a branch'),
             'unreadable': ('', 'gh: Resource not accessible by integration (HTTP 403)', 1, 'true', 'Could not ask GitHub')}
    for name, (out, err, code, want, says) in cases.items():
        d = os.path.join(base, name); b = os.path.join(d, 'bin'); os.makedirs(b)
        open(os.path.join(b, 'gh'), 'w').write(f'#!/bin/sh\necho "gh $*" >> "{d}/gh-calls.txt"\n'
                                               f'printf %s "{out}"\nprintf "%s\\n" "{err}" >&2\nexit {code}\n')
        os.chmod(os.path.join(b, 'gh'), 0o755)
        o = os.path.join(d, 'out'); open(o, 'w').close()
        env = {'PATH': f'{b}:/usr/bin:/bin', 'RUNNER_TEMP': d, 'GITHUB_OUTPUT': o, 'GITHUB_REPOSITORY': 'abustrup/Chess-Project',
               'GH_TOKEN': 'test-token'}
        r = subprocess.run(['bash', '--noprofile', '--norc', '-e', '-c', step['run']], env=env, capture_output=True, text=True)
        got = dict(l.split('=', 1) for l in open(o).read().splitlines() if '=' in l)
        asked = open(os.path.join(d, 'gh-calls.txt')).read().strip()
        check(f'pages: {name} -> on={want}, the step itself passes', r.returncode == 0 and got.get('on') == want
              and says in r.stdout and asked == 'gh api repos/abustrup/Chess-Project/pages --jq .build_type',
              f'exit {r.returncode}, {got}, {r.stdout} {r.stderr}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--work')
    ap.add_argument('--only')
    ap.add_argument('--keep', action='store_true')
    a = ap.parse_args()
    if a.work:
        os.makedirs(a.work, exist_ok=True)
    root = tempfile.mkdtemp(prefix='measure-wf-', dir=a.work)
    only = set(a.only.split(',')) if a.only else {'pages', 'dry', 'live', 'tamper', 'cardsfail', 'cardsok'}
    t = time.time()
    try:
        for name, fn in (('pages', scenario_pages), ('tamper', scenario_tamper), ('cardsfail', lambda b: scenario_cards(b, False)),
                         ('cardsok', lambda b: scenario_cards(b, True)), ('dry', scenario_dry), ('live', scenario_live)):
            if name in only:
                print(f'--- {name}', flush=True)
                base = os.path.join(root, name); os.makedirs(base)
                fn(base)
    finally:
        if not a.keep:
            shutil.rmtree(root, ignore_errors=True)
    bad = [n for n, ok in results if not ok]
    print(f'\n{len(results) - len(bad)} of {len(results)} checks passed in {time.time() - t:.0f} s')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
