# Phase 0 spike report

Date: 2026-11-02. Covers the hip spike (plan tasks 1 to 7).

## Outcome

**The spike worked. Everything is done except the phone gate, which is pending owner measurement.**

A browser app now loads the hip, lets you tap a structure to see its name, and reads from a validated knowledge base with 11 sourced action rows. The one thing nobody has measured is the real target device. The Samsung Galaxy A23 gate (interactive within 5000 ms, no stutter when rotating) is **pending owner measurement**. Nothing here says it passed or failed.

### Phone gate

| Item | Value |
| --- | --- |
| Gate | Median of 3 runs interactive within 5000 ms on home Wi-Fi, and no stutter when rotating for 10 seconds |
| Status | **Pending owner measurement** |
| Provisional signal | Playwright pre-check, Chromium, 4x CPU throttle, 412 x 915 viewport, cache off, 5 runs |
| Pre-check result | Median 1457 ms (an earlier run gave 1630 ms). All runs between 1375 and 1800 ms |
| Desktop, no throttle | 0.5 to 1.4 s (the first run after a cold start was the slowest) |

What the provisional signal says: on load time, the pre-check has about 3.4 times headroom against the 5000 ms limit. My expectation is that the A23 passes the load time part (**medium**). Two things the pre-check does not cover:

- **Smooth rotation.** The pre-check does not rotate anything and headless Chromium in the container has no real phone GPU. The scene is 99 meshes and 48,429 triangles with no merging, which should be fine for the A23 but is untested (**low**).
- **Real network and real phone CPU.** The pre-check loads from localhost. A 4x slowdown is a rough stand-in for the A23 (**low**). The transfer is about 1 MB over the wire (345 kB gzipped JavaScript, the Draco decoder, 284 kB of models), so Wi-Fi time should be under a second (**medium**, not measured).

**What the owner needs to do:**

1. Follow `docs/deploy-homelab.md` to build the app, copy it to the homelab and serve it with `tailscale serve`. Open the address on the phone with Tailscale switched on.
2. Fill in `docs/phase0/phone-measurements.md`: three runs with `?perf=1` (clearing site data for that address between runs), the 10 second rotation check, five taps, five empty-space taps and five quick taps.
3. Commit the filled sheet (or paste the numbers in a message). Then the Phase 0 line in spec section 9 changes from "done except the phone gate" to "done" or "blocked".

If the phone fails, the cheapest fixes in order are: code-split the 1.26 MB JavaScript bundle, merge the static meshes to cut draw calls, switch the render loop from always to on demand, and last lower the bone detail again (a 0.12 bone ratio gives about 35,500 triangles instead of 48,429).

## Mesh source decision

**Mixed sources, and it works.**

| Source | License | What it supplies |
| --- | --- | --- |
| BodyParts3D | CC BY 4.0 | All bones (11 meshes), all 26 hip muscles (52 meshes with both sides), and the iliotibial tract (2 meshes). 33 targets. |
| Z-Anatomy | CC BY-SA 4.0 | 17 targets: the 3 required hip capsule ligaments, plus 14 optional (labrum, capsule, 3 bursae, 9 other ligaments including the knee cruciates and collaterals). |

The two sources sit in two separate files, so share-alike stays confined to `models/hip-z-anatomy.glb`. The BodyParts3D file stays CC BY 4.0.

**Alignment was the risk, and it is solved for the hip.** One global move left the femoral head centres about 8 mm apart. A per-side ICP fit (scale, rotation and shift for each side, using the hip bone and femur) brought the error to **1.7 mm on the left and 1.5 mm on the right** (**high**, measured on full resolution meshes). The limit was 5 mm. After decimation the bone surfaces move by up to a few millimetres, so the labrum and capsule may look a little looser than the numbers say (**medium**). The check pictures show nothing floating.

**Gaps in both sources:**

- Quadriceps tendon (required). Z-Anatomy only has a 49 face attachment patch.
- Patellar ligament (required). Z-Anatomy only has attachment patches of 53 and 43 faces.
- Psoas minor (optional).

**Other decisions:**

