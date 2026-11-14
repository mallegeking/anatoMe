# Phase 2b build report: area lookup

Plan: `docs/superpowers/plans/2026-11-13-phase-2b-area-lookup.md`, Tasks 1 to 4.
Built on: `claude/install-superpowers-plugin-v0gy65`, 2026-11-14.
State: **partly done.** Task 1 is done. Task 2 is blocked at its Step 4 (the model scale check). Tasks 3 and 4 were skipped, as the build rules say for the tasks behind a blocked one.

## Summary

Task 1 added the pure depth list (`apps/web/src/area/under.ts`): it merges the hits of the five fingertip rays into one list ordered by distance, stops at the first bone or 0.12 model metres under the first hit, and for "over and under" runs to 0.03 behind the target. Task 2 (the rays in the viewer and the size output in `check-models`) was built up to its Step 4 and then stopped, because the model size is outside the range the plan gives. Nothing of Task 2 was committed. The app has no Area tab yet.

## Commits

First and last: `beddc4b`.

| Task | Commit | State |
| --- | --- | --- |
| 1 The depth list | `beddc4b` | done |
| 2 Rays, marker and probe in the viewer | none | blocked |
| 3 The Area tab | none | skipped |
| 4 End-to-end test, phone sheet and docs | none | skipped |

## Why Task 2 is blocked

Task 2 Step 4 says: "the largest of the three size numbers for `hip.glb` lies between 0.5 and 1.0 (pelvis to below the knee, in metres). If it does not, stop and report". The owner's prompt adds: treat it as blocked and do not tune the depth constants to fit.

`npm run check-models` with the new size output printed:

```
hip.glb             size 0.325 x 1.124 x 0.173
hip-z-anatomy.glb   size 0.288 x 0.579 x 0.136
```

I read the bounds again with `getBounds` from `@gltf-transform/core`, mesh by mesh:

- `hip.glb` runs on the up axis from -0.025 (the lower ends of tibia and fibula) to 1.099 (the upper end of psoas major). Hip bone and iliacus end at 0.958.
- `hip-z-anatomy.glb` runs from 0.331 (the collateral ligaments of the knee) to 0.909 (the inguinal ligament).

My reading, for the owner to judge: the numbers look like real metres for an adult (ankle near 0, top of the pelvis near 0.96, psoas reaching up the lumbar spine to 1.1). The plan's range assumed a model from the pelvis to just below the knee, but the BodyParts3D file holds the whole tibia and fibula down to the ankle and psoas major up to its origin on the spine. If that reading is right, `CAP_M`, `BEHIND_TARGET_M` and the marker radius are in the right unit and only the range in Step 4 needs to change (for example 0.5 to 1.3, or a check on the width of the pelvis instead). I did not change the range or the constants, because that is the owner's decision.

What was built before the stop and then thrown away (`git restore`, `git clean`), as the rules say:

- `apps/web/src/viewer/castRays.ts` with its five tests, all passing. three's `Raycaster` tests only `layers`, not `visible`, so meshes that the layers hide are hit. The test "a mesh that is switched off is still hit" proves it.
- `structureOf` exported from `pick.ts`.
- `modelStats` returning `size`, and `check-models` printing it.

A copy of these changes is kept outside the repo on the build machine (`~/build/scratch/2b-task2-blocked.patch`) so the next session does not have to start from nothing. The viewer changes (area mode, marker, probe) were not started.

One more problem found in the plan text: Task 2's test "modelStats reports the size of the model" expects three positive numbers for "the existing test glb". That test glb is a single flat triangle, so its depth is 0 and the test fails. The assertion was not loosened. The plan needs either a test file with some depth or a test that expects the real size of the flat file.

## Deviations

None in Task 1.

## Review Focus

Only the parts that Task 1 covers:

2. **A ray that leaves one thigh must not list the other leg.** `apps/web/src/area/under.test.ts` "without a bone the list stops 0.12 under the surface" (the right gracilis at 1.3 is left out) and "a far bone does not lift the depth limit".
5. **A tap that only the outer rays hit gives an empty list.** `under.test.ts` "an empty centre ray gives nothing, even when outer rays hit".

Review Focus 1, 3 and 4 belong to Tasks 2 and 3 and are not built.

## Checks

Run on `beddc4b`, all exit 0.

```
npm run validate                  data in data is valid
npm run check-models              every mesh maps to one of 52 structures
npm test                          web: Tests 192 passed (192)
                                  pipeline: Tests 98 passed (98)
npm run build:review -w apps/web  hip.json (review): 114640 bytes, 52 actions, 63 attachments, 0 exercises
npm run build                     hip.json (normal): 8451 bytes, 0 actions, 0 attachments, 0 exercises
npm run e2e -w apps/web           2 passed
node scripts/check-no-drafts.mjs  apps/web/dist/data: 1 bundle(s), no drafts
perf-check                        median interactive ms: 1916 (limit 5000)
error-check                       all three cases show their message
npm run test:py                   14 passed
```

## Not verified

Everything about the Area tab, because it does not exist yet.

## Noticed, not done

- `structuresUnder` compares floating point sums (`surface + 0.12`) with `<=`. No test sits exactly on the limit.
- When the left and right copy of one structure have the same distance, their order depends on the order of the hits.

## For the owner

- **Decide the model scale check of plan 2b Task 2 Step 4.** The model spans 1.124 on its longest axis, from the ankle to the top of psoas major. Either widen the range in the plan (the numbers look like metres to me), or tell the builder what else to check. After that, Task 2 can be built again from its Step 1 (or from the kept patch), then Tasks 3 and 4.
- Fix the plan's size test so it does not expect depth from a flat test file.
