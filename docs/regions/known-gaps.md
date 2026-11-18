# Known gaps in the new regions

Phase 4b added five regions to the hip: lower leg and foot, shoulder, arm and hand, head and neck, and trunk. Their meshes come from BodyParts3D release 4.0 only, so every model file stays CC BY 4.0. This page lists what is missing, what was left out on purpose, and what it would take to fill each gap. The design is in `docs/superpowers/specs/2026-11-15-whole-body-meshes-design.md`.

Each region shows one line about its gaps in the app while nothing is selected. The whole body shows the regions' lines as a list (see its own section further down). The texts are `regionGap.<region>` in `apps/web/src/i18n/en.json`.

## What is true for every new region

- Ids, English names, mesh patterns and FMA ids come out of `pipeline/assets/region_gen.py`. Nobody typed them.
- Latin names come from Z-Anatomy's `TA2.csv` by exact match of the English name. Nobody checked them one by one, as was done for the hip. A structure with no match has no Latin name. In all, 145 of the 260 new structures have one. Four TA2 terms with typos in the source table are left out on purpose, so those structures (first metacarpal bone, fourth metatarsal bone, medial head of triceps brachii and flexor digitorum superficialis) have no Latin name.
- The layer (depth) of each muscle is measured from the model, not taken from a source. The note on each row says so. How well the layers read when peeling is not verified on a phone yet.
- The new regions have no attachments, actions, movements or exercises, and no German names. They show only the Structures and Area tabs.
- Eleven meshes have no name in their OBJ file header: FJ1451, FJ1454 and FJ1455 (the three intercostal layers), FJ1525, FJ1543, FJ1547, FJ1548, FJ1549, FJ1550, FJ1552 and FJ1553. Each of them has a mirror "M" file (FJ1451M and so on) whose header carries the same English name and the same FMA id as the inventory gives the file without a name. So BodyParts3D itself names these meshes, for example FJ1543M's header says "Spinalis" with FMA77179. Every other mesh in scope carries its inventory name in its own header.
- Some muscles are stored in BodyParts3D as one file plus a mirrored "M" file with no side word. The generator treats each as one midline structure and the build joins both sides into one mesh, so tapping one selects both sides. Splitting them into left and right is a later generator change. This affects the external, internal and innermost intercostals, the lateral and medial lumbar intertransversarius, the interspinales lumborum and the thoracic rotator (trunk), and spinalis and the sets of anterior and posterior cervical intertransversarii and of interspinales cervicis (neck). Rows with `midline: true` in `data/structures/trunk.yaml` and `neck.yaml` show the exact ids. The diaphragm and the unpaired bones are midline too, but they are single structures.
- The external oblique is a large thin sheet that was reduced to 2000 faces, so it looks faceted in the trunk. The three intercostal meshes stay far above that cap (5600 to 7100 faces), because the reduction stops early on meshes made of many small pieces. The trunk is still inside its budget.

## Lower leg and foot

Has no mesh in BodyParts3D 4.0:

- The dorsal interossei of the foot.
- Extensor digitorum brevis.

Left out on purpose: nothing beyond what the other regions share (see above).

## Shoulder

Has no mesh in BodyParts3D 4.0:

- Latissimus dorsi.

## Arm and hand

Has no mesh in BodyParts3D 4.0:

- Palmaris brevis. No record of `sources/bp3d-inventory.jsonl`, no OBJ header and no line of `isa_parts_list_e.txt` or `partof_parts_list_e.txt` names it.

The arm has no gap line in the app yet, because there is no `regionGap.arm` text.

Two structures at the base of the thumb, as BodyParts3D names them:

- "Flexor pollicis brevis" (`flexor-pollicis-brevis`, FMA37378), from FJ1469 and FJ1469M. Their headers say "Left flexor pollicis brevis" and "Right flexor pollicis brevis". FJ1469 lies on the right and FJ1469M on the left, so the inventory gives each the side it lies on (see "Second review fixes" in `docs/superpowers/reviews/phase-4b-build-report.md`).
- "Superficial head of flexor pollicis brevis" (`superficial-head-of-flexor-pollicis-brevis`, FMA46104), from FJ1514 and FJ1514M. Their headers say "Superficial head of right flexor pollicis brevis" and "Superficial head of left flexor pollicis brevis".

Both concepts are lines of `isa_parts_list_e.txt`. In `isa_element_parts.txt` FJ1469 is a "muscle organ" and FJ1514 a "head of muscle organ". So the app shows the superficial head as a structure of its own next to the muscle it belongs to.

## Head and neck

Has no mesh in BodyParts3D 4.0:

- The jaw muscles: masseter, temporalis and both pterygoids.
- The muscles of the face.

