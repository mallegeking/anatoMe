# Prompts for the Opus build sessions

Date: 2026-11-13, changed 2026-11-14 for one working branch and an overnight run
For: the project owner. Each block below is one prompt to paste into a Claude Code session in WSL, started in the repo folder with Opus as the model.

All build work happens on the branch `claude/install-superpowers-plugin-v0gy65`. Nobody but the owner touches `main`. The rules that are the same for every session live in `docs/superpowers/plans/2026-11-13-build-rules.md`, and every prompt sends Opus there first.

## Starting a session

In WSL, in the repo folder:

```bash
git fetch origin && git switch claude/install-superpowers-plugin-v0gy65 && git pull --ff-only
```

```bash
claude --model opus --dangerously-skip-permissions
```

Then paste the prompt. The work starts when the prompt is sent. Nothing starts on its own from a commit or a push.

About `--dangerously-skip-permissions`: without it Claude Code stops and asks before commands and web pages, and an overnight run would sit at the first question. With it Opus can run any command in that WSL user account without asking. The build rules tell it what it may do, but nothing enforces them. Use it only in a WSL checkout that holds nothing else you care about. The careful choice is `claude --model opus --permission-mode acceptEdits`, which you then have to watch.

The repo should live in the Linux file system (for example `~/code/anatoMe`), not under `/mnt/c`, or builds and tests are slow. WSL needs Node 22 or newer and git. The superpowers plugin is listed in `.claude/settings.json`, so Claude Code offers it when the session starts. Accept it once before the overnight run.

## What can run in one go

| Run | Prompt | What it builds | Why it ends there |
| --- | --- | --- | --- |
| Tonight | 1: Phase 2 overnight | 2a, 2d tools, 2b, the 2c wording check, 2d data | The notebook waits for your sign-off of the wording check |
| Next (added 2026-11-14) | 2b: finish the area lookup | 2b Tasks 2 to 4, which stopped overnight on a wrong number in the plan | |
| After 2b and the sign-off | 3: the notebook | 2c Tasks 2 to 7 | |
| After that review | 4: Phase 3 | publish preparation | The publish steps are yours |
| After that review | 5: Phase 4a | regions and German | |

One limit to know about: a run this long can hit your usage limit and pause part way. The work it finished is committed and pushed plan by plan, and Prompt 2 picks it up again.

---

## Prompt 1: Phase 2 overnight

```text
You are building several implementation plans for anatoMe in one unattended run. The owner is asleep. Do not ask questions and do not wait for answers.

First read docs/superpowers/plans/2026-11-13-build-rules.md and follow it exactly. The two most important rules: you work only on the branch claude/install-superpowers-plugin-v0gy65 and never on main, and when a plan says stop or a task is blocked you write it down and move on as the rules say.

One-time setup before the baseline, if not done yet:
- npm ci
- cd apps/web && npx playwright install --with-deps chromium && cd ../..   (if the sudo part of --with-deps cannot run unattended, use: npx playwright install chromium)
- python3 -m venv .venv && .venv/bin/pip install pytest   (if python3 or venv is missing, skip it and note it)

Build these, in this order. Finish one before starting the next, and write the build report and update the progress file after each, as the rules say.

1. docs/superpowers/plans/2026-11-13-phase-2a-movement-explorer.md, all tasks (1 to 8). Report: phase-2a-build-report.md
2. docs/superpowers/plans/2026-11-13-phase-2d-hip-data.md, Tasks 1 and 2 only. Report: phase-2d-tools-build-report.md
3. docs/superpowers/plans/2026-11-13-phase-2b-area-lookup.md, all tasks (1 to 4). Needs item 1. Report: phase-2b-build-report.md
4. docs/superpowers/plans/2026-11-13-phase-2c-symptom-notebook.md, Task 1 only (the wording check, research on the web). Then do NOT build Tasks 2 to 7. Write "Notebook Tasks 2 to 7 wait for the owner's sign-off in docs/phase2/medical-device-wording.md" under "Waiting for the owner". No build report for this item, the document is the result.
5. docs/superpowers/plans/2026-11-13-phase-2d-hip-data.md, Tasks 3, 4, 5 and 6 (sourced data, research on the web). Task 4 needs item 1. Report: phase-2d-data-build-report.md

Then stop. Do not start Phase 3 or Phase 4a.

Things to keep in mind per item:

Item 1 (movement explorer)
- The real data has no checked rows. In the normal build the Movements tab must show its "no checked information yet" and waiting lines and leave the model whole. You only see highlighted structures in tests, in the end-to-end data and in the review build.
- An exercise phase lights the muscles in its effort list, never the muscles of the direction the joint travels. If a test lights hip flexors while lowering into a squat, the code is wrong, not the test.
- No see-through materials in the viewer.
- Where a step asks you to look at the app, check what you can with Playwright at 360 px wide and list the rest under "Not verified".

Item 2 (tools)
- mark-checked must change no byte of a YAML file other than the checked_by line and the new checked_on line.
- Never run mark-checked on the real data folder. Use a copy of a fixture in a temporary folder.

Item 3 (area lookup)
- Task 2 Step 4 checks that the model is in metres. If the size is outside the range the plan gives, treat the task as blocked. Do not tune the depth constants to fit.
- Rays look at every mesh, also the ones the layers hide.
- The panel text must never say or suggest what causes a symptom.

Item 4 (wording check)
- Open the current versions of the documents the task lists. Write nothing about the rules from memory: every statement names the document, the article or section, the link and the date read. If a page cannot be reached, say so in the document.
- Be honest about how sure the conclusion is and where the comparison of painful and painless movements sits closest to the line. Leave the two sign-off lines empty. They are the owner's.

Item 5 (data)
- Read "How to write a row" in the plan before the first row and follow it for every row.
- Nothing from memory. If you have not opened a source in full in this session, you may not cite it.
- An honest gap beats a weak row. When no opened source supports a row, write the gap into docs/phase2/data-gaps.md and move on.
- A when range holds only angles the source states.
- Quotes only from sources whose licence fits CC BY 4.0, otherwise a summary in our own words. Do not cite OpenStax Anatomy and Physiology directly.
- Every row stays checked_by: null. Never run mark-checked.
- Do the "second read" steps for real: open each source again and compare it with the row.
- Add a section "Rows added" to the report: row id, source id, licence, quote or summary, and your own confidence that the row says what the source says.

When everything in the list is done, blocked or waiting, end your turn as the rules say.
```

