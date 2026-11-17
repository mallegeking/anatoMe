# Phase 2a build report: movement explorer

Plan: `docs/superpowers/plans/2026-11-13-phase-2a-movement-explorer.md`, all tasks (1 to 8).
Built on: `claude/install-superpowers-plugin-v0gy65`, 2026-11-14, in one unattended session.

## Summary

The app now has a row of tabs ("Structures", "Movements"). In the Movements tab a person picks a hip or knee movement, or an exercise phase, and the structures that the checked rows name light up by role (main mover, helper, pinched, stretched), with a slider for the joint angle. Uninvolved muscles and soft tissue are hidden while something lights up, bones stay, and nothing is see-through. Exercises are a new review-gated data kind that the pipeline validates and compiles. Structures can now be hidden one side at a time, the sacrum is marked as midline in the data, and three small Phase 1 leftovers are fixed.

With today's real data (no checked rows) the normal build shows "There is no checked information for this movement yet." and the waiting line, and the model stays whole. Highlighting shows only in tests, in the end-to-end data and in the review build.

## How the build ran

- The Windows checkout under `/mnt/c` was too slow for the web unit tests (jsdom setup took 300 s and the worker timed out). The build ran in a clone of the same branch on the Linux file system (`~/build/anatoMe`), as the Opus prompts page recommends. Commits were pushed from there. The Windows checkout is fast-forwarded at the end of the session.
- The Windows checkout showed every file as changed. The only difference was line endings (CRLF), checked with `git diff --ignore-cr-at-eol` (empty). The files were restored from the index.
- Node 22 was installed in the user's home folder, because WSL had no Linux Node.
- `python3 -m venv` failed (no `ensurepip`, the `python3-venv` package needs sudo). The `.venv` was made with `uv` instead, so `npm run test:py` ran.
- `npx playwright install --with-deps chromium` could not run its sudo part. `npx playwright install chromium` worked and all browser tests ran.
- Each task was built by a fresh implementer agent, then reviewed by a separate reviewer agent against the task text. A final reviewer read the whole plan's diff.

## Commits

First: `7488c46`. Last: `6f1eb01`.

| Task | Commit | State |
| --- | --- | --- |
| 1 Paired flag and hiding one side | `7488c46` | done with deviation |
| 2 Small Phase 1 leftovers | `51f18a7` | done with deviation |
| 3 Exercises as a gated data kind | `c91069d`, fix `f6faa56` | done with deviation |
| 4 Movement logic | `3c2c2f1` | done |
| 5 Highlighting in the viewer | `5d5ca89` | done |
| 6 Mode tabs and the movement panel | `f012f51` | done with deviation |
| 7 Exercises in the review list | `7a0b7ca` | done |
| 8 End-to-end test, phone sheet and docs | `a21ab01` | done |
| Final review fixes | `6f1eb01` | done |

## Deviations

- **Task 1.** `isVisibleOnAnySide` was added to `layers.ts`. `peel`, `revealFor` and the panel's peel button need to know whether any side of a muscle still shows, otherwise hiding one side of a layer's only muscle would make peel skip that layer. Two existing tests ("peel skips a layer whose muscles are all hidden by hand", "peel is off when no visible muscle is left") now hide both sides, because hiding one side no longer empties a layer. The old model check test "a midline mesh has an empty side and passes" used a paired femur with an empty side, which is now an error by design. It was replaced with a sacrum case.
- **Task 2.** The Credits test asserts that two square brackets show (`getAllByText(/\[/).length` is 2), because two credits carry a licence link and `getByText` fails on more than one match. The "no round brackets" assertion is unchanged.
- **Task 3.** The fixture joints have no knee, so the fixture exercises use hip angles. The "other region" compile fixture uses `regions: [elbow]`, which only compile reads. Task 3 has two commits: the review found that the test "a data folder without exercises.yaml passes" read the real `data/` folder and would break once plan 2d adds `data/exercises.yaml`. It now runs on a copy of the valid fixture.
- **Task 3, compile test.** The test "normal mode drops an unchecked exercise and counts it" expects `["bodyweight-squat"]` and not `[]`, because the valid fixture also holds a checked exercise. The unchecked one is still dropped and counted.
- **Task 6.** The exercise view also shows the exercise's own sources (the plan lists sources only for each row). Every claim in the app shows its source, and an exercise is a claim. `review.test.tsx` got the new `onOpenMovement` prop.
- **Task 6, review note.** `MovementPanel` shows the review note on checked rows in the review build, as `InfoPanel` does.
- **Task 6, old bundles.** `normalizeBundle` also fills `movements`, `attachments`, `actions`, `citations` and `pendingByStructure`, not only the three fields this plan adds.
- **Final review fixes.** The phone sheet's example ("from stretched to working") could not happen with the real data and now names what does happen (Main movers to Helpers, with the silent line between). The README heading no longer says "Phase 1" above the new Movements bullet. One App test was added (see Review Focus 1).

## Review Focus

