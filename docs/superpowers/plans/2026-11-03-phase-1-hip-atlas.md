# anatoMe Phase 1 Hip Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Phase 0 tap-to-name viewer into a hip atlas with search, peelable layers and an info panel fed by a compiled, review-gated knowledge base, and add the attachment and action data for every hip muscle.

**Architecture:** The YAML in `data/` gains the fields the design asks for and is compiled by a new `build-data` command into one JSON bundle per region (`apps/web/public/data/hip.json`). The normal compile leaves out every unchecked row, a review compile keeps them as drafts. The app reads that bundle for everything it shows about a structure, and keeps using the glTF extras only to know which mesh was tapped.

**Tech Stack:** As Phase 0: Node 22, npm workspaces, TypeScript, Vite 8, React 19, React Three Fiber 9, drei 10, three 0.187, Vitest, Ajv, `yaml`, glTF Transform, Python 3.13 with pytest, Blender 5.2.3. New: `@playwright/test` as a dev dependency of `apps/web`.

**Spec:** `docs/superpowers/specs/2026-11-03-phase-1-hip-atlas-design.md` (the Phase 1 design, read it fully before any task) and `docs/superpowers/specs/2026-11-02-anatome-design.md` (main spec, sections 2, 3, 6 and 8).

## Global Constraints

- Docs and code comments: plain language, no em dashes, no semicolons. Comments short and friendly, for an owner who reads code but did not write it.
- Review gate: no action row or attachment row with `checked_by: null` may reach the normal app build. Unchecked rows appear only in the review build, marked as drafts.
- `checked_by` holds a role label (`owner`, `physio-1`), never a person's name. `checked_on` (ISO date) is required when `checked_by` is set.
- Every new row cites a source the author opened during the task. `says` is a verbatim quote only when the source licence is compatible with CC BY 4.0 (`says_kind: quote`), otherwise our own short summary (`says_kind: summary`). Nothing from memory.
- All user-facing app text comes from `apps/web/src/i18n/en.json`. Wording stays educational ("helps with"), never diagnostic.
- No external network requests from the app at runtime. The Draco decoder stays self-hosted.
- Phone gate stays met: interactive within 5000 ms (median) on the Galaxy A23, no stutter when rotating. `node apps/web/scripts/perf-check.mjs` median under 5000 ms and `node apps/web/scripts/error-check.mjs` passing are the automated proxies.
- Layout: nothing covers the 3D model, one-handed use, no horizontal scroll at 360 px wide.
- Mesh licences stay per file: BodyParts3D files CC BY 4.0, Z-Anatomy files CC BY-SA 4.0. Never import the Z-Anatomy inner ear, kidney or brain white matter parts.
- Nothing private in the repo: no hostnames, Tailscale names, IPs, keys, symptom data or reviewer names.
- Check current official docs (or the docs shipped inside installed packages when a site is unreachable) before using an API you have not used in this repo yet.
- Existing checks stay green: `npm run validate`, `npm run check-models`, `npm test`, `npm run test:py`, `npm run build`.

## Review Focus

1. A structure with no movement rows at all (a bone, or a muscle with nothing checked and nothing waiting) must show no empty "What it does" heading and no waiting-for-review line. Test in Task 4 (`InfoPanel`).
2. Searching for a structure that is peeled or hidden must make it visible again, also when it is superficial and deeper layers were peeled around it. Test in Task 6 (`revealFor`).
3. Unpaired structures (sacrum) must not offer a side switch, and a paired structure's switch must land on the other side's mesh. Test in Task 4 (`InfoPanel`) and Task 6 (`selectBySearch`).
4. The normal build must never contain a draft row, even if someone runs `build-data --review` by mistake before `npm run build`. Test in Task 3 (`build` script order) and the CI check.
5. A tap that lands only on hidden meshes must select the nearest visible mesh behind them, or nothing. Test in Task 5 (`pickVisibleHit`).

---

## File Structure

