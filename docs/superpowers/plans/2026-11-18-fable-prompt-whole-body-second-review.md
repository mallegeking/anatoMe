# Prompt for the Fable session: second review of the whole body view

Date: 2026-11-18
For: the project owner. Paste the block below into a Fable session in the repo.

The first review of the whole body view asked for five fixes. Opus made them on 2026-11-18 in seven commits, `3a8b143` to `38ba818`, on the working branch. This second review checks those fixes and nothing else in depth. It is not a fresh review of the whole build.

If you still have the first review's answer, paste its "must be fixed" list where the prompt says so. Without it the reviewer works from the "Review fixes" section of the build report, which is Opus's own account of what was asked.

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
I'm working on anatoMe, an educational 3D anatomy web app, and I am its owner. Opus added a "Whole body" view on the branch claude/install-superpowers-plugin-v0gy65. A first review asked for five fixes, and Opus has made them. I need to decide whether the branch can now be merged into main, and four decisions are waiting for me that I want your advice on. With that in mind: check whether Opus got the fixes right, and tell me whether it is safe to merge.

When the user is describing a problem, asking a question, or thinking out loud rather than requesting a change, the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one. Before running a command that changes system state (restarts, deletes, config edits), check that the evidence actually supports that specific action. A signal that pattern-matches to a known failure may have a different cause.

For this review that means: change nothing on the branch, commit nothing, push nothing, open no pull request and merge nothing. Scratch files, traces and screenshots go outside the repo.

This is a second look, not a fresh review. The build is the commits b4c6cab to 264ed0c and was reviewed already. The fixes are the seven commits after it, 264ed0c..38ba818. Read that range closely. Go outside it only to judge a risk you can name, and report anything you find there separately.

Read first:
- docs/superpowers/reviews/whole-body-view-build-report.md, the section "Review fixes" to the end. It is Opus's own account of the five fixes, the tests it changed, ten full test runs and four points it left for me. Treat it as claims to check, not as facts.
- docs/superpowers/plans/2026-11-13-build-rules.md
- docs/superpowers/plans/2026-11-17-opus-prompt-whole-body.md, for the decisions and stop rules the build was held to
- docs/superpowers/specs/2026-11-17-whole-body-view-design.md, section 3.1 and whatever else the fix commits changed in it

