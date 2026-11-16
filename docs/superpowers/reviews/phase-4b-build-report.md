# Phase 4b whole body meshes: build report

Plan: `docs/superpowers/plans/2026-11-15-phase-4b-whole-body-meshes.md`, Tasks 1 to 5.
Spec: `docs/superpowers/specs/2026-11-15-whole-body-meshes-design.md`.
Built on 2026-11-16 on the working branch `claude/install-superpowers-plugin-v0gy65`, in the Linux clone, with subagent-driven development: one implementer per task, a task review after each, and a final review of the whole range on the strongest model. The owner was away for the whole run.

## Summary

The model now has six regions behind the picker: the hip as before, and the lower leg and foot, the shoulder, the arm and hand, the head and neck, and the trunk, all from BodyParts3D. A generator (`pipeline/assets/region_gen.py`) writes each region's target list and its `data/structures/<region>.yaml` from the BodyParts3D part lists, so no name was typed by hand. The Blender build got a per-mesh triangle cap and a measurement of each muscle's layer by rays from its surface. The app shows only the Structures and Area tabs in a region without movements, resets itself on a region switch, and shows one gap line per region. The hip files are byte-identical, and in `hip.yaml` only the six `also_in` lists and one header line were added.

## Commits

First: `c29f7f5`. Last: `dfb7586` (the report and progress commit follows it).

| Task | Commits | State |
| --- | --- | --- |
| 1 Data rules for more than one region | `c29f7f5` | done with deviation |
| 2 The app with more than one region | `3af0dc8`, `28a1609` (review fix) | done with deviation |
| 3 The generator, the triangle cap and the layer measurement | `731bdfb`, `0b07e21` (review fix) | done with deviation |
| 4 Build the five regions | `aecfe97` | done with deviation |
| 5 Two-region test and the docs | `b9f5746` | done with deviation |
| Final review fixes | `fa46ff1`, `dfb7586` | done |

Two tasks have two commits, because the task review found something and the build rules do not allow rewriting a commit. The second commit of each says what it fixes.

## Deviations

- **Task 1, check message.** "femur belongs to hip, not to lower-leg" is as the plan says. For a structure that is in more than one region, the message lists all of them joined with "and". The new check-models test expects the node path `(unnamed node)`, because the existing test helper writes nodes without a name. Every test fixture `joints.yaml` got `region: hip`, because the field is now required.
- **Task 2, search text.** The plan's region switch closes the search list. It now also empties the search field (`ui/TopBar.tsx`), because the Task 5 end-to-end test expects an empty field after switching back to the hip. Test: `App.test.tsx` "switching region empties the search field".
- **Task 2, tab state.** Besides "show and set Structures", the shown tab is passed to the mode bar, the panel and the viewer, so no frame shows a tab that is gone.
- **Task 3, test fixtures.** Rule 7 stops the script when a context bone does not exist. The plan's fixtures for `test_build_targets_sides_and_hip` and `test_build_targets_patterns_are_exact` list only a few records, which would hit that stop for the shoulder, neck and trunk. The fixtures therefore also hold one bone record per context bone the hip does not own, generated in the test from `CONTEXT`. The plan's asserts are unchanged and rule 7 stays strict.
- **Task 3, classes.** `classes_of` is keyed by the mesh id (the element file id), and a group's classes are the union over its records. The plan leaves the key open. With it the counts match the planner's exactly.
- **Task 3, layer samples.** The plan says "up to 300 vertices at an even stride (`step = max(1, len(vertices) // 300)`)". Taken literally with a cut at 300, a mesh with 300 to 599 vertices is sampled on its first 300 vertices only. The build takes `k = min(n, 300)` vertices at indices `i * n // k`, which spreads them over the whole mesh. It is the same as the literal formula when `n` is a multiple of 300.
- **Task 3, the Z-Anatomy path.** The first version also passed the cap on the Z-Anatomy path, which broke `git apply --check` of the saved Phase 4a patch. It was put back (`0b07e21`). The patch's part for `build_region_blender.py` now applies with offsets only, checked on a copy, the patch itself untouched.
- **Task 4, the cap is not reached for four meshes.** Review Focus 4 says a huge muscle must come out at or under the cap of 2000 faces. In `trunk.glb` it does not for: innermost intercostal 7105, external intercostal 6736, internal intercostal 5615, right external oblique 2019 (the left one is 2000). The ratio the build asks for is right (`test_decimate_ratio`). Blender's decimate stops above it, for the intercostals most likely because each is many separate strips and two source files joined into one. A second decimate pass would be a third change to `build_region_blender.py`, which the plan limits to two. The spec's goal, every region under 150,000 triangles, holds: the trunk has 140,629. Accepted and left for the owner (see "For the owner"). The docstring of `clean_and_decimate` now says the cap is a target, not a guarantee.
- **Task 4, eleven paired muscles are one structure each.** BodyParts3D stores some muscles as one file plus a mirrored "M" file, neither with a side word. The plan's rule makes such a group one midline structure and the build joins both files into one mesh, which the plan calls right for the intercostals (Review Focus 3). It applies to eleven structures: the three intercostals, lateral and medial lumbar intertransversarius, interspinales lumborum, spinalis and the thoracic rotator in the trunk, and the three cervical sets in the neck. Tapping one of them selects both sides. The plan's counts build this in, so it was kept and written into `docs/regions/known-gaps.md`.
- **Task 5, known gaps page.** Besides the plan's list, the page names the eleven meshes without a header name, the joined pairs above, the dropped longus colli, that the Latin names were not checked one by one, and the cap overrun. `ATTRIBUTION.md` lists model files by name, so it got rows for the five new files (the plan allows this).
- **Final review, Latin names.** Four Latin terms in `TA2.csv` have typos: "Os primum metarcapi" (first metacarpal), "Os quatum metatarsi" (fourth metatarsal), "Caput mediale musculi tricipitis caput brachii" (medial head of triceps) and "Flexor superficialis digitorum superficialis". The prompt says to fix the generator rule when its output looks wrong. `region_gen.py` now skips these four TA2 rows by id (`TA2_TYPO_IDS`, test `test_latin_skips_rows_with_typos`), and the structure files were generated again. Those four structures have no Latin name now. Latin is found for 145 of 260, not the planner's 149. No corrected name was typed in.

