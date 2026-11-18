# anatoMe: the whole body as one view

Date: 2026-11-17
Status: built in an unattended run, waiting for the owner's review
Based on: the build prompt `docs/superpowers/plans/2026-11-17-opus-prompt-whole-body.md`, the main design `docs/superpowers/specs/2026-11-02-anatome-design.md`, the region design `docs/superpowers/specs/2026-11-15-whole-body-meshes-design.md`, the layout design `docs/superpowers/specs/2026-11-16-three-column-layout-design.md` and the entry "Whole body as one model" in `docs/ideas.md`.

Points marked **(builder's call)** were decided by Claude in this run. The owner can overrule any of them.

## 1. What the owner asked for

The region picker gets a seventh entry, "Whole body", that shows all six regions as one model, and the app opens with it. The six regions stay as they are.

The reason is what comes later: bent postures, positions and moving parts of the model by hand only make sense on a whole body. None of that is built now. The one rule this work keeps for it: every structure stays its own mesh with its own structure id and side.

Decisions the owner took before this run (not reopened here):

1. The region id is `body`. Its name is "Whole body" in English and "Ganzer Körper" in German.
2. It is the first entry in `models/manifest.json`, so it is first in the picker and the region the app opens with. `?region=<id>` keeps working for every region, and an unknown id falls back to the first entry.
3. No new geometry is invented. The whole body is made from the same sources with the same build scripts.
4. Each structure is drawn once. A bone that a region borrows through `also_in` is not drawn twice.
5. The whole body's data is the union of the six regions. So it has the Movements and Notebook tabs, because the hip's joints are in it.
6. Search, Layers, Under a spot, the stage controls, the Notebook and both languages work in the whole body as in a region.
7. The phone gate stays: interactive within 5000 ms, checked here with `node apps/web/scripts/perf-check.mjs`.

## 2. What was measured first

All numbers are from this machine on 2026-11-17. perf-check runs Chromium with a 4 times slower CPU, opens the built app 5 times and prints the median. The machine was noisy that day: the hip alone measured between 2255 and 4213 ms across runs, where earlier sessions saw 1700 to 2400 ms. So only numbers from the same round are compared with each other.

### 2.1 Do the regions fit together?

Yes. Two checks:

- **By numbers.** All six regions are built from BodyParts3D in metres with no shift or turn (`build_region_blender.py` imports with scale 0.001 and keeps the source frame). Every bone that two regions both draw was compared: 61 of the 62 copies have exactly the same bounding box (0.0 mm apart). The sacrum is 0.2 mm apart, because the hip draws it with 5953 triangles and the trunk with 2000. The hip's Z-Anatomy file was fitted onto the BodyParts3D hip bones in Phase 1 and stays there.
- **By eye.** The seven files were loaded together in a scratch build and shot from the front, from the right side and from the back. From the front the figure stands as one body: the thighs run into the knees and the lower legs, the trunk into the neck, the shoulders into the arms, and nothing hangs apart or has a different size. From the side the arms hang beside the trunk and the knees and feet line up under the hip. From the back the gluteal muscles, hamstrings, calves and back muscles join up, and the blue iliotibial tract from the hip's Z-Anatomy file runs along the outside of the thigh where it belongs. No gap, no overlap, no wrong scale was seen.

The screenshots are not in the repo (they are renders of the CC BY and CC BY-SA meshes and would bring their licences into `docs/`). They are in `~/build/research/whole-body-screens/` in the Linux home, named `step1a-regions-together-front.png`, `-side.png` and `-back.png`.

### 2.2 Which structures would be drawn twice?

62 structure and side pairs appear in more than one file, all bones:

- hip with lower leg: femur, patella, tibia and fibula, both sides.
- hip with trunk: hip bone (both sides) and sacrum.
- shoulder with neck: atlas, axis, third to sixth cervical vertebrae, clavicle (both sides).
- shoulder with arm: humerus (both sides).
- shoulder with arm and neck: scapula (both sides).
- shoulder with neck and trunk: seventh cervical vertebra, first to sixth thoracic vertebrae, manubrium, first and second ribs (both sides).
- shoulder with trunk: body of sternum, seventh to twelfth thoracic vertebrae, third to twelfth ribs (both sides).

Together they are 120,415 triangles that would be drawn a second or third time. The home regions do not follow one order: the shoulder borrows neck and trunk bones, and the neck borrows the shoulder's clavicle and scapula. So "the first file wins" cannot always pick the home copy.

### 2.3 How heavy is it?

`npm run check-models` before this work: 478,857 triangles over the seven files (hip 48,909, lower leg 44,294, shoulder 109,449, arm 45,227, neck 90,682, trunk 140,296), 2.7 MB, 653 meshes. Without the copies it is 577 meshes and about 358,000 triangles. A region may have 150,000.

### 2.4 How fast is it?

The simplest whole body that can run (approach A below): a `body` entry listing the seven existing files, with the app skipping a structure it has already drawn.

| Opener | Medians in ms, one per round |
| --- | --- |
| hip | 4213, 3851, 2875 |
| whole body from the seven region files | 6803, 9795, 5334 |

The whole body from the region files fails the gate in every round.

## 3. The choice: one lighter file (B)

Two ways were possible:

- **A. Reuse the files.** The `body` entry lists the seven region files and the app skips what it has drawn. No new download, nothing to keep in step.
- **B. One lighter file.** The asset pipeline builds `models/body.glb` from the same sources with stricter caps, each structure once.

The prompt says: take A if it passes and the regions fit, take B if A fails or is close (a median over 4000 ms). **A fails** (5334 to 9795 ms), so this is **B**.

### 3.1 How the caps were set

A prototype `body.glb` was built for several caps and timed in the same rounds as the hip. Each structure appears once, the hip's Z-Anatomy file is reused as it is.

| Body file | BodyParts3D triangles | Size of body.glb | Medians in ms (same rounds as the hip) |
| --- | --- | --- | --- |
| cap 150 for every mesh | 112,199 | 1.32 MB | 3620, 3355 (hip 2255) |
| cap 400 for every mesh | 182,326 | 1.62 MB | 4013, 3688, 3588, 3972, 4115, 4119 |
| cap 600 for every mesh | 220,335 | 1.77 MB | 4162, 3865 |
| cap 800 for every mesh | 248,655 | 1.87 MB | 4550, 4244, 3830, 4352 |
| **bones 1000, other parts 400 (chosen)** | **233,761** | **1.79 MB** | **3944, 4485 (hip 2680, 2831)** |
| bones 800, other parts 300 | 205,178 | 1.68 MB | 4311, 4451 |

What this shows:

- The time does not follow the triangles closely. Going from 249,000 to 182,000 triangles saves only a few hundred ms, and even 112,000 triangles stays near 3500 ms while the hip is at 2255 ms. A CPU profile of one load shows the files are all in after about 1.5 s, and most of the rest is the browser's own work on the 577 separate meshes. Merging meshes would make it faster, but the owner's rule says every structure stays its own mesh, so it is not done.
- A single cap of 400 makes the skull visibly blocky at the top. Bones are few but some are large single meshes (skull, hip bone, scapula, ribs), so they need more triangles than muscles. Bones at 1000 and every other part at 400 cost no measurable time over a single cap of 400 and keep the skull whole.

**Chosen (builder's call): bones decimated to 1000 triangles per mesh, every other part to 400.** It passes the gate in every round (medians 3944 and 4485 ms). It sits around 4000 ms on this noisy machine, about 1.5 times the hip in the same round. The owner measures the real phone, where the hip took 783 ms.

The caps, here and in the table above, are the targets Blender's decimation is asked for, not limits it always reaches. Every bone is at or under 1000. These 17 other meshes in `body.glb` stay above 400 (triangles in the built file):

| Mesh | Triangles |
| --- | --- |
| innermost intercostal (one mesh for both sides) | 7105 |
| external intercostal (one mesh for both sides) | 6736 |
| internal intercostal (one mesh for both sides) | 5615 |
| external oblique, right and left | 2019, 1991 |
| serratus anterior, right and left | 843, 838 |
| thoracic rotator (one mesh for both sides) | 590 |
| iliocostalis lumborum, left and right | 548, 522 |
| longissimus thoracis, right and left | 535, 531 |
| serratus posterior inferior, right and left | 466, 461 |
| platysma, right | 449 |
| ascending part of trapezius, right and left | 443, 432 |

Why: the BodyParts3D files come with their seams unmerged, so one muscle arrives as hundreds or thousands of loose pieces (the external intercostal as 12,674), and Blender's collapse decimation keeps every piece. A second pass gains almost nothing. Merging vertices that lie on top of each other first brings 13 of them to 400 or a few triangles over in a trial. The three intercostals and the thoracic rotator are many separate thin sheets even then (up to 346 pieces), and decimation stops at about 2500, 1600, 1100 and 770 triangles. 400 triangles would leave only slivers for each space between the ribs. Whether to merge first, and what the cap for these sheets should be, waits for the owner. The 240,000 budget holds either way (239,292 now).

### 3.2 What detail is lost

Before (the seven region files) and after (the chosen `body.glb`), the same views, in `~/build/research/whole-body-screens/`:

- `before-region-files-front.png` and `after-bone1000-soft400-front.png`: the whole body from the front. They are hard to tell apart at this size.
- `...-closeup-0.png` (left rectus femoris): the hip's muscles were already light, so the thigh looks the same. The fingers of the hand at the edge of the picture are a little coarser.
- `...-closeup-1.png` (left clavicular part of deltoid): the deltoid looks the same. Pectoralis major beside it shows a few more sharp slivers.
- `...-closeup-2.png` (left sternocleidomastoid): the muscle looks the same. The skull loses most: the row of upper teeth on the skull mesh turns into a jagged band and the lower jaw is slightly faceted.
- `...-closeup-3.png` (medial head of gastrocnemius): about the same.
- `rejected-cap400-front-blocky-skull.png`: why bones got their own cap.

Nothing is dropped: the body file has all 539 BodyParts3D meshes of the six regions, plus the 38 Z-Anatomy meshes of the hip. The regions keep their full detail, so a closer look is one pick away in the region list.

## 4. How the drawn-once rule is kept

With B, the body file is built from a target list that has each structure once, so nothing is drawn twice and the app needs no skipping rule.

- `pipeline/assets/region_gen.py body` writes `pipeline/assets/regions/body.json`: the BodyParts3D targets of the six region files in manifest order (hip, lower leg, shoulder, arm, neck, trunk), each structure id once. If two regions give the same id different patterns, type or name, it stops with an error instead of picking one.
- The hip's Z-Anatomy parts are not rebuilt. The body lists `hip-z-anatomy.glb` as its second file. Those structures have no BodyParts3D target, so they are still drawn once.
- `npm run check-models` checks the whole body on every run:
  - **Once:** no structure and side appears twice in the body's files.
  - **Complete:** every structure and side that any region draws is in the body, and the body draws nothing that no region draws.
  - **In step:** each body mesh lies where the region's copy lies. The centres of their bounding boxes may be at most 10 mm apart. The worst seen after decimation is 4 mm (the diaphragm). A mesh built from a wrong file or moved by mistake would be far over this.

The second copy of every mesh is the cost of B. These three checks are what keeps it in step: rebuilding a region without rebuilding the body, or the other way round, is caught as soon as a mesh is added, removed or moved.

## 5. How the data bundle is built

`npm run build-data` writes `data/body.json` with the other bundles, from the same YAML. Nothing is copied by hand.

- `pipeline/data/src/regions.ts` holds `WHOLE_BODY = "body"`. The data and the mesh checks both read it from there.
- `compileRegion(dataDir, "body", mode)` takes every structure, every joint (so every movement), every exercise, and every attachment and action row of those structures. The review gate is the same code as for a region, so no unchecked row reaches the normal build.
- `build-data` writes the home regions, then `body`. `listRegions` keeps listing home regions only.
- The validator refuses `body` as a structure's region, in `also_in`, as a joint's region and in an exercise's regions, because the id is taken.
- A test compiles the real `data/` folder and checks that the body bundle is exactly the union of the six region bundles: the same structures, actions, attachments, movements, exercises and citations. So the two cannot drift apart.

## 6. The triangle budget

The whole body cannot meet the 150,000 triangles of a region. **(builder's call)** It gets its own limit in `check-models`, **240,000 triangles**, set from the measured 239,292 (233,761 in `body.glb` plus 5,531 in `hip-z-anatomy.glb`) that passed the gate. The six regions keep 150,000, and their check does not change.

## 7. What changes in the app

- `models/manifest.json`: `body` first, with `body.glb` (BodyParts3D, CC BY 4.0) and `hip-z-anatomy.glb` (Z-Anatomy, CC BY-SA 4.0).
- `en.json` and `de.json`: `region.body` ("Whole body", "Ganzer Körper") in front of `region.hip` in both files, and `regionGap.body`, the heading of the whole body's gap list.
- The gap line. **(builder's call)** The whole body shows a heading and, under it, each region that has a gap line, with the region's name and its own line word for word. The list is built from the `regionGap.<region>` texts at run time, so it can never say something different from them. Today that is lower leg and foot, shoulder, head and neck and trunk. The hip and the arm have no gap line, so they are not listed. Latissimus dorsi appears twice, under the shoulder and under the trunk, because both regions name it.
- The first camera view already fits the whole model, and reset returns to that view. Nothing in the viewer changes for this.
- Structure names: only the hip has German names. The whole body shows those in German and English names for the rest, as the regions do.
- Layers keep each structure's own depth from its home region. Peeling hides the lowest depth still shown, which is now the outer muscles of the whole body at once.
- Under a spot keeps its rules (side of the first hit, stop at a bone, at most 12 cm). They were written for one region and are tested on the whole body (section 8).

## 8. What the tests cover

Written first, seen failing first:

- Unit (pipeline, data): the body bundle is the union of the region bundles on a fixture and on the real data, the normal build has no draft rows in the body, `body` is refused as a region name in the YAML.
- Unit (pipeline, models): a body with a structure twice fails, a body missing a structure fails, a body mesh moved by more than 10 mm fails, the budget is 240,000 for `body` and 150,000 for every other region.
- Unit (Python): the body target list is the union, each id once, in manifest order. Conflicting targets stop it. The bone cap applies to bones only, and a region file without it builds as before.
- Unit (app): an unknown or missing `?region=` gives `body` when it comes first. The whole body's gap list shows each region's own line and leaves out regions without one.
- End to end, in `apps/web/e2e/whole-body.spec.ts`: the app opens with the whole body, the picker lists seven entries with "Whole body" first, switching to a region and back, a search that selects a structure outside the hip, a tap on the trunk and a tap on an arm beside the trunk in Under a spot, and peeling one layer.
- The existing layout checks (`layout.spec.ts`) open the app at `/`, so they now run with the whole body as the opener at all three sizes in both languages.
- Existing tests that say the app opens with the hip change to the whole body. Each change is listed in the build report.

## 9. Left for the owner

- Run perf on the Galaxy A23 with the whole body as the opener. A new section in `docs/regions/phone-measurements.md`.
- Whether bones at 1000 and other parts at 400 look good enough on the phone, and whether the skull's teeth row is acceptable.
- The German texts (drafts): "Ganzer Körper" was given by the owner, the gap heading is the builder's.
- Whether the Under a spot list should stop at the gap between an arm and the trunk (see the build report for what was seen).
