# Phase 1 follow-ups from the Phase 0 reviews

Small issues found while reviewing Phase 0. None of them blocks the spike. Each one is worth fixing when Phase 1 touches that area.

## Data and data model

- Decide how a row says "only in some hip shapes" (the labrum row now keeps this in its free-text locator). Must be settled before any row reaches the app.
- Done 2026-11-03: the `meniscus` type exists and both menisci are in the region (Phase 1 Task 2).
- Done 2026-11-03: the iliotibial tract is typed `fascia` (Phase 1 Task 2).
- Piriformis as `primary` external rotator up to 45 degrees is a judgment. At 45 degrees obturator externus is larger in Ito 2025 Table 2. Ask the physio.
- `posterior-cruciate-ligament` has no Latin name because the TA2.csv entry looks wrong. Fix during the Latin review.
- Validator tests cover the load-type rule only for ligaments. Add fixtures for capsule, labrum, bursa, bone and joint.
- Check structures in the reverse direction too (every meshed target has a structure entry).
- Model check unit tests use glb files without Draco. Add one Draco fixture.

## Mesh pipeline

- `--whole-region` export path (the licence fallback) has never been run.
- The 5 mm alignment gate checks only the femoral head centre. Also gate on the surface distances, and re-measure after decimation.
- In mixed mode, an unpaired Z-Anatomy target would stop the build.
- Set `export_copyright` so each glb carries its own credit line (needs a re-export).
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