- The coccyx is part of the BodyParts3D sacrum mesh, so it cannot be picked on its own. It is not a gap.
- The two menisci are deferred to Phase 1, because the spec has no meniscus structure type.
- Knee ligaments were aligned with the hip fit only. They look right in a scratch render but nothing was measured at the knee (**medium**).

## Size

| Measure | Result | Budget |
| --- | --- | --- |
| Meshes | 99 (65 BodyParts3D, 34 Z-Anatomy) | none |
| Triangles | **48,429** | 150,000 |
| Model bytes, both files | **283,784** (234,228 and 49,556) | none |
| JavaScript bundle | 1.26 MB (345 kB gzipped) | none |
| Whole built site | 2.3 MB, of which 760 kB is the Draco decoder folder | none |

The region uses a third of its triangle budget. The bone decimation ratio was raised from 0.12 to 0.6 by controller ruling because the first export looked too coarse. That cost about 12,900 triangles and was easy to afford.

Models are small because Draco compression and aggressive decimation work well on BodyParts3D, whose raw OBJ files are 15.6 MB for the same structures. Extrapolating to the whole body from the hip is risky, because the hip is only a few percent of all structures (**low**).

## Knowledge base and the 11 rows

**Result:** the schema, the validator and 11 sourced rows work end to end. CI checks shape, references, load type rules and the model-to-structure mapping.

- 50 structures, 8 movements, 9 citations, 11 action rows. Every row has `checked_by` set to null, so none has been checked by a person.
- Coverage: 8 working rows, 2 stretched, 1 pinched. Role changes with joint angle are shown for the piriformis (primary external rotator from 0 to 45 degrees of flexion, secondary from 60 to 75, then a secondary internal rotator at 90 to 105) and the obturator externus (primary external rotator from 75 degrees).
- Every quote in a `says` field was compared with its source text in an automated review, not by a person. `checked_by` is still null on every row until a person checks it.

### How long it took and how hard sources were to find

Wall-clock time per row was not recorded, so I cannot give a measured figure. What the work log shows instead:

- **Source hunting dominated, not typing.** Nine sources were cited. Eight more papers and the OpenStax page were opened and not used. At least six hosts could not be reached or served a robot check: StatPearls, Europe PMC book pages, Open Oregon and other pressbooks, and for a while PubMed Central itself.
- **Plain working-muscle rows were fast.** A textbook table plus one paper covered the first five rows.
- **Angle-dependent rows were slow.** The piriformis and obturator rows needed the paper's data table, and a review found the first version claimed more than the table showed. A fix round split one row into two and added a second row. Estimate: an angle-dependent or stretched or pinched row costs about three times a plain working row (**low**).
- **Stretched and pinched sources are thin.** The two ligament rows rest on one review plus one cadaver study each. The labrum row is the only pinched row and is confidence low.
- **A workaround that worked:** when PubMed Central showed a robot check, the same article came from the Europe PMC REST API (`ebi.ac.uk/europepmc/webservices/rest/<PMCID>/fullTextXML`) in full text.
- **Open textbook coverage is shrinking.** See the OpenStax finding below.

## Surprises

1. **OpenStax Anatomy and Physiology 2e is no longer CC BY.** It now states CC BY-NC-SA and says the book may not be used to train or be ingested into large language models without written permission. The design leaned on it as a main source. Rows now cite the CC BY 4.0 remix by OERI on LibreTexts, which was adapted while OpenStax was still CC BY. **The owner should confirm this is acceptable.** (**high** that the page says this, **medium** that the remix is clean to use.)
2. **Sources corrected the plan's examples.** The piriformis role switch happens at about 75 to 90 degrees of flexion, not 60 to 90. Rows now follow the source. The labrum is pinched mainly in hips with pincer-type impingement, not in every hip.
3. **The data model cannot say "only in some hip shapes".** The labrum row is the clearest case. Without a field for it, rows either overclaim or stay at low confidence.
4. **The piriformis "primary up to 45 degrees" range is a judgment.** The study measured every 15 degrees and showed falling torque, but no source calls the muscle primary or secondary. It is flagged for physio review. The same goes for calling the piriformis a "secondary" internal rotator.
5. **Two cited papers are non-commercial.** Ito 2025 is CC BY-NC 4.0 and Groh 2009 is CC BY-NC (version not stated). We only quote a short sentence as evidence, which is probably fine, but the owner should decide the policy before v1.
6. **Some doc sites were unreachable from the build container:** vite.dev, the React Three Fiber and drei docs, docs.blender.org, glTF Transform and Ajv. The spec says to check current docs, so package-shipped README files, type definitions and local API introspection were used instead. The code runs and the tests pass, so the risk is small, but the owner can allow those hosts in the session network settings for next time (**medium** that nothing was missed).
7. **The Terminologia Anatomica CSV in Z-Anatomy has errors.** The posterior cruciate ligament has the wrong Latin term and several muscles only carry short forms. Latin names need a check before they are shown prominently.
8. **Gluteus medius is hard to tap from the back.** The gluteus maximus covers most of it and the visible part is small. This is a strong argument for peelable layers in Phase 1.
9. **Several things in the app are rough on purpose.** The canvas is blank while the model loads. The render loop always runs. There is no code splitting.

