# anatoMe Phase 4b Whole Body Meshes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five body regions (lower leg and foot, shoulder, arm and hand, head and neck, trunk) to the model as BodyParts3D bones and muscles with names, layers and search, next to the hip that exists.

**Architecture:** A generator script reads the BodyParts3D inventory and writes one target list per region. The existing Blender build script turns each list into one `.glb`, with a new per-mesh triangle cap and a new measurement of each muscle's layer. A second generator step writes `data/structures/<region>.yaml` from the same target list and the measured layers. The app already has a region picker. It gets the small changes a second region needs.

**Tech Stack:** As Phase 4a. No new dependency. Tasks 3 and 4 need Linux or WSL with Blender, the mesh sources and the `.venv` (see "About this machine" in the roadmap). On the owner's machine that is the clone in the WSL distro `Ubuntu-24.04` under `~/build/anatoMe`, which has `sources/` and `tools/blender`.

**Spec:** `docs/superpowers/specs/2026-11-15-whole-body-meshes-design.md`. Also `docs/superpowers/specs/2026-11-02-anatome-design.md` (sections 4, 6 and the Phase 4 row of section 9). The build rules in `docs/superpowers/plans/2026-11-13-build-rules.md` apply.

## Global Constraints

- Everything in the Global Constraints of plan 2a applies here unchanged.
- **The hip does not change.** `models/hip.glb` and `models/hip-z-anatomy.glb` stay byte-identical. Do not rebuild them. In `data/structures/hip.yaml` only the six `also_in` additions of Task 4 are allowed.
- **BodyParts3D only.** No Z-Anatomy mesh is read or exported. Every new file in the manifest has `"source": "bp3d"` and `"license": "CC-BY-4.0"`.
- **No name is typed by hand.** Ids, English names, mesh patterns, FMA ids and Latin names of the new structures come out of the generator. If a generated name looks wrong, fix the generator rule and record it under Deviations. Do not edit the generated files.
- **No new knowledge rows.** No attachment, action, movement, exercise or joint is added. No German name is added to a structure.
- **Triangle budget:** 150,000 per region, checked by `npm run check-models`.
- **`hip` stays the first key in `models/manifest.json`.** The app opens the first region, and the perf check measures it.
- Do not apply or touch the saved Phase 4a patch (`phase4a-task4-wip.patch`). Keep the edits to `build_region_blender.py` to the two additions this plan names, so that patch still applies later.
- Mesh tasks (3 and 4) run only where Blender and `sources/` exist. If they do not, stop after Task 2 and report. Do not change pipeline code you cannot run.

## Design decisions (builder's calls, the owner can overrule)

These repeat the design doc, section "How it is built". The ones that pin code:

1. **Region ids and manifest order:** `hip`, `lower-leg`, `shoulder`, `arm`, `neck`, `trunk`.
2. **`also_in`** on a structure lists other regions that also draw it. Only bones use it.
3. **`max_triangles_per_mesh: 2000`** in every new region's target file. The hip file has no such key.
4. **Layers are measured.** For each soft part the build sends rays out from its surface and takes `free`, the share of rays that meet no other part, bone or soft. `free >= 0.20` is depth 1, `free >= 0.05` is depth 2, less is depth 3. Bones are 4. The planner tried this on the undecimated lower leg, shoulder and arm on 2026-11-15. The values are in Task 4 Step 3.
5. **A joint has a region.** A region's bundle carries only the movements of its own joints. The Movements and Notebook tabs show only when the bundle has movements.
6. **A region with known gaps has one gap text**, `regionGap.<id>`, shown under the tap hint. The hip and the arm have none.

## Review Focus

1. A mesh filed under one region in the manifest whose structure belongs to another region and does not list it in `also_in`. `check-models` must fail. Test in Task 1.
2. Switching region while the Movements or Notebook tab is open, to a region with no movements. The app must go to the Structures tab, not show an empty or broken panel. Test in Task 2.
3. A BodyParts3D part that exists on one side only (longus colli), or twice without a side word (the intercostals). The first must be dropped and reported, the second must become one midline structure. Test in Task 3.
4. A muscle with a huge mesh (external oblique, 223,652 faces). It must come out at or under the cap, a tiny mesh must not go under 120 faces, and the hip (no cap) must decimate exactly as before. Test in Task 3 (`test_decimate_ratio`).
5. A structure with no Latin name and no German name. The panel must show the English name and no empty line. Test in Task 2.

---

## File Structure

