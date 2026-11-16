# Build rules for the 2026-11-13 plans

Read this page fully before building any plan from `docs/superpowers/plans/2026-11-13-*.md`. It holds the rules that are the same for every plan. The prompt you were started with names the plans (and sometimes the tasks) you are building.

## The two branches

- **`main`** is the checked state of the project. **You never work on `main`.** You do not switch to it, commit to it, merge into it, push to it or open a pull request against it. Only the owner merges into `main`, after the review.
- **`claude/install-superpowers-plugin-v0gy65`** is the working branch. All build work happens here, as plain commits, one per task. You create no other branches.

Before every commit, run `git branch --show-current`. If it does not print `claude/install-superpowers-plugin-v0gy65`, stop and do not commit.

Where a plan or the roadmap says "merged into `main`" or names a branch per plan, read it as "built on the working branch". A plan's "Needs" are met when the plans it builds on are done on the working branch.

## Who does what

- The **owner** reads plans, starts build sessions, signs off research, records reviews and merges into `main`.
- The **builder** (you) builds the plans the prompt names, task by task, on the working branch.
- The **reviewer** (Claude Fable, in another session) reviews the work afterwards against the plan, the spec and the plan's Review Focus list. Your build report is what the reviewer starts from, so it must be honest and complete.

## Before the first task

1. Read, in this order: this page, `docs/superpowers/plans/2026-11-13-remaining-build-roadmap.md`, and `docs/superpowers/reviews/progress.md` if it exists (it says what earlier sessions finished).
2. Get the working branch: `git fetch origin && git switch claude/install-superpowers-plugin-v0gy65 && git pull --ff-only`.
3. Run `npm ci`, then the baseline: `npm run validate && npm run check-models && npm test && npm run build && npm run e2e -w apps/web && node scripts/check-no-drafts.mjs`. If the baseline fails before you changed anything, stop and report. Do not build on a red baseline.

Before each plan: read the plan from top to bottom and every spec it names under "Spec".

## While building

- Use the superpowers skill the plan's header names. Use subagent-driven development unless the prompt says otherwise.
- Follow the plan's order. One task at a time. Each task ends with its checks green and one commit with the plan's commit message.
- Test first, as each task's steps say. See the test fail before you write the code.
- The plan gives names, signatures, exact texts and exact test values. Use them as written. Where the plan leaves a choice open, make the simplest choice that fits the codebase.
- **When the plan and the code disagree** (a file is not where the plan says, a signature cannot work, a test value in the plan is wrong), do not guess silently and do not bend a test to pass. Take the smallest change that keeps the plan's intent, and write it into the build report under "Deviations" with the reason.
- Stay inside the plan. No refactors, renames, dependency upgrades or extra features that the plan does not ask for. Write ideas into the build report under "Noticed, not done".
- Check the current official docs before using an API that this repo does not use yet.
- Push after each finished plan: `git push origin claude/install-superpowers-plugin-v0gy65`.

## When you are stuck or a plan says stop

The owner may be asleep. Do not wait for an answer and do not ask questions.

- **A stop in a plan** ("stop", "wait for the owner", "report to the owner"): finish that task, write what is waiting into the progress file under "Waiting for the owner", skip the tasks behind the stop, and go on with the next plan in the prompt's list.
- **A task you cannot get green** after an honest attempt: throw away its uncommitted changes (`git restore . && git clean -fd` inside the folders the task touched), mark the task "blocked" in the progress file with what you tried and the failing output, and skip the rest of that plan. Go on with the next plan only if it does not need the blocked one.
- **A disagreement that changes what a feature does:** treat it like a blocked task. Do not decide it yourself.
- Never leave the branch with failing checks. The last commit of every plan must pass the full check list below.

## Rules that are never broken

- Never work on `main` (see above).
- No row gets `checked_by` set to anything but `null`. Only the owner records reviews.
- No data row is written from memory. Every row cites a source you opened in this session.
- Nothing private goes into the repo: no hostnames, Tailscale names, IP addresses, keys, reviewer names or health notes.
- The app makes no request to another host at runtime.
- Never force-push, never rewrite history, never change the repo's visibility or settings, never open or merge a pull request.
- Never weaken a check to get past it: no skipped tests, no loosened assertions, no `--no-verify`.
- Docs and comments: plain language, no em dashes, no semicolons in prose.

## After each plan

1. Run every check and keep the output: `npm run validate && npm run check-models && npm test && npm run build:review -w apps/web && npm run build && npm run e2e -w apps/web && node scripts/check-no-drafts.mjs && node apps/web/scripts/perf-check.mjs && node apps/web/scripts/error-check.mjs`. If `.venv` exists, also `npm run test:py`.
2. Write the build report to `docs/superpowers/reviews/<plan-name>-build-report.md` (for example `phase-2a-build-report.md`) with these sections:
   - **Summary:** what was built, in three or four sentences.
   - **Commits:** the first and the last commit hash of this plan, and one line per task with its hash and "done", "done with deviation", "blocked" or "skipped".
   - **Deviations:** every place the build differs from the plan, with the reason.
   - **Review Focus:** for each line of the plan's Review Focus list, the test that covers it (file and test name).
   - **Checks:** the last lines of each check's output, and the perf median.
   - **Not verified:** everything you could not check yourself (the phone, a print preview, anything that needs the owner's eyes).
   - **Noticed, not done:** problems or ideas outside the plan.
   - **For the owner:** decisions or sign-offs that are waiting.
3. Update `docs/superpowers/reviews/progress.md`: one line per plan in the prompt's list with its state ("done", "partly done", "blocked", "not started"), the report's file name, and the section "Waiting for the owner".
4. Commit the report and the progress file, and push the working branch.

## At the end of the session

End your turn with the progress file's content and the "For the owner" items of every report. If you were stopped part way (a usage limit, a crash), the next session reads the progress file and the git log and carries on from the first task that has no commit.