---

## Prompt 2: carry on after an interruption

Use this when a run stopped part way (a usage limit, a closed terminal). Start a new session the same way and paste:

```text
An earlier session was building implementation plans for anatoMe and stopped part way. Carry on from where it stopped. The owner may be away. Do not ask questions.

First read docs/superpowers/plans/2026-11-13-build-rules.md and follow it exactly. You work only on the branch claude/install-superpowers-plugin-v0gy65 and never on main.

Then read docs/superpowers/plans/2026-11-13-opus-prompts.md, the block "Prompt 1: Phase 2 overnight". That is the job. Read docs/superpowers/reviews/progress.md and git log to see which items and tasks are finished: a task is finished when its commit from the plan exists.

If the working tree has uncommitted changes from the interrupted task, look at them. Keep them only if the task's checks pass with them. Otherwise throw them away and start that task again.

Continue with the first unfinished task and go on to the end of the list, with the same rules and the same notes per item.
```

---

## Prompt 2b: finish the area lookup

Added 2026-11-14. The overnight run built Task 1 of Phase 2b and stopped at Task 2 Step 4, because the plan expected the model's longest side to be between 0.5 and 1.0 and it measured 1.124. The plan was wrong, not the model. It now expects 0.8 to 1.4.

```text
You are finishing one implementation plan for anatoMe: docs/superpowers/plans/2026-11-13-phase-2b-area-lookup.md. Task 1 is built. Build Tasks 2, 3 and 4.

First read docs/superpowers/plans/2026-11-13-build-rules.md and follow it exactly. You work only on the branch claude/install-superpowers-plugin-v0gy65 and never on main.

Read docs/superpowers/reviews/progress.md and docs/superpowers/reviews/phase-2b-build-report.md to see where the earlier session stopped and why.

The plan was corrected on 2026-11-14 in three places. Read it again from the top, do not work from the earlier session's notes:
- Task 2 Step 4 now expects the largest size number of hip.glb between 0.8 and 1.4. The model is in metres.
- The modelStats size test in Task 2 no longer expects three positive numbers, because a flat test file has a zero.
- Task 1: the result of structuresUnder is now sorted by distance, then sid, then side. Before Task 2, add a test to apps/web/src/area/under.test.ts with the left and the right copy of one structure at the same distance, given in both orders, and make it pass. Commit it as "Give the depth list a fixed order for equal distances".

Then build Task 2 from its Step 1, then Tasks 3 and 4.

Keep in mind:
- If the size is outside 0.8 to 1.4, treat Task 2 as blocked. Do not tune the depth constants.
- Rays look at every mesh, also the ones the layers hide.
- The panel text must never say or suggest what causes a symptom. docs/phase2/medical-device-wording.md, section 5 rule 4, also asks that no text says "tap where it hurts". Follow it.
- If the end-to-end click in Task 4 lands beside the model, find out why before moving the click.

Replace the earlier phase-2b-build-report.md with a full report for all four tasks and update the progress file.
```

