# anatoMe Phase 4a Regions and German Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app and the pipeline ready for more than one body region, add the German UI, close the open mesh pipeline follow-ups and write the playbook for adding a region.

**Architecture:** Everything in the app that names the hip in code moves into data or the language files, and the region comes from the model manifest. A small language module picks English or German, and structures, movements and exercises carry optional German names. The pipeline follow-ups are fixed where they were found. No new region is added here: this plan ends with the playbook that the first new region will follow.

**Tech Stack:** As Phase 3. No new dependency. Task 4 needs Linux or WSL with Blender and the mesh sources (see the roadmap, "About this machine").

**Spec:** `docs/superpowers/specs/2026-11-02-anatome-design.md` (sections 4, 7, 8 and the Phase 4 row of section 9), `docs/phase0/phase1-follow-ups.md` (the "Mesh pipeline" list) and `docs/phase0/mesh-source-decision.md`. Builds on plans 2a to 2c and 3, which must be merged first.

## Global Constraints

- Everything in the Global Constraints of plan 2a applies here unchanged.
- **English stays complete.** A missing German text or name falls back to English, never to a key or an empty space.
- **German names are opened, not remembered.** Every German structure and movement name is taken from a source read during the task, named in the header comment of the data file with the date.
- The notebook word rule applies to German too. Keys starting with `notebook.` in `de.json`, apart from the disclaimer and the load error keys, must not contain these stems: `diagnos`, `verletz`, `schädig`, `schaedig`, `behand`, `heil`, `ursach`, `therap`.
- German text follows the same style as the English: plain, friendly, educational. It uses "du", not "Sie" **(builder's call, the owner can overrule)**.
- No new region's meshes or data are added in this plan.
- Mesh licences stay per file. Never import the Z-Anatomy inner ear, kidney or brain white matter parts.

## Design decisions (builder's calls, the owner can overrule)

1. **The region is picked from the manifest.** With one region there is no picker. With more, a select in the top bar. The address can name one with `?region=<id>`.
2. **Gap lines move into the data.** A structure may carry `gap: <key>`, and the text lives in the language files under `gap.<key>`. The hard-coded list in `InfoPanel.tsx` goes.
3. **Joint headings are built from the joint's name**, so a new joint needs one `joint.<id>` text and no code.
4. **Language choice:** the stored choice wins, else the first of the browser's languages that the app has, else English. The switch sits in the credits area. The choice is kept in `localStorage` under `anatome.lang`. It is a setting, not user data about health.
5. **Names:** `german` is an optional field on structures, movements, exercises and phases. Search matches the current language's name, the English name and the Latin name.
6. **The playbook is a document, not code.** The region build script keeps its hip-specific alignment for now. Making it general is part of the first new region's own design, when a second example exists.

## Review Focus

1. A German text or name that is missing must show the English one. Test in Task 2 (`createT` fallback) and Task 3 (`nameOf`).
2. `?region=` with an id the manifest does not have must fall back to the first region, not crash or show an empty screen. Test in Task 1.
3. A stored language the app no longer has (or a damaged value in `localStorage`) must fall back by the normal rule. A browser that blocks `localStorage` must still work. Test in Task 2.
4. A notebook entry logged in English must read correctly after switching to German, and the other way round, because entries store ids and not names. Test in Task 3.
5. The print summary and the backup file name must not change with the language in a way that breaks loading an old backup. Test in Task 3 (backup format has no language in it).

---

## File Structure

```
apps/web/src/
├── region/regions.ts           # new: region list and choice (Task 1)
├── i18n/lang.ts                # new: language choice (Task 2)
├── i18n/de.json                # new (Task 2)
├── i18n/t.ts                   # fallback messages (Task 2)
├── i18n/names.ts               # new: nameOf (Task 3)
├── ui/InfoPanel.tsx            # gap from data, joint headings (Task 1)
├── ui/TopBar.tsx               # region picker (Task 1)
├── ui/Credits.tsx              # language switch (Task 2)
└── App.tsx                     # region and language state (Tasks 1, 2)
data/schema/*.schema.json       # gap, german (Tasks 1, 3)
data/structures/hip.yaml, data/movements.yaml, data/exercises.yaml   # gap, german (Tasks 1, 3)
pipeline/data/src/compile.ts    # passes gap and german through (Tasks 1, 3)
pipeline/                       # follow-ups (Task 4)
docs/regions/adding-a-region.md # new (Task 5)
```

---

### Task 1: No hip in the app code

**Files:**
- Create: `apps/web/src/region/regions.ts`
- Modify: `apps/web/src/App.tsx`, `apps/web/src/ui/TopBar.tsx`, `apps/web/src/ui/InfoPanel.tsx`, `apps/web/src/viewer/manifest.ts`, `apps/web/src/data/bundle.ts`, `apps/web/src/i18n/en.json`, `data/schema/structures.schema.json`, `data/structures/hip.yaml`, `pipeline/data/src/compile.ts`
- Test: `apps/web/src/region/regions.test.ts`, `apps/web/src/ui/InfoPanel.test.tsx`, `apps/web/src/ui/TopBar.test.tsx`, `pipeline/data/test/compile.test.ts`, `pipeline/data/test/languageFiles.test.ts`

**Interfaces:**
- Produces:

```ts
// region/regions.ts
export function regionIds(manifest: Manifest): string[];                              // in the manifest's order
export function chooseRegion(ids: string[], search: string): string;                  // search is location.search
// Returns the ?region= value when ids has it, else ids[0]. Throws when ids is empty.
```

  - Structure rows may carry `gap` (schema: a slug). `BundleStructure.gap?: string`. The four quadriceps muscles get `gap: quadriceps-tendon` and psoas major gets `gap: psoas-origin` in `data/structures/hip.yaml`.
  - en.json: `info.gap.quadriceps` becomes `gap.quadriceps-tendon` and `info.gap.psoasOrigin` becomes `gap.psoas-origin`, texts unchanged. `info.does.hip` and `info.does.knee` are replaced by `info.does` "What it does at the {joint}" with `joint.hip` "hip" and `joint.knee` "knee". New: `region.hip` "Hip and thigh", `region.label` "Body region".
  - `InfoPanel` shows `t("gap." + structure.gap)` when the structure has one. `GAP_LINES` is deleted. Joint headings use `info.does`.
  - `App` reads the manifest once, takes the region from `chooseRegion(regionIds(manifest), location.search)` and passes it down where the constant `REGION` was. `TopBar` gets `regions: string[]`, `region: string` and `onRegion(id)`. It renders a `<select aria-label={t("region.label")}>` only when there is more than one region. Changing the region clears the selection, the layers, the movement pick and the area tap.
  - A test in `pipeline/data` reads `data/structures/*.yaml` and every file in `apps/web/src/i18n/*.json` and checks that each `gap` value has a `gap.<value>` text and each joint in `data/joints.yaml` has a `joint.<id>` text, in every language file.

- [ ] **Step 1: Write the failing tests**

```ts
// regions.test.ts
test("takes the region the address names", () => expect(chooseRegion(["hip", "shoulder"], "?region=shoulder")).toBe("shoulder"));
test("an unknown region falls back to the first", () => expect(chooseRegion(["hip", "shoulder"], "?region=elbow")).toBe("hip"));
test("no parameter gives the first", () => expect(chooseRegion(["hip"], "")).toBe("hip"));
test("no regions at all is an error", () => expect(() => chooseRegion([], "")).toThrow());

// InfoPanel.test.tsx
test("a structure with a gap shows its line from the language file", ...fixture rectus-femoris with gap "quadriceps-tendon": en["gap.quadriceps-tendon"]);
test("the joint heading is built from the joint name", ...expects "What it does at the hip");

// TopBar.test.tsx
test("one region shows no picker", ...queryByLabelText(en["region.label"]) is null);
test("two regions show a picker that reports the choice", ...);

// compile.test.ts
test("gap is passed through to the bundle", ...);

// languageFiles.test.ts
test("every gap and joint in the data has a text in every language file", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Implement.** Search the app source for the words `hip` and `knee` afterwards (`apps/web/src`, not tests or fixtures). Expected: none left in code, only in `en.json`.

- [ ] **Step 4: Run every check**

Run: `npm run validate && npm run check-models && npm test && npm run build && npm run e2e -w apps/web`
Expected: all pass. Update the end-to-end tests where they read `info.does.hip`.

- [ ] **Step 5: Commit**

```bash
git add apps/web data pipeline
git commit -m "Take the region from the manifest and move the hip-specific lines into the data"
```

---

### Task 2: Language choice and the German texts

**Files:**
- Create: `apps/web/src/i18n/lang.ts`, `apps/web/src/i18n/de.json`
- Modify: `apps/web/src/i18n/t.ts`, `apps/web/src/App.tsx`, `apps/web/src/ui/Credits.tsx`, `apps/web/src/i18n/en.json`, `apps/web/src/notebook/wording.test.ts`
- Test: `apps/web/src/i18n/lang.test.ts`, `apps/web/src/i18n/t.test.ts`, `apps/web/src/i18n/files.test.ts`, `apps/web/src/ui/Credits.test.tsx`

**Interfaces:**
- Produces:

```ts
// lang.ts
export const LANGS = ["en", "de"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_KEY = "anatome.lang";
export function pickLanguage(stored: string | null, browser: readonly string[]): Lang;  // design decision 4, "de-AT" counts as "de"
export function readStoredLanguage(): string | null;        // null when localStorage is missing or throws
export function storeLanguage(lang: Lang): void;            // does nothing when localStorage throws

// t.ts
export function createT(messages: Record<string, string>, fallback?: Record<string, string>): Translate;
// A key missing from messages is looked up in fallback before the key itself is returned.
```

  - `App` holds the language, builds `t` with `createT(messages[lang], en)`, sets `document.documentElement.lang`, and passes `lang` and `onLang` to `Credits`. The module-level `const t` in `App.tsx` goes.
  - `Credits` shows a `<select aria-label={t("lang.label")}>` with one option per language. New en.json keys: `lang.label` "Language", `lang.en` "English", `lang.de` "Deutsch" (the language names are the same in every file).
  - `de.json` has every key of `en.json`. The credit lines that licences prescribe (`credits.bodyparts3d`, `credits.zanatomy`) stay in their original wording.

- [ ] **Step 1: Write the failing tests**

```ts
// lang.test.ts
test("the stored choice wins", () => expect(pickLanguage("de", ["en-GB"])).toBe("de"));
test("without a stored choice the browser's first known language is taken", () => expect(pickLanguage(null, ["fr-FR", "de-AT", "en"])).toBe("de"));
test("an unknown stored value is ignored", () => expect(pickLanguage("xx", ["en-US"])).toBe("en"));
test("nothing known gives English", () => expect(pickLanguage(null, ["sn"])).toBe("en"));
test("reading survives a browser that blocks storage", ...localStorage.getItem mocked to throw: readStoredLanguage() is null);
test("storing survives it too", ...setItem mocked to throw: storeLanguage("de") does not throw);

// t.test.ts
test("a key missing in the language falls back to the fallback text", () => expect(createT({}, { a: "English {x}" })("a", { x: "1" })).toBe("English 1"));

// files.test.ts
test("de.json has exactly the keys of en.json", () => expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort()));
test("every German text keeps the placeholders of the English one", ...for each key the set of {names} is equal);
test("no German text is empty", ...);

// wording.test.ts (add)
test("German notebook text stays clear of diagnostic words", ...the stems from the Global Constraints, same exemptions);

// Credits.test.tsx
test("the language switch reports the choice", ...select "Deutsch" calls onLang("de"));
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL.

- [ ] **Step 3: Implement** the module, the fallback and the switch.

- [ ] **Step 4: Translate.** Write `de.json` key by key from `en.json`. Keep the meaning and the tone: "works" as "arbeitet", "is stretched" as "wird gedehnt", "is pinched" as "wird eingeklemmt", "main" as "Hauptmuskel", "helper" as "Helfer". The disclaimer and the educational line must say the same as the English ones, no weaker and no stronger. Collect every text you were unsure about in a list for the owner in the commit message body.

- [ ] **Step 5: Run every check and look at it**

Run: `npm test && npm run build && npm run e2e -w apps/web`
Expected: PASS. The end-to-end tests run with an English browser and still read English. Open the build, switch to Deutsch, and walk through all four tabs at 360 px wide. Expected: no text is cut off, no button wraps into three lines, no English text is left except Latin names and data names (those come in Task 3).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src
git commit -m "Add the German texts and the language switch"
```

---

### Task 3: German names in the data

**Files:**
- Create: `apps/web/src/i18n/names.ts`
- Modify: `data/schema/structures.schema.json`, `data/schema/movements.schema.json`, `data/schema/exercises.schema.json`, `data/structures/hip.yaml`, `data/movements.yaml`, `data/exercises.yaml`, `pipeline/data/src/compile.ts`, `apps/web/src/data/bundle.ts`, `apps/web/src/search/search.ts`, and every component that prints `.english`
- Test: `apps/web/src/i18n/names.test.ts`, `apps/web/src/search/search.test.ts`, `pipeline/data/test/compile.test.ts`, `apps/web/src/notebook/NotebookPanel.test.tsx`

**Interfaces:**
- Produces:
  - Optional `german` (string, at least one character) on structures, movements, exercises and exercise phases, in the schemas and the bundle types.

```ts
// names.ts
export function nameOf(item: { english: string; german?: string }, lang: Lang): string;   // german when lang is "de" and it is set, else english

// search.ts
export function searchStructures(query: string, structures: BundleStructure[], lang: Lang): BundleStructure[];
// Matches the current language's name first, then English, then Latin. Each structure appears once. Results sort by nameOf.
```

  - Every place that shows a name uses `nameOf`. Search for `.english` in `apps/web/src` to find them. Sorting by name (`roles.ts`, `compare.ts`) takes the language too: `involved(bundle, query, pose, lang)` and `compare(entries, bundle, side, lang)` get a last parameter `lang: Lang` that only affects the order.
  - The header comment of each data file gains one line naming the source of the German names and the date read.

- [ ] **Step 1: Write the failing tests**

```ts
// names.test.ts
test("German when asked for and present", () => expect(nameOf({ english: "Hip bone", german: "Hüftbein" }, "de")).toBe("Hüftbein"));
test("English when the German name is missing", () => expect(nameOf({ english: "Hip bone" }, "de")).toBe("Hip bone"));
test("English when English is asked for", () => expect(nameOf({ english: "Hip bone", german: "Hüftbein" }, "en")).toBe("Hip bone"));

// search.test.ts
test("in German the German name is found", ...structure { english: "Hip bone", german: "Hüftbein" }: searchStructures("hüft", s, "de") finds it);
test("an umlaut can be typed without dots", ...searchStructures("huft", s, "de") finds it);
test("in German the English and Latin names still work", ...);
test("a structure that matches by two names appears once", ...);

// compile.test.ts
test("german is passed through for structures, movements and exercises", ...);

// NotebookPanel.test.tsx
test("a note logged in English reads in German after the switch", ...same store, panel rendered with the German t and lang "de": the entry shows the movement's German name);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Implement** the field, `nameOf`, the search change and the call sites.

- [ ] **Step 4: Add the names.** For each structure in `data/structures/hip.yaml`, each movement and each exercise, open a source for the German name (for anatomical structures a German anatomy reference that can be opened freely, for movements the same). Use the name a German physio would say to a patient where one exists ("Großer Gesäßmuskel"), else the Latin-based German term. Leave `german` out where no opened source gives one. Write the source and date into the file header.

- [ ] **Step 5: Run every check**

Run: `npm run validate && npm test && npm run build && npm run e2e -w apps/web`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add data pipeline apps/web/src
git commit -m "Add German names to the data and search by them"
```

After this task, give the owner the list of German texts and names to proofread. The owner reads German and is the reviewer for this.

---

### Task 4: Mesh pipeline follow-ups (Linux or WSL only)

**Files:**
- Modify: `pipeline/fetch-sources.sh`, `pipeline/get-blender.sh`, `pipeline/assets/build_region_blender.py`, `pipeline/assets/meshfit.py`, `pipeline/assets/za_inventory_blender.py`, `pipeline/assets/tests/`, `docs/phase0/mesh-source-decision.md`, `docs/phase0/mesh-inventory.md`, `docs/phase0/phase1-follow-ups.md`

Read `docs/phase0/phase1-follow-ups.md` ("Mesh pipeline") and each script fully first. Set up with `bash pipeline/get-blender.sh`, `bash pipeline/fetch-sources.sh` and a `.venv` with pytest, as the README says. If this machine cannot run them, stop and report: do not change pipeline code that cannot be run.

- [ ] **Step 1: Download scripts.** Both scripts check up front that `curl`, `git`, `unzip` and `sha256sum` exist and name the missing one. `fetch-sources.sh` tests each zip with `unzip -t` before its checksum is recorded, fetches a file again when its unpacked folder is incomplete, and does not retry on a 404 or another permanent HTTP error. Verify: run each script twice in a row. Expected: the second run downloads nothing and exits 0. Rename `curl` out of the path for one run. Expected: a clear message and exit 1.

- [ ] **Step 2: Alignment gate (test first).** In `pipeline/assets/tests/test_meshfit.py` add a test for a new function `surface_gate(distances_mm: list[float], limit_mm: float = 5.0) -> tuple[bool, float]` in `meshfit.py` that returns whether the 95th percentile of the distances is within the limit, and that percentile. Then make `build_region_blender.py` call it on the surface distances between the fitted Z-Anatomy bones and the BodyParts3D bones, once before and once after decimation, print both numbers and fail the build when either is over the limit.

Run: `.venv/bin/pytest pipeline/assets/tests -q`
Expected: PASS.

- [ ] **Step 3: Unpaired Z-Anatomy target in mixed mode (test first).** Add a test in `pipeline/assets/tests/test_hipmatch.py` for a target with one midline record and `source: z-anatomy` in mixed mode. Expected: it is exported with side `""` instead of stopping the build. Fix the code path.

- [ ] **Step 4: Midline names with a period.** Decide by reading `za_inventory_blender.py` whether dropping midline names that contain a period loses a real structure. If it does, fix it with a test. If it does not, document the rule in a comment and in `docs/phase0/mesh-inventory.md`.

- [ ] **Step 5: Run the whole-region export once.** Run the build with `--whole-region` (the licence fallback path) into a temporary output file, then `npm run check-models` against a temporary models folder that points at it. Expected: it builds and passes, or the errors are fixed until it does. Do not commit the output file.

- [ ] **Step 6: Rebuild and compare.** Rebuild `models/hip.glb` and `models/hip-z-anatomy.glb` with the README commands. Run `npm run check-models`. Expected: the same mesh count and a triangle count within 1 percent of before. If the files are byte-identical or differ only by the two gate numbers in the log, do not commit them. If they differ more, stop and report before committing models.

- [ ] **Step 7: Docs.** In `docs/phase0/mesh-source-decision.md`, correct the sentence about FJxxxx and FJxxxxM (it holds for muscles only). In `docs/phase0/mesh-inventory.md`, mention Zona orbicularis and Frenula capsulae as parts of the hip capsule. Mark every "Mesh pipeline" follow-up as done with the date.

- [ ] **Step 8: Commit**

```bash
git add pipeline docs
git commit -m "Close the mesh pipeline follow-ups from Phase 0"
```

---

### Task 5: The region playbook

**Files:**
- Create: `docs/regions/adding-a-region.md`, `docs/regions/region-design-template.md`
- Modify: `README.md`, `docs/superpowers/plans/2026-11-13-remaining-build-roadmap.md`

- [ ] **Step 1: Write `docs/regions/adding-a-region.md`** from what the hip taught, as numbered steps with the exact commands and the file each step produces:
  1. Write a short region design from the template (which structures, down to which joint, what is left out).
  2. Inventory both mesh sources for the region (`bp3d_inventory.py`, `za_inventory_blender.py`) and write the comparison, as `docs/phase0/mesh-inventory.md` did.
  3. Decide the source per structure by the rule in the main spec (section 9, task 2) and write the decision down.
  4. Write `pipeline/assets/regions/<region>.json` (the target table: sid, type, English name, name patterns, required, source).
  5. Choose the bones that anchor the alignment between the two sources for this region and extend the build script for them. This is the one step that needs new pipeline code.
  6. Build the files, add them to `models/manifest.json` with source and licence, run `npm run check-models` and stay inside the triangle budget.
  7. Write `data/structures/<region>.yaml` with Latin names checked against Terminologia Anatomica 2, depth and depth notes, `midline` and `gap` where needed.
  8. Add the region's joints and movements to `data/joints.yaml` and `data/movements.yaml`, with the `joint.<id>`, `angle.<id>` and `region.<id>` texts in every language file.
  9. Draft attachments, then action rows, by "How to write a row". Everything `checked_by: null`.
  10. Measure the phone gate for the new region with a copy of the phone sheet.
  11. Review: attachments by the owner, actions by the physio, recorded with `npm run mark-checked`.
  12. The region ships when its data is reviewed.

- [ ] **Step 2: Write `docs/regions/region-design-template.md`**: headings for outcome, structures in and out, joints and movements, known mesh gaps, which exercises gain from the region, effort, and open questions.

- [ ] **Step 3: Point to it.** Add a "Adding a body region" line to the README's "How to help" section. In the roadmap page, change the Phase 4 entry under "Not planned yet" to say that the playbook exists and that the next step is a region design for the first new region.

- [ ] **Step 4: Commit**

```bash
git add docs README.md
git commit -m "Write the playbook for adding a body region"
```