```
data/
├── schema/*.schema.json            # updated (Task 1), attachments.schema.json new
├── structures/hip.yaml             # depth added (Task 1), menisci and fascia type (Task 2)
├── attachments/hip.yaml            # new (Task 10)
├── actions/hip.yaml                # migrated (Task 1), new rows (Task 11)
└── citations.yaml
pipeline/data/src/
├── validate.ts                     # new rules (Task 1)
├── compile.ts                      # new: YAML to region bundle (Task 3)
└── cli.ts                          # new command build-data (Task 3)
apps/web/src/
├── data/bundle.ts                  # bundle types, the single definition (Task 3)
├── data/useRegionData.ts           # loads public/data/<region>.json (Task 4)
├── data/describe.ts                # condition, load and role in words (Task 4)
├── ui/InfoPanel.tsx                # replaces InfoLabel for a selection (Task 4)
├── ui/TopBar.tsx                   # search field and layers button (Task 6)
├── layers/layers.ts                # pure layer state (Task 5)
├── layers/LayersPanel.tsx          # (Task 5)
├── search/search.ts                # pure matcher (Task 6)
├── search/SearchResults.tsx        # (Task 6)
├── review/ReviewBanner.tsx, review/ReviewList.tsx   # (Task 7)
└── viewer/*                        # selection by {sid, side}, visibility, camera focus
apps/web/e2e/atlas.spec.ts          # (Task 9)
```

---

### Task 1: Data model changes and migration

**Files:**
- Modify: `data/schema/actions.schema.json`, `data/schema/structures.schema.json`, `pipeline/data/src/validate.ts`, `data/actions/hip.yaml`, `data/structures/hip.yaml`, `data/LICENSE`, `ATTRIBUTION.md`
- Create: `data/schema/attachments.schema.json`, fixtures under `pipeline/data/test/fixtures/`
- Test: `pipeline/data/test/validate.test.ts`

**Interfaces:**
- Produces (YAML shapes):
  - Action row adds `applies_to?: string`, `review_note?: string`, `checked_on?: string (YYYY-MM-DD)`. Each citation adds `says_kind: quote | summary` (required).
  - Structure adds `depth: integer >= 1` (required, 1 is outermost) and `depth_note?: string`.
  - Structure `type` enum adds `meniscus` and `fascia`. Load rules: `meniscus` stretched or pinched, `fascia` stretched only.
  - Attachment row (file `data/attachments/<region>.yaml`): `{id, muscle, end: origin | insertion, bone, landmark, citations: [{ref, locator, says, says_kind}], checked_by, checked_on?}`. `muscle` must be a muscle structure, `bone` a bone structure.
  - `validateDataDir` also reads `data/attachments/*.yaml` when the folder exists.

- [ ] **Step 1: Write the failing tests**, one fixture folder per case copied from `valid/` with one change:

```ts
test("checked_by set needs checked_on", () => expectError(fx("checked-no-date"), /checked_on is required when checked_by is set/));
test("checked_on must be a date", () => expectError(fx("bad-date"), /checked_on/));
test("citation needs says_kind", () => expectError(fx("no-says-kind"), /says_kind/));
test("meniscus cannot be working", () => expectError(fx("meniscus-working"), /load must be stretched or pinched for type meniscus/));
test("fascia can only be stretched", () => expectError(fx("fascia-pinched"), /load must be stretched for type fascia/));
test("structure needs depth", () => expectError(fx("no-depth"), /depth/));
test("attachment muscle must be a muscle", () => expectError(fx("attachment-on-bone"), /muscle must be a structure of type muscle/));
test("attachment bone must be a bone", () => expectError(fx("attachment-to-muscle"), /bone must be a structure of type bone/));
test("attachment needs a citation", () => expectError(fx("attachment-no-citation"), /at least one citation/));
test("duplicate id across actions and attachments", () => expectError(fx("duplicate-across"), /duplicate id/));
test("valid fixture with attachments passes", () => expect(validateDataDir(fx("valid")).ok).toBe(true));
```

