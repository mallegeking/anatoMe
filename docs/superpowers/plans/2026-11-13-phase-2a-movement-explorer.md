# anatoMe Phase 2a Movement Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a person pick a hip or knee movement, or an exercise, and see which structures it loads, ranked by role, with a joint-angle control that changes the highlighting.

**Architecture:** The app gets mode tabs ("Structures", "Movements"). A pure module (`movement/roles.ts`) turns the compiled bundle, a picked movement or exercise phase and a pose (joint angles) into a ranked list and a colour per structure. The viewer paints those colours and hides the muscles and soft tissue that are not involved. Exercises become a new gated data kind that the data build compiles into the bundle.

**Tech Stack:** As Phase 1: Node 22, npm workspaces, TypeScript, Vite 8, React 19, React Three Fiber 9, drei 10, three 0.187, Vitest, Ajv, `yaml`, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-02-anatome-design.md` (sections 2, 3, 8 and the Phase 2 row of section 9, read them before any task), `docs/superpowers/specs/2026-11-03-phase-1-hip-atlas-design.md` (section 2, the review gate) and `docs/phase0/phase1-follow-ups.md` (the "Phase 2" list at the end).

## Global Constraints

- Docs and code comments: plain language, no em dashes, no semicolons in prose. Comments short and friendly, for an owner who reads code but did not write it.
- Review gate: no row with `checked_by: null` may reach the normal app build. That now includes exercise rows. Unchecked rows appear only in the review build, marked as drafts.
- All user-facing app text comes from `apps/web/src/i18n/en.json`. Wording stays educational ("works", "is stretched"), never diagnostic.
- No external network requests from the app at runtime.
- Phone gate stays met: interactive within 5000 ms (median) on the Galaxy A23, no stutter when rotating. `node apps/web/scripts/perf-check.mjs` median under 5000 ms and `node apps/web/scripts/error-check.mjs` passing are the automated proxies.
- Layout: nothing covers the 3D model, one-handed use, no horizontal scroll at 360 px wide.
- The 3D model does not bend in Phase 2. Only the highlighting changes with the angle.
- No see-through (transparent) materials in the viewer. They cost frames on the phone.
- Nothing private in the repo: no hostnames, Tailscale names, IPs, keys or reviewer names.
- Check current official docs (or the docs shipped inside installed packages) before using an API not used in this repo yet.
- Existing checks stay green: `npm run validate`, `npm run check-models`, `npm test`, `npm run build`, `npm run e2e -w apps/web`, `node scripts/check-no-drafts.mjs`. `npm run test:py` runs in CI only on this machine (see the roadmap).
- No real exercise data is written in this plan. Real rows come from plan 2d. This plan uses fixtures and `apps/web/e2e/data`.

## Design decisions (builder's calls, the owner can overrule)

1. **Modes.** A tab row under the top bar switches what the panel shows: `atlas` ("Structures", today's behaviour) and `movement` ("Movements"). Plans 2b and 2c add `area` and `notebook`.
2. **What a movement lights up.** For a plain movement: working rows of that movement (the muscles that produce it) and the stretched and pinched rows of that movement.
3. **What an exercise phase lights up.** Working rows come from the phase's `effort` list, the movements the muscles produce or resist. Stretched and pinched rows come from where the joints are: every movement whose angle is away from zero in its own direction. Lowering into a squat therefore lights the hip extensors, not the hip flexors.
4. **Rows apply by angle.** A row applies when every range in its `when` contains the pose's angle, both ends included. A row without `when` always applies.
5. **Angles nobody measured.** A structure that has rows for the picked movement, none of which applies at the current angle, is listed under "Nothing recorded at this angle". The app claims nothing there. The rule is put to the physio in the Phase 2 phone sheet.
6. **Colours.** Main mover `#d1495b`, helper `#edae49`, pinched `#7b2cbf`, stretched `#00798c`. The panel always pairs a colour with its word.
7. **What else shows.** While a movement with at least one applying row is picked, bones stay (they still follow the layer switches) and every muscle or soft tissue that is not involved is hidden. Involved structures always show, on both sides, whatever the layers say.
8. **Slider span.** The control for an angle runs from the lowest to the highest value any candidate row names for it, widened to include 0, in steps of 5 degrees.
9. **Exercise rows are gated and only a physio can check them.**
10. **`midline: true`** on a structure replaces the hard-coded unpaired list in search. `check-models` verifies it against the meshes.

## Review Focus

1. The real data has no checked rows today. In the normal build, picking a movement must show the "no checked information yet" line and the waiting line, and the model must stay whole. Test in Task 6 (`MovementPanel`, `App`).
2. A pose exactly on a range end (45 in 0 to 45) applies. A pose in a gap between two ranges puts the structure in the silent list. Test in Task 4 (`involved`).
3. An exercise phase lights the `effort` muscles, never the muscles of the direction the joint travels. Test in Task 4 (`queryForPhase`, `involved`).
4. A structure that is peeled, switched off by tissue or hidden by hand must still show while it is involved, and "Hide this" on the left side must leave the right side showing. Test in Task 1 (`isVisible`) and Task 5 (`makeIsShown`).
5. A phone may hold an old cached `hip.json` without `exercises`, `pendingByMovement` or `paired`. The app must treat the missing parts as empty and not crash. Test in Task 3 (`normalizeBundle`).

---

## File Structure

```
data/
├── schema/exercises.schema.json      # new (Task 3)
├── schema/structures.schema.json     # midline added (Task 1)
└── structures/hip.yaml               # sacrum gets midline: true (Task 1)
pipeline/data/src/
├── validate.ts                       # exercises rules (Task 3)
├── compile.ts                        # paired, exercises, pendingByMovement (Tasks 1, 3)
└── checkModels.ts                    # midline check (Task 1)
scripts/check-no-drafts.mjs           # also checks exercises (Task 3)
apps/web/src/
├── data/bundle.ts                    # paired, BundleExercise, pending counts (Tasks 1, 3)
├── data/useRegionData.ts             # normalizeBundle (Task 3)
├── layers/layers.ts                  # hiding by side (Task 1)
├── layers/shown.ts                   # new: what shows in each mode (Task 5)
├── movement/roles.ts                 # new: pure movement logic (Task 4)
├── movement/state.ts                 # new: pure state of the movement mode (Task 6)
├── movement/colors.ts                # new: the four highlight colours (Task 5)
├── movement/fixture.ts               # new: test bundle (Task 4)
├── movement/MovementPanel.tsx        # new (Task 6)
├── viewer/appearance.ts              # new: paint of one mesh (Task 5)
├── viewer/RegionModel.tsx            # paints by appearance (Task 5)
├── ui/ModeBar.tsx                    # new: the tabs (Task 6)
├── ui/PanelArea.tsx                  # moved out of App.tsx (Task 6)
├── review/ReviewList.tsx             # lists draft exercises (Task 7)
└── App.tsx                           # mode, movement state, highlights (Task 6)
apps/web/e2e/                         # movement.spec.ts and test data (Task 8)
docs/phase2/phone-measurements.md     # new (Task 8)
```

