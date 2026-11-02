# Phase 1 follow-ups from the Phase 0 reviews

Small issues found while reviewing Phase 0. None of them blocks the spike. Each one is worth fixing when Phase 1 touches that area.

## Data and data model

- Decide how a row says "only in some hip shapes" (the labrum row now keeps this in its free-text locator). Must be settled before any row reaches the app.
- Add a meniscus structure type, then add the menisci back to the region.
- The iliotibial tract is typed `tendon`, which allows `working` rows for a fascial band. Decide on a better type.
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

- Empty-space taps clear the selection only under 3 px of finger movement, while taps on a structure select under 6 px. Check on the phone, then align the two.
- Show a loading message (the `loading.model` text exists but is unused).
- The load watchdog can fire falsely in a background tab, because animation frames pause there. Mark the model ready when it finishes loading instead.
- The Vite plugin that skips three's unused Draco decoder copies does nothing silently if three changes its source text. Add a build warning.
- A missing WebGL shows "check your connection". Give it its own message.
- The educational line sits inside the collapsed credits. Make it visible before anyone else uses the app.
- Consider `frameloop="demand"` to save battery when nothing moves.
- `camera-controls` is imported as a type from an undeclared dependency.

## Tooling and docs

- `perf-check.mjs` and `error-check.mjs`: handle a failed server start, a busy port 4173, and rename the `URL` constant.
- Deploy guide: soften "Tailscale reads the files fresh on each request" and mention a hard refresh after updates.
- README: describe the goal in future tense until the app does all of it.
- Spike report: add a pointer to the tap pass criteria when the phone result is recorded.
