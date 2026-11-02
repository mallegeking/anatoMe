# anatoMe Phase 0 Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the core pipeline end to end for the hip: pick a mesh source, export the hip region to a small glTF file, show it in a phone-friendly web app where tapping a structure shows its name, and prove the data format with 10 sourced, validated action rows.

**Architecture:** Raw downloads live in a git-ignored `sources/` folder. Python scripts (some run inside headless Blender) inventory the meshes and export `models/hip*.glb` with a structure id on every mesh. YAML in `data/` is validated by a Node tool (JSON Schema plus cross-reference checks, including "every mesh id exists in the data"). A Vite, React and React Three Fiber app in `apps/web` loads the models listed in `models/manifest.json` and shows the tapped structure's name.

**Tech Stack:** Node 22 and npm workspaces, TypeScript, Vite, React, React Three Fiber, drei, three.js, Vitest, Ajv, `yaml`, glTF Transform (Node side model checks), Python 3.13 with pytest, Blender 5.2.3 run headless, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-02-anatome-design.md` (read sections 3, 6, 7, 8 and the Phase 0 task list in section 9 before starting any task).

## Global Constraints

- Docs and code comments: plain language, no em dashes, no semicolons. Comments are short and friendly, written for an owner who reads code but did not write it.
- Check current official docs before writing setup steps or code for three.js, React Three Fiber, drei, Vite, Blender's glTF exporter and Tailscale. Versions seen on 2026-11-02: three 0.187.0, @react-three/fiber 9.8.2, @react-three/drei 10.7.9, react 19.3.1, vite 8.3.5, @vitejs/plugin-react 6.2.1, typescript 7.0.2, vitest 5.1.0, ajv 8.20.0, yaml 2.9.1, Blender 5.2.3. Install the latest at install time and let the lockfile record it. If TypeScript 7 breaks a tool, fall back to the newest 6.x and note it in the commit message.
- Licenses: code MIT (`LICENSE`). Own data CC BY 4.0 (`data/LICENSE`). Meshes per file, recorded in `models/manifest.json` and `models/LICENSE`: BodyParts3D files CC BY 4.0, Z-Anatomy files CC BY-SA 4.0. Never import the Z-Anatomy inner ear, kidney or brain white matter parts.
- BodyParts3D credit text, verbatim: "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International". License page confirmed 2026-11-02 (last updated 2025/02/27).
- Z-Anatomy credit text, verbatim: "Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0".
- Nothing private in the repo: no hostnames, Tailscale names, IPs, keys or symptom data. The history becomes public at Phase 3.
- Raw downloads (`sources/`), Blender (`tools/blender/`), `node_modules/`, build output and Python virtual environments are git-ignored.
- Every action row cites at least one source that the author actually opened during this task. The `says` field holds a short quote or close paraphrase from that source. Nothing is cited from memory. `checked_by` stays `null`.
- Phone gate (reference device Samsung Galaxy A23, Chrome): hip region interactive within 5 seconds of opening the page on home Wi-Fi, no stutter when rotating.
- No external network requests from the app at runtime. The Draco decoder is self-hosted.
- All user-facing app text comes from `apps/web/src/i18n/en.json`.

## Review Focus

1. A drag to rotate the model on a phone ends with a "click". It must not select a structure. Only a tap that moved less than 6 px selects. Test in Task 6 (`shouldSelect`).
2. Tapping where structures overlap must select the nearest one under the finger, and must skip meshes with no structure id. Test in Task 6 (`pickStructure`).
3. Left and right copies of a structure must say which side they are, for example "Gluteus maximus (left)". Test in Task 6 (`formatLabel`).
4. If a model file or the Draco decoder fails to load (Tailscale drops, wrong path), the user sees a readable error message, not a blank screen. Test in Task 6 (`ModelErrorBoundary`).
5. A mesh whose structure id is missing from `data/` would show a raw id or nothing in later phases. The CI mapping check must fail the build. Test in Task 5 (`checkModelMapping`).

---

## File Structure

```
anatoMe/
├── .github/workflows/ci.yml         # validate data, check models, run all tests
├── .gitignore
├── LICENSE                          # MIT, code
├── README.md                        # educational framing, how to run
├── ATTRIBUTION.md                   # every upstream source, license, credit text
├── package.json                     # npm workspaces: apps/web, pipeline/data
├── apps/web/                        # the browser app
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── public/draco/                # self-hosted Draco decoder (copied from three)
│   ├── scripts/sync-models.mjs      # copies ../../models into public/models before dev and build
│   ├── scripts/perf-check.mjs       # Playwright pre-check with a throttled CPU
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── i18n/en.json, i18n/t.ts
│       ├── viewer/Viewer.tsx        # Canvas, camera controls, loads region files
│       ├── viewer/RegionModel.tsx   # one glb, click handling
│       ├── viewer/pick.ts           # shouldSelect, pickStructure, formatLabel
│       ├── viewer/manifest.ts       # read and type models/manifest.json
│       ├── viewer/ModelErrorBoundary.tsx
│       ├── perf/loadTimer.ts        # time to interactive, shown with ?perf=1
│       └── ui/InfoLabel.tsx, ui/Credits.tsx
├── data/
│   ├── LICENSE                      # CC BY 4.0
│   ├── schema/*.schema.json         # one schema per entity file
│   ├── joints.yaml                  # joints and their angles (degrees of freedom)
│   ├── movements.yaml
│   ├── structures/hip.yaml
│   ├── actions/hip.yaml
│   └── citations.yaml
├── models/
│   ├── LICENSE                      # per-file licenses, points to manifest.json
│   ├── manifest.json
│   └── hip*.glb
├── pipeline/
│   ├── fetch-sources.sh             # downloads raw sources, checks sha256
│   ├── get-blender.sh               # downloads Blender 5.2.3, checks sha256
│   ├── sources.sha256
│   ├── assets/
│   │   ├── regions/hip.json         # target structures with match patterns and chosen source
│   │   ├── hipmatch.py              # pure matching logic (tested)
│   │   ├── bp3d_inventory.py        # plain Python
│   │   ├── za_inventory_blender.py  # runs inside Blender
│   │   ├── build_region_blender.py  # runs inside Blender, writes models/
│   │   └── tests/test_hipmatch.py
│   └── data/                        # Node package @anatome/data-tools
│       ├── package.json
│       ├── src/validate.ts          # schema plus cross-reference checks
│       ├── src/checkModels.ts       # glb checks and mapping check
│       ├── src/cli.ts
│       └── test/*.test.ts, test/fixtures/
└── docs/phase0/                     # inventory, decision, measurements, spike report
```

---

### Task 1: Repo skeleton, licenses and README

**Files:**
- Create: `LICENSE`, `data/LICENSE`, `models/LICENSE`, `ATTRIBUTION.md`, `README.md`, `.gitignore`, `package.json`
- Keep: `docs/ideas.md`, `.claude/settings.json`

**Interfaces:**
- Produces: root `package.json` with `"private": true`, `"workspaces": ["apps/web", "pipeline/data"]`, scripts `validate`, `check-models`, `test` that call into the workspaces (filled in by Tasks 5 and 6). `.gitignore` entries: `node_modules/`, `dist/`, `sources/`, `tools/`, `.venv/`, `apps/web/public/models/`, `*.log`.

- [ ] **Step 1: Write `LICENSE`** with the standard MIT text, copyright line "Copyright (c) 2026 the anatoMe contributors".
- [ ] **Step 2: Write `data/LICENSE`** with the full CC BY 4.0 legal code, downloaded from `https://creativecommons.org/licenses/by/4.0/legalcode.txt`, and one line on top saying it covers everything in `data/`.
- [ ] **Step 3: Write `models/LICENSE`**: says each model file has its own license, listed in `models/manifest.json`, BodyParts3D-based files are CC BY 4.0, Z-Anatomy-based files are CC BY-SA 4.0, and links both license deeds.
- [ ] **Step 4: Write `ATTRIBUTION.md`** with a table: source, what we use, license, exact credit text (from Global Constraints), link. Rows: BodyParts3D, Z-Anatomy, three.js (MIT), Draco decoder (Apache 2.0). Note that old BodyParts3D OBJ headers mention CC BY-SA 2.1 Japan and that the DBCLS license page (updated 2025/02/27) supersedes them.
- [ ] **Step 5: Write `README.md`**: first paragraph states anatoMe is an educational tool for understanding how the body moves, not a diagnostic tool and not medical advice. Then: what it does today (Phase 0 spike), how to run it (filled in by Task 6), license summary pointing to the three license files and `ATTRIBUTION.md`.
- [ ] **Step 6: Check style**

Run: `grep -rn -- '—\|;' README.md ATTRIBUTION.md models/LICENSE`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add LICENSE data/LICENSE models/LICENSE ATTRIBUTION.md README.md .gitignore package.json
git commit -m "Add repo skeleton, licenses and educational README"
```

---

### Task 2: Download tools and raw sources

**Files:**
- Create: `pipeline/get-blender.sh`, `pipeline/fetch-sources.sh`, `pipeline/sources.sha256`

**Interfaces:**
- Produces: `tools/blender/blender` (executable, Blender 5.2.3). `sources/bp3d/` holding `isa_BP3D_4.0_obj_99.zip` unpacked plus `isa_parts_list_e.txt`, `isa_element_parts.txt`, `partof_parts_list_e.txt`, `partof_element_parts.txt`. `sources/z-anatomy/` holding `Z-Anatomy.zip` unpacked and `TA2.csv`.

- [ ] **Step 1: Write `pipeline/get-blender.sh`**: downloads `https://download.blender.org/release/Blender5.2/blender-5.2.3-linux-x64.tar.xz` and `blender-5.2.3.sha256` from the same folder, verifies the tarball line with `sha256sum -c`, unpacks to `tools/blender/` so `tools/blender/blender` exists. Idempotent: skips the download if the verified tarball is already there. `set -euo pipefail`.
- [ ] **Step 2: Write `pipeline/fetch-sources.sh`**: downloads the BodyParts3D files from `https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/` and the Z-Anatomy files with `git clone --depth 1 https://github.com/Z-Anatomy/Models-of-human-anatomy` into a temp folder (only `Z-Anatomy.zip`, `TA2.csv`, `License.txt` are kept). Checks every file against `pipeline/sources.sha256`. With `--record`, it writes that file instead of checking it. Unzips into the folders listed above.
- [ ] **Step 3: Run both scripts and record checksums**

Run: `bash pipeline/get-blender.sh && bash pipeline/fetch-sources.sh --record && bash pipeline/fetch-sources.sh`
Expected: second run of `fetch-sources.sh` prints `OK` for every file and exits 0. `tools/blender/blender --version` prints `Blender 5.2.3`.

- [ ] **Step 4: Confirm the upstream licenses did not change**: `sources/z-anatomy/License.txt` still lists the inner ear and kidney as the only NC parts. Fetch `https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html` and confirm it still says CC BY 4.0. If either changed, stop and report to the owner.
- [ ] **Step 5: Commit**

```bash
git add pipeline/get-blender.sh pipeline/fetch-sources.sh pipeline/sources.sha256
git commit -m "Add scripts to fetch Blender and raw mesh sources with checksums"
```

---

### Task 3: Inventory both mesh sources and choose

**Files:**
- Create: `pipeline/assets/regions/hip.json`, `pipeline/assets/hipmatch.py`, `pipeline/assets/bp3d_inventory.py`, `pipeline/assets/za_inventory_blender.py`, `pipeline/assets/tests/test_hipmatch.py`, `docs/phase0/mesh-inventory.md`, `docs/phase0/mesh-source-decision.md`

**Interfaces:**
- Consumes: `sources/` and `tools/blender/blender` from Task 2.
- Produces:
  - `regions/hip.json`: `{"region": "hip", "targets": [Target]}` where `Target = {"sid": str, "type": StructureType, "english": str, "patterns": [str], "required": bool, "source": "bp3d" | "z-anatomy" | null}`. `StructureType` is one of `bone, muscle, tendon, ligament, joint, capsule, labrum, bursa, nerve`. `source` is `null` until Step 7.
  - `hipmatch.py`: `MeshRecord = TypedDict(source: str, mesh_name: str, english: str, side: Literal["l","r",""], faces: int, bytes: int, fma: str | None)`, `match_targets(records: list[MeshRecord], targets: list[dict]) -> dict[str, list[MeshRecord]]` (sid to matching records), `side_of(name: str) -> Literal["l","r",""]`.
  - Both inventory scripts write JSON lines of `MeshRecord` to `sources/<source>-inventory.jsonl`.

- [ ] **Step 1: Write `regions/hip.json`** with these targets. `sid` is kebab-case English. `required: true` marks what the decision rule depends on.
  - Bones (required): hip bone (or ilium, ischium, pubis if split), sacrum, coccyx, femur, patella, tibia, fibula.
  - Muscles (required): gluteus maximus, gluteus medius, gluteus minimus, tensor fasciae latae, piriformis, superior gemellus, inferior gemellus, obturator internus, obturator externus, quadratus femoris, iliacus, psoas major, pectineus, adductor longus, adductor brevis, adductor magnus, gracilis, sartorius, rectus femoris, vastus lateralis, vastus medialis, vastus intermedius, biceps femoris (long head, short head), semitendinosus, semimembranosus.
  - Tendons (required): iliotibial tract, quadriceps tendon, patellar ligament.
  - Ligaments (required): iliofemoral ligament, pubofemoral ligament, ischiofemoral ligament.
  - Optional: psoas minor, ligament of head of femur, transverse acetabular ligament, sacrotuberous ligament, sacrospinous ligament, inguinal ligament, acetabular labrum, hip joint capsule, trochanteric bursa, iliopectineal bursa, ischial bursa, knee cruciate and collateral ligaments, menisci.
  - `patterns` are case-insensitive regexes over the English mesh name, side suffix removed.
- [ ] **Step 2: Write the failing tests** in `tests/test_hipmatch.py`:

```python
def test_side_of_handles_both_naming_styles():
    assert side_of("Gluteus maximus muscle.l") == "l"
    assert side_of("Right gluteus maximus") == "r"
    assert side_of("Sacrum") == ""

def test_match_targets_finds_left_and_right():
    recs = [rec("Left gluteus maximus"), rec("Right gluteus maximus"), rec("Left gluteus medius")]
    m = match_targets(recs, [target("gluteus-maximus", [r"gluteus maximus"])])
    assert {r["side"] for r in m["gluteus-maximus"]} == {"l", "r"}

def test_match_targets_does_not_confuse_similar_names():
    recs = [rec("Left adductor magnus"), rec("Left adductor minimus")]
    m = match_targets(recs, [target("adductor-magnus", [r"\badductor magnus\b"])])
    assert [r["english"] for r in m["adductor-magnus"]] == ["Left adductor magnus"]

def test_unmatched_target_maps_to_empty_list():
    assert match_targets([], [target("piriformis", ["piriformis"])])["piriformis"] == []
```

`rec` and `target` are small helpers in the test file.

- [ ] **Step 3: Run tests to verify they fail**

Run: `python3 -m venv .venv && .venv/bin/pip install -q pytest && .venv/bin/pytest pipeline/assets/tests -q`
Expected: FAIL, `hipmatch` not found.

- [ ] **Step 4: Implement `hipmatch.py`** (standard library only, so Blender's Python can import it too).
- [ ] **Step 5: Run tests to verify they pass**

Run: `.venv/bin/pytest pipeline/assets/tests -q`
Expected: 4 passed.

- [ ] **Step 6: Write and run the two inventory scripts**
  - `bp3d_inventory.py` (plain Python): joins `isa_element_parts.txt` (concept to FJ element files) with `isa_parts_list_e.txt` (FMA id and English name). One record per element OBJ, faces counted from `f ` lines, bytes from file size.
  - `za_inventory_blender.py`: opens the `.blend` from `Z-Anatomy.zip`, one record per mesh object with its name, face count, and an estimated size (faces times 50 bytes, labelled "estimated" in the report).
  - Both then call `match_targets` with `regions/hip.json` and print a table.

Run: `.venv/bin/python pipeline/assets/bp3d_inventory.py && tools/blender/blender -b --factory-startup -P pipeline/assets/za_inventory_blender.py`
Expected: both print one row per target with left and right match counts. Write the combined table into `docs/phase0/mesh-inventory.md` (target, type, required, BodyParts3D matches and faces, Z-Anatomy matches and faces).

- [ ] **Step 7: Apply the decision rule and record it**
  - Rule: every `required` target that BodyParts3D has as its own mesh (left and right where the structure is paired) gets `"source": "bp3d"`. Every `required` target it lacks but Z-Anatomy has gets `"source": "z-anatomy"`. Optional targets follow the same rule if either source has them, else `null`.
  - If any `required` target has no mesh in either source, list it in the decision doc as a known gap. Do not invent geometry.
  - If any target is `z-anatomy`, check alignment: open both femurs in Blender, compare bounding boxes after converting BodyParts3D from millimetres to metres. Record the scale and offset needed, or "aligned".
  - Write `docs/phase0/mesh-source-decision.md`: counts per source, the list of Z-Anatomy targets, gaps, alignment result, and what that means for licenses (which files are CC BY-SA).
- [ ] **Step 8: Commit**

```bash
git add pipeline/assets docs/phase0
git commit -m "Inventory hip structures in BodyParts3D and Z-Anatomy and choose sources"
```

---

### Task 4: Export the hip region to glTF

**Files:**
- Create: `pipeline/assets/build_region_blender.py`, `models/manifest.json`, `models/hip.glb` (plus `models/hip-z-anatomy.glb` only if Task 3 assigned any target to Z-Anatomy)
- Modify: `ATTRIBUTION.md` (state which model files exist and their sources)

**Interfaces:**
- Consumes: `regions/hip.json` with `source` filled, `hipmatch.py`, `sources/`.
- Produces:
  - Every mesh node in each glb carries glTF extras (three.js `userData`): `{"sid": str, "label": str, "side": "l" | "r" | "", "kind": StructureType, "source": "bp3d" | "z-anatomy"}`. `label` is the target's `english` value.
  - `models/manifest.json`: `{"regions": {"hip": {"files": [{"path": "hip.glb", "source": "bp3d", "license": "CC-BY-4.0"}]}}}`. A Z-Anatomy file adds `{"path": "hip-z-anatomy.glb", "source": "z-anatomy", "license": "CC-BY-SA-4.0"}`.
  - Units: metres, Y up. Origin unchanged from the source (the app frames the camera from the bounding box).

- [ ] **Step 1: Read free-muscles' `scripts/build-anatomy.py`** (https://github.com/tiralonghipol/free-muscles) for the decimate and export pattern. Check the Blender 5.2 manual for `bpy.ops.export_scene.gltf` and `bpy.ops.wm.obj_import` parameter names before writing.
- [ ] **Step 2: Write `build_region_blender.py`**, invoked as `blender -b --factory-startup -P build_region_blender.py -- --region hip --source bp3d --out models/hip.glb`. It imports only targets whose `source` matches, sets extras, removes materials, UVs and colour attributes, decimates, and exports GLB with Draco (level 10, position quantization 14, normal quantization 8, as free-muscles does).
  - Decimation budget **(builder's call)**: at most 150,000 triangles in total for the hip region across all files. Bones at ratio 0.12, everything else at 0.14, no mesh under 120 faces, the same starting values as free-muscles. Lower the ratios if the budget is exceeded.
- [ ] **Step 3: Run the export**

Run: `tools/blender/blender -b --factory-startup -P pipeline/assets/build_region_blender.py -- --region hip --source bp3d --out models/hip.glb`
Expected: prints one line per kind with mesh and face counts, a `TOTAL` line at or under 150000 faces, and `WROTE models/hip.glb`. Repeat with `--source z-anatomy --out models/hip-z-anatomy.glb` if needed.

- [ ] **Step 4: Write `models/manifest.json`** and update `ATTRIBUTION.md`. The automated checks for these files come in Task 5.
- [ ] **Step 5: Commit**

```bash
git add pipeline/assets/build_region_blender.py models ATTRIBUTION.md
git commit -m "Export hip region to Draco-compressed glTF with structure ids"
```

---

### Task 5: Data schema, validator, model checks, 10 sourced rows, CI

**Files:**
- Create: `data/schema/{joints,movements,structures,actions,citations}.schema.json`, `data/joints.yaml`, `data/movements.yaml`, `data/structures/hip.yaml`, `data/actions/hip.yaml`, `data/citations.yaml`, `pipeline/data/package.json`, `pipeline/data/src/{validate,checkModels,cli}.ts`, `pipeline/data/test/validate.test.ts`, `pipeline/data/test/checkModels.test.ts`, `pipeline/data/test/fixtures/`, `.github/workflows/ci.yml`
- Modify: root `package.json` scripts

**Interfaces:**
- Consumes: `models/manifest.json` and glb extras from Task 4, `regions/hip.json` target list.
- Produces (YAML shapes, field names fixed here):
  - `joints.yaml`: `- id: hip`, `dofs: [{id: flexion, positive: flexion, negative: extension}, {id: abduction, positive: abduction, negative: adduction}, {id: rotation, positive: internal rotation, negative: external rotation}]`, and `knee` with `flexion`. An angle reference is written `<joint>.<dof>`, for example `hip.flexion`.
  - `movements.yaml`: `- {id: hip-internal-rotation, dof: hip.rotation, direction: positive, english: Hip internal rotation}`. One movement per direction per dof, for hip and knee.
  - `structures/hip.yaml`: `- {id: gluteus-maximus, type: muscle, english: Gluteus maximus, latin: Musculus gluteus maximus, fma: "FMA22314", region: hip}`. One entry per target in `regions/hip.json` that has a mesh. `latin` comes from Z-Anatomy's `TA2.csv` when present, else omitted. `fma` comes from BodyParts3D when present, else omitted.
  - `citations.yaml`: `- {id: openstax-ap2e-11-6, title: str, authors: str, year: int, url: str, license: str, access: open}`.
  - `actions/hip.yaml`: `- {id: str, structure: <structure id>, movement: <movement id>, load: working | stretched | pinched, role: primary | secondary, when: [{angle: hip.flexion, min: 0, max: 60}], confidence: high | medium | low, citations: [{ref: <citation id>, locator: str, says: str}], checked_by: null}`. `role` is required only when `load` is `working`. `when` is optional, and its entries are ANDed. Angles are in degrees.
  - `validate.ts`: `validateDataDir(dir: string): ValidationResult` where `ValidationResult = {ok: boolean, errors: {file: string, path: string, message: string}[]}`.
  - `checkModels.ts`: `checkModelMapping(modelsDir: string, structureIds: Set<string>): Promise<ValidationResult>` (every mesh `sid` exists in `structureIds`, every mesh has all five extras keys, every manifest file exists with an allowed license) and `modelStats(file: string): Promise<{meshes: number, triangles: number, bytes: number}>`. Uses `@gltf-transform/core`, `@gltf-transform/extensions` and `draco3dgltf` to read Draco files.
  - Root scripts: `npm run validate` (data), `npm run check-models`, `npm test` (all workspaces plus pytest).

- [ ] **Step 1: Write the failing validator tests** in `validate.test.ts`, one fixture folder per case under `test/fixtures/`:

```ts
test("valid fixture passes", () => expect(validateDataDir(fx("valid")).ok).toBe(true));
test("ligament cannot be working", () => expectError(fx("ligament-working"), /load must be stretched or pinched for type ligament/));
test("working row needs a role", () => expectError(fx("working-no-role"), /role is required when load is working/));
test("unknown angle in when", () => expectError(fx("bad-angle"), /unknown angle hip\.twist/));
test("min greater than max", () => expectError(fx("min-gt-max"), /min must be less than max/));
test("row without citations", () => expectError(fx("no-citations"), /at least one citation/));
test("citation must have says", () => expectError(fx("no-says"), /says is required/));
test("missing citation id", () => expectError(fx("missing-citation"), /unknown citation/));
test("missing structure id", () => expectError(fx("missing-structure"), /unknown structure/));
test("duplicate ids", () => expectError(fx("duplicate-id"), /duplicate id gluteus-maximus/));
test("checked_by must be null or a non-empty string", () => expectError(fx("checked-empty"), /checked_by/));
```

Load-type rule: `bone` and `joint` never appear in actions. `ligament`, `capsule`, `labrum` and `bursa` only allow `stretched` or `pinched`. `muscle` and `tendon` allow all three.

- [ ] **Step 2: Write the failing model check tests** in `checkModels.test.ts`, using tiny glb fixtures created in the test with glTF Transform (a single triangle per mesh):

```ts
test("passes when every sid is known", async () => expect((await checkModelMapping(dir([{sid: "femur"}]), new Set(["femur"]))).ok).toBe(true));
test("fails on unknown sid", async () => expectError(await checkModelMapping(dir([{sid: "femurr"}]), new Set(["femur"])), /unknown structure id femurr/));
test("fails on missing extras key", async () => expectError(await checkModelMapping(dir([{sid: "femur", side: undefined}]), new Set(["femur"])), /missing side/));
test("fails on manifest file that does not exist", async () => expectError(await checkModelMapping(dirWithMissingFile(), new Set()), /not found/));
test("fails on unknown license", async () => expectError(await checkModelMapping(dirWithLicense("CC-BY-NC-4.0"), new Set(["femur"])), /license/));
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm install && npm test -w pipeline/data`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement `validate.ts`, `checkModels.ts` and `cli.ts`** (Ajv for the shape, plain TypeScript for cross references and the load-type rule). `cli.ts` takes `validate <dataDir>` or `check-models <modelsDir> <dataDir>` and exits 1 on errors, printing `file path: message` per line.
- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -w pipeline/data`
Expected: all tests pass.

- [ ] **Step 6: Write the real data**: `joints.yaml`, `movements.yaml`, and `structures/hip.yaml` for every exported mesh. Then run the model check.

Run: `npm run check-models`
Expected: exit 0. Also print `modelStats` for each glb and confirm the triangle total is at or under 150000.

- [ ] **Step 7: Write 10 action rows** in `actions/hip.yaml` from open-access sources (for example OpenStax Anatomy and Physiology 2e, CC BY 4.0, and open-access papers found through PubMed Central). Open each source during this step and copy the supporting sentence into `says`. Required coverage:
  - At least 6 `working` rows across hip flexion, extension, abduction, adduction and rotation.
  - At least 1 row with a `when` condition on `hip.flexion` that shows a role change (for example piriformis rotation with the hip straight versus bent past about 60 to 90 degrees).
  - At least 1 `stretched` row (for example the ischiofemoral ligament in internal rotation).
  - At least 1 `pinched` row (for example the anterior acetabular labrum in deep flexion with internal rotation).
  - If no open source supports one of the examples, pick a different row that meets the same coverage rule and say so in the commit message.

Run: `npm run validate`
Expected: exit 0.

- [ ] **Step 8: Write `.github/workflows/ci.yml`**: on push and pull request. Ubuntu, Node 22, `npm ci`, `npm run validate`, `npm run check-models`, `npm test`. Python 3.13 with pytest for `pipeline/assets/tests`. Pin action versions to their current major versions, checked in the GitHub docs.
- [ ] **Step 9: Commit**

```bash
git add data pipeline/data .github package.json package-lock.json
git commit -m "Add data schema, validator, model mapping check, 10 sourced hip rows and CI"
```

---

### Task 6: Minimal viewer, tap a structure to see its name

**Files:**
- Create: everything under `apps/web/` listed in File Structure, plus `apps/web/src/**/*.test.ts(x)`
- Modify: `README.md` (how to run), root `package.json` scripts (`dev`, `build`)

**Interfaces:**
- Consumes: `models/manifest.json` and glb extras from Task 4.
- Produces:
  - `pick.ts`: `shouldSelect(dragPx: number): boolean` (true when `dragPx < 6`). `pickStructure(hits: {object: Object3D, distance: number}[]): PickedStructure | null`, which returns the nearest hit whose object or nearest ancestor has `userData.sid`. `PickedStructure = {sid: string, label: string, side: "l" | "r" | "", kind: string}`. `formatLabel(p: PickedStructure, t: Translate): string`.
  - `i18n/t.ts`: `type Translate = (key: string, vars?: Record<string, string>) => string`, `createT(messages: Record<string, string>): Translate`. A missing key returns the key itself and logs a warning in dev.
  - `en.json` keys: `side.left` = "{label} (left)", `side.right` = "{label} (right)", `info.tapHint` = "Tap a structure to see its name", `error.modelLoad` = "The 3D model could not be loaded. Check your connection and reload the page.", `credits.title` = "Credits", `about.educational` = "anatoMe is for learning how the body moves. It is not a diagnostic tool and not medical advice."
  - `manifest.ts`: `loadManifest(url: string): Promise<Manifest>` and `regionFiles(m: Manifest, region: string): string[]`.
  - `perf/loadTimer.ts`: `markInteractive(): number` returns ms since `performance.timeOrigin` the first time the region is rendered and the controls are ready, and stores it on `window.__anatomeInteractiveMs`. Later calls return the first value. Shown in a small overlay only when the URL has `?perf=1`.

- [ ] **Step 1: Scaffold** with the current Vite React TypeScript template (check the Vite docs for the exact `npm create vite@latest` command), add `three`, `@react-three/fiber`, `@react-three/drei`, `vitest`, `jsdom`, `@testing-library/react`. Copy three's Draco decoder files (`node_modules/three/examples/jsm/libs/draco/gltf/`) into `public/draco/`. Write `scripts/sync-models.mjs` and run it from `predev` and `prebuild`.
- [ ] **Step 2: Write the failing tests**

```ts
// pick.test.ts
test("a tap selects", () => expect(shouldSelect(3)).toBe(true));
test("a drag does not select", () => expect(shouldSelect(6)).toBe(false));
test("nearest hit with a sid wins", () => {
  const near = mesh({}), mid = mesh({sid: "gluteus-medius", label: "Gluteus medius", side: "l", kind: "muscle"}), far = mesh({sid: "femur", label: "Femur", side: "l", kind: "bone"});
  expect(pickStructure([{object: far, distance: 3}, {object: near, distance: 1}, {object: mid, distance: 2}])?.sid).toBe("gluteus-medius");
});
test("sid on a parent is found", () => expect(pickStructure([{object: childOf({sid: "femur", label: "Femur", side: "r", kind: "bone"}), distance: 1}])?.sid).toBe("femur"));
test("no sid anywhere gives null", () => expect(pickStructure([{object: mesh({}), distance: 1}])).toBeNull());
test("left label", () => expect(formatLabel({sid: "x", label: "Gluteus maximus", side: "l", kind: "muscle"}, t)).toBe("Gluteus maximus (left)"));
test("unpaired label has no side", () => expect(formatLabel({sid: "sacrum", label: "Sacrum", side: "", kind: "bone"}, t)).toBe("Sacrum"));