## Per region

From the build (Task 4) and `npm run check-models`. "Own" means the region is the home of the structure. Meshes in the file include the borrowed bones.

| Region | Own structures | Own meshes in the target list | Borrowed bones | Meshes in the file | Triangles | File size | Latin names |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lower-leg | 60 | 120 | 4 | 128 | 44,294 | 329,168 bytes | 33 of 60 |
| shoulder | 23 | 46 | 33 | 91 | 109,449 | 483,232 bytes | 19 of 23 |
| arm | 70 | 140 | 2 | 144 | 45,227 | 363,016 bytes | 38 of 70 |
| neck | 53 | 89 | 11 | 104 | 90,349 | 491,788 bytes | 31 of 53 |
| trunk | 54 | 79 | 3 | 83 | 140,629 | 727,632 bytes | 24 of 54 |

All own-structure and mesh counts are the planner's. FMA ids were found for 259 of 260. Infraspinatus was the one without: the part lists have it as "infraspinatus" (FMA32546), and the lookup asked for "infraspinatus muscle". Fixed in the review fixes, now 260 of 260.

`check-models` lines for all files:

```
hip.glb: 65 meshes, 43378 triangles, 234348 bytes, size 0.325 x 1.124 x 0.173
hip-z-anatomy.glb: 38 meshes, 5531 triangles, 54824 bytes, size 0.288 x 0.579 x 0.136
lower-leg.glb: 128 meshes, 44294 triangles, 329168 bytes, size 0.339 x 0.907 x 0.230
shoulder.glb: 91 meshes, 109449 triangles, 483232 bytes, size 0.482 x 0.499 x 0.244
arm.glb: 144 meshes, 45227 triangles, 363016 bytes, size 0.648 x 0.697 x 0.201
neck.glb: 104 meshes, 90349 triangles, 491788 bytes, size 0.333 x 0.452 x 0.209
trunk.glb: 83 meshes, 140629 triangles, 727632 bytes, size 0.289 x 0.684 x 0.229
region hip: 48909 triangles (budget 150000)
region lower-leg: 44294 triangles (budget 150000)
region shoulder: 109449 triangles (budget 150000)
region arm: 45227 triangles (budget 150000)
region neck: 90349 triangles (budget 150000)
region trunk: 140629 triangles (budget 150000)
every mesh maps to one of 312 structures
```

## The generator's dropped list

```
dropped 3:
  inferior oblique part of longus colli: only one side (FJ1557)
  superior oblique part of longus colli: only one side (FJ1600)
  vertical intermediate part of longus colli: only one side (FJ1601)
```

Exactly the three parts the plan expects, and nothing else.

## Layers

The gate of Task 4 Step 3 passed, 7 of 7, so the measured layers are in the data and the flat-depth fallback was not needed.

| Gate line | Measured free | Depth | Result |
| --- | --- | --- | --- |
| lower-leg tibialis-anterior is 1 | 0.31 | 1 | pass |
| lower-leg medial-head-of-gastrocnemius is 1 | 0.28 | 1 | pass |
| shoulder acromial-part-of-deltoid is 1 | 0.38 | 1 | pass |
| shoulder descending-part-of-trapezius is 1 | 0.60 | 1 | pass |
| lower-leg soleus is 2 or 3 | 0.17 | 2 | pass |
| shoulder supraspinatus is 2 or 3 | 0.00 | 3 | pass |
| arm supinator is 2 or 3 | 0.00 | 3 | pass |

The table of Task 4 Step 3, with the measured `free` next to the planner's (the planner measured before decimation):