```
data/schema/structures.schema.json   # also_in (Task 1)
data/schema/joints.schema.json       # region (Task 1)
data/joints.yaml                     # region: hip on both joints (Task 1)
pipeline/data/src/compile.ts         # also_in, movements by joint region (Task 1)
pipeline/data/src/validate.ts        # also_in and joint region checks (Task 1)
pipeline/data/src/checkModels.ts     # mesh region check (Task 1)
apps/web/src/App.tsx                 # tabs by region, region switch, address (Task 2)
apps/web/src/ui/RegionInfo.tsx       # gap line under the hint (Task 2)
apps/web/src/i18n/en.json, de.json   # region.<id>, regionGap.<id> (Task 2)
pipeline/assets/region_gen.py        # new: targets and structures generator (Task 3)
pipeline/assets/meshrules.py         # new: decimate_ratio, depth_from_free (Task 3)
pipeline/assets/bp3d_inventory.py    # optional --region (Task 3)
pipeline/assets/build_region_blender.py  # cap and --depths-out (Task 3)
pipeline/assets/tests/test_region_gen.py, test_meshrules.py   # new (Task 3)
pipeline/assets/regions/<region>.json    # five new, generated (Task 4)
models/<region>.glb, models/manifest.json, models/LICENSE  # (Task 4)
data/structures/<region>.yaml        # five new, generated (Task 4)
data/structures/hip.yaml             # six also_in additions (Task 4)
apps/web/e2e/regions.spec.ts         # new (Task 5)
docs/regions/known-gaps.md, docs/regions/phone-measurements.md  # new (Task 5)
```

---

### Task 1: Data rules for more than one region

Runs anywhere.

**Files:**
- Modify: `data/schema/structures.schema.json`, `data/schema/joints.schema.json`, `data/joints.yaml`, `apps/web/e2e/data/joints.yaml`, `pipeline/data/src/compile.ts`, `pipeline/data/src/validate.ts`, `pipeline/data/src/checkModels.ts`, `pipeline/data/src/cli.ts`
- Test: `pipeline/data/test/compile.test.ts`, `pipeline/data/test/validate.test.ts`, `pipeline/data/test/checkModels.test.ts` and their fixtures

**Interfaces:**
- Produces: structure field `also_in?: string[]`. Joint field `region: string` (required). `StructureInfo` in `validate.ts` gains `regions: string[]` (home region first, then `also_in`). `checkModelMapping` keeps its signature.

- [ ] **Step 1: Write the failing tests**

In `compile.test.ts`, with a fixture of two regions `hip` and `lower-leg`, where `tibia` has `region: hip, also_in: [lower-leg]` and `talus` has `region: lower-leg`:

```ts
test("a structure is in its home region and in every also_in region", () => {
  expect(compileRegion(dir, "hip", "normal").structures.map((s) => s.id)).toContain("tibia");
  expect(compileRegion(dir, "lower-leg", "normal").structures.map((s) => s.id).sort()).toEqual(["talus", "tibia"]);
});
test("a region gets only the movements of its own joints", () => {
  expect(compileRegion(dir, "hip", "normal").movements.length).toBeGreaterThan(0);
  expect(compileRegion(dir, "lower-leg", "normal").movements).toEqual([]);
});
test("listRegions lists home regions only", () => expect(listRegions(dir)).toEqual(["hip", "lower-leg"]));
```

In `validate.test.ts`:

```ts
test("also_in must name a region some structure has as its home", ...);   // message: `unknown region ghost`
test("also_in must not repeat the home region", ...);                      // message: `also_in repeats the home region hip`
test("a joint's region must be a known region", ...);                      // message: `unknown region ghost`
```

In `checkModels.test.ts`, with a manifest that lists a file under region `lower-leg` holding a mesh with sid `femur`, where `femur` has `region: hip` and no `also_in`:

```ts
test("a mesh must sit in a region its structure belongs to", ...);
// error: { file: "<path>.glb", path: "<node name>", message: "femur belongs to hip, not to lower-leg" }
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test -w pipeline/data`
Expected: FAIL in the new tests only.

- [ ] **Step 3: Implement**

  - `structures.schema.json`: add `"also_in": { "description": "Other regions that also draw this structure, so a region does not show muscles without their bones.", "type": "array", "minItems": 1, "uniqueItems": true, "items": { "type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$" } }`.
  - `joints.schema.json`: add `"region": { "$ref": "#/definitions/slug" }` and put `region` in `required`. Set `region: hip` on both joints in `data/joints.yaml` and in `apps/web/e2e/data/joints.yaml`.
  - `compile.ts`: a structure is in a region when `s.region === region || s.also_in?.includes(region)`. `listRegions` stays based on `region` only. Movements: keep a movement when the joint named before the dot in its `dof` has `region === region`. `also_in` does not go into the bundle.
  - `validate.ts`: the three checks above, in the style of the `unknown region` check for exercises.
  - `checkModels.ts`: after the `unknown structure id` check, add the region check with the message above. `cli.ts` and `loadStructures` pass the regions through.

- [ ] **Step 4: Run everything**

Run: `npm run validate && npm run check-models && npm test && npm run build && npm run e2e -w apps/web`
Expected: PASS. The hip bundle still has its 8 movements.

- [ ] **Step 5: Commit**

```bash
git add data pipeline/data apps/web/e2e/data
git commit -m "Let a structure show in more than one region and give each joint a region"
```

---

### Task 2: The app with more than one region

Runs anywhere. Uses test fixtures only. The real second region arrives in Task 4.

**Files:**
- Modify: `apps/web/src/App.tsx`, `apps/web/src/ui/RegionInfo.tsx`, `apps/web/src/i18n/en.json`, `apps/web/src/i18n/de.json`
- Test: `apps/web/src/App.test.tsx`, `apps/web/src/ui/InfoPanel.test.tsx`, `apps/web/src/area/AreaPanel.test.tsx`, `pipeline/data/test/languageFiles.test.ts` (only if it needs the new keys listed)