Also add the missing Phase 0 cases: `capsule-working`, `bursa-working`, `bone-in-actions`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w pipeline/data`
Expected: the new tests FAIL.

- [ ] **Step 3: Implement the schema and validator changes.** Keep error messages in the wording the tests match.
- [ ] **Step 4: Migrate the real data**
  - Add `says_kind` to every citation in `data/actions/hip.yaml`. Rows citing `ito-2025` or `groh-2009` (both CC BY-NC) get `says` rewritten as our own short summary of the same evidence, `says_kind: summary`. Open the sources again (Europe PMC full text works when PMC shows a CAPTCHA) and keep every number unchanged.
  - Labrum row: move the "pincer-type impingement" limit from its locator into `applies_to`.
  - Both piriformis rotation rows get `review_note: "Physio: is piriformis a main external rotator up to 45 degrees of hip flexion, or only up to 30? Ito 2025 Table 2 shows obturator externus larger from 45 degrees."` (the external rotation 0 to 45 row) and a matching note on the 60 to 75 row.
  - Add `depth` to all 50 structures: bones 4, deep muscles and joint structures 3, middle layer 2, outermost 1. Muscle depths follow the layer order in the OERI Human Anatomy text (CC BY 4.0) or another open source, recorded in `depth_note` for muscles. Ligaments, capsule, labrum and bursae get the depth of the layer they sit in.
  - Once no non-compatible quote is left, remove the carve-out line from `data/LICENSE` and the matching sentence in `ATTRIBUTION.md`.
- [ ] **Step 5: Verify**

Run: `npm test -w pipeline/data && npm run validate && npm run check-models`
Expected: all pass. `grep -c "says_kind" data/actions/hip.yaml` equals the number of citations.

- [ ] **Step 6: Commit**

```bash
git add data pipeline/data ATTRIBUTION.md
git commit -m "Extend the data model for review dates, notes, depth, menisci, fascia and attachments"
```

---

### Task 2: Menisci, iliotibial tract type and glb credit lines

**Files:**
- Modify: `pipeline/assets/regions/hip.json`, `pipeline/assets/build_region_blender.py`, `data/structures/hip.yaml`, `models/hip.glb`, `models/hip-z-anatomy.glb`, `docs/phase0/mesh-source-decision.md` (dated note), `docs/phase0/phase1-follow-ups.md`

**Interfaces:**
- Consumes: the `meniscus` and `fascia` types from Task 1.
- Produces: structures `medial-meniscus` and `lateral-meniscus` (type `meniscus`, source z-anatomy, both sides), `iliotibial-tract` with type `fascia` in both `hip.json` and `structures/hip.yaml`, and the glb extras `kind` matching. Every glb's `asset.copyright` holds that file's credit text from `ATTRIBUTION.md`.

- [ ] **Step 1: Update `hip.json`** with the two meniscus targets (patterns matching Z-Anatomy `Medial meniscus` and `Lateral meniscus`, `required: false`, `source: "z-anatomy"`) and `iliotibial-tract` type `fascia`.
- [ ] **Step 2: Add `export_copyright`** to the glTF export call in `build_region_blender.py`, value from a per-source constant holding the verbatim credit texts (BodyParts3D and Z-Anatomy, see `ATTRIBUTION.md`).
- [ ] **Step 3: Re-export both files** with the Phase 0 commands (Blender and sources must be present, run `bash pipeline/get-blender.sh && bash pipeline/fetch-sources.sh` first if not).

Run: `tools/blender/blender -b --factory-startup -P pipeline/assets/build_region_blender.py -- --region hip --source bp3d --out models/hip.glb` and the same with `--source z-anatomy --out models/hip-z-anatomy.glb`
Expected: residuals still 5 mm or less on both sides, TOTAL at or under 150000, `WROTE` for both files.

- [ ] **Step 4: Add both menisci to `structures/hip.yaml`** (Latin from TA2.csv when correct, `depth: 3`).
- [ ] **Step 5: Verify**

Run: `npm run validate && npm run check-models && npm run test:py`
Expected: all pass, check-models reports 52 structures. A short standard-library script confirms `asset.copyright` in both glb JSON chunks.

- [ ] **Step 6: Commit**

```bash
git add pipeline/assets models data docs/phase0
git commit -m "Add the menisci, type the iliotibial tract as fascia and credit each glb"
```

---

### Task 3: Data compile step and the review gate in CI

**Files:**
- Create: `apps/web/src/data/bundle.ts`, `pipeline/data/src/compile.ts`, `pipeline/data/test/compile.test.ts`, `scripts/check-no-drafts.mjs`
- Modify: `pipeline/data/src/cli.ts`, root `package.json`, `apps/web/package.json`, `.gitignore`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the YAML shapes from Task 1.
- Produces:
  - `bundle.ts` (types only, the one definition both sides use, `compile.ts` imports it type-only):
    - `RegionBundle = {region: string, mode: "normal" | "review", structures: BundleStructure[], movements: BundleMovement[], attachments: BundleAttachment[], actions: BundleAction[], citations: BundleCitation[], pendingByStructure: Record<string, number>}`
    - `BundleStructure = {id, type, english, latin?, depth}`, `BundleMovement = {id, english, dof, direction}`, `BundleAttachment = {id, muscle, end, bone, landmark, citations: BundleCitationUse[], draft: boolean}`, `BundleAction = {id, structure, movement, load, role?, when?, applies_to?, confidence, citations: BundleCitationUse[], draft: boolean, review_note?}`, `BundleCitationUse = {ref, locator, says, says_kind}`, `BundleCitation = {id, title, authors, year, url, license}`.
  - `compileRegion(dataDir: string, region: string, mode: "normal" | "review"): RegionBundle`. Normal mode drops every gated row with `checked_by: null` and every `review_note`, and counts the dropped action rows per structure in `pendingByStructure`. Review mode keeps them with `draft: true`. Citations are limited to the ones used.
  - CLI: `tsx pipeline/data/src/cli.ts build-data <dataDir> <outDir> [--review]`, validates first, writes `<outDir>/<region>.json` per region, exits 1 on any validation error.
  - Root scripts: `build-data` (normal, out `apps/web/public/data`), `build-data:review`. Web scripts: `predev` and `prebuild` run `sync-models` then root `build-data` (normal), new `build:review` runs sync-models, `build-data:review`, `tsc -b`, `vite build --mode review --outDir dist-review`. `apps/web/public/data/` and `apps/web/dist-review/` are git-ignored.

- [ ] **Step 1: Write the failing tests** in `compile.test.ts` against the Task 1 `valid` fixture extended with one checked and one unchecked action row and one unchecked attachment:

```ts
test("normal mode drops unchecked rows", () => expect(compileRegion(fx("valid"), "hip", "normal").actions.every(a => !a.draft)).toBe(true));
test("normal mode counts pending rows per structure", () => expect(compileRegion(fx("valid"), "hip", "normal").pendingByStructure["piriformis"]).toBe(1));
test("normal mode drops review notes", () => expect(JSON.stringify(compileRegion(fx("valid"), "hip", "normal"))).not.toContain("review_note"));
test("normal mode drops unchecked attachments", () => expect(compileRegion(fx("valid"), "hip", "normal").attachments.every(a => !a.draft)).toBe(true));
test("review mode keeps drafts", () => expect(compileRegion(fx("valid"), "hip", "review").actions.some(a => a.draft)).toBe(true));
test("only used citations are included", () => expect(compileRegion(fx("valid"), "hip", "normal").citations.map(c => c.id)).toEqual(["used-source"]));
test("the real data compiles with no drafts in normal mode", () => expect(compileRegion(realDataDir, "hip", "normal").actions.some(a => a.draft)).toBe(false));
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w pipeline/data`
Expected: FAIL, `compileRegion` not found.

- [ ] **Step 3: Implement `bundle.ts`, `compile.ts`, the CLI command and the scripts.**
- [ ] **Step 4: Add a CI step** after "Build the app" running `node scripts/check-no-drafts.mjs`, which reads `apps/web/public/data/hip.json` and fails if any row has `draft: true` or the file contains `review_note`. This also catches a review compile left in place, because `prebuild` always recompiles in normal mode first.
- [ ] **Step 5: Verify**

Run: `npm test -w pipeline/data && npm run build && node scripts/check-no-drafts.mjs && npm run build:review -w apps/web`
Expected: all pass, `apps/web/dist/data/hip.json` has no drafts, `apps/web/dist-review/data/hip.json` has drafts.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/data/bundle.ts pipeline/data package.json apps/web/package.json .gitignore .github scripts
git commit -m "Compile the knowledge base into a review-gated region bundle"
```