---

### Task 1: Paired flag and hiding one side

**Files:**
- Modify: `data/schema/structures.schema.json`, `data/structures/hip.yaml`, `apps/web/e2e/data/structures/hip.yaml`, `pipeline/data/src/validate.ts`, `pipeline/data/src/checkModels.ts`, `pipeline/data/src/compile.ts`, `apps/web/src/data/bundle.ts`, `apps/web/src/viewer/pick.ts`, `apps/web/src/layers/layers.ts`, `apps/web/src/layers/LayersPanel.tsx`, `apps/web/src/search/search.ts`, `apps/web/src/App.tsx`, `apps/web/src/viewer/Scene.tsx`, `apps/web/src/viewer/Viewer.tsx`, `apps/web/src/viewer/RegionModel.tsx`, `apps/web/src/ui/fixture.ts`
- Test: `pipeline/data/test/checkModels.test.ts`, `pipeline/data/test/compile.test.ts`, `apps/web/src/layers/layers.test.ts`, `apps/web/src/layers/LayersPanel.test.tsx`, `apps/web/src/search/search.test.ts`, `apps/web/src/viewer/pick.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - Structure rows may carry `midline: true` (schema: optional boolean, description "True for a structure on the midline that has no left and right copy."). The sacrum gets it in `data/structures/hip.yaml` and in `apps/web/e2e/data/structures/hip.yaml`.
  - `StructureInfo = { type: string; english: string; midline: boolean }` from `loadStructures`.
  - `checkModelMapping` adds two errors: `<sid> is marked midline but mesh <name> has side <side>` and `<sid> is not marked midline but mesh <name> has no side`.
  - `BundleStructure.paired: boolean` (compile writes `paired: !midline`).
  - `export type Side = "l" | "r" | ""` in `viewer/pick.ts`. `Selection` and `PickedStructure` use it.
  - `layers.ts`: `hiddenKey(sid: string, side: Side): string` (returns `` `${sid}|${side}` ``), `isVisible(state: LayerState, structure: BundleStructure, side: Side): boolean`, `hideStructure(state, sid: string, side: Side)`, `showStructure(state, key: string)`, `revealFor(state, target: BundleStructure, side: Side, structures: BundleStructure[])`. `LayerState.hiddenIds` now holds keys from `hiddenKey`.
  - `selectBySearch(id: string, bundle: RegionBundle): Selection` reads `paired` from the bundle. The `UNPAIRED` set is deleted.
  - The viewer prop `isVisibleSid(sid)` becomes `isShown(sid: string, side: Side): boolean` in `SceneProps`, `RegionModel` and `pickVisibleHit(hits, isShown)`.

- [ ] **Step 1: Write the failing tests**

```ts
// layers.test.ts (add, and update the existing calls to the new signatures)
const piri = { id: "piriformis", type: "muscle", english: "Piriformis", depth: 2, paired: true };
test("hiding the left side leaves the right side showing", () => {
  const state = hideStructure(initialLayers(), "piriformis", "l");
  expect(isVisible(state, piri, "l")).toBe(false);
  expect(isVisible(state, piri, "r")).toBe(true);
});
test("showStructure takes the key that hiddenKey made", () => {
  const state = showStructure(hideStructure(initialLayers(), "piriformis", "l"), hiddenKey("piriformis", "l"));
  expect(isVisible(state, piri, "l")).toBe(true);
});
test("revealFor unhides only the side it was asked for", () => {
  let state = hideStructure(hideStructure(initialLayers(), "piriformis", "l"), "piriformis", "r");
  state = revealFor(state, piri, "l", [piri]).state;
  expect(isVisible(state, piri, "l")).toBe(true);
  expect(isVisible(state, piri, "r")).toBe(false);
});

// LayersPanel.test.tsx
test("a structure hidden on one side is listed with its side", ...expects text "Piriformis (left)" and that Show calls onShow("piriformis|l"));

// search.test.ts
test("a paired structure opens on the left", () => expect(selectBySearch("piriformis", bundle)).toEqual({ sid: "piriformis", side: "l" }));
test("a midline structure opens with no side", () => expect(selectBySearch("sacrum", bundle)).toEqual({ sid: "sacrum", side: "" }));

// compile.test.ts
test("paired is false for a midline structure and true otherwise", ...);

// checkModels.test.ts
test("a midline structure with a sided mesh is an error", ...message contains "is marked midline but mesh");
test("a paired structure with an unsided mesh is an error", ...message contains "is not marked midline but mesh");
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL on the new tests and on type errors for the changed signatures.

- [ ] **Step 3: Implement.** Change the schema, the two structure files, `loadStructures`, the model check, the compile step and the bundle type. Then change `layers.ts`, `LayersPanel` (the hidden list shows `side.left` or `side.right` around the name for sided keys), `search.ts`, `pick.ts` and the viewer props. In `App.tsx`, "Hide this" hides only the selected side, and the effect that drops a hidden selection checks the selected side. `ui/fixture.ts` gives every structure `paired` (false only for the sacrum).

- [ ] **Step 4: Run all checks**

Run: `npm run validate && npm run check-models && npm test && npm run build`
Expected: all pass. `check-models` still ends with its "every mesh maps to one of N structures" line, with the same N as before this task.

- [ ] **Step 5: Commit**

```bash
git add data pipeline apps/web
git commit -m "Mark midline structures in the data and hide structures one side at a time"
```

---

### Task 2: Small Phase 1 leftovers in the app