**Interfaces:**
- Consumes: `RegionBundle.movements` from Task 1 (empty in a region without joints).
- Produces: `Hint({ t, region }: { t: Translate; region?: string })`.

- [ ] **Step 1: Add the texts.** Exact values:

| Key | English | German |
| --- | --- | --- |
| `region.lower-leg` | Lower leg and foot | Unterschenkel und Fuß |
| `region.shoulder` | Shoulder | Schulter |
| `region.arm` | Arm and hand | Arm und Hand |
| `region.neck` | Head and neck | Kopf und Hals |
| `region.trunk` | Trunk | Rumpf |
| `regionGap.shoulder` | Not in the model yet: latissimus dorsi. | Noch nicht im Modell: Latissimus dorsi. |
| `regionGap.lower-leg` | Not in the model yet: the dorsal interossei of the foot and extensor digitorum brevis. | Noch nicht im Modell: die Musculi interossei dorsales des Fußes und der Extensor digitorum brevis. |
| `regionGap.neck` | Not in the model yet: the jaw muscles, the muscles of the face and longus colli. | Noch nicht im Modell: die Kaumuskeln, die Gesichtsmuskeln und der Longus colli. |
| `regionGap.trunk` | Not in the model yet: latissimus dorsi, quadratus lumborum, multifidus, the abdominal muscles except the external oblique, the rib cartilages and the discs between the vertebrae. | Noch nicht im Modell: Latissimus dorsi, Quadratus lumborum, Multifidus, die Bauchmuskeln außer dem äußeren schrägen Bauchmuskel, die Rippenknorpel und die Bandscheiben. |

List the German texts in the build report under "For the owner to proofread".

- [ ] **Step 2: Write the failing tests** in `App.test.tsx`, with a manifest of two regions (`hip`, `shoulder`) and bundles where `hip` has movements and `shoulder` has `movements: []`:

```ts
test("a region without movements shows only the Structures and Area tabs", ...);
// after choosing shoulder in the picker: tabs are exactly [t("mode.atlas"), t("mode.area")]
test("switching to a region without movements while on the Movements tab goes to Structures", ...);
// start on hip, open Movements, choose shoulder: the selected tab is t("mode.atlas")
test("switching region closes the search, the layers panel and the print summary and clears the notice", ...);
test("switching region writes ?region=<id> into the address without a new history entry", ...);
// history.length unchanged, location.search === "?region=shoulder"
test("a data error in one region does not stay on screen after switching to another", ...);
test("the gap line of the region shows under the tap hint, and nothing shows for a region without one", ...);
// shoulder: getByText("Not in the model yet: latissimus dorsi.") ; hip: no element with class "region-gap"
```

In `apps/web/src/area/AreaPanel.test.tsx`:

```ts
test("the area list works in a region without movements", ...);
// bundle with movements: [] and actions: []: the tapped structures are listed, no "Movements that load it" heading, no error
```

In `InfoPanel.test.tsx`:

```ts
test("a structure without a Latin or German name shows its English name and no Latin line", ...);
```

- [ ] **Step 3: Run them and see them fail**

Run: `npm test -w apps/web`
Expected: FAIL in the new tests. The `InfoPanel` test may already pass. If it does, keep it and say so in the report.

- [ ] **Step 4: Implement in `App.tsx`**

  - The tab list: `["atlas", "movement", "area", "notebook"]` when `bundle` is null or `bundle.movements.length > 0`, else `["atlas", "area"]`. When `mode` is not in the list, show and set `"atlas"`.
  - `changeRegion` also does: `setMode("atlas")`, `setSearchOpen(false)`, `setLayersOpen(false)`, `setPrintJob(null)`, `setNotice(null)`, and `history.replaceState(null, "", "?region=" + id)` while keeping the rest of the address.
  - Give the `ModelErrorBoundary` around the panel `key={region ?? ""}`.
  - Pass `region` to both `Hint` uses that know it.

- [ ] **Step 5: Implement in `RegionInfo.tsx`.** `Hint` shows, after the tap hint, `<p className="muted region-gap">{text}</p>` when `region` is set and `t("regionGap." + region)` is not the key itself (a missing text comes back as the key).

- [ ] **Step 6: Run everything**