---

### Task 4: Info panel

**Files:**
- Create: `apps/web/src/data/useRegionData.ts`, `apps/web/src/data/describe.ts`, `apps/web/src/ui/InfoPanel.tsx`, tests next to each
- Modify: `apps/web/src/App.tsx`, `apps/web/src/viewer/Viewer.tsx`, `apps/web/src/viewer/RegionModel.tsx`, `apps/web/src/viewer/pick.ts`, `apps/web/src/i18n/en.json`
- Delete: `apps/web/src/ui/InfoLabel.tsx` (replaced)

**Interfaces:**
- Consumes: `RegionBundle` (Task 3), `PickedStructure` from `pick.ts`.
- Produces:
  - `Selection = {sid: string, side: "l" | "r" | ""}`. The viewer takes `selection: Selection | null` and `onSelect(sel: Selection | null)`. Highlight applies to the mesh with that sid and side.
  - `useRegionData(region: string): RegionBundle` (suspends, throws into `ModelErrorBoundary` on failure, fetches `BASE_URL + "data/" + region + ".json"`).
  - `describeCondition(when: BundleAction["when"], t: Translate): string`, `loadWord(load, t)`, `roleWord(role, t)`.
  - `InfoPanel({selection, bundle, t, onSwitchSide, onHide})`.
  - New en.json keys (exact text): `info.latin` "Latin: {latin}", `info.attachments` "Where it attaches", `info.origin` "Starts at: {landmark} of the {bone}", `info.insertion` "Ends at: {landmark} of the {bone}", `info.does` "What it does at the hip", `load.working` "works", `load.stretched` "is stretched", `load.pinched` "is pinched", `role.primary` "main", `role.secondary` "helper", `when.between` "with {angle} between {min} and {max} degrees", `angle.hip.flexion` "the hip bent", `angle.hip.abduction` "the hip spread out", `angle.hip.rotation` "the hip turned", `angle.knee.flexion` "the knee bent", `info.appliesTo` "Only in: {text}", `confidence.high` "well supported", `confidence.medium` "supported by one study or angle-dependent", `confidence.low` "uncertain", `info.sources` "Sources", `source.quote` "Quote", `source.summary` "Summary in our words", `info.pending` "More movement information for this structure is waiting for a physiotherapist's review.", `info.gap.quadriceps` "The shared tendon of the quadriceps muscles is not modelled yet.", `info.switchSide` "Show the other side", `info.hide` "Hide this".

