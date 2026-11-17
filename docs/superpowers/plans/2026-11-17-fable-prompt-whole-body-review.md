# Prompt for the Fable review session: the whole body view

Date: 2026-11-17
For: the project owner. Paste the block below into a Fable session in the repo after the Opus run of `2026-11-17-opus-prompt-whole-body.md` has finished and pushed.

This review differs from the earlier ones in one way. The planner wrote no plan for this build. Opus measured, wrote its own design and plan, and then built from them. So the review also covers the design and the plan, which nobody has read yet.

Some sentences inside the prompt keep their own punctuation on purpose. They are standard wording for this model and work best unchanged.

## Before starting

```bash
git fetch origin && git switch claude/install-superpowers-plugin-v0gy65 && git pull --ff-only
```

```bash
npm ci
```

Start the session with Fable as the model and the effort level at high.

## The prompt

```text
I'm working on anatoMe, an educational 3D anatomy web app, and I am its owner. An Opus session has just added a "Whole body" view on the branch claude/install-superpowers-plugin-v0gy65, unattended, from a prompt and without a plan from me. I need to decide whether to merge that branch into main, and I will try the result on my own phone afterwards. With that in mind: review what Opus built and tell me whether it is safe to merge.

When the user is describing a problem, asking a question, or thinking out loud rather than requesting a change, the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one. Before running a command that changes system state (restarts, deletes, config edits), check that the evidence actually supports that specific action. A signal that pattern-matches to a known failure may have a different cause.

For this review that means: change nothing on the branch, commit nothing, push nothing, open no pull request and merge nothing. Scratch files and screenshots go outside the repo.

Read first, in this order:
- docs/superpowers/plans/2026-11-17-opus-prompt-whole-body.md. It is the job Opus was given: seven decisions that were already taken, what to measure first, what the build must cover, and four stop rules.
- docs/superpowers/plans/2026-11-13-build-rules.md
- docs/superpowers/specs/2026-11-02-anatome-design.md, above all its anti-goals
- docs/superpowers/specs/2026-11-15-whole-body-meshes-design.md
- The design and the plan Opus wrote: docs/superpowers/specs/2026-11-17-whole-body-view-design.md and docs/superpowers/plans/2026-11-17-whole-body-view.md
- docs/superpowers/reviews/whole-body-view-build-report.md and docs/superpowers/reviews/progress.md
The commit range to review is origin/main..origin/claude/install-superpowers-plugin-v0gy65. If a file named above does not exist, or the report says a stop rule fired, say so first: the rest of the review depends on it.

What I most need to know, in this order:

1. Did a stop rule fire, and was it obeyed? If the regions did not fit together, or the speed limit could not be met, Opus was told to stop or to fall back, not to work around it.
2. Is the speed limit untouched? apps/web/scripts/perf-check.mjs must still measure the same thing with the same limit (5000 ms), the same number of runs and the same throttle as on main. The six regions must still pass the 150,000 triangle budget unchanged. The whole body may have a budget of its own. Run perf-check yourself with the whole body as the opener and compare your median with the report's.
3. Does the whole body look right? Do not take the report's word. Build the app, open it in a browser at a desktop size and a phone size, and take screenshots of the whole body from the front, the side and the back. Look at them: do the regions meet at the knee, the hip, the neck, the shoulder and the elbow without gaps, overlaps or a wrong scale? Is anything drawn twice (look for flicker or doubled outlines on shared bones)? Is anything missing that a region shows?
4. Are the seven decisions kept? The entry is called "Whole body" and "Ganzer Körper", it is first in the picker and it is what the app opens with, ?region= still works, no geometry was invented, every structure is drawn once and none was dropped, the whole body's data is built from the same YAML as the regions and not copied, and search, Layers, Under a spot, the stage controls, the Notebook and both languages work in it.
5. Is the design Opus wrote sound, and does the plan follow it? Check that the measurements in the design are believable by repeating the ones you can. Say where the choice between reusing the files and building one lighter file rests on a number you could not reproduce.
6. Are the tests real? For each behaviour the prompt lists under "What the build must cover", find the test and judge whether it would fail if the behaviour broke. List every existing test that was changed, and say for each whether the reason is that the app now opens with the whole body, which I decided, or something else. No test may have been skipped or loosened to get green.
7. The rules that are never broken: nothing on main, no checked_by set, no data row written from memory, nothing private in the repo, no request to another host, no weakened check. Posing, moving bones and new colouring were out of scope: flag anything of that kind that was built anyway.
8. Run every check of the build rules yourself and compare with the report. One thing to know: pipeline/data/test/markChecked.test.ts, "a write that fails part way restores every file", fails when the checks run as the root user and passes otherwise. That is known and is not a finding.

Delegate independent subtasks to subagents and keep working while they run. Intervene if a subagent goes off track or is missing relevant context.

Good candidates are the test review, the rules check and the data build, each given the files to read and what to look for. Keep the screenshots and the speed measurement for yourself, and have a fresh subagent check any finding you would call a blocker before you report it.

Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if something is not yet verified, say so explicitly. Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging.

Lead with the outcome. Your first sentence after finishing should answer "what happened" or "what did you find": the thing the user would ask for if they said "just give me the TLDR." Supporting detail and reasoning come after. Being readable and being concise are different things, and readability matters more.

The way to keep output short is to be selective about what you include (drop details that don't change what the reader would do next), not to compress the writing into fragments, abbreviations, arrow chains like A → B → fails, or jargon.

Give me, in this order:
- One sentence: merge, merge after fixes, or do not merge.
- What must be fixed before I merge, most important first. For each: what is wrong, where (file and line), what a person using the app would notice, and how you know.
- What can wait.
- What you could not verify. My phone is one of them: say what I should look at on it.
- Where your numbers differ from the report's.
- A prompt I can paste to Opus for the fixes, written so that it stands on its own, names the files and the tests to add first, and repeats the rule that no check is weakened.

Write in plain language for someone who reads code but did not write this. Attach the screenshots you based the answer to point 3 on.
```

## What the owner does afterwards

1. If the answer is "merge after fixes", paste the fix prompt into an Opus session on the working branch, then run this review again on the fix commits only.
2. If the answer is "merge", deploy to the homelab and measure on the Galaxy A23 with `?perf=1` before merging, as in `docs/deploy-homelab.md`. The review cannot stand in for the phone.
