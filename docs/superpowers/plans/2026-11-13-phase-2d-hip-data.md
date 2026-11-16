# anatoMe Phase 2d Hip Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the owner tools to take in review results, then fill the hip knowledge base for Phase 2: stretched and pinched rows, exercises, the missing knee rows and the open depth questions, all drafted from sources that were opened and all left unchecked.

**Architecture:** Two small commands in the data pipeline (`mark-checked` and `data-report`) and two loose ends in the checks come first, test-driven. The rest is sourced data work in `data/`, each task ending with a valid knowledge base, a review build that shows the new rows as drafts, and a gap list for what no open source supports.

**Tech Stack:** Node 22, TypeScript, Vitest, Ajv, `yaml`. No new dependency. Tasks 3 to 6 need web access to read sources.

**Spec:** `docs/superpowers/specs/2026-11-02-anatome-design.md` (section 8, read all of it, and the Phase 2 row of section 9), `docs/superpowers/specs/2026-11-03-phase-1-hip-atlas-design.md` (sections 2, 4 and 7) and `docs/phase0/spike-report.md` (how source hunting went).

## Global Constraints

- Docs, YAML comments and code comments: plain language, no em dashes, no semicolons in prose.
- **Nothing from memory.** Every new row cites a source the author opened during the task. `locator` says where in the source. `says` holds what the source says there.
- `says_kind: quote` only when the source's licence fits CC BY 4.0 (CC BY in any version, CC0, public domain). Otherwise `says_kind: summary` in our own words. Never copy a table layout.
- Do not cite OpenStax Anatomy and Physiology directly (it carries a no-LLM clause). The CC BY 4.0 OERI Human Anatomy text on LibreTexts is fine.
- Every new row has `checked_by: null`. Nobody but the owner records a review, and only with the command from Task 1.
- A `when` range holds only angles the source measured or states. No rounding outwards, no filling of gaps between two measured angles.
- `confidence` follows the header comment of `data/actions/hip.yaml`: how well the sources support the action itself. Where the role (primary or secondary) is our own judgment, the row asks the physio in `review_note`.
- Load rules: ligaments, capsule, labrum, bursae and menisci are only ever stretched or pinched. Fascia is only ever stretched. The validator enforces this.
- New citations go into `data/citations.yaml` with `license` copied as the source states it and `access: open`.
- Nothing private in the repo: no reviewer names, no hostnames.
- Existing checks stay green after every task: `npm run validate`, `npm run check-models`, `npm test`, `npm run build`, `node scripts/check-no-drafts.mjs`, `npm run e2e -w apps/web`.
- The test-only data in `apps/web/e2e/data` and the fixtures are not real anatomy and are not touched by Tasks 3 to 6.

## Design decisions (builder's calls, the owner can overrule)

1. **`mark-checked` edits the YAML as text, line by line.** Parsing and re-writing the files with a YAML library would reflow the long quoted strings and lose the layout the owner reads.
2. **A review is recorded per row code.** The reviewer notes "ok", "change" or "remove" next to a row code in the review list. Only "ok" rows get marked. Changed rows are edited first and marked after the reviewer has seen the new wording.
3. **Gaps are written down.** `docs/phase2/data-gaps.md` lists every structure or exercise for which the opened sources did not support a row, with the sources that were tried. An honest gap beats a weak row.
4. **The quadriceps tendon and the patellar ligament stay unmodelled.** Neither mesh source has them. The existing gap line in the info panel stays.
5. **Six exercises are tried:** bodyweight squat, forward lunge, Romanian deadlift, glute bridge, side-lying hip abduction and clamshell. An exercise without an openable source for its joint angles is left out and listed as a gap.

## Review Focus