| Region | Structure | Planner's free | Measured free | Expected depth | Measured depth |
| --- | --- | --- | --- | --- | --- |
| lower-leg | tibialis-anterior | 0.40 | 0.31 | 1 | 1 |
| lower-leg | medial-head-of-gastrocnemius | 0.34 | 0.28 | 1 | 1 |
| lower-leg | fibularis-longus | 0.30 | 0.24 | 1 | 1 |
| lower-leg | tibialis-posterior | 0.15 | 0.05 | 2 | 2 |
| lower-leg | soleus | 0.06 | 0.17 | 2 | 2 |
| lower-leg | popliteus | 0.04 | 0.06 | 3 | **2** |
| shoulder | descending-part-of-trapezius | 0.50 | 0.60 | 1 | 1 |
| shoulder | acromial-part-of-deltoid | 0.34 | 0.38 | 1 | 1 |
| shoulder | spinal-part-of-deltoid | 0.22 | 0.12 | 1 | **2** |
| shoulder | levator-scapulae | 0.17 | 0.18 | 2 | 2 |
| shoulder | rhomboid-major | 0.09 | 0.05 | 2 | 2 |
| shoulder | pectoralis-minor | 0.02 | 0.01 | 3 | 3 |
| shoulder | supraspinatus | 0.00 | 0.00 | 3 | 3 |
| arm | brachioradialis | 0.49 | 0.64 | 1 | 1 |
| arm | long-head-of-biceps-brachii | 0.28 | 0.37 | 1 | 1 |
| arm | brachialis | 0.18 | 0.20 | 2 | **1** |
| arm | flexor-digitorum-superficialis | 0.17 | 0.19 | 2 | 2 |
| arm | pronator-quadratus | 0.15 | 0.07 | 2 | 2 |
| arm | supinator | 0.01 | 0.00 | 3 | 3 |

Three rows differ from the expected depth (bold). Brachialis sits exactly on the 0.20 line.

### Every soft part of the neck (31)

| Structure | free | depth |
| --- | --- | --- |
| cervical-rotator | 0.00 | 3 |
| digastric | 0.06 | 2 |
| geniohyoid | 0.02 | 3 |
| iliocostalis-cervicis | 0.30 | 1 |
| longissimus-capitis | 0.03 | 3 |
| longissimus-cervicis | 0.08 | 2 |
| longus-capitis | 0.05 | 2 |
| mylohyoid | 0.00 | 3 |
| obliquus-capitis-inferior | 0.09 | 2 |
| obliquus-capitis-superior | 0.07 | 2 |
| omohyoid | 0.30 | 1 |
| platysma | 0.57 | 1 |
| rectus-capitis-anterior | 0.01 | 3 |
| rectus-capitis-lateralis | 0.00 | 3 |
| rectus-capitis-posterior-major | 0.20 | 1 |
| rectus-capitis-posterior-minor | 0.10 | 2 |
| scalenus-anterior | 0.05 | 2 |
| scalenus-medius | 0.04 | 3 |
| scalenus-posterior | 0.21 | 1 |
| semispinalis-capitis | 0.02 | 3 |
| semispinalis-cervicis | 0.01 | 3 |
| set-of-anterior-cervical-intertransversarii | 0.00 | 3 |
| set-of-interspinales-cervicis | 0.03 | 3 |
| set-of-posterior-cervical-intertransversarii | 0.00 | 3 |
| splenius-capitis | 0.32 | 1 |
| splenius-cervicis | 0.22 | 1 |
| sternocleidomastoid | 0.17 | 2 |
| sternohyoid | 0.05 | 2 |
| sternothyroid | 0.06 | 2 |
| stylohyoid | 0.02 | 3 |
| thyrohyoid | 0.01 | 3 |

### Every soft part of the trunk (22)

| Structure | free | depth |
| --- | --- | --- |
| diaphragm | 0.24 | 1 |
| external-intercostal | 0.28 | 1 |
| external-oblique | 0.53 | 1 |
| iliocostalis-lumborum | 0.30 | 1 |
| iliocostalis-thoracis | 0.17 | 2 |
| innermost-intercostal | 0.01 | 3 |
| internal-intercostal | 0.10 | 2 |
| interspinalis-thoracis | 0.08 | 2 |
| lateral-lumbar-intertransversarius | 0.00 | 3 |
| longissimus-thoracis | 0.16 | 2 |
| lumbar-rotator | 0.01 | 3 |
| medial-lumbar-intertransversarius | 0.02 | 3 |
| semispinalis-thoracis | 0.19 | 2 |
| serratus-posterior-inferior | 0.23 | 1 |
| serratus-posterior-superior | 0.53 | 1 |
| set-of-interspinales-lumborum | 0.00 | 3 |
| set-of-levatores-costarum-breves | 0.02 | 3 |
| set-of-levatores-costarum-longi | 0.03 | 3 |
| spinalis | 0.57 | 1 |
| spinalis-thoracis | 0.23 | 1 |
| thoracic-rotator | 0.11 | 2 |
| transversus-thoracis | 0.11 | 2 |

### Layers that may read wrong when peeling

The rule measures what the model shows, and some muscles are missing or sit in another region's file. These come out in an order a textbook would not give. They are listed on the phone sheet (`docs/regions/phone-measurements.md`) to look at while peeling.

