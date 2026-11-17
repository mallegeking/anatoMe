# Whole Body View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a seventh region, "Whole body" (id `body`), that shows all six regions as one model from one lighter file, carries the union of their data, and is the region the app opens with.

**Architecture:** The asset pipeline builds `models/body.glb` from the union of the six region target lists, each structure once, with a bone cap of 1000 and a cap of 400 for every other part. The body lists that file plus the hip's unchanged Z-Anatomy file. `check-models` checks that the body draws each structure once, draws every structure a region draws, keeps each mesh within 10 mm of its region copy, and stays under its own budget of 240,000 triangles. The data build writes `body.json` as the union of the region bundles from the same YAML. The app needs no viewer change: it gets the new region first in the manifest, two texts per language and a gap list built from the regions' own gap lines.

**Tech Stack:** TypeScript, React 19, react-three-fiber, Vitest, Playwright, Node `tsx` scripts, Python 3 (plain, pytest), Blender 5.2.3 headless with `@gltf-transform/core` for reading glb in checks.

**Spec:** `docs/superpowers/specs/2026-11-17-whole-body-view-design.md`. Read it fully first. The build rules are `docs/superpowers/plans/2026-11-13-build-rules.md`.

## Global Constraints

- Work only on the branch `claude/install-superpowers-plugin-v0gy65`. Run `git branch --show-current` before every commit. Never commit to `main`, never push anything but this branch, never force-push.
- Test first. See each new test fail before writing the code.
- Every task ends with its own tests green plus `npm run validate && npm run check-models && npm test && npm run build && npm run e2e -w apps/web -- --trace off && node scripts/check-no-drafts.mjs` green, and `.venv/bin/pytest pipeline/assets/tests -q` green when the task touched Python. Then one commit with the message the task gives.
- Never skip or loosen a test or a check. The region budget of 150,000 triangles stays exactly as it is.
- The region id is `body`. English name "Whole body", German name "Ganzer Körper".
- The body caps: `max_triangles_per_bone_mesh` 1000, `max_triangles_per_mesh` 400. The body budget: 240,000 triangles. The in-step limit: 10 mm between bounding box centres.
- The six region files (`hip.glb`, `hip-z-anatomy.glb`, `lower-leg.glb`, `shoulder.glb`, `arm.glb`, `neck.glb`, `trunk.glb`) do not change by a single byte. The six region target files in `pipeline/assets/regions/` do not change.
- Every structure stays its own mesh with its own `sid` and `side`. No merging of meshes, no posing, no bones that move, no new colouring.
- `checked_by` is never touched. No data row is written or changed. The YAML in `data/` does not change.
- No request to another host. No new runtime or dev dependency.
- Every user-visible text comes from `apps/web/src/i18n/en.json` and `de.json`. Both keep the same keys in the same order.
- Docs and code comments: plain language, no em dashes, no semicolons in prose.
- When the plan and the code disagree, take the smallest change that keeps the plan's intent and write it into the build report under "Deviations".

## Plan decisions (the planner's calls, the owner can overrule)

1. Option B of the spec (one lighter file), chosen from the measurements in spec section 2 and 3.
2. `listRegions` keeps listing home regions only. A new `bundleRegions` adds `body` for `build-data`, so the existing `listRegions` test stays as it is.
3. The gap list of the whole body is a heading (`regionGap.body`) plus, for each region with a `regionGap.<region>` text, the region's name and that text word for word.
4. Existing end-to-end tests whose taps are aimed at the hip's own framing, if they fail with the whole body as the opener, open `/?region=hip` instead. The whole body gets its own tap tests in Task 5. Each such change goes into the build report.

## Review Focus

1. A body file rebuilt without its regions (or the other way round) must be caught by `npm run check-models`, not shipped. Tests in Task 3 (`checkModels.test.ts`, the "once", "complete" and "in step" tests).
2. An unknown or missing `?region=` must open the whole body, and every region id, `hip` included, must still open its region. Tests in Task 4 (`regions.test.ts`, `regions.spec.ts`).
3. Peeling a layer in the whole body must take the outer muscles of every region at once and nothing deeper. Test in Task 5 (`compile.test.ts`, "peeling once in the whole body").
4. Under a spot must not crash or list the far side of the body when tapping the trunk, or an arm that lies in front of the trunk. Tests in Task 5 (`whole-body.spec.ts`).
5. The German UI in the whole body must show the German gap heading and the German region lines, with English structure names outside the hip. Test in Task 4 (`RegionInfo.test.tsx`, the German case) and the existing `layout.spec.ts` run in German.