**Files:**
- Modify: `apps/web/src/ui/TopBar.tsx`, `apps/web/src/ui/Credits.tsx`, `apps/web/src/i18n/en.json`, `apps/web/playwright.config.ts`, `docs/phase0/phase1-follow-ups.md`
- Test: `apps/web/src/ui/TopBar.test.tsx`, `apps/web/src/ui/Credits.test.tsx`

**Interfaces:**
- Produces: en.json key `credits.withLicence` with the exact text `{credit} ({licence})`. `Credits.tsx` no longer types brackets in code. It renders the credit, then the licence link, with the text around them taken from that key (split the template on `{licence}` so the link stays a real `<a>`).

- [ ] **Step 1: Write the failing tests**

```ts
// TopBar.test.tsx
test("after Escape closed the list, Enter chooses nothing", () => {
  const { onChoose, field } = show();
  fireEvent.change(field, { target: { value: "pirif" } });
  fireEvent.keyDown(field, { key: "Escape" });
  fireEvent.keyDown(field, { key: "Enter" });
  expect(onChoose).not.toHaveBeenCalled();
});

// Credits.test.tsx
test("the brackets around a licence link come from en.json", () => {
  render(<Credits t={createT({ ...en, "credits.withLicence": "{credit} [{licence}]" })} />);
  // open the details first, as the other tests in this file do
  expect(screen.getByText(/\[/)).toBeTruthy();
  expect(screen.queryByText(/\(/)).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL, Enter still chooses the first result and the brackets are still round.

- [ ] **Step 3: Implement.** In `TopBar`, Enter chooses only while `open` is true. In `Credits`, use the new key. In `playwright.config.ts` add `trace: "retain-on-failure"` under `use` and leave retries off (a flaky test should be fixed, not retried). In `docs/phase0/phase1-follow-ups.md` mark these three items and the two from Task 1 as "Done 2026-11-13 (Phase 2a Task 1 or 2)", in the style of the lines above them.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web docs/phase0/phase1-follow-ups.md
git commit -m "Fix Enter after Escape in search, move the licence brackets into en.json and keep traces of failed browser tests"
```

---

### Task 3: Exercises as a gated data kind

**Files:**
- Create: `data/schema/exercises.schema.json`, fixtures under `pipeline/data/test/fixtures/` (one folder per rule below, copied from `valid/` with an added `exercises.yaml`)
- Modify: `pipeline/data/src/validate.ts`, `pipeline/data/src/compile.ts`, `pipeline/data/src/cli.ts`, `apps/web/src/data/bundle.ts`, `apps/web/src/data/useRegionData.ts`, `apps/web/src/ui/fixture.ts`, `scripts/check-no-drafts.mjs`, `pipeline/data/test/fixtures/valid/` (add `exercises.yaml`)
- Test: `pipeline/data/test/validate.test.ts`, `pipeline/data/test/compile.test.ts`, `apps/web/src/data/useRegionData.test.tsx`

**Interfaces:**
- Consumes: `checkGated`, `checkUnique` and the `Gated` type in `validate.ts`.
- Produces:
  - `data/exercises.yaml` is optional. A missing file means no exercises. Row shape:

```yaml
- id: bodyweight-squat            # slug, shares one id space with actions and attachments
  english: Bodyweight squat
  regions: [hip]                  # at least one, each must be the region of some structure
  phases:                         # at least one, phase ids unique inside the exercise
    - id: lowering
      english: Lowering
      path:                       # how the joints move through the phase, at least one entry
        - {angle: hip.flexion, from: 0, to: 100}
        - {angle: knee.flexion, from: 0, to: 110}
      effort: [hip-extension, knee-extension]   # movements the muscles produce or resist, at least one
  citations:                      # same shape as on action rows, at least one
    - {ref: some-citation, locator: "...", says: "...", says_kind: summary}
  checked_by: null                # null or a physio label, with checked_on once set
  review_note: optional question for the reviewer
```

  - Schema: `additionalProperties: false` at every level, `required` is `id, english, regions, phases, citations, checked_by` on the row, `id, english, path, effort` on a phase and `angle, from, to` on a path entry. `checked_by`, `checked_on`, `review_note` and `citations` copy the definitions in `actions.schema.json`.
  - Validator messages (exact): `unknown angle <angle>`, `unknown movement <id>`, `unknown region <region>`, `duplicate phase id <id>`, `angle <angle> appears twice in one phase`, `from and to must differ`, `exercise rows can only be checked by a physio, use a label like physio-1`. Citation and date rules come from `checkGated`.
  - Bundle types in `bundle.ts`:

```ts
export type BundlePhase = { id: string; english: string; path: { angle: string; from: number; to: number }[]; effort: string[] };
export type BundleExercise = { id: string; english: string; phases: BundlePhase[]; citations: BundleCitationUse[]; draft: boolean; review_note?: string };
// added to RegionBundle:
//   exercises: BundleExercise[];
//   pendingByMovement: Record<string, number>;  // unchecked action rows per movement id
//   pendingExercises: number;                   // unchecked exercise rows of this region
```

  - `compileRegion` keeps an exercise when `regions` includes the region. Normal mode drops drafts and `review_note`, review mode keeps them with `draft: true`. Citations used by kept exercises stay in `citations`.
  - `normalizeBundle(raw: Partial<RegionBundle> & Pick<RegionBundle, "region" | "mode" | "structures">): RegionBundle` in `useRegionData.ts`. Missing `exercises` becomes `[]`, missing `pendingByMovement` becomes `{}`, missing `pendingExercises` becomes `0`, a structure without `paired` gets `paired: true`. `useRegionData` passes every fetched bundle through it.
  - `check-no-drafts.mjs` also fails on a draft in `exercises`.
  - `cli.ts build-data` log line also prints the number of exercises.

- [ ] **Step 1: Write the failing tests**