---

## Prompt 3: the notebook (after your sign-off)

Before this: read `docs/phase2/medical-device-wording.md`, fill in the two sign-off lines at its end, commit and push that on the working branch.

```text
You are building one implementation plan for anatoMe: docs/superpowers/plans/2026-11-13-phase-2c-symptom-notebook.md, Tasks 2 to 7. Task 1 is done.

First read docs/superpowers/plans/2026-11-13-build-rules.md and follow it exactly. You work only on the branch claude/install-superpowers-plugin-v0gy65 and never on main.

Needs: Phase 2a and Phase 2b built on the working branch (check docs/superpowers/reviews/progress.md).

Before anything else, read docs/phase2/medical-device-wording.md and its last section, "Owner sign-off".
- If either line is empty, stop and say so.
- If "Notebook log, backup and summary" says no, stop.
- If "Comparison (structures to look into)" says yes, build Tasks 2 to 7.
- If it says no, build Tasks 2, 3, 5, 6 and 7 without Task 4, following the "without Task 4" notes in the plan, and set SHOW_COMPARISON to false.
Apply every wording rule in section 5 of that document, also the ones that are stricter than the plan.

Keep in mind:
- Notebook data never leaves the device. No request may carry it, and it is never written to the console or to a log.
- The notebook code loads only when it is first needed. Task 5 Step 4 measures this. Compare with the commit before this plan's first commit instead of with main, and put both chunk sizes into the build report.
- A backup file is input from outside. Refuse anything that is not exactly the format, and show notes as text, never as HTML.
- Task 6 Step 4 needs eyes on a print preview. Check what you can with Playwright (page.emulateMedia with media print, then a screenshot) and list the rest under "Not verified".

Report: phase-2c-build-report.md
```

---

## Prompt 4: Phase 3, publish preparation

```text
You are building one implementation plan for anatoMe: docs/superpowers/plans/2026-11-13-phase-3-publish-v1.md, Tasks 1 to 8.

First read docs/superpowers/plans/2026-11-13-build-rules.md and follow it exactly. You work only on the branch claude/install-superpowers-plugin-v0gy65 and never on main.

Needs: Phases 2a, 2b, 2c and 2d built on the working branch (check docs/superpowers/reviews/progress.md).

Hard limits for this plan:
- You never make the repo public, never turn on GitHub Pages, never push a tag and never rewrite history. Those are the owner's steps in the checklist you write in Task 8.
- The Pages workflow in Task 6 runs on pushes to main only. Do not add the working branch to it.
- Tasks 2 and 3 are research. Task 2 needs the web: record what each licence page says today, with the link and the date, and nothing from memory.
- In Task 3, describe a finding by commit and file. Never copy a key, a hostname, an address or an e-mail into the audit document or into your replies. If there is any finding, write it under "Waiting for the owner" and go on with Tasks 4 to 8.
- In Task 1, if the validator finds a real quote from an incompatible source, open the source before you rewrite it as a summary.
- In Task 5, the review-guard job compares against the pull request's base branch as the plan says. Do not open a pull request to try it.
- In Task 6, take the action names and versions from the current GitHub documentation.
- Task 7 needs the public address of the repo. Take it from git remote get-url origin.

Report: phase-3-build-report.md
```

---

## Prompt 5: Phase 4a, regions and German

```text
You are building one implementation plan for anatoMe: docs/superpowers/plans/2026-11-13-phase-4a-regions-and-german.md, Tasks 1 to 5.

First read docs/superpowers/plans/2026-11-13-build-rules.md and follow it exactly. You work only on the branch claude/install-superpowers-plugin-v0gy65 and never on main.

Needs: Phase 3 built on the working branch (check docs/superpowers/reviews/progress.md).

Keep in mind:
- English stays complete. A missing German text or name falls back to English.
- German names in the data are opened, not remembered. Name the source and the date in each data file's header. Leave german out where no opened source gives a name.
- The German texts use "du". The disclaimer and the educational line must say exactly as much as the English ones.
- Task 4 changes the mesh pipeline. Set it up first (bash pipeline/get-blender.sh, bash pipeline/fetch-sources.sh, the .venv). If Blender or the sources cannot be set up here, skip Task 4, mark it "skipped", and do not change pipeline code you cannot run.
- In Task 4 Step 6, do not commit rebuilt model files unless the plan's condition for it holds. If the rebuilt files differ more than it allows, treat the task as blocked.

Add a section "For the owner to proofread" to the report with every German text and name you were unsure about.

Report: phase-4a-build-report.md
```