- Lower leg: flexor digitorum longus is layer 1 (21 percent free) while soleus, which covers it, is layer 2 (17 percent).
- Arm: flexor digitorum profundus is layer 1 (21 percent) while flexor digitorum superficialis is layer 2 (19 percent). Opponens pollicis is layer 1 (70 percent). Brachialis is layer 1 on the 0.20 line.
- Neck: sternocleidomastoid is layer 2, because the platysma covers it in the model.
- Trunk: the diaphragm is layer 1, because nothing covers its underside in this file. Spinalis (57 percent) and iliocostalis lumborum come out layer 1, because the trapezius sits in the shoulder file and latissimus dorsi is in no file.

## Review Focus

1. **A mesh filed under a region its structure does not belong to.** `pipeline/data/test/checkModels.test.ts` "a mesh must sit in a region its structure belongs to" (exact error object) and "a mesh in an also_in region passes". Also `compile.test.ts` "a structure is in its home region and in every also_in region" and `validate.test.ts` "also_in must name a region some structure has as its home", "also_in must not repeat the home region".
2. **Switching to a region without movements while on Movements or Notebook.** `apps/web/src/App.test.tsx` "switching to a region without movements while on the Movements tab goes to Structures", "a region without movements shows only the Structures and Area tabs", "switching region closes the search, the layers panel and the print summary and clears the notice". End to end: `apps/web/e2e/regions.spec.ts` "the picker switches to the shoulder and back".
3. **One side only (longus colli) and two meshes without a side word (intercostals).** `pipeline/assets/tests/test_region_gen.py` `test_build_targets_sides_and_hip` (longus colli in the dropped list, external intercostal is one midline target). The real run dropped exactly the three longus colli parts.
4. **A huge mesh under the cap, a tiny one not under 120 faces, the hip as before.** `pipeline/assets/tests/test_meshrules.py` `test_decimate_ratio`. The hip was rebuilt into a temporary file and `cmp` with `models/hip.glb` found no difference, before and after the change. In the built files the cap does not hold for four trunk meshes, and a few small meshes end at 112 to 119 faces (see Deviations and "Noticed, not done").
5. **A structure without a Latin and a German name.** `apps/web/src/ui/InfoPanel.test.tsx` "a structure without a Latin or German name shows its English name and no Latin line". It passed before any change, so it was kept as a guard.

## Checks

Run on `fa46ff1` (the last commit after it, `dfb7586`, changes one line of `docs/regions/known-gaps.md`, and `node scripts/check-no-drafts.mjs` was run again on it). The full list of the build rules, exit 0:

```
data in data is valid                                   (validate)
region trunk: 140629 triangles (budget 150000)          (check-models, all six regions under budget)
every mesh maps to one of 312 structures
 Test Files  39 passed (39)      Tests  405 passed (405)    (apps/web)
 Test Files  8 passed (8)        Tests  137 passed (137)    (pipeline/data)
✓ built in 1.08s                                        (build:review)
✓ built in 995ms                                        (build)
  7 passed (17.1s)                                      (e2e, the four older specs and regions.spec.ts)
apps/web/dist/data: 6 bundle(s), no drafts              (check-no-drafts)
median interactive ms: 1893                             (perf-check, still the hip)
ok   decoder download fails: message shown after 1045 ms
ok   decoder never answers: message shown after 20562 ms
ok   model file missing: message shown after 935 ms     (error-check)
24 passed in 3.49s                                      (test:py)
```

Perf median: 1893 ms on the hip (Task 4 measured 2153 ms and Task 5 2252 ms on the same build, so the runs vary by a few hundred ms).

Before Task 1 the baseline was green. A clean rebuild of the hip gave the committed `hip.glb` byte for byte, so the `cmp` check of Task 3 was meaningful. `git diff ae91758 HEAD -- models/hip.glb models/hip-z-anatomy.glb` is empty.

**Render check (Task 4 Step 8, I looked).** Each region was rendered front and back into a temporary folder, once with `render_check_blender.py` (bones only, with `--focus`) and once with a throwaway script that shows every kind. Nothing was committed.
- Lower leg: both legs with femur and patella as context, tibia, fibula and the whole foot. Tibialis anterior, the extensors and fibulars along the shin, both gastrocnemius heads over soleus, the calcaneal tendon to the heel. Left and right match. Nothing floats.
- Shoulder: clavicle, scapula, humerus with ribs, sternum and vertebrae as context. Deltoid, pectoralis major, serratus anterior in front, the three trapezius parts as one sheet at the back. Symmetric, muscles on the bones.
- Arm: both arms with the scapula as context, every finger bone, muscles over the upper arm and forearm, small hand muscles to the fingers. Symmetric, nothing loose.
- Neck: skull bones, hyoid, atlas to C7 with clavicle, scapula, upper ribs and upper thoracic vertebrae as context. Platysma from the jaw to the clavicles, scalenes, splenius, semispinalis and the suboccipital group. Symmetric, nothing floats.
- Trunk: ribs, sternum, T1 to L5 with hip bone and sacrum as context. Erector spinae, serratus posterior, intercostals, external oblique, the diaphragm as a dome. Symmetric. The external oblique looks faceted, like broken glass, at 2000 faces.