```ts
// validate.test.ts, one fixture folder per line, each expects ok false and the message
test("exercise with an unknown angle", ...            "unknown angle hip.twist");
test("exercise with an unknown effort movement", ...  "unknown movement hip-wiggle");
test("exercise with an unknown region", ...           "unknown region elbow");
test("exercise with a duplicate phase id", ...        "duplicate phase id lowering");
test("exercise phase naming an angle twice", ...      "angle hip.flexion appears twice in one phase");
test("exercise path that goes nowhere", ...           "from and to must differ");
test("exercise checked by the owner", ...             "exercise rows can only be checked by a physio, use a label like physio-1");
test("exercise id that an action row already uses", ..."duplicate id");
test("the valid fixture with an exercise passes", ...ok true);
test("a data folder without exercises.yaml passes", ...ok true);

// compile.test.ts
test("normal mode drops an unchecked exercise and counts it", ...exercises toEqual([]) and pendingExercises toBe(1));
test("review mode keeps it as a draft with its review note", ...);
test("an exercise for another region is left out", ...);
test("pendingByMovement counts unchecked action rows per movement", ...toEqual({ "hip-internal-rotation": 1 }) for the valid fixture's one unchecked row, adjust the id to the fixture);
test("a checked exercise keeps its citation in the bundle", ...);

// useRegionData.test.tsx
test("normalizeBundle fills what an old bundle lacks", () => {
  const old = { region: "hip", mode: "normal" as const, structures: [{ id: "femur", type: "bone", english: "Femur", depth: 4 }], movements: [], attachments: [], actions: [], citations: [], pendingByStructure: {} };
  const b = normalizeBundle(old as never);
  expect(b.exercises).toEqual([]);
  expect(b.pendingByMovement).toEqual({});
  expect(b.pendingExercises).toBe(0);
  expect(b.structures[0].paired).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, schema file and new fields missing.

- [ ] **Step 3: Implement.** Add `"exercises"` to `Kind` and to `compileSchemas`. Load `exercises.yaml` only when it exists (do not report "file not found" for it). Put exercises into the shared `checkUnique` call with actions and attachments. Extend `compile.ts` and the bundle types. Add `exercises: []`, `pendingByMovement: {}` and `pendingExercises: 0` to `makeBundle` in `ui/fixture.ts`.

- [ ] **Step 4: Run all checks**

Run: `npm run validate && npm test && npm run build && node scripts/check-no-drafts.mjs`
Expected: all pass. The build log line for `hip.json` ends with `0 exercises`.

- [ ] **Step 5: Commit**

```bash
git add data/schema pipeline scripts apps/web
git commit -m "Add exercises as a review-gated data kind and compile them into the region bundle"
```

---

### Task 4: Movement logic

**Files:**
- Create: `apps/web/src/movement/roles.ts`, `apps/web/src/movement/fixture.ts`
- Test: `apps/web/src/movement/roles.test.ts`

**Interfaces:**
- Consumes: `RegionBundle`, `BundleAction`, `BundleMovement`, `BundlePhase` (Task 3).
- Produces (all pure, all exported from `roles.ts`):

```ts
export type Pose = Record<string, number>;                 // angle id such as "hip.flexion" to degrees
export type Highlight = "primary" | "secondary" | "pinched" | "stretched";
export const HIGHLIGHT_ORDER: Highlight[] = ["primary", "secondary", "pinched", "stretched"];
export type Query = { working: string[]; position: string[] };   // movement ids
export type InvolvedRow = { action: BundleAction; highlight: Highlight };
export type Involved = { rows: InvolvedRow[]; silent: string[]; bySid: Map<string, Highlight>; candidates: number };

export function neutralPose(bundle: RegionBundle): Pose;                         // every dof a movement names, at 0
export function appliesAt(action: BundleAction, pose: Pose): boolean;            // decision 4, a missing angle counts as 0
export function highlightOf(action: BundleAction): Highlight;                    // working gives its role, else its load
export function queryForMovement(id: string): Query;                             // { working: [id], position: [id] }
export function positionMovements(pose: Pose, movements: BundleMovement[]): string[]; // decision 3, in the order of movements
export function queryForPhase(phase: BundlePhase, pose: Pose, movements: BundleMovement[]): Query;
export function poseAt(phase: BundlePhase, progress: number): Pose;              // from + (to - from) * progress per path entry
export function contextAngles(bundle: RegionBundle, query: Query): { angle: string; min: number; max: number }[]; // decision 8
export function involved(bundle: RegionBundle, query: Query, pose: Pose): Involved;
```

  - `involved`: a candidate is an action whose load is `working` and whose movement is in `query.working`, or whose load is not `working` and whose movement is in `query.position`. `rows` are the candidates that apply at the pose, sorted by `HIGHLIGHT_ORDER`, then by the structure's English name, then by action id. `silent` holds the ids of structures with candidates of which none applies, sorted by English name. `bySid` gives each structure in `rows` its strongest highlight by `HIGHLIGHT_ORDER`. `candidates` is the number of candidate rows.
  - `makeMovementBundle(mode?: "normal" | "review"): RegionBundle` in `fixture.ts` with exactly this content:
    - structures (all `region` hip, `paired: true` unless said): `femur` bone depth 4, `sacrum` bone depth 4 `paired: false`, `gluteus-maximus` "Gluteus maximus" muscle depth 1, `piriformis` "Piriformis" muscle depth 2, `obturator-externus` "Obturator externus" muscle depth 3, `ischiofemoral-ligament` "Ischiofemoral ligament" ligament depth 3, `acetabular-labrum` "Acetabular labrum" labrum depth 3.
    - movements, each with its id in sentence case as the English name ("Hip external rotation"), in this order: `hip-flexion` (hip.flexion, positive), `hip-extension` (hip.flexion, negative), `hip-internal-rotation` (hip.rotation, positive), `hip-external-rotation` (hip.rotation, negative), `knee-flexion` (knee.flexion, positive), `knee-extension` (knee.flexion, negative).
    - actions, all checked, confidence high, one citation `c1`:
      - `m1` piriformis, hip-external-rotation, working primary, when hip.flexion 0 to 45
      - `m2` piriformis, hip-internal-rotation, working secondary, when hip.flexion 90 to 105
      - `m3` gluteus-maximus, hip-external-rotation, working secondary
      - `m4` gluteus-maximus, hip-extension, working primary
      - `m5` ischiofemoral-ligament, hip-internal-rotation, stretched
      - `m6` acetabular-labrum, hip-flexion, pinched, when hip.flexion 90 to 120
      - `m7` obturator-externus, hip-external-rotation, working primary, when hip.flexion 0 to 60
      - `m8` obturator-externus, hip-external-rotation, working secondary, when hip.flexion 75 to 90
    - exercises: `squat` "Bodyweight squat" with phases `lowering` "Lowering" (path hip.flexion 0 to 100 and knee.flexion 0 to 110, effort hip-extension and knee-extension) and `rising` "Rising" (the same path reversed, the same effort), checked. In review mode add a draft exercise `bridge` "Glute bridge" with one phase `lifting` "Lifting" (path hip.flexion 60 to 0, effort hip-extension) and `review_note: "Is the range right?"`, and set `pendingExercises: 1`.
    - `pendingByStructure: {}`, `pendingByMovement: { "knee-flexion": 2 }`, `pendingExercises: 0` in normal mode.

- [ ] **Step 1: Write the failing tests**

```ts
const b = makeMovementBundle();
const ids = (i: Involved) => i.rows.map((r) => r.action.id);
const er = queryForMovement("hip-external-rotation");
const ir = queryForMovement("hip-internal-rotation");
const at = (flexion: number): Pose => ({ ...neutralPose(b), "hip.flexion": flexion });

