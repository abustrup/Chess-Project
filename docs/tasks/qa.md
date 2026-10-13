# QA task — test a finished feature like a real (and a hostile) user, then fix what you find

You are a quality engineer on **Chess Coach**. Read `docs/agent-brief.md` first (product, user, design direction, rules of engagement, how to test in the real browser).
A builder has finished the feature below. Your job is to **find and fix real defects** — not to rewrite. Keep diffs small and targeted; keep the existing style.

## You own
Only the files listed for your feature in the prompt (plus scratch files in the scratchpad). If you find a problem in a file you don't own, don't edit it: describe it precisely in your report (file, line, symptom, suggested fix).
Do not run `git commit/push/checkout/stash` and do not run `npm install`. The dev server is already running (http://localhost:5173/).

## What to do (QA role)
1. Read the feature's original task file (`docs/tasks/<name>.md`, named in your prompt): its "Done when" list is your minimum test plan. Read the code you own end to end once; look for logic errors, race conditions (async engine calls finishing after navigation/unmount), stale state, missing cleanup (workers, timers, listeners), unhandled promise rejections.
2. Drive the **real app in Chromium** with Playwright scripts (scratchpad) — desktop 1360×860 and phone 390×844; normal, **zen mode**, and **Ember** theme (`localStorage 'cc.profile'` = `{"zenMode":true,"appTheme":"ember","boardTheme":"walnut"}`); with an empty profile and with seeded progress. Watch `pageerror`, `console.error`, failed network requests.
3. Test the unhappy paths: reload mid-flow, browser back/forward, corrupt or missing localStorage values (invalid JSON, wrong shapes, old versions), offline/failed fetches (route abort), very long names/inputs, rapid double clicks, keyboard-only use, resize while playing.
4. Look at every screenshot like a designer: alignment, spacing, contrast, text overflow/truncation, empty states, loading states, mobile layout, consistency with the design direction (own identity, **no green brand colour**, flat soft buttons, serif headings). Check text for the "plain friendly English for a 1100 player" standard: fix jargon, typos, unclear labels.
5. Accessibility basics: every control reachable by keyboard with visible focus, buttons have names, colour is not the only signal, contrast of body text against its background ≥ 4.5:1 where you can measure it.
6. Fix each defect you find in files you own, then re-test it. Add a small regression check (`*.check.ts` run with `npx tsx`) when the bug was in pure logic.
7. Typecheck your files: `npx tsc --noEmit 2>&1 | grep -E "<your paths>"` must be empty.

## Report (≤ 350 words, plain text)
Defects found (severity: blocker / major / minor) → fixed or not · what you tested (so nobody repeats it) · remaining risks · problems in files you don't own.

## If your prompt says you are the BREAKER
A previous QA engineer already fixed bugs in this feature. Assume they missed things. Don't repeat their plan: attack from different angles (odd input, odd timing, odd navigation, storage corruption, extreme sizes, slow network via Playwright route delays, many repetitions, state left over from a previous session). Same fixing rules as above.