---

## File Structure

```
pipeline/data/src/regions.ts         # new: WHOLE_BODY (Task 1)
pipeline/data/src/compile.ts         # union bundle, bundleRegions (Task 1)
pipeline/data/src/validate.ts        # "body" is taken (Task 1)
pipeline/data/src/cli.ts             # build-data writes body, budget per region (Tasks 1, 3)
pipeline/data/src/checkModels.ts     # body checks, budgetFor (Task 3)
pipeline/data/test/compile.test.ts, validate.test.ts, checkModels.test.ts   # (Tasks 1, 3, 5)
pipeline/data/test/fixtures/body-as-region/          # new fixture (Task 1)
pipeline/assets/meshrules.py         # cap_for (Task 2)
pipeline/assets/build_region_blender.py   # bone cap, body budget in the printout (Task 2)
pipeline/assets/region_gen.py        # body_targets, "body" command (Task 2)
pipeline/assets/regions/body.json    # generated (Task 2)
pipeline/assets/tests/test_meshrules.py, test_region_gen.py   # (Task 2)
models/body.glb                      # built (Task 3)
models/manifest.json, models/LICENSE, ATTRIBUTION.md   # (Tasks 3, 4)
apps/web/src/i18n/en.json, de.json   # region.body (Task 3), regionGap.body (Task 4)
apps/web/src/region/regions.ts       # WHOLE_BODY (Task 4)
apps/web/src/ui/RegionInfo.tsx, PanelArea.tsx, App.tsx, index.css   # gap list (Task 4)
apps/web/e2e/whole-body.spec.ts      # new (Tasks 4, 5)
apps/web/e2e/regions.spec.ts, atlas.spec.ts, layout.spec.ts and any spec in plan decision 4   # opener changed (Task 4)
README.md, docs/regions/known-gaps.md, docs/regions/phone-measurements.md, docs/ideas.md   # (Task 6)
```

---

### Task 1: The whole body's data bundle

