# Hip mesh inventory

This is the Phase 0 inventory of every mesh in BodyParts3D and Z-Anatomy that could be one of our hip structures. It was produced on 2026-11-02 by two scripts and the target list in `pipeline/assets/regions/hip.json`.

## How it was made

```bash
.venv/bin/python pipeline/assets/bp3d_inventory.py
tools/blender/blender -b --factory-startup -P pipeline/assets/za_inventory_blender.py
```

Each script writes one JSON line per mesh to `sources/bp3d-inventory.jsonl` and `sources/z-anatomy-inventory.jsonl` (both git-ignored) and then matches the target patterns against the English names. `pipeline/assets/hipmatch.py` does the matching.

## What counts as one mesh

**BodyParts3D.** One record per element OBJ file, 2234 in total. The file name (for example `FJ3259`) is the mesh name. A concept in `isa_element_parts.txt` can point to several elements (for example "femur" points to both femurs). For each element the script picks the most specific concept, which is the one covering the fewest elements, so FJ3259 becomes "left femur" (FMA24475). Ties prefer a name that starts with left or right. Faces come from the `f ` lines and bytes are the real file size. As a cross-check, 2126 of 2234 picks match the concept name written in the OBJ file header (ignoring capital letters). The other 108 are mostly outside the hip, and none of the matched hip targets are affected.

**Z-Anatomy.** The script opens `sources/z-anatomy/Z-Anatomy/Startup.blend` (the extracted content of `Z-Anatomy.zip`). The file has 4569 mesh objects. We keep a mesh object as a structure when all of these hold:

- It has at least one face.
- It sits in one of the three collections we use: "1: Skeletal system", "3: Joints" or "4: Muscular system".
- Its name ends in `.l` or `.r`, or has no dotted suffix at all (midline structures such as `Sacrum`).

That gives 1355 structure meshes (277 skeletal, 409 joints, 669 muscular system). What we skip and why:

- **`.j` and `.i` objects.** They have no faces. They are label anchors and leader lines (for example `Femur.j`, `Body of femur.i`), not geometry.
- **`.g` objects.** One group helper per collection.
- **The "2: Muscular insertions" collection.** 705 small meshes named like `Gluteus maximus muscle.ol` and `.el` (o means origin, e means insertion). They are patches painted on the bone where a muscle attaches. They are useful later as attachment landmarks, but they are not whole structures. Note that `Patellar ligament.el` and `Quadriceps femoris muscle.el` live here. Those are 43 to 53 face patches on the bone and do not count as the patellar ligament or the quadriceps tendon.
- **Every other collection.** Only the three collections above are read, so the inner ear, kidney and brain white matter parts (not usable under our licensing) are never imported or counted.

The "Bonus collection" is a second link to many of the same objects. It was not used.

**Z-Anatomy face counts** are the base mesh faces, before modifiers. Many joint, ligament and bursa meshes carry Subdivision Surface or Solidify modifiers. For the 17 Z-Anatomy targets the real exported size is about 2.3 times the base count (8,194 evaluated against 3,484 base faces for the left side). **Z-Anatomy bytes are estimated** at 50 bytes per base face and are only a rough guide.

## Reading the table

L, R and M are the number of left, right and midline (no side) meshes that matched. Faces is the total over those meshes. "gap" in the last column means neither source has the structure. "in sacrum mesh (null)" means the structure is already inside the BodyParts3D sacrum mesh, so it has no source of its own.