Dropped by the generator, because BodyParts3D has only one side of each:

- Inferior oblique part of longus colli (FJ1557).
- Superior oblique part of longus colli (FJ1600).
- Vertical intermediate part of longus colli (FJ1601).

Longus colli is therefore missing from the neck entirely. A one-sided muscle would look wrong and would break the left and right pairing.

Spinalis (FJ1543 and its mirror FJ1543M, "Spinalis" in the part lists) is filed under the neck. Its meshes reach from 1329 to 1435 mm in height, above spinalis thoracis (up to 1335 mm) and past the seventh cervical vertebra (1365 to 1392 mm), so in the trunk file it stood above the highest bone. Its own header has no name, but the header of FJ1543M names it "Spinalis" with the same FMA id. Whether it is the cervical part of spinalis is not checked.

Two quirks of the source files, both left as they are:

- The hyoid bone is two identical source files, FJ2772 and FJ3201. Their geometry is the same line for line, only the File ID differs. The build joins both into one mesh, so the hyoid in `models/neck.glb` has twice the triangles it needs (1434 where one copy would give about 718).
- The left digastric has a third source file, FJ1560, with no right counterpart. The left digastric is FJ1555, FJ1560 and FJ1578, the right one FJ1556 and FJ1579. The build joins each side's files, so the left mesh has 458 triangles and the right one 413.

Left out on purpose: the muscles of the eye, larynx, pharynx, palate and tongue. BodyParts3D has them, but they do not move the skeleton the app teaches. Teeth are left out too.

## Trunk

Has no mesh in BodyParts3D 4.0:

- Latissimus dorsi (also missing from the shoulder, so it is in no region).
- Quadratus lumborum.
- Multifidus.
- Rectus abdominis, internal oblique and transversus abdominis. Only the external oblique is there.
- The coccyx. No bone mesh is a coccyx. In `sources/bp3d-inventory.jsonl`, in the OBJ headers and in `isa_parts_list_e.txt`, "coccy" names only the pelvic floor muscles coccygeus, iliococcygeus and pubococcygeus.

Left out on purpose: the pelvic floor and perineum muscles. BodyParts3D has them, but they do not move the skeleton the app teaches.

Left out because the data has no type for them yet:

- The rib cartilages.
- The discs between the vertebrae.

Because latissimus dorsi and the trapezius are not in the trunk file, the measured layer of the erector spinae reads more superficial than it would in a body.

## Whole body

The whole body holds every structure of the six regions once. It is built from one lighter file, `models/body.glb`, plus the hip's own `models/hip-z-anatomy.glb`. In `body.glb` each bone is decimated to 1000 triangles per mesh and every other part to 400. That is the target, not a limit: every bone is at or under 1000, but 17 other meshes stay above 400 because the source meshes arrive in many loose pieces. They are the innermost, external and internal intercostals (7105, 6736 and 5615 triangles, one mesh each for both sides), the external oblique (2019 and 1991), serratus anterior (843 and 838), the thoracic rotator (590), iliocostalis lumborum (548 and 522), longissimus thoracis (535 and 531), serratus posterior inferior (466 and 461), the right platysma (449) and the ascending part of trapezius (443 and 432). Section 3.1 of `docs/superpowers/specs/2026-11-17-whole-body-view-design.md` says why. The six region files keep their full detail.

What detail is lost:

- The skull's row of upper teeth turns into a jagged band and the lower jaw is slightly faceted.
- Pectoralis major shows a few more sharp slivers.

Nothing is dropped. All structures of the six regions are in it.

Its gap list in the app is the regions' own lines. It shows a heading and then each region that has a gap line, with that line word for word. So it has no gaps of its own beyond those of the regions above.

## The hip has no adductor minimus

BodyParts3D has adductor minimus as its own mesh, but the hip region does not include it. Adding it changes `models/hip.glb`, which this work did not touch. It is open for the owner.

## What would fill the gaps

- **Missing muscles.** Z-Anatomy has most of them. It would need the surface gate decision, because Z-Anatomy meshes are CC BY-SA 4.0, and new fitting code for every region, because the present fit only knows the hip bone and the femur. Ligaments, capsules and bursae would come the same way.
- **Rib cartilages and discs.** These need a `cartilage` structure type in the data schema first, then meshes from either source.
- **Longus colli, both sides.** BodyParts3D has it on the left side only, so the generator drops it. A mirrored copy would be a made-up mesh, so it needs the Z-Anatomy route too.
- **Left and right for the joined muscles.** A change in the generator and the build script, with no new source.
- **Attachments, movements, exercises and German names.** Sourced data and review for each region, planned separately.