## Not verified

- **The phone.** Nothing was measured on the Galaxy A23. `docs/regions/phone-measurements.md` is the sheet for the owner: time until each region can be turned, stutter, peeling, one free line. The trunk (140,629 triangles, about three times the hip) and the shoulder are the ones to try first.
- **Whether the layers read as sensible when peeling.** The rule was checked only by the seven gate lines and by the tables above, not by eye in the app.
- **Eleven meshes have no name in their OBJ file header**, so their names rest on the inventory's concept pick alone: `FJ1451` external intercostal muscle, `FJ1454` innermost intercostal muscle, `FJ1455` internal intercostal muscle, `FJ1525` thoracic rotator, `FJ1543` spinalis, `FJ1547` lateral lumbar intertransversarius, `FJ1548` medial lumbar intertransversarius, `FJ1549` set of anterior cervical intertransversarii, `FJ1550` set of interspinales lumborum, `FJ1552` set of interspinales cervicis, `FJ1553` set of posterior cervical intertransversarii. Every other in-scope mesh carries its inventory name in the header. The final review noted that "spinalis" sits high (1.33 to 1.44 m) and may be the cervical part.
- **Latin names** come from `TA2.csv` by exact match of the English name and were not checked one by one in the TA2 Viewer, unlike the hip. Four with typos were found by eye and left out (see Deviations). Others may be wrong.
- **The e2e region tests** check tabs, address, search, heading and the gap line, not that the shoulder model draws or that picking works there.

## Noticed, not done

- The cap is not reached for four trunk meshes (see Deviations). A check of the face count after decimation, or a second pass, would make it hold.
- The external oblique looks faceted at 2000 faces. A higher cap for that one mesh is the lever, the trunk has about 9,400 triangles of room.
- A few meshes end slightly under 120 faces (for example the right distal phalanx of the ring finger at 112, the right pisiform at 118). It is the same Blender rounding the hip already has (superior gemellus 119).
- A vertex with a zero normal would count as a free ray in the layer measurement. No sign of it was seen.
- Four English names keep the word "muscle" from BodyParts3D (infraspinatus and the three intercostals). Infraspinatus has an FMA id in the part lists (FMA32546, as "infraspinatus"), which the first lookup missed. The review fixes add it.
- `t("regionGap.hip")` and `t("regionGap.arm")` log "Missing translation key" in development builds on every hint render, because the plan finds a missing gap text by the key coming back.
- While a new region's data loads, four tabs show for a moment before two. Tapping Movements in that moment is harmless.
- Search shows 8 results. In the trunk "thoracic" matches 13 structures, so some vertebrae are only found by typing more, with no hint that there are more.
- The gap line shows only on the Structures tab, not on the Area tab, where a missing latissimus dorsi matters most.
- `validate.ts` does not check design decision 2, that only bones use `also_in`.
- Smaller test points: the validate tests for `unknown region ghost` match the message only, the print summary reset test cannot separate the new reset from leaving the Notebook tab, the dropped-list test checks only that longus colli appears.

## For the owner

1. **The cap overrun.** Four trunk meshes are above the 2000-face cap (intercostals 5,615 to 7,105, right external oblique 2,019). The trunk is still under the 150,000 budget. Decide whether that is fine or whether the build should get a second decimate pass (a third change to `build_region_blender.py`).
2. **Eleven paired muscles are one structure each** (list under Deviations). Tapping one selects both sides. Splitting them into left and right is a later generator rule (a file and its "M" mirror without a side word become a pair).
3. **The layer rule.** It is measured, not sourced, and now also used on the neck and the trunk. Look at the pairs under "Layers that may read wrong when peeling" on the phone and decide whether the rule stays, or whether each muscle should be sourced like the hip.
4. **Latin names** are not checked one by one. Four with typos were left out by a generator rule. Decide whether a check in the TA2 Viewer is wanted before the regions go public.
5. **Run the phone sheet** `docs/regions/phone-measurements.md` for the five new regions, the trunk and shoulder first.
6. **The open points of the design** are unchanged: the region names in the app, whether the left-out groups (eye, larynx, pharynx, palate, tongue, pelvic floor) should come in, and the adductor minimus that the hip has no mesh for.

## For the owner to proofread

The German texts of Task 2, in `apps/web/src/i18n/de.json`:

| Key | German |
| --- | --- |
| `region.lower-leg` | Unterschenkel und Fuß |
| `region.shoulder` | Schulter |
| `region.arm` | Arm und Hand |
| `region.neck` | Kopf und Hals |
| `region.trunk` | Rumpf |
| `regionGap.shoulder` | Noch nicht im Modell: Latissimus dorsi. |
| `regionGap.lower-leg` | Noch nicht im Modell: die Musculi interossei dorsales des Fußes und der Extensor digitorum brevis. |
| `regionGap.neck` | Noch nicht im Modell: die Kaumuskeln, die Gesichtsmuskeln und der Longus colli. |
| `regionGap.trunk` | Noch nicht im Modell: Latissimus dorsi, Quadratus lumborum, Multifidus, die Bauchmuskeln außer dem äußeren schrägen Bauchmuskel, die Rippenknorpel und die Bandscheiben. |