Run: `npm test && npm run build && npm run e2e -w apps/web`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "Make the tabs, the region switch and the hint ready for a second region"
```

---

### Task 3: The generator, the triangle cap and the layer measurement (Linux or WSL only)

Set up first: `sources/` (run `bash pipeline/fetch-sources.sh` if it is missing), `tools/blender`, the `.venv`, and `sources/bp3d-inventory.jsonl` (`.venv/bin/python pipeline/assets/bp3d_inventory.py`).

**Files:**
- Create: `pipeline/assets/region_gen.py`, `pipeline/assets/meshrules.py`, `pipeline/assets/tests/test_region_gen.py`, `pipeline/assets/tests/test_meshrules.py`
- Modify: `pipeline/assets/bp3d_inventory.py`, `pipeline/assets/build_region_blender.py`

**Interfaces (all in `region_gen.py` unless said, standard library only):**
- `strip_side(name: str) -> str`: removes the word `left ` or `right ` wherever it stands, and trims.
- `sid_of(name: str) -> str`: lower case, a trailing ` muscle` removed, every run of characters outside `a-z0-9` becomes one `-`, no `-` at the ends. `"infraspinatus muscle"` gives `infraspinatus`, `"Long head of biceps brachii"` gives `long-head-of-biceps-brachii`.
- `region_of(name: str, classes: set[str]) -> str | None`: the home region of a part, or `None` when it is out of scope. `name` is already side-stripped and lower case. `classes` holds every FMA class id the element belongs to in `isa_element_parts.txt`.
- `build_targets(records: list[dict], classes_of: dict[str, set[str]], hip_targets: list[dict]) -> tuple[dict[str, list[dict]], list[str]]`: returns the target list per region and the list of dropped names with the reason.
- `write_structures(region: str, targets: list[dict], depths: dict, latin_of: dict[str, str], fma_of: dict[str, str], today: str) -> str`: the YAML text of `data/structures/<region>.yaml`.
- Command line: `region_gen.py targets` writes all five `pipeline/assets/regions/<region>.json`. `region_gen.py structures` writes all five `data/structures/<region>.yaml` from those files and `sources/<region>-depths.json`.
- `meshrules.py` (standard library only, so Blender can import it): `depth_from_free(free: float) -> int` returns 1, 2 or 3 by the rule in design decision 4. `decimate_ratio(tris: int, ratio: float, cap: int | None, min_faces: int = 120) -> float` returns the ratio the decimate modifier gets.

**The rules. Use them exactly.**

```python
BONE, MUSCLE = "FMA5018", "FMA5022"   # bone organ, muscle organ
REGIONS = ["lower-leg", "shoulder", "arm", "neck", "trunk"]
MAX_TRIANGLES_PER_MESH = 2000

# Parts the two classes miss: muscles stored as heads or parts, the sternum, the Achilles tendon.
EXTRA = re.compile(
    r"part of (deltoid|pectoralis major|trapezius|longus colli)"
    r"|head of (triceps brachii|biceps brachii|gastrocnemius|flexor carpi ulnaris|pronator teres"
    r"|adductor hallucis|adductor pollicis|flexor hallucis brevis|flexor pollicis brevis)"
    r"|^set of (dorsal interossei of hand|palmar interossei of hand|lumbricals of hand"
    r"|levatores costarum \w+|interspinales \w+|\w+ cervical intertransversarii)$"
    r"|^(manubrium|body of sternum|xiphoid process|calcaneal tendon)$")

# Out of scope: eye, larynx, pharynx, palate, tongue, perineum, anal sphincter.
OUT_CLASSES = {"FMA49033", "FMA46562", "FMA46619", "FMA46726", "FMA46689", "FMA9623", "FMA21930"}
OUT_NAMES = re.compile(
    r"levator palpebrae|coccygeus|genioglossus|hyoglossus|uvular|arytenoid|vocalis|pharyn"
    r"|veli palatini|perineal|adductor minimus")

def region_of(name, classes):
    is_bone = BONE in classes or re.search(r"^(manubrium|body of sternum|xiphoid process)$", name)
    if not (is_bone or MUSCLE in classes or EXTRA.search(name)):
        return None
    if not is_bone and (classes & OUT_CLASSES or OUT_NAMES.search(name)):
        return None
    if is_bone:
        if classes & {"FMA24491", "FMA24492", "FMA24493", "FMA45096"}:   # tarsal, metatarsal, toe, sesamoid of foot
            return "lower-leg"
        if classes & {"FMA23889", "FMA9612", "FMA23914"} or name in ("radius", "ulna"):   # carpal, metacarpal, finger
            return "arm"
        if name in ("clavicle", "scapula", "humerus"):
            return "shoulder"
        if "FMA9915" in classes:                                          # cervical vertebra
            return "neck"
        if classes & {"FMA9914", "FMA7574"} or re.search(r"sternum|manubrium|xiphoid", name):   # vertebra, rib
            return "trunk"
        return "neck"                                                     # skull, mandible, hyoid
    if classes & {"FMA22471", "FMA37369"} or re.search(r"gastrocnemius|hallucis|calcaneal", name):   # leg, foot
        return "lower-leg"
    if classes & {"FMA37347", "FMA33531"} or re.search(
            r"deltoid|pectoralis|trapezius|serratus anterior|subclavius|rhomboid|levator scapulae", name):
        return "shoulder"
    if "FMA37348" in classes or re.search(r"triceps|biceps brachii|carpi|pronator|pollicis|of hand", name):
        return "arm"
    if classes & {"FMA9617", "FMA9616"} or re.search(r"capitis|cervicis|cervical|platysma", name):   # neck, head
        return "neck"
    return "trunk"