**Files:**
- Create: `pipeline/data/src/regions.ts`, `pipeline/data/test/fixtures/body-as-region/` (copy `fixtures/valid`, then set one structure's `region` to `body`)
- Modify: `pipeline/data/src/compile.ts`, `pipeline/data/src/validate.ts`, `pipeline/data/src/cli.ts`
- Test: `pipeline/data/test/compile.test.ts`, `pipeline/data/test/validate.test.ts`

**Interfaces:**
- Produces: `export const WHOLE_BODY = "body"` in `pipeline/data/src/regions.ts`. `export function bundleRegions(dataDir: string): string[]` in `compile.ts`, returning `[...listRegions(dataDir), WHOLE_BODY]`. `compileRegion(dataDir, WHOLE_BODY, mode)` returns the union bundle with `region: "body"`.

- [ ] **Step 1: Write the failing tests** in `compile.test.ts`:

```ts
import { WHOLE_BODY } from "../src/regions.ts";
const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort();
const union = (dir: string, mode: "normal" | "review", pick: (b: RegionBundle) => { id: string }[]) =>
  [...new Set(listRegions(dir).flatMap((r) => pick(compileRegion(dir, r, mode)).map((x) => x.id)))].sort();

test("bundleRegions adds the whole body after the home regions", () =>
  expect(bundleRegions(fx("multi-region"))).toEqual(["hip", "lower-leg", "body"]));
for (const mode of ["normal", "review"] as const) {
  test(`the whole body is the union of the regions (${mode}, real data)`, () => {
    const body = compileRegion(realDataDir, WHOLE_BODY, mode);
    expect(body.region).toBe("body");
    expect(ids(body.structures)).toEqual(union(realDataDir, mode, (b) => b.structures));
    expect(ids(body.actions)).toEqual(union(realDataDir, mode, (b) => b.actions));
    expect(ids(body.attachments)).toEqual(union(realDataDir, mode, (b) => b.attachments));
    expect(ids(body.movements)).toEqual(union(realDataDir, mode, (b) => b.movements));
    expect(ids(body.exercises)).toEqual(union(realDataDir, mode, (b) => b.exercises));
    expect(ids(body.citations)).toEqual(union(realDataDir, mode, (b) => b.citations));
  });
}
test("the whole body lists each structure once", () => {
  const s = compileRegion(fx("multi-region"), WHOLE_BODY, "normal").structures.map((x) => x.id);
  expect(s.length).toBe(new Set(s).size);
});
test("the whole body has every movement of every joint", () =>
  expect(ids(compileRegion(fx("multi-region"), WHOLE_BODY, "normal").movements)).toEqual(union(fx("multi-region"), "normal", (b) => b.movements)));
test("the whole body's normal build has no drafts and counts them like the hip", () => {
  const body = compileRegion(fx("valid"), WHOLE_BODY, "normal");
  expect(body.actions.some((a) => a.draft)).toBe(false);
  expect(body.pendingByStructure).toEqual(compileRegion(fx("valid"), "hip", "normal").pendingByStructure);
  expect(body.pendingExercises).toBe(compileRegion(fx("valid"), "hip", "normal").pendingExercises);
});
```

In `validate.test.ts`, in the style of the file:

```ts
test("body is taken as a region name", () => {
  const result = validateDataDir(fx("body-as-region"));
  expect(result.ok).toBe(false);
  expect(result.errors.map((e) => e.message)).toContain("body is the whole body, it cannot be a region of its own");
});
```

- [ ] **Step 2: Run** `npx vitest run -c pipeline/data` (or `npm test -w pipeline/data`). Expected: the new tests FAIL (no `regions.ts`, no `bundleRegions`, body bundle empty, no error).

- [ ] **Step 3: Implement.**
  - `regions.ts`: the constant with a one-line comment.
  - `compile.ts`: `const whole = region === WHOLE_BODY`. With `whole`, every structure, every joint and every exercise is taken. Everything else (actions, attachments, citations, pending counts, review gate) stays the same code. Add `bundleRegions`.
  - `validate.ts`: the message above for a structure whose `region` or `also_in` entry is `body`, for a joint whose `region` is `body`, and for an exercise whose `regions` has `body`. Check it before the "unknown region" check so the message is this one.
  - `cli.ts`: `build-data` loops over `bundleRegions(dataDir)`.

- [ ] **Step 4: Run** the pipeline tests, then `npm run validate && npm run build-data && node scripts/check-no-drafts.mjs`. Expected: PASS, and `build-data` prints a `body.json (normal)` line with the action, attachment and exercise counts of the hip.

- [ ] **Step 5: Full check list of the Global Constraints, then commit**

```bash
git commit -m "Build the whole body's data bundle as the union of the regions"
```

---

### Task 2: A body target list and a bone cap in the asset pipeline

**Files:**
- Modify: `pipeline/assets/meshrules.py`, `pipeline/assets/build_region_blender.py`, `pipeline/assets/region_gen.py`
- Create: `pipeline/assets/regions/body.json` (generated, never typed)
- Test: `pipeline/assets/tests/test_meshrules.py`, `pipeline/assets/tests/test_region_gen.py`

**Interfaces:**
- Produces: `cap_for(kind: str, cap: int | None, bone_cap: int | None) -> int | None` in `meshrules.py`. In `region_gen.py`: `BODY_PARTS = ["hip", "lower-leg", "shoulder", "arm", "neck", "trunk"]`, `BODY_MAX_TRIANGLES_PER_MESH = 400`, `BODY_MAX_TRIANGLES_PER_BONE_MESH = 1000`, `body_targets(parts: list[tuple[str, list[dict]]]) -> list[dict]` and the command `region_gen.py body`. `regions/body.json` has the keys `region` ("body"), `max_triangles_per_mesh` (400), `max_triangles_per_bone_mesh` (1000) and `targets`.

- [ ] **Step 1: Write the failing tests.**

```python
def test_cap_for():
    assert cap_for("bone", 400, 1000) == 1000
    assert cap_for("muscle", 400, 1000) == 400
    assert cap_for("tendon", 400, 1000) == 400
    assert cap_for("bone", 2000, None) == 2000    # a region file without a bone cap builds as before
    assert cap_for("bone", None, None) is None    # the hip: no cap at all
```

In `test_region_gen.py` (targets in the style of `hip_target`, each with `sid`, `type`, `english`, `patterns`, `required`, `source`):

```python
def test_body_targets_union_once_in_order():
    femur, tibia, soleus = hip_target("femur"), hip_target("tibia"), {**hip_target("soleus"), "type": "muscle"}
    ligament = {**hip_target("pubofemoral-ligament"), "source": "z-anatomy"}
    gap = {**hip_target("quadriceps-tendon"), "source": None}
    out = body_targets([("hip", [femur, ligament, gap]), ("lower-leg", [soleus, femur, tibia])])
    assert [t["sid"] for t in out] == ["femur", "soleus", "tibia"]   # BodyParts3D only, each once, first seen first

def test_body_targets_stops_on_a_conflict():
    femur = hip_target("femur")
    other = {**femur, "patterns": ["^left femur bone$"]}
    with pytest.raises(SystemExit, match="femur"):
        body_targets([("hip", [femur]), ("lower-leg", [other])])
```

- [ ] **Step 2: Run** `.venv/bin/pytest pipeline/assets/tests -q`. Expected: the three new tests FAIL with an import error.

- [ ] **Step 3: Implement.**
  - `cap_for`: the bone cap for `kind == "bone"` when it is not None, else `cap`.
  - `build_region_blender.py`: `load_cap(region)` becomes `load_caps(region) -> tuple[int | None, int | None]` reading `max_triangles_per_mesh` and `max_triangles_per_bone_mesh`. `build_objects` takes `caps` and passes `cap_for(target["type"], *caps)` to `clean_and_decimate`. `report(objs, budget)` prints the warning against `budget`, which is `BODY_TRIANGLE_BUDGET = 240_000` for the region `body` and `TRIANGLE_BUDGET` otherwise. Update the module docstring with the body build command. A region file without the bone key builds exactly as before.
  - `region_gen.py`: `body_targets` keeps targets whose `source` is `"bp3d"`, each `sid` once, in the order seen. A second target with the same `sid` and a different `type`, `english` or `patterns` stops with `sys.exit` naming the `sid` and both regions. `cmd_body()` reads `regions/<part>.json` for each of `BODY_PARTS` and writes `regions/body.json` in the same JSON style as `cmd_targets`. Add `body` to `main()` and to the module docstring.

- [ ] **Step 4: Run** the Python tests (PASS), then `.venv/bin/python pipeline/assets/region_gen.py body`. Expected: `pipeline/assets/regions/body.json` with 293 targets. `git status` shows no change to the six region target files.

- [ ] **Step 5: Full check list, then commit**

```bash
git commit -m "Generate the whole body's target list and give bones their own cap"
```

---

### Task 3: The body model file and its checks

**Files:**
- Modify: `pipeline/data/src/checkModels.ts`, `pipeline/data/src/cli.ts`, `models/manifest.json`, `models/LICENSE`, `ATTRIBUTION.md`, `apps/web/src/i18n/en.json`, `apps/web/src/i18n/de.json`
- Create: `models/body.glb` (built)
- Test: `pipeline/data/test/checkModels.test.ts`

**Interfaces:**
- Consumes: `WHOLE_BODY` (Task 1), `regions/body.json` (Task 2).
- Produces: in `checkModels.ts`, `export const REGION_TRIANGLE_BUDGET = 150_000`, `export const WHOLE_BODY_TRIANGLE_BUDGET = 240_000`, `export const MAX_BODY_SHIFT_M = 0.01`, `export function budgetFor(region: string): number`. The manifest has a `body` entry, last for now, with `body.glb` (bp3d, CC-BY-4.0) and `hip-z-anatomy.glb` (z-anatomy, CC-BY-SA-4.0).

- [ ] **Step 1: Write the failing tests** in `checkModels.test.ts`. Add a helper that writes a manifest with several regions, each file a glb from `writeGlb`. Use structures `femur` and `tibia`, both bones, not midline, `regions: ["hip"]`, and put every left mesh at `x = 2` unless the test says otherwise.

```ts
test("the whole body may draw a structure of any region", ...)            // body: femur, hip: femur -> ok
test("a structure drawn twice in the whole body fails", ...)
  // body files a.glb and b.glb both have femur l
  // error message: "femur side l is drawn twice in the whole body"
test("a structure a region draws but the whole body does not fails", ...)
  // hip: femur and tibia, body: femur
  // message: "tibia side l is in hip but not in the whole body"
test("a structure the whole body draws but no region draws fails", ...)
  // hip: femur, body: femur and tibia (tibia regions ["hip"])
  // message: "tibia side l is in the whole body but in no region"
test("a whole body mesh more than 10 mm from its region copy fails", ...)
  // hip femur at x = 2, body femur at x = 2.02
  // message: "femur side l lies 20.0 mm from its copy in hip.glb, more than 10 mm"
test("a whole body mesh 5 mm from its region copy passes", ...)          // x = 2.005
test("a midline structure is named midline in these messages", ...)       // sacrum twice: "sacrum side midline is drawn twice in the whole body"
test("budgetFor", () => {
  expect(budgetFor("body")).toBe(240_000);
  for (const r of ["hip", "lower-leg", "shoulder", "arm", "neck", "trunk"]) expect(budgetFor(r)).toBe(150_000);
});
```

The existing tests use one region and no `body`, and stay unchanged.

- [ ] **Step 2: Run** the pipeline tests. Expected: the new tests FAIL.

- [ ] **Step 3: Implement** in `checkModels.ts`: the region rule (`structure.regions.includes(f.region)`) does not apply to files of `WHOLE_BODY`. Collect, per mesh, `sid|side`, the file, the region and the bounding box centre (`getBounds`). When the manifest has a `body` region, add the three body checks with the messages above, comparing against the first region file that has the same `sid|side`. `budgetFor` returns the body budget for `WHOLE_BODY`, else the region budget. In `cli.ts`, remove the local `TRIANGLE_BUDGET` and print `(budget ${budgetFor(region)})`.

- [ ] **Step 4: Run** the pipeline tests. Expected: PASS.

- [ ] **Step 5: Build the file:**

```bash
tools/blender/blender -b --factory-startup -P pipeline/assets/build_region_blender.py -- --region body --source bp3d --out models/body.glb
```

Expected: `TOTAL 539 meshes` and about 234,000 faces, `WROTE models/body.glb` of about 1.8 MB. `git status` shows no change to the seven existing glb files.

- [ ] **Step 6: Wire it up.** Add the `body` entry to the end of `models/manifest.json`. Add `"region.body": "Whole body"` and `"region.body": "Ganzer Körper"` directly in front of `region.hip` in `en.json` and `de.json`. Add `body.glb` to `models/LICENSE` and a row to the table in `ATTRIBUTION.md` ("The whole body: every BodyParts3D mesh of the six regions once, lighter (539 meshes). Used with hip-z-anatomy.glb.").

- [ ] **Step 7: Run** `npm run check-models`. Expected: no errors, `region body: <n> triangles (budget 240000)` with n under 240,000, every other region line unchanged against 150000.

- [ ] **Step 8: Full check list, then commit**

```bash
git commit -m "Build body.glb with each structure once and check it against the regions"
```

---

### Task 4: The app opens with the whole body

**Files:**
- Modify: `models/manifest.json`, `apps/web/src/region/regions.ts`, `apps/web/src/ui/RegionInfo.tsx`, `apps/web/src/ui/PanelArea.tsx`, `apps/web/src/App.tsx`, `apps/web/src/index.css`, `apps/web/src/i18n/en.json`, `apps/web/src/i18n/de.json`
- Create: `apps/web/e2e/whole-body.spec.ts`
- Modify (opener changed, record each in the build report): `apps/web/e2e/regions.spec.ts`, `apps/web/e2e/atlas.spec.ts`, `apps/web/e2e/layout.spec.ts`, and any spec of plan decision 4
- Test: `apps/web/src/region/regions.test.ts`, `apps/web/src/ui/RegionInfo.test.tsx`

**Interfaces:**
- Consumes: the manifest `body` entry and `region.body` (Task 3), `body.json` (Task 1).
- Produces: `export const WHOLE_BODY = "body"` in `apps/web/src/region/regions.ts`. `Hint` gets the prop `parts?: string[]` (the manifest's region ids). `RegionInfo` gets `parts: string[]`, `PanelArea` gets `regions: string[]`, App passes its `regions`.

Texts: `"regionGap.body": "What the model does not have yet, by region:"` and German `"regionGap.body": "Was dem Modell noch fehlt, nach Region:"`, each directly in front of `regionGap.shoulder`.

- [ ] **Step 1: Write the failing unit tests.**

`regions.test.ts`:

```ts
const ids = ["body", "hip", "lower-leg", "shoulder", "arm", "neck", "trunk"];
test("the whole body opens when the address names no region", () => expect(chooseRegion(ids, "")).toBe("body"));
test("an unknown region opens the whole body", () => expect(chooseRegion(ids, "?region=elbow")).toBe("body"));
test("every region still opens by its id", () => { for (const id of ids) expect(chooseRegion(ids, `?region=${id}`)).toBe(id); });
```

`RegionInfo.test.tsx`:

```ts
const parts = ["body", "hip", "lower-leg", "shoulder", "arm", "neck", "trunk"];
test("the whole body lists each region's own gap line under the region's name", () => {
  render(<Hint t={t} region="body" parts={parts} />);
  expect(screen.getByText(en["regionGap.body"])).toBeTruthy();
  const rows = [...document.querySelectorAll(".region-gaps dt")].map((dt) => [dt.textContent, dt.nextElementSibling?.textContent]);
  expect(rows).toEqual(["lower-leg", "shoulder", "neck", "trunk"].map((r) => [en[`region.${r}`], en[`regionGap.${r}`]]));
});
test("in German the whole body's gap list is German", () => { /* same with createT(de, en), expecting de texts */ });
test("a region keeps its one gap line and no list", () => {
  render(<Hint t={t} region="shoulder" parts={parts} />);
  expect(screen.getByText(en["regionGap.shoulder"])).toBeTruthy();
  expect(document.querySelector(".region-gaps")).toBeNull();
});
```

- [ ] **Step 2: Write the failing end-to-end tests** in `apps/web/e2e/whole-body.spec.ts` (phone project, test data from `e2e/data`):
  - "the app opens with the whole body": `goto("/")`, the region combobox has the value `body`, its options read the seven `region.*` texts with "Whole body" first, the Movements tab is there, `regionGap.body` is visible, and `data/body.json` was requested.
  - "switch to a region and back": choose "Lower leg and foot", the address ends `?region=lower-leg` and the tabs are Structures and Under a spot, choose "Whole body", the address ends `?region=body` and the Movements tab is back.
  - "a search in the whole body selects a structure outside the hip": search "scapula", choose the first result, the info panel heading is "Scapula" and the stage chip shows "Scapula".

- [ ] **Step 3: Run** `npm test -w apps/web` and the new spec. Expected: FAIL (the manifest still opens the hip, no list).

- [ ] **Step 4: Implement.** Move `body` to the first place in `models/manifest.json`. Add the texts. `Hint` with `region === WHOLE_BODY` shows `regionGap.body` and a `<dl className="region-gaps">` with one `dt`/`dd` pair per entry of `parts` (except `body`) whose `regionGap.<id>` text exists (a missing text comes back as its key). Pass `regions` from App to `PanelArea`, to `RegionInfo`, to `Hint`, and to the `Hint` App renders while the data loads. A few lines of CSS for `.region-gaps` with the existing tokens, so it wraps at 360 px.

- [ ] **Step 5: Run the whole e2e suite.** Change the existing tests that say the app opens with the hip:
  - `regions.spec.ts` "?region=elbow opens the hip" becomes "?region=elbow opens the whole body" (value `body`, Movements tab visible).
  - `atlas.spec.ts` and `layout.spec.ts`: the request they wait for is `data/body.json`, not `data/hip.json`.
  - A spec whose tap is aimed at the hip's framing and now fails: `goto("/?region=hip")` (plan decision 4), and a comment saying why.
  Expected: all green. Every other existing test passes unchanged.

- [ ] **Step 6: Full check list, then commit**

```bash
git commit -m "Open the app with the whole body and list its gaps by region"
```

---

### Task 5: Under a spot and layers on the whole body

**Files:**
- Modify: `apps/web/e2e/whole-body.spec.ts`
- Test: `pipeline/data/test/compile.test.ts`

**Interfaces:**
- Consumes: `peel`, `initialLayers`, `isVisible` from `apps/web/src/layers/layers.ts` (types only imports there, so the pipeline test can import it), `compileRegion` and `WHOLE_BODY` (Task 1).

- [ ] **Step 1: Write the tests.**

`compile.test.ts`:

```ts
test("peeling once in the whole body takes the outer muscles of every region", () => {
  const body = compileRegion(realDataDir, WHOLE_BODY, "normal");
  const after = peel(initialLayers(), body.structures);
  const hidden = body.structures.filter((s) => s.type === "muscle" && !isVisible(after, s, "l"));
  expect(new Set(hidden.map((s) => s.depth))).toEqual(new Set([1]));
  const homes = new Set(listRegions(realDataDir).filter((r) => compileRegion(realDataDir, r, "normal").structures.some((s) => hidden.some((h) => h.id === s.id))));
  expect(homes).toEqual(new Set(listRegions(realDataDir)));
  expect(body.structures.filter((s) => s.type === "muscle" && s.depth > 1).every((s) => isVisible(after, s, "l"))).toBe(true);
});
```

`whole-body.spec.ts` (aim taps from the stage's middle in stage heights, like `stage.spec.ts`. Find the spots by looking at the built app, then pin them):
  - "Under a spot: a tap on the trunk lists what lies under it": Under a spot tab, tap the chest a little left of the middle (screen right) from the front. The list has at least one entry, its first entry is a trunk or shoulder structure from the test data, and no entry is an arm structure.
  - "Under a spot: a tap on an arm beside the trunk": turn to a side view (the badge says a side), tap the upper arm where it lies over the trunk. The list's first entry is an arm or shoulder structure. Record in the build report what else the list holds.
  - "peeling a layer in the whole body": open Layers, press peel once, the peeled count says one layer.

- [ ] **Step 2: Run them.** If one fails because of the app (not the aim), stop and write it into the build report. The Under a spot rules (side, bone stop, 12 cm) are the owner's and are not changed in this plan. Otherwise expected: PASS. These tests cover behaviour that already exists, so they may pass at once. Say so in the report.

- [ ] **Step 3: Look at both taps and one peel in the built app** (screenshots in the scratchpad, not in the repo) and write what you saw into the build report.

- [ ] **Step 4: Full check list, then commit**

```bash
git commit -m "Test Under a spot and peeling on the whole body"
```

---

### Task 6: Docs for the whole body

**Files:**
- Modify: `README.md`, `docs/regions/known-gaps.md`, `docs/regions/phone-measurements.md`, `docs/ideas.md`

- [ ] **Step 1: Write.**
  - `README.md`: the app opens with the whole body, the six regions are in the same list. The asset build section gets the `region_gen.py body` and `--region body` commands, and the rule that `body.glb` is rebuilt whenever a region is rebuilt.
  - `docs/regions/known-gaps.md`: a section "Whole body" saying it holds every structure of the six regions once, from one lighter file (bones at most 1000 triangles, other parts 400), what detail is lost (the skull's teeth row, a few slivers on pectoralis major), and that its gap list is the regions' own lines.
  - `docs/regions/phone-measurements.md`: a "Whole body" row at the top of the results table and one line in "How to measure" saying the app now opens with the whole body, so the time from opening the page is the one to note for it.
  - `docs/ideas.md`: the "Whole body as one model" entry says it was built on 2026-11-17 and names the spec.

- [ ] **Step 2: Check** the texts for em dashes and semicolons in prose: `grep -n "—\|;" ` over the changed docs, only code may have them.

- [ ] **Step 3: Full check list, then commit**

```bash
git commit -m "Describe the whole body in the README and the region docs"
```

After Task 6 the builder runs every check of the build rules, writes `docs/superpowers/reviews/whole-body-view-build-report.md`, updates `docs/superpowers/reviews/progress.md`, commits and pushes, as the build rules say.