// t.test.ts
test("fills variables", () => expect(createT({a: "{x} y"})("a", {x: "1"})).toBe("1 y"));
test("missing key returns key", () => expect(createT({})("nope")).toBe("nope"));

// ModelErrorBoundary.test.tsx
test("shows the load error message when a child throws", () => {
  render(<ModelErrorBoundary t={t}><Thrower /></ModelErrorBoundary>);
  expect(screen.getByText(en["error.modelLoad"])).toBeTruthy();
});

// manifest.test.ts
test("regionFiles lists every file for the region", () => expect(regionFiles(sample, "hip")).toEqual(["models/hip.glb"]));
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement** `pick.ts`, `t.ts`, `manifest.ts`, `ModelErrorBoundary.tsx`, then `Viewer.tsx`, `RegionModel.tsx`, `InfoLabel.tsx`, `Credits.tsx` and `App.tsx`.
  - The Canvas uses `dpr={[1, 2]}` and drei camera controls, framed on the loaded region's bounding box.
  - Load models with drei `useGLTF` using the local decoder path `/draco/` (or the base-relative equivalent).
  - Click handling: use R3F's pointer event `delta` with `shouldSelect`, then call `pickStructure` on the event's intersections. Highlight the picked mesh with a lighter tint and show `formatLabel` in `InfoLabel`. A tap on empty space clears the selection.
  - `Credits` lists the credit lines from `ATTRIBUTION.md` and the educational line from `about.educational`.
  - Configure Vite with `base: "./"` so the build works from any folder.
- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -w apps/web`
Expected: all pass.

- [ ] **Step 6: Check it in a browser**

Run: `npm run build && npx vite preview --port 4173 -w apps/web` and, with Playwright, open `http://localhost:4173/?perf=1`, click the centre of a gluteal muscle and take a screenshot to `docs/phase0/screenshot-desktop.png`.
Expected: the hip renders, a label like "Gluteus maximus (left)" shows, the perf overlay shows a number, and the browser network log has no requests to other hosts.

- [ ] **Step 7: Commit**

```bash
git add apps/web README.md package.json package-lock.json docs/phase0/screenshot-desktop.png
git commit -m "Add minimal hip viewer with tap-to-name, error state and credits"
```

---

### Task 7: Performance pre-check, homelab deploy guide, phone measurement

**Files:**
- Create: `apps/web/scripts/perf-check.mjs`, `docs/deploy-homelab.md`, `docs/phase0/phone-measurements.md`

**Interfaces:**
- Consumes: the built app from Task 6 and `window.__anatomeInteractiveMs` set by `markInteractive`.

- [ ] **Step 1: Write `perf-check.mjs`**: starts `vite preview`, opens the page in Playwright Chromium at a 412 x 915 viewport with CPU throttling 4x (through the Chrome DevTools Protocol `Emulation.setCPUThrottlingRate`), no network throttling, cache disabled. Reads `window.__anatomeInteractiveMs` five times and prints the median. Exits 1 if the median is 5000 ms or more. This is only a proxy for the phone.