# Bones drawn in a region that is not their home. Keys are regions, values are sids.
ORDINALS = "first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth".split()
CONTEXT = {
    "lower-leg": ["femur", "tibia", "fibula", "patella"],
    "arm": ["humerus", "scapula"],
    "shoulder": [f"{o}-rib" for o in ORDINALS] + ["manubrium", "body-of-sternum", "atlas", "axis"]
                + [f"{o}-cervical-vertebra" for o in ORDINALS[2:7]]
                + [f"{o}-thoracic-vertebra" for o in ORDINALS],
    "neck": ["clavicle", "scapula", "manubrium", "first-rib", "second-rib"]
            + [f"{o}-thoracic-vertebra" for o in ORDINALS[:6]],
    "trunk": ["sacrum", "hip-bone", "seventh-cervical-vertebra"],
}
```

`build_targets` then works like this:

1. Group the inventory records by `strip_side(english).lower()`.
2. Drop a group whose name matches any pattern of any target in `hip.json`. The hip owns it.
3. Ask `region_of`. `None` drops the group silently.
4. Sides: a group with both `l` and `r` records is paired. A group with only unsided records is midline (two unsided meshes are joined by the build script, which is right for the intercostals). A group with only `l` or only `r`, or with a mix of sided and unsided records, is dropped and added to the dropped list with the reason. Expected in the dropped list: the three parts of longus colli.
5. One target per group: `sid` from `sid_of`, `type` is `bone` for a bone, `tendon` for `calcaneal tendon`, else `muscle`. `english` is the name with its first letter in upper case. `patterns` is one exact pattern per distinct record name: `"^" + re.escape(record english) + "$"`. `required: true`, `source: "bp3d"`, `midline: true` only for a midline group.
6. Two groups that give the same `sid`, or a `sid` that a hip structure already has, stop the script with an error.
7. Context: for every sid in `CONTEXT[region]`, add a copy of that target (from its home region, or from `hip.json` for the hip's bones) with `"context": true`. A context sid that does not exist stops the script.
8. Each file is `{"region": ..., "max_triangles_per_mesh": 2000, "targets": [...]}`, targets sorted by sid, own targets first, then context targets.

`write_structures`: one flow-style row per own target (not per context target), in the style of `data/structures/hip.yaml`. Fields in this order: `id`, `type`, `english`, `latin` (from `latin_of`, left out when there is none), `fma` (from `fma_of`, left out when there is none), `region`, `depth`, `midline: true` when midline, `also_in: [...]` listing every region whose `CONTEXT` names this sid, and for every row that is not a bone `depth_note: "Measured from the model on <today>: <n> percent of the rays from its surface meet no other part. See the header."` with `<n>` as `round(free * 100)`. Bones get `depth: 4` and no note. The file starts with a header comment that says: generated by `pipeline/assets/region_gen.py` on the date, do not edit by hand, names from the BodyParts3D part lists, Latin from Z-Anatomy's `TA2.csv` by exact match of the English name and not checked one by one, and the depth rule in two sentences.

`read_latin(path) -> dict[str, set[str]]` reads `sources/z-anatomy/TA2.csv`. The file has a byte order mark, and each line is one string wholly inside double quotes: strip the quotes, split on `;`, and take field 2 (English, lower case) and field 3 (Latin). `latin_for(name, latin) -> str | None` looks the name up, then the name plus ` muscle`, then the name without a trailing ` muscle`, and returns the Latin term only when the first lookup that hits has exactly one. `latin_of` in `write_structures` is that result per sid. `fma_of` maps a lower-case name from `isa_parts_list_e.txt` to its concept id.

- [ ] **Step 1: Write the failing tests** in `test_region_gen.py` and `test_meshrules.py`

```python
def test_sid_of():
    assert sid_of("infraspinatus muscle") == "infraspinatus"
    assert sid_of("Long head of biceps brachii") == "long-head-of-biceps-brachii"
    assert sid_of("navicular bone of foot") == "navicular-bone-of-foot"

def test_strip_side():
    assert strip_side("left femur") == "femur"
    assert strip_side("long head of right biceps brachii") == "long head of biceps brachii"

def test_region_of():
    assert region_of("talus", {BONE, "FMA24491"}) == "lower-leg"
    assert region_of("soleus", {MUSCLE, "FMA22471"}) == "lower-leg"
    assert region_of("medial head of gastrocnemius", set()) == "lower-leg"
    assert region_of("scapula", {BONE}) == "shoulder"
    assert region_of("acromial part of deltoid", set()) == "shoulder"
    assert region_of("radius", {BONE}) == "arm"
    assert region_of("long head of triceps brachii", set()) == "arm"
    assert region_of("atlas", {BONE, "FMA9914", "FMA9915"}) == "neck"
    assert region_of("frontal bone", {BONE}) == "neck"
    assert region_of("splenius capitis", {MUSCLE}) == "neck"
    assert region_of("fifth rib", {BONE, "FMA7574"}) == "trunk"
    assert region_of("manubrium", set()) == "trunk"
    assert region_of("diaphragm", {MUSCLE}) == "trunk"
    assert region_of("lateral rectus", {MUSCLE, "FMA49033"}) is None   # eye muscle
    assert region_of("adductor minimus", {MUSCLE}) is None
    assert region_of("stomach", set()) is None

def test_build_targets_sides_and_hip():
    # records: left+right talus, two unsided "external intercostal muscle", one left-only
    # "inferior oblique part of longus colli", left+right femur (hip owns it), left+right soleus
    targets, dropped = build_targets(records, classes_of, hip_targets)
    assert [t["sid"] for t in targets["lower-leg"] if not t.get("context")] == ["soleus", "talus"]
    assert [t["sid"] for t in targets["lower-leg"] if t.get("context")] == ["femur", "fibula", "patella", "tibia"]
    assert next(t for t in targets["trunk"] if t["sid"] == "external-intercostal")["midline"] is True
    assert any("longus colli" in d for d in dropped)
    assert all("femur" != t["sid"] or t.get("context") for ts in targets.values() for t in ts)