- [ ] **Step 1: Write the failing tests**

```ts
// describe.test.ts
test("one range", () => expect(describeCondition([{angle: "hip.flexion", min: 0, max: 45}], t)).toBe("with the hip bent between 0 and 45 degrees"));
test("two ranges join with and", () => expect(describeCondition([{angle: "hip.flexion", min: 0, max: 60}, {angle: "hip.rotation", min: 0, max: 30}], t)).toBe("with the hip bent between 0 and 60 degrees and with the hip turned between 0 and 30 degrees"));
test("no condition gives empty text", () => expect(describeCondition(undefined, t)).toBe(""));

// InfoPanel.test.tsx (bundle fixture with piriformis: 1 checked row, 1 pending, femur: none, sacrum unpaired)
test("shows English and Latin names", ...expects "Piriformis" and "Latin: Musculus piriformis");
test("groups checked rows by movement with load and role words", ...expects "works", "main");
test("shows the waiting line when rows are pending", ...expects en["info.pending"]);
test("a bone with no rows shows no does-heading and no waiting line", ...expects queryByText(en["info.does"]) null and queryByText(en["info.pending"]) null);
test("unpaired structure has no side switch", ...sacrum: queryByText(en["info.switchSide"]) null);
test("paired structure switch calls onSwitchSide", ...);
test("sources open on tap and mark quote or summary", ...);
test("rectus femoris shows the quadriceps tendon gap line", ...);
test("normal bundle never renders a review note", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement** the hook, helpers and panel, then switch `App`, `Viewer` and `RegionModel` to `Selection`. Names come from the bundle, not from glb extras. A tapped mesh whose sid is missing from the bundle shows its glb label and no data sections.
- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Add the info panel fed by the compiled region bundle"
```

---

### Task 5: Peelable layers

**Files:**
- Create: `apps/web/src/layers/layers.ts`, `apps/web/src/layers/layers.test.ts`, `apps/web/src/layers/LayersPanel.tsx`, `apps/web/src/layers/LayersPanel.test.tsx`
- Modify: `apps/web/src/viewer/RegionModel.tsx`, `apps/web/src/viewer/pick.ts`, `apps/web/src/App.tsx`, `apps/web/src/i18n/en.json`

**Interfaces:**
- Consumes: `BundleStructure.depth` and `type` (Task 3), `Selection` (Task 4).
- Produces:
  - `TissueGroup = "bone" | "muscle" | "soft"` (`soft` covers ligament, capsule, labrum, bursa, meniscus, fascia, tendon), `tissueOf(type: string): TissueGroup`.
  - `LayerState = {hiddenTissues: Set<TissueGroup>, peeledDepths: number[], hiddenIds: Set<string>}`, `initialLayers(): LayerState`.
  - `peel(state, structures): LayerState` hides the smallest visible muscle depth, `restore(state): LayerState` undoes the last peel, `hideStructure(state, id)`, `showStructure(state, id)`, `toggleTissue(state, group)`, `isVisible(state, structure): boolean`.
  - `pickVisibleHit(hits: Hit[], isVisibleSid: (sid: string) => boolean): PickedHit | null` in `pick.ts`.
  - en.json keys: `layers.title` "Layers", `layers.bone` "Bones", `layers.muscle` "Muscles", `layers.soft` "Ligaments and other soft tissue", `layers.peel` "Peel a layer", `layers.restore` "Restore", `layers.peeledCount` "{count} layers peeled", `layers.hidden` "Hidden", `layers.show` "Show".