Run: `node apps/web/scripts/perf-check.mjs`
Expected: prints `median interactive ms: <n>` with n under 5000 and exits 0. If not, lower the decimation ratios in Task 4, re-export, and repeat.

- [ ] **Step 2: Write `docs/deploy-homelab.md`** for the owner, leaving nothing to guess:
  - Prerequisites: Tailscale on the homelab and the phone, MagicDNS and HTTPS certificates enabled in the Tailscale admin console. Link the current Tailscale docs for each.
  - Build on the dev machine: `npm ci && npm run build`. The output folder is `apps/web/dist/`. Show the expected tree.
  - Copy: `rsync -av --delete apps/web/dist/ <user>@<homelab>:/srv/anatome/`, with the placeholders explained. No real names go in the repo.
  - Serve: `sudo tailscale serve --bg /srv/anatome` (check the current `tailscale serve` docs first). The address is `https://<machine-name>.<tailnet>.ts.net/`. Also how to stop it: `sudo tailscale serve --https=443 off`.
  - The phone test steps from Step 3.
- [ ] **Step 3: Owner measures on the Galaxy A23** (owner action, the implementer prepares `phone-measurements.md` as a table to fill): clear Chrome's site data for the address, open `https://<address>/?perf=1` on home Wi-Fi, note the number. Repeat 3 times. Rotate the model for 10 seconds and note any stutter (yes or no). Tap 5 different structures and note whether the right name appears.
- [ ] **Step 4: Commit**