test("neutral pose has every angle at zero", () => expect(neutralPose(b)).toEqual({ "hip.flexion": 0, "hip.rotation": 0, "knee.flexion": 0 }));
test("external rotation with the hip straight", () => {
  const i = involved(b, er, at(0));
  expect(ids(i)).toEqual(["m7", "m1", "m3"]);
  expect(i.silent).toEqual([]);
  expect(i.candidates).toBe(4);
});
test("a pose on the end of a range still applies", () => expect(ids(involved(b, er, at(45)))).toEqual(["m7", "m1", "m3"]));
test("past its range a structure goes silent", () => {
  const i = involved(b, er, at(50));
  expect(ids(i)).toEqual(["m7", "m3"]);
  expect(i.silent).toEqual(["piriformis"]);
});
test("a gap between two measured ranges is silent", () => {
  const i = involved(b, er, at(65));
  expect(ids(i)).toEqual(["m3"]);
  expect(i.silent).toEqual(["obturator-externus", "piriformis"]);
});
test("the role changes with the angle", () => expect(involved(b, er, at(80)).bySid.get("obturator-externus")).toBe("secondary"));
test("internal rotation shows the stretched ligament", () => {
  expect(ids(involved(b, ir, at(0)))).toEqual(["m5"]);
  const bent = involved(b, ir, at(90));
  expect(ids(bent)).toEqual(["m2", "m5"]);
  expect(bent.bySid.get("ischiofemoral-ligament")).toBe("stretched");
});
test("positionMovements follows the sign of each angle", () =>
  expect(positionMovements({ "hip.flexion": 50, "hip.rotation": -10, "knee.flexion": 0 }, b.movements)).toEqual(["hip-flexion", "hip-external-rotation"]));
test("poseAt moves along the path", () => expect(poseAt(b.exercises[0].phases[0], 0.5)).toEqual({ "hip.flexion": 50, "knee.flexion": 55 }));
test("lowering into a squat lights the extensors, not the flexors", () => {
  const phase = b.exercises[0].phases[0];
  const pose = { ...neutralPose(b), ...poseAt(phase, 0.5) };
  const q = queryForPhase(phase, pose, b.movements);
  expect(q).toEqual({ working: ["hip-extension", "knee-extension"], position: ["hip-flexion", "knee-flexion"] });
  expect(ids(involved(b, q, pose))).toEqual(["m4"]);
});
test("at the bottom of the squat the labrum row applies too", () => {
  const phase = b.exercises[0].phases[0];
  const pose = { ...neutralPose(b), ...poseAt(phase, 1) };
  const i = involved(b, queryForPhase(phase, pose, b.movements), pose);
  expect(ids(i)).toEqual(["m4", "m6"]);
  expect(i.bySid.get("acetabular-labrum")).toBe("pinched");
});
test("context angles span what the rows name, widened to zero", () => {
  expect(contextAngles(b, er)).toEqual([{ angle: "hip.flexion", min: 0, max: 90 }]);
  expect(contextAngles(b, queryForMovement("hip-extension"))).toEqual([]);
});
test("a movement with no rows has no candidates", () => expect(involved(b, queryForMovement("knee-flexion"), at(0)).candidates).toBe(0));
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web -- roles`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `roles.ts` and `fixture.ts`** as specified above.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web -- roles`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/movement
git commit -m "Add the pure logic that ranks structures for a movement at a joint angle"
```

---

### Task 5: Highlighting in the viewer

**Files:**
- Create: `apps/web/src/movement/colors.ts`, `apps/web/src/viewer/appearance.ts`, `apps/web/src/layers/shown.ts`
- Modify: `apps/web/src/viewer/RegionModel.tsx`, `apps/web/src/viewer/Scene.tsx`, `apps/web/src/viewer/Viewer.tsx`, `apps/web/src/viewer/Viewer.test.tsx`
- Test: `apps/web/src/viewer/appearance.test.ts`, `apps/web/src/layers/shown.test.ts`

**Interfaces:**
- Consumes: `Highlight` (Task 4), `isVisible`, `LayerState`, `Side`, `Selection` (Task 1).
- Produces:

```ts
// movement/colors.ts
export const HIGHLIGHT_COLORS: Record<Highlight, string> = { primary: "#d1495b", secondary: "#edae49", pinched: "#7b2cbf", stretched: "#00798c" };

// viewer/appearance.ts
export type Paint = { visible: boolean; highlight: Highlight | null; selected: boolean };
export function paintOf(
  mesh: { sid: string; side: Side },
  ctx: { selection: Selection | null; highlights: ReadonlyMap<string, Highlight> | null; isShown: (sid: string, side: Side) => boolean },
): Paint;