- [ ] **Step 1: Write the failing tests**

```ts
test("peel hides the outermost visible muscle layer", () => { const s = peel(initialLayers(), fixture); expect(isVisible(s, gluteusMaximus)).toBe(false); expect(isVisible(s, gluteusMedius)).toBe(true); });
test("peel twice then restore once", () => { const s = restore(peel(peel(initialLayers(), fixture), fixture)); expect(s.peeledDepths).toEqual([1]); });
test("peel never hides bones", () => expect(isVisible(peel(peel(peel(initialLayers(), fixture), fixture), fixture), femur)).toBe(true));
test("hide one structure", () => expect(isVisible(hideStructure(initialLayers(), "piriformis"), piriformis)).toBe(false));
test("tissue toggle hides soft tissue", () => expect(isVisible(toggleTissue(initialLayers(), "soft"), iliofemoralLigament)).toBe(false));
test("tap skips hidden meshes", () => expect(pickVisibleHit([{object: maxMesh, distance: 1}, {object: medMesh, distance: 2}], sid => sid !== "gluteus-maximus")?.structure.sid).toBe("gluteus-medius"));
test("tap on only hidden meshes picks nothing", () => expect(pickVisibleHit([{object: maxMesh, distance: 1}], () => false)).toBeNull());
test("panel shows the peeled count and lists hidden structures with a show button", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL.

- [ ] **Step 3: Implement** the pure module, the panel (opened from a layers button) and the viewer wiring: set `mesh.visible` from `isVisible`, use `pickVisibleHit` in the click handler, and wire `onHide` from the info panel.
- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Add peelable layers, tissue toggles and hide this"
```

---

### Task 6: Search and camera focus

**Files:**
- Create: `apps/web/src/search/search.ts`, `apps/web/src/search/search.test.ts`, `apps/web/src/search/SearchResults.tsx`, `apps/web/src/ui/TopBar.tsx`, tests
- Modify: `apps/web/src/App.tsx`, `apps/web/src/viewer/Viewer.tsx`, `apps/web/src/layers/layers.ts`, `apps/web/src/i18n/en.json`

**Interfaces:**
- Consumes: `RegionBundle` (Task 3), `Selection` (Task 4), `LayerState` (Task 5).
- Produces:
  - `searchStructures(query: string, structures: BundleStructure[]): BundleStructure[]`: case and accent insensitive, every query word must match the start of a word in the English or Latin name, results ordered English-name matches first then alphabetically, at most 8.
  - `revealFor(state: LayerState, target: BundleStructure, structures: BundleStructure[]): {state: LayerState, peeledNow: number}` in `layers.ts`: shows the target's tissue, unhides it, restores peels at or deeper than its depth, and peels shallower muscle layers that cover it.
  - `selectBySearch(id: string, bundle: RegionBundle): Selection` picks side `"l"` for paired structures (mesh with side l exists), `""` for unpaired.
  - Viewer prop `focus: Selection | null`: the camera moves to frame that mesh's bounding box (drei camera controls `fitToBox` or equivalent, check the installed version's API).
  - en.json keys: `search.placeholder` "Search, for example piriformis", `search.none` "No structure found", `search.peeled` "{count} layers peeled to show {name}".

- [ ] **Step 1: Write the failing tests**

```ts
test("prefix of a word matches", () => expect(names(searchStructures("max", hip))).toContain("Gluteus maximus"));
test("does not match inside a word", () => expect(names(searchStructures("imus", hip))).toEqual([]));
test("two words both must match", () => expect(names(searchStructures("glut med", hip))).toEqual(["Gluteus medius"]));
test("Latin name matches", () => expect(names(searchStructures("musculus pirif", hip))).toEqual(["Piriformis"]));
test("accents and case ignored", () => expect(names(searchStructures("GLUTÉUS", hip)).length).toBe(3));
test("magnus does not return minimus", () => expect(names(searchStructures("adductor mag", hip))).toEqual(["Adductor magnus"]));
test("reveal a deep muscle peels the layers above", () => expect(revealFor(initialLayers(), obturatorInternus, hip).peeledNow).toBe(2));
test("reveal a superficial muscle restores peeled layers", () => { const peeled = peel(peel(initialLayers(), hip), hip); expect(isVisible(revealFor(peeled, gluteusMaximus, hip).state, gluteusMaximus)).toBe(true); });
test("reveal shows a hidden tissue group", () => expect(isVisible(revealFor(toggleTissue(initialLayers(), "soft"), iliofemoralLigament, hip).state, iliofemoralLigament)).toBe(true));
test("search selection of a paired structure picks the left side", () => expect(selectBySearch("piriformis", bundle)).toEqual({sid: "piriformis", side: "l"}));
test("search selection of the sacrum has no side", () => expect(selectBySearch("sacrum", bundle)).toEqual({sid: "sacrum", side: ""}));
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL.

- [ ] **Step 3: Implement** the matcher, `revealFor`, `selectBySearch`, the top bar (search field plus layers button) and the results list, and camera focus in the viewer. Choosing a result selects, reveals, focuses and shows the `search.peeled` line when `peeledNow > 0`.
- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "Add search with camera focus and automatic peeling"
```