```bash
git add apps/web/scripts/perf-check.mjs docs/deploy-homelab.md docs/phase0/phone-measurements.md
git commit -m "Add performance pre-check, homelab deploy guide and phone measurement sheet"
```

---

### Task 8: Spike report and roadmap review

**Files:**
- Create: `docs/phase0/spike-report.md`
- Modify: `docs/superpowers/specs/2026-11-02-anatome-design.md` (section 9 effort estimates and the Phase 0 gate result)

**Interfaces:**
- Consumes: `mesh-inventory.md`, `mesh-source-decision.md`, `phone-measurements.md`, `modelStats` output, and the experience of writing the 10 rows.

- [ ] **Step 1: Write `spike-report.md`**, outcome first: gate passed or not with the phone numbers, then the mesh source decision and gaps, triangle and byte counts, how long the 10 rows took and how hard open sources were to find, surprises, and recommended changes. Tag every estimate with a confidence level.
- [ ] **Step 2: Update spec section 9** effort estimates for Phases 1 and 2 based on the report, and mark Phase 0 done or blocked. Keep the changes small and dated.
- [ ] **Step 3: Check style**

Run: `grep -rn -- '—\|;' docs/phase0 docs/deploy-homelab.md docs/superpowers/specs`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add docs
git commit -m "Add Phase 0 spike report and update roadmap estimates"
```