1. **No checked rows in the normal build.** `apps/web/src/App.test.tsx` "with no checked rows a movement says so, shows the waiting line and keeps the model whole", and the added guard test in the same file for "rows exist but none applies at this angle" (highlights stay null, the model stays whole). `apps/web/src/movement/MovementPanel.test.tsx` "a movement with no rows says so and shows no groups" and "a movement with waiting rows shows the waiting line". Also checked by hand in the normal build with Playwright (see Checks).
2. **Range ends and gaps.** `apps/web/src/movement/roles.test.ts` "a pose on the end of a range still applies", "past its range a structure goes silent", "a gap between two measured ranges is silent". `MovementPanel.test.tsx` "moving the slider to 65 puts both deep rotators under the silent heading".
3. **Exercise phase lights the effort muscles.** `roles.test.ts` "lowering into a squat lights the extensors, not the flexors" and "at the bottom of the squat the labrum row applies too". `apps/web/src/movement/state.test.ts` "a movement gives its own query and an exercise phase gives its effort". `MovementPanel.test.tsx` "an exercise shows its phases, the progress slider and the effort note".
4. **Involved structures always show, hiding one side.** `apps/web/src/layers/shown.test.ts` "an involved structure shows even when it is hidden, peeled and its tissue is off" and "uninvolved muscles and soft tissue are hidden, bones stay". `apps/web/src/layers/layers.test.ts` "hiding the left side leaves the right side showing", "revealFor unhides only the side it was asked for", "peel counts a layer as showing while one side of a muscle is still visible".
5. **Old cached bundle.** `apps/web/src/data/useRegionData.test.tsx` "normalizeBundle fills what an old bundle lacks".

## Review fixes

Added on 2026-11-15 after the review. Tests and docs only, no app code changed.

- **Review Focus 4, at app level.** `apps/web/src/App.test.tsx` "choosing a list entry for a hidden structure makes it visible and selects it" now also expects the right piriformis to show after "Hide this" on the left one. Proved by making `hideSelected` in `App.tsx` hide both sides: the test failed on that line. The change was thrown away.
- **Review Focus 5, through `useRegionData`.** `apps/web/src/App.test.tsx` "an old cached bundle without the new fields still opens the Movements tab". It serves a bundle without `exercises`, `pendingByMovement`, `pendingExercises` and without `paired` on every structure, opens the Movements tab and picks "Hip external rotation". Proved by storing the fetched bundle without `normalizeBundle` in `useRegionData.ts`: the test failed. The change was thrown away.
- `docs/phase0/phase1-follow-ups.md` now names the real task in the five "Done" lines (Task 1 or Task 2).

Checks with these fixes, run in the Linux clone on top of `2e41c4f`, all exit 0:

```
npm run validate                  data in data is valid
npm run check-models              region hip: 48909 triangles (budget 150000)
                                  every mesh maps to one of 52 structures
npm test                          web: Test Files 39 passed (39), Tests 372 passed (372)
                                  pipeline: Test Files 8 passed (8), Tests 127 passed (127)
npm run build:review -w apps/web  hip.json (review): 137917 bytes, 64 actions, 63 attachments, 2 exercises
npm run build                     hip.json (normal): 10381 bytes, 0 actions, 0 attachments, 0 exercises
npm run e2e -w apps/web           area, atlas, movement, notebook: 4 passed
node scripts/check-no-drafts.mjs  apps/web/dist/data: 1 bundle(s), no drafts
perf-check                        median interactive ms: 1932
error-check                       decoder download fails: message shown after 1083 ms
                                  decoder never answers: message shown after 20668 ms
                                  model file missing: message shown after 935 ms
npm run test:py                   14 passed
```

Noticed while doing this, not done: on a Windows checkout three print tests in `App.test.tsx` fail before any change. `apps/web/src/notebook/Summary.tsx` and `summary.ts` differ only by case, and Windows does not tell them apart, so `./Summary` loads the wrong file. On Linux and in CI all tests pass. Renaming one of the two files would fix it.

## Follow-ups

Added on 2026-11-15, one commit per item, each test written first and seen to fail before the code. The owner decided every point. Items 1 to 3 belong to plan 2b and are in the "Follow-ups" section of `phase-2b-build-report.md`, with the area sweep (0 untapped-side entries at the front, 60° and 120°) and the new probe miss counts (7, 6 and 4 of 103, before 18, 20 and 16).

**Item 4, a movement keeps the selection (`a536078`).** The effect in `App.tsx` that clears a hidden selection now runs only while no movement highlights are active. A structure hidden by the layers or by "Hide this" still clears the selection. Test: `App.test.tsx` "a movement that hides the selected structure keeps the selection for the way back". It selects rectus femoris, picks "Hip external rotation" (which hides it), goes back to Structures and finds its heading. It failed before the change. The existing hide tests are unchanged and green. This was "Noticed, not done" item 2.

**Item 5, the credit on either side of the licence link (`2d3e07b`).** `withLicence` in `Credits.tsx` fills in `{credit}` before and after `{licence}`. Test: `Credits.test.tsx` "a template with the licence before the credit still fills in the credit" (template `"{licence}: {credit}"`). It failed before (the literal `{credit}` showed). This was "Noticed, not done" item 5.