---

### Task 7: Review build

**Files:**
- Create: `apps/web/src/review/ReviewBanner.tsx`, `apps/web/src/review/ReviewList.tsx`, tests
- Modify: `apps/web/src/App.tsx`, `apps/web/src/ui/InfoPanel.tsx`, `apps/web/src/i18n/en.json`, `docs/deploy-homelab.md`

**Interfaces:**
- Consumes: `RegionBundle.mode`, `draft`, `review_note` (Task 3), `InfoPanel` (Task 4).
- Produces:
  - Review UI shows only when `bundle.mode === "review"`. No URL parameter or setting can turn it on in a normal build.
  - `ReviewBanner` (always visible at the top in review mode), draft rows in `InfoPanel` marked with `review.draft` and their review note, `ReviewList` screen grouped by structure listing every draft action and attachment with its id, sources and review note.
  - en.json keys: `review.banner` "Review build. Rows marked draft have not been checked yet. Do not share this version.", `review.draft` "Draft, not yet checked", `review.list` "Review list", `review.note` "Question for the reviewer: {note}", `review.rowId` "Row code: {id}".

- [ ] **Step 1: Write the failing tests**

```ts
test("normal bundle shows no banner and no review list button", ...);
test("review bundle shows the banner", ...expects en["review.banner"]);
test("draft rows are marked and show their review note", ...expects en["review.draft"] and the piriformis note text);
test("review list groups drafts by structure and shows row codes", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL.

- [ ] **Step 3: Implement**, then add a "Review build" section to `docs/deploy-homelab.md`: build with `npm run build:review -w apps/web`, copy `apps/web/dist-review/` to a separate folder on the homelab (for example `/srv/anatome-review`), serve it on a different HTTPS port with `tailscale serve --bg --https=8443 /srv/anatome-review` (check the current Tailscale docs for the flag), and how the owner records the physio's answers (`checked_by: physio-1`, `checked_on`, edit or delete the row). Name the piriformis question as the first item to ask.
- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web && npm run build:review -w apps/web && npm run build && node scripts/check-no-drafts.mjs`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web docs/deploy-homelab.md
git commit -m "Add the review build with draft markers and a review list"
```

---

### Task 8: Phone and robustness follow-ups

**Files:**
- Modify: `apps/web/src/viewer/Viewer.tsx`, `apps/web/src/viewer/RegionModel.tsx`, `apps/web/src/viewer/useLoadWatchdog.ts`, `apps/web/src/viewer/ModelErrorBoundary.tsx`, `apps/web/src/viewer/pick.ts`, `apps/web/src/App.tsx`, `apps/web/src/ui/Credits.tsx`, `apps/web/vite.config.ts`, `apps/web/package.json`, `apps/web/src/i18n/en.json`, `docs/phase0/phase1-follow-ups.md`
- Test: tests next to the changed files

**Interfaces:**
- Produces: en.json keys `error.webgl` "This browser cannot show 3D graphics. Try another browser or turn on hardware acceleration." The existing `loading.model` is shown while the model loads.

- [ ] **Step 1: Write the failing tests**

```ts
test("loading text shows while the model suspends", ...expects en["loading.model"]);
test("watchdog is satisfied when loading finishes, not on the first frame", ...);
test("a WebGL failure shows the WebGL message, not the connection message", ...);
test("empty-space clear uses the same 6 px rule as selecting", () => expect(shouldClear(5)).toBe(true));
test("educational line is visible without opening credits", ...expects en["about.educational"] visible);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL.

