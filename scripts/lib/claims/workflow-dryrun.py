#!/usr/bin/env python3
"""Act-free dry run of the shell steps in .github/workflows/content-checks.yml, on throwaway git repos.

Runs the exact `run:` text of the "changes", "study-freeze" and Stockfish-install steps with the env GitHub would
give them (event values mocked), so the workflow's own logic is tested before it ever runs on GitHub:
which checks a push or pull request triggers, the study freeze at mocked game counts (11 games fails, "error-fix"
passes, a pull request cannot loosen the rule, a push to main is judged too, a late trainer moves the end of the
freeze), and the Stockfish checks (wrong file or wrong engine stops the job). It also reads the triggers: every pull
request must start the workflow, so its checks can be required without hanging. The app-checks job's commands run
here on this checkout (they need its node_modules; `npm ci` is skipped).
The Stockfish step is fed a tar of the local binary, so it needs Stockfish 19 at $STOCKFISH or /opt/homebrew/bin.

Run from the repo root (needs PyYAML, e.g. the Mac's python3; temp folders are removed afterwards):
    python3 scripts/lib/claims/workflow-dryrun.py
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[3]
WF = yaml.safe_load((REPO / ".github/workflows/content-checks.yml").read_text())
SP = Path(tempfile.mkdtemp(prefix="content-checks-dryrun-"))
STOCKFISH = os.environ.get("STOCKFISH") or "/opt/homebrew/bin/stockfish"
results = []


def step(job, name_start):
    for s in WF["jobs"][job]["steps"]:
        if s.get("name", "").startswith(name_start):
            return s
    raise KeyError(name_start)


def sh(cmd, cwd, env=None, check=True):
    r = subprocess.run(["bash", "-c", cmd], cwd=cwd, env=env, capture_output=True, text=True)
    if check and r.returncode:
        raise RuntimeError(f"{cmd}\n{r.stdout}\n{r.stderr}")
    return r


def run_step(s, cwd, extra_env):
    env = dict(os.environ)
    env.pop("GITHUB_ACTIONS", None)
    env.update({k: str(v) for k, v in (WF.get("env") or {}).items()})
    env.update({k: str(v) for k, v in (s.get("env") or {}).items() if "${{" not in str(v)})
    env.update(extra_env)
    # GitHub runs `bash --noprofile --norc -eo pipefail {0}`
    r = subprocess.run(["bash", "--noprofile", "--norc", "-eo", "pipefail", "-c", s["run"]], cwd=cwd, env=env,
                       capture_output=True, text=True)
    return r


def record(name, ok, detail):
    results.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}\n      {detail.strip()[:900]}\n")


def git_repo(root):
    sh("git init -q -b main . && git config user.email t@t && git config user.name t", root)


def commit(root, files, msg):
    for f, text in files.items():
        p = root / f
        p.parent.mkdir(parents=True, exist_ok=True)
        if text is None:
            p.unlink()
        else:
            p.write_text(text)
    sh("git add -A && git commit -q -m " + json.dumps(msg) + " && git rev-parse HEAD", root)
    return sh("git rev-parse HEAD", root).stdout.strip()


# ---------------------------------------------------------------- triggers
def test_triggers():
    on = WF.get("on", WF.get(True))  # PyYAML reads the key `on` as True
    pr = on.get("pull_request") or {}
    record("triggers: every pull request starts the workflow (no paths filter, so required checks cannot hang)",
           "paths" not in pr and "paths-ignore" not in pr and {"labeled", "unlabeled"} <= set(pr.get("types", [])),
           f"pull_request: {pr}")
    push_paths = set(on.get("push", {}).get("paths", []))
    rule_src = (REPO / "scripts/lib/claims/study-freeze.ts").read_text()
    frozen = [x.strip().strip("'") for x in rule_src.split("export const FROZEN = [", 1)[1].split("]", 1)[0].split(",") if x.strip()]
    uncovered = [d for d in frozen if not any(d.startswith(p.rstrip("*")) or (d + "**") == p for p in push_paths)]
    record("triggers: a push touching any frozen folder starts the workflow", not uncovered, f"frozen {frozen}; not covered {uncovered}")
    judge = [x.strip().strip("'") for x in rule_src.split("export const INSTRUMENT = [", 1)[1].split("]", 1)[0].split(",") if x.strip()]
    uncovered = [d for d in judge if not any(d.startswith(p.rstrip("*")) or (d + "**") == p for p in push_paths)]
    record("triggers: a push touching any of the judge's files starts the workflow", judge and not uncovered,
           f"judge {judge}; not covered {uncovered}")
    cond = WF["jobs"]["study-freeze"].get("if", "")
    record("triggers: the study freeze runs on pull requests and on pushes to the default branch",
           "pull_request" in cond and "push" in cond and "default_branch" in cond, cond)


# ---------------------------------------------------------------- changes job
def test_changes():
    root = Path(tempfile.mkdtemp(dir=SP, prefix="changes-"))
    git_repo(root)
    base = commit(root, {"README.md": "x"}, "base")
    home = commit(root, {"src/features/home/Plan.tsx": "a"}, "home only")
    data = commit(root, {"src/data/openings/london.ts": "b"}, "course")
    s = step("changes", "Decide which checks to run")
    cases = [
        ("pull request touching only Home -> content checks skipped", {"EVENT": "pull_request", "PR_BASE": base, "PR_HEAD": home}, "false"),
        ("pull request touching a course -> content checks run", {"EVENT": "pull_request", "PR_BASE": base, "PR_HEAD": data}, "true"),
        ("push touching a course -> content checks run", {"EVENT": "push", "BEFORE": home, "AFTER": data}, "true"),
        ("push touching only Home -> content checks skipped", {"EVENT": "push", "BEFORE": base, "AFTER": home}, "false"),
        ("push of a new branch (before = zeros) -> run everything", {"EVENT": "push", "BEFORE": "0" * 40, "AFTER": data}, "true"),
        ("manual run -> run everything", {"EVENT": "workflow_dispatch"}, "true"),
    ]
    # a very large pull request (paths far beyond a 64 KB pipe buffer) whose first file is a course file
    many = {f"public/data/bulk/file-{i:05d}-with-a-long-name-to-fill-the-list.json": "x" for i in range(3000)}
    big = commit(root, dict(many, **{"src/data/openings/a.ts": "c"}), "big")
    cases.append(("very large pull request that touches a course -> content checks run", {"EVENT": "pull_request", "PR_BASE": data, "PR_HEAD": big}, "true"))
    for name, ev, want in cases:
        out = root / "out.txt"
        out.write_text("")
        env = {"EVENT": "", "PR_BASE": "", "PR_HEAD": "", "BEFORE": "", "AFTER": "", "GITHUB_OUTPUT": str(out)}
        env.update(ev)
        r = run_step(s, root, env)
        got = out.read_text().strip()
        record(f"changes: {name}", r.returncode == 0 and got == f"content={want}", f"exit {r.returncode}, output {got!r}")


# ---------------------------------------------------------------- study-freeze job
def live_shim(work, status, live):
    """A stand-in for python3 in the live-count step (no Lichess request in a dry run): prints the mocked count, by
    default status.json's own, or fails like an unreachable Lichess when live is "fail". Returns the folder for PATH."""
    if live == "same":
        live = str(json.loads(status).get("eligibleGames", 0)) if status else "0"
    shim = work / "pybin"
    shim.mkdir(exist_ok=True)
    body = "cat > /dev/null; " + ("echo 'urllib.error.URLError' >&2; exit 1" if live == "fail" else f"echo {live}")
    (shim / "python3").write_text(f"#!/bin/bash\n{body}\n")
    os.chmod(shim / "python3", 0o755)
    return shim