| Target | Type | Required | BodyParts3D matches | Z-Anatomy matches | Chosen source |
| --- | --- | --- | --- | --- | --- |
| hip-bone | bone | yes | L1 R1 M0, 4,706 faces | L1 R1 M0, 7,216 faces | bp3d |
| sacrum | bone | yes | L0 R0 M1, 9,922 faces | L0 R0 M1, 8,522 faces | bp3d |
| coccyx | bone | yes | none | L0 R0 M1, 1,066 faces | in sacrum mesh (null) |
| femur | bone | yes | L1 R1 M0, 6,306 faces | L1 R1 M0, 7,572 faces | bp3d |
| patella | bone | yes | L1 R1 M0, 616 faces | L1 R1 M0, 548 faces | bp3d |
| tibia | bone | yes | L1 R1 M0, 3,356 faces | L1 R1 M0, 3,226 faces | bp3d |
| fibula | bone | yes | L1 R1 M0, 2,266 faces | L1 R1 M0, 2,528 faces | bp3d |
| gluteus-maximus | muscle | yes | L1 R1 M0, 4,752 faces | L1 R1 M0, 6,652 faces | bp3d |
| gluteus-medius | muscle | yes | L1 R1 M0, 6,712 faces | L1 R1 M0, 10,352 faces | bp3d |
| gluteus-minimus | muscle | yes | L1 R1 M0, 8,416 faces | L1 R1 M0, 12,500 faces | bp3d |
| tensor-fasciae-latae | muscle | yes | L1 R1 M0, 2,508 faces | L1 R1 M0, 3,724 faces | bp3d |
| piriformis | muscle | yes | L1 R1 M0, 2,184 faces | L1 R1 M0, 3,000 faces | bp3d |
| superior-gemellus | muscle | yes | L1 R1 M0, 804 faces | L1 R1 M0, 808 faces | bp3d |
| inferior-gemellus | muscle | yes | L1 R1 M0, 1,284 faces | L1 R1 M0, 1,952 faces | bp3d |
| obturator-internus | muscle | yes | L1 R1 M0, 4,932 faces | L1 R1 M0, 7,520 faces | bp3d |
| obturator-externus | muscle | yes | L1 R1 M0, 1,568 faces | L1 R1 M0, 2,312 faces | bp3d |
| quadratus-femoris | muscle | yes | L1 R1 M0, 2,392 faces | L1 R1 M0, 3,292 faces | bp3d |
| iliacus | muscle | yes | L1 R1 M0, 5,724 faces | L1 R1 M0, 8,708 faces | bp3d |
| psoas-major | muscle | yes | L1 R1 M0, 9,800 faces | L1 R1 M0, 10,948 faces | bp3d |
| pectineus | muscle | yes | L1 R1 M0, 2,760 faces | L1 R1 M0, 3,904 faces | bp3d |
| adductor-longus | muscle | yes | L1 R1 M0, 5,232 faces | L1 R1 M0, 7,428 faces | bp3d |
| adductor-brevis | muscle | yes | L1 R1 M0, 2,928 faces | L1 R1 M0, 4,264 faces | bp3d |
| adductor-magnus | muscle | yes | L1 R1 M0, 11,944 faces | L1 R1 M0, 16,384 faces | bp3d |
| gracilis | muscle | yes | L1 R1 M0, 6,344 faces | L1 R1 M0, 9,624 faces | bp3d |
| sartorius | muscle | yes | L1 R1 M0, 6,888 faces | L1 R1 M0, 9,932 faces | bp3d |
| rectus-femoris | muscle | yes | L1 R1 M0, 11,376 faces | L1 R1 M0, 16,552 faces | bp3d |
| vastus-lateralis | muscle | yes | L1 R1 M0, 13,376 faces | L1 R1 M0, 18,712 faces | bp3d |
| vastus-medialis | muscle | yes | L1 R1 M0, 9,104 faces | L1 R1 M0, 12,920 faces | bp3d |
| vastus-intermedius | muscle | yes | L1 R1 M0, 8,520 faces | L1 R1 M0, 12,328 faces | bp3d |
| biceps-femoris-long-head | muscle | yes | L1 R1 M0, 10,220 faces | L1 R1 M0, 14,516 faces | bp3d |
| biceps-femoris-short-head | muscle | yes | L1 R1 M0, 3,456 faces | L1 R1 M0, 4,952 faces | bp3d |
| semitendinosus | muscle | yes | L1 R1 M0, 5,424 faces | L1 R1 M0, 8,632 faces | bp3d |
| semimembranosus | muscle | yes | L1 R1 M0, 9,224 faces | L1 R1 M0, 14,884 faces | bp3d |
| iliotibial-tract | tendon | yes | L1 R1 M0, 34,344 faces | L1 R1 M0, 97,224 faces | bp3d |
| quadriceps-tendon | tendon | yes | none | none | gap |
| patellar-ligament | tendon | yes | none | none | gap |
| iliofemoral-ligament | ligament | yes | none | L2 R2 M0, 112 faces | z-anatomy |
| pubofemoral-ligament | ligament | yes | none | L1 R1 M0, 40 faces | z-anatomy |
| ischiofemoral-ligament | ligament | yes | none | L1 R1 M0, 72 faces | z-anatomy |
| psoas-minor | muscle | no | none | none | gap |
| ligament-of-head-of-femur | ligament | no | none | L1 R1 M0, 198 faces | z-anatomy |
| transverse-acetabular-ligament | ligament | no | none | L1 R1 M0, 60 faces | z-anatomy |
| sacrotuberous-ligament | ligament | no | none | L1 R1 M0, 94 faces | z-anatomy |
| sacrospinous-ligament | ligament | no | none | L1 R1 M0, 34 faces | z-anatomy |
| inguinal-ligament | ligament | no | none | L1 R1 M0, 2,112 faces | z-anatomy |
| acetabular-labrum | labrum | no | none | L1 R1 M0, 352 faces | z-anatomy |
| hip-joint-capsule | capsule | no | none | L1 R1 M0, 280 faces | z-anatomy |
| trochanteric-bursa | bursa | no | none | L1 R1 M0, 384 faces | z-anatomy |
| iliopectineal-bursa | bursa | no | none | L1 R1 M0, 384 faces | z-anatomy |
| ischial-bursa | bursa | no | none | L1 R1 M0, 384 faces | z-anatomy |
| anterior-cruciate-ligament | ligament | no | none | L1 R1 M0, 1,616 faces | z-anatomy |
| posterior-cruciate-ligament | ligament | no | none | L1 R1 M0, 808 faces | z-anatomy |
| medial-collateral-ligament | ligament | no | none | L2 R2 M0, 32 faces | z-anatomy |
| lateral-collateral-ligament | ligament | no | none | L1 R1 M0, 6 faces | z-anatomy |