- [ ] **Step 3: Implement**: loading fallback outside the canvas, lazy-load the 3D viewer module so the first screen renders before three.js arrives, mark ready in the loader's completion path, a WebGL check before creating the canvas, `shouldClear(dragPx)` with the 6 px rule replacing `onPointerMissed`, `frameloop="demand"` with invalidation on control changes, selection and layer changes, `camera-controls` in `dependencies`, a `this.warn` in the Draco skip plugin when nothing was replaced. Tick the matching lines in `phase1-follow-ups.md`.
- [ ] **Step 4: Verify**

Run: `npm test -w apps/web && npm run build && node apps/web/scripts/perf-check.mjs && node apps/web/scripts/error-check.mjs`
Expected: all pass, perf median under 5000 ms, error-check 3 of 3.

- [ ] **Step 5: Commit**

```bash
git add apps/web docs/phase0/phase1-follow-ups.md
git commit -m "Load faster on phones, rest the GPU and handle WebGL and background tabs"
```

---

### Task 9: End-to-end test in CI

**Files:**
- Create: `apps/web/e2e/atlas.spec.ts`, `apps/web/playwright.config.ts`
- Modify: `apps/web/package.json` (`@playwright/test` dev dependency, script `e2e`), `.github/workflows/ci.yml`, `README.md`

**Interfaces:**
- Consumes: the built app (`npm run build`), en.json texts.

- [ ] **Step 1: Write the test** `atlas.spec.ts` at a 412 x 915 viewport against `vite preview`: type "piriformis" in search, choose the result, expect the info panel heading "Piriformis", expect the `search.peeled` line, expect `info.pending` (piriformis rows are unchecked), open credits and expect `about.educational`, and expect no request to any host other than the preview server.
- [ ] **Step 2: Configure** Playwright with a `webServer` that runs the preview. In this container launch Chromium from `/opt/pw-browsers/chromium` when the pinned `@playwright/test` version differs from the preinstalled one. In CI add `npx playwright install --with-deps chromium` and `npm run e2e -w apps/web` after the build step.
- [ ] **Step 3: Run it**

Run: `npm run build && npm run e2e -w apps/web`
Expected: 1 passed.

- [ ] **Step 4: Update README** "How to run it" with the e2e command, then commit.

```bash
git add apps/web .github README.md package-lock.json
git commit -m "Run an end-to-end atlas test in CI"
```

---

### Task 10: Attachments and Latin names

**Files:**
- Create: `data/attachments/hip.yaml`
- Modify: `data/citations.yaml`, `data/structures/hip.yaml`

**Interfaces:**
- Consumes: the attachment shape (Task 1), bone ids in `structures/hip.yaml`.

- [ ] **Step 1: Write origin and insertion rows for all 26 hip muscles** (biceps femoris long and short head separately, so about 55 rows) from the OERI Human Anatomy text (CC BY 4.0) and open-access papers. Open each source while writing, `says_kind` per the licence rule, `checked_by: null`. `landmark` in plain words a reader can picture ("greater trochanter", "ischial tuberosity").
- [ ] **Step 2: Check every Latin name** in `structures/hip.yaml` against Terminologia Anatomica (FIPAT TA2 online, or another reachable TA source), fix wrong ones, add the posterior cruciate ligament's Latin name, and list every change in the commit message.
- [ ] **Step 3: Verify**

Run: `npm run validate && npm run build-data && npm test -w pipeline/data`
Expected: all pass. The normal bundle has 0 attachments (all unchecked), the review bundle has all of them.

- [ ] **Step 4: Commit**

```bash
git add data
git commit -m "Add sourced attachments for all hip muscles and check Latin names"
```

---

### Task 11: Action rows for every hip muscle

**Files:**
- Modify: `data/actions/hip.yaml`, `data/citations.yaml`

**Interfaces:**
- Consumes: the action shape (Task 1), movements in `data/movements.yaml`.

- [ ] **Step 1: Write at least one working row for each main hip action of each of the 26 hip muscles** that does not have one yet (about 30 to 40 rows), drafted from open sources as in Phase 0. Add `when` only where the source measured angles, `applies_to` where the source limits who it holds for, `review_note` wherever the row needed a judgment the source does not state. Stretched and pinched rows only where an open source supports them.
- [ ] **Step 2: Verify**

Run: `npm run validate && npm run build-data && npm run build-data:review && npm test -w pipeline/data`
Expected: all pass. The normal bundle still has 0 draft rows. `node -e` count of rows per muscle in the review bundle shows every one of the 26 muscles at least once.

- [ ] **Step 3: Commit**

```bash
git add data
git commit -m "Draft sourced action rows for every hip muscle for physio review"
```
