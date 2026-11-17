# Prompt for the Opus build session: the whole body as one model

Date: 2026-11-17
For: the project owner. The block below is one prompt to paste into a Claude Code session started in the repo folder with Opus as the model. How to start a session is described in `2026-11-13-opus-prompts.md`.

This run has no plan written by the planner. The prompt asks Opus to measure first, then write a short design and a plan, and only then build. The decisions the owner already took are in the prompt. The points Opus may not decide alone are listed as stop rules.

## Before starting

The session should start from the current `main`, which holds the three-column layout:

```bash
git fetch origin && git switch claude/install-superpowers-plugin-v0gy65 && git merge --ff-only origin/main
```

```bash
git push origin claude/install-superpowers-plugin-v0gy65
```

```bash
claude --model opus --dangerously-skip-permissions
```

If the Windows build fix (`Rename summary.ts so the build works on Windows and macOS`) is not on `main` yet, merge it first. Otherwise the result of this run will not build on the Windows PC.

## The prompt

```text
You are adding a "Whole body" view to anatoMe in one unattended run. The owner is asleep. Do not ask questions and do not wait for answers.

First read docs/superpowers/plans/2026-11-13-build-rules.md and follow it. Where it speaks of "the plans in the prompt", read this prompt as the plan list. The rules that matter most: you work only on the branch claude/install-superpowers-plugin-v0gy65 and never on main, you never weaken a check to get past it, no data row gets checked_by set, nothing private goes into the repo, the app makes no request to another host, and docs and comments are in plain language with no em dashes and no semicolons in prose.

Then read, in this order:
- docs/superpowers/specs/2026-11-02-anatome-design.md (the main design, its anti-goals above all)
- docs/superpowers/specs/2026-11-15-whole-body-meshes-design.md (how the six regions were built, the also_in field, the triangle caps, the measured layers)
- docs/superpowers/specs/2026-11-16-three-column-layout-design.md (the current layout and stage controls)
- docs/ideas.md, the three entries dated 2026-11-17 (why the whole body is wanted, and what comes after it)
- docs/superpowers/reviews/progress.md

WHAT THE OWNER WANTS

Today the app shows one body region at a time. A select in the top bar switches between six regions (hip, lower-leg, shoulder, arm, neck, trunk) and the app opens with the hip. The owner wants a seventh entry, "Whole body", that shows all of it as one model, and wants the app to open with it. The six regions stay as they are.

The reason: the owner will later show bent postures and positions, and let people move parts of the model by hand. That only makes sense on a whole body. Those later features are NOT part of this run. Do not build posing, bones that move, or new colouring. Do not make a choice that blocks them: every structure stays its own mesh with its own id and side.

DECISIONS ALREADY TAKEN (do not reopen them)

1. The new region's id is "body". Its name in the picker is "Whole body" in English and "Ganzer Körper" in German.
2. It is the first entry in models/manifest.json, so it is the first in the picker and the one the app opens with. The address ?region=<id> keeps working for every region, and an unknown id falls back to the first entry as today.
3. No new geometry is invented. The whole body is made from the same sources and the same build scripts as the six regions.
4. Each structure is drawn exactly once in the whole body. A bone that one region borrows from another through also_in must not be drawn twice.
5. The whole body's data is the union of the six regions: every structure, its attachments, and the checked action rows, movements and exercises of every joint. So the whole body has the Movements and Notebook tabs, because the hip's joints are in it.
6. Search, Layers, Under a spot, the stage controls (name chip, RIGHT and LEFT markers, view badge, reset, zoom), the Notebook and both languages must work in the whole body as they do in a region.
7. The phone gate stays: interactive within 5000 ms. The check for it here is node apps/web/scripts/perf-check.mjs (4 times CPU throttle, median of 5 runs). The owner measures the real phone afterwards.

STEP 1: MEASURE BEFORE DESIGNING

Do this first and write the numbers down. They decide the design.

a. Are the six regions in one coordinate space? Load all seven glb files of models/ together (a throwaway script or a scratch page, not committed) and look: do the regions meet where they should (thigh to lower leg at the knee, trunk to neck, shoulder to arm), with no gap, overlap or wrong scale? The hip was aligned with Z-Anatomy data in a separate step, so check it most carefully. Take screenshots from the front, the side and the back and look at them.
b. Which structures would be drawn twice? List every mesh whose structure id and side appear in more than one file.
c. How heavy is it? npm run check-models prints the numbers. Today: about 479,000 triangles and 2.7 MB over seven files and about 650 meshes, against a budget of 150,000 triangles for one region.
d. How fast is it? Make the simplest whole body that can run (the "body" region listing the existing files, drawn-twice structures skipped) and run perf-check with it as the opener. Note the median, and the median for the hip as the opener for comparison.

STEP 2: CHOOSE HOW TO BUILD IT, THEN WRITE IT DOWN

Choose between these two from the measurements:

A. Reuse the files. The "body" region lists the existing glb files in the manifest and the app skips a structure it has already drawn. No new download size in the repo, nothing new to keep in step.
B. One lighter file. The asset pipeline builds models/body.glb from the same sources with stricter triangle caps, each structure once. More build work, and a second copy of every mesh to keep in step, but it can be made as light as the phone needs.

Take A if perf-check passes with it and the regions fit together. Take B if A fails the gate or is close to it (a median over 4000 ms counts as close). If B is needed, set the caps from measurement and say what detail was lost, with before and after screenshots of the same view.

The triangle budget: the whole body cannot meet the 150,000 budget of a region. Give the "body" region its own budget in the check, set from what you measured to work, and keep 150,000 for the six regions. This is a new, separate limit for a new region. It is not a loosening of the existing check, and the six regions must still pass theirs unchanged.

Write a short design to docs/superpowers/specs/2026-11-17-whole-body-view-design.md: the measurements, the choice between A and B with the reason, how drawn-twice structures are handled, how the union data bundle is built, the budget, what changes in the app, what the tests cover, and what is left for the owner. Then write a plan to docs/superpowers/plans/2026-11-17-whole-body-view.md with the superpowers:writing-plans skill, in the format of the existing plans (Global Constraints, Review Focus, tasks with tests first). Commit both. Then build the plan with superpowers:subagent-driven-development, one commit per task.

WHAT THE BUILD MUST COVER

- models/manifest.json: the "body" region first. pipeline and checks (npm run validate, npm run check-models) know the region and pass.
- The data build (npm run build-data, pipeline/data/src) writes data/body.json as the union. It must not copy rows by hand: it is built from the same YAML as the regions, so the two cannot drift apart. The draft guard holds: no unchecked row in the normal build (node scripts/check-no-drafts.mjs).
- Layers: each structure keeps the layer number it has in its home region. Check that peeling a layer in the whole body behaves sensibly (the outer muscles go first all over the body) and say in the report what you saw.
- Under a spot: its depth and side rules were written for one region. Test it on the whole body, including a tap on the trunk and one on an arm held next to the trunk.
- Texts: region.body in both language files, same position in both. A gap line for the whole body that names what the model does not have yet, built from the six existing regionGap texts so it cannot contradict them. Only the hip has German structure names today. That stays, and the whole body shows English names for the rest under German, as the regions do.
- The first camera view frames the whole body. The reset button returns to it.
- Tests first, as the build rules say. Unit tests for the union bundle, the drawn-once rule and the fallback of an unknown ?region=. End-to-end tests in apps/web/e2e for: the app opens with the whole body, the picker lists seven entries with "Whole body" first, switching to a region and back, a search in the whole body that selects a structure outside the hip, and the layout checks of layout.spec.ts passing with the whole body as the opener at all three screen sizes in both languages. Existing tests that say the app opens with the hip change to the whole body, because the owner changed that behaviour. Say each such change in the build report. No other existing test is changed to get green.
- README.md and docs/regions/known-gaps.md if they describe what the app opens with or what the regions are.

STOP RULES (write it down and stop that part, as the build rules say)

1. The regions do not fit together (Step 1a shows gaps, overlaps or a wrong scale that a single placement fix cannot repair). Do not move meshes by eye. Write what you measured, with the screenshots described in words, under "Waiting for the owner", and stop the whole run.
2. Neither A nor B gets perf-check under 5000 ms with the whole body as the opener. Then build the whole body as a seventh entry that can be picked, keep the hip as the opener, and write the numbers and the reason under "Waiting for the owner". Do not raise the limit, do not change the throttle, do not change what perf-check measures.
3. Making the whole body light enough would mean dropping structures, not only detail. Do not drop any. Report it.
4. Anything that needs a data row to change, a review to be recorded, or a wording about symptoms to be written. Not yours to decide.

WHEN YOU ARE DONE

Run every check of the build rules and keep the output. Write docs/superpowers/reviews/whole-body-view-build-report.md with the sections the rules name. Under "Not verified" list at least: the Galaxy A23, how the whole body feels to turn and tap on a small screen, and a Windows build. Under "For the owner" list the choice between A and B, the body budget you set, the perf-check medians for the whole body and for the hip as the opener, every changed test with its reason, and the German texts you wrote as drafts. Update docs/superpowers/reviews/progress.md, commit, and push the working branch. End your turn with the progress file's content and the "For the owner" items.
```

## What the owner does afterwards

1. Read the build report, above all "Waiting for the owner" and "For the owner".
2. Deploy to the homelab and measure on the Galaxy A23 with `?perf=1`, three runs, as in `docs/deploy-homelab.md`. The gate is a median under 5000 ms and no stutter when turning. If the phone fails where the check passed, the whole body stays in the picker and the hip becomes the opener again, which is a change of one line in `models/manifest.json`.
3. Have the result reviewed before merging into `main`.