// layers/shown.ts
export function makeIsShown(
  structures: BundleStructure[],
  layers: LayerState,
  highlights: ReadonlyMap<string, Highlight> | null,
): (sid: string, side: Side) => boolean;
```

  - `makeIsShown`, with `highlights` null: a known structure shows when `isVisible(layers, structure, side)`, an unknown sid shows. With `highlights` set: a sid in the map shows on both sides whatever the layers say, a bone shows when `isVisible` says so, everything else is hidden.
  - `paintOf`: `visible` is `isShown(sid, side)`. `highlight` is the map's value for the sid, or null. `selected` is true when the selection has the same sid and side.
  - `SceneProps` and `RegionModel` props gain `highlights: ReadonlyMap<string, Highlight> | null`.

- [ ] **Step 1: Write the failing tests**

```ts
// shown.test.ts
const structures = makeMovementBundle().structures;
const hi = new Map<string, Highlight>([["piriformis", "primary"]]);
test("without highlights the layers decide", () => {
  const shown = makeIsShown(structures, peel(initialLayers(), structures), null);
  expect(shown("gluteus-maximus", "l")).toBe(false);
  expect(shown("piriformis", "l")).toBe(true);
  expect(shown("not-in-the-data", "")).toBe(true);
});
test("an involved structure shows even when it is hidden, peeled and its tissue is off", () => {
  let layers = hideStructure(initialLayers(), "piriformis", "l");
  layers = toggleTissue(peel(peel(layers, structures), structures), "muscle");
  const shown = makeIsShown(structures, layers, hi);
  expect(shown("piriformis", "l")).toBe(true);
  expect(shown("piriformis", "r")).toBe(true);
});
test("uninvolved muscles and soft tissue are hidden, bones stay", () => {
  const shown = makeIsShown(structures, initialLayers(), hi);
  expect(shown("gluteus-maximus", "l")).toBe(false);
  expect(shown("ischiofemoral-ligament", "r")).toBe(false);
  expect(shown("femur", "l")).toBe(true);
});
test("bones still follow the bone switch", () => expect(makeIsShown(structures, toggleTissue(initialLayers(), "bone"), hi)("femur", "l")).toBe(false));

// appearance.test.ts
const shownAll = () => true;
test("a highlighted, selected mesh carries both", () =>
  expect(paintOf({ sid: "piriformis", side: "l" }, { selection: { sid: "piriformis", side: "l" }, highlights: hi, isShown: shownAll })).toEqual({ visible: true, highlight: "primary", selected: true }));
test("the other side is highlighted but not selected", () =>
  expect(paintOf({ sid: "piriformis", side: "r" }, { selection: { sid: "piriformis", side: "l" }, highlights: hi, isShown: shownAll }).selected).toBe(false));
test("no highlights gives null", () => expect(paintOf({ sid: "femur", side: "l" }, { selection: null, highlights: null, isShown: shownAll }).highlight).toBeNull());
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web -- shown appearance`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement** the three new files. In `RegionModel.tsx`, replace the three effects that set materials, selection and visibility with one effect that walks every mesh, calls `paintOf` and sets `visible` and `material`. `makeMaterials` gains one normal and one lighter (lerp 0.55 to white, as today) opaque `MeshStandardMaterial` per highlight colour, with the same roughness, metalness and `DoubleSide` as the tissue materials. The effect calls `invalidate()` once. Taps keep using `pickVisibleHit(event.intersections, isShown)`.

- [ ] **Step 4: Run all app checks**

Run: `npm test -w apps/web && npm run build`
Expected: PASS. Update `Viewer.test.tsx` for the new prop.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "Paint involved structures by role and hide the uninvolved soft tissue"
```

---

### Task 6: Mode tabs and the movement panel

**Files:**
- Create: `apps/web/src/ui/ModeBar.tsx`, `apps/web/src/ui/PanelArea.tsx`, `apps/web/src/movement/state.ts`, `apps/web/src/movement/MovementPanel.tsx`
- Modify: `apps/web/src/App.tsx`, `apps/web/src/ui/InfoPanel.tsx`, `apps/web/src/ui/RegionInfo.tsx`, `apps/web/src/i18n/en.json`, `apps/web/src/index.css`
- Test: `apps/web/src/ui/ModeBar.test.tsx`, `apps/web/src/movement/state.test.ts`, `apps/web/src/movement/MovementPanel.test.tsx`, `apps/web/src/ui/InfoPanel.test.tsx`, `apps/web/src/App.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 3, 4 and 5, plus `describeAction`, `ActionNotes`, `Sources`, `DraftMark`.
- Produces:

```ts
// ui/ModeBar.tsx
export type Mode = "atlas" | "movement" | "area" | "notebook";
export function ModeBar(props: { t: Translate; mode: Mode; modes: Mode[]; onChange: (mode: Mode) => void }): JSX.Element;
// role="tablist", one role="tab" button per mode with aria-selected. This plan passes modes ["atlas", "movement"].

// movement/state.ts (pure)
export type MovementPick = { kind: "movement"; id: string } | { kind: "exercise"; id: string; phase: string };
export type MovementState = { pick: MovementPick | null; pose: Pose; progress: number };
export function initialMovementState(): MovementState;                                   // { pick: null, pose: {}, progress: 0 }
export function pickMovement(bundle: RegionBundle, id: string): MovementState;          // neutral pose
export function pickExercise(bundle: RegionBundle, id: string): MovementState;          // first phase, progress 0
export function pickPhase(state: MovementState, bundle: RegionBundle, phase: string): MovementState; // progress 0
export function setAngle(state: MovementState, angle: string, value: number): MovementState;
export function setProgress(state: MovementState, bundle: RegionBundle, progress: number): MovementState; // pose = neutral + poseAt
export function queryOf(state: MovementState, bundle: RegionBundle): Query | null;       // null when nothing is picked or the pick is unknown to the bundle
export function clearPick(): MovementState;

// movement/MovementPanel.tsx
export function MovementPanel(props: {
  t: Translate;
  bundle: RegionBundle;
  state: MovementState;
  onChange: (state: MovementState) => void;
  selection: Selection | null;
  onFocusStructure: (sid: string) => void;   // select it and turn the camera to it
  onOpenStructure: (sid: string) => void;    // the same, and switch to the Structures tab
}): JSX.Element;

