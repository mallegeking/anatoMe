# Phase 2b build report: area lookup

Plan: `docs/superpowers/plans/2026-11-13-phase-2b-area-lookup.md`, Tasks 1 to 4 (as corrected on 2026-11-14).
Built on: `claude/install-superpowers-plugin-v0gy65`, 2026-11-14, in two sessions. Task 1 in the first, the order fix and Tasks 2 to 4 in the second.
State: **done.** All four tasks are built and every check passes. Two rules of the plan do not hold up on the real model when it is turned (see "For the owner"). I did not change them, because that changes what the feature does.

## Summary

The app has a third tab, "Area". A tap on the model sends five rays (the tap and four at 14 CSS pixels around it) through every mesh, also the ones the layers hide. `area/under.ts` merges the hits into one list from the surface inwards that stops at the first bone or 0.12 model metres under the first hit. The panel shows each structure with its type, its depth in centimetres and the checked movements that load it, and a white dot marks the spot. The info panel has a new button "See what lies over and under it" that sends the same rays through the middle of the selected structure from the current camera side. `check-models` now prints the size of each model file. The end-to-end test, the phone sheet and the README cover the new tab.

## Commits

First and last: `beddc4b` (Task 1, first session) and `fc2a816`. This session: `dcec48a` to `fc2a816`.

