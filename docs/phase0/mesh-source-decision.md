# Mesh source decision for the hip

Date: 2026-11-02. Inputs: `docs/phase0/mesh-inventory.md`, `pipeline/assets/regions/hip.json`.

## Result in one paragraph

Use BodyParts3D for everything it has and Z-Anatomy for the rest. BodyParts3D covers all the bones (its sacrum mesh also contains the coccyx), all the muscles, and the iliotibial tract. It has no ligaments, capsules, labrum or bursae. Z-Anatomy fills in 17 targets. Two required structures have no mesh in either source and stay as known gaps. The two menisci are deferred to Phase 1. This means the hip mesh set is a mix, and the Z-Anatomy files in it are CC BY-SA 4.0.

## The rule that was applied

1. A `required` target that BodyParts3D has as its own mesh (left and right where the structure is paired) gets `"source": "bp3d"`.
2. A `required` target BodyParts3D lacks but Z-Anatomy has gets `"source": "z-anatomy"`.
3. Optional targets follow the same rule if either source has them, otherwise `null`.
4. A `required` target found in neither source is listed below as a gap. No geometry is invented.
5. Exception: a structure already contained in another chosen mesh gets `null` and a note. This applies only to the coccyx (see below).

The outcome is stored in the `source` field of every target in `pipeline/assets/regions/hip.json`.

## Counts

There are 54 targets (39 required and 15 optional).

| Source | Targets | Required | Optional | Meshes (left and right) | Faces | Size |
| --- | --- | --- | --- | --- | --- | --- |
| BodyParts3D | 33 | 33 | 0 | 65 | 219,388 | 15.6 MB of raw OBJ |
| Z-Anatomy | 17 | 3 | 14 | 38 | 6,968 base faces (about 16,400 after modifiers) | about 0.35 MB estimated, not measured |
| No mesh anywhere (known gaps) | 3 | 2 | 1 | 0 | 0 | 0 |
| Already inside the BodyParts3D sacrum mesh (coccyx) | 1 | 1 | 0 | 0 | 0 | 0 |

The coccyx is counted on its own row because its `source` is `null` without being a gap. Every BodyParts3D target has one mesh for each side, except the sacrum, which is one midline mesh. BodyParts3D stores the right side as `FJxxxx` and the left side as `FJxxxxM`.

How BodyParts3D represents the hip bone: **one mesh per side** (FJ3152 right, FJ3288 left), not split into ilium, ischium and pubis.

## Z-Anatomy targets

Collections used: "1: Skeletal system", "3: Joints" and "4: Muscular system". Nothing else was read. In particular the inner ear, kidney and brain white matter parts are not touched, and the "2: Muscular insertions" collection is not used for any target.

Required (3):

- iliofemoral ligament (two meshes per side, descending part and transverse part)
- pubofemoral ligament
- ischiofemoral ligament

Optional (14):

- ligament of the head of the femur
- transverse acetabular ligament
- sacrotuberous ligament
- sacrospinous ligament
- inguinal ligament
- acetabular labrum
- hip joint capsule
- trochanteric bursa (of gluteus maximus)
- iliopectineal bursa
- ischial bursa (Z-Anatomy calls it the sciatic bursa of gluteus maximus)
- anterior cruciate ligament
- posterior cruciate ligament
- medial collateral ligament (two meshes per side, superficial and deep part of the tibial collateral ligament)
- lateral collateral ligament (fibular collateral ligament)

The Z-Anatomy coccyx is not used (see the note on the coccyx below).

## Deferred to Phase 1

- **Medial meniscus and lateral meniscus.** The spec's structure types (bone, muscle, tendon, ligament, joint, capsule, labrum, bursa, nerve) have no meniscus type. They were removed from `hip.json` and will be added when the type list is extended. Z-Anatomy has `Medial meniscus` and `Lateral meniscus` meshes (CC BY-SA 4.0) and BodyParts3D has none.

## Known gaps

Required, no mesh in either source:

- **Quadriceps tendon.** Z-Anatomy has only a 49 face attachment patch on the patella (`Quadriceps femoris muscle.el`, in the insertions collection). That is a marked area, not a tendon.
- **Patellar ligament.** Z-Anatomy has only attachment patches (`Patellar ligament.ol` and `.el`, 53 and 43 faces). The neighbouring `Medial patellar retinaculum` and `Lateral patellar retinaculum` are different structures and were not substituted.

Optional, no mesh in either source:

- **Psoas minor.**

These stay in `hip.json` with `"source": null`. The Phase 0 data layer can still describe them, but the viewer will have nothing to highlight for them.

## Note on the coccyx

The coccyx target has `"source": null` because it is **already included in the BodyParts3D sacrum mesh FJ3393**. BodyParts3D has no separate coccyx concept, but the sacrum mesh is one connected piece 14.4 cm tall (z from 0.7828 to 0.9272 m). The Z-Anatomy sacrum alone is 11.5 cm tall and the Z-Anatomy sacrum and coccyx together are 15.1 cm. So the BodyParts3D mesh matches sacrum plus coccyx and not the sacrum alone. The Z-Anatomy coccyx (`Coccyx`, 1,066 faces) is not exported, because it would draw the same bone twice. This is not a gap: the bone is there, it just cannot be picked on its own. If the viewer later needs to highlight the coccyx separately, that would need a split of the sacrum mesh or the Z-Anatomy coccyx, and the share-alike cost would then apply.

## Alignment of the two sources

Needed because 17 targets come from Z-Anatomy and sit on BodyParts3D bones. Method: take the left femur in both sources, convert BodyParts3D from millimetres to metres, and compare bounding boxes in the files' own coordinates (no axis change). Z-Anatomy world boxes were read in Blender. BodyParts3D boxes were read from the OBJ vertices.

Left femur, metres:

| | min x | min y | min z | max x | max y | max z |
| --- | --- | --- | --- | --- | --- | --- |
| BodyParts3D FJ3259 | 0.0320 | -0.1123 | 0.3681 | 0.1502 | -0.0495 | 0.8342 |
| Z-Anatomy `Femur.l` | 0.0319 | -0.0188 | 0.4299 | 0.1485 | 0.0594 | 0.8843 |

Findings:

- **Same axes and handedness.** Left is +x and up is +z in both. Extent ratios are near 1 on each axis, so no rotation or flip is needed.
- **Units already fit.** After the mm to m conversion the sizes agree to within a few percent. Scale is close to 1.
- **Not aligned.** The Z-Anatomy femur sits about **0.10 m further along +y** and **0.056 m higher in z** (centre offsets, x offset is -0.001 m). The sources use different origins.
- **The body shapes differ.** The femur is 2.5 percent shorter in Z-Anatomy and 24 percent deeper front to back. The tibia is 6 percent shorter. The hip bone is 4 percent taller but 7 percent narrower. One scale and shift cannot fit every bone.

Best simple fit over the left femur, hip bone and the Z-Anatomy sacrum plus coccyx (the combined box matches the BodyParts3D sacrum, which includes the coccyx) (uniform scale s and shift t, Z-Anatomy position = s times BodyParts3D position + t):

- s = 0.9863
- t = (-0.0009, +0.0902, +0.0626) metres
- Worst bounding box corner error: 0.018 m on the femur, 0.009 m on the hip bone, 0.006 m on the sacrum, 0.024 m on the tibia.

To move Z-Anatomy parts onto the BodyParts3D bones, invert it: scale by 1.0139 and shift by (+0.0009, -0.0915, -0.0635) metres. This is only a starting point. A leftover error of 1 to 2 cm at the hip joint is visible for a capsule or labrum, so the export step should check the labrum and capsule against the BodyParts3D femoral head and acetabulum by eye, and if needed fit a local transform per joint.

## What this means for licenses

- **BodyParts3D files are CC BY 4.0.** 33 targets, 65 mesh files. They need the BodyParts3D credit text from `ATTRIBUTION.md`.
- **Z-Anatomy files are CC BY-SA 4.0.** These 17 targets (38 mesh files) would be CC BY-SA 4.0: iliofemoral, pubofemoral and ischiofemoral ligaments, ligament of head of femur, transverse acetabular, sacrotuberous, sacrospinous, inguinal, acetabular labrum, hip joint capsule, trochanteric, iliopectineal and ischial bursae, anterior and posterior cruciate, medial and lateral collateral. Any file derived from them (a resized, merged or re-exported copy) stays CC BY-SA 4.0.
- **Keep the licenses apart by file.** If the pipeline exports one mesh file per structure, only the Z-Anatomy files carry share-alike and the BodyParts3D files stay CC BY 4.0. If it bakes everything into one combined file, that whole file should be treated as CC BY-SA 4.0. This is my reading, not legal advice, and it matters for `models/LICENSE`.
- **Our own data stays CC BY 4.0.** The knowledge base in `data/` only refers to meshes by id, so it is not an adaptation of Z-Anatomy.
- **Dropping the 14 optional Z-Anatomy targets would shrink the share-alike part to the 3 required hip ligaments** (iliofemoral, pubofemoral, ischiofemoral). They are still needed for the ischiofemoral and iliofemoral stretch cases in the Phase 0 scenario.
- **License text caveat from the spec.** BodyParts3D OBJ file headers still print the old CC BY-SA 2.1 Japan text. The DBCLS page read on 2026-11-02 says CC BY 4.0 since 2025-02-27, as recorded in the design spec.