// ui/InfoPanel.tsx: new prop onOpenMovement: (movementId: string) => void. Each movement heading (h4) holds a link-button with the movement name that calls it.
```

  - New en.json keys (exact text): `mode.atlas` "Structures", `mode.movement` "Movements", `mode.area` "Area", `mode.notebook` "Notebook", `mode.label` "What to explore", `movement.pick` "Pick a movement", `movement.joint.hip` "Hip", `movement.joint.knee` "Knee", `movement.exercises` "Exercises", `movement.exercisesPending` "Exercises are waiting for a physiotherapist's review.", `movement.back` "Pick another movement", `movement.slider` "With {angle} at {value} degrees", `movement.phase` "Phase", `movement.progress` "Through the phase: {percent} percent", `movement.effortNote` "Muscles shown as working are the ones that produce or control this phase.", `movement.group.primary` "Main movers", `movement.group.secondary` "Helpers", `movement.group.pinched` "Pinched", `movement.group.stretched` "Stretched", `movement.silent` "Nothing recorded at this angle", `movement.none` "There is no checked information for this movement yet.", `movement.pending` "More information for this movement is waiting for a physiotherapist's review.", `movement.openStructure` "Read about this structure", `movement.hiddenNote` "Muscles and soft tissue that are not involved are hidden while a movement is picked.".
  - Panel behaviour:
    - Nothing picked: heading `movement.pick`, then one group of buttons per joint (`movement.joint.<joint>` as heading, joints in the order of `bundle.movements`, found with `jointOf`), then `movement.exercises` with one button per exercise. No exercises and `pendingExercises > 0` in normal mode shows `movement.exercisesPending`. No exercises and nothing pending shows no exercise heading at all.
    - A movement picked: its English name as `h2`, a `movement.back` button, one `<input type="range" step="5">` per entry of `contextAngles` labelled with `movement.slider` (the angle word comes from the existing `angle.<id>` keys), then the result.
    - An exercise picked: its name as `h2`, the back button, one button per phase (`aria-pressed` on the current one), a range input from 0 to 100 in steps of 5 labelled with `movement.progress`, the line `movement.effortNote`, then the result.
    - The result: when `candidates` is 0, the line `movement.none`. Otherwise one group per highlight that has rows, in `HIGHLIGHT_ORDER`, with heading `movement.group.<highlight>` and a colour swatch (`<span class="swatch swatch--<highlight>" aria-hidden="true">`). Each row shows the structure's English name as a button (calls `onFocusStructure`, `aria-current="true"` when it is the selection), the sentence from `describeAction`, `ActionNotes`, the draft mark in the review build, `Sources`, and a `movement.openStructure` link-button (calls `onOpenStructure`). Under the groups, when `silent` is not empty, heading `movement.silent` and the names. Then `movement.hiddenNote` when at least one row applies.
    - The waiting line `movement.pending` shows in the normal build when any movement in `query.working` or `query.position` has a count in `pendingByMovement`.
  - `App.tsx`: holds `mode` and `movement` state. `highlights` is `involved(...).bySid` when the mode is `movement`, a query exists and at least one row applies. Otherwise it is null and the model stays whole. `isShown` comes from `makeIsShown(structures, layers, highlights)`. Choosing a search result switches to `atlas`. `onOpenMovement` from the info panel sets the mode to `movement` and calls `pickMovement`. The `ModeBar` sits between `TopBar` and the stage. `PanelArea` moves into `ui/PanelArea.tsx` and shows the layers panel when open, else the movement panel in movement mode, else the region info.
  - CSS: `.mode-bar` is one row of equal-width buttons, at least 44 px high, that does not wrap at 360 px. `.swatch--primary` and the other three use the hex values of `HIGHLIGHT_COLORS`.

- [ ] **Step 1: Write the failing tests**

```ts
// state.test.ts
const b = makeMovementBundle();
test("picking a movement starts from the neutral pose", () =>
  expect(pickMovement(b, "hip-external-rotation")).toEqual({ pick: { kind: "movement", id: "hip-external-rotation" }, pose: { "hip.flexion": 0, "hip.rotation": 0, "knee.flexion": 0 }, progress: 0 }));
test("picking an exercise starts its first phase", () => expect(pickExercise(b, "squat").pick).toEqual({ kind: "exercise", id: "squat", phase: "lowering" }));
test("progress moves the pose along the phase", () => expect(setProgress(pickExercise(b, "squat"), b, 0.5).pose).toEqual({ "hip.flexion": 50, "hip.rotation": 0, "knee.flexion": 55 }));
test("changing the phase starts it from the beginning", () => {
  const s = pickPhase(setProgress(pickExercise(b, "squat"), b, 0.5), b, "rising");
  expect(s.progress).toBe(0);
  expect(s.pose["hip.flexion"]).toBe(100);
});
test("a pick the bundle does not know gives no query", () => expect(queryOf({ pick: { kind: "movement", id: "gone" }, pose: {}, progress: 0 }, b)).toBeNull());

// MovementPanel.test.tsx (render with a small harness that keeps the state, as TopBar.test.tsx does)
test("lists movements by joint and the exercises", ...expects headings "Hip", "Knee", "Exercises" and buttons "Hip external rotation", "Bodyweight squat");
test("picking external rotation shows main movers and helpers in order", ...expects headings "Main movers", "Helpers" and the structure buttons in the order Obturator externus, Piriformis, Gluteus maximus);
test("moving the slider to 65 puts both deep rotators under the silent heading", ...fireEvent.change on the range input to "65", expects "Nothing recorded at this angle" followed by "Obturator externus" and "Piriformis");
test("a movement with no rows says so and shows no groups", ...pick "Knee extension", expects en["movement.none"], no "Main movers" and no en["movement.pending"]);
test("a movement with waiting rows shows the waiting line", ...pick "Knee flexion", expects en["movement.none"] and en["movement.pending"]);
test("an exercise shows its phases, the progress slider and the effort note", ...);
test("the structure button reports the structure", ...expects onFocusStructure toHaveBeenCalledWith("piriformis"));
test("the review build marks a draft exercise and shows its question", ...review bundle, pick "Glute bridge", expects en["review.draft"] and "Is the range right?");
test("no exercises and one waiting shows the waiting line for exercises", ...);

// ModeBar.test.tsx
test("marks the current tab and reports a change", ...aria-selected true on "Structures", click "Movements" calls onChange("movement"));

// InfoPanel.test.tsx
test("a movement heading opens that movement", ...click "Hip external rotation" inside the panel calls onOpenMovement("hip-ext-rot"));