def test_build_targets_patterns_are_exact():
    # records: "long head of left biceps brachii" and "long head of right biceps brachii"
    t = next(t for t in targets["arm"] if t["sid"] == "long-head-of-biceps-brachii")
    assert len(t["patterns"]) == 2
    assert any(re.search(p, "long head of left biceps brachii") for p in t["patterns"])
    assert not any(re.search(p, "left biceps brachii") for p in t["patterns"])
    assert not any(re.search(p, "long head of left biceps brachii tendon") for p in t["patterns"])

def test_write_structures_row():
    # targets: scapula (bone), teres-major (muscle), humerus (bone), and first-rib as a context target
    text = write_structures("shoulder", targets, {"teres-major": {"depth": 2, "free": 0.09, "samples": 600}},
                            {"scapula": "Scapula"}, {"scapula": "FMA13394"}, "2026-11-15")
    assert '- {id: scapula, type: bone, english: Scapula, latin: Scapula, fma: "FMA13394", region: shoulder, depth: 4, also_in: [arm, neck]}' in text
    assert ('- {id: teres-major, type: muscle, english: Teres major, region: shoulder, depth: 2, depth_note: "Measured from '
            'the model on 2026-11-15: 9 percent of the rays from its surface meet no other part. See the header."}') in text
    assert text.startswith("#")
    assert "id: humerus" in text and "id: first-rib" not in text   # own targets only

def test_latin_lookup(tmp_path):
    # a TA2.csv with a byte order mark and these lines, each wholly inside double quotes:
    #   "1180;Humerus;Humerus;x"   "2;Soleus muscle;Musculus soleus;x"   "3;Atlas;Atlas;x"   "4;Atlas;Atlas [C I];x"
    latin = read_latin(path)
    assert latin_for("humerus", latin) == "Humerus"
    assert latin_for("soleus", latin) == "Musculus soleus"      # found as "soleus muscle"
    assert latin_for("atlas", latin) is None                    # two different Latin terms: no Latin
    assert latin_for("talus", latin) is None

def test_depth_from_free():
    assert [depth_from_free(f) for f in (1.0, 0.34, 0.20)] == [1, 1, 1]
    assert [depth_from_free(f) for f in (0.19, 0.06, 0.05)] == [2, 2, 2]
    assert [depth_from_free(f) for f in (0.04, 0.0)] == [3, 3]

def test_decimate_ratio():
    assert decimate_ratio(2374, 0.6, None) == 0.6                 # the hip bone, no cap: as before
    assert decimate_ratio(500, 0.14, None) == 120 / 500           # the 120 face floor, as before
    assert decimate_ratio(100, 0.14, None) == 1.0                 # already under the floor
    assert decimate_ratio(223652, 0.14, 2000) == 2000 / 223652    # external oblique, capped
    assert decimate_ratio(5000, 0.14, 2000) == 0.14               # 700 faces, under the cap
    assert decimate_ratio(100, 0.14, 2000) == 1.0
