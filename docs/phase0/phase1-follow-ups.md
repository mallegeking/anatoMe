# Phase 1 follow-ups from the Phase 0 reviews

Small issues found while reviewing Phase 0. None of them blocks the spike. Each one is worth fixing when Phase 1 touches that area.

## Data and data model

- Done 2026-11-03: a row says "only in some hip shapes" in the new `applies_to` field, and the labrum row moved its limit there (Phase 1 Task 1).
- Done 2026-11-03: the `meniscus` type exists and both menisci are in the region (Phase 1 Task 2).
- Done 2026-11-03: the iliotibial tract is typed `fascia` (Phase 1 Task 2).
- Done 2026-11-03: the piriformis 45 versus 30 degree question is attached to both piriformis rows as a `review_note` for the physio (Phase 1 Tasks 1 and 11). The answer itself comes from the physio review.
- Done 2026-11-03: `posterior-cruciate-ligament` has its Terminologia Anatomica 2 name, Ligamentum cruciatum posterius (Phase 1 Task 10).
- Done 2026-11-03: validator fixtures cover the load-type rule for capsule, bursa, bone, meniscus and fascia too (Phase 1 Task 1). Labrum and joint still have no fixture of their own.
- Check structures in the reverse direction too (every meshed target has a structure entry).
- Model check unit tests use glb files without Draco. Add one Draco fixture.

## Mesh pipeline

- `--whole-region` export path (the licence fallback) has never been run.
- The 5 mm alignment gate checks only the femoral head centre. Also gate on the surface distances, and re-measure after decimation.
- In mixed mode, an unpaired Z-Anatomy target would stop the build.
- Done 2026-11-03: `export_copyright` is set, so each glb carries its own credit line (Phase 1 Task 2).
- The decision doc says BodyParts3D uses FJxxxx and FJxxxxM for right and left. That is only true for muscles.
- Mention Zona orbicularis and Frenula capsulae (parts of the hip capsule) in the inventory.
- `za_inventory_blender.py` drops midline names that contain a period. Document or fix.
- Download scripts: check zips with `unzip -t` before recording checksums, re-fetch half-unpacked files, do not retry permanent errors like 404, check for curl, git, unzip and sha256sum up front.

## App

- Done 2026-11-03: taps on empty space and taps on a structure both use the 6 px rule (Phase 1 Task 8).
- Done 2026-11-03: the loading message shows until the model is in, and the 3D code arrives as a separate download after the first screen (Phase 1 Task 8).
- Done 2026-11-03: the model counts as ready when it finishes loading, and the watchdog waits while the tab is in the background (Phase 1 Task 8).
- Done 2026-11-03: the Draco skip plugin warns during the build when it finds nothing to skip (Phase 1 Task 8).
- Done 2026-11-03: a browser without WebGL gets its own message (Phase 1 Task 8).
- Done 2026-11-03: the educational line shows above the credits without opening them (Phase 1 Task 8).
- Done 2026-11-03: the canvas uses `frameloop="demand"` and draws only when something changes (Phase 1 Task 8).
- Done 2026-11-03: `camera-controls` is a declared dependency (Phase 1 Task 8).

## Tooling and docs

- `perf-check.mjs` and `error-check.mjs`: handle a failed server start, a busy port 4173, and rename the `URL` constant.
- Deploy guide: soften "Tailscale reads the files fresh on each request" and mention a hard refresh after updates.
- README: describe the goal in future tense until the app does all of it.
- Spike report: add a pointer to the tap pass criteria when the phone result is recorded.

## Phase 2

Found in the Phase 1 reviews and left for Phase 2.

- Iliacus and psoas major are at depth 1, so the first peel hides them together with sartorius and rectus femoris. Decide how deep they should show.
- "Hide this" hides both sides of a paired structure. Let it hide one side only.
- Search opens paired structures on the left and keeps a hard-coded list of unpaired ones (only the sacrum). Give the bundle a `paired` flag instead, before the next region adds midline structures.
- After Escape closed the search list, Enter still chooses the first result. Make Enter do nothing while the list is closed.
- The brackets around the licence links in `Credits.tsx` are typed in the code. Move them into `en.json`.
- Playwright: keep a trace of a failed run, and decide whether CI should retry a failed end-to-end test.
- Angles between measured points: a row only claims what a source measured, so nothing is said between two measured angles (for example obturator externus between 60 and 75 degrees). Agree a rule with the physio.