| Task | Commits | State |
| --- | --- | --- |
| 1 The depth list | `beddc4b` | done |
| 1 follow-up: fixed order for equal distances (owner's prompt) | `dcec48a` | done |
| 2 Rays, marker and probe in the viewer | `e562804`, fix `46e78ee` | done with deviation |
| 3 The Area tab | `629b8b6`, fix `6225f74` | done with deviation |
| 4 End-to-end test, phone sheet and docs | `fc2a816` | done with deviation |

Tasks 2 and 3 have two commits each: the plan's commit and one small fix that the task review asked for. History was not rewritten.

How it was built: subagent-driven, one implementer per task, then a review of each task (spec and code quality), a fix round where the review found something, and a final review of the whole range `edb5979..fc2a816`. I did the order fix and the browser checks myself.

## Deviations

1. **Task 1 order (owner's prompt).** `structuresUnder` now sorts by distance, then sid, then side (`""` before `"l"` before `"r"`). New test in `under.test.ts`: "the left and right copy at the same distance come out in the same order, whatever the order of the hits". It failed before the change (the right copy came first when given first).
2. **Task 2, an extra tap-path test (Review Focus 1).** The Review Focus list names a `RegionModel` tap-path test in Task 2, but Task 2's test list had none. Added to `apps/web/src/viewer/Viewer.test.tsx`: "area mode: a drag over the model calls neither onAreaTap nor onSelect", "area mode: a tap on the model calls onAreaTap with the list and never onSelect", "area mode: a tap that misses the model calls onAreaTap(null)", "area mode: a tap on empty canvas calls onAreaTap(null) and a drag over it does not".
3. **Task 2, the probe always reports.** The first build sent `onAreaTap(null)` when the probe's centre ray missed, like a tap. The plan says only a tap does that, and the probe reports `structuresUnder(center, around, probe)` with `through` set. Fixed in `46e78ee`, with the test "area mode: a probe whose rays miss still reports through the probe, not null".
4. **Task 2, small additions.** The new viewer props are optional with "off" defaults, so `Viewer.tsx` did not need a change. `castRays.ts` also exports `pointAlong` (the world point of the nearest centre hit, used for the marker), and `Scene.tsx` exports the type `AreaTap`, which `AreaState` is built from.
5. **Task 3, one extra en.json key.** The muted line under each entry ("Muscle, about 2.5 cm deeper") needs a comma between type and depth. The plan gave no key for it, and all app text, punctuation included, lives in `en.json`. Added `area.typeDepth`: "{type}, {depth}" (`6225f74`).
6. **Task 3, prop names in `PanelArea`.** `PanelArea` already had `onFocusStructure(sid)` for the Movements panel. The area handler is passed as `onFocusAreaStructure(sel)`. No existing prop was renamed.
7. **Task 3, an entry the data does not know.** It still gets the name button (showing the sid) so it can be focused, with no type, depth, movement or waiting line. Focusing it selects it and turns the camera without `revealFor`, because there is no structure to reveal. Test: `AreaPanel.test.tsx` "an entry the bundle does not know shows its sid and nothing else". Today every mesh maps to a known structure, so this does not happen with the real model.
8. **Task 4, the click position.** The plan said to click the middle of the canvas, and to find out why before moving the click if it lands beside the model. It does land beside the model. I checked in a browser at the e2e size (412 x 915): the middle of the canvas falls in the gap between the two thighs, and a click there brings the hint back. The framing has not changed since the first viewer commit `bb7525b` (`fitToBox` over everything loaded, padding 0.05). The cause is the model itself. It holds both legs from the ankles to the top of psoas major, while the plan assumed a model from the pelvis to below the knee (the same wrong assumption as the first size range). The test now clicks the right thigh, placed from the canvas middle in canvas heights (`x = width / 2 - 0.065 * height`, `y = height / 2`), with a comment saying why. With the click in the middle the test fails, with the new position it passes.
9. **Task 4, the hint check.** After "Clear the spot" the test looks for `area.hint` with `page.getByText`, not inside `data-testid="area-panel"`, because the panel shows the hint as a plain line outside that element. The assertion is the plan's ("expect `area.hint`"), not a looser one.
10. **Task 4, phone sheet numbering.** The new section is "6. Area tab". The old sections 6 and 7 are now 7 and 8. Nothing in the repo refers to those numbers. The physio question is in the new section and in "Questions for the physio".

## Review Focus

1. **A drag in the Area tab is not a tap, a tap on empty space clears the list.** `Viewer.test.tsx` the four "area mode" tests in Deviation 2. `App.test.tsx` "a tap in the Area tab shows the list and a missed tap brings the hint back". Also seen in a browser (see Checks).
2. **A ray that leaves one thigh must not list the other leg.** `under.test.ts` "without a bone the list stops 0.12 under the surface" and "a far bone does not lift the depth limit". **These pass, but on the real model the rule does not hold when the model is turned.** See "For the owner", item 1.
3. **A hidden or peeled structure is still listed, and choosing it shows it again.** `castRays.test.ts` "a mesh that is switched off is still hit". `App.test.tsx` "choosing a list entry for a hidden structure makes it visible and selects it". In a browser, the list was the same after peeling two layers.
4. **With no checked rows an entry shows name, type, depth, the waiting line and no empty heading.** `AreaPanel.test.tsx` "a structure with waiting rows shows the waiting line and no empty heading", "lists the entries in order with side, type and depth" and "a bone has no movement heading".
5. **A tap that only the outer rays hit gives an empty list.** `under.test.ts` "an empty centre ray gives nothing, even when outer rays hit". `castRays.test.ts` "a tap beside everything gives empty rays". `Viewer.test.tsx` "area mode: a tap that misses the model calls onAreaTap(null)".

## Checks

Run on `fc2a816`, all exit 0.

```
npm run validate                  data in data is valid
npm run check-models              hip.glb: 65 meshes, 43378 triangles, 234348 bytes, size 0.325 x 1.124 x 0.173
                                  hip-z-anatomy.glb: 38 meshes, 5531 triangles, 54824 bytes, size 0.288 x 0.579 x 0.136
                                  every mesh maps to one of 52 structures
npm test                          web: Tests 219 passed (219)
                                  pipeline: Tests 99 passed (99)
npm run build:review -w apps/web  hip.json (review): 136010 bytes, 64 actions, 63 attachments, 2 exercises
npm run build                     hip.json (normal): 8550 bytes, 0 actions, 0 attachments, 0 exercises
npm run e2e -w apps/web           3 passed (9.9s)
node scripts/check-no-drafts.mjs  apps/web/dist/data: 1 bundle(s), no drafts
perf-check                        median interactive ms: 2199 (limit 5000)
error-check                       ok decoder download fails: message shown after 956 ms
                                  ok decoder never answers: message shown after 20782 ms
                                  ok model file missing: message shown after 1034 ms
npm run test:py                   14 passed in 3.25s
```

Task 2 Step 4: the largest size number of `hip.glb` is 1.124, inside 0.8 to 1.4. `CAP_M`, `BEHIND_TARGET_M` and the marker radius were not changed.

Task 3 Step 5, in the review build at 360 x 740 in headless Chromium (not a phone):

- Tapping the front of the right hip lists Sartorius, Iliacus, Tensor fasciae latae, Rectus femoris and Hip bone, all on the right side. It starts at a muscle and ends at a bone.
- After peeling two layers the same tap gives the same list.
- A drag to rotate leaves the list alone.
- A tap beside the model brings the hint back.
- There were no console errors and no horizontal scroll.
- The white dot is there but very small (see "Not verified").

Three.js stays out of the main bundle. `App` and `AreaPanel` import only types from the viewer code.

## Not verified

- **Anything on the phone.** Touch, the fingertip size, the frame rate while rotating with the Area tab open, and whether the white dot can be seen. The phone sheet has a new section 6 for this.
- **The size of the white dot.** With radius 0.006 model metres it is about 2 CSS pixels wide at the default framing. I saw it only in an eightfold enlarged screenshot. On the phone it may be too small to notice until you zoom in. The radius is one of the constants the plan ties to metres, so I did not change it.
- **Whether the order under the hip and the buttock looks right to a physio.** That question is in the phone sheet.
- **Screen readers.** Not tried.

## Noticed, not done

- **The canvas shrinks when the list shows.** At 360 x 740 it goes from 441 to 244 pixels tall, because the panel grows (up to its existing maximum height). The model shrinks with it, so the tapped spot moves on screen after the first tap. And because the fingertip is a fixed 14 CSS pixels, the same body spot can list slightly different structures at the smaller size. The info panel already behaves the same way.
- **A probe whose rays miss everything** shows the "Over and under" heading above an empty list. It did not happen in the final review's sweep, but there is no line that explains it.
- **Depth is measured along the line of sight.** When the model is turned, "about N cm deeper" is more than the real depth under the skin. Only the probe heading says "seen from here".
- **The area panel has no `aria-live`**, so a screen reader does not announce a new list. The atlas hint has it.
- **The name buttons in the list** are at least 32 pixels tall. That is taller than the other link buttons in the app but less than the usual 44.
- **The README** still says the app covers "the thigh down to the knee". The model runs to the ankle.
- **The e2e click offset** (0.065 canvas heights) fits today's framing. If the framing changes, a miss will show up as "no heading", not as "click missed".
- Small code points from the task reviews, none needed for merge: `pointAlong` builds a second `Raycaster`, `Viewer.test.tsx` builds a second camera next to the mocked one, there is no App test for focusing an unknown sid, and some `AreaPanel` test selectors could be simpler.
- Prettier flags 61 existing files. It is not enforced in this repo, so nothing was reformatted.

## For the owner

1. **The other leg shows up when the model is turned (Review Focus 2).** The final review ran the real `castFingerRays` and `structuresUnder` code against the real model files over a grid of taps, and I re-ran it. Share of taps that list a structure of the other side 3 cm or more under the surface: front view 14 of 768, turned 60° 93 of 573, turned 120° 121 of 599. Some of these are fair taps right on the middle line, but many are not. Example at 120°: biceps femoris, semitendinosus and adductor magnus of the left leg, then semitendinosus of the right leg "about 8 cm deeper". There are two causes:
   - The 0.12 m limit is longer than the gap between the thighs when the model is turned.
   - Only a bone on the centre ray stops the list. A femur that only an outer ray hits is listed but does not stop it. Example at 60°: femur (left) at the surface, then four more left structures, then gracilis and sartorius of the right leg at 11 cm.

   The final review suggests stopping the list at the first centre hit of the opposite side (structures on the middle line do not count), and letting a bone on any ray stop it. That changes design decision 3 of the plan, so I left it. Decide whether to change the rule, then it is a small change in `under.ts` with a unit test.
2. **"See what lies over and under it" often misses its own structure.** The rays go through the middle of the structure's bounding box, which for a curved or thin structure is often not on the structure. From the front, the back and the side, 18, 20 and 16 of 103 structures are not hit at all. Gracilis, the hip ligaments, the labrum and several knee ligaments are among them. The list then falls back to the normal rule under a heading that names the structure. Aiming at the point of the structure nearest to the box middle cuts the misses to 6, 5 and 4. A line saying "not on this line of sight from here" would cover the rest. That changes design decision 5 and needs a new text, so I left it.
3. **The wording of `area.note`.** It is the plan's exact text: "This lists what the model has under the spot. It does not say what causes a symptom." It keeps rule 4 (no pain wording), but it puts the word "symptom" under every list. Section 5 of `docs/phase2/medical-device-wording.md` suggests banning that word in notebook text and says every public text counts. Decide whether to keep it or use something neutral, for example "It shows general anatomy, the same for everyone."
4. **The white dot is about 2 CSS pixels wide.** Check it on the phone (phone sheet, section 6). If it is too small, decide a new radius or a size that follows the camera distance.
5. **Run section 6 of `docs/phase2/phone-measurements.md`** on the phone in the review build, and ask the physio its question about the order under the front of the hip and under the buttock.