```

- [ ] **Step 2: Run them and see them fail**

Run: `.venv/bin/pytest pipeline/assets/tests -q`
Expected: FAIL, the new modules do not exist.

- [ ] **Step 3: Implement `region_gen.py` and `meshrules.py`** as specified above. `decimate_ratio` without a cap is exactly today's `max(ratio, min(1.0, min_faces / tris))`. With a cap, a result over `cap / tris` becomes `cap / tris`.

- [ ] **Step 4: `bp3d_inventory.py`.** It prints the match table for `hip.json` today. Add an optional `--region <id>` (default `hip`) that picks the target file. Nothing else changes.

- [ ] **Step 5: The cap in `build_region_blender.py`.** `clean_and_decimate(obj, ratio, cap=None)` takes its ratio from `decimate_ratio(tris, ratio, cap, MIN_FACES)` in place of the line that works it out today. `build_objects` passes the region file's `max_triangles_per_mesh`, or `None` when the key is missing. Verify with the hip, into a temporary file:

Run: `tools/blender/blender -b --factory-startup -P pipeline/assets/build_region_blender.py -- --region hip --source bp3d --out /tmp/hip-check.glb && cmp /tmp/hip-check.glb models/hip.glb`
Expected: no output from `cmp`. If the files differ before your change too (run it on a clean checkout to see), compare the printed mesh and face totals instead and say so in the report. Do not commit a hip file.

- [ ] **Step 6: The layer measurement in `build_region_blender.py`.** A new flag `--depths-out <path>` (bp3d only). After `build_objects`:

  1. Build one `BVHTree` over the faces of all built objects, bones and context bones included, and keep for each face the `sid` of its object.
  2. For each object whose `kind` is not `bone`, take up to 300 vertices at an even stride (`step = max(1, len(vertices) // 300)`). For each, start at the vertex plus 0.5 mm along its normal and cast along the normal. A hit on the object's own sid does not count: continue from the hit point plus 0.1 mm, at most 60 times and 2 m in all. The ray is free when it ends without a hit on another sid.
  3. Pool the rays of both sides of a structure. `free` is the free rays divided by all rays, rounded to 2 places. `depth = depth_from_free(free)`.
  4. Write `{"<sid>": {"depth": d, "free": f, "samples": k}, ...}` as JSON to the path, sorted by sid.

  Without the flag the script does exactly what it did.

- [ ] **Step 7: Run the tests**

Run: `.venv/bin/pytest pipeline/assets/tests -q`
Expected: PASS, the old tests included.

- [ ] **Step 8: Commit**

```bash
git add pipeline/assets
git commit -m "Generate region target lists and measure muscle layers from the model"
```

---

### Task 4: Build the five regions (Linux or WSL only)

**Files:**
- Create: `pipeline/assets/regions/{lower-leg,shoulder,arm,neck,trunk}.json`, `models/{lower-leg,shoulder,arm,neck,trunk}.glb`, `data/structures/{lower-leg,shoulder,arm,neck,trunk}.yaml`
- Modify: `models/manifest.json`, `models/LICENSE`, `data/structures/hip.yaml`

**Interfaces:**
- Consumes: `region_gen.py targets`, `region_gen.py structures`, `--depths-out` from Task 3. `also_in` and the mesh region check from Task 1.

- [ ] **Step 1: Generate the target lists.**

Run: `.venv/bin/python pipeline/assets/region_gen.py targets`
Expected own structures and meshes per region, from the planner's dry run of these rules on the inventory on 2026-11-15: lower-leg 60 and 120, shoulder 23 and 46, arm 70 and 140, neck 53 and 89, trunk 54 and 79. The dropped list names the three parts of longus colli and nothing else. Any other count or dropped name means a rule differs from the plan: stop and report, do not adjust numbers to fit.

Eleven of these meshes have no name in their OBJ file header, so their names rest on the inventory's concept pick alone: `FJ1451`, `FJ1454`, `FJ1455` (the three intercostal layers), `FJ1525`, `FJ1543`, `FJ1547`, `FJ1548`, `FJ1549`, `FJ1550`, `FJ1552`, `FJ1553`. Every other in-scope mesh carries its inventory name in the header. Say this in `docs/regions/known-gaps.md` (Task 5) and name the eleven in the build report under "Not verified".

- [ ] **Step 2: Build each region and measure its layers.** For each of the five regions:

Run: `tools/blender/blender -b --factory-startup -P pipeline/assets/build_region_blender.py -- --region <region> --source bp3d --out models/<region>.glb --depths-out sources/<region>-depths.json`
Expected: a `WROTE` line, a `TOTAL` line under 150,000 faces, no `WARNING over the ... budget`. If a region is over, lower `MAX_TRIANGLES_PER_MESH` in `region_gen.py` by 250, generate and build all five again, and record it under Deviations. Do not go under 1,250. If that is not enough, stop and report.

- [ ] **Step 3: Check the layers.** Gate:
  - `tibialis-anterior`, `medial-head-of-gastrocnemius`, `acromial-part-of-deltoid` and `descending-part-of-trapezius` are depth 1.
  - `soleus`, `supraspinatus` and `supinator` are depth 2 or 3.

  If a line fails, do not tune the rule and do not throw the task away. Set `depth` to 1 for every soft part of all five regions (a `--flat-depth` flag on `region_gen.py structures`, with the note "Not measured yet, every soft part is in the first layer."), record it under Deviations and "For the owner", and go on.

  Then put this table into the build report with your measured `free` next to the planner's. It is a report, not a gate. The planner measured before decimation, so small differences are normal.

  | Region | Structure | Planner's free | Expected depth |
  | --- | --- | --- | --- |
  | lower-leg | tibialis-anterior | 0.40 | 1 |
  | lower-leg | medial-head-of-gastrocnemius | 0.34 | 1 |
  | lower-leg | fibularis-longus | 0.30 | 1 |
  | lower-leg | tibialis-posterior | 0.15 | 2 |
  | lower-leg | soleus | 0.06 | 2 |
  | lower-leg | popliteus | 0.04 | 3 |
  | shoulder | descending-part-of-trapezius | 0.50 | 1 |
  | shoulder | acromial-part-of-deltoid | 0.34 | 1 |
  | shoulder | spinal-part-of-deltoid | 0.22 | 1 |
  | shoulder | levator-scapulae | 0.17 | 2 |
  | shoulder | rhomboid-major | 0.09 | 2 |
  | shoulder | pectoralis-minor | 0.02 | 3 |
  | shoulder | supraspinatus | 0.00 | 3 |
  | arm | brachioradialis | 0.49 | 1 |
  | arm | long-head-of-biceps-brachii | 0.28 | 1 |
  | arm | brachialis | 0.18 | 2 |
  | arm | flexor-digitorum-superficialis | 0.17 | 2 |
  | arm | pronator-quadratus | 0.15 | 2 |
  | arm | supinator | 0.01 | 3 |

  For the neck and the trunk, which the planner did not measure, list every soft part with its `free` and depth.

- [ ] **Step 4: Generate the structure files.**

Run: `.venv/bin/python pipeline/assets/region_gen.py structures`
Expected: five files in `data/structures/`. The planner's dry run found a Latin name for 149 of the 260 own structures and none that was ambiguous. Report the numbers per region. The vertebrae, the finger and toe bones and the muscle parts are the bulk of those without one.

- [ ] **Step 5: Share the hip's bones.** In `data/structures/hip.yaml` add `also_in: [lower-leg]` to `femur`, `tibia`, `fibula` and `patella`, and `also_in: [trunk]` to `hip-bone` and `sacrum`, after `region: hip`. Add one comment line to the file's header that says what `also_in` means. Change nothing else in that file.

- [ ] **Step 6: The manifest and the licence note.** `models/manifest.json` gets, after `hip` and in this order, `lower-leg`, `shoulder`, `arm`, `neck`, `trunk`, each with one file `{"path": "<region>.glb", "source": "bp3d", "license": "CC-BY-4.0"}`. In `models/LICENSE` add one line after the hip line: the five files by name, based on BodyParts3D (CC BY 4.0).

- [ ] **Step 7: Check.**

Run: `npm run validate && npm run check-models && git status --short models`
Expected: both pass, every region is under budget, and `git status` shows `hip.glb` and `hip-z-anatomy.glb` as unchanged. Put the `check-models` lines for all files into the build report.

- [ ] **Step 8: Look at each region once.** Render each new file with `pipeline/assets/render_check_blender.py` the way the README shows for the hip, front and back, into a temporary folder. Look at the pictures: bones and muscles sit together, no part floats far from the body, no part is missing on one side. Describe what you saw per region in the report under "Not verified" if you could not look, or under "Checks" if you did. Do not commit the pictures.

- [ ] **Step 9: Run everything**

Run: `npm test && npm run build && npm run e2e -w apps/web && node scripts/check-no-drafts.mjs && node apps/web/scripts/perf-check.mjs && npm run test:py`
Expected: PASS. The perf check still measures the hip.

- [ ] **Step 10: Commit**

```bash
git add pipeline/assets/regions models data/structures
git commit -m "Add the lower leg, shoulder, arm, neck and trunk as BodyParts3D regions"
```

---

### Task 5: Two-region test and the docs

Runs anywhere once Task 4 is committed.

**Files:**
- Create: `apps/web/e2e/regions.spec.ts`, `apps/web/e2e/data/structures/{lower-leg,shoulder,arm,neck,trunk}.yaml`, `docs/regions/known-gaps.md`, `docs/regions/phone-measurements.md`
- Modify: `README.md`, `ATTRIBUTION.md` (only if it lists model files by name), `docs/superpowers/plans/2026-11-13-remaining-build-roadmap.md`

- [ ] **Step 1: The end-to-end test.** Copy all five new files from `data/structures/` into `apps/web/e2e/data/structures/`, so every `also_in` in them names a region the test data knows. Do not change the test data's own `hip.yaml`. `regions.spec.ts`:

```ts
test("the picker switches to the shoulder and back", async ({ page }) => {
  // open "/", choose texts["region.shoulder"] in the select labelled texts["region.label"]
  // expect: URL ends with "?region=shoulder"
  // expect: tabs are exactly [mode.atlas, mode.area]
  // expect: texts["regionGap.shoulder"] is visible
  // search "scapula", choose it: the panel heading is "Scapula"
  // choose texts["region.hip"]: the Movements tab is back, the search field is empty
});
test("?region=shoulder opens the shoulder", ...);
test("?region=elbow opens the hip", ...);
```

Run: `npm run build && npm run e2e -w apps/web`
Expected: PASS, the four older spec files included.

- [ ] **Step 2: `docs/regions/known-gaps.md`.** One section per region: the structures BodyParts3D release 4.0 has no mesh for (the list in the design doc), the names the generator dropped and why, the groups left out on purpose, and what is needed to fill each gap (Z-Anatomy fillers after the surface gate decision, a `cartilage` type for the rib cartilages and discs). Add the note that the hip has no adductor minimus although BodyParts3D has one.

- [ ] **Step 3: `docs/regions/phone-measurements.md`.** A sheet for the owner in the style of `docs/phase2/phone-measurements.md`: for each new region on the Galaxy A23, time until the model can be turned after choosing the region, whether turning stutters, whether peeling a layer reads as sensible, and one free line. Leave the result fields empty.

- [ ] **Step 4: README and roadmap.** In the README, list the six regions where it now speaks of the hip model, add the two generator commands to the pipeline section, and link the known gaps page. In the roadmap, add this plan to the table and change "Phase 4 region content" under "Not planned yet" to say that the meshes and names are in, and that each region's ligaments and sourced data are still to be planned.

- [ ] **Step 5: Run every check of the build rules, "After each plan"**, then commit

```bash
git add apps/web/e2e docs README.md ATTRIBUTION.md
git commit -m "Test the region switch end to end and document the new regions and their gaps"
```

---

## For the build report

Besides the sections the build rules ask for:

- The structure and mesh count, triangle count and file size of each new region.
- The layer table of Task 4 Step 3, and the full list for the neck and the trunk.
- The dropped list of the generator.
- "For the owner to proofread": the German texts of Task 2.
- "Not verified": the phone, and whether the layers read as sensible when peeling.