## Notes for the export step

- Z-Anatomy ligament, capsule and bursa meshes have Subdivision Surface or Solidify modifiers. Export the evaluated mesh, not the base mesh.
- Z-Anatomy objects are parented to group helpers. Use the world matrix when exporting.
- `Iliotibial tract` is heavy in both sources (17,172 faces per side in BodyParts3D, 48,612 in Z-Anatomy). It is a BodyParts3D target, so budget for decimation.

## Export result (2026-11-02)

Path taken: **mixed sources**, as planned above. `models/hip.glb` holds the BodyParts3D meshes and `models/hip-z-anatomy.glb` holds the Z-Anatomy meshes, moved onto the BodyParts3D bones.

How the Z-Anatomy meshes were lined up: `pipeline/assets/build_region_blender.py` fits a uniform scale, rotation and shift for each side separately. It uses the hip bone and femur of that side in both sources and an ICP loop (pair every Z-Anatomy vertex with the closest point on the BodyParts3D surface, fit, repeat), starting from the global move in the alignment section. The fit code is in `pipeline/assets/meshfit.py`.

| Side | Scale | Rotation | Shift (m) | ICP rms before and after |
| --- | --- | --- | --- | --- |
| Left | 1.0264 | 3.48 degrees | (-0.0111, -0.1368, -0.0685) | 5.2 mm to 2.2 mm |
| Right | 1.0263 | 3.53 degrees | (+0.0113, -0.1368, -0.0683) | 5.4 mm to 2.2 mm |

The shift looks larger than the global one because the small rotation turns around the world origin, which is about 0.85 m below the hip joints.

How well the hip joints line up. "Head centre error" is the distance between the centres of spheres fitted to the femoral head in each source. The two "mean distance" columns are the average distance from the moved Z-Anatomy vertices to the BodyParts3D surface, on the femoral head and on the acetabulum.

| Side | Move used | Head centre error | Femoral head mean distance | Acetabulum mean distance |
| --- | --- | --- | --- | --- |
| Left | global start | 8.0 mm | 4.0 mm | 3.6 mm |
| Left | per-side fit | **1.7 mm** | 1.5 mm | 1.3 mm |
| Right | global start | 8.5 mm | 4.5 mm | 3.3 mm |
| Right | per-side fit | **1.5 mm** | 1.5 mm | 1.2 mm |

Both sides are within the 5 mm limit, so the sources were mixed. The fitted femoral head radius is 22.9 mm in BodyParts3D and 24.5 mm in Z-Anatomy after the fit, so the two heads differ a little in size as well.

What was exported:

| File | Meshes | Triangles | Size |
| --- | --- | --- | --- |
| `models/hip.glb` (BodyParts3D, CC BY 4.0) | 65 (11 bone, 52 muscle, 2 tendon) | 43,378 | 234,228 bytes |
| `models/hip-z-anatomy.glb` (Z-Anatomy, CC BY-SA 4.0) | 34 (24 ligament, 6 bursa, 2 capsule, 2 labrum) | 5,051 | 49,556 bytes |
| Total | 99 | 48,429 | 283,784 bytes |

Decimation keeps 60 percent of the triangles on bones and 14 percent on everything else, with no mesh under 120 triangles. The total stays far under the 150,000 triangle budget for the region.

The check pictures `docs/phase0/export-check-front.png` and `export-check-back.png` look at the right hip joint with muscles hidden. The capsule, the hip ligaments, the sacrotuberous and sacrospinous ligaments and the bursae sit on the BodyParts3D bones, and nothing floats. The labrum is almost fully hidden between the femoral head and the acetabulum, which is where it belongs. A similar look at the right knee (not committed) showed the cruciate and collateral ligaments in place on the BodyParts3D femur, tibia and fibula.