def test_freeze():
    s = step("study-freeze", "Teaching files stay fixed")
    rule_src = (REPO / "scripts/lib/claims/study-freeze.ts").read_text()

    def scenario(name, status, daily, pr_files, labels, want_exit, base_rule=True, live="same"):
        work = Path(tempfile.mkdtemp(dir=SP, prefix="freeze-"))
        origin = work / "origin"
        origin.mkdir()
        git_repo(origin)
        files = {"README.md": "x"}
        if base_rule:
            files["scripts/lib/claims/study-freeze.ts"] = rule_src
        if status is not None:
            files["public/data/study/status.json"] = status
        if daily:
            files[".github/workflows/measure.yml"] = "name: Daily measurement\n"
        base = commit(origin, files, "base")
        sh("git checkout -q -b pr", origin)
        if not base_rule:
            pr_files = dict(pr_files, **{"scripts/lib/claims/study-freeze.ts": rule_src})
        head = commit(origin, pr_files, "pr")
        sh("git checkout -q main", origin)
        clone = work / "clone"
        sh(f"git clone -q {origin} {clone} && git -C {clone} checkout -q {head}", work)
        tmp = work / "runner-temp"
        tmp.mkdir()
        summary = tmp / "summary.md"
        r = run_step(s, clone, {"EVENT": "pull_request", "BASE_REF": "main", "PR_BASE": base, "PR_HEAD": head,
                                "LABELS": labels, "RUNNER_TEMP": str(tmp), "GITHUB_STEP_SUMMARY": str(summary),
                                "PATH": f"{live_shim(work, status, live)}:{os.environ['PATH']}"})
        record(f"study-freeze: {name}", r.returncode == want_exit,
               f"exit {r.returncode} (want {want_exit}); " + " | ".join(r.stdout.strip().splitlines()[-3:]) + r.stderr[-300:])

    st = lambda n: json.dumps({"asOf": "2026-11-01T06:00:00Z", "eligibleGames": n, "phase": "baseline"})
    home = {"src/features/home/Plan.tsx": "changed"}
    scenario("mocked 11 games, Home changed, no label -> fails", st(11), True, home, "", 1)
    scenario("mocked 11 games, Home changed, label error-fix -> passes", st(11), True, home, "error-fix", 0)
    scenario("mocked 11 games, label error-fix among others -> passes", st(11), True, home, "docs,error-fix", 0)
    scenario("mocked 10 games, Home changed -> passes", st(10), True, home, "", 0)
    scenario("mocked 160 games, course changed -> fails", st(160), True, {"src/data/openings/london.ts": "x"}, "", 1)
    scenario("mocked 161 games -> passes", st(161), True, home, "", 0)
    scenario("mocked 50 games, only the trainer changed -> passes", st(50), True, {"src/features/safety/Card.tsx": "x"}, "", 0)
    scenario("no status.json and no daily job yet -> passes with a note", None, False, home, "", 0)
    scenario("no status.json although the daily job exists, Lichess unreachable -> fails", None, True, home, "", 1, live="fail")
    scenario("no status.json although the daily job exists, Lichess counts 4 -> passes", None, True, home, "", 0, live="4")
    # the pull request edits status.json and the rule itself to slip through: both are read from the base branch
    sneaky_rule = rule_src.replace("export const FREEZE_FROM = 11", "export const FREEZE_FROM = 1000")
    scenario("PR rewrites status.json and loosens the rule -> still fails (both read from the base branch)", st(30), True,
             dict(home, **{"public/data/study/status.json": st(5), "scripts/lib/claims/study-freeze.ts": sneaky_rule}), "", 1)
    scenario("first PR that adds the rule (not on base yet), 11 games -> fails", st(11), True, home, "", 1, base_rule=False)
    late = json.dumps({"asOf": "2026-11-01T06:00:00Z", "eligibleGames": 170, "windows": {"looks": [[76, 125], [76, 175]]},
                       "verdict": None})
    scenario("trainer opened after game 55 (final look 76-175), 170 games, Home changed -> fails", late, True, home, "", 1)
    scenario("mocked 30 games, opening course page changed -> fails", st(30), True, {"src/features/openings/useDrill.ts": "x"}, "", 1)
    scenario("mocked 30 games, only README changed -> passes", st(30), True, {"README.md": "y"}, "", 0)
    # the live count (status.json can be a day old) and the judge's own files (fixer, 2026-10-17)
    scenario("status.json says 10, Lichess counts 11 now, Home changed -> fails", st(10), True, home, "", 1, live="11")
    scenario("status.json says 10, Lichess unreachable, Home changed -> fails", st(10), True, home, "", 1, live="fail")
    scenario("no status.json and no daily job yet, Lichess counts 12, Home changed -> fails", None, False, home, "", 1, live="12")
    judge = {"scripts/measure/daily.py": "changed"}
    prereg = {"research/2026-10-16-diagnosis/preregistration.md": "3.8: a dated deviation"}
    scenario("mocked 30 games, the daily job changed, no label -> fails", st(30), True, judge, "", 1)
    scenario("mocked 30 games, the daily job changed, error-fix only -> fails", st(30), True, judge, "error-fix", 1)
    scenario("mocked 30 games, the daily job changed, instrument-deviation without a 3.8 entry -> fails", st(30), True, judge,
             "instrument-deviation", 1)
    scenario("mocked 30 games, the daily job changed, instrument-deviation and preregistration.md -> passes", st(30), True,
             dict(judge, **prereg), "instrument-deviation", 0)
    scenario("mocked 30 games, newcomers.json changed, no label -> fails", st(30), True,
             {"research/2026-10-16-diagnosis/newcomers/newcomers.json": "{}"}, "", 1)

    # pushes to the main branch: judged by the commit before the push; "error-fix" in a commit message or on the
    # merged pull request (asked through a stand-in for the gh command) lets an error fix through
    def push_scenario(name, status, files, message, gh_labels, want_exit, before_zero=False, live="same"):
        work = Path(tempfile.mkdtemp(dir=SP, prefix="push-"))
        origin = work / "origin"
        origin.mkdir()
        git_repo(origin)
        base = commit(origin, {"README.md": "x", "scripts/lib/claims/study-freeze.ts": rule_src,
                               "public/data/study/status.json": status, ".github/workflows/measure.yml": "name: m\n"}, "base")
        head = commit(origin, files, message)
        clone = work / "clone"
        sh(f"git clone -q {origin} {clone} && git -C {clone} checkout -q {head}", work)
        shim = work / "bin"
        shim.mkdir()
        (shim / "gh").write_text(f"#!/bin/bash\necho {json.dumps(gh_labels)}\n")
        os.chmod(shim / "gh", 0o755)
        tmp = work / "runner-temp"
        tmp.mkdir()
        r = run_step(s, clone, {"EVENT": "push", "BEFORE": "0" * 40 if before_zero else base, "AFTER": head,
                                "REPO": "owner/repo", "GH_TOKEN": "x", "LABELS": "", "RUNNER_TEMP": str(tmp),
                                "GITHUB_STEP_SUMMARY": str(tmp / "summary.md"),
                                "PATH": f"{shim}:{live_shim(work, status, live)}:{os.environ['PATH']}"})
        record(f"study-freeze push: {name}", r.returncode == want_exit,
               f"exit {r.returncode} (want {want_exit}); " + " | ".join(r.stdout.strip().splitlines()[-3:]) + r.stderr[-300:])

    course = {"src/data/openings/slav.ts": "changed"}
    push_scenario("30 games, course changed, plain commit -> fails", st(30), course, "Tidy the Slav", "", 1)
    push_scenario("30 games, course changed, commit says error-fix -> passes", st(30), course, "error-fix: wrong square in the Slav", "", 0)
    push_scenario("30 games, course changed, merged pull request labelled error-fix -> passes", st(30), course, "Merge pull request #7", "docs,error-fix", 0)
    push_scenario("8 games, course changed -> passes", st(8), course, "Narrow the courses", "", 0)
    push_scenario("30 games, only the trainer changed -> passes", st(30), {"src/features/safety/Card.tsx": "x"}, "Trainer", "", 0)
    push_scenario("first push of the branch (before = zeros) -> passes with a warning", st(30), course, "x", "", 0, before_zero=True)
    measure_yml = {".github/workflows/measure.yml": "name: m2\n"}
    push_scenario("30 games, measure.yml changed, plain commit -> fails", st(30), measure_yml, "Tidy the job", "", 1)
    push_scenario("30 games, measure.yml changed, commit says instrument-deviation, no 3.8 entry -> fails", st(30), measure_yml,
                  "instrument-deviation: runner image", "", 1)
    push_scenario("30 games, measure.yml and preregistration.md, commit says instrument-deviation -> passes", st(30),
                  dict(measure_yml, **{"research/2026-10-16-diagnosis/preregistration.md": "3.8 entry"}),
                  "instrument-deviation: runner image", "", 0)
    push_scenario("8 games in status.json, Lichess counts 11 now, course changed -> fails", st(8), course, "Narrow", "", 1, live="11")