// App.test.tsx
test("the Movements tab shows the picker and the Structures tab brings the hint back", ...);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w apps/web`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement** as specified. Keep `App.tsx` under 220 lines by moving `PanelArea` out.

- [ ] **Step 4: Run all app checks**

Run: `npm test -w apps/web && npm run build`
Expected: PASS.

- [ ] **Step 5: Look at it.** Run `npm run build:review -w apps/web`, serve `apps/web/dist-review` with `npx vite preview --outDir dist-review` from `apps/web`, open it at 360 px wide, pick "Hip external rotation" and move the slider. Expected: piriformis and the other rows change group as the angle passes 45, no horizontal scroll, the model is never covered. Then open the normal build the same way and pick the same movement. Expected: the `movement.none` and `movement.pending` lines, and the whole model still showing.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src
git commit -m "Add the Movements tab with the movement picker, the joint-angle control and exercises"
```

---

### Task 7: Exercises in the review list

**Files:**
- Modify: `apps/web/src/review/ReviewList.tsx`, `apps/web/src/i18n/en.json`
- Test: `apps/web/src/review/review.test.tsx`

**Interfaces:**
- Consumes: `BundleExercise`, `DraftMark`, `Sources`.
- Produces: en.json keys `review.exercises` "Exercises", `review.phase` "{phase}: {path}. Working: {effort}", `review.pathStep` "{angle} from {from} to {to} degrees". The review list gets a last group headed `review.exercises` with every draft exercise: its name, one line per phase built from the keys above (path entries joined with ", ", effort as the movements' English names joined with ", ", the angle word from `angle.<id>`), the draft mark with the row code and question, and its sources. `review.empty` shows only when there are no draft actions, attachments or exercises.

- [ ] **Step 1: Write the failing test**

```ts
test("a draft exercise is listed with its phases, row code and question", () => {
  render(<ReviewList bundle={makeMovementBundle("review")} t={t} onClose={() => {}} />);
  expect(screen.getByRole("heading", { name: "Exercises" })).toBeTruthy();
  expect(screen.getByText("Lifting: the hip bent from 60 to 0 degrees. Working: Hip extension")).toBeTruthy();
  expect(screen.getByText("Row code: bridge")).toBeTruthy();
  expect(screen.getByText("Question for the reviewer: Is the range right?")).toBeTruthy();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w apps/web -- review`
Expected: FAIL, heading not found.

- [ ] **Step 3: Implement** the group in `ReviewList.tsx`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w apps/web`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "List draft exercises in the review list"
```

---

### Task 8: End-to-end test, phone sheet and docs

**Files:**
- Create: `apps/web/e2e/movement.spec.ts`, `apps/web/e2e/data/exercises.yaml`, `docs/phase2/phone-measurements.md`
- Modify: `apps/web/e2e/data/actions/hip.yaml`, `apps/web/e2e/data/structures/hip.yaml`, `README.md`

**Interfaces:**
- Consumes: the built app from Tasks 1 to 7.
- Produces: the test data gains one checked row `e2e-gluteus-maximus-checked` (gluteus-maximus, hip-extension, working, primary, confidence high, the `e2e-source` citation, `checked_by: physio-1`, `checked_on: 2026-11-13`) and `exercises.yaml` with one checked exercise `e2e-squat` "Test squat" (regions hip, one phase `lowering` "Lowering", path hip.flexion 0 to 100, effort hip-extension, the `e2e-source` citation, `checked_by: physio-1`, `checked_on: 2026-11-13`).

- [ ] **Step 1: Write the failing test** `movement.spec.ts`, in the style of `atlas.spec.ts` and with the same request listener:

```ts
test("pick a movement and an exercise", async ({ page, baseURL }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: texts["mode.movement"] }).click();
  await page.getByRole("button", { name: "Hip external rotation" }).click();
  await expect(page.getByRole("heading", { name: texts["movement.group.primary"] })).toBeVisible();
  await expect(page.getByRole("button", { name: "Piriformis", exact: true })).toBeVisible();
  await page.getByRole("button", { name: texts["movement.back"] }).click();
  await page.getByRole("button", { name: "Test squat" }).click();
  await expect(page.getByText(texts["movement.effortNote"])).toBeVisible();
  await expect(page.getByRole("button", { name: "Gluteus maximus", exact: true })).toBeVisible();
  // the same host check as atlas.spec.ts
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run build && npm run e2e -w apps/web`
Expected: `movement.spec.ts` FAILS (no test exercise yet), `atlas.spec.ts` passes.

- [ ] **Step 3: Add the test data** and make the test pass. Check that `atlas.spec.ts` still sees exactly one layer peeled for piriformis.

- [ ] **Step 4: Run every check**

Run: `npm run validate && npm run check-models && npm test && npm run build:review -w apps/web && npm run build && npm run e2e -w apps/web && node scripts/check-no-drafts.mjs && node apps/web/scripts/perf-check.mjs && node apps/web/scripts/error-check.mjs`
Expected: all pass, the perf median stays under 5000 ms.

- [ ] **Step 5: Write `docs/phase2/phone-measurements.md`** in the form of `docs/phase1/phone-measurements.md` (same setup table, same time-to-interactive and rotating sections), with these new sections: "Movements tab" (pick Hip external rotation in the review build, move the slider from 0 to 90: does piriformis change group, does the model stutter while the slider moves, is any text cut off, can it all be done with one thumb), "Exercises" (left empty with a note that it is filled in once plan 2d has added exercises), "Hiding one side" (hide the left piriformis, is the right one still there), and "Questions for the physio" with this one: "Between two measured angles the app says nothing about a muscle, for example obturator externus between 60 and 75 degrees of hip flexion. Is that the right thing to show, or should the app carry the nearest measured role across the gap?".

- [ ] **Step 6: Update `README.md`.** Add a "Movements" bullet under "What it does today" (pick a hip or knee movement or an exercise, structures are coloured by role, a slider changes the joint angle, the model itself does not bend). Say that movement information shows only after review.

- [ ] **Step 7: Commit**

```bash
git add apps/web/e2e docs/phase2 README.md
git commit -m "Test the Movements tab end to end and add the Phase 2 phone sheet"
```

---

## Not in this plan

- Real exercise rows, more stretched and pinched rows and the iliacus and psoas depth question: plan 2d.
- Area lookup and the notebook: plans 2b and 2c.
- A bending model: on the ideas list.