**Item 6, arrow keys on the mode tabs (`ab8798c`).** Built after reading the tabs pattern of the WAI-ARIA Authoring Practices (the automatic activation example, page last updated 12 August 2025). Left and right arrows select the previous and next tab and move focus to it, wrapping at the ends. Home and End go to the first and the last tab. Only the selected tab has `tabIndex` 0, the others -1. Tests in `ModeBar.test.tsx`: "only the selected tab is in the Tab order", "the right arrow selects and focuses the next tab", "the left arrow selects and focuses the previous tab", "the arrows wrap at the ends", "Home and End go to the first and the last tab". All five failed before. "other keys do nothing" passed before and after. `aria-controls` and `tabpanel` were not added, because the item did not ask for them.

The checks after all six items are in `phase-2b-build-report.md`, "Follow-ups". All exit 0.

Noticed while doing this, not done: one full web test run after item 6 failed once in `App.test.tsx` "show the other side selects that side and turns the camera to it" (the "Show the other side" button was not found). The test passed alone twice and in three more full runs, including the final check run. It looks like a timing flake under load, not caused by these changes.

## Checks

Run on `6f1eb01`, all exit 0.

```
npm run validate                  data in data is valid
npm run check-models              region hip: 48909 triangles (budget 150000)
                                  every mesh maps to one of 52 structures   (52 before the plan too)
npm test                          web: Test Files 23 passed (23), Tests 183 passed (183)
                                  pipeline: Test Files 3 passed (3), Tests 76 passed (76)
npm run build:review -w apps/web  hip.json (review): 114640 bytes, 52 actions, 63 attachments, 0 exercises
npm run build                     hip.json (normal): 8451 bytes, 0 actions, 0 attachments, 0 exercises
npm run e2e -w apps/web           atlas.spec.ts, movement.spec.ts: 2 passed
node scripts/check-no-drafts.mjs  apps/web/dist/data: 1 bundle(s), no drafts
perf-check                        median interactive ms: 2323 (limit 5000)
error-check                       decoder download fails: message shown after 1086 ms
                                  decoder never answers: message shown after 20553 ms
                                  model file missing: message shown after 1000 ms
npm run test:py                   14 passed
```

Playwright look at 360 x 740 (Task 6 Step 5), headless Chromium:

- Review build, "Hip external rotation": piriformis is a main mover from 0 to 45, silent at 50, a helper at 65 and silent at 90. Obturator externus moves between main mover, silent and back the same way. The slider label follows the angle. The uninvolved muscles are hidden, bones stay, involved muscles are coloured.
- Normal build, same movement: no slider, no groups, the "no checked information" line and the waiting line, the whole model in its normal colours.
- Both builds: `scrollWidth` is 360 at every step, the tab row stays on one line with 44 px high buttons, the canvas never sits under the bars or the panel, no console errors.

## Not verified

- Everything on the real phone (Galaxy A23): thumb reach, how precise the slider is under a thumb, stutter while dragging the slider or rotating with colours on, time to interactive on the device. `docs/phase2/phone-measurements.md` holds the checks for the owner.
- Whether the four highlight colours are easy to tell apart on the phone in daylight.
- Screen readers. The tabs use `role="tab"` without arrow-key handling (see below).
- The exercise view with real data. The real data has no exercises until plan 2d. Covered by unit tests and the end-to-end test data only.

## Noticed, not done

- An old cached `hip.json` from before this plan makes the sacrum count as paired (`paired ?? true` in `useRegionData.ts`). Search then selects "Sacrum (left)", the camera does not turn and "Hide this" adds a key no mesh has. Nothing crashes and a reload fixes it. Review Focus 5 only asks for no crash.
- Picking a movement that hides the selected structure clears the selection, and going back to Structures does not bring it back (`App.tsx` deselect effect).
- `movement.none` and `movement.pending` say "this movement" also for an exercise phase.
- The tab row is half a tab pattern: no `aria-controls`, no `tabpanel`, no arrow keys. Either add the keys or use `aria-pressed` buttons.
- `withLicence` in `Credits.tsx` only works when `{credit}` comes before `{licence}` in the template. This matters for a later translation.
- `involved()` runs twice per render (App and the panel). Cheap, but the two could drift.
- Slider ends that are not on the 5 degree grid cannot be reached exactly (the labrum row ends at 112, the slider stops at 110).
- Small test gaps: no compile test for review-mode `pendingExercises`, no `review.empty` test with only exercise drafts, no test of the exercise branch in `check-no-drafts.mjs` (it was checked by hand by putting a draft exercise into a built bundle).
- Materials in `RegionModel.tsx` are never disposed. This was so before the plan as well.

## For the owner

- Run the new phone sheet `docs/phase2/phone-measurements.md` (Movements tab, hiding one side) on the Galaxy A23 in the review build.
- The physio question in that sheet: between two measured angles the app says nothing about a muscle. Is that right, or should the nearest measured role carry across the gap?
- Decision taken by the builder: the exercise view shows the exercise's own sources. One line to remove if you prefer the plan's text.