# ---------------------------------------------------------------- Stockfish install step (logic only, macOS binary)
def test_stockfish_install():
    s = step("claims", "Install Stockfish 19")
    work = Path(tempfile.mkdtemp(dir=SP, prefix="sf-"))
    pkg = work / "pkg" / "stockfish"
    pkg.mkdir(parents=True)
    shutil.copy(STOCKFISH, pkg / "stockfish-linux-x86-64-universal")
    (pkg / "README.md").write_text("readme")
    tar = work / "sf.tar.gz"
    sh(f"tar -czf {tar} -C {work / 'pkg'} stockfish", work)
    sha = sh(f"shasum -a 256 {tar}", work).stdout.split()[0]
    shim = work / "bin"
    shim.mkdir()
    (shim / "sha256sum").write_text('#!/bin/bash\nexec shasum -a 256 "$@"\n')
    os.chmod(shim / "sha256sum", 0o755)

    def go(name, sha_value, bench, want):
        tmp = Path(tempfile.mkdtemp(dir=work, prefix="rt-"))
        genv = tmp / "github_env"
        genv.write_text("")
        r = run_step(s, work, {"SF_URL": f"file://{tar}", "SF_SHA256": sha_value, "SF_BENCH": bench,
                               "RUNNER_TEMP": str(tmp), "GITHUB_ENV": str(genv),
                               "PATH": f"{shim}:{os.environ['PATH']}"})
        got = genv.read_text().strip()
        ok = (r.returncode == 0) == want and (not want or got.startswith("STOCKFISH="))
        record(f"stockfish install: {name}", ok, f"exit {r.returncode}; {r.stdout.strip().splitlines()[-1] if r.stdout.strip() else ''} {r.stderr.strip()[-200:]} {got}")

    go("right file and bench signature -> STOCKFISH set", sha, WF["env"]["SF_BENCH"], True)
    go("wrong SHA-256 -> stops", "0" * 64, WF["env"]["SF_BENCH"], False)
    go("wrong bench signature -> stops", sha, "123", False)

    # an engine that keeps writing after its "id name" line (more than a pipe holds) must still be recognised
    fake = work / "fakepkg" / "stockfish"
    fake.mkdir(parents=True)
    exe = fake / "stockfish-linux-x86-64-universal"
    exe.write_text("#!/bin/bash\nif [ \"$1\" = bench ]; then echo \"Nodes searched  : " + WF["env"]["SF_BENCH"] + "\"; exit 0; fi\n"
                   "echo 'id name Stockfish 19'; for i in $(seq 1 20000); do echo \"option name Filler$i type string default x\"; done; echo uciok\n")
    os.chmod(exe, 0o755)
    sh(f"tar -czf {tar} -C {work / 'fakepkg'} stockfish", work)
    sha = sh(f"shasum -a 256 {tar}", work).stdout.split()[0]
    go("engine that writes a lot after its id line -> still found", sha, WF["env"]["SF_BENCH"], True)