## Review fixes

Built on 2026-11-16 in the Linux clone, on the working branch, from the owner's prompt with four findings of the Phase 4b review. The baseline of the build rules was green before any change. Each fix was written test first. No name, id or side was typed into a generated file. `models/hip.glb`, `models/hip-z-anatomy.glb` and `pipeline/assets/regions/hip.json` are byte-identical (`git diff 40b1022 HEAD` on them is empty). The saved Phase 4a patch was not touched.

| Fix | Commit | State |
| --- | --- | --- |
| 1 A wrong side from BodyParts3D | none | stopped, waiting for the owner |
| 2 "spinalis" belongs to the neck | `a9684c3` | done with deviation |
| 3 The FMA id of infraspinatus | `bc31c54` | done |
| 4 Two more generator tests | `afb2acb` | done |

### Fix 1: stopped

The prompt expects the side check in `bp3d_inventory.py` to correct exactly FJ1469 and FJ1469M, and says to stop and report if any other file is reported. It reported 72 files.

What was done: `bounds_centre_x(path)` reads the centre of the x range from the OBJ header's `Bounds(mm)` line, and `side_by_position(record, centre_x)` gives a sided record the side of its position, keeping the English name. Three tests in the new `pipeline/assets/tests/test_bp3d_inventory.py` (left at x < 0 gets "r", right at x > 0 gets "l", an agreeing and an unsided record unchanged, and the header parsing with and without a `Bounds(mm)` line) failed first and then passed. Every one of the 2,234 OBJ files has a `Bounds(mm)` line. Then the inventory ran and printed 72 `side corrected` lines.

What the 72 are:

- FJ1469 and FJ1469M, flexor pollicis brevis, as the review says. These two are the only ones that any pattern of any target list in `pipeline/assets/regions/` matches, the hip included.
- 70 parts outside every region: the heart (cavity and papillary muscles of the right ventricle, cusps of the aortic and pulmonary valves, many branches of the right and left coronary arteries, the right marginal vein), the liver (branches of the left hepatic artery, the left hepatic duct, the left portal vein and its branches), the brachium of the superior colliculus in the brain, the stomach (right gastric and gastro-epiploic vessels), the left and right ascending lumbar veins, the right fibular vein (FJ2190, at x = +77 mm), the superficial dorsal vein of the penis (x = -0 mm), and three muscles of the pharynx and larynx (the left and right middle pharyngeal constrictor at about 10 mm, the left oblique arytenoid at -1 mm). In most of them "left" or "right" names a part of an organ (the right ventricle, the left hepatic artery), not a side of the body, or the part lies within a few millimetres of the midline.

What it would change: run in memory, the generator gives the same five target lists and the same dropped list from a fully corrected inventory as from the present one. So accepting all 72 would change only `arm.glb` among the built files, as the review expects.

The check-models part was tried on the existing files without committing it: a mesh with side "l" must have the centre of its bounds at x > 0, side "r" at x < 0. It fails on `arm.glb` only, with exactly `flexor-pollicis-brevis has side l but lies on the right` and `flexor-pollicis-brevis has side r but lies on the left`. That also confirms that left is x > 0 in the built files.

Nothing of Fix 1 is committed. `sources/bp3d-inventory.jsonl` was put back byte for byte (`cmp` with a copy made before the run), so `arm.glb` still labels this muscle left on the right hand. The work is saved outside the repo, next to the Phase 4a patch, as `~/build/research/phase4b-fix1-wip.patch` (the inventory change, its test and the check-models check, without a check-models test yet). The 72 lines are saved as `~/build/research/phase4b-fix1-side-corrections.txt`. The patch still applies to the last commit of the review fixes (`git apply --check` passed).

The decision is item 7 of "For the owner" below.

### Fix 2: spinalis in the neck

`region_of` makes the exact name "spinalis" a neck muscle (`test_region_of` asserts `region_of("spinalis", {MUSCLE}) == "neck"` and still `region_of("spinalis thoracis", {MUSCLE}) == "trunk"`, and it failed first). The OBJ headers confirm the review: FJ1543 and FJ1543M reach from 1329 to 1435 mm, spinalis thoracis (FJ1544) ends at 1335 mm, and the seventh cervical vertebra (FJ3172) spans 1365 to 1392 mm. The targets were generated again, `neck.glb` and `trunk.glb` were rebuilt with `--depths-out`, the structures were generated again, and both yaml files were copied into `apps/web/e2e/data/structures/`. `docs/regions/known-gaps.md` now lists spinalis under the neck among the joined pairs and says why it is there. `ATTRIBUTION.md` has the new mesh counts (neck 105, trunk 82).