## Recommended changes

Before Phase 1 data work:

1. **Add a field to action rows for who it applies to** (for example hip shape), or a free note that the app can show. Do this before more rows exist, because adding it later means touching every row.
2. **Add a meniscus structure type** and export the two menisci from Z-Anatomy.
3. **Decide the two tendon gaps.** Options: draw simple tendon meshes by hand in Blender, leave them unclickable, or drop them from the required list. The patellar ligament matters for knee extension rows in Phase 2.
4. **Settle the license policy** for non-commercial evidence sources and for the OpenStax remix (see Surprises 1 and 5).
5. **Plan for borrowed textbooks.** Open sources cover the working muscles well and the ligaments and pinching badly. The spec already allows textbooks the owner provides.

Before or during Phase 1 app work:

6. Add a loading indicator, then code-split the bundle.
7. Build peelable layers early, since deep muscles are hard to tap.
8. Check the Latin names against Terminologia Anatomica.

## Estimate changes

All estimates assume part-time weekends. The spike showed the plumbing is cheaper than the plan feared and the data work is more expensive.

| Phase | Before | After | Confidence after | Why |
| --- | --- | --- | --- | --- |
| 0. Spike | 1 to 2 weekends (medium) | Done except the phone gate, pending owner measurement | n/a | Seven tasks finished. Phone measurement still to do. |
| 1. Hip atlas | 4 to 8 weekends (medium) | **3 to 6 weekends** | medium | Mesh pipeline, schema, validator, CI, credits screen, tap-to-name and 50 structure records already exist. Left to do: search, info panel, peelable layers, attachments, the two gaps and menisci. Rises back to the old range if the phone gate fails and the scene needs reworking. |
| 2. Movement explorer, area lookup, notebook | 1 to 3 months (low to medium) | **2 to 4 months** | low | The code is the easy part. Authoring cost is the risk. Eleven rows took repeated source searches and a review fix round. Stretched and pinched rows have thin open sources. A full hip needs many more rows than 11. A schema change for hip shape is also due. Physio review time is outside our control. |
| 3. Publish v1 | 1 to 2 weekends (medium) | unchanged | medium | Nothing in the spike changes it. License re-checks now have two known cases (OpenStax, non-commercial sources). |
| 4. Whole body | Months (low) | unchanged, low | low | The pipeline repeats per region and BodyParts3D covers bones and muscles broadly. Each region still needs alignment with Z-Anatomy for ligaments and its own data. Data authoring dominates, as in Phase 2. |
| 5 and 6 | unchanged | unchanged | low | The spike says nothing about them. |

## Files

- Mesh work: `docs/phase0/mesh-inventory.md`, `docs/phase0/mesh-source-decision.md`, `models/manifest.json`, `docs/phase0/export-check-front.png`, `docs/phase0/export-check-back.png`
- Phone gate: `docs/deploy-homelab.md`, `docs/phase0/phone-measurements.md`, `apps/web/scripts/perf-check.mjs`
- Viewer screenshot: `docs/phase0/screenshot-desktop.png`
- Data: `data/` (schema, structures, actions, citations)