# ---------------------------------------------------------------- app-checks job (run here, on this checkout)
def test_app_checks():
    job = WF["jobs"].get("app-checks")
    record("app-checks: the job exists and runs on every event (no `if`, no `needs`)",
           bool(job) and "if" not in job and "needs" not in job, f"{job and {k: v for k, v in job.items() if k != 'steps'}}")
    if not job:
        return
    runs = [s["run"] for s in job["steps"] if "run" in s]
    want = ["npx tsc --noEmit", "npm run check:gate", "npm run check:safety", "npm run check:home", "npm run check:review"]
    record("app-checks: tsc plus check:gate, check:safety, check:home and check:review are steps",
           all(w in runs for w in want), f"steps: {runs}")
    # every step but `npm ci` exactly as written, on this checkout (its node_modules), as GitHub would run it
    for cmd in runs:
        if cmd.strip() == "npm ci":
            continue
        r = subprocess.run(["bash", "--noprofile", "--norc", "-eo", "pipefail", "-c", cmd], cwd=REPO,
                           capture_output=True, text=True)
        tail = (r.stdout.strip().splitlines() or [""])[-1]
        record(f"app-checks: `{cmd}` passes here", r.returncode == 0, f"exit {r.returncode}; {tail} {r.stderr.strip()[-300:]}")


try:
    test_triggers()
    test_changes()
    test_freeze()
    test_stockfish_install()
    test_app_checks()
finally:
    shutil.rmtree(SP, ignore_errors=True)
bad = [n for n, ok in results if not ok]
print(f"{len(results) - len(bad)} of {len(results)} dry-run cases passed")
sys.exit(1 if bad else 0)
