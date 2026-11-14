# anatoMe Phase 2b Area Lookup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a person tap a spot on the model and read which structures lie under it, from the surface inwards, with the movements that load each one.

**Architecture:** A new "Area" tab. A tap in that tab sends five rays (one under the finger, four around it) through all meshes, also the hidden ones. A pure module (`area/under.ts`) merges the hits into one list ordered by depth and cuts it off at the first bone or at a fixed depth. A panel shows the list with the checked movements per structure. The same machinery answers "what lies over and under this structure" from the info panel.

**Tech Stack:** As plan 2a. No new dependency. Uses three's `Raycaster` directly.

**Spec:** `docs/superpowers/specs/2026-11-02-anatome-design.md` (section 2 "Explore by area", the anti-goals, and the Phase 2 row of section 9). Builds on `docs/superpowers/plans/2026-11-13-phase-2a-movement-explorer.md`, which must be merged first.

## Global Constraints

- Everything in the Global Constraints of plan 2a applies here unchanged.
- The area panel never says or implies what causes a symptom. It lists what is modelled under a spot.
- Rays look at every mesh, whatever the layers hide, so the list never depends on what happens to be switched off.

## Design decisions (builder's calls, the owner can overrule)

1. **No hand-written region map.** The spec's "Region map" entity is not created. The meshes already know what lies under a spot, and a hand-written map would be a second source of truth to keep right.
2. **A fingertip, not a point.** Five rays: the tap itself and four at 14 CSS pixels up, down, left and right. A structure counts when any ray hits it.
3. **Where the list stops.** At the first bone the centre ray meets (the bone is included), or 0.12 model metres under the first hit, whichever comes first. Without the depth limit a ray through the inner thigh would go on into the other leg.
4. **Depth is measured from the outermost modelled structure.** The model has no skin or fat. The panel says so in one line.
5. **"Over and under this structure"** uses the same rays, sent through the middle of the structure from the current camera side. There the list runs to 0.03 model metres behind the structure and does not stop at bone. The heading says "seen from here", because the answer depends on the viewing side.
6. **Movements per structure** come from the bundle's action rows, so only checked rows show in the normal build. A structure with waiting rows gets the existing waiting line.

## Review Focus

