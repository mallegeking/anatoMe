# anatoMe Phase 1: hip atlas design

Date: 2026-11-03
Status: draft, waiting for review by the project owner
Builds on: `docs/superpowers/specs/2026-11-02-anatome-design.md` (the main spec, still the source of truth for everything not covered here), `docs/phase0/spike-report.md` and `docs/phase0/phase1-follow-ups.md`.

The owner asked for this design to be written straight from the existing app and plan, without a question round. Points marked **(builder's call)** were decided by Claude while writing it. The owner can overrule any of them. Confidence tags (**high**, **medium**, **low**) apply to technical claims and estimates.

---

## 1. Outcome

At the end of Phase 1 the owner can open anatoMe on the Galaxy A23 and, for any structure of the hip, pelvis and thigh down to the knee:

- find it by tapping it or by searching its English or Latin name
- peel away the layers in front of it so deep structures can be seen and tapped
- read what it is, where it attaches, and (once the physio has checked them) which hip movements use it and how

Phase 1 is done when the owner says it helps them understand their own hip (the gate from the main spec).

## 2. The review gate (owner's rule)

**No action row reaches the app until a person has checked it.** The owner asked for this to be a lasting rule, with the piriformis judgment call (primary external rotator up to 45 degrees of hip flexion, or only up to 30) as the first item for the physio to look at.

How the rule works:

- **Which rows:** every row that makes a claim about the body: action rows (what a movement does to a structure) and attachment rows (where a muscle starts and ends). Structure names and Latin terms are not gated. **(builder's call:** the owner named action data, attachments are gated too because they are also claims a reader will trust.**)**
- **The field:** each gated row has `checked_by` (null until checked) and `checked_on` (a date). `checked_by` holds a role label, not a person's name, for example `physio-1` or `owner`. Real names only go in with that person's consent, because the repo becomes public at Phase 3. **(builder's call)**
- **Who can check what:** action rows need a physio check. Attachment rows can be checked by the owner against the cited source, because they are plain textbook facts. **(builder's call)**
- **The normal build leaves unchecked rows out completely.** The data compile step (section 6) filters them before anything reaches `apps/web`. The app cannot show what it never receives. When a structure has unchecked rows, its info panel says that movement data for it is waiting for review, without showing the rows.
- **The review build** (`npm run build:review`) includes unchecked rows, marked clearly as drafts in a red banner and next to every row. It is only for the owner and the physio, served from the homelab, never published. It also has a review list screen (section 5.5).
- **Review questions:** a gated row can carry `review_note`, a question for the reviewer. The piriformis rows get one asking the 45 versus 30 degree question. Review notes show only in the review build.
- **CI enforces it:** a test builds the normal data bundle and fails if any row with `checked_by: null` is in it.

This rule is also added to the main spec, section 8, so it holds for every later phase and region.

## 3. Goals, non-goals, anti-goals

### Goals

- Search by English and Latin name, with results that select the structure and turn the camera to it.
- An info panel for the selected structure: names, type, side, attachments, and checked action rows with their sources.
- Peelable layers: hide whole tissue types, peel the outermost layer step by step, hide a single structure.
- Data for every hip muscle: attachments, and at least one working action row for each of its main actions, drafted from sources for the physio to check.
- The data model changes the spike asked for, made before more rows exist.
- The menisci added back to the model.
- The app follow-ups from Phase 0 that matter on the phone: loading message, smaller first download, visible educational line, the watchdog fix, a proper WebGL message.

### Non-goals (later phases)

- The movement explorer, joint-angle control, exercises, "tap where it hurts" and the symptom notebook (Phase 2).
- Showing what lies above and below a structure in words (Phase 2, needs the region map). Peelable layers cover the visual part in Phase 1.
- German or Shona text (Phase 4 and later). The language files stay ready for them.
- New body regions, simulation, video.

### Anti-goals

- **An unchecked claim on screen in the normal build.** Section 2 exists to prevent this.
- **Hiding uncertainty.** Confidence, angle conditions and "only in some hip shapes" notes must be visible next to the claim, not buried in sources.
- **A panel that reads like a diagnosis.** Wording stays "this muscle helps with", never "your pain comes from".
- **Losing the phone.** Every new screen must work one-handed on the A23 and keep the gate numbers (interactive within 5000 ms, no stutter).

## 4. Data model changes

All changes land before new rows are written, with validator rules and tests for each.

| Change | Detail |
| --- | --- |
| `checked_on`, `review_note` | Added to gated rows (section 2). `checked_on` is required when `checked_by` is set. |
| `applies_to` on action rows | Optional free text, shown next to the claim, for cases like "hips with pincer-type impingement" (spike recommendation 1). The labrum row moves its limit from the locator into this field. **(builder's call:** free text now, a structured field only if the same values keep repeating in Phase 2.**)** |
| `meniscus` structure type | New type. Load rule: stretched or pinched only, like the labrum. The two menisci are exported from Z-Anatomy and added to `structures/hip.yaml`. |
| `depth` on structures | Integer, 1 is the outermost layer. Drives layer peeling (section 5.3). Set by hand per structure, with a short source note for muscles. |
| Attachments | New file `data/attachments/hip.yaml`. One row per origin or insertion: `{id, muscle, end: origin or insertion, bone, landmark, citations, checked_by, checked_on}`. `bone` must be a bone structure id. `landmark` is plain text (for example "greater trochanter"), no landmark meshes in Phase 1. |
| Iliotibial tract type | Changes from `tendon` to a new type `fascia`. Load rule: stretched only. **(builder's call:** a fascial band never "works" on its own, the old type allowed that.**)** |

**Licence of quoted evidence (builder's call, owner can overrule):** the owner wants the data to be usable by anyone for anything. Verbatim quotes from non-commercial sources do not fit that. From Phase 1 on, `says` holds a verbatim quote only when the source's licence is compatible with CC BY 4.0. For other sources (for example Ito 2025 and Groh 2009, both CC BY-NC) `says` is our own short summary of what the source shows, and a new field `says_kind: quote | summary` tells a reader which one it is. The two existing rows are rewritten that way, and the carve-out line in `data/LICENSE` is removed once no non-compatible quotes are left. Citing a non-commercial source as evidence stays allowed.

**Tendon gaps (builder's call):** the quadriceps tendon and patellar ligament stay unclickable known gaps in Phase 1. Drawing them by hand would mean inventing geometry, which Phase 0 ruled out. Revisit in Phase 2, when knee extension rows need them. The info panel of the rectus femoris and vasti says in one line that their shared tendon is not modelled yet.

## 5. App

### 5.1 Layout on the phone

The current layout stays: the model fills the top, a panel sits below it and scrolls. Phase 1 adds a top bar with a search field and a layers button. The panel shows either the info for the selected structure or, with nothing selected, a short hint and the educational line. The educational line is visible by default, not only inside the collapsed credits. **(builder's call on the exact layout, within these rules:** nothing covers the model, one-handed use, no horizontal scroll at 360 px wide.**)**

### 5.2 Search

- Searches English names and Latin names, case and accent insensitive, matching from the start of each word, so "max" finds gluteus maximus and adductor magnus does not match "minimus".
- Results show the English name with the Latin name under it, and the type. Paired structures appear once, choosing a result selects the left side and the info panel offers a switch to the right side. **(builder's call)**
- Choosing a result selects the structure, turns the camera to it, and peels away anything in front of it (section 5.3) so it can be seen.
- Library choice is left to the builder (a small client-side index or a hand-written matcher both work for about 60 structures).

### 5.3 Peelable layers

Three controls, all in the layers panel:

- **Tissue toggles:** bones, muscles, ligaments and other soft tissue (capsule, labrum, bursae, menisci, fascia). Each can be shown or hidden.
- **Peel and restore:** "Peel a layer" hides the outermost visible muscle layer (by `depth`). "Restore" brings back the last peeled layer. A small label says how many layers are peeled.
- **Hide this:** in the info panel, hides just the selected structure. Hidden structures are listed in the layers panel with a "show" button.

Taps go through hidden structures. When search selects a deep structure, the app peels the layers above it automatically and says so in one line ("2 layers peeled to show obturator internus").

### 5.4 Info panel

For the selected structure, in this order:

1. English name, Latin name, type, side, and a switch to the other side for paired structures.
2. **Attachments** (muscles only): origin and insertion as plain text, for example "Starts at: the outer surface of the ilium. Ends at: the gluteal tuberosity of the femur."
3. **What it does at the hip:** checked action rows, grouped by movement. Each row shows the movement, the load type in plain words ("works", "is stretched", "is pinched"), the role ("main" or "helper" for working rows), the angle condition in words ("with the hip bent less than 45 degrees"), `applies_to` when set, and the confidence as a small label. Tapping a row opens its sources: title, authors, year, link, the locator and the `says` text (marked as quote or summary).
4. When the structure has rows waiting for review: one line, "More movement information for this structure is waiting for a physiotherapist's review."
5. For gaps: one line naming what is not modelled yet (for example the quadriceps tendon).

All text comes from `en.json`. Structure data comes from the compiled data bundle (section 6), not from the glTF extras, so the panel and the data checks can never disagree.

### 5.5 Review build

`npm run build:review` makes the same app with unchecked rows included and marked as drafts, plus a **review list** screen: every gated row that is not yet checked, grouped by structure, with its sources, quotes and review note, and a short code per row (the row id) that the reviewer can write down next to "ok", "change" or "remove". The owner then updates the YAML. The review build is served only from the homelab, using the same deploy guide with a different folder. **(builder's call:** the physio reviews in the app because seeing the structure helps, the owner records the result in YAML because the repo is the record.**)**

### 5.6 Phone and robustness follow-ups

From `docs/phase0/phase1-follow-ups.md`, these are part of Phase 1:

- A loading message while the model downloads, then split the JavaScript bundle so the first screen loads before the 3D code. The gate numbers must still pass.
- Mark the model ready when loading finishes, not on the first frame, so the watchdog cannot fire falsely in a background tab.
- A missing WebGL shows its own message.
- Align the tap thresholds for selecting and clearing (6 px for both).
- `frameloop="demand"` so the phone GPU rests when nothing moves.
- Declare `camera-controls` as a dependency, and add a build warning when the Draco skip plugin stops matching.

The remaining follow-ups (download script hardening, inventory doc fixes, `--whole-region` run) are done when the pipeline is next touched for the menisci, or left in the follow-ups file.

## 6. Data compile step

A new command `npm run build-data` (run automatically before `dev`, `build` and `build:review`) turns the YAML into one JSON file per region for the app, for example `apps/web/public/data/hip.json`. It holds structures, attachments, action rows with their citations, and movements. It runs the validator first and stops on any error.

- Normal mode leaves out every gated row with `checked_by: null`, and the `review_note` field.
- Review mode keeps them and marks each with `draft: true`.
- A test in CI compiles in normal mode and fails if any draft row is present (section 2).
- The compiled JSON is a build output and is git-ignored.

## 7. Data work in Phase 1

- **Attachments** for all 26 hip muscles (both ends, so about 55 rows counting the two heads of biceps femoris), from the CC BY 4.0 OERI Human Anatomy text and open-access papers. Checked by the owner against the source.
- **Action rows:** at least one working row for each main action of each hip muscle, about 30 to 40 new rows, drafted from open sources the same way as in Phase 0. Stretched and pinched rows only where an open source supports them. If the owner borrows textbooks, rows can cite them (the spec already allows sources the owner provides).
- **Physio review:** the owner takes the review build to the physio. First item: the piriformis 45 versus 30 degree question. Rows the physio rejects are fixed or removed, then marked checked.
- **Latin names** checked against Terminologia Anatomica, with the posterior cruciate ligament fixed.

Writing rows is the slow part (spike report). The plan should let app work and data work run side by side.

## 8. Testing and CI

- Unit tests (Vitest) for search matching, layer peeling, the info panel text (angle conditions in words, load and role words), the data compile filter and every new validator rule.
- One browser test (Playwright, now a dev dependency of `apps/web` so it runs in CI): open the app, search "piriformis", check that layers were peeled and the info panel shows the name and the waiting-for-review line, then open the credits. **(builder's call:** Phase 0 kept Playwright out of the repo. A real end-to-end test in CI is now worth the extra dependency.**)**
- The existing `perf-check.mjs` and `error-check.mjs` keep passing. The phone gate is measured again by the owner at the end of Phase 1 with the same sheet.

## 9. Effort

3 to 6 weekends for the app and data model (medium, from the spike report). The physio review and row writing run alongside and depend on the physio's time (low confidence on timing). If the owner reviews attachments as they come in, Phase 1 can close without waiting for every action row to be checked: the gate is about the owner understanding their hip, and the panel works with whatever rows are checked.

## 10. Left to the builder

- Search library, state management and component structure.
- Exact panel layout and styling, within section 5.1.
- How the camera turns to a structure.
- The review list's exact form.
- Which open sources to use for each row, within the citation rules.

## 11. Open items

- The licence of quoted evidence (section 4) is a builder's call the owner may want to change.
- Whether attachments need a physio check too, or the owner's check against the source is enough (section 2).
- How the physio is credited in the repo, if at all (needs her consent).
