# anatoMe: the rest of the body as meshes and names

Date: 2026-11-15
Status: draft, waiting for review by the project owner
Based on: `docs/superpowers/specs/2026-11-02-anatome-design.md` (Phase 4 row of section 9), `docs/phase0/mesh-source-decision.md` and the BodyParts3D inventory read on 2026-11-15.

Points marked **(builder's call)** were decided by Claude. The owner can overrule any of them before the build starts.

## What the owner asked for

The model shows only the hip. The owner wants the rest of the body in it. Two answers from the owner on 2026-11-15 set the scope:

1. **Meshes and names only.** Every region gets its bones and muscles, names, layers and search. Attachments, actions and exercises for the new regions come later, region by region, with sources and a physio check.
2. **BodyParts3D only, gaps for now.** The muscles BodyParts3D lacks stay out and are listed as known gaps. Filling them from Z-Anatomy is a later plan, after the owner has decided the surface gate from Phase 4a.

## What the body looks like after this

The body is not one model. It is six regions behind the region picker that Phase 4a built, one file per region, as the main spec says. The hip stays as it is and stays the region the app opens with.

| Region id | Name in the app | Own structures (about) | Borrowed bones for context |
| --- | --- | --- | --- |
| `hip` | Hip and thigh | unchanged | none |
| `lower-leg` | Lower leg and foot | 60 | femur, tibia, fibula, patella |
| `shoulder` | Shoulder | 23 | ribs, manubrium, body of sternum, neck and chest vertebrae |
| `arm` | Arm and hand | 70 | humerus, scapula |
| `neck` | Head and neck | 53 | clavicle, scapula, manubrium, first two ribs, chest vertebrae 1 to 6 |
| `trunk` | Trunk | 54 | sacrum, hip bone, seventh neck vertebra |

A borrowed bone belongs to one region and is also drawn in another, so that a region never shows muscles hanging in the air.

## Goals

- Every bone that BodyParts3D has is in some region. That is 203 bone meshes plus the three parts of the sternum.
- Every muscle of the limbs, neck, back and chest wall that BodyParts3D has is in some region.
- Each new region works in the Structures tab: tap, name, Latin name where the source table has one, layers, search.
- Each region stays inside the 150,000 triangle budget.
- The hip model files do not change by a single byte.

## Not in this work

- Attachments, actions, movements and exercises for the new regions. The Movements and Notebook tabs do not show in a region that has no movements.
- German names for the new structures. The app shows the English name, as it already does for a missing German name.
- Anything from Z-Anatomy: ligaments, capsules, bursae and the missing muscles.
- Muscles of the eye, larynx, pharynx, palate, tongue and pelvic floor **(builder's call)**. BodyParts3D has them, but they do not move the skeleton the app teaches.
- Rib cartilages and the discs between the vertebrae. The data has no type for cartilage yet.
- Teeth.

## What would make this a failure

- A wrong name on a mesh. Names come from the BodyParts3D part lists by script, never by hand or from memory.
- A region that stutters on the Galaxy A23.
- A change to the checked hip region.
- A layer order written from memory and shown as if it had a source.

## Known gaps the app tells the user about

BodyParts3D release 4.0 has no mesh for these. Each region shows one line about its gaps while nothing is selected.

- Shoulder and trunk: latissimus dorsi.
- Trunk: quadratus lumborum, multifidus, rectus abdominis, internal oblique, transversus abdominis.
- Head and neck: masseter, temporalis, both pterygoids, the muscles of the face. Longus colli exists on the left side only and is left out.
- Lower leg and foot: the dorsal interossei of the foot, extensor digitorum brevis.

## Approaches that were considered

1. **BodyParts3D only, gaps listed. Chosen by the owner.** Unblocked today, every model file stays CC BY 4.0, and it is the first half of approach 2.
2. **BodyParts3D plus Z-Anatomy fillers.** A complete body. It needs the surface gate decision and new fitting code for every region, because the present fit only knows the hip bone and the femur.
3. **Whole body from Z-Anatomy alone.** Complete and needs no fitting. Every model file would be CC BY-SA 4.0 and the hip would have to be rebuilt to match the other regions.

## How it is built (builder's calls)

1. **Regions, not one body.** One file per region behind the picker, as the main spec says. A single whole-body file would be about 600 meshes at once on the phone and was not measured.
2. **The target lists are generated, not written.** A script reads the BodyParts3D inventory and class lists and writes `pipeline/assets/regions/<region>.json`. A second step writes `data/structures/<region>.yaml` from the same list, so the meshes and the data cannot drift apart.
3. **Which region a part belongs to follows the BodyParts3D classes** ("muscle of leg", "carpal bone" and so on), with a short name list for the parts the classes miss, such as the three parts of the deltoid.
4. **A structure has one home region and may also be drawn in others.** A new optional field `also_in` on a structure carries this. Only bones are shared.
5. **Heavy meshes get a cap.** Some BodyParts3D meshes are huge (the external oblique has 223,652 faces). A new region sets `max_triangles_per_mesh` to 2000 in its target file. The hip sets nothing and builds exactly as before.
6. **Layers are measured from the model, not sourced.** For the hip every muscle got a layer from a textbook, by hand. For about 250 more muscles that is long work with a real risk of invented notes. Here the build script measures each muscle: it sends rays out from the muscle's surface and counts the share that meet no other part, bone or muscle. A muscle with a fifth or more of its rays free is layer 1. Under a twentieth it is layer 3. Bones are 4 as in the hip. The note on each row says it was measured. Because some muscles are missing, the layers follow what the model shows, which is what peeling needs. The planner tried the rule on the lower leg, the shoulder and the arm on 2026-11-15, and it puts the well-known cases right: the deltoid, trapezius, gastrocnemius and biceps outside, the soleus, brachialis and rhomboids under them, the supraspinatus, popliteus and supinator deepest. It was not tried on the neck and the trunk. If the build's own check fails, every muscle gets layer 1 and the report says so. The other choice is sourcing every muscle like the hip.
7. **Movements belong to a joint, and a joint to a region.** `data/joints.yaml` gets a `region` on each joint. A region's data file carries only the movements of its own joints. This is why the new regions show no Movements tab yet.
8. **Latin names** come from Z-Anatomy's `TA2.csv` by exact match of the English name. A row with no match gets no Latin name. Nobody checks them one by one in the TA2 Viewer as was done for the hip.

## Left to the builder

- The exact layout of the gap line in the panel.
- Function bodies. The plan pins names, signatures, rules and test values.

## Open for the owner

- The layer rule in point 6. It is measured, not sourced, and untried on the neck and the trunk.
- The region names in the app, English and German.
- Whether the left-out muscle groups (eye, larynx, pharynx, palate, tongue, pelvic floor) should be in after all.
- The hip region has no adductor minimus. BodyParts3D has it as its own mesh. Adding it changes the hip model, so it is not part of this work.