**Deviation, the mesh counts.** The prompt expects trunk 53 structures and 77 meshes and neck 54 and 91. The generator prints trunk 53 and 78 and neck 54 and 90. The diff of the two target files is the one spinalis target and nothing else. Spinalis is a midline group: its two files, FJ1543 and FJ1543M, have no side word and are joined into one mesh by the build, so the generator counts it as one mesh, as it did in the planner's 79 and 89. The expected values count the two files as two meshes. The structure counts, the other regions and the dropped list are as expected.

### Fix 3: the FMA id of infraspinatus

`fma_for(name, fma)` looks the name up as it is, then without a trailing " muscle", like `latin_for`. Test: `test_fma_lookup` (failed first). FMA ids are now found for 260 of 260. Only the infraspinatus row in `shoulder.yaml` changed (it gets `fma: "FMA32546"`). The e2e copy of `shoulder.yaml` was updated to match.

### Fix 4: two more tests

`test_build_targets_sides_and_hip` also asserts that no neck target has "longus-colli" in its sid. `test_build_targets_drops_a_mixed_group` checks that a group of "left serratus posterior inferior" and an unsided "serratus posterior inferior" is dropped with exactly `serratus posterior inferior: sided and unsided meshes mixed (FJ9000, FJ9001)` and is in no target list. Both pass on the existing code. To see that they can fail, the generator was broken twice on purpose and put back each time: with the reason text changed, the new mixed-group test failed, and with longus colli kept as a neck target while still in the dropped list, only the new neck assert failed.

### Task 1 and cli.ts

Task 1 lists `pipeline/data/src/cli.ts` among its files, but it needed no change and has none. `loadStructures` in `validate.ts` builds each structure's `regions` (home region first, then `also_in`), and `cli.ts` passes the whole map to `checkModelMapping` as it did before.

### Per region after the review fixes

| Region | Own structures | Own meshes in the target list | Borrowed bones | Meshes in the file | Triangles | File size | Latin names |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lower-leg | 60 | 120 | 4 | 128 | 44,294 | 329,168 bytes | 33 of 60 |
| shoulder | 23 | 46 | 33 | 91 | 109,449 | 483,232 bytes | 19 of 23 |
| arm | 70 | 140 | 2 | 144 | 45,227 | 363,016 bytes | 38 of 70 |
| neck | 54 | 90 | 11 | 105 | 90,682 | 495,160 bytes | 31 of 54 |
| trunk | 53 | 78 | 3 | 82 | 140,296 | 724,260 bytes | 24 of 53 |

FMA ids: 260 of 260. Latin: 145 of 260, as before. The dropped list is unchanged (the three parts of longus colli). Only `neck.glb` and `trunk.glb` changed among the model files.

`check-models` lines for all files:

```
hip.glb: 65 meshes, 43378 triangles, 234348 bytes, size 0.325 x 1.124 x 0.173
hip-z-anatomy.glb: 38 meshes, 5531 triangles, 54824 bytes, size 0.288 x 0.579 x 0.136
lower-leg.glb: 128 meshes, 44294 triangles, 329168 bytes, size 0.339 x 0.907 x 0.230
shoulder.glb: 91 meshes, 109449 triangles, 483232 bytes, size 0.482 x 0.499 x 0.244
arm.glb: 144 meshes, 45227 triangles, 363016 bytes, size 0.648 x 0.697 x 0.201
neck.glb: 105 meshes, 90682 triangles, 495160 bytes, size 0.333 x 0.452 x 0.209
trunk.glb: 82 meshes, 140296 triangles, 724260 bytes, size 0.289 x 0.640 x 0.229
region hip: 48909 triangles (budget 150000)
region lower-leg: 44294 triangles (budget 150000)
region shoulder: 109449 triangles (budget 150000)
region arm: 45227 triangles (budget 150000)
region neck: 90682 triangles (budget 150000)
region trunk: 140296 triangles (budget 150000)
every mesh maps to one of 312 structures
```

The trunk is 0.640 m high now, not 0.684 m, because spinalis was its highest part.

### Layers of the neck and the trunk after the rebuild

Spinalis moves from layer 1 in the trunk (57 percent free) to layer 3 in the neck (2 percent free), because in the neck file the semispinalis and splenius cover it. Three other values moved by one or two points with no change of depth, because the rebuilt files changed the shapes the rays meet: set of interspinales cervicis 0.03 to 0.02, splenius capitis 0.32 to 0.31, serratus posterior superior 0.53 to 0.55. So the line about spinalis under "Layers that may read wrong when peeling" no longer holds.

Every soft part of the neck (32):