---

## Prompt 6: Phase 4b, the rest of the body as meshes and names (added 2026-11-16)

Start this one in the Linux clone that has `sources/` and `tools/blender` (on the owner's machine: the WSL distro `Ubuntu-24.04`, folder `~/build/anatoMe`). Tasks 3 and 4 cannot run anywhere else.

```text
You are building one implementation plan for anatoMe: docs/superpowers/plans/2026-11-15-phase-4b-whole-body-meshes.md, Tasks 1 to 5. Its design is docs/superpowers/specs/2026-11-15-whole-body-meshes-design.md. Read both from top to bottom before the first task.

First read docs/superpowers/plans/2026-11-13-build-rules.md and follow it exactly. You work only on the branch claude/install-superpowers-plugin-v0gy65 and never on main. The owner is away for this whole run. Do not ask questions and do not wait for an answer. Where the build rules or the plan say stop, do what they say for a stop and carry on with what is left.

Needs: nothing. Phase 4a Task 4 is blocked and Task 5 is not started. This plan does not need either. Do not apply or touch the saved Phase 4a patch.

Before Task 3, check that this machine can run the mesh steps: tools/blender/blender exists, sources/bp3d/isa_BP3D_4.0_obj_99 holds the OBJ files, sources/z-anatomy/TA2.csv exists, sources/bp3d-inventory.jsonl exists (make it with .venv/bin/python pipeline/assets/bp3d_inventory.py if not) and .venv/bin/pytest runs. Set up what is missing with bash pipeline/get-blender.sh, bash pipeline/fetch-sources.sh and the README's .venv lines. If it still cannot run, finish Tasks 1 and 2, mark Tasks 3 to 5 "skipped" with the reason, and write the report.

Keep in mind:
- The hip does not change. Never rebuild or commit models/hip.glb or models/hip-z-anatomy.glb. Run git status --short models before every commit that touches models/.
- BodyParts3D only. Nothing from Z-Anatomy is read or exported, apart from the Latin names in TA2.csv.
- No name is typed by hand. Ids, names, patterns, FMA ids and Latin names of the new structures come out of pipeline/assets/region_gen.py. If generated output looks wrong, fix the rule in the generator, record it under Deviations, and generate again. Never edit a generated file.
- The region rules, the CONTEXT table and the layer thresholds in the plan are decisions. Copy them as written. The plan's expected counts (60, 23, 70, 53 and 54 own structures, three dropped names) come from a dry run of exactly those rules, so a different count means your code differs from the plan.
- The layer gate in Task 4 Step 3 has a fallback (flat depth). Use the fallback if the gate fails. Do not tune the thresholds and do not treat the task as blocked for that reason.
- If a region is over the triangle budget, follow Task 4 Step 2 (lower the cap in steps of 250, not under 1,250).
- No knowledge rows: no attachment, action, movement, exercise or joint is added, and no German structure name.
- Keep the changes to pipeline/assets/build_region_blender.py to the two additions the plan names.

Add to the report, besides the sections the build rules ask for: the structure, mesh and triangle count and the file size of each new region, the layer table of Task 4 Step 3 with the full list for the neck and the trunk, the generator's dropped list, the eleven meshes without a header name under "Not verified", and a section "For the owner to proofread" with the German texts of Task 2.

Report: phase-4b-build-report.md
```

---

## Prompt for Fable: review a finished build

Paste this into a Fable session in the repo after a run. Replace the plan name.

```text
Review the build of <plan file name> on the branch claude/install-superpowers-plugin-v0gy65.

Fetch the branch. Read the plan, the specs it names, docs/superpowers/plans/2026-11-13-build-rules.md, docs/superpowers/reviews/progress.md and the plan's build report in docs/superpowers/reviews/. The report names the first and last commit of the plan. Review that commit range.

Check, in this order:
1. Every task is done as the plan says: names, signatures, exact texts, exact test values.
2. Each line of the plan's Review Focus has a real test that would fail if the behaviour broke.
3. Every deviation in the build report is justified, and there are none the report leaves out.
4. The rules that are never broken: nothing on main, no checked_by set, no row from memory, nothing private, no outside request, no weakened check.
5. Run the checks yourself and compare with the report.
6. For data rows: open a sample of the cited sources and compare them with the rows.

Give me the findings ranked by how much they matter, what must be fixed before I merge into main, and a prompt I can paste to Opus for the fixes.
```
