# Build progress

Sessions of 2026-11-14:

- Overnight run, prompt 1 of `docs/superpowers/plans/2026-11-13-opus-prompts.md`.
- Second run: finished plan 2b (Tasks 2 to 4) after the owner corrected the model size check.
- Third run: built plan 2c, the Notebook (Tasks 2 to 7), with the comparison on.
- Fourth run: built plan 3, publish v1 (Tasks 1 to 8). The repo stays private. Nothing was made public, Pages is off, no tag was pushed.
- Fifth run: built plan 4a, regions and German (Tasks 1 to 3). Task 4 is blocked on the surface gate, Task 5 was not started.

Session of 2026-11-16:

- Sixth run: built plan 4b, the whole body as BodyParts3D meshes and names (Tasks 1 to 5). The saved Phase 4a patch was not touched and still applies to `build_region_blender.py`.
- Seventh run: the fixes of the Phase 4b review. Fixes 2 to 4 are done (spinalis in the neck, the FMA id of infraspinatus, two generator tests). Fix 1 (a wrong side from BodyParts3D) stopped at its own stop rule and is not committed. See "Review fixes" in `phase-4b-build-report.md`.
- Eighth run: the second review fixes (Fixes A to C) with the owner's decisions. Fix A is Fix 1 with option (b): only records a region's target list matches get the side they lie on, which corrects exactly FJ1469 and FJ1469M, and `arm.glb` is rebuilt. See "Second review fixes" in `phase-4b-build-report.md`.
- Ninth run: the third review fixes (Fixes 1 to 5), tests and docs only. Four new tests, each seen failing on its named line, and `docs/regions/known-gaps.md` lists palmaris brevis (arm) and the coccyx (trunk) as having no mesh. See "Third review fixes" in `phase-4b-build-report.md`.

Session of 2026-11-17:

- Tenth run: the Phase 3 review fixes (Fixes 1 to 5). The review guard now also compares reviewed rows at the base and the head, the validator refuses a quotable `license_id` under a non-commercial, no-derivatives or share-alike licence text, the history audit's home-path row is corrected after a re-run (new item D8), a new end-to-end test serves the build from `/anatoMe/`, and three small fixes. See "Review fixes" in `phase-3-build-report.md`.
- Eleventh run: the Phase 4a review fixes (Fixes 1 to 5), tests and docs only. Fixes 1, 2, 4 and 5 are done: five new tests for the language choice, each seen failing on its line, and `docs/phase4/german-names.md` with the page and read date of every German name, each page opened again. Fix 3 (`?region=` at start) stopped at its own stop rule and is not committed, because the `?region=elbow` test cannot fail on its named line. See "Review fixes" in `phase-4a-build-report.md`.
- Twelfth run: built the three-column layout and stage controls (Tasks 1 to 14): a navigation rail, stage controls, Layers in its own section, retry after failed loads and four restyled panels. All checks are green except the known root-only `markChecked` pipeline test. German texts and eight open choices wait for the owner. See `three-column-layout-build-report.md`.
- Thirteenth run: built the whole body view (design, plan and Tasks 1 to 6, plus the fixes of the whole-branch review). Approach A (the seven region files) failed the phone gate, so the whole body is one lighter file, `models/body.glb`, with bones decimated to 1000 and other parts to 400 triangles per mesh (17 meshes stay above 400, see the fourteenth run). The app opens with it. All checks are green, perf median 3471 ms with the whole body as the opener. Five changed tests go further than the opener and wait for the owner. See `whole-body-view-build-report.md`.

Session of 2026-11-18:

- Fourteenth run: the whole body view review fixes (Fixes 1 to 5). Every load wait now checks that the model really loaded, the whole body's stage controls are tested at three sizes, the flaky turning test was traced to the view badge missing camera-controls' `rest` on long frames and fixed in the app, and the gap list has an App test. Fix 4 (the triangle caps) stopped at its own stop rule: the docs now call the caps targets and list the 17 meshes above 400. See "Review fixes" in `whole-body-view-build-report.md`.
- Fifteenth run: the reset bug. A reset from a camera resting less than 0.01 from the first view drew nothing, because camera-controls asks for frames only above its restThreshold. `resetView` now asks for a frame itself. A unit test and a new e2e test at three sizes were seen failing first (the e2e test can fail only at the desktop size, see the report). All checks and five more full e2e runs are green. See "Reset from very close to the first view" in `whole-body-view-build-report.md`.