| Structure | free | depth |
| --- | --- | --- |
| cervical-rotator | 0.00 | 3 |
| digastric | 0.06 | 2 |
| geniohyoid | 0.02 | 3 |
| iliocostalis-cervicis | 0.30 | 1 |
| longissimus-capitis | 0.03 | 3 |
| longissimus-cervicis | 0.08 | 2 |
| longus-capitis | 0.05 | 2 |
| mylohyoid | 0.00 | 3 |
| obliquus-capitis-inferior | 0.09 | 2 |
| obliquus-capitis-superior | 0.07 | 2 |
| omohyoid | 0.30 | 1 |
| platysma | 0.57 | 1 |
| rectus-capitis-anterior | 0.01 | 3 |
| rectus-capitis-lateralis | 0.00 | 3 |
| rectus-capitis-posterior-major | 0.20 | 1 |
| rectus-capitis-posterior-minor | 0.10 | 2 |
| scalenus-anterior | 0.05 | 2 |
| scalenus-medius | 0.04 | 3 |
| scalenus-posterior | 0.21 | 1 |
| semispinalis-capitis | 0.02 | 3 |
| semispinalis-cervicis | 0.01 | 3 |
| set-of-anterior-cervical-intertransversarii | 0.00 | 3 |
| set-of-interspinales-cervicis | 0.02 | 3 |
| set-of-posterior-cervical-intertransversarii | 0.00 | 3 |
| spinalis | 0.02 | 3 |
| splenius-capitis | 0.31 | 1 |
| splenius-cervicis | 0.22 | 1 |
| sternocleidomastoid | 0.17 | 2 |
| sternohyoid | 0.05 | 2 |
| sternothyroid | 0.06 | 2 |
| stylohyoid | 0.02 | 3 |
| thyrohyoid | 0.01 | 3 |

Every soft part of the trunk (21):

| Structure | free | depth |
| --- | --- | --- |
| diaphragm | 0.24 | 1 |
| external-intercostal | 0.28 | 1 |
| external-oblique | 0.53 | 1 |
| iliocostalis-lumborum | 0.30 | 1 |
| iliocostalis-thoracis | 0.17 | 2 |
| innermost-intercostal | 0.01 | 3 |
| internal-intercostal | 0.10 | 2 |
| interspinalis-thoracis | 0.08 | 2 |
| lateral-lumbar-intertransversarius | 0.00 | 3 |
| longissimus-thoracis | 0.16 | 2 |
| lumbar-rotator | 0.01 | 3 |
| medial-lumbar-intertransversarius | 0.02 | 3 |
| semispinalis-thoracis | 0.19 | 2 |
| serratus-posterior-inferior | 0.23 | 1 |
| serratus-posterior-superior | 0.55 | 1 |
| set-of-interspinales-lumborum | 0.00 | 3 |
| set-of-levatores-costarum-breves | 0.02 | 3 |
| set-of-levatores-costarum-longi | 0.03 | 3 |
| spinalis-thoracis | 0.23 | 1 |
| thoracic-rotator | 0.11 | 2 |
| transversus-thoracis | 0.11 | 2 |

### Checks after the review fixes

Run on `afb2acb`, the full list of the build rules, exit 0:

```
data in data is valid                                   (validate)
region trunk: 140296 triangles (budget 150000)          (check-models, all six regions under budget)
every mesh maps to one of 312 structures
 Test Files  39 passed (39)      Tests  405 passed (405)    (apps/web)
 Test Files  8 passed (8)        Tests  137 passed (137)    (pipeline/data)
✓ built in 1.09s                                        (build:review)
✓ built in 1.12s                                        (build)
  7 passed (16.6s)                                      (e2e)
apps/web/dist/data: 6 bundle(s), no drafts              (check-no-drafts)
median interactive ms: 2167                             (perf-check, the hip)
ok   decoder download fails: message shown after 1005 ms
ok   decoder never answers: message shown after 20552 ms
ok   model file missing: message shown after 982 ms     (error-check)
26 passed in 3.58s                                      (test:py)
```

**Render check (Task 4 Step 8, I looked)** for the arm, the neck and the trunk, front and back, into a temporary folder with a throwaway copy of `render_check_blender.py` that shows every kind and colours spinalis yellow. Nothing was committed.
- Arm: not rebuilt, the same file as before. Both arms with the scapula as context, muscles from the shoulder to the fingers, symmetric, nothing floats.
- Neck: from the back, spinalis sits on the cervical spine between the deep neck muscles, partly covered by semispinalis, which fits its new layer 3. Both sides match, nothing floats. The front is unchanged: the platysma from the jaw to the clavicles, the bones of the skull, the hyoid and the upper chest as context.
- Trunk: no part stands above the highest bone any more. The back muscles end at the upper thoracic spine. Erector spinae, serratus posterior and the ribs as before, symmetric. The external oblique still looks faceted.

### For the owner (review fixes)

7. **Fix 1, the side check.** It finds 72 files whose side word disagrees with their position, not 2. Only FJ1469 and FJ1469M are in any region, and with all 72 corrected the target lists stay the same. Choose one: (a) accept the 72 as they are, so the inventory's side means the side of the body the mesh lies on, and only `arm.glb` changes, (b) correct only records that a region's target list matches and print only those, or (c) another rule. Until then `arm.glb` labels flexor pollicis brevis left on the right hand. The prepared work is `~/build/research/phase4b-fix1-wip.patch`. The check-models check and its test go in after the decision, with the rebuild of `arm.glb`.
8. **Spinalis without a name.** Its header has no English name, and it is filed under the neck now because of where it lies. Whether it is the cervical part of spinalis (spinalis cervicis) is not checked.