1. A drag to rotate in the Area tab must not count as a tap, and a tap on empty space must clear the list and bring the hint back. Test in Task 2 (`RegionModel` tap path) and Task 3 (`App`).
2. A ray that leaves one thigh and enters the other must not list structures of the other leg. Test in Task 1 (`structuresUnder`, depth limit).
3. A hidden or peeled structure is still listed, and choosing it in the list makes it visible again. Test in Task 2 (`castFingerRays` ignores `visible`) and Task 3 (`App`).
4. With no checked rows (today's real data) an entry shows its name, type and depth, the waiting line when rows wait, and no empty "Loaded by" heading. Test in Task 3 (`AreaPanel`).
5. A tap that only the outer rays hit (the finger sits just beside the model) must give an empty list, not a list with a made-up surface. Test in Task 1.

---

## File Structure

```
apps/web/src/
├── area/under.ts            # new: pure merge of ray hits into a depth list (Task 1)
├── area/AreaPanel.tsx       # new (Task 3)
├── viewer/castRays.ts       # new: the five rays (Task 2)
├── viewer/pick.ts           # structureOf exported (Task 2)
├── viewer/RegionModel.tsx   # area taps, marker, probe (Task 2)
├── viewer/Scene.tsx         # passes the new props (Task 2)
├── ui/PanelArea.tsx         # shows the area panel (Task 3)
├── ui/InfoPanel.tsx         # "over and under" button (Task 3)
└── App.tsx                  # area state and the third tab (Task 3)
pipeline/data/src/checkModels.ts   # prints the model size (Task 2)
apps/web/e2e/area.spec.ts          # new (Task 4)
```

---

### Task 1: The depth list

**Files:**
- Create: `apps/web/src/area/under.ts`
- Test: `apps/web/src/area/under.test.ts`

**Interfaces:**
- Consumes: `Side` from `viewer/pick.ts`.
- Produces:

```ts
export type RayHit = { sid: string; side: Side; kind: string; distance: number };   // kind is the mesh's kind, "bone" for bones
export type UnderEntry = { sid: string; side: Side; distance: number; depth: number }; // depth: model metres under the first hit, never negative
export const CAP_M = 0.12;
export const BEHIND_TARGET_M = 0.03;
export function structuresUnder(center: RayHit[], around: RayHit[][], through?: { sid: string; side: Side }): UnderEntry[];
```

  - `center` empty gives `[]`.
  - `surface` is the smallest distance in `center`.
  - Without `through`: `stop` is the smaller of the distance of the nearest `kind === "bone"` hit in `center` and `surface + CAP_M`.
  - With `through`: `stop` is the smallest distance of that structure and side over all rays plus `BEHIND_TARGET_M`. When no ray hits it, the function falls back to the rule without `through`.
  - All rays are merged. Each sid and side keeps its smallest distance. Entries with `distance <= stop` stay.
  - `depth` is `Math.max(0, distance - surface)`. The result is sorted by distance, then by sid, then by side ("" before "l" before "r"), so two hits at the same distance always come out in the same order.

- [ ] **Step 1: Write the failing tests**

```ts
const hit = (sid: string, distance: number, kind = "muscle", side: Side = "l"): RayHit => ({ sid, side, kind, distance });

test("orders by distance and stops at the first bone", () => {
  const center = [hit("sartorius", 1.0), hit("iliacus", 1.02), hit("femur", 1.05, "bone"), hit("gluteus-maximus", 1.1)];
  expect(structuresUnder(center, []).map((e) => e.sid)).toEqual(["sartorius", "iliacus", "femur"]);
});
test("depth is measured from the first hit", () => {
  const out = structuresUnder([hit("sartorius", 1.0), hit("femur", 1.05, "bone")], []);
  expect(out[0].depth).toBe(0);
  expect(out[1].depth).toBeCloseTo(0.05);
});
test("without a bone the list stops 0.12 under the surface", () => {
  const center = [hit("gracilis", 1.0), hit("adductor-magnus", 1.1), hit("gracilis", 1.3, "muscle", "r")];
  expect(structuresUnder(center, []).map((e) => `${e.sid}|${e.side}`)).toEqual(["gracilis|l", "adductor-magnus|l"]);
});
test("a far bone does not lift the depth limit", () => {
  const center = [hit("gracilis", 1.0), hit("femur", 1.4, "bone", "r")];
  expect(structuresUnder(center, []).map((e) => e.sid)).toEqual(["gracilis"]);
});
test("a structure only an outer ray hits is included", () => {
  const out = structuresUnder([hit("sartorius", 1.0), hit("femur", 1.05, "bone")], [[hit("rectus-femoris", 1.01)]]);
  expect(out.map((e) => e.sid)).toEqual(["sartorius", "rectus-femoris", "femur"]);
});
test("the nearest hit of a structure wins across rays", () => {
  const out = structuresUnder([hit("sartorius", 1.0)], [[hit("sartorius", 0.99)]]);
  expect(out).toEqual([{ sid: "sartorius", side: "l", distance: 0.99, depth: 0 }]);
});
test("an empty centre ray gives nothing, even when outer rays hit", () => expect(structuresUnder([], [[hit("sartorius", 1.0)]])).toEqual([]));
test("through a target the list passes bone and ends just behind the target", () => {
  const center = [hit("gluteus-maximus", 1.0), hit("hip-bone", 1.04, "bone"), hit("iliacus", 1.06), hit("psoas-major", 1.08), hit("sartorius", 1.2)];
  expect(structuresUnder(center, [], { sid: "iliacus", side: "l" }).map((e) => e.sid)).toEqual(["gluteus-maximus", "hip-bone", "iliacus", "psoas-major"]);
});
test("a target that no ray hits falls back to the normal rule", () => {
  const center = [hit("sartorius", 1.0), hit("femur", 1.05, "bone"), hit("biceps-femoris-long-head", 1.1)];
  expect(structuresUnder(center, [], { sid: "piriformis", side: "l" }).map((e) => e.sid)).toEqual(["sartorius", "femur"]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web -- under`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `structuresUnder`** as specified.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web -- under`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/area
git commit -m "Add the pure depth list for the structures under a tapped spot"
```

---

### Task 2: Rays, marker and probe in the viewer

**Files:**
- Create: `apps/web/src/viewer/castRays.ts`
- Modify: `apps/web/src/viewer/pick.ts`, `apps/web/src/viewer/RegionModel.tsx`, `apps/web/src/viewer/Scene.tsx`, `apps/web/src/viewer/Viewer.tsx`, `pipeline/data/src/checkModels.ts`, `pipeline/data/src/cli.ts`
- Test: `apps/web/src/viewer/castRays.test.ts`, `pipeline/data/test/checkModels.test.ts`

**Interfaces:**
- Consumes: `RayHit`, `structuresUnder` (Task 1).
- Produces:

```ts
// viewer/pick.ts
export function structureOf(object: Object3D): PickedStructure | null;   // was private

// viewer/castRays.ts
export const FINGER_PX = 14;
export function castFingerRays(
  pointer: { x: number; y: number },          // normalised device coordinates of the tap, -1 to 1
  size: { width: number; height: number },    // canvas size in CSS pixels
  camera: Camera,
  roots: Object3D[],
): { center: RayHit[]; around: RayHit[][] };
// Each ray keeps the nearest hit per sid and side. Meshes with visible false are hit too.

// new SceneProps and RegionModel props
//   areaMode: boolean
//   onAreaTap: (tap: { entries: UnderEntry[]; point: [number, number, number]; through: Selection | null } | null) => void
//   areaMarker: [number, number, number] | null
//   areaProbe: Selection | null      // a new object each time, like focus
```

  - In area mode a tap that passes `shouldSelect` calls `castFingerRays` and then `onAreaTap` with `structuresUnder(center, around)`, the world position of the nearest centre hit as `point` and `through: null`. A tap whose centre ray hits nothing calls `onAreaTap(null)`. `onSelect` is not called in area mode. In `Scene.tsx` a tap on empty canvas in area mode calls `onAreaTap(null)` under the `shouldClear` rule.
  - A change of `areaProbe` makes `RegionModel` take the middle of the bounding box of that structure's meshes, project it to normalised device coordinates, cast the five rays there and call `onAreaTap` with `structuresUnder(center, around, probe)`, the box middle as `point` and `through: probe`.
  - `areaMarker` draws a white sphere of radius 0.006 at that point with a `MeshBasicMaterial` that has `depthTest: false`, so it shows through the model. It asks for a frame when it changes.
  - `modelStats` also returns `size: [number, number, number]`, the bounding box of the file in model units (use `getBounds` from `@gltf-transform/core`, check its docs first). `check-models` prints it per file, rounded to three decimals.

- [ ] **Step 1: Write the failing tests**

```ts
// castRays.test.ts, with real three objects (no WebGL needed)
function box(sid: string, z: number, kind = "muscle", visible = true) {
  const mesh = new Mesh(new BoxGeometry(1, 1, 0.1));
  mesh.position.z = z;
  mesh.userData = { sid, side: "l", kind, label: sid };
  mesh.visible = visible;
  mesh.updateMatrixWorld();
  return mesh;
}
const camera = new PerspectiveCamera(40, 1, 0.01, 20);
camera.position.z = 5;
camera.updateMatrixWorld();
const size = { width: 400, height: 400 };

test("the centre ray lists every structure along it, nearest first", () => {
  const { center } = castFingerRays({ x: 0, y: 0 }, size, camera, [box("far", -1), box("near", 0)]);
  expect(center.map((h) => h.sid)).toEqual(["near", "far"]);
  expect(center[0].distance).toBeCloseTo(4.95);
});
test("a mesh that is switched off is still hit", () =>
  expect(castFingerRays({ x: 0, y: 0 }, size, camera, [box("hidden", 0, "muscle", false)]).center.map((h) => h.sid)).toEqual(["hidden"]));
test("there are four outer rays", () => expect(castFingerRays({ x: 0, y: 0 }, size, camera, [box("near", 0)]).around).toHaveLength(4));
test("a tap beside everything gives empty rays", () => expect(castFingerRays({ x: 0.95, y: 0.95 }, size, camera, [box("near", 0)]).center).toEqual([]));
test("each structure appears once per ray", ...two meshes with the same sid and side at z 0 and z -1 give one hit with the nearer distance);

// checkModels.test.ts
test("modelStats reports the size of the model", ...the existing test glb: size has three finite numbers, none negative. A flat test file may have a zero in it, so do not expect all three to be positive);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, module not found and `size` undefined.

- [ ] **Step 3: Implement** `castRays.ts` with one `Raycaster` per call and `setFromCamera`, the viewer changes and the size output.

- [ ] **Step 4: Check the model scale**

Run: `npm run check-models`
Expected: the largest of the three size numbers for `hip.glb` lies between 0.8 and 1.4. The model runs from the ankle to the top of psoas major, which measured 1.124 on 2026-11-14, so it is in metres. (Corrected on 2026-11-14. The first version of this plan wrongly expected 0.5 to 1.0.) If the number is outside the range, stop and report: `CAP_M`, `BEHIND_TARGET_M` and the marker radius assume metres.

- [ ] **Step 5: Run all checks**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src pipeline/data
git commit -m "Cast fingertip rays through the model for area taps and print the model size in check-models"
```

---

### Task 3: The Area tab

**Files:**
- Create: `apps/web/src/area/AreaPanel.tsx`
- Modify: `apps/web/src/App.tsx`, `apps/web/src/ui/PanelArea.tsx`, `apps/web/src/ui/InfoPanel.tsx`, `apps/web/src/ui/RegionInfo.tsx`, `apps/web/src/i18n/en.json`, `apps/web/src/index.css`
- Test: `apps/web/src/area/AreaPanel.test.tsx`, `apps/web/src/ui/InfoPanel.test.tsx`, `apps/web/src/App.test.tsx`

**Interfaces:**
- Consumes: `UnderEntry` (Task 1), the viewer props (Task 2), `Mode`, `ModeBar`, `pickMovement`, `revealFor`, `loadWord` (plan 2a).
- Produces:

```ts
export type AreaState = { entries: UnderEntry[]; point: [number, number, number]; through: Selection | null } | null;

export function AreaPanel(props: {
  t: Translate;
  bundle: RegionBundle;
  area: AreaState;
  selection: Selection | null;
  onFocusStructure: (sel: Selection) => void;   // select, make visible, turn the camera
  onOpenMovement: (movementId: string) => void;
  onClear: () => void;
}): JSX.Element;

// ui/InfoPanel.tsx: new prop onOverUnder: () => void, a button with the text of info.overUnder next to "Hide this".
```

  - New en.json keys (exact text): `area.hint` "Tap a spot on the model to see what lies under it.", `area.title` "Under this spot, from the surface inwards", `area.throughTitle` "Over and under {name}, seen from here", `area.note` "This lists what the model has under the spot. It does not say what causes a symptom.", `area.noSkin` "The model has no skin or fat, so depth starts at the outermost muscle or bone.", `area.atSurface` "outermost here", `area.depth` "about {cm} cm deeper", `area.loadedBy` "Movements that load it", `area.movement` "{movement} ({load})", `area.clear` "Clear the spot", `info.overUnder` "See what lies over and under it".
  - Panel behaviour:
    - `area` null: only the line `area.hint`.
    - Otherwise: an `h2` with `area.title`, or `area.throughTitle` with the English name of the `through` structure. Then `area.note` and `area.noSkin` as muted lines. Then an ordered list (`<ol>`), one item per entry:
      - a button with the structure's name and side (`side.left` or `side.right` for sided entries) that calls `onFocusStructure`. It has `aria-current="true"` when the entry is the selection or the `through` structure.
      - a muted line with the type (`type.<type>`) and the depth: `area.atSurface` when `depth` rounds to 0, else `area.depth` with centimetres rounded to the nearest 0.5 (`depth * 100`).
      - when the structure has action rows in the bundle: the heading `area.loadedBy` and one link-button per distinct pair of movement and load, in the order of `bundle.movements`, with the text of `area.movement` (movement English name, `loadWord`). It calls `onOpenMovement`.
      - in the normal build, when `pendingByStructure` has a count for it: the existing `info.pending` line.
    - An entry whose sid the bundle does not know shows the sid as its name and nothing else.
    - A `area.clear` button at the end calls `onClear`.
  - `App.tsx`: `modes` is now `["atlas", "movement", "area"]`. It holds `area: AreaState` and `areaProbe`. `onAreaTap` stores the tap (null clears). The viewer gets `areaMode` (mode is `area`), `areaMarker` (the stored point while in area mode) and `areaProbe`. `onFocusStructure` runs `revealFor` for that structure and side, selects it and sets `focus`. `onOpenMovement` switches to the Movements tab with that movement picked. `onOverUnder` from the info panel switches to the Area tab and sets `areaProbe` to a copy of the selection. Leaving the Area tab keeps the stored tap, so coming back shows it again.

- [ ] **Step 1: Write the failing tests**

```ts
// AreaPanel.test.tsx, bundle is makeMovementBundle()
const area: AreaState = {
  point: [0, 0, 0],
  through: null,
  entries: [
    { sid: "gluteus-maximus", side: "l", distance: 1, depth: 0 },
    { sid: "piriformis", side: "l", distance: 1.024, depth: 0.024 },
    { sid: "femur", side: "l", distance: 1.05, depth: 0.05 },
  ],
};
test("with no tap it shows only the hint", ...expects en["area.hint"] and no list);
test("lists the entries in order with side, type and depth", ...list items in order "Gluteus maximus (left)", "Piriformis (left)", "Femur (left)", texts "outermost here", "about 2.5 cm deeper", "about 5 cm deeper");
test("shows the two notes whenever there is a list", ...en["area.note"] and en["area.noSkin"]);
test("lists each movement with its load word once", ...inside the Piriformis item: "Hip internal rotation (works)" and "Hip external rotation (works)" in that order);
test("a bone has no movement heading", ...inside the Femur item no en["area.loadedBy"]);
test("a structure with waiting rows shows the waiting line and no empty heading", ...bundle with actions [] and pendingByStructure { piriformis: 2 }: en["info.pending"] inside the Piriformis item, no en["area.loadedBy"] anywhere);
test("the name button reports the structure and side", ...onFocusStructure toHaveBeenCalledWith({ sid: "piriformis", side: "l" }));
test("a movement button opens that movement", ...onOpenMovement toHaveBeenCalledWith("hip-external-rotation"));
test("through a structure the title names it and its row is marked", ...through { sid: "piriformis", side: "l" }: heading "Over and under Piriformis, seen from here", aria-current on the Piriformis button);

// InfoPanel.test.tsx
test("the over and under button reports the request", ...);

// App.test.tsx
test("the Area tab shows the hint", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement** the panel and the wiring.

- [ ] **Step 4: Run all app checks**

Run: `npm test -w apps/web && npm run build`
Expected: PASS.

- [ ] **Step 5: Look at it** in the review build at 360 px wide (serve it as in plan 2a Task 6 Step 5). Tap the front of the hip. Expected: a white dot at the spot, a list that starts with a front thigh or hip muscle and ends at a bone, no structure of the other leg. Peel two layers and tap the same spot. Expected: the same list. Rotate the model by dragging. Expected: the list does not change. Tap beside the model. Expected: the hint comes back.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src
git commit -m "Add the Area tab that lists the structures under a tapped spot"
```

---

### Task 4: End-to-end test, phone sheet and docs

**Files:**
- Create: `apps/web/e2e/area.spec.ts`
- Modify: `docs/phase2/phone-measurements.md`, `README.md`

- [ ] **Step 1: Write the failing test.** In the style of `atlas.spec.ts`, with the same host check: open the app, click the tab named `mode.area`, wait until the loading text (`loading.model`) is gone, click the middle of the canvas (`page.locator("canvas")`, default click position), expect the heading `area.title` to be visible and at least one list item inside the panel, then click `area.clear` and expect `area.hint`.

- [ ] **Step 2: Run it**

Run: `npm run build && npm run e2e -w apps/web`
Expected: PASS for all three spec files. If the click lands beside the model, the camera framing changed. Do not move the click to make the test pass before checking the framing in a browser.

- [ ] **Step 3: Run every check**

Run: `npm run validate && npm run check-models && npm test && npm run build:review -w apps/web && npm run build && npm run e2e -w apps/web && node scripts/check-no-drafts.mjs && node apps/web/scripts/perf-check.mjs && node apps/web/scripts/error-check.mjs`
Expected: all pass.

- [ ] **Step 4: Add a section "Area tab" to `docs/phase2/phone-measurements.md`** with these checks: tap the side of the hip (is there a dot, does the list start at the surface and end at a bone), tap the same spot after peeling a layer (same list), does a drag to rotate leave the list alone, does a tap on a list entry turn the camera to it, is the fingertip size right or do taps list too much or too little, and one question for the physio: "Does the order of structures under the front of the hip and under the buttock look right to you?".

- [ ] **Step 5: Update `README.md`** with an "Area" bullet under "What it does today".

- [ ] **Step 6: Commit**

```bash
git add apps/web/e2e docs/phase2 README.md
git commit -m "Test the Area tab end to end and add it to the phone sheet"
```
