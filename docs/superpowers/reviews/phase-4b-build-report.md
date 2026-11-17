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
  - **No longer true for spinalis** (marked in the second review fixes): Fix 2 of the review fixes moved spinalis to the neck, where it is layer 3 (2 percent free). Iliocostalis lumborum is still layer 1 in the trunk (30 percent).

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

## Second review fixes

Built on 2026-11-16 in the Linux clone, on the working branch, from the owner's prompt with three fixes and four decisions. The baseline of the build rules was green before any change. Each code change was written test first. No name, id or side was typed into a generated file. `models/hip.glb`, `models/hip-z-anatomy.glb`, `pipeline/assets/regions/hip.json` and `pipeline/assets/build_region_blender.py` are unchanged (`git diff 65ba61a HEAD` on them is empty). The saved Phase 4a patch was not touched and still applies (`git apply --check`).

The owner's decisions for this run:

- Fix 1 uses option (b): the side check corrects and prints only records that a pattern of a target list in `pipeline/assets/regions/` matches.
- The cap overrun of the four trunk meshes is accepted for now.
- The Latin names stay as they are.
- The doubled hyoid is documented, not fixed.

| Fix | Commit | State |
| --- | --- | --- |
| A The side of flexor pollicis brevis (Fix 1 of the first review) | `a7c73bb` | done |
| B Tests (App, region_of) | `1fda6db` | done, with two tests that could not be written (see below) |
| C Docs, this report and the progress file | the commit of this section | done |

### Fix A: the side of flexor pollicis brevis

`~/build/research/phase4b-fix1-wip.patch` applied cleanly. Then `side_by_position(record, centre_x, patterns)` gets a third argument: the patterns of every target in `pipeline/assets/regions/*.json`, read by the new `target_patterns(regions_dir)` and compiled as `match_targets` compiles them (case-insensitive, matched against the name without a ".l" or ".r" suffix). A record that no pattern matches is returned as it is and not printed. The print moved from `build_records` into `side_by_position`, so the test can see it.

Tests in `pipeline/assets/tests/test_bp3d_inventory.py`:

- `test_side_by_position`: a matched left on the right and a matched right on the left are corrected, and exactly these two lines are printed. An agreeing and an unsided record stay. The agreeing record is now "right flexor pollicis brevis" (it was "superficial head of right flexor pollicis brevis"), so that the test's patterns match it and the agreeing case is really about the side.
- `test_side_by_position_leaves_a_record_no_target_matches`: "cavity of right ventricle" at x = +30 mm is returned as the same object and nothing is printed.
- `test_target_patterns`: two target files in a temporary folder give their three patterns, case-insensitive.

Seen failing first: the import of `target_patterns` failed, then, with the new argument but no filter yet, the unmatched test failed with the heart record corrected to "l" and printed.

The inventory run printed exactly two lines:

```
side corrected: FJ1469 'left flexor pollicis brevis' is named l but lies at x = -279 mm, side set to r
side corrected: FJ1469M 'right flexor pollicis brevis' is named r but lies at x = 279 mm, side set to l
wrote 2234 records to .../sources/bp3d-inventory.jsonl
```

A diff with a copy made before the run shows only these two records changed, only in `side`. `sources/bp3d-inventory.jsonl` is not tracked in git, so this change lives in the Linux clone, and a rebuild of `arm.glb` anywhere else needs the inventory run first.

The check-models test, in `pipeline/data/test/checkModels.test.ts`: "a mesh with side l whose centre lies at x < 0 fails" (exact error object, `femur has side l but lies on the right`) and "a mesh with side l whose centre lies at x > 0 passes". `writeGlb` got an optional x offset for this. With `checkModels.ts` put back to the last commit, the first test failed (`expected true to be false`), with the patch's check both passed. The earlier meshes of the tests span x 0 to 1 with side l, so they lie on their side and no other test changed.

Then:

- `region_gen.py targets`: the five target files did not change (`git status` clean), the dropped list is the same three longus colli parts.
- `arm.glb` rebuilt with `--depths-out sources/arm-depths.json`. The depths file is the same as before (JSON diff empty), the file size is the same (363,016 bytes). Node names, sids and sides are the same, the geometry under the two flexor pollicis brevis nodes swapped: before, "l" had its centre at x = -0.279 m and "r" at +0.279 m, now "l" is at +0.279 m and "r" at -0.279 m. All 144 sided meshes of the new file lie on their side.
- `region_gen.py structures`: no structure file changed. `arm.yaml` was copied into `apps/web/e2e/data/structures/` and was already the same.
- `npm run check-models` passes with the new check on all six regions (seven files, the hip's Z-Anatomy file included). Run once against the old `arm.glb` (then put back) it fails with exactly the two lines `arm.glb flexor-pollicis-brevis.l: flexor-pollicis-brevis has side l but lies on the right` and `arm.glb flexor-pollicis-brevis.r: flexor-pollicis-brevis has side r but lies on the left`.

**Render check (I looked).** With a throwaway copy of `render_check_blender.py` in a temporary folder, nothing committed: the whole arm file front and back with every kind shown, both hands close up, and a view of the bones with only flexor pollicis brevis shown, left yellow, right magenta.
- Whole arm, front and back: both arms from the upper arm to the fingertips, muscles over the bones, small hand muscles to the fingers. Symmetric, nothing floats. The view was centred low, so the top of the upper arms is cut off.
- Hand close-ups: flexor pollicis brevis is covered by the other thenar and flexor muscles, so its colour does not show there.
- Bones and flexor pollicis brevis only: in the front view (the body's left on the right of the picture) the yellow left muscle sits at the base of the thumb of the hand on the right of the picture, the magenta right muscle at the thumb of the hand on the left. In the back view it is mirrored. Each label now names the hand the muscle lies on.

### Fix B: tests

**`setNotice(null)` and `setPrintJob(null)` in `changeRegion`: no test can fail on either line alone.** Each line was removed and `App.test.tsx` was run, then the line was put back. All 38 tests passed both times. Why:

- The notice: `changeRegion` calls `select(null)`, and `select` calls `setNotice(null)` too. With both lines removed (a check of the reason only, put back right after), "switching region closes the search, the layers panel and the print summary and clears the notice" fails.
- The print summary: `changeRegion` always sets the mode to "atlas", and an effect clears the print job whenever the mode is not "notebook". A print job can only start on the Notebook tab, so a region switch with a print summary on screen always leaves the Notebook tab. The summary also needs the bundle, which `changeRegion` sets to null in the same step, so it never shows in between. With the line and that effect removed (put back right after), only "the print summary goes away when the person leaves the Notebook tab" fails.

The prompt says not to bend a test in that case, so no test was added for these two lines. Also found: the region switch test above clicks the Structures tab before it switches region, so its print summary assert is met by leaving the Notebook tab, not by the switch.

**"switching to a region without movements while on the Notebook tab goes to Structures"** in `apps/web/src/App.test.tsx`: opens the Notebook tab, waits for the empty notebook, picks the shoulder, and expects the Structures tab selected and the notebook gone. It passed at once, because the app already does it. To see that it can fail, `setMode("atlas")` in `changeRegion` and the fallback of `shownMode` were both removed (put back right after): it failed, and so did the Movements twin.

**`region_of` and longus colli.** `test_region_of` now asserts `region_of("inferior oblique part of longus colli", set()) == "neck"`. It failed first with `assert 'trunk' == 'neck'`. The neck name rule in `region_of` now has "longus colli" next to "capitis", "cervicis", "cervical" and "platysma". `region_gen.py targets` then changed no target file, and the dropped list is the same three lines.

**One test failure seen once and not reproduced.** Right after the check that broke and restored `App.tsx`, one run of `App.test.tsx` reported `1 failed | 38 passed` without naming the test in the lines I kept. The next run passed, and so did six more runs of the file and three runs of the whole web suite (406 tests each). It is listed under "For the owner".

### Fix C: docs

- `docs/regions/known-gaps.md`: the eleven meshes without a header name each have a mirror "M" file whose header carries the same English name and FMA id as the inventory (checked for all eleven in this session, FJ1543M says "Spinalis" with FMA77179). The spinalis paragraph says so. Under "Head and neck": the hyoid bone is FJ2772 and FJ3201, identical line for line except the File ID, joined into one mesh with 1434 triangles where one copy would give about 718 (bone ratio 0.6 of 1196 faces). The left digastric is FJ1555, FJ1560 and FJ1578, the right one FJ1556 and FJ1579, so FJ1560 has no right counterpart (left mesh 458 triangles, right 413).
- The trunk has 140,296 triangles: corrected in `docs/regions/phone-measurements.md` and in "Waiting for the owner" of `progress.md`.
- The spinalis line under "Layers that may read wrong when peeling" is marked as no longer true. The numbers in the first sections of this report (Summary to "For the owner") are as of the first build and were not changed.

### Deviations (second review fixes)

- The build rules say to use subagent-driven development. These fixes were built in the main session, because each step was small and several needed a line removed, a test run and the line put back in order.

### Checks after the second review fixes

Run on `1fda6db` with the doc changes of Fix C in the working tree, the full list of the build rules, exit 0:

```
data in data is valid                                   (validate)
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
every mesh maps to one of 312 structures                (check-models, with the side check)
 Test Files  39 passed (39)      Tests  406 passed (406)    (apps/web)
 Test Files  8 passed (8)        Tests  139 passed (139)    (pipeline/data)
✓ built in 1.26s                                        (build:review)
✓ built in 981ms                                        (build)
  7 passed (22.6s)                                      (e2e)
apps/web/dist/data: 6 bundle(s), no drafts              (check-no-drafts)
median interactive ms: 2381                             (perf-check, the hip)
ok   decoder download fails: message shown after 997 ms
ok   decoder never answers: message shown after 20677 ms
ok   model file missing: message shown after 974 ms     (error-check)
31 passed in 3.36s                                      (test:py)
```

Perf median: 2381 ms on the hip (the first review fixes measured 2167 ms, the runs vary by a few hundred ms).

### For the owner (second review fixes)

9. **Fix 1 is done** with option (b). `arm.glb` now labels flexor pollicis brevis by the hand it lies on. `~/build/research/phase4b-fix1-wip.patch` is applied, and the list of 72 beside it, `phase4b-fix1-side-corrections.txt`, is no longer needed. Both were left in place, delete them when you like.
10. **The two resets in `changeRegion`.** `setNotice(null)` and `setPrintJob(null)` repeat what `select(null)` and the leave-the-Notebook effect already do, so no test can fail on either line alone and none was added. Keep them as a belt for later changes, or remove them. Either way the behaviour stays.
11. **One unnamed App test failure** was seen once and not reproduced in nine runs after it. If it comes back, the run's full output names the test.
12. **Spinalis** (item 8): BodyParts3D itself names it, in the header of FJ1543M. Whether it is the cervical part is still not checked.

## Third review fixes

Built on 2026-11-16 in the Linux clone, on the working branch, in the main session, from the owner's prompt with five fixes. These fixes add tests and docs only. The baseline of the build rules was green before any change (validate, check-models, 406 web and 139 pipeline tests, build, 7 e2e, no drafts). No app or pipeline code, no generated file (`pipeline/assets/regions/*.json`, `data/structures/*.yaml`), no model file and not `build_region_blender.py` was changed: `git diff f723a8c HEAD` touches only `App.test.tsx`, `checkModels.test.ts`, `validate.test.ts` and `docs/regions/known-gaps.md`, plus this report and the progress file.

The code under test existed already, so each new test passed at once. To show that each can fail, the named line was broken in the working tree, the test file was run, and the line was put back with `git checkout` (the file was clean afterwards and the test passed again). Nothing broken was committed.

| Fix | Commit | What the mutation showed |
| --- | --- | --- |
| 1 loadStructures passes the regions through | `39df281` | `regions: [String(r.region)]` without the `also_in` part: the new test failed with `expected [ 'hip' ] to deeply equal [ 'hip', 'lower-leg' ]`, 1 failed and 54 passed |
| 2 The side check for the right side | `7458de0` | the side "r" branch of `checkModels.ts` removed: "a mesh with side r whose centre lies at x > 0 fails" failed with `expected true to be false`, 1 failed and 25 passed |
| 3 The gap line after the region has loaded | `b975eb7` | `RegionInfo.tsx` rendering `<Hint t={t} />` without the region: the new test failed with `Unable to find an element with the text: Not in the model yet: latissimus dorsi.`, and the old gap line test still passed, as the review said |
| 4 The rest of the address | `05d0140` | `changeRegion` building its params from `new URLSearchParams()`: the new test failed with `expected null to be '1'` |
| 5 `docs/regions/known-gaps.md` | `ac3d263` | docs only, no mutation |
| Report and progress file | the commit of this section | |

### Fix 1: loadStructures

"loadStructures gives each structure its home region first, then also_in" in `pipeline/data/test/validate.test.ts` reads `fx("multi-region")` and expects tibia `["hip", "lower-leg"]` and talus `["lower-leg"]`.

### Fix 2: the side check

In `pipeline/data/test/checkModels.test.ts`: "a mesh with side r whose centre lies at x > 0 fails" (the triangle spans x 2 to 3, exact error object `{ file: "test.glb", path: "(unnamed node)", message: "femur has side r but lies on the left" }`) and "a mesh with side r whose centre lies at x < 0 passes" (x -2 to -1, no errors).

### Fix 3: the gap line after loading

"the gap line of the region stays under the tap hint after the region's data has loaded" in `apps/web/src/App.test.tsx` picks the shoulder, waits until the tabs are exactly Structures and Area (only the shoulder's own data takes the Movements and Notebook tabs away), then expects the tap hint and "Not in the model yet: latissimus dorsi.". The earlier gap line test is kept as it is. It still covers the loading fallback and the region without a gap line.

### Fix 4: the rest of the address

"switching region keeps the rest of the address" in `apps/web/src/App.test.tsx` sets the address to `/?x=1#top` before the render, picks the shoulder, and expects `x=1` and `region=shoulder` in `location.search` and `#top` as `location.hash`. The `afterEach` already puts the address back to `/`. The whole file passed with it (41 tests).

### Fix 5: known gaps

What the searches printed:

- `grep -i "palmaris brevis" sources/bp3d-inventory.jsonl`: nothing (exit 1). Also nothing in the 2234 OBJ headers, in `isa_parts_list_e.txt`, `partof_parts_list_e.txt`, `isa_element_parts.txt` or `partof_element_parts.txt`.
- `grep -i "coccy" sources/bp3d-inventory.jsonl`: nine records, all pelvic floor muscles: FJ1449M, FJ2542 and FJ2547 (coccygeus), FJ1453M, FJ2544 and FJ2549 (iliococcygeus), FJ1457M, FJ2545 and FJ2550 (pubococcygeus). The OBJ headers give the same nine. `isa_parts_list_e.txt` has only coccygeus, iliococcygeus and pubococcygeus and their left and right concepts, no coccyx. The only sacrum mesh is FJ3393 "sacrum".
- Flexor pollicis brevis: `isa_parts_list_e.txt` has "flexor pollicis brevis" (FMA37378, line 1356) and "superficial head of flexor pollicis brevis" (FMA46104, line 1664). The OBJ headers say "Left flexor pollicis brevis" (FJ1469, x -301 to -256 mm), "Right flexor pollicis brevis" (FJ1469M, x 256 to 301 mm), "Superficial head of right flexor pollicis brevis" (FJ1514, x -302 to -260 mm) and "Superficial head of left flexor pollicis brevis" (FJ1514M, x 260 to 302 mm). In `isa_element_parts.txt` FJ1469 is a "muscle organ" and FJ1514 a "head of muscle organ". `data/structures/arm.yaml` has both, as `flexor-pollicis-brevis` and `superficial-head-of-flexor-pollicis-brevis`.

What changed in `docs/regions/known-gaps.md`:

- "Arm and hand": "No gap is known" is gone. Palmaris brevis is listed as having no mesh, with the sources searched. A line says the arm has no gap line in the app, because there is no `regionGap.arm`. The two flexor pollicis brevis structures are listed with their file ids, FMA ids and header names.
- "Trunk": the coccyx is listed as having no mesh, with what "coccy" finds instead.

No `regionGap` text in the language files was changed.

### Checks after the third review fixes

Run on `ac3d263`, the full list of the build rules, exit 0:

```
data in data is valid                                   (validate)
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
every mesh maps to one of 312 structures                (check-models)
 Test Files  39 passed (39)      Tests  408 passed (408)    (apps/web)
 Test Files  8 passed (8)        Tests  142 passed (142)    (pipeline/data)
✓ built in 2.01s                                        (build:review)
✓ built in 1.52s                                        (build)
  7 passed (23.5s)                                      (e2e)
apps/web/dist/data: 6 bundle(s), no drafts              (check-no-drafts)
median interactive ms: 2682                             (perf-check, the hip)
ok   decoder download fails: message shown after 1317 ms
ok   decoder never answers: message shown after 20783 ms
ok   model file missing: message shown after 1012 ms     (error-check)
31 passed in 3.32s                                      (test:py)
```

Perf median: 2682 ms on the hip (2381 ms in the second review fixes, the runs vary by a few hundred ms). No unnamed App test failure came back.

### Deviations (third review fixes)

- None. Every named test could fail on its named line alone.

### For the owner (third review fixes)

13. **A gap line for the arm.** The arm now has a known gap, palmaris brevis, but no `regionGap.arm` text, so the app shows nothing under the tap hint in the arm. Decide whether the arm should get a line such as "Not in the model yet: palmaris brevis." in English and German. The texts were not changed in this run.
14. **The coccyx** has no mesh in BodyParts3D 4.0, so no region has it. Whether the sacrum mesh FJ3393 includes it was not checked. The trunk's gap line does not mention it. Decide whether it should.