1. `mark-checked` with an id that does not exist, an id that is already checked, or an action row marked by `owner` must change no file at all. Test in Task 1.
2. `mark-checked` must leave every other byte of the file as it was: comments, blank lines, quoting and line ends. Test in Task 1.
3. A new row with a `when` wider than what its source states is the most likely data error. Each data task ends with a second read of every new `when` against its `says`. Steps in Tasks 3, 4 and 5.
4. A quote from a source whose licence is not compatible. Each data task ends with a look at every new `says_kind: quote` and its citation's `license`. Steps in Tasks 3, 4 and 5.
5. A stretched or pinched row keyed to the wrong direction (a ligament that tightens in extension filed under flexion). The review-build check at the end of Task 3 reads each new row as a sentence in the Movements tab.

---

## File Structure

```
pipeline/data/src/
├── markChecked.ts       # new: pure text edit that records a review (Task 1)
├── report.ts            # new: coverage of the knowledge base (Task 2)
├── checkModels.ts       # every structure has a mesh (Task 2)
└── cli.ts               # commands mark-checked and data-report (Tasks 1, 2)
package.json             # scripts mark-checked and data-report (Tasks 1, 2)
docs/review/how-to-record-a-review.md   # new (Task 1)
docs/phase2/data-gaps.md                # new (Task 3, extended by 4, 5, 6)
data/
├── actions/hip.yaml     # new rows (Tasks 3, 5)
├── exercises.yaml       # new (Task 4)
├── structures/hip.yaml  # depth changes (Task 6)
└── citations.yaml       # new sources (Tasks 3 to 6)
```

---

### Task 1: Recording a review with one command

**Files:**
- Create: `pipeline/data/src/markChecked.ts`, `docs/review/how-to-record-a-review.md`
- Modify: `pipeline/data/src/cli.ts`, `package.json`
- Test: `pipeline/data/test/markChecked.test.ts`

**Interfaces:**
- Consumes: `validateDataDir`.
- Produces:

```ts
// markChecked.ts
export type MarkResult = { text: string; marked: string[]; already: string[] };
// Marks the rows with these ids in one YAML file's text. Ids not in this file are ignored here.
export function markInText(text: string, ids: string[], by: string, on: string): MarkResult;

export type MarkRun = { ok: boolean; marked: string[]; already: string[]; missing: string[]; errors: string[] };
// Looks through actions/*.yaml, attachments/*.yaml and exercises.yaml in dataDir.
// Writes only when every id was found, none was already checked and the data still validates.
export function markChecked(dataDir: string, ids: string[], by: string, on: string): MarkRun;
```

  - A row starts at a line `- id: <id>` (at the start of the line) and runs to the line before the next `- id:` line or the end of the file.
  - Inside the row, the line that matches `^  checked_by: null\s*$` is replaced by `  checked_by: <by>` and a new line `  checked_on: <on>` right after it, with the line ending the file already uses (`\n` or `\r\n`).
  - A row whose `checked_by` is not null goes into `already` and is left alone.
  - `by` must match `^(owner|physio-[0-9]+)$` and `on` the date pattern of the schema. Otherwise `errors` says so and nothing is written.
  - `markChecked` first builds all new texts in memory. If any id is missing or already checked it writes nothing and returns `ok: false`. Otherwise it writes the files, runs `validateDataDir`, and when that fails it writes the old texts back and returns the validation messages in `errors`.
  - CLI: `tsx pipeline/data/src/cli.ts mark-checked <dataDir> --by <label> --on <date> [--from <file>] [id ...]`. `--from` reads ids from a text file, one per line, ignoring blank lines and lines starting with `#`. Root script: `"mark-checked": "tsx pipeline/data/src/cli.ts mark-checked data"`. Prints one line per id (`marked`, `already checked` or `not found`) and exits 1 unless `ok`.

- [ ] **Step 1: Write the failing tests**