| Plan | State | Report |
| --- | --- | --- |
| Phase 2a movement explorer, Tasks 1 to 8 | done | `phase-2a-build-report.md` |
| Phase 2d hip data, Tasks 1 and 2 (tools) | done | `phase-2d-tools-build-report.md` |
| Phase 2b area lookup, Tasks 1 to 4 | done (two plan rules for the owner, see below) | `phase-2b-build-report.md` |
| Phase 2c notebook, Task 1 (wording check) | done | `docs/phase2/medical-device-wording.md` |
| Phase 2c notebook, Tasks 2 to 7 | done (with the owner's stricter wording rules, points for the owner below) | `phase-2c-build-report.md` |
| Phase 2d hip data, Tasks 3 to 6 (sourced data) | done (12 rows, 2 exercises, gaps listed) | `phase-2d-data-build-report.md` |
| Phase 3 publish v1, Tasks 1 to 8 | done (Task 3 stopped for the owner, open audit items below) | `phase-3-build-report.md` |
| Phase 4a regions and German, Tasks 1 to 5 | partly done (Tasks 1 to 3 done, Task 4 blocked, Task 5 not started) | `phase-4a-build-report.md` |
| Phase 4b whole body meshes, Tasks 1 to 5 | done (with deviations, points for the owner below) | `phase-4b-build-report.md` |
| Phase 4b review fixes, Fixes 1 to 4 | done (Fixes 2 to 4 in the seventh run, Fix 1 as Fix A of the second review fixes) | `phase-4b-build-report.md`, section "Review fixes" |
| Phase 4b second review fixes, Fixes A to C | done (two App tests could not be written, see the report) | `phase-4b-build-report.md`, section "Second review fixes" |
| Phase 4b third review fixes, Fixes 1 to 5 | done (tests and docs only, every test seen failing on its named line) | `phase-4b-build-report.md`, section "Third review fixes" |
| Phase 3 review fixes, Fixes 1 to 5 | done (every new test seen failing first, groh-2009 left not confirmed for the owner) | `phase-3-build-report.md`, section "Review fixes" |
| Phase 4a review fixes, Fixes 1 to 5 | partly done (Fixes 1, 2, 4 and 5 done, Fix 3 stopped for the owner) | `phase-4a-build-report.md`, section "Review fixes" |
| Three-column layout and stage controls, Tasks 1 to 14 | done (with deviations, German drafts and open choices for the owner) | `three-column-layout-build-report.md` |
| Whole body view, design, plan and Tasks 1 to 6 | done (option B, with deviations in changed tests for the owner) | `whole-body-view-build-report.md` |
| Whole body view review fixes, Fixes 1 to 5 | partly done (Fixes 1, 2, 3 and 5 done, Fix 3 fixed in the app, Fix 4 stopped for the owner) | `whole-body-view-build-report.md`, section "Review fixes" |
| Whole body view, reset from very close to the first view | done (zoomBy left as it is for the owner) | `whole-body-view-build-report.md`, section "Reset from very close to the first view" |

## Waiting for the owner

- Phase 2a: run `docs/phase2/phone-measurements.md` (Movements tab, hiding one side) on the phone in the review build.
- Phase 2d tools: when the physio's answers arrive, record them with `npm run mark-checked` as `docs/review/how-to-record-a-review.md` describes.
- Phase 2b: check on the phone whether the white dot (about 2 CSS pixels) can be seen (item 4).
- Phase 2b: run section 6 "Area tab" of `docs/phase2/phone-measurements.md` on the phone in the review build, with its physio question.
- Phase 2c: three texts that are slightly off, all plan wording (item 4), and the phone sheet question that contains "diagnosis" (item 5).
- Phase 2c: run section 7 "Notebook" of `docs/phase2/phone-measurements.md` on the phone in the review build, including a real print preview.
- Phase 2d data: 12 new action rows and 2 exercises wait for the physio in the review build. Gaps in `docs/phase2/data-gaps.md`.
- Phase 3: the history audit (`docs/phase3/history-audit.md`) has seven open items D1 to D7 (handle, symptoms and personal circumstances in the spec, the home server description, a personal e-mail address and a computer-like author name in commit metadata, and a local home-folder path in the history of commit `ed43141`). Decide between leaving them, rewriting history, or starting the public repo from a fresh commit, before checklist item 9. A squash-merge keeps D7 out of `main`. Item 1 of `phase-3-build-report.md`, "For the owner".
- Phase 3 review fixes: the re-run of the home-path searches found D8, a local home folder path in commit 8b37ec6, file `docs/superpowers/reviews/three-column-layout-build-report.md`, only on the origin branch `claude/nifty-sagan-c57kd7`. Do not push that branch to the public repo, or fix it there. The audit now has eight open items, D1 to D8.
- Phase 3 review fixes: groh-2009 is marked not confirmed in `docs/phase3/licence-recheck.md`. PMC showed a bot check again and the Europe PMC full text has no licence element. Its `license` and `license_id` were not changed. Both groh-2009 citations are summaries.
- Phase 3: confirm the four extra licence mappings and the 21 licence rows read from Europe PMC (item 2 of the report), `REPO_URL` in `apps/web/src/config.ts` (item 3) and the README "What comes next" wording (item 4).
- Phase 3: the remaining steps to publish v1 are in `docs/phase3/publish-checklist.md`. They start after the physio review.

- Phase 4a: Task 4 is blocked. The new surface gate (95th percentile of the bone surface distances, limit 5 mm) measures 7.8 and 8.0 mm before decimation and 7.0 and 7.3 mm after, mostly on the iliac wing. Decide how the gate should work (four options in item 1 of `phase-4a-build-report.md`, "For the owner"). The uncommitted Steps 1 and 2 are saved as `~/build/research/phase4a-task4-wip.patch` in the Linux home, with the task report beside it. After the decision, Task 4 and then Task 5 (the region playbook) can be built.
- Phase 4a: proofread the German texts and names (section "For the owner to proofread" of the report), especially the disclaimer and the educational line. Decide on "Physio-Fachkraft" in the summary and on the style of the German names (items 2 to 4).
- Phase 4a: `unzip` is installed on the Linux machine since 2026-11-16 (item 5, done). The builder's copy in `~/build/bin/unzip` comes first on the PATH and can be deleted.
- Phase 4a review: Fix 3 is stopped. The `?region=elbow` test cannot fail when App passes `""` instead of `location.search`, because both give the first region. Decide whether to commit only the `?region=shoulder` test or tie the elbow test to another line. Both tests are in `~/build/research/phase4a-review-fix3-wip.patch` in the Linux home (item 6 of `phase-4a-build-report.md`, "For the owner").

- Phase 4b: four trunk meshes are above the 2000-face cap (the three intercostals and the right external oblique). The trunk is still under budget at 140,296. The owner accepted this for now on 2026-11-16 (item 1 of `phase-4b-build-report.md`, "For the owner").
- Phase 4b: eleven paired muscles are one structure each, so a tap selects both sides (item 2). The layer rule is now used on all five regions, with some pairs that may read wrong when peeling (item 3). Latin names are not checked one by one, four with typos were left out (item 4). The owner decided on 2026-11-16 that the Latin names stay as they are.
- Phase 4b: run `docs/regions/phone-measurements.md` on the phone for the five new regions, the trunk and the shoulder first (item 5). Proofread the German region names and gap lines (section "For the owner to proofread").
- Phase 4b review: spinalis (no name in its own header, named "Spinalis" in the header of its mirror FJ1543M) is filed under the neck by where it lies. Whether it is spinalis cervicis is not checked (items 8 and 12).
- Phase 4b second review: `setNotice(null)` and `setPrintJob(null)` in `changeRegion` repeat what other code already does, so no test can fail on either line alone and none was added. Keep or remove them (item 10). One App test run failed once without a name and did not come back in nine runs (item 11). The doubled hyoid and the third left digastric file are documented in `docs/regions/known-gaps.md`, not fixed, as the owner decided.
- Phase 4b second review: `~/build/research/phase4b-fix1-wip.patch` is applied, and the list of 72 beside it, `phase4b-fix1-side-corrections.txt`, is no longer needed. Both can be deleted (item 9).
- Phase 4b third review: the arm has a known gap now (palmaris brevis has no mesh) but no gap line in the app. Decide whether it gets `regionGap.arm` in English and German (item 13). The coccyx has no mesh either. Decide whether the trunk's gap line should name it (item 14).

- Whole body view: confirm or reject the changed tests and test setup, rows 4 to 8 of "Deviations" in `whole-body-view-build-report.md` (both stage tests open the hip, 20 s load waits in three test helpers, `workers: 2`, a comment in area.spec). They go further than "opener only".
- Whole body view: look at the before and after screenshots in `~/build/research/whole-body-screens/` (the skull's teeth row above all) and say whether bones at 1000 and other parts at 400 triangles are good enough. The body budget is 240,000 triangles with 708 left, so any new structure forces a decision.
- Whole body view: run the "Whole body" row of `docs/regions/phone-measurements.md` on the Galaxy A23, timing from opening the page. perf-check here: 3471 ms for the whole body, 2371 ms for the hip.
- Whole body view: proofread the German draft "Was dem Modell noch fehlt, nach Region:" (`regionGap.body`).
- Whole body view: decide whether Under a spot should stop at the air between an arm and the trunk. A tap a few pixels beside the humerus lists the chest wall 5 to 11.5 cm deeper.

- Whole body view review: Fix 4 is stopped. 17 non-bone meshes in `body.glb` stay above 400 triangles (the three intercostals 5615 to 7105, the external oblique about 2000 each side, serratus anterior about 840 and ten more). Merging loose vertices before decimating brings 13 of them to 400 in a trial, the three intercostals and the thoracic rotator stop at about 2500, 1600, 1100 and 770. Decide whether the pipeline merges first and what cap these sheets get (item 3 of "Review fixes", "For the owner"). The docs now say "decimated to" and list them.
- Whole body view review: confirm the four 20 s load waits that stay, now each followed by a check that the model loaded (item 1), and that Fix 3 was fixed in the app (the view is reported on `sleep` too) instead of in the test scheduling, with `workers` still 2 (item 2).
- Whole body view review: the new zoom test's reset step failed once in the first five full e2e runs and could not be made to fail again. See "Five full e2e runs" in the report (item 4).
- Whole body view, reset fix: `zoomBy` can miss its frame the same way when a zoom step is clamped within 0.01 of the distance limits (0.15 and 4). It was not changed. Decide whether it gets the same `invalidate()` (item 1 of "Reset from very close to the first view", "For the owner"). The zoom test's reset step passed in all six full runs of this session.

## Notes for the next session

- All runs built in a clone on the Linux file system, because the web tests time out on the Windows drive. After the first five runs the Windows checkout was fast-forwarded to the same commit. The sixth to ninth runs (Phase 4b and its three review fixes) did not touch the Windows checkout, so fast-forward it before using it.
- `sources/bp3d-inventory.jsonl` is not tracked in git. The one in the Linux clone has the corrected side of flexor pollicis brevis. Run `pipeline/assets/bp3d_inventory.py` before rebuilding a region anywhere else.
- `npm ci` and the Python `.venv` in the Windows checkout were run from WSL in the first run. Its `node_modules` and `.venv` hold Linux builds. Run `npm ci` again before using that checkout from Windows.
- If the owner changes the 2b stopping rule or the probe aim, the change sits in `apps/web/src/area/under.ts` and the probe effect in `apps/web/src/viewer/RegionModel.tsx`, each with a unit test.
