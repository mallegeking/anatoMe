# Known gaps in the new regions

Phase 4b added five regions to the hip: lower leg and foot, shoulder, arm and hand, head and neck, and trunk. Their meshes come from BodyParts3D release 4.0 only, so every model file stays CC BY 4.0. This page lists what is missing, what was left out on purpose, and what it would take to fill each gap. The design is in `docs/superpowers/specs/2026-11-15-whole-body-meshes-design.md`.

Each region shows one line about its gaps in the app while nothing is selected. The texts are `regionGap.<region>` in `apps/web/src/i18n/en.json`.

## What is true for every new region

- Ids, English names, mesh patterns and FMA ids come out of `pipeline/assets/region_gen.py`. Nobody typed them.
- Latin names come from Z-Anatomy's `TA2.csv` by exact match of the English name. Nobody checked them one by one, as was done for the hip. A structure with no match has no Latin name. In all, 149 of the 260 new structures have one.
- The layer (depth) of each muscle is measured from the model, not taken from a source. The note on each row says so. How well the layers read when peeling is not verified on a phone yet.
- The new regions have no attachments, actions, movements or exercises, and no German names. They show only the Structures and Area tabs.
- Eleven meshes have no name in their OBJ file header, so their names rest on the inventory's concept pick alone: FJ1451, FJ1454 and FJ1455 (the three intercostal layers), FJ1525, FJ1543, FJ1547, FJ1548, FJ1549, FJ1550, FJ1552 and FJ1553. Every other mesh in scope carries its inventory name in the header.
- Some muscles are stored in BodyParts3D as one file plus a mirrored "M" file with no side word. The generator treats each as one midline structure and the build joins both sides into one mesh, so tapping one selects both sides. Splitting them into left and right is a later generator change. This affects the external, internal and innermost intercostals, the lateral and medial lumbar intertransversarius, the interspinales lumborum, spinalis and the thoracic rotator (trunk), and the sets of anterior and posterior cervical intertransversarii and of interspinales cervicis (neck). Rows with `midline: true` in `data/structures/trunk.yaml` and `neck.yaml` show the exact ids. The diaphragm and the unpaired bones are midline too, but they are single structures.
- The external oblique is a large thin sheet that was reduced to 2000 faces, so it looks faceted in the trunk. The three intercostal meshes stay far above that cap (5600 to 7100 faces), because the reduction stops early on meshes made of many small pieces. The trunk is still inside its budget.

## Lower leg and foot

Has no mesh in BodyParts3D 4.0:

- The dorsal interossei of the foot.
- Extensor digitorum brevis.

Left out on purpose: nothing beyond what the other regions share (see below).

## Shoulder

Has no mesh in BodyParts3D 4.0:

- Latissimus dorsi.

## Arm and hand

No gap is known beyond the shared ones below.

## Head and neck

Has no mesh in BodyParts3D 4.0:

- The jaw muscles: masseter, temporalis and both pterygoids.
- The muscles of the face.

Dropped by the generator, because BodyParts3D has only one side of each:

- Inferior oblique part of longus colli (FJ1557).
- Superior oblique part of longus colli (FJ1600).
- Vertical intermediate part of longus colli (FJ1601).

Longus colli is therefore missing from the neck entirely. A one-sided muscle would look wrong and would break the left and right pairing.

Left out on purpose: the muscles of the eye, larynx, pharynx, palate and tongue. BodyParts3D has them, but they do not move the skeleton the app teaches. Teeth are left out too.

## Trunk

Has no mesh in BodyParts3D 4.0:

- Latissimus dorsi (also missing from the shoulder, so it is in no region).
- Quadratus lumborum.
- Multifidus.
- Rectus abdominis, internal oblique and transversus abdominis. Only the external oblique is there.

Left out because the data has no type for them yet:

- The rib cartilages.
- The discs between the vertebrae.

Because latissimus dorsi and the trapezius are not in the trunk file, the measured layer of the erector spinae reads more superficial than it would in a body.

## The hip has no adductor minimus

BodyParts3D has adductor minimus as its own mesh, but the hip region does not include it. Adding it changes `models/hip.glb`, which this work did not touch. It is open for the owner.

## What would fill the gaps

- **Missing muscles.** Z-Anatomy has most of them. It would need the surface gate decision, because Z-Anatomy meshes are CC BY-SA 4.0, and new fitting code for every region, because the present fit only knows the hip bone and the femur. Ligaments, capsules and bursae would come the same way.
- **Rib cartilages and discs.** These need a `cartilage` structure type in the data schema first, then meshes from either source.
- **One side of longus colli.** A mirrored copy would be a made-up mesh, so it needs the Z-Anatomy route too.
- **Left and right for the joined muscles.** A change in the generator and the build script, with no new source.
- **Attachments, movements, exercises and German names.** Sourced data and review for each region, planned separately.