The first review's list of what had to be fixed, if I still have it:
[PASTE THE FIRST REVIEW'S "MUST BE FIXED" LIST HERE, OR DELETE THIS LINE]

For each of the five fixes, say whether the problem is gone. "Attempted" is not fixed: the specific defect must no longer exist, and there must be a test that would fail if it came back.

Fix 1, the load waits. The tests could pass with no model on the page. Opus added a check after each wait that the stage badge reads the front view and that the load error is absent. Check that every helper and test that opens the app has it, and that it would really fail with a broken model file. The waits in four files stay at 20 seconds: tell me whether that is acceptable or hides slowness I should care about.

Fix 2, the stage controls on the whole body. A new file, apps/web/e2e/whole-body-stage.spec.ts, runs three tests at three screen sizes. Judge whether they test the app or only themselves: the tap spot that was "found by tapping and pinned", the zoom test that compares pictures pixel for pixel, and the turning test that Opus says it moved "unchanged" from whole-body.spec.ts (compare the two versions).

Fix 3, the flaky turning test. Opus did not change the test scheduling as asked. It changed the app: apps/web/src/viewer/RegionModel.tsx now reports the camera's direction on the camera library's "sleep" event as well as on "rest", because a long frame can skip "rest". Read the camera-controls code in node_modules to check that argument. Then judge the change itself: can the view now be reported twice, can it be reported while the camera still moves, and does the render loop still draw only on demand? Was fixing the app the right call?

Fix 4, the triangle caps. Opus stopped at the fix's own stop rule and changed only words: the design and docs/regions/known-gaps.md now say the caps are targets and list 17 meshes above 400 triangles. Check three things. Nothing under models/ changed in the fix range. The budget for the whole body is still 240,000 and the six regions still pass 150,000. The list of 17 is true: count the triangles per mesh in models/body.glb yourself with the repo's own model check code and compare.

Fix 5, the gap list test and the mesh count. Check that the new test in apps/web/src/App.test.tsx fails when the regions are not passed down, and that 653 meshes and 478,857 triangles add up from the files.

Then three things that go beyond the five fixes:

- The zoom test's reset step failed once in ten full runs and Opus did not find the cause. I do not want a test in main that fails now and then, and I do not want a real reset bug hidden behind "flaky". Try to find the cause. Run that test repeatedly under load, a bounded number of times, and read the pictures its trace now keeps. Tell me whether the app is at fault (for example reset racing a glide that is still running), the test is at fault (pixel for pixel is too strict for a 3D picture), or you could not tell, and what you would do about it.
- Speed. The check's median for the whole body as the opener is given as 3231 to 4485 ms across runs, against a limit of 5000 ms and about 2400 ms for the hip. Run node apps/web/scripts/perf-check.mjs yourself at least twice and give me your medians. Confirm the script is the same as on main. Say plainly how much room is left before my phone, which is slower than this check, is likely to fail.
- New damage. Look for anything the fix commits themselves broke, and check the rules that are never broken: nothing on main, no checked_by set, no data row from memory, nothing private, no request to another host, no weakened or skipped test. List every test the fix commits changed and say for each whether it got stricter, stayed equal or got weaker.

Run the checks of the build rules yourself and compare with the report, including one full end-to-end run. One thing to know: pipeline/data/test/markChecked.test.ts, "a write that fails part way restores every file", fails when the checks run as the root user and passes otherwise. That is known and is not a finding.

Delegate independent subtasks to subagents and keep working while they run. Intervene if a subagent goes off track or is missing relevant context.

Good candidates are the per-mesh triangle count, the comparison of the moved test, and the list of changed tests. Keep the camera argument, the zoom test and the speed runs for yourself, and have a fresh subagent check any finding you would call a blocker before you report it.

Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if something is not yet verified, say so explicitly. Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging.

Lead with the outcome. Your first sentence after finishing should answer "what happened" or "what did you find": the thing the user would ask for if they said "just give me the TLDR." Supporting detail and reasoning come after. Being readable and being concise are different things, and readability matters more.

The way to keep output short is to be selective about what you include (drop details that don't change what the reader would do next), not to compress the writing into fragments, abbreviations, arrow chains like A → B → fails, or jargon.

Give me, in this order:
- One sentence: merge, merge after fixes, or do not merge.
- A table of the five fixes: fixed, partly fixed or not fixed, with one line of evidence each.
- What must still be fixed before I merge, most important first. For each: what is wrong, where (file and line), what a person using the app would notice, and how you know.
- Your advice on the four points Opus left for me, each with a recommendation and its cost: keeping the 20 second waits, the fix in the app for the turning test, whether the pipeline should merge loose vertices before reducing meshes (which changes the body file and probably the trunk file), and what to do about the zoom test.
- Your speed numbers next to the report's, and what I should watch on my phone.
- What you could not verify.
- Only if something must still be fixed: a prompt I can paste to Opus, written so that it stands on its own, names the files and the tests to add first, and repeats the rule that no check is weakened.

Write in plain language for someone who reads code but did not write this.
```

## What the owner does afterwards

1. If the answer is "merge after fixes", paste the fix prompt into an Opus session on the working branch and run this review once more on the new commits only.
2. If the answer is "merge", deploy to the homelab and measure on the Galaxy A23 first, using the "Whole body" row of `docs/regions/phone-measurements.md`. The review cannot stand in for the phone. If the phone fails, the whole body stays in the picker and the hip becomes the opener again.
3. The working branch is two commits behind `main` (two documents). That does not block a merge.