```ts
const text = [
  "# header comment",
  "",
  "- id: row-a",
  "  structure: piriformis",
  '  says: "a long quoted line, with a comma"',
  "  checked_by: null",
  "",
  "- id: row-b",
  "  checked_by: null",
  "  review_note: Check the angle",
  "",
].join("\n");

test("marks one row and adds the date under it", () => {
  const out = markInText(text, ["row-a"], "physio-1", "2026-11-20");
  expect(out.marked).toEqual(["row-a"]);
  expect(out.text).toContain("  checked_by: physio-1\n  checked_on: 2026-11-20\n\n- id: row-b\n  checked_by: null");
});
test("leaves every other line untouched", () => {
  const out = markInText(text, ["row-b"], "physio-1", "2026-11-20").text.split("\n");
  const before = text.split("\n");
  expect(out.filter((l) => !l.includes("checked_"))).toEqual(before.filter((l) => !l.includes("checked_")));
});
test("keeps Windows line ends", () =>
  expect(markInText(text.replaceAll("\n", "\r\n"), ["row-a"], "owner", "2026-11-20").text).toContain("  checked_by: owner\r\n  checked_on: 2026-11-20\r\n"));
test("a row that is checked already is reported and left alone", () => {
  const once = markInText(text, ["row-a"], "physio-1", "2026-11-20").text;
  const twice = markInText(once, ["row-a"], "physio-2", "2026-12-01");
  expect(twice.already).toEqual(["row-a"]);
  expect(twice.text).toBe(once);
});
test("an id that is the start of another id does not match it", ...rows "row-a" and "row-ab": marking "row-a" leaves "row-ab" null);

// markChecked, on a copy of pipeline/data/test/fixtures/valid in a temp folder
test("a missing id changes no file", ...ids ["<a real unchecked id>", "no-such-row"]: ok false, missing ["no-such-row"], files byte-equal to before);
test("an action row marked by the owner is refused and the files are restored", ...ok false, errors contain "action rows can only be checked by a physio", files byte-equal to before);
test("an attachment row can be marked by the owner", ...ok true, validateDataDir ok);
test("a bad label or date is refused", ...by "Dr Smith" gives ok false and no write);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w pipeline/data -- markChecked`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement** `markChecked.ts` and the command.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w pipeline/data`
Expected: PASS.

- [ ] **Step 5: Write `docs/review/how-to-record-a-review.md`.** Sections: "What the reviewer does" (go through the review list in the review build, write each row code with ok, change or remove), "What the owner does" (put the ok codes in a text file, run `npm run mark-checked -- --by physio-1 --on <date> --from <file>`, edit changed rows by hand and show them again before marking, delete removed rows and note why in the commit message), "Who may check what" (action and exercise rows need a physio label, attachment rows may be `owner`), "After marking" (run `npm run validate`, `npm run build` and `node scripts/check-no-drafts.mjs`, open the normal build and read the rows that are now public), and "Labels, not names" (the label `physio-1` stands for the first reviewer, real names never go into the repo without consent).

- [ ] **Step 6: Commit**

```bash
git add pipeline/data package.json docs/review
git commit -m "Add the mark-checked command and the guide for recording a review"
```

---

### Task 2: Coverage report and two loose ends in the checks

**Files:**
- Create: `pipeline/data/src/report.ts`, one fixture folder each for `labrum-working` and `joint-in-actions` under `pipeline/data/test/fixtures/`, one Draco-compressed test glb written by the test setup
- Modify: `pipeline/data/src/cli.ts`, `pipeline/data/src/checkModels.ts`, `package.json`, `docs/phase0/phase1-follow-ups.md`
- Test: `pipeline/data/test/report.test.ts`, `pipeline/data/test/validate.test.ts`, `pipeline/data/test/checkModels.test.ts`

**Interfaces:**
- Produces:

```ts
// report.ts
export type StructureCoverage = {
  id: string; type: string; english: string;
  actions: { movement: string; load: string; checked: boolean }[];
  origins: number; insertions: number;       // attachment rows, muscles only
};
export type Coverage = { structures: StructureCoverage[]; totals: { actions: number; actionsChecked: number; attachments: number; attachmentsChecked: number; exercises: number; exercisesChecked: number } };
export function coverage(dataDir: string, region: string): Coverage;
export function formatReport(c: Coverage): string;   // Markdown
```

  - `formatReport` writes a totals line, then four lists: "Muscles with no action row", "Muscles without an origin or without an insertion row", "Ligaments, capsule, labrum, bursae, menisci and fascia with no action row", and a table of every structure with its rows as `movement (load, checked or waiting)`.
  - CLI: `data-report <dataDir> <region>`. Root script: `"data-report": "tsx pipeline/data/src/cli.ts data-report data hip"`.
  - `checkModelMapping` gains the error `structure <id> has no mesh in any file` for a structure in the data that no mesh carries. Write the test first. If it passes without a code change, the check exists already: keep the test and change nothing.
  - Two validator fixtures: a labrum with `load: working` and a structure of type `joint` in an action row. Both must fail with the existing messages.
  - One model check test runs on a Draco-compressed glb (make it in the test with `@gltf-transform/extensions` and `draco3dgltf`, both installed already).

- [ ] **Step 1: Write the failing tests**

```ts
// report.test.ts, on the valid fixture
test("counts checked and waiting rows", ...totals match the fixture's rows);
test("a muscle with no action row is listed", ...formatReport contains the heading "Muscles with no action row" followed by that muscle's English name);
test("a muscle with only an origin row is listed as incomplete", ...);

// validate.test.ts
test("a labrum cannot work", ...message "load must be stretched or pinched for type labrum");
test("a joint cannot appear in actions", ...message "type joint cannot appear in actions");

// checkModels.test.ts
test("a structure that no mesh carries is an error", ...message contains "has no mesh in any file");
test("the model check reads a Draco-compressed file", ...ok true);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -w pipeline/data`
Expected: the report tests FAIL (module not found). Note which of the other four pass already.

- [ ] **Step 3: Implement** what the failing tests need.

- [ ] **Step 4: Run the report on the real data**

Run: `npm test -w pipeline/data && npm run check-models && npm run data-report`
Expected: tests pass, `check-models` passes, and the report prints. Keep the output, Tasks 3 and 5 start from it.

- [ ] **Step 5: Mark the follow-ups done** in `docs/phase0/phase1-follow-ups.md` ("Labrum and joint still have no fixture", "Check structures in the reverse direction too", "Add one Draco fixture"), in the style of the done lines there.

- [ ] **Step 6: Commit**

```bash
git add pipeline/data package.json docs/phase0/phase1-follow-ups.md
git commit -m "Add the data coverage report and close three loose ends in the checks"
```

---

### How to write a row (for Tasks 3 to 6)

Follow these steps for every row. They are the same steps Phase 0 and Phase 1 used.

1. Find a source you can open in full. Good places: PubMed Central (open-access subset), the OERI Human Anatomy text on LibreTexts, open-access journals. A paywalled abstract is not enough.
2. Read the licence on the page itself. Copy it into the citation's `license` as stated.
3. Find the sentence, table row or figure that supports the claim. Write its place into `locator` so that another person finds it in under a minute.
4. Write `says`: the source's own words for a compatible licence (`quote`), else one or two sentences of our own (`summary`).
5. Write the row. Take angles for `when` only from what the source states. Set `confidence` by the header rule in `data/actions/hip.yaml`.
6. Where anything is our own judgment (the role, the direction a stretch is filed under, an angle read off a figure), say so in `review_note` as a question the physio can answer.
7. Leave `checked_by: null`.
8. Run `npm run validate` after every few rows.

If two opened sources disagree, write the row with the better supported reading, cite both, set `confidence: low` and put the disagreement into `review_note`.

---

### Task 3: Stretched and pinched rows for the hip

**Files:**
- Create: `docs/phase2/data-gaps.md`
- Modify: `data/actions/hip.yaml`, `data/citations.yaml`

**Interfaces:**
- Produces: new action rows with `load: stretched` or `load: pinched`, ids in the form `<structure>-<movement>-<load>` (for example `iliofemoral-ligament-hip-extension-stretched`). `docs/phase2/data-gaps.md` with one section per data task and one line per gap: the structure, what was looked for, the sources opened, why they did not support a row.

Targets. For each one the task ends with at least one new row or a line in the gap file:

| Structure | What to look for |
| --- | --- |
| `iliofemoral-ligament`, `pubofemoral-ligament`, `ischiofemoral-ligament` | Which hip movements tighten each one, and at which angles if stated |
| `hip-joint-capsule` | Movements that tighten or twist the capsule |
| `ligament-of-head-of-femur` | Movements that tension it |
| `acetabular-labrum` | Further pinching or stretching positions beyond the existing row |
| `iliotibial-tract` | Movements that stretch it |
| `trochanteric-bursa`, `iliopectineal-bursa`, `ischial-bursa` | Positions in which the bursa is compressed |
| Hamstrings (`biceps-femoris-long-head`, `semitendinosus`, `semimembranosus`) | Stretch in hip flexion, and the knee angle if stated |
| `rectus-femoris`, `iliacus`, `psoas-major` | Stretch in hip extension |
| `piriformis` and the other deep rotators | Stretch positions, with the hip flexion angle if stated |
| Adductors (`adductor-longus`, `adductor-brevis`, `adductor-magnus`, `gracilis`, `pectineus`) | Stretch in hip abduction |

- [ ] **Step 1: List what exists.** Run `npm run data-report` and note the stretched and pinched rows that are there already (four on 2026-11-13).

- [ ] **Step 2: Work through the table**, one structure group at a time, with the steps in "How to write a row". Commit after each group:

```bash
git add data docs/phase2/data-gaps.md
git commit -m "Add stretched and pinched rows for <group>"
```

- [ ] **Step 3: Second read.** For every row added in this task, open its source once more and check three things: the `when` range is no wider than the source states, the row is filed under the movement that actually loads the structure (not its opposite), and every `quote` comes from a source with a compatible licence. Fix what is off.

- [ ] **Step 4: Run every check**

Run: `npm run validate && npm test && npm run build:review -w apps/web && npm run build && node scripts/check-no-drafts.mjs`
Expected: all pass. The normal bundle holds none of the new rows.

- [ ] **Step 5: Read the rows in the app.** Open the review build. If plan 2a is merged, pick each hip movement in the Movements tab and read the "Stretched" and "Pinched" groups as sentences. Otherwise read them in the review list. A sentence that sounds wrong to a careful reader gets a `review_note` or is fixed.

- [ ] **Step 6: Commit** whatever Steps 3 to 5 changed.

```bash
git add data docs/phase2/data-gaps.md
git commit -m "Second read of the stretched and pinched rows"
```

---

### Task 4: Exercises

Needs plan 2a Task 3 (the exercise schema and validator) to be merged.

**Files:**
- Create: `data/exercises.yaml`
- Modify: `data/citations.yaml`, `docs/phase2/data-gaps.md`

**Interfaces:**
- Consumes: the exercise row shape and rules from plan 2a Task 3.
- Produces: `data/exercises.yaml` with a header comment in the style of the other data files (what the file is, when it was drafted, that every row waits for a physio, what `path` and `effort` mean), and one row per exercise that has sources. All rows have `regions: [hip]` and `checked_by: null`.

For each of the six exercises in design decision 5:

- [ ] **Step 1: Find the joint angles.** Look for an open-access source that reports hip and knee angles through the exercise (a kinematics study, or a text that states the ranges). `path` takes `from` and `to` per angle from that source, per phase. Angles follow `data/joints.yaml`: zero is standing upright, positive is the direction named `positive`. If the source uses another zero or sign, convert and say so in the citation's `says`.

- [ ] **Step 2: Find the effort.** Look for a source that says which muscle groups produce or control each phase (for example hip extensors working while lengthening on the way down in a squat). `effort` lists the movements those muscles produce or resist, not the direction the joint travels.

- [ ] **Step 3: Write the row** with one phase per distinct part of the exercise (for example `lowering` and `rising`), plain English phase names, both sources cited, and a `review_note` that asks the physio to confirm the ranges and the effort. If no opened source gives angles, leave the exercise out and add a line to the "Exercises" section of `docs/phase2/data-gaps.md`.

- [ ] **Step 4: Validate**

Run: `npm run validate`
Expected: `data in data is valid`.

After all six:

- [ ] **Step 5: Second read.** For every phase, check `effort` once more against its source with this question: "Would lighting the muscles of these movements be right for this phase?". Check that each `from` and `to` is a number the source states.

- [ ] **Step 6: Run every check and look at it**

Run: `npm run validate && npm test && npm run build:review -w apps/web && npm run build && node scripts/check-no-drafts.mjs && npm run e2e -w apps/web`
Expected: all pass, the normal build log says `0 exercises`. In the review build, pick each exercise in the Movements tab, move the progress slider through each phase and read what lights up.

- [ ] **Step 7: Fill in the "Exercises" section** of `docs/phase2/phone-measurements.md` with one check per exercise that was added ("does the list change in a sensible way as the slider moves").

- [ ] **Step 8: Commit**

```bash
git add data docs/phase2
git commit -m "Add the first exercises as draft rows for the physio"
```

---

### Task 5: Knee rows for the thigh muscles

**Files:**
- Modify: `data/actions/hip.yaml`, `data/citations.yaml`, `docs/phase2/data-gaps.md`

**Interfaces:**
- Produces: working rows for `knee-flexion` or `knee-extension` so that each of these muscles has at least one knee row or a gap line: `rectus-femoris`, `vastus-lateralis`, `vastus-medialis`, `vastus-intermedius`, `sartorius`, `gracilis`, `biceps-femoris-long-head`, `biceps-femoris-short-head`, `semitendinosus`, `semimembranosus`. Ids in the existing form `<structure>-<movement>`.

- [ ] **Step 1: List what exists.** Run `npm run data-report` and mark which of the ten muscles already have a knee row (ten knee rows existed on 2026-11-13).

- [ ] **Step 2: Fill the gaps** with the steps in "How to write a row". The OERI Human Anatomy tables for the thigh muscles are the first place to look.

- [ ] **Step 3: Second read** of each new row as in Task 3 Step 3.

- [ ] **Step 4: Run every check**

Run: `npm run validate && npm test && npm run build:review -w apps/web && npm run build && node scripts/check-no-drafts.mjs`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add data docs/phase2/data-gaps.md
git commit -m "Add the missing knee rows for the thigh muscles"
```

---

### Task 6: Open depth questions and the gap list

**Files:**
- Modify: `data/structures/hip.yaml`, `docs/phase2/data-gaps.md`, `docs/phase0/phase1-follow-ups.md`

**Interfaces:**
- Produces: a sourced decision on the depth of `iliacus` and `psoas-major`, and a "Not modelled" section in the gap file.

- [ ] **Step 1: Read about the layers at the front of the hip.** Open a source that describes what covers iliacus and psoas major below the inguinal ligament (sartorius, rectus femoris and the femoral vessels lie in front of them there). Decide between depth 1 (as now) and depth 2.

- [ ] **Step 2: Apply the decision.** If depth 2 fits the source better, change both `depth` values and rewrite both `depth_note` lines with the source and the date read. If depth 1 stays, extend the `depth_note` with the reason. Either way mark the follow-up "Iliacus and psoas major are at depth 1" as done in `docs/phase0/phase1-follow-ups.md` with one sentence on the outcome.

- [ ] **Step 3: Write the "Not modelled" section** of `docs/phase2/data-gaps.md`: the quadriceps tendon and patellar ligament (no mesh in either source, drawing them by hand was ruled out in Phase 0), psoas minor (no mesh), the origin of psoas major on the spine (the vertebrae belong to a later region).

- [ ] **Step 4: Run every check**

Run: `npm run validate && npm run check-models && npm test && npm run build && npm run e2e -w apps/web`
Expected: all pass. The end-to-end test uses its own data, so a depth change here does not move its "1 layer peeled" line.

- [ ] **Step 5: Commit**

```bash
git add data docs
git commit -m "Settle the depth of iliacus and psoas major and write down what is not modelled"
```