## Checks by eye

The patterns are anchored to the whole name, so a longer name cannot match a shorter one by accident. I listed every mesh that shares a word with a target but did not match, and read the lists in both sources. Points worth knowing:

- **Adductor magnus** matches only magnus. "Adductor minimus" is its own mesh in BodyParts3D (FJ1404) and in Z-Anatomy (`(Adductor minimus).l`, written in brackets). It is not one of our targets.
- **Biceps femoris** long head and short head are two targets. They do not match the biceps brachii heads. BodyParts3D writes "long head of left biceps femoris" (side inside the name), so `side_of` also reads a side word in the middle of a name.
- **Obturator internus and externus** are separate. The bursae "Sciatic bursa of obturator internus" and "Subtendinous bursa of obturator internus" and the "Obturator membrane" do not match. BodyParts3D also has a compound "obturator muscle" (4 elements), which is ignored.
- **Rectus femoris** does not pick up the eye muscles or the neck "rectus" muscles.
- **Psoas major** does not match "Iliopsoas fascia" or "Iliopsoas muscle.j" (no faces). **Psoas minor** is in neither source.
- **Naming differences handled:** "muscle" suffix, "Gemellus superior" against "Superior gemellus", "Iliotibial tract" or "band", "Patellar ligament" or "tendon", "Articular capsule of hip joint" against "hip joint capsule". The last three alternates did not need to fire, but they are in the patterns.
- **Iliofemoral ligament** has no whole mesh in Z-Anatomy. It is two meshes per side, the descending part and the transverse part, and both count as the one target.
- **Medial collateral ligament** is also two meshes per side in Z-Anatomy (superficial and deep part of the tibial collateral ligament).
- **Bursae.** The trochanteric target matches only "Trochanteric bursa of gluteus maximus muscle", not the gluteus medius and minimus bursae or the subcutaneous one. The ischial target matches "Sciatic bursa of gluteus maximus muscle" (the Terminologia Anatomica term is Bursa ischiadica musculi glutei maximi). The iliopectineal target matches only the bracketed "(Iliopectineal bursa)" mesh. Z-Anatomy has a separate "Subtendinous bursa of iliacus muscle" which is a different term and was left out.
- **Hip bone** is one mesh per side in both sources, so no ilium, ischium and pubis targets were needed. Z-Anatomy has ilium, ischium and pubis only as faceless `.j` and `.i` label objects.
- **Sacrum and coccyx.** BodyParts3D has one sacrum mesh (FJ3393) that already includes the coccyx (see the decision note), so the coccyx target has no source of its own. Z-Anatomy has them as two meshes, and its coccyx is shown in the table for information only.
- **BodyParts3D has no ligaments, capsules, labrum, bursae, menisci or tendons** for the hip and knee, apart from the iliotibial tract.
- **Menisci** are not targets. The spec's structure types have no meniscus type, so they are deferred to Phase 1. Z-Anatomy does have `Medial meniscus` and `Lateral meniscus` meshes.
